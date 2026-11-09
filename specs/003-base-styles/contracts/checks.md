# Contract: checks for the base styles

## Gates changed

| Gate | Change | Plant |
|---|---|---|
| `style-lint` | `ocelle/token-only` gets the secondary option `lineHeight: "token"`, set for `packages/styles/**/*.css` through a `stylelint.config.ts` override (research R-07): there a `line-height` value, or the line-height part of `font`, passes only as a single `var(--ocelle-*)` or a CSS-wide keyword. `validateOptions` gains `lineHeight: ["token"]`; `optionLists` uses given lists only when `tokens` or `elementProperties` is present, else the repository lists | fail: `fail-styles-literal-line-height` (`1.65`), `fail-styles-percent-line-height` (`165%`), `fail-styles-calc-line-height` (`calc(1.65)`), `fail-styles-normal-line-height` (`normal`), each `tree/packages/styles/src/x.css` with one `ocelle/token-only` finding; pass: `pass-styles-line-height-token` (`var(--ocelle-line-height-prose)` in `tree/packages/styles/src/x.css`); moved: `pass-line-height` from `tree/packages/styles/src/x.css` to `tree/packages/elements/src/x.css`, `why` updated, still a pass |
| `prefix` | none: it already scans `packages/styles/**` including `dist/base.css` after the build | the existing `monospace` plants cover it |
| `csp` | none: `dist/base.css` is counted; CSS cannot hold the constructs it reports | — |
| `contrast`, `brand-rules` | none: no colour token added (research R-08); the new type and shell tokens pass `validateSource` | — |

The registry (`gates/gates.json`, `gates/lib/registry.ts`, `ci.yml`, `gates/README.md`, 001
`contracts/ci-checks.md`) is unchanged: no gate is added or renamed.

## Tests added

| Project | Path | Kind | Covers |
|---|---|---|---|
| `styles` (node, in mutation runs) | `packages/styles/test/build.test.ts` | unit | `buildPlan(css)` returns `[{ path: "base.css", content: css }]` unchanged; `build()` writes a `dist/base.css` byte-identical to `src/base.css` (research R-01) |
| `styles` | `packages/styles/test/source.test.ts` | source-level (research R-11) | parses `buildPlan(text)[0].content` of `src/base.css`: US1-3 (motion at any depth, `forced-color-adjust`), FR-009 (`outline: none`), US1-5 (no `@import`/`url()`), US1-8 (class, specificity), FR-020's forbidden list. Each guard shares its test with a positive assertion over the same parse (the `:where(:focus-visible)` rule and its longhands; the selectors of data-model § Rule table the phase has added; the wrap rule with `overflow-wrap: anywhere`), so none passes on an empty file. Each check is also run on its plant fixture strings (must report) and boundary strings (must not) of research R-10 |
| `styles` | `packages/styles/test/pairs.test.ts` | unit | US3-6's contrast half: each colour pairing of research R-08 is a `checked` pair in both themes in `packages/tokens/contrast/pairs.json`; plant: a list with `color-link` on `color-chrome` |
| `styles` | `packages/styles/test/readme.test.ts` | documentation | US1-6 README and CHANGELOG statements, SC-006, and the statements of research R-14, growing red-first per phase: phase 2 link order, CSP, tokens version, base layer, CHANGELOG `base.css`; phase 3 density and value (values, main grounds only, CHANGELOG names); phase 4 prose (values, prose over compact, not on `<html>`, three-column tables, the WebKit limitation); phase 5 wrap and SC-006 |
| `styles-browser` (node + Playwright, not in mutation runs) | `packages/styles/test/browser/*.test.ts` | browser | every other acceptance scenario of US1 to US4, under the strict CSP; each guard with its plant or its recorded reason (research R-10); table semantics on the AX-tree structure (research R-06) |
| `gates` | `gates/test/token-only.test.ts` (and `token-only-parts.test.ts` if `rawValues` changes) | unit | the `lineHeight: "token"` option: raw values with it, allowed without it, token and CSS-wide keyword pass with the repository lists, invalid option reported (research R-07) |
| `gates` | `gates/test/vitest-config.test.ts` | unit | the mutation-excluded list gains `styles-browser`; `packages/styles/test/browser/*.test.ts` belong to `styles-browser` only (phase 1, red first) |
| `tokens` | the existing token tests | unit | the five new tokens (`expected.ts`, CHANGELOG, README) |
| `storybook` (in mutation runs) | `storybook/test/unit/render.test.ts` | unit | `renderFamily`: hook attributes and values, the elements each story must show, no `style` attribute or `class`, escaping of the data-file text (research R-12) |
| `storybook`, `storybook-integration` | the other Storybook tests | unit, integration | the four new stories: zero violations, no monospace (with `preview.css` narrowed to the error display, so the check sees `base.css`), `.generated/base.css` |

`vitest.config.ts` gains the `styles-browser` project, and the `styles` project excludes
`packages/styles/test/browser/**`, as `tokens` excludes its browser directory. `vitest.mutation.config.ts` adds
`styles-browser` to its excluded projects. `packages/styles/test/sample.test.ts` stays: the package entry still
exports nothing.

## Mutation scope

`packages/styles/scripts/build.ts` is in the existing scope (`packages/*/**/*.ts`). The I/O lines carry the
I/O-boundary record naming `packages/styles/test/build.test.ts`, as in tokens. The new `lineHeight` branch of
`gates/stylelint/token-only.ts` is in scope and killed by the unit tests above. `storybook/stories/render.ts`
(`renderFamily`) is in scope (`storybook/stories/**/*.ts`, story files excluded) and killed by `render.test.ts`; the
stories' prose text is in `storybook/stories/base-content.json`, outside the scope. CSS is not mutated. The
source-level checks and the browser tests stand in for it, and their plants prove they can fail.

## Red evidence

Every phase follows the story procedure: a red commit of test files only, proven by `red.sh`, then green.
`tdd-check.sh` must pass. Test fixtures (`test/fixtures/**`, `layout.css` included) count as test files. Plant
stylesheets are test fixtures. Setup's Vitest config change is red first through `gates/test/vitest-config.test.ts`;
the rest of Setup is exempt (no behaviour). Because `red.sh` takes the whole suite's exit code, a guard test proves
nothing alone: each source-level and browser guard is paired with a positive assertion in the same test (research
R-10, R-11).
