/**
 * 设置第一个超级管理员脚本
 *
 * 使用方法:
 * node backend/scripts/setup-first-admin.js --email=your-email@example.com
 * 或
 * node backend/scripts/setup-first-admin.js your-email@example.com
 */

require('dotenv').config();
const { supabase } = require('../config/supabase');
const { ROLE_PRESETS } = require('../constants/permissions');

async function setupFirstAdmin() {
  try {
    // 从命令行参数获取邮箱
    const args = process.argv.slice(2);
    let email = null;

    // 支持两种参数格式: --email=xxx 或 直接 xxx
    for (const arg of args) {
      if (arg.startsWith('--email=')) {
        email = arg.split('=')[1];
      } else if (!arg.startsWith('--')) {
        email = arg;
      }
    }

    if (!email) {
      console.error('错误: 请提供邮箱地址');
      console.log('使用方法: node backend/scripts/setup-first-admin.js --email=your-email@example.com');
      console.log('或者:     node backend/scripts/setup-first-admin.js your-email@example.com');
      process.exit(1);
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('错误: 无效的邮箱格式');
      process.exit(1);
    }

    console.log(`正在设置 ${email} 为超级管理员...`);

    // 查询用户是否存在
    const { data: profile, error: queryError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (queryError) {
      if (queryError.code === 'PGRST116') {
        console.error(`错误: 未找到邮箱为 ${email} 的用户，请确保该用户已注册`);
      } else {
        console.error('查询用户失败:', queryError.message);
      }
      process.exit(1);
    }

    // 更新用户权限为全权管理员
    const { data, error: updateError } = await supabase
      .from('profiles')
      .update({ permissions: ROLE_PRESETS.FULL_ADMIN })
      .eq('email', email)
      .select()
      .single();

    if (updateError) {
      console.error('更新权限失败:', updateError.message);
      process.exit(1);
    }

    console.log('✓ 成功！');
    console.log(`用户 ${email} 已设置为超级管理员`);
    console.log(`权限值: ${data.permissions} (领养管理 + 发布管理 + 超级管理员)`);
    process.exit(0);
  } catch (error) {
    console.error('脚本执行失败:', error.message);
    process.exit(1);
  }
}

setupFirstAdmin();
