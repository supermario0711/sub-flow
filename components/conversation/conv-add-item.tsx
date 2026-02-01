"use client";

import { useState } from "react";
import { AddSheet } from "@/components/box/add-sheet";

type ConvAddItemProps = {
  prompt: string;
  boxId: string;
  disabled?: boolean;
  onItemAdded?: (itemName: string) => void;
};

/**
 * Conversation wrapper for AddSheet.
 * Shows a button with the prompt text; clicking opens the full search sheet.
 */
export function ConvAddItem({ prompt, boxId, disabled = false, onItemAdded }: ConvAddItemProps) {
  const [showSheet, setShowSheet] = useState(false);

  return (
    <div className="my-2">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setShowSheet(true)}
        className={`btn btn-outline w-full min-h-[44px] transition-all duration-300 focus:ring-2 focus:ring-primary focus:ring-offset-2 motion-reduce:transition-none ${
          disabled ? "opacity-50" : ""
        }`}
      >
        {prompt}
      </button>
      {showSheet && (
        <AddSheet boxId={boxId} onClose={() => setShowSheet(false)} onItemAdded={onItemAdded} />
      )}
    </div>
  );
}
