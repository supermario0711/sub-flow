# Security Audit Report

**Date**: 2026-01-31 19:50
**Auditor**: Claude Security Auditor
**Scope**: Full application security review
**Project**: Sub-Flow (Biokiste) at /Users/marioottmann/Coding/sub-flow

---

## Executive Summary

Sub-Flow is an **MVP/demo application** for managing weekly veggie box subscriptions. It uses Next.js 16 with App Router, Supabase as the backend, and is deployed on Vercel. The application intentionally does not implement authentication -- it uses a simulation cookie to enable quick persona switching, which is a core demo feature. Open RLS policies are also intentional to support this workflow.

**Note:** Authentication, RLS enforcement, and the dev panel are **intentionally open** for this MVP phase. Findings F1, F2, F5, F6, and F11 are acknowledged by design and excluded from severity counts. They are retained as **pre-production reminders** only.

The actionable findings for the current MVP relate to CSP weaknesses (`unsafe-inline`/`unsafe-eval`), an ilike wildcard injection in `searchItems`, and missing rate limiting.

**Findings (MVP-adjusted):**
- CRITICAL: 0
- HIGH: 2
- MEDIUM: 4
- LOW: 1
- INFO (pre-production): 5

## Architecture Risk Score (MVP context)

- **Authentication & Authorization**: N/A (intentionally open for MVP demo -- quick persona switching is a core feature)
- **Data Isolation (RLS & Storage)**: N/A (intentionally open to support unauthenticated persona switching)
- **API Surface & Endpoints**: 6/10 -- Server Actions validate UUIDs and check business logic. No API routes are exposed. However, no rate limiting exists.
- **Infrastructure & Dependencies**: 7/10 -- No vulnerable dependencies. Security headers are mostly configured. CSP has significant weaknesses.

**Overall Security Score (MVP-adjusted)**: 6/10

This score excludes intentional MVP design decisions (no auth, open RLS, dev panel). The remaining findings are actionable improvements for the current phase.

---

## Findings

### [INFO - Pre-Production] F1 - All RLS Policies Allow Unrestricted Access (Intentional for MVP)

**Location:** `/Users/marioottmann/Coding/sub-flow/supabase/migrations/001_initial_schema.sql` (lines 69-82), `002_phase3_rls.sql`, `003_swap_history_delete.sql`, `004_box_items_insert.sql`, `005_vacations.sql`, `007_patterns.sql`

**Description:** Every RLS policy on every table uses `USING (true)` and `WITH CHECK (true)`. This means any client with the Supabase anon key (which is exposed as `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`) can read, insert, update, and delete any row in any table.

**Impact:** An attacker who obtains the Supabase URL and anon key (both are in client-side environment variables) can directly call the Supabase REST API to read all user data, delete all records, insert arbitrary data, or modify any box/item/pattern. This bypasses all server-side validation in Server Actions.

**Evidence:**
```sql
-- 001_initial_schema.sql
CREATE POLICY "items_read" ON items FOR SELECT USING (true);
CREATE POLICY "users_read" ON users FOR SELECT USING (true);
CREATE POLICY "boxes_read" ON boxes FOR SELECT USING (true);
CREATE POLICY "box_items_read" ON box_items FOR SELECT USING (true);

-- 002_phase3_rls.sql
CREATE POLICY "box_items_update" ON box_items FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "box_items_delete" ON box_items FOR DELETE USING (true);
CREATE POLICY "boxes_update" ON boxes FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "swap_history_insert" ON swap_history FOR INSERT WITH CHECK (true);
```

**Remediation:** For production, implement proper auth-based RLS policies:
```sql
-- Example: users can only read/modify their own boxes
CREATE POLICY "boxes_select_own" ON boxes
  FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "boxes_update_own" ON boxes
  FOR UPDATE USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));
```

**References:** OWASP A01:2021 - Broken Access Control

---

