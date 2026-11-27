---
phase: 1
round: 1
verdict: changes_requested
base: 542423728162e617a7b141cbe49c36ea0f954131
head: 71e4856dafb1e421eb3a642a321657b0b86f7f33
tdd_check: pass
---

# Phase 1 review, round 1

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | blocking | `gates/test/integration/evidence-reuse-observe.test.ts:147` | The new archive cases add an external `zip` prerequisite to the standard test and replay path. With the test's Node, Git and unzip commands still present and only `zip` omitted, both new cases exit with `spawnSync zip ENOENT` during fixture creation. The contributor setup has no such prerequisite. | Preserve real archive-path coverage while making fixture creation independent of external `zip`, or reconcile the test and contributor setup with the dependency. Verify the fixture reproduces the intended assertions. |
| R1-02 | blocking | `ops/037-pilot-feedback/tasks.md:12` | The required CI run remains in progress, including the hosted proof for regular mutation, unit tests, Visual and Plants. The local regular mutation run has no verdict yet. | Record the passing required verification and regular mutation verdict on the integrated candidate. |
| R1-03 | blocking | `ops/037-pilot-feedback/reviews/phase-1/plants.md` | The phase has no record of the selected Plants and their verdict. The phase-base command selects all 326 because the new workflow path is unmapped. | Record the exact phase base, selection note and completed Plants verdict. |
| R1-04 | blocking | `ops/037-pilot-feedback/tasks.md:5` | All eight phase tasks remain open. T001 through T007 have implementations and replay evidence. T008 also names the separate #86 measurement that is still pending. | Mark completed tasks and explicitly record the boundary between the verification that closes this op and the live measurements on the separate #86 candidate. |
| R1-05 | note | `.github/workflows/visual-capture.yml:25` | A PR body edit that leaves the capture marker unchanged still runs checkout and dependency and browser setup before the script exits. This can add setup time to routine edits. | Run marker preflight before the expensive setup if practical. |

## Test quality

The signed tests-only commit `f25c92da` exercises all three changes. Its focused replay identifies 32 attributable failing assertions across four files. The final tests on the phase base exhibit the same red result. The integrated source, at `ce646794`, passes the focused head replay. There are no deferred CI entries, and the test diff after the signed red is empty.

The advisory mutation tests check identical ranges and reported outcomes, preserve the normal invocation, and refuse out-of-scope selectors. The scoped Visual tests check both themes, missing and duplicate IDs, and preservation of unrelated files. They leave the required Visual command in full-suite mode. The observer fixtures verify the unique exact-attempt archive entry, distinct failure paths, and native pnpm hash agreement across known launcher paths. Historical schema and unverified launcher metadata still fail closed. No package surface or required workflow changed.

## Checks run

- Independent pinned-Node run of the six focused and adjacent test files passed all 319 tests. A restricted-PATH rerun reproduced the two archive fixture setup errors under R1-01.
- The recorded canonical replay passed on `ce646794`. The diff from that source head to the review head contains replay records only. `git diff --check` passed. [Replay receipt](tdd-check.json)
- Both planned normal Mutation shards retain the normal configuration. The independent local full selection is running. Hosted CI had no completed verdict at review time. [Required CI](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45900267968)
- Phase-base Plants listing selected 326 of 326. It did not judge any Plant. The matching hosted check remains pending. [Required CI](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45900267968)
- The hosted scoped capture succeeded on exact source head `ce646794` and has an unexpired capture artifact. Artifact metadata ties it to run `45900285064`, with SHA-256 `f9288ee40bd97d0495e83674043a351365e5761fb7f26bcd3bb9cf175d55e215`. The managed environment denied direct ZIP download, so this review did not inspect its members. [Capture run](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45900285064) · [Artifact](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45900285064/artifacts/15155726118)

## Earlier findings

First round.
