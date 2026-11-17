---
phase: 1
round: 2
verdict: changes_requested
reviewer: human:jeroennouwsdev (operator round, recorded by the orchestrator)
base: 767c09779ea8e58c52d6f8f1182b2015ae74b821
head: 0de181f7b7ebae42ab303ced5954282d9d69d78f
---

# Phase 1, round 2: operator round at landing (PR #44)

The landing review `reviews/landing/round-1.md` (changes_requested) reported the findings below. The operator decided
on 2026-11-15, answers quoted verbatim:

- "… How do I handle it?" (L1-01) = "Fix in phase 2 (Recommended)"
- "The landing review also left 4 notes on #44. Which of them should go into the same fix round? Unselected ones go in the PR body as follow-ups." = "L1-05 README fixes, L1-02 internalsKey, L1-04 forwarded slots, L1-03 sidebar templates"

Each finding below belongs to this phase and is to be fixed test-first under the story fix procedure
(`red.sh 1 fix-K`), then reviewed in round 3.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R2-01 | blocking | packages/elements/src/slot-state.ts; packages/elements/README.md | Landing L1-04: a forwarded `<slot>` counts as content even when nothing is assigned to it, so a shell that forwards an empty slot into an element gets the wrapper, gap or divider. This matches the README's definition of "empty", but the README does not tell shell authors. | Add a README statement for shell authors on forwarded slots (an assigned-nothing forwarded `<slot>` counts as content; forward only when there is content, or remove the forwarding slot), with its assertion in the README test first. |
