# Data Model: Data Display, First Slice (013)

The entities are element states, with no stored data. Each state lists its inputs (properties and attributes), the
values derived from them, and what is rendered and exposed. Sources: spec FR-003 to FR-039 and research R-01 to R-06.

## `ocelle-fact` (one pair)

| Input | Type | Default | Rule |
|---|---|---|---|
| `label` (attribute `label`, reflected) | `string` | `""` | The term text. Absent or empty gives an empty term. |
| `wrap` (attribute `wrap`, reflected) | `"anywhere" \| undefined` | `undefined` | `"anywhere"` gives the value `overflow-wrap: anywhere` (003's identifier policy). Any other value is ignored. |
| light-DOM content | nodes | none | The value. It is never copied or rewritten. |

**Placement** (derived in `connectedCallback`):
- `inFacts` is true when `parentElement.localName === "ocelle-facts"`.
- Inside `ocelle-facts`, the fact's shadow root is one `<slot>`.
- Outside, it renders `<span part="label">` and the `<slot>` as two blocks, with no term or definition roles.

## `ocelle-facts` (the sheet)

| Input | Type | Default | Rule |
|---|---|---|---|
| `density` (attribute, reflected) | `"default" \| "compact"` | `"default"` | `compact` sets the row gap to `--ocelle-space-1`. Any other value acts as `default`. |
| `--ocelle-facts-stack-below` (CSS hook) | length | `calc(var(--ocelle-shell-sidebar-width) + var(--ocelle-space-10))` (24rem) | The threshold below which pairs stack. |
| children | nodes | none | Only `ocelle-fact` children are pairs, in source order. |

**Derived values:**
- `pairs`: the `ocelle-fact` children in source order, recomputed on every `childList` or `label` mutation (R-01).
- `stacked`: whether the host's content-box inline size is below the probe's inline size, recomputed in the
  `ResizeObserver` callback (R-02).

**Rendered:**
- With no pairs: nothing.
- Otherwise:
  ```text
  <dl part="list" class="{stacked}">
    per pair: <dt part="label">{label}</dt><dd part="value"><slot/></dd>, with the slot assigned to that pair
  </dl>
  ```
  The probe is a sibling of the `<dl>`.

**Exposed:** one description list, with term and definition per pair (R-01).

**Transitions:**
- A child is added, removed or reordered: the element re-renders and re-assigns the slots.
- A `label` changes: the element re-renders.
- The host is resized across the threshold: `stacked` flips.

None of these emits an event.

## `ocelle-empty-state`

| Input | Type | Default | Rule |
|---|---|---|---|
| `variant` (attribute, reflected) | `"default" \| "panel"` | `"default"` | `panel` sets the larger padding and gaps and the lighter heading weight (R-04). Any other value acts as `default`. |
| slot `visual` | nodes | none | An icon or an `ocelle-progress`. |
| slot `heading` | nodes | none | The consumer's own heading element. Its level is the consumer's. |
| default slot | nodes | none | The body text. |
| slot `actions` | nodes | none | Buttons or links. |

**Derived values:** `has.visual`, `has.heading`, `has.text` and `has.actions`, each true when the slot has assigned
nodes that are not whitespace-only text. They are updated on `slotchange`. A part whose flag is false is `display:
none`, so it takes no gap.

**Exposed:** only the slotted content. The element has no role of its own.

## `ocelle-progress`

| Input | Type | Default | Rule |
|---|---|---|---|
| `value` (attribute `value`) | `number \| null` | `null` | `null`, an empty or whitespace attribute, or a non-finite number makes the bar indeterminate. Otherwise the value is clamped to [0, effective max]. |
| `max` (attribute `max`) | `number \| null` | `null` | The effective max is `max` when it is finite and above 0, else 100. |
| `value-text` (attribute `value-text`, property `valueText`) | `string` | `""` | Exposed as the value text, and shown with `show-label`, only while the bar is determinate. |
| `label` (attribute `label`) | `string` | `""` | The accessible name, unless the host has an `aria-label`. Shown with `show-label`. |
| `show-label` (attribute, property `showLabel`) | `boolean` | `false` | Shows the label (and the value text, when determinate and set). |
| `size` (attribute, reflected) | `"default" \| "compact"` | `"default"` | `compact` makes the bar thinner and puts the label beside it. |
| host `aria-label` (observed) | string | none | Overrides `label` for the name (Host ARIA rule). |

**Derived values:**
- `determinate = effectiveValue !== null`;
- `fraction = effectiveValue / effectiveMax`.

**Exposed through ElementInternals:**

| Property | Value |
|---|---|
| `role` | `progressbar` |
| `ariaValueMin` | `"0"` |
| `ariaValueMax` | effective max |
| `ariaValueNow` | the effective value when determinate, else `null` |
| `ariaValueText` | `value-text` when determinate and not empty, else `null` |
| `ariaLabel` | `label` when not empty, else `null` |

**States:** determinate (fill at `fraction`), indeterminate (moving mark), indeterminate under reduced motion (a still
mark at 30% to 70% of the track). Each comes in two sizes, with or without the visible label. The element emits no
event.
