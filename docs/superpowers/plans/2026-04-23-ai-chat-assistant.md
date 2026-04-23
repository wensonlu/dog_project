# AI 聊天助手实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为宠物领养平台实现AI聊天助手，支持基于Wiki+宠物+故事的智能问答和推荐。

**Architecture:** 后端通过全文搜索收集上下文 → 构造Prompt → 流式调用Claude → 前端浮窗实时显示。已登录用户保存会话历史，未登录用户临时内存存储。

**Tech Stack:** 
- 后端：Express.js + Supabase + Vercel AI SDK (流式响应)
- 前端：React + Framer Motion (动画) + localStorage (会话管理)
- 数据库：PostgreSQL (chat_sessions + chat_messages 表)

---

## 文件结构规划

### 后端新增/修改

```
backend/
├── controllers/
│   └── chatController.js          (新建)
├── routes/
│   └── chat.js                    (新建)
├── utils/
│   └── chatUtils.js               (新建)
├── migrations/
│   └── add_chat_tables.sql        (新建)
└── index.js                       (修改：注册/chat路由)
```

### 前端新增/修改

```
frontend/src/
├── components/
│   ├── ChatAssistant.jsx          (新建 - 浮窗主组件)
│   ├── ChatMessage.jsx            (新建 - 单条消息)
│   ├── ChatReferenceCard.jsx      (新建 - 推荐卡片)
│   └── BottomNav.jsx              (修改：调整Z层级)
├── hooks/
│   ├── useChat.js                 (新建 - 消息发送逻辑)
│   └── useChatSession.js          (新建 - 会话管理)
├── styles/
│   └── ChatAssistant.css          (新建)
├── App.jsx                        (修改：集成ChatAssistant)
└── config/
    └── api.js                     (修改：添加chat端点常量)
```

---

# Phase 1: 数据库和后端API (2天)

## Task 1: 数据库迁移 SQL

**Files:**
- Create: `backend/migrations/add_chat_tables.sql`

- [ ] **Step 1: 创建迁移SQL文件**

```sql
-- 创建 chat_sessions 表
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NULLABLE REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 创建索引提高查询性能
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON chat_sessions(created_at DESC);

-- 创建 chat_messages 表
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  referenced_articles JSONB,  -- [{ id, title, slug }]
  referenced_dogs JSONB,      -- [{ id, name, breed }]
  referenced_stories JSONB,   -- [{ id, title }]
  created_at TIMESTAMP DEFAULT now()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_role ON chat_messages(role);

-- 为分析添加索引
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_stats 
  ON chat_messages USING btree (session_id) 
  WHERE role = 'user';
```

- [ ] **Step 2: 在Supabase执行迁移**

在Supabase Dashboard的SQL Editor中运行上述SQL，确认所有表和索引创建成功。

**验证：**
```sql
-- 检查表是否存在
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'chat_%';

-- 应该返回两行：chat_sessions, chat_messages
```

- [ ] **Step 3: 提交**

```bash
git add backend/migrations/add_chat_tables.sql
git commit -m "feat: add chat_sessions and chat_messages tables migration"
```

---

## Task 2: 创建聊天工具函数 (搜索 + Prompt构造)

**Files:**
- Create: `backend/utils/chatUtils.js`

- [ ] **Step 1: 创建文件和搜索逻辑**

