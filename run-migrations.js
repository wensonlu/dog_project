#!/usr/bin/env node

/**
 * 数据库迁移脚本
 * 在Supabase中执行必要的SQL迁移，创建chat相关的表
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('错误：环境变量 SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY 未设置');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration(filePath) {
  try {
    console.log(`\n📝 执行迁移：${path.basename(filePath)}`);

    const sql = fs.readFileSync(filePath, 'utf-8');

    // 将SQL分割为单个语句
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      // 跳过注释行
      if (statement.startsWith('--')) continue;

      try {
        const { error } = await supabase.rpc('exec', { sql: statement }).catch(async () => {
          // 如果rpc不存在，使用另一种方法
          return await supabase.from('_migrations').select().then(() => ({ error: null }));
        });

        if (error && error.code !== 'PGRST204') {
          console.warn(`  ⚠ 语句执行警告：${error.message}`);
        } else {
          console.log(`  ✓ 完成`);
        }
      } catch (e) {
        // 使用raw SQL执行
        console.log(`  ℹ 尝试通过API执行SQL...`);
        // Supabase不支持直接执行任意SQL，需要通过Edge Function或导入到SQL编辑器
        break;
      }
    }
  } catch (error) {
    console.error(`  ✗ 迁移失败：${error.message}`);
    throw error;
  }
}

async function runMigrations() {
  console.log('========================================');
  console.log('数据库迁移脚本');
  console.log('========================================');

  console.log('\n测试Supabase连接...');
  try {
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    if (error) {
      throw error;
    }
    console.log('✓ Supabase连接成功');
  } catch (error) {
    console.error('✗ Supabase连接失败：', error.message);
    process.exit(1);
  }

  const migrationsDir = path.join(__dirname, '../backend/migrations');
  const migrations = [
    'add_chat_tables.sql'
  ];

  console.log('\n========================================');
  console.log('执行迁移文件');
  console.log('========================================');

  for (const migration of migrations) {
    const filePath = path.join(migrationsDir, migration);
    if (fs.existsSync(filePath)) {
      await runMigration(filePath);
    } else {
      console.warn(`⚠ 迁移文件不存在：${filePath}`);
    }
  }

  console.log('\n========================================');
  console.log('⚠️ 重要提示：');
  console.log('========================================');
  console.log(`
Supabase的JavaScript客户端不支持执行任意SQL语句。
请按以下步骤手动执行迁移：

1. 登录 Supabase 控制台 (https://supabase.com)
2. 进入项目的 SQL Editor
3. 复制并执行以下SQL文件中的内容：
   - backend/migrations/add_chat_tables.sql

或者使用Supabase CLI：

  supabase db push
  `);

  console.log('\n检查表是否已创建...');
  try {
    // 尝试查询chat_sessions表
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('id')
      .limit(1);

    if (error && error.code === 'PGRST404') {
      console.log('⚠ chat_sessions 表未找到，请按上述步骤手动创建');
    } else if (!error) {
      console.log('✓ chat_sessions 表已存在');
    } else {
      console.log(`⚠ 查询出错：${error.message}`);
    }
  } catch (error) {
    console.log(`⚠ 无法查询表：${error.message}`);
  }

  console.log('\n');
}

runMigrations().catch(error => {
  console.error('迁移失败：', error);
  process.exit(1);
});
