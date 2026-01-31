"use client";

import { useTransition } from "react";
import type { Item } from "@/lib/types/database";
import { addItem } from "@/app/actions/add-item";

type QuickAddProps = {
  boxId: string;
  suggestions: Pick<Item, "id" | "name" | "emoji" | "category">[];
  onOpenSheet: () => void;
};

export function QuickAdd({ boxId, suggestions, onOpenSheet }: QuickAddProps) {
  const [isPending, startTransition] = useTransition();

  const handleAdd = (itemId: string) => {
    startTransition(async () => {
      const result = await addItem(boxId, itemId);
      if (!result.success) {
        alert(result.error);
      }
    });
  };

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {suggestions.map((item) => (
        <button
          key={item.id}
          type="button"
          disabled={isPending}
          onClick={() => handleAdd(item.id)}
          aria-label={`Add ${item.name} to box`}
          className="btn btn-sm btn-outline gap-1 min-h-[44px] transition-all duration-300 focus:ring-2 focus:ring-primary focus:ring-offset-2 motion-reduce:transition-none"
        >
          <span role="img" aria-hidden="true">{item.emoji}</span>
          {item.name}
        </button>
      ))}
      <button
        type="button"
        onClick={onOpenSheet}
        aria-label="Browse more items to add"
        className="btn btn-sm btn-ghost gap-1 min-h-[44px] transition-all duration-300 focus:ring-2 focus:ring-primary focus:ring-offset-2 motion-reduce:transition-none"
      >
        More&hellip;
      </button>
    </div>
  );
}
