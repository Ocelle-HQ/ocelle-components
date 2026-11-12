# Verification: 007-mutation-gate-strictness

The GitHub-side checks of this mission's pull request. The orchestrator drafted this file from CI evidence on
2026-11-12 during the landing pass. An item is done only when it is marked **done** and its evidence is filled in. The
operator signs it off at the end.

Pull request: https://github.com/Ocelle-HQ/ocelle-components/pull/25 (base `main` at `3a247ef`, closes #23).

The plan has no § Verification of its own: the mission adds no check, no job and no ruleset entry. These are the
landing pass's standing items.

## 1. The fourteen checks green

Run https://github.com/Ocelle-HQ/ocelle-components/actions/runs/43139597184 (head `a7e2381`, the revert of the
measurement commit; the tree of `packages/` and the gate code equals the folded head `208ea08`): conclusion
**success**. The fourteen checks of `specs/001-repository-foundation/contracts/ci-checks.md` (Typecheck, Code lint,
Style lint, Unit tests, Test lint, Mutation testing, Content security, Prefix, Story config copies, Install and pins,
Sign-off, Plants, Contrast, Brand rules) are green, with the `Mutation plan` and `Mutation shard` helper jobs.

Commits after `a7e2381` change only review records and documentation.

Status: **done**. Re-confirm on the final head before the merge.

## 2. FR-010's CI half (the `source.ts` shards within 480 s)

Run https://github.com/Ocelle-HQ/ocelle-components/actions/runs/43138324963 on the measurement commit `d8238ff`: all
29 jobs succeeded, and every shard holding a `source.ts` entry ran its `gate:mutation` step within 480 s (slowest
`source.ts:31-60`, 400 s). The figures, the plan and the core-count note are in `evidence/README.md` § "Result: CI
measurement". The measurement commit is reverted by `a7e2381`.

Status: **done**.

## 3. Required checks on `main`

No check name changed and no check was added, so the ruleset on `main` needs no change for this mission.

Status: **done** (nothing to change). The operator confirms.

## 4. Operator sign-off

Open for the operator: review the PR, mark it ready, and merge (squash, by the operator decision of landing note
L1-08 of an earlier mission). Keep the archive branches `archive/claude/023-mutation-gate-strictness-prefold` and
`-prefold-phase-1` to `-phase-3`: the review files name SHAs that only they keep.

Status: **open** (operator).
