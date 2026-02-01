"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { recalculatePatterns } from "@/lib/services/patterns";
import { getSimulation } from "@/lib/simulation/state";
import { getSimulatedNow } from "@/lib/simulation/clock";
import { getHoursUntilLock } from "@/lib/simulation/time";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUuid(value: string): boolean {
  return UUID_RE.test(value);
}

type ActionResult = { success: true } | { success: false; error: string };

/**
 * Checks if a box is locked based on simulation time context.
 */
async function isBoxLocked(lockAt: string): Promise<boolean> {
  const sim = await getSimulation();
  const simulatedNow = getSimulatedNow(lockAt, sim.hoursUntilLock);
  const hours = getHoursUntilLock(lockAt, simulatedNow);
  return hours <= 0;
}

/**
 * Auto-confirms a draft box when the deadline passes.
 * Does not redirect — the caller handles navigation.
 * Note: No revalidatePath here since this runs during render (not as a user action).
 * The subsequent redirect will cause a fresh page load anyway.
 */
export async function autoConfirmBox(boxId: string): Promise<ActionResult> {
  if (!isValidUuid(boxId)) {
    return { success: false, error: "Invalid request." };
  }

  const supabase = await createClient();

  const { error: updateError } = await supabase
    .from("boxes")
    .update({
      status: "confirmed",
      confirmed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", boxId)
    .eq("status", "draft");

  if (updateError) {
    return { success: false, error: "Failed to auto-confirm box." };
  }

  return { success: true };
}

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
    .select("id, user_id, status, lock_at")
    .eq("id", boxId)
    .single();

  if (boxError || !box) {
    return { success: false, error: "Box not found." };
  }

  if (box.status !== "draft" && box.status !== "confirmed") {
    return { success: false, error: "This box can no longer be edited." };
  }

  if (await isBoxLocked(box.lock_at)) {
    return { success: false, error: "Box is locked." };
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

  // Revert confirmed box to draft on edit
  if (box.status === "confirmed") {
    const { error: revertError } = await supabase
      .from("boxes")
      .update({ status: "draft", image_url: null, updated_at: new Date().toISOString() })
      .eq("id", boxId);
    if (revertError) {
      return { success: false, error: "Failed to update box status." };
    }
  }

  await recalculatePatterns(box.user_id);

  revalidatePath("/box");
  revalidatePath("/confirm");
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
    .select("id, status, lock_at, user_id")
    .eq("id", boxId)
    .single();

  if (boxError || !box) {
    return { success: false, error: "Box not found." };
  }

  if (box.status !== "draft" && box.status !== "confirmed") {
    return { success: false, error: "This box can no longer be edited." };
  }

  if (await isBoxLocked(box.lock_at)) {
    return { success: false, error: "Box is locked." };
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

  // Revert confirmed box to draft on edit
  if (box.status === "confirmed") {
    const { error: revertError } = await supabase
      .from("boxes")
      .update({ status: "draft", image_url: null, updated_at: new Date().toISOString() })
      .eq("id", boxId);
    if (revertError) {
      return { success: false, error: "Failed to update box status." };
    }
  }

  await recalculatePatterns(box.user_id);

  revalidatePath("/box");
  revalidatePath("/confirm");
  return { success: true };
}

/**
 * Reverts a confirmed box back to draft without redirecting — used by in-chat edit flow.
 */
export async function editBoxInChat(boxId: string): Promise<ActionResult> {
  if (!isValidUuid(boxId)) {
    return { success: false, error: "Invalid request." };
  }

  const supabase = await createClient();

  await supabase
    .from("boxes")
    .update({ status: "draft", image_url: null, updated_at: new Date().toISOString() })
    .eq("id", boxId)
    .eq("status", "confirmed");

  revalidatePath("/box");
  revalidatePath("/confirm");
  return { success: true };
}

/**
 * Reverts a confirmed box back to draft so the user can edit it.
 */
export async function editBox(boxId: string): Promise<never> {
  if (!isValidUuid(boxId)) {
    redirect("/box");
  }

  const supabase = await createClient();

  await supabase
    .from("boxes")
    .update({ status: "draft", image_url: null, updated_at: new Date().toISOString() })
    .eq("id", boxId)
    .eq("status", "confirmed");

  revalidatePath("/box");
  revalidatePath("/confirm");
  redirect("/box");
}

/**
 * Confirms a draft box without redirecting — used by the in-chat confirm flow.
 */
export async function confirmBoxInChat(boxId: string): Promise<ActionResult> {
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
      image_url: null,
    })
    .eq("id", boxId);

  if (updateError) {
    return { success: false, error: "Failed to confirm box. Please try again." };
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
      image_url: null,
    })
    .eq("id", boxId);

  if (updateError) {
    return { success: false, error: "Failed to confirm box. Please try again." };
  }

  revalidatePath("/box");
  redirect("/confirm");
}
