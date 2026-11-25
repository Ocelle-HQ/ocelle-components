# Verification before the hosted comparison

The combined test-only commit `042e1187` produced 23 named assertion failures. The corrected Visual proof pairs the eleven-case register with the executable timing configuration. The final suite on the original base reproduces all named failures, including after the split files are overlaid. The focused head replay passed on `3e9e4ed2`. [Replay](tdd-check.json)

The first integrated local check passed 310 tests across seven files. Typecheck, Code lint and Test lint passed. After the proof correction, the 94 tests in the changed planner test file passed. The Unit inventory discovered 358 files and assigned the four Visual integration files to four separate shards. The timing weights remain provisional until hosted runs measure the split.

The archived #94 scope covers 2,214 changed lines in both planners. The standard planner emits 72 shards and the shadow emits 35. The opt-in workflow compares the immutable #94 canvas ranges 61–90 and 91–120 with the grouped range 61–120. It requires successful test and mutant receipts before reporting timings. [Hosted comparison](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45693974516)

The worktree verifier accepted the signed, disjoint Visual and handoff returns and then the signed mutation return. Its nine negative and positive integration cases passed in the focused run. Reusing it on the #75 fixture worktrees will exercise the separate discovery pilot.

The four relocated Visual suites retain the existing eleven scenario bodies, including negative verdicts and cleanup. Their candidate-specific Unit artifacts and full Visual gate remain part of review evidence. Hosted timings, the sampled mutation parity result and the paired #75 fixture runs are tracked in T009. [Draft PR](https://github.com/Ocelle-HQ/ocelle-components/pull/98)
