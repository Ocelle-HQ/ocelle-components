# Verification: 002-design-tokens

The GitHub-side checks of this mission's pull request. The orchestrator drafted this file from CI evidence on
2026-11-05 during the landing pass. An item is done only when it is marked **done** and its evidence is filled in. The
operator signs it off at the end.

Pull request: https://github.com/Ocelle-HQ/ocelle-components/pull/19 (base `main` at `eaf1689`, closes #5).

## 1. The fourteen checks green

Run https://github.com/Ocelle-HQ/ocelle-components/actions/runs/42000934866 (head `7fb1a86`, the last code change of
the landing pass): 39 of 39 jobs succeeded. These fourteen checks of
`specs/001-repository-foundation/contracts/ci-checks.md` are green:

1. Typecheck
2. Code lint
3. Style lint
4. Unit tests (on the pinned Node 26.13.0)
5. Test lint
6. Mutation testing
7. Content security
8. Prefix
9. Story config copies
10. Install and pins
11. Sign-off
12. Plants
13. Contrast (new in this mission)
14. Brand rules (new in this mission)

The helper jobs `Mutation plan` and the 24 `Mutation shard` jobs are green too. The slowest shard,
`packages/tokens/src/generate.ts:121-180`, took 7:47 of its 10 minutes (entries of at most 60 changed lines since
phase 5 round 6). Every commit after `7fb1a86` changes only documentation and review records; CI on those heads
(`8e14b6c`, `d5cc5e1`) finished with no failed check.

Status: **done**. Re-confirm on the final head before the merge.

## 2. Required checks on `main`

The ruleset `main-required-checks` (id 26484239) requires the twelve checks of mission 001. **Contrast** and **Brand
rules** are new and must be added to it; until then neither blocks a merge.

Done on 2026-11-09 by the operator (`gh api -X PUT …/rulesets/26484239`). `gh api
repos/Ocelle-HQ/ocelle-components/rules/branches/main` then listed the rules `required_status_checks`, `pull_request`
and `non_fast_forward`, and the required checks were the fourteen above.

Status: **done**.

## 3. Direct pushes to `main`

Landing round 2 note L2-01: the agent allow rules in `.claude/settings.json` prompt for every push but a plain push of
this branch, but a local `remote.origin.push` mapping could still send that push to `main`. Confirm that the ruleset
on `main` blocks direct pushes and force-pushes (or add that rule).

Done on 2026-11-09: the same ruleset now has a `pull_request` rule (direct pushes to `main` are refused) and a
`non_fast_forward` rule (force-pushes are refused), with no bypass actors.

Status: **done**.

## 4. Merge method and evidence home

Squash-merge this pull request, as for mission 001 (operator decision L1-08). The history was not folded (operator
decision, `reviews/landing/operator-decisions.md`), so every SHA that `reviews/phase-N/base.sha`, `scaffold.sha`,
`red-commits` and the review files name is on the branch `claude/kitty-ui-speckit-decouple-x3prkx`. After the squash it
is the only home of those commits: keep it, and keep `archive/claude/kitty-ui-speckit-decouple-x3prkx-prefold` from
mission 001.

Squash-merged on 2026-11-09 as `ec0f533` ("Mission 002: design tokens (#5) (#19)"). Its tree is identical to the PR head
`4845030`, and both `claude/kitty-ui-speckit-decouple-x3prkx` (`4845030`) and
`archive/claude/kitty-ui-speckit-decouple-x3prkx-prefold` (`37bfdb7`) are still on the remote.

Status: **done**. Keep both branches.

## Sign-off

Operator: _pending_
