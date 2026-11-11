# Phase 5 plants and gate runs (T063)

Run on 2026-11-11 in this container (Node 22.23.4, Chromium 1243 at `OCELLE_CHROMIUM_PATH`; `PLAYWRIGHT_BROWSERS_PATH`
aliased for the plant and mutation runs), one heavy job at a time. Pairing plants: the planted edit applied to the
source in the working tree, the guarding scenario run through the harness named (in process, `elements`,
`packages/elements/test/brand-mark.test.ts`; strict-CSP fixture, `elements-browser`,
`packages/elements/test/browser/brand-mark.test.ts`, whose global setup bundles the planted source into the browser
build), the file restored with `git checkout` afterwards. No pairing plant is committed. Every plant bit, on the
scenarios its spec row names, beside the paired positive outcome in the same test; no stop-and-ask was needed.

## The pairing plants of User Story 4

| Pairing row (spec table) or guard | Plant (edit) | Harness, scenarios that fail | What fails |
|---|---|---|---|
| No CSP violation and no request outside the allowed list (US4 Independent Test, SC-001, FR-005) | `<image href="planted.png">` appended to the drawing (`rosette.ts`) | fixture: SC-001, US4-9 | `violations` lists `img-src` for `planted.png` (one per mark), `outside` and `failed` list it, the console holds Chromium's CSP errors; the drawing gains the `image` parts, and US4-9's forbidden content lists the `image` element and its `href` |
| same | `style="display: block"` on the template's `svg` (`rosette.ts`) | fixture: SC-001, US4-9 | `violations` `[{ directive: "style-src-attr", blocked: "inline" }]` and one console CSP error; US4-9's forbidden attributes list `svg style` |
| No node and no name for an unlabelled mark (US4-6, FR-028) | the internals named "Ocelle" when unlabelled (`accessibleName(…) ?? "Ocelle"`) | in process: US4-6 | `plain`, `empty` and `blank` each expose `image "Ocelle"`, and the home link's name becomes `"Ocelle Ocelle"` |
| same | the drawing without `aria-hidden="true"` (`rosette.ts`) | in process: US4-6, US4-9 | unnamed `image` nodes appear for the unlabelled marks; US4-9's `svg` lacks `aria-hidden` |
| same | the host not hidden when unlabelled (`internals.ariaHidden = null` when no role) | in process: US4-6 | `plain`, `empty` and `blank` each one `generic ""` node |
| `label` is not reflected (US4-13, FR-028) | `label: { type: String, reflect: true }` | in process: US4-13 | the `label` attribute reads `"Ocelle"` instead of absent |
| Mono wins over chrome (US4-13, FR-025; not a pairing row, run as a check of the rule order) | the mono ring rule placed before the chrome ring rule | in process: US4-13 | with `ground="chrome"` and `tone="mono"` the ring is `--ocelle-color-chrome-ink` (rgb(237, 233, 225)) instead of the inherited `--ocelle-color-chrome-muted` |
| A blank host `aria-label` adds no node (US4-14, FR-034) | the element stays hidden whenever the host has an `aria-label` | in process: US4-14 | `aria-mark` has no node instead of `image "Ocelle"` |
| same | the element falls back to `label` when the host `aria-label` is blank | in process: US4-14 | `blank-labelled-mark` exposes an unnamed `image ""` |
| A labelled mark whose host has `aria-hidden="true"` contributes no node (US4-14) | the element removes the host's `aria-hidden` when labelled | in process: US4-14 | `hidden-mark` exposes `image "Ocelle"` |
| A labelled mark whose host has `hidden` has no box and no node (US4-15) | the `:host([hidden]) { display: none; }` rule removed | in process and fixture: US4-15 | the hidden mark is `inline-block` 20 × 20 px and exposes `image "Ocelle"` |
| Forced colours, every variant (US4-5, FR-027; R-09) | the pre-round-1 sheet: variant rules not wrapped in `@media not (forced-colors: active)`, the forced-colours `.ring` and `.spot` rules bare | in process and fixture: US4-5, both palettes | the chrome variant's ring keeps `--ocelle-color-chrome-ink` (rgb(237, 233, 225)) in all four contexts instead of the system colour |
| same | `fill: CanvasText` in the forced-colours `.spot` rule | in process and fixture: US4-5, both palettes | the spot is `CanvasText` in the link (rgb(255, 255, 255) for `LinkText` rgb(255, 255, 0) in dark; rgb(0, 0, 0) for rgb(0, 0, 159) in light) and in the disabled button (for `GrayText`), in all three variants |
| The mark is 20 × 20 px in a column flex container (US4-7; analysis L8) | `inline-size: auto` instead of `max-content` on `:host` | in process and fixture: US4-7 | the column case is 300 × 20 px, its drawing offset 139.13 px |
| The mark's colour pairs leave no pair unchecked (US4-4, SC-005, FR-026) | `test/node/fixtures/pairs-missing-row.json`, a copy of `pairs.json` without the dark `color-accent` on `color-chrome` row | `elements-node`: `brand-pairs.test.ts`, in the same test as the check on the real file | the check reports `color-accent on color-chrome in dark` (run in every test run; it is the test's second assertion) |

