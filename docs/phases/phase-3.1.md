# Phase 3.1: Skip & Vacation Feature

## Goal
Add the ability to skip this week&apos;s box (urgent mode) or schedule a vacation / multi-week pause (browsing mode). Time-adaptive: urgent shows a simple "Skip this week" button, browsing shows a date-range vacation picker.

## Features
- **Skip This Week** — One-click skip in urgent mode, sets box status to `'skipped'` (works for both draft and confirmed boxes; skipping a confirmed box clears `confirmed_at`)
- **Vacation Scheduling** — Date-range picker in browsing mode, auto-skips draft boxes in range
- **Vacation Banner** — Info alert when active vacation exists, with cancel button
- **Skipped State** — Dedicated view when box is skipped, with reset button
- **Reset Integration** — Reset action clears vacations and un-skips boxes

## Architecture Decisions
- Skipping sets box status to `'skipped'` (new enum value) rather than deleting the box — both draft and confirmed boxes can be skipped (skipping clears `confirmed_at`)
- Vacations are stored separately from boxes — they represent a *range* of weeks
- Adding a vacation auto-skips any draft or confirmed boxes in that range (clearing `confirmed_at`) AND creates + skips boxes for weeks that don&apos;t have a box yet
- Canceling a vacation un-skips boxes in the vacation range that are still in `'skipped'` status (restores to `'draft'`)
- The vacation date picker prefills with sensible defaults (next Monday + 7 days)
- Reset action clears vacations too (for demo purposes)

## Time-Adaptive Behavior

| Mode | UI |
|------|-----|
| **Urgent** (<12h) | "Skip This Week" button below items |
| **Browsing** (≥12h) | Vacation card with date picker |
| **Locked** (0h) | No skip/vacation UI |
| **Skipped** | "You skipped this week" message + reset button |

## Files Created
- `supabase/migrations/005_vacations.sql` — Vacations table + RLS policies
- `supabase/migrations/006_box_skipped_status.sql` — Adds `'skipped'` to box status constraint
- `app/actions/vacation.ts` — Server actions: `skipWeek`, `addVacation`, `cancelVacation`
- `components/box/skip-button.tsx` — Skip button with confirmation modal (urgent mode)
- `components/box/vacation-card.tsx` — Vacation date picker card (browsing mode)
- `components/box/vacation-banner.tsx` — Active vacation info banner with cancel

## Files Modified
- `lib/types/database.ts` — Added `Vacation` type, updated `Box.status` union
- `lib/services/box.ts` — Added `getActiveVacation`, `getSkippedBox` functions
- `app/box/page.tsx` — Fetches vacation/skipped state, passes to BoxView
- `components/box/box-view.tsx` — Handles skipped state, shows skip/vacation UI per time mode
- `app/actions/reset.ts` — Clears vacations on reset

## Status
**Completed** — Lint and build pass.
