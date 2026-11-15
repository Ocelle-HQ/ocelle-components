# Data model: Layout and Headers (011)

No stored data. The model is each element's public interface and its internal state; the public part is the
contract in [contracts/elements-package.md](contracts/elements-package.md).

## Elements

| Element | Properties (attribute, reflected) | Slots | Internal state (not public) |
|---|---|---|---|
| `ocelle-section-header` | `size`: `"regular"` \| `"compact"`, not set; `variant`: `"default"` \| `"eyebrow"`, not set | `heading`, `eyebrow`, `description`, `actions` | empty flag per slot (R-03); resolved size, read from its own `size` and its assigned slot (R-05) |
| `ocelle-card` | `density`: `"regular"` \| `"compact"`, not set; `inset`: boolean | `header`, default (body) | empty flag per slot; the section headers it last notified (R-05) |
| `ocelle-page-header` | `size`: `"regular"` \| `"compact"`, not set | `heading`, `eyebrow`, `description`, `actions` | empty flag per slot |
| `ocelle-context-sidebar` | `label`: string, not reflected; a host `aria-label` overrides it natively | `head`, default (sections), `footer` | empty flag per slot; `ElementInternals` role `navigation` and name from `label`, held under the internal `internals` symbol key (R-11) |
| `ocelle-personal-rail` | `label`: string, not reflected; `orientation`: `"vertical"` \| `"horizontal"`, not set; a host `aria-label` overrides it natively | default (primary), `bottom` | empty flag per slot; `ElementInternals` role `navigation` and name from `label`, held under the internal `internals` symbol key (R-11) |

None emits an event, declares a CSS part or an element CSS custom property, or is focusable.

## Validation rules

- An enumerated attribute that is absent, empty or outside its list resolves to the default look and is not rewritten
  (FR-006).
- `inset` present with any value is inset.
- Section header size: valid own `size` → that; else assigned to a compact card's own `header` slot (the card's
  `density` attribute is `"compact"`) → compact; else regular (FR-017). In the
  eyebrow variant size has no effect (FR-013).
- Landmark name: host `aria-label` present → its value (blank → no name); else `label` when not blank; else no name
  (FR-028). The host is the landmark: `internals.ariaLabel` holds the `label` name and a host attribute wins over it
  natively (R-11); the element never writes the host's `aria-label`.
- Slot empty: no assigned element and every assigned text node empty or whitespace only (spec "Empty slot"); a
  `<slot>` forwarded into the slot from a shell's shadow root is an assigned element, so it is content even when
  nothing is assigned to it (R-03). A
  `hidden` sidebar section counts as content but draws no box, padding or divider of its own (FR-022); the default
  slot's head and footer dividers stay even when every section is hidden (spec Edge Cases). A `template` or `script`
  element in the sidebar's default slot is not a section and likewise counts as content but draws nothing (FR-021).

## State transitions

- Slot content added or removed, or an assigned text node's data changed → that slot's empty flag is re-read → layout
  updates (FR-005).
- Card `density` changed, or its `header` slot's assignment changed (also when the `slotchange` comes from a
  wrapper's slot forwarded into it, R-05) → the card reads its own `header` slot and asks each directly assigned
  section header, and each one that has just left the slot, to update; each re-resolves its size from its assigned slot
  (R-05). A section header that is connected or upgraded resolves its size in its own first update, so definition
  order does not matter.
- Rail `orientation` changed → layout only; DOM, focus and landmark unchanged (FR-026).

## Tokens added (`@ocelle/tokens`)

| Token | Group | Value | Contrast |
|---|---|---|---|
| `--ocelle-font-size-eyebrow` | type | `var(--ocelle-font-size-xs)` | — |
| `--ocelle-font-weight-eyebrow` | type | `var(--ocelle-font-weight-strong)` | — |
| `--ocelle-tracking-eyebrow` | type | `0.08em` | — |
| `--ocelle-color-eyebrow` | colour | `var(--ocelle-color-ink-muted)` (light and dark) | text, on the nine main grounds |
