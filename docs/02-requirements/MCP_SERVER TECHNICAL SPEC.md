# dog-project MCP Server 技术规格文档

> 基于 PRD 文档的具体技术实现规格

**状态：** 技术设计
**版本：** 1.0
**最后更新：** 2026-04-28
**前置文档：** `docs/02-requirements/MCP SERVER PRD.md`

---

## 1. 项目初始化

### 1.1 目录结构

```
dog-project-mcp/
├── src/
│   ├── index.ts                    # 入口，Server 定义
│   ├── tools/
│   │   ├── pets.ts                # 宠物相关 tools
│   │   ├── applications.ts         # 申请相关 tools
│   │   ├── status.ts               # 状态管理 tools
│   │   ├── analytics.ts            # 分析洞察 tools
│   │   ├── alerts.ts               # 异常检测 tools
│   │   └── favorites.ts            # 收藏相关 tools
│   ├── lib/
│   │   ├── supabase.ts             # Supabase 客户端
│   │   └── utils.ts                # 工具函数
│   └── types/
│       └── index.ts                # 类型定义
├── tests/
│   ├── pets.test.ts
│   ├── applications.test.ts
│   └── analytics.test.ts
├── package.json
├── tsconfig.json
└── README.md
```

### 1.2 依赖

```json
{
  "name": "dog-project-mcp",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "dev": "tsx watch src/index.ts",
    "test": "vitest",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.5.0",
    "@supabase/supabase-js": "^2.39.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "tsx": "^4.7.0",
    "@types/node": "^20.11.0",
    "vitest": "^1.2.0"
  }
}
```

---

## 2. 类型定义

```typescript
// src/types/index.ts

// ===== 枚举 =====

type PetStatus = "available" | "adopted" | "pending" | "urgent";
type ApplicationStatus = "pending" | "approved" | "rejected";
type AlertType = "long_pending" | "low_stock" | "rejection_spike";
type Urgency = "low" | "medium" | "high";
type InsightType = "positive" | "negative" | "opportunity";

// ===== 数据库模型 =====

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
  created_at: string;
  permissions?: number; // 位标志权限
}

interface Dog {
  id: number;
  name: string;
  age: string;
  breed: string;
  location: string;
  image: string;
  gender: string;
  description: string | null;
  traits: string[];
  created_at: string;
  // 计算字段（由 MCP 层注入）
  status?: PetStatus;
  view_count?: number;
  favorite_count?: number;
  application_count?: number;
  days_pending?: number;
}

interface Favorite {
  id: number;
  user_id: string;
  dog_id: number;
  created_at: string;
  // 关联数据
  dog?: Dog;
}

interface Application {
  id: number;
  user_id: string;
  dog_id: number;
  full_name: string;
  phone: string;
  address: string;
  has_pets: boolean;
  housing_type: string;
  status: ApplicationStatus;
  created_at: string;
  // 关联数据
  dog?: Dog;
  reviewer_id?: string;
  reviewer_name?: string;
  reviewed_at?: string;
  review_comment?: string;
  // 计算字段
  days_pending?: number;
  applicant_name?: string;
  applicant_email?: string;
}

interface Message {
  id: number;
  user_id: string;
  sender_name: string;
  content: string;
  image_url: string | null;
  is_unread: boolean;
  created_at: string;
}

// ===== Tool 输入/输出 =====

interface ListPetsInput {
  status?: PetStatus;
  breed?: string;
  region?: string;
  days_pending?: number;
  sort_by?: "created_at" | "updated_at" | "view_count";
  sort_order?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

interface ListPetsOutput {
  pets: (Dog & { days_pending: number })[];
  total: number;
  has_more: boolean;
}

interface GetPetDetailInput {
  pet_id: string;
}

interface SearchPetsInput {
  keyword: string;
  status?: PetStatus;
  limit?: number;
}

interface ListApplicationsInput {
  status?: ApplicationStatus;
  pet_id?: string;
  applicant_id?: string;
  days_pending?: number;
  limit?: number;
  offset?: number;
}

interface ReviewApplicationInput {
  application_id: string;
  action: "approve" | "reject";
  comment?: string;
}

interface BatchReviewApplicationsInput {
  application_ids: string[];
  action: "approve" | "reject";
  comment?: string;
}

interface BatchReviewOutput {
  success_count: number;
  failed_count: number;
  results: Array<{
    application_id: string;
    success: boolean;
    error?: string;
  }>;
}

interface UpdatePetStatusInput {
  pet_id: string;
  status: PetStatus;
  reason?: string;
}

interface BatchUpdatePetStatusInput {
  pet_ids: string[];
  status: PetStatus;
  condition?: string;
}

interface BatchUpdatePetOutput {
  success_count: number;
  failed_count: number;
  results: Array<{
    pet_id: string;
    success: boolean;
    error?: string;
  }>;
}

interface GenerateReportInput {
  period: "today" | "week" | "month" | "quarter";
  include_trends?: boolean;
}

interface OperationsReport {
  period: { start: string; end: string };
  summary: {
    total_pets: number;
    new_pets: number;
    total_applications: number;
    pending_applications: number;
    approved_applications: number;
    rejected_applications: number;
    adoption_rate: number;
    avg_processing_days: number;
  };
  top_breeds: Array<{ breed: string; count: number }>;
  top_regions: Array<{ region: string; count: number }>;
  urgent_pets: number;
  long_pending_pets: number;
  trends?: {
    adoption_rate_change: number;
    application_volume_change: number;
  };
}

interface AnalyzeAdoptionInput {
  pet_id?: string;
  region?: string;
  days?: number;
}

interface Insight {
  type: InsightType;
  title: string;
  description: string;
  recommendation?: string;
}

interface AdoptionAnalysis {
  analysis_type: "pet" | "region" | "platform";
  insights: Insight[];
  stats: {
    avg_days_to_adoption: number;
    approval_rate: number;
    top_factors: string[];
  };
}

interface GetAlertsInput {
  alert_type?: AlertType;
  threshold_days?: number;
}

interface Alert {
  type: string;
  count: number;
  detail: Array<{
    id: string;
    name: string;
    days: number;
    submitted_at?: string;
    created_at?: string;
  }>;
  urgency: Urgency;
}

interface NotifyFavoriteUsersInput {
  pet_id: string;
  message: string;
}

interface NotifyOutput {
  success_count: number;
  failed_count: number;
  notified_users: string[];
}
```

