# iOS Incremental Sync Skill 开发文档

## 背景

Dog Project 现在同时包含 H5、React Native 和 iOS 宿主工程。开发时如果每次改动都重新编译 iOS 真机包，反馈链路会很慢；但如果一律只复制产物，又容易漏掉 native 变更。

`ios-incremental-sync` skill 的目标是把“文件变化 -> 最低成本同步动作”固化下来：

- 只有 H5 代码变化：构建 H5，然后 `cap copy ios`。
- 只有 RN JS 代码变化：重新生成 RN bundle 并同步到 iOS 工程。
- 触及 iOS、Capacitor 配置、依赖或 Pod 相关文件：提示需要 deliberate native rebuild，不静默重编。

## 文件位置

Skill 主文件：

```text
.agents/skills/ios-incremental-sync/SKILL.md
```

执行脚本：

```text
.agents/skills/ios-incremental-sync/scripts/ios-incremental-sync.mjs
```

分类测试：

```text
.agents/skills/ios-incremental-sync/test/classify-changes.test.mjs
```

## 核心设计

Skill 本身负责告诉 Codex “什么时候该用、应该怎么判断、应该执行哪些命令”。脚本负责把这个判断变成可重复执行的工具。

整体流程是：

```text
读取变更文件
  -> 过滤生成产物和无关目录
  -> 按路径分类 H5 / RN JS / Native
  -> 生成 action 列表
  -> 按固定顺序执行或提示
```

### 1. 变更来源

脚本支持三种输入：

```bash
# 手动指定文件
node .agents/skills/ios-incremental-sync/scripts/ios-incremental-sync.mjs --dry-run --changed frontend/src/App.jsx,rn-app/App.js

# 对比某个 git ref
node .agents/skills/ios-incremental-sync/scripts/ios-incremental-sync.mjs --dry-run --since HEAD

# 监听当前工作区 git status
node .agents/skills/ios-incremental-sync/scripts/ios-incremental-sync.mjs --watch
```

`--watch` 不是文件系统事件监听，而是轮询 `git status --porcelain=v1`。这样做的好处是实现简单、跨平台稳定，也天然只关注工作区中真正变更的文件。

### 2. 忽略路径

脚本会忽略会造成循环触发的生成产物：

```text
frontend/dist/**
frontend/ios/App/App/public/**
frontend/ios/App/App/rn_bundle/**
rn-app/dist/**
rn-app/.expo/**
node_modules/**
.git/**
```

这些目录都是构建或同步命令的输出。如果不忽略，watch 模式会在构建后再次发现新变更，然后反复触发。

### 3. H5 分类

H5 变化包括：

```text
frontend/src/**
frontend/public/**
frontend/index.html
frontend/vite.config.js
frontend/vitest.config.js
frontend/tailwind.config.js
frontend/postcss.config.js
frontend/eslint.config.js
```

对应动作：

```bash
cd frontend
pnpm build
npx cap copy ios
```

这里使用 `cap copy ios`，不是 `cap sync ios`。因为 H5-only 改动只需要复制 WebView 资源，不需要重新处理插件、Pod 或 native 依赖。

### 4. RN JS 分类

RN JS 变化包括：

```text
rn-app/App.js
rn-app/index.js
rn-app/app.json
rn-app/metro.config.js
rn-app/src/**
rn-app/assets/**
```

对应动作：

```bash
cd rn-app
pnpm bundle:ios
```

这个命令会生成：

```text
frontend/ios/App/App/rn_bundle/main.jsbundle
frontend/ios/App/App/rn_bundle/main.jsbundle.map
frontend/ios/App/App/rn_bundle/rn-bundle-manifest.json
```

这些输出路径已被 watch 忽略，避免 bundle 生成后再次触发 RN bundle。

### 5. Native-impact 分类

Native-impact 包括：

```text
frontend/ios/**
rn-app/ios/**
rn-app/android/**
frontend/capacitor.config.json
frontend/package.json
frontend/pnpm-lock.yaml
frontend/package-lock.json
frontend/ios/App/Podfile
frontend/ios/App/Podfile.lock
rn-app/package.json
rn-app/pnpm-lock.yaml
rn-app/package-lock.json
```

