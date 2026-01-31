# Phase 2.1 Test Log

**Date:** 2026-01-31T19:32  
**Tester:** Cursor AI  
**Browser:** Cursor IDE Browser (localhost:3000)

## Build & Lint

| Test | Result |
|------|--------|
| `pnpm lint` passes without errors | PASS |
| `pnpm build` succeeds without errors | PASS |

## Time Presets

| Test | Result |
|------|--------|
| Dev panel shows three preset buttons: `0h`, `6h`, `24h` | PASS |
| Clicking `0h` sets hours to 0 and highlights the button | PASS |
| Clicking `6h` sets hours to 6 and highlights the button | PASS |
| Clicking `24h` sets hours to 24 and highlights the button | PASS |
| Custom hours input still works as before | PASS |

## Quick Scenarios

| Test | Result |
|------|--------|
| Dev panel shows 9 scenario buttons (3 personas x 3 time states) | PASS |
| Each button label follows the format `"Name · TimeLayout"` | PASS |
| Clicking a scenario updates both persona and hours in current state | PASS |
| `Locked` scenarios set hours to `0` | PASS |
| `Urgent` scenarios set hours to `6` | PASS |
| `Browsing` scenarios set hours to `24` | PASS |

### Scenario Buttons Verified

- Sarah · Locked, Sarah · Urgent, Sarah · Browsing
- Mark · Locked, Mark · Urgent, Mark · Browsing
- Lisa · Locked, Lisa · Urgent, Lisa · Browsing

## End-to-End: Dev Panel to Box View

| Test | Result |
|------|--------|
| `Locked` scenario → box shows locked banner, no swap/add UI | PASS |
| `Urgent` scenario → streamlined UI, quick actions only | PASS |
| `Browsing` scenario → full UI with add sheet and browsing features | PASS |
| Persona switching works correctly | PASS |

### Locked State (0h)

- Simulation banner: "Sarah · 0h until lock · Urgent"
- Locked banner displayed: "The deadline has passed. Your box is locked. Changes will be queued for next week."
- No swap/remove buttons visible on item cards
- No "Add Item" button visible

### Urgent State (6h)

- Simulation banner: "Mark · 6h until lock · Urgent"
- Urgent banner displayed: "Your box locks in 6 hours!"
- Swap/remove icon buttons visible on item cards
- Quick add suggestions visible
- Fixed "Confirm Box Now" button at bottom
- "Skip this week's box" button visible

### Browsing State (24h)

- Simulation banner: "Sarah · 24h until lock · Balanced"
- No urgent/locked banner (relaxed mode)
- Full "Swap" and "Remove" text buttons on item cards
- Grid layout for items (2 columns on desktop)
- "Add Item" button visible
- "Confirm Box" button visible
- Vacation scheduling card visible

## Notes

1. **TimeMode vs TimeLayout naming**: The dev panel "Current state" badge shows `getTimeMode()` values (`urgent`, `balanced`, `relaxed`), while the box view uses `TimeLayout` values (`locked`, `urgent`, `browsing`) derived from both timeMode and hours. This is by design - the box view correctly shows "locked" state when hours <= 0.

2. **Scenario button labels**: All 9 buttons use the "Name · TimeLayout" format correctly (e.g., "Sarah · Locked", "Mark · Urgent", "Lisa · Browsing").

3. **State persistence**: The simulation state is stored in a `sim` cookie and persists across page navigations correctly.

## Summary

**All tests PASS.** Phase 2.1 implementation is complete and working as specified.
