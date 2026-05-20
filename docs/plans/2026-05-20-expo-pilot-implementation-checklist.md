# Expo 单页试点实施清单（Dog Project）

## 1. 目标与范围

- 目标：在不影响现有 `frontend`（React + Vite + Capacitor）主链路的前提下，完成一个 RN 页面试点。
- 试点页面：`/pet/:id`（宠物详情页）。
- 路线：采用 Expo，新建独立子工程 `rn-app/`。

不在本期范围：

- 全量页面迁移
- 完整替换 Capacitor 容器
- 非核心原生能力（推送、蓝牙、复杂音视频）

## 2. 目录与产物

建议新增目录：

- `rn-app/`：Expo 工程
- `rn-app/src/screens/PetDetailsScreen.tsx`：试点页面
- `rn-app/src/services/api.ts`：接口封装
- `rn-app/src/services/auth.ts`：token 读取逻辑
- `rn-app/src/navigation/linking.ts`：Deep Link 配置
- `docs/plans/2026-05-20-expo-pilot-implementation-checklist.md`：本实施清单

## 3. 里程碑拆分

### M1：工程初始化（0.5~1 天）

任务：

- 创建 Expo 项目并跑通 iOS/Android 基础启动。
- 确认 Node 版本与包管理器策略（建议 Node 20.x、pnpm 或 npm 二选一统一）。

建议命令：

```bash
cd /Users/wclu/dog_project
npx create-expo-app@latest rn-app
cd rn-app
npx expo start
```

验收标准：

- `rn-app` 可本地启动，模拟器或真机能看到默认页面。
- 团队内至少 1 台 iOS 和 1 台 Android 能复现启动。

### M2：页面骨架与导航（1 天）

任务：

- 建立 RN 导航结构。
- 新建 `PetDetailsScreen` 静态页面，先实现：返回、收藏按钮、图片区、基础信息区。

验收标准：

- 可通过 RN 内路由进入 `PetDetailsScreen`。
- 静态 UI 与现有 Web 详情页信息结构一致（视觉允许阶段性差异）。

### M3：数据与鉴权接入（1~2 天）

任务：

- 对接现有后端 API（复用当前后端契约）。
- 接入 token 读取与鉴权请求头。
- 完成详情数据、相关讨论、评论列表的最小可用展示。

建议约定：

- 环境变量：`EXPO_PUBLIC_API_BASE_URL`
- 请求头：有 token 时附加 `Authorization: Bearer <token>`

验收标准：

- 指定宠物 id 能正确加载详情。
- 未登录状态点击收藏可触发登录引导。
- 网络错误有可见提示，不出现白屏。

### M4：Deep Link 与 Web 并存（1 天）

任务：

- 配置 RN Deep Link，例如：`dogproject://pet/:id`。
- 在 Web `PetDetails` 或入口页增加“打开 RN 试点页”入口（开发/灰度开关控制）。

示例开关：

- `VITE_ENABLE_RN_PET_DETAILS=true` 时显示入口。

验收标准：

- Web 中触发后能打开 RN 对应页面并带上正确 `id`。
- 开关关闭时不影响现有 Web 流程。

### M5：灰度验证与复盘（1~2 天）

任务：

- 内部灰度（测试账号或限定设备）验证交互、性能、错误率。
- 对比 Web 版本体验与开发维护成本。

验收标准：

- 形成复盘结论（继续迁移 / 保持试点 / 暂停）。
- 输出问题清单与下一阶段建议。

## 4. 联调清单

- API 可用性：
  - `GET /pet/:id`（或当前等价接口）
  - `GET /forum/related/:dogId`
  - `GET /reviews/:dogId`
- 鉴权一致性：
  - token 过期行为
  - 未登录跳转策略
- 路由参数一致性：
  - Web id 与 RN id 类型统一（统一用字符串传递，业务层再转 number）

## 5. 测试与验收清单

功能验收：

- 能从入口进入 RN 详情页
- 详情信息加载成功
- 收藏按钮行为符合登录态逻辑
- 返回行为正确

稳定性验收：

- 弱网/断网有兜底提示
- 接口 401/500 不崩溃
- 页面重复进入 20 次无明显卡死或崩溃

回归验收：

- 现有 Web `/pet/:id` 页面功能不回归
- `frontend` lint/test 基础检查通过

## 6. 风险与回退

主要风险：

- 双栈并行导致路由和登录态维护复杂度上升
- Deep Link 在不同机型表现不一致
- 设计与交互风格短期不完全一致

回退策略：

- 保留 Web 原路径为默认入口
- RN 入口全部受开关控制，可一键关闭
- 问题严重时仅保留 RN 工程，不挂生产入口

## 7. 角色分工建议

- 前端（Web）：入口开关、路由跳转、埋点
- RN 开发：Expo 工程、页面实现、Deep Link
- 后端：接口稳定性与鉴权兼容
- QA：双端联调与灰度验证

## 8. 时间预估

- 最快可用试点：4~7 个工作日
- 含灰度与复盘：约 1.5~2 周

## 9. 完成定义（Definition of Done）

满足以下条件视为试点完成：

- Expo 工程可稳定运行
- `PetDetails` RN 页面完成核心业务闭环
- 与 Web 并存可控，具备开关与回退能力
- 有明确复盘结论和下一步决策建议

