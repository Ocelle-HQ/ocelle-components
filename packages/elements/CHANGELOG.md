# Changelog

All notable changes to `@ocelle/elements` are recorded here. The public surface is the custom-elements manifest, the
entry points and the browser build's file path (constitution VII).

## Unreleased

`ocelle-scroller`, `ocelle-workflow-board`, `ocelle-workflow-lane` and `ocelle-list-detail`, their attributes,
properties, slots and entry points, `remeasure()`, the overflow-region module convention and the container-tier
convention are additions to the public surface: a minor change.

**Hosts get two controls, `ocelle-button` and `ocelle-action-row`, in the Ocelle look (mission 012, #50; part of
#7).** Before, a host drew its own buttons and clickable rows, with no shared hover, pressed, busy or current look and
no way to put ARIA on the inner control. Now both elements wrap one native control, switch to a link with an `href`,
move host ARIA onto that control and dispatch a cancelable activate event; the elements, their properties, slots,
parts, events and entry points are additions (a minor change), and the engine floor rises to Chromium 135 and WebKit
17.4.

`ocelle-status-indicator`, its attributes `tone`, `label` and `pulse` (reflected), its parts `dot` and `ring` and its
entry point `@ocelle/elements/ocelle-status-indicator.js` are additions to the public surface: a minor change.

`ocelle-metric`, its attributes `label` and `display-value` (reflected) and `layout`, its parts `label` and `value` and
its entry point `@ocelle/elements/ocelle-metric.js` are additions to the public surface: a minor change.

`ocelle-pill-tag`, its attributes `status`, `variant` and `density`, `interactive`, `href` and `disabled` (reflected)
and `label`, its default and `icon` slots, its part `pill` and its entry point `@ocelle/elements/ocelle-pill-tag.js`
are additions to the public surface: a minor change.

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
- `ocelle-personal-rail`, the narrow dark column of personal navigation: primary items in the default slot and a
  `bottom` group, on the chrome in both themes, with a divider between the groups when both are filled; its
  properties `orientation` (reflected) and `label`: the page sets `orientation` to `vertical` (not set) or
  `horizontal`, and the rail never changes it itself; the host is a navigation landmark named by `label` or a host
  `aria-label` (011).
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
- `ocelle-status-indicator`, a status dot in the colour of its `tone` (`info`, `success`, `warning`, `danger` or
  `neutral`, the default and the fallback for an unknown value), named by `label` as one image or hidden from the
  accessibility tree without one; with `pulse` a ring around the dot grows and fades three times, 4.8 s in all, and
  then only the solid dot shows, with no animation under reduced motion; its attributes `tone`, `label` and `pulse`
  (reflected); its parts `dot` and `ring`. Entry point `@ocelle/elements/ocelle-status-indicator.js` (defines
  `ocelle-status-indicator` only). It reads the new tokens `--ocelle-size-indicator` and `--ocelle-motion-pulse` of
  `@ocelle/tokens`.
- `ocelle-metric`, a label and its value shown as one term and its definition: the label in the eyebrow style, shown
  uppercase and read as written, the value in tabular figures, stacked or with `layout="row"` on one line; its
  attributes `label` and `display-value` (reflected) and `layout`; its parts `label` and `value`. Entry point
  `@ocelle/elements/ocelle-metric.js` (defines `ocelle-metric` only). It reads 011's eyebrow tokens and adds none.
- `ocelle-pill-tag`, a state pill or a count badge with the pill radius: its text, with an optional leading icon, on
  its status's ground in the status colour, or outlined in it with `variant="badge"` and tabular figures; the compact
  density; a static pill is inert content that wraps a long text and is never shrunk below its longest word in a flex
  row. Its attributes `status`, `variant` and `density`, `interactive`, `href` and `disabled` (reflected) and `label`
  (the interactive modes are to come); its default and `icon` slots; its part `pill`. Entry point
  `@ocelle/elements/ocelle-pill-tag.js` (defines `ocelle-pill-tag` only). It reads the new token
  `--ocelle-line-height-snug` of `@ocelle/tokens`.
- The style lint's token-only rule, which checks these elements' styles, admits four values and nothing near them:
  the `grid-template-columns` tracks `fit-content(<percentage>)` and `minmax(0, <flex>)` (the facts columns and
  grid), `translateX(<percentage>)` in `transform` (the progress sweep) and a bare positive integer
  `animation-iteration-count` (the bounded sweep). No token is added.
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
- `ocelle-list-detail`, a list beside the selected record's detail with an optional inspector, in three columns, two
  with the inspector stacked, or one pane at a time below its own measured threshold or when the host sets `narrow`,
  with focus moved to the shown pane when the pane that holds it is hidden; its properties `collapse-below`,
  `inspector-below`, `narrow` (reflected) and `detail-open` (reflected), its method `remeasure()`, its `list`, default
  and `inspector` slots, and its entry point `@ocelle/elements/ocelle-list-detail.js`.
- In the README, the container-tier convention that later elements with tiers follow: the element's own measured
  size, the `*-below` grammar and its resolution, the token default and its fallback, exclusive bounds, the forcing
  boolean, no `container-type`, intrinsic sizes that do not depend on the tier, the re-measure triggers and
  `remeasure()`, and the cost of one pass.
- In the README, the overflow-region module convention: the internal module's inputs, outputs, effects, lifecycle and
  structure, which any later element with a scroll region uses; the Host ARIA rule stated per element; and the styles
  rule that allows one per-instance stylesheet of measured figures.
- Entry points: `@ocelle/elements` (the package root, defines every element), `@ocelle/elements/ocelle-icon.js`
  (defines `ocelle-icon` only), `@ocelle/elements/ocelle-brand-mark.js` (defines `ocelle-brand-mark` only),
  `@ocelle/elements/ocelle-scroller.js` (defines `ocelle-scroller` only),
  `@ocelle/elements/ocelle-workflow-board.js` (defines `ocelle-workflow-board` only),
  `@ocelle/elements/ocelle-workflow-lane.js` (defines `ocelle-workflow-lane` only),
  `@ocelle/elements/ocelle-list-detail.js` (defines `ocelle-list-detail` only),
  `@ocelle/elements/ocelle-card.js` (defines `ocelle-card` only), `@ocelle/elements/ocelle-section-header.js`
  (defines `ocelle-section-header` only), `@ocelle/elements/ocelle-page-header.js` (defines `ocelle-page-header` only),
  `@ocelle/elements/ocelle-context-sidebar.js` (defines `ocelle-context-sidebar` only),
  `@ocelle/elements/ocelle-personal-rail.js` (defines `ocelle-personal-rail` only),
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
- `ocelle-action-row`'s states and card layout (mission 012): its properties `current` and `unavailable` (reflected);
  `current` (`page` or `true`) sets `aria-current` and draws the current mark, a surface and a bar apart from the focus
  ring; `unavailable` keeps the row in the tab order with `aria-disabled` and activates nothing (an unavailable link row
  has no `href`); `layout="card"` puts the description and the tags below the title line, the tags wrapping only
  between tags. A link row dispatches its event before the navigation, a cancelled event cancels it, and a modifier or
  middle click dispatches nothing.
- `ocelle-button` sets `:state(pressed)` only in button mode: a link has no pressed state.
- The entry point `@ocelle/elements/ocelle-action-row.js` (defines `ocelle-action-row` only); the package root and the
  browser build define `ocelle-action-row` too.
- The engine floor, raised to Chromium 135 and WebKit 17.4 for ARIA element reflection and custom states (from
  Chromium 120 and WebKit 16.4).
- The slot convention's size rules now apply to the `icon` and `trailing` slots only, so an element in a control's
  other slots keeps its own box; `ocelle-icon` and `ocelle-brand-mark` render as before.
- A one-line control on the slot convention, such as `ocelle-button`, now sits on the surrounding text's baseline:
  in a labelled row the convention's label wrapper, `<span class="label">` around the default slot, takes part in
  baseline alignment, so the control's baseline is its label's first line (before, the label sat 4.6 to 6.2 px above
  the text's baseline); nothing inside the control moves. A control with no label puts the class `bare` on its row,
  which the rule skips, so an icon-only control stays where it was, its icon where a native `<button>` with an svg
  puts it.
