# @ocelle/styles

The base styles of the Ocelle component library: one external stylesheet, `base.css`, that gives a host page a
consistent base from the design tokens of `@ocelle/tokens`. Every value in it is an `--ocelle-*` token, it has no
class and no utility, and it adds no motion.

## Use

### Link order

Link `tokens.css` first, then `base.css`, both on the document: `<link rel="stylesheet" href="…/tokens.css">` and
then `<link rel="stylesheet" href="…/base.css">`. Linked the other way round, the computed result is the same once
both have loaded. Linked without `tokens.css`, the reset and a visible focus outline still apply, but no token value
does.

### Tokens version

`base.css` needs the `@ocelle/tokens` version that adds `line-height-compact`, `line-height-prose`,
`font-size-subhead`, `measure-reading`, `measure-cell` and `measure-container`. The package declares it as an exact
peer dependency, `"@ocelle/tokens": "workspace:0.0.0"`. Both packages stay at 0.0.0 until the first release (#11),
so the pin becomes meaningful at that release.

### Content Security Policy

`base.css` is a same-origin file with no `@import` and no `url()`. The host needs `style-src 'self'` for both
stylesheets, and `font-src 'self'` for the tokens' font. No inline style and no script. `base.css` needs no
`img-src`; a host page that shows its own images adds `img-src 'self'`.

## Base layer

The base layer applies with no hook: the reset, the body, the root `color-scheme`, the focus ring, code elements in
Schibsted Grotesk with tabular figures, and forced colours. It adds no motion.

- **Reset**: `box-sizing: border-box` on every element and its `::before` and `::after`; no body margin; `img`,
  `picture`, `video`, `canvas` and `svg` no wider than their container, keeping their aspect ratio; `button`,
  `input`, `select` and `textarea` inherit the font. It keeps list semantics, focus outlines and control borders.
- **Body**: `--ocelle-font-sans` at `--ocelle-font-size-md` and `--ocelle-line-height-normal`, in
  `--ocelle-color-ink` on `--ocelle-color-canvas`.
- **Root**: `color-scheme: var(--ocelle-color-scheme)`, so native controls and scroll bars follow the theme.
- **Focus ring**: every element that matches `:focus-visible` gets an outline of `--ocelle-focus-width` solid
  `--ocelle-color-focus` at `--ocelle-focus-offset`, written as longhands so the outline stays solid without the
  tokens. In forced colours it is `Highlight`, also inside a host region that sets `forced-color-adjust: none`.
- **Code**: `code`, `pre`, `kbd` and `samp`, anywhere on the page, use `--ocelle-font-sans` with
  `font-variant-numeric: var(--ocelle-figures)`; there is no monospace. Only the family and the figures are set.

Tokens it uses: `--ocelle-color-scheme`, `--ocelle-font-sans`, `--ocelle-font-size-md`,
`--ocelle-line-height-normal`, `--ocelle-color-ink`, `--ocelle-color-canvas`, `--ocelle-figures`,
`--ocelle-focus-width`, `--ocelle-color-focus` and `--ocelle-focus-offset`.

### Specificity

Every base selector has specificity (0,0,0), except the box-sizing rule's `:where(*)::before` and `:where(*)::after`
at (0,0,1), so any rule of the host page's own stylesheets overrides it. For example, a host rule
`code { font-variant-numeric: normal; }` linked after `base.css` wins.

### Custom-element hosts

The base layer does not reach into shadow roots, but it styles each element's host, which is in the light DOM: the
`box-sizing` reset on every host, and the focus ring on a host that is itself focusable. For normal declarations the
page's rules beat a shadow tree's `:host` rules whatever their specificity, so an element's own stylesheet cannot
override them. Elements put their focusable part inside the shadow root or use `delegatesFocus`, and do not depend
on their host's `box-sizing`. The Storybook preview links `base.css` for every story, so element stories always
render with it.

## Hooks

Each hook is one `data-ocelle-` attribute and applies only with one of its documented values. Any other value of a
hook attribute, `"true"` among them, has no effect: the selectors match the documented values exactly. Hook selectors
have specificity (0,1,0), one attribute with the rest in `:where()`, so a host rule of the same or higher specificity
overrides them too.

| Attribute | Values | Family |
|---|---|---|
| `data-ocelle-density` | `compact`, `regular` | compact scale |
| `data-ocelle-value` | (empty), `ink` | compact scale |
| `data-ocelle-prose` | (empty) | prose |
| `data-ocelle-wrap` | `anywhere` | identifier wrap |

## Compact scale

For dense operational screens: lists, facts, ids and timestamps.

- `data-ocelle-density` takes `compact` or `regular`. `data-ocelle-density="compact"` sets the compact scale on the
  element, and its descendants inherit it: `--ocelle-font-size-sm` (14 px) with `--ocelle-line-height-compact`
  (1.5). Only the element and its descendants change.
- On `<html>` the hook sets the compact scale on the body instead, so the root font size never changes and every
  `rem` token keeps its value (`--ocelle-target-min` stays 44 px). The focus ring is unchanged.
- `data-ocelle-density="regular"` returns a region nested in a compact one to the regular scale:
  `--ocelle-font-size-md` (16 px) with `--ocelle-line-height-normal` (1.45).
- `data-ocelle-value` takes the empty value (a bare attribute has it) or `ink`. `data-ocelle-value=""` sets the value
  text style: `--ocelle-font-sans` at `--ocelle-font-size-sm` with `font-variant-numeric: var(--ocelle-figures)`, in
  `--ocelle-color-ink-muted`. `data-ocelle-value="ink"` sets the same style in `--ocelle-color-ink`. It is 14 px
  inside and outside a compact region, and never monospace.
- The value hook is for the main grounds only (canvas, sheet, pane, panel, inspector, rail, inset, accent-low,
  hover-bg), not the chrome (the top bar, the icon rail and the personal rail), where light `ink` is 1.00:1 and
  `ink-muted` 2.64:1. `ink` and `ink-muted` are contrast-checked on the main grounds only.

Tokens the compact scale uses: `--ocelle-font-size-sm`, `--ocelle-line-height-compact`, `--ocelle-font-size-md`,
`--ocelle-line-height-normal`, `--ocelle-font-sans`, `--ocelle-figures`, `--ocelle-color-ink-muted` and
`--ocelle-color-ink`.

## Prose

For a host's Markdown renderer: it emits plain HTML, with no class, into a content container marked
`data-ocelle-prose`, and the document reads at the rhythm of the Kitty Desktop prototype.

- `data-ocelle-prose` takes the empty value only (a bare attribute has it). The container is set at
  `--ocelle-font-size-md` (16 px) with `--ocelle-line-height-prose` (1.65), which every element in it except the
  headings inherits.
- The prose family styles a rendered Markdown document by element, with no class: `h1` to `h6`, `p`, `ul`, `ol`,
  `li`, `blockquote`, `code`, `pre`, `hr`, links (an `a` with an `href`), `table`, `caption`, `th` and `td`. It sets
  no rule of its own for `img`, `strong`, `em`, `del` or a task list's checkbox: they inherit the prose size and line
  height and keep the base layer's rules. An `<a id>` target with no `href` is not a link and keeps the running
  text's colour.
- **Headings**: `--ocelle-line-height-tight`, with `--ocelle-space-6` above and `--ocelle-space-3` below. `h1` is
  `--ocelle-font-size-2xl` (30 px) at `--ocelle-font-weight-display`; `h2` is `--ocelle-font-size-subhead` (18 px),
  `h3` `--ocelle-font-size-fact` (17 px) and `h4` to `h6` `--ocelle-font-size-md` (16 px), all at
  `--ocelle-font-weight-strong`.
- **Running text**: `p`, `ul`, `ol`, `blockquote`, `pre`, `table` and `hr` have `--ocelle-space-4` below them.
  Paragraphs, list items and block quotes keep to `--ocelle-measure-reading` (68ch); code blocks and tables use the
  container's full width. Lists, nested lists included, are indented by `--ocelle-space-6` at their inline start. A
  block quote has a `--ocelle-bar-width` bar in `--ocelle-color-rule-strong` and `--ocelle-space-4` of padding at its
  inline start, in `--ocelle-color-ink-soft`. A rule (`hr`) is a `--ocelle-border-width` line in
  `--ocelle-color-rule`. Every inline-direction margin, padding and border is a logical property, so the family
  mirrors under `dir="rtl"`.
- **Links**: `--ocelle-color-link`, `--ocelle-color-link-hover` on hover, underlined in every state, so a link never
  differs from the running text by colour alone. A long bare URL wraps anywhere.
- **Code**: inline `code` sits on `--ocelle-color-inset` with `--ocelle-space-1` of inline padding and
  `--ocelle-radius-2`, and wraps anywhere, so a long path never widens the page. A code block (`pre`) sits on
  `--ocelle-color-inset` with `--ocelle-space-3` of padding and `--ocelle-radius-2`, and wraps its long lines inside
  its own width (`white-space: pre-wrap`, `overflow-wrap: anywhere`): it does not scroll, and its copied text keeps
  its line breaks and indentation. Both keep the base layer's Schibsted Grotesk with tabular figures.
- **Tables**: a `table` is its own scroll box, with no wrapper element: it scrolls sideways when it is wider than the
  container, and the page does not. Each cell is at least `--ocelle-measure-cell` (12ch) wide, with
  `--ocelle-space-2` and `--ocelle-space-3` of padding and a `--ocelle-border-width` rule below in
  `--ocelle-color-rule` (`--ocelle-color-rule-strong` under the header cells). Header cells are
  `--ocelle-font-size-xs` (12 px) at `--ocelle-font-weight-strong`, with tabular figures. The caption is capped at
  the table's visible width (`--ocelle-measure-container`), wraps there, starts at its start edge and stays in view
  while the table scrolls. The table keeps its table semantics: role `table` with its rows, column headers and
  cells, named by its caption. An overflowing table with no focusable content is a tab stop that scrolls with the
  arrow keys and shows the focus ring inset (at minus `--ocelle-focus-width`), so all four sides show when it is
  flush with the viewport; in an overflowing table with a link, Tab reaches the link, and the arrow keys scroll the
  table while it has focus. A table that fits is not a tab stop.

Tokens the prose family uses: `--ocelle-font-size-md`, `--ocelle-line-height-prose`, `--ocelle-line-height-tight`,
`--ocelle-space-6`, `--ocelle-space-3`, `--ocelle-font-size-2xl`, `--ocelle-font-weight-display`,
`--ocelle-font-size-subhead`, `--ocelle-font-weight-strong`, `--ocelle-font-size-fact`, `--ocelle-space-4`,
`--ocelle-measure-reading`, `--ocelle-bar-width`, `--ocelle-color-rule-strong`, `--ocelle-color-ink-soft`,
`--ocelle-border-width`, `--ocelle-color-rule`, `--ocelle-color-link`, `--ocelle-color-link-hover`,
`--ocelle-color-inset`, `--ocelle-space-1`, `--ocelle-radius-2`, `--ocelle-focus-width`,
`--ocelle-measure-container`, `--ocelle-measure-cell`, `--ocelle-space-2`, `--ocelle-font-size-xs` and
`--ocelle-figures`. Every colour pairing it creates is a checked contrast pair of `@ocelle/tokens` in both themes.

### Prose and the compact scale

When the compact and prose hooks are nested, the nearest hook decides the size and line height of the text inside
it: a prose container inside a compact region is 16 px with a line height of 1.65, and a compact region inside a
prose container keeps the compact scale (14 px, 1.5), table cells and code included; prose headings keep their
sizes, and every other prose rule still applies there. On an element that carries both the prose hook and the
compact hook, the prose hook wins: the element is a prose container at 16 px with a line height of 1.65.

### Where the prose hook goes

The prose hook goes on a content container, not on `<html>`: on `<html>` its container rule does not apply, so it
sets neither the root font size nor the root line height.

A prose container must not be sized from its content (shrink-to-fit or fit-content sizing); it gets its width from
its context: block flow, a stretched grid or flex item such as `1fr` or `flex: 1`, or a definite width. A prose table
is contained in the inline axis, so it adds nothing to the intrinsic width of the boxes around it and never widens a
grid or flex column. In a box sized from its content, a table that would fit is cut down, scrolls and becomes a tab
stop. Examples of such boxes, not a complete list: a modal or non-modal `<dialog>`, a popover, a fixed or absolutely
positioned panel without both inline insets or a width (a side drawer), an `inline-block`, a float, a
`display: table-cell` box, a default item of a row flex container, and a grid or flex item aligned to start. Give
such a box a definite width or stretch it.

### For Markdown renderers

- Tables of three or more columns overflow at 320 px, so they scroll and, with no focusable content, are tab stops.
- The keyboard model of prose tables is guaranteed only in Chromium hosts. WebKit hosts (Kitty Desktop on macOS and
  Linux) add `tabindex="0"` to tables in their renderer; this is an open limitation for kitty-mission-ui.
- Print is out of scope: prose tables are screen scroll boxes, so a printed document shows only the columns that fit
  the page, and a host that prints adds its own print rule.

## Identifier wrap

For machine identifiers in dense layouts: mission slugs, ids and paths in list rows, headers and fact values.

- `data-ocelle-wrap` takes `anywhere` only. `data-ocelle-wrap="anywhere"` sets `overflow-wrap: anywhere` on the
  element, so a machine identifier (a mission slug, an id, a path) breaks anywhere when it would overflow: it never
  widens its grid column or row, never overflows at 200% zoom, and is never cut by an ellipsis. Selecting and copying
  it gives the full, unchanged identifier.
- It sets no `word-break`, no `hyphens: auto`, no `text-overflow: ellipsis` and no `white-space: nowrap`.
- It works in any container, inside prose and compact regions included, and keeps the size and line height of the
  text around it.
- It sets no font property, so an identifier that needs tabular figures combines it with `data-ocelle-value`:
  `<span data-ocelle-wrap="anywhere" data-ocelle-value="">…</span>`.

The identifier-wrap family uses no token: `overflow-wrap: anywhere` is a keyword.

## Replacing kitty-mission-ui's stand-ins

kitty-mission-ui's local stand-ins for these families are replaced by the hooks and tokens below; each stand-in is
removed when the screen adopts its hook.

| Stand-in | Replaced by |
|---|---|
| E-23 | `data-ocelle-prose` (`--ocelle-measure-reading`, `--ocelle-line-height-prose`, `--ocelle-measure-cell`) |
| E-37 | `data-ocelle-density="compact"` and `data-ocelle-value` (`--ocelle-line-height-compact`) |
| E-39 | `data-ocelle-wrap="anywhere"` |
