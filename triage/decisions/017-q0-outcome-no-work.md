# Operator decision: triage 017, Q0 outcome (2026-11-16)

Follows `triage/decisions/017-q0-measure-first.md` and `triage/decisions/017-q0-measurement-source.md`.

**Outcome: no work.** Close #42 as covered by op 015's 45-minute element-shard limit (`ce1d9c7`). There is no op
017 and no pull request from this branch.

The rule was: go only if the worst CI element shard is over about 30 minutes. Every measured figure is far under it.
Each figure is from a pull request's merge commit with main, under the 30-line plan and op 015's limit.

| PR | Mission | CI run | Worst element shard | Job |
|---|---|---|---|---|
| #43 | 013 | 43742696075 | 6 min 42 s (`ocelle-facts.ts:301-328`, …) | 132899299139 |
| #49 | 010 (static-heavy form code) | 43943138908 | 11 min 53 s (`ocelle-form-input.ts:61-90`); all 63 shards passed | 133565888358 |
| #44 | 011 (extra data point) | 43764641711 | 5 min 53 s (`ocelle-section-header.ts:181-204`, …) | 132967030836 |

**Accepted risk:** a dense or static-heavy 30-line element entry has no cost bound under the line rule, and each
element shard's fixed dry-run cost grows as element missions merge. Q1 to Q5 of the triage record were not asked,
and 001 FR-013/SC-005 and 007 FR-014 stand unchanged. The prototype stays on
`archive/claude/009-feedback-forms-prefold-phase-3` (80ea0c7), which contains every SHA the record lists (checked).

Figures relayed by the orchestrator session from the landing sessions of missions 013, 010 and 011. Source of the
decision: the operator (jeroennouwsdev), in the /ocelle-run session for #42.