### [INFO - Pre-Production] F2 - No Authentication System (Intentional for MVP)

**Location:** Application-wide -- no auth middleware, no login flow, no session validation

**Description:** The application has no authentication. User identity is determined entirely by a `sim` cookie that can be set by anyone. All Server Actions operate on behalf of whichever user slug is in the cookie, without verifying identity.

**Impact:** Any user can impersonate any demo persona. In a production context, this means any user can act as any other user. The simulation cookie is set with `httpOnly: false`, making it readable and writable by client-side JavaScript.

**Evidence:**
```typescript
// /Users/marioottmann/Coding/sub-flow/lib/simulation/state.ts line 50
cookieStore.set(COOKIE_NAME, JSON.stringify(state), {
  path: "/",
  httpOnly: false,   // Accessible to JS
  sameSite: "lax",
  maxAge: 60 * 60 * 24,
});
```

```typescript
// /Users/marioottmann/Coding/sub-flow/middleware.ts line 51
response.cookies.set("sim", JSON.stringify(current), {
  path: "/",
  httpOnly: false,   // Accessible to JS
  sameSite: "lax",
  maxAge: 60 * 60 * 24,
});
```

**Remediation:** For production, implement Supabase Auth with `@supabase/ssr` (already in dependencies). Add auth checks in middleware and Server Actions using `supabase.auth.getUser()`.

**References:** OWASP A07:2021 - Identification and Authentication Failures

---

### [HIGH] F3 - SQL Injection via ilike in searchItems

**Location:** `/Users/marioottmann/Coding/sub-flow/app/actions/add-item.ts` line 106

**Description:** The `searchItems` server action passes user input directly into an `ilike` filter without escaping SQL wildcards (`%`, `_`). While the Supabase client uses parameterized queries (preventing classic SQL injection), the `%` wrapping allows users to craft patterns using SQL wildcards to enumerate data.

More critically, the `not("id", "in", ...)` filter on line 111 constructs a raw parenthesized string from `currentItemIds`. While these IDs come from the database (not user input), the pattern is fragile.

**Impact:** A user can use `_` wildcards in search to enumerate items in ways not intended. The risk of full SQL injection is low due to parameterized queries, but the ilike pattern injection allows information disclosure beyond intended search behavior.

**Evidence:**
```typescript
// /Users/marioottmann/Coding/sub-flow/app/actions/add-item.ts line 106
.ilike("name", `%${trimmed}%`)
```

**Remediation:** Escape SQL wildcard characters before passing to ilike:
```typescript
function escapeLike(str: string): string {
  return str.replace(/[%_\\]/g, "\\$&");
}

// Usage:
.ilike("name", `%${escapeLike(trimmed)}%`)
```

**References:** OWASP A03:2021 - Injection

---

### [HIGH] F4 - CSP Allows unsafe-inline and unsafe-eval for Scripts

**Location:** `/Users/marioottmann/Coding/sub-flow/next.config.ts` line 32

**Description:** The Content-Security-Policy header includes `'unsafe-inline'` and `'unsafe-eval'` in the `script-src` directive. This effectively negates the XSS protection that CSP is designed to provide.

**Impact:** If an XSS vulnerability exists anywhere in the application, the attacker can execute arbitrary inline scripts and use `eval()`. CSP provides no meaningful defense.

**Evidence:**
```typescript
"script-src 'self' 'unsafe-inline' 'unsafe-eval'",
```

**Remediation:** Use nonce-based CSP instead:
```typescript
"script-src 'self' 'nonce-${nonce}'",
```
Next.js supports nonce-based CSP via middleware. Remove `unsafe-inline` and `unsafe-eval`. If Next.js requires inline scripts, use the nonce approach documented in the Next.js security documentation.

**References:** OWASP CSP Cheat Sheet

---

### [INFO - Pre-Production] F5 - Dev Panel Accessible in Production with No Protection (Intentional for MVP)

