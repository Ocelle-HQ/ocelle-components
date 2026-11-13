# Data model: Layout and Headers (011)

No stored data. The model is each element's public interface and its internal state; the public part is the
contract in [contracts/elements-package.md](contracts/elements-package.md).

## Elements

| Element | Properties (attribute, reflected) | Slots | Internal state (not public) |
|---|---|---|---|
| `ocelle-section-header` | `size`: `"regular"` \| `"compact"`, not set; `variant`: `"default"` \| `"eyebrow"`, not set | `heading`, `eyebrow`, `description`, `actions` | empty flag per slot (R-03); card-compact flag set by a card (R-05); resolved size |
| `ocelle-card` | `density`: `"regular"` \| `"compact"`, not set; `inset`: boolean | `header`, default (body) | empty flag per slot; the section headers it last flagged compact |
| `ocelle-page-header` | `size`: `"regular"` \| `"compact"`, not set | `heading`, `eyebrow`, `description`, `actions` | empty flag per slot |
| `ocelle-context-sidebar` | `label`: string, not reflected; observes host `aria-label` | `head`, default (sections), `footer` | empty flag per slot; resolved landmark name |
| `ocelle-personal-rail` | `label`: string, not reflected; `orientation`: `"vertical"` \| `"horizontal"`, not set; observes host `aria-label` | default (primary), `bottom` | empty flag per slot; resolved landmark name |

None emits an event, declares a CSS part or an element CSS custom property, or is focusable.

## Validation rules

- An enumerated attribute that is absent, empty or outside its list resolves to the default look and is not rewritten
  (FR-006).
- `inset` present with any value is inset.
- Section header size: valid own `size` → that; else card-compact flag → compact; else regular (FR-017). In the
  eyebrow variant size has no effect (FR-013).
- Landmark name: host `aria-label` present → its value (blank → no name); else `label` when not blank; else no name
  (FR-028).
- Slot empty: no assigned element and every assigned text node empty or whitespace only (spec "Empty slot").

## State transitions

- Slot content added or removed, or an assigned text node's data changed → that slot's empty flag is re-read → layout
  updates (FR-005).
- Card `density` changed, or its `header` slot's assignment changed → the card sets or clears the flag on each
  directly assigned section header (R-05).
- Rail `orientation` changed → layout only; DOM, focus and landmark unchanged (FR-026).

## Tokens added (`@ocelle/tokens`)

| Token | Group | Value | Contrast |
|---|---|---|---|
| `--ocelle-font-size-eyebrow` | type | `var(--ocelle-font-size-xs)` | — |
| `--ocelle-font-weight-eyebrow` | type | `var(--ocelle-font-weight-strong)` | — |
| `--ocelle-tracking-eyebrow` | type | `0.08em` | — |
| `--ocelle-color-eyebrow` | colour | `var(--ocelle-color-ink-muted)` (light and dark) | text, on the nine main grounds |
