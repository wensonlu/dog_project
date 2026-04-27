// backend/controllers/chatController.js

const { getSupabaseClient } = require('../utils/supabaseClient');
const { searchContext, constructSystemPrompt, formatReferences } = require('../utils/chatUtils');
const { streamText } = require('ai');
const { anthropic } = require('@ai-sdk/anthropic');

/**
 * 创建新的聊天会话
 */
async function createSession(req, res) {
  try {
    const { user_id } = req.body;
    const supabase = getSupabaseClient(req);

    const { data, error } = await supabase
      .from('chat_sessions')
      .insert([{ user_id: user_id || null }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      session_id: data.id,
      messages: []
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * 发送消息并获取AI回复（流式）
 */
async function sendMessage(req, res) {
  try {
    const { session_id, content, user_id } = req.body;

    if (!session_id || !content) {
      return res.status(400).json({ error: 'Missing session_id or content' });
    }

    if (content.trim().length > 500) {
      return res.status(400).json({ error: 'Message too long (max 500 chars)' });
    }

    const supabase = getSupabaseClient(req);

    // 1. 验证会话存在
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('id, user_id')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // 2. 保存用户消息
    const { data: userMessage, error: userMsgError } = await supabase
      .from('chat_messages')
      .insert([{
        session_id,
        role: 'user',
        content
      }])
      .select()
      .single();

    if (userMsgError) throw userMsgError;

    // 3. 搜索相关上下文
    const context = await searchContext(content, req);

    // 4. 构造系统提示词
    const systemPrompt = constructSystemPrompt(context);

    // 5. 获取对话历史（仅保留最近10条）
    const { data: history } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', session_id)
      .order('created_at', { ascending: true })
      .limit(10);

    // 6. 调用Claude API（流式）
    const messages = [
      ...(history || []).map(m => ({ role: m.role, content: m.content }))
    ];

    const stream = await streamText({
      model: 'claude-3-5-sonnet-20241022',
      system: systemPrompt,
      messages: messages
    });

    let fullText = '';
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // 流式返回
    for await (const chunk of stream.textStream) {
      fullText += chunk;
      res.write(JSON.stringify({
        type: 'text_delta',
        text: chunk
      }) + '\n');
    }

    // 获取引用资源
    const references = formatReferences(context);

    // 7. 保存助手回复
    const { data: assistantMessage, error: assistantMsgError } = await supabase
      .from('chat_messages')
      .insert([{
        session_id,
        role: 'assistant',
        content: fullText,
        referenced_articles: references.referenced_articles,
        referenced_dogs: references.referenced_dogs,
        referenced_stories: references.referenced_stories
      }])
      .select()
      .single();

    if (assistantMsgError) {
      console.error('Save assistant message error:', assistantMsgError);
    }

    // 8. 返回完整消息对象
    res.write(JSON.stringify({
      type: 'message_stop',
      message: assistantMessage || {
        id: 'error',
        content: fullText,
        ...references
      }
    }) + '\n');

    res.end();
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * 获取会话历史
 */
async function getSessionHistory(req, res) {
  try {
    const { session_id } = req.params;
    const supabase = getSupabaseClient(req);

    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('id, user_id')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // 已登录用户只能查看自己的会话
    const authUserId = req.user?.id;
    if (session.user_id && authUserId && session.user_id !== authUserId) {
      return res.status(403).json({ error: 'Cannot access other user\'s session' });
    }

    const { data: messages, error: messagesError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', session_id)
      .order('created_at', { ascending: true });

    if (messagesError) throw messagesError;

    res.json({
      session_id,
      user_id: session.user_id,
      messages: messages || []
    });
  } catch (error) {
    console.error('Get session history error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * 删除会话
 */
async function deleteSession(req, res) {
  try {
    const { session_id } = req.params;
    const supabase = getSupabaseClient(req);

    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('user_id')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // 只有会话所有者能删除
    const authUserId = req.user?.id;
    if (session.user_id && authUserId && session.user_id !== authUserId) {
      return res.status(403).json({ error: 'Cannot delete other user\'s session' });
    }

    const { error: deleteError } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', session_id);

    if (deleteError) throw deleteError;

    res.status(204).send();
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  createSession,
  sendMessage,
  getSessionHistory,
  deleteSession
};
