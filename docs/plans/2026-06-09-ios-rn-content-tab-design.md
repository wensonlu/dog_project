# iOS RN 故事 Tab 重构设计

## 目标

保留 Web/H5 当前内容中心与故事路由不变，仅在 Capacitor iOS App 中将底部「故事」
Tab 切换为 RN 页面。RN 承载内容中心、故事列表和故事详情；百科、发布故事及其他主
Tab 暂时回到 H5。

## 为什么要迁移

故事是图片密集、长列表和长详情内容，适合用 RN 获得更稳定的滚动、刷新、图片展示
和键盘交互体验。更重要的是，本次迁移把现有“临时弹出详情页”的 RN 试点升级为可
承载一级 Tab 的混合导航协议，为后续逐个 Tab 原生化建立模板。

收益:

- H5 与 RN 可独立迭代，Web 用户不受影响。
- iOS 故事列表和详情拥有原生滚动、下拉刷新与页面状态。
- H5 始终保留为回退路径，RN 出现问题时可快速关闭入口。
- 沉淀统一的 `dogproject://content`、`dogproject://story/:id` 和
  `dogproject://web?path=...` 导航协议。
- 建立可重复的 RN bundle 生成和发布校验流程，避免源码与 App 内 bundle 不一致。

## 页面边界

| 页面/动作 | iOS App | Web/H5 |
|---|---|---|
| 底部故事 Tab | RN 内容中心 | H5 `/content` |
| 幸福故事列表 | RN | H5 `/stories` |
| 故事详情 | RN | H5 `/stories/:id` |
| 百科列表/详情 | 返回 H5 `/wiki*` | H5 |
| 分享故事 | 返回 H5 `/stories/create` | H5 |
| 其他底部 Tab | 返回 H5 对应路径 | H5 |

## 导航协议

进入 RN:

```text
dogproject://content
dogproject://stories
dogproject://story/<storyId>
```

RN 返回 H5:

```text
dogproject://web?path=%2F
dogproject://web?path=%2Fforum
dogproject://web?path=%2Fshop
dogproject://web?path=%2Fwiki
dogproject://web?path=%2Fstories%2Fcreate
dogproject://web?path=%2Fprofile
```

iOS 宿主处理 `web` 路由时先关闭 RN 容器，再通过 Capacitor WebView 执行站内导航。
H5 仅在 iOS 原生容器中拦截故事 Tab；浏览器继续使用 React Router。

## RN 内部结构

```text
App.js
  -> route state
  -> ContentHubScreen
  -> StoriesScreen
  -> StoryDetailScreen
  -> HybridBottomNav
  -> services/api.js
```

首期不引入新的导航库，继续使用当前轻量 route state，避免扩大 Pod 和 bundle 变更。
内容中心与列表保留各自状态；从详情返回时回到故事列表。

## 开发调试

Debug 默认连接 Metro，支持 Fast Refresh。开发时可直接通过模拟器 Deep Link 打开页面:

```bash
xcrun simctl openurl booted "dogproject://content"
xcrun simctl openurl booted "dogproject://story/1"
```

若未启动 Metro，Debug RN 页面会白屏。需要提供 `ios:rn:dev` 启动命令和
`ios:rn:bundle` 离线 bundle 命令；排查离线产物时使用 Release 构建。

## 发布流程

每次 iOS 发布必须按顺序执行:

1. 前端 lint/test。
2. RN route/API 专项验证。
3. 生成 production `main.jsbundle`。
4. 扫描 bundle，确认包含 content/story 路由且没有已知不兼容调用。
5. 构建并同步 H5 Capacitor 产物。
6. 生成 RN codegen。
7. iOS Release 构建和真机冒烟。

## 验收标准

- 浏览器点击故事 Tab 仍进入 H5 `/content`。
- iOS App 点击故事 Tab 进入 RN 内容中心。
- RN 内容中心可进入故事列表和故事详情。
- RN 可返回 H5 百科、发布故事和其他底部 Tab。
- 弱网、空数据、接口错误均有可见状态。
- RN production bundle 可重复生成并随 iOS App 发布。
