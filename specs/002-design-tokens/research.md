# Research: Design Tokens (002)

Each entry: **Decision**, **Rationale**, **Alternatives considered**. R-numbers are cited from `plan.md`, the
contracts and the tasks.

## R-01 One token source, three generated outputs

**Decision**: The token source is one typed TypeScript module, `packages/tokens/src/source.ts`: an array of token
records (data-model.md § Token) holding name, group, light value, dark value or one value, the source token of a
derived value, use, and for a foreground colour its contrast kind and intended grounds (A.8). A generator,
`packages/tokens/src/generate.ts` (pure functions, no I/O), turns it into the stylesheet text, the JSON export
object and the name list. `packages/tokens/scripts/build.ts` (run by the package's `build` script after `tsc`)
writes `dist/tokens.css`, `dist/tokens.json` and copies `fonts/` to `dist/fonts/`. `src/index.ts` exports the typed
name list and the JSON data (FR-009).

**Rationale**: FR-008 requires one source of truth for the stylesheet and the JSON export, and that the gates derive
the required pairs from the intended grounds recorded in it. A TypeScript module gives the type checker the token
name union (`TokenName`) that FR-009 needs, runs directly under the pinned Node (type stripping, as `gates/bin/*.ts`
already does), and is in reach of mutation testing because the generator is package source.

**Alternatives considered**: a JSON or YAML source (no name type without a second generation step; JSON cannot carry
comments recording the operator decisions); Style Dictionary or another token tool (a new dependency for a
transformation of about a hundred lines, and its output format is not ours to control under strict CSP).

## R-02 Theme selection in CSS

**Decision**: The stylesheet has, in this order:

1. `:root { … }` with every theme-independent token and the **light** values of the colour and elevation tokens;
2. `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { …dark values… } }`;
3. `:root[data-theme="dark"] { …dark values… }`;
4. `@media (prefers-reduced-motion: reduce) { :root { --ocelle-motion-fast: 0ms; --ocelle-motion-base: 0ms; } }`.

Derived tokens are written as `var(--ocelle-<source>)` (FR-002) and appear once, in block 1, except where the source
is theme-dependent and the derived token is also listed per theme in the source (none today: `color-focus` and
`color-current` reference `color-accent-strong`, which changes per theme, and `var()` resolves at use, so one
definition in block 1 follows the theme).

**Rationale**: Block 1 makes light the value with no preference (FR-005). Block 2 applies dark for a dark system
unless `data-theme="light"` overrides. Block 3 applies dark whatever the system says. `data-theme` with any other
value, or on another element, matches neither selector, so the system decides (spec edge case). The selectors have
equal or higher specificity than block 1 and come later, so no `!important` is needed.

**Alternatives considered**: `light-dark()` with `color-scheme` (would make the theme follow `color-scheme`, which
is set by base styles, #6, and cannot express "light with no preference" independently of the UA); duplicating the
dark block in the media query and the attribute selector without `:not()` (gives the wrong answer for system dark
with `data-theme="light"`).

## R-03 Testing the six theme conditions

**Decision**: Theme, motion and font behaviour are tested in Chromium driven by Playwright from Node tests in the
`tokens` Vitest project (`packages/tokens/test/browser/*.test.ts`), using the pinned `playwright` 1.64.1 and the
existing `OCELLE_CHROMIUM_PATH` override. A small static server (Node `http`, no dependency) serves the built
`dist/` and a fixture page with a configurable `Content-Security-Policy` header. Each test sets the condition with
`page.emulateMedia({ colorScheme, reducedMotion })` and reads `getComputedStyle(document.documentElement)
.getPropertyValue(name)` for every token. "No preference" uses `colorScheme: 'no-preference'`; in addition a node
test on the generated stylesheet text asserts that the light values are in the unconditioned `:root` block and the
dark values only under `prefers-color-scheme: dark` or `[data-theme="dark"]`, so the no-preference condition is
covered even if a Chromium version folds `no-preference` into `light` (FR-006).

Computed custom-property values are compared after normalisation: whitespace collapsed; colours compared as
parsed RGBA (the computed value of a custom property is its specified token stream, so `#F1EEE8` stays as written,
but normalising protects against serialisation differences); `var()` references resolved by reading the source
token's computed value.

**Rationale**: Vitest browser mode (used by the `elements` project) has no per-test media emulation; Playwright's
`emulateMedia` covers colour scheme and reduced motion directly, and request recording (FR-015) and CSP violation
events (`securitypolicyviolation`, and console messages) are first-class in Playwright.

**Alternatives considered**: Vitest browser instances with `context: { colorScheme }` per instance (six instances of
the whole project, and no reduced-motion or CSP-header control per test); jsdom (does not implement media queries or
CSS custom-property cascade).

## R-04 The light `color-chrome-hover` (operator decision SPEC-2-01)

**Decision**: light `color-chrome-hover` = **`#211D18`**.

Measure of "nearest" (spec Assumptions): keep the hue and saturation of `#2A261F` in HLS and take the highest
lightness, in steps of 0.1 % of the original lightness, at which `color-focus` (`#8F5E0F`) has at least 3:1
(unrounded) on it; round each channel to the nearest integer. Results (WCAG 2.x, computed 2026-11-03):

| Pair or measure | Value |
|---|---|
| `color-focus` on `#211D18` | 3.012 (≥ 3) |
| relative luminance of `#211D18` | 0.0127 (≤ 0.05, FR-019 (e)) |
| `color-chrome-ink` on it | 13.84 (≥ 4.5) |
| `color-chrome-muted` on it | 6.22 (≥ 4.5; recorded figure for this pair in light, replacing #5's 5.6) |
| **`#211D18` against `color-chrome` `#15130F`** | **1.107:1** (#5's `#2A261F` was 1.233:1) |

**Consequence the operator should see (check 3, SPEC-3-03)**: the hover state on the chrome becomes much harder to
see (1.11:1 against the chrome, down from 1.23:1). WCAG sets no threshold for hover feedback, so no gate fails, but
the visual change is real. The plan applies the operator's decision as given. If the operator prefers a visible
hover, a hue or lightness change *upwards* cannot work (lighter grounds lower the ochre focus ring's contrast), so
the alternatives are a lighter focus colour on the chrome (a new token, which the operator declined at SPEC-2-01) or
an indicator other than the ground (for example the 3 px current bar), which is an element decision.

**Alternatives considered**: nearest by Euclidean distance in sRGB or OKLab (gives a slightly different hue for no
benefit, and is harder to explain).

## R-05 Values from the console prototype (operator decision SPEC-2-02)

**Decision**: The operator supplied a table rendering of `prototype/css/tokens.css` (console prototype v2) on
2026-11-03. It is kept in this feature as `sources/console-v2-tokens.md`
(SHA-256 `7b0a5d0c4af7d1c7fa83f2a4af130e76097f6e6283e980da704c424395d9e61a`). The following values are taken from it,
as values only (FR-026):

| Token | Light | Dark |
|---|---|---|
| `elevation-raised` | `0 2px 4px rgb(21 19 15 / 0.10), 0 12px 32px rgb(21 19 15 / 0.16)` | `0 0 0 1px var(--ocelle-color-rule-strong)` |
| `elevation-row` | `0 0 0 1px var(--ocelle-color-control-border), 0 2px 8px rgb(21 19 15 / 0.08)` | `0 0 0 1px var(--ocelle-color-control-border)` |
| `elevation-seg` | `0 0 0 1px var(--ocelle-color-control-border), 0 1px 2px rgb(21 19 15 / 0.08)` | `0 0 0 1px var(--ocelle-color-control-border)` |
| `dialog-max-inline` | `calc(100vw - 2 * var(--ocelle-gutter))` | (same) |
| `dialog-max-block` | `calc(100dvh - 2 * var(--ocelle-gutter))` | (same) |

The ring width of `elevation-row` and `elevation-seg` is **1px**. The dialog viewport units are **`vw`** (inline)
and **`dvh`** (block), as in the prototype (spec Assumptions, "Dialog size unit"); a test at a 1280 × 800 viewport
expects 1248 px and 768 px (gutter 16 px).

Where the prototype file and Appendix A differ, Appendix A (the operator's decisions in #5) wins, and nothing else
is taken from the file: the prototype's theme rule (light whatever the system), `radius-3`, `color-proto*`, the
mockup font sizes, and its use of `color-rail` for the top bar are all superseded by #5.

These values are added to the spec's Appendix A (A.1 and A.5) by the squad fix, so that Appendix A stays the single
reference (SC-001).

**Rationale**: the operator's answer to SPEC-2-02; the file gives every value the spec lacked, and the hash fixes the
version read.

## R-06 Font vendoring

**Decision**: `packages/tokens/fonts/SchibstedGrotesk-wght.woff2` and `packages/tokens/fonts/OFL.txt`, fetched once
by the implementer from `https://github.com/schibsted/schibsted-grotesk` at the commit `d485f61f` resolves to, and
committed. `packages/tokens/fonts/SOURCE.json` records the repository, the full 40-character commit id, the upstream
path of each file and its SHA-256. A node test recomputes both hashes and compares (FR-011). The build copies
`fonts/` to `dist/fonts/`; `tokens.css` declares:

```css
@font-face {
  font-family: "Schibsted Grotesk";
  src: url("./fonts/SchibstedGrotesk-wght.woff2") format("woff2");
  font-weight: 400 900;
  font-style: normal;
  font-display: swap;
}
```

`font-display: swap` keeps text visible with a fallback until the font loads, and is what makes the "no `font-src`"
case (US2 scenario 6) render in a fallback family. If `d485f61f` does not resolve to exactly one commit upstream, or
the upstream tree has no variable `wght` WOFF2 at that commit, the phase stops and asks the operator (FR-011).

**Rationale**: constitution IV (vendored, no CDN) and the OFL's condition that the licence travel with the font.

**Alternatives considered**: `@fontsource-variable/schibsted-grotesk` from npm (a third party's repackaging, a
runtime dependency, and a different provenance than #5 names).

## R-07 Contrast gate

**Decision**: `gates/bin/contrast.ts` with `gates/lib/wcag.ts` (sRGB hex → relative luminance → ratio, WCAG 2.x
formula with the 0.04045 threshold) and `gates/lib/token-source.ts` (loads `packages/tokens/src/source.ts` under
`--root` by dynamic import and validates it). The pair list is `packages/tokens/contrast/pairs.json`
(contracts/contrast-pairs.md), kept outside `src/` so it is neither published nor mutated, and figures are strings
so that their precision is part of the data (`"5.3"`, `"3.02"`). Rules, in order (contracts/gate-contrast.md):

1. list unreadable, not JSON, not the schema, or empty → exit 2;
2. each entry: unknown token → `unknown token`; computed ratio outside the figure's precision interval →
   `figure mismatch`; `checked` entry below its threshold (not exempt) → `below threshold`; `excluded` entry without
   a non-empty reason → `excluded without reason`; **`excluded` entry that is a required pair →
   `required pair excluded`** (check 3, SPEC-3-02: exclusion is allowed only for pairs outside the required set;
   to stop requiring a pair, the token source's intended grounds must change, which is a visible design change);
3. each required pair (derived from the intended grounds, A.8) absent from the list → `missing required pair`;
4. zero entries checked for a theme → exit 2.

On success it prints `contrast: <n> pairs checked in light, <m> in dark (<r> required per theme)`.

Translucent values (`color-overlay`) are rejected as a foreground or ground of any pair (`unknown token` is not
right; the finding is `not an opaque colour`), so they cannot be checked by mistake.

Recorded figures: A.7's figures are entered from Appendix A by hand; figures for other pairs are entered from the
first computation, which `node gates/bin/contrast.ts --print` lists. Any later change of a figure that came from A.7
needs the operator's approval in the review (spec edge case).

**Rationale**: the required set comes from the token source, so the pair list cannot shrink it (FR-016); the
`required pair excluded` rule closes the loophole check 3 found while keeping the A.9 exclusions, none of which is a
required pair.

**Note for the squad**: SPEC-3-02's suggested fix contradicts the sentence of FR-016 that allows a required pair to
appear as excluded. Since no pair in A.8 is excluded any more, the plan takes the stricter reading; the squad fix
amends that sentence of FR-016 accordingly.

## R-08 Brand-rules gate

**Decision**: `gates/bin/brand-rules.ts` checks rules (a) to (g) of FR-019 on the token source and on the stylesheet
text produced by the root's own generator (`packages/tokens/src/generate.ts`, imported under `--root`), so it needs no
build. Rule (g) parses that stylesheet with PostCSS and fails on any `forced-color-adjust: none` declaration and any
`@media (forced-colors: …)` block that sets an `--ocelle-color-*` property. Rule (f) checks that the generated
stylesheet has a `prefers-reduced-motion: reduce` block setting exactly `motion-fast` and `motion-base` to `0ms`. On
success: `brand-rules: 7 rules checked`. Its plants change `source.ts` or `generate.ts` in the plant's tree.

**Alternatives considered**: checking the built `dist/tokens.css` (needs a build before the gate and a plant could not
change the generator's output without a build step in the plant runner).

## R-09 Unknown-token style-lint rule

**Decision**: `gates/stylelint/token-only.ts` gains a check: every `var(--ocelle-<name>)` (also inside `calc()` and as
a `var()` fallback) whose name is not in the token name list fails with `unknown token --ocelle-<name>`. The list is
read from the root's `packages/tokens/src/source.ts` at plugin load. Definitions of tokens (`--ocelle-*:` declarations)
stay outside the rule's scope because `packages/tokens` is not in the style-lint scope at all. Plants:
`gates/plants/style-lint/fail-unknown-token/` (`var(--ocelle-color-canvs)` in an element style template) and
`pass-known-token/`.

## R-10 Storybook under strict CSP (operator decisions SPEC-1-05, SPEC-3-01)

**Decision**: A private workspace package `storybook/` (added to `pnpm-workspace.yaml`) with Storybook **10.6.4**
(`storybook`, `@storybook/html-vite`; the newest release at least seven days old on the day of install, so it passes
`minimumReleaseAge`; the implementer pins the version actually installed). Stories are plain-DOM render functions
(no Lit) in `storybook/stories/tokens.stories.ts`, one story per group, generated from the token data of
`@ocelle/tokens` (FR-023). Swatches get their colour from a stylesheet generated at build from the same source
(`.ocelle-swatch[data-token="color-canvas"] { background: var(--ocelle-color-canvas) }`), never from a style
attribute. A Storybook toolbar global sets `data-theme` on the preview's `<html>`. The Storybook UI theme sets
`fontBase` and `fontCode` to `--ocelle-font-sans`'s family list (no monospace, prefix gate).

**Known risk, met by a spike first**: Storybook's manager and preview inject `<style>` elements at run time (Emotion
CSS-in-JS), and the built HTML has inline scripts and styles. Under `style-src 'self'` with no nonce or hash, injected
`<style>` elements are blocked. Constitution IV and the operator's answers allow no exception. The first task of the
Storybook phase is therefore a spike that builds the pinned Storybook, post-processes its output
(`storybook/scripts/externalise.ts`: inline `<script>` and `<style>` moved to same-origin files, hashed names), serves
it with the constitution's CSP header plus `font-src 'self'`, and records the CSP violations. Techniques the spike
tries, in order: (1) Emotion's cache configured to insert rules through `CSSStyleSheet.insertRule` into adopted
constructable stylesheets (not governed by `style-src`); (2) the preview alone (`iframe.html`), without the manager
UI, as the token reference; (3) any setting of the pinned Storybook that disables run-time style injection. If none
gives zero violations, the phase **stops and asks the operator** (FR-023, SPEC-3-01); no Complexity Tracking
exception is taken without the operator.

The run-time check is a browser test (`storybook/test/csp.test.ts`, Playwright from Node, R-03's server) that opens
the built Storybook with the CSP header, visits each group story in light and dark, and asserts zero
`securitypolicyviolation` events, zero requests outside the origin, and that each story lists exactly its group's
tokens (FR-023, US1 scenario 11).

The `csp` and `prefix` gates widen their scope from `packages/*/dist/` to also cover `storybook/dist/` (gates.json
`scope`, `isBuiltOutput`, gates/README.md), with a `csp` fail plant (inline script in `storybook/dist/index.html`)
and pass plant (external script there).

**Alternatives considered**: the spec's option (b) at SPEC-3-01 (static scan only; declined by the operator); a
hand-written token reference page instead of Storybook (declined at FR-023 by the operator's choice of Storybook).

## R-11 Package exports and build

**Decision**: `@ocelle/tokens` `package.json`:

```json
"exports": {
  ".": "./dist/index.js",
  "./tokens.css": "./dist/tokens.css",
  "./tokens.json": "./dist/tokens.json",
  "./fonts/*": "./dist/fonts/*"
},
"files": ["dist", "CHANGELOG.md"],
"scripts": { "build": "tsc -p tsconfig.json && node scripts/build.ts" }
```

The package stays `private: true` and `0.0.0` until the release (#11); `CHANGELOG.md` gets an "Unreleased — Added"
section listing every token name (FR-025). `THIRD_PARTY_NOTICES` gains the font entry (FR-014).

## R-12 Theme-independence and computed values of derived tokens

**Decision**: A derived token's expected value in the tests is the resolved value of its source in the same theme
condition (`--ocelle-gutter` resolves to `1rem`); the JSON export holds resolved values (FR-008) and also the source
name (`"ref": "space-4"`), so tools can keep the link.

## R-13 kitty-mission-ui `--sk-*` roles

**Decision**: User Story 4 reads the `--sk-*` role names from the kitty-mission-ui repository, which needs read
access in the implementing session (operator decision, 2026-11-03). The table is
`specs/002-design-tokens/sk-mapping.md` (documentation, outside the packages; constitution I reading in plan.md), with
a header recording the kitty-mission-ui commit read. A node test (`packages/tokens/test/sk-mapping.test.ts`) parses
the table, checks 55 rows and that every `--ocelle-*` name is a token. The test file lives under `packages/tokens/test/`
and the `--sk-` text lives only in the table, which the prefix gate does not scan; the test refers to the role column
by position, never by writing an `--sk-` literal. If the role count is not 55, or the repository cannot be read, the
phase stops and asks the operator (FR-024).

## R-14 Closing the 001 Complexity Tracking item

**Decision**: 001's plan lists "Contrast gate absent — sunset when #5 merges". This feature's `plan.md` records the
sunset (Complexity Tracking, "Closed from 001"); 001's plan is not edited (feature directories are the record).
