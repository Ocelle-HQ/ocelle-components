# Contract: `@ocelle/elements` surface added by 012

This is the public interface the manifest, the README and the CHANGELOG state. It is what #12 (breadcrumb items:
`flush`, `size="compact"`, link mode, `aria-current`; its menu button: `aria-haspopup`, `aria-expanded`) and #14 (a
flush Copy control) consume. Removing or renaming any item after 1.0.0, or
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
   root with `delegatesFocus`; the host has no role and no tabindex. `element.focus()` focuses the inner control, and
   `element.click()` clicks it (so it is guarded like any other click); a synthetic `dispatchEvent` of a click on the
   host is outside the guarantees.
2. **Link versus button.** Link mode exactly when `href` is non-empty after trimming, parses as a URL and is not a
   `javascript:` URL (by the URL parser, so `JAVASCRIPT:` and `java\tscript:` count); an unparseable `href` is button
   mode, with no error. `data:` and `vbscript:` URLs are left to the host.
3. **Disabled versus unavailable.** Disabled: out of the tab order, reported disabled, not activated; a disabled link
   has no `href`. Unavailable: in the tab order, `aria-disabled="true"`, not activated, keeps name and description; an
   unavailable link has no `href` either (`<a role="link" tabindex="0" aria-disabled="true">`), so the context menu,
   drag and the status bar offer no URL. "Not activated": no navigation (any click, any modifier, middle click, Enter),
   no `ocelle-*` event, no `click` reaching a bubble-phase listener on the element or its ancestors; capture-phase
   listeners are outside it.
4. **Host ARIA is moved.** The ARIA attributes an element lists are moved from the host onto the inner control:
   `getAttribute` on the host returns `null` afterwards. To clear, set an empty (or whitespace-only) value, or the
   ARIA off value (`"false"`); `removeAttribute` (and a framework binding that becomes `undefined`, `null` or
   `nothing`) changes nothing, so bind the off value (README recipes for React, Lit, Svelte, htmx and Thymeleaf). A
   moved `aria-label` that is empty or whitespace-only clears it and the name falls back to `label`, then content
   (mission 005's elements keep their own rule). ID references (`aria-controls`, `aria-labelledby`,
   `aria-describedby`) are resolved in the host's own tree (its document or the shadow root it is in) when set and
   when the element is connected; an element added later with the same id is picked up only when the attribute is set
   again. Since host attribute selectors no longer match, moved states are exposed as custom states
   (`:state(expanded)`, `:state(pressed)`, `:state(current)` on the button). Any other `aria-*` on the host is
   unsupported: it stays on the host and axe flags it; adding one to an element's list is a MINOR change.
