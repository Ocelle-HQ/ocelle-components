# Verification: 012-button-action-row

These are the GitHub-side checks for this mission's pull request. The orchestrator drafted this file from the CI
evidence on 2026-11-18, during the landing pass. An item counts as done only when it is marked **done** and its
evidence is filled in. The operator signs the file off at the end.

`plan.md` has no § Verification of its own. The items below are the standing GitHub-side checks that every mission
pull request gets, in the shape mission 006 set.

Pull request: https://github.com/Ocelle-HQ/ocelle-components/pull/50. Base `main` is at `b594b7e` (mission 009),
merged into the branch as `feac2fa`, after the earlier merges of `23ba5c5` (`8cd1f45`), `bea3130` (`4dc8e92`) and
`13af7a9` (`84e8bf0`). The pull request is part of #7.

## 1. The eighteen checks are green

Run https://github.com/Ocelle-HQ/ocelle-components/actions/runs/44556435164 is on head `89648311`, after phase 2 fix
round 4 (the icon-row baseline) and phase 6 fix-4 (the visual integration test's limit raised to 1200 s). All 149 of
its jobs succeeded on attempt 1, so these eighteen checks of `specs/001-repository-foundation/contracts/ci-checks.md`
are green:

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

- `Mutation plan` and its 52 `Mutation shard` jobs. The slowest, `packages/elements/src/ocelle-button.ts:511-540`,
  took 2648 s, under its 45-minute (2700 s) limit by 52 s (op 015).
- `Plants plan` and its 77 `Plants shard` jobs (item 2).

The visual integration test passed inside `Unit tests` (7768 tests in 233 files, 2277 s). The CI log gives no time for
the whole-repository capture on its own; locally it took 509 s (phase 6 T082).

Every commit after `89648311` changes only review records and the CI record: no source, test, story or configuration
file.

The earlier green run on `ac2d73a` was https://github.com/Ocelle-HQ/ocelle-components/actions/runs/44298568583. Run
https://github.com/Ocelle-HQ/ocelle-components/actions/runs/44481594952 on `571a8ed5` failed only the visual integration
test at its old 600 s limit (phase 6 round 7).

Status: **done** on `89648311`. Re-confirm on the final head before the merge.

## 2. Plants shard times (mission 006 decision 30; 012 T067)

| Measure | Run 44556435164 (`89648311`, 194 stories, 77 shards) | Run 44298568583 (`ac2d73a`, 194 stories, 77 shards) | Run 44098238937 (`497b05f`, 171 stories, 76 shards) |
|---|---|---|---|
| Plants gate step, slowest | 616 s (shard 41), 1 at or over 570 s | 524 s (shard 39), none at or over 570 s | 516 s (shard 40), none at or over 570 s |
| Plants gate step, total | 25357 s, 7.04 runner-hours | 24972 s, 6.94 runner-hours | 22953 s, 6.38 runner-hours |
| Shard job wall time, slowest | 728 s (shard 41), 30 shards over 570 s | 692 s (shard 21), 29 shards over 570 s | 862 s (shard 33), 17 shards over 570 s |
| Shard job wall time, total | 35558 s, 9.88 runner-hours | 34745 s, 9.65 runner-hours | 34810 s, 9.67 runner-hours |

The operator accepted the measured cost on 2026-11-17 ("Accept, file plant triage (Recommended)", 012 phase 6 round 2
O2-01), and T067 is ticked on the gate-step figure. The figures after 009's merge are recorded by the operator's
decision of 2026-11-18 (phase 6 round 4, O4-01). On `89648311` one shard's gate step (shard 41, 616 s) is over
570 s. The split count of 76 stories is exceeded at 194, and the plant-design triage, which covers both, is offered as
a follow-up issue (`reviews/phase-6/ci-run.md`; 006 `plan.md`, accepted costs).

Status: **done** (accepted by the operator; the follow-up issue is to be filed).

## 3. Required checks on `main`

This mission adds no CI check and renames none. The ruleset on `main` must require all eighteen checks above.

Status: **open** (operator).

## 4. Merge method and the home of the evidence

Squash-merge this pull request, as for the earlier missions. The history was folded after each phase. The landing
commits were not folded, because the branch has merged `main` four times since the last fold and the fold script
refuses merge commits. After the squash, the commits that the review files name by SHA are kept only on these
branches:

- `claude/007-actions-status`
- `archive/claude/007-actions-status-prefold-phase-1` to `-phase-6`

Keep them all.

Status: **open** (operator, at merge).
