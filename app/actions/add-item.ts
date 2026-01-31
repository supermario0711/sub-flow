"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUuid(value: string): boolean {
  return UUID_RE.test(value);
}

type ActionResult = { success: true } | { success: false; error: string };

/**
 * Adds an item to a draft box at the next available position.
 */
export async function addItem(
  boxId: string,
  itemId: string
): Promise<ActionResult> {
  if (!isValidUuid(boxId) || !isValidUuid(itemId)) {
    return { success: false, error: "Invalid request." };
  }

  const supabase = await createClient();

  // Verify box exists and is draft
  const { data: box, error: boxError } = await supabase
    .from("boxes")
    .select("id, status")
    .eq("id", boxId)
    .single();

  if (boxError || !box) {
    return { success: false, error: "Box not found." };
  }

  if (box.status !== "draft") {
    return { success: false, error: "This box can no longer be modified." };
  }

  // Check for duplicate
  const { data: existing } = await supabase
    .from("box_items")
    .select("id")
    .eq("box_id", boxId)
    .eq("item_id", itemId)
    .single();

  if (existing) {
    return { success: false, error: "That item is already in your box." };
  }

  // Get next position
  const { data: maxRow } = await supabase
    .from("box_items")
    .select("position")
    .eq("box_id", boxId)
    .order("position", { ascending: false })
    .limit(1)
    .single();

  const nextPosition = maxRow ? maxRow.position + 1 : 0;

  // Insert
  const { error: insertError } = await supabase.from("box_items").insert({
    box_id: boxId,
    item_id: itemId,
    position: nextPosition,
  });

  if (insertError) {
    return { success: false, error: "Failed to add item. Please try again." };
  }

  revalidatePath("/box");
  return { success: true };
}

/**
 * Searches items by name, excluding items already in the given box.
 * Returns up to 20 results.
 */
export async function searchItems(
  boxId: string,
  query: string
): Promise<Pick<import("@/lib/types/database").Item, "id" | "name" | "emoji" | "category">[]> {
  if (!isValidUuid(boxId)) return [];

  const trimmed = query.trim();
  if (!trimmed) return [];

  const supabase = await createClient();

  // Get item IDs currently in the box
  const { data: boxItems } = await supabase
    .from("box_items")
    .select("item_id")
    .eq("box_id", boxId);

  const currentItemIds = (boxItems ?? []).map((bi) => bi.item_id);

  let itemQuery = supabase
    .from("items")
    .select("id, name, emoji, category")
    .ilike("name", `%${trimmed}%`)
    .order("name")
    .limit(20);

  if (currentItemIds.length > 0) {
    itemQuery = itemQuery.not("id", "in", `(${currentItemIds.join(",")})`);
  }

  const { data: items } = await itemQuery;

  return (items ?? []) as Pick<import("@/lib/types/database").Item, "id" | "name" | "emoji" | "category">[];
}
