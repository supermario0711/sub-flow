"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { UserSlug } from "@/lib/simulation/state";

type ActionResult = { success: true } | { success: false; error: string };

/** Seed item IDs per user slug (matches supabase/seed.sql). */
const SEED_ITEMS: Record<UserSlug, string[]> = {
  sarah: [
    "a1000000-0000-0000-0000-000000000001", // Carrot
    "a1000000-0000-0000-0000-000000000004", // Broccoli
    "a1000000-0000-0000-0000-000000000006", // Apple
    "a1000000-0000-0000-0000-000000000007", // Pear
    "a1000000-0000-0000-0000-000000000009", // Banana
  ],
  mark: [
    "a1000000-0000-0000-0000-000000000003", // Zucchini
    "a1000000-0000-0000-0000-000000000004", // Broccoli
    "a1000000-0000-0000-0000-000000000006", // Apple
    "a1000000-0000-0000-0000-000000000008", // Orange
    "a1000000-0000-0000-0000-000000000010", // Strawberry
  ],
  lisa: [
    "a1000000-0000-0000-0000-000000000001", // Carrot
    "a1000000-0000-0000-0000-000000000002", // Fennel
    "a1000000-0000-0000-0000-000000000005", // Beetroot
    "a1000000-0000-0000-0000-000000000007", // Pear
    "a1000000-0000-0000-0000-000000000010", // Strawberry
  ],
};

/** Seed swap history entries (matches supabase/seed.sql). */
const SEED_SWAP_HISTORY: Record<
  UserSlug,
  Array<{ userId: string; fromItemId: string; toItemId: string; daysAgo: number }>
> = {
  sarah: [],
  mark: [
    {
      userId: "b1000000-0000-0000-0000-000000000002",
      fromItemId: "a1000000-0000-0000-0000-000000000002",
      toItemId: "a1000000-0000-0000-0000-000000000003",
      daysAgo: 21,
    },
    {
      userId: "b1000000-0000-0000-0000-000000000002",
      fromItemId: "a1000000-0000-0000-0000-000000000002",
      toItemId: "a1000000-0000-0000-0000-000000000003",
      daysAgo: 14,
    },
    {
      userId: "b1000000-0000-0000-0000-000000000002",
      fromItemId: "a1000000-0000-0000-0000-000000000002",
      toItemId: "a1000000-0000-0000-0000-000000000003",
      daysAgo: 7,
    },
  ],
  lisa: [
    {
      userId: "b1000000-0000-0000-0000-000000000003",
      fromItemId: "a1000000-0000-0000-0000-000000000004",
      toItemId: "a1000000-0000-0000-0000-000000000005",
      daysAgo: 14,
    },
    {
      userId: "b1000000-0000-0000-0000-000000000003",
      fromItemId: "a1000000-0000-0000-0000-000000000009",
      toItemId: "a1000000-0000-0000-0000-000000000010",
      daysAgo: 7,
    },
  ],
};

/**
 * Resets all users&apos; boxes to their seed state: restores items,
 * swap history, and resets status to draft.
 */
export async function resetAllBoxes(): Promise<ActionResult> {
  const supabase = await createClient();
  const slugs: UserSlug[] = ["sarah", "mark", "lisa"];

  for (const slug of slugs) {
    const { data: user } = await supabase
      .from("users")
      .select("id, slug")
      .eq("slug", slug)
      .single();

    if (!user) continue;

    const { data: box } = await supabase
      .from("boxes")
      .select("id")
      .eq("user_id", user.id)
      .order("week_start", { ascending: false })
      .limit(1)
      .single();

    if (!box) continue;

    // Delete vacations, swap history, and box items
    await supabase.from("vacations").delete().eq("user_id", user.id);
    await supabase.from("swap_history").delete().eq("box_id", box.id);
    await supabase.from("box_items").delete().eq("box_id", box.id);

    // Re-insert seed items
    const boxItemRows = SEED_ITEMS[slug].map((itemId, index) => ({
      box_id: box.id,
      item_id: itemId,
      position: index + 1,
    }));
    await supabase.from("box_items").insert(boxItemRows);

    // Re-insert seed swap history
    const swapEntries = SEED_SWAP_HISTORY[slug];
    if (swapEntries.length > 0) {
      const swapRows = swapEntries.map((entry) => ({
        box_id: box.id,
        user_id: entry.userId,
        from_item_id: entry.fromItemId,
        to_item_id: entry.toItemId,
        swapped_at: new Date(
          Date.now() - entry.daysAgo * 24 * 60 * 60 * 1000
        ).toISOString(),
      }));
      await supabase.from("swap_history").insert(swapRows);
    }

    // Reset box status
    await supabase
      .from("boxes")
      .update({
        status: "draft",
        confirmed_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", box.id);
  }

  revalidatePath("/box");
  revalidatePath("/confirm");
  return { success: true };
}
