# Phase 3.2: Add Item

## Goal
Allow users to add new items to their box via Quick Add suggestions and a full Add Sheet modal with server-side search. Designed for a large catalog where client-side filtering would be impractical.

## Features
- **Quick Add** — Three suggested items displayed as compact chips below the box items. Tapping a chip adds the item instantly. A "More" chip opens the Add Sheet modal.
- **Add Sheet Modal** — Bottom sheet dialog with a search input. Searches the `items` table server-side via `ilike`. Results exclude items already in the box. Tapping a result adds the item and closes the sheet.
- **`addItem` Server Action** — Inserts a new `box_items` row with the next available position. Validates UUID, checks box is draft, prevents duplicates.
- **`searchItems` Server Action** — Queries items by name using `ilike`, excludes items already in the given box. Returns up to 20 results.
- **`getSuggestedItems` Service** — Returns 3 items not currently in the box. Phase 4 stub: for now picks items randomly; will later use swap history and preference patterns.

## Time-Adaptive Behavior

| Mode | UI |
|------|-----|
| **Urgent** (<12h) | Quick Add chips only (no "Add Item" button) |
| **Browsing** (≥12h) | Quick Add chips + "Add Item" button that opens Add Sheet |
| **Locked** (0h) | No add UI shown |

## Architecture Decisions
- **Server-side search** via `ilike` on the `items.name` column — avoids loading the full catalog to the client and scales to large item sets
- **Debounced search** — The Add Sheet debounces input by 300ms before calling `searchItems` to minimize server requests
- **Position assignment** — `addItem` queries `MAX(position)` from `box_items` for the given box and inserts at `max + 1`
- **Suggestion stub** — `getSuggestedItems` returns random items not in the box; Phase 4 will replace this with pattern-based suggestions
- **No new migrations** — Uses existing `items` and `box_items` tables with existing RLS policies

## Files to Create
- `app/actions/add-item.ts` — Server actions: `addItem`, `searchItems`
- `lib/services/suggestions.ts` — `getSuggestedItems` function (Phase 4 stub)
- `components/box/quick-add.tsx` — Quick Add chips component
- `components/box/add-sheet.tsx` — Add Sheet modal with search

## Files to Modify
- `app/box/page.tsx` — Fetch suggested items, pass to BoxView
- `components/box/box-view.tsx` — Render Quick Add and Add Sheet per time mode

## Status
**Completed** — Lint and build pass.
