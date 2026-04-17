# 后端技术方案（基于创新PRD）

## 1. 目标范围
- 支撑三项本轮创新：申请时间线、审核反馈模板、资料完善标识。
- 保持与现有申请/消息链路兼容，不破坏既有接口。

## 2. 数据模型变更
- `applications`（新增字段）
  - `timeline` JSONB：记录状态流转节点（status, at, actor, note）
  - `reject_reason_codes` TEXT[]：拒绝原因模板编码数组
  - `reject_note` TEXT：管理员补充说明
- `users`（可选新增字段）
  - `profile_completed` BOOLEAN DEFAULT false
  - `profile_completion_score` INT DEFAULT 0

## 3. API 变更
- `PATCH /api/applications/:id/review`
  - 入参新增：`rejectReasonCodes`、`rejectNote`
  - 逻辑：写入审核结果 + 追加 timeline + 发送消息通知
- `GET /api/applications/:id/timeline`
  - 返回申请时间线节点
- `GET /api/users/me/profile-completion`
  - 返回完整度状态与说明

## 4. 服务与权限
- 审核接口仅管理员权限可调用。
- 消息通知复用现有消息中心机制，新增消息模板。
- 审核状态变更与消息写入采用单事务（或失败补偿）。

## 5. 兼容性策略
- 新字段提供默认值；旧客户端不传新增参数时仍可用。
- 时间线缺失时返回最小回退结构（created -> current status）。

## 6. 风险与防护
- 风险：状态与消息不一致。
- 防护：统一在审核服务层写状态与消息；失败时记录错误并重试。
- 风险：拒绝原因模板编码变更造成历史不可读。
- 防护：编码稳定+后端映射字典版本化。

## 7. 测试要点
- 审核通过/拒绝后 timeline 节点正确追加。
- 拒绝时 reason codes 与 note 持久化。
- 通知消息内容与审核动作一致。