---

## 3. Supabase 客户端

```typescript
// src/lib/supabase.ts

import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from "../config/env.js";

// 使用 Service Role Key，跳过 RLS
// 适用于后端服务，不适用于浏览器端
export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// 查询辅助：计算 days_pending
export function calcDaysPending(createdAt: string): number {
  const created = new Date(createdAt);
  const now = new Date();
  return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
}

// 查询辅助：分页处理
export function applyPagination<T>(
  query: any,
  limit: number = 20,
  offset: number = 0
) {
  return query.range(offset, offset + limit - 1);
}
```

### 3.1 环境变量

```typescript
// src/config/env.ts

import { z } from "zod";

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  PORT: z.string().optional().default("5001"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten());
  process.exit(1);
}

export const env = parsed.data;
```

---

## 4. Tool 实现规格

### 4.1 宠物相关工具

#### `list_pets` — 列出宠物

```typescript
// src/tools/pets.ts

import { z } from "zod";
import { supabase, calcDaysPending, applyPagination } from "../lib/supabase.js";
import type { ListPetsInput, ListPetsOutput, Dog } from "../types/index.js";

const ListPetsSchema = z.object({
  status: z.enum(["available", "adopted", "pending", "urgent"]).optional(),
  breed: z.string().optional(),
  region: z.string().optional(),
  days_pending: z.number().optional(),
  sort_by: z.enum(["created_at", "updated_at", "view_count"]).optional(),
  sort_order: z.enum(["asc", "desc"]).optional(),
  limit: z.number().min(1).max(100).optional().default(20),
  offset: z.number().min(0).optional().default(0),
});

export async function listPets(input: ListPetsInput): Promise<ListPetsOutput> {
  const { status, breed, region, days_pending, sort_by, sort_order, limit, offset } =
    ListPetsSchema.parse(input);

  let query = supabase
    .from("dogs")
    .select("*", { count: "exact" });

  // 筛选
  if (status) query = query.eq("status", status);
  if (breed) query = query.ilike("breed", `%${breed}%`);
  if (region) query = query.ilike("location", `%${region}%`);

  // 排序
  const sortColumn = sort_by || "created_at";
  const sortDirection = sort_order || "desc";
  query = query.order(sortColumn, { ascending: sortDirection === "asc" });

  // 分页
  query = applyPagination(query, limit, offset);

  const { data, error, count } = await query;

  if (error) throw new Error(`Failed to list pets: ${error.message}`);

  // 注入计算字段
  const now = new Date();
  const pets = (data || []).map((dog: any) => ({
    ...dog,
    days_pending: calcDaysPending(dog.created_at),
    // 关联计数（后续优化：使用 join 查询）
    view_count: 0, // dogs 表暂无此字段，预留
    favorite_count: 0,
    application_count: 0,
  }));

  // 过滤 days_pending
  const filteredPets = days_pending
    ? pets.filter((p) => p.days_pending >= days_pending)
    : pets;

  return {
    pets: filteredPets as (Dog & { days_pending: number })[],
    total: count || 0,
    has_more: (offset + (data?.length || 0)) < (count || 0),
  };
}
```

