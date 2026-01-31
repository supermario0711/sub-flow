# Phase 1: Foundation

**Goal:** Working Next.js app with data layer, seed data, and basic routing.

**Exit Criteria:** Can see a list of items in a box on screen, fetched from the database.

---

## Database: Supabase

Use Supabase (hosted Postgres) as the data layer. All access goes through the Supabase JS client (`@supabase/supabase-js`) — no direct `fs` or SQLite.

### Schema

```sql
-- Available products (vegetables & fruits)
create table items (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null check (category in ('vegetable', 'fruit')),
  emoji text not null,              -- display icon
  image_url text,                   -- optional photo URL
  is_seasonal boolean default false,
  created_at timestamptz default now()
);

-- User profiles (personas for demo)
create table users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,        -- 'sarah', 'mark', 'lisa'
  persona text not null,            -- 'new', 'experienced', 'power'
  created_at timestamptz default now()
);

-- Weekly box assigned to a user
create table boxes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  week_start date not null,         -- Monday of the week
  lock_at timestamptz not null,     -- deadline to confirm
  status text not null default 'draft' check (status in ('draft', 'confirmed', 'delivered')),
  confirmed_at timestamptz,
  image_url text,                   -- AI-generated box image (Phase 5)
  created_at timestamptz default now(),
  unique(user_id, week_start)
);

-- Items in a box (join table)
create table box_items (
  id uuid primary key default gen_random_uuid(),
  box_id uuid not null references boxes(id) on delete cascade,
  item_id uuid not null references items(id),
  position int not null,            -- display order 1-5
  added_at timestamptz default now(),
  unique(box_id, position)
);

-- Swap history (for pattern detection in Phase 4)
create table swap_history (
  id uuid primary key default gen_random_uuid(),
  box_id uuid not null references boxes(id) on delete cascade,
  user_id uuid not null references users(id),
  from_item_id uuid not null references items(id),
  to_item_id uuid not null references items(id),
  swapped_at timestamptz default now()
);
```

### Row-Level Security

Enable RLS on all tables. For Phase 1, use a permissive policy that allows all reads (public anon key). Write policies will be scoped per-user in later phases.

```sql
-- Read-only public access for all tables (sufficient for Phase 1)
alter table items enable row level security;
create policy "items_read" on items for select using (true);

alter table users enable row level security;
create policy "users_read" on users for select using (true);

alter table boxes enable row level security;
create policy "boxes_read" on boxes for select using (true);

alter table box_items enable row level security;
create policy "box_items_read" on box_items for select using (true);

alter table swap_history enable row level security;
create policy "swap_history_read" on swap_history for select using (true);
```

### Seed Data

**10 items** (5 vegetables, 5 fruits):

| Name       | Category  | Emoji |
|------------|-----------|-------|
| Carrot     | vegetable | :carrot: |
| Fennel     | vegetable | :herb: |
| Zucchini   | vegetable | :cucumber: |
| Broccoli   | vegetable | :broccoli: |
| Beetroot   | vegetable | :beet: (use generic) |
| Apple      | fruit     | :apple: |
| Pear       | fruit     | :pear: |
| Orange     | fruit     | :tangerine: |
| Banana     | fruit     | :banana: |
| Strawberry | fruit     | :strawberries: |

**3 users** with persona slugs: `sarah`, `mark`, `lisa`.

**3 boxes** (one per user for the current week) each containing 5 items in `draft` status, with `lock_at` set to Friday 10:00 CET.

**Swap history** for Mark (3 swaps of fennel -> zucchini across past weeks) and Lisa (varied swaps).

The seed data will live in `supabase/seed.sql` and run via `supabase db reset` locally.

---

## Project Structure

