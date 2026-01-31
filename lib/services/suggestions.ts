import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Item } from "@/lib/types/database";

/**
 * Returns up to 3 suggested items that are not currently in the box.
 * Phase 4 stub: currently picks items ordered by name.
 * Will later use swap history and preference patterns.
 */
export async function getSuggestedItems(
  boxId: string
): Promise<Pick<Item, "id" | "name" | "emoji" | "category">[]> {
  const supabase = await createClient();

  // Get item IDs currently in the box
  const { data: boxItems } = await supabase
    .from("box_items")
    .select("item_id")
    .eq("box_id", boxId);

  const currentItemIds = (boxItems ?? []).map((bi) => bi.item_id);

  let query = supabase
    .from("items")
    .select("id, name, emoji, category")
    .order("name")
    .limit(3);

  if (currentItemIds.length > 0) {
    query = query.not("id", "in", `(${currentItemIds.join(",")})`);
  }

  const { data: items } = await query;

  return (items ?? []) as Pick<Item, "id" | "name" | "emoji" | "category">[];
}
