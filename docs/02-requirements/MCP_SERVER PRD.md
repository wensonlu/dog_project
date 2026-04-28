# dog-project MCP Server 需求文档

> 面向 Claude Code 的运营工具 MCP，让 AI 成为平台运营助理

**状态：** 设计中
**版本：** 1.0
**最后更新：** 2026-04-28

---

## 1. 背景与目标

### 1.1 背景

dog_project 是一个宠物领养平台，核心功能包括：卡片式浏览宠物、收藏、提交领养申请、管理后台审核。

运营痛点：
- 数据查询需要登录 Supabase 面板跑 SQL
- 批量操作逐个手动执行，效率低
- 异常发现依赖人工，无法主动提醒
- 运营报告靠手动导出和分析

### 1.2 目标

构建一个面向 Claude Code 的 MCP Server，把平台运营能力透传给 AI，让运营人员用自然语言完成日常运营操作。

### 1.3 核心价值

| 运营场景 | 现状 | MCP 后的体验 |
|---------|------|-------------|
| 查数据 | 登录 Supabase 面板跑 SQL | "最近有哪些待审核申请？" |
| 批量操作 | 一个个改 | "把这批标记为急需领养" |
| 生成报告 | 手动导出跑脚本 | "生成本周运营摘要" |
| 发现异常 | 等人工发现 | "自动提醒超30天未审核的申请" |

---

## 2. MCP 设计理念

### 2.1 什么是 MCP

MCP（Model Context Protocol）是一个开放协议，标准化的 AI 与外部工具/数据源的连接方式。

类比：就像 USB-C 让设备互联，MCP 让 AI Agent 互联各种工具和数据。

### 2.2 dog-project MCP 的定位

```
Claude Code（AI 运营助理）
    ↓
dog-project MCP（运营能力接口）
    ↓
Express Backend + Supabase（业务数据层）
```

不是给普通用户用的，是给**平台运营人员**用的 AI 工具。

### 2.3 设计原则

1. **语义优先**：Tool 名称和描述要让 AI 理解业务含义
2. **可验证**：每次操作都有明确的成功/失败返回
3. **可组合**：多个 Tool 可以组合完成复杂任务
4. **有审计**：关键操作记录操作人和时间

---

## 3. Tool 定义

### 3.1 数据查询类

#### `list_pets` — 列出宠物

**输入参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `status` | string | 否 | `available` \| `adopted` \| `pending` \| `urgent` |
| `breed` | string | 否 | 品种（模糊匹配） |
| `region` | string | 否 | 地区 |
| `days_pending` | number | 否 | 待领养天数 >= N |
| `sort_by` | string | 否 | `created_at` \| `updated_at` \| `view_count` |
| `sort_order` | string | 否 | `asc` \| `desc`，默认 `desc` |
| `limit` | number | 否 | 默认 20，最大 100 |
| `offset` | number | 否 | 分页偏移 |

**输出：**

```typescript
{
  pets: Array<{
    id: string;
    name: string;
    breed: string;
    age: string;
    region: string;
    status: string;
    image_url: string;
    view_count: number;
    created_at: string;
    days_pending: number;  // 计算字段
  }>;
  total: number;
  has_more: boolean;
}
```

---

#### `get_pet_detail` — 宠物详情

**输入参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `pet_id` | string | 是 | 宠物 ID |

**输出：**

```typescript
{
  id: string;
  name: string;
  breed: string;
  age: string;
  gender: string;
  region: string;
  size: string;
  description: string;
  image_url: string;
  status: string;
  view_count: number;
  favorite_count: number;
  application_count: number;
  created_at: string;
  updated_at: string;
}
```

---

#### `search_pets` — 搜索宠物

**输入参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `keyword` | string | 是 | 搜索关键词 |
| `status` | string | 否 | 状态筛选 |
| `limit` | number | 否 | 默认 20 |

**输出：** 同 `list_pets`

---

### 3.2 申请管理类

#### `list_applications` — 申请列表

**输入参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `status` | string | 否 | `pending` \| `approved` \| `rejected` |
| `pet_id` | string | 否 | 按宠物筛选 |
| `applicant_id` | string | 否 | 按申请人筛选 |
| `days_pending` | number | 否 | 超过 N 天未处理 |
| `limit` | number | 否 | 默认 20 |
| `offset` | number | 否 | 分页偏移 |

**输出：**