#### `get_pet_detail` — 宠物详情

```typescript
const GetPetDetailSchema = z.object({
  pet_id: z.string(),
});

export async function getPetDetail(input: GetPetDetailInput): Promise<Dog> {
  const { pet_id } = GetPetDetailSchema.parse({ pet_id: input.pet_id });

  const { data, error } = await supabase
    .from("dogs")
    .select("*")
    .eq("id", pet_id)
    .single();

  if (error) throw new Error(`Pet not found: ${error.message}`);

  // 补充关联计数
  const [favorites, applications] = await Promise.all([
    supabase.from("favorites").select("id", { count: "exact" }).eq("dog_id", pet_id),
    supabase.from("applications").select("id", { count: "exact" }).eq("dog_id", pet_id),
  ]);

  return {
    ...data,
    view_count: 0,
    favorite_count: favorites.count || 0,
    application_count: applications.count || 0,
    days_pending: calcDaysPending(data.created_at),
  } as Dog & { days_pending: number; favorite_count: number; application_count: number };
}
```

#### `search_pets` — 搜索宠物

```typescript
const SearchPetsSchema = z.object({
  keyword: z.string().min(1),
  status: z.enum(["available", "adopted", "pending", "urgent"]).optional(),
  limit: z.number().min(1).max(100).optional().default(20),
});

export async function searchPets(input: SearchPetsInput): Promise<ListPetsOutput> {
  const { keyword, status, limit } = SearchPetsSchema.parse(input);

  let query = supabase
    .from("dogs")
    .select("*", { count: "exact" })
    .or(`name.ilike.%${keyword}%,breed.ilike.%${keyword}%,description.ilike.%${keyword}%`);

  if (status) query = query.eq("status", status);
  query = query.limit(limit);

  const { data, error, count } = await query;

  if (error) throw new Error(`Search failed: ${error.message}`);

  const pets = (data || []).map((dog: any) => ({
    ...dog,
    days_pending: calcDaysPending(dog.created_at),
  }));

  return {
    pets: pets as (Dog & { days_pending: number })[],
    total: count || 0,
    has_more: false,
  };
}
```

---

### 4.2 申请管理工具

#### `list_applications` — 申请列表

```typescript
// src/tools/applications.ts

import { z } from "zod";
import { supabase, calcDaysPending, applyPagination } from "../lib/supabase.js";
import type { ListApplicationsInput, Application } from "../types/index.js";

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
): Promise<{ applications: (Application & { days_pending: number })[]; total: number }> {
  const { status, pet_id, applicant_id, days_pending, limit, offset } =
    ListApplicationsSchema.parse(input);

  let query = supabase
    .from("applications")
    .select(`
      *,
      dog:dogs(id, name, breed, image)
    `, { count: "exact" });

  if (status) query = query.eq("status", status);
  if (pet_id) query = query.eq("dog_id", pet_id);
  if (applicant_id) query = query.eq("user_id", applicant_id);

  query = query.order("created_at", { ascending: false });
  query = applyPagination(query, limit, offset);

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
    applications: filtered as (Application & { days_pending: number })[],
    total: count || 0,
  };
}
```