```javascript
// backend/utils/chatUtils.js

const { getSupabaseClient } = require('./supabaseClient');

/**
 * 搜索相关上下文（Wiki文章 + 宠物 + 故事）
 * @param {string} userMessage - 用户输入的问题
 * @param {Object} req - Express请求对象
 * @returns {Promise<Object>} - { articles, dogs, stories }
 */
async function searchContext(userMessage, req) {
  try {
    const supabase = getSupabaseClient(req);

    // 1. 搜索 Wiki 文章 (3条)
    const { data: articles, error: articlesError } = await supabase
      .from('wiki_articles')
      .select('id, title, summary, slug, content')
      .eq('is_published', true)
      .textSearch('fts', userMessage)  // fts是全文搜索字段
      .limit(3);

    if (articlesError) {
      console.error('Search articles error:', articlesError);
    }

    // 2. 搜索宠物数据 (2条)
    const { data: dogs, error: dogsError } = await supabase
      .from('dogs')
      .select('id, name, breed, description, age, temperament')
      .or(`breed.ilike.%${userMessage}%,temperament.ilike.%${userMessage}%,description.ilike.%${userMessage}%`)
      .limit(2);

    if (dogsError) {
      console.error('Search dogs error:', dogsError);
    }

    // 3. 搜索故事案例 (2条)
    const { data: stories, error: storiesError } = await supabase
      .from('stories')
      .select('id, title, content')
      .eq('is_published', true)
      .or(`title.ilike.%${userMessage}%,content.ilike.%${userMessage}%`)
      .limit(2);

    if (storiesError) {
      console.error('Search stories error:', storiesError);
    }

    return {
      articles: articles || [],
      dogs: dogs || [],
      stories: stories || []
    };
  } catch (error) {
    console.error('Search context error:', error);
    return { articles: [], dogs: [], stories: [] };
  }
}

/**
 * 构造系统提示词
 * @param {Object} context - { articles, dogs, stories }
 * @returns {string} - 系统提示词
 */
function constructSystemPrompt(context) {
  const { articles, dogs, stories } = context;

  let prompt = `你是宠物领养平台的智能助手。你的职责是：
1. 基于平台数据准确回答关于宠物品种、养护、疾病的问题
2. 指导用户完成领养申请流程
3. 推荐相关资源帮助用户做出决策

【平台相关信息】

`;

  if (articles.length > 0) {
    prompt += `相关Wiki文章：\n`;
    articles.forEach((article, i) => {
      prompt += `${i + 1}. "${article.title}": ${article.summary}\n`;
    });
    prompt += '\n';
  }

  if (dogs.length > 0) {
    prompt += `平台相似宠物：\n`;
    dogs.forEach((dog, i) => {
      prompt += `${i + 1}. ${dog.name}(${dog.breed}, ${dog.age}岁): ${dog.temperament || dog.description}\n`;
    });
    prompt += '\n';
  }

  if (stories.length > 0) {
    prompt += `成功案例：\n`;
    stories.forEach((story, i) => {
      const excerpt = story.content.slice(0, 100).replace(/\n/g, ' ');
      prompt += `${i + 1}. ${story.title}: ${excerpt}...\n`;
    });
    prompt += '\n';
  }

  prompt += `【回答规则】
- 用友好、专业的语气回答
- 优先基于平台数据回答，如果平台无相关数据则基于通用知识回答
- 鼓励用户探索推荐的资源
- 对于领养流程问题，提供清晰的步骤指导
- 回答简洁，避免超过300字`;

  return prompt;
}

/**
 * 格式化引用资源为JSONB
 * @param {Object} context - { articles, dogs, stories }
 * @returns {Object} - { referenced_articles, referenced_dogs, referenced_stories }
 */
function formatReferences(context) {
  const { articles, dogs, stories } = context;

  return {
    referenced_articles: articles.map(a => ({ id: a.id, title: a.title, slug: a.slug })) || null,
    referenced_dogs: dogs.map(d => ({ id: d.id, name: d.name, breed: d.breed })) || null,
    referenced_stories: stories.map(s => ({ id: s.id, title: s.title })) || null
  };
}

module.exports = {
  searchContext,
  constructSystemPrompt,
  formatReferences
};
```

- [ ] **Step 2: 提交**

```bash
git add backend/utils/chatUtils.js
git commit -m "feat: add chat utilities for search and prompt construction"
```

---

## Task 3: 创建聊天控制器

**Files:**
- Create: `backend/controllers/chatController.js`

- [ ] **Step 1: 创建基础控制器框架**

