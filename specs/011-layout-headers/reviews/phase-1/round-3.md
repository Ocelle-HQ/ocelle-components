---
phase: 1
round: 3
verdict: changes_requested
base: 767c09779ea8e58c52d6f8f1182b2015ae74b821
head: d93f145cbb926b827f157ea8fce0052d8f3816cd
tdd_check: pass
---

# Phase 1 review, round 3

Scope: phase 1 at HEAD `d93f145`. Since round 1, the phase has changed in one way: the landing fix T048 (operator
round 2, R2-01, landing L1-04). The red commit is `f47c795` (`packages/elements/test/node/readme.test.ts`, +2 lines)
and the fix is `cd81e00` (`packages/elements/README.md` § Forwarded slots, `red-commits`, `red-fix-2.log`,
`round-2-fixes.md`). From `33d7df1` to HEAD only review evidence files changed (`git diff --stat 33d7df1..HEAD`: 26
files, all under `reviews/phase-{1,2,4,5}/`). Phase 1's source, `packages/elements/src/slot-state.ts`, has not changed
since `f1832e6` (`git log 767c097..HEAD -- src/slot-state.ts`).

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R3-01 | blocking | specs/011-layout-headers/tasks.md:89 | T048 is still `- [ ]`, but its work is present: the red fragment (readme.test.ts:75-76), the README section (README.md:530-536, between `## Slot convention` and `## Host ARIA` as the task asks), the recorded `fix-2` red commit and `round-2-fixes.md`. The fix commit `cd81e00` did not touch `tasks.md`. The review procedure requires every task of `## Phase 1:` to be ticked, and the story scripts count open tasks per phase (`story_phase_table` in `.specify/extensions/story/scripts/common.sh:97`), so phase 1 now reads as unfinished. | Tick T048 (`- [X]`) in `tasks.md`. No code or test change is asked for. |
| R3-02 | note | packages/elements/README.md:532-536; packages/elements/src/slot-state.ts:25 | The new README section states a behaviour: a forwarded `<slot>` with nothing assigned counts as content, so the part keeps its wrapper, gap, padding or divider. Only the README text is asserted (readme.test.ts:76). No scenario pins the behaviour itself, so a later change to `assignedNodes({ flatten: true })` would make the README wrong while every test still passes. T048 and plan.md:280-282 chose this on purpose ("no scenario harness applies"), and the read in slot-state.ts:25 is plainly unflattened, so this is not a defect of the fix. | None needed. A later op could add one slot-state test with a forwarded empty `<slot>` reading as not empty. |
| R3-03 | note | specs/011-layout-headers/reviews/phase-1/check-final-tests-on-base.log, check-final-tests-on-scaffold.log (tail) | Both "final tests against old code" runs exit 2 with `unit-tests: could not run: no test file found`. That is a load error, not a behavioural failure. The phase's base runs from 767c097, so the final-test set `tdd-check.sh` lays over the old trees now holds the test files of all five phases. The script accepts any non-zero exit, so it reports `pass`. For phase 1 the behavioural evidence is still in place: the round 1 scaffold run (21 assertion failures in slot-state.test.ts and commands.test.ts, see round 1) and both red logs (`red-phase.log`, and `red-fix-2.log`/`check-red-fix-2.log`, see Test quality). The tdd-check output was already like this at `f983604`. | None for this phase. Worth an op on `tdd-check.sh`: treat exit 2 ("could not run") against base or scaffold as no proof, or run only the phase's own tests. |

## Test quality

- **Red evidence (fix-2).** `red-commits` holds `phase acda1d4` and `fix-2 f47c795`. `f47c795` changes only
  `packages/elements/test/node/readme.test.ts`, which matches `test_pathspec`, and it is signed off. `red-fix-2.log`
  and the re-run `check-red-fix-2.log` agree: "1 of 3594 tests failed". The one failure is readme.test.ts:266
  `states: A shell that forwards a slot of its own …`, an `AssertionError` on `toContain`. The statement was missing,
  which is the right reason, not a load or setup error. My own `tdd-check.sh 1` run gives `exit_code: 1` for both red
  commits.
- **Weakened after red.** None. `git diff f47c795..HEAD -- packages/elements/test/node/readme.test.ts` leaves the fix-2
  fragment (lines 75-76) unchanged. The diff has three other changes, all from later phases: the phase 4 T050
  template/script fragment, the stricter phase 5 T052 rail fragment (its reason is in the comment at line 210), and a
  new raw-text line test. Each one only adds to or tightens the assertions. Phase 1's own tests (`slot-state.test.ts`,
  `commands.test.ts`) have not changed since `acda1d4`.
- **Vacuous assertions.** None. The new fragment runs through the existing `it.each(fragments)` with one unconditional
  `expect(readme).toContain(flat(fragment))` (readme.test.ts:269-271). It has no `skip` or `only`, no conditional and
  no snapshot. `gate:test-lint` passes.
