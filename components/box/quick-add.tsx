"use client";

import { useTransition } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Item } from "@/lib/types/database";
import { addItem } from "@/app/actions/add-item";

type QuickAddProps = {
  boxId: string;
  suggestions: Pick<Item, "id" | "name" | "emoji" | "category">[];
  onOpenSheet: () => void;
  onItemAdded?: (itemName: string) => void;
};

export function QuickAdd({ boxId, suggestions, onOpenSheet, onItemAdded }: QuickAddProps) {
  const [isPending, startTransition] = useTransition();
  const prefersReducedMotion = useReducedMotion();

  const handleAdd = (item: Pick<Item, "id" | "name">) => {
    startTransition(async () => {
      const result = await addItem(boxId, item.id);
      if (!result.success) {
        alert(result.error);
      } else {
        onItemAdded?.(item.name);
      }
    });
  };

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {suggestions.map((item, i) => (
        <motion.button
          key={item.id}
          type="button"
          disabled={isPending}
          onClick={() => handleAdd(item)}
          aria-label={`Add ${item.name} to box`}
          initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.2,
            delay: prefersReducedMotion ? 0 : i * 0.03,
          }}
          whileTap={prefersReducedMotion ? undefined : { scale: 0.93 }}
          className="btn btn-sm btn-outline gap-1 min-h-[44px] transition-colors duration-300 focus:ring-2 focus:ring-primary focus:ring-offset-2 motion-reduce:transition-none"
        >
          <span role="img" aria-hidden="true">{item.emoji}</span>
          {item.name}
        </motion.button>
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
