# Phase 2, review round 4: fixes

Operator round at landing (PR #44), task T049 (`reviews/landing/round-1-tasks.md`).

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| R4-01 | fixed: `#headerChanged` in `packages/elements/src/ocelle-card.ts` passes `event.currentTarget`, the card's own `header` slot that the listener is on, to `notifyHeaders`, never `event.target`; a `slotchange` from a wrapper's slot forwarded into the `header` slot no longer replaces the card's list of headers with that slot's. No other source file changes; `custom-elements.json` is unchanged (`gate:manifest` passes). Pairing plant (`event.target` restored) in `plants.md` § Review round 4 fix. | `fix-4` 1926756 (tests only), recorded by `red.sh 2 fix-4` (`red-fix-4.log`: "2 of 3596 tests failed", only the new scenario "R-05 forwarded slot (phase 2 review R4-01)" in `test/card.test.ts` (`elements`) and `test/browser/card.test.ts` (`elements-browser`), each an `AssertionError`: the third state `compact` where `regular` is expected; the fixture run's CSP, request and console record is clean). The scenario is in `test/scenarios/card.ts`; the wrapper's shadow root is built and acted on by four driver primitives, `shadow`, `shadowAppend`, `shadowAttribute` and `shadowComputed`, in `test/scenarios/driver.ts`, `test/in-process.ts` and `test/browser/driver.ts` (exempt plumbing as T007: no `style` attribute, no inline script). | packages/elements/src/ocelle-card.ts; packages/elements/test/scenarios/card.ts, scenarios/driver.ts, in-process.ts, browser/driver.ts (fix-4); reviews/phase-2/plants.md |

## Checks at the fix

| Check | Result |
|---|---|
| `pnpm exec vitest run --project elements --project elements-browser test/card.test.ts test/browser/card.test.ts` | 45 passed |
| `gate:typecheck`, `gate:lint` (304 files), `gate:csp` (24 files), `gate:manifest` (7 elements, unchanged) | pass |

`pnpm test`, `gate:test-lint` and `gate:mutation` run at the end of the landing fix rounds; their results are in the
round's report.
