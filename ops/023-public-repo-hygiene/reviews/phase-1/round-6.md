---
phase: 1
round: 6
verdict: changes_requested
base: ac12998241af8a86f9a88c043654457e41b14b53
head: ac5bebc6
tdd_check: fail (accepted, triage/decisions/023-landing-red-green.md)
reviewer: human:jeroennouwsdev (operator round, recorded by the orchestrator)
---

# Phase 1, round 6: operator round, Unit test shard 4 reports an inventory that differs from its plan

<!-- Not a reviewer-renata review. A red required check on PR #80 was put to the operator on 2026-11-25 during the
/ocelle-land pass. The answer is quoted verbatim (the option label the operator chose). The fix round that follows
(label fix-6) resolves O6-01, and a phase 1 review round covers it. -->

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| O6-01 | blocking | CI job "Unit test shard (4)" (`node gates/bin/test-shards.ts run <plan> 4 <report>`); its plan holds round 4's new tests, among them `gates/test/integration/story-redaction.test.ts` (the focused-runner fixture that runs a nested Vitest repo with a symlinked `node_modules`), `gates/test/sandbox-paths.test.ts` and `gates/test/integration/test-workflow-evidence.test.ts` | Since fix round 4 the shard fails intermittently with "Unit tests: shard 0 inventory differs from the plan" (`verifyTestShards`: the files the run reports differ from the files the plan assigned): run 45625428767 on 73c8ba1 and run 45673036035 on f829bcc failed, run 45654905576 on 98f5bbf passed. It was green on every head before round 4, and the commits between those three heads change only logs and a decision record. A local run of shard 4 matched its plan exactly. The CI result artifact `unit-test-shard-4` names the files but could not be downloaded from this session. The required check Unit tests fails with it, so the PR cannot merge. Operator, answering: "Fix round, test-first (Recommended)". | Find which file the shard's run reports differently from its plan (missing, extra, or under another project or path) and why only sometimes. Red test first (label fix-6): a test that fails, on an assertion, for the cause found (for example a test that leaves state, a file or a process behind that changes what a later or concurrent run reports, or a fixture whose nested run is reported into the outer one). Then the fix, without weakening the shard verification in `gates/lib/test-evidence.ts` or `gates/bin/test-shards.ts` (op 025's) and without skipping or quarantining a test. If the cause lies in op 025's shard tooling rather than in this op's tests, stop and report it instead of changing that tooling. |

## Verdict

changes_requested (operator round).
