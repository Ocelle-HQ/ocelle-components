---
phase: 2
round: 2
verdict: changes_requested
base: 296e02d1606eb51b2a2f7caa4ac8a1e5cc73ac0d
head: 9b8eab6d6d297fea8e4af049f0e9d125d2824e43
tdd_check: fail
---

# Phase 2 review, round 2

Scope: the whole phase, `git diff 296e02d..9b8eab6`. Since round 1 there are three commits: `9fea5fa` (fix-1 red,
tests only), `338f4e5` (the fix, the fix note, the red log and the plants addendum) and `9b8eab6` (the red/green check
outputs). The working tree was clean. I read the fix against spec.md FR-004, FR-005, FR-010 and FR-011, against
README.md § `ocelle-section-header`, against `round-1-fixes.md` and `plants.md` § Review round 1 fix, and against the
round 1 findings. I reread the whole of `packages/elements/src/ocelle-section-header.ts` at HEAD to look for
regressions outside the diff.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R2-01 | blocking | reviews/phase-2/tdd-check.json (`problems: ["tests fail at HEAD"]`); gates/test/integration/visual.test.ts:115, 126, 239, 251, 271 | Carried over from R1-01. The red/green check still reports `fail`. My `pnpm test` at `9b8eab6` fails 5 of 3304 tests, and all 5 are the container-engine tests of `visual.test.ts`. 115, 126, 251 and 271 fail because there is no docker or podman. 239 fails on `expected 42 to be 66`, because the twelve new story-themes have no baselines (T023). No other test fails. The fix touched none of these tests. Under operator decisions 2 and 3 this is a recorded known gap for `/ocelle-land`, and the implementer cannot fix it. The skill makes a `fail` problem blocking, so I record it as blocking here. Apart from this, the phase would be approved. | No code change. The operator accepts it under decisions 2 and 3, as for phase 1 (`reviews/phase-1/operator-accepted.md`). The tests go green when CI's captures are committed at `/ocelle-land`. |
| R2-02 | note | commits 1b9cc98, 671196d | Carried over from R1-03. `gate:signoff -- --range 296e02d..HEAD` reports 2 findings in 9 commits, on these two orchestrator commits only. `9fea5fa`, `338f4e5` and `9b8eab6` are signed off. | Orchestrator: these commits are rewritten at the phase fold. Check that the folded commits are signed off. |
| R2-03 | note | specs/011-layout-headers/research.md R-04 vs packages/elements/src/ocelle-section-header.ts:8-12, 89-91, 183, 188 | Carried over from R1-04, and now larger. The code departs from R-04 in two ways. The actions keep `flex: 0 1 auto`. The new part: the heading column is hidden while it shows nothing, and `.heading-column.empty + .actions { margin-inline-start: auto; }` holds the actions at the inline end. Both are right against FR-004, FR-005 and FR-010. Only the source comment and `round-1-fixes.md` record them. | Planner: amend R-04 (or the plan) with both, before phase 3 reuses R-04 for the page header (R-07). |
| R2-04 | note | tasks.md T023 | Carried over from R1-05. T023 is unticked and there are no baselines, a known gap under decisions 2 and 3. The fix changes no story. | Produce the baselines at `/ocelle-land` from CI's captures. |

### R1-02 fix, judged against the spec and the README

`ocelle-section-header.ts:183` hides the heading column when `heading` is empty and, in addition, either the
description is empty or the variant is `eyebrow` (in that variant the description is not rendered). That matches what
the column shows. Checked case by case:

