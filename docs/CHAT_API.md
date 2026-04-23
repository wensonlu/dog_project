# Chat API 文档

## 概述

聊天API提供AI智能问答功能，支持宠物知识咨询、领养指导等。

## 端点列表

### POST /api/chat/sessions
创建新对话会话

**请求：**
```json
{
  "user_id": "optional_uuid"
}
```

**响应：**
```json
{
  "session_id": "uuid",
  "messages": []
}
```

### POST /api/chat/messages
发送消息并获取AI回复（流式）

**请求：**
```json
{
  "session_id": "uuid",
  "content": "用户问题",
  "user_id": "optional_uuid"
}
```

**响应：** 流式SSE格式

### GET /api/chat/sessions/:session_id
获取会话历史

**响应：**
```json
{
  "session_id": "uuid",
  "user_id": "optional_uuid",
  "messages": [...]
}
```

### DELETE /api/chat/sessions/:session_id
删除会话（仅限所有者）

**响应：** 204 No Content

## 认证

所有端点均需要 `checkSupabase` 中间件验证。已登录用户需在header中传递Authorization token。