## Analysis L11: the mark half of `entry-icon.test.ts`

`entry-icon.test.ts` asserts, in one test, that importing only `src/ocelle-icon.ts` defines `ocelle-icon` and leaves
`ocelle-brand-mark` undefined. Until phase 5 the second half held only because no mark module existed; from this
phase on it guards FR-002 and US1-17. Plant: `ocelle-icon.ts` imports `ocelle-brand-mark.ts`
(`import "./ocelle-brand-mark.ts";` after its `define` import). In process (`elements`), `entry-icon.test.ts` fails:
`mark` is `[Function OcelleBrandMark]` instead of `undefined`, beside `icon` still `OcelleIcon`. The file was restored.

## The `token-only` plants of T050 (judged by `gate:plants`)

`pass-aspect-square` (`aspect-ratio: 1`) passes; `fail-aspect-ratio-other` (`aspect-ratio: 2`) and `fail-aspect-calc`
(`aspect-ratio: calc(2)`) each fail with one `ocelle/token-only` finding at `packages/elements/src/x.ts:6`, as their
`plant.json` expects.

## Gate runs

| Gate | Result |
|---|---|
| `gate:typecheck`, `gate:lint`, `gate:test-lint` | exit 0 (223 and 152 files, no finding) |
| `gate:style-lint` | exit 0, 12 files, no finding (`src/ocelle-brand-mark.ts` and `src/rosette.ts` included) |
| `gate:manifest` | exit 0, `manifest: 2 elements checked, no finding`; `pnpm --filter @ocelle/elements run manifest` then `git diff --exit-code packages/elements/custom-elements.json` clean (quickstart step 3) |
| `gate:contrast` | exit 0, `160 pairs checked in light, 168 in dark (149 required per theme)` |
| `gate:brand-rules` | exit 0, 7 rules checked |
| `pnpm -r build`, then `gate:csp` | exit 0, 34 files, no finding; `dist/` holds `index.js`, `ocelle-icon.js`, `ocelle-brand-mark.js` and `browser/ocelle-elements.js` (quickstart step 1) |
| `gate:prefix` | exit 0, 206 files, no finding |
| `gate:pins` | exit 0, 5 manifests; `@xn-sakina/rml-wasm` and `fsevents` absent from `node_modules` (quickstart step 4) |
| `gate:plants` | exit 0: 217 plants of 14 gates and the registry judged, every plant as expected (the three `aspect-ratio` plants and the regenerated manifest plants included) |
| `pnpm test` | exit 0, 2516 tests in 119 files (quickstart step 2's projects included) |
| `gate:mutation -- --base 387a92a` (first run) | exit 1: 4 survivors in `token-only.ts`'s `aspectRatioRaw()` (a redundant word-type check; no test passing a non-number part through `classify()`; the property and `inCalc` literals of that call); fixed in `65b5c76` (tests added, the check removed, the two literals recorded as equivalent, as for `scale`) |
| `gate:mutation -- --base 387a92a` (final) | exit 0: 59 mutants on the changed lines of 5 files, none survived; 3 equivalent records (`contrast.ts:116` process boundary, `token-only.ts:206`, `ocelle-brand-mark.ts:24` `label`'s options as for the icon) |

The whole mutation run took under three minutes; no shard came near 10 minutes. Quickstart step 6 (serving the fixture
by hand) was not run: the fixture suite serves the same pages under the same header in every test.
