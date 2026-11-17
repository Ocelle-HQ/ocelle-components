# Verification: 008-overlays

These are the GitHub-side checks for this mission's pull request. The orchestrator drafted this file from the CI
evidence on 2026-11-17, during the landing pass. An item counts as done only when it is marked **done** and its
evidence is filled in. The operator signs the file off at the end.

`plan.md` has no § Verification of its own. The items below are the standing GitHub-side checks that every mission
pull request gets, in the shape mission 006 set.

Pull request: https://github.com/Ocelle-HQ/ocelle-components/pull/47 (closes #16). Base `main` is at `bea3130`
(mission 011, #44). It was merged into the branch twice: `23ba5c5` (mission 013, #43) as `818d0c2`, then `bea3130` as
`b35b8e0`.

## 1. The eighteen checks are green

Run https://github.com/Ocelle-HQ/ocelle-components/actions/runs/44048343751 is on head `d41d5cc`, after the re-sign
and both merges of `main`. All 109 of its jobs succeeded, so the eighteen checks of
`specs/001-repository-foundation/contracts/ci-checks.md` are green: Typecheck, Code lint, Style lint, Unit tests,
Test lint, Mutation testing, Content security, Prefix, Story config copies, Install and pins, Sign-off, Plants (the
verdict job), Contrast, Brand rules, Custom-elements manifest, Storybook build, Visual regression and Accessibility.

The helper jobs are green too: `Mutation plan` with its 75 `Mutation shard` jobs, and `Plants plan` with its 28
`Plants shard` jobs.

The head before this one was green as well: run https://github.com/Ocelle-HQ/ocelle-components/actions/runs/44036471708
on `2a90252` (after the merge of `23ba5c5`), 109 of 109 jobs.

Status: **done**. Re-confirm on the final head before the merge if the head moves.

## 2. Shard times

- **Plants shards:** the slowest was Plants shard (7), at about 1031 s (08:38:07 to 08:55:18), above mission 006's
  570 s stop-and-ask limit. Like mission 013's, this is growth in the story set (now 120 stories, 240 story-themes);
  the shard jobs have no timeout, so nothing failed. Mission 013 already proposed the follow-up op to re-split them.
- **Mutation shards:** the slowest was `ocelle-drawer.ts:31-60`, at about 1091 s. All 75 succeeded, none was cancelled.

Status: **open** (operator: accept, or fold into mission 013's follow-up op).

## 3. Required checks on `main`

This mission adds no CI check. The ruleset on `main` must keep requiring all eighteen checks above.

Status: **open** (operator).

## 4. Merge method and the home of the evidence

Squash-merge this pull request, as for the earlier missions. The history was folded after each phase; the landing
skipped its own fold (operator decision) and re-signed `07cf18b`. After the squash, the commits that the review
files name by SHA are kept only on these branches:

- `claude/016-overlays`
- `archive/claude/016-overlays-prefold-phase-1` to `-phase-5`
- `archive/claude/016-overlays-pre-resign` (the history before the re-sign; `reviews/history-map.txt` maps old to new)

Keep them all.

Status: **open** (operator, at merge).

## 5. Hand checks

The quickstart's two hand checks and any WebKit check were deferred by operator decision (no WebKit harness). T053,
the Kitty Desktop webview floor, is handed to kitty-mission-ui #20.

Status: **open** (deferred by operator decision).
