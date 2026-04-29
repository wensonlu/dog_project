# dog-project MCP 系统架构与工具选择指南

## 一、系统架构

### 1.1 架构总览

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Claude Code IDE                                     │
│                    (运营人员的 AI 助手)                                        │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
                      MCP Protocol (stdio)
                               │
┌──────────────────────────────▼──────────────────────────────────────────────┐
│                                                                              │
│              🔌 dog-project MCP Server (src/index.ts)                       │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  MCP Tool Router - 12个运营工具                                      │  │
│  │                                                                      │  │
│  │  📋 宠物管理 (3个)                                                   │  │
│  │  ├─ list_pets ──────► 列表 + 多维筛选                              │  │
│  │  ├─ get_pet_detail ─► 详情 + 关联统计                            │  │
│  │  └─ search_pets ────► 关键词搜索                                   │  │
│  │                                                                      │  │
│  │  📝 申请审核 (3个)                                                   │  │
│  │  ├─ list_applications ────────► 申请列表                          │  │
│  │  ├─ review_application ───────► 单个审核                         │  │
│  │  └─ batch_review_applications ► 批量审核 (max 20)               │  │
│  │                                                                      │  │
│  │  🔄 状态管理 (1个)                                                   │  │
│  │  └─ batch_update_pet_status ─► 批量更新 (max 50)                │  │
│  │                                                                      │  │
│  │  📊 数据分析 (2个)                                                   │  │
│  │  ├─ generate_operations_report ─► 运营报告 (日/周/月/季)         │  │
│  │  └─ analyze_adoption_patterns ──► 领养规律分析                  │  │
│  │                                                                      │  │
│  │  🚨 异常监控 (1个)                                                   │  │
│  │  └─ get_pending_alerts ─► 待处理异常检测                         │  │
│  │                                                                      │  │
│  │  ❤️  收藏管理 (2个)                                                  │  │
│  │  ├─ list_favorites ────► 收藏列表                                 │  │
│  │  └─ notify_favorite_users ─► 通知收藏用户                        │  │
│  │                                                                      │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                               │                                             │
│          ┌────────────────────┼────────────────────┐                       │
│          │                    │                    │                       │
│      tools/             lib/supabase.ts      types/index.ts              │
│    ├─ pets.ts          (Supabase 客户端)    (数据结构定义)              │
│    ├─ applications.ts                                                   │
│    ├─ status.ts                                                        │
│    ├─ analytics.ts                                                     │
│    ├─ alerts.ts                                                        │
│    └─ favorites.ts                                                     │
│                               │                                             │
└───────────────────────────────┼─────────────────────────────────────────────┘
                                │
                   Supabase Service Role Auth
                                │
┌───────────────────────────────▼─────────────────────────────────────────────┐
│                                                                              │
│         🗄️  Supabase (PostgreSQL 云数据库)                                  │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  表 (Tables)                                                         │  │
│  │  ├─ dogs ──────────────────┐                                        │  │
│  │  │  • id, name, breed      │  ← favorite_count (热度)               │  │
│  │  │  • status, location     │  ← view_count (浏览)                   │  │
│  │  │  • image, age, gender   │  ← application_count (申请)            │  │
│  │  │  • created_at, updated_at                                       │  │
│  │  │  • traits, description                                          │  │
│  │  │                                                                  │  │
│  │  ├─ applications ──────────┐                                        │  │
│  │  │  • id, user_id, dog_id  │                                       │  │
│  │  │  • status (pending/approved/rejected)                           │  │
│  │  │  • full_name, phone, address, housing_type                      │  │
│  │  │  • created_at, reviewed_at, review_comment                      │  │
│  │  │                                                                  │  │
│  │  ├─ favorites ─────────────┐                                        │  │
│  │  │  • id, user_id, dog_id  │  ← 收藏关系表                          │  │
│  │  │  • created_at           │                                       │  │
│  │  │                                                                  │  │
│  │  ├─ profiles ────────────── (用户表)                                │  │
│  │  │  • id, email, full_name, phone, permissions                     │  │
│  │  │                                                                  │  │
│  │  └─ ... (其他表: messages, stories, forum, reviews 等)            │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 核心特点