**Location:** `/Users/marioottmann/Coding/sub-flow/app/dev/page.tsx`, `/Users/marioottmann/Coding/sub-flow/app/dev/layout.tsx`

**Description:** The `/dev` route provides a dev panel that allows switching personas, manipulating time simulation, and resetting all database data via `resetAllBoxes()`. There is no access restriction -- no auth check, no environment check, no middleware protection.

**Impact:** In production, anyone can navigate to `/dev` and reset all user data, switch between personas, or manipulate the time simulation state.

**Evidence:**
```typescript
// /Users/marioottmann/Coding/sub-flow/app/dev/page.tsx line 199
startResetTransition(async () => {
  await resetAllBoxes();  // Deletes and resets all user data
  router.refresh();
});
```

**Remediation:** Either:
1. Remove the `/dev` route from production builds
2. Add middleware protection:
```typescript
// In middleware.ts
if (request.nextUrl.pathname.startsWith('/dev')) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.redirect(new URL('/', request.url));
  }
}
```

---

### [INFO - Pre-Production] F6 - resetAllBoxes Server Action Has No Authorization (Intentional for MVP)

**Location:** `/Users/marioottmann/Coding/sub-flow/app/actions/reset.ts` line 81

**Description:** The `resetAllBoxes()` server action deletes vacations, patterns, swap history, and box items for ALL users, then re-seeds the data. It has no authorization check and can be called by any client.

**Impact:** Any visitor can trigger a full data reset for all users by invoking the server action.

**Remediation:** Add environment or auth checks:
```typescript
export async function resetAllBoxes(): Promise<ActionResult> {
  if (process.env.NODE_ENV === 'production') {
    return { success: false, error: "Not available in production." };
  }
  // ...existing logic
}
```

---

### [MEDIUM] F7 - Server Actions Lack Rate Limiting

**Location:** All files in `/Users/marioottmann/Coding/sub-flow/app/actions/`

**Description:** No rate limiting is implemented on any Server Action. Functions like `searchItems`, `swapItem`, `resetAllBoxes`, `addVacation` can be called at unlimited frequency.

**Impact:** An attacker can flood the server with requests, causing excessive database load. The `searchItems` function is particularly concerning as it performs multiple database queries per call.

**Remediation:** Implement rate limiting via Vercel's built-in rate limiting or an in-memory store:
```typescript
import { headers } from 'next/headers';
// Use Vercel KV or upstash/ratelimit for production rate limiting
```

---

### [MEDIUM] F8 - Missing X-XSS-Protection Header

**Location:** `/Users/marioottmann/Coding/sub-flow/next.config.ts`

**Description:** The `X-XSS-Protection: 1; mode=block` header is not included in the security headers configuration. While modern browsers rely on CSP rather than this header, it provides defense-in-depth for older browsers.

**Impact:** Older browsers that support this header will not have XSS auditing enabled.

**Remediation:** Add to the securityHeaders array:
```typescript
{
  key: "X-XSS-Protection",
  value: "1; mode=block",
},
```

---

### [MEDIUM] F9 - Overly Broad img-src CSP Directive

**Location:** `/Users/marioottmann/Coding/sub-flow/next.config.ts` line 34

**Description:** The CSP `img-src` directive allows `https:` (any HTTPS origin) which is overly permissive.

**Impact:** Enables loading images from any HTTPS source, which could be used for tracking pixels or in conjunction with other attacks.

**Evidence:**
```typescript
"img-src 'self' data: https:",
```

**Remediation:** Restrict to known domains:
```typescript
"img-src 'self' data: https://gdctgzdtxnenzvnueszd.supabase.co",
```

---

### [LOW] F10 - patterns.ts Uses SELECT * Query

**Location:** `/Users/marioottmann/Coding/sub-flow/lib/services/patterns.ts` line 93

**Description:** The `getActivePatterns` function uses `.select("*")` which returns all columns from the patterns table, including potentially sensitive or unnecessary fields.

