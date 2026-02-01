"use client";

import { useState } from "react";
import { VacationBanner } from "@/components/box/vacation-banner";
import type { Vacation } from "@/lib/types/database";

type ConvVacationBannerProps = {
  vacation: Vacation;
};

/**
 * Conversation wrapper for VacationBanner.
 * Shows inline confirmation after canceling instead of letting page refresh destroy state.
 */
export function ConvVacationBanner({ vacation }: ConvVacationBannerProps) {
  const [canceled, setCanceled] = useState(false);

  if (canceled) {
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
        <span>Vacation canceled. Your deliveries will resume as normal.</span>
      </div>
    );
  }

  return <VacationBanner vacation={vacation} onCancel={() => setCanceled(true)} />;
}
