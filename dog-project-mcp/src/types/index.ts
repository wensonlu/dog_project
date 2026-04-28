// ===== 枚举 =====

export type PetStatus = "available" | "adopted" | "pending" | "urgent";
export type ApplicationStatus = "pending" | "approved" | "rejected";
export type AlertType = "long_pending" | "low_stock" | "rejection_spike";
export type Urgency = "low" | "medium" | "high";
export type InsightType = "positive" | "negative" | "opportunity";

// ===== 数据库模型 =====

export interface Dog {
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
  status?: PetStatus;
  view_count?: number;
  favorite_count?: number;
  application_count?: number;
}

export interface Application {
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
  reviewer_id?: string;
  reviewed_at?: string;
  review_comment?: string;
  // 计算字段
  days_pending?: number;
  applicant_name?: string;
  applicant_email?: string;
  pet_name?: string;
}

export interface Favorite {
  id: number;
  user_id: string;
  dog_id: number;
  created_at: string;
}

export interface Message {
  id: number;
  user_id: string;
  sender_name: string;
  content: string;
  image_url: string | null;
  is_unread: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
  created_at: string;
  permissions?: number;
}

// ===== Tool 输入/输出 =====

export interface ListPetsInput {
  status?: PetStatus;
  breed?: string;
  region?: string;
  days_pending?: number;
  sort_by?: "created_at" | "updated_at";
  sort_order?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

export interface ListPetsOutput {
  pets: Dog[];
  total: number;
  has_more: boolean;
}

export interface GetPetDetailInput {
  pet_id: string;
}

export interface SearchPetsInput {
  keyword: string;
  status?: PetStatus;
  limit?: number;
}

export interface ListApplicationsInput {
  status?: ApplicationStatus;
  pet_id?: string;
  applicant_id?: string;
  days_pending?: number;
  limit?: number;
  offset?: number;
}

export interface ListApplicationsOutput {
  applications: Application[];
  total: number;
}

export interface ReviewApplicationInput {
  application_id: string;
  action: "approve" | "reject";
  comment?: string;
}

export interface ReviewApplicationOutput {
  success: boolean;
  application_id: string;
  new_status: ApplicationStatus;
  reviewed_at: string;
}

export interface BatchReviewApplicationsInput {
  application_ids: string[];
  action: "approve" | "reject";
  comment?: string;
}

export interface BatchOperationResult {
  success_count: number;
  failed_count: number;
  results: Array<{
    id: string;
    success: boolean;
    error?: string;
  }>;
}

export interface UpdatePetStatusInput {
  pet_id: string;
  status: PetStatus;
  reason?: string;
}

export interface BatchUpdatePetStatusInput {
  pet_ids: string[];
  status: PetStatus;
  condition?: string;
}

export interface GenerateReportInput {
  period: "today" | "week" | "month" | "quarter";
  include_trends?: boolean;
}

export interface OperationsReport {
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
}

export interface AnalyzeAdoptionInput {
  pet_id?: string;
  region?: string;
  days?: number;
}

export interface Insight {
  type: InsightType;
  title: string;
  description: string;
  recommendation?: string;
}

export interface AdoptionAnalysis {
  analysis_type: "pet" | "region" | "platform";
  insights: Insight[];
  stats: {
    avg_days_to_adoption: number;
    approval_rate: number;
    top_factors: string[];
  };
}

export interface GetAlertsInput {
  alert_type?: AlertType;
  threshold_days?: number;
}

export interface Alert {
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

export interface GetAlertsOutput {
  alerts: Alert[];
  total_alerts: number;
}

export interface NotifyFavoriteUsersInput {
  pet_id: string;
  message: string;
}

export interface NotifyOutput {
  success_count: number;
  failed_count: number;
  notified_users: string[];
}