5. **Name order.** `aria-labelledby`, then `aria-label`, then `label`, then content; slotted icons never name. A
   control whose inner control holds content that is not its name names itself from its name part (the row: its
   title). When content is visible, `label` and a host `aria-label` contain the visible text, ideally at its start
   (WCAG 2.5.3).
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
<ocelle-button aria-haspopup="menu" aria-expanded="false">Account</ocelle-button>
<ocelle-button variant="quiet" ground="inset">Retry</ocelle-button>
```

| Kind | Name | Type / values | Default | Notes |
|---|---|---|---|---|
| property, attribute (reflected) | `variant` | `primary` \| `secondary` \| `quiet` | `secondary` rendered | unknown → `secondary` |
| property, attribute (reflected) | `size` | `default` \| `compact` | `default` rendered | default ≥ 44 × 44 px; compact ≥ 24 × 24 px, compact text |
| property, attribute (reflected) | `flush` | boolean | `false` | no inline padding, no border, no fill; ink label; content at the inline start |
| property, attribute (reflected) | `ground` | `accent-low` \| `inset` \| `hover-bg` \| `state` | — (main grounds) | the ground the button sits on; selects the `accent-strong` border (#5 rule 1); unknown → main |
| property, attribute | `label` | string | — | accessible name, trimmed; not reflected |
| property, attribute (reflected) | `disabled` | boolean | `false` | wins over `busy` |
| property, attribute (reflected) | `busy` | boolean | `false` | unavailable + `aria-busy`; spinner |
| property, attribute (reflected) | `href` | string | — | link mode |
| property, attribute (reflected) | `target`, `rel`, `download` | string | — | link mode only; `_blank` without `rel` → `noopener` |
| moved host attribute | `aria-expanded`, `aria-controls`, `aria-current`, `aria-haspopup`, `aria-pressed`, `aria-label`, `aria-labelledby`, `aria-describedby` | | | see convention 4; declared in the manifest with descriptions; `aria-pressed` in button mode only |
| custom state | `expanded`, `pressed`, `current` | | | moved `aria-expanded="true"`, `aria-pressed="true"`, `aria-current` other than `"false"` |
| method | `click()` | | | clicks the inner control |
| slot | (default) | | | the label |
| slot | `icon` | | | one icon before the label (mission 005 slot convention); hidden while busy (the spinner runs six turns in 4.8 s, then stays still) |
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
| property, attribute (reflected) | `ground` | `accent-low` \| `inset` \| `hover-bg` \| `state` | — (main grounds) | as on the button, for the default row's border |
| property, attribute (reflected) | `href`, `target`, `rel` | string | — | link mode; `noopener` rule |
| property, attribute (reflected) | `current` | `page` \| `true` | — | `aria-current` + the current mark; other values = absent |
| property, attribute (reflected) | `unavailable` | boolean | `false` | unavailable state (a link row loses its `href`) |
| property, attribute (reflected) | `busy` | boolean | `false` | `aria-busy="true"`; activation still works |
| moved host attribute | `aria-label`, `aria-labelledby`, `aria-describedby` | | | convention 4; `aria-describedby` replaces the slots' description; declared in the manifest |
| method | `click()` | | | clicks the inner control (an available row dispatches its event) |
| slot | (default) | | | the title, the accessible name (the description and tags never join it) |
| slot | `icon`, `trailing` | | | mission 005 slot convention |
| slot | `description`, `tags` | | | elements; their text is the accessible description, description first |
| event | `ocelle-action-row-activate` | `CustomEvent<{ rowId: string }>`, bubbles, composed, cancelable | | not on modifier or middle clicks of a link row; `preventDefault()` cancels a link row's navigation |
| CSS parts | `control`, `title`, `description`, `tags` | | | the title and description wrap anywhere; the focus ring is drawn inside the row |
| CSS custom properties | none | | | reads tokens only, including the new `--ocelle-color-hover-border` |

## Tokens (`@ocelle/tokens`, added)

`--ocelle-color-hover-border` (the border of a hovered or pressed control, an alias of `color-ink`; overriding it on an
ancestor changes every hovered border of both elements), `--ocelle-color-accent-hover` (the primary button's hover
fill), `--ocelle-color-active-bg` (the pressed surface of `secondary`, `quiet` and `flush`), `--ocelle-motion-spin`
(the duration of one spinner turn; `0ms` under reduced motion), `--ocelle-motion-turn` (one turn, `1turn`, the
spinner's angle) and `--ocelle-focus-offset-inset` (the negative offset that draws a focus ring inside a box).
`color-ink`, `color-ink-soft`, `color-accent-strong` and `color-on-accent` gain declared grounds (no value change).

## Engine floor

Chromium 135+ and WebKit 17.4+, raised from Chromium 120 and WebKit 16.4 in the README's engines section: element
reflection for `ariaControlsElements`, `ariaLabelledByElements`, `ariaDescribedByElements` (Chromium 135, WebKit
16.4) and custom states, `ElementInternals.states` and `:state()` (Chromium 125, WebKit 17.4), per MDN
browser-compat-data 8.1.9. WebKit behaviour stays unmeasured (open limitation).
