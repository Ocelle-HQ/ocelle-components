# Data Model: Action Controls

**Feature**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

The elements hold no data beyond their properties. This file states each element's state, how the state is derived
from properties and moved host attributes, and the transitions the tests cover.

## Shared: the control (`src/control.ts`, internal)

| Field | Source | Rule |
|---|---|---|
| `mode` | `href` | `link` when `href.trim() !== ""`, `new URL(href, document.baseURI)` succeeds and its `protocol` is not `javascript:`; else `button`. A parse failure is caught: button mode, no error, no `href` rendered. `data:` and `vbscript:` are link mode, left to the host (R-02) |
| `moved` | host attributes listed per element | a private map attribute → string; set when the host sets the attribute (then the host attribute is removed); an empty or whitespace-only value deletes the entry; any other value is stored as written; a later `removeAttribute` on the host fires nothing and changes nothing (R-03) |
| `states` | `moved` (button only) | `ElementInternals.states`: `expanded` ⇔ `moved["aria-expanded"] === "true"`; `pressed` ⇔ `moved["aria-pressed"] === "true"`; `current` ⇔ `moved["aria-current"]` present and not `"false"` (R-03) |
| `references` | `moved["aria-controls" \| "aria-labelledby" \| "aria-describedby"]` | ids split on whitespace, looked up in `getRootNode()`, missing ids skipped, order kept; resolved on set and on `connectedCallback` (R-04) |
| `nameSource` | `references.labelledby`, `moved["aria-label"]`, `label`, content | first present wins: labelledby elements, then the moved `aria-label` (as written), then the trimmed non-empty `label`, else content. Content: the button's inner control content; for the row, the inner control's `ariaLabelledByElements` = its own shadow `[part=title]` wrapper. Whenever a higher source is present, the internal reference is replaced (labelledby) or cleared (`aria-label`, `label`) (R-05) |
| `state` | `disabled`, `busy` (button) / `unavailable`, `busy` (row) | `disabled` → disabled; else button `busy` or row `unavailable` → unavailable; else available. Row `busy` does not change `state` |
| `ground` | `ground` attribute | absent or unknown → main (bordered variants and the default row use `control-border`); `accent-low`, `inset`, `hover-bg`, `state` → `accent-strong` (R-08) |

States and what each guarantees:

| State | Tab order | AX | Inner link (link mode) | Activation |
|---|---|---|---|---|
| available | in, once | role per mode, name, description, passed states | `<a href>` with `target`, `rel`, `download` | button: `click` reaches host listeners; row: one `ocelle-action-row-activate` |
| unavailable | in, once | `aria-disabled="true"` (+ `aria-busy="true"` for a busy button) | `<a role="link" tabindex="0" aria-disabled="true">`, no `href` | not activated: the guard |
| disabled (button only) | out | disabled (`<button disabled>`, or the link below) | `<a role="link" aria-disabled="true">`, no `href`, no `tabindex` | not activated: native `disabled` (button mode) and the guard |

The guard (R-06): on the inner control, `click` and `auxclick` listeners that call `preventDefault()` and
`stopImmediatePropagation()` in **every state that is not available**, disabled links included. `host.click()` calls
the inner control's `click()` in every state (R-06).

Transitions: any state → any state by property change; focus stays on the inner control across available ↔
unavailable (US3-2; in link mode the inner `<a>` stays the same element, losing and regaining `href` while keeping
`tabindex="0"`); entering disabled while focused drops focus as the platform does (a disabled control is not
focusable); the spec's edge case "busy removed while the pointer is down" follows from the guard checking the state
at `click` time.

## `ocelle-button`

| Property | Attribute | Type | Default | Reflected |
|---|---|---|---|---|
| `variant` | `variant` | `"primary" \| "secondary" \| "quiet"` | `undefined` (renders `secondary`) | yes |
| `size` | `size` | `"default" \| "compact"` | `undefined` (renders `default`) | yes |
| `flush` | `flush` | `boolean` | `false` | yes |
| `ground` | `ground` | `"accent-low" \| "inset" \| "hover-bg" \| "state"` | `undefined` (main grounds) | yes |
| `label` | `label` | `string \| undefined` | `undefined` | no |
| `disabled` | `disabled` | `boolean` | `false` | yes |
| `busy` | `busy` | `boolean` | `false` | yes |
| `href` | `href` | `string \| undefined` | `undefined` | yes |
| `target` | `target` | `string \| undefined` | `undefined` | yes |
| `rel` | `rel` | `string \| undefined` | `undefined` | yes |
| `download` | `download` | `string \| undefined` | `undefined` | yes |

