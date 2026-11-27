---
phase: 1
round: 2
verdict: changes_requested
base: c503984f091043952d5f97385e2f9188b9bbceca
head: 5e924b3a68eaa41899ebd77a5d5356d21013410c
tdd_check: pass
---

# Phase 1 review, round 2

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R2-01 | blocking | `ops/034-workflow-pilots/tasks.md:20` | The exact candidate's 19 required hosted checks, full 326-Plant verdict, and matched three-arm #87 benchmark are pending. The recorded Plants listing verifies selection. | Publish the draft for verification and attach the exact candidate head, base, tested merge, run attempts and artifact links. Confirm the aggregate required results and complete matched receipts before the #89 trial. |
| R2-02 | blocking | `ops/034-workflow-pilots/reviews/phase-1/round-1-fixes.md:11` | The standard phase mutation plan selects 16 shards over 489 changed lines. The full standard result on the exact candidate is pending. | Verify the successful aggregate Mutation testing job and its complete planned shards on the exact hosted candidate. Explain any surviving or uncovered mutants before phase acceptance. |

The local fixes are ready for a draft run. Phase approval depends on the hosted evidence above.

## Test quality

The final replay preserved the 98 original assertions and all 12 signed review-fix assertions. The tests-only fix commit `b3ab5005fabe257a2b1fd6612cc2cd491610bcd0` precedes all three source fixes. The focused suites pass at `ca8c21aff14c58e75ccfd2f417e5a222ebf3206f`, whose successor changes only phase evidence and task notes. I independently ran the four focused test files and verified 162 passing tests. [Replay](tdd-check.json)

The actual seeded fixture records the same changed ranges and StringLiteral survivors across mixed and split invocations. All three standard invocations exited 1, and the comparison retained the failure. The #87 hosted benchmark will measure the successful case independently. [Seeded failure parity](seeded-failure.md)

## Checks run

- Independently reproduced the affected listing against the phase base and matched its reason, exit and selection of all 326 Plants to the signed record. The regular mutation plan independently selected 16 shards and 489 lines. [Plants record](plants.md)
- Independently ran the manifest command with the full phase-base SHA. It reported eight overlays and zero missing snapshots. The focused regression deletes the tracked snapshot from a Git fixture while retaining its descriptor, then checks exit 1 and the exact path.
- Verified the executed-tool collector replays. The matching proof returned eligible, the missing proof returned ineligible, and changing an executable digest with identical versions returned ineligible. The replay used official runner inventory and real pinned OCI bytes with synthetic candidate, job and executed-tool observations. The audited workflow, setup and recorder blob IDs agree with the reviewed source.
- Verified that required CI changes are limited to two optional telemetry steps surrounding the existing Visual capture and container inspections. The required capture command, job conclusions, existing artifact upload, shared setup action and standard mutation runner retain their behavior. Reviewed signed Typecheck, story config copies, Sign-off and Sandbox paths results. `git diff --check` passed. [Recorded checks](round-1-fixes.md)

## Earlier findings

| ID | Status | Evidence |
|----|--------|----------|
| R1-01 | Resolved | The comparator rejects a repeated stable identity before comparing the arms. Red and green cover duplicates of both the same and conflicting statuses. |
| R1-02 | Resolved | Sample costs combine completed attempts. Common pin and comparison jobs are itemized, with the current comparison job link available for its finalized duration after artifact upload. The failure-cost regression distinguishes the current attempt from the retry-inclusive total. |
| R1-03 | Resolved | The actual mixed-survivor fixture reproduces both survivors in the union of the split standard runs, and the comparator retains verdict 1. |
| R1-04 | Resolved locally | The observed tool record binds run, attempt and merge to the exact Visual log and digest-verified artifact. The observer cross-checks observed versions with the runner inventory and compares executable fingerprints. The eligible pair is due on the live #89 trial after the audited workflow and recorder reach its common base. |
| R1-05 | Resolved | The documented base-aware preflight takes the expected snapshot inventory from the pinned Git tree and rejects a missing snapshot by path. Current discovery still returns all eight overlays and accepts newly added full overlays. |
| R1-06 | Hosted evidence due | The phase-base Plants record now matches. The complete hosted checks and matched #87 comparison remain open under R2-01. |
| R1-07 | Hosted evidence due | The standard plan and exact result remain open under R2-02. |
| R1-08 | Checkpoint note | Reassess a live mixed #86 shard after the #89 retrospective. |
