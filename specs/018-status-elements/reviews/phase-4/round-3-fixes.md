# Phase 4, operator round 3: fixes (T044a, label fix-1; also resolves round 2, O2-01)

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| O3-01 | fixed: the Baseline bodies take the harness from their runner (`pillScenarios({ fontLoaded })`); the icon-only pill's pixel pin only on the strict-CSP fixture, in process only the font-independent facts from token values (row `icon-row bare`, top above the text, width, icon wrapper top, least height); FreeSans reproduction fails before and passes after | none possible: test-only and behaviour-neutral, `red.sh 4 fix-1` on `ccd9c5a5` reports `red: false` (not recorded); the three plants hand-applied instead, each killed in both harnesses (`notes.md` § Operator rounds 2 and 3 fix, `plants.md` § T044a) | `packages/elements/test/scenarios/pill-tag.ts`, `packages/elements/test/pill-tag.test.ts`, `packages/elements/test/browser/pill-tag.test.ts` (`ccd9c5a5`) |
| O2-01 | fixed: as O3-01, which amends its in-process facts | as O3-01 | as O3-01 |
