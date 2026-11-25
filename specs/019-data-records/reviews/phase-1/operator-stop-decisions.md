# Phase 1: operator decisions at the implementer's stop-and-ask points

Asked after the green commit 7c9a166, as multiple choice.

## T022: gate:axe, 74 findings

The findings: `color-contrast-incomplete` (serious) on cells that the scroll box partly clips, in 9 overflowing or bounded stories, and `th-has-data-cells-incomplete` on the empty-body story.

**Decision: (a) Exceptions.** Add `storybook/a11y-exceptions.json` entries, each with a reason and a sunset, plus a Complexity Tracking row in plan.md, as 006 did for the prose table's clipped column.

Not chosen: (b) rework the stories so no cell is partly clipped; (c) a gate change that records these results as notes.

## T024: the one element plant that does not bite

Removing `line-height` from block 2's caption rule changes nothing. Block 1 already declares the caption's `line-height`, and the prose rules only pass it down by inheritance, which a declared value always beats.

**Decision: (a) Record equivalent.** Keep the declaration and record the plant in `element-plants.md` as equivalent, with that reason.

Not chosen: (b) remove the redundant declaration.
