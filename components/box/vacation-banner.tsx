"use client";

import { useTransition } from "react";
import { cancelVacation } from "@/app/actions/vacation";
import type { Vacation } from "@/lib/types/database";

type VacationBannerProps = {
  vacation: Vacation;
  onCancel?: () => void;
};

export function VacationBanner({ vacation, onCancel }: VacationBannerProps) {
  const [isPending, startTransition] = useTransition();

  const endFormatted = new Date(vacation.end_date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const handleCancel = () => {
    startTransition(async () => {
      const result = await cancelVacation(vacation.id);
      if (!result.success) {
        alert(result.error);
      } else {
        onCancel?.();
      }
    });
  };

  return (
    <div role="status" className="alert alert-info mb-6">
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
      <span>
        You&apos;re on vacation until {endFormatted}. No boxes will be delivered.
      </span>
      <button
        type="button"
        onClick={handleCancel}
        disabled={isPending}
        aria-label="Cancel vacation"
        className="btn btn-sm btn-ghost min-h-[44px] min-w-[44px]"
      >
        {isPending ? "Canceling\u2026" : "Cancel Vacation"}
      </button>
    </div>
  );
}
