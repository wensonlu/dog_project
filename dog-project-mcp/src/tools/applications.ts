import { z } from "zod";
import { supabase, calcDaysPending } from "../lib/supabase.js";
import type {
  ListApplicationsInput,
  ListApplicationsOutput,
  ReviewApplicationInput,
  ReviewApplicationOutput,
  BatchReviewApplicationsInput,
  BatchOperationResult,
  Application,
} from "../types/index.js";

const ListApplicationsSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  pet_id: z.string().optional(),
  applicant_id: z.string().optional(),
  days_pending: z.number().optional(),
  limit: z.number().min(1).max(100).optional().default(20),
  offset: z.number().min(0).optional().default(0),
});

export async function listApplications(
  input: ListApplicationsInput
): Promise<ListApplicationsOutput> {
  const parsed = ListApplicationsSchema.parse(input);
  const { status, pet_id, applicant_id, days_pending, limit, offset } = parsed;

  let query = supabase
    .from("applications")
    .select(
      `
      *,
      dog:dogs(id, name, breed, image)
    `,
      { count: "exact" }
    );

  if (status) query = query.eq("status", status);
  if (pet_id) query = query.eq("dog_id", Number(pet_id));
  if (applicant_id) query = query.eq("user_id", applicant_id);

  query = query.order("created_at", { ascending: false });
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) throw new Error(`Failed to list applications: ${error.message}`);

  // 获取申请人信息
  const userIds = [...new Set((data || []).map((a: any) => a.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", userIds);

  const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

  const applications = (data || []).map((app: any) => {
    const profile = profileMap.get(app.user_id) || {};
    return {
      ...app,
      pet_name: app.dog?.name || "",
      applicant_name: profile.full_name || "",
      applicant_email: profile.email || "",
      days_pending: calcDaysPending(app.created_at),
    };
  });

  // 过滤 days_pending
  const filtered = days_pending
    ? applications.filter((a) => a.days_pending >= days_pending)
    : applications;

  return {
    applications: filtered as Application[],
    total: count || 0,
  };
}

const ReviewApplicationSchema = z.object({
  application_id: z.string(),
  action: z.enum(["approve", "reject"]),
  comment: z.string().optional(),
});

export async function reviewApplication(
  input: ReviewApplicationInput
): Promise<ReviewApplicationOutput> {
  const { application_id, action, comment } = ReviewApplicationSchema.parse(input);

  const newStatus = action === "approve" ? "approved" : "rejected";

  const { error } = await supabase
    .from("applications")
    .update({
      status: newStatus,
      reviewed_at: new Date().toISOString(),
      review_comment: comment || null,
    })
    .eq("id", Number(application_id));

  if (error) throw new Error(`Failed to review application: ${error.message}`);

  // 如果是批准，同时更新宠物状态为 adopted
  if (action === "approve") {
    const { data: app } = await supabase
      .from("applications")
      .select("dog_id")
      .eq("id", Number(application_id))
      .single();

    if (app) {
      await supabase.from("dogs").update({ status: "adopted" }).eq("id", app.dog_id);
    }
  }

  return {
    success: true,
    application_id,
    new_status: newStatus as ReviewApplicationOutput["new_status"],
    reviewed_at: new Date().toISOString(),
  };
}

export async function batchReviewApplications(
  input: BatchReviewApplicationsInput
): Promise<BatchOperationResult> {
  const { application_ids, action, comment } = input;

  if (application_ids.length > 20) {
    throw new Error("最多一次处理 20 个申请");
  }

  const results: BatchOperationResult["results"] = [];
  let successCount = 0;
  let failedCount = 0;

  for (const id of application_ids) {
    try {
      await reviewApplication({ application_id: id, action, comment });
      results.push({ id, success: true });
      successCount++;
    } catch (err) {
      results.push({
        id,
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      });
      failedCount++;
    }
  }

  return { success_count: successCount, failed_count: failedCount, results };
}
