# AI 聊天助手设计文档

**日期**：2026-04-23  
**版本**：1.0  
**状态**：待审批

## 1. 概述

为宠物领养平台添加**AI智能聊天助手**，帮助用户答疑解惑和引导操作。助手基于平台内的Wiki、宠物库、成功案例提供准确回答，推荐相关资源。

### 核心目标
- ✅ 所有用户可用（已登录保存历史，未登录不保存）
- ✅ 答疑解惑 + 引导操作为主
- ✅ 基于Wiki + 宠物数据 + 成功案例的智能搜索
- ✅ 浮窗交互，不打扰主流程

---

## 2. 架构设计

### 2.1 总体流程

```
用户输入问题 (浮窗)
    ↓
后端接收 + 创建消息记录
    ├─→ 全文搜索 Wiki 文章（3条）
    ├─→ 全文搜索 宠物数据（2条）
    └─→ 全文搜索 故事案例（2条）
    ↓
后端构造 Prompt（用户问题 + 搜索结果）
    ↓
调用 Claude API（流式）
    ↓
前端实时显示回答 + 推荐卡片
    ↓
Supabase 保存完整对话记录
```

### 2.2 数据库设计

#### 表：`chat_sessions`
```sql
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NULLABLE REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 索引
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
```

**说明**：
- `user_id` 为 NULL 表示未登录用户的临时会话
- 未登录会话在内存中维护，刷新页面后清空
- 登录后自动关联 user_id

#### 表：`chat_messages`
```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  referenced_articles JSONB,  -- [{ id, title, slug }]
  referenced_dogs JSONB,      -- [{ id, name, breed }]
  referenced_stories JSONB,   -- [{ id, title }]
  created_at TIMESTAMP DEFAULT now()
);

-- 索引
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
```

**说明**：
- JSONB存储推荐资源，便于快速查询和前端展示
- role 区分用户消息和助手回复

---

## 3. 前端设计

### 3.1 浮窗组件 (`ChatAssistant.jsx`)

**位置**：全局组件，放在 `App.jsx` 最外层，Z层级在 BottomNav 上方

**三个状态**：

| 状态 | 表现 | 交互 |
|------|------|------|
| 收起 | 右下角圆形气泡按钮 + 未读数 | 点击打开浮窗 |
| 打开 | 400px 高度聊天框，显示历史 + 输入框 | 输入、发送、关闭 |
| 最小化 | 仅显示气泡 | 点击恢复浮窗 |

### 3.2 UI布局

```
┌─────────────────────────────┐
│ 🐕 宠物小助手         ✕  ⎕  │  ← 标题、关闭、最小化
├─────────────────────────────┤
│ 欢迎！我可以帮你回答：      │
│ • 宠物品种和特征            │
│ • 养护知识和健康问题        │
│ • 领养流程指导              │
├─────────────────────────────┤
│ [消息气泡 - 用户消息]       │
│                             │
│ [消息气泡 - AI回答]         │
│ ├─ 📄 推荐文章              │  ← 可点击卡片
│ │  └─ 金毛品种详解          │
│ ├─ 🐕 相似宠物              │
│ │  └─ 汪汪（金毛，2岁）     │
│ └─ ✨ 成功案例              │
│    └─ 我和金毛的故事        │
├─────────────────────────────┤
│ 🔓 登录后可保存对话 ←─ 提示 │
├─────────────────────────────┤
│ [消息输入框]     [发送 →]   │
└─────────────────────────────┘
```

### 3.3 关键功能

**消息展示**：
- 流式显示AI回答（打字效果）
- 已登录用户打开浮窗时加载历史
- 未登录用户刷新后清空

**推荐卡片交互**：
- 点击文章卡片 → 跳转 `/wiki/article/{slug}`，保持浮窗打开
- 点击宠物卡片 → 跳转 `/pet/{id}`，保持浮窗打开
- 点击故事卡片 → 跳转 `/stories/{id}`，保持浮窗打开

**会话管理**：
- 本地存储 `sessionId`（已登录恢复，未登录清空）
- 新用户首次打开自动创建session
- 已登录用户切换账号时重建session

---

## 4. 后端设计

### 4.1 新增API端点

#### POST `/api/chat/sessions`
创建新会话
```
请求：
{
  user_id?: string  // 可选，前端从 AuthContext 获取
}

响应 (201)：
{
  session_id: "uuid",
  messages: []
}

错误 (401)：
{
  error: "Unauthorized"
}
```

#### POST `/api/chat/messages`
发送消息并获取AI回复
```
请求：
{
  session_id: "uuid",
  content: "用户输入的问题",
  user_id?: string  // 可选
}

响应 (200 - 流式响应)：
{
  id: "message_id",
  role: "assistant",
  content: "AI完整回答...",
  referenced_articles: [
    { id: "uuid", title: "金毛品种详解", slug: "golden-retriever" }
  ],
  referenced_dogs: [
    { id: "uuid", name: "汪汪", breed: "金毛" }
  ],
  referenced_stories: [
    { id: "uuid", title: "我和金毛的故事" }
  ]
}

错误 (400)：
{
  error: "Invalid session or message too long"
}

错误 (503)：
{
  error: "AI service temporarily unavailable"
}
```

