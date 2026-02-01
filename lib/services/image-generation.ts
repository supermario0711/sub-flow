import "server-only";

import { createServiceClient } from "@/lib/supabase/service";

type ItemInfo = { name: string; emoji: string };

/**
 * Generates an AI image for a confirmed box using Gemini 2.5 Flash,
 * uploads it to Supabase Storage, and updates the box record.
 *
 * This is non-critical — errors are logged but never thrown.
 */
export async function generateBoxImage(
  boxId: string,
  items: ItemInfo[]
): Promise<void> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[image-generation] GEMINI_API_KEY not set, skipping.");
    return;
  }

  try {
    const itemList = items.map((i) => `${i.emoji} ${i.name}`).join(", ");
    const prompt = [
      "A beautiful overhead food photography shot of a wooden crate",
      "filled with fresh produce:",
      itemList + ".",
      "Natural lighting, rustic kitchen background,",
      "vibrant colors, editorial food photography style.",
      "No text or labels.",
    ].join(" ");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
          },
        }),
      }
    );

    if (!response.ok) {
      console.error(
        "[image-generation] Gemini API error:",
        response.status,
        await response.text()
      );
      return;
    }

    const data = await response.json();

    // Extract base64 image from response
    const parts = data?.candidates?.[0]?.content?.parts;
    const imagePart = parts?.find(
      (p: { inlineData?: { mimeType: string } }) =>
        p.inlineData?.mimeType?.startsWith("image/")
    );

    if (!imagePart?.inlineData?.data) {
      console.warn("[image-generation] No image in Gemini response.");
      return;
    }

    const imageBuffer = Buffer.from(imagePart.inlineData.data, "base64");

    // Upload to Supabase Storage
    const supabase = createServiceClient();
    const filePath = `${boxId}.png`;

    const { error: uploadError } = await supabase.storage
      .from("box-images")
      .upload(filePath, imageBuffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("[image-generation] Storage upload error:", uploadError);
      return;
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("box-images").getPublicUrl(filePath);

    // Update box record with image URL (append cache-buster so
    // Next.js Image / browser cache serves the fresh version)
    const versionedUrl = `${publicUrl}?v=${Date.now()}`;
    const { error: updateError } = await supabase
      .from("boxes")
      .update({ image_url: versionedUrl })
      .eq("id", boxId);

    if (updateError) {
      console.error("[image-generation] Box update error:", updateError);
      return;
    }

    console.log("[image-generation] Generated image for box", boxId);
  } catch (error) {
    console.error("[image-generation] Unexpected error:", error);
  }
}
