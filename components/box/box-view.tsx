"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Box, BoxItemWithItem, Item, Vacation } from "@/lib/types/database";
import type { SwapSuggestion } from "@/lib/types/patterns";
import type { TimeMode } from "@/lib/simulation/time";
import { BoxItemCard } from "./box-item-card";
import { SwapSheet } from "./swap-sheet";
import { ConfirmButton } from "./confirm-button";
import { UrgentBanner } from "./urgent-banner";
import { SkipButton } from "./skip-button";
import { VacationCard } from "./vacation-card";
import { VacationBanner } from "./vacation-banner";
import { QuickAdd } from "./quick-add";
import { AddSheet } from "./add-sheet";
import { SwapSuggestionCard } from "./swap-suggestion";
import { swapItem, removeItem } from "@/app/actions/box";
import { resetAllBoxes } from "@/app/actions/reset";

type TimeLayout = "urgent" | "browsing" | "locked";

type BoxViewProps = {
  box: Box;
  items: BoxItemWithItem[];
  timeMode: TimeMode;
  hoursUntilLock: number;
  availableItems: Pick<Item, "id" | "name" | "emoji" | "category">[];
  suggestedItems?: Pick<Item, "id" | "name" | "emoji" | "category">[];
  swapSuggestions?: SwapSuggestion[];
  vacation?: Vacation | null;
  isSkipped?: boolean;
  userSlug?: string;
};

function getTimeLayout(timeMode: TimeMode, hours: number): TimeLayout {
  if (hours <= 0) return "locked";
  if (timeMode === "urgent") return "urgent";
  return "browsing";
}

export function BoxView({
  box,
  items,
  timeMode,
  hoursUntilLock,
  availableItems,
  suggestedItems = [],
  swapSuggestions = [],
  vacation,
  isSkipped,
  userSlug,
}: BoxViewProps) {
  const [swapTarget, setSwapTarget] = useState<BoxItemWithItem | null>(null);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [, startTransition] = useTransition();
  const [isResetting, startResetTransition] = useTransition();
  const prefersReducedMotion = useReducedMotion();

  const timeLayout = getTimeLayout(timeMode, hoursUntilLock);

  const handleSwap = (boxItem: BoxItemWithItem) => {
    setSwapTarget(boxItem);
  };

  const handleSwapSelect = (newItemId: string) => {
    if (!swapTarget) return;
    const target = swapTarget;
    setSwapTarget(null);
    startTransition(async () => {
      const result = await swapItem(box.id, target.id, newItemId);
      if (!result.success) {
        alert(result.error);
      }
    });
  };

  const handleRemove = (boxItem: BoxItemWithItem) => {
    startTransition(async () => {
      const result = await removeItem(box.id, boxItem.id);
      if (!result.success) {
        alert(result.error);
      }
    });
  };

  const handleReset = () => {
    startResetTransition(async () => {
      const result = await resetAllBoxes();
      if (!result.success) {
        alert(result.error);
      }
    });
  };

  const itemVariant = {
    hidden: prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 },
    show: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        delay: prefersReducedMotion ? 0 : i * 0.05,
      },
    }),
    exit: prefersReducedMotion
      ? { opacity: 0 }
      : { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
  };

  // Skipped state
  if (isSkipped) {
    return (
      <>
        {vacation && <VacationBanner vacation={vacation} />}

        <div role="status" className="alert mb-6">
          <span>You skipped this week&apos;s box. No delivery will arrive.</span>
        </div>

        <button
          type="button"
          onClick={handleReset}
          disabled={isResetting}
          aria-label="Reset box to draft"
          className="btn btn-outline w-full min-h-[44px] transition-all duration-300 focus:ring-2 focus:ring-primary focus:ring-offset-2 motion-reduce:transition-none"
        >
          {isResetting ? "Resetting\u2026" : "Reset Box"}
        </button>
      </>
    );
  }

  return (
    <>
      {vacation && <VacationBanner vacation={vacation} />}

      {timeLayout === "locked" && (
        <div role="status" className="alert mb-6">
          <span>
            The deadline has passed. Your box is locked. Changes will be queued for next week.
          </span>
        </div>
      )}

      {timeLayout === "urgent" && (
        <UrgentBanner hoursUntilLock={hoursUntilLock} />
      )}

      {timeLayout !== "locked" && !isSkipped && swapSuggestions.length > 0 && (
        <div className="mb-4 flex flex-col gap-3">
          <AnimatePresence>
            {swapSuggestions.map((suggestion) => (
              <SwapSuggestionCard
                key={suggestion.patternId}
                suggestion={suggestion}
                boxId={box.id}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-base-content/60">Your box is empty.</p>
      ) : (
        <div
          className={
            timeLayout === "browsing"
              ? "grid gap-3 md:grid-cols-2"
              : "flex flex-col gap-3"
          }
        >
          <AnimatePresence mode="popLayout">
            {items.map((boxItem, i) => (
              <motion.div
                key={boxItem.id}
                layout={!prefersReducedMotion}
                variants={itemVariant}
                initial="hidden"
                animate="show"
                exit="exit"
                custom={i}
              >
                <BoxItemCard
                  boxItem={boxItem}
                  timeLayout={timeLayout}
                  onSwap={handleSwap}
                  onRemove={handleRemove}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {timeLayout !== "locked" && !isSkipped && suggestedItems.length > 0 && (
        <QuickAdd
          boxId={box.id}
          suggestions={suggestedItems}
          onOpenSheet={() => setShowAddSheet(true)}
        />
      )}

      {timeLayout === "browsing" && !isSkipped && (
        <button
          type="button"
          onClick={() => setShowAddSheet(true)}
          aria-label="Add item to box"
          className="btn btn-primary btn-outline w-full mt-4 min-h-[44px] transition-all duration-300 focus:ring-2 focus:ring-primary focus:ring-offset-2 motion-reduce:transition-none"
        >
          Add Item
        </button>
      )}

      {box.status === "confirmed" && timeLayout !== "locked" && (
        <div role="status" className="alert alert-success mb-2 mt-6">
          <span>Your box is confirmed. You can still make changes until the deadline.</span>
        </div>
      )}

      <ConfirmButton boxId={box.id} timeLayout={timeLayout} isConfirmed={box.status === "confirmed"} />

      {timeLayout === "urgent" && (
        <>
          <SkipButton boxId={box.id} />
          <div className="h-20" />
        </>
      )}

      {timeLayout === "browsing" && !vacation && (
        <VacationCard userSlug={userSlug ?? ""} />
      )}

      {timeLayout === "urgent" ? null : <div className="h-4" />}

      {swapTarget && (
        <SwapSheet
          itemName={swapTarget.items.name}
          availableItems={availableItems}
          onSelect={handleSwapSelect}
          onClose={() => setSwapTarget(null)}
        />
      )}

      {showAddSheet && (
        <AddSheet
          boxId={box.id}
          onClose={() => setShowAddSheet(false)}
        />
      )}
    </>
  );
}
