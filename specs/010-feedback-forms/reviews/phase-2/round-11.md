---
phase: 2
round: 11
verdict: approved
base: b1be87ade52bbf93335993780acd20c2b69d5da3
head: 024cb96255173673d31d9488381dbf0a43041bbe
tdd_check: pass
---

# Phase 2 review, round 11

This is a confirming round under the stop rule. Round 10 left no blocking finding. Its verdict was
`changes_requested` for one reason only: `tdd_check` was pending. This round checks only the TDD check results that
`024cb962` adds. I did not search for new findings.

`024cb962` changes only files under `specs/010-feedback-forms/reviews/phase-2/`: `tdd-check.json` and the eight
`check-*.log` files (`git show --stat 024cb962`; `git diff --stat a3f658b0 024cb962 -- . ':!specs/010-feedback-forms/reviews/phase-2/'`
is empty). The check ran at `a3f658b0`, which is round 10's own commit on top of `0c5d0a4f`. Between that head and
HEAD there is only this evidence commit, so the result holds for HEAD. The working tree is clean.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R11-01 | note | reviews/phase-2/check-final-tests-on-base.log:41, check-final-tests-on-scaffold.log:41 | Both runs exit 2 on a runner error, "unit-tests: could not run: no test file found; check the include patterns of vitest.config.ts", and not on an assertion. The non-zero exit meets check 2 and check 3 of `tdd-check.sh` as written. Still, these two logs prove nothing about what the final tests assert against the old code. Round 1 made the same point (R1-06). The red evidence below rests on assertions and covers the phase. | None for this phase. The tdd-check script could tell a runner error from a failing test. |

No blocking finding.

## Test quality

`tdd-check.json` has `status: "pass"`, `head: a3f658b0879a413ae91f3b833b5c6919f2027c0b`, `base` equal to `base.sha`
and `problems: []`.

- **Red commits.** `red-commits` lists five entries: `phase` e422ba60, `fix-1` fc7214cd, `fix-4` 780aaa0c,
  `fix-5` 636207eb and `fix-6` 42539f40. `tdd-check.json` has an entry with the same label and SHA for each of them,
  and each one has `exit_code: 1`. Each SHA's subject is a red commit of its round.
- **Red logs: each failure is an assertion failure.** I found no timeout, `TypeError`, `ReferenceError`,
  `SyntaxError`, missing module or load error in any `check-red-*.log`.
  - `check-red-phase.log`: 286 of 3456 tests failed. 270 lines are `AssertionError`. The other 16 are plant rows in
    `plants.test.ts:178` and `browser/plants.test.ts:93`. Each one fails a `toThrow` match: the scenario cell threw
    its own assertion message ("… expected { … }") and not the prefix the plant row expected. That is an assertion
    failure, not a crash. 270 + 16 = 286.
  - `check-red-fix-1.log`: 10 of 3531 failed. All 10 are `AssertionError`s: the README wording, the US1-11, US1-13
    and two-notice scenarios, and the empty-state start rule in `announcer.test.ts:152` and
    `notice-rules.test.ts:239`, :254.
  - `check-red-fix-4.log`: 1 of 4740 failed. The `AssertionError` is on the README sentence about tone in forced
    colours (`readme.test.ts:420`).
  - `check-red-fix-5.log`: 8 of 7917 failed. All 8 are `AssertionError`s on the project lists and the
    `elements-timing` project (`vitest-config.test.ts`, `vitest-mutation-config.test.ts:89`, `readme.test.ts:666`).
  - `check-red-fix-6.log`: 2 of 7916 failed. Both are `AssertionError`s in `ci-workflow.test.ts`, :35 and :57. The
    second one is "expected 45 to be 75", the shard limit that round 9 and round 10 judged.
- **Final tests.** `final_tests_on_base_exit` is 2, `final_tests_on_scaffold_exit` is 2 and `head_exit` is 0.
  `check-head.log` reads "unit-tests: 7916 tests passed in 239 files". For why the base and scaffold exits are only
  weak evidence, see R11-01.
- No test changed after round 10, so there is nothing new to check for weakening. Mutation was not run: no source
  changed since round 10.

## Checks run

- I read `tdd-check.json`, `red-commits` and every `check-*.log`, and grepped the red logs for non-assertion
  failures.
- `git show --stat 024cb962` and `git diff --stat a3f658b0 024cb962` outside `reviews/phase-2/`: the commit touches
  only review evidence.
- `pnpm run gate:signoff -- --range 0c5d0a4f..HEAD`: "2 commits checked, no finding".

## Earlier findings

Round 10 had no blocking finding. Its two notes need no further action:

- **R10-01** (`tasks.md:206-210`, the `*Done …*` notes on the ticked tasks): required no change. Unchanged since
  round 10.
- **R10-02** (`specs/001-repository-foundation/spec.md:339`, the shortened quote of the round 6 answer): required no
  change. Unchanged since round 10.

The only open condition from round 10 was the pending TDD check. It now reports `pass` with no problems.

## Verdict

`approved`. There is no blocking finding, the checks in scope pass, and `tdd_check` is `pass`.
