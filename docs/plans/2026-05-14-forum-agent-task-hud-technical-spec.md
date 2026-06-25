# Forum Agent Task HUD Technical Spec

## 1. 总体架构

## 1.1 架构目标
将“聊天回答模式”升级为“任务执行模式”，以 Web MCP 为执行底座，HUD 为执行可视化层。

## 1.2 逻辑分层
1. Assistant UI Layer（Chat Sheet / Task HUD）
2. LLM Planner（`POST /agent/plan`，只产出结构化 plan，不执行）
3. Authorization Gate（展示计划、风险、账号与动作清单，用户确认后继续）
4. Tool Executor（前端 allowlist 执行器）
5. Forum MCP API（后端工具层）
6. Data Layer（Supabase）

## 1.3 关键流
1. 用户输入自然语言
2. LLM Planner 基于页面上下文和工具目录生成执行计划（steps）
3. 授权弹窗展示计划；所有写操作和购买决策必须先确认
4. Tool Executor 逐步调用 allowlist API
5. HUD 更新每一步状态
6. 成功/失败收敛并落审计日志

---

## 2. LLM Agent Plan Schema

### 2.1 目标语义
示例：`帮我给第一个帖子点赞评论123`

解析结果：
```json
{
  "intent": "community.interaction",
  "title": "论坛互动计划",
  "summary": "定位第一个帖子并执行点赞、评论。",
  "confidence": 0.86,
  "steps": [
    { "id": "resolve-topic", "tool": "forum.resolve_topic", "label": "定位目标帖子", "args": { "targetIndex": 1 } },
    { "id": "like-topic", "tool": "forum.like_topic", "label": "点赞帖子", "args": {} },
    { "id": "comment-topic", "tool": "forum.comment_topic", "label": "发布评论", "args": { "content": "123" } }
  ]
}
```

### 2.2 v1 允许工具
1. `forum.search_topics`
2. `forum.resolve_topic`
3. `forum.get_topic`
4. `forum.summarize_topic`
5. `forum.draft_reply`
6. `forum.like_topic`
7. `forum.comment_topic`
8. `forum.follow_author`
9. `forum.verify_interaction`
10. `ui.navigate`

---

## 3. Web MCP Tools 设计

## 3.1 读取类

### `get_forum_context`
用途：获取当前论坛页面上下文（page/state/data）

### `search_topics`
用途：按 query/sort/category 获取帖子列表

### `get_topic_detail`
用途：获取帖子详情及评论分页

### `get_related_topics`
用途：发帖去重与相似帖检索

## 3.2 操作类

### `resolve_topic_target`
输入：`{selector:"first|index|id", index?:number, topicId?:string}`
输出：`{topicId,title}`

### `navigate_to_topic`
输入：`{topicId}`
输出：`{ok,route}`

### `like_topic`
输入：`{topicId,userId}`
输出：`{liked,likes}`

### `precheck_create_reply`
输入：`{topicId,content,userId,replyToCommentId?}`
输出：`{confirmToken,expiresInMs}`

### `confirm_create_reply`
输入：`{confirmToken,userId}`
输出：`{ok,replyId,createdAt}`

### `verify_topic_interaction`
输入：`{topicId,expect:{liked:boolean,commentContains?:string}}`
输出：`{pass,evidence}`

---

## 4. Task 状态机

## 4.1 Task 状态
1. `queued`
2. `running`
3. `waiting_confirm`
4. `succeeded`
5. `failed`
6. `cancelled`

## 4.2 Step 状态
1. `pending`
2. `running`
3. `succeeded`
4. `failed`
5. `skipped`

## 4.3 TS 类型建议
```ts
type TaskStatus = 'queued' | 'running' | 'waiting_confirm' | 'succeeded' | 'failed' | 'cancelled';
type StepStatus = 'pending' | 'running' | 'succeeded' | 'failed' | 'skipped';

interface TaskStep {
  id: string;
  name: string;
  status: StepStatus;
  detail?: string;
  retryable?: boolean;
}

interface AgentTask {
  id: string;
  title: string;
  status: TaskStatus;
  steps: TaskStep[];
  startedAt: number;
  finishedAt?: number;
}
```

