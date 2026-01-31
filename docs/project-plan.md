# Biokiste - Project Context & Plan

> **The Navigation System**: This document defines WHAT we're building and WHY. Each phase will be fleshed out in Claude Code with specific implementation details.

---

## The Problem

Subscription management for physical products (veggie boxes, diapers, coffee) is broken.

Every service builds an e-commerce shop first, then bolts subscriptions on top. The result:
- Interfaces designed for browsing, not managing
- Too many clicks to make simple changes
- Missed deadlines because the UX fights you
- Customers churn from frustration, not dissatisfaction

**The insight:** Managing a subscription is a relationship, not a transaction. The UI should feel like texting a friend, not navigating a webshop.

---

## The Solution

An adaptive subscription interface that:

1. **Knows your context** — Urgent deadline? Minimal UI. Plenty of time? Let's explore.
2. **Learns your preferences** — "You always swap fennel. Want me to just do that?"
3. **Delights with visuals** — AI-generated images of your box and recipes
4. **Feels like a conversation** — Not a shop, not a dashboard, something warmer

---

## The Demo Scenario: Biokiste (Veggie Box)

For this hackathon, we're building a prototype for weekly vegetable box subscriptions.

**Constraints (MVP):**
- 10 items total (5 vegetables, 5 fruits)
- 5 items per box
- Single user flow (but simulated multi-user for demo)
- Mobile-first web app (designed for phone screens, scales up to desktop)

**The "Wow" Moments:**
1. Same app feels completely different based on time pressure
2. Smart swap suggestion appears with one-tap accept
3. Beautiful AI-generated box image on confirmation
4. Recipe discovery the next day (simulated)

---

## User Personas (for Demo)

| Persona | Name | Story | Key Behavior |
|---------|------|-------|--------------|
| New User | Sarah | Just signed up, exploring | No history, needs guidance |
| Experienced | Mark | 3 weeks in, hates fennel | Always swaps fennel → zucchini |
| Power User | Lisa | Engaged, vegetarian, curious | Varied swaps, likes to browse |

---

## Core Flows

### Flow 1: Urgent Mode (< 12 hours until lock)

**Context:** Thursday 10pm, box locks Friday morning

**Experience:**
- Urgent banner with countdown
- If patterns detected: smart swap suggestion front and center
- Giant "Looks Good" confirmation button
- "Let me customize" as secondary escape hatch

**Goal:** Confirm in under 30 seconds

---

### Flow 2: Browse Mode (> 72 hours until lock)

**Context:** Monday morning, box locks Friday

**Experience:**
- Full visual grid of box contents
- Each item has swap/remove options
- Seasonal highlights and recommendations
- Relaxed, explorative feel

**Goal:** Enjoy customizing, discover options

---

### Flow 3: Confirmation & Delight

**Trigger:** User confirms box

**Experience:**
- Celebration moment
- AI-generated image of their specific box items
- "Check back tomorrow for recipes" teaser

**Goal:** Anticipation, not just transaction completion

---

### Flow 4: Recipe Discovery

**Trigger:** ~24 hours after confirmation (simulated for demo)

**Experience:**
- Recipe gallery with AI-generated food images
- Each recipe uses items from their confirmed box
- Full recipe details (ingredients, instructions, tips)

**Goal:** Ongoing value, reason to return

---

## Adaptive UI Logic

The UI adapts based on two dimensions:

### Time Context
| Hours Until Lock | Context | UI Approach |
|------------------|---------|-------------|
| < 12 | Urgent | Minimal, suggestions prominent, one-tap confirm |
| 12-72 | Balanced | Clear options, moderate detail |
| > 72 | Relaxed | Rich, explorative, seasonal content |

### User History
| Swap Count | Status | Behavior |
|------------|--------|----------|
| 0-2 boxes | New | Educational, show all options |
| 3+ boxes | Experienced | Show smart suggestions based on patterns |
| Clear patterns | Confident | Proactive recommendations |

