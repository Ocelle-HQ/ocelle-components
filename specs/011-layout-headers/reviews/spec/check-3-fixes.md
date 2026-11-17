# Spec check 3: fixes

Operator decision at the spec gate (2026-11-13, human:jeroennouwsdev), "Approve after a final fix": the spec is
approved once these findings are fixed; no further spec check follows, and the plan squad reads the spec next. The
operator also confirmed fix 2's context-sidebar spacing (SPEC-2-03: per-part `--ocelle-space-4` padding, no gap
between parts, full-width dividers between padded parts, inline padding only for loose text). Both are recorded at
the top of `spec.md`. Check 3 had no operator questions.

| ID | Resolution | Where |
|----|------------|-------|
| SPEC-3-01 | fixed | spec.md FR-022 (the parts are the head, the default slot with its sections and text together, and the footer; a divider at the default slot's block start and block end when the neighbouring part is non-empty; inside the slot a divider at the block start of every section except the first, whatever text lies before it; text counts toward the slot being non-empty but adds no divider of its own; an empty slot leaves one divider between head and footer); US3-11 (exactly one divider, at the second section's block start, between the text and the second section, none between the first section and the text; a text-only default slot sits between the head-to-slot and slot-to-footer dividers); Edge Cases (sidebar text nodes, "dividers separate only assigned elements" replaced) |
| SPEC-3-02 | fixed | spec.md FR-013 (`size` and a compact card's density change nothing in the eyebrow variant); US1-5 (an eyebrow-variant header with no `size`, one with `size="compact"` and one in a compact card's `header` slot, each with two actions, have the same heading style, actions gap and block size) |
| SPEC-3-03 | fixed | spec.md "Consumer need" (each element falls short today; no Kitty Desktop workaround for the card is recorded); SC-006 (four workarounds, card density overrides dropped); FR-036 (the Consumer-need workaround statement applies to every element but the card) |
| SPEC-3-04 | fixed | spec.md SC-004 (`brand-rules` added) |
| SPEC-3-05 | fixed | spec.md US4-2 (in part: a 600 px container, the rail 600 px tall, the last bottom item's block end at the content-box block end) |

Not taken up, because each needs a product choice the operator has not made: the rail divider's gaps to the two
groups and the outcome of a vertical rail whose items are taller than its container (rest of SPEC-3-05), and the page
header band's ground (SPEC-3-06). They stay notes for the plan squad.
