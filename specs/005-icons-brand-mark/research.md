# Research: Icons and Brand Mark (005)

Decisions behind `plan.md`. Each entry: decision, rationale, alternatives, and what was measured. Measurements were
made on 2026-11-10 in this container (Node 22.23.4, Chromium 1243 at
`/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`, the repository's pinned Vite 8.3.5, Vitest 5.0.5, Stryker
10.1.1 and Playwright 1.64.1), with probe scripts in the session scratchpad; nothing of them is committed.

## R-01 Lit version and how elements declare properties

- **Decision**: `lit` **3.3.3**, exact, as the only runtime dependency of `@ocelle/elements` (released 2026-05-14,
  past the 7-day `minimumReleaseAge`). It resolves `lit-html` 3.3.3, `lit-element` 4.2.2, `@lit/reactive-element`
  2.1.2 and `@lit-labs/ssr-dom-shim` (Node-only export condition, not bundled in the browser build; checked in the
  build test, R-05). Elements declare reactive properties with `static override properties = { … }` and `declare`
  fields, not decorators.
- **Rationale**: Lit 3 is the constitution's stack. `tsconfig.base.json` sets `erasableSyntaxOnly` and
  `verbatimModuleSyntax`; static `properties` need no decorator transform under `tsc`, the analyzer of R-06 reads
  them, and Stryker's TypeScript checker sees plain fields.
- **Alternatives**: decorators (`@property`): need `experimentalDecorators` or the standard-decorator emit, a second
  syntax for later elements, and extra analyzer configuration. Rejected.
- **Measured**: `pnpm add --save-exact lit@3.3.3` in a throwaway worktree passed the release-age policy; a static
  `properties` element built and ran in the `elements` Vitest project.

## R-02 Package layout, entry points and registration

