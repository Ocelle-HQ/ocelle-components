# Contract: the nine elements (public surface, manifest)

The manifest (`packages/elements/custom-elements.json`) must declare exactly this per element (FR-055). Events are
`CustomEvent`, `bubbles: true`, `composed: true`; only `ocelle-link-activate` is cancelable. Attributes marked
"reflected" reflect property → attribute. Every element has `:host([hidden]) { display: none; }`.

## `ocelle-listbox`

| Kind | Name | Type | Default | Notes |
|---|---|---|---|---|
| property / attribute | `value` | string | `""` | FR-010, FR-010a; not reflected (host sets read back through the property) |
| property / attribute | `label` | string | `undefined` | name; trimmed; not reflected (FR-006) |
| event | `ocelle-listbox-change` | `{ value: string }` | | user selection only |
| slot | (default) | | | `ocelle-option` children |
| part | `list` | | | the scroll container (FR-017) |

Role `listbox` (internals). Keys: ArrowUp, ArrowDown, Home, End, Enter, Space (handled); others not.

## `ocelle-option`

| Kind | Name | Type | Default |
|---|---|---|---|
| property / attribute | `value` | string (reflected) | index as string (FR-009) |
| property / attribute | `disabled` | boolean (reflected) | `false` |
| slot | (default), `icon` | | |

Role `option`; `aria-selected`, `aria-disabled` written by the parent (research R-01). Selected bar on the inline-start
edge (FR-018). Minimum block size `--ocelle-target-min` (R-10).

## `ocelle-tabs`, `ocelle-tab`, `ocelle-tab-panel`

| Element | Kind | Name | Type | Default |
|---|---|---|---|---|
| `ocelle-tabs` | property / attribute | `value` | string | first enabled tab's value |
| `ocelle-tabs` | property / attribute | `label` | string | `undefined` |
| `ocelle-tabs` | event | `ocelle-tabs-change` | `{ value: string }` | |
| `ocelle-tabs` | slots | `tab`?, default | | see below |
| `ocelle-tabs` | part | `tablist`, `panels` | | |
| `ocelle-tab` | property / attribute | `value` (reflected), `disabled` (reflected) | | FR-009 |
| `ocelle-tab` | slot | default, `icon` | | |
| `ocelle-tab-panel` | slot | default | | |

`ocelle-tabs` renders two shadow containers: `part="tablist"` with `<slot name="tab">` and `part="panels"` with the
default slot. A host writes `<ocelle-tab>` and `<ocelle-tab-panel>` children in any interleaving; the element assigns
each `ocelle-tab` to the `tab` slot through manual slot assignment (`slotAssignment: "manual"`), so the host writes no
`slot` attribute. Roles `tablist`/`tab`/`tabpanel`; `aria-selected`, `aria-controls`, `aria-labelledby`,
`aria-disabled` and generated ids on the children (R-02). Selected bar on the tab's block-end edge (FR-025). The tab
row wraps (FR-022).

## `ocelle-segmented-choice`, `ocelle-segment`

| Element | Kind | Name | Type | Default |
|---|---|---|---|---|
| `ocelle-segmented-choice` | property / attribute | `value` | string | first enabled segment's value |
| `ocelle-segmented-choice` | property / attribute | `label` | string | `undefined` |
| `ocelle-segmented-choice` | property / attribute | `joined` | boolean (reflected) | `false` |
| `ocelle-segmented-choice` | event | `ocelle-segmented-choice-change` | `{ value: string }` | |
| `ocelle-segmented-choice` | slot | default | | |
| `ocelle-segment` | property / attribute | `value` (reflected), `disabled` (reflected) | | FR-009 |
| `ocelle-segment` | slot | default, `icon` | | |

Roles `group` / `button` with `aria-pressed`. Custom states on segments for joined rows (R-06): internal, not
manifest surface.

## `ocelle-copy-field`

| Kind | Name | Type | Default |
|---|---|---|---|
| property / attribute | `value` | string | `""` |
| property / attribute | `status` | string (not reflected) | `""` |
| property / attribute | `copy-label` / `copyLabel` | string (not reflected) | `"Copy"` |
| event | `ocelle-copy-field-request` | `{ text: string }` | |
| slots | none | | |
| parts | `value`, `copy-control` | | FR-038 |

Role `group` (internals), named by a host `aria-label`. Live region role `status` in the shadow root (FR-041).

## `ocelle-link`

| Kind | Name | Type | Default |
|---|---|---|---|
| property / attribute | `href` | string (reflected) | `undefined` |
| event | `ocelle-link-activate` | `{ href: string \| null }`, cancelable | |
| slot | default | | |
| part | `anchor` | | |

Host `aria-label` forwarded to the anchor (R-08).

## Pairings: "does not" outcomes and their plants

| Outcome (spec) | Paired positive in the same test | Plant that makes it fail |
|---|---|---|
| no event on focus-only moves (US1-2, US3-2) | focus moved | selection follows focus in the listbox / segments |
| no event on host set (US1-11, US2-8, FR-002) | the set selection is exposed | dispatching change from the `value` setter |
| no event on re-select (US1-7, US2-15, US3-4) | earlier change event | change emitted without the "already selected" check |
| unhandled keys `defaultPrevented` false (US1-12, US2-14, US3-13, US4-4) | a handled key moves focus | `preventDefault()` on every keydown |
| listbox does not wrap (US1-3) | End moves to last | `wrap: true` for the listbox |
| unselected panels have no node (US2-1, FR-024) | the selected panel is exposed and named | hiding panels with `visibility` only |
| no id reference crosses a shadow root (US2-12, SC-003) | tab controls its panel | the panel id rendered inside the tabs' shadow root |
| joined: no `style` attribute (US3-10) | measured radii per row | rounding by writing `style` on segments |
| joined: shared line not widened (US3-9) | pressed bar drawn | pressed paint as a 3 px border |
| no clipboard write (US4-3, SC-006) | the request event | a `navigator.clipboard.writeText` call |
| repeated status does not mutate the region (US4-5) | first set mutates it | setting `textContent` unconditionally |
| disabled Copy control emits nothing (US4-10) | enabled control emits | ignoring `disabled` in the click handler |
| no navigation without `href` / when cancelled / disallowed protocol (US5-2, 5, 9, 11) | a later allowed link navigates | navigating on every activation; checking the written string |
| modified activation emits nothing (US5-13) | a plain click emits | emitting on every click |
