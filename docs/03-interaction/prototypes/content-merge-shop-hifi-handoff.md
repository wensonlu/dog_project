# Content + Shop Handoff

## 原型文件
1. `content-merge-shop-hifi.html`：高保真静态展示版。
2. `content-merge-shop-hifi-sim.html`：可切换状态模拟版。

## data-ui 映射
1. `data-ui="tab-content"` -> 底部内容tab
2. `data-ui="tab-shop"` -> 底部商城tab
3. `data-ui="btn-start"` -> 开始执行（加载）
4. `data-ui="btn-fail"` -> 失败注入
5. `data-ui="btn-retry"` -> 重试
6. `data-ui="btn-cancel"` -> 取消
7. `data-ui="event-log"` -> 事件日志区域

## 开发注意
1. 移动端优先宽度 390px。
2. 保留事件日志可视化容器，联调时替换为真实埋点流。
3. 商品卡片点击区域至少 44x44。
