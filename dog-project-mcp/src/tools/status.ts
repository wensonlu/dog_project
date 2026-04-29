import { z } from "zod";
import { supabase } from "../lib/supabase.js";
import type { BatchUpdatePetStatusInput, BatchOperationResult } from "../types/index.js";

const BatchUpdatePetStatusSchema = z.object({
  pet_ids: z.array(z.string()),
  status: z.enum(["available", "adopted", "pending", "urgent"]),
  condition: z.string().optional(),
});

export async function batchUpdatePetStatus(
  input: BatchUpdatePetStatusInput
): Promise<BatchOperationResult> {
  const { pet_ids, status, condition } = BatchUpdatePetStatusSchema.parse(input);

  if (pet_ids.length > 50) {
    throw new Error("最多一次更新 50 个宠物");
  }

  const results: BatchOperationResult["results"] = [];
  let successCount = 0;
  let failedCount = 0;

  // 批量更新
  const { error } = await supabase
    .from("dogs")
    .update({ status })
    .in("id", pet_ids.map(Number));

  if (error) {
    // 批量失败，逐个处理
    for (const pet_id of pet_ids) {
      try {
        const { error: individualError } = await supabase
          .from("dogs")
          .update({ status })
          .eq("id", Number(pet_id));

        if (individualError) {
          results.push({
            id: pet_id,
            success: false,
            error: individualError.message,
          });
          failedCount++;
        } else {
          results.push({ id: pet_id, success: true });
          successCount++;
        }
      } catch (err) {
        results.push({
          id: pet_id,
          success: false,
          error: err instanceof Error ? err.message : "Unknown error",
        });
        failedCount++;
      }
    }
  } else {
    // 批量成功
    for (const pet_id of pet_ids) {
      results.push({ id: pet_id, success: true });
    }
    successCount = pet_ids.length;
  }

  return { success_count: successCount, failed_count: failedCount, results };
}

export async function updatePetStatus(
  petId: string,
  status: string
): Promise<{ success: boolean }> {
  const { error } = await supabase
    .from("dogs")
    .update({ status })
    .eq("id", Number(petId));

  if (error) throw new Error(`Failed to update pet status: ${error.message}`);

  return { success: true };
}
