---
phase: 2
round: 6
verdict: changes_requested
base: 48cdc9584ab93373eff1544378e118f20eded10e
head: 19921596
tdd_check: pass
reviewer: human:jeroennouwsdev (operator round, recorded by the orchestrator)
---

# Phase 2, round 6: operator round on icon-only rows (fix-4 amended)

<!-- Not a reviewer-renata phase review. During fix-4 (operator round 5, O3-01), after the red commit 19921596, the
implementer stopped before the green commit: `gate:visual` showed that the rule `.icon-row > .label { align-self:
baseline }` moves icon-only controls off the line. The operator decided on 2026-11-18. Recorded as an operator round so
that fix-4 continues under the amended decision and a round 7 review applies. The operator's answer is quoted
verbatim. -->

Operator, 2026-11-18, multiple choice: "Rule for labelled rows (Recommended)", described as "Apply the rule only to
labelled rows: `.icon-row:not(.bare) > .label { align-self: baseline }`, and make the `bare` modifier (no label) part
of the convention. Icon-only buttons stay exactly where they were, matching a native button. The planner amends
decision 33 and adds an icon-only test case to the red (a second red step under fix-4), then green."

## What the implementer measured (built Storybook, Chromium, 16 px paragraph; negative is above the baseline)

| Case | Before the rule | With the rule |
|---|---|---|
| Labelled button, label baseline | -6.19 px | 0 px |
| Icon-only, default size, icon centre | -10 px | +11.59 px |
| Icon-only, compact, icon centre | -10 px | +10.5 px |
| Icon-only, busy, icon centre | -10 px | +11.59 px |
| Native `<button>` with an svg, icon centre | -10 px | -10 px |

An icon-only control's `.label` is empty and zero-height, so with `align-self: baseline` its baseline is synthesized
from the label's top and the control hangs below the line (17 px below its labelled neighbour in
`elements-ocelle-button--busy-with-icon`). All 12 visual differences were whole-control moves; no position inside a
control changed, and no `ocelle-action-row` baseline moved.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| O6-01 | blocking | packages/elements/src/icon-slot.ts; plan.md decision 33; tasks.md T029a–T029e | Decision 33's rule applies to rows with no label and moves icon-only controls 10.5 to 11.6 px below the line, where they sat 10 px above it like a native button with an svg. | Apply the rule to labelled rows only (`.icon-row:not(.bare) > .label { align-self: baseline }`) and make the `bare` modifier part of the convention, with its doc text. Test first: add icon-only cases (default, compact, busy) asserting the icon's centre stays where a native `<button>` with an svg puts it (within 0.5 px), committed as a second red step under fix-4, then green. Regenerate under docker only the baselines that move; icon-only stories must not move. |

## Verdict

changes_requested (operator round).
