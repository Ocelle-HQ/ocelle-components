---
phase: 2
round: 2
verdict: changes_requested
base: 12fd44387bd64b75313074973d12195802557d54
head: 18d527b23b1a95d1729ff1a5b0b952d52e26d9d8
tdd_check: pass
reviewer: human:jeroennouwsdev (operator round, recorded by the orchestrator)
---

# Phase 2, round 2: operator round from landing round 1

Landing round 1 of PR #26 (`reviews/landing/round-1.md`) requested changes. The operator chose which findings go
into the landing fold. Answer, verbatim:

> "L1-01 + L1-02 + L1-04 (Recommended)": Fix the contract doc (L1-01). Close the lint hole where a factor on a parenthesised (1lh) passes, with a red unit test and a fail plant (L1-02). Remove the planning IDs FR-006 and FR-034 from the package README (L1-04).

## Findings

| ID | Severity | Where | Finding | Asked |
|---|---|---|---|---|
| OP2-01 | blocking | `specs/001-repository-foundation/contracts/ci-checks.md` (first table; L50; L53-56) | Landing L1-01. T026 added the gate "Custom-elements manifest" to `gates/gates.json`, `gates/lib/registry.ts`, `.github/workflows/ci.yml` and `gates/README.md` (fourteen gate ids, fifteen checks), but the CI-checks contract still has no row for it and says "thirteen" gate ids and "fourteen" check names. | Add the row, change both counts, and add a 005 paragraph like 002's saying the ruleset on `main` must add the new check. |
| OP2-02 | blocking | `packages/elements/README.md:231`, `:243` | Landing L1-04. The package README carries the planning IDs "(FR-006)" and "(FR-034)"; package-facing docs carry none. | Remove them, test first where `test/node/readme.test.ts` can pin it. |
