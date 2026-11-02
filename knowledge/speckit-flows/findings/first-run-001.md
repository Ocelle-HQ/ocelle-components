---
type: Finding
title: First interactive run (mission 001) - flow defects found
description: Defects in the flow found while running /ocelle-run on issue #4, and what changed
tags: [ocelle-run, governance]
generated: { by: claude-code/agent, at: 2026-11-02T16:30:00Z }
status: draft
---

# Observed in mission 001 (issue #4), up to the spec gate

| Defect | Effect | Change |
|---|---|---|
| `decide.sh` took `decided_by` from git `user.name` | the triage approval was recorded as `human:Claude` | operator id from `git config ocelle.operator` or `OCELLE_OPERATOR`; refuses without one; record 001 corrected (56444fd, afa9e7a) |
| /ocelle-run asked operator questions at the gate, after the last check | the answers would have needed a fourth spec check, over the cap of three | questions are asked when a check raises them, before the next fix |
| Operator questions were free text | the operator asked for multiple choice | rule 5: every question is multiple choice |
| analyst-anouk's report said 8 blocking findings, its table had 7 | none: the script count decides | watch: report text and record disagree; the scripts are the authority |
| planner-pim added rules beyond an operator answer (FR-024) | caught at the gate and confirmed by the operator | watch: fixers extending operator decisions |

# Numbers so far

Three spec checks: 7, then 1, then 1 blocking findings; 4 + 2 operator questions; every scope check passed.
