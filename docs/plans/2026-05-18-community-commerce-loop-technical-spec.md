# 社区驱动商城闭环 技术方案

## 1. 架构分层
1. 前端体验层
- ForumDetail：AI 清单模块
- ShopOrder：打卡开关与任务创建
- ChallengeCheckin：打卡任务页
2. AI/编排层
- `ai_kit` 生成服务（规则 + 轻模型）
3. 后端服务层
- 论坛、商城、打卡任务接口
4. 数据层
- Supabase 业务表 + RLS

## 2. MCP tools 清单（输入/输出）
1. `forum.generate_kit(topic_id, user_ctx)` -> `items[]`
2. `shop.create_order(payload)` -> `order_id`
3. `challenge.create(order_id, topic_id, user_id)` -> `task_id`
4. `challenge.checkin(task_id, day_index, note)` -> `status`

## 3. 执行状态机
1. `kit_pending`
2. `kit_ready`
3. `checkout_entered`
4. `challenge_creating`
5. `challenge_active`
6. `checkin_submitted`
7. `loop_back_done`

## 4. 事件协议
1. `forum.ai_kit.show`
2. `forum.ai_kit.click_checkout`
3. `order.challenge_opt_in`
4. `challenge.create.success|failed`
5. `challenge.checkin.success|failed`

字段：`user_id topic_id product_id task_id day_index source timestamp`

## 5. 安全与幂等策略
1. 所有任务写操作按 `user_id` 走 RLS。
2. `challenge.create` 使用 `order_id + user_id` 幂等约束。
3. 打卡提交使用 `task_id + day_index` 去重。

## 6. 测试计划与里程碑
1. 单测
- AI 清单映射规则
- 任务创建幂等
2. 集成
- 从帖子跳转下单
- 下单创建任务
- 打卡提交与状态查询
3. 验收
- 小流量灰度，观测 4 个核心漏斗指标

里程碑：
1. M1（D1-D2）：清单模块 + 埋点
2. M2（D3-D4）：订单联动 + 任务创建
3. M3（D5-D7）：打卡页 + 回流入口 + 灰度