### Pattern Detection
- **Dislike:** 3+ swaps away from same item → suggest alternative
- **Preference:** 2+ swaps toward same item → prioritize in suggestions

---

## The Simulation System (Critical for Demo)

To show all states without waiting for real time or real users:

**Time Simulation:**
- Override "current time" to simulate different deadlines
- URL param or dev panel: `?hours=6` → instant urgent mode

**User Simulation:**
- Switch between Sarah/Mark/Lisa instantly
- Each has pre-seeded swap history

**Dev Panel:**
- Select persona
- Adjust hours until lock
- Quick scenario buttons ("Mark + Urgent", "Sarah + Relaxed")
- Launch app with settings applied

This is the secret weapon for impressive demos.

---

## Visual Design Direction

**Feel:** Talking to a friend, not using software

**Colors (Soft Garden palette):**
- Background: Warm cream `#FAF9F6`
- Primary: Sage `#7D9F85`
- Secondary: Warm stone `#E8E4DE`
- Accent: Soft terracotta `#D4A574`

**Principles:**
- Mobile-first: design for phone screens, then scale up
- Generous whitespace
- Soft shadows, no hard edges
- Smooth animations on state changes
- Touch-friendly tap targets (minimum 44×44px)
- Photography-style AI images, not illustrations

---

## A2UI Integration

We're using the A2UI protocol for adaptive UI generation.

**Approach:**
- Agent (Vertex AI) generates A2UI JSON based on context
- Custom React renderer interprets the JSON
- Maps to our styled React components

**Why custom renderer:**
- Official React renderer coming Q1 2026 (after hackathon)
- Full control over styling and animations
- Only ~8 components to implement

**Components to support:**
- `urgent-banner`
- `box-item-card`
- `swap-suggestion`
- `quick-confirm`
- `box-preview`
- `swap-selector`
- `recipe-card`
- `seasonal-highlight`

---

## AI Integration Points

### 1. UI Generation (Vertex AI / Gemini)
**Input:** User context (time, history, patterns)
**Output:** A2UI JSON describing what UI to show

### 2. Box Image Generation (Banana/Nano)
**Trigger:** Box confirmation
**Input:** List of 5 item names
**Output:** Beautiful food photography style image

### 3. Recipe Generation (Vertex AI)
**Trigger:** ~24h after confirmation (simulated)
**Input:** Confirmed box items
**Output:** 3 complete recipes with ingredients, instructions, tips

### 4. Recipe Image Generation (Banana/Nano)
**Trigger:** After recipe text generated
**Input:** Recipe name and description
**Output:** Food photography of finished dish

---

# Implementation Phases

---

## Phase 1: Foundation ✅

**Goal:** Working Next.js app with data layer and basic routing

**Status:** Completed 2026-01-31 — All tests passing ([test logs](test-logs/))

**Outcomes:**
- [x] Project scaffolded with chosen stack
- [x] Database schema defined and migrated
- [x] Seed data: 10 items, 3 test users with history
- [x] Basic pages exist (box, confirm, recipes)
- [x] Can fetch and display box items from database

**Exit Criteria:** ~~Can see a list of items in a box on screen~~ Met — `/box` renders 5 items for Sarah&apos;s draft box from Supabase

---

## Phase 2: Simulation System ✅

**Goal:** Instantly switch between users and time contexts for development and demo

**Status:** Completed 2026-01-31 — All 63 tests passing ([test logs](test-logs/))

**Outcomes:**
- [x] Time context utility (hours → urgent/balanced/relaxed)
- [x] User simulation with pre-seeded personas
- [x] Dev panel page to control simulation
- [x] URL params work as override (`?user=mark&hours=6`)
- [x] Simulation state persists during session

**Exit Criteria:** ~~Can switch to "Mark + 6 hours" and see different data~~ Met — `/dev` panel switches persona + time, `/box` renders correct box with SimulationBanner

---

## Phase 2.1: Dev Panel Quick Scenarios Revamp ✅

