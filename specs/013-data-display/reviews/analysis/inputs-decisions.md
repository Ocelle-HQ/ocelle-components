# Operator decisions on the input questions (2026-11-14, human:jeroennouwsdev)

Questions: `reviews/analysis/inputs-questions.md` (IQ-01 to IQ-15), from the operator-supplied
`sources/013-inputs.md`.

| Question | Decision | Option chosen |
|---|---|---|
| IQ-01 Facts track sizing | a | Keep FR-005's tracks; the README warns against restyling the columns. |
| IQ-02 Shrinking in a grid parent | a | Consumer's: the consumer sets `min-inline-size: 0` on the host; the README says so; phase 1's spike adds a `1fr` grid case. |
| IQ-03 Facts term weight | a | Keep 500 (`--ocelle-font-weight-medium`); Drift adjusts with `::part(label)`. |
| IQ-04 Long values | b | break-word and break-anywhere map to `wrap="anywhere"`; the README states there is no truncation and the inspector maps to `anywhere`. |
| IQ-05 #280's grouped strip | b | Add a third `layout` value for #280's grouped cells reflowing across four, two and one columns (widens the surface). |
| IQ-06 Panel heading weight | a | Keep FR-022 as #510's text: medium (500) with the larger rhythm. |
| IQ-07 Card chrome, busy border, message card | a | As the spec: card, message and ops card are the consumer's; the dashed card goes to the #509 family. |
| IQ-08 Refusal eyebrow and path | c | Add an `eyebrow` slot to `ocelle-empty-state` (widens the surface); the path stays the consumer's body content. |
| IQ-09 Several body paragraphs | b | The element zeroes slotted body margins and adds a token gap between body children. |
| IQ-10 Progress named by an outside heading | a | The consumer passes the heading's text as `label`. |
| IQ-11 Progress as a focusable heading | b | Consumer's own `<h2 tabindex="-1">` in the empty-state heading slot with the bar in `visual`, plus a README warning against `role` or `tabindex` on the host. |
| IQ-12 Progress inline in a list row | a | `:host { display: block }` stated in the plan; the consumer sets display and size from outside. |
| IQ-13 Label, bar and percent layout | b | The value text sits at the inline end of the labelled row, the label at the start. |
| IQ-14 #498's label slot | a | Keep the `label` property only. |
| IQ-15 Fallback text inside the bar | b | The README states it, and a browser test proves the fallback text is neither shown nor exposed after upgrade. |
