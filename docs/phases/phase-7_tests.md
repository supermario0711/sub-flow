# Phase 7 Test Checklist

## Build & Lint
- [ ] `pnpm lint` passes without errors
- [ ] `pnpm build` succeeds without errors

## Conversation Types — lib/types/conversation.ts
- [ ] Exports `ConversationTurn` type with `id`, `role`, `components`, `timestamp`
- [ ] `role` is always `"assistant"`
- [ ] `components` typed as `ConversationComponent[]`
- [ ] Exports `ConversationComponent` union type covering all 6 component types
- [ ] Exports `MessageComponent` with `type: "message"` and props `text`, `tone`
- [ ] `tone` typed as union `"greeting" | "suggestion" | "confirmation" | "info"`
- [ ] Exports `RadioQuestionComponent` with `type: "radio-question"` and props `questionId`, `question`, `options`
- [ ] `options` typed as array of `{ id, label, description? }`
- [ ] Exports `UrgentBannerConvComponent` with `type: "urgent-banner"` and props `hours`, `severity`
- [ ] Exports `BoxGridConvComponent` with `type: "box-grid"` and props `items`, `compact`, `showSwapButtons`
- [ ] Exports `SwapSuggestionConvComponent` with `type: "swap-suggestion"` and props `suggestionId`, `fromItem`, `toItem`, `reason`, `confidence`
- [ ] Exports `QuickConfirmConvComponent` with `type: "quick-confirm"` and props `label`, `prominent`
- [ ] Exports `UserResponse` type with `turnId`, `componentType`, `action`, `payload`, `timestamp`
- [ ] Exports `ConversationContext` type with `hoursUntilLock`, `timeContext`, `boxItems`, `isNewUser`, `patterns`
- [ ] Exports `NextTurnRequest` type with `context`, `history`, `lastResponse`
- [ ] Exports `NextTurnResponse` type with `success`, `turn`, `done`, `fallback?`, `sideEffects?`
- [ ] Exports `SideEffect` union type covering `confirm-box` and `swap-item`

## Mock Data — lib/conversation/mock-turns.ts
- [ ] Exports `MOCK_SCENARIOS` with 4 scenarios: `mark-urgent`, `sarah-relaxed`, `sarah-urgent`, `mark-balanced`
- [ ] Each scenario is an array of `ConversationTurn` objects
- [ ] `mark-urgent` has 3 turns (greeting → swap accept → confirm)
- [ ] `sarah-relaxed` has 2 turns (greeting with radio-question → confirm)
- [ ] `sarah-urgent` has 2 turns (urgent greeting → confirm)
- [ ] `mark-balanced` has 3 turns (greeting → reject swap → confirm)
- [ ] All turns have valid `id`, `role: "assistant"`, `components`, `timestamp`
- [ ] Turns use all 6 component types across the 4 scenarios

## ChatContainer — components/conversation/chat-container.tsx
- [ ] Has `"use client"` directive
- [ ] Uses `h-dvh` for dynamic viewport height
- [ ] Flex column layout (`flex flex-col`)
- [ ] `overscroll-behavior-contain` to prevent scroll chaining
- [ ] `max-w-2xl mx-auto` content width (matches box page)
- [ ] `bg-base-100` background (DaisyUI semantic class, not raw `bg-cream`)
- [ ] Renders children in scrollable area

## MessageList — components/conversation/message-list.tsx
- [ ] Has `"use client"` directive
- [ ] Accepts `turns`, `activeTurnId`, `onResponse` props
- [ ] Nested scroll: outer `relative flex-1`, inner `absolute inset-0 overflow-y-auto`
- [ ] `touch-pan-y` on scroll container
- [ ] Renders each turn via `TurnRenderer`
- [ ] Past turns rendered with `isActive={false}`
- [ ] Current turn rendered with `isActive={true}`
- [ ] Uses `messagesEndRef` with `scrollIntoView({ behavior: "smooth" })`
- [ ] Auto-scrolls when `turns` array length changes
- [ ] Each turn wrapped in `motion.div` with fade-in animation
- [ ] Staggered entry delay per turn index
- [ ] Respects `prefers-reduced-motion` (no animation when reduced)