**Goal:** Adjust dev panel presets to cover all three `TimeLayout` states and expand quick scenarios to a 3×3 persona × time grid

**Status:** Completed 2026-01-31 — All tests passing ([test logs](test-logs/))

**Outcomes:**
- [x] Time presets changed to `0h` (locked), `6h` (urgent), `24h` (browsing)
- [x] Quick scenarios expanded to 9-button grid (3 personas × 3 time states)
- [x] Active scenario highlighted in grid

**Exit Criteria:** ~~Dev panel covers all persona × time combinations with one click~~ Met

---

## Phase 3: Core Box UI ✅

**Goal:** The main box management interface with swapping

**Status:** Completed 2026-01-31 — All tests passing ([test logs](test-logs/))

**Outcomes:**
- [x] Box page shows current items with time-adaptive layouts (urgent/browsing/locked)
- [x] Swap flow works (select item → bottom sheet with options → confirm swap)
- [x] Remove item works
- [x] Confirm box action sets status to confirmed, redirects to `/confirm`
- [x] UI responds to time context (compact single-column urgent, 2-column browsing grid, read-only locked)
- [x] Confirmation page with celebration view, item summary, and placeholders for Phase 5/6
- [x] Reset action restores seed data for demo purposes

**Exit Criteria:** ~~Can swap an item and confirm a box~~ Met — Full swap, remove, confirm flows working across all personas and time modes

---

## Phase 3.1: Skip & Vacation ✅

**Goal:** Skip this week&apos;s box (urgent mode) or schedule a vacation pause (browsing mode)

**Status:** Completed 2026-01-31 — All tests passing ([test logs](test-logs/))

**Outcomes:**
- [x] Skip This Week button in urgent mode with confirmation modal
- [x] Vacation date-range picker in browsing mode with auto-skip
- [x] Vacation banner with cancel functionality
- [x] Skipped state view with reset button
- [x] Reset action clears vacations and restores boxes

**Exit Criteria:** ~~Can skip a box and schedule a vacation~~ Met — Skip and vacation flows working across all personas and time modes

---

## Phase 3.2: Add Item ✅

**Goal:** Add new items to box via Quick Add suggestions and search modal

**Status:** Completed 2026-01-31 — All tests passing ([test logs](test-logs/))

**Outcomes:**
- [x] Quick Add chips showing 3 suggested items (Phase 4 stub: random selection)
- [x] Add Sheet modal with server-side search (debounced, `ilike`)
- [x] `addItem` server action with position assignment and validation
- [x] Time-adaptive: urgent shows chips only, browsing shows chips + Add Item button, locked hides all

**Exit Criteria:** ~~Can add items via Quick Add and search~~ Met — Quick Add and Add Sheet working across all time modes

---

## Phase 3.3: Box Status Transitions & Lock Routing ✅

**Goal:** Fix and clarify how box status transitions (locked, confirmed, editing) interact with routing

**Status:** Completed 2026-01-31 — 32/33 tests passed, 1 not tested ([test logs](test-logs/))

**Outcomes:**
- [x] Auto-confirm at deadline — draft boxes at 0 hours are confirmed and redirected to `/confirm`
- [x] Lock routing — any box at 0 hours redirects to `/confirm` regardless of prior status
- [x] Revert on edit — swapping or removing on a confirmed box reverts status to `draft`
- [x] Edit Box from `/confirm` — server action reverts to `draft` and redirects to `/box`
- [x] Re-confirm after edit works with updated `confirmed_at`
- [x] Path revalidation for `/box` and `/confirm` after all mutations

**Exit Criteria:** ~~Status transitions and lock routing work correctly~~ Met — All core flows verified across personas and time modes

---

## Phase 4: Learning & Suggestions ✅

**Goal:** System detects patterns and shows smart suggestions

**Status:** Completed 2026-01-31 — All 62 tests passing ([test logs](test-logs/))

