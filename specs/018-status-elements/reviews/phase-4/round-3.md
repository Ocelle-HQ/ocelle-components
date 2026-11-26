---
phase: 4
round: 3
verdict: changes_requested
base: 2dd0959ba9795711f194e85173424f3267fb8978
head: 2dd0959ba9795711f194e85173424f3267fb8978
tdd_check: pending
reviewer: human:jeroennouwsdev (operator round, recorded by the orchestrator)
---

# Phase 4, round 3: operator round, the in-process facts of the icon-only pill (amends O2-01)

<!-- Not a reviewer-renata review. The implementer of T044a stopped before committing anything. The in-process facts
as round 2 worded them do not hold on the correct, unchanged element. Its height is never padding + border + icon:
the line box adds a descent that depends on the font, 29.19 to 30.19 px in process against 26.1 px from the tokens.
Its width also includes the icon's space-2 margin. The orchestrator's wording of the round-2 option was at fault, not
the operator's intent. Measured in process across five fonts (the fallback, DejaVu Sans, Liberation Sans, FreeSans,
DejaVu Serif): width 50.09 px in every font; the icon wrapper's top 5.00 px below the pill's top in every font; the
pill's top above the surrounding text's top in every font. A FreeSans root font reproduces the CI failure in process
(top -10.09, height 30.19). On the strict-CSP fixture `document.fonts` reports "Schibsted Grotesk" loaded, and the
icon-only pill measures T002's pin exactly. The operator asked "what do you recommend?", was given option A with its
reasons, and answered "yes". -->

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| O3-01 | blocking | tasks.md T044a; contracts/checks.md:80; plan.md decision 15; research.md R-06; packages/elements/test/scenarios/pill-tag.ts (Baseline scenario, `iconOnly`) | O2-01's in-process facts are wrong for the height and the width (see the note above). Operator, choosing option A: "Row bare; top below the text's top; width = 2×inline padding + 2×border + icon + space-2 (±0.5 px); wrapper top = pill top + border + block padding (±0.5 px); height at least 2×block padding + 2×border + icon (a lower bound). All three plants (bare never set, bare on every row, dropped override) are then killed in process as well as on the fixture." Asked for a recommendation, the operator was told A, then answered "yes". | The planner amends T044a, checks.md:80, plan.md decision 15 and research.md R-06 to these facts (O3-01 replaces O2-01's height and width wording; the pixel pin stays on the fixture only). The implementer then runs fix-1 as T044a requires: record the font proof in notes.md, red under `red.sh 4 fix-1` or hand-applied mutants, all three plants killed in process and on the fixture, recorded per harness in plants.md, `tdd-check.sh 4`, then a reviewer-renata round. No element source changes. |

## Verdict

changes_requested (operator round).
