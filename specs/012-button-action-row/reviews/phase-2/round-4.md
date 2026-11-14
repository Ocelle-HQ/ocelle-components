---
phase: 2
round: 4
verdict: approved
base: 48cdc9584ab93373eff1544378e118f20eded10e
head: 43c9294
tdd_check: pass
---

# Phase 2 review, round 4

This is the first round of the second batch, which the operator approved. Scope: the round-3 fix,
`git diff 9d3518a..43c9294`. That is the red fix-3 commit be3fd52 (only the new `gates/test/story-page.test.ts`, +69),
the green commit e13de07 (`gates/lib/story-page.ts` +7/-3, plus `red-commits`, `red-fix-3.log` and
`round-3-fixes.md`), and the tdd-check outputs in 43c9294. The gates below re-checked the whole phase
(`48cdc95..43c9294`). The work tree was clean. Read: round-3.md, round-3-fixes.md, red-fix-3.log,
check-red-fix-3.log, check-head.log, check-final-tests-on-base.log, check-final-tests-on-scaffold.log,
tdd-check.json, and the changed source and test in full.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R4-01 | note | gates/lib/story-page.ts:8-9; gates/lib/story-page.ts:354-359; gates/lib/story-page.ts:367 | The operator asked whether the file's doc comment still reads right. It no longer does exactly. The header says the file "is wiring only: every decision is in those modules, and each line here is a process boundary covered by the visual plants and gates/test/integration/visual.test.ts". The press block of `applyPointer` (lines 356-359) has no Stryker disable comment. It is mutated, and its cover is the unit test `gates/test/story-page.test.ts`, which the header does not name. The inline comment at lines 354-355 does state the exception ("Mutated: gates/test/story-page.test.ts."), so a reader who reaches the code is told, and no check depends on the header. A smaller point of the same kind: the disable comment on `settle` (line 367) still names only the integration test, although the new unit test now runs `settle`'s in-page function against stubs. | None for this phase. At landing, or at the next change to this file, extend the header with one clause, for example: "…covered by the visual plants and gates/test/integration/visual.test.ts, except the press branch of `applyPointer`, which is mutated and covered by gates/test/story-page.test.ts." |

No blocking finding.

## Test quality

- **tdd-check.json**: `pass`, head e13de07. Commit 43c9294 changes only the check's own outputs under
  `reviews/phase-2/`, so the check is current for HEAD. Every red commit exits 1: phase fa5ef5c, fix-1 045bd1f,
  fix-2 dbf0ed9 and fix-3 be3fd52. The final tests exit 1 on the scaffold (261 of 3362 fail, check-final-tests-on-scaffold.log)
  and 2 on the base ("no test file found", as in every earlier round). At HEAD they exit 0 (3362 of 3362, check-head.log).
- **Red fix-3 (be3fd52).** The commit adds one test file and nothing else. check-red-fix-3.log matches the
  implementer's red-fix-3.log apart from timings: 1 of 3362 tests failed, and it was the new press test at
  `story-page.test.ts:56`, on its deep equality. On the old code the steps were `count, move, down`, and the test
  expects `count, move, fonts, frame, frame, down`. That failure is the missing behaviour, not a setup error: the
  fake page ran, `applyPointer` returned, and only the order was wrong.
- **Is a call-order test a sound stand-in for a timing race?** Yes, together with the load evidence. No test can
  fail on the race every time, because it only shows under contention. What a test can pin is the mechanism the fix
  depends on: one full settle (the fonts, then two animation frames) between the hover move and the press. The fake
  page makes that observable without mocking the unit. `page.evaluate` runs the real in-page callbacks of
  `applyPointer` and `settle` in the test process against stubbed `window`, `document.fonts.ready` and
  `requestAnimationFrame`. So the test asserts the steps that `story-page.ts` itself takes, not a stub's return
  value. It also rules out the plausible wrong fixes. A settle placed after `down`, a single frame, or a settle on the
  hover path each fail one of the two equalities. The hover test (line 63) passes on the old code as well, so it is a
  regression guard, not part of the red evidence. That is acceptable, because it guards the `kind === "press"`
  condition, and the mutation run shows it doing so. What the unit test cannot show, that this order removes the
  nondeterminism, is shown by the load runs (see below), with a control. Together they are the strongest evidence
  this kind of defect allows.
