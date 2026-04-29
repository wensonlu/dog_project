# MCP 工具选择决策指南

**快速参考：当运营人员有一个具体问题时，MCP 怎么知道用哪个工具？**

---

## 一、核心原理

Claude 通过三个步骤自动选择工具：

```
用户问题 → 语义理解（提取关键词） → 工具库匹配（description 相似度） → 参数提取 → 工具调用
```

关键是 **工具的 description（描述）**，它告诉 Claude：
- 这个工具做什么
- 支持什么筛选条件
- 什么时候使用它

---

## 二、工具快速查询表

### 按问题类型快速定位

| 问题关键词 | 对应动作 | 使用工具 | 参数示例 |
|----------|--------|--------|--------|
| **查、看、列出** | 查询宠物列表 | `list_pets` | `{ status: "available" }` |
| 查名字、搜索 | 关键词搜索 | `search_pets` | `{ keyword: "团团" }` |
| 查单个、详情 | 获取详情 | `get_pet_detail` | `{ pet_id: "1" }` |
| **申请、审核** | 查申请列表 | `list_applications` | `{ status: "pending" }` |
| 批准、拒绝 (单个) | 单个审核 | `review_application` | `{ application_id: "1", action: "approve" }` |
| 批准、拒绝 (批量) | 批量审核 | `batch_review_applications` | `{ application_ids: [...], action: "approve" }` |
| **标记、更新、改状态** | 批量更新状态 | `batch_update_pet_status` | `{ pet_ids: [...], status: "urgent" }` |
| **报告、数据、统计** | 运营报告 | `generate_operations_report` | `{ period: "week" }` |
| 分析、规律、趋势 | 领养分析 | `analyze_adoption_patterns` | `{ days: 90 }` |
| **异常、告警、需要注意** | 异常检测 | `get_pending_alerts` | `{ alert_type: "long_pending" }` |
| **收藏、通知** | 查收藏 | `list_favorites` | `{ user_id: "xxx" }` |
| 通知用户 | 推送通知 | `notify_favorite_users` | `{ pet_id: "1", message: "xxx" }` |

---

## 三、决策树

```
问题来了
│
├─ 包含"查"、"看"、"列出"、"有多少"?
│  │
│  ├─ "单个" + 宠物 ID/名字?
│  │  └─► search_pets (名字) 或 get_pet_detail (ID)
│  │
│  ├─ "列表" + 筛选条件 (品种/地区/状态/天数)?
│  │  └─► list_pets
│  │
│  └─ "申请" + 筛选条件?
│     └─► list_applications
│
├─ 包含"批准"、"拒绝"、"审核"?
│  │
│  ├─ "1个" + ID?
│  │  └─► review_application
│  │
│  └─ "多个" + ID列表?
│     └─► batch_review_applications
│
├─ 包含"标记"、"更新"、"改"、"设为"?
│  │
│  └─► batch_update_pet_status
│
├─ 包含"报告"、"数据"、"统计"、"多少"?
│  │
│  ├─ 时间维度 (日/周/月/季度)?
│  │  └─► generate_operations_report
│  │
│  └─ 规律、趋势、分析?
│     └─► analyze_adoption_patterns
│
├─ 包含"异常"、"告警"、"需要注意"、"问题"?
│  │
│  └─► get_pending_alerts
│
└─ 包含"收藏"、"通知"?
   │
   ├─ "查收藏"?
   │  └─► list_favorites
   │
   └─ "通知用户"?
      └─► notify_favorite_users
```

---

## 四、15 个实际问题 → 工具映射

### 宠物查询类

| # | 运营问题 | 工具 | 参数 | 说明 |
|----|--------|------|------|-----|
| 1 | 帮我查一下叫"团团"的狗 | `search_pets` | `keyword="团团"` | 按名字搜索 |
| 2 | "团团"的详细信息怎么样 | `get_pet_detail` | `pet_id=1` | 按 ID 查详情 |
| 3 | 所有待领养的柯基有多少 | `list_pets` | `status="available", breed="柯基"` | 按状态和品种筛选 |
| 4 | 所有超过 30 天还没被领养的 | `list_pets` | `days_pending=30` | 按待领养天数筛选 |
| 5 | 上海的宠物都有哪些 | `list_pets` | `region="上海"` | 按地区筛选 |

### 申请审核类

| # | 运营问题 | 工具 | 参数 | 说明 |
|----|--------|------|------|-----|
| 6 | 有多少待审核的申请 | `list_applications` | `status="pending"` | 查待审核申请 |
| 7 | 批准申请 ID 为 123 | `review_application` | `application_id=123, action="approve"` | 单个审核 |
| 8 | 批准这 10 条申请 | `batch_review_applications` | `application_ids=[...], action="approve"` | 批量审核 |
| 9 | 拒绝超过 7 天未处理的申请 | `list_applications` | `days_pending=7` | 先查，再手动拒绝 |
| 10 | "团团"收到了多少申请 | `list_applications` | `pet_id=1` | 按宠物查申请 |

