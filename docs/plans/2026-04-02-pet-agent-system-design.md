# Pet Agent System - 产品设计文档

**设计日期**: 2026-04-02
**设计目标**: 为汪星球宠物领养平台构建 AI Agent 驱动的一体化宠物档案系统

---

## 一、产品定位

### 核心理念
每只宠物绑定一个专属 AI Agent，自动完成内容创作、健康管理、用户互动。

### 目标用户
- **送养者**：快速发布宠物信息，降低内容生产门槛
- **领养者**：获得持续的健康管理服务，提升领养后留存
- **平台**：内容自动生产，运营成本降低80%

### 产品价值
1. **内容生产自动化**：上传照片 → 自动生成领养简历 + 性格分析
2. **健康管理智能化**：疫苗提醒 + 健康记录 + AI 护理建议
3. **用户留存提升**：领养后持续服务，建立情感连接

---

## 二、整体架构设计

```
┌─────────────────────────────────────────────────┐
│                  Pet Agent System               │
├─────────────────────────────────────────────────┤
│                                                 │
│  宠物上传 → 自动创建 Pet Agent                  │
│     ↓                                           │
│  Agent 自动执行：                               │
│  ├─ 分析宠物照片 → 生成性格标签                 │
│  ├─ 生成领养简历 → 发布到首页                   │
│  ├─ 创建健康档案 → 设置疫苗提醒                 │
│  └─ 持续更新内容 → 成长日记/护理建议            │
│                                                 │
│  用户交互：                                     │
│  ├─ 送养者：查看Agent生成的内容，可编辑         │
│  ├─ 领养者：查看健康档案，接收提醒              │
│  └─ 平台：Agent自动回答常见问题                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 技术架构
- **AI层**：Vercel AI Gateway + Claude/GPT-5
- **数据层**：Supabase (PostgreSQL) + 新增 pet_agents 表
- **执行层**：Vercel Workflow (持久化 Agent 状态)
- **触发层**：定时任务 + 用户事件

---

## 三、数据模型设计

### 新增核心表 `pet_agents`

```sql
CREATE TABLE pet_agents (
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

CREATE INDEX idx_pet_agents_dog ON pet_agents(dog_id);
CREATE INDEX idx_pet_agents_status ON pet_agents(status);
```

### 扩展现有 `dogs` 表

```sql
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES pet_agents(id);
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS health_status JSONB DEFAULT '{}';
-- health_status 示例: {"vaccinated": true, "neutered": false, "last_checkup": "2026-03-01"}
```

### 新增 `health_records` 表

```sql
CREATE TABLE health_records (
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

CREATE INDEX idx_health_records_dog ON health_records(dog_id);
CREATE INDEX idx_health_records_type ON health_records(record_type);
```

### 新增 `health_reminders` 表

```sql
CREATE TABLE health_reminders (
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

CREATE INDEX idx_health_reminders_date ON health_reminders(next_date);
CREATE INDEX idx_health_reminders_user ON health_reminders(user_id);
```

### 数据流
1. 用户上传宠物 → 创建 `dogs` 记录
2. 自动创建 `pet_agents` 记录并关联
3. Agent分析照片 → 更新 `generated_bio`, `personality_traits`
4. 用户添加健康记录 → 创建 `health_records` + 自动创建 `health_reminders`

---

## 四、AI Agent 工作流程

### 核心流程：宠物上传 → Agent自动激活

```
用户上传宠物照片 + 基本信息
         ↓
   [触发器] 创建 Pet Agent
         ↓
   ┌─────────────────────┐
   │   Agent 第一阶段    │
   │   (立即执行)        │
   └─────────────────────┘
         ↓
   1. 图像分析（调用AI Vision）
      输入：宠物照片
      输出：品种、年龄估算、性格特征
         ↓
   2. 简历生成（调用AI Text）
      输入：图像分析结果 + 基本信息
      输出：吸引人的领养文案（200-300字）
         ↓
   3. 健康基线创建
      输入：品种 + 年龄
      输出：疫苗计划、护理建议
         ↓
   [完成] 宠物档案自动生成
```

### 定时任务：内容持续更新

```
每天凌晨 2:00 执行
         ↓
   遍历所有 active 状态的 Pet Agent
         ↓
   ┌─────────────────────┐
   │   Agent 日常任务    │
   └─────────────────────┘
         ↓
   1. 检查健康提醒
      如果有即将到期的提醒 → 生成通知消息
         ↓
   2. 更新成长日记（如果领养已满7天/30天）
      输入：领养时间 + 健康记录
      输出："小胖到家已经30天啦！看看它的变化..."
         ↓
   3. 内容推荐（可选）
      如果宠物未领养 → 更新领养文案（加入"等待X天了"）
```

### 关键实现点
1. **AI调用**：使用 Vercel AI Gateway + `@ai-sdk/anthropic`
2. **任务调度**：Vercel Cron Jobs
3. **状态管理**：`pet_agents.status` 控制是否执行定时任务
4. **成本控制**：
   - 每只宠物首次生成：~$0.05（图像分析+文案）
   - 每月维护成本：~$0.02/只（定时更新）

---

## 五、API 端点设计

### 新增 API 路由：Agent 相关

```javascript
// backend/routes/agent.js

// 1. 触发 Agent 生成内容（用户主动）
POST /api/agent/:dogId/generate
  → 调用 AI 生成领养简历
  → 返回: { bio, traits, suggestedHealthPlan }
  → 成本: ~$0.05/次

// 2. 获取 Agent 状态
GET /api/agent/:dogId
  → 返回 Agent 信息和生成的内容
  → 返回: { agentId, status, generatedBio, personalityTraits }

// 3. 更新 Agent 生成的内容（用户编辑）
PUT /api/agent/:dogId/content
  → 用户修改 AI 生成的内容
  → Body: { bio?, personalityTraits? }

// 4. 健康记录 API
POST /api/health/:dogId/records
  → 添加健康记录
  → 自动触发 AI 分析建议
  → Body: { type, date, description, attachments }
  → 返回: { recordId, aiAnalysis }

GET /api/health/:dogId/records
  → 获取健康记录列表

// 5. 健康提醒 API
GET /api/health/:dogId/reminders
  → 获取即将到期的提醒

PUT /api/health/reminders/:id
  → 更新提醒状态
  → Body: { status, snoozeDays? }
```

### 扩展现有 API

```javascript
// 修改现有宠物上传流程
POST /api/dogs (现有)
  → 插入 dogs 表后
  → 自动创建 pet_agents 记录
  → 触发 Agent 第一阶段生成
  → 返回: { dogId, agentId, generatedBio }
```

### 定时任务端点

```javascript
// backend/routes/cron.js (新增)

// 每日 Agent 任务
POST /api/cron/daily-agent-tasks
  → Header: CRON_SECRET (验证身份)
  → 遍历所有 active agents
  → 执行健康提醒检查
  → 更新成长日记
```

### 关键设计点
1. **异步生成**：AI生成耗时5-10秒，使用后台任务避免阻塞
2. **幂等性**：重复调用 `/generate` 不会重复扣费
3. **用户可编辑**：AI生成的内容用户可以修改
4. **成本透明**：每次生成显示预估成本

---

## 六、前端组件设计

### 新增核心组件

```javascript
// 1. AI 简历生成器组件
frontend/src/components/AIPetBioGenerator.jsx
  → 上传照片后显示"生成AI简历"按钮
  → 调用 POST /api/agent/:dogId/generate
  → 显示加载动画（5-10秒）
  → 展示生成结果：简历 + 性格标签
  → 用户可编辑后保存

// 2. 健康档案组件
frontend/src/components/HealthProfile.jsx
  → 显示健康时间线（疫苗、驱虫、体检）
  → 添加健康记录表单
  → 显示 AI 健康建议卡片
  → 即将到期的提醒高亮显示

// 3. 健康提醒组件
frontend/src/components/HealthReminders.jsx
  → 列表展示即将到期的提醒
  → 支持标记完成、延期
  → 推送通知（浏览器通知 + 站内消息）

// 4. 宠物档案页重构
frontend/src/pages/PetDetails.jsx (修改)
  → 新增 Tab: "健康档案"
  → 显示 AI 生成的性格标签
  → 展示 Agent 生成的内容
```

### 用户流程

```
送养者上传宠物
  ↓
填写基本信息（名称、年龄、品种）
  ↓
上传照片
  ↓
[新] 点击"生成AI简历"按钮
  ↓
显示加载动画："AI正在分析小胖的照片..."
  ↓
展示生成结果：
  - 领养文案（可编辑）
  - 性格标签：["活泼", "亲人", "爱玩球"]
  - 建议疫苗计划
  ↓
用户确认发布
```

### 关键交互点
1. **首次体验**：上传后自动触发AI生成，无需手动点击
2. **透明性**：内容不显示"AI生成"标识，用户可编辑
3. **引导性**：生成后显示"完善档案可获得更多曝光"提示
4. **成本提示**：显示"本次AI分析消耗约0.05美元"

---

## 七、成本控制与监控

### AI 成本估算

| 场景 | AI 调用 | 单次成本 | 月预估（100只宠物） |
|------|---------|----------|---------------------|
| 简历生成 | Claude Sonnet 4.6 | $0.03-0.05 | $3-5 |
| 图像分析 | Claude Sonnet Vision | $0.02-0.03 | $2-3 |
| 健康建议 | Claude Haiku 4.5 | $0.005-0.01 | $0.5-1 |
| 日常更新 | Claude Haiku 4.5 | $0.01 | $1 |
| **月总计** | - | - | **$6.5-10** |

### 成本控制策略

```javascript
// backend/config/ai-limits.js

const AI_LIMITS = {
  // 每只宠物每月生成次数限制
  maxGenerationsPerPet: 3,

  // 每日全局预算限制
  dailyBudgetLimit: 5.00, // $5

  // 触发阈值告警
  budgetAlertThreshold: 0.8, // 80%时发送告警

  // 自动降级策略
  fallbackModel: 'claude-haiku-4-5', // 超预算后使用更便宜的模型
};

// 检查预算中间件
async function checkAIBudget(req, res, next) {
  const todaySpend = await getTodayAISpend();
  if (todaySpend >= AI_LIMITS.dailyBudgetLimit) {
    return res.status(429).json({
      error: '今日AI预算已用完，请明天再试',
      fallbackAvailable: true
    });
  }
  next();
}
```

### 监控指标

```javascript
// backend/utils/ai-monitoring.js

// 记录每次 AI 调用
{
  timestamp: '2026-04-02T10:30:00Z',
  agentId: 'uuid',
  operation: 'bio_generation',
  model: 'claude-sonnet-4-6',
  inputTokens: 1200,
  outputTokens: 350,
  cost: 0.042,
  duration: 5200, // ms
  success: true
}
```

### 告警机制
- 日预算超80% → 发送邮件给管理员
- 单次调用超过$0.10 → 标记异常，人工审核
- 失败率超过20% → 自动暂停Agent服务

---

## 八、实施计划

### 开发路线图（4周冲刺）

```
Week 1: 基础架构 + AI 简历生成
├─ Day 1-2: 数据库迁移（pet_agents, health_records, health_reminders）
├─ Day 3-4: Agent API 开发
│   ├─ POST /api/agent/:dogId/generate
│   └─ AI 调用封装（图像分析 + 文案生成）
├─ Day 5: 前端组件 AIPetBioGenerator.jsx
└─ Day 6-7: 集成测试 + 修复 Bug

Week 2: 健康档案模块
├─ Day 1-3: 健康记录 API + 前端组件
│   ├─ POST /api/health/:dogId/records
│   └─ HealthProfile.jsx
├─ Day 4-5: 健康提醒系统
│   ├─ 数据模型 + API
│   └─ HealthReminders.jsx
└─ Day 6-7: AI 健康建议功能

Week 3: Agent 自动化 + 定时任务
├─ Day 1-3: 宠物上传流程集成
│   ├─ 自动创建 Agent
│   └─ 自动生成简历
├─ Day 4-5: 定时任务（每日健康检查）
└─ Day 6-7: 成本监控 + 告警系统

Week 4: 优化 + 上线
├─ Day 1-3: 性能优化（缓存、并发）
├─ Day 4-5: 用户测试 + Bug 修复
├─ Day 6: 文档完善
└─ Day 7: 上线部署
```

### 技术依赖清单

```json
{
  "新增依赖": {
    "backend": [
      "@ai-sdk/anthropic": "^1.0.0",
      "node-cron": "^3.0.3"
    ],
    "frontend": [
      "无新增"
    ]
  },
  "现有依赖": {
    "@supabase/supabase-js": "^2.90.1",
    "express": "^5.2.1",
    "framer-motion": "^12.26.2"
  }
}
```

### 风险与应对

| 风险 | 影响 | 应对方案 |
|------|------|----------|
| AI 成本超预算 | 财务压力 | 设置每日限额 + 自动降级 |
| AI 生成质量不稳定 | 用户体验差 | 提供编辑功能 + 重新生成 |
| 图像分析错误（品种识别错误） | 用户信任度降低 | 标注"AI建议"，用户可修改 |
| 定时任务失败 | 健康提醒失效 | 增加重试机制 + 监控告警 |

---

## 九、成功指标

| 指标 | 目标值 | 衡量方式 |
|------|--------|----------|
| 宠物简历生成率 | >80% 新上传宠物有AI简历 | 数据库统计 |
| 用户编辑率 | <30% 用户修改AI内容 | 日志分析 |
| 领养转化率 | 提升15%（对比无AI简历） | A/B测试 |
| 月度AI成本 | <$10（100只宠物） | 监控面板 |
| 健康提醒触发率 | >90% 按时提醒 | 定时任务日志 |

---

## 十、后续扩展方向

### V2 功能（3-6个月后）
1. **AI 领养顾问**（Agent角色C）
   - 与潜在领养者对话
   - 推荐合适的宠物
   - 回答领养问题

2. **成长记录员**（Agent角色D）
   - 自动分析用户上传的照片
   - 生成成长报告、里程碑事件

3. **跨平台内容分发**
   - 自动生成小红书/抖音文案
   - 社交媒体一键发布

---

**设计完成日期**: 2026-04-02
**预计上线日期**: 2026-04-30
**负责人**: 产品团队 + 技术团队