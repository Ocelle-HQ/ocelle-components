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
