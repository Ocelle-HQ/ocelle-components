# Research: Icons and Brand Mark (005)

Decisions behind `plan.md`. Each entry: decision, rationale, alternatives, and what was measured. Measurements were
made on 2026-11-10 in this container (Node 22.23.4, Chromium 1243 at
`/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`, the repository's pinned Vite 8.3.5, Vitest 5.0.5, Stryker
10.1.1 and Playwright 1.64.1), with probe scripts in the session scratchpad; nothing of them is committed. Plan squad round 1
(`reviews/plan/round-1/refute.md`) re-measured several of them and the operator decided its forks; the entries below
carry those results and decisions, each marked with the finding it answers.

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
  - The browser build's file path in the tarball, `dist/browser/ocelle-elements.js`, is public surface as well as
    its specifier: a host without a bundler (the Ocelle console) copies that file out of the package and serves it by
    path, never resolving the specifier, so renaming the file is a breaking change (PLAN-FRESH-1-008). The README
    gives the path to copy; the CHANGELOG names it (FR-031). The file name stays `ocelle-elements.js` because
    `dist/browser.js` is the module build's output of `src/browser.ts`.
  - Registration: `define(tag, constructor)` in `define.ts` calls `customElements.define` only when
    `customElements.get(tag)` is undefined, and never throws for an existing name (FR-006). Each element module ends
    with one `define(...)` call; importing it defines that element and no other (FR-002, US1-17).
  - Every element class is exported (`OcelleIcon`, `OcelleBrandMark`) with an `HTMLElementTagNameMap` declaration,
    and carries the JSDoc tag `@tagname <tag>`; every public property carries a description and `@default undefined`
    (PLAN-CORRECTNESS-1-005). The analyzer does not see the tag through the `define` helper (measured: no `tagName`
    in its output), so the JSDoc tag is how the manifest gets it; the README's conventions require both tags, and
    `test/node/manifest.test.ts` asserts the generated manifest's `tagName` against the tag each module defines.
  - Tests of registration, in-process (`elements` project, PLAN-TESTABILITY-1-004, 1-008): `define.test.ts` calls
    `define("ocelle-icon", OtherClass)` after the element is defined and asserts, in the same test, that it does not
    throw and that `customElements.get("ocelle-icon")` is still `OcelleIcon`, and that `define` for a fresh tag defines
    it; `entry-icon.test.ts` imports only `src/ocelle-icon.ts` and asserts `ocelle-icon` defined and
    `ocelle-brand-mark` undefined in one test; `entry-root.test.ts` imports only `src/index.ts` and asserts both
    defined. Each is its own file because Vitest browser mode runs each test file in its own iframe with a fresh
    registry (`isolate` stays on, its default, in the `elements` project; the test files state it).
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
- **`token-only` changes** (each with unit tests in `gates/test/` and plants under `gates/plants/style-lint/`, red
  first): exact values, not open classes, so no raw size factor gets through (constitution II).
  - `scale` takes only the numbers `-1` and `1` (operator decision, PLAN-TESTABILITY-1-011 (a)), so the mirroring
    rule can be `scale: -1 1` (R-08). Pass plant `pass-scale-mirror` (`scale: -1 1`); fail plants `fail-scale-factor`
    (`scale: 2`, which a change admitting every unitless factor would accept) and `fail-scale-length` (`scale: 2px 1`,
    raw with or without the change; kept as the length case).
  - `aspect-ratio` takes only the number `1` (PLAN-FRESH-1-006 (a), the mark's sizing, R-09). Pass plant
    `pass-aspect-square` (`aspect-ratio: 1`); fail plant `fail-aspect-ratio-other` (`aspect-ratio: 2`).
  - The unit `lh` is allowed only as `1lh`, one line box of the element's own line height (PLAN-CORRECTNESS-1-004 (a),
    the slot wrapper, R-10). Pass plant `pass-one-line` (`block-size: 1lh`); fail plant `fail-lh-multiple`
    (`block-size: 2lh`).
  - Why these are not raw literals under constitution II: `-1`/`1` flip or keep a drawing and change no size, `1` as
    an aspect ratio says "as wide as high" and takes the size from the token, and `1lh` is the line height the element
    already inherits from the type tokens. Any other value of these properties stays a finding.
- **Rationale**: adopted stylesheets are the constitution IV mechanism; `static styles` is Lit's shared form.
- **Alternatives** for mirroring: `transform: scaleX(-1)` (a raw function under `token-only`), `scale: calc(-1) 1`
  (passes the lint by an accident of the `calc()` rule; obscure), an SVG `transform` attribute chosen in `render()`
  (needs the computed direction in script, which a `dir` change on an ancestor does not re-trigger). Rejected. Adding
  `scale` to the unitless set (any factor): rejected by the operator (PLAN-TESTABILITY-1-011).

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
  - Licence banner (operator decision, PLAN-A11Y-SECURITY-1-008 (a); FR-029): the build's output `banner` option
    prepends one `/*! … */` comment to the file: `@ocelle/elements` and its licence (Apache-2.0), "Includes Lit
    (lit, lit-html, lit-element, @lit/reactive-element), Copyright Google LLC, BSD-3-Clause", and "Full notices:
    THIRD_PARTY_NOTICES in the @ocelle/elements package". An output banner is added after minification, so the
    minifier does not drop it (measured: Vite 8.3.5 drops a source `@license` comment in a minified library build).
  - A build test (`packages/elements/test/build/build.test.ts`, project `elements-build`, R-11) asserts: the browser
    build starts with that banner (each of the three statements); it has no `import` statement and no dynamic
    `import(`; it holds no `lit-html/development` path, no `ssr-dom-shim`, and no `console.` call; the module build's
    imports are only its own relative files and `lit` or `lit/…`, and `dist/ocelle-icon.js` and
    `dist/ocelle-brand-mark.js` import neither `./index.js` nor each other (US1-17, FR-001, FR-002, FR-016,
    PLAN-TESTABILITY-1-008). The runtime half of US1-17 (which element an entry point defines) is tested in-process
    (R-02) and on the fixture (R-11).
  - The build configuration is covered for mutation by `test/node/vite-config.test.ts` (`elements-node`), which
    imports `vite.browser.config.ts` and asserts its library entry, format, output file name, `emptyOutDir`, the
    absence of externals and of the `development` condition, and the banner text, as
    `storybook/test/unit/main.test.ts` covers `.storybook/main.ts` (PLAN-TESTABILITY-1-009). The spawned build in
    `build.test.ts` does not see Stryker's active mutant, so this import is what kills the configuration's mutants.
  - Engine floor (PLAN-A11Y-SECURITY-1-007): the elements require constructable stylesheets (`adoptedStyleSheets`;
    Chromium 73+, WebKit 16.4+) and a page without a `window.ShadyCSS` polyfill. Lit's fallback, which creates a
    `<style>` element per stylesheet (`@lit/reactive-element` `css-tag.js`: `supportsAdoptingStyleSheets` false →
    `document.createElement('style')`), is unreachable in those engines, so FR-004's "no `<style>` element" holds
    there; in an older engine the strict CSP would block those elements and the icons would render unsized. The README
    states the floor (R-15).
