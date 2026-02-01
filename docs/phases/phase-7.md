# Phase 7: Conversational A2UI

## Goal
AI drives a multi-turn conversation where Gemini decides which UI components to show, the user interacts with structured inputs, and the AI responds with the next turn — replacing one-shot layout generation with a conversational loop. Inspired by the [Vercel AI Chatbot](https://github.com/vercel/ai-chatbot) template, adapted to Sub-Flow&apos;s brand and DaisyUI design system.

## Scope Decisions (Hackathon)
- **Multi-turn conversation loop** — AI shows components → user interacts → response sent back → AI shows next turn
- **No free text input** — only structured inputs: radio buttons, component taps, accept/reject. No `<input>` or `<textarea>`.
- **2 new components** — `Message` (AI speech bubble) and `RadioQuestion` (tappable option list)
- **Existing components reused** — urgent-banner, box-grid, swap-suggestion, quick-confirm wrapped with event emission
- **Ephemeral state** — conversation history lives in React state, no database changes
- **Single API endpoint** — `POST /api/conversation/next-turn` receives context + history, returns next turn
- **Gemini 2.5 Flash** for conversation — structured JSON output, low temperature (0.2)
- **Deterministic fallback** — if Gemini fails on first turn, render rule-based turn; user can always confirm
- **No streaming** — each turn is small (~500ms generation), show typing indicator between turns
- **Brand styling** — DaisyUI semantic classes (`bg-base-100`, `btn-primary`, `bg-base-200`), Geist font. No shadcn/ui.
- **Mock data for dev** — hardcoded conversation turns for visual development and testing without API
- **No API routes in Phase 7 UI shell** — UI shell can be built and tested purely with mock data before API integration

## Conversation Types

**File:** `lib/types/conversation.ts`

```typescript
// --- Turn structure ---

export type ConversationTurn = {
  id: string
  role: "assistant"
  components: ConversationComponent[]
  timestamp: number
}

export type ConversationComponent =
  | MessageComponent
  | RadioQuestionComponent
  | UrgentBannerConvComponent
  | BoxGridConvComponent
  | SwapSuggestionConvComponent
  | QuickConfirmConvComponent

// --- New components ---

export type MessageComponent = {
  type: "message"
  props: {
    text: string
    tone: "greeting" | "suggestion" | "confirmation" | "info"
  }
}

export type RadioQuestionComponent = {
  type: "radio-question"
  props: {
    questionId: string
    question: string
    options: Array<{
      id: string
      label: string
      description?: string
    }>
  }
}

// --- Conversation wrappers for existing components ---

export type UrgentBannerConvComponent = {
  type: "urgent-banner"
  props: {
    hours: number
    severity: "warning" | "critical"
  }
}

export type BoxGridConvComponent = {
  type: "box-grid"
  props: {
    items: string[]
    compact: boolean
    showSwapButtons: boolean
  }
}

export type SwapSuggestionConvComponent = {
  type: "swap-suggestion"
  props: {
    suggestionId: string
    fromItem: string
    toItem: string
    reason: string
    confidence: number
  }
}

export type QuickConfirmConvComponent = {
  type: "quick-confirm"
  props: {
    label: string
    prominent: boolean
  }
}

// --- User responses ---

export type UserResponse = {
  turnId: string
  componentType: ConversationComponent["type"]
  action: string
  payload: Record<string, unknown>
  timestamp: number
}

// --- Conversation context ---

export type ConversationContext = {
  hoursUntilLock: number
  timeContext: "urgent" | "balanced" | "relaxed"
  boxItems: Array<{
    id: string
    name: string
    category: "VEGETABLE" | "FRUIT"
  }>
  isNewUser: boolean
  patterns: Array<{
    type: "item_dislike" | "item_preference"
    itemName: string
    confidence: number
    occurrences: number
  }>
}

// --- API request/response ---

export type NextTurnRequest = {
  context: ConversationContext
  history: ConversationTurn[]
  lastResponse: UserResponse | null
}

export type NextTurnResponse = {
  success: boolean
  turn: ConversationTurn
  done: boolean
  fallback?: boolean
  sideEffects?: SideEffect[]
}

export type SideEffect =
  | { type: "confirm-box" }
  | { type: "swap-item"; fromItem: string; toItem: string }
```

## Chat UI Shell

### ChatContainer

**File:** `components/conversation/chat-container.tsx`

The outermost conversation wrapper. Manages layout: header area, scrollable message list, and bottom action area.

```typescript
"use client"

type ChatContainerProps = {
  children: React.ReactNode
}
```

**Layout (adapted from Vercel chatbot):**
```
ChatContainer (flex flex-col h-dvh bg-base-100)
├── ChatHeader (optional — persona name, box status)
├── MessageList (flex-1 relative)
│   └── ScrollArea (absolute inset-0 overflow-y-auto touch-pan-y)
│       └── Content (max-w-2xl mx-auto px-4 py-6 space-y-4)
│           └── ...turns
└── BottomAnchor (sticky bottom-0 — reserved for future structured input)
```

**Key CSS patterns:**
- `h-dvh` — dynamic viewport height (handles mobile address bars)
- `overscroll-behavior-contain` — prevents scroll chaining
- `touch-pan-y` — optimized mobile scrolling
- `max-w-2xl mx-auto` — matches existing box page width

### MessageList

**File:** `components/conversation/message-list.tsx`

Renders all conversation turns sequentially with auto-scroll.

```typescript
"use client"

import { ConversationTurn } from "@/lib/types/conversation"

type MessageListProps = {
  turns: ConversationTurn[]
  activeTurnId: string | null
  onResponse: (response: UserResponse) => void
}
```

**Behavior:**
- Renders each turn&apos;s components in order
- Past turns (id !== activeTurnId) render in disabled/muted state
- Uses `messagesEndRef` pattern for scroll anchoring
- Auto-scrolls to bottom when new turn appears via `scrollIntoView({ behavior: "smooth" })`
- Each turn wrapped in `motion.div` with fade-in: `initial={{ opacity: 0, y: 8 }}` → `animate={{ opacity: 1, y: 0 }}`
- Staggered entry: `transition={{ delay: index * 0.1 }}`
- Respects `prefers-reduced-motion`

### Message

**File:** `components/conversation/message.tsx`

AI speech bubble using DaisyUI `chat` component.

```typescript
"use client"

type MessageProps = {
  text: string
  tone: "greeting" | "suggestion" | "confirmation" | "info"
}
```

**Rendering:**
- Uses DaisyUI `chat chat-start` (left-aligned, AI speaker)
- `chat-bubble` with `bg-base-200 text-base-content` styling
- Chat image: plant/leaf emoji or small Sub-Flow icon in `chat-image avatar`
- `chat-header`: "Sub-Flow" label in `text-base-content/60 text-xs`
- Tone-specific styling:
  - `greeting`: default
  - `suggestion`: subtle primary left border (`border-l-2 border-primary`)
  - `confirmation`: checkmark icon prefix, `text-success` for emphasis
  - `info`: default
- Fade-in animation: `animate-in fade-in duration-200`

### RadioQuestion

**File:** `components/conversation/radio-question.tsx`

Tappable structured options. No free text.

```typescript
"use client"

type RadioQuestionProps = {
  questionId: string
  question: string
  options: Array<{
    id: string
    label: string
    description?: string
  }>
  onSelect: (optionId: string) => void
  disabled?: boolean
}
```

**Rendering:**
- Question text as `chat chat-start` bubble (same as Message but contains the question)
- Options rendered below as vertical button list with `gap-2`
- Each option: `btn btn-outline rounded-lg w-full text-left justify-start min-h-[44px]`
- Selected option: `btn-primary`
- Unselected after selection: `btn-ghost opacity-50`
- Disabled state (past turns): all options `btn-ghost opacity-50`, selected one stays `btn-primary opacity-70`
- Container: `role="radiogroup"` with `aria-label={question}`
- Each option: `role="radio"`, `aria-checked`, keyboard focusable, visible focus ring
- Arrow key navigation between options

### TurnRenderer

**File:** `components/conversation/turn-renderer.tsx`

Maps a `ConversationTurn` to rendered components. Bridge between the type system and the UI.

```typescript
"use client"

import { ConversationTurn, ConversationComponent, UserResponse } from "@/lib/types/conversation"

type TurnRendererProps = {
  turn: ConversationTurn
  isActive: boolean
  onResponse: (response: UserResponse) => void
}
```

- Iterates `turn.components` and renders the matching component for each
- Passes `disabled={!isActive}` to all interactive components
- Creates `UserResponse` objects with correct `turnId`, `componentType`, `action`, `payload`, `timestamp`

### TypingIndicator

**File:** `components/conversation/typing-indicator.tsx`

Shows while waiting for next turn.

```typescript
"use client"

type TypingIndicatorProps = {
  visible: boolean
}
```

- DaisyUI `chat chat-start` bubble with three animated dots
- Dots: `animate-bounce` with staggered delays (0ms, 150ms, 300ms) — same as Vercel template
- `chat-image` matches Message component&apos;s avatar
- Fade in/out with `motion.div`

## Conversation Wrappers

Thin adapters that wrap existing box components to emit `UserResponse` events instead of calling server actions directly.

### ConvBoxView

**File:** `components/conversation/conv-box-view.tsx`

```typescript
"use client"

import type { BoxItemWithItem, Item } from "@/lib/types/database"

type ConvBoxViewProps = {
  items: BoxItemWithItem[]
  availableItems: Pick<Item, "id" | "name" | "emoji" | "category">[]
  compact: boolean
  showSwapButtons: boolean
  onSwapTap: (itemName: string) => void
  disabled?: boolean
}
```

- Renders `BoxItemCard` components in grid layout (reuses BoxView&apos;s grid logic)
- Swap button tap → calls `onSwapTap(itemName)` instead of opening SwapSheet
- When `disabled`, cards render in locked/read-only mode
- Remove buttons hidden (conversation flow handles removals via AI turns)

### ConvSwapSuggestion

**File:** `components/conversation/conv-swap-suggestion.tsx`

```typescript
"use client"

import type { SwapSuggestion } from "@/lib/types/patterns"

type ConvSwapSuggestionProps = {
  suggestion: SwapSuggestion
  onAccept: () => void
  onReject: () => void
  disabled?: boolean
}
```

- Renders existing `SwapSuggestionCard` visuals (emoji, arrow, reason, confidence)
- Accept → `onAccept()` (no server action)
- Dismiss → `onReject()` (no server action)
- When `disabled`, buttons hidden or `btn-disabled`

### ConvConfirmButton

**File:** `components/conversation/conv-confirm-button.tsx`

```typescript
"use client"

type ConvConfirmButtonProps = {
  label: string
  prominent: boolean
  onConfirm: () => void
  disabled?: boolean
}
```

- Prominent: `btn btn-primary btn-lg w-full min-h-[44px]` with pulse animation (matches existing urgent confirm style)
- Non-prominent: `btn btn-primary btn-md w-full min-h-[44px]`
- When `disabled`: `btn-disabled`

### ConvUrgentBanner

**File:** `components/conversation/conv-urgent-banner.tsx`

```typescript
"use client"

type ConvUrgentBannerProps = {
  hoursUntilLock: number
  severity: "warning" | "critical"
}
```

- Wraps existing `UrgentBanner` (which takes `hoursUntilLock`)
- No interaction — display only, same as existing component
- `severity` controls additional styling: `critical` adds `animate-pulse` border

## ConversationPage Client Component

**File:** `components/conversation/conversation-page.tsx`

The main client component that manages the conversation state machine.

```typescript
"use client"

import { useState, useCallback } from "react"
import {
  ConversationTurn,
  UserResponse,
  ConversationContext,
  NextTurnResponse,
  SideEffect,
} from "@/lib/types/conversation"
```

### State

```typescript
const [turns, setTurns] = useState<ConversationTurn[]>([])
const [loading, setLoading] = useState(true)
const [done, setDone] = useState(false)
const [error, setError] = useState<string | null>(null)
```

### Turn Loop

1. On mount: call `/api/conversation/next-turn` with `{ context, history: [], lastResponse: null }`
2. Receive first turn → append to `turns` state
3. User interacts with a component → create `UserResponse`
4. Call `/api/conversation/next-turn` with `{ context, history: turns, lastResponse }`
5. Receive next turn → append to `turns`
6. If `done: true`, conversation is complete — no more interactions
7. If response includes `sideEffects`, execute them (call server actions for confirm/swap)

### Side Effect Execution

```typescript
async function executeSideEffects(effects: SideEffect[]) {
  for (const effect of effects) {
    switch (effect.type) {
      case "confirm-box":
        await confirmBox(boxId)
        break
      case "swap-item":
        await swapItem(boxId, effect.fromItem, effect.toItem)
        break
    }
  }
}
```

### Rendering

- Renders all turns sequentially in a scrollable container via `ChatContainer` + `MessageList`
- Each turn&apos;s components rendered via `TurnRenderer`
- Past turns are non-interactive (disabled state)
- Only the latest turn allows interaction
- Auto-scrolls to latest turn
- Shows `TypingIndicator` between turns while loading

## API Endpoint

**File:** `app/api/conversation/next-turn/route.ts`

```typescript
import { NextResponse } from "next/server"
import { NextTurnRequest, NextTurnResponse } from "@/lib/types/conversation"
import { generateNextTurn } from "@/lib/conversation/generate"
import { getFallbackFirstTurn } from "@/lib/conversation/fallback"

export async function POST(request: Request) {
  try {
    const body: NextTurnRequest = await request.json()

    // Validate request
    if (!body.context) {
      return NextResponse.json(
        { success: false, error: "Missing context" },
        { status: 400 }
      )
    }

    const result = await generateNextTurn(body)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Conversation next-turn failed:", error)

    // Fallback: if this is the first turn, return rule-based turn
    if (!body.history?.length) {
      const fallbackTurn = getFallbackFirstTurn(body.context)
      return NextResponse.json({
        success: true,
        turn: fallbackTurn,
        done: false,
        fallback: true,
      })
    }

    return NextResponse.json(
      { success: false, error: "Failed to generate next turn" },
      { status: 500 }
    )
  }
}
```

## Gemini Prompt Strategy

**File:** `lib/conversation/generate.ts`

### System Prompt

The system prompt describes the AI&apos;s role, available components, and conversation rules:

```
You are a friendly assistant for a vegetable box subscription service.
You communicate through structured UI components — never free text outside of Message components.

Available components you can use in each turn:
- message: A speech bubble. Use for greetings, explanations, confirmations.
- radio-question: A list of tappable options. Use to ask the user a question.
- urgent-banner: Shows time pressure. Use when hoursUntilLock < 12.
- box-grid: Shows the box contents. Use to let the user see their items.
- swap-suggestion: Suggests swapping one item for another. Use when patterns indicate a dislike.
- quick-confirm: A confirmation button. Use when the user is ready to confirm their box.

Rules:
- Each turn must contain 1-3 components.
- Always start with a message component.
- Never show more than one radio-question per turn.
- When the user confirms, respond with a message (tone: confirmation) and set done: true.
- Include sideEffects array when actions need to happen (confirm-box, swap-item).
- Respond in the language that matches the user context (default: English).

Output format: JSON matching NextTurnResponse schema.
```

### Per-Turn User Prompt

Each turn sends:
1. The full `ConversationContext` as JSON
2. The conversation history (all previous turns)
3. The user&apos;s last response (if any)

Gemini returns a `NextTurnResponse` with the next turn&apos;s components.

### Generation Function

```typescript
export async function generateNextTurn(
  request: NextTurnRequest
): Promise<NextTurnResponse> {
  // Build prompt with system instructions + context + history + last response
  // Call Gemini 2.5 Flash with:
  //   - responseMimeType: "application/json"
  //   - temperature: 0.2
  // Parse and validate response
  // Return NextTurnResponse
}
```

## Fallback Logic

**File:** `lib/conversation/fallback.ts`

Deterministic first turn when Gemini fails. Uses the same context to produce a sensible opening turn.

```typescript
export function getFallbackFirstTurn(
  context: ConversationContext
): ConversationTurn {
  const components: ConversationComponent[] = []

  // Always start with a greeting
  components.push({
    type: "message",
    props: {
      text: context.timeContext === "urgent"
        ? "Your box locks soon — let's make sure it's right!"
        : "Hey! Here's your upcoming veggie box.",
      tone: "greeting",
    },
  })

  // Urgent: show banner
  if (context.timeContext === "urgent") {
    components.push({
      type: "urgent-banner",
      props: {
        hours: context.hoursUntilLock,
        severity: context.hoursUntilLock < 3 ? "critical" : "warning",
      },
    })
  }

  // Show box contents
  components.push({
    type: "box-grid",
    props: {
      items: context.boxItems.map((i) => i.name),
      compact: context.timeContext === "urgent",
      showSwapButtons: context.timeContext !== "urgent",
    },
  })

  // If strong dislike pattern, suggest swap
  const strongDislike = context.patterns.find(
    (p) =>
      p.type === "item_dislike" &&
      p.confidence >= 0.65 &&
      context.boxItems.some((i) => i.name === p.itemName)
  )

  if (strongDislike) {
    components.push({
      type: "swap-suggestion",
      props: {
        suggestionId: "fallback-swap-1",
        fromItem: strongDislike.itemName,
        toItem: "Zucchini",
        reason: `You've swapped ${strongDislike.itemName} ${strongDislike.occurrences} times`,
        confidence: strongDislike.confidence,
      },
    })
  }

  // Ask what they want to do (unless urgent with suggestion — go straight to confirm)
  if (context.timeContext !== "urgent" || !strongDislike) {
    components.push({
      type: "quick-confirm",
      props: {
        label: context.timeContext === "urgent" ? "Looks Good!" : "Confirm Box",
        prominent: context.timeContext === "urgent",
      },
    })
  }

  return {
    id: "fallback-turn-1",
    role: "assistant",
    components,
    timestamp: Date.now(),
  }
}
```

## Box Page Rewrite

The box page becomes a thin server component that passes context to the conversation client component.

### Server Component

**File:** `app/(main)/box/page.tsx` (modify existing)

```typescript
// Server component — fetches context, passes to client
import { buildConversationContext } from "@/lib/conversation/context"
import { ConversationPage } from "@/components/conversation/conversation-page"

