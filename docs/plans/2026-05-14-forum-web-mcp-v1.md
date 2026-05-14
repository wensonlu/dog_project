# Forum Web MCP v1 方案（Dog Project）

## 1. 目标

在论坛场景落地 Web MCP，优先实现：
1. AI 可理解当前论坛页面上下文
2. AI 可辅助检索、总结、草拟内容
3. AI 可在用户确认下执行发布类操作

设计原则：默认只读、写操作分级、所有关键行为可审计。

---

## 2. v1 工具清单

### 2.1 `get_forum_context`

用途：一次返回页面结构 + 状态 +可见数据（减少多次 RPC）。

请求：
```json
{
  "pageScope": "auto"
}
```

响应：
```json
{
  "page": {
    "type": "topic_list|topic_detail|create_topic|search",
    "route": "/forum",
    "title": "论坛",
    "topicId": null
  },
  "state": {
    "loading": false,
    "error": null,
    "scroll": { "top": 0, "height": 812 },
    "filters": {
      "sort": "latest|hot|following",
      "category": "all",
      "tags": []
    }
  },
  "data": {
    "viewer": {
      "isLoggedIn": true,
      "userId": "u_xxx",
      "permissions": ["post", "reply"]
    },
    "visibleTopics": []
  }
}
```

### 2.2 `search_topics`

用途：论坛检索。

请求：
```json
{
  "query": "金毛 领养",
  "sort": "relevance|latest|hot",
  "category": "all|领养经验|日常分享|求助问答",
  "limit": 20,
  "cursor": null
}
```

响应：
```json
{
  "items": [],
  "nextCursor": "c_2"
}
```

### 2.3 `get_topic_detail`

用途：读取帖子详情 + 楼层分页。

请求：
```json
{
  "topicId": "t_101",
  "cursor": null,
  "limit": 30
}
```

响应：
```json
{
  "topic": {},
  "replies": [],
  "nextCursor": "r_page_2"
}
```

### 2.4 `get_related_topics`

用途：相似帖推荐 / 发帖前去重提示。

请求：
```json
{
  "title": "第一次领养金毛需要准备什么",
  "content": "我家有小孩，想领养...",
  "topK": 5
}
```

响应：
```json
{
  "items": []
}
```

### 2.5 `draft_reply`

用途：生成回复草稿（不直接发布）。

请求：
```json
{
  "topicId": "t_101",
  "replyToId": "r_1",
  "userIntent": "补充经验并给建议",
  "tone": "friendly|professional",
  "length": "short|medium"
}
```

响应：
```json
{
  "draft": "...",
  "riskHints": [],
  "citations": []
}
```

### 2.6 `draft_topic`

用途：生成发帖草稿（标题 + 正文 + 标签建议）。

请求：
```json
{
  "prompt": "想分享我第一次领养柴犬的经历",
  "category": "领养经验",
  "tone": "warm",
  "length": "medium"
}
```

响应：
```json
{
  "title": "...",
  "content": "...",
  "tags": [],
  "relatedTopics": []
}
```

### 2.7 `apply_list_filters`

用途：低风险筛选操作。

请求：
```json
{
  "sort": "hot",
  "category": "求助问答",
  "tags": ["行为训练"]
}
```

响应：
```json
{
  "applied": true,
  "state": {}
}
```

### 2.8 `navigate_to_topic`

用途：低风险跳转。

请求：
```json
{
  "topicId": "t_101"
}
```

响应：
```json
{
  "ok": true,
  "route": "/forum/t_101"
}
```

### 2.9 `create_reply`（需确认）

用途：正式发布回复。

请求：
```json
{
  "topicId": "t_101",
  "content": "...",
  "confirmToken": "confirm_xxx"
}
```

响应：
```json
{
  "ok": true,
  "replyId": "r_999",
  "createdAt": "2026-05-14T11:00:00Z"
}
```

### 2.10 `create_topic`（需确认）

用途：正式发布帖子。

请求：
```json
{
  "title": "...",
  "content": "...",
  "category": "领养经验",
  "tags": ["新手"],
  "confirmToken": "confirm_xxx"
}
```

响应：
```json
{
  "ok": true,
  "topicId": "t_999",
  "createdAt": "2026-05-14T11:01:00Z"
}
```

---

## 3. 风险分级与确认策略

1. 低风险（可直接执行）：检索、筛选、跳转、读取详情
2. 中风险（建议确认）：生成草稿、批量@建议
3. 高风险（必须确认）：发帖、回复、删除、封禁、置顶、加精

确认机制：
1. 发布前先 `precheck_*` 生成 `confirmToken`
2. 用户明确确认后再调用 `create_*`
3. `confirmToken` 绑定 `userId + payloadHash`，60 秒过期，防重放

---

## 4. 与现有后端能力映射（当前代码）

当前相关文件：
- `backend/routes/forum.js`
- `backend/controllers/forumController.js`
- `frontend/src/pages/Forum.jsx`
- `frontend/src/pages/ForumDetail.jsx`
- `frontend/src/pages/CreateTopic.jsx`

映射建议：
1. `search_topics` -> 基于现有 forum 列表接口增加 `query/sort/category/cursor`
2. `get_topic_detail` -> 复用详情接口，补 `cursor/limit` 分页
3. `get_related_topics` -> 新增相似度查询（可先用关键词 + trigram/fts）
4. `draft_reply`/`draft_topic` -> 复用现有 AI chat 能力，改 prompt 模板
5. `create_reply`/`create_topic` -> 在现有发布接口外包一层 confirm token 校验
6. `get_forum_context` -> 前端聚合（页面状态）+ 后端聚合（数据）混合实现

---

## 5. 建议落地顺序（两周）

### Phase 1（本周）
1. `get_forum_context`
2. `search_topics`
3. `get_topic_detail`
4. `draft_reply`

### Phase 2（下周）
1. `get_related_topics`
2. `draft_topic`
3. `create_reply` + confirm
4. `create_topic` + confirm

---

## 6. 验收标准（v1）

1. AI 在论坛页能准确说出当前场景与筛选状态
2. 用户输入问题后，AI 能返回相关帖子并附可跳转目标
3. 用户可以一键生成回复草稿并编辑后发布
4. 所有发布动作都有确认步骤和审计日志
5. 平均单轮 tool 调用数 <= 2（依赖 `get_forum_context` 批量化）

