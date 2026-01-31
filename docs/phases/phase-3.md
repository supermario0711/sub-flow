# Phase 3: Core Box UI

## Goal
Build the interactive box customization interface — swapping items, removing items, confirming the box — with time-adaptive layouts that respond to the simulation system from Phase 2.

## Key Features
- **Item swap flow**: Tap swap → bottom sheet with available items → select → persisted
- **Item removal**: Remove items from the box
- **Box confirmation**: Confirm box → redirect to confirmation page
- **Time-adaptive layout**: Three modes (urgent / browsing / locked) based on hours until lock
- **Confirmation page**: Celebration view with item summary
- **Reset action**: Dev-only reset to restore seed data for demo purposes

## Mode System

### Urgent (<12h remaining)
Compact card layout with icon-only swap/remove buttons, urgent banner, sticky confirm button, quick actions. Single column.

### Browsing (≥12h remaining)
Full explore mode — grid layout (2-column on `md`+, per design system), spacious cards with text swap/remove buttons, seasonal highlights, standard confirm button below grid.

### Locked (0h remaining / deadline passed)
Read-only view of the current box. No action buttons, no confirm button. "Locked" banner displayed. Placeholder message about queuing changes for next week (future phase). Triggered purely by time (deadline passed), not by box status. Confirmed boxes still redirect to `/confirm` as before.

## Architecture Decisions
- **Server Actions** for all mutations (swap, remove, confirm, reset) — simple UI mutations, no RLS bypass needed
- **Client components** for interactive elements, server components for pages
- **DaisyUI semantic classes** throughout (soft-garden theme)

## Files Created
- `supabase/migrations/002_phase3_rls.sql` — Write RLS policies
- `supabase/migrations/003_swap_history_delete.sql` — DELETE policy for swap_history (reset support)
- `supabase/migrations/004_box_items_insert.sql` — INSERT policy for box_items (reset support)
- `app/actions/box.ts` — Server actions (swapItem, removeItem, confirmBox)
- `app/actions/reset.ts` — Server action (resetBox) for dev reset
- `components/box/box-view.tsx` — Orchestrator component
- `components/box/box-item-card.tsx` — Item card with time-adaptive density
- `components/box/swap-sheet.tsx` — Bottom sheet for item selection
- `components/box/confirm-button.tsx` — Time-adaptive confirm button
- `components/box/urgent-banner.tsx` — Urgent mode warning banner

## Files Modified
- `lib/services/box.ts` — Added getAvailableSwapItems, getConfirmedBox
- `app/box/page.tsx` — Uses BoxView, redirect logic for confirmed boxes
- `app/confirm/page.tsx` — Full confirmation page with item summary

## Status
- [ ] Revision in progress
