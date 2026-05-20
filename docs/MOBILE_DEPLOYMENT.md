# 移动应用发布指南

本文档说明如何将 Web App 打包并发布到 iOS App Store 和 Google Play Store。

## 技术方案选择

### 推荐方案：Capacitor

**Capacitor** 是 Ionic 团队开发的跨平台框架，可以将现有的 Web App 打包成原生应用。

**优势**：
- ✅ 无需重写代码，直接使用现有 React 代码
- ✅ 支持 Vite 构建工具
- ✅ 可以访问原生功能（相机、推送通知、文件系统等）
- ✅ 同时支持 iOS 和 Android
- ✅ 维护活跃，文档完善

**其他方案对比**：
- **React Native**：需要重写代码，不推荐
- **Cordova**：较老的技术，不推荐
- **PWA + TWA**：Android 支持好，iOS 支持有限

## 实施步骤

### 阶段一：项目准备

#### 1. 安装 Capacitor

```bash
cd frontend
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios @capacitor/android
```

#### 2. 初始化 Capacitor

```bash
npx cap init
```

配置信息：
- **App name**: Dog Project（或你的应用名称）
- **App ID**: com.yourcompany.dogproject（反向域名格式，如：com.wensons.dogproject）
- **Web dir**: dist（Vite 构建输出目录）

#### 3. 配置 Vite 构建

确保 `vite.config.js` 配置了正确的 `base` 路径：

```javascript
export default defineConfig({
  plugins: [react()],
  base: './', // 重要：使用相对路径
  build: {
    outDir: 'dist',
  }
})
```

#### 4. 构建 Web 应用

```bash
npm run build
```

#### 5. 添加平台

```bash
npx cap add ios
npx cap add android
```

### 阶段二：iOS 配置

#### 1. 安装依赖

**macOS 必需**：
- Xcode（从 App Store 安装）
- CocoaPods：`sudo gem install cocoapods`
- Node.js（已安装）

#### 2. 同步代码到 iOS

```bash
npx cap sync ios
```

#### 3. 在 Xcode 中打开项目

```bash
npx cap open ios
```

#### 4. 配置应用信息

在 Xcode 中：
1. 选择项目 → **General**
2. 设置 **Display Name**（应用显示名称）
3. 设置 **Bundle Identifier**（必须与 `capacitor.config.ts` 中的 `appId` 一致）
4. 设置 **Version** 和 **Build** 号
5. 配置 **Signing & Capabilities**：
   - 选择你的 **Team**（需要 Apple Developer 账号）
   - 启用 **Capabilities**（如需要相机、推送通知等）

#### 5. 配置图标和启动画面

- **App Icon**：在 `ios/App/App/Assets.xcassets/AppIcon.appiconset/` 添加图标
- **Launch Screen**：在 `ios/App/App/Assets.xcassets/LaunchImage.imageset/` 添加启动图

**图标尺寸要求**：
- 需要多种尺寸：20x20, 29x29, 40x40, 60x60, 76x76, 83.5x83.5, 1024x1024 等
- 可以使用在线工具生成：https://www.appicon.co/

#### 6. 测试应用

在 Xcode 中：
1. 选择目标设备（模拟器或真机）
2. 点击 **Run** 按钮（⌘R）运行应用

#### 7. 准备发布

**Archive 构建**：
1. 选择 **Product** → **Archive**
2. 等待构建完成
3. 在 **Organizer** 窗口中选择 Archive
4. 点击 **Distribute App**

**发布选项**：
- **App Store Connect**：发布到 App Store
- **Ad Hoc**：内部测试
- **Enterprise**：企业分发
- **Development**：开发测试

### 阶段三：Android 配置

#### 1. 安装依赖

**必需**：
- Android Studio（下载：https://developer.android.com/studio）
- Java Development Kit (JDK) 17 或更高版本
- Android SDK（通过 Android Studio 安装）

#### 2. 配置环境变量

在 `~/.zshrc` 或 `~/.bash_profile` 中添加：

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

#### 3. 同步代码到 Android

```bash
npx cap sync android
```

#### 4. 在 Android Studio 中打开项目

```bash
npx cap open android
```

#### 5. 配置应用信息

在 `android/app/build.gradle` 中：
```gradle
android {
    defaultConfig {
        applicationId "com.yourcompany.dogproject"
        minSdkVersion 22
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
    }
}
```

#### 6. 配置图标和启动画面

- **App Icon**：在 `android/app/src/main/res/` 各分辨率目录下添加 `ic_launcher.png`
- **启动画面**：可以配置 Splash Screen

**图标尺寸要求**：
- mipmap-mdpi: 48x48
- mipmap-hdpi: 72x72
- mipmap-xhdpi: 96x96
- mipmap-xxhdpi: 144x144
- mipmap-xxxhdpi: 192x192

#### 7. 生成签名密钥

```bash
keytool -genkey -v -keystore dog-project-release.keystore -alias dog-project -keyalg RSA -keysize 2048 -validity 10000
```

**重要**：妥善保管密钥文件，丢失后无法更新应用！

#### 8. 配置签名

在 `android/app/build.gradle` 中添加：

