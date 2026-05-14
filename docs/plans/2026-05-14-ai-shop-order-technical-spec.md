# AI 助手商城智能下单技术方案

## 1. 架构分层
1. 指令解析层：`parseShopCommand` 识别下单语义并映射商品。
2. 任务执行层：`executeShopTask` 串行执行下单步骤。
3. UI 状态层：Task HUD 基于动态步骤数组渲染。
4. 数据记录层：后端 `shop_orders` 表保存订单记录（前端仅在后端不可用时本地兜底）。

## 2. MCP tools 清单（输入/输出）
1. 文件读写工具：更新前端组件与文档资产。
2. 命令执行工具：定向 lint 验证。

## 3. 执行状态机（Task/Step）
Task: `shop_ai_order`
1. `parse_requirement`
2. `open_shop`
3. `select_product`
4. `submit_order`
5. `verify_order`

## 4. 事件协议
事件名：
1. `shop.ai_order.start`
2. `shop.ai_order.step`
3. `shop.ai_order.success`
4. `shop.ai_order.failed`

核心字段：`user_id`, `product_id`, `quantity`, `timestamp`, `status`。

## 5. 安全与幂等策略
1. v1 只写本地订单，不触发真实支付。
2. 每次下单生成唯一 `order_id`，避免重复覆盖。
3. 重试时创建新订单并保留历史记录，便于审计。

## 6. 测试计划与里程碑
1. 单测：指令解析映射（主粮/零食/清洁/出行/健康）。
2. 集成：执行 5 步任务并验证 `POST /api/shop/orders` 与 `GET /api/shop/orders/:id`。
3. 交互：失败重试与取消任务验证。

里程碑：
1. M1：解析与 HUD 动态步骤。
2. M2：执行链路与订单落地。
3. M3：验证与回归。
