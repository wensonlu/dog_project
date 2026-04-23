#!/bin/bash

# 从.env读取Supabase凭据
source backend/.env

# SQL迁移
CHAT_TABLES_SQL='
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
  role TEXT NOT NULL CHECK (role IN ('"'"'user'"'"', '"'"'assistant'"'"')),
  content TEXT NOT NULL,
  referenced_articles JSONB,
  referenced_dogs JSONB,
  referenced_stories JSONB,
  created_at TIMESTAMP DEFAULT now()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_role ON chat_messages(role);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_stats ON chat_messages USING btree (session_id) WHERE role = '"'"'user'"'"';
'

echo "=========================================="
echo "Supabase 数据库迁移"
echo "=========================================="
echo ""
echo "SUPABASE_URL: $SUPABASE_URL"
echo ""

# 提示用户
echo "⚠️  重要提示："
echo "Supabase JavaScript客户端库不支持执行任意SQL。"
echo "您需要手动在 Supabase 控制台执行以下SQL："
echo ""
echo "=========================================="
echo "执行以下SQL："
echo "=========================================="
echo "$CHAT_TABLES_SQL"
echo ""
echo "=========================================="
echo ""
echo "步骤："
echo "1. 访问 https://supabase.com/dashboard"
echo "2. 选择您的项目"
echo "3. 进入 SQL Editor"
echo "4. 新建查询"
echo "5. 复制粘贴上面的SQL"
echo "6. 点击 Run"
echo ""
