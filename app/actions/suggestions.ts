"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { recalculatePatterns, weakenPattern } from "@/lib/services/patterns";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUuid(value: string): boolean {
  return UUID_RE.test(value);
}

type ActionResult = { success: true } | { success: false; error: string };

/**
 * Accepts a swap suggestion: performs the swap and records it with suggestion_accepted context.
 */
export async function acceptSuggestion(
  boxId: string,
  patternId: string,
  fromItemId: string,
  toItemId: string
): Promise<ActionResult> {
  if (
    !isValidUuid(boxId) ||
    !isValidUuid(patternId) ||
    !isValidUuid(fromItemId) ||
    !isValidUuid(toItemId)
  ) {
    return { success: false, error: "Invalid request." };
  }

  const supabase = await createClient();

  // Get the box and user
  const { data: box } = await supabase
    .from("boxes")
    .select("id, user_id, status")
    .eq("id", boxId)
    .single();

  if (!box) return { success: false, error: "Box not found." };
  if (box.status !== "draft" && box.status !== "confirmed") {
    return { success: false, error: "This box can no longer be edited." };
  }

  // Find the box_item to swap
  const { data: boxItem } = await supabase
    .from("box_items")
    .select("id")
    .eq("box_id", boxId)
    .eq("item_id", fromItemId)
    .single();

  if (!boxItem) return { success: false, error: "Item not found in this box." };

  // Check target not already in box
  const { data: existing } = await supabase
    .from("box_items")
    .select("id")
    .eq("box_id", boxId)
    .eq("item_id", toItemId)
    .single();

  if (existing) {
    return { success: false, error: "That item is already in your box." };
  }

  // Perform the swap
  const { error: updateError } = await supabase
    .from("box_items")
    .update({ item_id: toItemId, updated_at: new Date().toISOString() })
    .eq("id", boxItem.id);

  if (updateError) {
    return { success: false, error: "Failed to swap item. Please try again." };
  }

  // Record swap history with suggestion_accepted context
  await supabase.from("swap_history").insert({
    box_id: boxId,
    user_id: box.user_id,
    from_item_id: fromItemId,
    to_item_id: toItemId,
    context: "suggestion_accepted",
  });

  await recalculatePatterns(box.user_id);

  revalidatePath("/box");
  return { success: true };
}

/**
 * Rejects a swap suggestion: weakens the pattern confidence.
 */
export async function rejectSuggestion(
  patternId: string
): Promise<ActionResult> {
  if (!isValidUuid(patternId)) {
    return { success: false, error: "Invalid request." };
  }

  await weakenPattern(patternId, 0.75);

  revalidatePath("/box");
  return { success: true };
}
