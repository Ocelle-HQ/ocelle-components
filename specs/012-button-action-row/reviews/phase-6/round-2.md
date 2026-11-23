---
phase: 6
round: 2
verdict: changes_requested
base: 89a1369c0e2d4ee15eb9ec2598b211fd99ba4809
head: 70f2936
tdd_check: pass
reviewer: human:jeroennouwsdev (operator round, recorded by the orchestrator)
---

# Phase 6, round 2: operator round from the landing review

<!-- Not a reviewer-renata phase review. The /ocelle-land landing review of PR #50 (reviews/landing/round-1.md)
found R1-01 and R1-02 (blocking) and R1-03 (note) about T067 and T068, which phase 6 owns. On 2026-11-17 the operator
settled R1-01 and chose to fold R1-02 and R1-03 into this pull request. Recorded as an operator round so that the fix
procedure (label fix-2) and a round 3 review apply. The operator's answers are quoted verbatim. -->

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| O2-01 | blocking | specs/012-button-action-row/tasks.md T067; reviews/phase-6/ci-run.md (missing) | Landing review R1-01. Measured on CI run 44098238937 (497b05f, attempt 1, 75 of 76 shards): the plant gate step peaks at 516 s (shard 40), none over 570 s, 6.2 runner-hours; whole-job wall times reach 862 s (16 shards over 570 s) because of slow runner setup that day (disk cleanup up to 324 s, pnpm setup up to 373 s). Operator, 2026-11-17, "Accept, file plant triage (Recommended)": "Record both measures (gate step and job wall time, per shard and total) in reviews/phase-6/ci-run.md once shard 23 is in, and tick T067 on the gate-step figure (all under 570 s). Your plant-design triage record (decision 15, R1-09), with the visual test's 519/600 s (R1-06), is offered as a follow-up issue." | Write reviews/phase-6/ci-run.md from the CI run (the orchestrator supplies the per-shard figures; attempt 2 for shard 23), and tick T067 citing this decision. No code change. |
| O2-02 | blocking | gates/README.md:58-66; gates/lib/plant-runner.ts:266-268; specs/006-storybook-workbench/plan.md:637 | Landing review R1-02: the sizing figures (72 or 58 stories, about 588 s per shard, "4 stories of headroom", 11.9 runner-hours) are false after the merges (171 stories). Operator, 2026-11-17, "Fold all including R1-04". | Correct the three places to the merged state with the measured figures of O2-01 (gate step and job wall time, total), and say the split count of 76 is exceeded and the plant-design triage is pending. The gates-readme test pins, if any, follow. |
| O2-03 | blocking | gates/README.md:36 (brand-rules row); specs/002-design-tokens/contracts/gates.md:232 | Landing review R1-03: the brand-rules row lacks C1's delay exception, and 002's plant table lacks `f-motion-spin-missing`. Same operator answer. | Add the exception (as amended by phase 4 round 2: only `-delay` names, only literal `ms` durations) to the row; list `f-motion-spin-missing` and phase 4 round 2's new plants in 002's table. |

## Verdict

changes_requested (operator round).
