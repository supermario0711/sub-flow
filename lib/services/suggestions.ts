import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Item } from "@/lib/types/database";
import type { SwapSuggestion } from "@/lib/types/patterns";
import { getActivePatterns } from "./patterns";

/**
 * Returns swap suggestions for a box based on the user&apos;s learned patterns.
 * Matches dislike patterns against items currently in the box,
 * then finds preferred replacements (same category, not already in the box).
 */
export async function getSwapSuggestions(
  boxId: string,
  userId: string
): Promise<SwapSuggestion[]> {
  const supabase = await createClient();

  const patterns = await getActivePatterns(userId);

  const dislikePatterns = patterns.filter((p) => p.type === "item_dislike");
  const preferencePatterns = patterns.filter(
    (p) => p.type === "item_preference"
  );

  if (dislikePatterns.length === 0) return [];

  // Get current box items with item details
  const { data: boxItems } = await supabase
    .from("box_items")
    .select("item_id, items(id, name, emoji, category)")
    .eq("box_id", boxId);

  if (!boxItems || boxItems.length === 0) return [];

  const currentItemIds = new Set(boxItems.map((bi) => bi.item_id));

  // Get all items for finding replacements
  const { data: allItems } = await supabase
    .from("items")
    .select("id, name, emoji, category");

  if (!allItems) return [];

  const suggestions: SwapSuggestion[] = [];

  for (const pattern of dislikePatterns) {
    // Check if the disliked item is in the box
    const boxItem = boxItems.find((bi) => bi.item_id === pattern.item_id);
    if (!boxItem) continue;

    const fromItem = boxItem.items as unknown as Pick<
      Item,
      "id" | "name" | "emoji" | "category"
    >;

    // Find a replacement: prefer items the user has a preference for
    const preferredIds = new Set(
      preferencePatterns.map((p) => p.item_id)
    );

    // Same category, not in box, prefer preferred items
    const candidates = allItems
      .filter(
        (item) =>
          item.category === fromItem.category &&
          !currentItemIds.has(item.id)
      )
      .sort((a, b) => {
        const aPreferred = preferredIds.has(a.id) ? 0 : 1;
        const bPreferred = preferredIds.has(b.id) ? 0 : 1;
        if (aPreferred !== bPreferred) return aPreferred - bPreferred;
        return a.name.localeCompare(b.name);
      });

    if (candidates.length === 0) continue;

    const toItem = candidates[0];
    suggestions.push({
      fromItem: { id: fromItem.id, name: fromItem.name, emoji: fromItem.emoji },
      toItem: { id: toItem.id, name: toItem.name, emoji: toItem.emoji },
      reason: `You've swapped ${fromItem.name.toLowerCase()} out ${pattern.occurrences} times`,
      confidence: pattern.confidence,
      patternId: pattern.id,
    });
  }

  return suggestions.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Returns up to 3 suggested items that are not currently in the box.
 * When userId is provided, prioritizes preferred items and deprioritizes disliked ones.
 */
export async function getSuggestedItems(
  boxId: string,
  userId?: string
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
    .order("name");

  if (currentItemIds.length > 0) {
    query = query.not("id", "in", `(${currentItemIds.join(",")})`);
  }

  const { data: items } = await query;
  let available = (items ?? []) as Pick<
    Item,
    "id" | "name" | "emoji" | "category"
  >[];

  // If user provided, reorder based on patterns
  if (userId) {
    const patterns = await getActivePatterns(userId);
    const preferredIds = new Set(
      patterns
        .filter((p) => p.type === "item_preference")
        .map((p) => p.item_id)
    );
    const dislikedIds = new Set(
      patterns
        .filter((p) => p.type === "item_dislike")
        .map((p) => p.item_id)
    );

    available = available.sort((a, b) => {
      const aScore = preferredIds.has(a.id)
        ? 0
        : dislikedIds.has(a.id)
          ? 2
          : 1;
      const bScore = preferredIds.has(b.id)
        ? 0
        : dislikedIds.has(b.id)
          ? 2
          : 1;
      if (aScore !== bScore) return aScore - bScore;
      return a.name.localeCompare(b.name);
    });
  }

  return available.slice(0, 3);
}
