# Phase 5: Visual Delight

## Goal
Polish the UI with smooth animations, loading skeletons, and AI-generated box images — so confirming a box feels like a celebration, not a form submission.

## Scope Decisions (Hackathon)
- **Framer Motion** for animations — mature React library, tree-shakeable, layout animations built-in
- **Gemini 2.5 Flash** for image generation — fast, cost-effective, good food photography output
- **Supabase Storage** for generated images — already in stack, public bucket with CDN
- **No recipe images** — deferred to Phase 6
- **No real-time generation streaming** — generate → store → poll from client until ready

## Features

### Framer Motion Animations
Add motion to key interactions across the box management flow:

**Box Item Cards:**
- `AnimatePresence` with staggered entry on page load (fade-in + slide-up, 50ms stagger)
- Exit animation on swap/remove (slide-out + fade)
- Layout animation when items reorder after add/remove

**Swap Suggestion Card:**
- Slide-down entry from top
- Exit on accept: scale-up + fade-out (success feel)
- Exit on dismiss: slide-right + fade-out

**Confirm Button:**
- Subtle pulse animation in urgent mode to draw attention
- Scale-down on press (0.95) for tactile feedback

**Confirmation Page:**
- Celebration emoji scales in with spring animation
- Item list staggers in from bottom
- AI image fades in when loaded

**Quick Add Chips:**
- Staggered fade-in on appearance
- Scale animation on tap

### Loading Skeletons
Replace blank states with shimmer skeletons:

- `components/box/box-skeleton.tsx` — 5 item card placeholders matching `BoxItemCard` dimensions
- `app/box/loading.tsx` — Full page skeleton (header + 5 cards + Quick Add area + buttons)
- `app/confirm/loading.tsx` — Confirmation page skeleton (emoji + heading + 5 items + image placeholder)

### AI Box Image Generation
Generate a food photography-style image of the confirmed box items using Gemini 2.5 Flash:

**Trigger:** Instantly when the user lands on `/confirm` after confirming — the `BoxImage` client component triggers generation on mount
**Prompt:** Build from item names + emojis: "A beautiful overhead food photography shot of a wooden crate containing: [item1], [item2], [item3], [item4], [item5]. Natural lighting, kitchen table, organic feel."
**Output:** PNG image stored in Supabase Storage, URL saved to `boxes.image_url`

**Generation Flow:**
1. User clicks confirm → `confirmBox` action sets status to `confirmed` → redirect to `/confirm`
2. `BoxImage` component mounts → calls `triggerBoxImageGeneration` server action
3. Server action calls Gemini 2.5 Flash Image API (`gemini-2.5-flash-image` model)
4. Upload result to Supabase Storage bucket `box-images/{boxId}.png` (via secret key client)
5. Update `boxes.image_url` with public URL
6. Meanwhile, client polls `getBoxImageUrl` every 3s, showing rotating status messages ("Curating your box…", "Arranging the freshest picks…", etc.)
7. When URL appears, emoji grid fades out and AI image fades in

### Confirmation Page Enhancement
Replace the Phase 5 placeholder with actual content:

- Show emoji grid of box items immediately as fallback
- Show rotating status messages with loading dots while image generates ("Curating your box…", "Arranging the freshest picks…", "Adding a dash of color…", etc.)
- When AI image is ready, cross-fade from emoji grid to generated image
- If generation fails or times out (60s), emoji grid stays as final state

### Motion Preferences
Respect `prefers-reduced-motion`:
- All Framer Motion animations wrapped with `useReducedMotion()` hook
- When reduced motion preferred: instant transitions, no spring physics
- CSS fallback: `motion-reduce:transition-none` on all animated elements

## Data Model

### No new tables
Existing `boxes.image_url` column (already nullable text) stores the generated image URL.

