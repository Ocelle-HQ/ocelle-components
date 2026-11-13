# Data Model: Action Controls

**Feature**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

The elements hold no data beyond their properties. This file states each element's state, how the state is derived
from properties and moved host attributes, and the transitions the tests cover.

## Shared: the control (`src/control.ts`, internal)

| Field | Source | Rule |
|---|---|---|
| `mode` | `href` | `link` when `href.trim() !== ""` and its scheme (parsed against `document.baseURI`) is not `javascript:`; else `button` (R-02) |
| `moved` | host attributes listed per element | a private map attribute → string; set when the host sets the attribute (then the host attribute is removed); an empty string deletes the entry (R-03) |
| `references` | `moved["aria-controls" \| "aria-labelledby" \| "aria-describedby"]` | ids split on whitespace, looked up in `getRootNode()`, missing ids skipped, order kept; resolved on set and on `connectedCallback` (R-04) |
| `nameSource` | `references.labelledby`, `moved["aria-label"]`, `label` | first present wins: labelledby elements, then the moved `aria-label` (not trimmed), then the trimmed non-empty `label`, else content (R-05) |
| `state` | `disabled`, `busy` (button) / `unavailable`, `busy` (row) | `disabled` → disabled; else button `busy` or row `unavailable` → unavailable; else available. Row `busy` does not change `state` |

States and what each guarantees:

| State | Tab order | AX | Activation |
|---|---|---|---|
| available | in, once | role per mode, name, description, passed states | button: `click` reaches host listeners; row: one `ocelle-action-row-activate` |
| unavailable | in, once | `aria-disabled="true"` (+ `aria-busy="true"` for a busy button) | not activated: guard calls `preventDefault()` and `stopImmediatePropagation()` on `click` and `auxclick` (R-06) |
| disabled (button only) | out | disabled (`<button disabled>`, or `<a role="link" aria-disabled="true">` without `href`) | not activated: native (button) or no target (link) |

Transitions: any state → any state by property change; focus stays on the inner control across available ↔
unavailable (US3-2); entering disabled while focused drops focus as the platform does (a disabled button is not
focusable); the spec's edge case "busy removed while the pointer is down" follows from the guard checking the state
at `click` time.

## `ocelle-button`

| Property | Attribute | Type | Default | Reflected |
|---|---|---|---|---|
| `variant` | `variant` | `"primary" \| "secondary" \| "quiet"` | `undefined` (renders `secondary`) | yes |
| `size` | `size` | `"default" \| "compact"` | `undefined` (renders `default`) | yes |
| `flush` | `flush` | `boolean` | `false` | yes |
| `label` | `label` | `string \| undefined` | `undefined` | no |
| `disabled` | `disabled` | `boolean` | `false` | yes |
| `busy` | `busy` | `boolean` | `false` | yes |
| `href` | `href` | `string \| undefined` | `undefined` | yes |
| `target` | `target` | `string \| undefined` | `undefined` | yes |
| `rel` | `rel` | `string \| undefined` | `undefined` | yes |
| `download` | `download` | `string \| undefined` | `undefined` | yes |

Moved host attributes: `aria-expanded`, `aria-controls`, `aria-current`, `aria-label`, `aria-labelledby`,
`aria-describedby`. Unknown `variant` or `size` values render the default and are reflected as written. `rel` in link
mode: the host's value, or `noopener` when `target="_blank"` and `rel` is absent (FR-021).

## `ocelle-action-row`

| Property | Attribute | Type | Default | Reflected |
|---|---|---|---|---|
| `rowId` | `row-id` | `string \| undefined` | `undefined` | yes |
| `label` | `label` | `string \| undefined` | `undefined` | no |
| `layout` | `layout` | `"row" \| "card"` | `undefined` (renders `row`) | yes |
| `presentation` | `presentation` | `"default" \| "flush"` | `undefined` (renders `default`) | yes |
| `href` | `href` | `string \| undefined` | `undefined` | yes |
| `target` | `target` | `string \| undefined` | `undefined` | yes |
| `rel` | `rel` | `string \| undefined` | `undefined` | yes |
| `current` | `current` | `"page" \| "true" \| undefined` | `undefined` | yes |
| `unavailable` | `unavailable` | `boolean` | `false` | yes |
| `busy` | `busy` | `boolean` | `false` | yes |

Moved host attributes: `aria-label`, `aria-labelledby`, `aria-describedby`.

Description: `ariaDescribedByElements` of the inner control = the moved `aria-describedby` references when present;
otherwise the elements assigned to the `description` slot, then those of the `tags` slot (assigned elements, flattened;
text nodes slotted directly are wrapped by nothing and so do not count: hosts slot elements, documented), recomputed on
`slotchange` (FR-034).

### Event `ocelle-action-row-activate`

`new CustomEvent("ocelle-action-row-activate", { bubbles: true, composed: true, cancelable: true, detail: { rowId } })`
dispatched from the host, `rowId` = `this.rowId ?? ""` at dispatch time. Dispatched on: a `click` on the available
inner control with no modifier key in link mode (any click in button mode, which Enter and Space produce); never on
`auxclick`. In link mode, `preventDefault()` by a listener → the element calls `preventDefault()` on the originating
`click` (no navigation).

## Tokens added or changed (`@ocelle/tokens`)

| Token | Change | Contrast |
|---|---|---|
| `color-ink` | grounds += the five state grounds | text, 10 new required rows |
| `color-accent-strong` | grounds += canvas, sheet, pane, panel, inspector, rail | non-text, 12 new required rows |
| `color-hover-border` (new) | `var(--ocelle-color-accent-strong)`, ref `color-accent-strong` | non-text on `hover-bg`, `accent-low`, main and state grounds |
| `motion-spin` (new) | `800ms`, `0ms` under reduced motion | none |
