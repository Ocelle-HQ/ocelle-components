---
phase: 1
round: 1
verdict: approved
base: 4f44aa1d74626db76a4baab534d1bd168dc2aae0
head: e5fe31ccc56c37a1f941258e7730f88ec8dddd24
tdd_check: pass
---

# Phase 1 review, round 1

Scope: `git diff 4f44aa1d..e5fe31cc` (8 commits). The only uncommitted changes are the evidence files that
`tdd-check.sh 1` wrote. Phase 1 changes no element source. It adds four driver methods to the test harness
(contracts/checks.md § Test harness rows 1, 2, 7 and 8: `animationStates`, `seek`, `settleLayout`, `overflows`), their
self-tests in both harnesses, `vitest.config.ts`'s browser commands for them, and the phase records (recheck, spikes,
operator decisions, design amendments, TDD exemption, notes, plants).

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | note | specs/018-status-elements/reviews/phase-1/check-red-phase.log:42 | In tdd-check's run of the red commit `f2bf1d07`, 008's `packages/elements/test/browser/dialog.test.ts:36` ("Rapid toggle during the entry, motion o…") also failed. The red commit does not touch the dialog or anything it uses. The same test passed in `red.sh`'s run of the same commit (`red-phase.log`), at HEAD (`check-head.log`: 7776 passed), and in this review's rerun. This looks like a timing flake in a merged 008 test, not a result of this phase, and it does not change the red record. | None for this phase. If it happens again, raise it through triage as a flaky 008 test. |
| R1-02 | note | specs/018-status-elements/reviews/phase-1/notes.md:61-76 | The "Plants (T010): not run, stop-and-ask" section still says that "`plants.md` is therefore not written and T010 stays open". The operator has since decided (`operator-decisions.md` § T010), `plants.md` exists, and T010 is ticked (`e5fe31cc`). The record is stale; nothing in the code is wrong. | Optional: add a line pointing to the operator decision and `plants.md`. |
| R1-03 | note | specs/018-status-elements/reviews/phase-1/notes.md:59 | `gate:signoff` is listed as "run on the commit range after the green commit (see the report)", but its result is not in the evidence. This review ran it: `gate:signoff -- --range 4f44aa1d..HEAD` → "8 commits checked, no finding", exit 0. | None. |
| R1-04 | note | packages/elements/test/scenarios/harness-status.ts:172-175 | The negative case of `seek` maps any `Error` to `"refused"`. A seek that failed for another reason (for example a missing target) would also count as refused. The positive seek in the same body limits the risk, and `seekOf` throws a separate message for each cause (`animations.ts:102-106`). | None now. Later phases that rely on the refusal could assert the message. |
| R1-05 | note | specs/018-status-elements/reviews/phase-1/plants.md | The plant record is `--list` only, with all 317 of 317 plants selected because `vitest.config.ts` is not mapped by `affectedPlants`. This is the operator's recorded exception for phase 1 (`operator-decisions.md` § "T010, the phase's plant run"): CI's Plants check on the pull request must judge them. | None in this phase. CI's Plants check must pass before merge. |

No blocking finding.

## Test quality

- **Red evidence.** `red-commits` has one entry, `phase f2bf1d07`, and `git show --stat f2bf1d07` touches only test
  files under `test_pathspec` plus the feature's specs. In `red-phase.log` (`red.sh`) and `check-red-phase.log`
  (tdd-check), the 8 harness self-tests (4 in process, 4 on the CSP fixture) fail with `TypeError: driver.animationStates
  / overflows / settleLayout is not a function`. That is the missing behaviour: the `Driver` interface declared the
  methods and no driver implemented them. `gates/test/vitest-config.test.ts:137` fails on the command list without the
  four new commands. The 5 `gates/test/integration/visual.test.ts` failures in `red-phase.log` were environmental
  (dockerd was down; `code: 2`). They are explained in notes.md and do not appear in tdd-check's red run.
- **Final tests on base.** `check-final-tests-on-base.log` exits 1. The 4 in-process self-tests fail (`commands.X is
  not a function`), and so does the config test. As tdd-exempt.md's note says, the driver implementation lives under
  `test/` (test files by `test_pathspec`) and is overlaid on the base. The fixture twins can then pass on the base,
  while the in-process tests and the config test still fail because the base `vitest.config.ts` registers none of the
  commands. Every new method still has at least one test that fails against the base.
- **No weakening.** `git diff f2bf1d07..HEAD` touches only the driver implementation (`animations.ts`,
  `browser/driver.ts`, `commands.ts`, `in-process.ts`, `layout-wait.ts`, `overflow.ts`) and `vitest.config.ts`. None
  of the test files (`test/harness/*.test.ts`, `test/browser/harness.test.ts`, `test/scenarios/harness-status.ts`,
  `gates/test/vitest-config.test.ts`) changed after the red commit.
