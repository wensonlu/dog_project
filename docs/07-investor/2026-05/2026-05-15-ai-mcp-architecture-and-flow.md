# AI MCP 技术架构总览（软件工程版）

## 1. 架构目标
围绕“从用户意图到可验证结果”的闭环，我们将系统拆为五层：
1. AI 编排层
2. 语义暴露层
3. Tools 执行层
4. 后端服务层
5. 数据与权限层（Supabase + RLS）

该架构的核心价值是：
1. 可执行：AI 不止生成文本，而是可调用业务能力。
2. 可验证：每个步骤都有状态与结果校验。
3. 可治理：权限、动作边界、审计链路清晰。

## 2. 分层架构图
```mermaid
flowchart TB
    U["用户/运营输入\n自然语言意图"] --> A

    subgraph A["AI 编排层"]
      A1["意图识别\n任务类型判断"]
      A2["任务拆解\n步骤状态机"]
      A3["失败重试/取消\n结果汇总"]
    end

    A --> B

    subgraph B["语义暴露层（前端）"]
      B1["页面上下文暴露\nroute/page/component state"]
      B2["动作上下文暴露\n可操作对象/参数"]
      B3["任务 HUD\n步骤可视化"]
    end

    B --> C

    subgraph C["Tools 执行层（MCP 能力）"]
      C1["论坛 Tools\nlist/open/like/comment/follow"]
      C2["商城 Tools\nlist/open/checkout/order"]
      C3["运营 Tools\nquery/metrics/moderation"]
    end

    C --> D

    subgraph D["后端服务层（Node/Express）"]
      D1["forum routes"]
      D2["shop routes"]
      D3["chat/agent routes"]
      D4["verify endpoints\n结果校验接口"]
    end

    D --> E

    subgraph E["数据与权限层（Supabase）"]
      E1["业务表\nforum_topics/forum_likes/shop_orders"]
      E2["身份与权限\nauth + RLS policies"]
      E3["审计字段\ncreated_at/user_id/source"]
    end

    E --> R["执行结果\n成功/失败/原因/证据"]
    R --> A3
    A3 --> U
```

## 3. 端到端执行流程图（意图 -> 结果）
```mermaid
sequenceDiagram
    autonumber
    participant User as 用户/运营
    participant AI as AI编排层
    participant UI as 语义暴露层(前端)
    participant Tools as Tools执行层
    participant API as 后端服务层
    participant DB as Supabase(RLS)

    User->>AI: 输入自然语言意图（如“给第4个帖子点赞评论关注”）
    AI->>AI: 意图识别 + 任务拆解（状态机初始化）
    AI->>UI: 获取页面与动作上下文
    UI-->>AI: 返回可执行对象与参数候选

    AI->>Tools: 调用论坛/商城/运营工具
    Tools->>API: 发起业务动作请求
    API->>DB: 按用户上下文执行（RLS约束）
    DB-->>API: 返回写入/查询结果
    API-->>Tools: 返回动作结果
    Tools-->>AI: 返回步骤结果

    AI->>API: 调用结果校验接口（verify）
    API->>DB: 校验最终状态（like/order/comment等）
    DB-->>API: 返回校验证据
    API-->>AI: 校验通过/失败

    AI->>UI: 更新任务HUD（完成/失败/可重试）
    UI-->>User: 可视化反馈与下一步提示
```

## 4. 工程约束与生产要求映射
1. 准确性：通过“语义暴露 + 工具白名单”替代视觉猜测点击。
2. 性能：工具直连业务路由，减少多模态反复推理开销。
3. 稳定性：状态机驱动，支持重试、取消、超时控制。
4. 安全性：RLS 权限边界 + 服务端参数校验。
5. 可观测性：步骤状态、错误原因、校验结果可追踪。

## 5. 与当前项目能力映射
1. 论坛：`/forum` 相关路由已支持点赞、评论、关注与校验链路。
2. 商城：`/shop` 与 `shop_orders` 支持智能下单意图与订单流程承接。
3. AI 助手：任务 HUD 提供步骤状态可视化、失败重试与取消能力。
4. 权限：Supabase RLS 提供数据访问控制基线。

## 6. 后续可扩展方向
1. 引入统一任务编排协议（Task/Step Event Schema）用于多场景复用。
2. 增加工具调用熔断与降级策略（例如 fallback 到只读建议模式）。
3. 打通自动化回归：复用同一状态机做执行与断言。
