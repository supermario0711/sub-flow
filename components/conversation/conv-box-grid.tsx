"use client";

import { useState } from "react";

type ItemDetail = { emoji: string; category: string };

type ConvBoxGridProps = {
  items: string[];
  compact: boolean;
  showSwapButtons: boolean;
  collapsed?: boolean;
  onSwapTap?: (itemName: string) => void;
  onRemoveTap?: (itemName: string) => void;
  disabled?: boolean;
  itemDetails?: Record<string, ItemDetail>;
};

export function ConvBoxGrid({
  items,
  compact,
  showSwapButtons,
  collapsed = false,
  onSwapTap,
  onRemoveTap,
  disabled = false,
  itemDetails,
}: ConvBoxGridProps) {
  const [expanded, setExpanded] = useState(false);

  if (collapsed && !expanded) {
    const emojis = items
      .map((name) => itemDetails?.[name]?.emoji)
      .filter(Boolean)
      .slice(0, 6)
      .join("");

    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="flex items-center gap-3 rounded-lg bg-base-200 p-4 w-full text-left transition-all duration-300 hover:bg-base-300 focus:ring-2 focus:ring-primary focus:ring-offset-2 motion-reduce:transition-none"
      >
        <span className="text-2xl">{emojis || "📦"}</span>
        <span className="font-medium">{items.length} items in your box</span>
        <span className="ml-auto text-sm opacity-60">Show →</span>
      </button>
    );
  }

  return (
    <div
      className={
        compact
          ? "flex flex-col gap-2"
          : "grid gap-3 md:grid-cols-2"
      }
    >
      {items.map((name) => {
        const detail = itemDetails?.[name];

        return (
          <div
            key={name}
            className={`flex items-center gap-3 rounded-lg bg-base-200 transition-all duration-300 motion-reduce:transition-none ${
              compact ? "p-3" : "p-4"
            }`}
          >
            {detail && (
              <span className="text-3xl shrink-0" role="img" aria-label={name}>
                {detail.emoji}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-medium">{name}</p>
              {detail && (
                <span className="badge badge-sm badge-outline mt-0.5">
                  {detail.category}
                </span>
              )}
            </div>
            {showSwapButtons && !disabled && (
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => onSwapTap?.(name)}
                  aria-label={`Swap ${name}`}
                  className="btn btn-secondary btn-sm min-h-[44px] min-w-[44px] transition-all duration-300 focus:ring-2 focus:ring-primary focus:ring-offset-2 motion-reduce:transition-none"
                >
                  {compact ? "↔" : "Swap"}
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveTap?.(name)}
                  aria-label={`Remove ${name}`}
                  className="btn btn-secondary btn-sm min-h-[44px] min-w-[44px] transition-all duration-300 focus:ring-2 focus:ring-primary focus:ring-offset-2 motion-reduce:transition-none"
                >
                  {compact ? "✕" : "Remove"}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
