# Contract: `@ocelle/styles` public surface

Public surface under constitution VII: the `base.css` export, the four hook attributes and their values, and what each
family does. Added in this feature: MINOR. `@ocelle/tokens` gains five tokens: MINOR.

## Files

| Export | File | Content |
|---|---|---|
| `@ocelle/styles/base.css` | `dist/base.css` | byte-identical to `src/base.css`, written by `build()` from `buildPlan(css)` (research R-01): the rules of data-model § Rule table, no `@import`, no `url()` |
| `@ocelle/styles` | `dist/index.js` + `.d.ts` | exports nothing (unchanged from 001) |
| (documentation) | `README.md`, `CHANGELOG.md` | the host contract below; the Unreleased entry naming `base.css` and the four attributes |
| (manifest) | `package.json` `peerDependencies` | `"@ocelle/tokens": "workspace:0.0.0"`, exact: the tokens version that adds the five tokens `base.css` uses (operator decision PLAN-CORRECTNESS-1-012 (a)) |

## Host contract

Stated in `packages/styles/README.md`. Each statement below is checked by `packages/styles/test/readme.test.ts`.

- **Link order**: `<link rel="stylesheet" href="…/tokens.css">` first, then `…/base.css`, both on the document. Linked
  the other way round, the computed result is the same once both have loaded (FR-025). Linked without `tokens.css`,
  the reset and a visible focus outline still apply, but no token value does.
- **Tokens version**: `base.css` needs the `@ocelle/tokens` version that adds `line-height-compact`,
  `line-height-prose`, `font-size-subhead`, `measure-reading` and `measure-cell`; the package declares it as an exact
  peer dependency.
- **CSP**: `style-src 'self'` for both stylesheets, and `font-src 'self'` for the tokens' font. No inline style, no
  script.
- **Base layer** (no hook): the reset, the body, the root `color-scheme`, the focus ring, code elements in Schibsted
  Grotesk with tabular figures, forced colours. It adds no motion. Every base selector has specificity (0,0,0), except
  the box-sizing rule's `:where(*)::before` and `:where(*)::after` at (0,0,1), so any host rule overrides it.
- **Hooks**:

  | Attribute | Values | Effect |
  |---|---|---|
  | `data-ocelle-density` | `compact`, `regular` | `compact`: 14 px, line height 1.5 for the element and its descendants (on `<html>`: the body; the root font size never changes). `regular`: back to 16 px / 1.45. |
  | `data-ocelle-value` | (empty), `ink` | value text: 14 px Schibsted Grotesk, tabular figures, muted ink (`ink`: body ink). On the main grounds only (canvas, sheet, pane, panel, inspector, rail, inset, accent-low, hover-bg), never on the chrome, where `ink` is 1.00:1 and `ink-muted` 2.64:1 in light theme |
  | `data-ocelle-prose` | (empty) | prose rhythm for rendered Markdown inside the element (data-model § Prose). On a content container, not on `<html>`: the container rule does not match the root |
  | `data-ocelle-wrap` | `anywhere` | the identifier breaks anywhere; it sets no font property, so combine it with `data-ocelle-value` for tabular figures |

  Other values have no effect: the selectors match the documented values exactly, so `data-ocelle-prose="true"` and
  `data-ocelle-value="true"` do nothing. A bare attribute (`<div data-ocelle-prose>`) is the empty value. Hook
  selectors have specificity (0,1,0).
- **Nesting**: the nearest hook decides size and line height. On one element, prose wins over compact.
- **Markdown renderers**: emit plain elements with no class into the prose container. A table needs no wrapper. When
  it overflows, it scrolls in its own box, and it never widens a grid or flex column around the container. At 320 px
  a table of three or more columns overflows. When an overflowing table has no focusable content, it is a tab stop
  with an inset focus ring. When it has a link, Tab reaches the link and the arrow keys scroll the table. The
  caption starts at the table's start edge.
- **Browsers**: the no-wrapper keyboard model is guaranteed only in Chromium hosts (the only engine measured and
  tested). WebKit hosts (Kitty Desktop's webview on macOS and Linux) add `tabindex="0"` to tables in their renderer.
  This is an open limitation for kitty-mission-ui.
- **kitty-mission-ui stand-ins** (SC-006):

  | Stand-in | Replaced by |
  |---|---|
  | E-23 | `data-ocelle-prose` (`--ocelle-measure-reading`, `--ocelle-line-height-prose`, `--ocelle-measure-cell`) |
  | E-37 | `data-ocelle-density="compact"` and `data-ocelle-value` (`--ocelle-line-height-compact`) |
  | E-39 | `data-ocelle-wrap="anywhere"` |

## `@ocelle/tokens` additions

The five tokens of data-model § New tokens. They appear in `tokens.css`, `tokens.json`, `TokenName`/`tokenNames`,
the tokens CHANGELOG and the tokens README. The tokens README's `color-scheme` sentence names `@ocelle/styles`
`base.css` as the stylesheet that applies it.

## Not public

`src/base.css` is the source of the export, not an export itself. `scripts/build.ts`, the test fixtures and the plant
stylesheets are not exports either.
