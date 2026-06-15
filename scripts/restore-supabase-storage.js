#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');
const { createClient } = require('../backend/node_modules/@supabase/supabase-js');

const [backupDir, url, key, bucket] = process.argv.slice(2);
if (!backupDir || !url || !key || !bucket) {
  throw new Error('Usage: restore-supabase-storage.js <backup-dir> <url> <key> <bucket>');
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  const objects = JSON.parse(
    await fs.readFile(path.join(backupDir, 'storage', bucket, 'objects.json'), 'utf8')
  );
  for (const object of objects) {
    const file = await fs.readFile(
      path.join(backupDir, 'storage', bucket, 'files', object.path)
    );
    const { error } = await supabase.storage.from(bucket).upload(object.path, file, {
      contentType: object.metadata?.mimetype,
      upsert: false,
    });
    if (error) throw new Error(`${object.path}: ${error.message}`);
    console.log(object.path);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
