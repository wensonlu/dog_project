import { config as loadDotenv } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

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

async function executeSql(sql: string): Promise<void> {
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
      const { error } = await supabase.rpc("exec_sql", {
        sql_text: statement,
      });

      if (error) {
        if (error.message.includes("function") || error.message.includes("does not exist")) {
          throw new Error(
            `Helper function 'exec_sql' not found. Please run this in Supabase SQL Editor first:\n\n` +
              `CREATE OR REPLACE FUNCTION exec_sql(sql_text text)\n` +
              `RETURNS void AS $$\n` +
              `BEGIN\n` +
              `  EXECUTE sql_text;\n` +
              `END;\n` +
              `$$ LANGUAGE plpgsql SECURITY DEFINER;`
          );
        }

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
      } else {
        console.log(`           ✅ Success`);
      }
    } catch (error: any) {
      if (error.message.includes("Helper function")) {
        throw error; // Re-throw setup errors
      }
      console.error(`           ❌ Error: ${error.message}`);
      throw error;
    }
  }

  console.log("\n✅ All migrations executed successfully!");
}

async function main() {
  console.log("🐕 dog-project MCP Database Migration\n");
  console.log("📝 Reading migration script...");

  const migrationSql = fs.readFileSync(
    path.resolve(__dirname, "..", "sql", "migration_add_status_column.sql"),
    "utf-8"
  );

  console.log("✅ Migration script loaded\n");
  console.log("🔗 Connecting to Supabase via Supabase SDK...\n");

  try {
    await executeSql(migrationSql);
  } catch (error) {
    console.error("\n❌ Migration failed:");
    console.error(error instanceof Error ? error.message : error);

    console.log("\n📋 Manual SQL (copy to Supabase SQL Editor):\n");
    const migrationSql = fs.readFileSync(
      path.resolve(__dirname, "..", "sql", "migration_add_status_column.sql"),
      "utf-8"
    );
    console.log(migrationSql);

    process.exit(1);
  }
}

main();
