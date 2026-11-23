---
phase: 1
round: 2
verdict: approved
base: 34ce2afba10b57e4d2df972f1f9497b283c0b75e
head: 2cb91cf1b5b415bb7547cff89d3dcf394d8e1039
tdd_check: pass
---

# Phase 1 review, round 2

The fixes resolve all three blocking findings of round 1. Each surviving hand mutant (M6, M9, M10) is now killed
by a new test, and I reran each one myself. The R1-03 test found a real defect, a `pr-base` check that rejected
64-character SHAs. It came with a red commit (`fix-1 63d4745`) and a one-line fix. No test was weakened, and every
check passes. What remains are notes.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R2-01 | note | tooling/speckit/bin/fold-history.sh:101 | R1-04 still stands, deferred by the fixer. `has_sig` pipes `git cat-file commit` into `grep -q` under `pipefail`, so a commit object larger than the pipe buffer can report a signed commit as unsigned. If that happens the fold refuses, which is the safe side, and it is unlikely. | Optional, as in R1-04. |
| R2-02 | note | tooling/speckit/bin/fold-history.sh:140 | R1-05 still stands, deferred by the fixer. With signing off, a failing remap `git commit` reports "the remap commit could not be signed". | Optional: "the remap commit failed or is not signed". |
| R2-03 | note | tooling/speckit/bin/fold-history.sh:123, :146 | The fixer named this in `round-1-fixes.md`. In a SHA-256 repository the `- base:` line of `plants.md` is still matched as `[0-9a-f]{7,40}`, so it would not be remapped. That is op 016 code, and spec *Out of scope* excludes "evidence remapping", so it is not a finding against this op. This repository is SHA-1. | None here; a follow-up if SHA-256 repositories are ever used. |
| R2-04 | note | ops/021-fold-signing/reviews/phase-1/tdd-check.json | `tdd-check.json` records head `0d1a1d3`. HEAD `2cb91cf` adds only the check evidence files (`git show --stat 2cb91cf`), so the check still applies to the code under review. | None. |

## Test quality

- **Red evidence.** `red-commits` has `phase c38d610` (unchanged from round 1) and `fix-1 63d4745`. `63d4745`
  changes only `gates/test/integration/fold-history.test.ts`. `red-fix-1.log` shows exactly one failure, the
  R1-03 test, on its `toEqual` assertion: `{ status: 2, ok: false … }` against `{ status: 0, ok: true … }`. That
  is the old `pr-base` regex dying on a 64-character SHA, so the test failed because the behaviour was missing,
  not because of setup. The R1-01 and R1-02 tests close coverage gaps, and the phase's code already had that
  behaviour, so they passed at the red commit. `check-final-tests-on-base.log` shows them failing against the base
  (8 of 3851, all eight op-021 tests), so they can fail.
- **No weakening.** `git diff 63d4745..HEAD -- gates/test/` is empty, and so is `git diff c38d610..HEAD`, apart
  from the additions in `63d4745`. In that commit the only edits to existing lines are in `signedRepo`. It gains an
  `objectFormat` parameter that defaults to `sha1`, and `git init` passes `--object-format`, so the earlier tests
  run exactly as before. No assertion was loosened.
- **Assertions.** Each new test has one `toEqual` on observable facts. R1-01 checks exit 2, `ok:false`, that there
  is no local main, an `on main` problem, unchanged state and no prefold ref. R1-02 checks exit 1, `ok:false`,
  unchanged state and no prefold ref. R1-03 checks exit 0, `ok:true`, that the base was rewritten, object format
  `sha256`, 4 commits and none unsigned. None is conditional, uses `skip`/`only` or a snapshot, or asserts on a
  mock. The `unsignedRemapGit` wrapper matches only a first argument of `commit`, so `commit-tree` still signs. The
  test therefore reaches the second half of the remap check, as R1-02 asked.
