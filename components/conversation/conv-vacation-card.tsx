"use client";

import { useState } from "react";
import { VacationCard } from "@/components/box/vacation-card";

type ConvVacationCardProps = {
  userSlug: string;
  disabled?: boolean;
};

/**
 * Conversation wrapper for VacationCard.
 * Shows inline success confirmation after scheduling.
 */
export function ConvVacationCard({ userSlug, disabled = false }: ConvVacationCardProps) {
  const [scheduled, setScheduled] = useState(false);

  if (scheduled) {
    return (
      <div role="status" className="alert alert-success">
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
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>Vacation scheduled! Your deliveries will be paused.</span>
      </div>
    );
  }

  return (
    <div className={disabled ? "pointer-events-none opacity-50" : ""}>
      <VacationCard userSlug={userSlug} onSuccess={() => setScheduled(true)} />
    </div>
  );
}
