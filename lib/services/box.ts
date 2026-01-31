import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Box, BoxItemWithItem } from "@/lib/types/database";

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
    .eq("status", "draft")
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
