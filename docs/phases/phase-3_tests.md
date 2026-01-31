# Phase 3: Test Plan

## Prerequisites

- [ ] Phase 2 tests passing (simulation system working, dev panel functional)
- [ ] Phase 3 files implemented (`app/actions/box.ts`, `app/actions/reset.ts`, `components/box/`, updated `app/box/page.tsx`, `app/confirm/page.tsx`)
- [ ] RLS migrations `002_phase3_rls.sql`, `003_swap_history_delete.sql`, `004_box_items_insert.sql` applied to Supabase

## Tests

### 1. Build & Lint
- [ ] `pnpm lint` passes with no errors
- [ ] `pnpm build` succeeds with zero errors

### 2. RLS Migration (`supabase/migrations/002_phase3_rls.sql`)
- [ ] File exists and contains UPDATE policy for `box_items`
- [ ] File contains DELETE policy for `box_items`
- [ ] File contains UPDATE policy for `boxes`
- [ ] File contains INSERT policy for `swap_history`

### 3. RLS Migration — Reset Support
- [ ] `003_swap_history_delete.sql` contains DELETE policy for `swap_history`
- [ ] `004_box_items_insert.sql` contains INSERT policy for `box_items` with `WITH CHECK (true)`

### 4. Service Layer (`lib/services/box.ts`)
- [ ] `getAvailableSwapItems(boxId)` returns items not currently in the box
- [ ] `getAvailableSwapItems(boxId)` specifies columns `id, name, emoji, category`
- [ ] `getAvailableSwapItems(boxId)` returns empty array on error
- [ ] `getConfirmedBox(userSlug)` returns the confirmed box with items when one exists
- [ ] `getConfirmedBox(userSlug)` returns `null` when no confirmed box exists
- [ ] `getConfirmedBox(userSlug)` specifies columns explicitly (no `SELECT *`)

### 5. Server Actions — Validation (`app/actions/box.ts`)
- [ ] `app/actions/box.ts` has `"use server"` at the top of the file
- [ ] `swapItem("invalid", validUuid, validUuid)` returns `{ success: false, error: "Invalid request." }`
- [ ] `removeItem(validUuid, "invalid")` returns `{ success: false, error: "Invalid request." }`
- [ ] `confirmBox("invalid")` returns `{ success: false, error: "Invalid request." }`
- [ ] `swapItem` with non-existent boxId returns `{ success: false, error: "Box not found." }`
- [ ] `removeItem` with non-existent boxId returns `{ success: false, error: "Box not found." }`
- [ ] `confirmBox` with non-existent boxId returns `{ success: false, error: "Box not found." }`

### 6. Server Actions — Draft Box Guards
- [ ] `swapItem` on a confirmed box returns `"This box has already been confirmed."`
- [ ] `removeItem` on a confirmed box returns `"This box has already been confirmed."`
- [ ] `confirmBox` on a confirmed box returns `"This box has already been confirmed."`

### 7. Server Actions — Swap Logic
- [ ] `swapItem` with boxItemId not belonging to box returns `"Item not found in this box."`
- [ ] `swapItem` with newItemId already in the box returns `"That item is already in your box."`
- [ ] `swapItem` with valid params updates `box_items.item_id` to the new item
- [ ] `swapItem` inserts a row into `swap_history` with correct `box_id`, `user_id`, `from_item_id`, `to_item_id`
- [ ] `swapItem` calls `revalidatePath("/box")`
- [ ] `swapItem` returns `{ success: true }` on success

### 8. Server Actions — Remove Logic
- [ ] `removeItem` with boxItemId not belonging to box returns `"Item not found in this box."`
- [ ] `removeItem` with valid params deletes the box_item row
- [ ] `removeItem` calls `revalidatePath("/box")`
- [ ] `removeItem` returns `{ success: true }` on success

### 9. Server Actions — Confirm Logic
- [ ] `confirmBox` updates box status to `"confirmed"` and sets `confirmed_at`
- [ ] `confirmBox` calls `revalidatePath("/box")`
- [ ] `confirmBox` calls `redirect("/confirm")` on success

### 10. Box Page (`/box`) — Structure
- [ ] `/box` renders Sarah&apos;s draft box with 5 items by default
- [ ] SimulationBanner is displayed at top
- [ ] Page heading is "Your Box"
- [ ] Week date displayed below heading
- [ ] Each item shows emoji, name, and category badge
- [ ] If box status is confirmed, page redirects to `/confirm`

### 11. Box Page — Urgent Layout (6h)
- [ ] Urgent banner visible with text "Your box locks in 6 hours!"
- [ ] Items render as compact cards with emoji, name, and category badge
- [ ] Icon-only swap and remove buttons visible on each card
- [ ] Confirm button is sticky at bottom of viewport (`fixed bottom-0`)
- [ ] Confirm button text is "Confirm Box Now"
- [ ] Layout is single column