```typescript
{
  applications: Array<{
    id: string;
    pet_id: string;
    pet_name: string;
    applicant_id: string;
    applicant_name: string;
    applicant_email: string;
    status: "pending" | "approved" | "rejected";
    reason: string;
    reviewer_id?: string;
    reviewer_name?: string;
    reviewed_at?: string;
    review_comment?: string;
    created_at: string;
    days_pending: number;
  }>;
  total: number;
}
```

---

#### `review_application` — 审核申请

**输入参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `application_id` | string | 是 | 申请 ID |
| `action` | string | 是 | `approve` \| `reject` |
| `comment` | string | 否 | 审核意见 |

**副作用：**
- `approve`：更新宠物状态为 `adopted`，发送通知
- `reject`：记录审核意见

**输出：**

```typescript
{
  success: boolean;
  application_id: string;
  new_status: "approved" | "rejected";
  reviewed_at: string;
}
```

---

#### `batch_review_applications` — 批量审核

**输入参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `application_ids` | string[] | 是 | 申请 ID 列表，最多 20 个 |
| `action` | string | 是 | `approve` \| `reject` |
| `comment` | string | 否 | 审核意见 |

**输出：**

```typescript
{
  success_count: number;
  failed_count: number;
  results: Array<{
    application_id: string;
    success: boolean;
    error?: string;
  }>;
}
```

---

### 3.3 宠物状态管理

#### `update_pet_status` — 更新宠物状态

**输入参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `pet_id` | string | 是 | 宠物 ID |
| `status` | string | 是 | 新状态 |
| `reason` | string | 否 | 更新原因 |

---

#### `batch_update_pet_status` — 批量更新状态

**输入参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `pet_ids` | string[] | 是 | 宠物 ID 列表，最多 50 个 |
| `status` | string | 是 | 新状态 |
| `condition` | string | 否 | 触发条件（用于审计） |

**示例 condition：**
- "待领养超过 60 天"
- "被收藏超过 20 次"
- "紧急医疗情况"

**输出：**

```typescript
{
  success_count: number;
  failed_count: number;
  results: Array<{
    pet_id: string;
    success: boolean;
    error?: string;
  }>;
}
```

---

### 3.4 数据分析与洞察

#### `generate_operations_report` — 生成运营报告

**输入参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `period` | string | 是 | `today` \| `week` \| `month` \| `quarter` |
| `include_trends` | boolean | 否 | 是否包含趋势对比 |

**输出：**

```typescript
{
  period: { start: string; end: string };
  summary: {
    total_pets: number;
    new_pets: number;
    total_applications: number;
    pending_applications: number;
    approved_applications: number;
    rejected_applications: number;
    adoption_rate: number;
    avg_processing_days: number;
  };
  top_breeds: Array<{ breed: string; count: number }>;
  top_regions: Array<{ region: string; count: number }>;
  urgent_pets: number;
  long_pending_pets: number;
  trends?: {
    adoption_rate_change: number;
    application_volume_change: number;
  };
}
```

---

#### `analyze_adoption_patterns` — 分析领养规律

**输入参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `pet_id` | string | 否 | 单宠物分析 |
| `region` | string | 否 | 区域分析 |
| `days` | number | 否 | 分析天数，默认 90 |

**输出：**

```typescript
{
  analysis_type: "pet" | "region" | "platform";
  insights: Array<{
    type: "positive" | "negative" | "opportunity";
    title: string;
    description: string;
    recommendation?: string;
  }>;
  stats: {
    avg_days_to_adoption: number;
    approval_rate: number;
    top_factors: string[];
  };
}
```

---

### 3.5 异常检测

#### `get_pending_alerts` — 获取异常提醒

**输入参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `alert_type` | string | 否 | `long_pending` \| `low_stock` \| `rejection_spike` |
| `threshold_days` | number | 否 | 超 N 天未处理，默认 30 |

**输出：**

```typescript
{
  alerts: Array<{
    type: "long_pending_application" | "long_pending_pet" | "urgent_pet";
    count: number;
    detail: Array<{
      id: string;
      name: string;
      days: number;
      submitted_at?: string;
      created_at?: string;
    }>;
    urgency: "low" | "medium" | "high";
  }>;
  total_alerts: number;
}
```

---

### 3.6 收藏管理

#### `list_favorites` — 收藏列表

**输入参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `user_id` | string | 否 | 不填则查当前用户 |
| `pet_status` | string | 否 | 按宠物状态筛选 |
| `limit` | number | 否 | 默认 20 |

**输出：**

