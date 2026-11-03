# Research: Design Tokens (002)

Each entry: **Decision**, **Rationale**, **Alternatives considered**. R-numbers are cited from `plan.md`, the
contracts and the tasks.

## R-01 One token source, three generated outputs

**Decision**: The token source is one typed TypeScript module, `packages/tokens/src/source.ts`: an array of token
records (data-model.md § Token) holding name, group, light value, dark value or one value, the tokens a derived value
references, and for a foreground colour its contrast kind and intended grounds (A.8). Each record's use (Appendix A's
"Use" column) is a comment beside it, not a field (operator decision 2026-11-03, squad round 1,
PLAN-TESTABILITY-1-003 (a)): nothing reads it, and as data it would only be a set of surviving string mutants. A
generator, `packages/tokens/src/generate.ts` (pure functions, no I/O), turns it into the stylesheet text, the JSON
export object and the name list. `packages/tokens/scripts/build.ts` (run by the package's `build` script after `tsc`)
writes `dist/tokens.css`, `dist/tokens.json` and copies `fonts/` to `dist/fonts/`. `src/index.ts` exports the typed
name list and the JSON data (FR-009).

`build.ts` is a thin I/O boundary: an exported pure function (`buildPlan(source, fontFiles)` → the list of
`{ path, content | copyFrom }` to write) holds every decision and is imported by a node test; the few remaining I/O
lines (reading, `mkdir`, `writeFile`, `copyFile`) carry `// Stryker disable next-line all: covered by
packages/tokens/test/build.test.ts`, as `gates/bin/*.ts` does, and a process test runs the script once and checks it
writes the same text as `css()` and `json()` (R-03).

**Rationale**: FR-008 requires one source of truth for the stylesheet and the JSON export, and that the gates derive
the required pairs from the intended grounds recorded in it. A TypeScript module gives the type checker the token
name union (`TokenName`) that FR-009 needs, runs directly under the pinned Node (type stripping, as `gates/bin/*.ts`
already does), and is in reach of mutation testing because the generator is package source. `ref` and `grounds` are
typed `string` and checked by `validateSource`, because typing them with `TokenName` makes the source's type circular
(PLAN-FRESH-1-008, data-model.md).

**Alternatives considered**: a JSON or YAML source (no name type without a second generation step; JSON cannot carry
comments recording the operator decisions); Style Dictionary or another token tool (a new dependency for a
transformation of about a hundred lines, and its output format is not ours to control under strict CSP); `use` as a
field emitted in the JSON and the stories (fork option (b), not chosen: it adds public JSON surface).

## R-02 Theme selection in CSS

**Decision**: The stylesheet has, in this order:

1. `:root { … }` with every theme-independent token and the **light** values of the colour and elevation tokens;
2. `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { …dark values… } }`;
3. `:root[data-theme="dark"] { …dark values… }`;
4. `@media (prefers-reduced-motion: reduce) { :root { --ocelle-motion-fast: 0ms; --ocelle-motion-base: 0ms; } }`.

Derived tokens are written as `var(--ocelle-<source>)` (FR-002), alone or inside a larger value, and appear once, in
block 1, unless their value differs per theme in the source (`elevation-raised`, `-row`, `-seg`, whose light and dark
values differ, are in blocks 1 to 3 like any theme-dependent token). `color-focus` and `color-current` reference
`color-accent-strong`, which changes per theme, and `var()` resolves at use, so one definition in block 1 follows the
theme.

The theme-dependent token `--ocelle-color-scheme` (`light` in block 1, `dark` in blocks 2 and 3) carries the theme's
`color-scheme` keyword. The stylesheet sets no `color-scheme` property itself; base styles (#6) apply the token on the
root (operator decision 2026-11-03, squad round 1, PLAN-A11Y-SECURITY-1-004 (b); spec Assumptions, "`color-scheme`
hand-off"). The six theme-condition tests read it like the other theme-dependent tokens, but compare it as a keyword
(`light` or `dark`), not as a colour (R-03).

**Rationale**: Block 1 makes light the value with no preference (FR-005). Block 2 applies dark for a dark system
unless `data-theme="light"` overrides. Block 3 applies dark whatever the system says. `data-theme` with any other
value, or on another element, matches neither selector, so the system decides (spec edge case). The selectors have
equal or higher specificity than block 1 and come later, so no `!important` is needed. Without a theme-following
`color-scheme`, native controls, scrollbars and system colours would not follow `data-theme`, and #6 cannot compute it
because it does not repeat the selectors; the token hands it over.

**Alternatives considered**: `light-dark()` with `color-scheme` (would make the theme follow `color-scheme`, and cannot
express "light with no preference" independently of the UA); duplicating the dark block in the media query and the
attribute selector without `:not()` (gives the wrong answer for system dark with `data-theme="light"`); emitting
`color-scheme` in the tokens stylesheet's theme blocks (fork option (a), not chosen).

## R-03 Browser tests: what they serve, what they compare, what they observe

**Decision**: Theme, motion and font behaviour are tested in Chromium driven by Playwright from Node tests in the
`tokens` Vitest project (`packages/tokens/test/browser/*.test.ts`), using the pinned `playwright` 1.64.1 and the
existing `OCELLE_CHROMIUM_PATH` override.

*What is served* (PLAN-CORRECTNESS-1-002, squad round 1 verify 1): the browser suites never read a pre-existing
`dist/`, and the served files are generated **inside the test worker**, not in a Vitest `globalSetup`. Each browser
suite calls a shared helper (`test/browser/serve.ts`) in its `beforeAll`; the helper imports `css()` from
`src/generate.ts` and the source, writes the stylesheet text and a copy of `fonts/` into a per-suite temporary
directory, and starts the server on it (`afterAll` stops it and removes the directory). The reason is how the pinned
`@stryker-mutator/vitest-runner` 10.1.1 activates a mutant: it prepends a setup file to each project's `setupFiles`
that sets the active mutant in the worker (`dist/src/vitest-test-runner.js`, `dist/src/stryker-setup.js`). A
`globalSetup` runs once in the main process with no active mutant, so it would serve unmutated output. Setup files run
before the test file is loaded, so the suite's imports of `generate.ts` and `source.ts` (static mutants included) and
its `beforeAll` see the active mutant, and mutants of `css()` and value mutants of `source.ts` reach the served
stylesheet. The `tokens` project therefore has no `globalSetup` for these suites. So `pnpm test`, the `unit-tests` CI
job, tdd-check's clean worktree and Stryker's mutants all test the current source with no build step; the US1 review
checks in the Stryker report that mutants of `css()` are killed by browser suites as well as by generator tests.
One separate node test runs `scripts/build.ts` into a temporary directory and checks it writes exactly the text of
`css()` and `json()` and the font files. A small static server (Node `http`, no dependency) serves the directory and
a fixture page with a configurable `Content-Security-Policy` header. `storybook/dist/` is added to `.gitignore`.

*What is compared* (PLAN-TESTABILITY-1-001, -009): expected names and values come from the token table of
data-model.md § Expected tables, transcribed from Appendix A in the test code, never from `source.ts`. Tests assert:
the set of `--ocelle-*` names defined on `:root` (read from the stylesheet's rules through CSSOM) equals the table's
names, and each A.6 name is undefined; each colour token's computed value, parsed as RGBA, equals the table's value in
each theme condition, except `color-scheme`, which is not a colour: its computed value, trimmed, is compared as the
keyword `light` or `dark` and is never parsed as a colour (squad round 1 verify 1, PLAN-A11Y-SECURITY-1-004); each non-colour token is observed through a probe element that uses it, so the used value is
compared, not the custom property's token stream: `width`/`max-block-size` for sizes (dialog sizes at a 1280 × 800
viewport: 1248 px and 768 px), `box-shadow` for elevations, `transition-duration` for motion, `font-variant-numeric`
for `figures`, `font-family` resolution for the font tokens. Tests do not resolve `var()` themselves. Whether a derived
token is defined *by reference* (FR-002, edge case "Token derived from another") is a generator test on a fixture
source: each derived token's declaration in the stylesheet is `var(--ocelle-<ref>)` (or contains exactly its refs'
`var()`s), and changing the source token's value in the fixture changes the derived token's value in both the
stylesheet (resolved in the browser) and the JSON. Generator unit tests use fixture sources throughout, so value
mutants of `source.ts` are killed by the table tests above and not by tests that read the source.

*Theme conditions*: each test sets the condition with `page.emulateMedia({ colorScheme, reducedMotion })`. "No
preference" uses `colorScheme: 'no-preference'`; in addition a node test on the generated stylesheet text asserts
that the light values are in the unconditioned `:root` block and the dark values only under
`prefers-color-scheme: dark` or `[data-theme="dark"]`, so the no-preference condition is covered even if a Chromium
version folds `no-preference` into `light` (FR-006).

*CSP violations* (PLAN-A11Y-SECURITY-1-009): Playwright has no CSP-violation event, and the page's CSP forbids an
inline collector. Each suite injects a listener with `page.addInitScript` (not subject to the page's CSP) that records
every `securitypolicyviolation` event (`violatedDirective`, `blockedURI`) into a page global read after the run, and
cross-checks it with the console's "Refused to …" messages. Each suite has a control fixture with exactly one known
violation (an inline `<style>` under `style-src 'self'`) that must be reported once, so a broken collector fails the
suite rather than passing "zero violations".

*Font observables* (PLAN-TESTABILITY-1-008): `getComputedStyle().fontFamily` returns the declared list whether or not
the face loaded, so the font tests observe the face actually used: CDP `CSS.getPlatformFontsForNode` on a text node at
each weight (400, 500, 600, 800) must report `Schibsted Grotesk`; the recorded requests must include exactly one
same-origin request for `fonts/SchibstedGrotesk-wght.woff2` and none off-origin; `document.fonts` must report the
face `loaded` (positive control). The `figures` token is tested through the computed `font-variant-numeric` of a probe
(`tabular-nums`); digit advance widths are compared only if the vendored face's default figures are proportional
(checked once with the font feature off), since the CI fallbacks already have equal-width digits. For the no-`font-src`
case (US2 scenario 6), `CSS.getPlatformFontsForNode` must report a fallback family of `--ocelle-font-sans`, and the
collector must report exactly one violation, `font-src`, whose `blockedURI` is the woff2.

**Rationale**: Vitest browser mode (used by the `elements` project) has no per-test media emulation; Playwright's
`emulateMedia` covers colour scheme and reduced motion, and its request events record FR-015. The computed value of an
unregistered custom property is its token stream with `var()` substituted and `calc()` unevaluated, so only a probe's
used value can show `calc(100vw - 2 * var(--ocelle-gutter))` as 1248 px, and only the stylesheet text can show a
reference.

**Alternatives considered**: Vitest browser instances with `context: { colorScheme }` per instance (six instances of
the whole project, and no reduced-motion or CSP-header control per test); jsdom (does not implement media queries or
CSS custom-property cascade); serving the built `dist/` (stale locally, absent in CI, invisible to mutants).

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

These values, and R-04's `#211D18`, were added to the spec's Appendix A (A.1, A.4, A.5) by the squad fix of round 1,
so that Appendix A stays the single reference (SC-001).

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

`font-display: swap` keeps text visible in a fallback family while the font loads. It is not what makes the
"no `font-src`" case (US2 scenario 6) render in a fallback: a blocked or failed font load falls back under any
`font-display` value. If `d485f61f` does not resolve to exactly one commit upstream, or
the upstream tree has no variable `wght` WOFF2 at that commit, the phase stops and asks the operator (FR-011).

**Rationale**: constitution IV (vendored, no CDN) and the OFL's condition that the licence travel with the font.

**Alternatives considered**: `@fontsource-variable/schibsted-grotesk` from npm (a third party's repackaging, a
runtime dependency, and a different provenance than #5 names).

## R-07 Contrast gate

**Decision**: `gates/bin/contrast.ts` with `gates/lib/wcag.ts` (sRGB hex → relative luminance → ratio, WCAG 2.x
formula with the 0.04045 threshold) and `gates/lib/token-source.ts` (loads `packages/tokens/src/source.ts` under
`--root` by dynamic import and validates it). The pair list is `packages/tokens/contrast/pairs.json`
(data-model.md § Contrast pair), kept outside `src/` so it is neither published nor mutated, and figures are strings
so that their precision is part of the data (`"5.3"`, `"3.02"`). Rules, in order (contracts/gates.md), with the rule
ids of data-model.md § Gate findings:

1. list unreadable, not JSON, not the schema, or empty → exit 2;
2. each entry: unknown token → `unknown-token`; a translucent colour as foreground or ground → `not-opaque`; computed
   ratio outside the figure's precision interval → `figure-mismatch`; `checked` entry below its threshold (not
   exempt) → `below-threshold`; `excluded` entry without a non-empty reason → `excluded-without-reason`; `excluded`
   entry that is a required pair → `required-pair-excluded` (check 3, SPEC-3-02; FR-016 as amended in squad round 1:
   exclusion is allowed only for pairs outside the required set; to stop requiring a pair, the token source's
   intended grounds must change, which is a visible design change);
3. each required pair (derived from the intended grounds, A.8) absent from the list → `missing-required-pair`;
4. zero entries checked for a theme → exit 2.

On success it prints `contrast: <n> pairs checked in light, <m> in dark (<r> required per theme)`; with the
repository's values 158, 157 and 149.

The required set is pinned to the spec by a node test (`gates/test/contrast-required.test.ts`,
PLAN-TESTABILITY-1-002): it derives the required set from the real `source.ts` and asserts it equals A.8 transcribed in
the test (149 `(fg, bg, kind)` triples per theme; data-model.md § Expected tables). So removing a ground from the
source, or a mutant doing so, fails a test even though the gate would still pass.

A.8 gained 14 rows per theme in squad round 1 (operator decision 2026-11-03, PLAN-A11Y-SECURITY-1-012 (a)):
`color-current` on `color-chrome`, `color-chrome-hover`, `color-rail`, `color-accent-low` (non-text), and `color-link`
(text) and `color-focus` (non-text) on the five state `-bg` grounds. All meet their thresholds with Appendix A's
values (computed 2026-11-03: `color-current` 3.34, 3.01, 4.43, 4.31 light and 8.75, 7.18, 7.78, 6.13 dark;
`color-link` 4.86 to 5.36 light, 6.74 to 7.56 dark; `color-focus` 4.27 to 4.71 light, 6.74 to 7.56 dark).

The operator's answer of 2026-11-03 to the question that decision left open (plan.md, Decisions 7: "Rule 1
extended") adds 5 more rows per theme: `color-accent-strong` (non-text) on the five state `-bg` grounds, 4.47, 4.50,
4.70, 4.71, 4.27 light and 7.56, 6.83, 7.23, 7.37, 6.74 dark on `color-danger-bg`, `color-warning-bg`,
`color-success-bg`, `color-info-bg`, `color-neutral-bg` (computed 2026-11-03; all at least 3:1). `color-control-border`
on those five grounds becomes an excluded pair in both themes (light 3.05, 3.07, 3.21, 3.21, 2.91; dark 3.56, 3.21,
3.40, 3.46, 3.17), with the reason "#5 rule 1 extended: a control on a state ground is bordered with
`color-accent-strong`". The required set is 149 pairs per theme; the pair list has 158 entries in light and 157 in
dark (149 required plus 9 excluded in light, 8 in dark).

Recorded figures: A.7's figures are entered from Appendix A by hand; figures for other pairs are entered from the
first computation, which `node gates/bin/contrast.ts --print` lists. Any later change of a figure that came from A.7
needs the operator's approval in the review (spec edge case).

**Rationale**: the required set comes from the token source, so the pair list cannot shrink it (FR-016); the
`required-pair-excluded` rule closes the loophole check 3 found while keeping the A.9 exclusions, none of which is a
required pair; the A.8 test closes the loophole of shrinking the source's grounds.

## R-08 Brand-rules gate

**Decision**: `gates/bin/brand-rules.ts` checks rules (a) to (g) of FR-019 on the token source, on the pair list
(rule (b): the excluded entry `color-accent` on `color-canvas` in light must be present, PLAN-CORRECTNESS-1-004) and on
the stylesheet text produced by the root's own generator (`packages/tokens/src/generate.ts`, imported under `--root`),
so it needs no build. It loads the source and runs `validateSource` first; a source or generator that does not load
or throws, a source that fails validation (for example an A.6 name such as `radius-3`), or an unreadable pair list is
exit 2, not a rule finding (contracts/gates.md, PLAN-CORRECTNESS-1-005). Rule (g) parses the stylesheet with PostCSS
and fails on any `forced-color-adjust: none` declaration and on any `@media (forced-colors: …)` block that sets an
`--ocelle-color-*` property to anything other than a CSS system colour keyword (FR-018; operator decision 2026-11-03,
squad round 1, PLAN-A11Y-SECURITY-1-011 (a)); a pass plant maps a colour token to `CanvasText` there. Rule (f) checks
that the generated stylesheet has a `prefers-reduced-motion: reduce` block setting exactly `motion-fast` and
`motion-base` to `0ms`. On success: `brand-rules: 7 rules checked`. Its plants change `source.ts`, `generate.ts` or
`pairs.json` in the plant's tree; the rest comes from the configuration set (R-09).

Rule (g) guards the token output only. How rendered elements behave in forced colours (for example the `elevation-*`
rings, which vanish there as `box-shadow`) is checked by element tests under Playwright's
`emulateMedia({ forcedColors: 'active' })` in the element issues; axe-core has no forced-colours rule
(PLAN-A11Y-SECURITY-1-003, FR-018). The package README states the consequence for elements (R-15).

**Alternatives considered**: checking the built `dist/tokens.css` (needs a build before the gate and a plant could not
change the generator's output without a build step in the plant runner); failing on any colour token in a
forced-colours block (fork option (b), not chosen).

## R-09 Unknown-token style-lint rule

**Decision**: `gates/stylelint/token-only.ts` gains a check: every `var(--ocelle-<name>)` (also inside `calc()` and as
a `var()` fallback) whose name is not a token, and is not an element custom property, fails with
`unknown token --ocelle-<name>`. Definitions of tokens (`--ocelle-*:` declarations) stay outside the rule's scope
because `packages/tokens` is not in the style-lint scope at all.

*Token list* (PLAN-CORRECTNESS-1-001): read from the root's `packages/tokens/src/source.ts` at plugin load. Because
style-lint plants are `repo-tree` plants, `configurationSet` (`gates/lib/plant-repo.ts`) now copies
`packages/tokens/src/source.ts`, `generate.ts` (with its imports) and `contrast/pairs.json` into every plant
repository, test first in `gates/test/plant-repo.test.ts` with an integration test; otherwise every style-lint plant
would exit 2. This also lets the contrast and brand-rules `repository-values` plants use the real files instead of
stale copies. The rule takes the token list (and the element list) as options, so unit tests pass fixture lists. The
existing plants and tests that use the made-up `--ocelle-x` (`pass-var-token`, `pass-var-keyword-fallback`,
`fail-var-fallback`, `gates/test/token-only.test.ts`, `token-only-parts.test.ts`) move to real token names, with the
reason recorded as constitution VIII requires.

*Element custom properties* (operator decision 2026-11-03, squad round 1, PLAN-FRESH-1-007 (a); FR-010): an element's
public custom properties are named `--ocelle-<element>-<property>`, `<element>` being its tag name without `ocelle-`.
The element list is read from the custom-elements manifest of `@ocelle/elements` (`packages/elements/custom-elements.json`
under `--root`; empty while it does not exist). A reference whose name starts with `<element>-` for a listed element is
exempt. A token name equal to an element name or beginning with `<element>-` makes the rule's load fail (exit 2), so
the two namespaces cannot overlap. Restricting the rule to token group prefixes would not work: `gutter`, `figures`
and `target-min` have none.

Plants: `gates/plants/style-lint/fail-unknown-token/` (`var(--ocelle-color-canvs)` in an element style template),
`pass-known-token/`, and `pass-element-property/` (`var(--ocelle-button-gap)` with a fixture manifest declaring
`ocelle-button`).

**Alternatives considered**: exempting names declared in the same stylesheet or style template (fork option (b), not
chosen).

## R-10 Storybook under strict CSP (operator decisions SPEC-1-05, SPEC-3-01; squad round 1)

**Decision**: A private workspace package `storybook/` (added to `pnpm-workspace.yaml`) with Storybook **10.6.4**
(`storybook`, `@storybook/html-vite`; the newest release at least seven days old on the day of install, so it passes
`minimumReleaseAge`; the implementer pins the version actually installed). Stories are plain-DOM render functions
(no Lit) in `storybook/stories/tokens.stories.ts`, one story per group, generated from the token data of
`@ocelle/tokens` (FR-023). Swatches get their colour from a stylesheet generated at build from the same source
(`.ocelle-swatch[data-token="color-canvas"] { background: var(--ocelle-color-canvas) }`), never from a style
attribute. `color-scheme` is not a colour and gets no swatch rule; the colour story shows its value as text, like the
non-colour groups (squad round 1 verify 1, PLAN-A11Y-SECURITY-1-004).

*Origin of the token data and the preview's token stylesheet* (squad round 1 verify 1, PLAN-CORRECTNESS-1-002): the
package `exports` of `@ocelle/tokens` point at `dist/`, which nothing builds before the tests. So Storybook never
imports the package entry: the stories and `storybook/scripts/swatches.ts` import `packages/tokens/src/source.ts`
and `src/generate.ts` by relative path from the workspace. Before `storybook build`, a pre-build step
(`storybook/scripts/swatches.ts`, run by the Storybook build script) writes into a git-ignored generated directory
(`storybook/.generated/`, served as a Storybook static directory): the preview's token stylesheet, which is the text
of `css()` over the source; the swatch stylesheet; and a copy of `packages/tokens/fonts/`. `preview-head.html` links
both stylesheets as same-origin `<link rel="stylesheet">`. So the Storybook build and its tests need no build of
`@ocelle/tokens`, and the preview shows the current source. A Storybook toolbar global sets `data-theme` on the preview's `<html>`. The Storybook UI theme sets
`fontBase` and `fontCode` to `--ocelle-font-sans`'s family list (no monospace, prefix gate).

**No network at build** (PLAN-A11Y-SECURITY-1-008): Storybook 10.6.4 sends build telemetry to
`https://storybook.js.org/event-log` by default. `storybook/.storybook/main.ts` sets `core: { disableTelemetry: true }`
and the build script passes `--disable-telemetry`; a node test imports `main.ts` and fails unless telemetry is
disabled, and another checks the build script's flag. The build makes no request.

**Run-time CSP of the Storybook page** (operator decision 2026-11-03, squad round 1, PLAN-A11Y-SECURITY-1-001 (a)):
Storybook loads its story index with `fetch("./index.json")` (governed by `connect-src`) and the manager frames
`iframe.html` (`frame-src`); under constitution IV's `default-src 'none'` both are blocked, whatever is done about
styles. The Storybook page is therefore served with:

```text
default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'; connect-src 'self'; frame-src 'self'
```

`frame-src 'self'` only while the manager UI is used; if the spike settles on the preview alone, it is dropped. These
are host additions for the Storybook page only, recorded in the plan's Constitution Check like `font-src`; the
package output gets none. The run-time test asserts that the response carries exactly this header.

**Static scope** (operator decision 2026-11-03, squad round 1, PLAN-FRESH-1-001 (a)): Storybook copies its prebuilt
runtimes verbatim into the output (`builder-manager` copies `dist/manager` to `<out>/sb-manager`), and these contain
`Function("return this")`, `<span style=…>` template strings, `"sk-SK"` and `font-family: Menlo, monospace`, which no
setting or externalising can remove. The widened static `csp` and `prefix` scope covers only the files this
repository's sources produce: the Vite-built stories and preview bundle, the externalised scripts and styles, the HTML
entries. The verbatim-copied directories are listed in `gates/gates.json` as excluded (the exact list recorded from
the spike), and a node test checks that every file under them is byte-identical to a file of the installed
`storybook` package. They remain covered by the run-time test. The narrowing is recorded in `gates.json`,
`gates/README.md`, plan.md and FR-023.

**Known risk, met by a spike first**: Storybook's manager and preview inject `<style>` elements at run time (Emotion
CSS-in-JS), and the built HTML has inline scripts and styles. Under `style-src 'self'` with no nonce or hash, injected
`<style>` elements are blocked. The first task of the Storybook phase is a spike that builds the pinned Storybook,
post-processes its output (`storybook/scripts/externalise.ts`: inline `<script>` and `<style>` moved to same-origin
files, hashed names), serves it with the header above, records **every** CSP violation by directive, and runs the
widened `csp` and `prefix` gates on the output in scope. Techniques it tries against `style-src` violations, in
order: (1) Emotion's cache configured to insert rules through `CSSStyleSheet.insertRule` into adopted constructable
stylesheets (not governed by `style-src`); (2) the preview alone (`iframe.html`), without the manager UI, as the token
reference; (3) any setting of the pinned Storybook that disables run-time style injection. If none gives zero
violations under the header, or a file in scope keeps an inline script or a monospace declaration, the phase **stops
and asks the operator** (FR-023, SPEC-3-01); no Complexity Tracking exception is taken without the operator.

**Tests and scopes** (PLAN-FRESH-1-004, PLAN-TESTABILITY-1-005): `vitest.config.ts` gains a `storybook` project
(node, `storybook/**/*.test.ts`) whose global setup builds the Storybook into a per-run temporary directory (R-03:
nothing reads a pre-existing `storybook/dist/`). Unlike the tokens browser suites, a global setup is right here: the
Storybook build runs Vite and the build scripts in their own processes, so no active Stryker mutant could reach it
from any setup, and building once per run keeps the project's run time bounded. Mutants of `storybook/scripts/**`
and `storybook/.storybook/**` are killed by the node unit tests named below, which import those modules in the
worker; the run-time CSP test is not counted on to kill them. The run-time check `storybook/test/csp.test.ts` (Playwright from
Node, R-03's server and violation collector) opens that build with the header above, visits each group story in
light and dark, and asserts the header served, zero violations, zero requests outside the origin, and that each story
lists exactly its group's tokens (FR-023, US1 scenario 11). `externalise.ts` and `swatches.ts` get node unit tests on
fixture HTML and fixture token data. `storybook/scripts/**` and `storybook/.storybook/**` join the mutation scope
(`gates/lib/mutation/ranges.ts` `scopePathspecs` and `source` regex, with tests); `tsconfig.json` includes
`storybook/.storybook/**/*.ts` explicitly (TypeScript's `**/*.ts` skips dot-directories); the prefix gate's source
scope (`isCovered`) extends to `storybook/**` source. `storybook/dist/` is in `.gitignore`.

The `csp` gate gets a fail plant (inline script in `storybook/dist/index.html`) and a pass plant (external script
there).

**Alternatives considered**: the spec's option (b) at SPEC-3-01 (static scan only; declined by the operator); a
generated static token reference page instead of Storybook (fork options (b) of PLAN-A11Y-SECURITY-1-001 and (c) of
PLAN-FRESH-1-001, not chosen; FR-023's choice of Storybook stands); keeping the full static scope and taking an
exception (PLAN-FRESH-1-001 (b), not chosen).

## R-11 Package exports and build

**Decision**: `@ocelle/tokens` `package.json`:

```json
"exports": {
  ".": "./dist/index.js",
  "./tokens.css": "./dist/tokens.css",
  "./tokens.json": "./dist/tokens.json",
  "./fonts/*": "./dist/fonts/*"
},
"files": ["dist", "CHANGELOG.md", "README.md"],
"scripts": { "build": "tsc -p tsconfig.json && node scripts/build.ts" }
```

The package stays `private: true` and `0.0.0` until the release (#11); `CHANGELOG.md` gets an "Unreleased — Added"
section listing every token name (FR-025). `THIRD_PARTY_NOTICES` gains the font entry (FR-014). `scripts/build.ts` is
the thin I/O boundary of R-01.

## R-12 Derived tokens: definition, JSON and tests

**Decision**: A derived token's record lists every token its value references in `ref` (per theme where its value is
per theme: `elevation-raised` references `color-rule-strong` in dark only; data-model.md § Token). The stylesheet
writes the reference as `var(--ocelle-<ref>)`, alone or inside a larger value (`calc(100vw - 2 *
var(--ocelle-gutter))`). The JSON export holds resolved values (FR-008) and `ref` in the full-name form of its `name`
field, in the shape of the value: `"ref": ["--ocelle-space-4"]`, or `{ "light": [...], "dark": [...] }`
(contracts/token-package.md). Tests check the resolved values against the transcribed table and the reference form
by the generator test on a fixture source (R-03); they do not resolve `var()` themselves.

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

## R-15 Package documentation

**Decision** (PLAN-CORRECTNESS-1-007): `packages/tokens/README.md`, in the published `files` (R-11), holds the host
contract of contracts/token-package.md: load once, the theme rule, the `color-scheme` hand-off, the CSP allowance
`font-src 'self'` (FR-012), the forced-colours note (the `elevation-*` rings vanish; elements that use them for a
state or a boundary also draw a border or outline; FR-018), and the rendered brand rules (spec Assumptions). A node
test (`packages/tokens/test/readme.test.ts`) fails unless the README states `font-src 'self'` and the package's
`files` include `README.md`. It is written in US1 (host contract, brand rules) and completed in US2 (font allowance).
