# Phase 2.1 Test Checklist

## Build & Lint
- [ ] `pnpm lint` passes without errors
- [ ] `pnpm build` succeeds without errors

## Time Presets
- [ ] Dev panel shows three preset buttons: `0h`, `6h`, `24h`
- [ ] Clicking `0h` sets hours to 0 and highlights the button
- [ ] Clicking `6h` sets hours to 6 and highlights the button
- [ ] Clicking `24h` sets hours to 24 and highlights the button
- [ ] Custom hours input still works as before

## Quick Scenarios
- [ ] Dev panel shows 9 scenario buttons (3 personas x 3 time states)
- [ ] Each button label follows the format `"Name · TimeLayout"` (e.g. `"Sarah · Locked"`)
- [ ] Clicking a scenario updates both persona and hours in the current state display
- [ ] `Locked` scenarios set hours to `0`
- [ ] `Urgent` scenarios set hours to `6`
- [ ] `Browsing` scenarios set hours to `24`

## End-to-End: Dev Panel to Box View
- [ ] Select any `Locked` scenario → Launch Box View → box shows locked banner, no swap/add UI
- [ ] Select any `Urgent` scenario → Launch Box View → streamlined UI, quick actions only
- [ ] Select any `Browsing` scenario → Launch Box View → full UI with add sheet and browsing features
- [ ] Persona switching works correctly (items match the selected persona&apos;s box)
