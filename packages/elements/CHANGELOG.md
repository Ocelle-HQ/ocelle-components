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
- `ocelle-dialog`, a modal dialog on a native `<dialog>` shown in the top layer, styled from tokens, with focus moved in
  on open and returned on close, a Tab cycle, Escape and a close control that ask the host first; its properties
  `open` (reflected), `label` and `close-label`, its default and `footer` slots, its parts `panel`, `heading`, `body`,
  `footer` and `close-button`, its CSS custom property `--ocelle-dialog-inline-size`, and its events
  `ocelle-dialog-close-request` (cancelable) and `ocelle-dialog-close`. Entry point
  `@ocelle/elements/ocelle-dialog.js` (defines `ocelle-dialog` and the `ocelle-icon` it renders).
- `ocelle-drawer`, a modal side drawer on a native `<dialog>`: a full-height panel against the inline start or end
  edge of the viewport, as wide as `--ocelle-drawer-inline`, with the dialog's focus, Escape, close control and
  events, and a click on the backdrop that asks the host to close it; its properties `side`, `ground` and
  `heading-hidden` (reflected), `open` (reflected), `label` and `close-label`, its default and `footer` slots, its
  parts `panel`, `heading`, `body`, `footer` and `close-button`, and its events `ocelle-drawer-close-request`
  (cancelable, with the reason `"backdrop"` as well) and `ocelle-drawer-close`. Entry point
  `@ocelle/elements/ocelle-drawer.js` (defines `ocelle-drawer` and the `ocelle-icon` it renders).
- `ocelle-tooltip`, a tooltip that meets WCAG 1.4.13: its text in a bubble in the top layer beside its trigger, shown
  after `--ocelle-tooltip-delay` on hover and at once on keyboard focus, hoverable, kept with no timeout while hovered
  or focused, hidden by Escape, flipped and clamped to the viewport; its properties `text`, `placement`, `disabled` and
  `describes` (the last three reflected), its default and `description` slots, its part `bubble`, and no event. Entry
  point `@ocelle/elements/ocelle-tooltip.js` (defines `ocelle-tooltip` only).
- In the README, the engine floor raised to Chromium 120 and WebKit 17, for the Popover API the tooltip uses (it was
  Chromium 120 and WebKit 16.4).
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
