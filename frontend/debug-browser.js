/**
 * Puppeteer Chrome 调试工具
 *
 * 用法：node debug-browser.js [URL]
 * 例如：node debug-browser.js http://localhost:5173
 */

import puppeteer from 'puppeteer';

const url = process.argv[2] || 'http://localhost:5173';

(async () => {
  console.log('🚀 启动 Chrome 调试模式...');

  const browser = await puppeteer.launch({
    headless: false, // 显示浏览器窗口
    devtools: true,  // 自动打开 DevTools
    slowMo: 50,      // 减慢操作速度以便观察
    args: [
      '--start-maximized',
      '--disable-web-security', // 开发时禁用跨域限制
      '--disable-features=IsolateOrigins,site-per-process',
      '--auto-open-devtools-for-tabs'
    ]
  });

  const page = await browser.newPage();

  // 设置视口大小
  await page.setViewport({ width: 1920, height: 1080 });

  // 监听控制台输出
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    console.log(`[浏览器 ${type}]`, text);
  });

  // 监听页面错误
  page.on('pageerror', error => {
    console.error('❌ 页面错误:', error.message);
  });

  // 监听请求失败
  page.on('requestfailed', request => {
    console.error('❌ 请求失败:', request.url(), request.failure()?.errorText);
  });

  // 监听网络请求
  page.on('request', request => {
    if (request.resourceType() === 'xhr' || request.resourceType() === 'fetch') {
      console.log('📡 API 请求:', request.method(), request.url());
    }
  });

  // 监听网络响应
  page.on('response', async response => {
    if (response.request().resourceType() === 'xhr' || response.request().resourceType() === 'fetch') {
      console.log('📥 API 响应:', response.status(), response.url());
    }
  });

  console.log(`📱 正在访问: ${url}`);
  await page.goto(url, {
    waitUntil: 'networkidle2', // 等待网络请求完成
    timeout: 30000
  });

  console.log('✅ 页面加载完成');
  console.log('💡 DevTools 已打开，您可以进行调试了');
  console.log('💡 按 Ctrl+C 退出');

  // 保持浏览器打开
  // 注释掉以下行可以让脚本自动关闭浏览器
  // await browser.close();
})();
