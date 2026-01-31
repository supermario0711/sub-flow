# Phase 3.3: Box Status Transitions & Lock Routing

## Goal
Fix and clarify how box status transitions (locked, confirmed, editing) interact with routing. Ensure proper auto-confirmation at deadline and the ability to revert confirmed boxes back to draft when edited.

## Features
- **Auto-confirm at deadline** — When a draft box reaches 0 hours remaining, automatically confirm it and redirect to `/confirm`.
- **Lock routing** — Any box at 0 hours remaining redirects to `/confirm` regardless of prior status.
- **Revert on edit** — When a confirmed box is edited (swap or remove), revert its status to `draft` so the confirm button reappears.

## Status Transitions

| Trigger | From | To | Redirect |
|---------|------|----|----------|
| Deadline reached (hours ≤ 0) | `draft` | `confirmed` | `/confirm` |
| Deadline reached (hours ≤ 0) | `confirmed` | (unchanged) | `/confirm` |
| Swap or remove item | `confirmed` | `draft` | (none) |
| "Edit Box" on `/confirm` | `confirmed` | `draft` | `/box` |
| User clicks confirm | `draft` | `confirmed` | `/confirm` |

## Architecture Decisions
- **Single deadline check** — Replace the existing `confirmed && hours <= 0` guard with a broader `hours <= 0` check that handles both draft and confirmed boxes
- **Auto-confirm writes** — Set `status`, `confirmed_at`, and `updated_at` when auto-confirming a draft box at deadline
- **Edit revert** — Both `swapItem` and `removeItem` actions check if box was `confirmed` and reset to `draft` after mutation
- **Edit Box action** — `editBox` server action reverts a confirmed box to `draft` and redirects to `/box`, called via form action from `/confirm`
- **Path revalidation** — Add `revalidatePath("/confirm")` to edit actions so the confirm page reflects status changes
- **No new migrations** — Uses existing `boxes` table columns (`status`, `confirmed_at`, `updated_at`)

## Files to Modify
- `app/box/page.tsx` — Auto-confirm draft boxes at deadline, redirect all locked boxes to `/confirm`
- `app/actions/box.ts` — Revert `confirmed` → `draft` on `swapItem`, `removeItem`, and `editBox`; revalidate `/confirm`
- `app/confirm/page.tsx` — Replace `<Link>` "Edit Box" with form calling `editBox` server action

## Status
**Complete**