## Message — components/conversation/message.tsx
- [ ] Has `"use client"` directive
- [ ] Accepts `text` and `tone` props
- [ ] Uses DaisyUI `chat chat-start` (left-aligned)
- [ ] `chat-bubble` with `bg-base-200 text-base-content`
- [ ] `chat-header` shows "Sub-Flow" label
- [ ] `chat-image` with plant/leaf avatar
- [ ] `greeting` tone: default styling
- [ ] `suggestion` tone: primary left border accent (`border-l-2 border-primary`)
- [ ] `confirmation` tone: checkmark icon prefix, `text-success` emphasis
- [ ] `info` tone: default styling
- [ ] Fade-in animation on mount
- [ ] Text renders correctly with apostrophes and special characters

## RadioQuestion — components/conversation/radio-question.tsx
- [ ] Has `"use client"` directive
- [ ] Accepts `questionId`, `question`, `options`, `onSelect`, `disabled?` props
- [ ] Question text rendered (as label or chat bubble)
- [ ] Each option rendered as a tappable button
- [ ] Buttons use `btn btn-outline rounded-lg w-full min-h-[44px]` (no `btn-sm` — must meet 44px touch target)
- [ ] Only one option can be selected
- [ ] Selected option gets `btn-primary` styling
- [ ] Non-selected options get `btn-ghost opacity-50` after selection
- [ ] Selecting fires `onSelect(optionId)` immediately
- [ ] After selection, further clicks are ignored
- [ ] `disabled` prop disables all options (for past turns)
- [ ] Option `description` renders when provided
- [ ] Container has `role="radiogroup"` with `aria-label`
- [ ] Each option has `role="radio"` and `aria-checked` attribute
- [ ] Keyboard focusable with visible focus ring
- [ ] Arrow key navigation between options
- [ ] Enter/Space selects focused option

## TurnRenderer — components/conversation/turn-renderer.tsx
- [ ] Has `"use client"` directive
- [ ] Accepts `turn`, `isActive`, `onResponse` props
- [ ] Iterates `turn.components` and renders matching component for each
- [ ] Maps `"message"` → `Message` component
- [ ] Maps `"radio-question"` → `RadioQuestion` component
- [ ] Maps `"urgent-banner"` → `ConvUrgentBanner` component
- [ ] Maps `"box-grid"` → `ConvBoxView` component
- [ ] Maps `"swap-suggestion"` → `ConvSwapSuggestion` component
- [ ] Maps `"quick-confirm"` → `ConvConfirmButton` component
- [ ] Unknown component types: logs warning, renders null
- [ ] Passes `disabled={!isActive}` to interactive components
- [ ] Creates correct `UserResponse` objects (turnId, componentType, action, payload, timestamp)

## TypingIndicator — components/conversation/typing-indicator.tsx
- [ ] Has `"use client"` directive
- [ ] Accepts `visible` prop
- [ ] DaisyUI `chat chat-start` bubble layout
- [ ] Three dots with `animate-bounce`
- [ ] Staggered animation delays (0ms, 150ms, 300ms)
- [ ] Avatar matches Message component&apos;s `chat-image`
- [ ] Fades in/out smoothly
- [ ] Has `aria-busy="true"` and `aria-label="Loading"` when visible
- [ ] Hidden from accessibility tree when `visible={false}`

## ConvBoxView — components/conversation/conv-box-view.tsx
- [ ] Has `"use client"` directive
- [ ] Renders `BoxItemCard` components in grid layout
- [ ] Grid: `grid gap-3 md:grid-cols-2` when not compact, `flex flex-col gap-3` when compact
- [ ] Swap button tap calls `onSwapTap(itemName)` (does NOT open SwapSheet)
- [ ] Remove buttons hidden
- [ ] `disabled` → cards render in locked/read-only mode (no swap/remove buttons)
- [ ] Passes item data correctly to `BoxItemCard`

## ConvSwapSuggestion — components/conversation/conv-swap-suggestion.tsx
- [ ] Has `"use client"` directive
- [ ] Renders swap suggestion with emoji, arrow, item names, reason, confidence
- [ ] Accept button calls `onAccept()` (no server action)
- [ ] Reject/Dismiss button calls `onReject()` (no server action)
- [ ] `disabled` → buttons hidden or `btn-disabled`
- [ ] Uses existing `SwapSuggestionCard` visual patterns (card-border, bg-base-100)
- [ ] Framer Motion animation with reduced motion support