```gradle
android {
    signingConfigs {
        release {
            storeFile file('../dog-project-release.keystore')
            storePassword 'your-store-password'
            keyAlias 'dog-project'
            keyPassword 'your-key-password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

#### 9. 构建 APK/AAB

**Debug APK**（测试用）：
```bash
cd android
./gradlew assembleDebug
```

**Release AAB**（发布到 Play Store）：
```bash
./gradlew bundleRelease
```

输出文件：`android/app/build/outputs/bundle/release/app-release.aab`

### 阶段四：应用商店发布

#### iOS App Store 发布

**前置要求**：
1. **Apple Developer 账号**（$99/年）
   - 注册：https://developer.apple.com/programs/
2. **App Store Connect** 账号
   - 登录：https://appstoreconnect.apple.com/

**发布流程**：

1. **创建 App 记录**
   - 登录 App Store Connect
   - 点击 **我的 App** → **+** → **新建 App**
   - 填写应用信息：
     - 平台：iOS
     - 名称：Dog Project
     - 主要语言：简体中文
     - Bundle ID：选择已注册的 Bundle ID
     - SKU：唯一标识符

2. **配置应用信息**
   - **应用信息**：名称、副标题、类别等
   - **定价和销售范围**：价格、可用国家/地区
   - **App 隐私**：隐私政策 URL、数据收集说明

3. **准备应用截图和描述**
   - **截图**：需要多种设备尺寸
     - iPhone 6.7" (1290 x 2796)
     - iPhone 6.5" (1284 x 2778)
     - iPhone 5.5" (1242 x 2208)
   - **描述**：应用描述、关键词、宣传文本
   - **图标**：1024x1024 PNG
   - **隐私政策 URL**：必需

4. **提交审核**
   - 在 Xcode 中 Archive 并上传
   - 或在 App Store Connect 中上传构建版本
   - 填写版本信息
   - 提交审核

5. **审核时间**
   - 通常 1-3 个工作日
   - 可能被拒绝，需要根据反馈修改

#### Google Play Store 发布

**前置要求**：
1. **Google Play Console** 账号（$25 一次性费用）
   - 注册：https://play.google.com/console/

**发布流程**：

1. **创建应用**
   - 登录 Google Play Console
   - 点击 **创建应用**
   - 填写应用信息：
     - 应用名称：Dog Project
     - 默认语言：简体中文
     - 应用或游戏：应用
     - 免费或付费：免费

2. **配置应用内容**
   - **应用访问权限**：声明应用权限
   - **广告**：是否包含广告
   - **内容分级**：完成内容分级问卷
   - **目标受众**：选择目标受众

3. **准备应用资源**
   - **图标**：512x512 PNG
   - **功能图片**：1024x500 PNG（可选）
   - **截图**：至少 2 张，最多 8 张
     - 手机：16:9 或 9:16
     - 平板：16:9 或 9:16
   - **应用描述**：简短描述和完整描述
   - **隐私政策 URL**：必需

4. **上传应用**
   - 进入 **发布** → **生产环境**
   - 点击 **创建新版本**
   - 上传 AAB 文件
   - 填写版本说明

5. **提交审核**
   - 检查所有必填项
   - 点击 **开始发布到生产环境**
   - 审核时间：通常几小时到几天

## 常见功能配置

### 1. 相机权限（上传图片）

**iOS (`ios/App/App/Info.plist`)**：
```xml
<key>NSCameraUsageDescription</key>
<string>需要访问相机来上传宠物照片</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>需要访问相册来选择照片</string>
```

**Android (`android/app/src/main/AndroidManifest.xml`)**：
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
```

### 2. 网络权限

**Android**（通常已自动添加）：
```xml
<uses-permission android:name="android.permission.INTERNET" />
```

### 3. 推送通知

需要安装插件：
```bash
npm install @capacitor/push-notifications
```

### 4. 状态栏样式

安装插件：
```bash
npm install @capacitor/status-bar
```

## 持续集成/部署

### 自动化构建脚本

创建 `scripts/build-mobile.sh`：

```bash
#!/bin/bash

# 构建 Web 应用
cd frontend
npm run build

# 同步到原生平台
npx cap sync ios
npx cap sync android

echo "构建完成！"
```

### GitHub Actions 示例

可以配置 GitHub Actions 自动构建和发布（需要配置证书和密钥）。

## 成本估算

### iOS App Store
- **Apple Developer 账号**：$99/年
- **应用审核**：免费
- **应用内购买手续费**：30%（第一年），15%（后续）

### Google Play Store
- **Google Play Console**：$25 一次性费用
- **应用审核**：免费
- **应用内购买手续费**：15-30%

## 注意事项

1. **隐私政策**：应用商店要求必须有隐私政策页面
2. **应用图标**：必须符合各平台的设计规范
3. **测试**：发布前务必在真机上测试
4. **版本管理**：每次更新需要递增版本号
5. **审核时间**：iOS 审核通常更严格，时间更长
6. **证书管理**：妥善保管签名证书和密钥

## 推荐工具

- **图标生成**：https://www.appicon.co/
- **截图工具**：Fastlane Screenshots
- **CI/CD**：Fastlane（iOS/Android 自动化工具）

## 相关文档

- [Capacitor 官方文档](https://capacitorjs.com/docs)
- [iOS 发布指南](https://developer.apple.com/app-store/review/guidelines/)
- [Android 发布指南](https://developer.android.com/distribute/googleplay/start)
- [React Native CLI vs Expo 选型调研（本项目）](./RN_EXPO_TECH_SELECTION.md)

## 快速开始命令

```bash
# 1. 安装 Capacitor
cd frontend
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android

# 2. 初始化
npx cap init

# 3. 构建
npm run build

# 4. 添加平台
npx cap add ios
npx cap add android

# 5. 同步
npx cap sync

# 6. 打开项目
npx cap open ios      # macOS only
npx cap open android
```

---

**提示**：建议先在测试环境充分测试，再提交到应用商店审核。