---

## 5. 任务执行流程（Sequence）

1. `resolve_topic_target(first)`
2. `navigate_to_topic(topicId)`
3. `like_topic(topicId,userId)`
4. `precheck_create_reply(topicId,"123",userId)`
5. `confirm_create_reply(confirmToken,userId)`
6. `verify_topic_interaction(topicId,{liked:true,commentContains:"123"})`

失败策略：
1. 单步失败最多重试 1 次
2. 导航失败时重新 resolve 目标后再试
3. confirm 失败提示用户重新发起

---

## 6. 事件协议（HUD 更新）

## 6.1 事件格式
```json
{
  "taskId": "task_001",
  "type": "step_update",
  "stepId": "like_topic",
  "status": "running",
  "message": "正在点赞帖子...",
  "ts": 1778730000000
}
```

## 6.2 事件类型
1. `task_started`
2. `step_update`
3. `task_waiting_confirm`
4. `task_failed`
5. `task_succeeded`
6. `task_cancelled`

---

## 7. 前端实现建议

## 7.1 组件
1. `ChatAssistant`（输入与意图触发）
2. `TaskHud`（底部悬浮任务面板）
3. `TaskStepList`（步骤展示）

## 7.2 状态管理
建议新增 `TaskContext`：
1. `startTask(plan)`
2. `updateStep(stepId,status,detail)`
3. `cancelTask(taskId)`
4. `retryStep(taskId,stepId)`

## 7.3 UI 切换策略
1. 执行任务前：关闭 Chat Sheet
2. 执行任务时：显示 Task HUD
3. 执行完成后：HUD 可折叠，保留结果入口

---

## 8. 后端实现建议

## 8.1 新增接口（若缺失）
1. `POST /api/forum/resolve-target`
2. `POST /api/forum/verify-interaction`

## 8.2 复用接口
1. `/api/forum/context`
2. `/api/forum/precheck/reply`
3. `/api/forum/confirm/reply`
4. `/api/forum/:id/like`

## 8.3 审计
写入 `forum_mcp_audit`：
1. action
2. user_id
3. request_payload
4. result_payload
5. success
6. created_at

---

## 9. 安全与幂等

1. 点赞前检查是否已点赞，已满足则 `skipped`
2. 评论确认 token 60 秒有效、一次性消费
3. 评论重复保护：同用户、同帖、短时间同内容触发提醒
4. 所有高风险动作保留可配置确认开关

---

## 10. 测试方案

## 10.1 自动化用例
1. 正常流：点赞+评论成功
2. 目标不存在：resolve 失败
3. 点赞已存在：步骤跳过
4. confirm token 过期：失败并提示重试
5. 导航失败：重试后恢复

## 10.2 验收脚本
复用并扩展：
- `tests/automated/test-forum-mcp-flow.sh`

---

## 11. 实施计划

### Phase A（2-3天）
1. Task HUD 组件与状态机
2. 执行器 MVP（固定步骤链）

### Phase B（2-3天）
1. resolve/verify 接口
2. 失败重试与取消

### Phase C（1-2天）
1. 审计可视化
2. 指标埋点（成功率、耗时、失败原因分布）


---

## 12. 动效与时序规范

## 12.1 接管时序
1. 用户发送执行型指令后 `200~300ms` 内触发任务接管
2. 接管动作：`Chat Sheet` 关闭动画与 `Task HUD` 进入动画并行
3. 并行动画总时长建议 `220ms`（ease-out）

## 12.2 HUD 动效参数
1. HUD 进入：`translateY(24px -> 0)` + `opacity(0 -> 1)`，时长 `220ms`
2. HUD 折叠：高度过渡 `220ms`
3. Step 状态变更：单行高亮闪烁 `120ms`，避免整卡片重绘

