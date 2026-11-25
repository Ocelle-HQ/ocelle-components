# Verification before the hosted comparison

The combined test-only commit `042e1187` produced 23 named assertion failures. The corrected Visual proof pairs the eleven-case register with the executable timing configuration. The final suite on the original base reproduces all named failures, including after the split files are overlaid. The focused head replay passed on `3e9e4ed2`. [Replay](tdd-check.json)

The first integrated local check passed 310 tests across seven files. Typecheck, Code lint and Test lint passed. After the proof correction, the 94 tests in the changed planner test file passed. The Unit inventory discovered 358 files and assigned the four Visual integration files to four separate shards. The timing weights remain provisional until hosted runs measure the split.

The archived #94 scope covers 2,214 changed lines in both planners. The standard planner emits 72 shards and the shadow emits 35. The opt-in workflow compares the immutable #94 canvas ranges 61–90 and 91–120 with the grouped range 61–120. It requires successful test and mutant receipts before reporting timings. [Hosted comparison](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45693974516)

The worktree verifier accepted the signed, disjoint Visual and handoff returns and then the signed mutation return. Its nine negative and positive integration cases passed in the focused run. Reusing it on the #75 fixture worktrees will exercise the separate discovery pilot.

The four relocated Visual suites retain the existing eleven scenario bodies, including negative verdicts and cleanup. Their candidate-specific Unit artifacts and full Visual gate remain part of review evidence. Hosted timings, the sampled mutation parity result and the paired #75 fixture runs are tracked in T009. [Draft PR](https://github.com/Ocelle-HQ/ocelle-components/pull/98)

## Hosted mutation sample

The archived #94 source tree `d493acae6a8b6e5d405cceddd2da870cecee9b4d` produced 72 standard shards and 35 grouped shards. Each plan covered 2,214 changed lines. The timed comparison exercised one adjacent pair of 30-line ranges. Each arm ran the same 3,716 baseline tests with the archived Stryker configuration on Ubuntu 24.04 runner version 2.338.2. All nine stable mutant identities and verdicts matched (three killed and six compile errors), with zero additional cut-spanning mutants. [Comparison](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45693974516/job/139504452415)

| Range | Baseline | Total Stryker time |
|---|---:|---:|
| 61–90 standard | 29m 59s | 32m 12s |
| 91–120 standard | 29m 46s | 30m 28s |
| 61–120 grouped | 29m 47s | 31m 30s |

The guarded grouped path used about 50% less combined Stryker time in this pair and was 42 seconds faster than the slower parallel control. The sample supports keeping the comparison opt-in. A local Stryker experiment adapted the repository's survivor Plant to two contiguous ranges. The control and grouped paths both rejected the survivor at line 3 while preserving the killed mutant at line 34.

## First hosted Visual timing

The preserved #94 Unit receipt recorded 11 passing Visual cases in one file at 2,709 seconds. The first split Op candidate's exact Unit receipts at merge revision `2755f2223175433f958495c58009edcd0ffd09f3` contained all 11 of the same case names and passing results across four independent shards. The longest file was 1,204 seconds. This historical comparison precedes the identical-fixture comparison on #75. [First split run](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45694977732)

The refreshed local replay at `6aeac8a0` matched the original 23 named phase assertions and the 14 plus one review-fix assertions against their respective revisions. The phase head passed. [Replay](tdd-check.json)
