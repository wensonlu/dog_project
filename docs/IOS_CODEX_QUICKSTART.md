# Codex iOS App Quickstart

本文档用于换电脑后, 让 Codex 快速把本项目的 iOS App 跑到真机或模拟器上。重点是可复制的命令、设备识别、常见卡点和兜底路径。

## 适用范围

- 项目根目录: `dog_project`
- Web/Capacitor App: `frontend`
- iOS 工程: `frontend/ios/App/App.xcworkspace`
- App bundle id: `com.wenson.dogadopt`
- iOS deployment target: `15.1`
- 当前 Xcode 签名 Team: `DA9FH4698M`

注意: 本项目的 `frontend/ios/App/Podfile` 会引用仓库根目录下的 `rn-app`:

- `rn-app/node_modules/expo`
- `rn-app/node_modules/react-native`

所以换机后不能只安装 `frontend` 依赖, 还必须安装 `rn-app` 依赖。

## 1. 新机器前置检查

```bash
xcodebuild -version
xcode-select -p
node -v
pod --version
```

要求:

- macOS + Xcode 已安装, 且首次打开过 Xcode, 同意过 license。
- Node.js 20.x。
- CocoaPods 可用。如果没有:

```bash
sudo gem install cocoapods
```

如果使用真机:

- iPhone 用数据线连接 Mac。
- iPhone 已信任此电脑。
- iPhone 已开启 Developer Mode。
- Xcode 已登录可用于真机调试的 Apple ID。
- 首次真机运行后, 如果系统提示开发者不受信任, 在 iPhone 上进入 `设置 -> 通用 -> VPN与设备管理 -> 开发者App -> 信任`。

## 2. 拉代码并安装依赖

```bash
git clone https://github.com/wensonlu/dog_project.git dog_project
cd dog_project
```

安装前端依赖:

```bash
cd frontend
corepack enable
pnpm install
```

安装 RN/Expo 依赖:

```bash
cd ../rn-app
npm install
```

回到前端目录:

```bash
cd ../frontend
```

如果 Codex 的 shell 找不到全局 `pnpm`, 但依赖已经安装完成, 可以直接调用本地 bin:

```bash
./node_modules/.bin/vite build
./node_modules/.bin/cap sync ios
```

## 3. 同步 Web 改动到 iOS

推荐命令:

```bash
cd frontend
pnpm build
./node_modules/.bin/cap sync ios
```

等价脚本:

```bash
cd frontend
pnpm ios:sync
```

成功时会看到类似输出:

```text
Copying web assets from dist to ios/App/App/public
Updating iOS native dependencies with pod install
Sync finished
```

## 4. Xcode 签名配置

如果是新电脑或新 Apple ID, 先打开 workspace:

```bash
cd frontend
./node_modules/.bin/cap open ios
```

在 Xcode 中确认:

- 打开的是 `ios/App/App.xcworkspace`, 不是 `.xcodeproj`。
- `TARGETS -> App -> Signing & Capabilities`。
- 勾选 `Automatically manage signing`。
- 选择可用的 Team。
- Bundle Identifier 是唯一值。默认是 `com.wenson.dogadopt`; 如果 Team 无法签这个 id, 换成自己的反向域名, 例如 `com.<name>.dogadopt`。

签名配置通常需要人工在 Xcode UI 中确认一次。确认后再让 Codex 继续命令行启动。

## 5. 查找设备

真机和模拟器都可以先列出来:

```bash
xcrun xctrace list devices
xcrun devicectl list devices
```

`xctrace` 常用于拿 `cap run` 的 target:

```text
wenson (18.7.8) (00008140-001C115E3A0A801C)
iPhone 16 Pro Simulator (18.5) (49A2A721-1B43-4AC3-8D17-FE1675218A8E)
```

`devicectl` 常用于兜底安装/启动, 它可能显示另一个 CoreDevice identifier:

```text
wenson  3AF0D47E-192A-5641-BE0B-16752C186875  connected  iPhone 16
```

两个 id 都有用:

- `00008140-...` 这类 UDID: 给 `cap run ios --target`。
- `3AF0D47E-...` 这类 CoreDevice identifier: 给 `devicectl --device`。

## 6. 启动到真机

先确保已经完成同步:

```bash
cd frontend
./node_modules/.bin/cap sync ios
```

然后运行到真机:

```bash
DEVICE_UDID=00008140-001C115E3A0A801C
./node_modules/.bin/cap run ios --no-sync --target "$DEVICE_UDID"
```

说明:

- `--no-sync` 是刻意的。先手动 sync, 再 run, 可以减少 `cap run` 内部重复 sync/clean 带来的变量。
- 真机构建第一次可能很慢, 10 分钟级别也可能发生。
- 构建产物通常会在:

```text
frontend/ios/DerivedData/<DEVICE_UDID>/Build/Products/Debug-iphoneos/App.app
```

## 7. 启动到模拟器

查询已启动或可用模拟器:

```bash
xcrun simctl list devices available
```

如果已经有 booted 模拟器:

```bash
SIM_UDID=49A2A721-1B43-4AC3-8D17-FE1675218A8E
./node_modules/.bin/cap run ios --no-sync --target "$SIM_UDID"
```

