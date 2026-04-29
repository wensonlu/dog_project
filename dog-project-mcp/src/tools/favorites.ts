import { z } from "zod";
import { supabase } from "../lib/supabase.js";
import type { NotifyFavoriteUsersInput, NotifyOutput } from "../types/index.js";

const NotifyFavoriteUsersSchema = z.object({
  pet_id: z.string(),
  message: z.string(),
});

export async function notifyFavoriteUsers(
  input: NotifyFavoriteUsersInput
): Promise<NotifyOutput> {
  const { pet_id, message } = NotifyFavoriteUsersSchema.parse(input);

  // 获取收藏了该宠物的所有用户
  const { data: favorites, error: favError } = await supabase
    .from("favorites")
    .select("user_id")
    .eq("dog_id", Number(pet_id));

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
    .eq("id", Number(pet_id))
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
    };
  }

  return {
    success_count: userIds.length,
    failed_count: 0,
    notified_users: userIds,
  };
}

export async function listFavorites(userId?: string) {
  let query = supabase
    .from("favorites")
    .select(`
      *,
      dog:dogs(id, name, image, status, updated_at)
    `)
    .order("created_at", { ascending: false });

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query;

  if (error) throw new Error(`Failed to list favorites: ${error.message}`);

  return {
    favorites: data || [],
    total: data?.length || 0,
  };
}
