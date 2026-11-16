# Phase 4 engine floor check (T057)

The README's floor (`packages/elements/README.md` § Engines): Chromium 120+ and WebKit 16.4+. The features phase 4
adds, each compared with that floor (plan decision 2; analysis G8). Form association and `ElementInternals` are
phase 3's (`reviews/phase-3/engine-floor.md`); the select reuses them through `src/form-control.ts`.

| Feature | Where | Chromium | WebKit | Against the floor |
|---|---|---|---|---|
| `appearance: none` (unprefixed) | `src/ocelle-form-select.ts`, the native select | 84 | 15.4 | below |
| Logical properties `inset-block`, `inset-inline-end` | the indicator's position at the inline end | 87 | 14.1 | below |
| Logical properties `margin-block`, `padding-inline-end` | the indicator's vertical centring; the select's room for it | 87 | 14.1 | below |
| `MutationObserver` with `childList`, `subtree`, `characterData`, `attributes` and `attributeFilter` | the option observer | 26 | 7 | below |
| `Element.replaceChildren()` | the options mirrored into the native select | 86 | 14 | below |
| `Array.prototype.findLastIndex()` | the default selection (the last option marked `selected`) | 97 | 15.4 | below |
| `HTMLOptionElement.defaultSelected`, `:disabled` on options and option groups | the default selection and the first enabled option | 1 | 3 | below |
| Inline `svg` in `currentColor` in a shadow root | the indicator (`src/icon-svg.ts`, moved from `src/ocelle-icon.ts`) | as `ocelle-icon` (005) | as `ocelle-icon` (005) | unchanged |

Sources: MDN browser-compat-data (`css.properties.appearance`, `css.properties.inset-block`,
`css.properties.inset-inline-end`, `css.properties.margin-block`, `css.properties.padding-inline-end`,
`api.MutationObserver`, `api.MutationObserver.observe`, `api.Element.replaceChildren`,
`javascript.builtins.Array.findLastIndex`, `api.HTMLOptionElement.defaultSelected`, `css.selectors.disabled`), not
re-measured here. The build does not lower `findLastIndex()` (the module build is `tsc` with target `es2024`, the
browser build Vite's default), so it is a run-time feature of the elements and is listed. Only Chromium is measured
(README § Engines); the suites ran on Chromium 153 (build 1243).

No feature is newer than the floor, so the floor is unchanged and no operator stop is needed.

Rechecked at `e0b1c77`, after the element suites: the indicator box's class that follows the disabled state (`5908fa7`,
the Chromium accessibility-tree workaround of US2-11) uses Lit's `classMap`, which the input already uses, and adds no
platform feature.