```javascript
// backend/controllers/chatController.js

const { getSupabaseClient } = require('../utils/supabaseClient');
const { searchContext, constructSystemPrompt, formatReferences } = require('../utils/chatUtils');
const { streamText } = require('ai');

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
```

- [ ] **Step 2: 提交**

```bash
git add backend/controllers/chatController.js
git commit -m "feat: add chat controller with session and message logic"
```

---

## Task 4: 创建聊天路由

**Files:**
- Create: `backend/routes/chat.js`
- Modify: `backend/index.js` (添加路由注册)

- [ ] **Step 1: 创建路由文件**

```javascript
// backend/routes/chat.js

const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const checkSupabase = require('../middleware/supabaseCheck');

// 公开路由
router.post('/sessions', checkSupabase, chatController.createSession);
router.post('/messages', checkSupabase, chatController.sendMessage);
router.get('/sessions/:session_id', checkSupabase, chatController.getSessionHistory);

// 需要认证的路由
router.delete('/sessions/:session_id', checkSupabase, chatController.deleteSession);

module.exports = router;
```

- [ ] **Step 2: 在index.js中注册路由**

在 `backend/index.js` 的路由部分添加（通常在其他路由之后）：

```javascript
// 在现有路由注册之后添加
const chatRoutes = require('./routes/chat');
app.use('/api/chat', chatRoutes);
```

查找现有路由注册的位置（如 `app.use('/api/dogs', dogRoutes)`），在其附近添加这一行。

- [ ] **Step 3: 测试路由存在**

```bash
# 启动后端
cd backend && npm run dev

# 在另一个终端测试（应该返回错误，但至少路由被识别）
curl -X POST http://localhost:5001/api/chat/sessions \
  -H "Content-Type: application/json" \
  -d '{}' 

# 预期：如果路由正常，会得到一个JSON响应（可能是错误）
```

- [ ] **Step 4: 提交**

```bash
git add backend/routes/chat.js backend/index.js
git commit -m "feat: add chat routes and register with Express app"
```

---

## Task 5: 添加必要的API常量 (前端)

**Files:**
- Modify: `frontend/src/config/api.js` 或创建新的常量文件

- [ ] **Step 1: 检查现有config文件**

首先检查 `frontend/src/config/api.js` 或 `frontend/src/config.js` 是否存在：

```bash
ls -la frontend/src/config/
```

- [ ] **Step 2: 添加聊天端点常量**

如果文件存在，打开并添加：

```javascript
// 在现有 API_BASE_URL 附近添加

export const CHAT_API = {
  CREATE_SESSION: `${API_BASE_URL}/chat/sessions`,
  SEND_MESSAGE: `${API_BASE_URL}/chat/messages`,
  GET_SESSION: (sessionId) => `${API_BASE_URL}/chat/sessions/${sessionId}`,
  DELETE_SESSION: (sessionId) => `${API_BASE_URL}/chat/sessions/${sessionId}`
};
```

如果文件不存在，创建它：

```javascript
// frontend/src/config/index.js

export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';

export const CHAT_API = {
  CREATE_SESSION: `${API_BASE_URL}/chat/sessions`,
  SEND_MESSAGE: `${API_BASE_URL}/chat/messages`,
  GET_SESSION: (sessionId) => `${API_BASE_URL}/chat/sessions/${sessionId}`,
  DELETE_SESSION: (sessionId) => `${API_BASE_URL}/chat/sessions/${sessionId}`
};
```

- [ ] **Step 3: 提交**

```bash
git add frontend/src/config/ 
git commit -m "feat: add chat API endpoints to config"
```

---

# Phase 2: 前端浮窗和消息展示 (1.5天)

## Task 6: 创建消息组件

**Files:**
- Create: `frontend/src/components/ChatMessage.jsx`
- Create: `frontend/src/components/ChatReferenceCard.jsx`

- [ ] **Step 1: 创建ChatMessage组件**