```
app/
  layout.tsx              — Root layout (fonts, theme, metadata)
  page.tsx                — Landing / redirect to /box
  box/
    page.tsx              — Box view (server component, fetches current box)
  confirm/
    page.tsx              — Confirmation page (placeholder)
  recipes/
    page.tsx              — Recipe gallery (placeholder)

lib/
  supabase/
    client.ts             — Browser Supabase client (createBrowserClient)
    server.ts             — Server Supabase client (createServerClient with cookies)
  types/
    database.ts           — TypeScript types generated from schema (or hand-written)

supabase/
  migrations/
    001_initial_schema.sql
  seed.sql
```

---

## Implementation Steps

### 1. Add Supabase dependencies

```bash
pnpm add @supabase/supabase-js @supabase/ssr
```

### 2. Environment variables

Create `.env.local` (git-ignored):

```
NEXT_PUBLIC_SUPABASE_URL=<project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

### 3. Supabase client utilities

**`lib/supabase/client.ts`** — Browser client using `createBrowserClient` from `@supabase/ssr`.

**`lib/supabase/server.ts`** — Server client using `createServerClient` from `@supabase/ssr` with Next.js cookie helpers.

### 4. TypeScript types

**`lib/types/database.ts`** — Hand-written types matching the schema above. Keep them minimal:

```ts
export type Item = {
  id: string
  name: string
  category: 'vegetable' | 'fruit'
  emoji: string
  image_url: string | null
  is_seasonal: boolean
}

export type User = {
  id: string
  name: string
  slug: string
  persona: 'new' | 'experienced' | 'power'
}

export type Box = {
  id: string
  user_id: string
  week_start: string
  lock_at: string
  status: 'draft' | 'confirmed' | 'delivered'
  confirmed_at: string | null
  image_url: string | null
}

export type BoxItem = {
  id: string
  box_id: string
  item_id: string
  position: number
}

export type SwapHistory = {
  id: string
  box_id: string
  user_id: string
  from_item_id: string
  to_item_id: string
  swapped_at: string
}
```

### 5. Database migration & seed

Create the migration file and seed file under `supabase/`. Use `supabase db reset` to apply locally during development.

### 6. Root layout & theme

Update `app/layout.tsx`:
- Set metadata (title: "Biokiste", description)
- Apply the Soft Garden color palette via CSS custom properties in `globals.css`
- Configure DaisyUI theme to use the palette colors
- Load Geist fonts

### 7. Box page (server component)

`app/box/page.tsx`:
- Fetch the current user&apos;s draft box (default to Sarah for now, persona switching comes in Phase 2)
- Join `box_items` with `items` to get full item details
- Render a simple list/grid of items showing name, emoji, and category
- No swap functionality yet — display only

### 8. Placeholder pages

- `app/confirm/page.tsx` — Static "Confirmation" heading
- `app/recipes/page.tsx` — Static "Recipes" heading

### 9. Landing page redirect

`app/page.tsx` — Redirect to `/box` using `redirect()` from `next/navigation`.

---

## Design Tokens (globals.css)

```css
@theme {
  --color-cream: #FAF9F6;
  --color-sage: #7D9F85;
  --color-stone: #E8E4DE;
  --color-terracotta: #D4A574;
  --color-sage-dark: #5C7A63;
  --color-text: #2D2D2D;
  --color-text-muted: #6B6B6B;
}
```

Configure DaisyUI to use a custom theme based on these tokens.

---

## Acceptance Criteria

- [ ] Supabase project connected, schema migrated, seed data loaded
- [ ] `/box` renders a list of 5 items for Sarah&apos;s current-week box
- [ ] Items show name, emoji, and category badge
- [ ] `/confirm` and `/recipes` render placeholder pages
- [ ] Root `/` redirects to `/box`
- [ ] TypeScript types match the database schema
- [ ] No hardcoded data — all fetched from Supabase
- [ ] `pnpm build` succeeds with zero errors
- [ ] `pnpm lint` passes

---

## Out of Scope (deferred to later phases)

- Persona switching & time simulation (Phase 2)
- Swap/remove interactions (Phase 3)
- Pattern detection & suggestions (Phase 4)
- Animations, AI images (Phase 5)
- Recipes (Phase 6)
- A2UI renderer (Phase 7)
