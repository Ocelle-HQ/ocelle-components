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

## Matched issue 75 pilot

Both arms tested the same story files, browser tests, stylesheet, PNGs, Axe assertions and affected Plant fixtures. The control used the workflow on main. The candidate used Op 030 at `b5688a9f`. The exact Unit plan was available and reviewed before the long shards finished. The four Visual files ran in separate shards. The suite preserved the same 11 Visual case names and passing results, all four Axe integration cases and all six discovery cases.

| Measurement | Current workflow | Op 030 |
|---|---:|---:|
| Wall time to 18 required green checks | 43m 22s | 23m 17s |
| Unit stage, including inventory and aggregate | 43m 20s | 23m 13s |
| Longest Visual test file | 42m 00s | 18m 03s |
| Total time across the six Unit shard runners | 108m 09s | 112m 15s |

The candidate finished 20m 05s sooner in this pair, a 46% decrease in wall time. Unit shard runner work rose by 4m 06s. Plants was the last required candidate check. Both arms matched all 788 captured story themes under Docker and Podman, found zero serious or critical Axe issues and judged all 318 Plants. The token delta and empty-index faults had the same expected results. [Control CI](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45704188146) · [Candidate CI](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45704388510)

The workflow PR itself reached all 18 required checks in 25m 58s, with all five strict mutation shards and all six Unit shards passing. The exact Unit receipts cover all 358 planned files and the 11 relocated Visual cases. A local Storybook build and browser control passed, along with five Visual CLI integration cases. [Op CI](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45702826894)

The Visual scheduling, signed worktree return check, exact receipt handoff and focused replay rules are supported by the matched pilot. Keep mutation grouping opt-in based on its bounded archived sample. The two trial stories exercise verification of an integration change and select no product mutation shards.
