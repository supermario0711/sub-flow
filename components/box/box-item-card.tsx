"use client";

import type { BoxItemWithItem } from "@/lib/types/database";

type TimeLayout = "urgent" | "browsing" | "locked";

type BoxItemCardProps = {
  boxItem: BoxItemWithItem;
  timeLayout: TimeLayout;
  onSwap: (boxItem: BoxItemWithItem) => void;
  onRemove: (boxItem: BoxItemWithItem) => void;
};

export function BoxItemCard({
  boxItem,
  timeLayout,
  onSwap,
  onRemove,
}: BoxItemCardProps) {
  const { items: item } = boxItem;

  if (timeLayout === "locked") {
    return (
      <div className="flex items-center gap-4 rounded-lg bg-base-200 p-4 transition-all duration-300 motion-reduce:transition-none">
        <span className="text-3xl" role="img" aria-label={item.name}>
          {item.emoji}
        </span>
        <div>
          <p className="font-medium">{item.name}</p>
          <span className="badge badge-ghost badge-sm capitalize">
            {item.category}
          </span>
        </div>
      </div>
    );
  }

  if (timeLayout === "urgent") {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-base-200 p-3 transition-all duration-300 motion-reduce:transition-none">
        <span className="text-2xl" role="img" aria-label={item.name}>
          {item.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium">{item.name}</p>
          <span className="badge badge-ghost badge-sm capitalize">
            {item.category}
          </span>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onSwap(boxItem)}
            aria-label={`Swap ${item.name}`}
            className="btn btn-secondary btn-sm min-h-[44px] min-w-[44px] transition-all duration-300 focus:ring-2 focus:ring-primary focus:ring-offset-2 motion-reduce:transition-none"
          >
            ↔
          </button>
          <button
            type="button"
            onClick={() => onRemove(boxItem)}
            aria-label={`Remove ${item.name}`}
            className="btn btn-secondary btn-sm min-h-[44px] min-w-[44px] transition-all duration-300 focus:ring-2 focus:ring-primary focus:ring-offset-2 motion-reduce:transition-none"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  // browsing
  return (
    <div className="flex items-center gap-4 rounded-lg bg-base-200 p-4 transition-all duration-300 motion-reduce:transition-none">
      <span className="text-3xl" role="img" aria-label={item.name}>
        {item.emoji}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{item.name}</p>
        <span className="badge badge-ghost badge-sm capitalize">
          {item.category}
        </span>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onSwap(boxItem)}
          aria-label={`Swap ${item.name}`}
          className="btn btn-secondary btn-sm min-h-[44px] min-w-[44px] transition-all duration-300 focus:ring-2 focus:ring-primary focus:ring-offset-2 motion-reduce:transition-none"
        >
          Swap
        </button>
        <button
          type="button"
          onClick={() => onRemove(boxItem)}
          aria-label={`Remove ${item.name}`}
          className="btn btn-secondary btn-sm min-h-[44px] min-w-[44px] transition-all duration-300 focus:ring-2 focus:ring-primary focus:ring-offset-2 motion-reduce:transition-none"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
