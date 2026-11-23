---
phase: 2
round: 1
verdict: approved
base: b45c9692b8989360d1091a2f5c25a9e4f4f3d578
head: 774aa67969a738ee67a48ee8849c0884b7029fc5
tdd_check: pass
---

# Phase 2 review, round 1

Tasks T006–T009 are complete. The review head adds the T009 check and evidence records to candidate `32df0b5d292f5bf73908236cd54cde428c93356b`. Source, tests, fixtures, stories, baselines, CI configuration and `test-scope.txt` match the hosted candidate exactly.

## Findings

No blocking findings.

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | note | `packages/elements/test/scenarios/workflow-node.ts:230` | The shared contrast helper uses the foreground RGB channels directly. The independent Chromium probe composited the forced-colors focus outline's alpha against its actual ground and confirmed both palettes pass. | None for this phase. |

## Test quality

- Test-only red `afbcc0880829219c03aa7daeebd620af59e1de16` reached 14 named assertion failures across the two Chromium projects. The final assertions produced the same 14 failures on the phase base. The green replay covered four files. The exact hosted merge first replay took 42.167 seconds, and the unchanged repeat reused all three stages in 1.285 seconds. I reran the exact merge proof during review and confirmed all three stages still reused the same selected project and file identities. [Replay report](tdd-check.json)
- The browser tests retain Phase 1 behavior and verify that moving through both Tab directions skips the excluded native action. Direct focus and Enter and Space each work at `-1`; restoring the same button adds one Tab stop. Focus movement, data or context updates and tab-participation changes issue no selection request. The tests verify the three independently controlled states, visible state text, full narrow title and metadata in the computed description, past references cleared during refresh, in-place reference edits and lookup in the new host tree after reconnection.
- The four added in-process cases make each ARIA attribute change independently and check the resulting native action after each addition, replacement and removal. Replacing one observer with an empty string fails precisely its matching named case. The other three pass, and the real implementation passes all four. The original red assertions are retained. Both Chromium projects passed all 39 tests in the independent check at the published candidate. [Mutation probes](implementation.md#in-process-mutation-probes)
- The CI-only axe and visual changes retain exact aggregate expectations and cover the eight new baseline images. The manifest overlays preserve their deliberate failures and key order. The existing empty-index overlay still covers all story files. The visual Plant retains 283 expected findings and adds exactly four measured light-theme differences. [Fixture verification](implementation.md#visual-examples-and-fixtures)

## Checks run

- Run 45206635291 passed all 18 required checks in 59 minutes. Its synthetic merge `1278b0e967ac1b7e35af8836313d18a99f09da24` has parents `ff85ae56` and `32df0b5d` and uses the candidate's exact tree `ae48f31d17d454ab44a3edce4ead5cec74c6a3f3`. The Unit tests aggregate passed 10,870 tests in 326 files over six shards. The plan and both inspected shard artifacts name that exact merge. In project `gates-integration`, shard 0 passed all 11 cases of `gates/test/integration/visual.test.ts`, and shard 1 passed all four cases of `gates/test/integration/axe.test.ts`. Both files were assigned in the plan and had no reported errors. [Unit tests](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45206635291/job/137833775198) · [Plan](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45206635291/artifacts/14834735661) · [Shard 0](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45206635291/artifacts/14836934947) · [Shard 1](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45206635291/artifacts/14835138543)
- The Visual regression, Accessibility and Content security checks passed on that candidate. The independent built Chromium probe used the identical runtime at `1e2c367e` and found a 254 × 78.89 px target against the 44 px minimum. The long title wrapped to three lines without overflow. The actual focused button exposed the full title, metadata and all three states. Both themes passed text and boundary contrast, and both forced-colors palettes kept the three text cues and a 3 px focus ring with composited contrast of 11.310:1 and 8.728:1. The probe recorded no CSP or network or console errors. [Visual regression](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45206635291/job/137804024418) · [Accessibility](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45206635291/job/137804025761) · [Content security](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45206635291/job/137804025238)
- Strict changed-source mutation passed all eight shards with zero survivors, zero timeouts and ten compile rejects among 86 reported mutants. The hosted base makes the entire node source a changed file, covering all Phase 2 changes. The two located equivalence records remain limited to the Phase 1 Lit string declarations, whose behavior and normalized manifest were independently verified in the prior review. [Mutation testing](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45206635291/job/137843016304) · [Mixed mutation shard](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45206635291/job/137804320358)
- I matched all 21 `note: affected:` lines from the phase-base selector to the record. The local selector made no judgements. The hosted verdict judged all 317 plants from 17 gates and the registry and exited 0 on the same candidate. [Plants record](plants.md) · [Hosted Plants](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45206635291/job/137816759813)

## Earlier findings

This is the first recorded Phase 2 review. Independent pre-review found that a grouped ARIA update could hide a missing individual observer. The first hosted mixed mutation shard also reported a survivor in the observer list. The isolated test follow-up and the final strict mutation verdict close the finding. [Earlier mixed mutation shard](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45205673544/job/137800954304)