| 特点 | 说明 |
|------|------|
| **Service Role 认证** | 使用 Supabase Service Role Key，绕过 RLS 限制（不暴露客户端） |
| **无状态调用** | 每个工具独立，MCP Server 无内存状态 |
| **事务原子性** | 批量操作时逐条处理，失败单独记录（不全部回滚） |
| **计算字段** | days_pending、approval_rate 等动态计算，不存储 |
| **数据一致性** | 修改 dogs 表时同步更新计数器（favorite_count、application_count 等） |

---

## 二、四个关键业务流程

### 2.1 流程：查询冷门宠物（运营日常）

**场景**：发现长期未被领养的宠物，需要运营干预

```
运营需求: "帮我找出所有超过 30 天还没被领养的宠物"
                      │
                      ▼
            Claude 理解需求意图
            (待领养天数 >= 30 天)
                      │
                      ▼
      MCP 调用 Tool: list_pets
        参数: {
          status: "available",
          days_pending: 30
        }
                      │
                      ▼
      MCP Server 路由到 tools/pets.ts
          ├─ 计算 days_pending = (now - created_at) / 86400
          ├─ 执行 SQL: SELECT * FROM dogs
          │           WHERE status='available' AND days_pending >= 30
          ├─ 按 created_at 排序（最早的优先）
          └─ 返回结构化数据
                      │
                      ▼
         返回 ListPetsOutput 对象
            {
              pets: [
                {
                  id: 1,
                  name: "团团",
                  breed: "柯基",
                  days_pending: 102,
                  favorite_count: 0,
                  view_count: 0,
                  application_count: 0,
                  status: "available"
                },
                ...
              ],
              total: 27,
              has_more: false
            }
                      │
                      ▼
         Claude 生成运营报告
        "🚨 发现 27 条超 30 天宠物，其中 102 天的有 2 条...
         建议：
         1. 更新宠物信息/图片吸引浏览
         2. 标记为 urgent 状态提高曝光
         3. 推送通知给收藏用户"
```

**关键数据字段**：
- `days_pending`: 从创建到现在的天数（实时计算）
- `favorite_count`: 被收藏的用户数
- `view_count`: 被浏览过的次数
- `application_count`: 收到的申请数

---

### 2.2 流程：批量审核申请（快速决策）

**场景**：运营一次性审批多个领养申请

```
运营需求: "批准申请 ID 为 1,2,3,4,5 的领养申请"
                      │
                      ▼
            Claude 理解需求意图
            (5个 ID，全部批准)
                      │
                      ▼
    MCP 调用 Tool: batch_review_applications
        参数: {
          application_ids: ["1","2","3","4","5"],
          action: "approve",
          comment: "符合条件"
        }
                      │
                      ▼
    MCP Server 路由到 tools/applications.ts
        ├─ 对每条 application 执行：
        │  ├─ UPDATE applications 
        │  │  SET status='approved',
        │  │      reviewed_at=NOW(),
        │  │      reviewer_id=SERVICE_ROLE_ID,
        │  │      review_comment='符合条件'
        │  │  WHERE id=X
        │  │
        │  └─ UPDATE dogs
        │     SET application_count = application_count + 1
        │     WHERE id = (SELECT dog_id FROM applications WHERE id=X)
        │
        └─ 记录每条操作结果
                      │
                      ▼
      返回 BatchOperationResult 对象
        {
          success_count: 5,
          failed_count: 0,
          results: [
            { id: "1", success: true },
            { id: "2", success: true },
            { id: "3", success: true },
            { id: "4", success: true },
            { id: "5", success: true }
          ]
        }
                      │
                      ▼
         Claude 确认结果
        "✅ 已批准 5 条申请，全部成功处理"
```

**特点**：
- 最多支持 20 个 ID（防止超时）
- 逐条处理，失败不影响其他
- 自动记录审核人 ID 和时间

