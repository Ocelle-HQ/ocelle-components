# Data Model: Action Controls

**Feature**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

The elements hold no data beyond their properties. This file states each element's state, how the state is derived
from properties and moved host attributes, and the transitions the tests cover.

## Shared: the control (`src/control.ts`, internal)

| Field | Source | Rule |
|---|---|---|
| `mode` | `href` | `link` when `href.trim() !== ""`, `new URL(href, document.baseURI)` succeeds and its `protocol` is not `javascript:`; else `button`. A parse failure is caught: button mode, no error, no `href` rendered. `data:` and `vbscript:` are link mode, left to the host (R-02) |
| `moved` | host attributes listed per element | a private map attribute → string; set when the host sets the attribute (then the host attribute is removed); an empty or whitespace-only value deletes the entry; any other value is stored as written; a later `removeAttribute` on the host fires nothing and changes nothing (R-03) |
| `mirrors` | `moved` | for each entry, the host attribute `data-ocelle-moved-<attribute>` = the stored value as written; deleting an entry removes its mirror; at `connectedCallback`, a mirror whose attribute the host does not set is read back into `moved` (a host attribute present wins and rewrites the mirror); the mirrors are observed: a mirror removed or changed while `moved` holds its entry is restored from the stored value (a morphing swap removes them), the element's own writes are ignored; a mirror written while no entry is held is not read until the next upgrade (R-03, PLAN-FRESH-2-002, PLAN-FRESH-3-002) |
| `states` | `moved` (button only) | `ElementInternals.states`: `expanded` ⇔ `moved["aria-expanded"] === "true"`; `pressed` ⇔ `moved["aria-pressed"] === "true"`; `current` ⇔ `moved["aria-current"]` present and not `"false"` (R-03) |
| `references` | `moved["aria-controls" \| "aria-labelledby" \| "aria-describedby"]` | ids split on whitespace, looked up in `getRootNode()`, missing ids skipped, order kept; resolved on set and on `connectedCallback` (R-04) |
| `nameSource` | `references.labelledby`, `moved["aria-label"]`, `label`, content | first present wins: labelledby elements, then the moved `aria-label` (as written), then the trimmed non-empty `label`, else content. Content: the inner control's content, which on the button is its default slot and on the row its icon and title only (the description, tags and trailing wrappers are siblings of the inner control, plan decision 30); no internal reference. Whenever a higher source is present it replaces the lower one (`ariaLabelledByElements` set, or cleared for `aria-label` and `label`) (R-05) |
| `state` | `disabled`, `busy` (button) / `unavailable`, `busy` (row) | `disabled` → disabled; else button `busy` or row `unavailable` → unavailable; else available. Row `busy` does not change `state` |
| `ground` | `ground` attribute | absent or unknown → main (bordered variants and the default row use `control-border`); `accent-low`, `inset`, `hover-bg`, `state` → `accent-strong` (R-08); `chrome` → the chrome look of R-08 item 4a (`chrome-ink` text, `chrome-muted` border, `chrome-hover` hover, `chrome-active` active, `chrome-ink` hover border) |
| layout | host `display` | button `inline-grid`, row `grid` with `min-inline-size: min-content`; on the button the inner control is the single grid item, stretched in both axes, so its box equals the host's (R-01, PLAN-FRESH-2-001); on the row the single grid item is the shadow layout wrapper and the inner control's hit layer covers it, so the hit layer's box equals the host's (plan decision 30; § `ocelle-action-row`, Shadow structure). A page rule on the element may override `display` or size and leave host area outside the inner control; the host guard below covers it, so no guarantee depends on this row (PLAN-FRESH-3-001) |

States and what each guarantees:

| State | Tab order | AX | Inner link (link mode) | Activation |
|---|---|---|---|---|
| available | in, once | role per mode, name, description, passed states | `<a href>` with `target`, `rel`, `download` | button: one `ocelle-button-activate`, then the `click` reaches host listeners; row: one `ocelle-action-row-activate` (neither activate event on a Ctrl, Meta, Shift or Alt click in link mode) |
| unavailable | in, once | `aria-disabled="true"` (+ `aria-busy="true"` for a busy button) | `<a role="link" tabindex="0" aria-disabled="true">`, no `href` | not activated: the guard |
| disabled (button only) | out | disabled (`<button disabled>`, or the link below) | `<a role="link" aria-disabled="true">`, no `href`, no `tabindex` | not activated: native `disabled` (button mode) and the guard |

