# Changelog

All notable changes to `@ocelle/elements` are recorded here. The public surface is the custom-elements manifest, the
entry points and the browser build's file path (constitution VII).

## Unreleased

### Added

- `ocelle-icon`, an icon of the set drawn inline in `currentColor` at the `--ocelle-icon-size` token, decorative
  unless a `label` or a host `aria-label` names it; its properties `name` (reflected) and `label`.
- The icon set, thirteen names: `chevron-start`, `chevron-end`, `chevron-up`, `chevron-down`, `arrow-start`,
  `arrow-end`, `menu`, `close`, `folder`, `file`, `search`, `table` and `copy`; `chevron-start`, `chevron-end`,
  `arrow-start` and `arrow-end` are mirrored under right-to-left text.
- `ocelle-brand-mark`, the Ocelle rosette drawn inline from tokens at the `--ocelle-icon-size` token, for the main
  grounds, the chrome (`ground="chrome"`) or in one colour (`tone="mono"`), decorative unless a `label` or a host
  `aria-label` names it; its properties `ground` and `tone` (reflected) and `label`.
- In the README, the slot convention for icons in controls that later controls follow: the `icon` and `trailing`
  slots, their size, alignment, gap and colour rules and the naming rule.
- Entry points: `@ocelle/elements` (the package root, defines every element), `@ocelle/elements/ocelle-icon.js`
  (defines `ocelle-icon` only), `@ocelle/elements/ocelle-brand-mark.js` (defines `ocelle-brand-mark` only),
  `@ocelle/elements/browser.js` (the browser build) and `@ocelle/elements/custom-elements.json` (the manifest, also
  named by the `customElements` field).
- The browser build's file, `dist/browser/ocelle-elements.js`: Lit inside, imports nothing, for hosts without a
  bundler, which copy it out of the package and serve it by path.
- `custom-elements.json`, the generated custom-elements manifest.
- `@ocelle/tokens` as a peer dependency (`workspace:0.0.0`); the elements read its tokens.
- `lit` 3.3.3 as the runtime dependency of the module build.
- `NOTICE` in the package, with the trademark note for "Ocelle" and the rosette mark.
- `ocelle-button`, a native button in the Ocelle look (mission 012): one inner `<button type="button">` with the part
  `control`, focused by the element's `focus()` and clicked by its `click()`; its properties `variant`, `size`, `flush`
  and `ground` (reflected), `label` and `disabled` (reflected); the default slot (the label) and the `icon` slot; the
  event `ocelle-button-activate` (`CustomEvent`, bubbles, composed, cancelable, `detail` `{}`), dispatched before each
  `click`; hover and pressed looks from the new token `--ocelle-color-hover-border` and its siblings of
  `@ocelle/tokens`; not a form control.
- The entry point `@ocelle/elements/ocelle-button.js` (defines `ocelle-button` only); the package root and the browser
  build define `ocelle-button` too.
- In the README, the control conventions that later controls follow: one inner control that fills its host, the host
  guard, the disabled state, the name order and the primary action.
- `ocelle-button` link mode (mission 012): with an `href` that parses as a URL and is not a `javascript:` URL, the
  inner control is an `<a>` that looks like the button; its properties `href`, `target`, `rel` and `download`
  (reflected); `rel="noopener"` for `target="_blank"` without `rel`; a disabled link has no `href`. In link mode a
  cancelled `ocelle-button-activate` cancels the navigation, and a Ctrl, Meta, Shift or Alt click dispatches none.
- `ocelle-button` moves the host attributes `aria-expanded`, `aria-controls`, `aria-current`, `aria-haspopup`,
  `aria-pressed`, `aria-label`, `aria-labelledby`, `aria-describedby` and `title` onto its inner control, each with an
  element-owned mirror `data-ocelle-moved-<attribute>` that copies of the live DOM keep and that the element restores
  after a morph; the moved states are the custom states `:state(expanded)`, `:state(pressed)` and `:state(current)`.
- In the README, the control conventions gain link versus button, the moved host ARIA (with a recipe per stack) and
  the two surfaces of "current", and the `ocelle-button` section the markup of three consumer compositions.
- `ocelle-button`'s busy state (mission 012): its property `busy` (reflected) makes the button unavailable (in the tab
  order, `aria-disabled` and `aria-busy`, not activated; a busy link has no `href`), and shows a busy spinner in the
  icon's place that turns six times in 4.8 s and then stays still, and does not move under reduced motion; `disabled`
  wins. It reads the new tokens `--ocelle-motion-spin` and `--ocelle-motion-turn` of `@ocelle/tokens`. In the README,
  the control conventions gain the unavailable state.
- `ocelle-action-row`, an activatable row (mission 012): an inner `<button type="button">` (an `<a>` in link mode)
  named by its title and described by its `description` and `tags` slots, which are shown beside it; its properties
  `row-id`, `layout`, `presentation`, `ground`, `href`, `target`, `rel` and `busy` (reflected) and `label`; the slots
  default (the title), `icon`, `description`, `tags` and `trailing`; the parts `control`, `title`, `description` and
  `tags`; the event `ocelle-action-row-activate` (`CustomEvent`, bubbles, composed, cancelable, `detail`
  `{ rowId }`); the moved host attributes `aria-label`, `aria-labelledby`, `aria-describedby` and `title` with their
  mirrors; the focus ring drawn inside the row with the new token `--ocelle-focus-offset-inset` of `@ocelle/tokens`.
- The entry point `@ocelle/elements/ocelle-action-row.js` (defines `ocelle-action-row` only); the package root and the
  browser build define `ocelle-action-row` too.
- The engine floor, raised to Chromium 135 and WebKit 17.4 for ARIA element reflection and custom states (from
  Chromium 120 and WebKit 16.4).
- The slot convention's size rules now apply to the `icon` and `trailing` slots only, so an element in a control's
  other slots keeps its own box; `ocelle-icon` and `ocelle-brand-mark` render as before.
