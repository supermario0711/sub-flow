# Phase 3.2 Test Checklist

## Build & Lint
- [ ] `pnpm lint` passes without errors
- [ ] `pnpm build` succeeds without errors

## Server Action — addItem
- [ ] Rejects invalid UUID for `boxId` or `itemId`
- [ ] Rejects non-draft box (confirmed, delivered, skipped)
- [ ] Rejects duplicate item already in box
- [ ] Assigns position as `MAX(position) + 1` for existing box items
- [ ] Assigns position `0` when box has no items
- [ ] Inserts `box_items` row with correct `box_id`, `item_id`, `position`
- [ ] Revalidates `/box` path
- [ ] Returns `{ success: true }` on success

## Server Action — searchItems
- [ ] Returns items matching search query (case-insensitive)
- [ ] Excludes items already in the given box
- [ ] Returns at most 20 results
- [ ] Returns empty array for empty/whitespace query
- [ ] Returns empty array when no items match

## Service — getSuggestedItems
- [ ] Returns exactly 3 items
- [ ] All returned items are not in the current box
- [ ] Returns fewer items if fewer than 3 are available outside the box

## Quick Add Component
- [ ] Renders 3 suggestion chips with item emoji and name
- [ ] Tapping a chip calls `addItem` with correct `boxId` and `itemId`
- [ ] Shows "More" chip that opens the Add Sheet
- [ ] Chips show loading state while `addItem` is pending
- [ ] Chip disappears from suggestions after successful add

## Add Sheet Modal
- [ ] Opens as a `<dialog>` element
- [ ] Contains a search input with placeholder text
- [ ] Debounces search input by ~300ms before calling `searchItems`
- [ ] Displays search results with emoji, name, and category
- [ ] Tapping a result calls `addItem` and closes the sheet
- [ ] Shows empty state message when no results found
- [ ] Shows loading indicator while searching
- [ ] Closes on backdrop click
- [ ] Closes on Escape key press
- [ ] Closes on explicit close button

## Box View Integration
- [ ] Quick Add visible in urgent mode (below items)
- [ ] Quick Add + "Add Item" button visible in browsing mode
- [ ] "Add Item" button opens Add Sheet
- [ ] No add UI shown in locked mode
- [ ] No add UI shown when box is skipped

## Accessibility
- [ ] `aria-label` on Quick Add chips, "More" chip, "Add Item" button, search input, close button
- [ ] Add Sheet uses `<dialog>` element with `aria-label`
- [ ] Search results are keyboard navigable
- [ ] Focus moves to search input when Add Sheet opens
- [ ] Focus returns to trigger element when Add Sheet closes
- [ ] All interactive elements have `min-h-[44px]` touch targets
- [ ] Focus rings visible on all interactive elements
- [ ] Escape key closes the Add Sheet

## Code Quality
- [ ] `"use server"` directive in `app/actions/add-item.ts`
- [ ] `"use client"` directive in `components/box/quick-add.tsx` and `components/box/add-sheet.tsx`
- [ ] No `SELECT *` queries — explicit column selection
- [ ] DaisyUI semantic classes used (no raw Tailwind colors)
- [ ] Apostrophes escaped with `&apos;` in JSX text
- [ ] `motion-reduce:transition-none` on animated elements
