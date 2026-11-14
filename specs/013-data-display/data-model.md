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
| `layout` (attribute, reflected) | `"columns" \| "stacked" \| "grid" \| undefined` | automatic | `columns` keeps two columns and `stacked` one column at any size; `grid` gives cells (label above value) in four, two or one columns (FR-014, IQ-05 (b)); unset or any other value gives the automatic switch (R-02, FR-013, PLAN-FRESH-2-001 (c)). |
| `--ocelle-facts-stack-below` (CSS hook) | absolute length | `calc(var(--ocelle-space-10) * 6)` (24rem) | The threshold below which pairs stack automatically, and, with `layout="grid"`, below which cells take one column; twice it is the grid's four-column point. A percentage, 0 or an invalid value falls back to the default (R-02). |
| `--ocelle-facts-value-size` (CSS hook, inherited) | length | `--ocelle-font-size-fact` | The values' font size. `@ocelle/styles` sets it to `--ocelle-font-size-sm` in a `data-ocelle-density="compact"` region and back in a `regular` one (R-03). |
| `--ocelle-facts-value-line-height` (CSS hook, inherited) | number | `--ocelle-line-height-normal` | The values' line height. `@ocelle/styles` sets it to `--ocelle-line-height-compact` in a compact region and back in a `regular` one. |
| children | nodes | none | Only `ocelle-fact` children without `hidden` or `aria-hidden="true"` are pairs, in source order. |

**Derived values:**
- `pairs`: the `ocelle-fact` children in source order that are not hidden, recomputed on every `childList` mutation of
  the host and every `label`, `hidden`, `aria-hidden`, `lang` or `dir` mutation of a child (R-01). `childList` and
  `characterData` mutations inside a pair do not recompute it, but re-run the measure pass (below).
- `threshold`: the hook probe's inline size, or the default probe's when the hook probe measures 0 or not finite
  (R-02).
- `measure`: the sheet's own content-box inline size as laid out in two columns, independent of `stacked`: the
  container's inline size in a block container, the two-column max-content capped by the host's space in a
  shrink-to-fit host (R-02; measured in phase 1's spike).
- `stacked`: `layout === "stacked"`, or `layout` unset (or any other value) and `measure < threshold`; `false` for
  `layout === "columns"`. Decided by the measure pass (R-02), which runs:
  - one animation frame after the callback of one `ResizeObserver` that observes the host and both probes (the
    callback schedules the pass in a `requestAnimationFrame` and never runs it inside the callback, so no
    "ResizeObserver loop" error is raised; operator decision "(a) Defer + 2-frame wait", 2026-11-14), so a change of
    the hook or of the root font size re-decides without a resize of the sheet (PLAN-FRESH-2-004);
  - in `updated()`, after every render (a re-render from the facts `MutationObserver`, a change of `layout`);
  - on the facts `MutationObserver`'s `childList` and `characterData` records inside a pair (value text changed in
    place);
  - on `window` `resize` (PLAN-FRESH-3-001 (c)).
  Changes of the offered space that none of these reports (named by phase 1's spike, R-02 § Changes the pass does not
  observe) are outside the history-independence guarantee; there the README asks for `layout` or an inline size.