### 12. Box Page — Browsing Layout (24h AND 96h)
- [ ] No urgent banner visible
- [ ] Items render as spacious cards with emoji, name, category badge
- [ ] "Swap" and "Remove" text label buttons visible on each card
- [ ] Confirm button is standard width below the grid
- [ ] Layout is 2-column grid on `md` screens and above (per design system)

### 13. Box Page — Locked Layout (0h)
- [ ] "Locked" banner visible with message about the deadline having passed
- [ ] Items render as read-only cards (emoji, name, category badge)
- [ ] No swap or remove buttons visible on any card
- [ ] No confirm button visible
- [ ] Message about queuing changes for next week displayed (placeholder)

### 14. Swap Sheet (Modal)
- [ ] Clicking swap button opens the swap sheet modal
- [ ] Sheet title shows "Swap {item name} for…"
- [ ] Available items listed (all items not currently in box)
- [ ] Each available item shows emoji, name, and category
- [ ] Selecting an item performs the swap and closes the sheet
- [ ] After swap, page refreshes with new item in place of old one
- [ ] Cancel button closes sheet without changes
- [ ] Clicking modal backdrop closes sheet without changes

### 15. Remove Flow (Browser)
- [ ] Clicking remove button removes the item from the box
- [ ] Page refreshes after removal — removed item is gone
- [ ] Removed item now appears in swap available items list
- [ ] Removing all items shows "Your box is empty." message

### 16. Confirm Flow (Browser)
- [ ] Clicking "Confirm Box" triggers the `confirmBox` server action
- [ ] Page redirects to `/confirm` after confirmation
- [ ] Navigating to `/box` after confirming redirects back to `/confirm`
- [ ] Confirm button shows "Confirming…" while pending

### 17. Confirmation Page (`/confirm`)
- [ ] Page title metadata is "Box Confirmed | Biokiste"
- [ ] Celebration emoji (🎉) and "Box Confirmed!" heading displayed
- [ ] Subtitle includes week date
- [ ] Confirmed items displayed in read-only list (emoji, name, category)
- [ ] AI image placeholder section present ("Phase 5")
- [ ] Recipe teaser placeholder section present ("Phase 6")
- [ ] SimulationBanner is displayed
- [ ] Visiting `/confirm` with no confirmed box redirects to `/box`

### 18. Reset Action (`app/actions/reset.ts`)
- [ ] `app/actions/reset.ts` has `"use server"` at the top of the file
- [ ] `resetBox` restores seed items for the current persona&apos;s box
- [ ] `resetBox` clears swap history for the box
- [ ] `resetBox` re-inserts seed swap history entries
- [ ] `resetBox` resets box status to `"draft"` and clears `confirmed_at`
- [ ] `resetBox` calls `revalidatePath("/box")`
- [ ] `resetBox` returns `{ success: true }` on success

### 19. Persona Switching
- [ ] Sarah&apos;s box: Carrot, Broccoli, Apple, Pear, Banana
- [ ] Mark&apos;s box: Zucchini, Broccoli, Apple, Orange, Strawberry
- [ ] Lisa&apos;s box: Carrot, Fennel, Beetroot, Pear, Strawberry
- [ ] Swapping items for one persona does not affect another persona&apos;s box

### 20. Accessibility
- [ ] Swap buttons have `aria-label` (e.g. "Swap Carrot")
- [ ] Remove buttons have `aria-label` (e.g. "Remove Carrot")
- [ ] Swap sheet close button has `aria-label`
- [ ] Emoji spans have `role="img"` and `aria-label`
- [ ] Urgent banner has `role="alert"`
- [ ] Locked banner has `role="status"`
- [ ] Modal uses `<dialog>` element
- [ ] All interactive elements focusable via Tab key
- [ ] Visible focus styles (focus rings) on all buttons and selectable items in swap sheet
- [ ] All buttons and selectable items meet 44×44px minimum touch target
- [ ] Escape key closes swap sheet
- [ ] Enter/Space activates buttons

### 21. Code Quality
- [ ] `app/actions/box.ts` has `"use server"` directive
- [ ] `app/actions/reset.ts` has `"use server"` directive
- [ ] `lib/services/box.ts` has `"server-only"` import
- [ ] All components in `components/box/` have `"use client"` directive
- [ ] No `SELECT *` in any query
- [ ] No raw SQL/internal errors exposed to the user
- [ ] DaisyUI semantic classes used (`bg-base-200`, `btn-primary`, `btn-secondary`, `alert`)
- [ ] `transition-all duration-300` on animated elements
- [ ] Animated elements respect `prefers-reduced-motion` (disable or reduce animations)
- [ ] Apostrophes escaped with `&apos;` in JSX text content
