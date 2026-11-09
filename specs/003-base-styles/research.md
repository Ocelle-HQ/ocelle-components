# Research: Base Styles (003)

Each item states the decision, why, and what else was considered. "Verify in the spike" marks a browser behaviour the
first phase measures before the tests that depend on it are written (phase 2, T-spike); if a measurement disagrees,
the implementer stops and the orchestrator asks the operator.

## R-01 Package layout and build

**Decision**: the stylesheet is hand-written CSS at `packages/styles/src/base.css`. A build script
`packages/styles/scripts/build.ts` copies it unchanged to `dist/base.css`, in the shape of
`packages/tokens/scripts/build.ts`: a pure `buildPlan(sourceDir)` returning the entries, and an I/O `build()` whose
lines carry the I/O-boundary Stryker records naming the covering test. `package.json` gets
`"build": "tsc -p tsconfig.json && node scripts/build.ts"`, `"exports": { ".": "./dist/index.js", "./base.css":
"./dist/base.css" }` and `"files": ["dist", "CHANGELOG.md", "README.md"]`. `src/index.ts` keeps exporting nothing.

**Why**: the source is linted where it lives (`packages/styles/**/*.css` is in the style-lint scope; built `dist` is
ignored), the shipped file is byte-identical to the linted one, and the copy step mirrors the tokens package, so the
Prefix and csp gates see `dist/base.css` after `pnpm -r build` as they do in CI.

**Alternatives**: generating the CSS from TypeScript (like `css()` in tokens): rejected, nothing is computed and a
generator would put the CSS out of the lint's reach. Exporting `src/base.css` directly: rejected, `files` would ship
source and the build contract of 001 expects `dist`.

## R-02 Hook names and values (FR-004, FR-005)

**Decision**: four attributes, one per hook:

| Hook | Attribute | Allowed values |
|---|---|---|
| compact | `data-ocelle-density` | `compact`; `regular` returns a nested region to the regular scale |
| value | `data-ocelle-value` | empty (muted ink) or `ink` (body ink) |
| prose | `data-ocelle-prose` | empty |
| identifier wrap | `data-ocelle-wrap` | `anywhere` |

Any other value of an attribute has no effect. The README lists exactly these.

**Why**: `density` and `wrap` carry a value, so later values (`density="comfortable"`, `wrap="path"`) are additions,
a MINOR change (constitution VII), not new attributes. `prose` and `value` are presence attributes because there is
nothing to choose, except the value's ink variant.

**Alternatives**: classes (`ocelle-prose`): excluded by FR-005 unless the operator approves at a fork; no reason
found. One attribute `data-ocelle` with space-separated tokens: rejected, one attribute per hook keeps every selector
at one attribute.

## R-03 Selectors and the specificity bound (FR-025)

**Decision**:
- Every base-layer rule wraps its whole selector in `:where()`, so it has specificity (0,0,0). This covers the reset,
  element defaults, `:root`, `:focus-visible` and the `forced-colors` rules.
- Every hook rule is one attribute selector with the rest in `:where()`, for example
  `[data-ocelle-prose] :where(h1)`. That gives (0,1,0), under the (0,1,1) bound.
- Order in the file decides between equal hook rules: base layer, then compact, then value, then prose, then wrap.
  That order makes the prose hook win over the compact hook on one element (FR-024).

**Why**: (0,0,0) means any host rule wins, which the spec's "easy to override" asks for; one attribute per hook rule
keeps the hooks predictable. The "same element" rule needs no extra selector because both rules have equal
specificity and prose comes later.

**Alternatives**: `@layer`: considered; it would also make host rules win, but a host that itself uses layers could
then lose to the base layer depending on layer order. `:where()` has no such interaction. Bare element selectors at
(0,0,1): allowed by FR-025 but not needed.

## R-04 The compact hook on the root (FR-012, User Story 2 scenario 4)

**Decision**:
- `[data-ocelle-density="compact"]:where(:not(html))` sets the compact size and line height on any element except the
  root.
