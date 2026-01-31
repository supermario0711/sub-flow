# Phase 3.3 Test Checklist

## Build & Lint
- [ ] `pnpm lint` passes without errors
- [ ] `pnpm build` succeeds without errors

## Auto-Confirm at Deadline
- [ ] Draft box with hours ≤ 0 is auto-confirmed (status set to `confirmed`)
- [ ] Auto-confirm sets `confirmed_at` to current timestamp
- [ ] Auto-confirm sets `updated_at` to current timestamp
- [ ] After auto-confirm, user is redirected to `/confirm`

## Lock Routing
- [ ] Draft box with hours ≤ 0 redirects to `/confirm`
- [ ] Confirmed box with hours ≤ 0 redirects to `/confirm`
- [ ] Draft box with hours > 0 stays on `/box` (no redirect)
- [ ] Confirmed box with hours > 0 stays on `/box` (no redirect)

## Revert to Draft on Edit
- [ ] Swapping an item on a confirmed box reverts status to `draft`
- [ ] Removing an item from a confirmed box reverts status to `draft`
- [ ] `updated_at` is set when reverting to draft
- [ ] Confirm button reappears in box view after revert
- [ ] Swapping an item on a draft box keeps status as `draft` (no-op)
- [ ] Removing an item from a draft box keeps status as `draft` (no-op)

## Edit Box from /confirm
- [ ] Clicking "Edit Box" on `/confirm` reverts box status to `draft`
- [ ] After clicking "Edit Box", user is redirected to `/box`
- [ ] Confirmed banner does not show on `/box` after edit
- [ ] Confirm button is visible on `/box` after edit
- [ ] `updated_at` is set when reverting via "Edit Box"
- [ ] "Edit Box" button is hidden when hours ≤ 0 (box is locked)
- [ ] Invalid box ID is handled gracefully (redirects to `/box`)

## Re-Confirm After Edit
- [ ] After reverting to draft, user can re-confirm the box
- [ ] Re-confirming redirects to `/confirm`
- [ ] `confirmed_at` is updated on re-confirm

## Path Revalidation
- [ ] `/box` is revalidated after swap
- [ ] `/box` is revalidated after remove
- [ ] `/confirm` is revalidated after swap
- [ ] `/confirm` is revalidated after remove
- [ ] `/box` is revalidated after "Edit Box"
- [ ] `/confirm` is revalidated after "Edit Box"

## Dev Panel Simulation
- [ ] Setting hours to 0 with a draft box triggers auto-confirm and redirect
- [ ] Setting hours to 0 with a confirmed box triggers redirect only
- [ ] Setting hours > 0 after confirming allows editing the box

## Code Quality
- [ ] No new `"use server"` files created (modifications only)
- [ ] No `SELECT *` queries — explicit column selection
- [ ] DaisyUI semantic classes used (no raw Tailwind colors)
- [ ] Apostrophes escaped with `&apos;` in JSX text