- **Measured**: a probe element built with the repository's Vite 8.3.5 in library mode gave a 20 kB unminified ES
  module with no `import`; `gate:csp --root <probe>` and `gate:prefix --root <probe>` over it: "1 file checked, no
  finding". The only `innerHTML` in Lit's production code assigns a `<template>`'s content, which the `csp` gate does
  not flag (it flags inline script, `<style>`, `style` and `on*` attributes in literals). It wrote no console message.
- **Rationale**: one source, two outputs (spec Assumptions "Browser build"); Vite is already pinned and used by
  Storybook.
- **Alternatives**: esbuild (not a direct dependency), Rollup directly (Vite 8 already wraps Rolldown). Rejected.

## R-06 Custom-elements manifest and the `manifest` gate

- **Decision**:
  - Generator: `@custom-elements-manifest/analyzer` **0.11.0** (released 2025-11-04), exact, a **root**
    devDependency, as every other tool a gate runs (Stryker, ESLint, Playwright, parse5 …): with hoisting off, a dev
    dependency of `@ocelle/elements` alone would not resolve from `gates/bin/manifest.ts` or in a plant tree, which
    links only the root `node_modules` (PLAN-TESTABILITY-1-003). It is run with its Lit support (`--litelement`) over
    `src/ocelle-*.ts` by `packages/elements/scripts/manifest.ts`, in process through the analyzer's `create` API with
    its Lit plugin if the phase 2 spike shows that gives the CLI's output (so `manifest.test.ts` and the gate need no
    child process), else through the CLI into a temporary directory. The script then normalises the
    analyzer's output: it adds empty `slots`, `events`, `cssParts` and `cssProperties` arrays to every element
    declaration (FR-007 "stated as empty"), replaces the `IconName` type text with the union of the thirteen names
    read from `icons.ts` (US1-11), drops `attribute` entries for non-public members, drops every observed attribute
    that is not a reactive property (named: `aria-label`, which the elements observe for FR-034 and the analyzer
    otherwise lists as an undescribed attribute), sorts keys, and writes `packages/elements/custom-elements.json` with
    a trailing newline. `pnpm --filter @ocelle/elements run manifest` regenerates it.
  - What the analyzer writes (measured by the round-1 squad, analyzer 0.11.0 on the planned element shape: static
    properties, `declare` fields, the module-level `define()` helper, `observedAttributes` plus `"aria-label"`):
    `"schemaVersion": "1.0.0"`; no `tagName` through the helper (a JSDoc `@tagname` gives it, R-02); no `default`
    unless a `@default` JSDoc tag gives one (`@default undefined` gives `"default": "undefined"`); an
    `{"name": "aria-label"}` attribute with no description, which the normaliser drops (PLAN-CORRECTNESS-1-005).
    `test/node/manifest.test.ts` asserts on the manifest generated from the real source: each element's `tagName`,
    `"default": "undefined"` on every property, no `aria-label` attribute, and the schema version 1.0.0.
  - Gate `manifest` (`gates/bin/manifest.ts`, `pnpm run gate:manifest`, CI check "Custom-elements manifest"): runs the
    same generation into memory from `--root`, and reports (exit 1) a `stale` finding per differing element member
    (`<element>.<kind>.<name>`) or one `stale` finding for a whole-file difference it cannot attribute, and a
    `no-description` finding per public member of the six kinds without a non-empty description (FR-009); exit 2 when
    the committed manifest is missing or is not JSON, or the source cannot be analysed.
  - Plants (`gates/plants/manifest/`, `repo-tree` form): fail: `fail-stale-property` (a property added in source,
    manifest not regenerated), `fail-lost-attribute` (the `label` attribute removed from the manifest), one
    `fail-undescribed-<kind>` per kind (property, attribute, event, slot, css-part, css-property; a plant element
    declares one of each); pass: `pass-repository` (the configuration set alone, which from this feature holds the
    element source, the generator and the committed manifest, R-12), `pass-reordered` (the same manifest with keys
    reordered); breaking: `break-not-json`, `break-missing`. A gates-integration expectation runs `pass-repository`
    in a built plant tree and asserts exit 0, so a generator that cannot resolve the analyzer there (exit 2) fails it
    (PLAN-TESTABILITY-1-003). Registered in `gates/gates.json`, the CI workflow and `gates/lib/registry.ts` (the
    FR-020 list), listed in `gates/README.md`.
  - Required check: the "Custom-elements manifest" check blocks a merge only once the operator adds it to the
    ruleset on `main` (`gates/README.md` § Required checks: "A change to this set is a change to the ruleset, which the
    operator makes"), as 002's contrast and brand-rules checks were added (PLAN-CORRECTNESS-1-010). The README's
    "exactly these fourteen checks" list and the `gates/lib/registry.ts` comment ("the fourteen checks") become
    fifteen with "Custom-elements manifest".
- **Rationale**: the analyzer is the community generator for the manifest schema and understands Lit's static
  properties; normalising in our own script keeps the output stable and lets the gate reuse the generator, so "the
  committed manifest matches the source" is one comparison.
- **Alternatives**: our own generator on the TypeScript 6 compiler API: full control but a second analyzer to write
  and mutation-test. The analyzer's own `--dev` checks: no description rule. Rejected.
- **Dependency tree** (measured by the round-1 squad, a lockfile-only resolve): 82 packages, among them a second
  TypeScript (5.4.5, which the analyzer parses with), `rs-module-lexer` 2.9.0 (through
  `@custom-elements-manifest/find-dependencies` 0.0.7) with a native binding per platform as optional dependencies
  (`@xn-sakina/rml-*` 2.9.0) and a `postinstall` script, and `fsevents` 2.3.3 (optional, macOS only) with an install
  script. Both run in the manifest gate on every CI run. The install-script policy change this needs is R-16.
- **Risk**: the analyzer parses with its own TypeScript ~5.4. Nothing in the element modules needs TypeScript 6
  syntax; the phase 2 spike runs it on a scratch element written exactly as the elements will be (the real
  `define` helper, `static properties`, `declare` fields, `observedAttributes` with `aria-label`, the JSDoc tags of
  R-02) before the gate is written, with the install-script approval of R-16 in place, in this container (Node
  22.23.4) and on CI's Node 26.13.0.

## R-07 The icon set

- **Decision**: thirteen drawings in `icons.ts`, each a Lit `svg` template of `path`, `line`, `polyline`, `rect`
  or `circle` elements on a 24-unit grid, drawn for this library (operator decision, own drawings): stroke width 2,
  round caps and joins, no fill except none, inside a 2-unit margin (geometry within 2 to 22, so stroke plus caps stay
  within 1 to 23). Names and mirroring: `chevron-start`*, `chevron-end`*, `chevron-up`, `chevron-down`,
  `arrow-start`*, `arrow-end`*, `menu`, `close`, `folder`, `file`, `search`, `table`, `copy` (* mirrors in
  right-to-left). The drawings are written as data (`{ mirror, shapes }` per name) so that the drawing rules of US2-3
  (FR-010, FR-018) are checked on the data and on the rendered DOM.
- **Types and mutation** (operator decision, PLAN-TESTABILITY-1-005 (a); PLAN-FRESH-1-009): `IconName` is declared as
  an explicit union of the thirteen string literals, and the table is typed `Readonly<Record<IconName, Icon>>`, so
  the type checker (the `typecheck` gate) rejects a table that lacks a name or holds another. The table is **not**
  written `as const`: Stryker makes no mutant inside an `as const` literal
  (`knowledge/speckit-flows/findings/frontend-missions.md` § Testing pitfalls), which would leave the drawings
  unmutated. The US2 tests hold an independent expected table, written in the test file
  (`test/icons-expected.ts`, test code): per icon, the `mirror` flag and each shape's element name and attributes in
  order. One test per icon asserts that the rendered `svg`'s children equal that entry, beside the rule tests (grid,
  stroke, painted area, distinctness, mirroring). Emptying one `d` or `points` of a multi-shape icon (which keeps the
  drawing non-empty, in bounds and distinct) then fails that icon's test, so the drawing data is mutation-tested.
