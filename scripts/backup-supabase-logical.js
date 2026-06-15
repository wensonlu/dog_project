#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');
const { createClient } = require('../backend/node_modules/@supabase/supabase-js');

const projectRoot = path.resolve(__dirname, '..');
const envPath = path.join(projectRoot, 'backend', '.env');

const tables = [
  'dogs',
  'favorites',
  'applications',
  'profiles',
  'messages',
  'dog_submissions',
  'forum_topics',
  'forum_comments',
  'forum_replies',
  'forum_topic_likes',
  'forum_comment_likes',
  'forum_reply_likes',
  'reviews',
  'review_likes',
  'adoption_stories',
  'story_timeline',
  'story_likes',
  'story_comments',
  'wiki_categories',
  'wiki_tags',
  'wiki_articles',
  'wiki_article_tags',
  'wiki_favorites',
  'pet_agents',
  'health_records',
  'health_reminders',
  'ai_usage_log',
  'chat_sessions',
  'chat_messages',
  'forum_user_follows',
  'shop_orders',
];

function parseEnv(contents) {
  return Object.fromEntries(
    contents
      .split(/\r?\n/)
      .filter((line) => line && !line.trimStart().startsWith('#') && line.includes('='))
      .map((line) => {
        const separator = line.indexOf('=');
        return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
      })
  );
}

async function writeJson(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

async function fetchAllRows(supabase, table) {
  const pageSize = 1000;
  const rows = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .range(from, from + pageSize - 1);

    if (error) throw error;
    rows.push(...data);
    if (data.length < pageSize) return rows;
  }
}

async function fetchAllUsers(supabase) {
  const users = [];

  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < 1000) return users;
  }
}

async function listStorageFiles(supabase, bucketId, prefix = '') {
  const entries = [];

  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.storage.from(bucketId).list(prefix, {
      limit: 1000,
      offset,
      sortBy: { column: 'name', order: 'asc' },
    });
    if (error) throw error;
    if (!data.length) break;

    for (const entry of data) {
      const objectPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.id) {
        entries.push({ ...entry, path: objectPath });
      } else {
        entries.push(...(await listStorageFiles(supabase, bucketId, objectPath)));
      }
    }
    if (data.length < 1000) break;
  }

  return entries;
}

async function main() {
  const env = parseEnv(await fs.readFile(envPath, 'utf8'));
  const url = env.SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error('backend/.env must contain SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }

  const projectRef = new URL(url).hostname.split('.')[0];
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(projectRoot, 'backups', `${projectRef}-${timestamp}`);
  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const manifest = {
    format: 'supabase-logical-backup-v1',
    sourceProjectRef: projectRef,
    createdAt: new Date().toISOString(),
    warnings: [
      'Auth user password hashes are not available through the Admin API.',
      'Database functions, triggers, policies, grants, and sequences must be restored from schema SQL/migrations.',
    ],
    publicTables: {},
    authUsers: 0,
    storage: {},
    errors: [],
  };

  for (const table of tables) {
    try {
      const rows = await fetchAllRows(supabase, table);
      await writeJson(path.join(backupDir, 'public', `${table}.json`), rows);
      manifest.publicTables[table] = rows.length;
      console.log(`public.${table}: ${rows.length}`);
    } catch (error) {
      manifest.errors.push({ scope: `public.${table}`, message: error.message });
      console.error(`public.${table}: ERROR ${error.message}`);
    }
  }

  try {
    const users = await fetchAllUsers(supabase);
    await writeJson(path.join(backupDir, 'auth', 'users.json'), users);
    manifest.authUsers = users.length;
    console.log(`auth.users: ${users.length}`);
  } catch (error) {
    manifest.errors.push({ scope: 'auth.users', message: error.message });
  }

  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) throw error;
    await writeJson(path.join(backupDir, 'storage', 'buckets.json'), buckets);

    for (const bucket of buckets) {
      const files = await listStorageFiles(supabase, bucket.id);
      manifest.storage[bucket.id] = files.length;
      await writeJson(path.join(backupDir, 'storage', bucket.id, 'objects.json'), files);

      for (const file of files) {
        const { data, error: downloadError } = await supabase.storage.from(bucket.id).download(file.path);
        if (downloadError) {
          manifest.errors.push({
            scope: `storage.${bucket.id}/${file.path}`,
            message: downloadError.message,
          });
          continue;
        }
        const destination = path.join(backupDir, 'storage', bucket.id, 'files', file.path);
        await fs.mkdir(path.dirname(destination), { recursive: true });
        await fs.writeFile(destination, Buffer.from(await data.arrayBuffer()));
      }
      console.log(`storage.${bucket.id}: ${files.length}`);
    }
  } catch (error) {
    manifest.errors.push({ scope: 'storage', message: error.message });
  }

  await writeJson(path.join(backupDir, 'manifest.json'), manifest);
  console.log(`BACKUP_DIR=${backupDir}`);
  if (manifest.errors.length) process.exitCode = 2;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
