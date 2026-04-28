# dog-project MCP Server

面向 Claude Code 的宠物领养平台运营工具 MCP，让 AI 成为平台运营助理。

## 功能

| 分类 | 工具 | 说明 |
|------|------|------|
| **宠物** | `list_pets` | 宠物列表多维筛选 |
| | `get_pet_detail` | 宠物详情 |
| | `search_pets` | 关键词搜索 |
| **申请** | `list_applications` | 申请列表 |
| | `review_application` | 单个审核 |
| | `batch_review_applications` | 批量审核（最多 20 个） |
| **状态** | `batch_update_pet_status` | 批量更新状态（最多 50 个） |
| **分析** | `generate_operations_report` | 运营报告 |
| | `analyze_adoption_patterns` | 领养规律洞察 |
| **异常** | `get_pending_alerts` | 异常提醒 |
| **收藏** | `list_favorites` | 收藏列表 |
| | `notify_favorite_users` | 通知收藏用户 |

## 快速开始

### 1. 安装依赖

```bash
cd dog-project-mcp
pnpm install
```

### 2. 配置环境变量

```bash
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. 运行

```bash
# 开发模式（热重载）
pnpm dev

# 生产构建
pnpm build
node dist/index.js
```

### 4. Claude Code 接入

在 `~/.claude.json` 或项目根目录添加：

```json
{
  "mcpServers": {
    "dog-project": {
      "command": "npx",
      "args": ["tsx", "path/to/dog-project-mcp/src/index.ts"]
    }
  }
}
```

或在 Claude Code 中运行：

```bash
/claude mcp add dog-project -- npx tsx path/to/dog-project-mcp/src/index.ts
```

## 使用示例

### 查询宠物

```
用户：列出所有待领养的柯基
Claude → list_pets(status="pending", breed="柯基")
```

### 审核申请

```
用户：批准申请 ID 为 123 的领养申请
Claude → review_application(application_id="123", action="approve")
```

### 生成报告

```
用户：生成本周运营报告
Claude → generate_operations_report(period="week")
```

### 批量操作

```
用户：把 ID 为 1,2,3,4,5 的宠物标记为急需领养
Claude → batch_update_pet_status(pet_ids=["1","2","3","4","5"], status="urgent", condition="长期未领养")
```

## 认证

使用 Supabase Service Role Key，跳过 RLS 限制。**请勿在客户端暴露此 Key**，仅用于后端 MCP 服务。

## 开发

```bash
# 运行测试
pnpm test

# 类型检查
pnpm build
```

## 项目结构

```
src/
├── index.ts           # Server 入口
├── types/index.ts     # 类型定义
├── lib/supabase.ts    # Supabase 客户端
└── tools/
    ├── pets.ts        # 宠物相关
    ├── applications.ts # 申请相关
    ├── status.ts      # 状态管理
    ├── analytics.ts   # 数据分析
    ├── alerts.ts      # 异常检测
    └── favorites.ts   # 收藏管理
```