- `columns` (with `layout === "grid"` only): `gridMeasure` is the sheet's own content-box inline size as laid out in
  four columns (no column class on the `<dl>`); 4 when `gridMeasure >= 2 × threshold`, 2 when `gridMeasure >=
  threshold`, else 1. Decided by the same measure pass, on the same triggers, with the same narrowing (R-02 § The
  grid layout's column count). The pass sets the internal class `cols-2` or `cols-1` (none for 4) unconditionally.
- `stacked` is not a reactive property and is not bound in the template. The measure pass removes the `stacked` class,
  reads the measure, and sets the class from the decision unconditionally, so the DOM never differs from the decision
  (PLAN-FRESH-3-002).

**Rendered:**
- With no pairs: nothing.
- Otherwise:
  ```text
  <dl part="list">        (class "stacked" set by the measure pass only, never by the template)
    per pair: <dt part="label" lang="{fact lang}" dir="{fact dir}">{label}</dt><dd part="value"><slot/></dd>,
              with the slot assigned to that pair
  </dl>
  ```
  With `layout="grid"` (IQ-05 (b), R-01):
  ```text
  <dl part="list">        (class "cols-2" or "cols-1" set by the measure pass only; none for four columns)
    per pair: <div class="item"><dt part="label" lang=… dir=…>{label}</dt><dd part="value"><slot/></dd></div>,
              with the slot assigned to that pair
  </dl>
  ```
  The probes are in a zero-size, hidden holder that is a sibling of the `<dl>`.

**Exposed:** one description list, with term and definition per pair (R-01), in every layout; in the grid the `<div>`
groups add no node that separates a term from its definition (measured in phase 1's spike; a failure goes to the
operator).

**Transitions:**
- A child is added, removed or reordered, or hidden or shown: the element re-renders and re-assigns the slots.
- A child's `label`, `lang` or `dir` changes: the element re-renders.
- The measure crosses the threshold, or the threshold crosses the measure (the hook or the root font size changed):
  `stacked` flips at the next run of the measure pass. The same content in the same space gives the same state from
  any history, for every change one of the pass's triggers reports (above).
- Value text changes in place, a label changes, or the window is resized: the measure pass re-runs, so a stacked sheet
  in a shrink-to-fit host whose two-column size has crossed the threshold leaves the stacked state.
- `layout` is set or removed: the layout follows it at once. A change into or out of `grid` re-renders the `<dl>`'s
  structure (grouped or not) and re-assigns the slots.
- With `layout="grid"`, the four-column measure crosses T or 2 × T: the column count changes at the next run of the
  measure pass, from any history, for every change one of its triggers reports.

None of these emits an event.

## `ocelle-empty-state`

| Input | Type | Effective default | Rule |
|---|---|---|---|
| `variant` (attribute, reflected) | `"panel" \| undefined` | default variant | `panel` sets the larger padding and gaps and the lighter heading weight (R-04). Any other value acts as unset. |
| slot `visual` | nodes | none | An icon or an `ocelle-progress`. A slotted `ocelle-progress` is as wide as the column, capped at `--ocelle-measure-reading`. |
| slot `eyebrow` | nodes | none | A short line above the heading (IQ-08 (c), FR-025): sans, `--ocelle-font-size-xs`, medium, ink-muted, upper case, margins 0. No role added. |
| slot `heading` | nodes | none | The consumer's own heading element. Its level is the consumer's. |
| default slot | nodes | none | The body. Assigned elements have block margins 0 and are separated by `--ocelle-space-2`; each assigned element or run of text is its own block (IQ-09 (b), FR-026). They sit in the default-slot area, the internal `.text` wrapper, which is not a part; the `body` part is the whole column. |
| slot `actions` | nodes | none | Buttons or links. |

**Derived values:**
- `has.visual`, `has.eyebrow`, `has.heading`, `has.text` and `has.actions`, each true when something assigned to the slot renders:
  an assigned element whose computed `display` is not `none`, or an assigned text node with non-whitespace text.
  Recomputed on `slotchange` and from a `MutationObserver` on the assigned nodes (`hidden` on elements, character data
  on text nodes), so toggling `hidden` on slotted content updates them (R-04, PLAN-FRESH-2-007 (a)). A part whose flag
  is false is `display: none`.
- `last`: the last present part. Each present part but `last` carries the `margin-block-end` R-04's table names for it;
  `last` carries none, and no part has a block-start margin. An absent part therefore adds no space and no gap, at
  the start, in the middle or at the end. The eyebrow's margin depends on whether the heading is present (R-04's
  table), marked by an internal class from the flags.

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
| light-DOM content | nodes | none | Not slotted: shown only before upgrade, neither shown nor exposed after it (IQ-15 (b)). |
| host `display` | CSS | `block` | The consumer sets it (and an inline size) from outside to place the bar inline (IQ-12 (a)). |

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
- not determinate: the inline `inline-size` removed (`style.removeProperty`), so the mark takes the stylesheet's 40%;
- no `transition` on the fill: every change of its inline size takes effect at once (PLAN-FRESH-3-003 (b)).

**States:**
- determinate (fill at `fraction`, from the inline start, mirrored under `dir="rtl"`);
- indeterminate, motion not reduced: the mark sweeps from the inline start to the inline end within the loading
  episode's one sweep window (three loops, 4.2 s at the default tokens, from the episode start), then rests as the
  still mark;
- indeterminate, after the sweep, and under reduced motion: the still mark, 30% to 70% of the track, with no running
  animation;
- each in two sizes, two grounds (`ground` unset or `tinted`), with or without the visible label. With the visible
  label and a determinate `value-text`, the label is at the row's inline start and the value text at its inline end:
  the row above the track at the default size, the row holding label, track and value text in compact (IQ-13 (b)).

**Loading episode** (R-06, PLAN-FRESH-2-005 (a), amended by PLAN-FRESH-3-004 (a)): kept on the `document` (not
public surface), shared by every copy of the package:
- `bars`: the connected indeterminate bars. A bar joins when it is connected while indeterminate or becomes
  indeterminate while connected, and leaves when it is disconnected or becomes determinate. A bar under `display: none`
  stays connected and stays in the set.
- `start`: the episode's sweep start, recorded from `document.timeline.currentTime` when the first mark animation
  starts while there is none. Every mark animation's `startTime` is set to it, so a bar inserted, replaced, re-shown or
  made indeterminate again during the episode continues its sweep, and after the window shows the still mark at once.
- The episode ends when `bars` is empty at an animation-frame callback requested when the last bar left: `start` is
  deleted, and the next indeterminate bar starts a new sweep. A swap in one task never ends it.

The track clips the mark. A change from determinate to indeterminate does not restart the sweep while the episode
lasts: it joins the episode's sweep window. The element emits no event.