**Evidence:**
```typescript
const { data } = await supabase
  .from("patterns")
  .select("*")   // Returns all columns
  .eq("user_id", userId)
  .eq("is_active", true)
```

**Remediation:** Specify only needed columns:
```typescript
.select("id, user_id, type, item_id, confidence, occurrences, last_triggered_at, rejection_count, is_active")
```

---

### [INFO - Pre-Production] F11 - Simulation Cookie Not httpOnly (Intentional for MVP)

**Location:** `/Users/marioottmann/Coding/sub-flow/lib/simulation/state.ts` line 52, `/Users/marioottmann/Coding/sub-flow/middleware.ts` line 53

**Description:** The `sim` cookie is set with `httpOnly: false`, making it accessible to client-side JavaScript. While this may be intentional for the dev panel, it increases the impact of any XSS vulnerability.

**Remediation:** Set `httpOnly: true` unless client-side access is specifically required.

---

### [LOW] F12 - No Production Source Map Configuration

**Location:** `/Users/marioottmann/Coding/sub-flow/next.config.ts`

**Description:** The Next.js config does not explicitly disable production source maps via `productionBrowserSourceMaps: false`. While this defaults to false in Next.js, it should be explicitly set to prevent accidental exposure.

**Remediation:** Add to next.config.ts:
```typescript
const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,
  // ...existing config
};
```

---

## Recommendations Summary

### Actionable Now (MVP)

1. **High Priority (P1)**:
   - F3: Escape SQL wildcards in searchItems ilike filter
   - F4: Replace `unsafe-inline` and `unsafe-eval` in CSP with nonce-based approach

2. **Medium Priority (P2)**:
   - F7: Implement rate limiting on Server Actions
   - F8: Add X-XSS-Protection header
   - F9: Restrict img-src CSP directive
   - F10: Use explicit column selects instead of `SELECT *`
   - F12: Explicitly disable production source maps

### Pre-Production Checklist (before leaving MVP)

- F1: Replace all `USING (true)` RLS policies with auth-based policies
- F2: Implement Supabase Auth
- F5: Restrict `/dev` route to non-production environments
- F6: Add authorization to resetAllBoxes
- F11: Set simulation cookie to httpOnly (or remove in favor of auth sessions)

---

## Compliance Checklist

- [ ] OWASP Top 10 compliance -- FAILS on A01 (Broken Access Control), A07 (Auth Failures)
- [x] Security headers configured -- Mostly complete, missing X-XSS-Protection
- [x] RLS enabled on all tables -- Enabled but policies are permissive
- [ ] RLS policies enforce actual access control -- All use USING (true)
- [x] No storage buckets configured (N/A)
- [x] No Realtime configured (N/A)
- [x] Using @supabase/ssr (not deprecated auth-helpers) -- Confirmed in package.json
- [x] middleware.ts matcher covers routes -- Covers all non-static routes
- [x] Input validation implemented -- UUID validation on all Server Actions
- [x] No secrets in client code -- Only publishable key exposed (expected)
- [x] XSS prevention measures -- No dangerouslySetInnerHTML, no localStorage usage
- [ ] Rate limiting active -- Not implemented
- [x] pnpm audit shows no critical/high vulnerabilities -- Clean audit
- [x] Package versions pinned (no ^, ~, latest) -- All exact versions
- [x] Lock file committed and up-to-date -- pnpm-lock.yaml present
- [x] All endpoints use Server Actions (no raw API routes)
- [ ] Production sourcemaps explicitly disabled
- [ ] Dev panel protected in production
- [x] .env files in .gitignore -- Confirmed
- [ ] MFA enforced for admin accounts -- N/A (no auth)

---

**Report generated**: 2026-01-31 19:50
**Saved to**: /Users/marioottmann/Coding/sub-flow/security-reviews/security-audit-2026-01-31-1950.md
