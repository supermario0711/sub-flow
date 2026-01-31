"use client";

import { useState, useTransition } from "react";
import type { Box, BoxItemWithItem, Item, Vacation } from "@/lib/types/database";
import type { TimeMode } from "@/lib/simulation/time";
import { BoxItemCard } from "./box-item-card";
import { SwapSheet } from "./swap-sheet";
import { ConfirmButton } from "./confirm-button";
import { UrgentBanner } from "./urgent-banner";
import { SkipButton } from "./skip-button";
import { VacationCard } from "./vacation-card";
import { VacationBanner } from "./vacation-banner";
import { swapItem, removeItem } from "@/app/actions/box";
import { resetAllBoxes } from "@/app/actions/reset";

type TimeLayout = "urgent" | "browsing" | "locked";

type BoxViewProps = {
  box: Box;
  items: BoxItemWithItem[];
  timeMode: TimeMode;
  hoursUntilLock: number;
  availableItems: Pick<Item, "id" | "name" | "emoji" | "category">[];
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
  vacation,
  isSkipped,
  userSlug,
}: BoxViewProps) {
  const [swapTarget, setSwapTarget] = useState<BoxItemWithItem | null>(null);
  const [, startTransition] = useTransition();
  const [isResetting, startResetTransition] = useTransition();

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
          {items.map((boxItem) => (
            <BoxItemCard
              key={boxItem.id}
              boxItem={boxItem}
              timeLayout={timeLayout}
              onSwap={handleSwap}
              onRemove={handleRemove}
            />
          ))}
        </div>
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
    </>
  );
}
