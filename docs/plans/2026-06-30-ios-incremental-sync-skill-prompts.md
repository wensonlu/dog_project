# iOS Incremental Sync Skill Prompts

## Prompt 1：从零创建或更新 Skill

```text
你是 Dog Project 的 Codex 工程助手。请帮我创建/更新一个 project-local skill：ios-incremental-sync。

目标：
- 监听或分析当前仓库的 H5、React Native、iOS 相关代码变化。
- 如果只有 H5 代码变化，只执行 H5 build 并复制到 iOS 项目，不重新编译 RN 或 iOS。
- 如果只有 RN JS 代码变化，只重新生成 RN iOS bundle，并同步到 iOS 项目。
- 如果涉及 native-impact 变化，只提示需要 deliberate native rebuild，不要静默执行 Xcode build，除非我明确要求。

项目路径规则：
- H5 路径：
  - frontend/src/**
  - frontend/public/**
  - frontend/index.html
  - frontend/vite.config.js
  - frontend/vitest.config.js
  - frontend/tailwind.config.js
  - frontend/postcss.config.js
  - frontend/eslint.config.js
- RN JS 路径：
  - rn-app/App.js
  - rn-app/index.js
  - rn-app/app.json
  - rn-app/metro.config.js
  - rn-app/src/**
  - rn-app/assets/**
- Native-impact 路径：
  - frontend/ios/**
  - rn-app/ios/**
  - rn-app/android/**
  - frontend/capacitor.config.json
  - frontend/package.json
  - frontend/pnpm-lock.yaml
  - frontend/package-lock.json
  - frontend/ios/App/Podfile
  - frontend/ios/App/Podfile.lock
  - rn-app/package.json
  - rn-app/pnpm-lock.yaml
  - rn-app/package-lock.json

必须忽略生成产物：
- node_modules/**
- frontend/dist/**
- frontend/ios/App/App/public/**
- frontend/ios/App/App/rn_bundle/**
- rn-app/dist/**
- rn-app/.expo/**
- .git/**

动作规则：
- h5-sync: cd frontend && pnpm build && npx cap copy ios
- rn-bundle: cd rn-app && pnpm bundle:ios
- native-build: 只输出提示和推荐命令，不自动执行

混合变更执行顺序：
1. h5-sync
2. rn-bundle
3. native-build 提示

请交付：
1. .agents/skills/ios-incremental-sync/SKILL.md
2. .agents/skills/ios-incremental-sync/scripts/ios-incremental-sync.mjs
3. .agents/skills/ios-incremental-sync/test/classify-changes.test.mjs

脚本要求：
- 支持 --dry-run --changed path1,path2
- 支持 --dry-run --since HEAD
- 支持 --watch
- watch 使用 git status --porcelain=v1 轮询即可，带 snapshot 去抖，避免并发执行
- 导出 classifyChangedPaths(paths)，方便测试

测试要求：
- H5-only -> actions: ["h5-sync"]
- RN JS-only -> actions: ["rn-bundle"]
- Native-impact -> actions: ["native-build"]
- H5 + RN JS -> actions: ["h5-sync", "rn-bundle"]
- 生成产物和 docs -> actions: []

实现方式：
- 先写分类测试，确认失败。
- 再实现脚本和 SKILL.md。
- 最后运行 node --test .agents/skills/ios-incremental-sync/test/classify-changes.test.mjs。
```

## Prompt 2：让 Codex 执行一次增量同步

```text
请使用 ios-incremental-sync skill，根据当前工作区变化判断最低成本同步动作，并执行安全动作。

要求：
- 先 dry-run 输出变更分类和 actions。
- 如果只有 H5 变化，执行：cd frontend && pnpm build && npx cap copy ios。
- 如果只有 RN JS 变化，执行：cd rn-app && pnpm bundle:ios。
- 如果 H5 + RN JS 混合变化，先 H5 build/copy，再 RN bundle。
- 如果包含 native-impact 变化，说明触发路径和推荐 rebuild 命令；除非我明确要求，不要自动跑 Xcode build。
- 忽略 frontend/dist、frontend/ios/App/App/public、frontend/ios/App/App/rn_bundle、rn-app/dist、node_modules 等生成产物。

最后请汇报：
- 变更分类
- 执行了哪些命令
- 哪些命令通过/失败
- 是否需要 native rebuild
```

## Prompt 3：启动 watch 开发模式

```text
请使用 ios-incremental-sync skill，启动开发监听模式，监听当前 git 工作区变化并自动执行最低成本同步。

监听要求：
- 使用脚本：node .agents/skills/ios-incremental-sync/scripts/ios-incremental-sync.mjs --watch
- 观察输出，告诉我监听已经启动。
- 如果出现 h5-sync 或 rn-bundle，说明触发路径和执行结果。
- 如果出现 native-build，只提示我需要 deliberate iOS rebuild，不要自动重编。

如果监听进程需要长期运行，请保持 session，并在我问状态时读取最新输出。
```

## Prompt 4：native 变更后请求真机安装

```text
当前已经有 native-impact 变更。我确认需要重新编译并安装到真机。

请使用 ios-incremental-sync 的判断结果，并执行：
1. 如有 H5 变化，先 cd frontend && pnpm build && npx cap copy ios
2. 如有 RN JS 变化，再 cd rn-app && pnpm bundle:ios
3. 编译 iOS 真机 Debug 包
4. 安装到当前已连接真机
5. 用主要 deeplink 拉起 App 验证入口

注意：
- 编译前先确认设备 ID。
- 不要清空 DerivedData，除非出现明确缓存问题。
- 不要 revert 任何我已有的工作区改动。
- 最后汇报 build/install/deeplink 验证结果。
```

## Prompt 5：修改分类规则

```text
请更新 ios-incremental-sync skill 的分类规则。

新增规则：
- [在这里写新增路径或例外]

要求：
- 先更新 .agents/skills/ios-incremental-sync/test/classify-changes.test.mjs，覆盖新增规则。
- 确认测试失败。
- 再更新 .agents/skills/ios-incremental-sync/scripts/ios-incremental-sync.mjs。
- 如 SKILL.md 的决策表也需要变化，同步更新文档。
- 运行分类测试确认通过。
- 不要改无关文件。
```
