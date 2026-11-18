# Verification: 011-layout-headers

These are the GitHub-side checks for this mission's pull request. The orchestrator drafted this file from the CI
evidence on 2026-11-16, during the landing pass. An item counts as done only when it is marked **done** and its
evidence is filled in. The operator signs the file off at the end.

`plan.md` has no § Verification of its own. The items below are the standing GitHub-side checks that every mission
pull request gets, in the shape mission 006 set.

Pull request: https://github.com/Ocelle-HQ/ocelle-components/pull/44. Base `main` is at `23ba5c5` (mission 013, after
op 016), merged into the branch as `cd80093`. The pull request closes #8.

## 1. The eighteen checks are green

Run https://github.com/Ocelle-HQ/ocelle-components/actions/runs/43943196107 is on head `cd80093`, after the landing
fold, the signed re-sign (operator decisions 11 and 12) and the merge of `main`. All 78 of its jobs succeeded, so
these eighteen checks of `specs/001-repository-foundation/contracts/ci-checks.md` are green:

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
17. Visual regression
18. Accessibility

The helper jobs are green too:

- `Mutation plan` and its 30 `Mutation shard` jobs.
- `Plants plan` and its 28 `Plants shard` jobs.

The Visual regression job is the cross-engine check that the pull request body listed as a known gap: the baselines
were made in the pinned docker container only, and CI confirms them.

The previous run, https://github.com/Ocelle-HQ/ocelle-components/actions/runs/43824638879 on `d93f145`, failed only
Sign-off (commit `3a7bc81` had no Signed-off-by line). The re-sign fixed that: Sign-off passes on 77 commits.

Status: **done**. Re-confirm on the final head before the merge if the head moves.

## 2. Plants shard times (mission 006 decision 30, item 7)

14 of the 28 Plants shard jobs took longer than the 570 s stop-and-ask limit: shards 6 to 19, from 696 s to 907 s.
The slowest was Plants shard (16), at 907 s. These are whole-job times, cleanup included.

This is the same growth that mission 013's landing recorded (10 shards over the limit, slowest 726 s), with this
mission's stories added on top. The shard jobs have no timeout, so nothing failed. The operator accepted the growth
for mission 013, with a follow-up op that re-splits the plants shards and bounds the cleanup step. This pull request
makes no change to the shards.

The operator accepted it for this mission on 2026-11-16 (decision 13, "Accept, same follow-up op").

Status: **done** (accepted by the operator; the follow-up op is mission 013's).

## 3. Required checks on `main`

This mission adds no CI check. The ruleset on `main` must require all eighteen checks above.

Status: **open** (operator).

## 4. Merge method and the home of the evidence

Squash-merge this pull request, as for the earlier missions. The history was folded after each phase and once more
in landing, then re-signed. After the squash, the commits that the review files name by SHA are kept only on these
branches:

- `claude/008-layout-headers`
- `archive/claude/008-layout-headers-prefold-phase-1` to `-phase-5`
- `archive/claude/008-layout-headers-pre-resign` (the landing history before the fold and the re-sign)
- `archive/claude/008-layout-headers-resign-unsigned` (the superseded first re-sign)

Keep them all.

Status: **open** (operator, at merge).
