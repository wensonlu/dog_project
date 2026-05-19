# 多Agent协同 + 执行轨迹可解释化 技术方案

## 1. 架构分层
1. Orchestrator：驱动 Agent 顺序与重试策略。
2. Planner Agent：`intent -> plan`。
3. Executor Agent：`plan_step -> tool_call`。
4. Verifier Agent：`tool_result -> pass/fail + evidence`。
5. Trace Store：记录结构化轨迹。

## 2. MCP tools 清单（输入/输出）
1. `plan_task(input)` -> `{steps, risk_level}`
2. `execute_step(step)` -> `{status, output, latency}`
3. `verify_step(step, output)` -> `{pass, evidence, confidence}`
4. `retry_strategy(trace)` -> `{next_plan}`

## 3. 执行状态机
1. `pending`
2. `planning`
3. `executing`
4. `verifying`
5. `retrying`
6. `succeeded`
7. `failed`
8. `cancelled`

## 4. 事件协议
事件名：
1. `agent.planner.started|completed`
2. `agent.executor.started|completed|failed`
3. `agent.verifier.started|passed|failed`
4. `orchestrator.retry.scheduled`

字段：`task_id step_id agent reason tool evidence confidence latency_ms timestamp`

## 5. 安全与幂等
1. 工具调用幂等键：`task_id + step_id + attempt`。
2. 只允许白名单工具执行。
3. 高风险动作需 confirm gate。

## 6. 测试计划与里程碑
1. 单测：Planner 输出稳定性、Verifier 判定准确率。
2. 集成：成功流、失败重试流、取消流。
3. 演示：论坛互动与商城下单两个样例轨迹。

里程碑：
1. M1：轨迹协议 + UI 骨架。
2. M2：三代理串联。
3. M3：失败恢复与可信评分接入。
