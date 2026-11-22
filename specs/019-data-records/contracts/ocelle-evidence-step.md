# Contract: `ocelle-evidence-step`

Module `packages/elements/src/ocelle-evidence-step.ts`, class `OcelleEvidenceStep`,
`define("ocelle-evidence-step", …)`.

## Public surface (manifest)

| Kind | Name | Type / value | Default | Description |
|---|---|---|---|---|
| property / attribute | `variant` (reflected) | `"chip" \| undefined` | `undefined` | `chip` draws the step compact inside a chain, with no marker or ordinal. |
| property / attribute | `wrap` (reflected) | `"anywhere" \| undefined` | `undefined` | `anywhere` breaks long identifiers in the content anywhere. |
| slot | (default) | the step's content | | |
| CSS part | `content` | | | |
| CSS custom properties | none | | | |
| events | none | | | |

## Shadow structure

```html
<span part="content"><slot></slot></span>
```

| Element | Styles |
|---|---|
| `:host` | `display: inline-block`; `:host([hidden]) { display: none }` |
| `[part="content"]` | `display: block`, a block inside the inline-block host, so the content's lines leave no gap between their line boxes that axe's colour-contrast check reads as an overlap (`bgOverlap`; an inline span of two lines did, on the long-step story; phase 3 review R1-05). `overflow-wrap: anywhere` under `:host([wrap="anywhere"])` |

The step's type, colour and chip box come from its container (`::slotted()`), with the chip's box rule outside the
container's variant block so the outline stays in forced colours (`CanvasText`;
[ocelle-evidence-chain.md](ocelle-evidence-chain.md) § Forced colours). Outside a chain the step inherits the page's text and shows as plain text, with no marker, ordinal
or chip box.

## README mapping (FR-058, research R-16)

The README's evidence-chain mapping rows are research R-16's phase 3 table (operator, 2026-11-22,
`reviews/phase-3-inventory-decisions.md`; Q-T4 (a), 2026-11-20), asserted by role name in phase 3's red (T062) and
written in its green (T070). The rows this element carries:

- The `stage` part maps to this element's host, a light-DOM element the consumer styles directly, and its `content`
  part (IQ-24 (a)).
- A stage's `id` maps to an `id` the consumer sets on the step, if it needs one; the element reads and writes no `id`
  (IQ-18 (a)).
- A stage's label, display value and annotation map to the consumer's markup in the step's content; the step draws no
  pill tag of its own (FR-035), and a later issue covers a valued stage (IQ-19 (a)).
- A stage's tone maps to the state worded in the step's text, with no state colour on any mark (FR-013); a later
  issue covers a tone (IQ-20 (a)).
- The library's compact step maps to the default step, with its marker and ordinal; #517's pill-shaped chip maps to
  `variant="chip"` with `--ocelle-radius-2`, never the pill radius (constitution II, FR-035; Q-T4 (a)).
- Long content wraps between words inside the step; `wrap="anywhere"` breaks identifiers (FR-024).

No property, attribute, slot, part or story is added for any of them.
