#!/usr/bin/env node

/**
 * 数据库迁移脚本 - 通过PostgreSQL连接执行SQL
 */

require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('错误：环境变量 SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY 未设置');
  process.exit(1);
}

// 从Supabase URL提取信息
const urlParts = new URL(supabaseUrl);
const host = urlParts.hostname;

const client = new Client({
  host: host,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: supabaseKey,
  ssl: { rejectUnauthorized: false }
});

async function runMigration(filePath) {
  try {
    console.log(`\n📝 执行迁移：${path.basename(filePath)}`);

    const sql = fs.readFileSync(filePath, 'utf-8');

    const result = await client.query(sql);
    console.log(`  ✓ 迁移完成（${result.rowCount} 行受影响）`);

    return true;
  } catch (error) {
    console.error(`  ✗ 迁移失败：${error.message}`);
    return false;
  }
}

async function runMigrations() {
  console.log('========================================');
  console.log('Supabase PostgreSQL 迁移脚本');
  console.log('========================================');

  try {
    console.log('\n连接到 Supabase PostgreSQL...');
    await client.connect();
    console.log('✓ 数据库连接成功');

    const migrationsDir = path.join(__dirname, 'backend/migrations');
    const migrations = [
      'add_chat_tables.sql'
    ];

    console.log('\n========================================');
    console.log('执行迁移文件');
    console.log('========================================');

    let successCount = 0;
    for (const migration of migrations) {
      const filePath = path.join(migrationsDir, migration);
      if (fs.existsSync(filePath)) {
        const success = await runMigration(filePath);
        if (success) successCount++;
      } else {
        console.warn(`⚠ 迁移文件不存在：${filePath}`);
      }
    }

    // 验证表是否创建
    console.log('\n========================================');
    console.log('验证表是否创建');
    console.log('========================================');

    const tables = ['chat_sessions', 'chat_messages'];
    for (const table of tables) {
      try {
        const result = await client.query(
          `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = $1)`,
          [table]
        );
        if (result.rows[0].exists) {
          console.log(`✓ ${table} 表已存在`);
        } else {
          console.log(`✗ ${table} 表不存在`);
        }
      } catch (error) {
        console.log(`⚠ 无法检查 ${table} 表：${error.message}`);
      }
    }

    console.log('\n========================================');
    console.log(`✓ 迁移完成（${successCount}/${migrations.length} 成功）`);
    console.log('========================================\n');

  } catch (error) {
    console.error('✗ 迁移失败：', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// 检查pg模块是否安装
try {
  require.resolve('pg');
} catch (e) {
  console.error('错误：pg 模块未安装');
  console.log('请运行：npm install pg');
  process.exit(1);
}

runMigrations();
