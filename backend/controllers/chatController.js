// backend/controllers/chatController.js

const { getSupabaseClient } = require('../utils/supabaseClient');
const { searchContext, constructSystemPrompt, formatReferences } = require('../utils/chatUtils');
const { streamText } = require('ai');
const { createAnthropic } = require('@ai-sdk/anthropic');

function canAccessSession(sessionUserId, authUserId) {
  if (!sessionUserId) return true;
  return !!authUserId && sessionUserId === authUserId;
}

function writeSSE(res, payload) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function getAiRuntime() {
  const baseURL = process.env.AI_BASE_URL;
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL;

  if (!baseURL || !apiKey || !model) {
    throw new Error('AI config missing: require AI_BASE_URL, AI_API_KEY, AI_MODEL');
  }

  const anthropic = createAnthropic({
    baseURL: baseURL.replace(/\/+$/, ''),
    apiKey
  });

  return {
    model: anthropic(model)
  };
}

async function generateAssistantReply({
  supabase,
  req,
  res,
  sessionId,
  content,
  saveUserMessage
}) {
  if (saveUserMessage) {
    const { error: userMsgError } = await supabase
      .from('chat_messages')
      .insert([{
        session_id: sessionId,
        role: 'user',
        content
      }]);

    if (userMsgError) throw userMsgError;
  }

  const context = await searchContext(content, req);
  const systemPrompt = constructSystemPrompt(context);

  // 取最近10条历史，再反转成时间正序，避免拿到最早10条
  const { data: history } = await supabase
    .from('chat_messages')
    .select('role, content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(10);

  const messages = [...(history || [])]
    .reverse()
    .map(m => ({ role: m.role, content: m.content }));

  const { model } = getAiRuntime();
  const stream = await streamText({
    model,
    system: systemPrompt,
    messages
  });

  let fullText = '';
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  for await (const chunk of stream.textStream) {
    fullText += chunk;
    writeSSE(res, {
      type: 'text_delta',
      text: chunk
    });
  }

  const references = formatReferences(context);
  const { data: assistantMessage, error: assistantMsgError } = await supabase
    .from('chat_messages')
    .insert([{
      session_id: sessionId,
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

  writeSSE(res, {
    type: 'message_stop',
    message: assistantMessage || {
      id: 'error',
      content: fullText,
      ...references
    }
  });
}

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
  let streamStarted = false;
  try {
    const { session_id, content } = req.body;

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

    // 已登录会话不允许未登录或其他用户访问
    const authUserId = req.user?.id;
    if (!canAccessSession(session.user_id, authUserId)) {
      return res.status(403).json({ error: 'Cannot access other user\'s session' });
    }

    await generateAssistantReply({
      supabase,
      req,
      res,
      sessionId: session_id,
      content,
      saveUserMessage: true
    });
    streamStarted = true;
    res.end();
  } catch (error) {
    console.error('Send message error:', error);
    if (streamStarted || res.headersSent) {
      writeSSE(res, { type: 'error', error: error.message || 'Internal server error' });
      return res.end();
    }
    res.status(500).json({ error: error.message });
  }
}

/**
 * 基于上一条用户消息重新生成回复
 */
async function regenerateMessage(req, res) {
  let streamStarted = false;
  try {
    const { session_id } = req.body;
    if (!session_id) {
      return res.status(400).json({ error: 'Missing session_id' });
    }

    const supabase = getSupabaseClient(req);
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('id, user_id')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const authUserId = req.user?.id;
    if (!canAccessSession(session.user_id, authUserId)) {
      return res.status(403).json({ error: 'Cannot access other user\'s session' });
    }

    const { data: lastUserMessage, error: lastUserMessageError } = await supabase
      .from('chat_messages')
      .select('content')
      .eq('session_id', session_id)
      .eq('role', 'user')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (lastUserMessageError || !lastUserMessage?.content) {
      return res.status(400).json({ error: 'No user message to regenerate' });
    }

    await generateAssistantReply({
      supabase,
      req,
      res,
      sessionId: session_id,
      content: lastUserMessage.content,
      saveUserMessage: false
    });
    streamStarted = true;
    res.end();
  } catch (error) {
    console.error('Regenerate message error:', error);
    if (streamStarted || res.headersSent) {
      writeSSE(res, { type: 'error', error: error.message || 'Internal server error' });
      return res.end();
    }
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
    if (!canAccessSession(session.user_id, authUserId)) {
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
    if (!canAccessSession(session.user_id, authUserId)) {
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
  regenerateMessage,
  getSessionHistory,
  deleteSession
};
