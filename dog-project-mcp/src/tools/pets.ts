import { z } from "zod";
import { supabase, calcDaysPending } from "../lib/supabase.js";
import type { ListPetsInput, ListPetsOutput, GetPetDetailInput, SearchPetsInput, Dog } from "../types/index.js";

const ListPetsSchema = z.object({
  status: z.enum(["available", "adopted", "pending", "urgent"]).optional(),
  breed: z.string().optional(),
  region: z.string().optional(),
  days_pending: z.number().optional(),
  sort_by: z.enum(["created_at", "updated_at"]).optional(),
  sort_order: z.enum(["asc", "desc"]).optional(),
  limit: z.number().min(1).max(100).optional().default(20),
  offset: z.number().min(0).optional().default(0),
});

export async function listPets(input: ListPetsInput): Promise<ListPetsOutput> {
  const parsed = ListPetsSchema.parse(input);
  const { status, breed, region, days_pending, sort_by, sort_order, limit, offset } = parsed;

  let query = supabase.from("dogs").select("*", { count: "exact" });

  // 筛选
  if (status) query = query.eq("status", status);
  if (breed) query = query.ilike("breed", `%${breed}%`);
  if (region) query = query.ilike("location", `%${region}%`);

  // 排序
  const sortColumn = sort_by || "created_at";
  const sortDirection = sort_order || "desc";
  query = query.order(sortColumn, { ascending: sortDirection === "asc" });

  // 分页
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) throw new Error(`Failed to list pets: ${error.message}`);

  // 注入计算字段
  const pets = (data || []).map((dog: any) => ({
    ...dog,
    days_pending: calcDaysPending(dog.created_at),
    view_count: 0,
    favorite_count: 0,
    application_count: 0,
  }));

  // 过滤 days_pending
  const filteredPets = days_pending
    ? pets.filter((p: any) => p.days_pending >= days_pending)
    : pets;

  return {
    pets: filteredPets as Dog[],
    total: count || 0,
    has_more: (offset + (data?.length || 0)) < (count || 0),
  };
}

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
    pets: pets as Dog[],
    total: count || 0,
    has_more: false,
  };
}
