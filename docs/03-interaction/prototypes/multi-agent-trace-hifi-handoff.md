# Multi-Agent Trace Handoff

## 原型文件
1. `multi-agent-trace-hifi.html`
2. `multi-agent-trace-hifi-sim.html`

## data-ui 映射
1. `data-ui="agent-planner"`
2. `data-ui="agent-executor"`
3. `data-ui="agent-verifier"`
4. `data-ui="btn-start"`
5. `data-ui="btn-fail"`
6. `data-ui="btn-retry"`
7. `data-ui="event-log"`

## 开发映射
1. UI 卡片与 trace schema 字段一一对应。
2. 失败态必须包含 reason + retry plan。
