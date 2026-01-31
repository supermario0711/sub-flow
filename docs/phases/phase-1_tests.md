# Phase 1: Test Plan

## Prerequisites

- [ ] `.env.local` has valid `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- [ ] Migration `001_initial_schema.sql` applied to Supabase project
- [ ] Seed data (`supabase/seed.sql`) loaded

## Tests

### 1. Build & Lint
- [ ] `pnpm lint` passes with no errors
- [ ] `pnpm build` succeeds with zero errors

### 2. Routing
- [ ] `/` redirects to `/box`
- [ ] `/box` renders without error
- [ ] `/confirm` renders "Confirmation" heading
- [ ] `/recipes` renders "Recipes" heading
- [ ] Non-existent route (e.g. `/xyz`) shows 404

### 3. Box Page — Data
- [ ] `/box` displays 5 items for Sarah&apos;s draft box
- [ ] Each item shows emoji, name, and category badge
- [ ] Week date and status ("draft") are displayed
- [ ] No hardcoded data — disabling Supabase env vars causes an empty/error state

### 4. Security Headers
Open `/box` in browser DevTools > Network > Response Headers:
- [ ] `X-Frame-Options: DENY`
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `Strict-Transport-Security` present
- [ ] `Content-Security-Policy` present and includes Supabase URL in `connect-src`
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`

### 5. Code Quality
- [ ] No direct Supabase client import outside `lib/supabase/`
- [ ] All `.select()` calls specify explicit columns (no `SELECT *`)
- [ ] `lib/supabase/server.ts` imports `"server-only"`
