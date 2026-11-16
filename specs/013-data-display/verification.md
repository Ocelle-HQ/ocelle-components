# Verification: 013-data-display

These are the GitHub-side checks for this mission's pull request. The orchestrator drafted this file from the CI
evidence on 2026-11-16, during the landing pass. An item counts as done only when it is marked **done** and its
evidence is filled in. The operator signs the file off at the end.

`plan.md` has no § Verification of its own. The items below are the standing GitHub-side checks that every mission
pull request gets, in the shape mission 006 set.

Pull request: https://github.com/Ocelle-HQ/ocelle-components/pull/43. Base `main` is at `c4c0af4` (op 016), merged
into the branch as `67435b9`. The pull request is part of #13.

## 1. The eighteen checks are green

Run https://github.com/Ocelle-HQ/ocelle-components/actions/runs/43794497845 is on head `67435b9`, after the landing
fold and both merges of `main`. All 83 of its jobs succeeded, so these eighteen checks of
`specs/001-repository-foundation/contracts/ci-checks.md` are green:

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
16. Storybook build
17. Visual regression (docker and podman)
18. Accessibility

The helper jobs are green too:

- `Mutation plan` and its 35 `Mutation shard` jobs; the slowest took 276 s.
- `Plants plan` and its 28 `Plants shard` jobs.

The two heads before this one were green as well: run 43793885028 on `97e208b` and run 43793702465 on `b81468b`.

Status: **done**. Re-confirm on the final head before the merge if the head moves.

## 2. Plants shard times (mission 006 decision 30, item 7)

10 of the 28 Plants shard jobs took longer than the 570 s stop-and-ask limit. The slowest was Plants shard (9), at
726 s.

| Measure | This run | Mission 006 landing |
|---|---|---|
| Plants gate step | up to 522 s | 321 s at most |
| Runner-cleanup step | 51 to 255 s | not recorded |

Unlike mission 006, this is real growth, not only runner variance: the stories of `ocelle-facts`,
`ocelle-empty-state` and `ocelle-progress` add work to the plants gate. The shard jobs have no timeout, so nothing
failed.

The operator accepted this on 2026-11-16 ("Accept, follow-up op (Recommended)"). There is no change in this pull
request. A follow-up op will re-split the plants shards for the larger story set (mission 006 decision 29) and bound
the cleanup step.

Status: **done** (accepted by the operator; the follow-up op is to be filed).

## 3. Required checks on `main`

This mission adds no CI check. The ruleset on `main` must require all eighteen checks above. Check whether the
three checks mission 006 added (Storybook build, Visual regression, Accessibility) and Custom-elements manifest are
required there.

Status: **open** (operator).

## 4. Merge method and the home of the evidence

Squash-merge this pull request, as for the earlier missions. The history was folded after each phase and once more
in landing. After the squash, the commits that the review files name by SHA are kept only on these branches:

- `claude/013-data-display`
- `archive/claude/013-data-display-prefold-phase-1` to `-phase-4`
- `archive/claude/013-data-display-prefold` (the landing fold)

Keep them all.

Status: **open** (operator, at merge).

## Sign-off

Operator: jeroennouwsdev, 2026-11-16. The orchestrator recorded this at the operator's request in the landing
session ("sign off verification").

At sign-off:

- Items 1 and 2 were done.
- CI run https://github.com/Ocelle-HQ/ocelle-components/actions/runs/43833386743 on the docs-only head `a42d8d4` was
  still running.
- Items 3 (the ruleset on `main`) and 4 (the squash-merge, by the operator) were still open.