## ConvConfirmButton — components/conversation/conv-confirm-button.tsx
- [ ] Has `"use client"` directive
- [ ] Accepts `label`, `prominent`, `onConfirm`, `disabled?` props
- [ ] Prominent: `btn btn-primary btn-lg w-full min-h-[44px]`
- [ ] Non-prominent: `btn btn-primary btn-md w-full min-h-[44px]`
- [ ] Prominent mode has pulse animation (matches existing urgent confirm)
- [ ] Click calls `onConfirm()` (no server action)
- [ ] `disabled` → `btn-disabled`, no click handler
- [ ] Visible focus ring

## ConvUrgentBanner — components/conversation/conv-urgent-banner.tsx
- [ ] Has `"use client"` directive
- [ ] Accepts `hoursUntilLock` and `severity` props
- [ ] Renders existing `UrgentBanner` component (or matching markup)
- [ ] `critical` severity adds `animate-pulse` border or similar emphasis
- [ ] No interactive elements — display only
- [ ] Uses `alert alert-error` DaisyUI classes

## ConversationPage — components/conversation/conversation-page.tsx
- [ ] Has `"use client"` directive
- [ ] Accepts props: `context` (ConversationContext), `boxId` (string)
- [ ] Manages `turns` state as `ConversationTurn[]`
- [ ] Manages `loading` state (boolean)
- [ ] Manages `done` state (boolean)
- [ ] Fetches first turn on mount via `/api/conversation/next-turn`
- [ ] Sends `{ context, history: [], lastResponse: null }` for first turn
- [ ] Appends received turn to `turns` state
- [ ] When user interacts, creates `UserResponse` and calls next turn
- [ ] Sends `{ context, history: turns, lastResponse }` for subsequent turns
- [ ] Sets `done: true` when response has `done: true`
- [ ] Executes side effects when present in response (`confirm-box`, `swap-item`)
- [ ] Past turns render with disabled/non-interactive components
- [ ] Only the latest turn allows user interaction
- [ ] Auto-scrolls to latest turn when new turn appears
- [ ] Shows typing indicator between turns while loading
- [ ] Shows error state if fetch fails
- [ ] Handles fallback responses gracefully (logs warning, continues normally)

## Chat Demo Page — app/(main)/chat-demo/page.tsx
- [ ] Renders `ChatContainer` with `MessageList`
- [ ] Dropdown/selector to pick mock scenario
- [ ] "Next Turn" button advances to next mock turn
- [ ] "Reset" button clears turns and restarts scenario
- [ ] Shows `TypingIndicator` briefly between turns
- [ ] All 4 mock scenarios selectable and render correctly
- [ ] Interactive components (RadioQuestion, SwapSuggestion, ConfirmButton) fire callbacks
- [ ] Past turns become non-interactive after advancing

## API Endpoint — app/api/conversation/next-turn/route.ts
- [ ] Exports `POST` handler
- [ ] Validates request body (`context` present)
- [ ] Passes request to `generateNextTurn()` service
- [ ] Returns `NextTurnResponse` JSON on success
- [ ] On Gemini failure with empty history: returns fallback first turn via `getFallbackFirstTurn()`
- [ ] On Gemini failure with existing history: returns 500 with error message
- [ ] Does not expose internal error details beyond message
- [ ] Returns valid JSON in all cases (never crashes)

## Gemini Prompt — lib/conversation/generate.ts
- [ ] Exports `generateNextTurn(request: NextTurnRequest)` function
- [ ] Returns `Promise<NextTurnResponse>`
- [ ] System prompt describes AI role as subscription assistant
- [ ] System prompt lists all 6 available components with usage rules
- [ ] System prompt specifies 1-3 components per turn
- [ ] System prompt requires starting each turn with a message component
- [ ] System prompt limits to one radio-question per turn
- [ ] System prompt specifies `done: true` and sideEffects for confirmations
- [ ] Per-turn prompt includes full ConversationContext as JSON
- [ ] Per-turn prompt includes conversation history
- [ ] Per-turn prompt includes last user response
- [ ] Calls Gemini 2.5 Flash with `responseMimeType: "application/json"`
- [ ] Uses `temperature: 0.2` for consistent decisions
- [ ] Parses response as JSON matching `NextTurnResponse`
- [ ] Throws on empty/invalid Gemini response
- [ ] `GEMINI_API_KEY` read from `process.env`, not hardcoded

