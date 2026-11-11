---
phase: 3
round: 1
verdict: approved
base: 6906cebc6eb785e909011695f06aa198386582c3
head: 3bf33d11b0ab03162a79c4b918b3c43cee033abf
tdd_check: pass
---

# Phase 3 review, round 1

Scope: tasks.md "Phase 3: User Story 2" (T019 to T031, with the lever 3 tasks T032 to T037 added during the phase
after the operator's FR-014 decision). Change under review: `git diff 6906ceb..3bf33d1` (no uncommitted change).
`tdd-check.json` was written at `ffa4bd0`; the only later commit, `3bf33d1`, adds the check's own files, so it was not
re-run.

## Findings

No blocking finding.

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | note | `reviews/phase-3/red-commits:2` | The line `lever-3 4b3279a…` was added by hand: `red.sh` accepts only `phase` and `fix-<round>` (`.specify/extensions/story/scripts/red.sh:12`), and the orchestrator asked for a `lever-3` label. What was done equals what `red.sh` would have done: the tests were run at `4b3279a` through the script's own `story_run_tests_at` (`red-lever-3.log`: 23 of 2099 tests fail, every one an `AssertionError` against the 60-line plan, no setup or import error), and `4b3279a` changes only `gates/test/mutation-shards.test.ts`. `tdd-check.sh 3` then checked it independently like any red commit (`tdd-check.json`: `lever-3`, exit 1, no problem; `check-red-lever-3.log`), and the deviation was disclosed to the operator in `stop-and-ask-lever-3.md` § Also for the operator. I accept the red evidence. The label mismatch between the orchestrator and `red.sh` is a tooling gap, listed below as dropped. | None for this phase. |
| R1-02 | note | `gates/test/vitest-config.test.ts:42`, commit `9f56827` | This existing unit test held the same deep-equal that T019 replaced in the integration test. Lever 1 broke it, and it was changed in its own commit after the implementation (`3986b74`), not in a red commit. It is a replacement, not a loosening: every kept project is still compared by name, include and exclude, now against the explicit split. The reason is in the commit body and `evidence/README.md` § Green measurement ("A discarded first attempt"). The test fails against the base (`check-final-tests-on-base.log:63`), and the behaviour it states, the split, was already proven red-first by `vitest-mutation-config.test.ts:69` (`red-phase.log`). Principle VIII's intent is met; the strict order "red commit first" was not. | None. |
| R1-03 | note | `evidence/README.md` § Re-run (l. 1221), § Open for landing (l. 1317); `reviews/phase-3/operator-decision-lever-3-rerun.md` | FR-010's sandbox half is met only on a re-run for two entries: `source.ts:91-120` took 177.68 s, then 171.53 s, and `151-180` took 182.52 s, then 170.49 s. Each was re-run once, as the operator decided, and both runs are recorded with the per-mutant comparison (no status moved). The first runs were not discarded, and "Open for landing" names them. The margin is a few seconds either way (`31-60` 166.19 s and `121-150` 171.98 s were measured once), so the CI half at landing (480 s per step) is the real test. | None in this phase. The landing pass must take the CI measurement as written. |
| R1-04 | note | `evidence/README.md` § FR-013 reference entries with lever 3 (l. 1269); `gates/lib/mutation/shards.ts:43,59,71,74` | The FR-013 reference entries were not re-run under lever 3. That holds by construction: `maxEntryLines` is read only in `splitFile`/`planShards`, and `--files`, Stryker's and Vitest's configuration are those of the lever 1 runs, so a `--files generate.ts:1-60` measurement run is unchanged. The plan-level cost of "all files" is more cuts (70 against 27 for base `B`), and a mutant that spans a cut is mutated in no shard. That is the accepted limit of 001 FR-013 (O10-02), applied to every file by the operator's decision, and it is recorded in `knowledge/speckit-flows/findings/frontend-missions.md` ("Cost: 70 cuts within files instead of 27"). | None. |
| R1-05 | note | `evidence/us2-plants.txt` | The plants were recorded with lever 1 only (commit `3986b74`) and were not re-run after lever 3. No mutation plant uses `--plan` or a range entry, so lever 3 cannot change their verdicts. I ran `gate:plants` at HEAD anyway: 186 plants, every one as expected (below). | None. |

## Test quality

- **Red evidence.**
  - Phase red `b693daf` (T019/T020, `red-phase.log`): the three tests of
    `gates/test/integration/vitest-mutation-config.test.ts` (l. 69, 111, 129) fail on assertions, for the missing
    behaviour. The project names are `[Array(5)]` against the six-project split. No `tokens-source-table` module is
    collected. And `source-table.test.ts` is not the first module to start under Stryker's options
    (`maxWorkers 1`, `maxConcurrency 1`, `bail 1`).
  - Lever 3 red `4b3279a` (T032, `red-lever-3.log`): 23 `mutation-shards.test.ts` cases fail, all deep-equal or
    count mismatches against the 60-line plan.
  - `final_tests_on_base_exit` is 1, with 27 failures (`check-final-tests-on-base.log`), and HEAD passes, with
    2099 tests (`check-head.log`).
- **Replacement of the deep-equal (T019).** The test header records it (l. 12-18). The old assertion "every mutation
  project deep-equals its `vitest.config.ts` counterpart" became stricter:
  - the six project names are pinned exactly;
  - each project, once its whole `test.sequence` is removed, deep-equals its counterpart, with only the two stated
    split exceptions (`name`/`include` for `tokens-source-table`, the appended `exclude` for `tokens`);
  - the `sequence` values are pinned as `groupOrder` 1/2/3/3/3/3;
  - a new test checks that the collected modules equal those of `vitest.config.ts` outside the four excluded
    projects, each collected once.

  The start-order test is behavioural. It uses a child-process `createVitest` with Stryker's options, and a reporter
  that cancels the run at the first module of another project (`gates/test/integration/vitest-order.ts`). It asserts
  that the first module started is `source-table.test.ts`, and that exactly the token modules come before the first
  other module (`firstOther` must equal the token module count, so a run with no other project fails too).
- **Lever 3 tests.** The 60-line cases were rewritten to 30 with boundaries at 30 (one entry, beside a 31-line file),
  31 (split), 60 (two entries, no empty third) and 61, and with a cut inside a range where the count reaches 30. The
  recorded `plant-judge.ts` diff is now eight entries, and the `--plan` stdout and cut counts changed to match. The
  same number of `expect` lines was removed and added (17/17). The "251 lines together" case was rewritten with
  30-line files, and the commit body gives the reason. A mutant of `maxEntryLines` (29 or 31) would fail the boundary
  cases.
- **Weakening after red.** `git diff 4b3279a..HEAD -- '*.test.ts' 'gates/test/**'` is empty. `git diff b693daf..HEAD`
  on test files shows only the lever 3 red commit and `vitest-config.test.ts` (R1-02).
- **Vacuous assertions.** None found. There are no `skip`/`only`, no conditional assertions and no snapshot-only
  tests, and `gate:test-lint` passes.
- **Scaffold.** No `scaffold.sha`, so there is nothing to check.
- **Mutation.** `pnpm run gate:mutation -- --base 6906ceb` at HEAD: exit 0, 43 s. It found
  `0 mutants on the changed lines of 2 files, none survived; 0 timeouts, 0 compile errors, 2 zero-mutant entries; 0
  equivalent records`. The two zero-mutant entries are `gates/bin/mutation.ts` (comments only) and
  `gates/lib/mutation/shards.ts` (comments and `maxEntryLines = 30`; Stryker has no number-literal mutator). These are
  reports, not findings, and the 30-line bound is held by the boundary tests above. `vitest.mutation.config.ts` is
  outside mutation scope, and its behaviour is held by the T019 tests. No survivor and no equivalent record.
- **Story evidence.** The FR-011 record covers the 122 former Timeouts: 57 Killed by the named `source-table.test.ts`
  tests and 65 group A CompileError, the same as in the red run. I spot-checked the eight lever 3 reports and the two
  re-runs, and every one has only Killed and CompileError statuses, with the totals of the table. The Killed mutants
  credited to `build.test.ts` are token-name `""` mutants ("unknown token …"), not FR-011 subjects. The by-hand kills
  of groups B and C are in `evidence/by-hand/`. The FR-012 check found no change to `packages/tokens/src` or
  `stryker.config.json` and no new `Stryker disable`. The `dist` outputs are byte-identical at `f0efd4e`.

## Checks run

All were run at HEAD `3bf33d1`, one at a time, with the given environment:

| Check | Result |
|---|---|
| `pnpm test` | exit 0, 2099 tests passed in 97 files |
| `gate:typecheck` | exit 0 |
| `gate:lint` | exit 0, 173 files |
| `gate:test-lint` | exit 0, 114 files |
| `gate:style-lint` | exit 0 |
| `gate:config-copies` | exit 0 |
| `gate:prefix` | exit 0 |
| `gate:pins` | exit 0 |
| `gate:csp` | exit 0 |
| `gate:contrast` | exit 0 |
| `gate:brand-rules` | exit 0 |
| `gate:signoff -- --range 6906ceb..HEAD` | 35 commits, no finding |
| `gate:mutation -- --base 6906ceb` | exit 0 (above) |
| `gate:plants` (alone, after the mutation run) | exit 0, 186 plants as expected |

- **Tasks.** T019 to T037 are all ticked, and their work is present:
  - lever 1 in `vitest.mutation.config.ts`;
  - lever 2 measured and not kept;
  - lever 3 in `shards.ts`, with the dated records in 001 `spec.md` FR-013 and SC-005, `gate-cli.md`,
    `gates/README.md`, `research.md`, `quickstart.md` and this spec (`plan.md` states no 60-line bound);
  - T030 in `frontend-missions.md`;
  - "Open for landing" in `evidence/README.md`.

  Nothing outside the phase was changed without a reason.
- **Constitution.** No element, story, token or CSS is touched, so Principles I to VI do not apply. Principle VIII is
  covered above. The two operator decisions (`operator-decision-fr014.md`, `operator-decision-lever-3-rerun.md`) are
  recorded with name and date, and both follow from stop-and-ask files.
- **Plan.** Lever order 1, then 2, then 3, as PLAN-FRESH-2-002 (a) requires. Lever 1 changes only
  `vitest.mutation.config.ts`; `vitest.config.ts` and `pnpm test` are unchanged.

## Earlier findings

None: this is round 1.

## Dropped for the operator (no follow-up issue)

- `red.sh` accepts only the labels `phase` and `fix-<round>`, so a mid-phase red commit such as lever 3 cannot be
  recorded by the script (R1-01).
