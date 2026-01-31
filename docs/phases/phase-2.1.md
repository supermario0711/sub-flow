# Phase 2.1: Dev Panel Quick Scenarios Revamp

## Goal
Adjust the dev panel to make demo scenario selection faster and more intuitive. Change time presets to cover all three `TimeLayout` states (`locked` / `urgent` / `browsing`) and expand quick scenarios to a 3x3 grid of persona x time combinations.

## Background
Phase 3 introduced a `TimeLayout` concept in the box view that maps hours-until-lock to three UI states:

| TimeLayout | Condition | Behavior |
|------------|-----------|----------|
| `locked`   | 0 hours   | Box is read-only, no swaps or adds |
| `urgent`   | <12 hours | Streamlined UI, quick actions only |
| `browsing` | >=12 hours | Full UI with add sheet, browsing features |

The current dev panel presets (`6h`, `24h`, `96h`) only cover `urgent` and `browsing`/`relaxed` — there is no way to quickly enter `locked` state. The quick scenarios (3 entries) don&apos;t cover all persona x time combinations.

## Changes to `app/dev/page.tsx`

### 1. Time Presets

```ts
// Before
const TIME_PRESETS = [6, 24, 96] as const;

// After
const TIME_PRESETS = [0, 6, 24] as const;
```

This maps to: `locked` (0h), `urgent` (6h), `browsing` (24h).

### 2. Quick Scenarios

Replace the current 3 scenarios with a full 3x3 grid (persona x TimeLayout):

```ts
const SCENARIOS: { label: string; user: UserSlug; hours: number }[] = [
  { label: "Sarah · Locked",   user: "sarah", hours: 0 },
  { label: "Sarah · Urgent",   user: "sarah", hours: 6 },
  { label: "Sarah · Browsing", user: "sarah", hours: 24 },
  { label: "Mark · Locked",    user: "mark",  hours: 0 },
  { label: "Mark · Urgent",    user: "mark",  hours: 6 },
  { label: "Mark · Browsing",  user: "mark",  hours: 24 },
  { label: "Lisa · Locked",    user: "lisa",  hours: 0 },
  { label: "Lisa · Urgent",    user: "lisa",  hours: 6 },
  { label: "Lisa · Browsing",  user: "lisa",  hours: 24 },
];
```

### 3. No other file changes

Only `app/dev/page.tsx` is modified. No new files, no migrations.

## Status
**Completed** 2026-01-31
