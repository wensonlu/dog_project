#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');
const { createClient } = require('../backend/node_modules/@supabase/supabase-js');

const [backupDir, url, key] = process.argv.slice(2);
if (!backupDir || !url || !key) {
  throw new Error('Usage: restore-supabase-json.js <backup-dir> <url> <publishable-key>');
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  const publicDir = path.join(backupDir, 'public');
  const files = (await fs.readdir(publicDir)).filter((file) => file.endsWith('.json')).sort();
  const preferredOrder = [
    'users', 'products', 'documents', 'dogs', 'profiles', 'wiki_categories', 'wiki_tags',
    'applications', 'favorites', 'messages', 'dog_submissions', 'forum_topics', 'forum_comments',
    'forum_replies', 'reviews', 'adoption_stories', 'pet_agents', 'chat_sessions',
  ];
  files.sort((a, b) => {
    const ai = preferredOrder.indexOf(path.basename(a, '.json'));
    const bi = preferredOrder.indexOf(path.basename(b, '.json'));
    return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi) || a.localeCompare(b);
  });

  for (const file of files) {
    const table = path.basename(file, '.json');
    const rows = JSON.parse(await fs.readFile(path.join(publicDir, file), 'utf8'));
    if (!rows.length) {
      console.log(`${table}: 0`);
      continue;
    }
    const { error } = await supabase.from(table).insert(rows);
    if (error) throw new Error(`${table}: ${error.message}`);
    console.log(`${table}: ${rows.length}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