- **Actions only, narrow (the R1-02 case).** The column is `display: none`, so the row's only item is the actions. No
  wrap line and no `row-gap` come from an empty column, so FR-005 ("no box, padding, gap, margin") holds. The actions
  start at the host's block start, or `--ocelle-space-1` under an eyebrow (FR-011 column gap). `margin-inline-start:
  auto` puts them at the inline end, which is FR-010's position when there is no heading.
- **Actions only, wide (1280 px, existing "FR-005, FR-010" scenario).** It used to be the flex-grow of the empty
  column; now the auto margin puts the actions at the inline end. The scenario's `actionsAtInlineEnd: 0` is still
  green.
- **Actions wider than the line (FR-004).** The actions wrapper shrinks to the line (`flex: 0 1 auto`), so the auto
  margin resolves to 0 and its actions wrap inside it as before. The "many actions at 320 px" scenario is still green.
- **Heading or a visible description present.** The column keeps its class and its `flex: 1 1 min-content` basis, so
  the FR-010 side-by-side test and its wrap to the inline start, `--ocelle-space-2` below, are unchanged. The fix-1
  `full` twin asserts both.
- **Eyebrow variant with only a slotted description.** The column is hidden (the description is not rendered there).
  The fix-1 `variant` case asserts that the actions start at block start and on one line at the inline end.
- **Nothing in the row.** `row` (line 184) is unchanged, so an eyebrow alone still takes no gap under it.
- **Live slot changes (FR-005, second sentence).** The class comes from the same `SlotState` reads as the other
  wrappers, so it follows content changes the same way. The R-05 and slot-transition scenarios are still green.

The README statement "An empty slot of the section header takes no space: no box, gap or margin" (README.md:191) now
holds in the case that round 1 showed false. The text did not need to change. notes.md departure 6 is superseded, as
`round-1-fixes.md` states. R1-02 is resolved.

Constitution: the fix adds a logical-property layout rule that sits outside the forced-colours block, which is right
for a layout rule. It reads no token, adds no colour, event, ID reference, tab stop or I/O, and `gate:style-lint`,
`gate:brand-rules` and `gate:csp` pass.

## Test quality

- **Red evidence for fix-1.** `red-fix-1.log` and `check-red-fix-1.log` at `9fea5fa` show 7 failures. Five are the
  known container tests. The other two are the new "FR-005, FR-010, narrow (phase 2 review R1-02)" scenario in both
  harnesses (`section-header.test.ts:23` in process, `browser/section-header.test.ts:33` on the fixture). Both are
  `AssertionError`s on layout values, not setup errors. They match the defect I measured in round 1 (actions 8 px
  down, 12 px under the eyebrow), and the fix note adds that the actions sat 12 px off the inline end. The phase red
  commit `3829e84` is still red as in round 1. Final tests exit 2 on the base and 1 on the scaffold.
- **No weakening.** `git diff 9fea5fa..HEAD` changes no test, scenario or story. `git diff 3829e84..HEAD` on the
  test pathspecs adds only the 35 fix-1 lines (`packages/elements/test/scenarios/section-header.ts`), plus the two
  plant story files that round 1 already judged. The 66 counts are unchanged.
- **Assertions.** The new scenario returns one observation compared with `toEqual` against literal expectations
  (0 px offsets and the token names `space-1`, `space-2`). It has the positive twin `full`, where the actions do wrap
  `--ocelle-space-2` under the heading at its inline start, so the assertions can fail both ways. It has no
  conditional, `skip`, `only` or snapshot. `gate:test-lint` is clean.
- **Plants.** `plants.md` § Review round 1 fix records the two new plants. Removing the auto-margin rule is caught by
  2 scenarios in each harness. Never hiding the column is caught by the narrow scenario in each harness. My
  `node gates/bin/plants.ts --skip-container`: "253 plants of 17 gates and the registry judged, every plant as
  expected; partial run: 48 visual plants not run".
- **Mutation.** `pnpm run gate:mutation -- --base 296e02d`: "147 mutants on the changed lines of 6 files, none
  survived; 0 timeouts, 43 compile errors, 2 zero-mutant entries; 2 equivalent records". That is 9 more mutants than
  in round 1, from the new condition, class binding and rule, and all were killed. The two equivalent records are the
  ones accepted in round 1 (`#compact = false` at line 166, and the `contrast.ts` process boundary).

## Checks run

All at `9b8eab6`, with `OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`.

| Check | Result |
|---|---|
| `pnpm test` | exit 1: 5 of 3304 failed, only `visual.test.ts:115, 126, 239, 251, 271` (R2-01) |
| `gate:typecheck` | pass |
| `gate:lint` | pass (283 files) |
| `gate:style-lint` | pass (16 files) |
| `gate:test-lint` | pass (189 files) |
| `gate:prefix` | pass (244 files) |
| `gate:contrast` | pass: 169 light / 177 dark / 158 required |
| `gate:brand-rules` | pass (7 rules) |
| `gate:manifest` | pass (4 elements) |
| `gate:csp` | pass (21 files) |
| `gate:pins`, `gate:config-copies` | pass |
| `gate:storybook-build` | pass (33 stories) |
| `gate:axe` | pass: 66 story-theme runs, 0 serious or critical |
| `gate:signoff -- --range 296e02d..HEAD` | 2 findings in 9 commits, on 1b9cc98 and 671196d only (R2-02) |
| `gate:plants --skip-container` | pass (partial: 48 visual plants not run) |
| `gate:mutation -- --base 296e02d` | pass: 147 mutants, none survived |
| `gate:visual` | could not run: no container engine (operator decision 2; R2-04) |

`tdd-check.json` was written at `338f4e5`. HEAD `9b8eab6` adds only that check's outputs, and my full run at HEAD
gives the same result, so I did not run the check again.

## Earlier findings

- **R1-01 (blocking): not resolved, and not resolvable by the implementer.** As the fix note says, no change was
  made. The failing set at HEAD is exactly the five container tests and nothing else. It is carried over as R2-01 and
  waits for the operator's accept under decisions 2 and 3.
- **R1-02 (blocking): resolved.** The red test is `fix-1` `9fea5fa`, listed in `red-commits`, red for the right
  reason, and unchanged after it. The fix is `338f4e5` (`ocelle-section-header.ts:89-91, 183, 188`). It meets FR-005,
  FR-010 and the README statement in every case listed above, and every earlier scenario of the phase is still green
  in both harnesses.
- R1-03, R1-04 and R1-05 were notes. They are carried over as R2-02, R2-03 and R2-04.