- **Against base and scaffold.** Exit 2 on both, a load error (R3-03). The behavioural proof is the red runs and the
  round 1 scaffold run.
- **Scaffold.** Unchanged since round 1 (`37cdf8e`, the rewritten `cab41f9`): signatures only, no test file.
- **Exemption.** `tdd-exempt.md` is unchanged and still holds (round 1). T048 needs no exemption: it has a red commit.
- **Mutation.** `pnpm run gate:mutation -- --base 767c097…` produced 268 mutants on the changed lines of 11 files.
  None survived, with 0 timeouts, 55 compile errors and 3 zero-mutant entries. For `slot-state.ts` the compile errors
  are at lines 24, 31, 36, 42 and 43, as in round 1. The run lists 5 equivalent records. The phase 1 one
  (slot-state.ts:50, `childList`) I accepted in round 1. The other four (contrast.ts:116, ocelle-context-sidebar.ts:43,
  ocelle-personal-rail.ts:44, ocelle-section-header.ts:166) are in code of later phases, which falls inside this base's
  range, and were judged in those phases' reviews. The fix-2 unit changes no source, so it adds no mutant.

## Checks run

All checks ran at HEAD `d93f145` with `SPECIFY_FEATURE_DIRECTORY=specs/011-layout-headers`,
`OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` and `OCELLE_VISUAL_ENGINE=docker`, with
dockerd running (server 29.9.2).

| Check | Result |
|---|---|
| `tdd-check.sh 1` (re-run: the committed result was for `33d7df1`) | pass, head `d93f145`, red `phase` and `fix-2` both exit 1, base exit 2, scaffold exit 2, head exit 0, no problem |
| `gate:typecheck` | pass |
| `gate:lint` | pass (304 files) |
| `gate:style-lint` | pass (19 files) |
| `gate:test-lint` | pass (207 files) |
| `pnpm test` | pass (3601 tests in 158 files) |
| `gate:mutation -- --base 767c097` | pass (0 survived) |
| `gate:csp` | pass (24 files) |
| `gate:prefix` | pass (298 files) |
| `gate:signoff -- --range 767c097..HEAD` | pass (51 commits) |
| `gate:pins` | pass |
| `gate:contrast` | pass (169 pairs light, 177 dark) |
| `gate:brand-rules` | pass (7 rules) |
| `gate:manifest` | pass (7 elements) |
| `gate:config-copies` | pass |
| `gate:storybook-build` | pass (57 stories) |
| `gate:visual -- --engine docker` | pass (114 captures match) |
| `gate:axe` | pass (114 runs, 0 serious or critical, 10 excepted notes) |
| `gate:plants` | **not completed**: the run was stopped at the 2-hour limit for background commands, with the visual plants still running (each about 140 s). The 252 plants that finished all behaved as expected and none was reported as failing. Phase 1's change since round 2 touches no gate. |

Other checks:

- **Tasks.** T001 to T008 are ticked and their work is present (round 1). T048's work is present but the task is not
  ticked (R3-01).
- **Changes outside the code.** `f7fe243` (planner) changed spec.md, research.md R-03, data-model.md,
  contracts/elements-package.md § Shell authors, plan.md § Fixes and tasks.md T048, and recorded why in
  `reviews/landing/round-1-tasks.md`. The README statement matches all of them: spec.md:202-203, 558-561 and 851-853,
  research.md:106-111, data-model.md:30 and contracts/elements-package.md:91-95.
- **Constitution.** The fix is documentation only. The README now carries no planning ID (the readme test at
  readme.test.ts:343-348 passes). It adds no public surface, so the manifest and the CHANGELOG are unchanged, which fits
  VII. VIII is met: the red commit came first and failed for the right reason.
- **Plan.** plan.md:280-282 is followed: no code change, `slot-state.ts` keeps its unflattened read, and the readme
  test came first.

## Earlier findings

- **R2-01** (blocking, operator round): **resolved.** The README has the section `## Forwarded slots`
  (README.md:530-536), between `## Slot convention` (ending at line 528) and `## Host ARIA` (line 538). It says that a
  forwarded `<slot>` with nothing assigned counts as content and keeps the wrapper, gap, padding or divider. It also
  tells shell authors to forward a slot only when it has content, or to remove the forwarding `<slot>`. That covers what
  R2-01 asks for. The red test came first: `fix-2` `f47c795` holds only tests and failed on the missing statement
  (`red-fix-2.log`, `check-red-fix-2.log`). The fix `cd81e00` turns it green: the readme test passes in `pnpm test` at
  HEAD. `slot-state.ts` was not changed, as `round-2-fixes.md` says. The only gap is bookkeeping: T048 is not ticked
  (R3-01).
- **R1-01** (round 1, accepted by the operator in `operator-accepted.md`): no longer applies. With dockerd running,
  `pnpm test` and the head run of `tdd-check.sh 1` both pass.
