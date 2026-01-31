"use server";

import { createClient } from "@/lib/supabase/server";
import { generateBoxImage } from "@/lib/services/image-generation";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Returns the image_url for a box, or null if not yet generated.
 */
export async function getBoxImageUrl(boxId: string): Promise<string | null> {
  if (!UUID_RE.test(boxId)) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("boxes")
    .select("image_url")
    .eq("id", boxId)
    .single();

  return data?.image_url ?? null;
}

/**
 * Triggers AI image generation for a confirmed box.
 * Called from the client after landing on the confirm page.
 * Returns immediately — generation happens async.
 */
export async function triggerBoxImageGeneration(boxId: string): Promise<void> {
  if (!UUID_RE.test(boxId)) return;

  const supabase = await createClient();

  // Only generate if not already done
  const { data: box } = await supabase
    .from("boxes")
    .select("id, image_url, status")
    .eq("id", boxId)
    .single();

  if (!box || box.status !== "confirmed" || box.image_url) return;

  const { data: boxItems } = await supabase
    .from("box_items")
    .select("items(name, emoji)")
    .eq("box_id", boxId);

  if (!boxItems || boxItems.length === 0) return;

  const items = boxItems.map((bi) => {
    const item = Array.isArray(bi.items) ? bi.items[0] : bi.items;
    return { name: item.name as string, emoji: item.emoji as string };
  });

  // Await here — this server action stays alive until complete
  await generateBoxImage(boxId, items);
}
