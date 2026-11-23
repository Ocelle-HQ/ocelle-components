---
phase: 2
round: 7
verdict: changes_requested
base: 6c9400cbaa1da7d2b1ce96d496e65101942524a0
head: 5d2d4c50
tdd_check: pending
reviewer: human:jeroennouwsdev (operator round, recorded by the orchestrator)
---

# Phase 2, round 7: operator round, run only the timing files one at a time

<!-- Not a reviewer-renata review. After round 6 (raise the element mutation-shard limit to 75 minutes) and its
tasks T025e/T025f (5d2d4c50), the operator asked on 2026-11-18 why the mutants ran one at a time. The orchestrator
answered: Stryker runs 8 mutants at once (stryker.elements.config.json `concurrency: 8`), but each run takes the
`elements` project from vitest.config.ts through vitest.mutation.elements.config.ts, and that project has
`fileParallelism: false` (operator decision (b), reviews/phase-2/decision-stop-1.md), which after the second merge of
main serializes all 120 element test files (55 on the branch before the merge), in the dry run and in every
multi-file mutant run. The operator was then asked how to go on, and the answer is quoted verbatim. This round
replaces round 6's O6-01 (no limit raise; T025e is withdrawn); round 6's O6-02 (unit-tests green, no test timing
out) stands and is restated as O7-02. The fix round that follows (label fix-5) resolves O7-01 and O7-02, and a
phase 2 review round covers it. -->

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| O7-01 | blocking | vitest.config.ts (`elements` project, `fileParallelism: false`); vitest.mutation.elements.config.ts | On CI run 44354367030 (7f394172) the element mutation shards took 2493–2717 s, one cancelled at its 45-minute limit, against 713 s at most before the merge; the `elements` project runs every element test file one at a time, main's included, though only the branch's timing files need it. Operator, asked how to fix it: "Serial project for timing files (Recommended)" (the option: "Move only the timing-sensitive files into their own serial project, so `elements` runs in parallel again as on main. The planner updates the tasks, the implementer measures a shard before and after, test-first, and the 45-minute limit stays unless the measurement says otherwise."). | Keep `fileParallelism: false` only on a new browser project holding the timing-sensitive files that decision (b) named (the notice suites, the plants file, the capture and timing files), with the same browser, viewport and commands as `elements`; `elements` drops the setting and excludes those files. Wire the new project wherever `elements` is (vitest.mutation.elements.config.ts, and any gate, test or doc that names the element projects), so per-test coverage still reaches Stryker and every element test still runs exactly once. Test-first where a test can pin it (for example the vitest config test). Measure one element shard (the cancelled shard's files) before and after on this machine and record both; ci.yml's limits stay unless the measurement shows a shard cannot fit, in which case stop for the operator. |
| O7-02 | blocking | full `gate:unit-tests` run | Restates round 6's O6-02 (operator: "the whole CI run should be green so unit test timeouts should get fixed as well"): "captures the repository's 346 story-themes twice under docker" (gates/test/integration/visual.test.ts:115) went over its 600 s limit in two full runs in a row on the merged tree. | After O7-01, run the full `gate:unit-tests`; if any test still times out, raise only that test's limit with a stated margin from the measurement, every assertion kept. Show a full run passing with no test timing out. |

## Verdict

changes_requested (operator round).
