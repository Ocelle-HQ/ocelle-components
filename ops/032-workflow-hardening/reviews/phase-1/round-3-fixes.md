# Phase 1 round 3 fixes

| ID | Resolution | Red test | Where |
| --- | --- | --- | --- |
| R3-01 | fixed | Pin creation accepted the older shared ancestor and one of two best common ancestors. Replay proceeded with a stale pin, ambiguous or empty Git output, and a Git inspection error. | [Installed wrapper](../../../../.specify/extensions/story/scripts/base.sh) · [Source wrapper](../../../../tooling/speckit/extensions/story/scripts/base.sh) · [Focused replay](../../../../gates/bin/story-evidence.ts) |
| R3-02 | fixed | A valid 1,000-error receipt exceeded 4,096 characters of runner detail and omitted the receipt reference. The corrected output shows the first eight errors, up to 500 characters each, and directs readers to `result.json` for the remaining 992. | [Shard verification](../../../../gates/lib/test-evidence.ts) |

`red.sh 1 fix-3` recorded eight failing assertions in tests-only commit `c55225c6ef88bef9091cdad5c5c7ef97ab05c31e`. [Red proof](red-fix-3.log)

All 259 tests passed across the five focused suites after the fixes. The merged fixture advances remote main beyond the integrated commit, retains the historical phase-red assertion, and selects only the test file edited by the phase. The CLI fixture verifies shard 1, both exact project/file identities, the omitted count, and the serialized receipt byte for byte. The 1,000-error ASCII reproduction emits 4,059 bytes of runner detail, including the omission notice.

`tdd-check.sh 1` passed on `5ee0928364077c41a48689cc543d9a06b7a2897b` with main pinned at `3d090026a19dd8e2479ff02f2ff9b8161fe00ef1`. It reproduced 14 original assertions, two round-one assertions, and eight round-three assertions at their historical red commits and on their respective bases with final tests overlaid. The five focused suites passed at the corrected head. [Replay receipt](tdd-check.json) · [Round-three red replay](check-red-fix-3.log) · [Round-three pre-fix replay](check-final-tests-on-fix-3-base.log) · [Head replay](check-head.log)

Typecheck, Lint, Test quality, Sign-off, Sandbox paths, Story config copies, wrapper syntax and copy comparisons, and affected Plants selection passed locally. Full Plants, changed-source mutation, and the exact hosted check set are pending for the corrected candidate. [Plant selection](plants.md) · [Mutation record](mutation.md)
