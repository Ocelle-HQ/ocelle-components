---
phase: 1
round: 3
verdict: changes_requested
base: 30e513065d010f5c6ffcb81db0e0b83e79cacc0f
head: 1a354613
tdd_check: pending
reviewer: human:jeroennouwsdev (operator round, recorded by the orchestrator)
---

# Phase 1, round 3: operator round, a removed sheet stops listening for resize

<!-- Not a reviewer-renata review. The landing review of PR #43 (reviews/landing/round-1.md, finding L1-01 and notes
L1-02, L1-03) was put to the operator on 2026-11-15 during the /ocelle-land pass. The answers are quoted verbatim
(the option labels the operator chose). The fix round that follows (label fix-3) resolves O3-01 to O3-03, and a
phase 1 review round covers it. -->

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| O3-01 | blocking | packages/elements/src/ocelle-facts.ts:220-233 (the `BlockStatement` record on `disconnectedCallback` and the `StringLiteral, CallExpression` record on `window.removeEventListener("resize", …)`) | Landing finding L1-01: the two records are not equivalent under research R-08. Without the cleanup, a sheet removed from the document still re-decides its layout on a window resize (reproduced in Chromium 1243: the detached `<dl>` loses `stacked`), so `window` keeps every removed sheet and its content alive. The shipped code cleans up; the test coverage is missing. Operator, answering: "(a) Add the test (Recommended)". | Add an in-process test that a sheet removed from the document does not re-decide its layout on a window resize, and delete the two records. The source already behaves, so the test cannot be red: show it fails with the cleanup removed by hand and record that in the fix note. |
| O3-02 | blocking | packages/elements/src/ocelle-facts.ts:309 | Landing note L1-02: the `size >= threshold &&` operand is redundant, and the line's `ConditionalExpression` record switches off directions tests kill. Operator, answering: "L1-02: drop record at 309". | Remove the redundant operand and the line-309 record, with no behaviour change; the other `ConditionalExpression` records stay. Show mutation on the changed lines leaves no survivor. |
| O3-03 | blocking | gates/stylelint/token-only.ts:286 | Landing note L1-03: the record's reason is incomplete; `functionRaw` now also reads the property for `grid-template-columns` and `transform`. Operator, answering: "L1-03: fix record reason". | Complete the reason (comment only). |

## Verdict

changes_requested (operator round).
