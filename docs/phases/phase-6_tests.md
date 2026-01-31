# Phase 6 Test Checklist

## Build & Lint
- [ ] `pnpm lint` passes without errors
- [ ] `pnpm build` succeeds without errors
- [ ] `supabase db reset` applies migration + seed without error

## Migration — 009_recipes.sql
- [ ] `recipes` table created with all columns (id, box_id, user_id, title, description, prep_time, cook_time, servings, difficulty, ingredients, steps, tips, image_url, created_at, updated_at)
- [ ] `difficulty` CHECK constraint enforces `easy`, `medium`, `hard`
- [ ] `box_id` foreign key references `boxes(id)` with `ON DELETE CASCADE`
- [ ] `user_id` foreign key references `users(id)`
- [ ] `ingredients`, `steps`, `tips` columns are `jsonb` with default `[]`
- [ ] Indexes exist on `box_id` and `user_id`
- [ ] RLS enabled with read/insert/update/delete policies
- [ ] `recipe-images` storage bucket created with `public = true`
- [ ] Public read policy exists on `storage.objects` for `recipe-images` bucket
- [ ] Service-role write policy exists on `storage.objects` for `recipe-images` bucket

## Types — recipes.ts
- [ ] Exports `Recipe` type matching all table columns
- [ ] Exports `RecipeIngredient` type with `name`, `amount`, `unit`
- [ ] `difficulty` typed as union `"easy" | "medium" | "hard"`
- [ ] `ingredients` typed as `RecipeIngredient[]`
- [ ] `steps` typed as `string[]`
- [ ] `tips` typed as `string[]`

## Service — recipe-generation.ts
- [ ] Has `import "server-only"` directive
- [ ] Exports `generateRecipes(boxId: string, userId: string, items: ItemInfo[])`
- [ ] Builds structured prompt requesting 3 recipes with JSON output
- [ ] Calls Gemini 2.5 Flash API via `fetch()` (same pattern as `image-generation.ts`)
- [ ] Parses JSON response into recipe objects
- [ ] Inserts 3 recipe rows into `recipes` table via Supabase client
- [ ] Each recipe uses at least 2 box items in ingredients
- [ ] Fires `generateRecipeImage` for each recipe (fire-and-forget, no await)
- [ ] Handles Gemini API errors gracefully (logs, does not throw)
- [ ] Handles malformed JSON response gracefully
- [ ] `GEMINI_API_KEY` read from `process.env`, not hardcoded
- [ ] Uses `createServiceClient()` from `lib/supabase/service.ts`

## Service — recipe image generation
- [ ] Builds prompt from recipe title + description with food photography style
- [ ] Calls Gemini 2.5 Flash image generation API (same pattern as box image)
- [ ] Uploads PNG to Supabase Storage `recipe-images/{recipeId}.png`
- [ ] Updates `recipes.image_url` with public URL
- [ ] Handles errors gracefully (logs, does not throw — image is non-critical)

## Service — recipes.ts (read queries)
- [ ] Has `import "server-only"` directive
- [ ] Uses `createClient()` from `lib/supabase/server` (RLS-respecting, not service client)
- [ ] Exports `getRecipesForUser(userSlug)` — returns recipes for user&apos;s latest confirmed box
- [ ] Exports `getRecipeById(id)` — returns single recipe or null
- [ ] No `SELECT *` queries — explicit column selection
- [ ] All UUID inputs validated (regex or similar)

## Vercel Function — app/api/recipes/generate/route.ts
- [ ] Exports `POST` handler
- [ ] Validates request body (userSlug present)
- [ ] Looks up user and confirmed box before calling generation
- [ ] Calls `generateRecipes` service
- [ ] Returns structured JSON response `{ success: true }` or `{ success: false, error }`
- [ ] Handles errors gracefully (returns 500, does not expose internals)

## Component — RecipeCard
- [ ] Renders recipe image via Next.js `Image` component (or fallback)
- [ ] Shows title, description truncated to 2 lines
- [ ] Shows prep time + cook time as metadata
- [ ] Shows difficulty badge with appropriate DaisyUI color
- [ ] Links to `/recipes/[id]` detail page
- [ ] Has descriptive `alt` text on image
- [ ] Card is keyboard-focusable and has visible focus ring

## Component — RecipeFilters
- [ ] Renders filter chips: "All", "Easy", "Medium", "Hard"
- [ ] Active chip uses `btn-primary`, inactive uses `btn-ghost`
- [ ] Clicking a chip filters the displayed recipes client-side
- [ ] "All" is selected by default
- [ ] Has `"use client"` directive

