import { z } from "zod";
import { supabase, calcDaysPending, getPeriodRange } from "../lib/supabase.js";
import type {
  GenerateReportInput,
  OperationsReport,
  AnalyzeAdoptionInput,
  AdoptionAnalysis,
  Insight,
} from "../types/index.js";

const ReportSchema = z.object({
  period: z.enum(["today", "week", "month", "quarter"]),
  include_trends: z.boolean().optional().default(false),
});

export async function generateOperationsReport(
  input: GenerateReportInput
): Promise<OperationsReport> {
  const { period } = ReportSchema.parse(input);
  const { start, end } = getPeriodRange(period);

  // 并行查询所有数据
  const [
    { count: totalPets },
    { count: newPets },
    { data: allApplications },
    { count: urgentPets },
    { data: longPendingPets },
    { data: pets },
  ] = await Promise.all([
    supabase.from("dogs").select("*", { count: "exact", head: true }),
    supabase
      .from("dogs")
      .select("*", { count: "exact" })
      .gte("created_at", start),
    supabase.from("applications").select("*").gte("created_at", start),
    supabase
      .from("dogs")
      .select("*", { count: "exact" })
      .eq("status", "urgent"),
    supabase
      .from("dogs")
      .select("*")
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .eq("status", "pending"),
    supabase.from("dogs").select("breed, location"),
  ]);

  const apps = allApplications || [];

  // 统计
  const pendingApps = apps.filter((a) => a.status === "pending").length;
  const approvedApps = apps.filter((a) => a.status === "approved").length;
  const rejectedApps = apps.filter((a) => a.status === "rejected").length;
  const adoptionRate = apps.length > 0 ? (approvedApps / apps.length) * 100 : 0;

  // 处理中的申请平均天数
  const processedApps = apps.filter((a) => a.status !== "pending");
  const avgProcessingDays =
    processedApps.length > 0
      ? processedApps.reduce((sum, a) => sum + calcDaysPending(a.created_at), 0) /
        processedApps.length
      : 0;

  // Top 品种
  const breedCount: Record<string, number> = {};
  const regionCount: Record<string, number> = {};
  for (const pet of pets || []) {
    breedCount[pet.breed] = (breedCount[pet.breed] || 0) + 1;
    regionCount[pet.location] = (regionCount[pet.location] || 0) + 1;
  }

  const topBreeds = Object.entries(breedCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([breed, count]) => ({ breed, count }));

  const topRegions = Object.entries(regionCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([region, count]) => ({ region, count }));

  return {
    period: { start, end },
    summary: {
      total_pets: totalPets || 0,
      new_pets: newPets || 0,
      total_applications: apps.length,
      pending_applications: pendingApps,
      approved_applications: approvedApps,
      rejected_applications: rejectedApps,
      adoption_rate: Math.round(adoptionRate * 100) / 100,
      avg_processing_days: Math.round(avgProcessingDays * 10) / 10,
    },
    top_breeds: topBreeds,
    top_regions: topRegions,
    urgent_pets: urgentPets || 0,
    long_pending_pets: longPendingPets?.length || 0,
  };
}

export async function analyzeAdoptionPatterns(
  input: AnalyzeAdoptionInput
): Promise<AdoptionAnalysis> {
  const { pet_id, region, days = 90 } = input;

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  let analysisType: "pet" | "region" | "platform" = "platform";
  if (pet_id) analysisType = "pet";
  else if (region) analysisType = "region";

  // 查询数据
  const [{ data: pets }, { data: applications }] = await Promise.all([
    pet_id
      ? supabase.from("dogs").select("*").eq("id", Number(pet_id))
      : region
        ? supabase.from("dogs").select("*").ilike("location", `%${region}%`)
        : supabase.from("dogs").select("*"),
    supabase.from("applications").select("*").gte("created_at", since),
  ]);

  const apps = applications || [];
  const petList = pets || [];

  // 计算统计数据
  const approvedApps = apps.filter((a) => a.status === "approved");
  const approvalRate = apps.length > 0 ? (approvedApps.length / apps.length) * 100 : 0;

  const processedApps = apps.filter((a) => a.status !== "pending");
  const avgDays =
    processedApps.length > 0
      ? processedApps.reduce((sum, a) => sum + calcDaysPending(a.created_at), 0) /
        processedApps.length
      : 0;

  // 生成洞察
  const insights: Insight[] = [];

  // 平台级洞察
  if (approvalRate > 70) {
    insights.push({
      type: "positive",
      title: "申请通过率健康",
      description: `${approvalRate.toFixed(1)}% 的申请获得批准，平台运营状况良好`,
    });
  } else if (approvalRate < 40 && apps.length > 0) {
    insights.push({
      type: "negative",
      title: "申请通过率偏低",
      description: `仅 ${approvalRate.toFixed(1)}% 的申请获得批准，建议优化申请流程或宠物信息展示`,
      recommendation: "考虑增加宠物视频介绍，提高申请质量",
    });
  }

  // 待处理申请过多警告
  const pendingCount = apps.filter((a) => a.status === "pending").length;
  const longPendingCount = apps.filter(
    (a) => a.status === "pending" && calcDaysPending(a.created_at) > 3
  ).length;
  if (pendingCount > 20) {
    insights.push({
      type: "opportunity",
      title: "待处理申请积压",
      description: `有 ${pendingCount} 个申请等待处理，其中 ${longPendingCount} 个超过 3 天未处理`,
      recommendation: "建议优先处理积压申请，提升用户体验",
    });
  }

  // 品种洞察
  if (analysisType === "platform" && petList.length > 0) {
    const breedStats: Record<string, { total: number; approved: number }> = {};
    for (const pet of petList) {
      const petApps = apps.filter((a) => a.dog_id === pet.id);
      if (petApps.length > 0) {
        breedStats[pet.breed] = breedStats[pet.breed] || { total: 0, approved: 0 };
        breedStats[pet.breed].total += petApps.length;
        breedStats[pet.breed].approved += petApps.filter((a) => a.status === "approved").length;
      }
    }

    const bestBreeds = Object.entries(breedStats)
      .filter(([, stats]) => stats.total >= 3)
      .sort((a, b) => b[1].approved / b[1].total - a[1].approved / a[1].total)
      .slice(0, 3);

    for (const [breed, stats] of bestBreeds) {
      const rate = (stats.approved / stats.total) * 100;
      insights.push({
        type: "positive",
        title: `品种 "${breed}" 表现优异`,
        description: `该品种申请通过率为 ${rate.toFixed(1)}%，高于平均 ${(rate - approvalRate).toFixed(1)}%`,
      });
    }
  }

  return {
    analysis_type: analysisType,
    insights,
    stats: {
      avg_days_to_adoption: Math.round(avgDays * 10) / 10,
      approval_rate: Math.round(approvalRate * 100) / 100,
      top_factors: ["宠物照片质量", "描述详细程度", "领养理由完整性"],
    },
  };
}
