# Phase 6: Recipe Experience

## Goal
Next-day recipe discovery — after confirming a box, users find a gallery of AI-generated recipes made from their box items, with full ingredients, steps, and food photography images.

## Scope Decisions (Hackathon)
- **Gemini 2.5 Flash** for recipe text generation — same model as box images, good structured output
- **Gemini 2.5 Flash** for recipe image generation — reuse existing image generation pattern from Phase 5
- **Supabase Storage** for recipe images — `recipe-images` bucket, same pattern as `box-images`
- **Vercel Function for generation** — recipe generation calls external Gemini API, so it uses a Vercel Function (`app/api/recipes/generate/route.ts`) per backend architecture rules
- **Service layer for reads** — `lib/services/recipes.ts` for all read queries, matching `lib/services/box.ts` and `lib/services/suggestions.ts` patterns
- **No cron jobs** — generation triggered via dev panel button; dev panel calls the Vercel Function endpoint
- **No real-time streaming** — generate → store → display on next load
- **3 recipes per box** — enough variety for demo, keeps generation fast

## Features

### Recipe Generation
Generate 3 recipes from confirmed box items using Gemini 2.5 Flash:

**Trigger:** Dev panel "Generate Recipes" button (simulates ~24h after confirmation)

**Generation Rules:**
- Each recipe must use at least 2 items from the confirmed box
- Recipes should be varied (e.g., soup, salad, stir-fry — not three salads)
- Include realistic prep time, cook time, and serving count
- Structured JSON output from Gemini (title, description, ingredients, steps, tips)

**Output per recipe:**
- `title` — Recipe name (e.g., "Roasted Root Vegetable Soup")
- `description` — 1-2 sentence summary
- `prep_time` — Minutes (e.g., 15)
- `cook_time` — Minutes (e.g., 30)
- `servings` — Number (e.g., 4)
- `difficulty` — `easy`, `medium`, or `hard`
- `ingredients` — JSON array of `{ name, amount, unit }` objects
- `steps` — JSON array of instruction strings
- `tips` — JSON array of optional tips/variations

### Recipe Image Generation
After recipe text is generated, generate a food photography image for each recipe:

**Prompt:** Built from recipe title + description: "A beautiful overhead food photography shot of [recipe title]: [description]. Plated on a ceramic dish, natural lighting, rustic kitchen background, editorial food photography style. No text or labels."

**Storage:** `recipe-images/{recipeId}.png` in Supabase Storage

### Recipe Gallery Page
Replace the placeholder at `app/recipes/page.tsx` with a full gallery:

- Grid of `RecipeCard` components (responsive: 1 col mobile, 2 col desktop)
- Each card shows: image (or placeholder), title, description, prep+cook time, difficulty badge
- Filter chips: "All", "Easy", "Medium", "Hard"
- Empty state when no recipes generated yet
- Only shows recipes for the active user&apos;s most recent confirmed box

### Recipe Detail Page
New dynamic route at `app/recipes/[id]/page.tsx`:

- Hero image (full-width, or emoji fallback)
- Title, description, metadata (prep time, cook time, servings, difficulty)
- Ingredients list with checkboxes (client-side state only, not persisted)
- Numbered steps
- Tips section (if any)
- "Back to recipes" link
- Dynamic metadata for SEO (`generateMetadata`)

### Recipe Filters
Client component for filtering the gallery:

- Horizontal chip row: "All" | "Easy" | "Medium" | "Hard"
- Active chip uses DaisyUI `btn-primary`, inactive uses `btn-ghost`
- Filters client-side (no server round-trip — only 3 recipes)

### Dev Panel Addition
Add "Generate Recipes" button to the existing dev panel:

- Only enabled when active user has a confirmed box
- Shows loading spinner during generation
- Calls `/api/recipes/generate` Vercel Function (fire-and-forget for images, awaits text)
- Success toast: "3 recipes generated!"

### Navigation Integration
Add "Recipes" link to the app navigation:

- Show in nav/header alongside existing links
- Badge or indicator when new recipes are available (recipes exist but haven&apos;t been viewed)

## Data Model

### New table: `recipes`
```sql
CREATE TABLE recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  box_id uuid NOT NULL REFERENCES boxes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id),
  title text NOT NULL,
  description text NOT NULL,
  prep_time int NOT NULL,
  cook_time int NOT NULL,
  servings int NOT NULL DEFAULT 4,
  difficulty text NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  ingredients jsonb NOT NULL DEFAULT '[]',
  steps jsonb NOT NULL DEFAULT '[]',
  tips jsonb NOT NULL DEFAULT '[]',
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_recipes_box_id ON recipes(box_id);
CREATE INDEX idx_recipes_user_id ON recipes(user_id);
```

### RLS on `recipes`
```sql
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recipes_read" ON recipes FOR SELECT USING (true);
CREATE POLICY "recipes_insert" ON recipes FOR INSERT WITH CHECK (true);
CREATE POLICY "recipes_update" ON recipes FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "recipes_delete" ON recipes FOR DELETE USING (true);
```

### Supabase Storage Bucket
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('recipe-images', 'recipe-images', true);

CREATE POLICY "recipe_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'recipe-images');

