# 内容合并与宠物用品商城技术方案

## 1. 架构分层
1. 展示层（Frontend React）
- `BottomNav`: 导航配置调整
- `ContentHub`: 合并内容入口页
- `Shop`: 商城列表页
2. 路由层（React Router）
- 新增 `/content` `/shop` `/shop/:id`
- 保留 `/wiki` `/stories` 兼容历史入口
3. 数据层
- v1 使用前端 mock 数据
- v1.1 可迁移到后端 `GET /shop/products` 等接口

## 2. MCP tools 清单（输入/输出）
1. `filesystem.read`（等价本地读文件）
- 输入：文件路径
- 输出：源代码/文档内容
2. `filesystem.write`（等价本地写文件）
- 输入：目标路径 + 内容
- 输出：写入成功状态
3. `terminal.exec`（等价命令执行）
- 输入：`pnpm lint` 等
- 输出：日志与退出码

## 3. 执行状态机（Task/Step）
Task: `content_shop_mvp`
1. `nav_merge_pending`
2. `nav_merge_running`
3. `nav_merge_done`
4. `shop_page_running`
5. `shop_page_done`
6. `verify_running`
7. `verify_done` / `verify_failed`

## 4. 事件协议
事件名规范：`module.action.result`
1. `nav.content.click`
2. `nav.shop.click`
3. `content.section.enter`
4. `shop.product.click`
5. `shop.checkout.click`

事件字段：
- `user_id`（可匿名）
- `session_id`
- `timestamp`
- `source_tab`
- `product_id`（商城事件必填）

## 5. 安全与幂等策略
1. v1 不落订单，不触发支付，规避资金风险。
2. 下单按钮只产生一次前端事件并跳转占位，避免重复提交。
3. 所有商品链接白名单域名校验（v1.1）。

## 6. 测试计划与里程碑
测试计划：
1. 单元测试：BottomNav 激活态与路由跳转。
2. 页面测试：Content/Shop 渲染、失败态、重试。
3. 手工回归：移动端视口下底部导航布局与可点击区域。

里程碑：
1. M1（D1）：导航与路由完成。
2. M2（D2）：商城列表+详情完成。
3. M3（D2）：埋点与回归完成。
