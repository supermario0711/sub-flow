# Phase 4: Learning & Suggestions

## Goal
Detect patterns from swap history and surface smart suggestions — so Mark sees "Swap fennel → zucchini?" without lifting a finger.

## Scope Decisions (Hackathon)
- **Item-level patterns only** — no subcategories (10 items too few for category patterns)
- **No proactive swaps** — suggestions only (user accepts/dismisses)
- **Rule engine only** — no Gemini, deterministic detection from swap_history
- **No new API routes** — server actions only (matches existing architecture)

## Features

### Pattern Detection (Rule Engine)
A deterministic rule engine that analyzes `swap_history` rows and detects two pattern types:

**Item Dislike:** swapped AWAY from item X ≥ 2 times
- `confidence = min(0.95, 0.5 + occurrences * 0.15)`
- 2 swaps = 0.80, 3 = 0.95 (cap)

**Item Preference:** swapped TO item Y ≥ 2 times
- `confidence = min(0.90, 0.4 + occurrences * 0.15)`
- 2 swaps = 0.70, 3 = 0.85, 4+ = 0.90 (cap)

### Confidence Modifiers
- **Suggestion rejected:** `confidence *= 0.75`, `rejection_count += 1`
- **Contradicting swap** (user swaps TO a disliked item, or AWAY from preferred): `confidence *= 0.5`
- Pattern deactivates when `confidence < 0.30` or `rejection_count >= 3`

### Suggestion Generation
Combine detected patterns with current box contents:
1. Get active patterns for user
2. For each box item, check for `item_dislike` pattern
3. If found, find best replacement:
   - Prefer items with `item_preference` pattern
   - Exclude items already in box
   - Same broad category (vegetable→vegetable, fruit→fruit)
   - Fall back to any available item if no preference match
4. Return `SwapSuggestion[]` sorted by confidence desc

### Confidence Thresholds

| Action | Min Confidence |
|--------|---------------|
| Show in browsing mode | 0.50 |
| Show in urgent mode | 0.65 |

### Swap Suggestion Component
A prominent card shown in urgent mode (and optionally in browsing mode) when a suggestion exists:
- Shows the suggestion reason ("You&apos;ve swapped Fennel 3 times")
- One-tap "Accept" button performs the swap via existing `swapItem` action
- "Dismiss" button hides the suggestion and weakens the pattern
- Emoji-rich: shows both item emojis (🌿 → 🥒)

### Smart Quick Add
Replace the random Quick Add suggestions with preference-aware picks:
- Items the user has swapped toward in the past are prioritized
- Items the user has swapped away from are deprioritized
- Falls back to alphabetical if no patterns detected

## Time-Adaptive Behavior

| Mode | Suggestion UI |
|------|---------------|
| **Urgent** (<12h) | Swap suggestion card prominent at top, above box items |
| **Browsing** (≥12h) | Swap suggestion card shown at top, above box items |
| **Locked** (0h) | No suggestions shown |

## Data Model

### New table: `patterns`
```sql
CREATE TABLE patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  type text NOT NULL CHECK (type IN ('item_dislike', 'item_preference')),
  item_id uuid NOT NULL REFERENCES items(id),
  confidence float NOT NULL DEFAULT 0.0,
  occurrences int NOT NULL DEFAULT 0,
  last_triggered_at timestamptz,
  last_rejected_at timestamptz,
  rejection_count int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, type, item_id)
);

CREATE INDEX idx_patterns_user_id ON patterns(user_id);
CREATE INDEX idx_patterns_item_id ON patterns(item_id);
```

### RLS on `patterns`
```sql
ALTER TABLE patterns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "patterns_read" ON patterns FOR SELECT USING (true);
CREATE POLICY "patterns_insert" ON patterns FOR INSERT WITH CHECK (true);
CREATE POLICY "patterns_update" ON patterns FOR UPDATE USING (true) WITH CHECK (true);
```

### Alter `swap_history`
Add `context` column:
```sql
ALTER TABLE swap_history
  ADD COLUMN context text NOT NULL DEFAULT 'user_initiated'
  CHECK (context IN ('user_initiated', 'suggestion_accepted', 'suggestion_rejected'));
```

## Architecture Decisions

- **Deterministic rule engine** — no external API calls, instant results, fully testable
- **Patterns stored in DB** — persisted across page loads, recalculated after each swap
- **Server actions only** — no new API routes, consistent with existing architecture
- **Graceful degradation** — if no patterns exist, Quick Add falls back to alphabetical

## Files to Create
- `supabase/migrations/007_patterns.sql` — patterns table + swap_history context column + RLS
- `lib/types/patterns.ts` — `Pattern`, `SwapSuggestion`, `PatternType`, `SwapContext` types
- `lib/services/patterns.ts` — `recalculatePatterns`, `getActivePatterns`, `weakenPattern` (uses `import "server-only"`)
- `app/actions/suggestions.ts` — `acceptSuggestion`, `rejectSuggestion` server actions (UUID validation on all inputs)
- `components/box/swap-suggestion.tsx` — Client component: swap suggestion card with accept/dismiss

## Files to Modify
- `supabase/seed.sql` — Replace Zucchini with Fennel in Mark&apos;s box (position 1)
- `lib/types/database.ts` — Add `context` field to `SwapHistory` type
- `lib/services/suggestions.ts` — Pattern-aware Quick Add + `getSwapSuggestions`
- `app/actions/box.ts` — Call `recalculatePatterns` after swap
- `app/box/page.tsx` — Fetch and pass swap suggestions to BoxView
- `components/box/box-view.tsx` — Render SwapSuggestion cards per time mode

## Data Flow

```
box/page.tsx (server)
  → getSwapSuggestions(boxId, userId)
    → getActivePatterns(userId) from patterns table
    → match dislike patterns against box items
    → find preferred replacements
  → pass suggestions to BoxView

BoxView (client)
  → renders SwapSuggestion cards if suggestions exist
  → Accept → calls acceptSuggestion server action → swap + record context
  → Dismiss → calls rejectSuggestion → weaken pattern, hide card
```

## Seed Data Changes
**Mark&apos;s box must include Fennel** so the swap suggestion is visible on load. Update the seed to replace Zucchini (position 1) with Fennel. This way:
- Mark opens his box → sees Fennel → patterns table has dislike → "Swap fennel → zucchini?" appears

Existing seed swap history already supports the demo:
- **Mark**: 3× Fennel → Zucchini swaps → high-confidence dislike for Fennel, preference for Zucchini
- **Lisa**: 2 varied swaps (Broccoli → Beetroot, Banana → Strawberry) → weak/no patterns
- **Sarah**: 0 swaps → No patterns, falls back to alphabetical suggestions

## Status
**Completed** — 2026-01-31, 62/62 tests passing ([test log](../test-logs/phase-4_2026-01-31T20-30-browser.md))
