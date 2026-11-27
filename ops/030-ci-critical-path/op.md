---
op: 030
triage: triage/030-ci-critical-path.md
issues: []
mode_of_work: task_execution
accountable: "human:MOES-Media"
semver: none
status: started
---

# Op 030 — Shorten the CI and review path

## Intent

Give contributors an earlier trustworthy result and reduce repeated work before final verification. PR #94 supplies a 72-shard mutation plan, a Visual integration shard that took 45m 38s, and a worktree handoff that took 51.299s.

## Acceptance

1. An explicit shadow run groups adjacent element ranges up to 60 changed lines per paired bucket. The normal planner and gate retain their 30-line entry and cut contract. The shadow receipt proves coverage and reports baseline and mutation timings. Missing reports, lost standard mutants, and non-green mutation findings prevent promotion.
2. The existing Unit planner discovers the same 11 Visual integration scenarios in independent files. Valid inputs, planted faults, infrastructure refusals, and cleanup assertions remain observable. The separate full Docker and Podman Visual gate and the complete required Unit inventory still run.
3. Reviewers can check early receipts for a pinned candidate and each declared eligible collateral suite. A stale or missing receipt, wrong project or path, skipped case, or missing corresponding Visual or Accessibility gate blocks acceptance. The final candidate still receives every required check.
4. A clean, signed worker return descends from its declared phase pin and touches only its owned paths. The handoff check accepts that return and rejects incomplete, dirty, overlapping, unsigned, or out-of-scope returns before the integration owner stages anything.
5. Compare the standard and trial paths with #94 mutation inputs and #75 discovery fixtures. Compare like-for-like inventory and outcomes before drawing timing conclusions. Record wall time to first failure and final green, slowest job, runner minutes and retries. Promotion requires the recorded comparison and review.

## Constitution principles touched

Principle VIII applies to the tooling changes and to phase replay. Test-first commits, the expected failed assertions, independent review, signed-off handoffs, and the full required merge checks apply throughout.