Moved host attributes (declared in the manifest with `@attr`, R-15): `aria-expanded`, `aria-controls`,
`aria-current`, `aria-haspopup`, `aria-pressed` (applied in button mode only), `aria-label`, `aria-labelledby`,
`aria-describedby`. Custom states: `expanded`, `pressed`, `current`. Unknown `variant`, `size` or `ground` values
render the default and are reflected as written. `rel` in link mode: the host's value, or `noopener` when
`target="_blank"` and `rel` is absent (FR-021). `click()`: forwards to the inner control.

Look per state (outside forced colours; R-08 item 3): idle, hover and active as R-08's table; disabled
`disabled-bg`/`disabled-ink`; busy keeps the variant's look and shows the spinner (one 4.8 s run of six turns, then
the still arc; `animation: none` under reduced motion; R-07).

## `ocelle-action-row`

| Property | Attribute | Type | Default | Reflected |
|---|---|---|---|---|
| `rowId` | `row-id` | `string \| undefined` | `undefined` | yes |
| `label` | `label` | `string \| undefined` | `undefined` | no |
| `layout` | `layout` | `"row" \| "card"` | `undefined` (renders `row`) | yes |
| `presentation` | `presentation` | `"default" \| "flush"` | `undefined` (renders `default`) | yes |
| `ground` | `ground` | `"accent-low" \| "inset" \| "hover-bg" \| "state"` | `undefined` (main grounds) | yes |
| `href` | `href` | `string \| undefined` | `undefined` | yes |
| `target` | `target` | `string \| undefined` | `undefined` | yes |
| `rel` | `rel` | `string \| undefined` | `undefined` | yes |
| `current` | `current` | `"page" \| "true" \| undefined` | `undefined` | yes |
| `unavailable` | `unavailable` | `boolean` | `false` | yes |
| `busy` | `busy` | `boolean` | `false` | yes |

Moved host attributes (declared with `@attr`): `aria-label`, `aria-labelledby`, `aria-describedby`. `click()`:
forwards to the inner control.

Name: per `nameSource`; with no host name and no `label`, the title wrapper `[part=title]` (so the description and the
tags never join the name).

Description: `ariaDescribedByElements` of the inner control = the moved `aria-describedby` references when present;
otherwise the elements assigned to the `description` slot, then those of the `tags` slot (assigned elements, flattened;
text nodes slotted directly are wrapped by nothing and so do not count: hosts slot elements, documented), recomputed on
`slotchange` (FR-034).

Drawing (R-10, R-12): inline padding `space-3` (`default`) or `space-2` (`flush`) in every state; title and description
wrappers `overflow-wrap: anywhere`, description and tags ink `color-ink-soft`; the current bar a shadow
`<span class="bar">`, absolutely positioned at the inline start in the padding, `bar-width` wide,
`color-current` (`disabled-ink` when unavailable; `Highlight`/`GrayText` with `forced-color-adjust: none` under forced
colours); focus ring inside the row (`outline-offset: var(--ocelle-focus-offset-inset)`); flush hover under forced
colours a dashed `Highlight` outline.

### Event `ocelle-action-row-activate`

`new CustomEvent("ocelle-action-row-activate", { bubbles: true, composed: true, cancelable: true, detail: { rowId } })`
dispatched from the host, `rowId` = `this.rowId ?? ""` at dispatch time. Dispatched on: a `click` on the available
inner control with no modifier key (Ctrl, Meta, Shift, Alt) in link mode (any click in button mode, which Enter, Space
and `row.click()` produce); never on `auxclick`. In link mode, `preventDefault()` by a listener → the element calls
`preventDefault()` on the originating `click` (no navigation).

## Tokens added or changed (`@ocelle/tokens`)

| Token | Change | Contrast (required rows per theme) |
|---|---|---|
| `color-ink` | grounds += the five state grounds, `color-active-bg` | text, +6 |
| `color-ink-soft` | grounds += the five state grounds | text, +5 |
| `color-accent-strong` | grounds += canvas, sheet, pane, panel, inspector, rail | non-text, +6 |
| `color-on-accent` | grounds += `color-accent-hover` | text, +1 |
| `color-hover-border` (new) | `var(--ocelle-color-ink)`, ref `color-ink` | non-text on main, state grounds, `active-bg`: +15 |
| `color-accent-hover` (new) | proposed `#D9A23F` (both themes), the primary's hover fill | ground of `on-accent` |
| `color-active-bg` (new) | proposed light `#D3CCBF`, dark `#3A342B`, the pressed surface | ground of `ink` |
| `motion-spin` (new) | `800ms`, `0ms` under reduced motion (generator: every motion duration) | none |
| `motion-turn` (new) | `1turn`, unchanged under reduced motion | none |
| `focus-offset-inset` (new) | `calc(-1 * (var(--ocelle-focus-offset) + var(--ocelle-focus-width)))`, ref `focus-offset`, `focus-width` | none |
