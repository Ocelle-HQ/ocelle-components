# Data Model: Data Display, First Slice (013)

The entities are element states, with no stored data. Each state lists its inputs (properties and attributes), the
values derived from them, and what is rendered and exposed. Sources: spec FR-003 to FR-039 and research R-01 to R-06.

Every public property follows README § Element conventions: a `declare` field with `@default undefined`, and an unset
property writes no attribute (PLAN-CORRECTNESS-1-011 (a)). The "Effective default" column is what the element does
when the property is unset; the manifest description states it.

## `ocelle-fact` (one pair)

| Input | Type | Effective default | Rule |
|---|---|---|---|
| `label` (attribute `label`, reflected) | `string \| undefined` | no label | The term text. Absent or empty gives an empty term. |
| `wrap` (attribute `wrap`, reflected) | `"anywhere" \| undefined` | words | `"anywhere"` gives the value, and only the value, `overflow-wrap: anywhere` (003's identifier policy), set on the value's slot. Any other value is ignored. |
| host `hidden`, `aria-hidden="true"` | attributes | none | Inside `ocelle-facts`, the fact is not a pair: no row, no term, no definition (R-01). |
| host `lang`, `dir` | attributes | none | Inside `ocelle-facts`, copied onto the fact's `<dt>` (R-01). |
| `--ocelle-facts-value-size`, `--ocelle-facts-value-line-height` (inherited hooks) | length, number | `--ocelle-font-size-fact`, `--ocelle-line-height-normal` | The value's size and line height outside `ocelle-facts` too (R-03). |
| light-DOM content | nodes | none | The value. It is never copied or rewritten. |

**Placement** (derived in `connectedCallback`):
- `inFacts` is true when `parentElement.localName === "ocelle-facts"`.
- Inside `ocelle-facts`, the fact's shadow root is one `<slot>`.
- Outside, it renders `<span part="label">` and the `<slot>` as two blocks, with no term or definition roles.
- A move into or out of `ocelle-facts` reconnects the fact, which decides again and re-renders.

**Before upgrade:** an unknown inline element. Inside an undefined `ocelle-facts`, `@ocelle/styles` makes it a block
unless it has `hidden` (`:not([hidden])`, so a hidden fact keeps the user-agent `display: none`), so each value is on
its own line; no label is shown until upgrade (R-01, PLAN-FRESH-2-002).

## `ocelle-facts` (the sheet)

| Input | Type | Effective default | Rule |
|---|---|---|---|
| `density` (attribute, reflected) | `"compact" \| undefined` | default spacing | `compact` sets the row gap to `--ocelle-space-1`. It changes no type. Any other value acts as unset. |
| `layout` (attribute, reflected) | `"columns" \| "stacked" \| undefined` | automatic | `columns` keeps two columns and `stacked` one column at any size; unset or any other value gives the automatic switch (R-02, FR-013, PLAN-FRESH-2-001 (c)). |
| `--ocelle-facts-stack-below` (CSS hook) | absolute length | `calc(var(--ocelle-space-10) * 6)` (24rem) | The threshold below which pairs stack automatically. A percentage, 0 or an invalid value falls back to the default (R-02). |
| `--ocelle-facts-value-size` (CSS hook, inherited) | length | `--ocelle-font-size-fact` | The values' font size. `@ocelle/styles` sets it to `--ocelle-font-size-sm` in a `data-ocelle-density="compact"` region and back in a `regular` one (R-03). |
| `--ocelle-facts-value-line-height` (CSS hook, inherited) | number | `--ocelle-line-height-normal` | The values' line height. `@ocelle/styles` sets it to `--ocelle-line-height-compact` in a compact region and back in a `regular` one. |
| children | nodes | none | Only `ocelle-fact` children without `hidden` or `aria-hidden="true"` are pairs, in source order. |

**Derived values:**
- `pairs`: the `ocelle-fact` children in source order that are not hidden, recomputed on every `childList` mutation of
  the host and every `label`, `hidden`, `aria-hidden`, `lang` or `dir` mutation of a child (R-01).
- `threshold`: the hook probe's inline size, or the default probe's when the hook probe measures 0 or not finite
  (R-02).
- `measure`: the sheet's own content-box inline size as laid out in two columns, independent of `stacked`: the
  container's inline size in a block container, the two-column max-content capped by the host's space in a
  shrink-to-fit host (R-02; measured in phase 1's spike).
- `stacked`: `layout === "stacked"`, or `layout` unset (or any other value) and `measure < threshold`; `false` for
  `layout === "columns"`. Recomputed in the callback of one `ResizeObserver` that observes the host and both probes,
  so a change of the hook or of the root font size re-decides without a resize of the sheet (R-02,
  PLAN-FRESH-2-004), and on a change of `layout`.

**Rendered:**
- With no pairs: nothing.
- Otherwise:
  ```text
  <dl part="list" class="{stacked}">
    per pair: <dt part="label" lang="{fact lang}" dir="{fact dir}">{label}</dt><dd part="value"><slot/></dd>,
              with the slot assigned to that pair
  </dl>
  ```
  The probes are in a zero-size, hidden holder that is a sibling of the `<dl>`.

**Exposed:** one description list, with term and definition per pair (R-01).

**Transitions:**
- A child is added, removed or reordered, or hidden or shown: the element re-renders and re-assigns the slots.
- A child's `label`, `lang` or `dir` changes: the element re-renders.
- The measure crosses the threshold, or the threshold crosses the measure (the hook or the root font size changed):
  `stacked` flips. The same content in the same space gives the same state from any history.
- `layout` is set or removed: the layout follows it at once.

None of these emits an event.

## `ocelle-empty-state`

| Input | Type | Effective default | Rule |
|---|---|---|---|
| `variant` (attribute, reflected) | `"panel" \| undefined` | default variant | `panel` sets the larger padding and gaps and the lighter heading weight (R-04). Any other value acts as unset. |
| slot `visual` | nodes | none | An icon or an `ocelle-progress`. A slotted `ocelle-progress` is as wide as the column, capped at `--ocelle-measure-reading`. |
| slot `heading` | nodes | none | The consumer's own heading element. Its level is the consumer's. |
| default slot | nodes | none | The body text. |
| slot `actions` | nodes | none | Buttons or links. |

**Derived values:**
- `has.visual`, `has.heading`, `has.text` and `has.actions`, each true when something assigned to the slot renders:
  an assigned element whose computed `display` is not `none`, or an assigned text node with non-whitespace text.
  Recomputed on `slotchange` and from a `MutationObserver` on the assigned nodes (`hidden` on elements, character data
  on text nodes), so toggling `hidden` on slotted content updates them (R-04, PLAN-FRESH-2-007 (a)). A part whose flag
  is false is `display: none`.
- `last`: the last present part. Each present part but `last` carries the `margin-block-end` R-04's table names for it;
  `last` carries none, and no part has a block-start margin. An absent part therefore adds no space and no gap, at
  the start, in the middle or at the end.

**Exposed:** only the slotted content. The element has no role of its own.

## `ocelle-progress`

| Input | Type | Effective default | Rule |
|---|---|---|---|
| `value` (attribute `value`) | `number \| undefined` | none (indeterminate) | Unset, `null`, an empty or whitespace attribute, or a non-finite number makes the bar indeterminate. Otherwise the value is clamped to [0, effective max]. |
| `max` (attribute `max`) | `number \| undefined` | 100 | The effective max is `max` when it is finite and above 0, else 100. |
| `value-text` (attribute `value-text`, property `valueText`) | `string \| undefined` | none | Exposed as the value text, and shown with `show-label`, only while the bar is determinate and it is not empty. |
| `label` (attribute `label`) | `string \| undefined` | none | The accessible name, unless the host has an `aria-label`. Shown with `show-label`. |
| `show-label` (attribute, property `showLabel`) | `boolean \| undefined` | hidden | Shows the label (and the value text, when determinate and set). |
| `size` (attribute, reflected) | `"compact" \| undefined` | default size | `compact` makes the bar thinner and puts the label beside it. |
| `ground` (attribute, reflected) | `"tinted" \| undefined` | main grounds | `tinted` draws the track boundary in `--ocelle-color-accent-strong`, for inset, accent-low, hover-bg and the state grounds (R-06). |
| host `aria-label` (observed) | string | none | Overrides `label` for the name (Host ARIA rule). |

**Derived values:**
- `effectiveMax`, `effectiveValue` (R-05);
- `determinate = effectiveValue !== undefined`;
- `fraction = effectiveValue / effectiveMax`.

**Exposed through ElementInternals:**

| Property | Value |
|---|---|
| `role` | `progressbar` |
| `ariaValueMin` | `"0"` |
| `ariaValueMax` | `String(effectiveMax)` |
| `ariaValueNow` | the effective value when determinate, else `null` |
| `ariaValueText` | `value-text` when determinate and not empty, else `null` |
| `ariaLabel` | `label` when not empty, else `null` |

**Rendered fill:**
- determinate: the fill from the inline start, its inline size `fraction × 100%` written through the CSSOM;
- not determinate: the inline `inline-size` removed (`style.removeProperty`), so the mark takes the stylesheet's 40%.

**States:**
- determinate (fill at `fraction`, from the inline start, mirrored under `dir="rtl"`);
- indeterminate, motion not reduced: the mark sweeps from the inline start to the inline end within the page's one
  sweep window (three loops, 4.2 s at the default tokens, from the page start), then rests as the still mark;
- indeterminate, after the sweep, and under reduced motion: the still mark, 30% to 70% of the track, with no running
  animation;
- each in two sizes, two grounds (`ground` unset or `tinted`), with or without the visible label.

**Page sweep start** (R-06, PLAN-FRESH-2-005 (a)): one per document, recorded from `document.timeline.currentTime`
when the first indeterminate mark's animation starts, and kept on the `document` (not public surface). Every mark
animation's `startTime` is set to it, so a bar inserted, replaced, re-shown or made indeterminate again continues the
page's sweep, and after the window shows the still mark at once.

The track clips the mark. A transition from determinate to indeterminate does not restart the sweep: it joins the
page's sweep window. The element emits no event.