### 状态管理类

| # | 运营问题 | 工具 | 参数 | 说明 |
|----|--------|------|------|-----|
| 11 | 把这 5 条宠物标记为 urgent | `batch_update_pet_status` | `pet_ids=[...], status="urgent"` | 批量更新状态 |
| 12 | 把待领养超 60 天的都标记为 urgent | 先 `list_pets` 再 `batch_update_pet_status` | `days_pending=60` → `status="urgent"` | 两步流程 |

### 数据分析类

| # | 运营问题 | 工具 | 参数 | 说明 |
|----|--------|------|------|-----|
| 13 | 生成本周运营报告 | `generate_operations_report` | `period="week"` | 日/周/月/季 |
| 14 | 分析一下北京的领养规律 | `analyze_adoption_patterns` | `region="北京"` | 按地区分析 |
| 15 | 有什么需要我注意的 | `get_pending_alerts` | `alert_type="long_pending"` | 异常检测 |

---

## 五、Claude 如何匹配工具

### 5.1 匹配过程

```
用户: "帮我找出最受欢迎的宠物品种"
                    │
                    ▼
Claude 的理解:
  关键词: "找"、"最受欢迎"、"品种"
  意图: 统计 → 排序 → 返回最高的
  
                    ▼
查询工具库 (12个工具的 description):

  ❌ search_pets
     description: "关键词搜索宠物（名称、品种、描述）"
     不能统计品种聚合

  ❌ list_pets
     description: "列出宠物列表，支持多维筛选（品种、地区、状态等）"
     能列举但不能直接排序

  ✅ generate_operations_report
     description: "生成平台运营报告..."
     top_breeds: [{ breed: "...", count: ... }]
     → 包含品种统计!

  ✅ analyze_adoption_patterns
     description: "分析领养规律，给出洞察和建议"
     → 也包含分析数据

                    ▼
决策: 优先使用 generate_operations_report
  (因为直接返回 top_breeds，无需二次处理)
  
                    ▼
参数提取:
  period: "month" (用户说"最近"，默认过去30天)
  
                    ▼
调用: generate_operations_report(period="month")

                    ▼
返回:
  {
    top_breeds: [
      { breed: "柯基", count: 8 },
      { breed: "金毛", count: 6 },
      { breed: "萨摩耶", count: 4 }
    ]
  }
  
                    ▼
Claude 生成报告:
  "柯基是最受欢迎的品种，有 8 条待领养"
```

### 5.2 错误选择及纠正

```
场景: 用户说 "所有活跃的申请"

❌ Claude 可能误解:
   → 查询 list_applications(status="active")
   ✗ 但 applications 表没有 "active" 状态

✅ Claude 应该纠正:
   → 询问用户: "活跃申请是指待审核 (pending)、已批准 (approved) 还是其他？"
   → 收到答复后调用正确的工具
   → list_applications(status="pending")
```

---

## 六、Description 设计要点

### 6.1 好的 Description 特征

✅ **清晰的功能说明**
```
"列出宠物列表，支持多维筛选（品种、地区、状态等）"
```
- 说明做什么（列表）
- 说明怎么做（多维筛选）
- 举例说明支持的条件（品种、地区、状态）

✅ **包含使用场景**
```
"批量审核申请，最多 20 个。用于一次性处理多个待审核的领养申请"
```
- 说明限制（最多 20 个）
- 说明场景（一次性处理）

✅ **支持的参数明确**
```
inputSchema: {
  status: { enum: ["pending", "approved", "rejected"] }
}
```
- 枚举值明确
- 参数类型清晰

### 6.2 不好的 Description

❌ 太简洁
```
"Get pets"  // Claude 不知道什么时候用这个
```

❌ 信息不完整
```
"列出宠物"  // 没说支持什么筛选条件
```

❌ 与其他工具混淆
```
search_pets 的 description: "查询宠物"
list_pets 的 description: "查询宠物"
↑ 两个 description 一样，Claude 无法区分
```

---

## 七、参数提取规则

### 7.1 从用户问题提取参数

| 用户说法 | 参数 | 工具 |
|---------|------|------|
| "超过 30 天" | `days_pending: 30` | `list_pets` |
| "待领养的" | `status: "available"` | `list_pets` |
| "北京的" | `region: "北京"` | `list_pets` |
| "柯基" | `breed: "柯基"` | `list_pets` |
| "本周" | `period: "week"` | `generate_operations_report` |
| "本月" | `period: "month"` | `generate_operations_report` |
| "批准" | `action: "approve"` | `review_application` |
| "拒绝" | `action: "reject"` | `review_application` |
| "标记为 urgent" | `status: "urgent"` | `batch_update_pet_status` |

