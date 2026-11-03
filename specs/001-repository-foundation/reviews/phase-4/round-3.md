---
phase: 4
round: 3
verdict: changes_requested
base: 4df12b0823f1a777cf37c501271201fdf4daca64
head: 7494c61
tdd_check: pass
reviewer: human:jeroennouwsdev (operator round, recorded by the orchestrator)
---

# Phase 4, round 3: operator addendum

<!-- Not a reviewer-renata review. Phase 4 was approved in round 2. After phase 5, GitHub CI run 7 (ca5a14f,
https://github.com/Ocelle-HQ/ocelle-components/actions/runs/41588331010) cancelled one mutation shard at its
10-minute limit. The operator decided on 2026-11-03 to change the shard bound. The story flow has no "operator
addendum" path, so the orchestrator records the decision as this round, as for phase 3 round 3, so that the fix
procedure (label fix-3) and a round 4 review apply to it. The operator's answer is quoted verbatim. -->

## Evidence

The same code at three heads, GitHub `ubuntu-24.04` runners, whole job time:

| Shard | Run 4 (2dc6d9a) | Run 6 (2a32ba8) | Run 7 (ca5a14f) |
|---|---|---|---|
| `gates/lib/plant-judge.ts,gates/lib/plant-repo.ts` (435 lines) | 7:31 | 8:53 | 10:20, cancelled |
| `gates/lib/mutation/records.ts,…,gates/lib/pins-rules.ts` (330 lines) | 6:51 | 9:22 | 9:38 |
| `gates/bin/plants.ts,gates/bin/prefix.ts,gates/bin/setup-offline.ts` (455 lines) | 8:53 | 5:45 | 8:12 |

The 500-line bound does not meet FR-013/SC-005 reliably on GitHub runners: runner variance alone takes a shard
past the limit. Round 2 note R2-01 already found the margin was about 12–17%, not the "more than half" that
`mutation-shards.md` claims.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| O3-01 | blocking | gates/lib/mutation/shards.ts:14-15; spec.md FR-013, SC-005; research.md R-08 "CI, sharded"; plan.md; gates/README.md | A shard of up to 500 changed lines can exceed the 10-minute job limit on GitHub runners (evidence above). Operator, asked how shard time should come down, answered "Smaller shards (Recommended)": "Lower the shard bound (500 → 250 lines, about half the time per shard, roughly 18 shards). Planner updates R-08/plan, implementer changes shards.ts test-first. More parallel jobs, same mutation strength." | Lower the shard bound to 250 changed lines, test first (`red.sh 4 fix-3`), in every artefact that states it; keep 10 files and the 10-minute limit. Re-time the shards and correct the margin sentence in `mutation-shards.md` (round 2 note R2-01). |

## Verdict

changes_requested (operator addendum).
