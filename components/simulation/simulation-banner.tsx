"use client";

import { useState } from "react";
import { updateSimulation } from "@/lib/simulation/actions";
import { resetAllBoxes } from "@/app/actions/reset";
import type { UserSlug } from "@/lib/simulation/state";

const SCENARIOS: { label: string; user: UserSlug; hours: number }[] = [
  { label: "Sarah · Box locked", user: "sarah", hours: 0 },
  { label: "Sarah · Locking soon", user: "sarah", hours: 6 },
  { label: "Sarah · Plenty of time", user: "sarah", hours: 24 },
  { label: "Mark · Box locked", user: "mark", hours: 0 },
  { label: "Mark · Locking soon", user: "mark", hours: 6 },
  { label: "Mark · Plenty of time", user: "mark", hours: 24 },
  { label: "Lisa · Box locked", user: "lisa", hours: 0 },
  { label: "Lisa · Locking soon", user: "lisa", hours: 6 },
  { label: "Lisa · Plenty of time", user: "lisa", hours: 24 },
];

type SimulationBannerProps = {
  userSlug: string;
  hoursUntilLock: number | null;
  timeMode: string | null;
};

export function SimulationBanner({
  userSlug,
  hoursUntilLock,
}: SimulationBannerProps) {
  const [resetting, setResetting] = useState(false);

  const currentScenarioIndex = SCENARIOS.findIndex(
    (s) =>
      s.user === userSlug &&
      (hoursUntilLock !== null ? s.hours === Math.round(hoursUntilLock) : false)
  );

  async function handleScenarioChange(
    e: React.ChangeEvent<HTMLSelectElement>
  ) {
    const idx = parseInt(e.target.value, 10);
    if (isNaN(idx) || idx < 0) return;
    const scenario = SCENARIOS[idx];
    await updateSimulation({
      userSlug: scenario.user,
      hoursUntilLock: scenario.hours,
    });
    window.location.href = "/box";
  }

  async function handleReset() {
    setResetting(true);
    await resetAllBoxes();
    window.location.href = "/box";
  }

  return (
    <div className="flex gap-2 rounded-lg bg-base-200 px-4 py-2">
      <label htmlFor="scenario-select" className="sr-only">
        Select scenario
      </label>
      <select
        id="scenario-select"
        className="select select-bordered flex-1"
        value={currentScenarioIndex >= 0 ? currentScenarioIndex : ""}
        onChange={handleScenarioChange}
      >
        <option value="" disabled>
          Select a scenario…
        </option>
        {SCENARIOS.map((s, i) => (
          <option key={s.label} value={i}>
            {s.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="btn btn-outline btn-sm self-center"
        disabled={resetting}
        onClick={handleReset}
      >
        {resetting ? "Resetting…" : "Reset all"}
      </button>
    </div>
  );
}
