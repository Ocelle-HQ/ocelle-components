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
- `ocelle-facts`, a label and value sheet exposed as one description list of its `ocelle-fact` children, two columns
  or stacked by its own inline size against the hook `--ocelle-facts-stack-below`; its properties `density` and
  `layout` (reflected), `layout="columns"`, `layout="stacked"` and `layout="grid"` (cells, label above value, in four,
  two or one columns); its parts `list`, `label` and `value`; the value hooks `--ocelle-facts-value-size` and
  `--ocelle-facts-value-line-height`.
- `ocelle-fact`, one pair: its properties `label` and `wrap` (reflected, `wrap="anywhere"` for identifiers); outside a
  sheet it shows its label above its value. Importing `@ocelle/elements/ocelle-facts.js` also defines it.
- Entry points `@ocelle/elements/ocelle-facts.js` (defines `ocelle-facts` and `ocelle-fact`) and
  `@ocelle/elements/ocelle-fact.js` (defines `ocelle-fact` only).
- `ocelle-empty-state`, an empty or loading panel: the consumer's own heading, body and actions in one centred
  column, with no heading level, role or tab stop of its own; its property `variant` (reflected), `variant="panel"`
  with the larger rhythm and the lighter heading; its slots `visual`, the `eyebrow` slot (a short upper-case line
  above the heading), `heading`, the default slot (the body, its margins reset and its children spaced) and
  `actions`; its part `body`. Entry point `@ocelle/elements/ocelle-empty-state.js` (defines `ocelle-empty-state`
  only).
- `ocelle-progress`, a progress bar, determinate with a `value` or indeterminate without one, exposed as one
  progressbar named by `label` (or a host `aria-label`) with its value, minimum and maximum; the indeterminate mark
  sweeps once per loading episode for less than 5 s and then rests as a still mark, and shows the still mark at once
  under reduced motion; its properties `value`, `max`, `value-text`, `label`, `show-label` (the label row, with the
  value text at its inline end), `size` (reflected, `size="compact"`) and `ground` (reflected, `ground="tinted"` for
  tinted grounds); its parts `track`, `fill`, `label` and `value-text`. Entry point
  `@ocelle/elements/ocelle-progress.js` (defines `ocelle-progress` only).
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
