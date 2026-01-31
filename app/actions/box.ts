"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { recalculatePatterns } from "@/lib/services/patterns";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUuid(value: string): boolean {
  return UUID_RE.test(value);
}

type ActionResult = { success: true } | { success: false; error: string };

/**
 * Swaps an item in a box for a different item.
 */
export async function swapItem(
  boxId: string,
  boxItemId: string,
  newItemId: string
): Promise<ActionResult> {
  if (!isValidUuid(boxId) || !isValidUuid(boxItemId) || !isValidUuid(newItemId)) {
    return { success: false, error: "Invalid request." };
  }

  const supabase = await createClient();

  // Fetch box
  const { data: box, error: boxError } = await supabase
    .from("boxes")
    .select("id, user_id, status")
    .eq("id", boxId)
    .single();

  if (boxError || !box) {
    return { success: false, error: "Box not found." };
  }

  if (box.status !== "draft" && box.status !== "confirmed") {
    return { success: false, error: "This box can no longer be edited." };
  }

  // Verify boxItemId belongs to this box
  const { data: boxItem, error: boxItemError } = await supabase
    .from("box_items")
    .select("id, item_id")
    .eq("id", boxItemId)
    .eq("box_id", boxId)
    .single();

  if (boxItemError || !boxItem) {
    return { success: false, error: "Item not found in this box." };
  }

  // Verify newItemId is not already in the box
  const { data: existing } = await supabase
    .from("box_items")
    .select("id")
    .eq("box_id", boxId)
    .eq("item_id", newItemId)
    .single();

  if (existing) {
    return { success: false, error: "That item is already in your box." };
  }

  const fromItemId = boxItem.item_id;

  // Update box_items
  const { error: updateError } = await supabase
    .from("box_items")
    .update({ item_id: newItemId, updated_at: new Date().toISOString() })
    .eq("id", boxItemId);

  if (updateError) {
    return { success: false, error: "Failed to swap item. Please try again." };
  }

  // Insert swap_history
  await supabase.from("swap_history").insert({
    box_id: boxId,
    user_id: box.user_id,
    from_item_id: fromItemId,
    to_item_id: newItemId,
  });

  await recalculatePatterns(box.user_id);

  revalidatePath("/box");
  return { success: true };
}

/**
 * Removes an item from a box.
 */
export async function removeItem(
  boxId: string,
  boxItemId: string
): Promise<ActionResult> {
  if (!isValidUuid(boxId) || !isValidUuid(boxItemId)) {
    return { success: false, error: "Invalid request." };
  }

  const supabase = await createClient();

  const { data: box, error: boxError } = await supabase
    .from("boxes")
    .select("id, status")
    .eq("id", boxId)
    .single();

  if (boxError || !box) {
    return { success: false, error: "Box not found." };
  }

  if (box.status !== "draft" && box.status !== "confirmed") {
    return { success: false, error: "This box can no longer be edited." };
  }

  // Verify boxItemId belongs to this box
  const { data: boxItem, error: boxItemError } = await supabase
    .from("box_items")
    .select("id")
    .eq("id", boxItemId)
    .eq("box_id", boxId)
    .single();

  if (boxItemError || !boxItem) {
    return { success: false, error: "Item not found in this box." };
  }

  const { error: deleteError } = await supabase
    .from("box_items")
    .delete()
    .eq("id", boxItemId);

  if (deleteError) {
    return { success: false, error: "Failed to remove item. Please try again." };
  }

  revalidatePath("/box");
  return { success: true };
}

/**
 * Confirms a draft box.
 */
export async function confirmBox(boxId: string): Promise<ActionResult> {
  if (!isValidUuid(boxId)) {
    return { success: false, error: "Invalid request." };
  }

  const supabase = await createClient();

  const { data: box, error: boxError } = await supabase
    .from("boxes")
    .select("id, status")
    .eq("id", boxId)
    .single();

  if (boxError || !box) {
    return { success: false, error: "Box not found." };
  }

  if (box.status !== "draft" && box.status !== "confirmed") {
    return { success: false, error: "This box can no longer be confirmed." };
  }

  const { error: updateError } = await supabase
    .from("boxes")
    .update({
      status: "confirmed",
      confirmed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", boxId);

  if (updateError) {
    return { success: false, error: "Failed to confirm box. Please try again." };
  }

  revalidatePath("/box");
  redirect("/confirm");
}