- **Decision**:
  - `packages/elements/src/` holds one module per element, `ocelle-icon.ts` and `ocelle-brand-mark.ts`, and internal
    modules that are not entry points: `define.ts` (registration), `naming.ts` (FR-013, FR-014, FR-028, FR-034),
    `icons.ts` (the thirteen drawings, R-07), `rosette.ts` (the mark's drawing, R-09) and `icon-slot.ts` (the slot
    convention's shared styles, R-10). `index.ts` imports and re-exports both elements; `browser.ts` is the browser
    build's entry (R-05) and imports `index.ts` only.
  - Entry points (`package.json` `exports`, public surface, FR-002, FR-031): `"."` → `dist/index.js`,
    `"./ocelle-icon.js"` → `dist/ocelle-icon.js`, `"./ocelle-brand-mark.js"` → `dist/ocelle-brand-mark.js`,
    `"./browser.js"` → `dist/browser/ocelle-elements.js`, and `"./custom-elements.json"` →
    `custom-elements.json`. The package's `customElements` field names the manifest. Internal modules are not
    exported.
  - Registration: `define(tag, constructor)` in `define.ts` calls `customElements.define` only when
    `customElements.get(tag)` is undefined, and never throws for an existing name (FR-006). Each element module ends
    with one `define(...)` call; importing it defines that element and no other (FR-002, US1-17).
  - Every element class is exported (`OcelleIcon`, `OcelleBrandMark`) with an `HTMLElementTagNameMap` declaration.
- **Rationale**: one module per element keeps tree shaking and the "imports only `ocelle-icon`" scenario true; the
  `.js` suffix in export paths matches what bundlers and the browser build resolve without a map. Keeping the
  helpers internal keeps the public surface to the elements and the manifest (constitution I, VII).
- **Alternatives**: directory per element (`src/icon/index.ts`): more files and no gain at two elements; later
  missions may group when an element has several modules. Exporting `define`: makes a helper public surface.
  Rejected.

## R-03 Styles

- **Decision**: each element's styles are one `css` tagged template in its module, assigned to `static styles`, so
  Lit adopts one shared `CSSStyleSheet` per class into every instance's shadow root (FR-003, US1-14). Values come
  only from `--ocelle-*` tokens, keywords and `currentColor`; the `style-lint` gate already lints
  `packages/elements/**/*.ts` style templates through `postcss-lit`. `!important` appears only in the slot
  convention's `::slotted()` rules (R-10).
- **One `token-only` change**: the `scale` property is added to the rule's unitless properties, so the mirroring rule
  can be `scale: -1 1` (R-08). With a unit test, a pass plant (`scale: -1 1` in an element style) and a fail plant
  (`scale: 2px 1` is still raw).
- **Rationale**: adopted stylesheets are the constitution IV mechanism; `static styles` is Lit's shared form.
- **Alternatives** for mirroring: `transform: scaleX(-1)` (a raw function under `token-only`), `scale: calc(-1) 1`
  (passes the lint by an accident of the `calc()` rule; obscure), an SVG `transform` attribute chosen in `render()`
  (needs the computed direction in script, which a `dir` change on an ancestor does not re-trigger). Rejected.

## R-04 `ocelle-icon` rendering and sizing

- **Decision**: `:host { display: inline-block; inline-size: var(--ocelle-icon-size); block-size:
  var(--ocelle-icon-size); vertical-align: middle; flex: none; }`; the drawing is
  `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">` with `display: block; inline-size: 100%;
  block-size: 100%` and the default `preserveAspectRatio` (`xMidYMid meet`), which scales to the smaller side and
  centres (FR-011, US1-3). Strokes `stroke: currentColor; fill: none` set by attributes in the drawing
  (presentation attributes, not `style`), FR-012. An unknown, empty or absent `name` renders nothing (`nothing`), so the
  box stays and the shadow root holds no `svg` (FR-016). `name` matching is exact (a `Map` lookup).
- **Rationale**: inline SVG in the shadow root needs no request and no `<use href>` (FR-005, FR-010); presentation
  attributes are not `style` attributes, so the `csp` gate's `style-attribute` rule does not apply.
- **Alternatives**: `<svg><use href="#sprite">`: an `href` and an id that cannot cross the shadow root. CSS
  `mask-image: url(data:…)`: a `url()` request type under `img-src`. Rejected.

## R-05 Module build and browser build

- **Decision**:
  - Module build: `tsc -p tsconfig.json` as today, emitting `dist/*.js` and `.d.ts`; imports of `lit` stay bare
    (FR-033).
  - Browser build: `vite build -c vite.browser.config.ts` in library mode, entry `src/browser.ts`, format `es`, one
    file `dist/browser/ocelle-elements.js`, no external, minified, default export conditions (Lit's production build;
    the `development` condition is not set), `build.emptyOutDir: false`. The package `build` script runs both.
  - A build test (`packages/elements/test/node/build.test.ts`, `elements-node`) asserts: the browser build has no `import` statement and no
    dynamic `import(`; it holds no `lit-html/development` path, no `ssr-dom-shim`, and no
    `console.` call; the module build's imports are only its own relative files and `lit` or `lit/…` (US1-17,
    FR-001, FR-016).
- **Measured**: a probe element built with the repository's Vite 8.3.5 in library mode gave a 20 kB unminified ES
  module with no `import`; `gate:csp --root <probe>` and `gate:prefix --root <probe>` over it: "1 file checked, no
  finding". The only `innerHTML` in Lit's production code assigns a `<template>`'s content, which the `csp` gate does
  not flag (it flags inline script, `<style>`, `style` and `on*` attributes in literals). It wrote no console message.
- **Rationale**: one source, two outputs (spec Assumptions "Browser build"); Vite is already pinned and used by
  Storybook.
- **Alternatives**: esbuild (not a direct dependency), Rollup directly (Vite 8 already wraps Rolldown). Rejected.

## R-06 Custom-elements manifest and the `manifest` gate

