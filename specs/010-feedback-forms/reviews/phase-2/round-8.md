---
phase: 2
round: 8
verdict: changes_requested
base: 6c9400cbaa1da7d2b1ce96d496e65101942524a0
head: 636207eb
tdd_check: pending
reviewer: human:jeroennouwsdev (operator round, recorded by the orchestrator)
---

# Phase 2, round 8: operator round, revert the element project split and raise the element-shard limit to 75 minutes

<!-- Not a reviewer-renata review. The fix round for round 7 (fix-5) stopped at T025j on its stop condition: the
shard CI cancelled on run 44354367030, measured on this machine, took 2748 s before the element project split and
3515 s after it (CI estimate 3189–3475 s for the element shards, over 45 minutes). The implementer found that
@stryker-mutator/vitest-runner 10.1.1 passes `maxWorkers: 1` for Vitest 4 and later, so Stryker runs test files one at
a time whatever `fileParallelism` says; the element dry run stayed at about 1273 s (2116 tests) either way. Round 7's
premise does not hold under Stryker. Only the red test commit 636207eb (T025g) was committed; the split (T025i) and
the evidence were left uncommitted. The operator was asked on 2026-11-18 how to go on, and the answer is quoted
verbatim. This round replaces round 7's O7-01 and restores round 6's O6-01 (the 75-minute limit, as the operator
answered then: "75 min but the whole CI run should be green so unit test timeouts should get fixed as well");
O7-02 (unit-tests green, no test timing out) stands as O8-03. The fix round that follows (label fix-6) resolves
O8-01 to O8-03, and a phase 2 review round covers it. -->

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| O8-01 | blocking | 636207eb (T025g red); uncommitted T025i change | The element project split makes the cancelled shard slower (2748 s → 3515 s) and does not touch the dry run, because Stryker runs files one at a time. Operator, answering: "Revert split, 75-minute limit (Recommended)" (the option: "drop round 7's split (discard the uncommitted change, revert the red test commit 636207eb with a signed-off revert, keep the measurement in mutation.md as evidence), and go back to round 6: element shards get a 75-minute limit, test-first, plus unit tests green with no timeout."). | Keep the measurement as evidence: commit § O7-01 of `reviews/phase-2/mutation.md`, `red-fix-5.log`, the `fix-5` line of `red-commits`, and `mutation-fix-5-before.log` / `mutation-fix-5-after.log`, stating the outcome (split withdrawn by this round). Discard the uncommitted T025i change. Revert 636207eb with a signed-off `git revert`. `vitest.config.ts` keeps `fileParallelism: false` on `elements` as before round 7. |
| O8-02 | blocking | .github/workflows/ci.yml:90 (`mutation-shard` `timeout-minutes`) | Round 6's O6-01, restored: element shards need more than 45 minutes on the merged tree (CI 2493–2717 s, one cancelled; 2748 s on this machine). | As round 6's T025e stated it, test-first: pin exactly 75 for a shard with a `packages/elements/src/` entry (10 for the others) in gates/test/ci-workflow.test.ts, red on the current ci.yml; then ci.yml, `specs/001-repository-foundation/contracts/ci-checks.md` (`mutation-shard` row) and `gates/README.md`. |
| O8-03 | blocking | full `gate:unit-tests` run | Restates O7-02 / O6-02 (operator: "the whole CI run should be green so unit test timeouts should get fixed as well"). The red run of fix-5 (a full `pnpm test` at 636207eb) had no timeout; the merged tree's earlier full runs had the visual test (gates/test/integration/visual.test.ts:115) over its 600 s limit twice. | After O8-01 and O8-02, run the full `gate:unit-tests`; if any test times out, raise only that test's limit to its measured duration with a stated margin, every assertion kept. Show a full run passing with no test timing out. |

## Verdict

changes_requested (operator round).
