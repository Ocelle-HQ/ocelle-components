# Contract: `@ocelle/styles` public surface

Public surface under constitution VII: the `base.css` export, the four hook attributes and their values, and what each
family does. Added in this feature: MINOR. `@ocelle/tokens` gains five tokens: MINOR.

## Files

| Export | File | Content |
|---|---|---|
| `@ocelle/styles/base.css` | `dist/base.css` | byte-identical copy of `src/base.css` (research R-01): the rules of data-model § Rule table, no `@import`, no `url()` |
| `@ocelle/styles` | `dist/index.js` + `.d.ts` | exports nothing (unchanged from 001) |
| (documentation) | `README.md`, `CHANGELOG.md` | the host contract below; the Unreleased entry naming `base.css` and the four attributes |

## Host contract

Stated in `packages/styles/README.md`. Each statement below is checked by `packages/styles/test/readme.test.ts`.

- **Link order**: `<link rel="stylesheet" href="…/tokens.css">` first, then `…/base.css`, both on the document. Linked
  the other way round, the computed result is the same once both have loaded (FR-025). Linked without `tokens.css`,
  the reset and a visible focus outline still apply, but no token value does.
- **CSP**: `style-src 'self'` for both stylesheets, and `font-src 'self'` for the tokens' font. No inline style, no
  script.
- **Base layer** (no hook): the reset, the body, the root `color-scheme`, the focus ring, code elements in Schibsted
  Grotesk with tabular figures, forced colours. It adds no motion. Every base selector has specificity (0,0,0), so
  any host rule overrides it.
- **Hooks**:

  | Attribute | Values | Effect |
  |---|---|---|
  | `data-ocelle-density` | `compact`, `regular` | `compact`: 14 px, line height 1.5 for the element and its descendants (on `<html>`: the body; the root font size never changes). `regular`: back to 16 px / 1.45. |
  | `data-ocelle-value` | (empty), `ink` | value text: 14 px Schibsted Grotesk, tabular figures, muted ink (`ink`: body ink) |
  | `data-ocelle-prose` | (empty) | prose rhythm for rendered Markdown inside the element (data-model § Prose) |
  | `data-ocelle-wrap` | `anywhere` | the identifier breaks anywhere; it sets no font property, so combine it with `data-ocelle-value` for tabular figures |

  Other values have no effect. Hook selectors have specificity (0,1,0).
- **Nesting**: the nearest hook decides size and line height. On one element, prose wins over compact.
- **Markdown renderers**: emit plain elements with no class into the prose container. A table needs no wrapper. When
  it overflows, it scrolls in its own box. When it has no focusable content, it is a tab stop. When it has a link,
  Tab reaches the link and the arrow keys scroll the table.
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
