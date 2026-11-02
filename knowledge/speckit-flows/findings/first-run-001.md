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
| `story_run_tests_at` read `test_command` from the commit it checked out | a phase whose base predates the test runner could never pass the red/green check (found by three squad lenses) | commands come from the current configuration (story 1.2.2); regression-tested |
| `round.sh` left `round-R/base.sha` uncommitted | the tree was not clean before the lenses ran | `round.sh` commits it (squad 1.1.1) |
| Lens files stayed uncommitted while other lenses ran; the stop hook asks for a commit and push | the orchestrator committed each finished lens file alone; one landed while the refuter worked, so the round commit held only `refute.md` | watch: harmless, but the "refute commits the round" rule does not survive an environment that pushes at every stop |
| planner-pim added rules beyond an operator answer (FR-024) | caught at the gate and confirmed by the operator | watch: fixers extending operator decisions |

# Numbers so far

Three spec checks: 7, then 1, then 1 blocking findings; 4 + 2 operator questions; every scope check passed.
Plan squad round 1: 43 findings (correctness 12, a11y-security 8, testability 11, fresh 12); refuted 2, duplicates 13,
confirmed 28 (19 fixes, 9 forks decided by the operator). Round 2 (fresh): 11 confirmed, 5 forks. Round 3 (fresh,
the cap): 8 confirmed, 6 forks. 47 confirmed in all, every one resolved and verified (two fix passes in each round),
every scope check passed; the operator approved the plan at the plan gate.

Analysis after tasks: three analyses (2 critical + 1 high, then 1 critical, then 0 critical + 1 high), each round's
fixes introducing smaller new findings; the operator stopped after the third ("fix the three, then implement").

# Flow defects found after the plan gate

| Defect | Effect | Change |
|---|---|---|
| No fix step after the analysis: the tasks gate offered only approve or reject | the orchestrator added "fix, then re-analyze" options and gave planner-pim an ad-hoc procedure three times | to do: an analysis-fix command and an analyze → fix loop with a cap, like the spec check |
| The harness refused subagents' writes of report and note files ("Subagents should return findings as text, not write report files"), though the same profiles wrote such files earlier in the run | analysis reports and fix notes were recorded verbatim by the orchestrator from the hand-backs, each commit saying so | watch: if it persists, have profiles return reports and let the orchestrator write them by design |

# Patterns to watch

- **Fixers attribute decisions to the operator that the operator never took** (the Node/pnpm release-age exemption
  in round 1, the FR-011 amendment in round 3). Both were caught by the refuter or the verifier, and both went to the
  operator. Consider a rule in the fix commands: only decisions present in `refute.md` or passed in by the
  orchestrator may be labelled operator decisions.
- **Operator decisions are committed by an agent.** The verifier notes it cannot check a recorded decision against
  the operator's own words. The commit messages name the operator and the gate; a stronger record would be the
  operator's own signed commit or a gate log written outside the agent's reach.
- **Each fix round created new defects for the next fresh round** (11, then 8). The three-round cap ended the
  squad, not a clean round; the plan gate is where the operator accepts that.
