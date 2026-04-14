-- Pet Agent System Migration
-- Created: 2026-04-02
-- Purpose: Create tables for AI-powered pet agent system

-- ============================================
-- 1. Pet Agents Table
-- ============================================
CREATE TABLE IF NOT EXISTS pet_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id BIGINT REFERENCES dogs(id) ON DELETE CASCADE,

  -- Agent 配置
  agent_type TEXT DEFAULT 'pet_companion', -- pet_companion, health_advisor, adoption_consultant
  status TEXT DEFAULT 'active', -- active, paused, archived

  -- AI 生成内容缓存
  generated_bio TEXT, -- AI生成的领养简历
  personality_traits JSONB, -- 性格标签：["活泼", "亲人", "爱玩球"]
  health_baseline JSONB, -- 健康基线：{vaccine_status, last_checkup, known_issues}

  -- Agent 状态
  conversation_history JSONB DEFAULT '[]', -- 与用户的对话历史（用于领养顾问）
  last_active_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_pet_agents_dog ON pet_agents(dog_id);
CREATE INDEX IF NOT EXISTS idx_pet_agents_status ON pet_agents(status);

-- RLS 策略
ALTER TABLE pet_agents ENABLE ROW LEVEL SECURITY;

-- 所有人可以查看宠物 Agent 信息（宠物信息是公开的）
CREATE POLICY "Anyone can view pet agents" ON pet_agents
  FOR SELECT USING (true);

-- 只有系统可以创建/更新 Agent（通过 Service Role Key）
-- 不创建 INSERT/UPDATE 策略，后端使用 Service Role Key 绕过 RLS

-- ============================================
-- 2. 扩展 Dogs 表
-- ============================================
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES pet_agents(id);
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS health_status JSONB DEFAULT '{}';
-- health_status 示例: {"vaccinated": true, "neutered": false, "last_checkup": "2026-03-01"}

-- ============================================
-- 3. Health Records Table
-- ============================================
CREATE TABLE IF NOT EXISTS health_records (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  dog_id BIGINT REFERENCES dogs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),

  record_type TEXT NOT NULL, -- vaccine, deworming, checkup, illness, surgery
  record_date DATE NOT NULL,
  description TEXT,
  attachments JSONB, -- 照片/文档URL列表

  -- AI 分析结果
  ai_analysis TEXT, -- AI对这次记录的分析建议

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_health_records_dog ON health_records(dog_id);
CREATE INDEX IF NOT EXISTS idx_health_records_type ON health_records(record_type);
CREATE INDEX IF NOT EXISTS idx_health_records_user ON health_records(user_id);

-- RLS 策略
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;

-- 用户可以查看自己宠物的健康记录
CREATE POLICY "Users can view own pet health records" ON health_records
  FOR SELECT USING (auth.uid() = user_id);

-- 用户可以添加健康记录
CREATE POLICY "Users can insert health records" ON health_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 用户可以更新自己的健康记录
CREATE POLICY "Users can update own health records" ON health_records
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- 4. Health Reminders Table
-- ============================================
CREATE TABLE IF NOT EXISTS health_reminders (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  dog_id BIGINT REFERENCES dogs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),

  reminder_type TEXT NOT NULL, -- vaccine, deworming, checkup
  next_date DATE NOT NULL,
  frequency_days INT, -- 间隔天数（疫苗通常是365天）

  last_notified_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active', -- active, completed, snoozed

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_health_reminders_date ON health_reminders(next_date);
CREATE INDEX IF NOT EXISTS idx_health_reminders_user ON health_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_health_reminders_dog ON health_reminders(dog_id);

-- RLS 策略
ALTER TABLE health_reminders ENABLE ROW LEVEL SECURITY;

-- 用户可以查看自己的提醒
CREATE POLICY "Users can view own reminders" ON health_reminders
  FOR SELECT USING (auth.uid() = user_id);

-- 用户可以创建提醒
CREATE POLICY "Users can insert reminders" ON health_reminders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 用户可以更新提醒状态
CREATE POLICY "Users can update own reminders" ON health_reminders
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- 5. AI Usage Log Table (成本监控)
-- ============================================
CREATE TABLE IF NOT EXISTS ai_usage_log (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  agent_id UUID REFERENCES pet_agents(id) ON DELETE SET NULL,

  operation TEXT NOT NULL, -- bio_generation, image_analysis, health_advice
  model TEXT NOT NULL, -- claude-sonnet-4-6, claude-haiku-4-5

  input_tokens INT,
  output_tokens INT,
  cost DECIMAL(10, 6), -- 美元

  duration_ms INT, -- 执行时间（毫秒）
  success BOOLEAN DEFAULT true,
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_ai_usage_date ON ai_usage_log(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_agent ON ai_usage_log(agent_id);

-- RLS 策略（仅管理员可访问）
ALTER TABLE ai_usage_log ENABLE ROW LEVEL SECURITY;
-- 不创建任何策略，只有 Service Role Key 可以访问

-- ============================================
-- 6. 触发器：自动更新 updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pet_agents_updated_at
    BEFORE UPDATE ON pet_agents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. 注释
-- ============================================
COMMENT ON TABLE pet_agents IS '宠物 AI Agent 表 - 每只宠物绑定一个专属 Agent';
COMMENT ON TABLE health_records IS '宠物健康记录表 - 疫苗、驱虫、体检等';
COMMENT ON TABLE health_reminders IS '健康提醒表 - 疫苗提醒、体检提醒等';
COMMENT ON TABLE ai_usage_log IS 'AI 使用日志表 - 成本监控和审计';