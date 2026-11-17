---
phase: 4
round: 2
verdict: changes_requested
base: 835df815b08826710d13a37be17a9baa235bd5f9
head: 86833e6
tdd_check: pending
reviewer: human:jeroennouwsdev (operator round, recorded by the orchestrator)
---

# Phase 4, round 2: operator round, a form reset before the select's first render throws

<!-- Not a reviewer-renata review. The landing review of PR #49 (reviews/landing/round-1.md, blocking finding L1-01)
was put to the operator on 2026-11-17 during the /ocelle-land pass. The answer is quoted verbatim (the option label the
operator chose). The fix round that follows (label fix-2) resolves O2-01, and a phase 4 review round covers it. -->

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| O2-01 | blocking | packages/elements/src/ocelle-form-select.ts:155-162 (`control()`, `initialValue()`), reached from src/form-control.ts:408-414 (`resetValue()`) through `formResetCallback()` (:435) | Landing finding L1-01: a form reset in the same task as the select's insertion, before its first render, throws `TypeError: Cannot read properties of null (reading 'options')` to `window`; the end state is right, but a native select never throws on reset (FR-024). Reproduced in Chromium 1243 (see the landing review). Operator, answering: "Fold with two notes (Recommended)". | Test-first: a scenario that resets the form in the insertion task and asserts no page error, red on the current code; then a guard (for example `initialValue()` reads the default from the light-DOM options until the first render, or the reset defers to the first update); then correct the `control()` comment. |

## Verdict

changes_requested (operator round).
