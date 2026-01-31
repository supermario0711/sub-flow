import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Box, BoxItemWithItem, Item, Vacation } from "@/lib/types/database";

/**
 * Fetches the current draft box for a user by their slug.
 * Returns the box and its items joined with item details.
 */
export async function getCurrentBox(userSlug: string): Promise<{
  box: Box;
  items: BoxItemWithItem[];
} | null> {
  const supabase = await createClient();

  // Get user by slug
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, name, slug, persona")
    .eq("slug", userSlug)
    .single();

  if (userError || !user) {
    return null;
  }

  // Get current draft box for user
  const { data: box, error: boxError } = await supabase
    .from("boxes")
    .select(
      "id, user_id, week_start, lock_at, status, confirmed_at, image_url, created_at, updated_at"
    )
    .eq("user_id", user.id)
    .in("status", ["draft", "confirmed"])
    .order("week_start", { ascending: false })
    .limit(1)
    .single();

  if (boxError || !box) {
    return null;
  }

  // Get box items with joined item details
  const { data: items, error: itemsError } = await supabase
    .from("box_items")
    .select(
      "id, box_id, item_id, position, added_at, updated_at, items(id, name, emoji, category)"
    )
    .eq("box_id", box.id)
    .order("position", { ascending: true });

  if (itemsError || !items) {
    return null;
  }

  return {
    box: box as Box,
    items: items as unknown as BoxItemWithItem[],
  };
}

/**
 * Fetches items available for swapping (not currently in the box).
 */
export async function getAvailableSwapItems(
  boxId: string
): Promise<Pick<Item, "id" | "name" | "emoji" | "category">[]> {
  const supabase = await createClient();

  // Get item IDs currently in the box
  const { data: boxItems, error: boxItemsError } = await supabase
    .from("box_items")
    .select("item_id")
    .eq("box_id", boxId);

  if (boxItemsError || !boxItems) {
    return [];
  }

  const currentItemIds = boxItems.map((bi) => bi.item_id);

  // Get all items not in the box
  let query = supabase.from("items").select("id, name, emoji, category");

  if (currentItemIds.length > 0) {
    query = query.not("id", "in", `(${currentItemIds.join(",")})`);
  }

  const { data: items, error: itemsError } = await query.order("name");

  if (itemsError || !items) {
    return [];
  }

  return items as Pick<Item, "id" | "name" | "emoji" | "category">[];
}

/**
 * Fetches the active (current or upcoming) vacation for a user.
 */
export async function getActiveVacation(
  userSlug: string
): Promise<Vacation | null> {
  const supabase = await createClient();

  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("slug", userSlug)
    .single();

  if (!user) return null;

  const today = new Date().toISOString().split("T")[0];

  const { data: vacation } = await supabase
    .from("vacations")
    .select("id, user_id, start_date, end_date, created_at")
    .eq("user_id", user.id)
    .gte("end_date", today)
    .order("start_date", { ascending: true })
    .limit(1)
    .single();

  return (vacation as Vacation) ?? null;
}

/**
 * Fetches the most recent skipped box for a user.
 */
export async function getSkippedBox(
  userSlug: string
): Promise<Box | null> {
  const supabase = await createClient();

  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("slug", userSlug)
    .single();

  if (!user) return null;

  const { data: box } = await supabase
    .from("boxes")
    .select(
      "id, user_id, week_start, lock_at, status, confirmed_at, image_url, created_at, updated_at"
    )
    .eq("user_id", user.id)
    .eq("status", "skipped")
    .order("week_start", { ascending: false })
    .limit(1)
    .single();

  return (box as Box) ?? null;
}

/**
 * Fetches a confirmed box for a user by slug.
 */
export async function getConfirmedBox(userSlug: string): Promise<{
  box: Box;
  items: BoxItemWithItem[];
} | null> {
  const supabase = await createClient();

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, name, slug, persona")
    .eq("slug", userSlug)
    .single();

  if (userError || !user) {
    return null;
  }

  const { data: box, error: boxError } = await supabase
    .from("boxes")
    .select(
      "id, user_id, week_start, lock_at, status, confirmed_at, image_url, created_at, updated_at"
    )
    .eq("user_id", user.id)
    .eq("status", "confirmed")
    .order("week_start", { ascending: false })
    .limit(1)
    .single();

  if (boxError || !box) {
    return null;
  }

  const { data: items, error: itemsError } = await supabase
    .from("box_items")
    .select(
      "id, box_id, item_id, position, added_at, updated_at, items(id, name, emoji, category)"
    )
    .eq("box_id", box.id)
    .order("position", { ascending: true });

  if (itemsError || !items) {
    return null;
  }

  return {
    box: box as Box,
    items: items as unknown as BoxItemWithItem[],
  };
}