- **Assertions.** Each body returns one observation object that is compared with `toEqual` against a hand-written
  expected value. There are no conditional assertions, no `skip` or `only`, no snapshots and no assertions on mocks.
  `test-lint` is clean. Each negative shares its body with its positive: row 1 checks the same, another and a re-created
  identity, plus none and removed; row 2 checks a seek, an unseeked twin, and a refusal; row 8 checks 0.1 px over against
  an exact fit in LTR and RTL, and long against short text; row 7 checks a stale read after `settle()` against the
  final value after `settleLayout()`, and the idle case. The notes also record that the `settleLayout` body was run
  with the method reduced to `settle()` and failed (`settled: 70`), so the wait itself is proven.
- **Coverage of the phase's scenarios.** The Independent Test asks for self-tests of rows 1, 2, 7 and 8 in both
  harnesses. All four exist in process (`test/harness/{animation,text,layout}.test.ts`) and on the CSP fixture
  (`test/browser/harness.test.ts:167-175`, which also asserts that the fixture's recorders stay `clean`). Rows 3 to 6
  have no self-test, by operator decision Q4 (a); they are existing `main` methods.
- **Scaffold.** There is no `scaffold.sha`.
- **Mutation.** `pnpm run gate:mutation -- --base 4f44aa1d…` → "nothing to mutate: no package or gate source line
  changed since 4f44aa1d…", exit 0. The phase changes test code and `vitest.config.ts` only, so there was no surviving
  mutant and no equivalent-mutant record to read.
- **TDD exemption.** T001 (recheck) and T002 (spikes) are records with no committed behaviour. `tdd-exempt.md` explains
  why no test could fail for them: T002's spike code is scratch and not committed, and the values the later phases pin
  from it are asserted by those phases' own red tests. I accept the exemption.

## Checks run

On HEAD `e5fe31cc`, with Node 26 from `/opt/node26/bin` and
`OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`, one at a time:

- `gate:typecheck`: no type error, exit 0.
- `gate:lint`: 452 files, no finding, exit 0.
- `gate:style-lint`: 41 files, no finding, exit 0.
- `gate:test-lint`: 333 files, no finding, exit 0.
- `gate:manifest`: 20 elements, no finding, exit 0.
- `gate:csp`: 39 files, no finding, exit 0.
- `gate:prefix`: 459 files, no finding, exit 0.
- `gate:pins`: 5 manifests, no finding, exit 0.
- `gate:config-copies`: the two copies are identical, exit 0.
- `gate:signoff -- --range 4f44aa1d..HEAD`: 8 commits, no finding, exit 0.
- `gate:mutation -- --base 4f44aa1d…`: nothing to mutate, exit 0.
- Unit and interaction tests: tdd-check's `check-head.log` at HEAD reports 7776 tests passed in 236 files, exit 0.
  This review also reran the phase's files and the flaky dialog file: `vitest run test/harness/{animation,layout,text}.test.ts
  test/browser/harness.test.ts test/browser/dialog.test.ts gates/test/vitest-config.test.ts` → 6 files, 402 tests
  passed.
- **Plants.** `plants.md` has base `4f44aa1d…`, which equals `base.sha`, and it records exit 0. This review ran
  `OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --affected 4f44aa1d… --list` → `note: affected: every plant,
  by vitest.config.ts (not mapped)` and "317 of 317 plants selected, none judged (--list)", exit 0. That is the same
  selection as the record. The record has no judging run, which is the operator's recorded phase-1 exception (R1-05).
- Visual, axe and contrast: no story, element style or token changed in this phase, so nothing was run beyond the
  full unit suite. The visual integration tests are part of that suite and pass in `check-head.log`.

Tasks: T001 to T010 of `## Phase 1:` are all ticked, and their work is present:
- `recheck.md` answers items (a) to (f).
- `spikes.md` has every item and "Outcome: no stop" (a labelled pill sits 0.00 px off the baseline in all 48 cases).
- The red commit holds T003, T004 and T007; T005 and T006 were removed by Q4 (a).
- T008 is in `test/scenarios/driver.ts:297-300` and `:688-716`.
- T009 is in `test/commands.ts`, `test/in-process.ts`, `test/browser/driver.ts` and `vitest.config.ts`.
- T010 is covered by `tdd-exempt.md`, the gate runs and `plants.md`.

The spec, plan, research, data-model, contracts, quickstart and tasks changes all come from the operator's decisions
Q1 to Q4 and the recorded facts. Each one is traced in `design-amendments.md` (A1 to A8). The Complexity Tracking
table is unchanged, with no exception. The plan's structure is followed (plan.md:211 and 255: the harness files and
the four methods).

Constitution: no element, token, style or story changed, so Principles I to V are not engaged by this phase. The
stand-ins use adopted sheets only, and the fixture run asserts clean CSP recorders. Principle VIII is met as described
above. Every commit is signed off (DCO).

## Earlier findings

None. This is round 1.
