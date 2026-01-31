# Phase 2: Simulation System

**Goal:** Instantly switch between users and time contexts for development and demo.

**Exit Criteria:** Can switch to "Mark + 6 hours" and see different data on `/box`.

---

## Overview

The simulation system is the backbone of the demo. It lets us show three personas under different time pressures without waiting for real time or real users. It consists of three parts:

1. **Simulation state** — Server-side cookie utilities that provide the active user slug and simulated time
2. **URL param overrides** — `?user=mark&hours=6` applies simulation state from a link
3. **Dev panel** — A dedicated `/dev` page to control simulation visually

---

## Time Context Model

### Time Modes

Based on hours until the box `lock_at` deadline:

| Hours Until Lock | Mode | Description |
|------------------|------|-------------|
| < 12 | `urgent` | Minimal UI, suggestions prominent, one-tap confirm |
| 12–72 | `balanced` | Clear options, moderate detail |
| > 72 | `relaxed` | Rich, explorative, seasonal content |

### Utility: `lib/simulation/time.ts`

```ts
export type TimeMode = 'urgent' | 'balanced' | 'relaxed'

export function getTimeMode(hoursUntilLock: number): TimeMode {
  if (hoursUntilLock < 12) return 'urgent'
  if (hoursUntilLock <= 72) return 'balanced'
  return 'relaxed'
}

export function getHoursUntilLock(lockAt: string, now?: Date): number {
  const lock = new Date(lockAt)
  const current = now ?? new Date()
  return Math.max(0, (lock.getTime() - current.getTime()) / (1000 * 60 * 60))
}
```

When simulation is active, the `now` parameter is overridden to produce the desired `hoursUntilLock` value relative to the box's `lock_at`.

---

## Simulation State

### Shape

```ts
export type SimulationState = {
  userSlug: 'sarah' | 'mark' | 'lisa'
  hoursUntilLock: number | null // null = use real time
}
```

### Storage: Cookie-Based

Use a single cookie `sim` to persist simulation state across navigation. Cookie-based storage works with both server and client components.

**Cookie format:** JSON string `{"userSlug":"mark","hoursUntilLock":6}`

**Default state:** `{ userSlug: 'sarah', hoursUntilLock: null }`

### Utility: `lib/simulation/state.ts`

Server-only utility for reading/writing the simulation cookie. Must import `"server-only"` at the top to prevent accidental client-side bundling.

```ts
import "server-only"

export async function getSimulation(): Promise<SimulationState>
export async function setSimulation(state: SimulationState): Promise<void>
```

Uses `cookies()` from `next/headers`. The `setSimulation` function is called from Server Actions only.

### Utility: `lib/simulation/clock.ts`

Pure utility (no server-only imports needed) that derives the effective "now" time from simulation state + box lock_at:

```ts
/**
 * Given a box lock_at and simulation hoursUntilLock,
 * returns the simulated current time.
 * If hoursUntilLock is null, returns real current time.
 */
export function getSimulatedNow(lockAt: string, hoursUntilLock: number | null): Date
```

---

## URL Parameter Overrides

URL params `?user=<slug>&hours=<number>` override the simulation cookie for that request and update the cookie so the state persists.

### Implementation: Middleware (`middleware.ts`)

Update the existing middleware (or create if not present) to:

1. Check for `user` and/or `hours` search params on any request
2. If present, set the `sim` cookie with the new values
3. Redirect to the same URL without the query params (clean URL)

This ensures:
- Links like `/box?user=mark&hours=6` work from the dev panel or external sharing
- The URL stays clean after applying the override
- State persists for subsequent navigation

```ts
// middleware.ts (relevant logic)
if (url.searchParams.has('user') || url.searchParams.has('hours')) {
  const sim = getCurrentSimFromCookie(request)
  if (url.searchParams.has('user')) sim.userSlug = url.searchParams.get('user')
  if (url.searchParams.has('hours')) sim.hoursUntilLock = Number(url.searchParams.get('hours'))
  // Set cookie on response, redirect to clean URL
}
```

---

## Updating the Box Page

### Current State

`app/box/page.tsx` currently hardcodes `userSlug = 'sarah'`.

### Changes

1. Read simulation state via `getSimulation()`
2. Pass `userSlug` from simulation state to `getCurrentBox()`
3. Compute `hoursUntilLock` using `getSimulatedNow()` + box `lock_at`
4. Compute `timeMode` using `getTimeMode()`
5. Display the time mode and hours as a simple indicator (full adaptive UI comes in Phase 3)

```tsx
// app/box/page.tsx
export default async function BoxPage() {
  const sim = await getSimulation()
  const { box, items } = await getCurrentBox(sim.userSlug)

  const now = getSimulatedNow(box.lock_at, sim.hoursUntilLock)
  const hours = getHoursUntilLock(box.lock_at, now)
  const mode = getTimeMode(hours)

  return (
    <div>
      <SimulationBanner userSlug={sim.userSlug} hours={hours} mode={mode} />
      {/* existing item list */}
    </div>
  )
}
```

### SimulationBanner Component

A small client component shown at the top of the page during development:

- Shows active persona name and avatar/emoji
- Shows hours until lock and current time mode (color-coded badge)
- Links to the dev panel for quick access

Located at `components/simulation/simulation-banner.tsx`.

---

## Dev Panel Page

### Route: `app/dev/page.tsx`

