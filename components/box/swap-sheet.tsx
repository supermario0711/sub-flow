"use client";

import { useRef, useEffect, useCallback } from "react";
import type { Item } from "@/lib/types/database";

type SwapSheetProps = {
  itemName: string;
  availableItems: Pick<Item, "id" | "name" | "emoji" | "category">[];
  onSelect: (itemId: string) => void;
  onClose: () => void;
};

export function SwapSheet({
  itemName,
  availableItems,
  onSelect,
  onClose,
}: SwapSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === dialogRef.current) {
        onClose();
      }
    },
    [onClose]
  );

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      onClick={handleBackdropClick}
      onClose={onClose}
    >
      <div className="modal-box">
        <h3 className="mb-4 text-lg font-semibold">
          Swap {itemName} for&hellip;
        </h3>
        <ul className="flex flex-col gap-2">
          {availableItems.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-all duration-300 hover:bg-base-200 focus:ring-2 focus:ring-primary focus:ring-offset-2 motion-reduce:transition-none min-h-[44px]"
              >
                <span className="text-2xl" role="img" aria-label={item.name}>
                  {item.emoji}
                </span>
                <div>
                  <p className="font-medium">{item.name}</p>
                  <span className="badge badge-ghost badge-sm capitalize">
                    {item.category}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
        <div className="modal-action">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close swap sheet"
            className="btn btn-sm min-h-[44px] min-w-[44px] transition-all duration-300 focus:ring-2 focus:ring-primary focus:ring-offset-2 motion-reduce:transition-none"
          >
            Cancel
          </button>
        </div>
      </div>
    </dialog>
  );
}
