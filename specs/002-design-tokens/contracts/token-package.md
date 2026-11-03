# Contract: `@ocelle/tokens` public surface

Public surface under constitution VII (token names, the stylesheet hooks below, the JSON shape). Added in this
feature: MINOR.

## Files

| Export | File | Content |
|---|---|---|
| `@ocelle/tokens/tokens.css` | `dist/tokens.css` | `@font-face` for Schibsted Grotesk; every `--ocelle-*` token; theme blocks (research R-02); reduced-motion block |
| `@ocelle/tokens/tokens.json` | `dist/tokens.json` | `{ "version": 1, "tokens": [ { "name": "--ocelle-color-canvas", "group": "colour", "light": "#F1EEE8", "dark": "#15130F" }, { "name": "--ocelle-gutter", "group": "space", "value": "1rem", "ref": ["--ocelle-space-4"] }, { "name": "--ocelle-elevation-raised", "group": "elevation", "light": "0 2px 4px rgb(21 19 15 / 0.10), 0 12px 32px rgb(21 19 15 / 0.16)", "dark": "0 0 0 1px #4D463A", "ref": { "light": [], "dark": ["--ocelle-color-rule-strong"] } }, … ] }` — order as in the source; values resolved; `ref` uses full names, in the shape of the value (data-model § JSON export) |
| `@ocelle/tokens` | `dist/index.js` + `.d.ts` | `export type TokenName`; `export const tokenNames: readonly TokenName[]`; `export const tokens` (the JSON data, typed); `export function cssName(name: TokenName): string` |
| `@ocelle/tokens/fonts/*` | `dist/fonts/SchibstedGrotesk-wght.woff2`, `dist/fonts/OFL.txt` | vendored font and licence |
| (package documentation) | `README.md` | the host contract below and the rendered brand rules (spec Assumptions); in the published `files` |

## Host contract

Stated in `packages/tokens/README.md` (a test checks that it states the CSP allowance of FR-012):

- Load `tokens.css` once on the document (`<link rel="stylesheet">`). Elements read tokens by inheritance.
- Theme: system setting; light with no preference; `data-theme="light"|"dark"` on `<html>` overrides; other values
  ignored.
- `color-scheme`: the stylesheet does not set it. `--ocelle-color-scheme` is `light` or `dark` with the theme; base
  styles (#6) apply it with `color-scheme: var(--ocelle-color-scheme)` on the root, and a host without #6 may do the
  same. It is in the colour group of the JSON export but its value is that keyword, not a colour.
- CSP: the stylesheet needs `style-src 'self'`; the font needs `font-src 'self'` (or the origin that serves the
  package). Without `font-src`, text renders in the fallback families and the only violation is the font file.
- Forced colours: the tokens never override the system palette (a colour token may only be mapped to a system
  colour). `box-shadow` is not drawn in forced colours, so the rings and shadows of the `elevation-*` tokens vanish
  there; an element that uses one to mark a state (selected row, pressed segment) or a boundary (sheet edge) must also
  draw a border or outline.
- Rendered brand rules: chrome tokens on the top bar and rails, digests in groups of four, ochre fill never the only
  mark of state in light mode, controls on `color-accent-low`, `color-inset`, `color-hover-bg` and every state `-bg`
  (`color-danger-bg`, `color-warning-bg`, `color-success-bg`, `color-info-bg`, `color-neutral-bg`) bordered with
  `color-accent-strong`.

## Not public

`src/source.ts`, `src/overrides.ts` (empty, data-model § Token overrides), `src/generate.ts`, `scripts/build.ts`,
`contrast/pairs.json`, `fonts/SOURCE.json` are repository data, not exports.