对应动作不是直接重编，而是提示：

```bash
cd frontend/ios/App
pod install
xcodebuild -workspace App.xcworkspace -scheme App -configuration Debug -sdk iphonesimulator -destination 'platform=iOS Simulator,name=iPhone 17' CODE_SIGNING_ALLOWED=NO -quiet build
```

原因是 native build 可能耗时、依赖签名和设备状态，也可能需要开发者确认是否要真机安装。因此 skill 的规则是：native 只提示，除非用户明确要求自动重编或启动真机。

## 混合变更顺序

如果一次提交里有多类变化，动作按固定顺序执行：

1. H5：`pnpm build && npx cap copy ios`
2. RN：`pnpm bundle:ios`
3. Native：提示 native rebuild

例如：

| 变更 | 动作 |
| --- | --- |
| `frontend/src/App.jsx` | `h5-sync` |
| `rn-app/src/screens/RnDemoScreen.js` | `rn-bundle` |
| `frontend/src/App.jsx` + `rn-app/App.js` | `h5-sync` -> `rn-bundle` |
| `rn-app/src/App.js` + `rn-app/package.json` | `rn-bundle` -> `native-build` 提示 |
| `frontend/ios/App/App/RNHostManager.swift` | `native-build` 提示 |

## Watch 模式机制

`--watch` 的关键实现点：

- 每隔 `intervalMs` 读取一次 `git status --porcelain=v1`。
- 把变更文件列表排序后拼成 snapshot key。
- 如果 key 为空或和上次相同，不执行。
- 如果正在执行上一次同步，跳过本轮，避免并发构建。
- 每次只根据最新 snapshot 分类并执行 action。

这相当于一个轻量 debounce：

```text
git status changed
  -> snapshot key different
  -> running = true
  -> classify
  -> execute
  -> running = false
```

## 测试策略

分类逻辑必须有测试覆盖。当前测试覆盖了：

- H5-only 只触发 `h5-sync`
- RN JS-only 只触发 `rn-bundle`
- iOS/Pod/package 触发 `native-build`
- H5 + RN 混合触发两个动作
- 生成产物和 docs 不触发动作

运行方式：

```bash
node --test .agents/skills/ios-incremental-sync/test/classify-changes.test.mjs
```

扩展分类规则时，先补测试，再改脚本。

## 扩展指南

### 新增 H5 触发路径

如果新增了 H5 配置文件，例如 `frontend/i18n.config.js`：

1. 在脚本的 `h5Files` 添加路径。
2. 在测试里补一个 H5-only case。
3. 运行分类测试。

### 新增 RN JS 触发路径

如果新增了 RN 路由或资源目录，例如 `rn-app/navigation/**`：

1. 在 `rnJsPrefixes` 添加路径。
2. 补 RN-only 测试。
3. 运行分类测试。

### 新增 Native-impact 路径

只要路径可能影响 Pod、Capacitor plugin、原生编译、签名、权限或依赖解析，都归入 native。

宁可误报 native build，也不要漏报。

## 常见坑

- 不要监听生成产物，否则会构建循环。
- 不要把 `package.json` 和 lockfile 当 JS-only，依赖可能触发 native autolinking。
- H5-only 不要用 `cap sync ios`，会引入不必要的 Pod/plugin 操作。
- Native-impact 不要自动真机编译，除非用户明确要求。
- Watch 模式依赖 git 工作区；未被 git 感知的临时文件不会进入判断。

## 推荐日常用法

开发时开一个终端跑：

```bash
node .agents/skills/ios-incremental-sync/scripts/ios-incremental-sync.mjs --watch
```

提交或验证前跑 dry-run：

```bash
node .agents/skills/ios-incremental-sync/scripts/ios-incremental-sync.mjs --dry-run --since HEAD
```

如果 dry-run 输出包含 `native-build`，再决定是否执行 iOS rebuild 或真机安装。
