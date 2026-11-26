---
phase: 1
round: 1
verdict: approved
base: a3f82074aa492eff78fb5c481f20d7d458033b5a
head: 735a45675d12b27fdcda1a449330370d68403949
tdd_check: pass
---

# Phase 1 review, round 1

I reviewed the Op 025 changes on the phase head before the merge of main. The integrated checkpoint `f2135802` carries the same workflow, story runner, gate code and installed story extension. Required CI for the integrated candidate remains a separate merge gate.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | note | `gates/bin/story-evidence.ts:373–378, 482–489` | The local CLI validates the phase directory before the check. Its error handler could use that validation before writing a diagnostic for invalid arguments. Normal in-repository phase paths use the validated check and CI uses separate entry points. | Follow up on reusing the validated output path in the failure handler. |

## Test quality

The reviewed tests tie red to a changed assertion and its named case, with a separate source identity when the assertion lives in a shared helper. A failed setup or test collection supplies no assertion proof. A missing module on the phase base requires scaffold evidence. The cache key includes tested trees, overlays, scope and relevant runtime identity, and reuse requires a complete matching record.

The required Unit tests verdict checks the planner and shard job results, revision and exact file assignment, and the absence of global, file and test errors. Missing inventories, empty files and skipped or failed assigned tests block the verdict. The opt-in rollout comparison independently checks per-test identities and statuses against the stock full run. The regular full suite, the existing check name and the other required gates remain available.

## Checks run

- The phase replay on `735a4567` passed. All ten recorded red commits produced named assertion failures. The base had the expected missing module, the scaffold and all nine fix parents reproduced the required assertion failures, and the head passed all 15 selected project/files. After local disk exhaustion interrupted the first attempt, the retry reused the ten completed red checks and completed the remaining proof. The attached check records identify each tested revision and outcome.
- Config copies, 142 focused validation tests, and all seven real-process integration tests passed on `f2135802`. On that revision, the shard plan assigned all 321 project/file identities exactly once across six shards. Its inventory matched the stock Vitest file list.
- The affected Plants selector on the recorded phase base identified all 317 cases. The preceding rollout candidate `023fda5f` judged all of them in hosted CI and passed strict Mutation testing. Its stock-versus-sharded run matched 10,407 tests and their statuses. [Plants verdict](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45063509601/job/137339921598) · [Suite parity](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45063509601/job/137356532588)
- The #74 pilot used the same workflow. The scoped proof and timing notes identify the pilot's focused checks and required CI. [Pilot CI](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45063522257)

The updated evidence checklist and Plants record are present at checkpoint `83d0f6c`. There were no earlier phase review rounds.
