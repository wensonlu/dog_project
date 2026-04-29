import { config as loadDotenv } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";
import fs from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

loadDotenv({ path: path.resolve(__dirname, ".env") });

const supabaseUrl = process.env.SUPABASE_URL;
const dbPassword = process.env.SUPABASE_DB_PASSWORD;
const dbHostFromEnv = process.env.SUPABASE_DB_HOST;
const dbPort = Number(process.env.SUPABASE_DB_PORT || "5432");
const dbName = process.env.SUPABASE_DB_NAME || "postgres";
const dbUser = process.env.SUPABASE_DB_USER || "postgres";

if (!supabaseUrl || !dbPassword) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_DB_PASSWORD");
  console.error("   SUPABASE_DB_PASSWORD is your database password from Supabase project settings.");
  process.exit(1);
}

// Extract project ID from Supabase URL and derive DB host if not explicitly provided.
const projectId = new URL(supabaseUrl).hostname.split(".")[0];
const host = dbHostFromEnv || `db.${projectId}.supabase.co`;
const dbUsername = dbUser.includes(".") ? dbUser : `${dbUser}.${projectId}`;
const connectionString = `postgresql://${dbUsername}:${encodeURIComponent(dbPassword)}@${host}:${dbPort}/${dbName}`;

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log("🐕 dog-project MCP Database Migration (Direct PostgreSQL Connection)\n");
    console.log(`🔗 DB Host: ${host}:${dbPort}`);
    console.log(`👤 DB User: ${dbUsername}`);
    console.log(`📝 Reading migration script...`);

    const migrationSql = fs.readFileSync(
      path.resolve(__dirname, "..", "sql", "migration_add_status_column.sql"),
      "utf-8"
    );

    console.log(`✅ Migration script loaded\n`);
    console.log("⏳ Executing migration SQL as one batch...\n");
    await client.query(migrationSql);
    console.log("✅ Migration executed successfully!");

    const verify = await client.query(
      `select column_name from information_schema.columns where table_name='dogs' and column_name in ('status','updated_at') order by column_name;`
    );
    console.log(`✅ Verification columns: ${verify.rows.map((r) => r.column_name).join(", ")}`);
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