---

### 2.3 流程：实时数据分析（运营洞察）

**场景**：生成运营数据报告，发现趋势

```
运营需求: "生成本周运营报告"
                      │
                      ▼
            Claude 理解需求意图
            (week = 最近 7 天)
                      │
                      ▼
    MCP 调用 Tool: generate_operations_report
        参数: {
          period: "week",
          include_trends: true
        }
                      │
                      ▼
    MCP Server 路由到 tools/analytics.ts
        ├─ 计算时间范围
        │  start = NOW() - 7 days
        │  end = NOW()
        │
        ├─ 执行多个 JOIN 查询：
        │  ├─ SELECT COUNT(*) FROM dogs WHERE created_at >= start
        │  ├─ SELECT COUNT(*) FROM applications WHERE status='pending'
        │  ├─ SELECT COUNT(*) FROM applications WHERE status='approved'
        │  ├─ SELECT breed, COUNT(*) FROM dogs 
        │  │  GROUP BY breed ORDER BY COUNT DESC
        │  ├─ SELECT location, COUNT(*) FROM dogs
        │  │  GROUP BY location ORDER BY COUNT DESC
        │  └─ SELECT AVG(reviewed_at - created_at) FROM applications
        │     WHERE reviewed_at IS NOT NULL
        │
        └─ 聚合计算
           ├─ adoption_rate = approved_count / total_applications
           └─ avg_processing_days = 平均审核时间
                      │
                      ▼
      返回 OperationsReport 对象
        {
          period: {
            start: "2026-04-22T00:00:00Z",
            end: "2026-04-29T23:59:59Z"
          },
          summary: {
            total_pets: 28,
            new_pets: 5,
            total_applications: 10,
            pending_applications: 0,
            approved_applications: 8,
            rejected_applications: 2,
            adoption_rate: 0.8,
            avg_processing_days: 3.5
          },
          top_breeds: [
            { breed: "柯基", count: 8 },
            { breed: "金毛", count: 6 }
          ],
          top_regions: [
            { region: "北京", count: 15 },
            { region: "上海", count: 13 }
          ],
          urgent_pets: 3,
          long_pending_pets: 27
        }
                      │
                      ▼
         Claude 生成洞察报告
        "📊 本周数据总结：
         • 新增 5 条宠物，柯基最受欢迎
         • 审核了 10 条申请，通过率 80%
         • 平均审核时间 3.5 天
         • 北京地区领养最活跃
         ⚠️  27 条宠物超 30 天未被领养（高风险）"
```

**关键指标**：
- `adoption_rate`: 领养通过率（批准 / 总申请）
- `avg_processing_days`: 平均审核处理时间
- `top_breeds`: 最受欢迎的品种
- `urgent_pets`: 急需领养的宠物数

---

### 2.4 流程：异常告警（主动监控）

**场景**：发现平台异常，立即提醒运营

