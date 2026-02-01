"use client";

import { useState } from "react";
import { QuickAdd } from "@/components/box/quick-add";
import { AddSheet } from "@/components/box/add-sheet";

type AvailableItem = { id: string; name: string; emoji: string; category: "vegetable" | "fruit" };

type ConvQuickAddProps = {
  suggestions: string[];
  boxId: string;
  availableItems: AvailableItem[];
  disabled?: boolean;
  onItemAdded?: (itemName: string) => void;
};

/**
 * Conversation wrapper for QuickAdd.
 * Resolves item names from the AI to full item objects for the existing QuickAdd component.
 */
export function ConvQuickAdd({
  suggestions,
  boxId,
  availableItems,
  disabled = false,
  onItemAdded,
}: ConvQuickAddProps) {
  const [showSheet, setShowSheet] = useState(false);

  // Resolve suggestion names to full item objects
  const resolved = suggestions
    .map((name) => availableItems.find((i) => i.name === name))
    .filter((item): item is AvailableItem => item != null);

  if (resolved.length === 0 && !disabled) return null;

  return (
    <div className={disabled ? "pointer-events-none opacity-50" : ""}>
      <QuickAdd
        boxId={boxId}
        suggestions={resolved}
        onOpenSheet={() => setShowSheet(true)}
        onItemAdded={onItemAdded}
      />
      {showSheet && (
        <AddSheet boxId={boxId} onClose={() => setShowSheet(false)} onItemAdded={onItemAdded} />
      )}
    </div>
  );
}
