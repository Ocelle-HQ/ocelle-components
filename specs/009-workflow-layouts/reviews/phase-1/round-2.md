---
phase: 1
round: 2
verdict: approved
base: 2427d209fe9e84215c93348db7702f0444c2c535
head: ef57321534ef38df6e1a532005880814c1ce8203
tdd_check: pass
---

# Phase 1 review, round 2

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R2-01 | note | `reviews/phase-1/round-1-fixes.md` ("Still open outside this step") | The six baselines were regenerated in the pinned container and match locally (`gate:visual`: 42 captures match, docker only). The CI run of the branch that confirms them (T028, #10 FR-005) needs a push and has not happened yet. The fix note records the reason for the PR description (constitution V). | None in this phase: carry the CI confirmation and the baseline reason into the PR. |

## Test quality

- **Red evidence.** Unchanged from round 1: `red-commits` names `b47541b` (phase); `tdd-check.json` at HEAD
  `ef57321` reports `status: pass`, red exit 1, `final_tests_on_base_exit: 1`, `head_exit: 0`, no problems.
  `check-head.log`: `unit-tests: 3127 tests passed in 142 files`.
- **Fix without new red test.** R1-01 was a non-behavioural defect (stale baselines). The existing
  `gates/test/integration/visual.test.ts` tests failed for it in round 1 (`check-head.log` at `a02e49b`) and pass
  now, so no `fix-1` red entry is needed; round 1 said so explicitly.
- **No weakening.** `git show --stat ef57321` touches only the six PNG baselines and `round-1-fixes.md`; no test
  file changed since round 1. `git diff b47541b..HEAD` in test paths is still only the driver implementations,
  `serve.ts` and `test/fixtures/frames.css`, as reviewed in round 1.
- **Assertions.** `gate:test-lint`: 178 files, no finding.
- **Mutation.** `pnpm run gate:mutation -- --base 2427d20`: 26 mutants on the changed lines of
  `packages/tokens/src/source.ts`, none survived; 12 compile errors (reports), 0 timeouts, 0 zero-mutant entries,
  0 equivalent records.
- **Baselines inspected.** `storybook/baselines/tokens--space.light.png` shows 12 rows ending in
  `--ocelle-scroller-fade-size 2rem`, matching the 12 rows the token story test expects.

## Checks run

At HEAD `ef57321`, OCELLE_CHROMIUM_PATH set, one at a time:

| Check | Result |
|---|---|
| `pnpm test` (tdd check, `check-head.log`) | pass, 3127 tests in 142 files |
| `gate:visual` | pass, 42 captures match their baselines (docker only) |
| `gate:typecheck` | pass |
| `gate:lint` | pass, 268 files |
| `gate:style-lint` | pass, 12 files |
| `gate:test-lint` | pass, 178 files |
| `gate:config-copies` | pass |
| `gate:prefix` | pass, 204 files |
| `gate:pins` | pass, 5 manifests |
| `gate:contrast` | pass, 160 light / 168 dark pairs |
| `gate:brand-rules` | pass, 7 rules |
| `gate:manifest` | pass, 2 elements |
| `gate:csp` | pass, 10 files |
| `gate:signoff -- --range 2427d20..HEAD` | pass, 8 commits |
| `gate:storybook-build` | pass, 21 stories |
| `gate:axe` | pass, 42 runs, 0 serious or critical (10 excepted notes, pre-existing) |
| `gate:mutation --base 2427d20` | pass, 0 survivors |

Tasks, constitution and plan: unchanged since round 1 apart from the six baselines; T001 to T009 remain ticked and
present. Files changed since base outside `specs/` are the phase's token source, CHANGELOG, test support and the six
token-story baselines, all within this phase.

## Earlier findings

- **R1-01 (blocking): resolved.** `ef57321` regenerates exactly `tokens--type`, `tokens--space` and `tokens--shell`
  in light and dark (the fix note quotes `wrote 6 files (0 added, 6 changed, 0 removed)`). `gate:visual` now
  reports 42 matches, the three `visual.test.ts` failures are gone (`check-head.log`: 3127 passed), and
  `tdd-check.json` is `pass`. The reason for the change is recorded for the PR description.
- R1-02, R1-03 were notes; no change required.
