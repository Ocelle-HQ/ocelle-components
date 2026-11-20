---
phase: 2
round: 6
verdict: changes_requested
base: 6c9400cbaa1da7d2b1ce96d496e65101942524a0
head: 7f394172
tdd_check: pending
reviewer: human:jeroennouwsdev (operator round, recorded by the orchestrator)
---

# Phase 2, round 6: operator round, CI time limits after the second merge of main

<!-- Not a reviewer-renata review. CI run 44354367030 on 7f394172 (the branch after the second merge of main,
b594b7e9) was put to the operator on 2026-11-18 during the /ocelle-land pass of PR #49. The answers are quoted
verbatim. Phase 2 is the phase that set `fileParallelism: false` on the `elements` test project (operator decision
(b), reviews/phase-2/decision-stop-1.md); after the merge that setting also runs main's element test files one at a
time. The fix round that follows (label fix-5) resolves O6-01 and O6-02, and a phase 2 review round covers it. -->

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| O6-01 | blocking | .github/workflows/ci.yml:90 (`mutation-shard` `timeout-minutes`) | The Mutation testing check is red on run 44354367030: the element shard `gates/bin/contrast.ts,packages/elements/scripts/manifest.ts,packages/elements/src/define.ts,packages/elements/src/form-control.ts:1-30` was cancelled at its 45-minute limit (2717 s), and the other element shards took 2493–2614 s, against 713 s at most before the merge. Operator, asked how to fix it: "Raise the shard time limit"; asked for the new limit: "75 min but the whole CI run should be green so unit test timeouts should get fixed as well". | Test-first: the limit for a shard with a `packages/elements/src/` entry becomes 75 minutes (shards without element source keep 10), pinned first in the CI workflow test (gates/test/ci-workflow.test.ts), red on the current ci.yml; then ci.yml, and the contract and docs that state the limit (specs/001-repository-foundation/contracts/ci-checks.md `mutation-shard` row, gates/README.md). |
| O6-02 | blocking | gates/test/integration/visual.test.ts:26 (`timeout = 600_000`), and any other test that times out in the full unit-test run | In the full `gate:unit-tests` run on the merged tree, "captures the repository's 346 story-themes twice under docker" (visual.test.ts:115) went over its 600 s limit twice in a row on the orchestrator's container (the merge agent's run, and the phase 1 TDD check's run at HEAD); run alone, the file passes 11 of 11. The operator requires the whole CI run to be green, unit-test timeouts included (answer quoted under O6-01). | Make `gate:unit-tests` pass on the merged tree with no test timing out: give the timed-out tests enough time for the merged suite (346 story-themes), keeping every assertion. Include any other test that the CI `Unit tests` job of run 44354367030 shows timing out. Show the full `gate:unit-tests` run passing. |

## Verdict

changes_requested (operator round).