### 7.2 参数验证

Claude 会验证参数是否合法：

```
用户: "把状态改成 'xxx'"

Claude 的检查:
  检查 inputSchema 中的 enum: ["available", "adopted", "pending", "urgent"]
  "xxx" 不在枚举值中
  
错误处理:
  ✅ 反问用户: "状态应该是以下之一: available / adopted / pending / urgent"
  ❌ 不会直接调用工具，防止出错
```

---

## 八、多工具组合流程

某些问题需要 **组合调用多个工具**：

### 场景 1: 查询后处理

```
运营: "把所有待领养超 30 天的宠物都标记为 urgent"

流程:
  1️⃣  调用 list_pets(status="available", days_pending=30)
      返回: { pets: [{id: 1, name: "团团"}, ...], total: 27 }
      
  2️⃣  提取所有 pet_id: [1, 2, 3, ...]
  
  3️⃣  调用 batch_update_pet_status(
        pet_ids: [1, 2, 3, ...],
        status: "urgent"
      )
      
  4️⃣  返回: { success_count: 27, failed_count: 0 }
```

### 场景 2: 分析后决策

```
运营: "根据数据找出问题并告诉我建议"

流程:
  1️⃣  调用 get_pending_alerts()
      返回: { alerts: [{ type: "long_pending", count: 27 }] }
      
  2️⃣  调用 analyze_adoption_patterns(days: 90)
      返回: { insights: [...], stats: {...} }
      
  3️⃣  Claude 综合两个结果生成建议:
      "🚨 发现 27 条超 30 天宠物，建议立即采取行动..."
```

---

## 九、常见误解

### 误解 1: "每个问题只能用一个工具"
```
❌ 错误: 我只能用一个工具
✅ 正确: Claude 可以智能组合多个工具实现复杂需求
```

### 误解 2: "参数必须完整填满"
```
❌ 错误: 用户必须提供所有参数
✅ 正确: 可选参数可以不填，Claude 会用默认值
```

### 误解 3: "Claude 总是选对工具"
```
❌ 错误: Claude 百分百准确
✅ 正确: 模糊问题时，Claude 会反问用户澄清
```

---

## 十、故障排查

### 问题：Claude 选错了工具

**原因分析：**
1. Description 不清晰，工具信息不足
2. 用户问题表述模糊
3. 多个工具的 description 相似

**解决方案：**
```javascript
// 改进 description，避免歧义
❌ "查询宠物"
✅ "列出宠物列表。当需要多维筛选（按品种、地区、状态等）时使用。"

❌ "查询申请"
✅ "查询领养申请列表。当需要按状态/宠物/申请人筛选时使用。"
```

### 问题：Claude 调用时参数错误

**原因分析：**
1. 参数值不符合 enum 定义
2. 参数类型错误（字符串 vs 数字）
3. 必填参数缺失

**解决方案：**
```javascript
// inputSchema 中标明必填参数
{
  properties: {
    pet_ids: { 
      type: "array", 
      items: { type: "string" },
      description: "宠物 ID 列表"
    }
  },
  required: ["pet_ids"]  // ✅ 标明为必填
}
```

---

## 十一、最佳实践

### 11.1 编写清晰的问题

```
❌ 模糊: "帮我看看数据"
✅ 清晰: "生成本周的运营报告"

❌ 模糊: "这些宠物怎么样"
✅ 清晰: "列出所有待领养超 30 天的宠物"

❌ 模糊: "批准这些"
✅ 清晰: "批准申请 ID 为 1,2,3 的领养申请"
```

### 11.2 提供足够的上下文

```
❌ 不足: "把这 5 条标记为 urgent"
       (Claude 不知道是哪 5 条)

✅ 充分: "把昨天新上架的这 5 条宠物 (ID: 1,2,3,4,5) 标记为 urgent"
```

### 11.3 利用 Claude 的智能

```
✅ 让 Claude 帮你做决策:
   "根据最近的数据，你觉得我应该怎么优化领养流程？"
   
✅ 让 Claude 做数据分析:
   "对比一下北京和上海的领养规律"
   
✅ 让 Claude 生成报告:
   "给我生成一个周报告，包括关键指标和建议"
```

---

## 总结

| 要点 | 说明 |
|------|------|
| **选择机制** | Claude 通过 description 的语义匹配选择工具 |
| **关键是 Description** | 清晰、完整的 description 是工具选择准确的基础 |
| **参数提取** | Claude 自动从用户问题中提取参数 |
| **组合调用** | 复杂问题可以多个工具组合使用 |
| **澄清机制** | 模糊问题时，Claude 会反问用户 |
| **最佳实践** | 提供清晰、具体的问题 + 足够的上下文 |

**一句话总结：** Description 就是 Claude 的"说明书"，写得越好，Claude 选对工具的概率就越高。
