# Phase 1 review, round 1: fixes

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| R1-01 | fixed: the "value column never widened" row now names operator decision (b)'s plant (the value tracks' `minmax(0, 1fr)` → `1fr`, two-column and stacked, together with the `<dd>`'s `min-inline-size: 0` removed), the unbroken-value body (600 px two-column sheet, 64-character value without `wrap`) as its body, and each single-rule change as equivalent, as plants.md § Resolution measured; T021 step 1's plant list aligned | none: documentation only (no behaviour change), red skipped per the review | specs/013-data-display/contracts/checks.md (CSS-only behaviours table); specs/013-data-display/tasks.md (T021 step 1) |
| R1-02 | deferred: note, no change required | none | packages/elements/src/ocelle-facts.ts |
| R1-03 | deferred: note, no change required | none | packages/elements/src/ocelle-facts.ts |
| R1-04 | deferred: note, a Tab read fits phase 2 once `pressTab()` exists | none | packages/elements/test/scenarios/facts.ts |
| R1-05 | deferred: note, no change required | none | storybook/baselines |
| R1-06 | fixed: R-02 now says the default is the `var()` fallback read on the probe, not a `:host` declaration | none: documentation only | specs/013-data-display/research.md (R-02, Threshold) |
| R1-07 | fixed: comma added ("listed, the eight") | none: wording only, the plant's defect and findings are unchanged | gates/plants/visual/fail-token-changed/plant.json |

Checks run after the fixes: `pnpm test` (`unit-tests: 3429 tests passed in 145 files`), `gate:lint`, `gate:typecheck`,
`gate:test-lint`, `gate:prefix`, `gate:config-copies`, all clean.
