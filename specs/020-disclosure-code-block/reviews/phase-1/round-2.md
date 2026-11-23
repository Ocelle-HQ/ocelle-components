---
phase: 1
round: 2
verdict: changes_requested
base: c7ba57d98f410d956c5c072302c8b34ae221dc5b
head: baf9e9f836f6192b45f060c63540a2deea3d5d48
tdd_check: pass
---

# Phase 1 review, round 2

Scope: `git diff c7ba57d..baf9e9f` (User Story 1, `ocelle-disclosure`). There is no uncommitted change. Since
round 1 (`74f7406`) the diff adds the round-1 fix `22b3846` (two gate-test pins, the plant record and the fix note) and
`baf9e9f`, which holds only the tdd-check evidence. Operator decisions applied: `reviews/phase-1/operator-spike-decisions.md`
(the summary is named from `.label`) and `reviews/operator-ci-first.md` (CI-first: the full plant set, the full
visual, axe and Storybook-build runs and the mutation shards are CI's, and sandbox paths are redacted). `tdd-check.json`
was written for `22b3846`. HEAD `baf9e9f` adds only that check's own evidence, so the check is current for the code.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R2-01 | blocking | specs/020-disclosure-code-block/tasks.md:209 | T013 is still unticked. Its checkpoint is now met: `tdd-check.json` has `status: pass` and `head_exit: 0`. Its work is present under the CI-first reading. Step 1's disclosure plants are in `plants.md` § Element plants, and all ten bite. Step 2's fast gates pass (this review re-ran them, see below). Step 3's scope diff is in `notes.md` § Gates. Step 4's `visual:update` line and its no-podman statement are in `notes.md`:118-122. The fix note (R1-05) says T013 is ticked once the check passes. That has not happened, and the procedure requires every task of the phase to be ticked. | Tick T013 and add a line saying which of its steps are left to CI: the full plant set, `gate:storybook-build`, `gate:visual` and `gate:axe` on the full Storybook, and `gate:mutation`. |
| R2-02 | note | specs/020-disclosure-code-block/reviews/phase-1/plants.md:5 | The recorded exit of the affected plant run is still 143. The run was stopped by the operator's CI-first decision, and the selection is the full set (rechecked below). I apply that decision, as round 1 did (R1-04). | None in this phase. CI's required Plants check must pass before merge. |

## Test quality

- **Red evidence.** Unchanged from round 1. The one red commit is `f479a3b` (`red-commits`: `phase`), and its exit
  code was 1. The regenerated `check-red-phase.log` and `check-final-tests-on-scaffold.log` fail only on
  `AssertionError`s. The final tests on the base exit 2 ("no test file found"), and on the scaffold they exit 1.
  At HEAD the full unit-tests run passes: `unit-tests: 7957 tests passed in 236 files` (`check-head.log`).
- **Round-1 fix.** There is no `fix-1` red commit. That is correct here: R1-01 and R1-02 were stale count pins in gate
  tests, not behaviour defects, and both tests were already red at the round-1 HEAD. The fix makes each pin stricter
  for this repository, not looser. `plant-repo.test.ts:225` pins exactly 404 baselines, and `axe.test.ts:68` expects
  exactly `axe: 2 findings in 406 story-theme runs`. Each still compares an exact value.
- **No weakening.** `git diff f479a3b..HEAD` over `packages/elements/test` and `storybook/test` has no removed line.
  The only additions are the eight mutation-survivor bodies in `test/scenarios/disclosure.ts`, which were reviewed in
  round 1. Over `gates/test` the only changes are the two pin updates above.
- **Assertions and coverage.** Unchanged since round 1 (see `round-1.md` § Test quality). Every US1 scenario, FR
  body, edge case and keyboard path has a body, and each runs in both harnesses.
- **Scaffold.** `dfc24ba` is unchanged: it adds signatures only and no test file, and the final tests fail against it.
- **Mutation.** I did not run it. Under the CI-first decision the mutation shards are CI's, and the phase's source
  has not changed since round 1. The implementer's record (`notes.md` § Mutation): 121 mutants on changed lines,
  none surviving, 2 timeouts, 25 compile errors and no equivalent-mutant record.

## Checks run

Run locally on HEAD `baf9e9f`:
- `gate:typecheck` (no type error), `gate:lint` (453 files), `gate:style-lint` (42), `gate:test-lint` (333),
  `gate:prefix` (477), `gate:config-copies` (identical), `gate:manifest` (`21 elements checked, no finding`),
  `gate:contrast` (207 / 215 pairs, 196 required), and `gate:csp` after `pnpm -r run build` (`47 files checked, no
  finding`). `gate:signoff -- --range c7ba57d..HEAD` printed `12 commits checked, no finding`. All of them exited 0.
- `vitest run gates/test/integration/plant-repo.test.ts`: 33 passed (R1-01).
- `vitest run gates/test/integration/axe.test.ts -t "unlabelled button"`: 1 passed, 3 skipped by the filter, 249 s
  (R1-02).
- vitest on `packages/elements/test/disclosure.test.ts`, `test/browser/disclosure.test.ts`,
  `test/entry-disclosure.test.ts` and `storybook/test/integration/elements-stories.test.ts -t disclosure`: 156 passed
  (53 in process, 53 on the strict-CSP fixture, 1 entry and 49 story tests).
- `gate:plants -- --affected c7ba57d98f410d956c5c072302c8b34ae221dc5b --list` printed `note: affected: every plant, by
  packages/elements/package.json (not mapped)` and `317 of 317 plants selected`. The base and the selection match
  `plants.md`.
- From the tdd-check (`check-head.log`), the full unit-tests run at `22b3846`: 7957 passed.

Left to CI, by the operator's CI-first decision: the full plant set, `gate:storybook-build`, `gate:visual` and
`gate:axe` on the full Storybook, and the mutation shards. The implementer's earlier summary lines for those gates, and
the note that no podman cross-check was possible, are in `notes.md`:118-127.

Constitution and plan: the phase's source, stories and baselines have not changed since round 1, and round 1's
findings on them still hold. This covers the names and events, the absence of I/O, tokens only, the accessibility
rules (no `delegatesFocus`, no ID crossing a root, focus rescue), and the stories and baselines for each state.
**Path redaction:** the tdd-check logs regenerated in `baf9e9f` contain no `/root/` or `/home/user/` path. The only
matches under `reviews/` are prose that names the rule (`operator-ci-first.md`, `round-1.md`:85, and the plan lens file
`reviews/plan/round-1/lens-correctness.yaml`, which is outside this phase).

## Earlier findings

- **R1-01 (blocking): resolved.** `gates/test/integration/plant-repo.test.ts:225` pins 404, and
  `storybook/baselines` holds 404 files. The test passes (33/33 in this review) and the full run at `22b3846` passes.
- **R1-02 (blocking): resolved.** `gates/test/integration/axe.test.ts:68` expects `axe: 2 findings in 406 story-theme
  runs`. The test passes in this review (1 passed, 249 s) and in the full run at `22b3846`.
- R1-03 (note): resolved. `plants.md`:5-10 says 317 and records the `--list` recheck.
- R1-04 (note): deferred to CI by the operator decision. It is carried as R2-02.
- R1-05 (note): `tdd-check.sh 1` now reports `pass`, but T013 is still unticked. This is now R2-01, which is
  blocking because the condition the fix note set for ticking it is met.
