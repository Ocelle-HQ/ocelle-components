# Verification: 006-storybook-workbench

The GitHub-side checks of this mission's pull request. The orchestrator drafted this file from CI evidence on
2026-11-13 during the landing pass. An item is done only when it is marked **done** and its evidence is filled in. The
operator signs it off at the end.

Pull request: https://github.com/Ocelle-HQ/ocelle-components/pull/24 (base `main` at `476602e`, closes #10).

## 1. The eighteen checks green

Run https://github.com/Ocelle-HQ/ocelle-components/actions/runs/43515169844 (head `0dbc59f`, after the landing fold):
168 of 168 jobs succeeded. These eighteen checks of `specs/001-repository-foundation/contracts/ci-checks.md` are
green:

1. Typecheck
2. Code lint
3. Style lint
4. Unit tests
5. Test lint
6. Mutation testing
7. Content security
8. Prefix
9. Story config copies
10. Install and pins
11. Sign-off
12. Plants (the verdict job)
13. Contrast
14. Brand rules
15. Custom-elements manifest
16. Storybook build (new in this mission)
17. Visual regression (new in this mission; docker and podman)
18. Accessibility (new in this mission)

The helper jobs are green too: `Mutation plan` and its 120 `Mutation shard` jobs (slowest 323 s), and `Plants plan`
and its 28 `Plants shard` jobs.

Status: **done**. Re-confirm on the final head before the merge.

## 2. Plants shard times (plan decision 30, item 7)

Plants shard (9) took 600 s in that run, above the 570 s stop-and-ask limit. The gate step itself took 303 s (296 s in
the run before, https://github.com/Ocelle-HQ/ocelle-components/actions/runs/43445129460); no shard's gate step took
more than 321 s. The difference is the runner-cleanup step that removes preinstalled toolsets (decision 25): 256 s on
that runner, 41 to 256 s across the run's shards (up to 173 s in the run before, whose slowest job took 547 s).

The operator accepted it on 2026-11-13 as runner variance ("Accept, follow-up op (Recommended)"): no change in this
pull request, and a follow-up op to bound or trim the cleanup step is proposed.

Status: **done** (accepted by the operator).

## 3. Required checks on `main`

The ruleset on `main` must require all eighteen checks above (plan decision 31). **Storybook build**, **Visual
regression** and **Accessibility** are new and must be added to it; until then they run but do not block a merge.
Mission 005's verification also left **Custom-elements manifest** for the operator to add: check that it is there.

Status: **open** (operator).

## 4. Merge method and evidence home

Squash-merge this pull request, as for missions 001, 002 and 005 (operator decision L1-08). The history was folded per
phase and once in landing, so the SHAs that the review files name live on the branch `claude/010-storybook-workbench`
and its archive refs `archive/claude/010-storybook-workbench-prefold-phase-1` to `-phase-5`,
`archive/claude/010-storybook-workbench-prefold-landing` and `archive/claude/010-storybook-workbench-prerebase`.
After the squash they are the only home of those commits: keep them all.

Status: **open** (operator, at merge).

## Sign-off

Operator: jeroennouwsdev, 2026-11-13. Recorded by the orchestrator at the operator's request in the landing session
("sign off verification.md for me"). At sign-off, items 1 and 2 were done; items 3 (the ruleset on `main`) and 4 (the
squash-merge, by the operator) were still open.
