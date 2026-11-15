# @ocelle/tokens

The design tokens of the Ocelle component library: every `--ocelle-*` custom property for the light and dark
themes, as an external stylesheet (`@ocelle/tokens/tokens.css`), a JSON export for tools
(`@ocelle/tokens/tokens.json`) and typed token names (`@ocelle/tokens`: `TokenName`, `tokenNames`, `tokens`,
`cssName()`). The values come from issue #5 (spec `specs/002-design-tokens/spec.md`, Appendix A).

## Host contract

### Loading

Load `tokens.css` once on the document, with `<link rel="stylesheet" href=".../tokens.css">`. Elements read the
tokens by inheritance: custom properties cross shadow roots, so no element adopts the stylesheet itself.

### Theme

The theme follows the system setting (`prefers-color-scheme`), and is light when the system states no preference.
`data-theme="light"` or `data-theme="dark"` on `<html>` overrides the system setting. Any other value, or the
attribute on another element, has no effect. Changing or removing the attribute at run time takes effect at once.

### `color-scheme`

The stylesheet sets no `color-scheme` property. `--ocelle-color-scheme` is `light` or `dark` with the theme;
`@ocelle/styles` `base.css` applies it with `color-scheme: var(--ocelle-color-scheme)` on the root, so native
controls, scrollbars and system colours follow the token theme. A host without the base styles may do the same. The token is
in the colour group of the JSON export, but its value is that keyword, not a colour.

### Content Security Policy

The stylesheet is a same-origin file with no inline style or script: it needs `style-src 'self'` (or the origin that
serves the package). It declares the brand font, Schibsted Grotesk, with `@font-face` from the vendored file
`fonts/SchibstedGrotesk-wght.woff2` beside it, by a relative URL: the font needs `font-src 'self'` (or the origin that
serves the package), the one addition to the strict policy `default-src 'none'; script-src 'self'; style-src 'self'`.
Nothing loads from a CDN or a font service. Without `font-src`, text renders in the fallback families of
`--ocelle-font-sans` and the only violation is the font file; every token keeps its value.

### Font

`fonts/SchibstedGrotesk-wght.woff2` is the variable Schibsted Grotesk (weights 400 to 900) from
[schibsted/schibsted-grotesk](https://github.com/schibsted/schibsted-grotesk), unmodified, under the SIL Open Font
License 1.1, whose text is `fonts/OFL.txt` beside it. `--ocelle-font-sans` and `--ocelle-font-display` name it first;
`--ocelle-figures` gives the tabular figures that ids, digests and values use.

### Tokens for the base styles

Some tokens exist for the base styles of `@ocelle/styles` (`base.css`, mission 003). In the type group,
`--ocelle-line-height-compact` (1.5) is the line height of its compact scale (`data-ocelle-density="compact"`), with
`--ocelle-font-size-sm`; `--ocelle-line-height-prose` (1.65) is the line height of its prose running text
(`data-ocelle-prose`), and `--ocelle-font-size-subhead` (`1.125rem`, 18 px) the size of a prose `h2`. In the shell
group, `--ocelle-measure-reading` (`68ch`) holds prose paragraphs, list items and block quotes to a reading measure,
`--ocelle-measure-cell` (`12ch`) is the floor of a prose table cell, and `--ocelle-measure-container` (`100cqi`) is
the inline size of the nearest query container: a prose table is one, so it caps the table's caption at the table's
visible width. Without a query container, `100cqi` falls back to the small viewport's inline size.

### Tokens for the controls

Some colour tokens exist for the controls of `@ocelle/elements` (`ocelle-button`, mission 012): their hover and
pressed states. `--ocelle-color-hover-border` is the border of a hovered or pressed bordered control:
`--ocelle-color-ink` unless a host overrides it on an ancestor. `--ocelle-color-accent-hover` is the hover fill of a
primary control, with `--ocelle-color-on-accent` text on it. `--ocelle-color-active-bg` is the pressed surface of a
secondary, quiet or flush control on the main and state grounds. `--ocelle-color-chrome-active` is the pressed surface
of a control on the chrome grounds, with `--ocelle-color-chrome-ink` text on it. The contrast check covers each with
the grounds it is used on, and `color-accent-strong`, the primary control's border, on every main, state and chrome
ground.

Two motion tokens exist for the busy spinner of `ocelle-button`. `--ocelle-motion-spin` is the duration of one turn of
a busy spinner, `800ms`. `--ocelle-motion-turn` is the angle of one turn, `1turn`; it is not a duration and reduced
motion does not change it.

### Reduced motion

Under `prefers-reduced-motion: reduce` every motion duration (`--ocelle-motion-fast`, `--ocelle-motion-base`,
`--ocelle-motion-spin`) is `0ms`: the stylesheet's reduced-motion block sets each motion token whose value is a
duration, and nothing else. `--ocelle-easing-standard` and `--ocelle-motion-turn` keep their values. The brand-rules
check fails a stylesheet whose block misses a motion duration or sets anything else.

### Forced colours

The tokens never override the system palette in forced colours: the stylesheet has no `forced-color-adjust: none`,
and a colour token may only be mapped to a system colour there. `box-shadow` is not drawn in forced colours, so the
rings and shadows of the `elevation-*` tokens vanish there; an element that uses one to mark a state (a selected row,
a pressed segment) or a boundary (a sheet edge) must also draw a border or outline.

## Brand rules for rendered elements

Some brand rules hold only in how elements use the tokens; the element issues and the Storybook checks (#10) test
them:

- The top bar, the icon rail and the personal rail use the chrome tokens in both themes (`color-chrome`,
  `color-chrome-hover`, `color-chrome-ink`, `color-chrome-muted`).
- No monospace anywhere: ids, digests, values and code use `--ocelle-font-sans` with `--ocelle-figures`. Digests are
  shown in groups of four.
- Links use `color-link`; ochre text (`color-accent`) is never placed on the bone ground (`color-canvas`).
- `color-rule` and `color-rule-strong` are decorative only and never mark a control boundary; controls use
  `color-control-border`.
- In light mode the ochre fill is never the only mark of a state on a light ground: pair it with
  `color-accent-strong` or with text.
- A control drawn on `color-accent-low`, `color-inset`, `color-hover-bg`, `color-danger-bg`, `color-warning-bg`,
  `color-success-bg`, `color-info-bg` or `color-neutral-bg` is bordered with `color-accent-strong`, since
  `color-control-border` does not reach 3:1 on all of them.
- One general radius, `radius-2`; `radius-row` for rows and cards, `radius-1` for small marks, `radius-shell` for the
  outer app shell only and `radius-pill` for state pills only.
