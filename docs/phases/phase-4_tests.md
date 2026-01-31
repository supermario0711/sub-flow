# Phase 4 Test Checklist

## Build & Lint
- [ ] `pnpm lint` passes without errors
- [ ] `pnpm build` succeeds without errors
- [ ] `supabase db reset` applies migration + seed without error

## Migration — 007_patterns.sql
- [ ] `patterns` table created with correct columns and constraints
- [ ] `UNIQUE (user_id, type, item_id)` constraint exists
- [ ] `swap_history.context` column added with default `'user_initiated'`
- [ ] `context` CHECK constraint allows only `'user_initiated'`, `'suggestion_accepted'`, `'suggestion_rejected'`
- [ ] RLS enabled on `patterns` with granular policies (SELECT, INSERT, UPDATE)
- [ ] Indexes exist on `patterns(user_id)` and `patterns(item_id)`

## Types — patterns.ts
- [ ] `PatternType` is `"item_dislike" | "item_preference"`
- [ ] `SwapContext` is `"user_initiated" | "suggestion_accepted" | "suggestion_rejected"`
- [ ] `Pattern` has all DB columns typed correctly
- [ ] `SwapSuggestion` has `fromItem` (Pick<Item>), `toItem` (Pick<Item>), `reason` (string), `confidence` (number), `patternId` (string)

## Types — database.ts (modified)
- [ ] `SwapHistory` type includes `context: SwapContext` field

## Service — patterns.ts
- [ ] Exports `recalculatePatterns(userId: string)`
- [ ] Queries `swap_history` for the user, counts from/to occurrences
- [ ] Upserts patterns into `patterns` table
- [ ] Item dislike: confidence = `min(0.95, 0.5 + occurrences * 0.15)` for ≥ 2 swaps away
- [ ] Item preference: confidence = `min(0.90, 0.4 + occurrences * 0.15)` for ≥ 2 swaps toward
- [ ] Does not create patterns for < 2 occurrences
- [ ] Exports `getActivePatterns(userId: string)` returning active patterns
- [ ] Exports `weakenPattern(patternId: string, factor: number)`
- [ ] `weakenPattern` multiplies confidence by factor
- [ ] `weakenPattern` deactivates pattern when confidence < 0.30 or rejection_count >= 3

## Service — suggestions.ts (modified)
- [ ] Exports `getSwapSuggestions(boxId: string, userId: string)` returning `SwapSuggestion[]`
- [ ] Gets active patterns via `getActivePatterns(userId)`
- [ ] Matches dislike patterns against current box items
- [ ] Pairs each matched dislike with preferred replacement (same category, not in box)
- [ ] Falls back to any available item if no preference match
- [ ] Returns empty array when no patterns detected
- [ ] Returns empty array when no box items match dislike patterns
- [ ] Respects confidence thresholds (0.50 browsing, 0.65 urgent)
- [ ] `getSuggestedItems` now accepts optional `userId` parameter
- [ ] When userId provided: prioritizes preferred items, deprioritizes disliked
- [ ] Falls back to alphabetical ordering when no preferences detected

## Server Action — suggestions.ts
- [ ] `acceptSuggestion(boxId, patternId, fromItemId, toItemId)` validates all UUIDs before processing
- [ ] `acceptSuggestion` performs swap with context `'suggestion_accepted'`
- [ ] `rejectSuggestion(patternId)` validates UUID before processing
- [ ] `rejectSuggestion` calls `weakenPattern(patternId, 0.75)` and increments rejection_count

## Server Action — box.ts (modified)
- [ ] `swapItem` calls `recalculatePatterns(userId)` after recording swap_history

## Component — SwapSuggestion
- [ ] Renders a card with from-item emoji/name, arrow, to-item emoji/name
- [ ] Displays the `reason` text from the suggestion
- [ ] "Accept" button calls `acceptSuggestion` server action with correct IDs
- [ ] "Dismiss" button calls `rejectSuggestion` and hides the card (local state)
- [ ] Shows loading state on Accept button while swap is in progress
- [ ] After successful accept, card disappears (parent re-renders with updated box)
- [ ] Multiple suggestions render as stacked cards (one per suggestion)

## Box View Integration
- [ ] `BoxView` accepts `swapSuggestions` prop of type `SwapSuggestion[]`
- [ ] Swap suggestion cards shown at top of box items in urgent mode
- [ ] Swap suggestion cards shown at top of box items in browsing mode
- [ ] No swap suggestion cards in locked mode
- [ ] No swap suggestion cards when box is skipped
- [ ] Quick Add chips reflect preference-aware ordering
- [ ] Box still works normally when no suggestions exist (Sarah — new user)

## Box Page (Server)
- [ ] Resolves userId from userSlug before fetching suggestions
- [ ] Fetches swap suggestions via `getSwapSuggestions(boxId, userId)`
- [ ] Passes suggestions as prop to BoxView
- [ ] Does not fail if no patterns exist

## Seed Data
- [ ] Mark&apos;s box position 1 is Fennel (not Zucchini)
- [ ] Existing swap history unchanged (3× Fennel → Zucchini for Mark)

## Persona-Specific Behavior
- [ ] **Mark**: sees "Swap fennel → zucchini?" suggestion on load
- [ ] **Mark**: accepting suggestion swaps Fennel for Zucchini, card disappears
- [ ] **Mark**: dismissing suggestion hides card, pattern weakened
- [ ] **Sarah**: sees no swap suggestions (0 history), Quick Add falls back to alphabetical
- [ ] **Lisa**: weak/no suggestions (2 varied swaps, below threshold)
- [ ] After 3+ dismissals for same pattern, pattern deactivates, no more suggestions
- [ ] Quick Add for Mark shows preferred items (Zucchini prioritized)

## Accessibility
- [ ] SwapSuggestion card has `role="region"` and `aria-label` describing the suggestion
- [ ] Accept and Dismiss buttons have descriptive `aria-label`
- [ ] All interactive elements have `min-h-[44px]` touch targets
- [ ] Focus rings visible on Accept and Dismiss buttons
- [ ] `motion-reduce:transition-none` on any animated elements

## Code Quality
- [ ] `"use server"` directive on server action files
- [ ] `import "server-only"` on `lib/services/patterns.ts`
- [ ] `"use client"` directive on swap-suggestion.tsx
- [ ] No `SELECT *` queries — explicit column selection
- [ ] DaisyUI semantic classes used (no raw Tailwind colors)
- [ ] Apostrophes escaped with `&apos;` in JSX text
- [ ] No secrets or API keys in committed code