#### `review_application` — 审核申请

```typescript
const ReviewApplicationSchema = z.object({
  application_id: z.string(),
  action: z.enum(["approve", "reject"]),
  comment: z.string().optional(),
});

export async function reviewApplication(input: ReviewApplicationInput) {
  const { application_id, action, comment } = ReviewApplicationSchema.parse(input);

  const newStatus = action === "approve" ? "approved" : "rejected";

  const { error } = await supabase
    .from("applications")
    .update({
      status: newStatus,
      reviewed_at: new Date().toISOString(),
      review_comment: comment || null,
    })
    .eq("id", application_id);

  if (error) throw new Error(`Failed to review application: ${error.message}`);

  // 如果是批准，同时更新宠物状态为 adopted
  if (action === "approve") {
    // 先获取申请关联的 dog_id
    const { data: app } = await supabase
      .from("applications")
      .select("dog_id")
      .eq("id", application_id)
      .single();

    if (app) {
      await supabase
        .from("dogs")
        .update({ status: "adopted" })
        .eq("id", app.dog_id);
    }
  }

  return {
    success: true,
    application_id,
    new_status: newStatus,
    reviewed_at: new Date().toISOString(),
  };
}
```

#### `batch_review_applications` — 批量审核

```typescript
export async function batchReviewApplications(input: BatchReviewApplicationsInput) {
  const { application_ids, action, comment } = input;

  if (application_ids.length > 20) {
    throw new Error("最多一次处理 20 个申请");
  }

  const results = [];
  let successCount = 0;
  let failedCount = 0;

  for (const id of application_ids) {
    try {
      await reviewApplication({
        application_id: id,
        action,
        comment,
      });
      results.push({ application_id: id, success: true });
      successCount++;
    } catch (err) {
      results.push({
        application_id: id,
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      });
      failedCount++;
    }
  }

  return {
    success_count: successCount,
    failed_count: failedCount,
    results,
  };
}
```

---

### 4.3 状态管理工具

#### `batch_update_pet_status` — 批量更新状态

```typescript
// src/tools/status.ts

export async function batchUpdatePetStatus(input: BatchUpdatePetStatusInput) {
  const { pet_ids, status, condition } = input;

  if (pet_ids.length > 50) {
    throw new Error("最多一次更新 50 个宠物");
  }

  const results = [];
  let successCount = 0;
  let failedCount = 0;

  const { error } = await supabase
    .from("dogs")
    .update({ status })
    .in("id", pet_ids);

  if (error) {
    // 如果是批量更新失败，逐个处理
    for (const pet_id of pet_ids) {
      try {
        const { error: individualError } = await supabase
          .from("dogs")
          .update({ status })
          .eq("id", pet_id);

        if (individualError) {
          results.push({
            pet_id: String(pet_id),
            success: false,
            error: individualError.message,
          });
          failedCount++;
        } else {
          results.push({ pet_id: String(pet_id), success: true });
          successCount++;
        }
      } catch (err) {
        results.push({
          pet_id: String(pet_id),
          success: false,
          error: err instanceof Error ? err.message : "Unknown error",
        });
        failedCount++;
      }
    }
  } else {
    // 批量更新成功
    for (const pet_id of pet_ids) {
      results.push({ pet_id: String(pet_id), success: true });
    }
    successCount = pet_ids.length;
  }

  return {
    success_count: successCount,
    failed_count: failedCount,
    results,
  };
}
```

---

### 4.4 分析工具

#### `generate_operations_report` — 运营报告

