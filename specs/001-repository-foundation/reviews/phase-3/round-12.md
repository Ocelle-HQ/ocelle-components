---
phase: 3
round: 12
verdict: changes_requested
base: 4ac76fd7fb68ba7c8f15b4bc4177e64b518d56c8
head: 25f5643
tdd_check: pass
reviewer: human:jeroennouwsdev (operator round, recorded by the orchestrator)
---

# Phase 3, round 12: operator round, landing findings L2-01 and the shard-entry regex

<!-- Not a reviewer-renata review. Phase 3 was approved in round 11. Landing review round 2 (reviews/landing/round-2.md)
then found L2-01 (blocking), and GitHub run https://github.com/Ocelle-HQ/ocelle-components/actions/runs/41677290625
(head 25f5643, no gate code changed since a1c7667) failed the shard `gates/lib/mutation/shards.ts:1-120` with two
survivors. The orchestrator put both to the operator on 2026-11-03 during the /ocelle-land pass of PR #18. The fix
round that follows (label fix-12) resolves O12-01 and O12-02, and a round 13 review covers it. Answers quoted verbatim. -->

## Evidence for O12-02

- Run 41677290625, job 126061556001: `gates/lib/mutation/shards.ts:110: mutation: Regex: Survived: replaced by
  /^(.*\.ts):(.*)/s` and `… /(.*\.ts):(.*)$/s`; "2 findings in 1 changed file (102 mutants on changed lines)".
- Runs 41671185705, 41672562167 and 41675069807 ran the same shard on the same gate code and reported
  "102 mutants …, none survived".
- Local runs of `gate:mutation -- --base bdb9b70 --files gates/lib/mutation/shards.ts:1-120` at HEAD and at a1c7667
  both report the two survivors. In the report, the two other line-110 mutants are killed by
  "selectFiles: path:start-end entries (phase 3 round 9, O9-01) > cuts the file's changed ranges to the entry's lines".
- With the `s` flag, `.*` can always start at offset 0 and run to the end, so dropping `^` or `$` gives the same
  match on every input: both mutants are equivalent. The earlier green runs are not explained; the local result is
  deterministic.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| O12-01 | blocking | gates/bin/mutation.ts (Stryker run, report read); gates/lib/mutation/report.ts:73; spec.md FR-011 | Landing L2-01: Stryker 10.1.1 never reads files under `node_modules`, `.git`, `.next`, `.nuxt`, `.svelte-kit` or `.stryker-tmp` (any case, any depth) and only logs `Glob pattern "…" did not result in any files.`; the gate then counts the file as 0 mutants and exits 0 (reproduced with `packages/tokens/src/.next/y.ts`). Operator, answering "Fail on unread files (Recommended)": "The gate exits 2 when Stryker reports that a pattern 'did not result in any files', naming the entry. This also catches any other path Stryker skips in future, not just today's six folder names." | Planner amends FR-011 (and the contracts) and adds the task; red first (`red.sh 3 fix-12`): a changed in-scope file Stryker does not read makes the gate exit 2 naming the entry, in `--files` mode and in the whole-diff mode; a real-Stryker integration case for one skipped folder. |
| O12-02 | blocking | gates/lib/mutation/shards.ts:110 (`rangeSuffix`) | Two equivalent Regex mutants survive (evidence above), so the shard fails on gate code that phase 3 approved. Operator, answering "Rewrite without regex (Recommended)": "Split the entry at the last '.ts:' with lastIndexOf. That leaves no anchors and so no equivalent mutants, and the existing tests cover it. It also looks for any other anchor-only regex in the gate code." | Replace `rangeSuffix` with a split at the last `.ts:`; the existing entry tests must still pass unchanged. Check every regex under `gates/` for anchors whose removal is equivalent, and fix or report each. Mutation on the changed files against the phase base and bdb9b70 with no survivors. |

## Verdict

changes_requested (operator round).
