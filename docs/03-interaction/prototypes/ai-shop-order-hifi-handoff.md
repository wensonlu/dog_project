# AI Shop Order Handoff

## 原型文件
1. `ai-shop-order-hifi.html`：商城智能下单高保真展示。
2. `ai-shop-order-hifi-sim.html`：任务状态切换模拟。

## data-ui 映射
1. `data-ui="btn-start"`：开始执行
2. `data-ui="btn-fail"`：失败注入
3. `data-ui="btn-retry"`：重试
4. `data-ui="btn-cancel"`：取消
5. `data-ui="event-log"`：事件日志

## 开发映射
1. HUD 步骤需与代码中的任务步骤名称一致。
2. 失败态保留最近错误信息，便于用户重试。