**Outcomes:**
- [x] Pattern detection from swap history (deterministic rule engine, item_dislike + item_preference)
- [x] Suggestion generation based on patterns (confidence thresholds, category-aware replacements)
- [x] Swap suggestion component with accept/dismiss (emoji-rich card, loading states, a11y)
- [x] Suggestions appear in urgent and browsing modes when relevant, hidden in locked mode
- [x] Accepting suggestion performs the swap with `suggestion_accepted` context
- [x] Smart Quick Add: preference-aware ordering replaces random selection
- [x] Pattern weakening on dismiss (confidence × 0.75, deactivates after 3 rejections)

**Exit Criteria:** ~~Mark sees "Swap fennel → zucchini?" suggestion~~ Met — Mark sees suggestion on load, Sarah/Lisa correctly show no suggestions

---

## Phase 5: Visual Delight

**Goal:** Polished UI with animations and AI-generated images

**Outcomes:**
- [ ] Smooth transitions between states
- [ ] Loading states with skeletons
- [ ] Box image generation on confirm
- [ ] Confirmation page shows generated image
- [ ] Mobile-first design verified across all flows

**Exit Criteria:** Confirming box shows beautiful AI image with celebration

---

## Phase 6: Recipe Experience

**Goal:** Next-day recipe discovery flow

**Outcomes:**
- [ ] Recipe generation from box items (can be mocked/cached for demo)
- [ ] Recipe gallery page with cards
- [ ] Recipe detail page with full instructions
- [ ] Recipe images generated or placeholder
- [ ] Navigation from confirmation teaser to recipes

**Exit Criteria:** Can view recipes made from confirmed box items

---

## Phase 7: A2UI Integration

**Goal:** UI structure generated by AI based on context

**Outcomes:**
- [ ] A2UI message types defined
- [ ] Vertex AI generates A2UI JSON for box view
- [ ] Custom renderer maps JSON to React components
- [ ] Different contexts produce different UI structures
- [ ] Fallback if AI generation fails

**Exit Criteria:** Same endpoint, different context → different UI structure

---

## Phase 8: Demo Polish

**Goal:** Smooth end-to-end demo flow

**Outcomes:**
- [ ] Dev panel styled and intuitive
- [ ] All three personas demo well
- [ ] Urgent → confirm → image flow is smooth
- [ ] Recipe flow is smooth
- [ ] Error states handled gracefully
- [ ] Performance acceptable

**Exit Criteria:** Can run through all demo scenarios without issues

---

## Demo Script (Final)

1. **Open dev panel** — "Let me show you three different users"

2. **Sarah (New User, Relaxed)**
   - Full browse UI, all options visible
   - "When you have time, explore everything"

3. **Mark (Experienced, Urgent)**
   - Urgent banner, smart suggestion
   - "It learned he hates fennel"
   - One-tap accept, confirm
   - Beautiful box image appears

4. **Show recipes**
   - "Next day, recipes appear"
   - Gallery with AI images
   - "Made from YOUR box"

5. **The point**
   - "Same app, completely different experience"
   - "Not a shop. A relationship."

---

## Success Criteria

**Must Have (MVP):**
- [ ] Three user personas with different experiences
- [ ] Time-based UI adaptation visible
- [ ] Swap suggestion for Mark works
- [ ] Box confirmation with image generation
- [ ] Simulation panel for instant context switching

**Should Have:**
- [ ] Recipe gallery with generated content
- [ ] Smooth animations
- [ ] Desktop-responsive (scales up gracefully from mobile)

**Nice to Have:**
- [ ] Full A2UI integration with Vertex AI
- [ ] Real-time generation (not cached)
- [ ] PWA installable

---

## What This Document Is NOT

- ❌ Specific tech implementation details
- ❌ Code snippets or file structures
- ❌ API specifications
- ❌ Database schema (defined in phase 1)

Each phase will be expanded in Claude Code with:
- Detailed technical approach
- File structure
- Tests to write first
- Specific acceptance criteria

---

*This is the map. Claude Code will drive the journey.*