---
phase: 5
round: 2
verdict: changes_requested
reviewer: human:jeroennouwsdev (operator round, recorded by the orchestrator)
base: a54366b18c1937589c05f8d510b74a362f65eae9
head: 0de181f7b7ebae42ab303ced5954282d9d69d78f
---

# Phase 5, round 2: operator round at landing (PR #44)

The landing review `reviews/landing/round-1.md` (changes_requested) reported the findings below. The operator decided
on 2026-11-15, answers quoted verbatim:

- "… How do I handle it?" (L1-01) = "Fix in phase 2 (Recommended)"
- "The landing review also left 4 notes on #44. Which of them should go into the same fix round? Unselected ones go in the PR body as follow-ups." = "L1-05 README fixes, L1-02 internalsKey, L1-04 forwarded slots, L1-03 sidebar templates"

Each finding below belongs to this phase and is to be fixed test-first under the story fix procedure
(`red.sh 5 fix-K`), then reviewed in round 3.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R2-01 | blocking | packages/elements/README.md:440-448 | Landing L1-05: the rail section tells consumers to use `ocelle-nav-item`, which no release ships yet, without saying so; a stray line break sits at line 445. | Say that `ocelle-nav-item` is not released yet (keeping the wording FR-027 asks for), remove the stray line break; README test assertion first. |
