# Verification: 014-selection-input

These are the GitHub-side checks for this mission's pull request. The orchestrator drafted this file from the CI
evidence on 2026-11-20, during the landing pass. An item counts as done only when it is marked **done** and its
evidence is filled in. The operator signs the file off at the end.

`plan.md` has no § Verification of its own. The items below are the standing GitHub-side checks that every mission
pull request gets, in the shape mission 006 set.

Pull request: https://github.com/Ocelle-HQ/ocelle-components/pull/54 (issue #14). Base `main` was merged into the
branch twice:
- `b594b7e` (missions 008, 009, 011 and 013, ops 015 and 016) as `ac2f991`;
- `7f61959` (missions 010 and 012, op 021 and the 017 triage record) as `e47888d`.

Both merges are recorded in `reviews/landing/merge-notes.md`, with landing operator decisions 1, 3 and 4.

## 1. The eighteen checks are green

Run https://github.com/Ocelle-HQ/ocelle-components/actions/runs/44797053961 is on head `749a41d`. That head is the
second merge plus its records and the redaction of sandbox paths in the phase logs. All 177 of its jobs succeeded on
attempt 1, so these eighteen checks of `specs/001-repository-foundation/contracts/ci-checks.md` are green:

1. Typecheck
2. Code lint
3. Style lint
4. Unit tests (9666 tests in 284 files)
5. Test lint
6. Mutation testing
7. Content security
8. Prefix
9. Story config copies
10. Install and pins
11. Sign-off
12. Plants (the verdict job: "317 plants of 17 gates and the registry judged, every plant as expected")
13. Contrast
14. Brand rules
15. Custom-elements manifest
16. Storybook build
17. Visual regression (no baseline moved after the second merge)
18. Accessibility

The helper jobs are green too:

- `Mutation plan` and its 80 `Mutation shard` jobs. The slowest job, a shard over `ocelle-option.ts` and
  `ocelle-segment.ts`, took 3078 s of wall time.
- `Plants plan` and its 77 `Plants shard` jobs. The slowest job, shard 36, took 1012 s of wall time; 44 shards ran
  over 570 s.

Under landing operator decision 5 ("CI carries heavy gates"), this run stands in for the full local plants run that
phase 6 decision 5 and phase 7 decision 3 asked for (`reviews/phase-6/plants.md`, `reviews/phase-7/plants.md`).

Commits after `749a41d` change only docs, records, the package changelogs and the readme tests that pin the
changelog wording. That includes the planner's wording commit `bcd5506`, whose own CI run had not finished when this
file was written. None of them changes source, a story or configuration.

Status: **done** on `749a41d`. Re-confirm on the final head before the merge.

## 2. Plants shard times (mission 006 decision 30)

Run 44797053961 has 259 stories, 518 story-themes and 77 shards. The job wall times sum to 43000 s, 11.9
runner-hours. The growth of the plant cost with the story count is the plant-design triage follow-up that 012
offered (012 `verification.md` § 2). This mission adds 35 stories to it.

Status: **open** (operator: accept the measured cost, or fold it into the plant-design triage).

## 3. Required checks on `main`

This mission adds no CI check and renames none. The ruleset on `main` must require all eighteen checks above.

Status: **open** (operator).

## 4. Merge method and the home of the evidence

Squash-merge this pull request, as for the earlier missions. The history was folded after each phase. The landing
commits were not folded, because the branch has merged `main` twice since the last fold and the fold script refuses
merge commits (landing operator decision 1, "no final fold"). After the squash, the commits that the review files name
by SHA are kept only on these branches:

- `claude/014-selection-input`
- `archive/claude/014-selection-input-prefold-phase-1` to `-phase-7`

Keep them all.

Status: **open** (operator, at merge).

## 5. Sign-off

Status: **open** (operator).
