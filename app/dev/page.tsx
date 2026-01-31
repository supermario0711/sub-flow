"use client";

import { useState, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateSimulation } from "@/lib/simulation/actions";
import { resetAllBoxes } from "@/app/actions/reset";
import type { UserSlug } from "@/lib/simulation/state";
import { getTimeMode } from "@/lib/simulation/time";

const PERSONAS: { slug: UserSlug; name: string; persona: string }[] = [
  { slug: "sarah", name: "Sarah", persona: "New subscriber" },
  { slug: "mark", name: "Mark", persona: "Experienced" },
  { slug: "lisa", name: "Lisa", persona: "Power user" },
];

const TIME_PRESETS = [6, 24, 96] as const;

const SCENARIOS: { label: string; user: UserSlug; hours: number }[] = [
  { label: "Urgent new user", user: "sarah", hours: 4 },
  { label: "Relaxed power user", user: "lisa", hours: 120 },
  { label: "Balanced experienced", user: "mark", hours: 36 },
];

export default function DevPage() {
  const router = useRouter();
  const [isResetting, startResetTransition] = useTransition();
  const [userSlug, setUserSlug] = useState<UserSlug>("sarah");
  const [hours, setHours] = useState<number | null>(null);
  const [customHours, setCustomHours] = useState("");

  const apply = useCallback(
    async (slug: UserSlug, h: number | null) => {
      await updateSimulation({ userSlug: slug, hoursUntilLock: h });
      router.refresh();
    },
    [router]
  );

  const handleSelectPersona = useCallback(
    (slug: UserSlug) => {
      setUserSlug(slug);
      void apply(slug, hours);
    },
    [apply, hours]
  );

  const handleSelectPreset = useCallback(
    (h: number) => {
      setHours(h);
      setCustomHours(String(h));
      void apply(userSlug, h);
    },
    [apply, userSlug]
  );

  const handleCustomHours = useCallback(() => {
    const parsed = parseFloat(customHours);
    if (!isNaN(parsed) && parsed >= 0) {
      setHours(parsed);
      void apply(userSlug, parsed);
    }
  }, [apply, customHours, userSlug]);

  const handleScenario = useCallback(
    (s: (typeof SCENARIOS)[number]) => {
      setUserSlug(s.user);
      setHours(s.hours);
      setCustomHours(String(s.hours));
      void apply(s.user, s.hours);
    },
    [apply]
  );

  const timeMode = hours !== null ? getTimeMode(hours) : null;

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-semibold tracking-tight">
        Dev Panel
      </h1>

      {/* Persona selector */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-medium">Persona</h2>
        <div className="flex gap-3">
          {PERSONAS.map((p) => (
            <button
              key={p.slug}
              type="button"
              onClick={() => handleSelectPersona(p.slug)}
              className={`btn min-h-[44px] min-w-[44px] flex-1 ${
                userSlug === p.slug ? "btn-primary" : "btn-outline"
              }`}
            >
              <span className="block font-medium">{p.name}</span>
              <span className="block text-xs opacity-70">{p.persona}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Time presets */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-medium">Hours until lock</h2>
        <div className="flex gap-3">
          {TIME_PRESETS.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => handleSelectPreset(h)}
              className={`btn min-h-[44px] min-w-[44px] flex-1 ${
                hours === h ? "btn-primary" : "btn-outline"
              }`}
            >
              {h}h
            </button>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <label htmlFor="custom-hours" className="sr-only">
            Custom hours
          </label>
          <input
            id="custom-hours"
            type="number"
            min="0"
            step="1"
            placeholder="Custom hours"
            value={customHours}
            onChange={(e) => setCustomHours(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCustomHours();
            }}
            className="input bg-base-100 border border-base-300 min-h-[44px] flex-1"
          />
          <button
            type="button"
            onClick={handleCustomHours}
            className="btn btn-outline min-h-[44px] min-w-[44px]"
          >
            Set
          </button>
        </div>
      </section>

      {/* Quick scenarios */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-medium">Quick scenarios</h2>
        <div className="flex flex-col gap-2">
          {SCENARIOS.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => handleScenario(s)}
              className="btn btn-soft min-h-[44px] justify-start text-left"
            >
              {s.label}
              <span className="ml-auto text-xs opacity-60">
                {s.user} &middot; {s.hours}h
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Current state */}
      <section className="mb-8 rounded-lg border border-base-300 bg-base-200 p-4">
        <h2 className="mb-2 text-sm font-medium opacity-60">Current state</h2>
        <p>
          <span className="font-medium capitalize">{userSlug}</span>
          {hours !== null && (
            <>
              {" "}&middot; {hours}h
              {timeMode && (
                <span className="badge badge-sm ml-2">{timeMode}</span>
              )}
            </>
          )}
          {hours === null && (
            <span className="ml-2 text-sm opacity-60">Real time</span>
          )}
        </p>
      </section>

      {/* Reset */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-medium">Data</h2>
        <button
          type="button"
          disabled={isResetting}
          onClick={() => {
            startResetTransition(async () => {
              await resetAllBoxes();
              router.refresh();
            });
          }}
          className="btn btn-outline btn-error min-h-[44px] w-full"
        >
          {isResetting ? "Resetting\u2026" : "Reset All Boxes"}
        </button>
      </section>

      {/* Launch */}
      <button
        type="button"
        onClick={() => router.push("/box")}
        className="btn btn-primary btn-lg min-h-[44px] w-full"
      >
        Launch Box View
      </button>
    </main>
  );
}
