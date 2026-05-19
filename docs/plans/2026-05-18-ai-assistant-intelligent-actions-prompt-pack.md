# AI助手智能下单 + 智能点赞评论 开发流程 Prompt（可复用）

## 1) 总控 Prompt（交给 AI 编程助手）
```text
你是资深全栈工程师，请在当前项目中实现两个能力：
1. AI助手智能下单（从内容理解 -> 推荐商品 -> 进入下单 -> 订单页）
2. AI助手智能点赞评论（识别目标帖子 -> 点赞/评论 -> 可审计）

请严格按 product-delivery-workflow 输出并执行，按以下阶段推进：
Phase 0 对齐：目标、范围、成功指标、风险边界
Phase 1 PRD：用户故事、主流程、异常流程、验收标准
Phase 2 交互稿：关键页面状态与流程图（mermaid）
Phase 3 高保真模拟稿：静态H5 + 多状态切换 + 操作日志区
Phase 4 技术方案：前后端接口、MCP tools、状态机、幂等与审计、测试计划
Phase 5 实现落地：按最小可用版本开发并联调
Phase 6 验收：给出可执行测试清单与结果

硬性要求：
- 所有高风险动作（如下单提交、自动评论发送）必须二次确认。
- 所有 AI 动作必须产生日志：意图、输入、候选动作、最终动作、结果、耗时、失败原因。
- 所有可写操作必须支持幂等（requestId / idempotency key）。
- 输出“已完成清单 + 文件路径 + 下一步建议（P0/P1/P2）”。
```

## 2) 智能下单专项 Prompt（实现导向）
```text
在当前项目实现“AI智能下单”能力：

目标：
- AI根据帖子/会话内容提炼用品清单（含理由、置信度、数量建议）
- 用户点击“去下单”可进入订单页，维护地址并提交订单（支付可占位）

后端要求：
- 新增或扩展接口：
  - GET /forum/:id/ai-kit
  - POST /shop/orders (支持 idempotency_key)
  - GET /shop/orders/:id
- ai-kit 输出字段：
  - productId, quantity, reason, evidenceExcerpt, confidence
- 写操作日志表/日志流：
  - action_type=ai_ordering, request_id, user_id, input_snapshot, output_snapshot, status, latency_ms

前端要求：
- 论坛详情新增“AI提炼用品清单”
- 一键“去下单”跳转订单页，并自动带上推荐商品参数
- 订单页支持地址维护与“确认下单”（支付可先不实现）
- 增加失败场景提示：库存不足、参数失效、网络失败重试

验收标准：
1. 从帖子进入下单流程 <= 3 步完成
2. 幂等重复提交不会创建重复订单
3. 日志可追踪完整链路
4. 失败可重试且用户可恢复
```

## 3) 智能点赞评论专项 Prompt（实现导向）
```text
在当前项目实现“AI智能点赞评论”能力：

目标：
- AI可对指定帖子执行点赞、收藏、评论、关注作者
- 评论内容支持 AI 草拟，但发出前必须用户确认

后端要求：
- 新增或扩展接口：
  - POST /forum/:id/like
  - POST /forum/:id/follow
  - POST /forum/:topicId/comments
  - POST /forum/verify-interaction
- 审计记录字段：
  - action_type=ai_forum_interaction, target_id, proposed_text, confirmed_by_user, status, error_code

前端要求：
- AI助手面板展示可执行动作卡片（点赞/评论/收藏/关注）
- 评论动作流程：草拟 -> 预览 -> 用户确认 -> 发送
- 执行后刷新详情页互动状态（点赞数、评论数、关注态）

安全约束：
- 自动评论默认关闭，必须显式确认
- 敏感词/违规文本先过 precheck，再允许 confirm
- 所有动作支持撤销或补偿（至少对点赞/关注可逆）

验收标准：
1. AI动作成功后UI状态与服务端一致
2. 评论确认链路完整且可审计
3. 错误码与用户提示一致
```

## 4) B端项目复用 Prompt（AIGovern_Pro）
```text
把“AI智能下单 + AI智能点赞评论”能力迁移到 AIGovern_Pro（B端）时，请按“配置优先、工具可插拔、审计默认开启”原则实现：

1. 抽象配置层：
- 业务域（community/commerce）
- 可执行工具白名单（tools allowlist）
- 风险等级与确认策略（none/soft/hard confirm）
- 审计级别（basic/full）

2. 抽象执行层：
- Intent Planner（意图拆解）
- Tool Router（工具路由）
- Guardrail（权限/RLS/策略检查）
- Action Executor（执行与重试）
- Trace Logger（全链路可观测）

3. 输出：
- 提供一套可部署的最小集成方案（接口契约 + 示例配置 + 验收脚本）
```

## 5) 推荐调用方式
1. 先贴“总控 Prompt”，让 AI 按阶段输出资产并落盘。  
2. 进入开发阶段后，分别贴“智能下单专项 Prompt”和“智能点赞评论专项 Prompt”。  
3. 迁移到 AIGovern_Pro 时再贴“B端项目复用 Prompt”。  