```javascript
// frontend/src/components/ChatMessage.jsx

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function ChatMessage({ message, isUser }) {
  const [displayText, setDisplayText] = useState('');
  const [isAnimating, setIsAnimating] = useState(!isUser);

  // 流式打字动画（仅用于助手消息）
  useEffect(() => {
    if (!isAnimating) {
      setDisplayText(message.content);
      return;
    }

    let index = 0;
    const interval = setInterval(() => {
      if (index < message.content.length) {
        setDisplayText(message.content.slice(0, index + 2));
        index += 2;
      } else {
        setIsAnimating(false);
        clearInterval(interval);
      }
    }, 10);

    return () => clearInterval(interval);
  }, [message.content, isAnimating]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex mb-3 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
          isUser
            ? 'bg-rose-500 text-white rounded-br-none'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none'
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{displayText}</p>
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 2: 创建ChatReferenceCard组件**

```javascript
// frontend/src/components/ChatReferenceCard.jsx

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function ChatReferenceCard({ type, item }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (type === 'article') {
      navigate(`/wiki/article/${item.slug}`);
    } else if (type === 'dog') {
      navigate(`/pet/${item.id}`);
    } else if (type === 'story') {
      navigate(`/stories/${item.id}`);
    }
  };

  const icons = {
    article: '📄',
    dog: '🐕',
    story: '✨'
  };

  const labels = {
    article: '推荐文章',
    dog: '相似宠物',
    story: '成功案例'
  };

  return (
    <motion.button
      onClick={handleClick}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 4 }}
      className="block w-full text-left px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors text-xs mb-2"
    >
      <div className="flex items-start gap-2">
        <span className="text-lg">{icons[type]}</span>
        <div className="flex-1 min-w-0">
          <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">{labels[type]}</p>
          <p className="font-medium text-gray-900 dark:text-white line-clamp-1 text-sm">
            {item.title || item.name || ''}
          </p>
          {type === 'dog' && item.breed && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{item.breed}</p>
          )}
        </div>
      </div>
    </motion.button>
  );
}
```

- [ ] **Step 3: 提交**

```bash
git add frontend/src/components/ChatMessage.jsx frontend/src/components/ChatReferenceCard.jsx
git commit -m "feat: add chat message and reference card components"
```

---

## Task 7: 创建会话管理Hook

**Files:**
- Create: `frontend/src/hooks/useChatSession.js`

- [ ] **Step 1: 创建Hook**

```javascript
// frontend/src/hooks/useChatSession.js

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { CHAT_API } from '../config';

const SESSION_STORAGE_KEY = 'chat_session_id';

