"use client";

import { useState } from "react";
import { SkipButton } from "@/components/box/skip-button";

type ConvSkipWeekProps = {
  boxId: string;
  disabled?: boolean;
};

/**
 * Conversation wrapper for SkipButton.
 * Shows inline confirmation after skipping.
 */
export function ConvSkipWeek({ boxId, disabled = false }: ConvSkipWeekProps) {
  const [skipped, setSkipped] = useState(false);

  if (skipped) {
    return (
      <div role="status" className="alert alert-info">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="h-6 w-6 shrink-0 stroke-current"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>This week&apos;s box has been skipped.</span>
      </div>
    );
  }

  return (
    <div className={disabled ? "pointer-events-none opacity-50" : ""}>
      <SkipButton boxId={boxId} onSkipped={() => setSkipped(true)} />
    </div>
  );
}
