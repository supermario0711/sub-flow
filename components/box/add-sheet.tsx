"use client";

import { useRef, useEffect, useCallback, useState, useTransition } from "react";
import type { Item } from "@/lib/types/database";
import { searchItems } from "@/app/actions/add-item";
import { addItem } from "@/app/actions/add-item";

type AddSheetProps = {
  boxId: string;
  onClose: () => void;
};

export function AddSheet({ boxId, onClose }: AddSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [results, setResults] = useState<
    Pick<Item, "id" | "name" | "emoji" | "category">[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
    inputRef.current?.focus();
  }, []);

  const handleQueryChange = useCallback(
    (value: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      const trimmed = value.trim();
      if (!trimmed) {
        setResults([]);
        setHasSearched(false);
        return;
      }

      debounceRef.current = setTimeout(async () => {
        setIsSearching(true);
        const items = await searchItems(boxId, trimmed);
        setResults(items);
        setHasSearched(true);
        setIsSearching(false);
      }, 300);
    },
    [boxId]
  );

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === dialogRef.current) {
        onClose();
      }
    },
    [onClose]
  );

  const handleSelect = (itemId: string) => {
    startTransition(async () => {
      const result = await addItem(boxId, itemId);
      if (!result.success) {
        alert(result.error);
      } else {
        onClose();
      }
    });
  };

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-label="Add item to box"
      onClick={handleBackdropClick}
      onClose={onClose}
    >
      <div className="modal-box">
        <h3 className="mb-4 text-lg font-semibold">Add Item</h3>

        <input
          ref={inputRef}
          type="search"
          placeholder="Search items&hellip;"
          onChange={(e) => handleQueryChange(e.target.value)}
          aria-label="Search items"
          className="input input-bordered w-full mb-4 min-h-[44px] focus:ring-2 focus:ring-primary focus:ring-offset-2"
        />

        {isSearching && (
          <div className="flex justify-center py-4">
            <span className="loading loading-spinner loading-sm" />
          </div>
        )}

        {!isSearching && hasSearched && results.length === 0 && (
          <p className="py-4 text-center text-base-content/60">
            No items found.
          </p>
        )}

        {!isSearching && results.length > 0 && (
          <ul className="flex flex-col gap-2 max-h-64 overflow-y-auto">
            {results.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleSelect(item.id)}
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
        )}

        <div className="modal-action">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close add item sheet"
            className="btn btn-sm min-h-[44px] min-w-[44px] transition-all duration-300 focus:ring-2 focus:ring-primary focus:ring-offset-2 motion-reduce:transition-none"
          >
            Cancel
          </button>
        </div>
      </div>
    </dialog>
  );
}