export function useChatSession() {
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 初始化会话
  useEffect(() => {
    const initializeSession = async () => {
      try {
        setLoading(true);

        // 1. 检查localStorage中是否有sessionId
        const storedSessionId = localStorage.getItem(SESSION_STORAGE_KEY);
        
        if (storedSessionId) {
          setSessionId(storedSessionId);
          return;
        }

        // 2. 创建新会话
        const response = await fetch(CHAT_API.CREATE_SESSION, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(user?.token && { 'Authorization': `Bearer ${user.token}` })
          },
          body: JSON.stringify({
            user_id: user?.id || null
          })
        });

        if (!response.ok) {
          throw new Error(`Failed to create session: ${response.statusText}`);
        }

        const data = await response.json();
        
        // 仅已登录用户保存sessionId
        if (user?.id) {
          localStorage.setItem(SESSION_STORAGE_KEY, data.session_id);
        }
        
        setSessionId(data.session_id);
      } catch (err) {
        console.error('Initialize session error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initializeSession();
  }, [user?.id]);

  // 清空会话（未登录用户刷新页面时调用）
  const clearSession = useCallback(() => {
    if (!user?.id) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      setSessionId(null);
    }
  }, [user?.id]);

  // 删除会话
  const deleteSession = useCallback(async (sid) => {
    try {
      const response = await fetch(CHAT_API.DELETE_SESSION(sid), {
        method: 'DELETE',
        headers: {
          ...(user?.token && { 'Authorization': `Bearer ${user.token}` })
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete session');
      }

      localStorage.removeItem(SESSION_STORAGE_KEY);
      setSessionId(null);
    } catch (err) {
      console.error('Delete session error:', err);
      setError(err.message);
    }
  }, [user?.token]);

  return {
    sessionId,
    loading,
    error,
    clearSession,
    deleteSession
  };
}
```

- [ ] **Step 2: 提交**

```bash
git add frontend/src/hooks/useChatSession.js
git commit -m "feat: add useChatSession hook for session management"
```

---

## Task 8: 创建聊天逻辑Hook

**Files:**
- Create: `frontend/src/hooks/useChat.js`

- [ ] **Step 1: 创建Hook**

```javascript
// frontend/src/hooks/useChat.js

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CHAT_API } from '../config';

export function useChat(sessionId) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  // 从服务器加载历史消息（已登录用户）
  useEffect(() => {
    if (!sessionId || !user?.id) return;

    const loadHistory = async () => {
      try {
        const response = await fetch(CHAT_API.GET_SESSION(sessionId), {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to load history');
        }

        const data = await response.json();
        setMessages(data.messages || []);
      } catch (err) {
        console.error('Load history error:', err);
        // 不中断流程，仅记录错误
      }
    };

    loadHistory();
  }, [sessionId, user?.id, user?.token]);

  // 发送消息
  const sendMessage = useCallback(async (content) => {
    if (!sessionId || !content.trim()) {
      setError('Invalid message or session');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      abortControllerRef.current = new AbortController();

      // 立即添加用户消息到本地
      const userMsg = { role: 'user', content, id: Date.now() };
      setMessages(prev => [...prev, userMsg]);

      // 发送消息并处理流式响应
      const response = await fetch(CHAT_API.SEND_MESSAGE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user?.token && { 'Authorization': `Bearer ${user.token}` })
        },
        body: JSON.stringify({
          session_id: sessionId,
          content,
          user_id: user?.id || null
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
      }

      // 处理流式响应
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let references = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(l => l.trim());

        for (const line of lines) {
          try {
            const event = JSON.parse(line);

            if (event.type === 'text_delta') {
              assistantContent += event.text;
              // 实时更新UI
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                  return [
                    ...prev.slice(0, -1),
                    { ...last, content: assistantContent }
                  ];
                }
                return [...prev, { role: 'assistant', content: event.text }];
              });
            } else if (event.type === 'message_stop') {
              references = event.message;
            }
          } catch (parseError) {
            console.error('Parse stream error:', parseError);
          }
        }
      }

      // 最后一次更新（添加引用）
      if (references) {
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            return [
              ...prev.slice(0, -1),
              { ...last, ...references }
            ];
          }
          return prev;
        });
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Send message error:', err);
        setError(err.message);
        // 移除用户消息（失败）
        setMessages(prev => prev.slice(0, -1));
      }
    } finally {
      setLoading(false);
    }
  }, [sessionId, user?.token, user?.id]);

  // 停止生成
  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    messages,
    loading,
    error,
    sendMessage,
    stopGeneration,
    setMessages
  };
}
```

- [ ] **Step 2: 提交**

```bash
git add frontend/src/hooks/useChat.js
git commit -m "feat: add useChat hook with message streaming and history"
```

---

## Task 9: 创建ChatAssistant浮窗组件

**Files:**
- Create: `frontend/src/components/ChatAssistant.jsx`
- Create: `frontend/src/styles/ChatAssistant.css`

- [ ] **Step 1: 创建样式文件**

```css
/* frontend/src/styles/ChatAssistant.css */

.chat-bubble-btn {
  position: fixed;
  bottom: 100px;
  right: 20px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f43f5e, #ec4899);
  color: white;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(244, 63, 94, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  transition: all 0.3s ease;
  z-index: 1000;
}

.chat-bubble-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(244, 63, 94, 0.6);
}

