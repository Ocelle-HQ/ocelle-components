# Phase 1 round 1 fixes

The scoped worktree check accepted three clean returns with signed commits and disjoint paths. All workers started at `aeec4670292bcc83ff4ed8f51815b3d508049dec`. The combined report, plan and CLI suite passed all 198 tests after cherry-picking their changes.

| Finding | Signed return | Proof before re-running required CI |
|---|---|---|
| R1-01 | `efc83143410e137c01abd05b69a144eb914b758d` | The second-gap and default opt-in witnesses fail under the old mutations. Simplified two equivalent guards. The old and new grouped and standard plans matched across 1,200 generated comparisons. |
| R1-02 | `3b68dffddd6bdb237eec3e5e99297ab3d4236c80` | Added valid and malformed receipt cases, then shared parsing and verdict classification. A direct Stryker run against all changed report ranges killed all 141 mutants with exit 0. |
| R1-03 | `5644c0bc8f12f8937a63ec918d66fcfcc39f3768` | Exercised complete and malformed timing, input rejection, explicit opt-in and both command exit paths. All 16 exact prior replacements failed the focused tests when applied individually, including the three formerly uncovered lines. |

The original reported CI findings remain recorded in round 1. Closure requires the required mutation gate and other checks on the replacement head plus independent review.
