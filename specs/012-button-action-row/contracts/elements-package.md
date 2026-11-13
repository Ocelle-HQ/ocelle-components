# Contract: `@ocelle/elements` surface added by 012

This is the public interface the manifest, the README and the CHANGELOG state. It is what #12 (breadcrumb items:
`flush`, `size="compact"`) and #14 (a flush Copy control) consume. Removing or renaming any item after 1.0.0, or
changing the event's payload, is a MAJOR change (constitution VII).

## Entry points (added)

| Specifier | File | Defines |
|---|---|---|
| `@ocelle/elements/ocelle-button.js` | `dist/ocelle-button.js` | `ocelle-button` only |
| `@ocelle/elements/ocelle-action-row.js` | `dist/ocelle-action-row.js` | `ocelle-action-row` only |

`@ocelle/elements` (root) and `@ocelle/elements/browser.js` define both new elements as well. `src/control.ts` and
`src/spinner.ts` are internal modules, not entry points.

## Control conventions (README section, binding on later controls)

1. **One inner control.** One native `<button type="button">` (button mode) or `<a>` (link mode) in an open shadow
   root with `delegatesFocus`; the host has no role and no tabindex. `element.focus()` focuses the inner control.
2. **Link versus button.** Link mode exactly when `href` is non-empty and not a `javascript:` URL.
3. **Disabled versus unavailable.** Disabled: out of the tab order, reported disabled, not activated; a disabled link
   has no target. Unavailable: in the tab order, `aria-disabled="true"`, not activated, keeps name and description.
   "Not activated": no navigation (any click, any modifier, middle click, Enter), no `ocelle-*` event, no `click`
   reaching a bubble-phase listener on the element or its ancestors; capture-phase listeners and the browser's context
   menu are outside it.
4. **Host ARIA is moved.** The ARIA attributes an element lists are moved from the host onto the inner control:
   `getAttribute` on the host returns `null` afterwards; set an empty value or `"false"` to clear; `removeAttribute`
   changes nothing. ID references (`aria-controls`, `aria-labelledby`, `aria-describedby`) are resolved in the host's
   own tree (its document or the shadow root it is in) when set and when the element is connected; an element added
   later with the same id is picked up only when the attribute is set again.
5. **Name order.** `aria-labelledby`, then `aria-label`, then `label`, then content; slotted icons never name.
6. **"Current".** On a button, `aria-current` is passed through with no visual mark; on a row, the `current`
   property draws the mark and sets `aria-current`.
7. **Primary action.** A primary action uses `size="default"` (44 × 44 px minimum); `variant="primary"` is a look,
   not the constitution's "primary action".

## `ocelle-button`

```html
<ocelle-button>Save</ocelle-button>
<ocelle-button variant="primary"><ocelle-icon slot="icon" name="folder"></ocelle-icon>Open project</ocelle-button>
<ocelle-button variant="quiet" size="compact" label="Close"><ocelle-icon slot="icon" name="close"></ocelle-icon></ocelle-button>
<ocelle-button flush size="compact" href="/projects">Projects</ocelle-button>
<ocelle-button busy>Saving</ocelle-button>
<ocelle-button aria-expanded="false" aria-controls="filters">Filters</ocelle-button>
```

| Kind | Name | Type / values | Default | Notes |
|---|---|---|---|---|
| property, attribute (reflected) | `variant` | `primary` \| `secondary` \| `quiet` | `secondary` rendered | unknown → `secondary` |
| property, attribute (reflected) | `size` | `default` \| `compact` | `default` rendered | default ≥ 44 × 44 px; compact ≥ 24 × 24 px, compact text |
| property, attribute (reflected) | `flush` | boolean | `false` | no inline padding, no border, no fill; ink label |
| property, attribute | `label` | string | — | accessible name, trimmed; not reflected |
| property, attribute (reflected) | `disabled` | boolean | `false` | wins over `busy` |
| property, attribute (reflected) | `busy` | boolean | `false` | unavailable + `aria-busy`; spinner |
| property, attribute (reflected) | `href` | string | — | link mode |
| property, attribute (reflected) | `target`, `rel`, `download` | string | — | link mode only; `_blank` without `rel` → `noopener` |
| moved host attribute | `aria-expanded`, `aria-controls`, `aria-current`, `aria-label`, `aria-labelledby`, `aria-describedby` | | | see convention 4 |
| slot | (default) | | | the label |
| slot | `icon` | | | one icon before the label (mission 005 slot convention); hidden while busy |
| event | `click` (native) | `MouseEvent` | | target is the host; not delivered when not activated |
| CSS part | `control` | | | the inner `<button>` or `<a>` |
| CSS custom properties | none | | | reads tokens only (README lists them) |

Not a form control: never submits or resets a form; a host submits with `form.requestSubmit()` in its click handler.

## `ocelle-action-row`

```html
<ocelle-action-row row-id="m-42">
  <ocelle-icon slot="icon" name="folder"></ocelle-icon>
  Mission 42
  <span slot="description">Due Friday</span>
  <span slot="tags">Blocked</span><span slot="tags">Design</span>
  <ocelle-icon slot="trailing" name="arrow-end"></ocelle-icon>
</ocelle-action-row>
<ocelle-action-row href="/missions/42" current="page" presentation="flush">Mission 42</ocelle-action-row>
```

| Kind | Name | Type / values | Default | Notes |
|---|---|---|---|---|
| property `rowId`, attribute `row-id` (reflected) | | string | — | the event's `detail.rowId` (`""` when absent) |
| property, attribute | `label` | string | — | accessible name, trimmed; not reflected |
| property, attribute (reflected) | `layout` | `row` \| `card` | `row` rendered | |
| property, attribute (reflected) | `presentation` | `default` \| `flush` | `default` rendered | |
| property, attribute (reflected) | `href`, `target`, `rel` | string | — | link mode; `noopener` rule |
| property, attribute (reflected) | `current` | `page` \| `true` | — | `aria-current` + the current mark; other values = absent |
| property, attribute (reflected) | `unavailable` | boolean | `false` | unavailable state |
| property, attribute (reflected) | `busy` | boolean | `false` | `aria-busy="true"`; activation still works |
| moved host attribute | `aria-label`, `aria-labelledby`, `aria-describedby` | | | convention 4; `aria-describedby` replaces the slots' description |
| slot | (default) | | | the title (accessible name) |
| slot | `icon`, `trailing` | | | mission 005 slot convention |
| slot | `description`, `tags` | | | elements; their text is the accessible description, description first |
| event | `ocelle-action-row-activate` | `CustomEvent<{ rowId: string }>`, bubbles, composed, cancelable | | not on modifier or middle clicks of a link row; `preventDefault()` cancels a link row's navigation |
| CSS parts | `control`, `title`, `description`, `tags` | | | |
| CSS custom properties | none | | | reads tokens only, including the new `--ocelle-color-hover-border` |

## Tokens (`@ocelle/tokens`, added)

`--ocelle-color-hover-border` (the border of a hovered control; overriding it on an ancestor changes the row's and the
primary button's hover border) and `--ocelle-motion-spin` (the busy spinner's turn; `0ms` under reduced motion).
`color-ink` and `color-accent-strong` gain declared grounds (no value change).

## Engine floor

Chromium 135+ (element reflection for `ariaControlsElements`, `ariaLabelledByElements`, `ariaDescribedByElements`),
raised from 120 in the README's engines section; WebKit unmeasured for this feature.