## 12.3 防抖动规则
1. 步骤状态切换最短可见时长 `>= 300ms`
2. 禁止每个 token 驱动全 HUD 重绘
3. 仅变更步骤行局部 DOM

---

## 13. 手势、布局与可用性细节

## 13.1 HUD 尺寸
1. 折叠高度：`56px`
2. 展开高度：`min(42vh, 360px)`
3. 底部安全区：`padding-bottom: env(safe-area-inset-bottom)`

## 13.2 手势行为
1. 上滑展开 HUD
2. 下滑折叠 HUD
3. 执行中禁止完全关闭 HUD（仅允许折叠）

## 13.3 键盘冲突策略
1. 若评论输入需要弹键盘，HUD 自动上浮到键盘上缘
2. 键盘关闭后 HUD 回到底部锚点

## 13.4 遮挡策略
1. HUD 不遮挡底部导航核心按钮（必要时自动上移 8~12px）
2. 横屏模式下降级为右下角小窗

---

## 14. 错误码与用户文案映射

| 错误码 | 场景 | 用户文案 | 操作建议 |
|---|---|---|---|
| `TARGET_NOT_FOUND` | 未找到“第一个帖子” | 未找到目标帖子，请刷新后重试 | 提供“刷新列表后重试” |
| `NAVIGATION_FAILED` | 跳转详情失败 | 进入帖子失败，请重试 | 允许重试步骤 |
| `ALREADY_LIKED` | 已点赞 | 该帖子已点赞，已自动跳过 | 步骤标记 `skipped` |
| `CONFIRM_TOKEN_EXPIRED` | confirm 过期 | 评论确认已过期，请重试发布 | 重试当前步骤 |
| `COMMENT_DUPLICATE_RISK` | 重复评论风险 | 检测到短时间重复评论，是否继续？ | 提供二次确认 |
| `NETWORK_ERROR` | 网络异常 | 网络异常，请稍后重试 | 全任务或单步重试 |

实现要求：
1. 技术错误不得直接展示给用户（如 SQL/栈信息）
2. 所有失败态至少提供一个恢复动作按钮

---

## 15. 任务一致性规则

## 15.1 取消一致性
1. `cancelled` 后不再发起新请求
2. 已执行成功的步骤不回滚（v1）
3. HUD 显示“任务已取消（已完成X/Y步）”

## 15.2 幂等与跳过
1. 点赞步骤执行前查询状态
2. 已点赞则步骤置为 `skipped`，detail=`已满足`
3. 评论步骤需避免短时间重复提交同内容

## 15.3 重试边界
1. 单步最多自动重试 1 次
2. 手动重试不受自动重试计数影响
3. 同一任务总重试次数建议上限 3 次

## 15.4 多任务互斥
1. v1 同时仅允许 1 个 `running` 任务
2. 新任务到来时提示：
   - 终止当前任务并开始新任务
   - 等待当前任务完成

---

## 16. 可观测性与埋点

## 16.1 前端埋点事件
1. `task_hud_opened`
2. `task_step_started`
3. `task_step_succeeded`
4. `task_step_failed`
5. `task_cancelled_by_user`
6. `task_retry_clicked`
7. `task_completed`

## 16.2 后端埋点字段
1. `task_id`
2. `step_id`
3. `action`
4. `duration_ms`
5. `result_code`
6. `success`
7. `user_id`

## 16.3 指标看板建议
1. 任务启动成功率
2. 任务端到端成功率
3. 平均执行耗时（P50/P95）
4. 失败分布（按 step_id / result_code）
5. 用户取消率
6. 手动重试成功率

## 16.4 告警阈值建议
1. 任务失败率 > 8%（5分钟窗口）告警
2. `confirm token` 过期率 > 5% 告警
3. 平均耗时 > 6s 告警