### Supabase Storage Bucket
```sql
-- Created via Supabase dashboard or migration
INSERT INTO storage.buckets (id, name, public)
VALUES ('box-images', 'box-images', true);

-- Public read access, service-role write
CREATE POLICY "box_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'box-images');

CREATE POLICY "box_images_service_write"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'box-images');
```

## Architecture Decisions

- **Framer Motion over CSS-only** — layout animations and `AnimatePresence` (exit animations) are impractical with CSS alone
- **Gemini 2.5 Flash over DALL-E/Stability** — faster generation, already in Google Cloud ecosystem for later A2UI integration
- **Supabase Storage over external CDN** — zero additional infrastructure, public bucket serves via CDN automatically
- **Client-triggered generation with polling** — image generation is triggered on `/confirm` mount via server action, client polls every 3s with rotating status messages until the image is ready (max 60s)
- **Cache-busting on image URL** — stored URL includes `?v=<timestamp>` so re-generated images bypass browser/CDN caches
- **Supabase secret key for Storage** — uses `SUPABASE_SECRET_KEY` (`sb_secret_`) for server-side Storage uploads, not the service role key

## Files to Create
- `lib/services/image-generation.ts` — `generateBoxImage(boxId, items)`: calls Gemini 2.5 Flash Image, uploads to Supabase Storage, updates `boxes.image_url` (uses `import "server-only"`)
- `lib/supabase/service.ts` — Supabase client using secret API key (`sb_secret_`) for Storage uploads
- `supabase/migrations/008_box_images_bucket.sql` — Storage bucket + policies for box images
- `components/box/box-skeleton.tsx` — Skeleton loading state for box item list
- `components/confirm/box-image.tsx` — Client component: triggers generation, polls with rotating status messages, shows AI image or emoji fallback
- `components/confirm/confirm-content.tsx` — Client wrapper for animated confirmation page content
- `app/actions/image.ts` — Server actions: `triggerBoxImageGeneration` and `getBoxImageUrl` for client polling
- `app/box/loading.tsx` — Route-level loading skeleton for `/box`
- `app/confirm/loading.tsx` — Route-level loading skeleton for `/confirm`

## Files to Modify
- `package.json` — Add `framer-motion` dependency
- `app/actions/box.ts` — Clear `image_url` on revert to draft (swap, remove, editBox)
- `app/confirm/page.tsx` — Replace Phase 5 placeholder with `BoxImage` component, add animations
- `components/box/box-view.tsx` — Wrap item list with `AnimatePresence` + `motion.div` for stagger animations
- `components/box/box-item-card.tsx` — Add `motion.div` wrapper with layout animation
- `components/box/swap-suggestion.tsx` — Add enter/exit animations with `AnimatePresence`
- `components/box/confirm-button.tsx` — Add pulse animation in urgent mode, press scale
- `components/box/quick-add.tsx` — Add staggered chip entry animation

## Data Flow

```
confirmBox (server action)
  → set box status = 'confirmed'
  → redirect to /confirm

/confirm (server page)
  → getConfirmedBox(userSlug)
  → pass box.id + box.image_url to ConfirmContent → BoxImage

BoxImage (client component)
  → if imageUrl: <Image> with onLoad fade-in
  → if null:
    → show emoji grid fallback (🥕🥦🍎🍌🫑)
    → call triggerBoxImageGeneration server action (once on mount)
    → poll getBoxImageUrl every 3s with rotating status messages
    → when URL arrives, cross-fade from emoji grid to AI image
    → stop after 60s if no image

generateBoxImage (server-only)
  → build prompt from item names
  → call Gemini 2.5 Flash image generation
  → upload PNG to Supabase Storage 'box-images/{boxId}.png' (upsert)
  → update boxes.image_url with public URL + cache-busting ?v= param
```

## Environment Variables
- `GEMINI_API_KEY` — API key for Gemini 2.5 Flash image generation (stored in `.env.local`, never committed)

## Status
**WIP** — Image regeneration on box edit implemented; visual polish pending.