#### GET `/api/chat/sessions/:id`
获取会话历史
```
请求：/api/chat/sessions/{sessionId}

响应 (200)：
{
  session_id: "uuid",
  user_id: "uuid or null",
  messages: [
    {
      id: "uuid",
      role: "user",
      content: "我想要一只温和的狗",
      created_at: "2026-04-23T10:00:00Z"
    },
    {
      id: "uuid",
      role: "assistant",
      content: "...",
      referenced_articles: [...],
      referenced_dogs: [...],
      created_at: "2026-04-23T10:00:05Z"
    }
  ]
}

错误 (404)：
{
  error: "Session not found"
}
```

#### DELETE `/api/chat/sessions/:id`
删除会话（已登录用户仅删除自己的）
```
请求：/api/chat/sessions/{sessionId}

响应 (204)：无内容

错误 (403)：
{
  error: "Cannot delete other user's session"
}
```

### 4.2 搜索逻辑

```javascript
async function searchContext(userMessage) {
  const supabase = getSupabaseClient(req);
  
  // 1. 全文搜索 Wiki 文章
  const { data: articles } = await supabase
    .from('wiki_articles')
    .select('id, title, summary, slug, content')
    .eq('is_published', true)
    .textSearch('title,summary,content', userMessage)
    .limit(3);
  
  // 2. 全文搜索 宠物数据
  const { data: dogs } = await supabase
    .from('dogs')
    .select('id, name, breed, description, age, temperament')
    .textSearch('breed,description,temperament', userMessage)
    .limit(2);
  
  // 3. 全文搜索 故事案例
  const { data: stories } = await supabase
    .from('stories')
    .select('id, title, content')
    .eq('is_published', true)
    .textSearch('title,content', userMessage)
    .limit(2);
  
  return { articles, dogs, stories };
}
```

### 4.3 Prompt构造

```
系统Prompt：
你是宠物领养平台的智能助手。你的职责是：
1. 基于平台数据准确回答关于宠物品种、养护、疾病的问题
2. 指导用户完成领养申请流程
3. 推荐相关资源帮助用户做出决策

用户问题：${userMessage}

【平台相关信息】

相关Wiki文章：
${articles.map((a, i) => `${i+1}. "${a.title}": ${a.summary}`).join('\n')}

平台相似宠物：
${dogs.map((d, i) => `${i+1}. ${d.name}(${d.breed}, ${d.age}岁): ${d.description}`).join('\n')}

成功案例：
${stories.map((s, i) => `${i+1}. ${s.title}: ${s.content.slice(0, 100)}...`).join('\n')}

【回答规则】
- 用友好、专业的语气回答
- 如果信息充分，优先基于平台数据回答
- 如果平台无相关数据，基于通用知识回答
- 鼓励用户探索推荐的资源
- 对于领养流程问题，提供清晰的步骤指导
```

### 4.4 流式响应实现

使用 Vercel AI SDK：
```javascript
const { streamText } = require('ai');

const stream = await streamText({
  model: 'claude-3-5-sonnet-20241022',
  system: systemPrompt,
  messages: [
    { role: 'user', content: userMessage }
  ]
});

// 流式输出到客户端
for await (const chunk of stream.textStream) {
  res.write(JSON.stringify({ 
    type: 'text_delta', 
    text: chunk 
  }) + '\n');
}

res.write(JSON.stringify({ 
  type: 'message_stop',
  references: { articles, dogs, stories }
}) + '\n');
res.end();
```

---

## 5. 错误处理

| 场景 | 处理方式 |
|------|---------|
| Claude API 超时 | 显示"回答超时，请稍后重试"，不保存消息 |
| Claude API 限流 | 显示"请求过于频繁，请稍候"，前端加1分钟冷却 |
| 搜索无结果 | 仍调用Claude，Prompt改为"基于通用知识回答"，不显示推荐卡片 |
| 用户消息为空 | 前端验证，禁用发送按钮 |
| 会话已过期 | 自动创建新会话，提示"新对话已开始" |
| 未登录用户2小时无活动 | 自动清空内存session |

---

## 6. 安全和隐私

- **会话隔离**：已登录用户只能查看自己的会话
- **消息不修改**：所有消息不可编辑或删除（审计需求）
- **API认证**：未登录用户可查询，但不能获取他人会话
- **内容审查**：AI回答由Claude负责，平台不进行额外审查

---

## 7. 实现路线图

| 阶段 | 工作 | 工期 |
|------|------|------|
| Phase 1 | 数据库表 + 后端API（搜索、Prompt、流式）| 2天 |
| Phase 2 | 前端浮窗组件 + 消息展示 | 1.5天 |
| Phase 3 | 推荐卡片 + 链接跳转 | 1天 |
| Phase 4 | 测试 + 调优 | 0.5天 |
| **总计** | | **5天** |

---

## 8. 成功指标

- ✅ 助手能准确回答宠物相关问题
- ✅ 推荐资源点击率 > 20%
- ✅ 用户使用率 > 30%
- ✅ API 平均响应时间 < 3秒
- ✅ 无用户投诉"回答不准确"

---

## 9. 后续优化空间

- 🔄 **Phase 2**：添加用户反馈（👍👎按钮）优化回答质量
- 🔄 **Phase 3**：RAG向量搜索替代全文搜索，提高精准度
- 🔄 **Phase 4**：多轮对话上下文记忆，支持追问
- 🔄 **Phase 5**：为管理员添加"助手回答审核"功能

---

**文档完成时间**：2026-04-23  
**审批状态**：待用户审批
