"use client";

import Link from "next/link";
import type { TimeMode } from "@/lib/simulation/time";

const MODE_STYLES: Record<TimeMode, { bg: string; label: string }> = {
  urgent: { bg: "badge-error", label: "Urgent" },
  balanced: { bg: "badge-warning", label: "Balanced" },
  relaxed: { bg: "badge-success", label: "Relaxed" },
};

type SimulationBannerProps = {
  userSlug: string;
  hoursUntilLock: number | null;
  timeMode: TimeMode | null;
};

export function SimulationBanner({
  userSlug,
  hoursUntilLock,
  timeMode,
}: SimulationBannerProps) {
  const modeInfo = timeMode ? MODE_STYLES[timeMode] : null;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-dashed border-base-300 bg-base-200 px-4 py-2 text-sm">
      <span className="font-medium capitalize">{userSlug}</span>
      {hoursUntilLock !== null && (
        <span>{Math.round(hoursUntilLock)}h until lock</span>
      )}
      {modeInfo && (
        <span className={`badge badge-sm ${modeInfo.bg}`}>{modeInfo.label}</span>
      )}
      <Link
        href="/dev"
        className="ml-auto text-xs underline underline-offset-2 opacity-60 hover:opacity-100"
      >
        Dev Panel
      </Link>
    </div>
  );
}