## Fallback Logic — lib/conversation/fallback.ts
- [ ] Exports `getFallbackFirstTurn(context: ConversationContext)` function
- [ ] Returns `ConversationTurn`
- [ ] Always starts with a `message` component (tone: "greeting")
- [ ] Urgent context: greeting text mentions time pressure
- [ ] Non-urgent context: greeting text is casual
- [ ] Urgent context: includes `urgent-banner` with correct severity (critical if < 3h)
- [ ] Always includes `box-grid` with items from context
- [ ] Urgent context: box-grid has `compact: true`, `showSwapButtons: false`
- [ ] Non-urgent context: box-grid has `compact: false`, `showSwapButtons: true`
- [ ] Strong dislike pattern (confidence >= 0.65, item in box): includes `swap-suggestion`
- [ ] No dislike patterns: no `swap-suggestion`
- [ ] Includes `quick-confirm` when appropriate
- [ ] Urgent + prominent confirm, non-urgent + non-prominent confirm
- [ ] Turn has valid `id`, `role: "assistant"`, and `timestamp`

## Context Builder — lib/conversation/context.ts
- [ ] Has `import "server-only"` directive
- [ ] Uses `createClient()` from `lib/supabase/server` (RLS-respecting)
- [ ] Exports `buildConversationContext(boxId, userId)` function
- [ ] Returns `ConversationContext`
- [ ] Queries box with items from database
- [ ] Queries user box count and patterns
- [ ] Calculates `hoursUntilLock` from box lock date
- [ ] Determines `timeContext`: < 12h = urgent, 12-72h = balanced, > 72h = relaxed
- [ ] Sets `isNewUser` based on box count < 3
- [ ] No `SELECT *` queries — explicit column selection

## Box Page Integration — app/(main)/box/page.tsx
- [ ] Server component (no `"use client"`)
- [ ] Fetches conversation context via `buildConversationContext()`
- [ ] Passes `context` and `boxId` to `ConversationPage` client component
- [ ] No direct Supabase calls in page (uses service layer)

## Dev Panel Additions
- [ ] "Chat Shell" section visible in dev panel (mock mode)
- [ ] Scenario picker dropdown with 4 options
- [ ] "Next Turn" / "Reset" step-through controls
- [ ] Component inspector shows current turn&apos;s component types and props as JSON
- [ ] Conversation history viewer visible in dev panel (live mode, collapsible)
- [ ] Shows all turns with their components and user responses
- [ ] "Regenerate Turn" button re-calls API with current history
- [ ] "Reset Conversation" button clears turns and restarts
- [ ] "Force Fallback" toggle — when on, always uses deterministic fallback
- [ ] Side effects log shows executed effects (confirm-box, swap-item)
- [ ] Fallback indicator shows whether current turns came from Gemini or fallback

## Testing Scenario 1: Mark (Experienced) + Urgent — Quick Confirm
- [ ] Context: hoursUntilLock=6, patterns include Fennel dislike (confidence=0.85), box contains Fennel
- [ ] Turn 1: message (greeting, mentions time + fennel) + urgent-banner (hours=6, warning) + swap-suggestion (Fennel→Zucchini)
- [ ] User accepts swap → response with action "accept"
- [ ] Turn 2: message (confirmation of swap) + quick-confirm (prominent=true)
- [ ] Side effect: swap-item executed for Fennel→Zucchini
- [ ] User confirms → response with action "confirm"
- [ ] Turn 3: message (confirmation, done) + done=true
- [ ] Side effect: confirm-box executed
- [ ] All past turns are non-interactive after progressing

## Testing Scenario 2: Sarah (New User) + Relaxed — Exploration
- [ ] Context: hoursUntilLock=96, isNewUser=true, patterns=[]
- [ ] Turn 1: message (welcome greeting) + box-grid (full, swap buttons) + radio-question (swap or confirm options)
- [ ] No swap-suggestion (no patterns for new user)
- [ ] User selects "Looks great!" option
- [ ] Turn 2: message (confirmation) + done=true
- [ ] Side effect: confirm-box executed

