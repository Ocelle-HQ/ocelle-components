# Operator decision: triage 017, Q0 measurement source (2026-11-15)

Follows `triage/decisions/017-q0-measure-first.md` (Q0 B, measure first).

There is no separate measurement PR. The figures come from two mission PRs' own CI runs. A `pull_request` run uses
the merge commit with main, so element shards run under op 015's 45-minute limit and main's 30-line plan.

1. Mission 013's draft PR #43: its worst element-shard job time and run ID.
2. Mission 010's own PR, later: it covers 010's static-heavy form-control code.

Wait for both figures, then apply the rule: if the worst element shard in either run is over about 30 minutes, go
(op `ops/017-element-shards-by-mutant-count`, then Q1 to Q5); otherwise no work, and #42 is closed as covered by
op 015.

Source: the operator (jeroennouwsdev). The answer was relayed by the orchestrator session and confirmed by the
operator in the /ocelle-run session for #42.