```
运营需求: "有什么需要我注意的吗？"
                      │
                      ▼
            Claude 主动调用告警工具
            (定期检查平台健康状况)
                      │
                      ▼
    MCP 调用 Tool: get_pending_alerts
        参数: {
          alert_type: "long_pending",
          threshold_days: 30
        }
                      │
                      ▼
    MCP Server 路由到 tools/alerts.ts
        ├─ 检测多个异常维度：
        │  ├─ long_pending:
        │  │  SELECT * FROM dogs
        │  │  WHERE days_pending > 30
        │  │  ORDER BY days_pending DESC
        │  │
        │  ├─ low_stock:
        │  │  SELECT COUNT(*) FROM dogs
        │  │  WHERE status='available'
        │  │  HAVING COUNT < 10
        │  │
        │  └─ rejection_spike:
        │     SELECT COUNT(*) FROM applications
        │     WHERE status='rejected'
        │     AND created_at >= NOW() - 7 days
        │     HAVING COUNT > historical_avg * 1.5
        │
        └─ 计算优先级
           ├─ high: 超 30 天的宠物 > 20 条
           ├─ medium: 待处理申请 > 50 条
           └─ low: 其他
                      │
                      ▼
      返回 GetAlertsOutput 对象
        {
          alerts: [
            {
              type: "long_pending",
              count: 27,
              urgency: "high",
              detail: [
                { id: 1, name: "团团", days: 102, created_at: "2026-02-16" },
                { id: 2, name: "小胖", days: 102, created_at: "2026-02-16" }
              ]
            },
            {
              type: "low_stock",
              count: 1,
              urgency: "high",
              detail: [
                { count: 8, note: "仅 8 条可领养宠物" }
              ]
            }
          ],
          total_alerts: 2
        }
                      │
                      ▼
         Claude 生成告警
        "🚨 发现 2 个高优先级异常：
         
         1️⃣  长期待领养 (高风险)
         • 27 条宠物超 30 天未被领养
         • 最严重：团团和小胖都 102 天了
         • 建议：紧急推广这些宠物
         
         2️⃣  库存不足 (高风险)
         • 仅 8 条可领养宠物
         • 建议：加速宠物上架流程"
```

**告警类型及优先级**：
| 告警类型 | 触发条件 | 优先级 |
|--------|--------|------|
| `long_pending` | 宠物待领养天数 > threshold | 根据数量判断 |
| `low_stock` | 可领养宠物 < 10 条 | HIGH |
| `rejection_spike` | 拒绝率超过历史平均 1.5 倍 | HIGH |

---

## 三、工具选择决策机制

### 3.1 Claude 如何选择工具

Claude 通过以下步骤选择正确的工具：

```
用户问题
    │
    ▼
1️⃣  语义理解
    ├─ 提取关键词：查询 / 筛选 / 审核 / 批量 / 分析
    ├─ 识别实体：宠物 / 申请 / 收藏 / 品种 / 状态
    └─ 理解意图：统计 / 决策 / 监控 / 预警

    ▼
2️⃣  工具匹配
    ├─ 查询工具库的 description（12个工具的说明文本）
    ├─ 对比 inputSchema（需要哪些参数）
    └─ 计算相似度（哪个工具最适配）

    ▼
3️⃣  参数提取
    ├─ 从用户问题中提取参数
    ├─ 参数验证（如 status 是否是枚举值）
    └─ 参数填充（缺失的用默认值）

    ▼
4️⃣  工具调用
    └─ 执行 MCP Tool
        │
        ▼
5️⃣  结果解释
    ├─ 解析返回的 JSON
    ├─ 生成人类可读的报告
    └─ 提供决策建议
```

### 3.2 决策树：快速查询指南

```
问题类型分析
│
├─ 📋 "我要查..." / "帮我看..." / "列出..."
│  │
│  ├─ 单个宠物 + ID/名字
│  │  └─► get_pet_detail (按 ID)
│  │  └─► search_pets (按名字/关键词)
│  │
│  ├─ 多个宠物 + 筛选条件
│  │  条件: 品种 / 地区 / 状态 / 待领养天数
│  │  └─► list_pets
│  │
│  └─ 关键词模糊搜索
│     └─► search_pets
│
├─ 📝 "申请..." / "未处理..." / "审核..."
│  │
│  ├─ 单个申请 + ID
│  │  动作: 批准 / 拒绝
│  │  └─► review_application
│  │
│  ├─ 批量申请 (1-20个)
│  │  └─► batch_review_applications
│  │
│  └─ 查申请列表 + 筛选
│     条件: 状态 / 宠物 / 申请人 / 天数
│     └─► list_applications
│
├─ 🔄 "标记..." / "更新..." / "改状态..."
│  │
│  └─ 批量宠物 (1-50个)
│     新状态: available / adopted / pending / urgent
│     └─► batch_update_pet_status
│
├─ 📊 "报告..." / "数据..." / "统计..."
│  │
│  ├─ 运营数据汇总
│     维度: 日 / 周 / 月 / 季度
│     └─► generate_operations_report
│  │
│  └─ 领养规律洞察
│     维度: 按宠物 / 按地区 / 按品种
│     └─► analyze_adoption_patterns
│
├─ 🚨 "异常..." / "需要..." / "告警..."
│  │
│  └─ 平台健康检查
│     异常类型: 长期待领养 / 低库存 / 拒绝率尖峰
│     └─► get_pending_alerts
│
└─ ❤️  "收藏..." / "通知..."
   │
   ├─ 查收藏列表
   │  └─► list_favorites
   │
   └─ 通知收藏用户
      └─► notify_favorite_users
```