export default async function BoxPage() {
  // Get active user and current box from existing patterns
  const context = await buildConversationContext(boxId, userId)

  return <ConversationPage context={context} boxId={boxId} />
}
```

### Context Builder

**File:** `lib/conversation/context.ts`

```typescript
import "server-only"
import { createClient } from "@/lib/supabase/server"
import { ConversationContext } from "@/lib/types/conversation"

export async function buildConversationContext(
  boxId: string,
  userId: string
): Promise<ConversationContext> {
  // Query box with items, user with box count and patterns
  // Calculate hoursUntilLock from box.lockDate
  // Determine timeContext: < 12h = urgent, 12-72h = balanced, > 72h = relaxed
  // Set isNewUser based on box count < 3
  // Return ConversationContext
}
```

## Mock Data for Development

**File:** `lib/conversation/mock-turns.ts`

Hardcoded conversation turns for each of the 4 testing scenarios. Allows building and testing the entire UI shell without any API.

```typescript
export const MOCK_SCENARIOS = {
  "mark-urgent": [turn1, turn2, turn3],
  "sarah-relaxed": [turn1, turn2],
  "sarah-urgent": [turn1, turn2],
  "mark-balanced": [turn1, turn2, turn3],
} satisfies Record<string, ConversationTurn[]>
```

## Chat Demo Page

**File:** `app/(main)/chat-demo/page.tsx`

Temporary page for developing and testing the chat shell in isolation.

- Dropdown to pick mock scenario
- "Next Turn" button to advance through mock turns manually
- "Reset" button to restart
- Renders `ChatContainer` → `MessageList` → turns
- Shows `TypingIndicator` between turns

This page is deleted when API integration is complete.

## Dev Panel Additions

Add conversation debug sections to the existing dev panel:

**Chat Shell (mock mode):**
- Scenario picker dropdown for the 4 mock scenarios
- Step-through controls — "Next Turn" / "Reset" buttons
- Component inspector — shows current turn&apos;s component types and props as JSON

**Live Conversation (API mode):**
- Conversation history viewer — collapsible view of all turns and responses, formatted as a timeline
- "Regenerate Turn" button — re-calls `/api/conversation/next-turn` with current history
- "Reset Conversation" button — clears all turns, restarts from scratch
- "Force Fallback" toggle — when enabled, always use deterministic fallback instead of Gemini
- Side effects log — shows which side effects were executed (confirm-box, swap-item)

## Available Components (Reused from Earlier Phases)

| Existing Component | Location | Wrapped As |
|-------------------|----------|------------|
| `UrgentBanner` | `components/box/urgent-banner.tsx` | `ConvUrgentBanner` |
| `BoxItemCard` | `components/box/box-item-card.tsx` | Used inside `ConvBoxView` |
| `SwapSuggestionCard` | `components/box/swap-suggestion.tsx` | `ConvSwapSuggestion` |
| `ConfirmButton` | `components/box/confirm-button.tsx` | `ConvConfirmButton` (new, simpler) |

**Note:** There is no standalone `box-grid` component — the grid layout lives in `BoxView`. `ConvBoxView` recreates the grid using `BoxItemCard` directly.

## Testing Scenarios

### Scenario 1: Mark (Experienced) + Urgent — Quick Confirm

**Context:** hoursUntilLock: 6, patterns: [{ type: "item_dislike", itemName: "Fennel", confidence: 0.85, occurrences: 3 }], boxItems includes Fennel

**Turn 1 (AI):**
```json
{
  "components": [
    { "type": "message", "props": { "text": "Your box locks in 6 hours! I noticed fennel is in there again.", "tone": "greeting" } },
    { "type": "urgent-banner", "props": { "hours": 6, "severity": "warning" } },
    { "type": "swap-suggestion", "props": { "suggestionId": "s1", "fromItem": "Fennel", "toItem": "Zucchini", "reason": "You've swapped fennel 3 times", "confidence": 0.85 } }
  ]
}
```

**User Response:** Accept swap → `{ action: "accept", payload: { fromItem: "Fennel", toItem: "Zucchini" } }`

**Turn 2 (AI):**
```json
{
  "components": [
    { "type": "message", "props": { "text": "Done! Fennel → Zucchini. Ready to lock it in?", "tone": "confirmation" } },
    { "type": "quick-confirm", "props": { "label": "Looks Good!", "prominent": true } }
  ],
  "sideEffects": [{ "type": "swap-item", "fromItem": "Fennel", "toItem": "Zucchini" }]
}
```

**User Response:** Confirm → `{ action: "confirm" }`

**Turn 3 (AI):**
```json
{
  "components": [
    { "type": "message", "props": { "text": "Your box is confirmed! Enjoy your veggies 🥦", "tone": "confirmation" } }
  ],
  "done": true,
  "sideEffects": [{ "type": "confirm-box" }]
}
```

### Scenario 2: Sarah (New User) + Relaxed — Exploration

**Context:** hoursUntilLock: 96, isNewUser: true, patterns: []

**Turn 1 (AI):**
```json
{
  "components": [
    { "type": "message", "props": { "text": "Welcome! Here's what's in your first veggie box.", "tone": "greeting" } },
    { "type": "box-grid", "props": { "items": ["Carrots", "Potatoes", "Kale", "Apples", "Onions"], "compact": false, "showSwapButtons": true } },
    { "type": "radio-question", "props": { "questionId": "q1", "question": "What would you like to do?", "options": [{ "id": "explore", "label": "Swap something", "description": "Trade an item for something else" }, { "id": "confirm", "label": "Looks great!", "description": "Confirm your box as-is" }] } }
  ]
}
```

**User Response:** Select "Looks great!" → `{ action: "select", payload: { questionId: "q1", optionId: "confirm" } }`

**Turn 2 (AI):**
```json
{
  "components": [
    { "type": "message", "props": { "text": "Awesome — your box is confirmed! We'll have recipes for you tomorrow.", "tone": "confirmation" } }
  ],
  "done": true,
  "sideEffects": [{ "type": "confirm-box" }]
}
```

### Scenario 3: Sarah (New User) + Urgent — Needs Guidance

**Context:** hoursUntilLock: 4, isNewUser: true, patterns: []

**Turn 1 (AI):**
```json
{
  "components": [
    { "type": "message", "props": { "text": "Your box locks in 4 hours! Let's take a quick look.", "tone": "greeting" } },
    { "type": "urgent-banner", "props": { "hours": 4, "severity": "warning" } },
    { "type": "box-grid", "props": { "items": ["Carrots", "Potatoes", "Kale", "Apples", "Onions"], "compact": true, "showSwapButtons": false } },
    { "type": "quick-confirm", "props": { "label": "Looks Good!", "prominent": true } }
  ]
}
```

**User Response:** Confirm → `{ action: "confirm" }`

**Turn 2 (AI):**
```json
{
  "components": [
    { "type": "message", "props": { "text": "Confirmed! Your first box is on its way.", "tone": "confirmation" } }
  ],
  "done": true,
  "sideEffects": [{ "type": "confirm-box" }]
}
```

### Scenario 4: Mark (Experienced) + Balanced — Reject Suggestion

**Context:** hoursUntilLock: 48, patterns: [{ type: "item_dislike", itemName: "Fennel", confidence: 0.85, occurrences: 3 }], boxItems includes Fennel

**Turn 1 (AI):**
```json
{
  "components": [
    { "type": "message", "props": { "text": "Your veggie box is ready for review!", "tone": "greeting" } },
    { "type": "box-grid", "props": { "items": ["Carrots", "Fennel", "Kale", "Apples", "Onions"], "compact": false, "showSwapButtons": true } },
    { "type": "swap-suggestion", "props": { "suggestionId": "s1", "fromItem": "Fennel", "toItem": "Zucchini", "reason": "You've swapped fennel 3 times", "confidence": 0.85 } }
  ]
}
```

**User Response:** Reject swap → `{ action: "reject", payload: { fromItem: "Fennel", toItem: "Zucchini" } }`

**Turn 2 (AI):**
```json
{
  "components": [
    { "type": "message", "props": { "text": "No problem — keeping fennel this time. Anything else you'd like to change?", "tone": "info" } },
    { "type": "radio-question", "props": { "questionId": "q1", "question": "What next?", "options": [{ "id": "swap-other", "label": "Swap something else" }, { "id": "confirm", "label": "Confirm my box" }] } }
  ]
}
```

**User Response:** Select "Confirm my box" → `{ action: "select", payload: { questionId: "q1", optionId: "confirm" } }`

**Turn 3 (AI):**
```json
{
  "components": [
    { "type": "message", "props": { "text": "All set — your box is confirmed!", "tone": "confirmation" } }
  ],
  "done": true,
  "sideEffects": [{ "type": "confirm-box" }]
}
```

## Files to Create
- `lib/types/conversation.ts` — All conversation types (turns, components, responses, context, side effects)
- `lib/conversation/mock-turns.ts` — Hardcoded mock scenarios for dev
- `lib/conversation/generate.ts` — `generateNextTurn()` — Gemini call with system + per-turn prompt
- `lib/conversation/fallback.ts` — `getFallbackFirstTurn()` — deterministic rule-based first turn
- `lib/conversation/context.ts` — `buildConversationContext()` — server-only context builder
- `app/api/conversation/next-turn/route.ts` — POST endpoint
- `components/conversation/chat-container.tsx` — Outer layout shell
- `components/conversation/message-list.tsx` — Scrollable turn list + auto-scroll
- `components/conversation/message.tsx` — AI speech bubble
- `components/conversation/radio-question.tsx` — Tappable structured options
- `components/conversation/turn-renderer.tsx` — Maps turn components to React
- `components/conversation/typing-indicator.tsx` — Animated dots
- `components/conversation/conv-box-view.tsx` — BoxItemCard grid wrapper
- `components/conversation/conv-swap-suggestion.tsx` — SwapSuggestion wrapper
- `components/conversation/conv-confirm-button.tsx` — Confirm button wrapper
- `components/conversation/conv-urgent-banner.tsx` — UrgentBanner wrapper
- `components/conversation/conversation-page.tsx` — Main conversation state machine component
- `app/(main)/chat-demo/page.tsx` — Temporary demo/testing page

## Files to Modify
- `app/(main)/box/page.tsx` — Rewrite to server component passing context to ConversationPage
- `app/dev/page.tsx` — Add conversation debug sections (mock + live)

## File Structure

```
lib/
  types/
    conversation.ts          # ConversationTurn, UserResponse, ConversationContext, etc.
  conversation/
    mock-turns.ts            # Hardcoded mock scenarios for dev
    generate.ts              # generateNextTurn() - Gemini call
    fallback.ts              # getFallbackFirstTurn() - deterministic fallback
    context.ts               # buildConversationContext() - server-only