- **Decision**:
  - Generator: `@custom-elements-manifest/analyzer` **0.11.0** (released 2025-11-04), exact, a dev dependency of
    `@ocelle/elements`, run with its Lit support (`--litelement`) over `src/ocelle-*.ts` by
    `packages/elements/scripts/manifest.ts`. The script then normalises the analyzer's output: it adds empty
    `slots`, `events`, `cssParts` and `cssProperties` arrays to every element declaration (FR-007 "stated as
    empty"), replaces the `IconName` type text with the union of the thirteen names read from `icons.ts` (US1-11),
    drops `attribute` entries for non-public members, sorts keys, and writes `packages/elements/custom-elements.json`
    with a trailing newline. `pnpm --filter @ocelle/elements run manifest` regenerates it.
  - Gate `manifest` (`gates/bin/manifest.ts`, `pnpm run gate:manifest`, CI check "Custom-elements manifest"): runs the
    same generation into memory from `--root`, and reports (exit 1) a `stale` finding per differing element member
    (`<element>.<kind>.<name>`) or one `stale` finding for a whole-file difference it cannot attribute, and a
    `no-description` finding per public member of the six kinds without a non-empty description (FR-009); exit 2 when
    the committed manifest is missing or is not JSON, or the source cannot be analysed.
  - Plants (`gates/plants/manifest/`): fail: `fail-stale-property` (a property added in source, manifest not
    regenerated), `fail-lost-attribute` (the `label` attribute removed from the manifest), one
    `fail-undescribed-<kind>` per kind (property, attribute, event, slot, css-part, css-property; a plant element
    declares one of each); pass: `pass-repository` (the repository as committed), `pass-reordered` (the same manifest
    with keys reordered); breaking: `break-not-json`, `break-missing`. Registered in `gates/gates.json`, the CI
    workflow and `gates/lib/registry.ts` (the FR-020 list), listed in `gates/README.md`.
- **Rationale**: the analyzer is the community generator for the manifest schema and understands Lit's static
  properties; normalising in our own script keeps the output stable and lets the gate reuse the generator, so "the
  committed manifest matches the source" is one comparison.
- **Alternatives**: our own generator on the TypeScript 6 compiler API: full control but a second analyzer to write
  and mutation-test. The analyzer's own `--dev` checks: no description rule. Rejected.
- **Risk**: the analyzer bundles TypeScript ~5.4 to parse our sources. Nothing in the element modules needs TypeScript
  6 syntax; the phase 1 spike runs it on both elements before the gate is written. Its dependencies go through the
  `pins` gate (release age, no install scripts).

## R-07 The icon set

- **Decision**: thirteen drawings in `icons.ts`, each a Lit `svg` template of `path`, `line`, `polyline`, `rect`
  or `circle` elements on a 24-unit grid, drawn for this library (operator decision, own drawings): stroke width 2,
  round caps and joins, no fill except none, inside a 2-unit margin (geometry within 2 to 22, so stroke plus caps stay
  within 1 to 23). Names and mirroring: `chevron-start`*, `chevron-end`*, `chevron-up`, `chevron-down`,
  `arrow-start`*, `arrow-end`*, `menu`, `close`, `folder`, `file`, `search`, `table`, `copy` (* mirrors in
  right-to-left). The drawings are written as data (`{ name, mirror, shapes }`) so that the drawing rules of US2-3
  (FR-010, FR-018) are checked on the data and on the rendered DOM, and `IconName` is the union type of the names.
- **Consumer mapping** (README, SC-007): chevrons — back navigation, disclosure (#13), scroller and breadcrumb
  direction; arrows — the action-row trailing arrow (#7); `menu` — the top bar's menu button (#12); `close` — dialog,
  drawer and dismiss (#16); `folder`, `file`, `table`, `search` — kitty-mission-ui's Projects screen and Artifact
  Viewer (spec-kitty-design#496 comments); `copy` — the copy field's control (#14).
- **Rationale**: one grid and one stroke keep the set visually even; data form makes the rules checkable without
  parsing templates.

## R-08 Mirroring

- **Decision**: drawings with `mirror: true` render their `svg` with a `mirror` class, and
  `:host(:dir(rtl)) .mirror { scale: -1 1; }` flips them. `:dir()` follows the computed direction from any ancestor or
  the element (spec Edge Cases). Pixel comparison (US2-4) captures each icon's box with the Vitest browser
  screenshot at 4× (80 px) under `ltr` and `rtl`; "equal" allows a per-channel difference of at most 8 of 255 per
  pixel, and "differs" requires more than 5 % of pixels to differ by more than 64.
- **Rationale**: `:dir()` reacts to direction changes without script; `scale` is a single property the lint can allow
  (R-03).

## R-09 The brand mark

- **Decision**: `rosette.ts` holds the rosette group of the reference (`sources/ocelle-docs-logo.reference.svg`) mapped
  onto a 0–100 viewBox by the reference's own transform (`translate(14 14) scale(0.72)`), recomputed into absolute
  coordinates: four open arcs (`path d="M… A…"`, stroke widths 15, 12, 16, 11 times 0.72) and one ellipse
  (`cx 51.5, cy 50.5, rx 11.5, ry 10, rotate(-18)` mapped). Two classes, `ring` and `spot`. Styles:
  default `.ring { stroke: var(--ocelle-color-ink) } .spot { fill: var(--ocelle-color-accent) }`;
  `:host([ground="chrome"]) .ring { stroke: var(--ocelle-color-chrome-ink) }`; `:host([tone="mono"]) .ring { stroke:
  currentColor } :host([tone="mono"]) .spot { fill: currentColor }` (after the chrome rule, same specificity, so mono
  wins, FR-025); `@media (forced-colors: active) { .ring { stroke: currentColor } .spot { fill: currentColor } }`
  (FR-027; spec check 2 measured that an author `fill` is not overridden in forced colours). Attribute selectors use
  the exact values `chrome` and `mono`; other values match nothing, so the default applies (US4-8). Sizing as R-04.
- **Geometry test** (US4-9): parses the reference file and `rosette.ts`'s data, fits one scale and translation from
  the ellipse centre and one arc endpoint, and compares every endpoint, radius, stroke width and the ellipse within
  0.5 % of the width.
- **Contrast pairs** (FR-026): thirteen new `non-text` rows in `packages/tokens/contrast/pairs.json`, figures
  computed by the repository's `gates/lib/wcag.ts` from the resolved token values: `color-accent` on `color-chrome`
  and `color-chrome-hover` in light and in dark (4 rows), and on the nine main grounds in dark (9 rows). Every figure
  is between 4.60 and 6.57 (spec check 1). Row counts become 160 light and 168 dark; the counts pinned in
  `gates/test/integration/token-gates.test.ts` change with them, test first. The pairing test is
  `packages/elements/test/brand-pairs.test.ts` (node), on the model of `packages/styles/test/pairs.test.ts`: it reads
  `ocelle-brand-mark.ts`'s style template as text, collects the `var(--ocelle-color-*)` tokens per variant selector,
  and checks them against FR-026's list and against the `checked` rows of `pairs.json`; its plant is a fixture copy
  of `pairs.json` with the dark `color-accent` on `color-chrome` row removed.

## R-10 The slot convention

- **Decision**: `icon-slot.ts` exports `iconSlotStyles`, a `css` template a control adds to its `static styles`, and
  documents the markup a control renders: `<span class="icon-slot"><slot name="icon"></slot></span><span
  class="label">…</span><span class="icon-slot trailing"><slot name="trailing"></slot></span>` inside an
  `inline-flex` row with `align-items: flex-start`. Rules:
  - `.icon-slot { display: inline-flex; align-items: center; flex: none; }` and
    `.icon-slot::before { content: "\200b"; }`: the zero-width space gives the wrapper the label's line-box height,
    so the icon is centred on the label's first line whether the label wraps or not, without a length literal (FR-021,
    US3-1).
  - `::slotted(*) { inline-size: var(--ocelle-icon-size) !important; block-size: var(--ocelle-icon-size) !important;
    max-inline-size: none !important; flex: none !important; color: inherit; }`: in the cascade, important
    declarations of an inner (shadow) context beat the outer page's, so neither `base.css` (`:where(svg) {
    max-inline-size: 100%; block-size: auto }`) nor a normal host rule nor `width`/`height` attributes can change the
    box (FR-022, US3-2, US3-9). `--ocelle-icon-size` set on the control or an ancestor still resizes it.
  - Gap by margin, not `gap`: `slot[name="icon"]::slotted(*) { margin-inline-end: var(--ocelle-space-2) !important }`
    and `slot[name="trailing"]::slotted(*) { margin-inline-start: var(--ocelle-space-2) !important }`; an empty slot
    has no slotted element, so no margin and a zero-width wrapper (US3-5, US3-10). Logical properties put the icon
    on the right under `dir="rtl"`.
  - Naming: the control's inner element carries its name; the README forbids `label` on slotted icons (FR-023).
- **Measured**: a probe page with `:where(svg){max-inline-size:100%;block-size:auto} svg{inline-size:32px}
  x-icon{inline-size:32px}`, a slotted `<svg viewBox="0 0 24 24" width="100" height="100">` and a slotted custom
  element, under a shadow `::slotted(*) { inline-size: var(--s) !important; block-size: var(--s) !important;
  max-inline-size: none !important }` with `--s: 20px`: both measured 20 × 20 px.
- **Test host**: `packages/elements/test/fixtures/test-host.ts`, a Lit element `ocelle-test-host` (named in the
  `ocelle-` space so the prefix gate is happy; never exported or built into a package) with a `label` property
  passed to an inner `<button>` as `aria-label` when set, rendering the markup above with `iconSlotStyles`. The
  in-process tests import it from source; the fixture suites load its bundle (R-11).
- **Alternatives**: `:has-slotted` for empty slots (Chromium 134+, not in WebKit as far as known; unmeasured here);
  `gap` with a `slotchange` handler toggling a host state (script in every control). `align-items: center` on the
  row (centres on the whole label, wrong when it wraps). Rejected.

## R-11 Test layout and the two kinds of browser tests

- **Decision**:
  - **In-process** (`packages/elements/test/*.test.ts`, the existing `elements` Vitest browser-mode project): import
    element source, adopt the token stylesheet generated by `css(source)` from `packages/tokens/src/generate.ts`
    (font faces stripped, so no font request) and, where a test says so, `packages/styles/src/base.css?raw`; read the
    accessibility tree and emulate forced colours through two Vitest browser commands defined in
    `vitest.config.ts`'s elements project, `axTree(id)` (Chromium's CDP `Accessibility.getFullAXTree` for the test
    frame, filtered to unignored nodes, returning the nodes for the element with that `id` and its shadow subtree) and
    `emulateForcedColors(mode, scheme)` (Playwright `emulateMedia`). These tests kill the mutants of the element
    source (R-12).
  - **Fixture suites** (`packages/elements/test/browser/*.test.ts`, a new `elements-browser` project, Node tests that
    drive Chromium through Playwright like `styles-browser`): a `globalSetup` builds the browser build, the test
    host bundle (Vite, entry `test/fixtures/test-host.ts`, Lit bundled) and two module-build bundles for US1-10 into a
    per-run temporary directory, and `serve.ts` serves the strict-CSP fixture pages (spec User Scenarios) with the
    header, `tokens.css` and its font from `packages/tokens/dist` (built in setup), and `base.css` from
    `packages/styles/dist` where a page says so. Each test records CSP violations (`securitypolicyviolation`
    listener in an external fixture script) and requests (Playwright `request` events) and asserts them together with
    the positive outcome (spec pairing table). These are the SC-001 and FR-033 evidence; they are not mutated.
  - The `elements` project's include gains `exclude: packages/elements/test/browser/**`; `elements-browser` is added
    to `vitest.mutation.config.ts`'s excluded set; `gates/test/vitest-config.test.ts` changes first (red).
  - Node tests that need no browser (`build.test.ts`, `manifest.test.ts`, `brand-pairs.test.ts`, `readme.test.ts`,
    `pack.test.ts`) live in a new `elements-node` project (`environment: "node"`, include
    `packages/elements/test/node/**/*.test.ts`).
- **Rationale**: in-process tests are the only ones Stryker can use (it instruments the modules the test imports);
  the built-file tests prove what ships, under the real CSP header, as 003 did.

## R-12 Mutation testing of element source

- **Decision**: the mutation gate routes changed files under `packages/elements/src/**` to a second Stryker
  configuration, `stryker.elements.config.json`, whose Vitest config `vitest.mutation.elements.config.ts` holds only
  the `elements` project; other changed files keep `stryker.config.json`. `gates/bin/mutation.ts` splits the selected
  ranges by configuration and runs one Stryker run per non-empty group, merging the classified results. Unit tests of
  the split first; a pass plant (an element-source change fully killed) is added to `gates/plants/mutation/`.
- **Measured**: a probe element with two browser-mode tests: with the repository's `stryker.config.json` (all
  in-process projects) Stryker ran 612.5 tests per mutant ("Ran all tests for this mutant") and took 87 s for 12
  mutants at concurrency 2; with a config holding only the `elements` project it ran 1.92 tests per mutant and took
  32 s, with the same kills. Per-test coverage does not reach Stryker when browser-mode and Node projects share a run,
  so every mutant falls back to the whole suite.
- **CSS and drawings in templates**: Stryker mutates the static parts of `css` and `svg` tagged templates as string
  literals where it can; survivors there are killed by computed-style and DOM assertions, or recorded as equivalent
  with a reason (constitution VIII).
- **Alternatives**: one config with `related: true` (Vitest's related-file lookup does not see browser-mode imports);
  marking element source as not mutated (constitution VIII). Rejected.

## R-13 Accessibility naming mechanism

- **Decision**: `naming.ts` exposes one function used by both elements in `updated()`: given the `label` property and
  the host's `aria-label` attribute, it computes the trimmed name (`aria-label` first, FR-034) and whether the element
  is drawable (an icon with a known name; always for the mark). It sets `ElementInternals`: when named and drawable,
  `role = "img"`, `ariaLabel = name`, `ariaHidden = null`; otherwise `role = null`, `ariaLabel = null`,
  `ariaHidden = "true"`. The inner `svg` always has `aria-hidden="true"`. The elements observe `aria-label` by adding
  it to `observedAttributes` and requesting an update, without declaring a property (FR-034: not in the manifest). A
  host `aria-hidden="true"` overrides the internals by ARIA precedence (host attributes beat `ElementInternals`
  defaults), so it hides a labelled element with no code (FR-034).
- **Rationale**: spec check 2 measured that a host with an `id` is exposed as an empty `generic` node unless the host
  itself is hidden, and that `ElementInternals.ariaHidden` removes it; internals keep the host's own attributes free
  for the host.
- **To verify in the phase 1 spike**: that Chromium trims a host `aria-label=" Close "` to "Close" in the computed
  name (if not, the element cannot change a host attribute, and the README states that hosts pass a trimmed value;
  the scenario's expectation is then a fork for the operator), and that a host `aria-label` with internals `role =
  "img"` gives one image node.

## R-14 Stories

- **Decision**: `storybook/stories/icon.stories.ts` (one story per icon in a grid, plus "Labelled" and "Unknown
  name", in light and dark by the existing theme decorator) and `storybook/stories/brand-mark.stories.ts` (main
  ground, chrome, mono, labelled). The Storybook workspace gains `@ocelle/elements: workspace:0.0.0`; stories import
  the element modules from the package source through Vite. The stories' markup strings pass the `csp` gate's
  Storybook checks (no `style` attribute).
- **Note**: #10 runs in parallel and may change `storybook/.storybook/`; this feature changes no Storybook
  configuration file, only adds stories and the dependency, to keep the merge small.

## R-15 Records: README, CHANGELOG, NOTICE, THIRD_PARTY_NOTICES, packed files

- **Decision**:
  - `packages/elements/README.md`: element conventions (R-02, R-03, R-06, R-11, R-14, the token rule of FR-007),
    builds and which host uses which (FR-033), `ocelle-icon` (attributes, tokens read, names table with consumer
    needs), slot convention (R-10), `ocelle-brand-mark` (variants, grounds, tokens read), naming and host ARIA rules
    (FR-023, FR-034), licence and trademark note (FR-029, FR-030), engines (WebKit unmeasured), two copies on a page.
  - `packages/elements/CHANGELOG.md` (new): the surface of FR-031.
  - `NOTICE` (new, repository root): the Apache-2.0 NOTICE with the trademark note.
  - `THIRD_PARTY_NOTICES`: a Lit entry (`lit` 3.3.3, `lit-html` 3.3.3, `lit-element` 4.2.2,
    `@lit/reactive-element` 2.1.2, BSD-3-Clause, copyright "Google LLC", repository, published file
    `@ocelle/elements dist/browser/ocelle-elements.js`), with the licence text beside it as
    `packages/elements/licenses/lit-BSD-3-Clause.txt` (copied unchanged from `node_modules/lit/LICENSE`).
  - Packed files: the elements build copies the root `LICENSE`, `NOTICE` and `THIRD_PARTY_NOTICES` into the package
    directory (ignored by git); `files` lists `dist`, `custom-elements.json`, `licenses`, `README.md`, `CHANGELOG.md`,
    `LICENSE`, `NOTICE`, `THIRD_PARTY_NOTICES`. `pack.test.ts` runs `pnpm pack --dry-run --json` after a build and
    asserts those paths (FR-030).
  - `readme.test.ts` checks the statements listed in the spec's documentation-test paragraph, one assertion per
    statement, on the model of 003's readme test.