A full-page control panel for switching simulation state. This is a client component page that uses Server Actions to update the cookie.

### Layout

```
┌─────────────────────────────────┐
│         🧪 Dev Panel            │
├─────────────────────────────────┤
│                                 │
│  Persona                        │
│  ┌─────┐ ┌─────┐ ┌─────┐      │
│  │Sarah│ │ Mark│ │ Lisa│       │
│  │ New │ │ Exp │ │Power│       │
│  └─────┘ └─────┘ └─────┘      │
│                                 │
│  Hours Until Lock               │
│  ┌──────────────────────────┐  │
│  │ ◉ 6h  ◉ 24h  ◉ 96h     │  │
│  │ ◉ Custom: [___]          │  │
│  └──────────────────────────┘  │
│                                 │
│  Quick Scenarios                │
│  ┌──────────────────────┐      │
│  │ Mark + Urgent (6h)   │      │
│  │ Sarah + Relaxed (96h)│      │
│  │ Lisa + Balanced (24h)│      │
│  └──────────────────────┘      │
│                                 │
│  Current State                  │
│  User: mark | Hours: 6 | urgent│
│                                 │
│  [ Launch → /box ]              │
│                                 │
└─────────────────────────────────┘
```

### Features

1. **Persona selector** — Three cards for Sarah/Mark/Lisa showing name, persona type, and a brief description
2. **Time selector** — Preset buttons (6h, 24h, 96h) + custom numeric input
3. **Quick scenarios** — One-click buttons that set both persona and time:
   - "Mark + Urgent" → `{ userSlug: 'mark', hoursUntilLock: 6 }`
   - "Sarah + Relaxed" → `{ userSlug: 'sarah', hoursUntilLock: 96 }`
   - "Lisa + Balanced" → `{ userSlug: 'lisa', hoursUntilLock: 24 }`
4. **Current state display** — Shows active simulation values and computed time mode
5. **Launch button** — Navigates to `/box` with the current simulation applied

### Server Action: `lib/simulation/actions.ts`

File must have `"use server"` directive at the very top.

```ts
"use server"

import { setSimulation } from "./state"
import type { SimulationState } from "./time"

export async function updateSimulation(state: SimulationState): Promise<void> {
  await setSimulation(state)
}
```

The dev panel calls this action on any change, then uses `router.refresh()` to reflect the new state.

### Metadata

The dev panel page must export metadata per project conventions:

```ts
export const metadata = { title: "Dev Panel | Biokiste" }
```

### Accessibility

- All persona selector cards must be keyboard-navigable (`<button>` elements, not `<div>` with onClick)
- Time preset buttons and custom input must have visible focus styles
- Custom hours input must have an associated `<label>`
- Quick scenario buttons must have descriptive accessible names
- All interactive elements must meet 44x44px minimum touch target

### Apostrophes

All JSX text containing apostrophes must use `&apos;` (e.g., `doesn&apos;t`, `user&apos;s`).

---

## Project Structure (New/Modified Files)

```
lib/
  simulation/
    time.ts              — getTimeMode(), getHoursUntilLock()
    state.ts             — getSimulation(), setSimulation() (cookie read/write)
    clock.ts             — getSimulatedNow()
    actions.ts           — Server Action: updateSimulation()

components/
  simulation/
    simulation-banner.tsx — Dev-mode banner showing active persona + time

app/
  dev/
    page.tsx             — Dev panel page
  box/
    page.tsx             — Updated to use simulation state (was hardcoded to sarah)

middleware.ts            — URL param override logic (?user=&hours=)
```

---

## RLS Policy Updates

The dev panel needs to write the `sim` cookie only — no additional database writes in this phase. All data fetching continues through the existing read-only RLS policies. No schema or policy changes required.

---

## Acceptance Criteria

- [ ] `lib/simulation/time.ts` exports `getTimeMode()` and `getHoursUntilLock()` with correct thresholds
- [ ] `lib/simulation/state.ts` reads/writes a `sim` cookie with `SimulationState`
- [ ] `lib/simulation/clock.ts` computes simulated "now" from `hoursUntilLock` + `lock_at`
- [ ] `/box` reads simulation state and displays the correct persona's box
- [ ] `/box` shows a `SimulationBanner` with active persona, hours, and time mode
- [ ] `/dev` page renders with persona selector, time selector, quick scenarios, and launch button
- [ ] Selecting a persona + time on `/dev` and clicking launch shows the correct box on `/box`
- [ ] URL params `?user=mark&hours=6` on `/box` update the cookie and show Mark's box in urgent mode
- [ ] Simulation state persists across page navigation (cookie-based)
- [ ] Quick scenario buttons apply both persona and time in one click
- [ ] `lib/simulation/state.ts` imports `"server-only"` to prevent client bundling
- [ ] `lib/simulation/actions.ts` has `"use server"` at the top of the file
- [ ] `/dev` page exports metadata with title
- [ ] All interactive elements on `/dev` are keyboard-accessible with visible focus styles
- [ ] All form inputs on `/dev` have associated labels
- [ ] `pnpm build` succeeds with zero errors
- [ ] `pnpm lint` passes

---

## Out of Scope (deferred to later phases)

- Adaptive UI layout changes based on time mode (Phase 3)
- Swap/remove interactions (Phase 3)
- Pattern detection from swap history (Phase 4)
- Animations or visual polish (Phase 5)
