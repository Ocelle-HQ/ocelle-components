# Contract: `ocelle-evidence-chain`

Module `packages/elements/src/ocelle-evidence-chain.ts`, class `OcelleEvidenceChain`. It imports
`./ocelle-evidence-step.ts` and calls `define("ocelle-evidence-chain", …)`.

## Usage

```html
<ocelle-evidence-chain label="Evidence">
  <ocelle-evidence-step>Spec</ocelle-evidence-step>
  <ocelle-evidence-step>Plan</ocelle-evidence-step>
  <ocelle-evidence-step variant="chip">3 checks</ocelle-evidence-step>
  <ocelle-evidence-step>Review</ocelle-evidence-step>
</ocelle-evidence-chain>
```

## Public surface (manifest)

| Kind | Name | Type / value | Default | Description |
|---|---|---|---|---|
| property / attribute | `label` | `string \| undefined` | `undefined` | Names the list when the host has no non-blank `aria-label`. |
| slot | (default) | `ocelle-evidence-step` children | | Other children, and hidden steps, are not shown. |
| CSS part | `list` | the shadow `<ol>` | | |
| CSS custom properties | none | | | |
| events | none | | | |

`aria-label` is observed. The name comes from `resolveName`, imported from `./overflow-region.ts` (R-09).

## Host styles

`:host { display: block; }` and `:host([hidden]) { display: none; }` beside it (FR-001; the display rule would
otherwise beat the user-agent `[hidden]` rule). A hidden chain has no box and no list node (analysis G3).

## Shadow structure

```html
<ol role="list" part="list" aria-label="…">
  <li role="listitem">                                <!-- data-line-end at a line's end; class chip for a chip -->
    <span class="marker" aria-hidden="true">1</span>  <!-- not rendered for a chip step -->
    <span class="connector" aria-hidden="true"></span>
    <slot></slot>
  </li>
  …
</ol>
```

## Behaviour

- **Assignment.** Visible steps are assigned to slots in source order, as for the timeline.
- **Name.** `resolveName(host aria-label, label)`, set on the `<ol>` (R-09).
- **Re-render.** A `MutationObserver` watches the child list and each step's `hidden`, `aria-hidden` and `variant`.
- **Ordinals.** A default step shows its 1-based position among the visible steps, chip steps counted.
- **Line ends (R-12).** These are measured after each render and from a `ResizeObserver` on the `<ol>` and every
  `<li>`. A `<li>` gets `data-line-end` when the next `<li>` starts below it, and the last `<li>` always gets it. The
  connector span lies inside the `<li>`'s trailing padding and `li[data-line-end] > .connector { display: none; }`
  hides it, so toggling it changes no size. An in-process test proves no `ResizeObserver` loop error (R-12).
- **One centre line (R-12).** Every `<li>` has `min-block-size: var(--ocelle-size-step)`; a chip `<li>` sets
  `align-items: center`. Every connector sits at `calc(var(--ocelle-size-step) / 2 - var(--ocelle-border-width) / 2)`
  from its `<li>`'s block start, so all connectors on a row share the default marker's centre line.
- **Marks.** `.marker`: `--ocelle-size-step` square, `box-sizing: border-box`, a `--ocelle-ring-step` solid border in
  `ink-muted`, no fill, `border-radius: 50%` (round, FR-031; Q-D); the ordinal in `xs`, medium, `ink-muted`,
  `figures`, line height `--ocelle-line-height-tight`. `.connector`: no block size, `border-block-start:
  var(--ocelle-border-width) solid var(--ocelle-color-rule-strong)` (decorative).
- **Chip.** `::slotted(ocelle-evidence-step[variant="chip"])` draws the box: `xs`, `line-height-normal`,
  `padding-block: 0`, `padding-inline: space-2`, a `ring-step` border in `ink-muted` and `radius-2`, with no fill
  (Q-A). It is 20.4 px tall. The box rule (border width and style, radius, padding, type) sits outside the
  `@media not (forced-colors: active)` block, because the outline is structural; only its colours sit inside. Nothing
  of `ocelle-pill-tag` is used.
- **Default content.** `::slotted(ocelle-evidence-step:not([variant="chip"]))` sets `sm`, `ink` and
  `line-height-normal`.
- **Not added.** No tab stop, live region, landmark or heading.

## Forced colours (PLAN-A11Y-SECURITY-1-001)

Every mark is a border, never a background. Outside the variant block: `@media (forced-colors: active) { .marker,
.connector { border-color: CanvasText; } ::slotted(ocelle-evidence-step[variant="chip"]) { border-color: CanvasText;
} }`. The ordinal and step text take the system text colour. No `forced-color-adjust: none`.

## Before upgrade

`@ocelle/styles` sets `:where(ocelle-evidence-chain:not(:defined) >
ocelle-evidence-step:not([hidden]):not([aria-hidden="true"])) { display: block; }` and
`:where(ocelle-evidence-chain:not(:defined) > ocelle-evidence-step[aria-hidden="true"]) { display: none; }`, so the
visible steps show one per line, with no marker or ordinal, and an `aria-hidden="true"` step is not shown, as after
upgrade (R-08, PLAN-FRESH-2-005). The README's "Before upgrade" line says so.

## Accessibility tree (Chromium)

`list` > `listitem` × N. Each item's text is the step's content only. No marker, ordinal or connector appears in the
tree; each marker and connector span carries `aria-hidden="true"`.
