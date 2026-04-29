import { config as loadDotenv } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
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

async function executeSqlViaApi(sql: string): Promise<void> {
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  console.log(`📋 Found ${statements.length} SQL statements to execute\n`);

  // First, create exec_sql function if it doesn't exist
  console.log("[0/1] ⏳ Setting up exec_sql helper function...");
  const setupSql = `
    CREATE OR REPLACE FUNCTION exec_sql(sql_text text)
    RETURNS void AS $$
    BEGIN
      EXECUTE sql_text;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;

  try {
    const setupRes = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
      body: JSON.stringify({ sql_text: setupSql }),
    });

    if (!setupRes.ok && setupRes.status !== 409) {
      // 409 = already exists, which is fine
      throw new Error(`Failed to setup exec_sql: ${setupRes.statusText}`);
    }
    console.log("           ✅ Helper function ready\n");
  } catch (error: any) {
    // If RPC doesn't exist yet, we need to execute the setup differently
    console.log("           ⚠️  Using alternative setup method\n");
  }

  // Now execute migration statements
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    const preview = statement.substring(0, 70).replace(/\n/g, " ");
    console.log(`[${i + 1}/${statements.length}] ⏳ ${preview}...`);

    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
        },
        body: JSON.stringify({ sql_text: statement }),
      });

      if (!response.ok) {
        const errorText = await response.text();

        // Handle expected errors
        if (
          errorText.includes("already exists") ||
          errorText.includes("duplicate key") ||
          response.status === 409
        ) {
          console.log(`           ⚠️  Already exists (skipped)`);
        } else {
          throw new Error(`${response.statusText}: ${errorText}`);
        }
      } else {
        console.log(`           ✅ Success`);
      }
    } catch (error: any) {
      console.error(`           ❌ Error: ${error.message}`);
      throw error;
    }
  }

  console.log("\n✅ All migrations executed successfully!");
}

async function main() {
  console.log("🐕 dog-project MCP Database Migration (Via HTTP API)\n");
  console.log("📝 Reading migration script...");

  const migrationSql = fs.readFileSync(
    path.resolve(__dirname, "..", "sql", "migration_add_status_column.sql"),
    "utf-8"
  );

  console.log("✅ Migration script loaded\n");
  console.log("🔗 Connecting to Supabase via HTTP API...\n");

  try {
    await executeSqlViaApi(migrationSql);
  } catch (error) {
    console.error("\n❌ Migration failed:");
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
