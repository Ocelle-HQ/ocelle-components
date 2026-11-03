# Contract: `@ocelle/tokens` public surface

Public surface under constitution VII (token names, the stylesheet hooks below). Added in this feature: MINOR.

## Files

| Export | File | Content |
|---|---|---|
| `@ocelle/tokens/tokens.css` | `dist/tokens.css` | `@font-face` for Schibsted Grotesk; every `--ocelle-*` token; theme blocks (research R-02); reduced-motion block |
| `@ocelle/tokens/tokens.json` | `dist/tokens.json` | `{ "version": 1, "tokens": [ { "name": "--ocelle-color-canvas", "group": "colour", "light": "#F1EEE8", "dark": "#15130F" }, { "name": "--ocelle-gutter", "group": "space", "value": "1rem", "ref": "--ocelle-space-4" }, … ] }` — order as in the source; derived values resolved |
| `@ocelle/tokens` | `dist/index.js` + `.d.ts` | `export type TokenName`; `export const tokenNames: readonly TokenName[]`; `export const tokens` (the JSON data, typed); `export function cssName(name: TokenName): string` |
| `@ocelle/tokens/fonts/*` | `dist/fonts/SchibstedGrotesk-wght.woff2`, `dist/fonts/OFL.txt` | vendored font and licence |

## Host contract

- Load `tokens.css` once on the document (`<link rel="stylesheet">`). Elements read tokens by inheritance.
- Theme: system setting; light with no preference; `data-theme="light"|"dark"` on `<html>` overrides; other values
  ignored.
- CSP: the stylesheet needs `style-src 'self'`; the font needs `font-src 'self'` (or the origin that serves the
  package). Without `font-src`, text renders in the fallback families and the only violation is the font file.
- Forced colours: the tokens never override the system palette.

## Not public

`src/source.ts`, `src/generate.ts`, `contrast/pairs.json`, `fonts/SOURCE.json` are repository data, not exports.