如果没有启动模拟器:

```bash
xcrun simctl boot "$SIM_UDID"
open -a Simulator
./node_modules/.bin/cap run ios --no-sync --target "$SIM_UDID"
```

## 8. 常见问题和处理

### Codex 中 `pnpm` / `npx` 找不到

Codex 桌面环境的 PATH 可能很窄, 只暴露 App 自带的 `node`。优先让用户在普通终端完成:

```bash
corepack enable
cd frontend
pnpm install
```

依赖安装后, Codex 可直接用本地 bin:

```bash
cd frontend
./node_modules/.bin/vite build
./node_modules/.bin/cap sync ios
./node_modules/.bin/cap run ios --no-sync --target "$DEVICE_UDID"
```

### `pod install` 找不到 Expo 或 React Native

原因通常是 `rn-app/node_modules` 不存在。执行:

```bash
cd rn-app
npm install
cd ../frontend
./node_modules/.bin/cap sync ios
```

### `xcodebuild clean` 无法删除 `frontend/ios/App/build`

报错类似:

```text
Could not delete .../frontend/ios/App/build because it was not created by the build system.
To mark this directory as deletable by the build system, run:
xattr -w com.apple.xcode.CreatedByBuildSystem true .../frontend/ios/App/build
```

处理:

```bash
cd frontend
xattr -w com.apple.xcode.CreatedByBuildSystem true ios/App/build
./node_modules/.bin/cap sync ios
```

如果 `ios/App/build` 不存在, 跳过这一步。

### Codex 沙盒无法访问 CoreSimulator 或 Xcode DerivedData

症状包括:

```text
CoreSimulatorService connection became invalid
Unable to create log store directory at ~/Library/Developer/Xcode/DerivedData
Operation not permitted
```

处理:

- 在 Codex 中对相关命令使用提升权限运行。
- 典型需要提升权限的命令:

```bash
xcrun simctl list devices available
xcrun xctrace list devices
xcrun devicectl list devices
./node_modules/.bin/cap sync ios
./node_modules/.bin/cap run ios --no-sync --target "$DEVICE_UDID"
```

### `cap run` 构建成功但部署失败: `ERR_UNKNOWN`

如果看到:

```text
Running xcodebuild in ...
Deploying App.app to ... - failed!
ERR_UNKNOWN: There was an error launching app on device
```

先找到 `.app`:

```bash
cd frontend
find ios/DerivedData -name App.app -type d
```

然后用 `devicectl` 手动安装并启动。先确认设备 id:

```bash
xcrun devicectl list devices
```

安装:

```bash
DEVICE_ID=3AF0D47E-192A-5641-BE0B-16752C186875
APP_PATH=ios/DerivedData/00008140-001C115E3A0A801C/Build/Products/Debug-iphoneos/App.app
xcrun devicectl device install app --device "$DEVICE_ID" "$APP_PATH"
```

启动:

```bash
xcrun devicectl device process launch --device "$DEVICE_ID" com.wenson.dogadopt --terminate-existing
```

如果仍然失败, 追加详细日志:

```bash
xcrun devicectl device install app --device "$DEVICE_ID" "$APP_PATH" --verbose
xcrun devicectl device process launch --device "$DEVICE_ID" com.wenson.dogadopt --terminate-existing --verbose
```

### 真机显示 unavailable

检查:

- 数据线连接是否稳定。
- iPhone 是否解锁并信任此电脑。
- Developer Mode 是否开启。
- Xcode 是否能在 `Window -> Devices and Simulators` 里看到设备。
- `xcrun devicectl device info details --device <DEVICE_ID>` 是否显示 `developerModeStatus: enabled` 和 `pairingState: paired`。

## 9. Codex 推荐执行顺序

给 Codex 的最短路径:

```bash
cd frontend
./node_modules/.bin/vite build
./node_modules/.bin/cap sync ios
xcrun xctrace list devices
./node_modules/.bin/cap run ios --no-sync --target "$DEVICE_UDID"
```

如果 `cap run` 只在部署阶段失败:

```bash
find ios/DerivedData -name App.app -type d
xcrun devicectl list devices
xcrun devicectl device install app --device "$DEVICE_ID" "$APP_PATH"
xcrun devicectl device process launch --device "$DEVICE_ID" com.wenson.dogadopt --terminate-existing
```

## 10. 本次验证记录

在当前机器上验证过的事实:

- `./node_modules/.bin/vite build` 成功。
- `./node_modules/.bin/cap sync ios` 成功。
- 真机 `wenson`, iPhone 16, iOS 18.7.8, Developer Mode enabled, wired connected。
- 真机 UDID: `00008140-001C115E3A0A801C`。
- CoreDevice identifier: `3AF0D47E-192A-5641-BE0B-16752C186875`。
- `cap run ios --no-sync --target 00008140-001C115E3A0A801C` 完成了 `xcodebuild`, 但 Capacitor 部署阶段返回 `ERR_UNKNOWN`。
- 遇到过 `ios/App/build` 缺少 `com.apple.xcode.CreatedByBuildSystem` 标记导致 clean 失败, 可用 `xattr` 处理。
