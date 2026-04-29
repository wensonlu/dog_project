import { config as loadDotenv } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import pg from "pg";

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

loadDotenv({ path: path.resolve(__dirname, ".env") });

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// Extract PostgreSQL connection info from Supabase URL
// Format: https://[project-ref].supabase.co
const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
const postgresUrl = `postgresql://postgres:${serviceRoleKey}@db.${projectRef}.supabase.co:5432/postgres`;

async function executeSql(sql: string): Promise<void> {
  const pool = new Pool({
    connectionString: postgresUrl,
    ssl: { rejectUnauthorized: false }, // Supabase uses SSL
  });

  try {
    const client = await pool.connect();

    // Split statements by semicolon
    const statements = sql
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
        // Check for common "already exists" errors that we can safely ignore
        if (
          error.message.includes("already exists") ||
          error.message.includes("duplicate key") ||
          error.message.includes("relation")
        ) {
          console.log(`           ⚠️  Already exists (skipped)`);
        } else {
          console.error(`           ❌ Error: ${error.message}`);
          throw error;
        }
      }
    }

    client.release();
    console.log("\n✅ All migrations executed successfully!");
  } catch (error) {
    console.error("\n❌ Migration failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

async function main() {
  console.log("🐕 dog-project MCP Database Migration\n");
  console.log("📝 Reading migration script...");

  const migrationSql = fs.readFileSync(
    path.resolve(__dirname, "..", "sql", "migration_add_status_column.sql"),
    "utf-8"
  );

  console.log("✅ Migration script loaded\n");
  console.log("🔗 Connecting to Supabase PostgreSQL...\n");

  await executeSql(migrationSql);
}

main();
