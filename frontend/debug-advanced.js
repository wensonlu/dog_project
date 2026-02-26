/**
 * 高级 Chrome 调试工具 - 带截图和性能监控
 *
 * 用法：
 *   node debug-advanced.js [URL]
 *   node debug-advanced.js http://localhost:5173 --screenshot
 *   node debug-advanced.js http://localhost:5173 --performance
 */

import puppeteer from 'puppeteer';
import { writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const url = process.argv[2] || 'http://localhost:5173';
const shouldScreenshot = process.argv.includes('--screenshot');
const shouldProfile = process.argv.includes('--performance');

(async () => {
  console.log('🚀 启动高级 Chrome 调试模式...');

  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    args: [
      '--start-maximized',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--auto-open-devtools-for-tabs'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  // 收集控制台消息
  const consoleLogs = [];
  page.on('console', msg => {
    const logEntry = {
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString()
    };
    consoleLogs.push(logEntry);
    console.log(`[${logEntry.type}] ${logEntry.text}`);
  });

  // 收集错误
  const errors = [];
  page.on('pageerror', error => {
    const errorEntry = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    };
    errors.push(errorEntry);
    console.error('❌ 页面错误:', error.message);
  });

  // 监控网络请求
  const requests = [];
  const responses = [];

  page.on('request', request => {
    requests.push({
      url: request.url(),
      method: request.method(),
      resourceType: request.resourceType(),
      timestamp: new Date().toISOString()
    });
  });

  page.on('response', response => {
    responses.push({
      url: response.url(),
      status: response.status(),
      statusText: response.statusText(),
      timestamp: new Date().toISOString()
    });
  });

  // 启动性能监控
  if (shouldProfile) {
    console.log('📊 启动性能监控...');
    await page.tracing.start({ screenshots: true, path: 'trace.json' });
  }

  console.log(`📱 正在访问: ${url}`);
  const startTime = Date.now();

  await page.goto(url, {
    waitUntil: 'networkidle2',
    timeout: 30000
  });

  const loadTime = Date.now() - startTime;
  console.log(`✅ 页面加载完成 (耗时: ${loadTime}ms)`);

  // 获取性能指标
  const performanceMetrics = await page.evaluate(() => {
    const perfData = performance.getEntriesByType('navigation')[0];
    return {
      domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
      domInteractive: perfData.domInteractive - perfData.fetchStart,
      loadComplete: perfData.loadEventEnd - perfData.fetchStart,
      ttfb: perfData.responseStart - perfData.requestStart
    };
  });

  console.log('📊 性能指标:');
  console.log(`  - DOM 内容加载: ${performanceMetrics.domContentLoaded.toFixed(2)}ms`);
  console.log(`  - DOM 可交互: ${performanceMetrics.domInteractive.toFixed(2)}ms`);
  console.log(`  - 完全加载: ${performanceMetrics.loadComplete.toFixed(2)}ms`);
  console.log(`  - TTFB: ${performanceMetrics.ttfb.toFixed(2)}ms`);

  // 截图
  if (shouldScreenshot) {
    const screenshotPath = join(__dirname, `screenshot-${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 截图已保存: ${screenshotPath}`);
  }

  // 停止性能跟踪
  if (shouldProfile) {
    await page.tracing.stop();
    console.log('📊 性能追踪已保存: trace.json');
    console.log('💡 在 Chrome DevTools 的 Performance 标签中打开 trace.json 查看详情');
  }

  // 生成调试报告
  const report = {
    url,
    loadTime,
    performanceMetrics,
    consoleLogs: consoleLogs.slice(-50), // 最后 50 条日志
    errors,
    networkSummary: {
      totalRequests: requests.length,
      failedRequests: responses.filter(r => r.status >= 400).length,
      apiRequests: requests.filter(r => r.resourceType === 'xhr' || r.resourceType === 'fetch').length
    },
    timestamp: new Date().toISOString()
  };

  const reportPath = join(__dirname, `debug-report-${Date.now()}.json`);
  await writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`📝 调试报告已保存: ${reportPath}`);

  console.log('\n💡 DevTools 已打开，您可以进行调试了');
  console.log('💡 按 Ctrl+C 退出');

  // 保持浏览器打开
})();
