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
- `ocelle-scroller`, a horizontal strip that scrolls in the inline direction and is a tab stop, and with a `label` a
  named group, only while its content overflows, with fades on the sides with content off-screen, arrow-key scrolling
  and focus handling; its property `label` and its default slot; its entry point `@ocelle/elements/ocelle-scroller.js`.
- `ocelle-workflow-board`, a row of lanes that scrolls inside itself, and is a tab stop and, with a `label`, a named
  region, only while the lanes' minimum widths exceed its size; its property `label` and its default slot; its entry
  point `@ocelle/elements/ocelle-workflow-board.js`, which does not define the lane.
- `ocelle-workflow-lane`, a column of a board with a title and a count, exposed as one group named by them, in a
  default variant with a sheet ground or a `flat` variant; its properties `label`, `count`, `count-label` and `variant`
  (reflected) and its default slot; its entry point `@ocelle/elements/ocelle-workflow-lane.js`.
- In the README, the overflow-region module convention: the internal module's inputs, outputs, effects, lifecycle and
  structure, which any later element with a scroll region uses; the Host ARIA rule stated per element; and the styles
  rule that allows one per-instance stylesheet of measured figures.
- Entry points: `@ocelle/elements` (the package root, defines every element), `@ocelle/elements/ocelle-icon.js`
  (defines `ocelle-icon` only), `@ocelle/elements/ocelle-brand-mark.js` (defines `ocelle-brand-mark` only),
  `@ocelle/elements/ocelle-scroller.js` (defines `ocelle-scroller` only),
  `@ocelle/elements/ocelle-workflow-board.js` (defines `ocelle-workflow-board` only),
  `@ocelle/elements/ocelle-workflow-lane.js` (defines `ocelle-workflow-lane` only),
  `@ocelle/elements/browser.js` (the browser build) and `@ocelle/elements/custom-elements.json` (the manifest, also
  named by the `customElements` field).
- The browser build's file, `dist/browser/ocelle-elements.js`: Lit inside, imports nothing, for hosts without a
  bundler, which copy it out of the package and serve it by path.
- `custom-elements.json`, the generated custom-elements manifest.
- `@ocelle/tokens` as a peer dependency (`workspace:0.0.0`); the elements read its tokens.
- `lit` 3.3.3 as the runtime dependency of the module build.
- `NOTICE` in the package, with the trademark note for "Ocelle" and the rosette mark.