## Testing Scenario 3: Sarah (New User) + Urgent — Needs Guidance
- [ ] Context: hoursUntilLock=4, isNewUser=true, patterns=[]
- [ ] Turn 1: message (time pressure greeting) + urgent-banner (hours=4, warning) + box-grid (compact, no swap buttons) + quick-confirm (prominent)
- [ ] No swap-suggestion (no patterns)
- [ ] User confirms → response with action "confirm"
- [ ] Turn 2: message (confirmation) + done=true
- [ ] Side effect: confirm-box executed

## Testing Scenario 4: Mark (Experienced) + Balanced — Reject Suggestion
- [ ] Context: hoursUntilLock=48, patterns include Fennel dislike (confidence=0.85), box contains Fennel
- [ ] Turn 1: message (greeting) + box-grid (full, swap buttons) + swap-suggestion (Fennel→Zucchini)
- [ ] User rejects swap → response with action "reject"
- [ ] Turn 2: message (acknowledges rejection) + radio-question (swap other or confirm options)
- [ ] No repeat swap-suggestion for Fennel
- [ ] User selects "Confirm my box"
- [ ] Turn 3: message (confirmation) + done=true
- [ ] Side effect: confirm-box executed

## Visual Fidelity — Vercel Chatbot Patterns
- [ ] Message bubbles left-aligned for AI (DaisyUI `chat-start`)
- [ ] Nested scroll container: outer `relative flex-1`, inner `absolute inset-0 overflow-y-auto`
- [ ] Auto-scroll to bottom on new turn
- [ ] Fade-in animation on each turn (`animate-in fade-in duration-200` or framer-motion equivalent)
- [ ] Typing indicator with bouncing dots
- [ ] `max-w-2xl` content width
- [ ] Responsive padding: `px-4 py-6` mobile, wider desktop

## Visual Fidelity — Sub-Flow Brand
- [ ] `bg-base-100` background (not raw `bg-cream`)
- [ ] `bg-base-200` message bubbles (not raw `bg-stone`)
- [ ] `btn-primary` for selected/active elements (not raw `bg-sage`)
- [ ] `text-base-content` / `text-base-content/60` content hierarchy (not raw `text-text` / `text-text-muted`)
- [ ] `rounded-lg` corners on cards and bubbles
- [ ] Geist Sans font (inherited from layout)
- [ ] DaisyUI semantic classes throughout (no raw Tailwind colors)
- [ ] `transition-all duration-300` with `motion-reduce:transition-none`

## Accessibility
- [ ] RadioQuestion has `role="radiogroup"` container with `aria-label`
- [ ] Each radio option has `role="radio"` and `aria-checked`
- [ ] Radio options navigable via arrow keys + Enter/Space
- [ ] All interactive elements have visible focus rings
- [ ] All interactive elements have `min-h-[44px]` touch targets
- [ ] Message component has appropriate ARIA role (e.g., `role="status"` for confirmations)
- [ ] TypingIndicator has `aria-busy="true"` and `aria-label="Loading"`
- [ ] Disabled past-turn components have `aria-disabled="true"`
- [ ] Message bubbles use semantic chat markup
- [ ] Conversation container is scrollable and scroll is announced
- [ ] Color contrast meets WCAG AA for all text
- [ ] Reduced motion respected on all animations

## Code Quality
- [ ] `import "server-only"` on `lib/conversation/context.ts`
- [ ] `lib/conversation/context.ts` uses `createClient()` (RLS-respecting) for reads
- [ ] `"use client"` directive on all client components
- [ ] No `SELECT *` queries — explicit column selection in context builder
- [ ] Types imported from `lib/types/conversation.ts` (no inline type definitions)
- [ ] DaisyUI semantic classes used (no raw Tailwind colors)
- [ ] Apostrophes escaped with `&apos;` in JSX text
- [ ] No API calls from mock-only components — all data from mock-turns.ts (chat demo)
- [ ] No server actions called from conversation wrappers
- [ ] No secrets or API keys in committed code
- [ ] `GEMINI_API_KEY` only referenced via `process.env`
- [ ] All conversation state is ephemeral (React state only, no DB writes for conversation)
- [ ] Components follow existing naming conventions (kebab-case files, PascalCase exports)
- [ ] Framer Motion animations respect `prefers-reduced-motion`
