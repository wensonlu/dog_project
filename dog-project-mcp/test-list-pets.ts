import { config as loadDotenv } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 先加载dotenv
const result = loadDotenv({ path: path.resolve(__dirname, ".env") });

console.log("📝 .env 加载结果:", result.parsed ? Object.keys(result.parsed) : "未加载");
console.log("🌐 SUPABASE_URL:", process.env.SUPABASE_URL ? "✅ 已设置" : "❌ 未设置");
console.log("🔑 SUPABASE_SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "✅ 已设置" : "❌ 未设置");

// 现在导入
const { listPets } = await import("./src/tools/pets.js");

async function main() {
  try {
    console.log("\n🐕 获取待领养宠物...\n");

    const result = await listPets({
      status: "available",
      limit: 1,
    });

    if (result.pets.length === 0) {
      console.log("❌ 未找到待领养宠物");
      return;
    }

    const pet = result.pets[0];
    console.log("✅ 找到1条待领养宠物：\n");
    console.log(JSON.stringify(pet, null, 2));
    console.log(`\n总共有 ${result.total} 条待领养宠物`);
  } catch (error) {
    console.error("❌ 错误:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
