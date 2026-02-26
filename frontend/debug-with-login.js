/**
 * 自动登录并截图的调试工具
 */

import puppeteer from 'puppeteer';
import { writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

(async () => {
  console.log('🚀 启动 Chrome 并自动登录...');

  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    args: [
      '--start-maximized',
      '--disable-web-security',
      '--auto-open-devtools-for-tabs'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 430, height: 932 }); // iPhone 14 Pro Max 尺寸

  // 监听控制台
  page.on('console', msg => {
    console.log(`[浏览器 ${msg.type()}]`, msg.text());
  });

  // 访问首页
  console.log('📱 正在访问: http://localhost:5173');
  await page.goto('http://localhost:5173', {
    waitUntil: 'networkidle2',
    timeout: 30000
  });

  // 等待页面加载
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 检查是否在登录页
  const isLoginPage = await page.evaluate(() => {
    return window.location.pathname === '/login' ||
           document.querySelector('input[type="email"]') !== null;
  });

  if (isLoginPage) {
    console.log('🔐 检测到登录页，开始自动登录...');

    // 等待登录表单加载
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });

    // 输入账号
    await page.type('input[type="email"]', '823719082@qq.com', { delay: 100 });
    console.log('✅ 已输入邮箱');

    // 输入密码
    await page.type('input[type="password"]', '123456', { delay: 100 });
    console.log('✅ 已输入密码');

    // 点击登录按钮
    await page.click('button[type="submit"]');
    console.log('🔄 正在登录...');

    // 等待导航到首页
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
    console.log('✅ 登录成功！');
  } else {
    console.log('✅ 已经登录');
  }

  // 等待首页加载完成
  await page.waitForTimeout(3000);

  // 截图 1: 初始状态（UI 可见）
  const screenshot1Path = join(__dirname, `home-with-ui-${Date.now()}.png`);
  await page.screenshot({ path: screenshot1Path, fullPage: false });
  console.log(`📸 截图1已保存（UI可见）: ${screenshot1Path}`);

  // 等待 4 秒让 UI 自动隐藏
  console.log('⏱️  等待 UI 自动隐藏...');
  await page.waitForTimeout(4000);

  // 截图 2: UI 隐藏状态
  const screenshot2Path = join(__dirname, `home-hidden-ui-${Date.now()}.png`);
  await page.screenshot({ path: screenshot2Path, fullPage: false });
  console.log(`📸 截图2已保存（UI隐藏）: ${screenshot2Path}`);

  // 模拟点击屏幕让 UI 重新显示
  await page.click('body');
  await page.waitForTimeout(500);

  // 截图 3: 点击后 UI 重新显示
  const screenshot3Path = join(__dirname, `home-ui-reshown-${Date.now()}.png`);
  await page.screenshot({ path: screenshot3Path, fullPage: false });
  console.log(`📸 截图3已保存（UI重新显示）: ${screenshot3Path}`);

  // 获取页面信息
  const pageInfo = await page.evaluate(() => {
    const dogName = document.querySelector('h2')?.textContent;
    const dogBreed = document.querySelector('p')?.textContent;
    return { dogName, dogBreed, url: window.location.href };
  });

  console.log('\n📊 当前页面信息:');
  console.log(`  - URL: ${pageInfo.url}`);
  console.log(`  - 狗狗名字: ${pageInfo.dogName}`);
  console.log(`  - 品种: ${pageInfo.dogBreed}`);

  console.log('\n💡 调试浏览器保持打开状态，按 Ctrl+C 退出');
})();
