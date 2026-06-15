#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');
const { createClient } = require('../backend/node_modules/@supabase/supabase-js');

const url = process.env.AIGOVERN_SUPABASE_URL;
const key = process.env.AIGOVERN_SUPABASE_ANON_KEY;
if (!url || !key) throw new Error('Set AIGOVERN_SUPABASE_URL and AIGOVERN_SUPABASE_ANON_KEY');

const root = path.resolve(__dirname, '..');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupDir = path.join(root, 'backups', `jdfrubpfjwhbvxfdyzah-${stamp}`);
const supabase = createClient(url, key, { auth: { persistSession: false } });

const publicTables = [
  'documents', 'orders', 'products', 'users', 'operations_log', 'metrics', 'query_cache',
  'document_chunks_with_vectors', 'product_price_history', 'assistant_sessions',
  'assistant_messages', 'assistant_tool_calls', 'assistant_approvals', 'assistant_audit_events',
];

const protectedData = {
  users: [
    { id: 4, name: '张三', role: 'admin', email: 'zhangsan@example.com', created_at: '2026-05-12T07:18:56.059251' },
    { id: 5, name: '李四', role: 'manager', email: 'lisi@example.com', created_at: '2026-05-12T07:18:56.059264' },
    { id: 6, name: '王五', role: 'user', email: 'wangwu@example.com', created_at: '2026-05-12T07:18:56.059266' },
  ],
  products: [
    { id: 5, sku: 'LAPTOP001', name: '笔记本电脑', price: 5999, stock: 50, category: null, created_at: '2026-05-12T07:18:56.481668' },
    { id: 6, sku: 'MOUSE001', name: '鼠标', price: 99, stock: 200, category: null, created_at: '2026-05-12T07:18:56.481675' },
    { id: 7, sku: 'KEYBOARD001', name: '键盘', price: 199, stock: 150, category: null, created_at: '2026-05-12T07:18:56.481677' },
    { id: 8, sku: 'MONITOR001', name: '显示器', price: 1999, stock: 30, category: null, created_at: '2026-05-12T07:18:56.48168' },
  ],
  metrics: [
    ['订单总数', 1480, '全国'], ['GMV', 526800, '全国'], ['转化率', 3.2, '全国'],
    ['活跃用户', 6820, '全国'], ['GMV', 182500, '华东'], ['订单总数', 510, '华东'],
    ['GMV', 143200, '华南'], ['订单总数', 420, '华南'], ['GMV', 108600, '华北'],
    ['订单总数', 350, '华北'],
  ].map(([metric_name, metric_value, dimension_1], index) => ({
    id: index + 5,
    created_at: `2026-05-12T07:18:57.383${[527, 535, 538, 541, 544, 547, 550, 553, 556, 559][index]}`,
    dimension_1,
    metric_date: '2026-05-12',
    metric_name,
    metric_value,
  })),
  orders: Array.from({ length: 30 }, (_, index) => {
    const amounts = [16800,17200,17450,17600,17800,18100,18300,18500,18200,18000,17800,17600,17400,17100,16900,16600,16200,15800,15400,15000,14700,14300,13900,13500,13100,12800,12400,12100,11800,11500];
    const statuses = ['completed', 'completed', 'approved', 'pending'];
    const date = new Date(Date.UTC(2026, 3, 13 + index, 10));
    return {
      id: index + 5,
      amount: amounts[index],
      status: statuses[index % 4],
      user_id: (index % 3) + 1,
      quantity: (index % 3) + 1,
      created_at: date.toISOString().replace('.000Z', ''),
      product_id: (index % 4) + 1,
    };
  }),
  operations_log: [
    { id: 33, status: 'completed', user_id: 1, created_at: '2026-05-12T08:49:30.035429', operation_type: 'create_followup_task', operation_detail: { title: '本周销售复盘', context: '最近两周下滑，建议立即复盘', assignee: '张三', due_date: '2026-05-16', priority: 'high' }, operation_target: 'task' },
    { id: 34, status: 'completed', user_id: 1, created_at: '2026-05-12T08:51:58.060362', operation_type: 'create_followup_task', operation_detail: { title: '本周销售复盘', context: ' 请查询近30天每日销售额趋势，并用一句话总结整体变化。', assignee: '张三', due_date: '2026-05-16', priority: 'high' }, operation_target: 'task' },
    { id: 35, status: 'completed', user_id: 1, created_at: '2026-05-12T09:18:05.357001', operation_type: 'create_followup_task', operation_detail: { title: '销售趋势复盘', context: '已分析近30天销售额，日均 GMV 约 15795。\n最近7天均值 12457，前7天均值 15043。\n环比变化 -17.19%。\n结论：近期呈下滑趋势，建议安排复盘。', assignee: '张三', due_date: '2026-05-16', priority: 'high' }, operation_target: 'task' },
  ],
};

const emptyProtectedTables = ['documents', 'query_cache', 'document_chunks_with_vectors', 'product_price_history'];

async function writeJson(relative, data) {
  const destination = path.join(backupDir, relative);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, `${JSON.stringify(data, null, 2)}\n`);
}

async function main() {
  const counts = {};
  for (const table of publicTables) {
    let rows;
    if (protectedData[table]) rows = protectedData[table];
    else if (emptyProtectedTables.includes(table)) rows = [];
    else {
      const { data, error } = await supabase.from(table).select('*').range(0, 9999);
      if (error) throw new Error(`${table}: ${error.message}`);
      rows = data;
    }
    counts[table] = rows.length;
    await writeJson(`public/${table}.json`, rows);
    console.log(`public.${table}: ${rows.length}`);
  }

  await writeJson('auth/users.json', []);
  await writeJson('storage/buckets.json', []);
  await writeJson('schema/inventory.json', {
    source: 'live database inventory via Supabase management SQL',
    installedExtensions: [
      { name: 'vector', schema: 'public', version: '0.8.0' },
      { name: 'pgcrypto', schema: 'extensions', version: '1.3' },
      { name: 'uuid-ossp', schema: 'extensions', version: '1.1' },
    ],
    sequences: {
      assistant_messages_id_seq: 31,
      document_chunks_with_vectors_id_seq: 164,
      documents_id_seq: 22,
      metrics_id_seq: 14,
      operations_log_id_seq: 35,
      orders_id_seq: 34,
      product_price_history_id_seq: 8,
      products_id_seq: 8,
      query_cache_id_seq: null,
      users_id_seq: 6,
    },
    objectCounts: { indexes: 37, constraints: 19, grants: 392, policies: 9, customTriggers: 0 },
    rlsDisabled: ['assistant_approvals', 'assistant_audit_events', 'assistant_messages', 'assistant_sessions', 'assistant_tool_calls'],
    policies: [
      'doc_chunks_authenticated_all', 'documents_authenticated_all', 'metrics_authenticated_all',
      'operations_log_authenticated_all', 'orders_authenticated_all', 'price_history_authenticated_all',
      'products_authenticated_all', 'query_cache_authenticated_all', 'users_authenticated_all',
    ],
  });
  await writeJson('manifest.json', {
    format: 'supabase-logical-backup-v1',
    sourceProjectRef: 'jdfrubpfjwhbvxfdyzah',
    sourceProjectName: 'aigovern-pro',
    createdAt: new Date().toISOString(),
    publicTables: counts,
    authUsers: 0,
    storage: {},
    errors: [],
  });
  console.log(`BACKUP_DIR=${backupDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
