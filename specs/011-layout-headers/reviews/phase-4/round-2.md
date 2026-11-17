---
phase: 4
round: 2
verdict: changes_requested
reviewer: human:jeroennouwsdev (operator round, recorded by the orchestrator)
base: 0313f9f955f085d60d70be012411a70faeb54577
head: 0de181f7b7ebae42ab303ced5954282d9d69d78f
---

# Phase 4, round 2: operator round at landing (PR #44)

The landing review `reviews/landing/round-1.md` (changes_requested) reported the findings below. The operator decided
on 2026-11-15, answers quoted verbatim:

- "… How do I handle it?" (L1-01) = "Fix in phase 2 (Recommended)"
- "The landing review also left 4 notes on #44. Which of them should go into the same fix round? Unselected ones go in the PR body as follow-ups." = "L1-05 README fixes, L1-02 internalsKey, L1-04 forwarded slots, L1-03 sidebar templates"

Each finding below belongs to this phase and is to be fixed test-first under the story fix procedure
(`red.sh 4 fix-K`), then reviewed in round 3.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R2-01 | blocking | packages/elements/src/ocelle-context-sidebar.ts (sections rule); README | Landing L1-03: the `!important` section rules draw a `<template>` in the default slot (Alpine.js keeps these in light DOM) as an empty 33 px section with a divider. | A `<template>` (and other never-rendered content) in the default slot draws no section and no divider; a red test first in both harnesses. The README already covers that a page class with `display: none !important` cannot hide a section; keep it accurate. |
| R2-02 | blocking | packages/elements/src/naming.ts (`internalsKey`); ocelle-context-sidebar.ts, ocelle-personal-rail.ts; research.md R-11 | Landing L1-02: `@internal` hides `[internalsKey]` from the manifest, but the published `.d.ts` still declares `readonly [internalsKey]: ElementInternals` on both landmark classes (no `stripInternal`), and research.md R-11 says the field carries `@ignore`, which the code does not (phase 4 notes give the reason). | Planner: correct R-11 to the code as built and state the intended `.d.ts` treatment. Implementer: make the published declarations match that statement, test-first (a build or pack test on the emitted `.d.ts`). |