- **Mutation.** `pnpm run gate:mutation -- --base 34ce2af…` reports "nothing to mutate". The gate covers
  TypeScript only, and no equivalent-mutant records apply. I reran hand mutants of `fold-history.sh` against
  `fold-history.test.ts` in a throwaway worktree, which I removed afterwards:

  | Mutant | Change | Result |
  |---|---|---|
  | M1 | `sign=(-S)` -> `sign=()` | killed (5 tests) |
  | M6 | drop the `\|\| { (( ${#sign[@]} )) && ! has_sig HEAD; }` clause | killed (R1-02 test) |
  | M6b | the clause's `(( … )) && ! has_sig HEAD` -> `false` | killed (R1-02 test) |
  | M9 | main refs list without `refs/remotes/origin/main` | killed (R1-01 test) |
  | M10 | `^gpgsig(-sha256)? ` -> `^gpgsig ` | killed (R1-03 test) |
  | M12 | `pr-base` regex `{7,64}` -> `{7,40}` (reverts the fix) | killed (R1-03 test) |
  | M13 | drop the `has_sig` check of rebuilt commits | killed (scenario 2 test) |

  No mutant survives.

## Checks run

All on HEAD `2cb91cf`, working tree clean:

- `pnpm test`: exit 0, 3851 tests passed in 153 files.
- `pnpm run gate:typecheck`: exit 0, no type error.
- `pnpm run gate:lint`: exit 0, 297 files, no finding.
- `pnpm run gate:test-lint`: exit 0, 203 files, no finding.
- `pnpm run gate:mutation -- --base 34ce2af…`: exit 0, nothing to mutate (see *Test quality*).
- `pnpm run gate:plants -- --affected 34ce2af… --list`: exit 0, "0 of 309 plants selected", no `note: affected:`
  line. `plants.md` records the same base as `base.sha`, the same empty selection, and exit 0. This matches.
- `tdd-check.json`: `pass`. Red `phase` exited 1, red `fix-1` exited 1, the final tests on base exited 1, head
  exited 0, and no problems are listed.
- Tasks: all 10 tasks of `## Phase 1:` are ticked and their work is present. The fix round changed only
  `fold-history.sh:27` (one regex), the test file and the phase's review evidence. It changed nothing outside the
  phase.
- Plan: the fix does not depart from plan.md. Only the `pr-base` validation was widened, and it still requires
  `git cat-file -e "$base^{commit}"`.
- Constitution: I to VII are not touched (no element, token, story, baseline or package change). No CI gate
  changed, so no plant is needed. Every phase commit since base, `63d4745`, `0d1a1d3` and `2cb91cf` included,
  carries a `gpgsig` header and `Signed-off-by`.
- Interaction, visual, axe and CSP checks: a shell script and an integration test cannot affect them. `pnpm test`
  covers the unit and integration projects.

## Earlier findings

- **R1-01 (blocking): resolved.** The new test at `fold-history.test.ts:307` sets only
  `refs/remotes/origin/main` (`update-ref`, no local main) and asserts exit 2 with an `on main` problem and no
  change. It fails against base (`check-final-tests-on-base.log`). Mutant M9 is now killed.
- **R1-02 (blocking): resolved.** The new test at `fold-history.test.ts:326` uses `unsignedRemapGit`, so the remap
  commit succeeds unsigned. It asserts exit 1, `ok:false`, unchanged state and no prefold ref. It fails against
  base. Mutants M6 and M6b are now killed.
- **R1-03 (blocking): resolved.** The new test at `fold-history.test.ts:342` runs the signed fold in a
  `--object-format=sha256` repository and asserts every commit is signed. It exposed the 40-character `pr-base`
  limit. That is a behavioural fix, and it came with a red test (`fix-1 63d4745`, `red-fix-1.log`). The fix is at
  `fold-history.sh:27`. Mutants M10 and M12 are now killed.
- R1-04 and R1-05 (notes): deferred; carried as R2-01 and R2-02. R1-06 (note): needed no change.