components/
  conversation/
    chat-container.tsx       # Outer layout (h-dvh, scroll, max-w-2xl)
    message-list.tsx         # Scrollable turn list + auto-scroll
    message.tsx              # AI speech bubble (DaisyUI chat)
    radio-question.tsx       # Tappable options (radiogroup)
    turn-renderer.tsx        # Maps ConversationComponent → React
    typing-indicator.tsx     # Animated dots
    conv-box-view.tsx        # BoxItemCard grid wrapper
    conv-swap-suggestion.tsx # SwapSuggestion wrapper
    conv-confirm-button.tsx  # Confirm button wrapper
    conv-urgent-banner.tsx   # UrgentBanner wrapper
    conversation-page.tsx    # Main state machine component

app/
  api/
    conversation/
      next-turn/
        route.ts             # POST endpoint
  (main)/
    chat-demo/
      page.tsx               # Temporary demo page
```

## Design Reference

### Adapted from Vercel AI Chatbot
- Nested scroll: outer `relative flex-1`, inner `absolute inset-0 overflow-y-auto`
- `h-dvh` + `overscroll-behavior-contain`
- Fade-in animation: `animate-in fade-in duration-200`
- `messagesEndRef` scroll anchor pattern
- `max-w-2xl` content width (matches existing box page)

### Sub-Flow Brand Adaptation
- DaisyUI `chat` component instead of custom bubbles
- `bg-base-200` message bubbles instead of transparent
- `btn-primary` for selected options instead of blue
- `text-base-content` / `text-base-content/60` for content hierarchy (per design system: prefer DaisyUI semantic classes over raw brand tokens)
- Geist Sans font (inherited from layout)
- `rounded-lg` corners (design system default)
- `transition-all duration-300` + `motion-reduce:transition-none`

## Environment Variables
- `GEMINI_API_KEY` — Already exists from Phase 5, reused for conversation generation

## Summary Checklist

| Task | Status | Notes |
|------|--------|-------|
| Define conversation types | 🔲 | `lib/types/conversation.ts` |
| Create mock turn data | 🔲 | `lib/conversation/mock-turns.ts` |
| Build ChatContainer | 🔲 | Layout shell with scroll |
| Build MessageList | 🔲 | Turn rendering + auto-scroll |
| Build Message bubble | 🔲 | DaisyUI chat component |
| Build RadioQuestion | 🔲 | Tappable options with a11y |
| Build TurnRenderer | 🔲 | Component type → React mapping |
| Build TypingIndicator | 🔲 | Animated dots |
| Build ConvBoxView | 🔲 | BoxItemCard grid wrapper |
| Build ConvSwapSuggestion | 🔲 | Accept/reject wrapper |
| Build ConvConfirmButton | 🔲 | Confirm wrapper |
| Build ConvUrgentBanner | 🔲 | Display-only wrapper |
| Build context function | 🔲 | `lib/conversation/context.ts` |
| Write Gemini prompt + generation | 🔲 | `lib/conversation/generate.ts` |
| Create fallback logic | 🔲 | `lib/conversation/fallback.ts` |
| Build API endpoint | 🔲 | `app/api/conversation/next-turn/route.ts` |
| Create ConversationPage | 🔲 | `components/conversation/conversation-page.tsx` |
| Rewrite box page | 🔲 | Server component + ConversationPage |
| Create chat-demo page | 🔲 | Mock scenario testing |
| Add dev panel debug | 🔲 | Mock + live conversation sections |
| Test all 4 scenarios | 🔲 | Multi-turn conversation flows |

## Status
**Not started**
