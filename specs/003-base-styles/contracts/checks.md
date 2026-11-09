# Contract: checks for the base styles

## Gates changed

| Gate | Change | Plant |
|---|---|---|
| `style-lint` | `ocelle/token-only` gets the secondary option `lineHeight: "token"`, set for `packages/styles/**/*.css` through a `stylelint.config.ts` override (research R-07): there a unitless or literal line height in `line-height` or `font` is raw | `fail-styles-literal-line-height` (`packages/styles/src/x.css`, `line-height: 1.65`, one finding `ocelle/token-only`); `pass-line-height` (elements) stays a pass |
| `prefix` | none: it already scans `packages/styles/**` including `dist/base.css` after the build | the existing `monospace` plants cover it |
| `csp` | none: `dist/base.css` is counted; CSS cannot hold the constructs it reports | — |
| `contrast`, `brand-rules` | none: no colour token added (research R-08); the new type and shell tokens pass `validateSource` | — |

The registry (`gates/gates.json`, `gates/lib/registry.ts`, `ci.yml`, `gates/README.md`, 001
`contracts/ci-checks.md`) is unchanged: no gate is added or renamed.

## Tests added

| Project | Path | Kind | Covers |
|---|---|---|---|
| `styles` (node, in mutation runs) | `packages/styles/test/build.test.ts` | unit | `buildPlan` copies `src/base.css` to `base.css`, byte-identical |
| `styles` | `packages/styles/test/source.test.ts` | source-level (research R-11) | US1-3, US1-5 (no `@import`/`url()`), US1-8, FR-020's forbidden list; each check also run on its plant fixture string |
| `styles` | `packages/styles/test/readme.test.ts` | documentation | US1-6 README and CHANGELOG statements, SC-006 |
| `styles-browser` (node + Playwright, not in mutation runs) | `packages/styles/test/browser/*.test.ts` | browser | every other acceptance scenario of US1 to US4, under the strict CSP; each guard with its plant (research R-10) |
| `tokens` | the existing token tests | unit | the five new tokens (`expected.ts`, CHANGELOG, README) |
| `storybook`, `storybook-integration` | the existing Storybook tests | unit, integration | the four new stories: zero violations, no monospace, `.generated/base.css` |

`vitest.config.ts` gains the `styles-browser` project. `vitest.mutation.config.ts` adds `styles-browser` to its
excluded projects. `packages/styles/test/sample.test.ts` stays: the package entry still exports nothing.

## Mutation scope

`packages/styles/scripts/build.ts` is in the existing scope (`packages/*/**/*.ts`). The I/O lines carry the
I/O-boundary record naming `packages/styles/test/build.test.ts`, as in tokens. CSS is not mutated. The source-level
checks and the browser tests stand in for it, and their plants prove they can fail.

## Red evidence

Every phase follows the story procedure: a red commit of test files only, proven by `red.sh`, then green.
`tdd-check.sh` must pass. Test fixtures (`test/fixtures/**`) count as test files. Plant stylesheets are test fixtures.