The guard (R-06): on the inner control, `click` and `auxclick` listeners that call `preventDefault()` and
`stopImmediatePropagation()` in **every state that is not available**, disabled links included. The host guard (R-01,
PLAN-FRESH-3-001): `click` and `auxclick` listeners on the host, registered in the constructor, that call the same two
methods on an event whose `composedPath()` does not contain the inner control (**in every state**) and on any event
while the state is not available. `host.click()` calls the inner control's `click()` in every state (R-06), so its
click passes through the inner control.

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
| `ground` | `ground` | `"accent-low" \| "inset" \| "hover-bg" \| "state" \| "chrome"` | `undefined` (main grounds) | yes |
| `label` | `label` | `string \| undefined` | `undefined` | no |
| `disabled` | `disabled` | `boolean` | `false` | yes |
| `busy` | `busy` | `boolean` | `false` | yes |
| `href` | `href` | `string \| undefined` | `undefined` | yes |
| `target` | `target` | `string \| undefined` | `undefined` | yes |
| `rel` | `rel` | `string \| undefined` | `undefined` | yes |
| `download` | `download` | `string \| undefined` | `undefined` | yes |

Moved host attributes (declared in the manifest with `@attr`, R-15): `aria-expanded`, `aria-controls`,
`aria-current`, `aria-haspopup`, `aria-pressed` (applied in button mode only), `aria-label`, `aria-labelledby`,
`aria-describedby`, `title`; each with its mirror `data-ocelle-moved-<attribute>` (nine, declared). Custom states:
`expanded`, `pressed`, `current`. Unknown `variant`, `size` or `ground` values render the default and are reflected
as written. `rel` in link mode: the host's value, or `noopener` when
`target="_blank"` and `rel` is absent (FR-021). `click()`: forwards to the inner control.

Look per state (outside forced colours; R-08 items 3 and 4a): idle, hover and active as R-08's tables; disabled
`disabled-bg`/`disabled-ink`; busy keeps the variant's look and shows the spinner (one 4.8 s run of six turns, then
the still arc; `animation: none` under reduced motion; R-07).

### Event `ocelle-button-activate`

`new CustomEvent("ocelle-button-activate", { bubbles: true, composed: true, cancelable: true, detail: {} })` dispatched
from the host (operator decision C1 (a), 2026-11-14; plan decision 26). Dispatched on: a `click` on the available inner
control, from the element's listener on the inner control after the guard, so before the `click` reaches any
bubble-phase listener on the host or its ancestors; in link mode only a click with no modifier key (Ctrl, Meta, Shift,
Alt); any click in button mode, which Enter, Space and `button.click()` produce; never on `auxclick`. A
`preventDefault()` by a listener → the element calls `preventDefault()` on the originating `click` (link mode: no
navigation; button mode: the `click` is still delivered, `defaultPrevented` true). Not dispatched in the disabled or
unavailable state (the guard stops the `click` first). Manifest: `CustomEvent<Record<string, never>>`.

## `ocelle-action-row`

| Property | Attribute | Type | Default | Reflected |
|---|---|---|---|---|
| `rowId` | `row-id` | `string \| undefined` | `undefined` | yes |
| `label` | `label` | `string \| undefined` | `undefined` | no |
| `layout` | `layout` | `"row" \| "card"` | `undefined` (renders `row`) | yes |
| `presentation` | `presentation` | `"default" \| "flush"` | `undefined` (renders `default`) | yes |
| `ground` | `ground` | `"accent-low" \| "inset" \| "hover-bg" \| "state" \| "chrome"` | `undefined` (main grounds) | yes |
| `href` | `href` | `string \| undefined` | `undefined` | yes |
| `target` | `target` | `string \| undefined` | `undefined` | yes |
| `rel` | `rel` | `string \| undefined` | `undefined` | yes |
| `current` | `current` | `"page" \| "true" \| undefined` | `undefined` | yes |
| `unavailable` | `unavailable` | `boolean` | `false` | yes |
| `busy` | `busy` | `boolean` | `false` | yes |

Moved host attributes (declared with `@attr`): `aria-label`, `aria-labelledby`, `aria-describedby`, `title`; each with
its mirror `data-ocelle-moved-<attribute>` (four, declared). `click()`: forwards to the inner control.

Shadow structure (plan decision 30; R-01, R-10, R-12), in an open shadow root with `delegatesFocus`:

```text
div.layout            host's single stretched grid item; position: relative; isolation: isolate;
                      flex-wrap (row) or grid (card); padding, minimum block size; .link in link mode
├─ (row layout) lead group: flex 1 1 auto, min-inline-size: min-content
│  ├─ button|a.control  part "control"; the inner control; non-positioned; draws nothing itself
│  │  ├─ span.hit       the hit layer: position: absolute; inset: 0 (against div.layout); z-index: -1;
│  │  │  │              surface, border (default row), focus ring (.control:focus-visible .hit),
│  │  │  │              hover surface and border, forced-colours border and outlines
│  │  │  └─ span.bar    the current bar, only while current is set (position: absolute, in the inline padding)
│  │  ├─ span.icon-slot  slot "icon" (hidden when empty)
│  │  └─ span[part=title]  default slot; overflow-wrap: anywhere
│  └─ span[part=description]  slot "description"; aria-hidden="true"; pointer-events: none; own ink; hidden when empty
└─ (row layout) end group: flex 0 0 auto, wraps as a whole
   ├─ span[part=tags]     slot "tags"; aria-hidden="true"; pointer-events: none; own ink; hidden when empty
   └─ span.trailing       slot "trailing"; aria-hidden="true"; pointer-events: none; own ink; hidden when empty
```