- `[data-ocelle-density="compact"] > :where(body)` sets them on the body when the hook is on `<html>`.
- The root's own font size is never set.
- `[data-ocelle-density="regular"]` sets the regular size and line height.

All of these are (0,1,0).

**Why**: setting `font-size` on `<html>` rescales every `rem` token, so `--ocelle-target-min` would drop from 44 px to
38.5 px (SPEC-1-01).

## R-05 Focus ring without tokens (FR-009, User Story 1 scenario 6)

**Decision**: longhands, not the shorthand:

```css
:where(:focus-visible) {
  outline-style: solid;
  outline-width: var(--ocelle-focus-width);
  outline-color: var(--ocelle-color-focus);
  outline-offset: var(--ocelle-focus-offset);
}
```

Under `@media (forced-colors: active)`, `outline-color: Highlight`.

**Why**: in Chromium the shorthand `outline: var(…) solid var(…)` is invalid at computed-value time when a variable is
missing, so the whole declaration drops to `outline-style: none` (spec check 2, SPEC-2-12). With longhands only the
width and colour fall back, and `outline-style` stays `solid`. `Highlight` is a system colour keyword, which the
token-only lint allows.

## R-06 The table scroll box without a wrapper (FR-017, operator decision SPEC-3-01)

**Decision**: `[data-ocelle-prose] :where(table) { display: block; overflow-x: auto; max-inline-size: 100% }`. The
rows, header and cells keep their table display, so an anonymous table box lays them out inside the block. Cells get
`min-inline-size: var(--ocelle-measure-cell)`.

**Why**: this is the only no-wrapper mechanism that gives the table its own scroll box. Spec check 3 measured in
Chromium 153 that such a box is a tab stop when it has no focusable content, and that Tab lands on a link inside it
otherwise, from which the arrow keys scroll it. That is the behaviour the operator chose.

**Verify in the spike**:
1. In the accessibility tree (CDP `Accessibility.getFullAXTree`), the table with `display: block` keeps role `table`,
   its `row`, `columnheader` and `cell` nodes, and its `caption` as the accessible name. Chromium has kept table
   semantics for `display: block` since it built the tree from the DOM table, but this is measured, not assumed.
2. A cell with `min-inline-size: 12ch` is at least 12ch wide in the anonymous table layout. If Chromium ignores
   `min-inline-size` on cells, the alternative is `min-inline-size` on the cell's content, through
   `[data-ocelle-prose] :where(th, td)`, with `inline-size` left to the table algorithm; the spike records which one
   works.

If (1) fails, the spec's fork applies (FR-017): the optional wrapper goes to the operator.

**Alternatives**: `overflow-x: auto` on the prose container: rejected, the whole document would scroll. A wrapper
`<div>`: excluded unless (1) fails.

## R-07 Line heights as tokens (FR-002)

**Decision**: the rule `ocelle/token-only` gets a secondary option, `lineHeight: "token"`. With it, a `line-height` or
`font` declaration whose line height is a unitless number is raw. Unitless numbers stay allowed for `flex`,
`z-index`, `opacity` and `order`. `stylelint.config.ts` gets an override,
`{ files: ["packages/styles/**/*.css"], rules: { "ocelle/token-only": [true, { lineHeight: "token" }] } }`. Element
styles keep the 002 behaviour.

The new plant `gates/plants/style-lint/fail-styles-literal-line-height` puts `line-height: 1.65` in
`packages/styles/src/x.css` and expects one `ocelle/token-only` finding. The existing `pass-line-height` plant is in
`packages/elements` and stays a pass.

**Why**: FR-002 asks for the line-height tokens to be used, and a browser test cannot tell a token from a literal.
Scoping the option keeps 002's element contract unchanged.

## R-08 New tokens (FR-021, operator decision SPEC-1-11)

**Decision**:

| Token | Group | Value | Use |
|---|---|---|---|
| `--ocelle-line-height-compact` | type | `1.5` | compact scale (#531) |
| `--ocelle-line-height-prose` | type | `1.65` | prose running text (#519) |
| `--ocelle-font-size-subhead` | type | `1.125rem` | prose `h2`, 18 px (#519) |
| `--ocelle-measure-reading` | shell | `68ch` | prose paragraph measure (#519) |
| `--ocelle-measure-cell` | shell | `12ch` | prose table cell floor (#519) |

The token count goes from 109 to 114. No colour token is added. The colour pairings the prose family uses are:
- link and link-hover on canvas, and ink on inset (code);
- ink-soft on canvas (block quotes), and ink-muted on canvas (the value style).

Each of these is already a required pair of 002 (A.8), so no new contrast pair is needed. The phase that adds a token
checks this against `packages/tokens/contrast/pairs.json`.

**Why**: the names follow 002: `line-height-<use>`, `font-size-<name>` for an off-scale size (like `font-size-fact`),
and `measure-<use>` in the shell group. `subhead` names what it is in the prototype rather than "h2", so an element
can use it too.

**Alternatives**: `font-size-h2`: rejected, it ties a token to one element. A new group `prose`: rejected, the 002
groups are a closed set tested by `validateSource`.

**Where a token is added**, per the 002 test layout:
- `packages/tokens/src/source.ts` (record);
- `packages/tokens/test/expected.ts` (transcribed value and probe, by hand);
- `packages/tokens/CHANGELOG.md` (the Unreleased list is checked against `expectedTokens`);
- the tokens README table where it lists groups;
- the Storybook story of its group, which is checked by the Storybook csp test.

## R-09 Browser test harness (FR-022)

**Decision**: a new Vitest project, `styles-browser` (node environment, Playwright driven directly, like
`tokens-browser`), for `packages/styles/test/browser/**/*.test.ts`. It is excluded from mutation runs like
`tokens-browser`.

`packages/styles/test/browser/serve.ts` writes a temporary directory and serves it with the CSP header
`default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'`. The directory holds:
- `tokens.css`, from the token generator;
- `base.css`, copied from `src`;
- the vendored fonts;
- the fixture pages from `packages/styles/test/fixtures/*.html`. These have no inline style or script; an extra
  stylesheet is linked only where a guard needs a planted rule.

It reuses `launch`, `collectViolations` and `violations` from `packages/tokens/test/browser/serve.ts` by relative
import.

The emulation:
- themes with `emulateMedia({ colorScheme })` and `data-theme` set through `page.evaluate`, as in 002;
- forced colours with `emulateMedia({ forcedColors: "active" })`, new in this repository;
- 200% zoom as a 640 px CSS viewport at `deviceScaleFactor: 2`, the CSS-pixel equivalent of a 1280 px window at 200%;
- 320 px as the viewport width;
- focus with `page.keyboard.press("Tab")` and `ArrowRight`;
- the accessibility tree with a CDP session (`Accessibility.getFullAXTree`).

**Copy test**: select the node's contents with the Selection API and read `getSelection().toString()`. Chromium
serialises the rendered text, so `text-transform` and `white-space` collapsing change it, which is what the copy
guards need.

## R-10 Guards and their plants (SC-002)

**Decision**: a guard ("does not") shares its test with the positive assertion it guards. Each test reads its
observations through a helper that returns a list of problems, for example `proseScopeProblems(page)`. The guard's
plant is a second fixture stylesheet that contains the defect. A plant test loads the page with that stylesheet and
asserts that the same helper reports the expected problem. This is how a browser test is shown able to fail without
a gate. The source-level checks (R-11) are unit tests whose plants are fixture strings.

| Guard | Plant |
|---|---|
| list semantics, control borders (FR-007) | `ul { list-style: none }` with `ul { display: contents }`; `button { border: 0 }` |
| pointer click shows no ring (US1-2) | `:focus { outline-style: solid }` |
| motion, `forced-color-adjust` (US1-3) | `transition: color 1s`; `animation-name: x`; `forced-color-adjust: none` |
| specificity, class (US1-8) | `#x p {}`; `.x {}` |
| root size, target-min, focus ring under compact on `<html>` (US2-4) | `[data-ocelle-density="compact"] { font-size: var(--ocelle-font-size-sm) }` without `:not(html)` |
| prose outside its container (US3-5) | `p { line-height: var(--ocelle-line-height-prose) }` |
| table that fits is not a tab stop (US3-3) | `[data-ocelle-prose] :where(table) { overflow-x: scroll }` |
| `pre` copy (US3-8) | `pre { white-space: normal }` |
| wrap is opt-in (US4-2) | `* { overflow-wrap: anywhere }` |
| no ellipsis (US4-1) | `[data-ocelle-wrap] { text-overflow: ellipsis; overflow: hidden; white-space: nowrap }` |
| identifier copy (US4-3) | `[data-ocelle-wrap] { text-transform: uppercase }` |
| FR-020's list of forbidden properties | the source-level check reads the hook's declarations; plants: `word-break: break-all`, `hyphens: auto` |
| literal line height (FR-002) | the style-lint plant of R-07 |

## R-11 Source-level checks (User Story 1 scenarios 3, 5 and 8; FR-010, FR-011, FR-020, FR-025)

**Decision**: unit tests in the `styles` project parse `dist/base.css` (built in a `beforeAll` with `buildPlan`, no
I/O) with PostCSS. They report:
- any declaration whose property is or starts with `transition` or `animation`, or is `scroll-behavior`;
- `forced-color-adjust: none`;
- any `@import` or `url(`;
- any class selector;
- any selector over its specificity bound;
- any property from FR-020's forbidden list on a `data-ocelle-wrap` rule.

Specificity is computed with `postcss-selector-parser`. It is already in the lockfile through stylelint, and becomes
an explicit pinned devDependency of the root (the pins gate requires that).

**Why**: these are properties of the file, not of a page, and are cheapest and most exact at the source.

## R-12 Storybook (FR-023)

**Decision**:
- `storybook/scripts/swatches.ts` `writeGenerated` also copies `packages/styles/src/base.css` to
  `.generated/base.css`.
- `.storybook/preview-head.html` links it after `tokens.css`.
- A new `storybook/stories/base.stories.ts` (title "Base styles") has four stories: Base page, Compact screen (compact
  and value hooks), Prose document and Identifier wrap. Each returns escaped markup from
  `storybook/stories/render.ts`'s new `renderFamily(name)` with no style attributes.

The tests to update are `swatches.test.ts` (the directory listing), `stories.test.ts` and the integration
`csp.test.ts`. The csp test's `groups` and its document count gain the four stories, which must show zero violations
and no monospace.

`storybook/.storybook/preview.css` keeps its own `pre, code, kbd, samp` rule for Storybook's error displays.

## R-13 Measures in `ch` and the line-height pixel values

**Decision**: the tests compare computed values at the default 16 px root.
- The prose line height 1.65 × 16 px = 26.4 px, and the compact 1.5 × 14 px = 21 px.
- `68ch` and `12ch` are compared against the width of `"0"` in the element's font, measured in the page with a canvas
  `measureText`. The measure is a maximum, so a paragraph's box is at most 68 × that width (±1 px).

## R-14 Documentation

**Decision**:
- `packages/styles/README.md` covers:
  - the link order (`tokens.css`, then `base.css`) and the host CSP;
  - the four hooks with their values (R-02);
  - each family, what it styles and its tokens;
  - the rule that prose wins over compact on one element;
  - a table mapping kitty-mission-ui's E-23, E-37 and E-39 to the hooks and tokens that replace them (SC-006).
- `packages/styles/CHANGELOG.md` gets `## Unreleased` / `### Added`, naming `base.css` and the four attributes.
- `packages/styles/test/readme.test.ts` checks each statement, as the tokens readme test does.
- The tokens README sentence on `color-scheme` ("the base styles (#6) apply it…") becomes "`@ocelle/styles`
  `base.css` applies it", and its readme test changes with it.
