# Sub-Flow

An application that allows to manage subscriptions of physical products via a smooth conversation flow.

## Rules
- Never commit secrets, credentials, API keys, or any `.env` files to the repository.

## Tech Stack
- **Framework**: Next.js 16 (App Router) with React 19
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4 + DaisyUI 5
- **Fonts**: Geist Sans & Geist Mono (Google Fonts)
- **Linting**: ESLint 9 (eslint-config-next)
- **Package Manager**: pnpm
- **Deployment**: Vercel

## Project Plan

The full project plan lives in `docs/project-plan.md`. It defines the product vision (adaptive subscription UI for veggie boxes), user personas, core flows, and the demo scenario.

Implementation is split into 8 phases. Each phase gets its own file at `docs/phases/phase-N.md` with detailed technical specs:

1. **Foundation** — Next.js app, database, seed data, basic routing
2. **Simulation System** — Persona switching, time context, dev panel
3. **Core Box UI** — Item display, swap flow, confirm, time-adaptive layout
4. **Learning & Suggestions** — Pattern detection, smart swap suggestions
5. **Visual Delight** — Animations, AI box image generation, polish
6. **Recipe Experience** — Recipe generation, gallery, detail pages
7. **A2UI Integration** — Custom React renderer, Vertex AI UI generation
8. **Demo Polish** — End-to-end demo flow, error handling, performance

Key references:
- `docs/project-plan.md` — Product vision, personas, flows, success criteria
- `docs/a2ui-renderer.md` — A2UI protocol spec and renderer architecture
- `docs/phases/phase-N.md` — Per-phase implementation details (created as we go)

## Commands
- `pnpm dev` — Start development server
- `pnpm build` — Production build
- `pnpm lint` — Run ESLint
