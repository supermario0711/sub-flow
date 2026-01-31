"use client";

import { useState, useTransition, useMemo } from "react";
import { addVacation } from "@/app/actions/vacation";

type VacationCardProps = {
  userSlug: string;
};

/**
 * Returns the next Monday as YYYY-MM-DD.
 */
function getNextMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const daysUntilMonday = day === 0 ? 1 : 8 - day;
  d.setDate(d.getDate() + daysUntilMonday);
  return d.toISOString().split("T")[0];
}

/**
 * Returns a date string offset by the given number of days.
 */
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

/**
 * Counts the number of weeks (Mondays) in a date range.
 */
function countWeeks(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (end < start) return 0;

  const current = new Date(start);
  const day = current.getDay();
  const diff = day === 0 ? 6 : day - 1;
  current.setDate(current.getDate() - diff);

  let count = 0;
  while (current <= end) {
    count++;
    current.setDate(current.getDate() + 7);
  }
  return count;
}

export function VacationCard({ userSlug }: VacationCardProps) {
  const defaultStart = useMemo(() => getNextMonday(), []);
  const defaultEnd = useMemo(() => addDays(defaultStart, 7), [defaultStart]);

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];
  const weeksCount = countWeeks(startDate, endDate);
  const isValid = startDate >= today && endDate >= startDate;

  const handleSubmit = () => {
    setError(null);
    startTransition(async () => {
      const result = await addVacation(userSlug, startDate, endDate);
      if (!result.success) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="card bg-base-200 mt-6">
      <div className="card-body">
        <h2 className="card-title text-lg">Going on vacation?</h2>
        <p className="text-base-content/60 text-sm">
          Pause your deliveries for a date range.
        </p>

        <div className="flex flex-col gap-3 mt-3 sm:flex-row">
          <label className="form-control flex-1">
            <span className="label-text mb-1">Start date</span>
            <input
              type="date"
              value={startDate}
              min={today}
              onChange={(e) => setStartDate(e.target.value)}
              className="input input-bordered w-full min-h-[44px]"
              aria-label="Vacation start date"
            />
          </label>
          <label className="form-control flex-1">
            <span className="label-text mb-1">End date</span>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input input-bordered w-full min-h-[44px]"
              aria-label="Vacation end date"
            />
          </label>
        </div>

        {isValid && weeksCount > 0 && (
          <p className="text-sm text-base-content/60 mt-1">
            {weeksCount} {weeksCount === 1 ? "week" : "weeks"} will be skipped.
          </p>
        )}

        {error && (
          <p className="text-sm text-error mt-1" role="alert">
            {error}
          </p>
        )}

        <div className="card-actions mt-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || !isValid}
            aria-label="Schedule vacation"
            className="btn btn-primary w-full min-h-[44px] transition-all duration-300 focus:ring-2 focus:ring-primary focus:ring-offset-2 motion-reduce:transition-none"
          >
            {isPending ? "Scheduling\u2026" : "Schedule Vacation"}
          </button>
        </div>
      </div>
    </div>
  );
}
