# Verification: 010-feedback-forms

These are the GitHub-side checks for this mission's pull request. The orchestrator drafted this file from the CI
evidence on 2026-11-20, during the landing pass. An item counts as done only when it is marked **done** and its
evidence is filled in. The operator signs the file off at the end.

`plan.md` has no § Verification of its own. The items below are the standing GitHub-side checks that every mission
pull request gets, in the shape mission 006 set.

Pull request: https://github.com/Ocelle-HQ/ocelle-components/pull/49. Base `main` is at `4911fd0b` (mission 012),
merged into the branch as `25ed484d`, after the earlier merges of `b594b7e9` (`7514ba39`), the mission 013 and ops 015
and 016 merge (`e575b411`) and the Storybook workbench merge (`e43cc96b`). The pull request resolves #9.

## 1. The eighteen checks are green

Run https://github.com/Ocelle-HQ/ocelle-components/actions/runs/44727062211 is on head `f3a8534b`, after the third
merge of `main` and landing round 2. All 158 of its jobs succeeded on attempt 1, so these eighteen checks of
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
17. Visual regression
18. Accessibility

The helper jobs are green too:

- `Mutation plan` and its 60 `Mutation shard` jobs. The slowest job, the shard holding
  `packages/elements/scripts/manifest.ts` and `packages/elements/src/define.ts`, took 3060 s (51 minutes). That is over
  the old 45-minute limit and under the 75-minute limit that element shards got by operator round 8 (phase 2, O8-02;
  spec 001 FR-013 and SC-005, amended 2026-11-18). The other element shards took 1420–2890 s.
- `Plants plan` and its 77 `Plants shard` jobs (item 2).

`Unit tests` took 3481 s in CI. Locally, the full `gate:unit-tests` on the merged head passed 8666 tests in 254 files,
with no test timing out (`reviews/landing/unit-tests-merge-3.log`).

Earlier runs: run https://github.com/Ocelle-HQ/ocelle-components/actions/runs/44354367030 on `7f394172` (after the
second merge) failed only Mutation testing, with one element shard cancelled at the old 45-minute limit (phase 2,
rounds 6 to 8).

Status: **done** on `f3a8534b`. Re-confirm on the final head before the merge.

## 2. Plants shard times (mission 006 decision 30)

On run 44727062211 the slowest `Plants shard` job took 909 s of wall time (shard 51); the gate-step figures are not
broken out here. This mission adds stories and plants but no plant design; the plant-design triage that mission 012
offered as a follow-up covers the cost.

Status: **done** (recorded; the cost decision is the operator's under 012's follow-up).

## 3. Required checks on `main`

This mission adds no CI check and renames none. It changes the `Mutation shard` limit for shards holding element
source from 45 to 75 minutes (`ci.yml`, operator round 8). The ruleset on `main` must require all eighteen checks
above.

Status: **open** (operator).

## 4. Merge method and the home of the evidence

Squash-merge this pull request, as for the earlier missions. The history was folded after each phase and again for
the operator-approved re-sign. The landing commits since were not folded, because the branch has merged `main` four
times since and the fold script refuses merge commits. After the squash, the commits that the review files name by SHA
are kept only on these branches:

- `claude/009-feedback-forms`
- `archive/claude/009-feedback-forms-prefold-phase-1` to `-phase-5`
- `archive/claude/009-feedback-forms-prefold-resign`

Keep them all.

Status: **open** (operator, at merge).
