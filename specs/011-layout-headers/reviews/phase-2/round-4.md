---
phase: 2
round: 4
verdict: changes_requested
reviewer: human:jeroennouwsdev (operator round, recorded by the orchestrator)
base: dbf9f9fbad57532469d3b48f9d8b4213af488df8
head: 0de181f7b7ebae42ab303ced5954282d9d69d78f
---

# Phase 2, round 4: operator round at landing (PR #44)

The landing review `reviews/landing/round-1.md` (changes_requested) reported the findings below. The operator decided
on 2026-11-15, answers quoted verbatim:

- "… How do I handle it?" (L1-01) = "Fix in phase 2 (Recommended)"
- "The landing review also left 4 notes on #44. Which of them should go into the same fix round? Unselected ones go in the PR body as follow-ups." = "L1-05 README fixes, L1-02 internalsKey, L1-04 forwarded slots, L1-03 sidebar templates"

Each finding below belongs to this phase and is to be fixed test-first under the story fix procedure
(`red.sh 2 fix-K`), then reviewed in round 5.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R4-01 | blocking | packages/elements/src/ocelle-card.ts:105-107 | Landing L1-01: the card passes `event.target` of `slotchange` to `notifyHeaders`. When a wrapper forwards its own slot into the card's `header` slot, the event target is the wrapper's slot, the card forgets the section headers placed directly in its `header` slot, and a header that then leaves the slot without reconnecting (its `slot` attribute removed) stays compact in the card's body, against FR-017 and the README (a header in the body keeps its own size). Reproduced in Chromium on the browser build. | Read the card's own `slot[name="header"]` (as `updated()` does) or `event.currentTarget`; a red test first with the forwarded-slot case in both harnesses. |
