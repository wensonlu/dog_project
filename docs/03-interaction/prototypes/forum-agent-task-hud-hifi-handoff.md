# Forum Agent Task HUD Hi-Fi 交付说明

## 原型文件
- `docs/03-interaction/prototypes/forum-agent-task-hud-hifi.html`

## 如何使用
1. 浏览器打开原型
2. 左侧点击 S1~S5 切换状态
3. 右侧手机框查看高保真交互表现

## 开发映射
1. `data-ui="assistant-sheet"` -> 聊天浮层组件
2. `data-ui="task-hud"` -> 任务 HUD 组件
3. `data-ui="task-step"` -> 步骤子项组件

## 状态枚举
- Task: `queued | running | waiting_confirm | succeeded | failed | cancelled`
- Step: `pending | running | succeeded | failed | skipped`

## 关键行为
1. 用户提交执行型指令 -> 关闭助手浮层 -> 打开 HUD
2. 每个 step 执行更新 `step.status`
3. 失败态显示重试/终止
4. 成功态显示查看结果

## 对接建议
1. 先实现 `TaskContext`（全局任务状态）
2. 执行器按步骤调用现有 Forum MCP 接口
3. 用事件总线驱动 HUD 局部更新，避免整页重渲染
