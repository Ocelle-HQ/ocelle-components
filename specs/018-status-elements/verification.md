# Verification: 018-status-elements

These are the GitHub-side checks for this mission's pull request. The orchestrator drafted this file from the CI
evidence on 2026-11-27, during the landing pass. An item counts as done only when it is marked **done** and its
evidence is filled in. The operator signs the file off at the end.

`plan.md` has no § Verification of its own. The items below are the standing GitHub-side checks that every mission
pull request gets, in the shape mission 006 set.

Pull request: https://github.com/Ocelle-HQ/ocelle-components/pull/105. Base `main` is at `1d599fd4`, merged into the
branch as `e465bfbc`. Earlier merges of `main` were `64c57578` (`dfa6bc09`) and `4911fd0b` (`4f44aa1d`, the
implementation starting point). The pull request resolves the rest of #7: `ocelle-pill-tag`,
`ocelle-status-indicator` and `ocelle-metric`. Mission 012 builds `ocelle-button` and `ocelle-action-row`, so #7 should
close only when both missions have landed.

## 1. The required checks are green

Run https://github.com/Ocelle-HQ/ocelle-components/actions/runs/46012196150 is on head `c7511f60`, after the landing
folds L-01 and L-03. Every check of `gates/gates.json` passed on attempt 1, each verified by its exact name:

1. Typecheck
2. Code lint
3. Style lint
4. Unit tests (6 shards and the inventory)
5. Test lint
6. Mutation testing (`Mutation plan` and 38 `Mutation shard` jobs)
7. Content security
8. Prefix
9. Story config copies
10. Install and pins
11. Sign-off
12. Plants (`Plants plan`, 77 `Plants shard` jobs and the verdict job)
13. Contrast
14. Brand rules
15. Custom-elements manifest
16. Storybook build
17. Visual regression
18. Accessibility
19. Sandbox paths

The skipped jobs belong to the shadow workflows (`Mutation planning shadow`, `Mutation configuration shadow`) and to
`Unit tests full suite comparison`. None of them is a required check.

Times on this run:
- **Element mutation shards:** 33 to 67 minutes. The slowest are `ocelle-status-indicator.ts:151-175` (67 min) and
  `ocelle-pill-tag.ts:751-780` (64 min). Both are under the 75-minute element-shard limit, but within 8 to 11
  minutes of it.
- **Plants shards:** the slowest took 22 minutes (shard 45).

Earlier runs:
- **Heads `97154a0a` to `c5d23c12`:** every element mutation shard stopped at the 30-minute dry-run cap. L-01 raised it
  to 45 minutes (`reviews/operator-landing.md`).
- **Run 45980648741, head `40d1b7e6`:** everything was green except the `ocelle-pill-tag.ts:751-780` shard, which had
  3 surviving mutants. L-03 kills them.
- **Run 46005074224, head `0752a284`:** the first head carrying L-03. It succeeded in full.

Status: **done** on `c7511f60`. Re-confirm on the final head before the merge.

## 2. Mutation time headroom

The mutation dry-run cap is now 45 minutes, and this branch measured 32 min 36 s locally. The longest element shard
took 67 of its 75 minutes. Each element mission adds dry-run time to every element shard. Mission 018's landing
second opinion (`reviews/landing/second-opinion.md`, note 4) recommends a lasting fix, such as sharding the dry run,
before the next raise.

Status: **open** (operator: whether to file the follow-up).

## 3. Required checks on `main`

This mission adds no CI check and renames none. It raises `dryRunTimeoutMinutes` in `stryker.elements.config.json`
from 30 to 45 minutes (L-01). The ruleset on `main` must require all checks above.

Status: **open** (operator).

## 4. Merge method and the home of the evidence

Squash-merge this pull request, as for the earlier missions. The history was folded after each phase. The landing
commits since were not folded, because the branch has merged `main` since and the fold script refuses merge commits.
After the squash, the commits that the review files name by SHA are kept only on these branches:

- `claude/007-status-elements`
- `archive/claude/007-status-elements-prefold-phase-1` to `-phase-7`

Keep them all.

Status: **open** (operator, at merge).