- **Consumer mapping** (README, SC-007): chevrons — back navigation, disclosure (#13), scroller and breadcrumb
  direction; arrows — the action-row trailing arrow (#7); `menu` — the top bar's menu button (#12); `close` — dialog,
  drawer and dismiss (#16); `folder`, `file`, `table`, `search` — kitty-mission-ui's Projects screen and Artifact
  Viewer (spec-kitty-design#496 comments); `copy` — the copy field's control (#14).
- **Rationale**: one grid and one stroke keep the set visually even; data form makes the rules checkable without
  parsing templates.

## R-08 Mirroring

- **Decision**: drawings with `mirror: true` render their `svg` with a `mirror` class, and
  `:host(:dir(rtl)) .mirror { scale: -1 1; }` flips them. `:dir()` follows the computed direction from any ancestor or
  the element (spec Edge Cases). Pixel comparison (US2-4) captures each icon's box at 4× (80 px) under `ltr` and
  `rtl`.
  - **Setup**: each icon is set at `--ocelle-icon-size: 80px` inside a container positioned at whole-pixel
    coordinates (an absolutely positioned container at integer offsets, no inherited fractional layout), and the test
    asserts, before comparing, that the icon's box is at integer coordinates and that each capture is exactly
    80 × 80 px. A fractional layout then fails as a setup error, not as a mirroring result (PLAN-TESTABILITY-1-001:
    a box at a fractional offset is captured 81 × 81 px and the flipped comparison differs by 255).
  - **"Equal"** is a count rule, not a per-pixel maximum (PLAN-TESTABILITY-1-001): two captures are equal when at
    most 1 % of the pixels (64 of 6400) differ by more than 32/255 in any channel and none differs by more than
    96/255. Chromium does not rasterise a mirrored vector as the exact mirror of the unmirrored raster: comparing the
    `rtl` capture with the `ltr` capture flipped, the round-1 squad measured a maximum per-channel difference of 24/255
    on 5 of 6400 pixels (chevron), and the refuter 15 (chevron), 12 (search) and 15 (arrow), all whole-pixel 80 px
    boxes; the old 8/255 maximum fails a correct `scale: -1 1`. Phase 3 measures the rule on all thirteen drawings
    before its red commit and records the figures in `reviews/phase-3/spike.md`; if a correct drawing exceeds it, the
    rule is changed and recorded there before the red step, never after.
  - **"Differs"** is unchanged: more than 5 % of pixels differ by more than 64/255 (measured 10.9 % to 26.3 %).
- **Rationale**: `:dir()` reacts to direction changes without script; `scale` is a single property the lint can allow
  (R-03).

## R-09 The brand mark

- **Decision**: `rosette.ts` holds the rosette group of the reference (`sources/ocelle-docs-logo.reference.svg`) in
  the group's own coordinates, with no transform: four open arcs (`path d="M… A…"`, radii 35 to 38 about (50, 50),
  stroke widths 15, 12, 16, 11) and one ellipse (`cx 51.5, cy 50.5, rx 11.5, ry 10`, `rotate(-18 51.5 50.5)`). The
  viewBox is chosen from the rosette's painted extent, not from the app icon's inset (operator decision,
  PLAN-CORRECTNESS-1-011 (a)): the painted extent (arcs grown by half their stroke widths, round caps included) is
  7.53 to 93.50 horizontally and 7.64 to 93.86 vertically (computed from the reference's endpoints, radii and stroke
  widths), about the ring's centre (50, 50); `viewBox="4 4 92 92"` centres on it and leaves 2.1 to 3.6 units of
  margin, so the mark paints about 94 % of its box, as the icons paint 22 of 24 units. The app icon's
  `translate(14 14) scale(0.72)` placed the rosette inside its rounded square, which the element drops (spec
  Assumptions "Rosette, not app icon"); under it the mark painted about 62 % of its box. Two classes, `ring` and
  `spot`.
- **Styles** (PLAN-A11Y-SECURITY-1-001, with PLAN-CORRECTNESS-1-001 and PLAN-FRESH-1-001 folded in): the variant
  rules are wrapped in `@media not (forced-colors: active)`, and the forced-colours rules are a separate block, so
  no variant selector competes with them on specificity:

  ```css
  @media not (forced-colors: active) {
    .ring { stroke: var(--ocelle-color-ink); }
    .spot { fill: var(--ocelle-color-accent); }
    :host([ground="chrome"]) .ring { stroke: var(--ocelle-color-chrome-ink); }
    :host([tone="mono"]) .ring { stroke: currentColor; }
    :host([tone="mono"]) .spot { fill: currentColor; }
  }
  @media (forced-colors: active) {
    .ring { stroke: currentColor; }
    .spot { fill: currentColor; }
  }
  ```

  Mono comes after chrome with the same specificity, so it wins (FR-025). Attribute selectors use the exact values
  `chrome` and `mono`; other values match nothing, so the default applies (US4-8). The design R-09 had before round 1
  (variant rules unwrapped and a bare `.ring` forced-colours rule) loses on specificity: `:host([ground="chrome"])
  .ring` (0,3,0) beats `.ring` (0,1,0), so in forced colours the chrome ring kept `--ocelle-color-chrome-ink`
  (measured by the squad and the refuter, light and dark palettes; Chromium does not force an author `stroke` or
  `fill`, as spec check 2 measured). Re-measured with the wrapped form above (Chromium 1243, emulated forced colours,
  this session): the ring and the spot of the default, chrome, mono and chrome-plus-mono marks are `CanvasText` in
  text in both palettes, `LinkText` in a link and `GrayText` in a disabled button. The README's conventions state the
  rule for later elements: variant rules go inside `@media not (forced-colors: active)`, so a forced-colours rule
  never has to outrank a variant selector.
- **Sizing** (operator decision, PLAN-FRESH-1-006 (a)): `:host { display: inline-block; block-size:
  var(--ocelle-icon-size); inline-size: auto; aspect-ratio: 1; vertical-align: middle; flex: none; }` and the `svg`
  as in R-04 (`inline-size: 100%; block-size: 100%`, `xMidYMid meet`). Measured in this session: no host size gives
  20 × 20 px, a host `block-size: 32px` gives 32 × 32 px, a host `inline-size: 32px` gives 32 × 20 px with the drawing
  at the smaller side, centred (US4-7). `aspect-ratio: 1` needs the `token-only` change of R-03.
- **Forced-colours tests and plants** (US4-5, PLAN-TESTABILITY-1-006): every variant (default, chrome, mono) is read
  in four contexts: body text, a link, a native button and a disabled native button. In Chromium's emulated palettes
  `ButtonText` equals `CanvasText` (measured: rgb(0,0,0) light, rgb(255,255,255) dark), while `LinkText` (rgb(0,0,159),
  rgb(255,255,0)) and a disabled button's `GrayText` (rgb(96,0,0), rgb(63,242,63)) differ from both, so the link and the
  disabled button are the cases that tell `currentColor` from a fixed system colour. Plants: the pre-round-1 sheet (a
  bare `.ring` forced-colours rule, variant rules unwrapped), which fails on the chrome variant; and
  `fill: CanvasText` in the forced-colours `.spot` rule, which fails in the link and the disabled button. The same
  four contexts apply to the icon (US1-7) and the slotted icon (US3-8, the test host's inner button enabled and
  disabled).
- **Geometry test** (US4-9): parses the reference file and `rosette.ts`'s data, fits one scale and translation from
  the ellipse centre and one arc endpoint, and compares every endpoint, radius, stroke width and the ellipse within
  0.5 % of the width. With the decision above the expected fit against the reference's rosette group is scale 1 and
  translation 0 (the group's own coordinates); the test still fits them rather than assuming them.
- **Contrast pairs** (FR-026): thirteen new `non-text` rows in `packages/tokens/contrast/pairs.json`, figures
  computed by the repository's `gates/lib/wcag.ts` from the resolved token values: `color-accent` on `color-chrome`
  and `color-chrome-hover` in light and in dark (4 rows), and on the nine main grounds in dark (9 rows). Every figure
  is between 4.60 and 6.57 (spec check 1). Row counts become 160 light and 168 dark, 328 entries in all (158 + 2,
  157 + 11, 315 + 13); the required count (149 per theme) is derived from the token source and does not change. Every
  place that pins the counts changes with them, test first, in the same red commit (PLAN-CORRECTNESS-1-007):
  `gates/test/contrast-pairs.test.ts` (the 158/157 counts, the 315 entry lines and the 315 unique keys),
  `gates/test/contrast.test.ts` (the in-process summary "158 pairs checked in light, 157 in dark"),
  `gates/test/integration/plants-robustness.test.ts` (the three summaries, including the 159 after one inserted light
  row, which becomes 161), `gates/test/integration/token-gates.test.ts` (test name and summary), and the Stryker
  record comment in `gates/bin/contrast.ts` that cites the token-gates test name. The pairing test is
  `packages/elements/test/node/brand-pairs.test.ts` (`elements-node`, PLAN-CORRECTNESS-1-009), on the model of
  `packages/styles/test/pairs.test.ts`: it reads
  `ocelle-brand-mark.ts`'s style template as text, collects the `var(--ocelle-color-*)` tokens per variant selector,
  and checks them against FR-026's list and against the `checked` rows of `pairs.json`; its plant is a fixture copy
  of `pairs.json` with the dark `color-accent` on `color-chrome` row removed.

## R-10 The slot convention

- **Decision**: `icon-slot.ts` exports `iconSlotStyles`, a `css` template a control adds to its `static styles`, and
  documents the markup a control renders: `<span class="icon-slot"><slot name="icon"></slot></span><span
  class="label">…</span><span class="icon-slot trailing"><slot name="trailing"></slot></span>` inside an
  `inline-flex` row with `align-items: flex-start`. Rules:
  - `.icon-slot { display: inline-flex; align-items: center; justify-content: center; flex: none; block-size: 1lh; }`:
    the wrapper is exactly one line box of the row's line height, and the icon is centred in it, overflowing it
    evenly above and below when the icon is taller than the line box. So the icon is centred on the label's first line
    whether the label wraps or not, at every font-size and line-height token pair, without a length literal (operator
    decision, PLAN-CORRECTNESS-1-004 (a); FR-021, US3-1). The wrappers and the label inherit the row's font and line
    height; the README says a control sets type on the row, not on the label alone. `1lh` needs the `token-only`
    change of R-03.
  - No strut. The zero-width-space `::before` strut of the first draft centred only when the line box was at least the
    icon size (measured centre differences: 16px/1.45 −0.01 px, but 14px/1.15 1.95 px, 12px/1.45 1.30 px and a 32 px
    icon 4.40 px, against US3-1's 0.5 px; with `block-size: 1lh` and no strut, at most 0.01 px in all four), and its
    generated U+200B entered the control's accessible name (U+200B, a space and "Open project", plus a StaticText node holding only
    U+200B; PLAN-A11Y-SECURITY-1-004). Both are now plants: the strut as the centring plant of US3-1 and US3-10, and
    the strut without empty alt text (`content: "\200b"`) as the naming plant of US3-11.
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
- **Centring tests** (US3-1, US3-10): the test host is measured with its row in body type (`--ocelle-font-size-md`,
  `--ocelle-line-height-normal`), at `--ocelle-font-size-xs`, at `--ocelle-font-size-sm` with
  `--ocelle-line-height-tight` (a line box under 20 px), and with `--ocelle-icon-size: 2rem` on the host, single-line
  and wrapped; each case asserts the 0.5 px bound.
- **Name from the visible label** (US3-11, PLAN-A11Y-SECURITY-1-004): the test host without `label`, labelled
  "Open project" by its visible text, with an icon in each slot; the test reads the inner button's name ("Open
  project" exactly) and its children (no text node besides the label's) from the AX tree.
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
  row (centres on the whole label, wrong when it wraps). The strut with empty alt text (`content: "\200b" / ""`):
  names cleanly but still fails centring when the icon is taller than the line box; keeping it would have narrowed
  FR-021 (fork option (b), not chosen). Rejected.

## R-11 Test layout and the two kinds of browser tests

- **Decision** (operator decision on PLAN-CORRECTNESS-1-002: option (a), every browser scenario of the spec on the
  strict-CSP fixture with the browser build, and in-process for mutation):
  - **Shared scenario bodies** (`packages/elements/test/scenarios/*.ts`, test code, not test files): each browser
    scenario of the spec that does not depend on the page's scripts (US1 1 to 9, 14, 16 and 18, US2 2 to 4, US3 1 to 6 and 8 to 11, US4 1 to 3, 5 to 9, 13 and 14,
    the US4 Independent Test and SC-001) is written once as a function of a driver, with its assertions and its
    pairing. The driver interface holds what the scenarios need: mount markup (with or without `base.css`), measure a
    box, read a computed style, read the AX nodes of an element by `id`, emulate forced colours with a palette,
    capture an element's pixels, and set a property or attribute. Two harnesses implement it and run every body:
  - **In-process** (`packages/elements/test/*.test.ts`, the existing `elements` Vitest browser-mode project): import
    element source, adopt the token stylesheet generated by `css(source)` from `packages/tokens/src/generate.ts`
    (font faces stripped, so no font request) and, where a test says so, `packages/styles/src/base.css?raw`; read the
    accessibility tree and emulate forced colours through two Vitest browser commands defined in
    `vitest.config.ts`'s elements project, `axTree(id)` (Chromium's CDP `Accessibility.getFullAXTree` for the test
    frame, filtered to unignored nodes, returning the nodes for the element with that `id` and its shadow subtree) and
    `emulateForcedColors(mode, scheme)` (Playwright `emulateMedia`). These tests kill the mutants of the element
    source (R-12). They run Lit's development build (Vite resolves the `development` condition outside production),
    so console assertions here spy before rendering and cover only messages emitted after import; the console
    outcome of FR-016 is asserted on the fixture.
  - **Fixture suites** (`packages/elements/test/browser/*.test.ts`, a new `elements-browser` project, Node tests that
    drive Chromium through Playwright like `styles-browser`): every shared scenario body again, on strict-CSP fixture
    pages that load the built browser build, with the recorders below added to each, plus the fixture-only scenarios
    (US1-10, US1-15, US1-17's runtime half, and the fixture halves of US1-8 and US1-14 below).
    A `globalSetup` builds into a per-run temporary directory (`mkdtemp`) the browser build, the test-host bundle
    (Vite, entry `test/fixtures/test-host.ts`, Lit bundled), the two module-build bundles for US1-10 and, for US1-17,
    one bundle of `ocelle-icon.js` only and one of the package root, each made as a bundler host makes it. Nothing is
    built into a package's `dist/` from test setup (PLAN-FRESH-1-007): as `packages/styles/test/browser/serve.ts` does
    for 003, the setup writes into the same temporary directory `tokens.css` from the token generator's `css(source)`
    (the current source), the vendored font files from `packages/tokens`, and `base.css` copied from
    `packages/styles/src`. `serve.ts` serves that directory with the header of the spec's fixture
    (`default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'`).
  - **Recorders on every fixture page**, all installed before navigation and none of them a page script or a request
    (PLAN-A11Y-SECURITY-1-006, PLAN-TESTABILITY-1-007, 1-010): CSP violations through the existing
    `collectViolations` / `violations` of `packages/tokens/test/browser/serve.ts:116-129`, which installs the
    `securitypolicyviolation` listener with `page.addInitScript` (active before any page script runs, outside the
    page's CSP) and which `packages/styles/test/browser/serve.ts` already reuses; requests through Playwright's
    `request` event; console messages and uncaught errors through Playwright's `console` and `pageerror` events. The
    fixture pages then hold only the scripts the spec allows. A control page with one inline `style` attribute (as
    002 and 003 did) shows that the collector records a violation. Each test asserts zero violations, only allowed
    requests and zero console messages together with its positive outcome (spec pairing table).
  - **Fixture-only cases**: US1-8 on the built file (`nonexistent`, `""`, `Close`, ` close`, no `name`, then a known
    name that draws, in one test, with zero console messages on the page, Lit's development-mode warning included);
    US1-14's 500-icon page with the request recorder (one shared stylesheet object and no request outside the
    allowed list, in the same test); US1-17's runtime half (the `ocelle-icon.js` bundle page defines `ocelle-icon` and
    not `ocelle-brand-mark`, the root bundle page defines both; these are the test-only bundles of the setup, on
    pages of the US1-10 kind).
  - **Fixture AX and forced colours**: the fixture harness reads the AX tree through a Playwright CDP session
    (`Accessibility.getFullAXTree`, the same filter as `axTree`) and emulates forced colours with `page.emulateMedia`.
  - The `elements` project's include gains `exclude: packages/elements/test/{node,build,browser}/**`.
  - **Node projects**: `elements-node` (`environment: "node"`, include `packages/elements/test/node/**/*.test.ts`) holds
    the in-process node unit tests: `manifest.test.ts` (the generator and normaliser), `brand-pairs.test.ts`,
    `readme.test.ts` and `vite-config.test.ts` (R-05). It stays in the default mutation configuration (R-12).
    `elements-build` (`environment: "node"`, include `packages/elements/test/build/**/*.test.ts`) holds the tests that
    start real tools: `build.test.ts` (runs `tsc` and `vite build`) and `pack.test.ts` (runs `pnpm pack`). It is
    excluded from mutation, like `gates-integration` (PLAN-TESTABILITY-1-009).
  - `gates/test/vitest-config.test.ts` changes first (red): the four projects and their includes and excludes, and
    the mutation exclusions of R-12.
- **Rationale**: in-process tests are the only ones Stryker can use (it instruments the modules the test imports);
  the built-file tests prove what ships, under the real CSP header, as 003 did, and the spec requires every browser
  scenario to hold there. Shared bodies keep the two runs one scenario each, so the in-process run cannot drift from
  what the fixture proves.
- **Alternatives**: narrowing the spec's fixture rule to a named list of scenarios (fork option (b), not chosen); an
  external `securitypolicyviolation` recorder script (a fourth test-only script and a request the fixture does not
  allow, and blind to violations raised before it loads); serving `tokens.css` from a pre-built
  `packages/tokens/dist` (shared with a concurrent build and the `csp`/`prefix` scans, and possibly stale). Rejected.

## R-12 Mutation testing of element source

- **Decision**: the mutation gate routes changed files under `packages/elements/src/**` to a second Stryker
  configuration, `stryker.elements.config.json`, whose Vitest config `vitest.mutation.elements.config.ts` holds only
  the `elements` project; other changed files keep `stryker.config.json`. `gates/bin/mutation.ts` splits the selected
  ranges by configuration and runs one Stryker run per non-empty group, merging the classified results. Unit tests of
  the split first.
  - **Default configuration**: `vitest.mutation.config.ts` excludes `elements` (now covered by
    `stryker.elements.config.json`), `elements-build` and `elements-browser` besides its four current exclusions, so
    the default run neither repeats the browser-mode suite for every non-element mutant (R-12's measured whole-suite
    fallback) nor starts `tsc`, Vite or `pnpm pack` (PLAN-TESTABILITY-1-009, PLAN-CORRECTNESS-1-008). It keeps
    `elements-node`. `gates/test/vitest-config.test.ts` changes first.
  - **Elements files outside `src/`** stay in the default configuration and each has an in-process test that reaches
    its mutants: `vite.browser.config.ts` through `test/node/vite-config.test.ts` (R-05), `scripts/manifest.ts`
    through `test/node/manifest.test.ts` (the normaliser, and the generation in process if the spike chooses the
    analyzer's API, R-06). `custom-elements-manifest.config.mjs` is not TypeScript and is outside the mutation scope
    (`gates/lib/mutation/ranges.ts` mutates `packages/*/**/*.ts`).
  - **Plants** (`gates/plants/mutation/`, PLAN-TESTABILITY-1-002): pass `pass-element-source` (an element-source
    change fully killed); fail `fail-element-source-survivor` (a change in `packages/elements/src` with a mutant the
    elements test does not kill; expected finding `<path>:<line>` `Survived`), `fail-element-source-no-coverage` (a new
    element module that no test imports; `NoCoverage`), and `fail-mixed-survivors` (one gate-source and one
    element-source change, each with a survivor; the expected findings name both, so the merge of the two runs is
    proven). Without them a split that lost the element group would print "nothing to mutate" and exit 0
    (`gates/bin/mutation.ts:141-143`) and still pass `pass-element-source`.
  - **Plant repositories** (PLAN-CORRECTNESS-1-006): `gates/lib/plant-repo.ts` copies a fixed configuration set into
    every temporary repository (`rootConfiguration` :30-41, `configurationSet` :55-62) and links only the root
    `node_modules` (:320-326); mutation-repo plants use the same `copyConfiguration`. So, changed with
    `gates/test/plant-repo.test.ts` and the gates-integration plant-repo test first (red):
    - `rootConfiguration` gains `stryker.elements.config.json` and `vitest.mutation.elements.config.ts`, and the
      `configurationName` pattern (:66) gains them too (today `stryker\.conf(?:ig)?\.\w+` and
      `vitest(?:\.[\w-]+)?\.config` match neither name), so a plant cannot carry its own copy;
    - the configuration set gains the element files the manifest gate and the element plants read, as `tokenFiles`
      does for the token gates: `packages/elements/src`, `packages/elements/scripts/manifest.ts`,
      `packages/elements/custom-elements-manifest.config.mjs` and `packages/elements/custom-elements.json`;
    - `copyConfiguration` also links each package's own `node_modules` (`packages/*/node_modules`), so `lit`, a
      dependency of `@ocelle/elements` only, resolves for the element source in every plant tree (the elements Vitest
      project of the mutation plants, and the typecheck and lint plants, which now see the element source; their
      expected findings do not change, because the element source passes those gates on the repository).
- **Measured**: a probe element with two browser-mode tests: with the repository's `stryker.config.json` (all
  in-process projects) Stryker ran 612.5 tests per mutant ("Ran all tests for this mutant") and took 87 s for 12
  mutants at concurrency 2; with a config holding only the `elements` project it ran 1.92 tests per mutant and took
  32 s, with the same kills. Per-test coverage does not reach Stryker when browser-mode and Node projects share a run,
  so every mutant falls back to the whole suite.
- **CSS and drawings in templates**: Stryker mutates the static parts of `css` and `svg` tagged templates as string
  literals where it can; survivors there are killed by computed-style and DOM assertions, or recorded as equivalent
  with a reason (constitution VIII). The drawing data is plain data (no `as const`) and is killed by the expected
  table of R-07.
- **Alternatives**: one config with `related: true` (Vitest's related-file lookup does not see browser-mode imports);
  marking element source as not mutated (constitution VIII). Rejected.

## R-13 Accessibility naming mechanism

- **Decision**: `naming.ts` exposes one function used by both elements in `updated()`: given the `label` property and
  the host's `aria-label` attribute, it computes the name and whether the element is drawable (an icon with a known
  name; always for the mark). Naming (FR-034, operator decisions PLAN-A11Y-SECURITY-1-002 (a) and 1-003 (a)): when
  the host has an `aria-label` attribute, it alone decides: a value with a non-whitespace character names the
  element, and a blank value leaves it unlabelled even with a `label`; when the host has none, the trimmed `label`
  names it if non-empty. It sets `ElementInternals`: when named and drawable, `role = "img"`, `ariaLabel = name`,
  `ariaHidden = null`; otherwise `role = null`, `ariaLabel = null`, `ariaHidden = "true"`. When the host's
  `aria-label` names the element, Chromium takes the name from the host attribute as written, so `ariaLabel` on the
  internals only matters for the `label` case; the element never writes the host's `aria-label`. The inner `svg` always has `aria-hidden="true"`. The elements observe `aria-label` by adding
  it to `observedAttributes` and requesting an update, without declaring a property (FR-034: not in the manifest). A
  host `aria-hidden="true"` overrides the internals by ARIA precedence (host attributes beat `ElementInternals`
  defaults), so it hides a labelled element with no code (FR-034).
- **Rationale**: spec check 2 measured that a host with an `id` is exposed as an empty `generic` node unless the host
  itself is hidden, and that `ElementInternals.ariaHidden` removes it; internals keep the host's own attributes free
  for the host.
- **Measured** (round-1 squad and refuter, Chromium 1243, CDP `getFullAXTree` and `getPartialAXTree`):
  - a host `aria-label=" Close "` with internals `role "img"` and `ariaLabel "Close"` is exposed as `image " Close "`:
    Chromium does not trim a host `aria-label` and prefers it over the internals value. Hence hosts pass a trimmed
    value (README) and US1-18 and US4-14 use `"Close"` and `"Ocelle"` (PLAN-A11Y-SECURITY-1-003 (a));
  - a host `aria-label="  "` or `aria-label=""` with `label="Shut"` and internals `role "img"`, `ariaLabel "Shut"` is
    exposed as `image ""`, an unnamed image: Chromium uses the host attribute whenever it is present. Hence a blank
    host `aria-label` makes the element unlabelled and hidden (PLAN-A11Y-SECURITY-1-002 (a)); its plant is an element
    that falls back to `label` there;
  - a host `aria-hidden="true"` hides an element whose internals set `role "img"`.
- **To verify in the phase 2 spike**: that a host with an `id`, hidden through internals, gives no node, and that a
  host `aria-label` with internals `role = "img"` gives one image node, with the `axTree` command as built.

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
  - `packages/elements/README.md`: element conventions (R-02 with the `@tagname` and `@default` JSDoc tags, R-03,
    R-06, R-11, R-14, the token rule of FR-007, and the forced-colours rule of R-09: variant rules inside
    `@media not (forced-colors: active)`), builds and which host uses which (FR-033) with the browser build's file
    path to copy (`dist/browser/ocelle-elements.js`, R-02), `ocelle-icon` (attributes, tokens read, names table with
    consumer needs), slot convention (R-10, including that the row sets the type), `ocelle-brand-mark` (variants,
    grounds, tokens read, width following height), naming and host ARIA rules (FR-023, FR-034: a present host
    `aria-label` decides alone, a blank one leaves the element unlabelled, and hosts pass it trimmed), licence and
    trademark note (FR-029, FR-030) and the browser build's banner, engines (constructable stylesheets required,
    Chromium 73+ and WebKit 16.4+, R-05; WebKit unmeasured), two copies on a page.
  - `packages/elements/CHANGELOG.md` (new): the surface of FR-031.
  - `NOTICE` (new, repository root): the Apache-2.0 NOTICE with the trademark note.
  - `THIRD_PARTY_NOTICES`: a Lit entry (`lit` 3.3.3, `lit-html` 3.3.3, `lit-element` 4.2.2,
    `@lit/reactive-element` 2.1.2, BSD-3-Clause, copyright "Google LLC", repository, published file
    `@ocelle/elements dist/browser/ocelle-elements.js`), with the licence text beside it as
    `packages/elements/licenses/lit-BSD-3-Clause.txt` (copied unchanged from `node_modules/lit/LICENSE`).
  - Packed files: the elements build copies the root `LICENSE`, `NOTICE` and `THIRD_PARTY_NOTICES` into the package
    directory (ignored by git); `files` lists `dist`, `custom-elements.json`, `licenses`, `README.md`, `CHANGELOG.md`,
    `LICENSE`, `NOTICE`, `THIRD_PARTY_NOTICES`. `pack.test.ts` runs `pnpm pack --dry-run --json` after a build and
    asserts those paths (FR-030). It lives in `test/build/` (`elements-build`, R-11).
  - `readme.test.ts` checks the statements listed in the spec's documentation-test paragraph, one assertion per
    statement, on the model of 003's readme test.

## R-16 Install scripts: approving `rs-module-lexer` (operator decision)

- **Decision** (operator decision on PLAN-A11Y-SECURITY-1-005, 2026-11-10: option (c), a new option): the analyzer of
  R-06 is kept, and the install script of `rs-module-lexer` is **approved** rather than denied. This changes the
  repository's supply-chain policy, scoped to exactly one package at one version:
  - `pnpm-workspace.yaml`: `allowBuilds` gains `"rs-module-lexer@2.9.0": true` beside `esbuild: false`; the policy
    comment states the one approval and why. The version is in the key, so pnpm 12.16.1 runs the script only for
    that exact version (its `allowBuilds` entries become `onlyBuiltDependencies` specs, and a `name@version` spec
    matches only that version; read in pnpm 12.16.1's `createAllowBuildFunction`). A bare `rs-module-lexer: true`
    would approve every later version.
  - The `pins` gate rule (`gates/lib/pins-rules.ts` `workspaceFindings`, rule `allow-builds`): an entry set to `true`
    is a finding unless its key is in the gate's approved list, which holds exactly `rs-module-lexer@2.9.0`. Every
    other `true` entry (another package, `rs-module-lexer` without a version, or another version of it), a list form
    and `dangerouslyAllowAllBuilds` stay findings as today; `false` entries stay allowed. The list is a constant in
    gate source, so widening it is a reviewed gate change (001 R-04: "Adding an entry to `allowBuilds` needs a change
    to the pins gate, so it is reviewed as a gate change"). Tests first: `gates/test/pins-rules.test.ts` and
    `gates/test/pins.test.ts` gain the approved entry passing and the unpinned and other-version entries failing.
  - Plants (`gates/plants/pins/`, `workspace` form): pass `pass-approved-build` (a matching workspace whose
    `allowBuilds` holds `"rs-module-lexer@2.9.0": true`); fail `fail-allow-builds-unpinned-approval`
    (`rs-module-lexer: true`; finding `allow-builds` naming `rs-module-lexer`) and `fail-allow-builds-other-version`
    (`"rs-module-lexer@2.9.1": true`); the existing `fail-allow-builds-entry` (`esbuild: true`) stays. The `pins` row of
    `gates/README.md` names the approval.
  - The 001 record: an amendment note is added to `specs/001-repository-foundation/research.md` R-04 (dated, citing
    this entry and the operator decision), stating that the allow-list is no longer empty but holds exactly
    `rs-module-lexer@2.9.0`, which supersedes R-04's "no dependency runs one" and FR-027's "empty allow-list" for that
    one entry; the rest of the policy (release age, no other install script, the gate change rule) is unchanged.
  - `fsevents` 2.3.3 is **not** approved and gets no entry: it is already in the lockfile today through the existing
    tooling, has `os: ["darwin"]` so pnpm never installs it on Linux (this container, CI), the analyzer does not need
    it (it serves file watching, which the gate does not use), and the operator approved it only "if needed".
- **What the approved script does** (read from the published `rs-module-lexer@2.9.0` `postinstall.js`): it loads the
  native binding of the platform (`@xn-sakina/rml-<platform>` 2.9.0, an optional dependency that pnpm installs from the
  lockfile) and, if that loads, exits doing nothing. Only when no binding loads and no wasm package is present does
  it run `npm install --no-save … @xn-sakina/rml-wasm@2.9.0` from the network, outside the lockfile and the
  release-age policy. Linux x64 and arm64 (glibc and musl), macOS and Windows have bindings, so the fallback is
  unreachable on the platforms this repository runs on. Residual risk, recorded in the README's `pins` row: on a
  platform without a binding the script would fetch outside the lockfile.
- **Verification** (phase 1 setup and the phase 2 spike): after `pnpm install` with the approval, the binding loads
  and the script made no `npm install` (no `npm-install` directory left and no `@xn-sakina/rml-wasm` in
  `node_modules`), in this container (Node 22.23.4) and on CI's Node 26.13.0; `pnpm run setup:offline` still succeeds
  with no network; `gate:pins` passes on the repository.
- **Constitution**: no principle or constitution rule is touched. The constitution requires exact pins and a committed
  lockfile, which hold (the approval is version-exact); the empty install-script allow-list is 001's policy (FR-027,
  R-04, an operator decision at 001's plan squad), which the operator now amends for one entry.
- **Alternatives**: (a) deny the scripts (`rs-module-lexer: false`, `fsevents: false`) and require the analyzer to
  work without them; (b) our own generator on the TypeScript 6 compiler API (no new tree, more code to
  mutation-test); an unversioned approval. Not chosen by the operator / rejected (unversioned).