.chat-bubble-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ef4444;
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.chat-window {
  position: fixed;
  bottom: 100px;
  right: 20px;
  width: 360px;
  height: 500px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 5px 40px rgba(0, 0, 0, 0.16);
  display: flex;
  flex-direction: column;
  z-index: 1001;
  overflow: hidden;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.chat-header {
  background: linear-gradient(135deg, #f43f5e, #ec4899);
  color: white;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.chat-header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 16px;
}

.chat-header-actions {
  display: flex;
  gap: 8px;
}

.chat-header-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.chat-header-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #fafafa;
}

.chat-welcome {
  text-align: center;
  color: #666;
  margin-bottom: 16px;
}

.chat-welcome-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.chat-welcome-text {
  font-size: 14px;
  margin-bottom: 12px;
}

.chat-welcome-examples {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 12px;
  color: #999;
}

.chat-welcome-examples li {
  list-style: none;
  margin-left: 0;
}

.chat-login-hint {
  background: #fef3c7;
  border-left: 4px solid #f59e0b;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  color: #92400e;
  margin-bottom: 12px;
  text-align: center;
}

.chat-input-area {
  border-top: 1px solid #e5e7eb;
  padding: 12px;
  background: white;
  display: flex;
  gap: 8px;
}

.chat-input {
  flex: 1;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 14px;
  resize: none;
  font-family: inherit;
}

.chat-input:focus {
  outline: none;
  border-color: #f43f5e;
  box-shadow: 0 0 0 3px rgba(244, 63, 94, 0.1);
}

.chat-send-btn {
  background: #f43f5e;
  color: white;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.chat-send-btn:hover:not(:disabled) {
  background: #e11d48;
}

.chat-send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 深色模式 */
@media (prefers-color-scheme: dark) {
  .chat-window {
    background: #1f2937;
    color: #f3f4f6;
  }

  .chat-messages {
    background: #111827;
  }

  .chat-input {
    background: #374151;
    border-color: #4b5563;
    color: #f3f4f6;
  }

  .chat-input:focus {
    border-color: #f43f5e;
  }

  .chat-welcome {
    color: #9ca3af;
  }

  .chat-welcome-examples {
    color: #6b7280;
  }

  .chat-input-area {
    background: #1f2937;
    border-top-color: #374151;
  }
}
```

- [ ] **Step 2: 创建ChatAssistant组件**

```javascript
// frontend/src/components/ChatAssistant.jsx

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useChatSession } from '../hooks/useChatSession';
import { useChat } from '../hooks/useChat';
import ChatMessage from './ChatMessage';
import ChatReferenceCard from './ChatReferenceCard';
import '../styles/ChatAssistant.css';

export default function ChatAssistant() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);
  
  const { sessionId, loading: sessionLoading, error: sessionError } = useChatSession();
  const { messages, loading: chatLoading, error: chatError, sendMessage } = useChat(sessionId);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !sessionId || chatLoading) return;

    await sendMessage(inputValue);
    setInputValue('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const isInitialized = sessionId && !sessionLoading;
  const unreadCount = messages.filter(m => m.role === 'assistant').length;

  return (
    <>
      {/* 浮窗按钮 */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="chat-bubble-btn"
            onClick={() => setIsOpen(true)}
            disabled={!isInitialized}
            title={isInitialized ? '打开聊天助手' : '加载中...'}
          >
            🐕
            {unreadCount > 0 && (
              <div className="chat-bubble-badge">{unreadCount > 9 ? '9+' : unreadCount}</div>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* 聊天窗口 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="chat-window"
          >
            {/* 头部 */}
            <div className="chat-header">
              <div className="chat-header-title">
                <span>🐕 宠物小助手</span>
              </div>
              <div className="chat-header-actions">
                <button
                  className="chat-header-btn"
                  onClick={() => setIsOpen(false)}
                  title="最小化"
                >
                  ⎕
                </button>
                <button
                  className="chat-header-btn"
                  onClick={() => setIsOpen(false)}
                  title="关闭"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* 消息区域 */}
            <div className="chat-messages">
              {messages.length === 0 ? (
                <div className="chat-welcome">
                  <div className="chat-welcome-icon">🐾</div>
                  <div className="chat-welcome-text">欢迎！我可以帮你回答：</div>
                  <ul className="chat-welcome-examples">
                    <li>• 宠物品种和特征</li>
                    <li>• 养护知识和健康问题</li>
                    <li>• 领养流程指导</li>
                  </ul>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id || msg.created_at}>
                    <ChatMessage
                      message={msg}
                      isUser={msg.role === 'user'}
                    />
                    {msg.role === 'assistant' && (
                      <div className="px-2 mb-3 space-y-1">
                        {msg.referenced_articles && msg.referenced_articles.length > 0 && (
                          msg.referenced_articles.map((article) => (
                            <ChatReferenceCard
                              key={`article-${article.id}`}
                              type="article"
                              item={article}
                            />
                          ))
                        )}
                        {msg.referenced_dogs && msg.referenced_dogs.length > 0 && (
                          msg.referenced_dogs.map((dog) => (
                            <ChatReferenceCard
                              key={`dog-${dog.id}`}
                              type="dog"
                              item={dog}
                            />
                          ))
                        )}
                        {msg.referenced_stories && msg.referenced_stories.length > 0 && (
                          msg.referenced_stories.map((story) => (
                            <ChatReferenceCard
                              key={`story-${story.id}`}
                              type="story"
                              item={story}
                            />
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
              {chatError && (
                <div className="text-red-600 text-sm p-2 bg-red-50 rounded">
                  错误：{chatError}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* 登录提示 */}
            {!user?.id && messages.length > 0 && (
              <div className="chat-login-hint">
                🔓 登录后可保存对话
              </div>
            )}

            {/* 输入区域 */}
            <div className="chat-input-area">
              <textarea
                className="chat-input"
                placeholder="问我任何宠物相关的问题..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={!isInitialized || chatLoading}
                rows="1"
              />
              <button
                className="chat-send-btn"
                onClick={handleSendMessage}
                disabled={!isInitialized || !inputValue.trim() || chatLoading}
                title={chatLoading ? '回答中...' : '发送'}
              >
                {chatLoading ? '...' : '→'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
```

- [ ] **Step 3: 提交**

```bash
git add frontend/src/components/ChatAssistant.jsx frontend/src/styles/ChatAssistant.css
git commit -m "feat: add ChatAssistant floating window component"
```

---

## Task 10: 集成ChatAssistant到App.jsx

**Files:**
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: 导入ChatAssistant组件**

```javascript
// 在 App.jsx 的导入部分添加
import ChatAssistant from './components/ChatAssistant';
```

- [ ] **Step 2: 在JSX中添加组件**

在 `App.jsx` 的 JSX 中，找到最外层的 `<Router>` 或 `<AuthProvider>`，在其内部末尾添加 `<ChatAssistant />`：

```javascript
// 例如，如果结构是这样：
function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
        <ChatAssistant />  {/* ← 添加这里 */}
      </Router>
    </AuthProvider>
  );
}
```

确保 `<ChatAssistant />` 在 `<Router>` 内部（这样它才能使用 `useNavigate` 钩子）。

- [ ] **Step 3: 测试集成**

```bash
cd frontend
pnpm lint  # 检查语法错误

# 启动开发服务器
pnpm dev

# 打开浏览器，应该在右下角看到红色的🐕按钮
```

- [ ] **Step 4: 提交**

```bash
git add frontend/src/App.jsx
git commit -m "feat: integrate ChatAssistant into App"
```

---

# Phase 3: 推荐卡片和链接 (1天)

## Task 11: 测试推荐链接跳转

**文件：** 已在Task 6和Task 9中实现

- [ ] **Step 1: 手动测试推荐卡片**

启动前后端：
```bash
# 终端1 - 后端
cd backend && npm run dev

# 终端2 - 前端
cd frontend && pnpm dev

# 浏览器访问 http://localhost:5173
```

- [ ] **Step 2: 测试流程**

1. 打开浮窗（点击右下角🐕）
2. 输入"金毛怎么养护" 
3. 等待AI回答（应该显示推荐文章、宠物、故事）
4. 点击推荐卡片，验证跳转正常
5. 浮窗应该保持打开或关闭（根据设计）

- [ ] **Step 3: 验证预期行为**

```
预期结果：
✓ AI能正常回答
✓ 推荐卡片展示相关资源
✓ 点击卡片能跳转到对应页面
✓ 已登录用户刷新后仍有对话历史
✓ 未登录用户刷新后对话消失
```

- [ ] **Step 4: 优化样式（如需）**

如果推荐卡片样式不佳，更新 `ChatReferenceCard.jsx` 的样式。

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "test: verify chat recommendations and navigation"
```

---

# Phase 4: 测试和调优 (0.5天)

## Task 12: 端到端测试

- [ ] **Step 1: 测试错误处理**

测试以下场景：

```
1. API超时：
   - 关闭后端，尝试发送消息
   - 预期：显示"回答超时，请稍后重试"

2. 未登录会话：
   - 以未登录身份发送消息
   - 刷新页面
   - 预期：对话消失，显示欢迎页

3. 已登录会话：
   - 登录后发送消息
   - 刷新页面
   - 预期：对话保留，能继续聊天

4. 消息过长：
   - 输入超过500字的消息
   - 预期：禁用发送按钮或显示错误
```

- [ ] **Step 2: 性能测试**

```
测试：
- 打开浮窗的加载时间 < 500ms
- 消息流式显示的延迟 < 100ms
- 推荐卡片点击跳转 < 300ms
```

- [ ] **Step 3: 浏览器兼容性**

测试在以下环境中是否正常：
- Chrome 最新版
- Firefox 最新版
- Safari 最新版

- [ ] **Step 4: 提交**

```bash
git add -A
git commit -m "test: e2e testing and error handling verification"
```

---

## Task 13: 文档和清理

- [ ] **Step 1: 更新README**

在 `/Users/wclu/dog_project/README.md` 的"核心功能"部分添加：

```markdown
- 🤖 **AI聊天助手**: 智能回答宠物相关问题，推荐相关资源（Wiki、宠物、成功案例）
```

- [ ] **Step 2: 更新API文档**

在后端文档中记录新增的API端点。可以在 `docs/BACKEND_LOGIC.md` 或创建 `docs/CHAT_API.md`：

```markdown
# Chat API 文档

## 端点列表

### POST /api/chat/sessions
创建新对话会话

### POST /api/chat/messages  
发送消息并获取AI回复（流式）

### GET /api/chat/sessions/:session_id
获取会话历史

### DELETE /api/chat/sessions/:session_id
删除会话
```

- [ ] **Step 3: 清理日志**

检查console中是否有不必要的日志，清理调试代码。

- [ ] **Step 4: 最终提交**

```bash
git add README.md docs/
git commit -m "docs: update documentation for chat assistant"

# 查看完整的改动
git log --oneline -10
```

---

## ✅ 实现完成清单

- [ ] Phase 1: 数据库 + 后端API (6个Task)
- [ ] Phase 2: 前端组件 (5个Task)
- [ ] Phase 3: 推荐和链接 (1个Task)
- [ ] Phase 4: 测试和文档 (2个Task)

**总计：14个Task，预期5天完成**

---

## 后续验证清单

在部署前，确保：

- [ ] 所有API端点可正常访问
- [ ] 流式响应正常工作
- [ ] 未登录/已登录用户会话管理正确
- [ ] 推荐卡片数据准确
- [ ] UI在移动端显示正常
- [ ] 没有控制台错误或警告
- [ ] 代码通过 ESLint 检查
- [ ] 文档已更新

---

**文档生成时间**：2026-04-23  
**预计实现周期**：5天  
**建议优化顺序**：Phase 1 → Phase 2 → Phase 3 → Phase 4
