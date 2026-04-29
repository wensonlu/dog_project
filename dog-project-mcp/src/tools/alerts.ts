import { z } from "zod";
import { supabase, calcDaysPending } from "../lib/supabase.js";
import type { GetAlertsInput, GetAlertsOutput, Alert } from "../types/index.js";

const AlertsSchema = z.object({
  alert_type: z.enum(["long_pending", "low_stock", "rejection_spike"]).optional(),
  threshold_days: z.number().optional().default(30),
});

export async function getPendingAlerts(input: GetAlertsInput): Promise<GetAlertsOutput> {
  const { alert_type, threshold_days = 30 } = AlertsSchema.parse(input);

  const alerts: Alert[] = [];

  // 1. 长期待处理申请
  if (!alert_type || alert_type === "long_pending") {
    const since = new Date(
      Date.now() - threshold_days * 24 * 60 * 60 * 1000
    ).toISOString();

    const { data: pendingApps } = await supabase
      .from("applications")
      .select(`
        id,
        created_at,
        dog:dogs(name)
      `)
      .eq("status", "pending")
      .lt("created_at", since);

    if (pendingApps && pendingApps.length > 0) {
      alerts.push({
        type: "long_pending_application",
        count: pendingApps.length,
        detail: pendingApps.map((a: any) => ({
          id: String(a.id),
          name: a.dog?.name || "Unknown",
          days: calcDaysPending(a.created_at),
          submitted_at: a.created_at,
        })),
        urgency: pendingApps.length > 10 ? "high" : pendingApps.length > 5 ? "medium" : "low",
      });
    }
  }

  // 2. 长期未领养宠物
  if (!alert_type || alert_type === "low_stock") {
    const since = new Date(
      Date.now() - threshold_days * 24 * 60 * 60 * 1000
    ).toISOString();

    const { data: pendingPets } = await supabase
      .from("dogs")
      .select("id, name, created_at")
      .eq("status", "pending")
      .lt("created_at", since);

    if (pendingPets && pendingPets.length > 0) {
      alerts.push({
        type: "long_pending_pet",
        count: pendingPets.length,
        detail: pendingPets.map((p: any) => ({
          id: String(p.id),
          name: p.name,
          days: calcDaysPending(p.created_at),
          created_at: p.created_at,
        })),
        urgency: "medium",
      });
    }
  }

  // 3. 紧急宠物
  if (!alert_type || alert_type === "rejection_spike") {
    const { data: urgentPets } = await supabase
      .from("dogs")
      .select("id, name, created_at")
      .eq("status", "urgent");

    if (urgentPets && urgentPets.length > 0) {
      alerts.push({
        type: "urgent_pet",
        count: urgentPets.length,
        detail: urgentPets.map((p: any) => ({
          id: String(p.id),
          name: p.name,
          days: calcDaysPending(p.created_at),
        })),
        urgency: "high",
      });
    }
  }

  return {
    alerts,
    total_alerts: alerts.reduce((sum, a) => sum + a.count, 0),
  };
}
