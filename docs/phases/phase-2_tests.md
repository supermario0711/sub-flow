# Phase 2: Test Plan

## Prerequisites

- [ ] Phase 1 tests passing (seed data loaded, build working)
- [ ] Phase 2 files implemented (`lib/simulation/`, `middleware.ts`, `components/simulation/`, `app/dev/`)

## Tests

### 1. Build & Lint
- [ ] `pnpm lint` passes with no errors
- [ ] `pnpm build` succeeds with zero errors

### 2. Time Utilities (`lib/simulation/time.ts`)
- [ ] `getTimeMode(6)` returns `"urgent"`
- [ ] `getTimeMode(11.9)` returns `"urgent"`
- [ ] `getTimeMode(12)` returns `"balanced"`
- [ ] `getTimeMode(72)` returns `"balanced"`
- [ ] `getTimeMode(73)` returns `"relaxed"`
- [ ] `getHoursUntilLock(lockAt, now)` returns `0` when `now` is after `lockAt`
- [ ] `getHoursUntilLock(lockAt, now)` returns correct positive hours when `now` is before `lockAt`

### 3. Clock Utility (`lib/simulation/clock.ts`)
- [ ] `getSimulatedNow(lockAt, null)` returns approximately `new Date()` (real time)
- [ ] `getSimulatedNow(lockAt, 6)` returns a date exactly 6 hours before `lockAt`
- [ ] `getSimulatedNow(lockAt, 0)` returns the `lockAt` date itself

### 4. Simulation State (`lib/simulation/state.ts`)
- [ ] `lib/simulation/state.ts` imports `"server-only"` at the top
- [ ] Without a `sim` cookie, `getSimulation()` returns `{ userSlug: "sarah", hoursUntilLock: null }`
- [ ] With a valid `sim` cookie, `getSimulation()` returns parsed values
- [ ] With a malformed `sim` cookie (invalid JSON), `getSimulation()` returns defaults
- [ ] With an invalid `userSlug` in cookie (e.g. `"bob"`), `getSimulation()` falls back to `"sarah"`

### 5. Server Action (`lib/simulation/actions.ts`)
- [ ] `lib/simulation/actions.ts` has `"use server"` at the top of the file
- [ ] Calling `updateSimulation({ userSlug: "mark", hoursUntilLock: 24 })` updates the `sim` cookie

### 6. Middleware — URL Param Overrides
- [ ] `/box?user=mark` sets `userSlug` to `"mark"` in the `sim` cookie and redirects to `/box`
- [ ] `/box?hours=6` sets `hoursUntilLock` to `6` in the `sim` cookie and redirects to `/box`
- [ ] `/box?user=mark&hours=6` sets both values and redirects to `/box`
- [ ] `/box?user=invalid` does not change `userSlug` (keeps existing or default)
- [ ] `/box?hours=-5` does not change `hoursUntilLock` (negative rejected)
- [ ] `/box?hours=abc` does not change `hoursUntilLock` (non-numeric rejected)
- [ ] `/box` without params passes through without redirect
- [ ] Query params are stripped from the URL after redirect (clean URL)

### 7. Box Page — Simulation Integration
- [ ] `/box` displays Sarah&apos;s box by default (no cookie set)
- [ ] After setting `sim` cookie to `{ userSlug: "mark", hoursUntilLock: null }`, `/box` shows Mark&apos;s box
- [ ] After setting `sim` cookie to `{ userSlug: "lisa", hoursUntilLock: null }`, `/box` shows Lisa&apos;s box
- [ ] With `hoursUntilLock: 6`, the SimulationBanner shows hours and "Urgent" badge
- [ ] With `hoursUntilLock: 24`, the SimulationBanner shows hours and "Balanced" badge
- [ ] With `hoursUntilLock: 96`, the SimulationBanner shows hours and "Relaxed" badge
- [ ] With `hoursUntilLock: null`, the SimulationBanner shows no time mode badge (real time)

### 8. SimulationBanner Component
- [ ] Banner displays the persona name (capitalized)
- [ ] Banner displays hours until lock when simulation is active
- [ ] Banner displays a color-coded time mode badge (error/warning/success)
- [ ] Banner contains a link to `/dev`

### 9. Dev Panel (`/dev`)
- [ ] `/dev` renders without error
- [ ] Page title metadata is "Dev Panel | Biokiste"
- [ ] Three persona buttons are displayed (Sarah, Mark, Lisa)
- [ ] Three time preset buttons are displayed (6h, 24h, 96h)
- [ ] Custom hours input field is present with associated label
- [ ] Three quick scenario buttons are displayed
- [ ] Current state section shows selected persona and time
- [ ] Launch button is present and navigates to `/box`

### 10. Dev Panel — Functional
- [ ] Clicking a persona button updates the current state display
- [ ] Clicking a time preset button updates the current state display
- [ ] Entering a custom number and clicking "Set" updates the current state display
- [ ] Pressing Enter in the custom hours input applies the value
- [ ] Clicking a quick scenario button updates both persona and time in the display
- [ ] Clicking "Launch Box View" navigates to `/box` with correct simulation state applied
- [ ] After selecting "Mark" + "6h" on dev panel, `/box` shows Mark&apos;s box with urgent banner

### 11. State Persistence
- [ ] Set simulation via `/dev`, navigate to `/box`, then back to `/dev` — state persists
- [ ] Set simulation via URL params (`/box?user=lisa&hours=24`), navigate to `/recipes`, then back to `/box` — Lisa&apos;s box still shown
- [ ] Refreshing `/box` retains the current simulation state

### 12. Accessibility (`/dev`)
- [ ] All persona buttons are focusable via Tab key
- [ ] All time preset buttons are focusable via Tab key
- [ ] Quick scenario buttons are focusable via Tab key
- [ ] All interactive elements have visible focus styles
- [ ] Custom hours input has an associated `<label>` (visible or `sr-only`)
- [ ] All interactive elements meet 44x44px minimum touch target (`min-h-[44px] min-w-[44px]`)
- [ ] Persona and time buttons are `<button>` elements (not `<div>` with onClick)

### 13. Code Quality
- [ ] No hardcoded user slug in `app/box/page.tsx` (uses `getSimulation()`)
- [ ] `lib/simulation/state.ts` uses `"server-only"` import
- [ ] `lib/simulation/actions.ts` uses `"use server"` directive
- [ ] `lib/simulation/time.ts` and `lib/simulation/clock.ts` have no server-only imports (pure functions)
- [ ] Middleware only processes requests with `user` or `hours` params (no-op otherwise)
