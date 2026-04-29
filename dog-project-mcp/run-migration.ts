import { config as loadDotenv } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
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

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function runMigration() {
  try {
    console.log("📝 Running migration: Add status column to dogs table...\n");

    // Read migration SQL
    const migrationSql = fs.readFileSync(
      path.resolve(__dirname, "sql/migration_add_status_column.sql"),
      "utf-8"
    );

    // Execute migration (split by statements for better error handling)
    const statements = migrationSql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    for (const statement of statements) {
      console.log(`⏳ Executing: ${statement.substring(0, 60)}...`);
      const { error } = await supabase.rpc("exec_sql", { sql: statement });

      if (error) {
        // Ignore "already exists" errors
        if (error.message.includes("already exists")) {
          console.log(`   ⚠️  Already exists (skipped)`);
        } else {
          throw error;
        }
      } else {
        console.log(`   ✅ Success`);
      }
    }

    console.log("\n✅ Migration completed successfully!");

    // Verify the new schema
    console.log("\n📋 Verifying dogs table structure...");
    const { data, error } = await supabase
      .from("dogs")
      .select("*")
      .limit(1);

    if (error) {
      console.error("❌ Error verifying schema:", error);
    } else {
      console.log("✅ Dogs table is ready for MCP operations!");
    }
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
