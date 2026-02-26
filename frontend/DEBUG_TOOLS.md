# Chrome 调试工具使用指南

本项目已安装 Puppeteer 用于前端 Chrome 浏览器调试。

## 已安装的工具

- **Puppeteer v24.37.5**: Chrome DevTools Protocol 客户端库

## 使用方法

### 1. 基础调试模式

自动打开 Chrome 浏览器并启动 DevTools：

```bash
# 调试本地开发服务器（默认 http://localhost:5173）
pnpm debug:local

# 或者调试任意 URL
pnpm debug
node debug-browser.js https://example.com
```

**功能特性：**
- ✅ 自动打开 Chrome 并启动 DevTools
- ✅ 实时显示控制台日志（console.log, console.error 等）
- ✅ 监控页面错误
- ✅ 追踪网络请求和响应
- ✅ 禁用跨域限制（方便本地开发）

### 2. 高级调试模式

提供性能监控、截图和调试报告：

```bash
# 基础使用
node debug-advanced.js http://localhost:5173

# 带截图
node debug-advanced.js http://localhost:5173 --screenshot

# 带性能监控
node debug-advanced.js http://localhost:5173 --performance

# 完整功能
node debug-advanced.js http://localhost:5173 --screenshot --performance
```

**功能特性：**
- ✅ 所有基础调试功能
- ✅ 性能指标收集（DOM 加载、可交互时间、TTFB 等）
- ✅ 全页面截图
- ✅ 性能追踪（生成 trace.json 文件）
- ✅ 生成 JSON 格式的调试报告

## 调试工作流程

### 开发时使用

1. 启动开发服务器：
   ```bash
   pnpm dev
   ```

2. 在另一个终端启动调试工具：
   ```bash
   pnpm debug:local
   ```

3. Chrome 会自动打开并显示 DevTools，您可以：
   - 在 Console 面板查看日志
   - 在 Network 面板监控请求
   - 在 Elements 面板检查 DOM
   - 在 Sources 面板设置断点

### 性能分析

1. 运行带性能监控的调试：
   ```bash
   node debug-advanced.js http://localhost:5173 --performance
   ```

2. 在 Chrome DevTools 中打开生成的 `trace.json`：
   - 打开 DevTools
   - 切换到 Performance 标签
   - 点击 "Load profile" 按钮
   - 选择生成的 `trace.json` 文件

3. 分析性能瓶颈：
   - 查看帧率
   - 识别长任务
   - 分析渲染时间
   - 检查内存使用

### 生成调试报告

运行高级调试模式会自动生成 JSON 格式的调试报告，包含：
- 页面加载时间
- 性能指标
- 控制台日志
- 错误信息
- 网络请求统计

报告文件保存在 `frontend/debug-report-{timestamp}.json`

## 常见使用场景

### 场景 1: 调试 API 请求

```bash
pnpm debug:local
```

在终端中会实时显示所有 API 请求和响应：
```
📡 API 请求: GET http://localhost:3000/api/dogs
📥 API 响应: 200 http://localhost:3000/api/dogs
```

### 场景 2: 查找页面错误

```bash
pnpm debug:local
```

所有 JavaScript 错误会在终端显示：
```
❌ 页面错误: Uncaught TypeError: Cannot read property 'name' of undefined
```

### 场景 3: 性能优化

```bash
node debug-advanced.js http://localhost:5173 --performance --screenshot
```

查看性能报告：
```
📊 性能指标:
  - DOM 内容加载: 245.30ms
  - DOM 可交互: 312.50ms
  - 完全加载: 458.20ms
  - TTFB: 23.40ms
```

### 场景 4: 视觉回归测试

```bash
# 生成基准截图
node debug-advanced.js http://localhost:5173 --screenshot

# 修改代码后再次截图
node debug-advanced.js http://localhost:5173 --screenshot

# 对比两张截图查看视觉变化
```

## 自定义配置

您可以修改 `debug-browser.js` 或 `debug-advanced.js` 来自定义调试行为：

```javascript
// 修改浏览器启动参数
const browser = await puppeteer.launch({
  headless: false,  // 改为 true 可以无头模式运行
  slowMo: 50,       // 调整操作速度
  // ... 其他配置
});

// 修改视口大小
await page.setViewport({ width: 1920, height: 1080 });
```

## 进阶用法

### 自动化测试脚本

您可以基于这些工具创建自动化测试脚本：

```javascript
import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();

await page.goto('http://localhost:5173');

// 测试登录流程
await page.type('#username', 'testuser');
await page.type('#password', 'password123');
await page.click('#login-button');

await page.waitForSelector('#dashboard');
console.log('✅ 登录成功');

await browser.close();
```

### 集成到 CI/CD

在 `package.json` 中添加：

```json
"scripts": {
  "test:e2e": "node debug-advanced.js http://localhost:5173 --screenshot",
  "ci": "pnpm build && pnpm test:e2e"
}
```

## 技巧和最佳实践

1. **开发时保持调试窗口打开**：可以实时看到所有日志和错误
2. **使用 --screenshot 记录问题**：当发现 bug 时截图保存证据
3. **定期生成性能报告**：跟踪性能趋势
4. **结合 React DevTools**：Puppeteer + React DevTools = 完整调试体验

## 故障排除

### 问题：Chrome 无法启动

确保系统已安装 Chrome/Chromium：
```bash
# macOS
brew install --cask google-chrome

# Linux
sudo apt-get install chromium-browser
```

### 问题：权限错误

运行以下命令批准构建脚本：
```bash
pnpm approve-builds
```

### 问题：端口占用

确保开发服务器正在运行：
```bash
pnpm dev
```

## 相关资源

- [Puppeteer 官方文档](https://pptr.dev/)
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)
- [Puppeteer Examples](https://github.com/puppeteer/puppeteer/tree/main/examples)

## 许可证

与项目主许可证一致。
