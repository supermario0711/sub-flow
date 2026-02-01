# Cursor 2-Day AI Hackathon — Repo Template

![Cursor 2-Day AI Hackathon](https://ai-beavers.com/_next/image?url=%2Fimages%2Fhackathon-hero-20012026.png&w=1920&q=75)

---

# Sub-Flow (Biokiste)

> An adaptive subscription management UI that feels like texting a friend, not navigating a webshop.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript 5
- **Styling**: Tailwind CSS v4, DaisyUI 5
- **Database**: Supabase (PostgreSQL)
- **AI/ML**: Gemini 2.5 Flash (image generation), Vertex AI (A2UI generation)
- **Hosting**: Vercel

## How to Run

```bash
# Clone the repo
git clone https://github.com/your-team/sub-flow.git
cd sub-flow

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Add your Supabase and Google AI API keys to .env

# Run the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Details

### The Problem

Subscription management for physical products (veggie boxes, diapers, coffee) is broken. Every service builds an e-commerce shop first, then bolts subscriptions on top. The result: interfaces designed for browsing, not managing.

### The Solution

An adaptive subscription interface that:

1. **Knows your context** — Urgent deadline? Minimal UI. Plenty of time? Let's explore.
2. **Learns your preferences** — "You always swap fennel. Want me to just do that?"
3. **Delights with visuals** — AI-generated images of your box and recipes
4. **Feels like a conversation** — Not a shop, not a dashboard, something warmer

### Key Features

- **Time-adaptive UI**: Same app looks completely different based on urgency (< 12h: urgent mode, > 72h: browse mode)
- **Smart suggestions**: Pattern detection learns from swap history and proactively recommends
- **AI box images**: Beautiful food photography generated on confirmation via Gemini
- **Persona simulation**: Dev panel for instant switching between demo users and time contexts

### Demo Scenario

The prototype simulates weekly vegetable box subscriptions with three personas:

| Persona | Name  | Story | Default Box | Swap History & Patterns |
|---------|-------|-------|-------------|------------------------|
| New     | Sarah | Just signed up, exploring the service for the first time | Carrot, Broccoli, Apple, Pear, Banana | None — clean slate, no learned patterns |
| Regular | Mark  | 3 weeks in, has clear preferences | Fennel, Broccoli, Apple, Orange, Strawberry | Swapped Fennel &rarr; Zucchini 3 times; system detects dislike of Fennel (95%) and preference for Zucchini (85%) |
| Power   | Lisa  | Engaged power user, curious and exploratory | Carrot, Fennel, Beetroot, Pear, Strawberry | Swapped to Strawberry 2x, Orange 2x, Broccoli away 2x; prefers Strawberry (70%), prefers Orange (70%), dislikes Broccoli (80%) |

### Things to Try

**Scenario 1: Watch a box go through its lifecycle**
1. Select **Sarah** with **Plenty of time** — explore the relaxed browse mode
2. Switch to **Locking soon** — see the UI shift to urgency mode
3. Switch to **Locked** — the box is finalized, no more changes

**Scenario 2: Compare "locking soon" across personas**
1. Switch to **Lisa** with **Plenty of time** and **reset boxes** — see how a power user&apos;s experience differs with learned preferences
2. Select **Mark** with **Locking soon** — notice his Fennel &rarr; Zucchini suggestion (strong pattern)
3. Switch to **Lisa** with **Locking soon** — compare her different preference suggestions (fruit-focused)

**Scenario 3: Conversation interactions**
Try these via the chat interface:
- Add a vacation (pause deliveries)
- Skip this week
- Add or remove items from the box
- Confirm a box, keep editing a box

### Architecture

See `docs/project-plan.md` for the full product vision and `docs/phases/` for implementation details across 8 phases.
