import { config as loadDotenv } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";
import fs from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

loadDotenv({ path: path.resolve(__dirname, ".env") });

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// Parse Supabase URL to get connection details
const url = new URL(supabaseUrl);
const host = url.hostname;
const port = url.port || 5432;
const user = "postgres";
const password = serviceRoleKey;
const database = "postgres";

const pool = new Pool({
  host,
  port: parseInt(port),
  user,
  password,
  database,
  ssl: { rejectUnauthorized: false },
});

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log("🐕 dog-project MCP Database Migration (Direct PG)\n");
    console.log(`📝 Reading migration script...\n`);

    const migrationSql = fs.readFileSync(
      path.resolve(__dirname, "..", "sql", "migration_add_status_column.sql"),
      "utf-8"
    );

    const statements = migrationSql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    console.log(`📋 Found ${statements.length} SQL statements to execute\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const preview = statement.substring(0, 70).replace(/\n/g, " ");
      console.log(`[${i + 1}/${statements.length}] ⏳ ${preview}...`);

      try {
        await client.query(statement);
        console.log(`           ✅ Success`);
      } catch (error: any) {
        if (
          error.message.includes("already exists") ||
          error.message.includes("duplicate key")
        ) {
          console.log(`           ⚠️  Already exists (skipped)`);
        } else {
          console.error(`           ❌ Error: ${error.message}`);
          throw error;
        }
      }
    }

    console.log("\n✅ All migrations executed successfully!");
  } catch (error: any) {
    console.error("\n❌ Migration failed:");
    console.error(error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
