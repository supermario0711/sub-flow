import "server-only";

import { getCurrentBox, getAvailableSwapItems, getActiveVacation } from "@/lib/services/box";
import { getActivePatterns } from "@/lib/services/patterns";
import { getSimulation } from "@/lib/simulation/state";
import { getSimulatedNow } from "@/lib/simulation/clock";
import { getHoursUntilLock, getTimeMode } from "@/lib/simulation/time";
import { createClient } from "@/lib/supabase/server";
import type { ConversationContext } from "@/lib/types/conversation";

/**
 * Builds the conversation context for a given box and user.
 * Reuses existing services rather than raw queries where possible.
 */
export async function buildConversationContext(
  boxId: string,
  userId: string,
  userSlug: string
): Promise<ConversationContext> {
  const sim = await getSimulation();

  // Get box data via existing service
  const result = await getCurrentBox(userSlug);
  const box = result?.box;
  const items = result?.items ?? [];

  // Calculate time context
  const lockAt = box?.lock_at ?? new Date().toISOString();
  const simulatedNow = getSimulatedNow(lockAt, sim.hoursUntilLock);
  const hoursUntilLock = getHoursUntilLock(lockAt, simulatedNow);
  const timeContext = getTimeMode(hoursUntilLock);

  // Get patterns
  const patterns = await getActivePatterns(userId);

  // Get item names for patterns
  const supabase = await createClient();
  const patternItemIds = patterns.map((p) => p.item_id);
  let itemNameMap = new Map<string, string>();

  if (patternItemIds.length > 0) {
    const { data: patternItems } = await supabase
      .from("items")
      .select("id, name")
      .in("id", patternItemIds);

    if (patternItems) {
      itemNameMap = new Map(patternItems.map((i) => [i.id, i.name]));
    }
  }

  // Determine if new user (check total box count)
  const { count } = await supabase
    .from("boxes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  const isNewUser = (count ?? 0) < 3;

  // Get items available for swap/add
  const available = boxId ? await getAvailableSwapItems(boxId) : [];

  // Check for active vacation
  const vacation = await getActiveVacation(userSlug);

  return {
    hoursUntilLock,
    timeContext,
    boxItems: items.map((item) => ({
      id: item.items.id,
      name: item.items.name,
      category: item.items.category === "vegetable" ? "VEGETABLE" : "FRUIT",
    })),
    availableItems: available.map((item) => ({
      name: item.name,
      category: item.category === "vegetable" ? "VEGETABLE" : "FRUIT",
    })),
    isNewUser,
    hasActiveVacation: vacation != null,
    patterns: patterns.map((p) => ({
      type: p.type,
      itemName: itemNameMap.get(p.item_id) ?? "Unknown",
      confidence: p.confidence,
      occurrences: p.occurrences,
    })),
  };
}