```typescript
{
  favorites: Array<{
    pet_id: string;
    pet_name: string;
    pet_image: string;
    pet_status: string;
    favorited_at: string;
    pet_updated_at: string;
  }>;
  total: number;
}
```

---

#### `notify_favorite_users` — 通知收藏用户

**输入参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `pet_id` | string | 是 | 宠物 ID |
| `message` | string | 是 | 通知内容 |

**输出：**

```typescript
{
  success_count: number;
  failed_count: number;
  notified_users: string[];
}
```

---

## 4. 技术架构

### 4.1 整体架构

```
Claude Code
    ↓ MCP (stdio / Streamable HTTP)
dog-project-mcp-server
    ↓ REST API
Express Backend (localhost:5001)
    ↓ Supabase Client
Supabase (PostgreSQL)
```

### 4.2 目录结构

```
dog-project-mcp/
├── src/
│   ├── index.ts              # 入口，Server 定义
│   ├── tools/
│   │   ├── pets.ts          # list_pets, get_pet_detail, search_pets
│   │   ├── applications.ts   # list_applications, review_application, batch_review
│   │   ├── status.ts        # update_pet_status, batch_update_pet_status
│   │   ├── analytics.ts     # generate_operations_report, analyze_adoption_patterns
│   │   ├── alerts.ts        # get_pending_alerts
│   │   └── favorites.ts     # list_favorites, notify_favorite_users
│   ├── lib/
│   │   ├── supabase.ts      # Supabase 客户端
│   │   ├── auth.ts          # 认证相关
│   │   └── utils.ts         # 工具函数（日期计算等）
│   └── types/
│       └── index.ts         # 类型定义
├── package.json
├── tsconfig.json
└── README.md
```

### 4.3 Transport 设计

| Transport | 适用场景 | 配置 |
|-----------|---------|------|
| stdio | 本地开发调试 | 默认 |
| Streamable HTTP | 远程部署生产 | 部署到 Vercel/Railway |

### 4.4 认证设计

**运营 MCP 使用 Service Role Key：**
- 环境变量持有 `SUPABASE_SERVICE_ROLE_KEY`
- 所有操作以服务身份执行
- 适合单一运营团队场景

**扩展预留（未来支持用户级操作）：**
- 调用时传入用户 JWT token
- Server 验证后以用户身份执行
- 区分普通用户 vs 管理员操作

### 4.5 依赖

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.5.0",
    "@supabase/supabase-js": "^2.39.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "tsx": "^4.7.0",
    "@types/node": "^20.11.0"
  }
}
```

---

## 5. 实现计划

### Phase 1 — MVP（跑通核心链路）

1. 项目初始化，配置 Supabase 客户端
2. 实现 `list_pets` + `get_pet_detail`
3. 实现 `search_pets`
4. 实现 `list_applications` + `review_application`
5. 实现 `generate_operations_report`
6. 接入 Claude Code 测试

### Phase 2 — 批量运营

7. 实现 `batch_review_applications`
8. 实现 `batch_update_pet_status`
9. 实现 `get_pending_alerts`

### Phase 3 — 智能洞察

10. 实现 `analyze_adoption_patterns`
11. 实现 `notify_favorite_users`
12. 实现 `list_favorites`

---

## 6. 接入方式

### 6.1 Claude Code 接入

```bash
# 在 dog_project 目录下
claude mcp add --transport stdio dog-project-mcp -- npx tsx path/to/dog-project-mcp/src/index.ts
```

### 6.2 使用示例

```
用户：最近有哪些超过30天没处理的申请？
Claude → MCP → list_applications(days_pending=30)
     ← 返回列表
Claude：发现有 5 个，我来批量处理它们。
     → batch_review_applications(ids, action="approve")
```

---

## 7. 附录

### 7.1 数据库表关联

```
profiles (用户)
    ↓
applications (申请) ← FK pet_id → dogs
favorites (收藏)   ← FK pet_id → dogs
dogs (宠物)
```

### 7.2 状态枚举

| 实体 | 状态值 |
|------|--------|
| 宠物 | `available`, `adopted`, `pending`, `urgent` |
| 申请 | `pending`, `approved`, `rejected` |

### 7.3 参考资料

- [MCP 官方文档](https://modelcontextprotocol.io)
- [Supabase JS 客户端](https://supabase.com/docs/reference/javascript/introduction)
- [Vercel MCP 设计实践](https://vercel.com/blog/building-efficient-mcp-servers)
