# iOS RN Tab 与二维码 Bundle 开发流程

## 目标

当前 RN Tab 只在 iOS App 内展示。RN 页面运行容器仍然是现有主 App，不使用 Expo Go 或独立 RN App。首次集成或修改原生能力时需要重新编译 iOS；只修改 RN 页面代码时，只需要重新生成 `main.jsbundle`，通过主 App 扫码加载即可。

## 已接入能力

- iOS 主 App 已接入 React Native runtime，并通过 `RCTBridge` + `RCTRootView` 承载 RN 页面。
- iOS 主 App 注册了 `dogproject://` scheme。
- Web/Capacitor 侧底部导航在 iOS 原生环境显示 `RN` Tab，点击后打开 `dogproject://rn-demo`。
- 个人页在 iOS 原生环境显示 `扫码加载 RN`，用于扫描本地开发 bundle 二维码。
- RN bundle 支持内置 fallback，也支持扫码下载到 App sandbox 后热切换。
- Bundle manifest 带 `sha256` 校验，iOS 只接受本机或局域网地址。

## RN-only 开发流程

1. 修改 RN 页面代码：

```bash
cd /Users/wenson/dog_project/rn-app
```

主要入口：

- `/Users/wenson/dog_project/rn-app/App.js`
- `/Users/wenson/dog_project/rn-app/src/screens/RnDemoScreen.js`
- `/Users/wenson/dog_project/rn-app/src/navigation/linking.js`

2. 生成 JS bundle 并启动二维码服务：

```bash
pnpm bundle:qr
```

也可以从 frontend 目录启动：

```bash
cd /Users/wenson/dog_project/frontend
pnpm rn:bundle:qr
```

3. 保持终端服务运行，让 iPhone 和电脑在同一局域网。

4. 在主 App 中进入 `我的` 页面，点击 `扫码加载 RN`，扫描终端里的二维码。

5. 扫码成功后，主 App 会下载 manifest 指向的 `main.jsbundle`，校验 sha256，然后用主 App 内的 RN 容器打开页面。

## 什么时候需要重新编译 iOS

只改这些内容，不需要重新编译 iOS：

- RN 页面布局、样式、JS 业务逻辑
- RN navigation/linking 参数解析
- RN demo 页面内容

改这些内容，需要重新编译 iOS：

- `frontend/ios/App/App/*.swift`
- `frontend/ios/App/Podfile`
- 新增 RN 原生模块或 Expo module
- 修改 URL scheme、相机权限、Info.plist
- 修改 Capacitor/iOS 原生插件

## 常用命令

生成离线 bundle：

```bash
node /Users/wenson/dog_project/scripts/rn-bundle-manifest.mjs
```

生成 bundle 并展示二维码：

```bash
node /Users/wenson/dog_project/scripts/rn-bundle-manifest.mjs --serve
```

更新 Pods：

```bash
cd /Users/wenson/dog_project/frontend/ios/App
pod install
```

iOS 模拟器构建验证：

```bash
cd /Users/wenson/dog_project/frontend/ios/App
xcodebuild -workspace App.xcworkspace -scheme App -configuration Debug -sdk iphonesimulator -destination 'platform=iOS Simulator,name=iPhone 17' CODE_SIGNING_ALLOWED=NO -quiet build
```

## 当前限制

- `bundle:qr` 是离线 bundle 工作流，不是 Metro HMR。每次 RN JS 改动后需要重新跑一次 bundle 命令并扫码加载。
- 二维码服务默认只用于局域网开发，iOS 端会拒绝非本机/局域网 manifest 地址。
- 目前 RN Tab 为 iOS-only；Android 暂未接入。