```typescript
// src/tools/analytics.ts

import { z } from "zod";
import { supabase, calcDaysPending } from "../lib/supabase.js";
import type { GenerateReportInput, OperationsReport } from "../types/index.js";

const ReportSchema = z.object({
  period: z.enum(["today", "week", "month", "quarter"]),
  include_trends: z.boolean().optional().default(false),
});

function getPeriodRange(period: string): { start: string; end: string } {
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
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
      break;
    case "quarter":
      start = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  return { start: start.toISOString(), end };
}

export async function generateOperationsReport(
  input: GenerateReportInput
): Promise<OperationsReport> {
  const { period, include_trends } = ReportSchema.parse(input);
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
    supabase.from("dogs").select("*", { count: "exact" }).gte("created_at", start),
    supabase.from("applications").select("*").gte("created_at", start),
    supabase.from("dogs").select("*", { count: "exact" }).eq("status", "urgent"),
    supabase.from("dogs").select("*").gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()).eq("status", "pending"),
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
```

#### `analyze_adoption_patterns` — 领养规律分析

```typescript
export async function analyzeAdoptionPatterns(input: AnalyzeAdoptionInput) {
  const { pet_id, region, days = 90 } = input;

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  let analysisType: "pet" | "region" | "platform" = "platform";
  if (pet_id) analysisType = "pet";
  else if (region) analysisType = "region";

  // 查询数据
  const [{ data: pets }, { data: applications }] = await Promise.all([
    pet_id
      ? supabase.from("dogs").select("*").eq("id", pet_id)
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
  } else if (approvalRate < 40) {
    insights.push({
      type: "negative",
      title: "申请通过率偏低",
      description: `仅 ${approvalRate.toFixed(1)}% 的申请获得批准，建议优化申请流程或宠物信息展示`,
      recommendation: "考虑增加宠物视频介绍，提高申请质量",
    });
  }

  // 待处理申请过多警告
  const pendingCount = apps.filter((a) => a.status === "pending").length;
  if (pendingCount > 20) {
    insights.push({
      type: "opportunity",
      title: "待处理申请积压",
      description: `有 ${pendingCount} 个申请等待处理，超过 3 天未处理的占 ${
        apps.filter((a) => a.status === "pending" && calcDaysPending(a.created_at) > 3).length
      } 个`,
      recommendation: "建议优先处理积压申请，提升用户体验",
    });
  }

  // 品种洞察（如果是平台级分析）
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
```

---

### 4.5 异常检测工具

#### `get_pending_alerts` — 获取异常提醒

```typescript
// src/tools/alerts.ts

export async function getPendingAlerts(input: GetAlertsInput) {
  const { alert_type, threshold_days = 30 } = input;

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
```

---

### 4.6 收藏工具

#### `notify_favorite_users` — 通知收藏用户

```typescript
// src/tools/favorites.ts

export async function notifyFavoriteUsers(input: NotifyFavoriteUsersInput) {
  const { pet_id, message } = input;

  // 获取收藏了该宠物的所有用户
  const { data: favorites, error: favError } = await supabase
    .from("favorites")
    .select("user_id")
    .eq("dog_id", pet_id);

  if (favError) throw new Error(`Failed to fetch favorites: ${favError.message}`);

  if (!favorites || favorites.length === 0) {
    return {
      success_count: 0,
      failed_count: 0,
      notified_users: [],
    };
  }

  const userIds = [...new Set(favorites.map((f: any) => f.user_id))];

  // 获取宠物信息
  const { data: pet } = await supabase
    .from("dogs")
    .select("name")
    .eq("id", pet_id)
    .single();

  const petName = pet?.name || "宠物";

  // 批量插入消息
  const messages = userIds.map((userId: string) => ({
    user_id: userId,
    sender_name: "系统通知",
    content: `您收藏的【${petName}】有新动态：${message}`,
    is_unread: true,
  }));

  const { error: insertError } = await supabase.from("messages").insert(messages);

  if (insertError) {
    return {
      success_count: 0,
      failed_count: userIds.length,
      notified_users: [],
      error: insertError.message,
    };
  }

  return {
    success_count: userIds.length,
    failed_count: 0,
    notified_users: userIds,
  };
}
```

---

## 5. Server 入口

```typescript
// src/index.ts

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types