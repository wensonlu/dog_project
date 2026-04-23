# 数据库迁移指南

## 问题
聊天功能所需的数据库表（chat_sessions 和 chat_messages）在Supabase中不存在。

## 解决方案

### 步骤1：访问Supabase SQL Editor

1. 打开浏览器访问：https://supabase.com/dashboard
2. 登录您的账户
3. 选择项目（Project Reference: djvhueamitqvosgruioo）
4. 左侧菜单 → SQL Editor

### 步骤2：创建新查询

1. 点击 "New Query"
2. 在编辑器中粘贴以下SQL代码：

```sql
-- 创建 chat_sessions 表
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NULLABLE REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 创建索引
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

### 步骤3：执行SQL

1. 点击 "Run" 按钮（或使用 Ctrl+Enter / Cmd+Enter）
2. 等待查询完成（通常在1-2秒内）
3. 您应该看到成功信息

### 步骤4：验证创建成功

1. 进入 Supabase 的 Table Editor
2. 检查左侧表列表中是否出现：
   - `chat_sessions`
   - `chat_messages`
3. 点击各表查看列定义

## 之后的操作

数据库表创建成功后：

1. **重启后端服务**
   ```bash
   # 按 Ctrl+C 停止现有服务
   # 重新启动
   cd backend && npm run dev
   ```

2. **运行测试**
   ```bash
   node test-chat-recommendations.js
   ```

3. **手动测试**
   - 打开 http://localhost:5173
   - 点击右下角的🐕按钮打开聊天
   - 输入问题，例如"金毛怎么养护"
   - 等待AI回答并查看推荐卡片
   - 点击推荐卡片，验证导航正常

4. **提交代码**
   ```bash
   git add -A
   git commit -m "test: verify chat recommendations and navigation"
   ```

## 常见问题

### Q：收到错误"Table already exists"
A：这没问题。我们使用了 `IF NOT EXISTS` 子句，所以重复执行不会出错。

### Q：表创建成功但后端仍然报错
A：可能需要重启后端服务使其重新加载Supabase模式缓存。

### Q：如何检查表是否创建成功
A：在SQL Editor中执行：
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'chat_%';
```

应该返回两行（chat_sessions 和 chat_messages）。

### Q：需要使用专门的工具吗
A：不需要。只需要浏览器访问Supabase Web界面即可。

---

完成迁移后，推荐链接跳转测试应该可以顺利进行。
