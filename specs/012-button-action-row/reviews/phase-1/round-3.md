---
phase: 1
round: 3
verdict: changes_requested
base: 0efc2f72bfd57b33dabe5496070eb1fb0d6e61fb
head: aa6ac9c9
tdd_check: pass
reviewer: human:jeroennouwsdev (operator round, recorded by the orchestrator)
---

# Phase 1, round 3: operator round on the icon-row baseline

<!-- Not a reviewer-renata phase review. On 2026-11-16 mission 018 reported, through the orchestrator, that 005's
`.icon-row { align-items: flex-start }` may put a one-line ocelle-button about 3 px above the surrounding text
baseline. The operator chose "Measure at landing". The /ocelle-land pass measured it on 2026-11-18, and the operator
chose to fold the fix into this pull request. Recorded as an operator round so that the fix procedure (label fix-1
unless phase 1 already has one; use the next free label) and a round 4 review apply. The operator's answer is quoted
verbatim. -->

Operator, 2026-11-18, multiple choice: "Fold the fix now (Recommended)", described as "Record an operator round on
phase 1 (the button). The planner adds the task, implementer-ivan writes a failing baseline test and adds the rule to
the shared convention in icon-slot.ts, regenerating any visual baseline that moves under docker. Then a review round
and a landing check. That's one more CI run, and 018 starts from the fixed convention."

## Measurement (landing, 2026-11-18)

Chromium (the repository's Playwright), `tokens.css` and the browser build of head `aa6ac9c9`, body text at 16 px.
Each `<p>` holds the text "Text", an `ocelle-button` labelled "Save" and the text "after". An empty zero-size
`inline-block` marker sits on the paragraph's baseline and a second one at the end of the button's label, and the
offset is the label marker's top minus the paragraph marker's top (negative is above).

| Case | Offset |
|---|---|
| `ocelle-button` (default size) | -6.19 px |
| `size="sm"` | -6.19 px |
| with an `ocelle-icon` in the `icon` slot | -4.59 px |
| `flush` | -6.19 px |
| `variant="quiet" flush` | -6.19 px |
| native `<button>` (reference) | 0 px |

Cause: in `iconSlotStyles` (`packages/elements/src/icon-slot.ts`) the row is `inline-flex` with
`align-items: flex-start`, so no item takes part in baseline alignment and the row's baseline is its first item's,
the one-line-tall `.icon-slot` wrapper (empty or holding the icon), not the label's. The host's baseline follows.

Probe, with one extra rule adopted into each button's shadow root: `.icon-row > .label { align-self: baseline }` makes
the offset 0 px in all five cases, while the icon wrapper's and the label's positions inside the host (10.41 px from
its top) and the host's size (44 px high; 70.03, 98.03 and 44 px wide) stay exactly the same.
`.icon-row { align-items: baseline }` also gives 0 px but changes the alignment inside the row, so it was not chosen.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| O3-01 | blocking | packages/elements/src/icon-slot.ts (`iconSlotStyles`); its users ocelle-button.ts and ocelle-action-row.ts | A one-line control on the slot convention, placed in a line of text, sets its label 4.6 to 6.2 px above the line's baseline (measurement above), where a native button sits on it. | Test first: a failing test that a one-line `ocelle-button` (with and without an icon) placed in a line of text has its label on the text's baseline (within 0.5 px), then make the convention's label take part in baseline alignment (for example `.icon-row > .label { align-self: baseline }`, with the label wrapper's class part of the convention), keeping every position inside the control unchanged. Update the convention's comment and the README's slot convention text. Regenerate under docker only the visual baselines that move, and say which moved. Check `ocelle-action-row`, which shares the convention. |

## Verdict

changes_requested (operator round).