In card layout the same elements are placed by the wrapper's grid (the inner control with the trailing wrapper at the
end of the title line, then the description, then the tags); the two group elements take `display: contents` there.
The hit layer paints beneath the title and every sibling (they paint over its surface) and is the topmost hit target
at every point of `div.layout` outside the icon and the title, because the siblings take no pointer events; so every
click on the row's content box has the inner control in its composed path (US4-15). The ring's inline bands and the
bar lie in the wrapper's inline padding, which no sibling or title box enters (R-10, R-12).

Sibling ink (R-10 § Sibling ink): the description, tags and trailing wrappers inherit nothing from the inner control
and set their colour from the host's state and the mode: description and tags `color-ink-soft` (`chrome-muted` with
`ground="chrome"`), trailing as the title; `disabled-ink` with `unavailable`; under forced colours `ButtonText`
(button mode), `LinkText` (`.layout.link`) or `GrayText` (unavailable).

Name: per `nameSource`; with no host name and no `label`, the inner control's content, its icon (decorative) and its
title (so the description, the tags and the trailing content never join the name, and the control's visible text is
its name).

Description (the description and tags elements' only way to assistive technology, since their wrappers are
`aria-hidden`): `ariaDescribedByElements` of the inner control = the moved `aria-describedby` references when present;
otherwise the elements assigned to the `description` slot, then those of the `tags` slot (assigned elements, flattened;
text nodes slotted directly are wrapped by nothing and so do not count: hosts slot elements, documented), keeping only
the elements with non-whitespace text (`textContent.trim() !== ""`), and `null` when none is kept, so a moved `title`
then describes the row (FR-034, PLAN-FRESH-3-004).

Slot emptiness (FR-031): `icon` and `trailing` are empty when no element is assigned; `description` and `tags` are
empty when no assigned element has non-whitespace text. An empty slot's wrapper has `hidden` (no space, no gap).
Emptiness and the description are recomputed on `slotchange` and on a `MutationObserver` on the host (`childList`,
`characterData`, `subtree`), since text written into a slotted element fires no `slotchange` (R-04).

Drawing (R-10, R-12): inline padding `space-3` on `div.layout` in both presentations and every state (plus the
border width on a default row, whose border `span.hit` draws); title and description wrappers `overflow-wrap:
anywhere`, description and tags ink `color-ink-soft` (`chrome-muted` with `ground="chrome"`) set on their own
wrappers; surface, border and hover drawn by `span.hit`; focus ring inside the row on `span.hit`
(`outline-offset: var(--ocelle-focus-offset-inset)`), its band 2 to 5 px inside the border edge; the current bar a
shadow `<span class="bar">` inside `span.hit`, absolutely positioned in the inline padding 7 to 10 px inside the
border edge (`inset-inline-start: calc(var(--ocelle-focus-width) + 2 * var(--ocelle-focus-offset))`, less
`--ocelle-border-width` on a default row), so a gap of the row's surface separates it from the ring, `bar-width` wide,
`color-current` (`disabled-ink` when unavailable; `Highlight`/`GrayText` with `forced-color-adjust: none` under forced
colours); current surface `accent-low` (`chrome-hover` with `ground="chrome"`); flush hover under forced colours a
dashed `Highlight` outline.

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
| `color-accent-strong` | grounds += canvas, sheet, pane, panel, inspector, rail, chrome, chrome-hover | non-text, +8 |
| `color-chrome-ink` | grounds += `color-chrome-active` | text, +1 |
| `color-disabled-ink` | grounds += chrome, chrome-hover | text (exempt), +2 |
| `color-on-accent` | grounds += `color-accent-hover` | text, +1 |
| `color-hover-border` (new) | `var(--ocelle-color-ink)`, ref `color-ink` | non-text on main, state grounds, `active-bg`: +15 |
| `color-accent-hover` (new) | proposed `#D9A23F` (both themes), the primary's hover fill | ground of `on-accent` |
| `color-active-bg` (new) | proposed light `#D3CCBF`, dark `#3A342B`, the pressed surface | ground of `ink` |
| `color-chrome-active` (new) | proposed `#3A342B` (both themes), the pressed surface on chrome (R-08 item 4a) | ground of `chrome-ink` |
| `motion-spin` (new) | `800ms`, `0ms` under reduced motion (generator: every motion duration) | none |
| `motion-turn` (new) | `1turn`, unchanged under reduced motion | none |
| `focus-offset-inset` (new) | `calc(-1 * (var(--ocelle-focus-offset) + var(--ocelle-focus-width)))`, ref `focus-offset`, `focus-width` | none |
