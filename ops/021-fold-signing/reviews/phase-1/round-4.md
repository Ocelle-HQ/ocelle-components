---
phase: 1
round: 4
verdict: changes_requested
base: 34ce2afba10b57e4d2df972f1f9497b283c0b75e
head: 4e58018a356440979885cd6445527c61dff4d300
tdd_check: pass
---

# Phase 1 review, round 4

The fix round resolves all four blocking findings of operator round 3 (O3-01 to O3-04). The red commit for O3-02
fails for the right reason, no test was weakened, and every check passes. I reran each hand mutant the fix note
names, and each is killed. One blocking finding is left, and it is bookkeeping: none of the nine tasks of the
operator round (T011 to T019) is ticked in `tasks.md`, although the work for each one is present.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R4-01 | blocking | ops/021-fold-signing/tasks.md:57-60, :64-65, :69-71 | T011 to T019 (*Operator round 3*, under `## Phase 1:`) are all still `- [ ]`. The review procedure requires every task of the phase to be ticked. The work of each task is present: T011 to T014 in red commit `2355951`, T015 and T016 in `8cad293`, and T017 to T019 in `round-3-fixes.md` and the evidence (see *Earlier findings*). | Tick T011 to T019. Change nothing else in `tasks.md`. |
| R4-02 | note | tooling/speckit/bin/fold-history.sh:101 | R2-01 / R1-04 still stands. It is a follow-up under L1-05. `has_sig` can report a signed commit as unsigned when the commit object is bigger than the pipe buffer, which is on the safe side. | None in this op. |
| R4-03 | note | tooling/speckit/bin/fold-history.sh:140 | R2-02 / R1-05 still stands. It is a follow-up under L1-05. With signing off, a failing remap `git commit` reports "the remap commit could not be signed". The O3-03 tests now pin that text for the signing-on paths, so a later rewording must update them. | None in this op. |
| R4-04 | note | ops/021-fold-signing/reviews/phase-1/tdd-check.json | It records head `8cad293`. HEAD `4e58018` adds only the check evidence files (`git show --stat 4e58018`), so the check still applies to the code under review. | None. |
| R4-05 | note | knowledge/speckit-flows/runs/ | The diff since base includes the orchestrator's run summary (`58ffad21`). The fix note names it, and it is not part of this op's change. | None. |

## Test quality

- **Red evidence.** `red-commits` has `phase 65a0c7f`, `fix-1 09b6f7e` (remapped by the phase fold, see
  `history-map.txt`), and `fix-3 2355951`. `2355951` changes only `gates/test/integration/fold-history.test.ts`.
  `red-fix-3.log` shows exactly one failure out of 3852, the SHA-256 test, on its `toEqual`. I reproduced the red
  run at `2355951` in a throwaway worktree. The diff is on the `plantsBase` field:
  `- base: <new 64-character base.sha>` was expected and the stale `- base: <old phase base>` was received. So the
  test failed because the behaviour was missing, not because of setup. The O3-01 test and the three O3-03
  assertions passed at the red commit, as the fix procedure allows for coverage of behaviour that is already
  right. `check-final-tests-on-base.log` shows the final tests failing against base (exit 1).
- **No weakening.** `git diff 2355951..HEAD -- gates/test/` is empty. Inside `2355951`, the only edits to existing
  lines are these. `signedRepo` gets a third parameter, `withPlants`, which defaults to `false` and adds a
  `plants` field. Scenarios 3 and 4 and the R1-02 test move their existing expected values into a larger object
  and add `notBuilt: true` or `remapUnsigned: true`. The SHA-256 test keeps every expected value it had
  (`commits: 4` included) and adds `plantsBase` and `plantsOther`. No expected value was dropped or loosened.
- **Assertions.** Each test is still one `toEqual` on observable facts. The O3-01 test
  (`fold-history.test.ts:334`) asserts exit 0, `ok:true`, `problems: []`, the base rewritten, both main refs
  still at `foldBase`, and no unsigned commit. The problem-text checks (`:271`, `:288`, `:364`) are booleans
  inside the `toEqual`, in the same form as scenario 5. None is conditional, uses `skip`/`only` or a snapshot, or
  asserts on a mock.