## Component — RecipeIngredients
- [ ] Renders ingredient list from `RecipeIngredient[]` prop
- [ ] Each ingredient shows amount, unit, and name
- [ ] Checkboxes toggle on/off (client state only, no persistence)
- [ ] Checked items have strikethrough styling
- [ ] Has `"use client"` directive
- [ ] Labels associated with checkboxes for accessibility

## Component — RecipeSteps
- [ ] Renders numbered step list from `string[]` prop
- [ ] Steps are visually numbered (ordered list or manual numbering)
- [ ] Steps have adequate spacing for readability

## Component — RecipeImage
- [ ] Uses Next.js `Image` component when `imageUrl` is provided
- [ ] Shows emoji fallback when `imageUrl` is null (recipe-related emoji grid)
- [ ] Fade-in animation when image loads (reuses pattern from `BoxImage`)
- [ ] Has `"use client"` directive
- [ ] Descriptive `alt` text

## Page — Recipe Gallery (app/recipes/page.tsx)
- [ ] Server component (no `"use client"`)
- [ ] Fetches recipes via `getRecipesForUser()` from `lib/services/recipes.ts` (no direct Supabase calls in page)
- [ ] Renders `RecipeFilters` + grid of `RecipeCard` components
- [ ] Responsive grid: 1 column on mobile, 2 columns on desktop
- [ ] Shows empty state when no recipes exist ("No recipes yet" message)
- [ ] Has proper metadata (title, description)

## Page — Recipe Detail (app/recipes/[id]/page.tsx)
- [ ] Server component (no `"use client"`)
- [ ] Fetches single recipe via `getRecipeById()` from `lib/services/recipes.ts` (no direct Supabase calls in page)
- [ ] Shows 404 (`notFound()`) for invalid/missing recipe ID
- [ ] Renders hero image via `RecipeImage`
- [ ] Renders title, description, prep time, cook time, servings, difficulty
- [ ] Renders `RecipeIngredients` component
- [ ] Renders `RecipeSteps` component
- [ ] Renders tips section (if tips array is non-empty)
- [ ] "Back to recipes" link present and functional
- [ ] `generateMetadata` exports dynamic title/description from recipe data

## Loading Skeletons
- [ ] `app/recipes/loading.tsx` — filter chip skeletons + 3 card skeletons in grid
- [ ] `app/recipes/[id]/loading.tsx` — hero image skeleton + title + ingredient list skeleton + step list skeleton
- [ ] Skeletons use DaisyUI `skeleton` class
- [ ] Layout matches actual page structure

## Dev Panel Addition
- [ ] "Generate Recipes" button visible in dev panel
- [ ] Button disabled when no confirmed box exists for active user
- [ ] Button shows loading spinner during generation
- [ ] Calls `/api/recipes/generate` via `fetch()` on click
- [ ] Success feedback shown after generation completes (toast or status text)
- [ ] Calls `router.refresh()` after successful generation to update pages

## Navigation Integration
- [ ] "Recipes" link added to app navigation
- [ ] Link navigates to `/recipes`
- [ ] Link is visible on both mobile and desktop layouts

## Confirmation Page Teaser
- [ ] `/confirm` page shows "View Recipes" link when recipes exist for the confirmed box
- [ ] Link is hidden when no recipes exist yet
- [ ] Link navigates to `/recipes`

## Accessibility
- [ ] All images have descriptive `alt` text
- [ ] Skeleton components have `aria-busy="true"` and `aria-label="Loading"`
- [ ] Filter chips are keyboard-navigable
- [ ] Recipe cards are keyboard-focusable with visible focus rings
- [ ] Ingredient checkboxes have associated `<label>` elements
- [ ] Steps use semantic ordered list (`<ol>`) or equivalent
- [ ] All interactive elements have `min-h-[44px]` touch targets
- [ ] Page headings use proper hierarchy (`<h1>`, `<h2>`)
- [ ] Color contrast meets WCAG AA for all text

## Code Quality
- [ ] `import "server-only"` on `lib/services/recipes.ts` and `lib/services/recipe-generation.ts`
- [ ] `lib/services/recipes.ts` uses `createClient()` (RLS-respecting) for reads
- [ ] `lib/services/recipe-generation.ts` uses `createServiceClient()` only for Storage uploads and DB inserts during generation
- [ ] `"use client"` directive on all client components (RecipeCard, RecipeFilters, RecipeIngredients, RecipeImage)
- [ ] No `SELECT *` queries — explicit column selection
- [ ] DaisyUI semantic classes used (no raw Tailwind colors)
- [ ] Apostrophes escaped with `&apos;` in JSX text
- [ ] No secrets or API keys in committed code
- [ ] `GEMINI_API_KEY` only referenced via `process.env`
- [ ] Types imported from `lib/types/recipes.ts` (no inline type definitions)
