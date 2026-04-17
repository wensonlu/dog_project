# 前端技术方案（基于创新PRD）

## 1. 目标范围
- 用户侧新增申请时间线展示。
- 管理侧审核时支持“拒绝原因模板 + 备注”。
- 用户侧展示资料完善标识（简版）。

## 2. 页面与组件
- 用户个人中心
  - 新增 `ApplicationTimeline` 组件：展示申请状态节点和更新时间。
- 管理审核页
  - 审核弹窗新增 `RejectReasonSelector`（多选模板 + 备注输入）。
- 个人资料页
  - 新增 `ProfileTrustBadge`：展示资料完善状态。

## 3. 状态管理
- 在 Dog/Apply 相关 context 中新增 timeline 拉取与缓存。
- 审核提交动作扩展 payload：`rejectReasonCodes`、`rejectNote`。
- 增加接口错误态：模板加载失败、timeline 拉取失败的降级展示。

## 4. 交互规范
- timeline 至少显示：提交、审核中、结果状态。
- 拒绝时在消息中心可见“原因摘要 + 改进建议”。
- 完善标识仅提示，不阻断申请。

## 5. 联调契约
- `GET /api/applications/:id/timeline` 返回节点数组。
- `PATCH /api/applications/:id/review` 接受拒绝模板字段。
- `GET /api/users/me/profile-completion` 返回 badge 信息。

## 6. 风险与防护
- 风险：接口字段未到位导致页面异常。
- 防护：前端容错字段映射与空态兜底。
- 风险：历史申请无 timeline。
- 防护：展示“历史数据未完整记录”的友好提示。

## 7. 测试要点
- 时间线渲染正确（含空态/历史兼容）。
- 审核拒绝模板提交通路可用。
- 资料完善标识展示与接口一致。
