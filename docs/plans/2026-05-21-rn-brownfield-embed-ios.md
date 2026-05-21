# RN 真内嵌到同一个 iOS 工程实施方案（Dog Project）

## 1. 目标

把 `rn-app`（Expo/RN 试点）作为同一个 iOS 工程 `frontend/ios/App` 的原生依赖运行，而不是作为独立 App。

## 2. 已落地改造（本次执行）

1. iOS Pod 依赖并入同一工程
- 文件: `frontend/ios/App/Podfile`
- 改动:
  - 保留 Capacitor pods
  - 引入 Expo/RN Pod 脚本（从 `rn-app/node_modules` 解析）
  - 在 `target 'App'` 内启用:
    - `use_expo_modules!`
    - `use_react_native!`
  - `post_install` 增加 `react_native_post_install`

2. AppDelegate 增加 RN 容器拉起逻辑
- 文件: `frontend/ios/App/App/AppDelegate.swift`
- 改动:
  - 引入 `React`
  - `dogproject://pet/...` / `dogproject://forum/...` Deep Link 由原生优先识别
  - 创建 `RCTBridge + RCTRootView`，在同一 iOS App 内全屏展示 RN 页面
  - 实现 `RCTBridgeDelegate`:
    - Debug: 读取 Metro (`index`)
    - Release: 读取内嵌 `rn_bundle/main.jsbundle`

3. RN 根组件支持 Native initialProps
- 文件: `rn-app/App.js`
- 改动:
  - 支持从 Native 注入 `launchUrl`，用于同工程内跳转落地

4. 产物脚本
- 文件: `frontend/package.json`
- 新增脚本:
  - `ios:pods:rn`: 在同一个 iOS 工程安装 Pod
  - `ios:rn:bundle`: 生成 RN iOS 离线 bundle 到 `frontend/ios/App/App/rn_bundle`

## 3. 如何生成产物

### 3.1 原生依赖产物（Pods）

在 `frontend` 目录执行:

```bash
npx pnpm ios:pods:rn
```

产物:
- `frontend/ios/App/Pods/`
- `frontend/ios/App/Podfile.lock`

### 3.2 RN JS 产物（Release 内嵌）

在 `frontend` 目录执行:

```bash
npx pnpm ios:rn:bundle
```

产物:
- `frontend/ios/App/App/rn_bundle/main.jsbundle`
- `frontend/ios/App/App/rn_bundle/assets/*`

### 3.3 Capacitor Web 产物（同工程保留）

在 `frontend` 目录执行:

```bash
npx pnpm ios:sync
```

产物:
- `frontend/dist/*`
- 同步后进入 `frontend/ios/App/App/public/*`

## 4. App 内放入哪些产物

1. 原生层
- Expo/RN Pod 依赖（编译期）
- `AppDelegate` 内 RN Host 逻辑（运行期）

2. JS 层
- Debug: Metro 实时服务 `rn-app/index.js`
- Release: `rn_bundle/main.jsbundle + assets`

3. Web 层
- Capacitor `public/*`（现有 H5 路径）

## 5. 运行联调步骤

1. 安装依赖（一次）
```bash
cd /Users/wclu/dog_project/rn-app && npm install
cd /Users/wclu/dog_project/frontend && npx pnpm ios:pods:rn
```

2. 开启 RN Metro（Debug）
```bash
cd /Users/wclu/dog_project/rn-app
npx expo start --dev-client
```

3. 启动同一 iOS 工程
```bash
cd /Users/wclu/dog_project/frontend
npx cap run ios --target <SIMULATOR_ID>
```

4. Deep Link 拉起 RN 容器
```bash
xcrun simctl openurl <SIMULATOR_ID> "dogproject://pet/1"
xcrun simctl openurl <SIMULATOR_ID> "dogproject://forum/1"
```

## 6. 风险与注意事项

1. `use_frameworks!` 与 React Native/Expo 版本组合可能导致 Pod 冲突。
2. Debug 模式依赖 Metro 服务，未启动会白屏。
3. Release 依赖 `rn_bundle/main.jsbundle`，打包前必须先执行 `ios:rn:bundle`。
4. 目前为“同工程内嵌首版”，尚未补齐:
- RN 页面关闭回调（Native dismiss）
- 崩溃与性能埋点
- 生产级 ticket 安全策略（持久化/签名/撤销）