- **After red.** `git diff be3fd52..HEAD -- gates/test packages/elements/test storybook/test` is empty. No test was
  weakened, skipped or deleted. No conditional assertion, `skip` or `only`; test-lint passes on 188 files.
- **Mutation.** `pnpm run gate:mutation -- --base 48cdc95` on the whole phase: 163 mutants on the changed lines of
  6 files, none survived. That is round 3's 158 plus the 5 on the new lines of `story-page.ts`, all killed apart from
  one compile error (line 356, a string literal replaced by `""`). The new press lines carry no Stryker disable
  comment, as the operator decided. The same reports as in round 3 remain: 1 timeout (ocelle-button.ts:292, options
  replaced by `{}`), 52 compile errors, 2 zero-mutant entries (`icon-slot.ts`, `index.ts`) and 1 equivalent record
  (ocelle-button.ts:51, accepted in round 1).

## Checks run

These ran on HEAD 43c9294, one at a time, apart from the load runs, which add load on purpose:

- `gate:typecheck`, `gate:lint` (280 files), `gate:style-lint` (14), `gate:test-lint` (188), `gate:prefix` (233),
  `gate:pins` (5), `gate:config-copies`, `gate:manifest` (3 elements), `gate:contrast` (193 light, 201 dark, 182
  required), `gate:brand-rules` (7 rules), `gate:csp` (12 files), `gate:storybook-build` (38 stories) and
  `gate:signoff -- --range 48cdc95..HEAD` (24 commits): all pass.
- `gate:axe`: 76 story-theme runs, 0 serious or critical; 10 excepted notes.
- `pnpm test`: 3362 tests passed in 149 files.
- `gate:mutation -- --base 48cdc95`: see above.
- **Load spot-check.** `OCELLE_VISUAL_ENGINE=docker pnpm run gate:visual` 6 times in a row, with 16 `yes > /dev/null`
  processes on the 4 cores. `pgrep -c -x yes` counted 16 after every run. All 6 exited 0 with `visual: 76 captures
  match their baselines (docker only: no cross-engine comparison)`, and no log has a `nondeterministic` line. They
  took 112 to 114 s. The busy processes were killed afterwards (`pgrep` counted 0). In round 3, the same load on the
  pre-fix code failed 3 of 6 runs, and the implementer's control reproduced that rate (3 of 6). With the fix, the
  implementer's 8 of 8 and my 6 of 6 give 14 of 14. If the old failure rate of about one half still held, 14 passes
  in a row would have a chance of about 1 in 16000.
- `gate:plants` with `OCELLE_VISUAL_ENGINE=docker`, shards 30 (`visual/fail-press-style-changed`) and 46
  (`visual/pass-hover-and-press`), the two plants of the changed press path: both `every plant as expected`.
- **Baselines.** `git diff 9d3518a..HEAD -- storybook/baselines` is empty. No baseline changed in the fix, and the
  tree is clean after all runs.

## Earlier findings

- **R3-02 (blocking): resolved.** `applyPointer` now runs `settle(page)` between `mouse.move()` and `mouse.down()` on
  a press (gates/lib/story-page.ts:356-359). The hover path is unchanged. The fix came test-first: red commit fix-3
  be3fd52 is recorded in `red-commits` and exits 1 in the tdd-check. The pressed story is byte-stable under the load
  that broke it, in 6 of 6 runs here (14 of 14 counting the fix note), and its baselines were not regenerated. The
  fix note gives the reason for changing feature 006's shared driver: the race is in the driver, and every pressed
  story uses it. The operator decided that, and the change is confined to the press branch.
- **R3-01 (blocking): resolved.** tdd-check.json is `pass` with no problem. The visual integration test passes in
  check-head.log and in my `pnpm test` run.
- **R3-03 (note): unchanged.** It is outside this phase (`setup-offline.test.ts` under direct vitest), and it is left
  for landing, as the operator decided.
- **Regressions:** none found. Every gate passes, the two press plants behave as expected, and no baseline changed.
