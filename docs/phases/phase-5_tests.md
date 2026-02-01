# Phase 5 Test Checklist

## Build & Lint
- [ ] `pnpm lint` passes without errors
- [ ] `pnpm build` succeeds without errors
- [ ] `supabase db reset` applies migration + seed without error

## Migration — 008_box_images_bucket.sql
- [ ] `box-images` storage bucket created with `public = true`
- [ ] Public read policy exists on `storage.objects` for `box-images` bucket
- [ ] Service-role write policy exists on `storage.objects` for `box-images` bucket

## Dependency — framer-motion
- [ ] `framer-motion` listed in `package.json` dependencies
- [ ] No build errors related to framer-motion imports

## Service — image-generation.ts
- [ ] Exports `generateBoxImage(boxId: string, items: Pick<Item, "name" | "emoji">[])`
- [ ] Builds prompt from item names with food photography style direction
- [ ] Calls Gemini 2.5 Flash image generation API
- [ ] Uploads generated PNG to Supabase Storage `box-images/{boxId}.png`
- [ ] Updates `boxes.image_url` with the public storage URL + `?v=<timestamp>` cache-buster
- [ ] Handles API errors gracefully (logs error, does not throw — image is non-critical)
- [ ] Has `import "server-only"` directive
- [ ] `GEMINI_API_KEY` read from `process.env`, not hardcoded

## Server Action — box.ts (modified)
- [ ] `confirmBox` redirects to `/confirm` without triggering image generation
- [ ] `swapItem` on confirmed box clears `image_url` (set to null)
- [ ] `removeItem` on confirmed box clears `image_url` (set to null)
- [ ] `editBox` clears `image_url` (set to null)

## Loading Skeletons — box-skeleton.tsx
- [ ] Renders 5 skeleton item cards matching `BoxItemCard` height/width
- [ ] Uses DaisyUI `skeleton` class or equivalent shimmer effect
- [ ] Skeleton cards have same border-radius and spacing as real cards

## Loading Skeleton — app/box/loading.tsx
- [ ] Exports default function used as route-level loading state
- [ ] Shows header skeleton + 5 item card skeletons + button area skeleton
- [ ] Layout matches actual box page structure

## Loading Skeleton — app/confirm/loading.tsx
- [ ] Exports default function used as route-level loading state
- [ ] Shows celebration emoji area + heading + 5 item skeletons + image placeholder
- [ ] Layout matches actual confirmation page structure

## Component — BoxImage
- [ ] Renders AI-generated image when `imageUrl` prop is provided
- [ ] Uses Next.js `Image` component with proper `width`/`height`/`alt`
- [ ] Shows fade-in animation when image loads (via `onLoad` + framer-motion)
- [ ] Shows emoji grid fallback when `imageUrl` is null
- [ ] Fallback displays emojis of box items in a visually appealing grid
- [ ] Has `"use client"` directive
- [ ] `alt` text describes the box contents

## Confirmation Page (modified)
- [ ] Phase 5 placeholder section replaced with `BoxImage` component
- [ ] Passes `box.image_url` and item emojis to `BoxImage`
- [ ] Celebration emoji has spring scale-in animation
- [ ] Item list has staggered fade-in animation
- [ ] Page still renders correctly when `image_url` is null

## Box View Animations
- [ ] Item cards wrapped with `AnimatePresence` for enter/exit animations
- [ ] Cards stagger in on page load (fade-in + slide-up, ~50ms stagger)
- [ ] Removed item animates out (slide-out + fade)
- [ ] Swapped item animates out, new item animates in
- [ ] Layout shift is smooth when items are added/removed (layout animation)

## Box Item Card Animations
- [ ] Wrapped with `motion.div` or `motion.li` for layout animation prop
- [ ] No visual glitches during layout transitions

## Swap Suggestion Animations
- [ ] Card slides down from top on entry
- [ ] Accept: card scales up + fades out
- [ ] Dismiss: card slides right + fades out
- [ ] `AnimatePresence` handles exit animation before DOM removal

## Confirm Button Animation
- [ ] Subtle pulse animation in urgent mode (`animate` prop with scale keyframes)
- [ ] Press feedback: scales to 0.95 on tap (`whileTap`)
- [ ] No pulse in browsing or locked mode

## Quick Add Animations
- [ ] Chips stagger in on appearance (fade-in, ~30ms stagger)
- [ ] Tap feedback: scale animation on press (`whileTap`)

## Motion Preferences
- [ ] All Framer Motion components respect `prefers-reduced-motion`
- [ ] `useReducedMotion()` hook used to disable spring/stagger animations
- [ ] `motion-reduce:transition-none` applied on all elements with CSS transitions
- [ ] App is fully functional with reduced motion (no information lost)

## Image Cache-Busting
- [ ] Re-confirming a box after edit generates a new image with a different `?v=` param
- [ ] Browser shows the new image, not the old cached version
- [ ] Old image file remains in Supabase Storage (not deleted)

## Persona-Specific Behavior
- [ ] **Mark** (urgent): confirm button pulses, swap suggestion slides in, confirm → image generates
- [ ] **Sarah** (browsing): items stagger in, no swap suggestion, confirm → image generates
- [ ] **Lisa** (browsing): items stagger in, Quick Add chips animate, confirm → image generates
- [ ] All personas: confirmation page shows image or fallback correctly

## Accessibility
- [ ] `BoxImage` has descriptive `alt` text for screen readers
- [ ] Skeleton components have `aria-busy="true"` and `aria-label="Loading"`
- [ ] No animation causes content to be inaccessible
- [ ] All interactive elements retain `min-h-[44px]` touch targets
- [ ] Focus rings visible on all buttons (not obscured by animation)

## Code Quality
- [ ] `"use server"` directive on server action files
- [ ] `import "server-only"` on `lib/services/image-generation.ts`
- [ ] `"use client"` directive on all animated components and `BoxImage`
- [ ] No `SELECT *` queries — explicit column selection
- [ ] DaisyUI semantic classes used (no raw Tailwind colors)
- [ ] Apostrophes escaped with `&apos;` in JSX text
- [ ] No secrets or API keys in committed code
- [ ] `GEMINI_API_KEY` only referenced via `process.env`
