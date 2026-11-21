# Phase 1, review round 1: fixes

No red commit for this round. R1-01 and R1-02 are stale expectations in gate tests, not behaviour defects of the
code: both tests already fail at HEAD (`check-head.log`), and the fix brings their pinned counts up to the
repository this phase makes (16 new baselines, 16 new story-themes). No test is weakened: each still pins an exact
value. R1-03 to R1-05 are notes.

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| R1-01 | fixed: the baseline count is pinned at 404 (388 + the phase's 16 `elements-ocelle-disclosure--*` baselines; `ls storybook/baselines` gives 404). Run locally: `vitest run gates/test/integration/plant-repo.test.ts`, 33 passed. | none: the test was already red at HEAD (stale pin, not a code defect) | gates/test/integration/plant-repo.test.ts:225 |
| R1-02 | fixed: the unlabelled-button plant expects `axe: 2 findings in 406 story-theme runs` (404 + the plant's 2). Run locally: `vitest run gates/test/integration/axe.test.ts -t "unlabelled button"`, result below. | none: the test was already red at HEAD (stale pin, not a code defect) | gates/test/integration/axe.test.ts:68 |
| R1-03 | fixed: the plant record says 317, and records the `--list` recheck (`317 of 317 plants selected`, the same `note: affected:` line). | none: record only | specs/020-disclosure-code-block/reviews/phase-1/plants.md:5 |
| R1-04 | deferred: by the operator's CI-first decision the full plant run (the selection is every plant) is CI's required Plants check; the fix changes only two gate tests and adds no plant. | none | specs/020-disclosure-code-block/reviews/phase-1/plants.md |
| R1-05 | deferred: `tdd-check.sh 1` is rerun after this fix commit (it checks the committed HEAD); T013 is ticked once it reports `pass`, recording that its heavy gates (full plants, `gate:storybook-build`, `gate:visual`, `gate:axe` on the full Storybook, `gate:mutation`) are CI's. | none | specs/020-disclosure-code-block/tasks.md:209 |

## Checks run locally for the fix

- `gate:typecheck` (no type error), `gate:lint` (453 files, no finding), `gate:test-lint` (333 files, no finding),
  `gate:signoff -- --range c7ba57d..HEAD` (no finding).
- `vitest run gates/test/integration/plant-repo.test.ts`: 33 passed.
- `vitest run gates/test/integration/axe.test.ts -t "unlabelled button"`: 1 passed (the other 3 tests of the file filtered out), 245 s.
- `gate:plants -- --affected c7ba57d98f410d956c5c072302c8b34ae221dc5b --list`: 317 of 317 selected.

Left to CI: the full unit-tests run, the full plant set, `gate:storybook-build`, `gate:visual`, `gate:axe` on the
full Storybook and the mutation shards.
