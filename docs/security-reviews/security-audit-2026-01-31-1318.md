# Security Audit Report

**Date**: 2026-01-31
**Auditor**: Claude Security Auditor
**Scope**: Full application security review
**Project**: Sub-Flow (Biokiste)

---

## Executive Summary

This audit covers the Sub-Flow application, a Next.js 16 App Router application with a Supabase backend for managing weekly veggie box subscriptions. The application is in **MVP / demo mode** (Phase 1-2 complete), functioning as a read-only demo with a simulation system that switches between pre-seeded personas and time contexts. There is no authentication system in place — user switching is handled entirely via a simulation cookie, which is intentional for this stage.

Given the MVP context, several findings that would be critical in a production app are expected trade-offs right now. Notably, RLS policies use `USING (true)` because the simulation system impersonates users via cookie-based slugs rather than Supabase Auth — scoping RLS to `auth.uid()` would break the entire demo flow. Similarly, the `/dev` panel is a core part of the demo experience. These items are flagged as **deferred** and must be addressed before any user-facing or production deployment.

The actionable findings for the current MVP phase focus on CSP hardening, cookie security flags, input validation, and dependency pinning.

**Findings:**
- Critical: 0
- High: 1 (CSP)
- High (deferred to auth phase): 2 (RLS, dev panel)
- Medium: 5
- Low: 4

## Architecture Risk Score

- **Authentication & Authorization**: 2/10 (no auth implemented — intentional for MVP; simulation-based persona switching)
- **Data Isolation (RLS & Storage)**: 3/10 (RLS enabled but permissive SELECT — required by simulation system until auth is added)
- **API Surface & Endpoints**: 7/10 (minimal surface; server-only data access; no API routes exposed)
- **Infrastructure & Dependencies**: 6/10 (good security headers; unpinned dev deps; no known vulnerabilities)

**Overall Security Score**: 4.5/10

---

## Findings

### [HIGH] H-1: CSP Allows unsafe-inline and unsafe-eval for Scripts

**Location:** `next.config.ts`, lines 31-32
**Description:** The Content-Security-Policy `script-src` directive includes both `'unsafe-inline'` and `'unsafe-eval'`, which effectively negates XSS protection provided by CSP.
**Impact:** An attacker who finds an XSS vector can execute arbitrary JavaScript since inline scripts and eval are permitted.
**Evidence:**
```typescript
"script-src 'self' 'unsafe-inline' 'unsafe-eval'",
```
**Remediation:** Replace `unsafe-inline` with nonce-based CSP using Next.js middleware to generate per-request nonces. Remove `unsafe-eval` entirely.

---

### [HIGH — DEFERRED] H-2: RLS Policies Allow Unrestricted Read Access to All Tables

**Location:** `supabase/migrations/001_initial_schema.sql`, lines 69-82
**Description:** All five tables (`items`, `users`, `boxes`, `box_items`, `swap_history`) have RLS policies that allow any anonymous or authenticated user to SELECT all rows with `USING (true)`. The Supabase anon key is exposed client-side as `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`, meaning anyone can query all data directly.
**Impact:** Full data enumeration of all users, boxes, and swap history by any visitor.
**MVP context:** This is intentional. The simulation system switches personas via a cookie-based slug — there is no Supabase Auth session. Scoping RLS to `auth.uid()` would break all data access. This must be revisited when authentication is implemented.
**Evidence:**
```sql
CREATE POLICY "users_read" ON users FOR SELECT USING (true);
CREATE POLICY "boxes_read" ON boxes FOR SELECT USING (true);
CREATE POLICY "swap_history_read" ON swap_history FOR SELECT USING (true);
```
**Remediation (when auth is added):** Replace with scoped policies:
```sql
CREATE POLICY "boxes_read_own" ON boxes FOR SELECT
  USING (user_id = (select auth.uid()));
```

---

### [HIGH — DEFERRED] H-3: Dev Panel Accessible in Production Without Access Control

**Location:** `app/dev/page.tsx`
**Description:** The `/dev` route provides a simulation control panel allowing persona switching and time manipulation. No authentication, environment check, or access control exists.
**Impact:** Any production visitor can access `/dev`, switch to any persona, and view other users&apos; data.
**MVP context:** The dev panel is the primary way to interact with the demo. Blocking it would remove core demo functionality. This should be gated behind auth or an environment check before any public deployment.
**Remediation (pre-production):** Block `/dev` in production via middleware:
```typescript
if (request.nextUrl.pathname.startsWith('/dev') && process.env.NODE_ENV === 'production') {
  return NextResponse.rewrite(new URL('/404', request.url));
}
```

---

