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

## Shadow structure

```html
<ol role="list" part="list" aria-label="…">
  <li role="listitem">                                <!-- data-line-end when it ends a line -->
    <span class="marker" aria-hidden="true">1</span>  <!-- not rendered for a chip step -->
    <slot></slot>
  </li>
  …
</ol>
```

## Behaviour

- **Assignment.** Visible steps are assigned to slots in source order, as for the timeline.
- **Re-render.** A `MutationObserver` watches the child list and each step's `hidden`, `aria-hidden` and `variant`.
- **Ordinals.** A default step shows its 1-based position among the visible steps, chip steps counted.
- **Line ends (R-12).** These are measured after each render and from a `ResizeObserver` on the `<ol>` and every
  `<li>`. A `<li>` gets `data-line-end` when the next `<li>` starts below it, and the last `<li>` always gets it. The
  connector `li:not([data-line-end])::after` lies inside the `<li>`'s trailing padding, so toggling it changes no
  size.
- **Chip.** `::slotted(ocelle-evidence-step[variant="chip"])` draws the box: `xs`, `line-height-normal`,
  `padding-block: 0`, `padding-inline: space-2`, a `ring-step` border in `ink-muted` and `radius-2`, with no fill
  (Q-A). It is 20.4 px tall. Nothing of `ocelle-pill-tag` is used.
- **Default content.** `::slotted(ocelle-evidence-step:not([variant="chip"]))` sets `sm`, `ink` and
  `line-height-normal`.
- **Not added.** No tab stop, live region, landmark or heading.

## Accessibility tree (Chromium)

`list` > `listitem` × N. Each item's text is the step's content only. No marker, ordinal or connector appears in the
tree.
