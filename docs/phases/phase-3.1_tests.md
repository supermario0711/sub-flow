# Phase 3.1 Test Checklist

## Build & Lint
- [ ] `pnpm lint` passes without errors
- [ ] `pnpm build` succeeds without errors

## Migration — Vacations Table
- [ ] `vacations` table exists with columns: `id`, `user_id`, `start_date`, `end_date`, `created_at`
- [ ] `CHECK (end_date >= start_date)` constraint enforced
- [ ] `idx_vacations_user_id` index exists
- [ ] RLS enabled with read, insert, delete policies

## Migration — Box Status
- [ ] `'skipped'` value accepted in `boxes.status` column
- [ ] Existing statuses (`draft`, `confirmed`, `delivered`) still work

## Types
- [ ] `Vacation` type exported from `lib/types/database.ts`
- [ ] `Box.status` includes `'skipped'` in union type

## Service Layer
- [ ] `getActiveVacation(userSlug)` returns current/upcoming vacation when one exists
- [ ] `getActiveVacation(userSlug)` returns `null` when no vacation exists
- [ ] `getSkippedBox(userSlug)` returns skipped box when one exists
- [ ] `getSkippedBox(userSlug)` returns `null` when no skipped box exists

## Server Action — skipWeek
- [ ] Rejects invalid UUID
- [ ] Rejects non-editable box (delivered, skipped)
- [ ] Sets draft box status to `'skipped'`
- [ ] Sets confirmed box status to `'skipped'` and clears `confirmed_at`
- [ ] Revalidates `/box` path
- [ ] Returns `{ success: true }` on success

## Server Action — addVacation
- [ ] Rejects invalid dates
- [ ] Rejects end date before start date
- [ ] Rejects start date before today
- [ ] Inserts vacation row with correct user_id, start_date, end_date
- [ ] Auto-skips draft and confirmed boxes with `week_start` in vacation range (clears `confirmed_at`)
- [ ] Creates skipped boxes for weeks in range that don&apos;t have a box
- [ ] Revalidates `/box` path

## Server Action — cancelVacation
- [ ] Rejects invalid UUID
- [ ] Deletes vacation row
- [ ] Un-skips boxes in vacation date range (status `'skipped'` → `'draft'`)
- [ ] Does not affect confirmed/delivered boxes in range
- [ ] Revalidates `/box` path

## Box Page — Urgent Mode
- [ ] "Skip This Week" button visible below items
- [ ] No vacation card shown
- [ ] Skip button triggers confirmation modal

## Box Page — Browsing Mode
- [ ] Vacation card visible with start/end date inputs
- [ ] Start date defaults to next Monday
- [ ] End date defaults to start + 7 days
- [ ] Week count displayed correctly
- [ ] "Schedule Vacation" button submits form
- [ ] No skip button shown

## Box Page — Locked Mode
- [ ] No skip button shown
- [ ] No vacation card shown

## Box Page — Skipped State
- [ ] Shows "You skipped this week&apos;s box" message
- [ ] Reset button visible and functional
- [ ] Reset restores box to draft and clears vacations

## Vacation Banner
- [ ] Shown when active vacation exists (both urgent and browsing modes)
- [ ] Displays end date formatted correctly
- [ ] "Cancel Vacation" button calls `cancelVacation`
- [ ] Banner disappears after cancellation

## Skip Confirmation Dialog
- [ ] Modal opens on "Skip This Week" click
- [ ] Shows warning message about no delivery
- [ ] "Skip" button confirms and skips box
- [ ] "Cancel" button dismisses modal without action
- [ ] Backdrop click dismisses modal

## Reset Action
- [ ] Deletes all vacations for user
- [ ] Resets skipped boxes back to draft
- [ ] Re-inserts seed items and swap history

## Accessibility
- [ ] `aria-label` on skip button, vacation inputs, schedule button, cancel button, reset button
- [ ] Modal uses `<dialog>` element with `aria-label`
- [ ] Keyboard navigation: Tab through all interactive elements
- [ ] All interactive elements have `min-h-[44px]` touch targets
- [ ] Alert messages use `role="status"` or `role="alert"`
- [ ] `motion-reduce:transition-none` on animated elements

## Code Quality
- [ ] `"use server"` directive in `app/actions/vacation.ts`
- [ ] `"use client"` directive in all component files
- [ ] No `SELECT *` queries — explicit column selection
- [ ] DaisyUI semantic classes used (no raw Tailwind colors)
- [ ] Apostrophes escaped with `&apos;` in JSX text