### [MEDIUM] M-1: Simulation Cookie Not httpOnly

**Location:** `middleware.ts:53`, `lib/simulation/state.ts:51`
**Description:** The `sim` cookie is set with `httpOnly: false`, making it readable by client-side JavaScript.
**Remediation:** Set `httpOnly: true` since the cookie is only read server-side.

---

### [MEDIUM] M-2: Simulation Cookie Missing secure Flag

**Location:** `middleware.ts:51-56`, `lib/simulation/state.ts:50-55`
**Remediation:** Add `secure: process.env.NODE_ENV === 'production'` to cookie options.

---

### [MEDIUM] M-3: No Input Validation on Server Action

**Location:** `lib/simulation/actions.ts:8-10`
**Description:** The `updateSimulation` server action accepts a `SimulationState` object but relies solely on TypeScript types for validation, which are erased at runtime.
**Evidence:**
```typescript
export async function updateSimulation(state: SimulationState): Promise<void> {
  await setSimulation(state);
}
```
**Remediation:** Add Zod runtime validation:
```typescript
import { z } from 'zod';
const SimulationSchema = z.object({
  userSlug: z.enum(['sarah', 'mark', 'lisa']),
  hoursUntilLock: z.number().min(0).nullable(),
});
```

---

### [MEDIUM] M-4: devDependencies Use Unpinned Version Ranges

**Location:** `package.json:20-28`
**Description:** Seven devDependencies use `^` version ranges (`@tailwindcss/postcss`, `@types/node`, `@types/react`, `@types/react-dom`, `eslint`, `tailwindcss`, `typescript`).
**Remediation:** Pin all to exact versions matching what is in pnpm-lock.yaml.

---

### [MEDIUM] M-5: No Rate Limiting on Any Endpoint or Server Action

**Location:** Application-wide
**Remediation:** Implement rate limiting via middleware or `@upstash/ratelimit`.

---

### [LOW] L-1: Missing X-XSS-Protection Header

**Location:** `next.config.ts`
**Remediation:** Add `{ key: "X-XSS-Protection", value: "1; mode=block" }` to security headers.

### [LOW] L-2: No images.domains Restriction in next.config.ts

**Location:** `next.config.ts`
**Remediation:** Configure `images.remotePatterns` to restrict allowed image hosts.

### [LOW] L-3: Production Source Maps Not Explicitly Disabled

**Location:** `next.config.ts`
**Remediation:** Add `productionBrowserSourceMaps: false` to nextConfig.

### [LOW] L-4: No Middleware Auth Session Refresh

**Location:** `middleware.ts`
**Description:** When authentication is implemented, middleware must call `supabase.auth.getUser()` to refresh sessions per `@supabase/ssr` requirements.

---

## Positive Findings

1. **@supabase/ssr usage** (v0.8.0) - correct, not deprecated auth-helpers
2. **server-only imports** on `lib/supabase/server.ts` and `lib/services/box.ts`
3. **Parameterized queries** via Supabase SDK - no SQL injection risk
4. **RLS enabled on all 5 tables**
5. **Good security headers baseline** (HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy)
6. **Production dependencies pinned** to exact versions in package.json
7. **.env files gitignored** via `.env*` pattern
8. **No secrets in source code** - only `NEXT_PUBLIC_` variables exposed
9. **pnpm audit clean** - no known vulnerabilities
10. **Cookie input validation** with userSlug allowlist and type checks in `lib/simulation/state.ts`

---

## Recommendations Summary

1. **High Priority (P1)**: Remove `unsafe-inline`/`unsafe-eval` from CSP
1. **Deferred to auth phase**: Scope RLS policies to `auth.uid()`; gate `/dev` route
2. **Medium Priority (P2)**: Fix cookie flags; add Zod validation; pin devDeps; add rate limiting
3. **Lower Priority (P3)**: Add X-XSS-Protection; configure image domains; disable source maps

---

## Compliance Checklist

- [ ] OWASP Top 10 compliance (CSP unsafe-eval/unsafe-inline violates A03:Injection)
- [x] Security headers configured (good baseline, CSP needs improvement)
- [x] RLS enabled on all tables
- [ ] RLS policies properly scoped (currently all USING (true) — intentional for MVP, deferred to auth phase)
- [x] Using @supabase/ssr (not deprecated auth-helpers)
- [x] middleware.ts matcher covers all routes
- [ ] Input validation implemented (no Zod or runtime validation on server actions)
- [x] No secrets in client code (only NEXT_PUBLIC_ variables exposed)
- [ ] Rate limiting active
- [x] pnpm audit clean
- [ ] Package versions pinned (devDependencies use ^)
- [x] Lock file committed
