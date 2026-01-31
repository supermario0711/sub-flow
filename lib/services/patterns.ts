import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Pattern } from "@/lib/types/patterns";

/**
 * Recalculates patterns for a user based on their swap history.
 * Creates item_dislike patterns for items frequently swapped away,
 * and item_preference patterns for items frequently swapped to.
 */
export async function recalculatePatterns(userId: string): Promise<void> {
  const supabase = await createClient();

  const { data: swaps } = await supabase
    .from("swap_history")
    .select("from_item_id, to_item_id")
    .eq("user_id", userId);

  if (!swaps || swaps.length === 0) return;

  // Count how many times each item was swapped away (dislike signal)
  const fromCounts = new Map<string, number>();
  for (const swap of swaps) {
    fromCounts.set(
      swap.from_item_id,
      (fromCounts.get(swap.from_item_id) ?? 0) + 1
    );
  }

  // Count how many times each item was swapped to (preference signal)
  const toCounts = new Map<string, number>();
  for (const swap of swaps) {
    toCounts.set(
      swap.to_item_id,
      (toCounts.get(swap.to_item_id) ?? 0) + 1
    );
  }

  const now = new Date().toISOString();

  // Upsert dislike patterns (items swapped away 2+ times)
  // confidence = min(0.95, 0.5 + occurrences * 0.15)
  // 2 swaps = 0.80, 3 = 0.95 (cap)
  for (const [itemId, count] of fromCounts) {
    if (count < 2) continue;
    const confidence = Math.min(0.95, 0.5 + count * 0.15);

    await supabase.from("patterns").upsert(
      {
        user_id: userId,
        type: "item_dislike" as const,
        item_id: itemId,
        confidence,
        occurrences: count,
        last_triggered_at: now,
        updated_at: now,
      },
      { onConflict: "user_id,type,item_id" }
    );
  }

  // Upsert preference patterns (items swapped to 2+ times)
  // confidence = min(0.90, 0.4 + occurrences * 0.15)
  // 2 swaps = 0.70, 3 = 0.85, 4+ = 0.90 (cap)
  for (const [itemId, count] of toCounts) {
    if (count < 2) continue;
    const confidence = Math.min(0.9, 0.4 + count * 0.15);

    await supabase.from("patterns").upsert(
      {
        user_id: userId,
        type: "item_preference" as const,
        item_id: itemId,
        confidence,
        occurrences: count,
        last_triggered_at: now,
        updated_at: now,
      },
      { onConflict: "user_id,type,item_id" }
    );
  }
}

/**
 * Returns all active patterns for a user.
 */
export async function getActivePatterns(
  userId: string
): Promise<Pattern[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("patterns")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("confidence", { ascending: false });

  return (data ?? []) as Pattern[];
}

/**
 * Weakens a pattern by multiplying its confidence by a factor.
 * Deactivates the pattern if confidence drops below 0.30 or rejection_count >= 3.
 */
export async function weakenPattern(
  patternId: string,
  factor: number
): Promise<void> {
  const supabase = await createClient();

  const { data: pattern } = await supabase
    .from("patterns")
    .select("confidence, rejection_count")
    .eq("id", patternId)
    .single();

  if (!pattern) return;

  const newConfidence = pattern.confidence * factor;
  const newRejectionCount = pattern.rejection_count + 1;
  const isActive = newConfidence >= 0.3 && newRejectionCount < 3;
  const now = new Date().toISOString();

  await supabase
    .from("patterns")
    .update({
      confidence: Math.round(newConfidence * 100) / 100,
      rejection_count: newRejectionCount,
      last_rejected_at: now,
      is_active: isActive,
      updated_at: now,
    })
    .eq("id", patternId);
}
