"use client";

import { BoxImage } from "@/components/confirm/box-image";

type ConvBoxImageProps = {
  boxId: string;
  items: Array<{ name: string; emoji: string }>;
};

/**
 * Wraps the existing BoxImage component for use inside conversation turns.
 * Triggers image generation + polls — same behaviour as the confirm page.
 */
export function ConvBoxImage({ boxId, items }: ConvBoxImageProps) {
  return <BoxImage boxId={boxId} imageUrl={null} items={items} />;
}
