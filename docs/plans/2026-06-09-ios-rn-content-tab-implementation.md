# iOS RN Content Tab Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在 Capacitor iOS App 中使用 RN 承载内容中心、故事列表和故事详情，同时保持 Web/H5 当前逻辑不变。

**Architecture:** H5 在 iOS 宿主中通过 `dogproject://content` 打开 RN 容器。RN 使用轻量 route state 管理内容中心、列表和详情，通过 `dogproject://web?path=...` 返回 Capacitor WebView。

**Tech Stack:** React 19/Vite、Capacitor iOS、React Native 0.76、Expo 52、Express Stories API

---

### Task 1: 扩展混合路由协议

**Files:**
- Modify: `rn-app/src/navigation/linking.js`
- Modify: `rn-app/App.js`
- Modify: `frontend/ios/App/App/AppDelegate.swift`

验证 `content`、`stories`、`story/:id` 和 `web?path=` 路由均可解析和执行。

### Task 2: iOS 故事 Tab 入口

**Files:**
- Create: `frontend/src/utils/contentTabNavigation.js`
- Modify: `frontend/src/components/BottomNav.jsx`
- Test: `frontend/src/test/BottomNav.test.jsx`

浏览器继续 React Router 导航；Capacitor iOS 使用 Deep Link 打开 RN。

### Task 3: RN 内容与故事页面

**Files:**
- Create: `rn-app/src/components/HybridBottomNav.js`
- Create: `rn-app/src/screens/ContentHubScreen.js`
- Create: `rn-app/src/screens/StoriesScreen.js`
- Create: `rn-app/src/screens/StoryDetailScreen.js`
- Modify: `rn-app/src/services/api.js`
- Modify: `rn-app/App.js`

实现加载、刷新、分页、空态、错误态、故事详情、点赞和评论。

### Task 4: 调试和发布命令

**Files:**
- Modify: `rn-app/package.json`
- Modify: `frontend/package.json`
- Create: `scripts/verify-rn-ios-bundle.sh`
- Modify: `docs/IOS_CODEX_QUICKSTART.md`

提供 Metro、production bundle、bundle 验证和 iOS 发布前检查命令。

### Task 5: 验证

运行:

```bash
cd frontend && pnpm lint
cd frontend && pnpm test -- BottomNav.test.jsx
cd rn-app && pnpm export:ios
cd frontend && pnpm ios:rn:bundle && pnpm ios:rn:verify
```

最后使用模拟器/真机验证 `dogproject://content` 与 `dogproject://story/1`。