CREATE POLICY "recipe_images_service_write"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'recipe-images');
```

### TypeScript Types
```typescript
export type Recipe = {
  id: string;
  box_id: string;
  user_id: string;
  title: string;
  description: string;
  prep_time: number;
  cook_time: number;
  servings: number;
  difficulty: "easy" | "medium" | "hard";
  ingredients: RecipeIngredient[];
  steps: string[];
  tips: string[];
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

export type RecipeIngredient = {
  name: string;
  amount: string;
  unit: string;
};
```

## Architecture Decisions

- **Vercel Function for generation** — recipe generation calls external Gemini API; per backend architecture decision tree, external API integrations use Vercel Functions (`app/api/`)
- **Service layer for reads** — read queries live in `lib/services/recipes.ts` with `import "server-only"`, matching the `lib/services/box.ts` and `lib/services/suggestions.ts` pattern; pages call services, never Supabase directly
- **`createClient()` for reads, `createServiceClient()` for Storage** — service read functions use RLS-respecting `createClient()` from `lib/supabase/server`; only Storage uploads use `createServiceClient()` from `lib/supabase/service` (same split as Phase 5)
- **Fire-and-forget for images** — recipe text is awaited (needed for display), but image generation runs in background (non-critical, same pattern as Phase 5 box images)
- **JSONB for ingredients/steps/tips** — avoids junction tables for structured data that&apos;s always read as a whole; Supabase handles JSONB natively
- **Recipes tied to box_id** — each generation is for a specific confirmed box, enabling "recipes from your box" UX
- **Client-side filtering** — only 3 recipes per box, no need for server-side filtering
- **Ingredient checkboxes are ephemeral** — no persistence needed for a demo; `useState` is sufficient

## Files to Create
- `supabase/migrations/009_recipes.sql` — recipes table + RLS + storage bucket + policies
- `lib/types/recipes.ts` — `Recipe`, `RecipeIngredient` types
- `lib/services/recipes.ts` — `getRecipesForUser(userSlug)`, `getRecipeById(id)`: read queries using `createClient()` (uses `import "server-only"`)
- `lib/services/recipe-generation.ts` — `generateRecipes(boxId, userId, items)`: calls Gemini for recipe text, inserts into DB, fires off image generation (uses `import "server-only"`, `createServiceClient()` for Storage uploads)
- `app/api/recipes/generate/route.ts` — POST endpoint: validates input, calls `generateRecipes` service, returns JSON response
- `components/recipes/recipe-card.tsx` — Client component: card for gallery with image, title, metadata
- `components/recipes/recipe-filters.tsx` — Client component: difficulty filter chips
- `components/recipes/recipe-ingredients.tsx` — Client component: ingredient list with checkboxes
- `components/recipes/recipe-steps.tsx` — Component: numbered step list
- `components/recipes/recipe-image.tsx` — Client component: recipe image with fallback (reuses pattern from `components/confirm/box-image.tsx`)
- `app/recipes/page.tsx` — Replace placeholder with full gallery (server component)
- `app/recipes/[id]/page.tsx` — Recipe detail page with `generateMetadata`
- `app/recipes/loading.tsx` — Route-level loading skeleton for `/recipes`
- `app/recipes/[id]/loading.tsx` — Route-level loading skeleton for recipe detail

## Files to Modify
- `lib/types/database.ts` — Add `Recipe` and `RecipeIngredient` to exports (or re-export from `recipes.ts`)
- `app/confirm/page.tsx` — Add "View Recipes" teaser link when recipes exist for the confirmed box
- `app/dev/page.tsx` — Add "Generate Recipes" button with loading state
- `app/actions/box.ts` — (Optional) Auto-trigger recipe generation after confirm if desired
- Navigation component — Add "Recipes" link

## Data Flow

```
Dev Panel: "Generate Recipes" button
  → fetch("/api/recipes/generate", { method: "POST", body: { userSlug } })

/api/recipes/generate (Vercel Function)
  → validate input
  → get latest confirmed box for user (via createClient)
  → get box items
  → call generateRecipes(boxId, userId, items) service
    → call Gemini 2.5 Flash with structured prompt
    → parse JSON response → 3 recipes
    → insert recipes into DB (via createServiceClient)
    → for each recipe: fire generateRecipeImage(recipeId, title, description)
      (no await — runs in background)
  → return { success: true }

/recipes (server page)
  → getRecipesForUser(userSlug) from lib/services/recipes.ts
    → createClient() → supabase.from("recipes").select(...)
  → render RecipeCard grid with RecipeFilters

/recipes/[id] (server page)
  → getRecipeById(id) from lib/services/recipes.ts
    → createClient() → supabase.from("recipes").select(...).single()
  → render hero image + RecipeIngredients + RecipeSteps + tips

generateRecipeImage (server-only, background)
  → build prompt from recipe title + description
  → call Gemini 2.5 Flash image generation
  → upload PNG to Supabase Storage 'recipe-images/{recipeId}.png' (createServiceClient)
  → update recipes.image_url with public URL (createServiceClient)
```

## Environment Variables
- `GEMINI_API_KEY` — Already exists from Phase 5, reused for recipe text + image generation

## Status
**Not started**