- **Mutation.** `pnpm run gate:mutation -- --base 34ce2af…` reports "nothing to mutate: no package or gate source
  line changed". The gate covers TypeScript only, and no equivalent-mutant records apply. I ran hand mutants of
  `fold-history.sh` against `fold-history.test.ts`
  (`vitest run --project gates-integration`, 10 tests) in a throwaway worktree at HEAD, which I removed
  afterwards:

  | Mutant | Change | Result |
  |---|---|---|
  | MA | `(( on_main == 0 )) \|\| die …` -> `die …` | killed (O3-01 test only) |
  | MB | first count `"$base..$old_head"` -> `"$base^..$old_head"` | killed (O3-01 test only) |
  | P1 | remap `sed` pattern (`:123`) back to `{7,40}` | killed (SHA-256 test) |
  | P2 | `base_line_only` `^-- base:` (`:146`) back to `{7,40}` | killed (SHA-256 test) |
  | P3 | `base_line_only` `^\+- base:` (`:146`) back to `{7,40}` | killed (SHA-256 test) |
  | Pall | all three `- base:` patterns back to `{7,40}` (the pre-fix script) | killed (SHA-256 test) |
  | T1 | `commit-tree` `die` message -> `working tree not clean` | killed (scenario 3) |
  | T2 | remap problem text -> `final tree differs outside the evidence files` | killed (scenario 4 and the R1-02 test) |
  | M1 | `sign=(-S)` -> `sign=()` | killed (6 tests) |
  | M6 | drop the `\|\| { (( ${#sign[@]} )) && ! has_sig HEAD; }` clause | killed (R1-02 test) |
  | M9 | main refs list without `refs/remotes/origin/main` | killed (R1-01 test) |
  | M10 | `^gpgsig(-sha256)? ` -> `^gpgsig ` | killed (SHA-256 test) |
  | M12 | `pr-base` regex `{7,64}` -> `{7,40}` | killed (SHA-256 test) |
  | M13 | drop the `has_sig` check of rebuilt commits | killed (scenario 2) |

  No mutant survives.

## Checks run

All on HEAD `4e58018`, working tree clean:

- `pnpm test`: exit 0, 3852 tests passed in 153 files.
- `pnpm run gate:typecheck`: exit 0, no type error.
- `pnpm run gate:lint`: exit 0, 297 files, no finding.
- `pnpm run gate:test-lint`: exit 0, 203 files, no finding.
- `pnpm run gate:mutation -- --base 34ce2af…`: exit 0, nothing to mutate (see *Test quality*).
- `pnpm run gate:plants -- --affected 34ce2af… --list`: exit 0, "0 of 309 plants selected", no `note: affected:`
  line. `plants.md` records the same base as `base.sha`, the same empty selection, and exit 0. This matches.
- `tdd-check.json`: `pass`. Red `phase`, `fix-1` and `fix-3` each exited 1, the final tests on base exited 1, head
  exited 0, and no problems are listed.
- Tasks: T001 to T010 are ticked and present. T011 to T019 are not ticked (R4-01), but their work is present.
- Scope (T018): outside `ops/021-fold-signing/`, the diff since base touches only the test file, `fold-history.sh`,
  `tooling/speckit/README.md`, `.claude/skills/ocelle-land/SKILL.md` and the run summary (R4-05). The skill's
  diff is the one line at `:181`. Nothing in `.github/` or `gates/bin/` changed, and no other skill changed.
  `fold-history.sh` changed in this round only on lines 123 and 146.
- Plan and spec: the fix follows plan.md *Operator round 3*. The spec amendment (`c82f89c`) brings O3-02 and O3-04
  into scope, and nothing beyond them changed.
- The O3-04 sentence matches the script. `die` exits 2 (`:26`, which covers the main guard and a `commit-tree`
  failure). Verification failures exit 1 (`:106`, `:140`, `:151`). The prefold ref is written only after the
  rebuilt-commit checks pass (`:109`) and is deleted on a failed or unsigned remap commit (`:139`).
- Constitution: I to VII are not touched (no element, token, story, baseline or package change). No CI gate
  changed, so no plant is needed. Every commit in `34ce2af..HEAD` (14) carries a `gpgsig` header and
  `Signed-off-by`.
- Interaction, visual, axe and CSP checks: a shell script, an integration test and a skill sentence cannot affect
  them.

## Earlier findings

Round 3 (operator round):

- **O3-01 (blocking): resolved.** The test at `fold-history.test.ts:334` puts `refs/remotes/origin/main` and
  `refs/heads/main` at `foldBase`. It asserts that the signed fold succeeds and leaves both refs alone. MA and MB
  are each killed by this test alone.
- **O3-02 (blocking): resolved.** It was red first (`fix-3 2355951`, reproduced above). The SHA-256 test now writes
  a `plants.md` and asserts that the `- base:` line is remapped and the other lines are unchanged. The fix widens
  `fold-history.sh:123` and both patterns at `:146` to `{7,64}`. P1, P2, P3 and Pall are killed.
- **O3-03 (blocking): resolved.** Scenario 3 (`:271`) asserts `could not build the folded commit`. Scenario 4
  (`:288`) and the R1-02 test (`:364`) assert `the remap commit could not be signed`. T1 and T2 are killed.
- **O3-04 (blocking): resolved.** `.claude/skills/ocelle-land/SKILL.md:181` now states the exit codes and when the
  prefold ref is kept, and it matches the script (see *Checks run*). It is docs only, so it needs no red test.
