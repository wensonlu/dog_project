import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten());
  console.error("Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

export const env = parsed.data;

// 使用 Service Role Key，跳过 RLS
// 适用于后端 MCP 服务
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ===== 工具函数 =====

/**
 * 计算从创建时间到现在的天数
 */
export function calcDaysPending(createdAt: string): number {
  const created = new Date(createdAt);
  const now = new Date();
  return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * 获取时间段范围
 */
export function getPeriodRange(
  period: "today" | "week" | "month" | "quarter"
): { start: string; end: string } {
  const now = new Date();
  const end = now.toISOString();
  let start: Date;

  switch (period) {
    case "today":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "week":
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "month":
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "quarter":
      start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  return { start: start.toISOString(), end };
}
