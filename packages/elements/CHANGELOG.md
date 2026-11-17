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
- `ocelle-listbox`, a single-select listbox of `ocelle-option` children with one tab stop, the keys ArrowUp,
  ArrowDown, Home, End, Enter and Space, and pointer selection; its properties `value` and `label`, its part `list`,
  and its events `ocelle-listbox-change` (a user selection) and `ocelle-listbox-activate` (Enter on the selected
  option or a double-click), each with `detail` `{ value }`.
- `ocelle-option`, an option of the listbox, with its properties `value` and `disabled` (reflected) and its `icon` slot.
- Entry points `@ocelle/elements/ocelle-listbox.js` (defines `ocelle-listbox` and `ocelle-option`) and
  `@ocelle/elements/ocelle-option.js` (defines `ocelle-option` only). A parent element's module now also defines the
  elements it owns as children.
- `ocelle-tabs`, a tablist of `ocelle-tab` children with their `ocelle-tab-panel` panels paired by order, with one
  tab stop, selection following focus on ArrowRight, ArrowLeft, Home and End (wrapping), Enter, Space and pointer
  selection, the tab-to-panel association written in the page's own scope, and the tab row wrapping onto rows; its
  properties `value` and `label` (its only name source: a host `aria-label` does not name the tablist), its parts
  `tablist` and `panels`, and its event `ocelle-tabs-change` with `detail` `{ value }`.
- `ocelle-tab`, a tab of the tabs, with its properties `value` and `disabled` (reflected) and its `icon` slot; and
  `ocelle-tab-panel`, a panel of the tabs, shown while its tab is selected.
- Entry points `@ocelle/elements/ocelle-tabs.js` (defines `ocelle-tabs`, `ocelle-tab` and `ocelle-tab-panel`),
  `@ocelle/elements/ocelle-tab.js` and `@ocelle/elements/ocelle-tab-panel.js` (each defines its element only).
- `ocelle-segmented-choice`, a toolbar of `ocelle-segment` toggle buttons with exactly one pressed, one tab stop, focus
  moving on the arrow keys (wrapping), Home and End, pressing on Enter, Space and a click, and the `joined` variant
  (reflected), whose touching segments share one line and whose rows are rounded at their ends by the element itself
  when it wraps; its properties `value`, `label` and `joined`, and its event `ocelle-segmented-choice-change` with
  `detail` `{ value }`.
- `ocelle-segment`, a segment of the segmented choice, with its properties `value` and `disabled` (reflected) and its
  `icon` slot.
- Entry points `@ocelle/elements/ocelle-segmented-choice.js` (defines `ocelle-segmented-choice` and `ocelle-segment`)
  and `@ocelle/elements/ocelle-segment.js` (defines `ocelle-segment` only).
- `ocelle-copy-field`, a command or identifier with a flush Copy control that never touches the clipboard: activating
  the control emits `ocelle-copy-field-request` with `detail` `{ text }` after the next rendering update, and the host
  reports the outcome in `status`, shown in a polite live region; its properties `value`, `status` and `copyLabel`
  (attribute `copy-label`), and its parts `value` and `copy-control`, whose box, accessible name and events stay when
  the control becomes `ocelle-button`.
- Entry point `@ocelle/elements/ocelle-copy-field.js` (defines `ocelle-copy-field` and `ocelle-icon`).
- `ocelle-link`, a link in running text, underlined in the link colour, that emits the cancelable
  `ocelle-link-activate` with `detail` `{ href }` on Enter or a plain click; without `href` it never navigates, and
  with `href`, unless the event is cancelled, it navigates only to an `href` that resolves to `http:`, `https:` or the
  document's own protocol; a modified activation is left to the browser (a new tab or window for Ctrl, Shift and a
  middle click, the platform's convention for Meta); its properties `href` (reflected) and `label` (its name instead
  of its text: a host `aria-label` does not name the link), and its part `anchor`.
- Entry point `@ocelle/elements/ocelle-link.js` (defines `ocelle-link` only).
- The engine floor is Chromium 125 and WebKit 17.4, raised from Chromium 120 and WebKit 16.4 for the custom states
  (`:state()`) of `ocelle-segment`.
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
