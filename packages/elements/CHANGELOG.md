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
- The slot convention's size rules now apply to the `icon` and `trailing` slots only, so an element in a control's
  other slots keeps its own box; `ocelle-icon` and `ocelle-brand-mark` render as before.
