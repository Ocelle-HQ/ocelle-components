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
- `ocelle-section-header`, a heading the page slots (`heading`) with an `eyebrow` above it, a `description` under it
  and `actions` at its inline end, each empty slot taking no space; its properties `size` and `variant` (reflected):
  a compact size, and an eyebrow variant that draws the heading as a small upper-case label (011).
- `ocelle-card`, a `header` slot above the body, bordered on the sheet ground; its properties `density` and `inset`
  (reflected): a compact density with smaller padding and gap that draws a slotted section header compact, and the
  inset ground for a nested card (011).
- `ocelle-page-header`, a screen's title band: a heading the page slots (`heading`, usually the screen's `h1`) with an
  `eyebrow` above it, a `description` under it and `actions` at its inline end, ruled off below, each empty slot
  taking no space; its property `size` (reflected): a compact size with a 24 px display title (011).
- `ocelle-context-sidebar`, the column beside a screen's content: a `head`, sections in the default slot and a
  `footer` kept at the block end, ruled off from each other on the rail ground, each empty part taking no space; the
  host is a navigation landmark named by its property `label` or a host `aria-label` (011).
- In the README, the slot convention for icons in controls that later controls follow: the `icon` and `trailing`
  slots, their size, alignment, gap and colour rules and the naming rule.
- Entry points: `@ocelle/elements` (the package root, defines every element), `@ocelle/elements/ocelle-icon.js`
  (defines `ocelle-icon` only), `@ocelle/elements/ocelle-brand-mark.js` (defines `ocelle-brand-mark` only),
  `@ocelle/elements/ocelle-card.js` (defines `ocelle-card` only), `@ocelle/elements/ocelle-section-header.js`
  (defines `ocelle-section-header` only), `@ocelle/elements/ocelle-page-header.js` (defines `ocelle-page-header` only),
  `@ocelle/elements/ocelle-context-sidebar.js` (defines `ocelle-context-sidebar` only),
  `@ocelle/elements/browser.js` (the browser build) and `@ocelle/elements/custom-elements.json` (the manifest, also
  named by the `customElements` field).
- The browser build's file, `dist/browser/ocelle-elements.js`: Lit inside, imports nothing, for hosts without a
  bundler, which copy it out of the package and serve it by path.
- `custom-elements.json`, the generated custom-elements manifest.
- `@ocelle/tokens` as a peer dependency (`workspace:0.0.0`); the elements read its tokens.
- `lit` 3.3.3 as the runtime dependency of the module build.
- `NOTICE` in the package, with the trademark note for "Ocelle" and the rosette mark.
- The section header's eyebrow reads the eyebrow tokens of `@ocelle/tokens`: `--ocelle-font-size-eyebrow`,
  `--ocelle-font-weight-eyebrow`, `--ocelle-tracking-eyebrow` and `--ocelle-color-eyebrow` (011).
- In the README's element conventions, the Styles rule for forced colours: variant rules that set colours or grounds go
  inside `@media not (forced-colors: active)`, and layout-only variant rules stay outside it, so a layout variant keeps
  its layout in forced colours (a documentation change; 011).