### 3.3 实际例子：5 个问题的工具映射

| # | 运营问题 | Claude 的推理 | 选择的工具 | 参数 |
|---|---------|-------------|----------|------|
| 1 | "帮我查一下叫 '团团' 的狗" | 看到 "查" + "名字" → 关键词搜索 | `search_pets` | keyword="团团" |
| 2 | "所有超过 30 天还没被领养的" | "待领养天数" 条件 + "列表" → 多维筛选 | `list_pets` | status="available", days_pending=30 |
| 3 | "把这 5 条宠物标记为 urgent" | "批量" + "标记状态" → 状态更新 | `batch_update_pet_status` | pet_ids=[...], status="urgent" |
| 4 | "有多少待审核的申请" | "待审核" + "申请" → 申请列表 | `list_applications` | status="pending" |
| 5 | "批准这 10 条申请" | "批准" + 数量多 → 批量审核 | `batch_review_applications` | action="approve", application_ids=[...] |

### 3.4 模糊情况处理

当问题信息不足时，Claude 会主动提问：

```
运营: "帮我分析一下最近的数据"

Claude 的思考:
❓ "最近" 是什么意思？
  ✓ 今天?
  ✓ 本周?
  ✓ 本月?
  ✓ 本季度?

Claude 会反问:
"你想要哪个时间段的分析数据? 
 (今天/本周/本月/本季度)"

用户回答: "本周"

Claude 确认后调用:
generate_operations_report(period="week")
```

---

## 四、工具 Description 设计原则

**好的 description 是 Claude 正确选择工具的关键。**

### 4.1 Description 结构

```javascript
{
  name: "工具名",
  description: "简洁说明(做什么) + 支持的筛选条件(怎么做) + 使用场景(什么时候用)",
  inputSchema: { /* 参数定义 */ }
}
```

### 4.2 反面例子 ❌

```javascript
// 太模糊，Claude 不知道怎么用
{
  name: "list_pets",
  description: "Get pets"
}

// 信息不完整，Claude 选不对
{
  name: "list_pets",
  description: "列出宠物"
  // ❌ 没说支持什么筛选条件
}
```

### 4.3 正面例子 ✅

```javascript
// 清晰的 description
{
  name: "list_pets",
  description: "列出宠物列表，支持多维筛选（品种、地区、状态等）",
  // ✅ 说明功能 + 支持的筛选条件
  // ✅ Claude 知道什么时候用这个工具
}

// 更详细的 description
{
  name: "batch_review_applications",
  description: "批量审核申请，最多 20 个。用于一次性处理多个待审核的领养申请",
  // ✅ 说明功能 + 限制条件 + 使用场景
}
```

---

## 五、集成指南

### 5.1 启动 MCP Server

```bash
cd dog-project-mcp
pnpm install
pnpm dev
```

### 5.2 配置 Claude Code

在 `~/.claude/mcp.json` 中：

```json
{
  "mcpServers": {
    "dog-project": {
      "type": "stdio",
      "command": "npx",
      "args": ["tsx", "dog-project-mcp/src/index.ts"]
    }
  }
}
```

### 5.3 使用示例

```
运营: 帮我统计一下本周的运营数据

Claude 自动调用:
generate_operations_report(period="week")

返回:
{
  summary: {
    total_pets: 28,
    new_pets: 5,
    adoption_rate: 0.8,
    ...
  }
}

Claude 生成报告:
"本周表现良好，新增 5 条宠物，领养通过率 80%..."
```

