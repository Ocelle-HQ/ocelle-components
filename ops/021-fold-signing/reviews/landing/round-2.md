---
scope: landing
phase: landing
round: 2
verdict: approved
base: 23ba5c57a1db18ca7f935fefdce77d156e86e8f5
head: 6a09a970c7765484bc6db62b948cbd1ba3853fb5
tdd_check: pass
---

# Landing review, round 2 (PR #53, op 021-fold-signing, #51)

Under the landing stop rule (operator decision 2026-11-03), this round checks only two things. First, that the
blocking finding of landing round 1 (L1-01) and the notes the operator brought in (L1-02, L1-03, L1-04, which became
O3-01 to O3-04 in `reviews/phase-1/round-3.md`) are resolved. Second, that the folds regressed nothing in
`origin/main...HEAD` (`23ba5c5...6a09a97`, 21 commits). It does not search afresh.

All four are resolved, and I re-derived each one on HEAD myself. Nothing regressed, and every check passes. No
blocking finding is left.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| L2-01 | note | tooling/speckit/bin/fold-history.sh:101, :140 | L1-05 (R2-01, R2-02) is still a follow-up, as the operator decided in phase 1 round 3. | None in this op. |
| L2-02 | note | CI | No pull-request CI run exists on HEAD `6a09a97` yet. The latest runs are on `e6e48e0` and earlier. Since `e6e48e0`, the only changes are check evidence (`2a32626`) and the round-5 review (`6a09a97`), and I ran the same checks locally on HEAD (see *Checks run*). | Confirm the run on the head goes green before merge. |

## Earlier findings

Landing round 1, through the operator round (phase 1 round 3), fix round `fix-3` (`2355951` red, `8cad293` fix),
and phase 1 rounds 4 and 5:

- **L1-01 / O3-01 (blocking): resolved.** The test at `gates/test/integration/fold-history.test.ts:333-353` points
  `refs/remotes/origin/main` and `refs/heads/main` at `foldBase` and runs the signed fold. It asserts exit 0,
  `ok:true`, `problems: []`, the base rewritten, both main refs unchanged and no unsigned commit in the range.
  In a throwaway worktree at HEAD, I re-ran MA (`(( on_main == 0 )) || die` -> `die`) and MB (first count from
  `"$base^..$old_head"`). Each is killed by this test, and by this test alone.
- **L1-02 / O3-02 (blocking via the operator): resolved.** `fold-history.sh:123` and both patterns at `:146` now
  match `{7,64}`. The SHA-256 test (`:372-401`) writes a `plants.md` and asserts that the `- base:` line is remapped
  to the new 64-character base and the other lines are unchanged. Its red commit `fix-3 2355951` exited 1
  (`tdd-check.json`). The P1 mutant (`:123` back to `{7,40}`) and P2 (the first `:146` pattern back to `{7,40}`)
  are each killed by the SHA-256 test.
- **L1-03 / O3-04 (blocking via the operator): resolved.** `.claude/skills/ocelle-land/SKILL.md:181` now gives the
  exit codes: 1 for a failed verification, 2 when the fold could not run. It also says the prefold ref is kept only
  after the rebuilt commits pass their checks, and is removed on a failed or unsigned remap commit. This matches
  the script: `die` exits 2 (`:26`), and the remap failure exits 1 after deleting the ref (`:139-140`). That one
  line is the only skill change in `origin/main...HEAD`.
- **L1-04 / O3-03 (blocking via the operator): resolved.** Scenario 3 asserts
  `could not build the folded commit`. Scenario 4 and the R1-02 test assert `the remap commit could not be signed`.
  Mutant T1 (rename the `commit-tree` `die` text) is killed by scenario 3. Mutant T2 (rename the remap problem
  text) is killed by scenario 4 and the R1-02 test.
- L1-05 is carried as L2-01. L1-06 is documented in the spec. L1-07 is closed: the operator round records that
  #51 was read and matches what was built.

## Regression check

- **Code since landing round 1** (`git diff 58ffad2..HEAD`, outside `reviews/`): there are three source changes.
  `fold-history.sh` changes on two lines (`:123`, `:146`, the widening only). The skill changes on one line. The
  test file adds one test and widens the expected objects of four existing tests. The rest is `spec.md` (the scope
  amendment for O3-02 and O3-04), `plan.md` and `tasks.md`.
- **No weakening.** Every expected value that existed at `58ffad2` is still asserted. The four changed tests only
  gained fields (`notBuilt`, `remapUnsigned`, `plantsBase`, `plantsOther`). `signedRepo`'s new `withPlants`
  parameter defaults to `false`, so the other tests' repositories are unchanged. `git diff 2355951..HEAD --
  gates/test/` is empty.
- **Scope of the whole PR.** Outside `ops/` and `triage/`, `origin/main...HEAD` touches only `fold-history.sh`,
  `tooling/speckit/README.md`, the test file, the one skill line, and the orchestrator's run summary under
  `knowledge/speckit-flows/runs/`. That summary was already present at round 1. Nothing in `.github/`, `gates/bin/`,
  `packages/` or `storybook/` changed.
- **The folds.** All 21 commits of `origin/main..HEAD` carry exactly one `gpgsig` header and a `Signed-off-by`
  trailer. `tdd-check.json` is `pass` on head `e6e48e0`. Its red commits are `phase 65a0c7f`, `fix-1 09b6f7e` and
  `fix-3 2355951`, which each exited 1, and the final tests fail against the base. Since `e6e48e0`, only evidence and
  review files changed.

## Checks run

On HEAD `6a09a97`, with a clean working tree:

- `pnpm test`: exit 0, 3852 tests passed in 153 files.
- `pnpm run gate:typecheck`, `gate:lint`, `gate:test-lint`: exit 0.
- `pnpm run gate:signoff -- --range origin/main..HEAD`: exit 0, 21 commits, no finding.
- `vitest run --project gates-integration gates/test/integration/fold-history.test.ts` in a throwaway worktree at
  HEAD, which I removed afterwards: 10 of 10 pass unmutated. All six hand mutants are killed:

  | Mutant | Change | Result |
  |---|---|---|
  | MA | guard refuses whenever a main ref exists | killed (O3-01 test) |
  | MB | first guard count from `$base^` | killed (O3-01 test) |
  | P1 | `plants.md` remap `sed` (`:123`) back to `{7,40}` | killed (SHA-256 test) |
  | P2 | `base_line_only` `^-- base:` (`:146`) back to `{7,40}` | killed (SHA-256 test) |
  | T1 | `commit-tree` `die` text renamed | killed (scenario 3) |
  | T2 | remap problem text renamed | killed (scenario 4, R1-02 test) |

- `gate:mutation` covers TypeScript only, and no TypeScript source changed (phase 1 round 5). I did not re-run it.
- I did not read GitHub. The CI state is as given in the brief (L2-02).

## Verdict

approved. No blocking finding is left. L1-01 and the three operator-promoted notes are resolved, and the folds
regressed nothing.
