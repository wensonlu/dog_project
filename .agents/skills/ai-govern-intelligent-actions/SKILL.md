---
name: ai-govern-intelligent-actions
description: "在 B 端项目中复用 AI 智能下单与智能点赞评论能力：从意图拆解、工具执行、确认门禁到审计追踪的一体化交付流程。适用于 AIGovern_Pro 等需要可控执行与可观测性的业务系统。"
---

# AI Govern Intelligent Actions Skill

## 适用场景
当用户提出以下需求时使用：
1. “给 AI 助手加智能下单”
2. “让 AI 自动点赞评论，但要可控可审计”
3. “把 C 端能力抽象成 B 端可复用模块”
4. “需要可生产落地的 AI tools 执行框架”

## 目标
将两类动作统一为标准化执行链路：
1. `commerce.ordering`：智能下单
2. `community.interaction`：点赞/收藏/评论/关注

并满足：
1. 准确执行（工具路由明确）
2. 可控执行（权限和确认门禁）
3. 可追踪执行（全链路审计日志）
4. 可复用（配置驱动、多项目迁移）

---

## 输入契约（调用本 Skill 前）
必须提供：
1. 业务上下文：项目名、域模型、关键页面
2. 目标动作：下单 / 点赞 / 评论 / 关注（可多选）
3. 工具边界：可调用 tools 列表（allowlist）
4. 风险策略：是否需要二次确认、是否允许自动发送评论
5. 验收目标：时延、成功率、幂等要求、审计要求

可选提供：
1. 现有 API 契约
2. RLS/权限模型
3. 失败重试规则

---

## 标准流程（必须按顺序）

### Phase 0 - 对齐与边界
1. 明确 in-scope / out-of-scope
2. 明确高风险动作列表（写操作默认高风险）
3. 确认确认策略：
  - `none`: 只适用于低风险读操作
  - `soft_confirm`: 一次确认
  - `hard_confirm`: 二次确认 + 风险提示

输出：边界声明 + 风险分级表

### Phase 1 - 动作语义建模
定义意图与动作映射：
1. Intent: `go_order`
  - Action: `extract_kit -> open_checkout -> submit_order`
2. Intent: `engage_topic`
  - Action: `like_topic | follow_author | draft_comment -> confirm_comment -> send_comment`

输出：Intent-Action 映射表

### Phase 2 - Tools 契约定义
每个 Tool 必须有：
1. 输入 schema
2. 输出 schema
3. 幂等键策略
4. 错误码与重试策略
5. 审计字段

最低工具集建议：
1. `forum.get_topic_context`
2. `forum.get_ai_kit`
3. `shop.create_order`
4. `forum.toggle_like`
5. `forum.follow_author`
6. `forum.precheck_comment`
7. `forum.confirm_comment`

输出：Tools 合同文档（可直接给前后端）

### Phase 3 - 执行状态机
统一状态：
1. `planned`
2. `awaiting_confirmation`
3. `executing`
4. `succeeded`
5. `failed_retryable`
6. `failed_terminal`
7. `cancelled`

输出：状态迁移图 + 每个状态的 UI 文案与按钮

### Phase 4 - 审计与可观测
每次动作记录：
1. `trace_id`, `request_id`, `user_id`
2. `intent`, `tool_name`, `tool_input_hash`
3. `decision_reason`, `confidence`
4. `confirmation_required`, `confirmed_by`
5. `result_status`, `error_code`, `latency_ms`

输出：审计字段表 + 查询视图定义

### Phase 5 - 交付与验收
交付内容：
1. PRD（需求和 DoD）
2. 技术方案（接口、状态机、容错）
3. 最小可用实现（端到端跑通）
4. 验收报告（成功率/耗时/失败恢复）

---

## 默认 Guardrails（生产建议）
1. 写操作默认要求确认（下单提交、评论发送）
2. 评论必须 `precheck -> confirm -> send`
3. 幂等默认开启（`idempotency_key`）
4. 工具调用必须在 allowlist 内
5. 无权限或策略冲突时必须拒绝执行并给理由

---

## 输出模板（给调用方）
最终必须输出：
1. 已完成项（按 Phase）
2. 产出文件路径（绝对路径）
3. 未完成风险与阻塞
4. 下一步（P0/P1/P2）

---

## 快速触发口令
1. “用 ai-govern-intelligent-actions 跑一版智能下单和点赞评论”
2. “按这个 skill 在 AIGovern_Pro 落地可审计执行链路”
3. “给我这个 skill 的最小集成实现和验收清单”