---

## 六、故障排查

### 6.1 工具调用失败

| 症状 | 原因 | 解决方案 |
|------|------|--------|
| "Unknown tool: xxx" | 工具名错误 | 检查 src/index.ts 的 tools 数组中的 name |
| "Supabase client not initialized" | 环境变量缺失 | 检查 .env 中的 SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY |
| 返回空数组 [] | 数据库无匹配数据 | 验证查询条件是否正确 |
| 参数验证失败 | 参数类型错误 | 检查 inputSchema 定义和实际参数是否匹配 |

### 6.2 数据一致性问题

如果 `favorite_count` 和实际 favorites 表记录数不一致：

```bash
# 重建计数
npm run fix-favorite-counts

# 或手动执行 SQL
UPDATE dogs SET favorite_count = (
  SELECT COUNT(*) FROM favorites WHERE favorites.dog_id = dogs.id
)
```

---

## 七、扩展新工具指南

### 7.1 步骤

1. **在 `src/types/index.ts` 中定义类型**
   ```typescript
   export interface NewToolInput {
     param1: string;
     param2?: number;
   }
   ```

2. **在 `src/tools/` 中创建实现文件**
   ```typescript
   // src/tools/newtool.ts
   export async function myNewTool(input: NewToolInput) {
     const client = supabase.client;
     // 实现逻辑
     return result;
   }
   ```

3. **在 `src/index.ts` 中注册工具**
   ```typescript
   import { myNewTool } from "./tools/newtool.js";

   const tools = [
     ...existing_tools,
     {
       name: "my_new_tool",
       description: "清晰的功能描述",
       inputSchema: { /* 定义参数 */ }
     }
   ];

   case "my_new_tool":
     result = await myNewTool(args);
     break;
   ```

---

## 八、性能优化

### 8.1 查询优化

- 使用 `limit` 防止大数据查询
- 避免 `SELECT *`，只查需要的字段
- 使用索引加速筛选（status, created_at, days_pending）

### 8.2 批量操作优化

- 批量申请审核最多 20 个
- 批量宠物状态更新最多 50 个
- 使用事务保证一致性（如可能）

---

## 九、关键数据模型

### 9.1 Dogs 表

```sql
CREATE TABLE dogs (
  id BIGINT PRIMARY KEY,
  name VARCHAR NOT NULL,
  breed VARCHAR,
  status VARCHAR (available|adopted|pending|urgent),
  favorite_count INTEGER DEFAULT 0,        -- 被收藏的用户数
  view_count INTEGER DEFAULT 0,            -- 被浏览过的次数
  application_count INTEGER DEFAULT 0,     -- 收到的申请数
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### 9.2 Applications 表

```sql
CREATE TABLE applications (
  id BIGINT PRIMARY KEY,
  dog_id BIGINT REFERENCES dogs(id),
  user_id VARCHAR NOT NULL,
  status VARCHAR (pending|approved|rejected),
  created_at TIMESTAMP,
  reviewed_at TIMESTAMP,          -- 审核时间
  reviewer_id VARCHAR,             -- 审核人 ID
  review_comment TEXT              -- 审核意见
);
```

### 9.3 Favorites 表

```sql
CREATE TABLE favorites (
  id BIGINT PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  dog_id BIGINT REFERENCES dogs(id),
  created_at TIMESTAMP
);
```

---

## 总结

**MCP 的价值**：将复杂的平台运营工作转化为对话式交互

```
传统方式:        运营员 → 登录后台管理系统 → 点击按钮 → 导出报告
MCP 方式:        运营员 → 对话 Claude → 实时报告 → 决策建议
```

**核心优势**：
1. ✅ 降低使用门槛（对话 vs 按钮）
2. ✅ 提高工作效率（一句话调用 vs 多步点击）
3. ✅ 获得智能分析（Claude 自动提供建议）
4. ✅ 支持批量操作（一次处理多个数据）
