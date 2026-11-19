# Phase 2, fix round 4 (operator rounds 5 and 6): fixes

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| O3-01 (round 5) | fixed: the label sits on the text's baseline, under the rule as amended by O6-01 | fix-4 19921596 (red-fix-4.log: the label marker sits above the paragraph's for the button and the test host, in both harnesses; the README's label-wrapper and baseline lines and the CHANGELOG line are missing) | packages/elements/src/icon-slot.ts (`iconSlotStyles`, header comment); packages/elements/README.md § Slot convention; packages/elements/CHANGELOG.md; 10 `ocelle-button` baselines in storybook/baselines/ |
| O6-01 (round 6) | fixed: the rule is scoped to labelled rows (`.icon-row:not(.bare) > .label`), and `bare` is part of the convention | fix-5 082fcd50 (red-fix-5.log: the README's `bare` line and its line on labelled rows and the icon-only icon are missing; the icon-only scenario passes at once, and the unscoped-rule plant proves it) | packages/elements/src/icon-slot.ts; packages/elements/README.md § Slot convention; packages/elements/CHANGELOG.md; packages/elements/test/scenarios/button.ts (the icon-only scenario) |

## O3-01

`iconSlotStyles` gains `.icon-row:not(.bare) > .label { align-self: baseline; }`. In a labelled row the label is the
only item that takes part in baseline alignment. So the row's baseline, and the host's, is the label's first line, and
the label stays at the row's start. With the rule on and neutralised, every position and size inside the control is
the same. The block-start checks of T029a and T029b guard this, and their plant (`.icon-row { align-items: baseline }`)
fails them. The README names the label wrapper and its baseline alignment, and the CHANGELOG states the fix.

## O6-01

A `bare` row is skipped. Its label is empty and zero-height, so the rule would hang the control below the line. A
`bare` row keeps the icon wrapper's baseline instead. The new scenario checks icon-only buttons (default, compact,
busy): the icon's block-centre is within 0.5 px of a native `<button>`'s svg in the same line, and the row carries
`bare`. Against the unscoped rule, all three `centre` checks fail. The README names the `bare` modifier, says the
baseline alignment applies to labelled rows only, and says where an icon-only control's icon sits.
`elements-ocelle-button--icon-only` did not move, and neither did the icon-only button in `busy-with-icon`.

Two red steps, one green commit: the first red is labelled `fix-4` and the second `fix-5`, because `red.sh` keeps one
record per label. Both red steps, the checks, the plants, the baselines that moved and the mutation run are in
notes.md § Fix round 4 and plants.md § Fix round 4.

R7-02 (round 7): the header comment of `icon-slot.ts` has the two lines on the row's block padding back under the bullet on the `inline-flex` row; they had ended up after the label-baseline bullet, as if about the `bare` row. No wording or code changed.
