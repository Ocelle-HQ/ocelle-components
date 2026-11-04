# Contract: new and changed gates

All gates follow `gates/README.md`: `pnpm run gate:<id>`, `--root <dir>`, exit 0 / 1 / 2, one line per finding
`<path>:<line>: <gate-id>: <rule-id>: <message>`, rule ids as data-model.md § Gate findings.

## Configuration set (changed, `gates/lib/plant-repo.ts`)

`configurationSet` also copies `packages/tokens/src/source.ts`, `packages/tokens/src/overrides.ts`,
`packages/tokens/src/generate.ts` (and any module they import) and `packages/tokens/contrast/pairs.json` into every
temporary repository, so `repo-tree` plants see the real token source and pair list, and a plant carries only the
files it changes (PLAN-CORRECTNESS-1-001). Unit test
first in `gates/test/plant-repo.test.ts`, then an integration test that a `repo-tree` plant root holds these files.

**Plant deltas** (PLAN-FRESH-2-007; operator decision 2026-11-03, squad round 3, PLAN-FRESH-3-003 (a)): a plant that
changes the token source, the generator or the pair list states the change as a **structured delta by key**, never
as a copy and never as a line-based patch, so that neither patch context nor line numbers tie it to the neighbouring
entries (data-model § Token overrides). A plant's `gates/plants/<id>/<name>/delta.json` has up to three parts,
applied by `buildRepoTree` after laying the plant's `tree/` over the configuration set:

- `tokens`: a list of token overrides (data-model § Token overrides), set by name (`{ "token": "color-ink-muted",
  "light": "#6B655A" }`), added (`{ "add": { …record… } }`) or removed (`{ "remove": "<name>" }`). `buildRepoTree`
  writes them as the `overrides` list of the tree's `overrides.ts`; `source.ts` applies them to its records through
  `applyOverrides` (data-model § Token), so the gates see the changed source through the token module's own data.
- `pairs`: pair-list changes by key `(theme, fg, bg)`: set fields of an entry (`{ "key": ["light", "color-ink-muted",
  "color-inset"], "set": { "figure": "4.27" } }`), remove an entry, or add one (appended). `buildRepoTree` parses the
  real `pairs.json`, applies them and writes it back one entry per line. A key that matches no entry, or two, is an
  error.
- `generator: "wrapped"`: the plant changes the generator's behaviour (`f-motion-not-zero`,
  `g-forced-colours-override`, `g-system-colour-mapping`, `generator-throws`). `buildRepoTree` moves the real
  `generate.ts` to `generate.real.ts` and places the plant's `tree/packages/tokens/src/generate.ts`, which must
  `export * from "./generate.real.ts"` and may shadow named exports (for example a `css` that appends a
  forced-colours block to the real output). The wrapper depends on the generator's exported functions only, not on
  its lines.

Any error applying a delta is a plant-runner error that fails the plant job, naming the plant and the key or file. A
plant's `tree/` must not contain `source.ts` or `pairs.json`; it contains `generate.ts` only with
`generator: "wrapped"`, and `overrides.ts` only when its `delta.json` has no `tokens` part (`source-throws` supplies
an `overrides.ts` that throws on load, so the real `source.ts` throws when it imports it). The plant job checks this.

**Keyed locations**: a `contrast` or `brand-rules` fail plant writes each expected `location` by key, not by line:
`packages/tokens/contrast/pairs.json#<theme>/<fg>/<bg>` (the line of that entry),
`packages/tokens/src/source.ts#<name>` (the line of the token's `name` in the records), `packages/tokens/src/overrides.ts#<name>` (a token only an override
adds), `packages/tokens/dist/tokens.css#<text>` (the first line containing `<text>` of the stylesheet the tree's
generator produces). The plant runner resolves each key to `<path>:<line>` in the plant's built tree before
`judgePlant` compares; `gates/lib/plant-judge.ts` keeps comparing exact `<path>:<line>` locations. A key that
resolves to no line, or a token key that resolves to two, is a plant-runner error naming the plant and the key.

Tests first in `gates/test/plant-repo.test.ts` (and `plant-runner.test.ts` for key resolution): each delta part is
applied over the set; an unknown token name or pair key fails naming the plant and the key; a wrapper that does not
re-export `./generate.real.ts` is rejected; a `tree/` holding a forbidden file is rejected; each key form resolves to
the right line, and an unresolvable key fails naming it. A plant-job test then changes a copy of the real source and
pair list in three ways and asserts that every `contrast` and `brand-rules` plant still gives its expected outcome:
(1) the light value of a token next to a planted one in source order (`color-ink-soft`, beside `color-ink-muted`),
with its recorded figures updated; (2) a colour token without `contrast` inserted before `color-ink-soft` in the
records, and a checked entry outside the required set, with its computed figure, inserted as the first entry of the
pair list, so every planted entry and record moves down a line; (3) the light `color-danger` value, with its
figures.

## `contrast` (new; check "Contrast"; plant form `repo-tree`)

Inputs under `--root`: `packages/tokens/src/source.ts`, `packages/tokens/src/generate.ts` (its `resolve()`, the
one resolver shared with `json()`; data-model § Token, PLAN-FRESH-2-005), `packages/tokens/contrast/pairs.json`.
Findings per entry and their order: data-model § Gate findings (an entry can give both `figure-mismatch` and
`below-threshold`).

| Situation | Exit | Output |
|---|---|---|
| pair list missing, not JSON, not the schema, or empty | 2 | `contrast: cannot run: <file>: <cause>` |
| token source or generator does not load, or the source fails `validateSource` | 2 | `contrast: cannot run: <file>: <cause>` |
| a theme with zero entries | 2 | `contrast: cannot run: no pairs for <theme>` |
| any finding of data-model.md § Gate findings | 1 | one line per finding, then `contrast: <k> findings` |
| otherwise | 0 | `contrast: <n> pairs checked in light, <m> in dark (<r> required per theme)`; with the repository's values `<n>`, `<m>`, `<r>` are 158, 157, 149 |

Flag `--print`: lists every required pair with its computed ratio (four decimals), exit 0; for authoring only.

## `brand-rules` (new; check "Brand rules"; plant form `repo-tree`)

Inputs under `--root`: `packages/tokens/src/source.ts`, `packages/tokens/src/generate.ts`,
`packages/tokens/contrast/pairs.json` (rule (b): the excluded entry `color-accent` on `color-canvas` in light).

It loads and validates the source first. Exit 2, `brand-rules: cannot run: <file>: <cause>`, when: the source or the
generator does not load or throws; the source fails `validateSource` (duplicate name, A.6 name, unknown `ref` or
ground, `ref` not matching the value's references, reference cycle, malformed colour value); the pair list is
missing, not JSON or not the schema. Otherwise exit 1 with one finding per broken rule (a)–(g) of FR-019, or exit 0:
`brand-rules: 7 rules checked`.

Rule (g) fails on any `forced-color-adjust: none` and on any `@media (forced-colors: …)` block that sets an
`--ocelle-color-*` property to anything other than a CSS system colour keyword (FR-018).

## `style-lint` (changed)

New finding: `ocelle/token-only: unknown token --ocelle-<name>` for any `var()` reference (also inside `calc()` and as
a fallback) to a name that is neither a token of the source nor a custom property name the custom-elements manifest
declares (`cssProperties[].name`; data-model § Element property list, FR-010; operator decision 2026-11-03, squad
round 2, PLAN-FRESH-2-003 (a)). The exemption is by exact name, not by prefix. The token list and the element
property list are read under `--root` at plugin load (`packages/tokens/src/source.ts`;
`packages/elements/custom-elements.json`, empty while absent) and can be passed as rule options (unit tests use
fixture lists). Exit 2 if the token source does not load or fails validation, if the manifest exists but is not
JSON or not the manifest schema, or if a declared element property has the full name of a token (exact-name clash).
No condition on element names.

`gates/README.md`, "Deferred gates", custom-elements-manifest row: it records that the manifest the deferred gate
introduces is a committed file at `packages/elements/custom-elements.json` (constitution I public surface), kept
current by the element feature, which style-lint reads; an element's CSS can use a new element property only after
the manifest declares it (PLAN-FRESH-2-004).

The existing plants and tests that use the made-up `--ocelle-x` (`pass-var-token`, `pass-var-keyword-fallback`,
`fail-var-fallback`; `gates/test/token-only.test.ts`, `token-only-parts.test.ts`) move to real token names (for
example `--ocelle-space-2`), the reason recorded in the commit as constitution VIII requires: under the new rule
`--ocelle-x` is an unknown token.

## `csp`, `prefix` (scope widened)

Static scope (FR-023; operator decisions 2026-11-03, squad round 1, PLAN-FRESH-1-001 (a), and squad round 2,
PLAN-FRESH-2-001 (a)): `isBuiltOutput` (csp) and the prefix gate's scope cover this repository's Storybook inputs
before bundling, `storybook/stories/`, `storybook/.storybook/` (with its HTML head templates), `storybook/scripts/`,
`storybook/.generated/`, and the HTML entries of the build output as `externalise.ts` leaves them
(`storybook/dist/*.html`); outside `node_modules`. The csp gate reads the `.ts`, `.js`, `.css` and `.html` files
there and checks them as follows (operator decision 2026-11-03, squad round 3, PLAN-FRESH-3-001 (a)):

- `.html` (the head templates and the HTML entries): the markup rules, as for built HTML.
- `.ts`: parsed with the TypeScript compiler API as TypeScript (`ScriptKind.TS`, chosen by extension in
  `checkOutput`; `.js` keeps `ScriptKind.JS`); the dynamic-code rules (`eval`, `new Function`, `Function()`, string
  timers) and the markup rules on the static text of every string and template literal holding a `<`, as for built
  JavaScript. A `.ts` file that does not parse is exit 2. **Exception**: in `storybook/scripts/` the markup rules do
  not apply to literals, because the externaliser has to name the `<script>` and `<style>` tags it moves; the
  dynamic-code rules still apply there, and what the externaliser leaves is checked in the HTML entries.
- `.css` (`storybook/.generated/`): read and counted, as for built CSS.

Inline styles that a story sets at run time through the DOM (`setAttribute("style", …)`) are not literals of markup
and are left to the run-time CSP test, which reports them as violations. The 001 plant
`pass-inline-script-in-source` keeps its meaning: package source (`packages/*/src/`) stays outside the csp gate;
only the Storybook inputs listed here are source files it reads. Unit tests first in `gates/test/csp.test.ts`:
`checkOutput` gives a finding for a markup string with a `style` attribute and for `new Function` in a `.ts` file
in scope; a `.ts` file with type annotations and `as const` parses with no exit 2; a `.ts` file that does not parse
is exit 2; a `<script>` literal in `storybook/scripts/x.ts` gives no finding and `eval` there gives one. Every other
file under `storybook/dist/` (the Vite preview bundle, the files `externalise.ts` writes out of the HTML; the
manager's `sb-addons/` and `sb-manager/` are not shipped, **Preview only** below) is outside the static scope and
covered by the run-time CSP test
(`storybook/test/csp.test.ts`): Vite compiles Storybook's preview runtime (`storybook/internal/preview/runtime`,
which holds `Function(…)` calls and `<span style=…>` strings) into the preview bundle and esbuild builds
`sb-addons/` from Storybook's manager code, so no byte-identity fence can separate vendor code from this
repository's code there. No exclusion list and no byte-identity test. The prefix gate's source scope (`isCovered`)
also covers `storybook/**` source (`.storybook/`, `stories/`, `scripts/`, `test/`), outside `node_modules` and
`dist`. Unit tests of both gates' scope functions list the files in and out of scope. `gates.json` `scope` texts and
`gates/README.md` record the narrowing of SPEC-1-05 and the rules for `.ts` inputs with the `storybook/scripts/`
exception.

**Monospace in Storybook** (PLAN-FRESH-3-002): the prefix gate matches only CSS `font` and `font-family`
declarations, so it cannot see the Storybook theme API, and Storybook's own monospace defaults sit in the bundles
outside the static scope. Two checks cover this instead. (1) A unit test in the `storybook` project
(`storybook/test/unit/theme.test.ts`) imports `storybook/.storybook/manager.ts`, which exports the theme it passes
to `addons.setConfig`, and asserts that its `fontBase` and `fontCode` equal the `font-sans` family list transcribed
from Appendix A (`"Schibsted Grotesk", "Helvetica Neue", Arial, system-ui, sans-serif`). (2) The run-time test in
`storybook-integration` asserts that no rendered element of the preview (`iframe.html`, the Storybook page;
including open shadow roots), for each group story in light and dark, has a computed `font-family` naming a family on the prefix gate's
monospace list, which `gates/bin/prefix.ts` exports as `monospaceFamilies` for this purpose. Its control: the test
adds one element to each page through the CSSOM (`element.style.fontFamily = "Menlo, monospace"` in
`page.evaluate`, which CSP does not govern), asserts that the check reports exactly that element, removes it, and
only then asserts that nothing is reported. Text drawn on a canvas has no element font; the spike records whether the
pinned Storybook draws text on a canvas in the token stories (`preview/runtime.js` sets a monospace canvas font), and
if it does, the phase stops and asks the operator (FR-023).

**Preview only** (operator decision R1-01, 2026-11-04, phase 3 review round 1): the token reference under the strict
CSP is the Storybook preview (`iframe.html`) alone. The run-time checks of (2) and the CSP test open the preview
only, under the Storybook page's header without `frame-src`:
`default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'; connect-src 'self'`. The manager UI
cannot run under that header, so the build does not ship it: the Storybook build script passes `--preview-only`
(pinned Storybook 10.6.5, research R-10 *Preview only*), and `storybook/test/integration/csp.test.ts` asserts that
the build output holds no `index.html`, no `sb-manager/` and no `sb-addons/`. (1) still tests the theme that
`manager.ts` exports, kept for #10, which brings the manager back. Required of the phase 3 fix round, test first.

The spike's first output (R-10) is the `csp` gate's findings on the Vite preview bundle and on `sb-addons/`, run by
hand with those paths and recorded in the review; they are not a gate result.

## Mutation, typecheck and test scope (changed)

- `gates/lib/mutation/ranges.ts` `scopePathspecs` and its `source` regex add `storybook/scripts/**`,
  `storybook/.storybook/**` and `storybook/stories/**/*.ts` (the story render code such as `render.ts`; phase 3
  review round 1, R1-02); story files (`*.stories.ts`), tests (`*.test.ts`, `*.spec.ts`, `test/`) and `.d.ts` files
  stay out (tests first in `gates/test/mutation-ranges.test.ts`).
- `tsconfig.json` includes `storybook/.storybook/**/*.ts` explicitly (`**/*.ts` skips dot-directories).
- `vitest.config.ts` gains (PLAN-FRESH-2-002):
  - a `tokens-browser` project (node, `packages/tokens/test/browser/**/*.test.ts`): the Playwright suites, which
    generate what they serve in each suite's `beforeAll` inside the worker, with no `globalSetup` (research R-03);
    the existing `tokens` project, whose include `packages/tokens/**/*.test.ts` also matches these files, adds
    `packages/tokens/test/browser/**` to its exclude, as `gates` excludes `gates/test/integration/**`, so each
    browser suite belongs to `tokens-browser` only;
  - a `storybook` project (node, `storybook/test/unit/**/*.test.ts`): the externalise, swatches, telemetry, theme
    font (§ `csp`, `prefix`, *Monospace in Storybook*) and scope unit tests, with no build; these kill the mutants of `storybook/scripts/**`, `storybook/.storybook/**` and `storybook/stories/**/*.ts` (story files, tests and `.d.ts` out; `storybook/test/unit/render.test.ts` for the story render code, R1-02);
  - a `storybook-integration` project (node, `storybook/test/integration/**/*.test.ts`) with a global setup that
    builds the Storybook into a per-run temporary directory, holding the run-time CSP test with its monospace
    assertion (research R-10).
- `vitest.mutation.config.ts` excludes `tokens-browser` and `storybook-integration` besides `gates-integration`, so
  Stryker never launches Chromium or builds Storybook; a test of the mutation config asserts the excluded project
  list, and a second test resolves every project's `include` and `exclude` against the repository's test files and
  asserts that no test file belongs both to a project `vitest.mutation.config.ts` keeps and to one it excludes (it
  fails if the `tokens` project's browser exclude, or the `gates` project's integration exclude, is removed).
  `pnpm test` and the `unit-tests` CI job still run every project, and each test file in exactly one of them.
- Mutants of `source.ts` (the module-level records, all static, and the `applyOverrides` call over them) are killed by the node test that compares the
  generator output from the real source with the transcribed Appendix A table (data-model § Expected tables);
  mutants of `css()`, `json()`, `resolve()` and `applyOverrides()` by the generator tests on fixture sources. The browser suites prove
  behaviour against current output and are not counted on to kill mutants.
- `stryker.config.json` keeps `ignoreStatic` off (`report.ts` counts `Ignored` as passing, so it would pass the
  `source.ts` mutants unseen).
- Shard time: the US1 spike measures one mutation shard holding a 120-line `source.ts` entry
  (the shard bound of `gates/lib/mutation/shards.ts`) against the 10-minute `mutation-shard` limit of `ci.yml`; if
  it exceeds the limit, the phase stops and asks the operator.

## Plants (`gates/plants/<id>/<name>/plant.json`, as `gates/README.md`)

| Gate | Fail | Pass | Breaking |
|---|---|---|---|
| `contrast` | `text-below-threshold` (ink-muted at 4.3 on inset, light), `non-text-below-threshold` (control-border below 3 on rail, light) (both: see below), `figure-mismatch`, `unknown-token`, `missing-required-pair`, `excluded-without-reason`, `required-pair-excluded`, `not-opaque` (overlay as ground) | `repository-values` (no file of its own: the configuration set's real source and list), `exempt-disabled-ink` | `empty-list`, `unparsable-list`, `source-throws` |
| `brand-rules` | `a-monospace`, `b-link-equals-accent`, `b-ochre-pair-not-excluded` (the excluded entry removed from the pair list), `c-extra-radius` (a `radius-4` at 4px), `c-wrong-value`, `d-rule-as-boundary` (rule at 3:1 on sheet), `e-light-chrome`, `f-motion-not-zero`, `g-forced-colours-override` (a colour token set to a hex value in a forced-colours block) | `repository-values` (no file of its own), `g-system-colour-mapping` (a colour token mapped to `CanvasText` in a forced-colours block) | `source-throws`, `generator-throws`, `source-invalid` (an A.6 name: exit 2) |
| `style-lint` | `fail-unknown-token`, `fail-element-property-misspelt` (`var(--ocelle-button-gpa)` against the fixture manifest of `pass-element-property`) | `pass-known-token`, `pass-element-property` (`var(--ocelle-button-gap)` with a fixture `packages/elements/custom-elements.json` whose `ocelle-button` declaration lists `cssProperties` `--ocelle-button-gap`) | (existing), `element-property-clash` (a fixture manifest declaring `--ocelle-space-2`: exit 2) |
| `csp` | `fail-storybook-inline-script` (inline script in `storybook/dist/index.html`), `fail-storybook-story-style-attribute` (a markup string with a `style` attribute in `storybook/stories/x.stories.ts`, rule `style-attribute`), `fail-storybook-preview-new-function` (`new Function` in `storybook/.storybook/preview.ts`, rule `new-function`), `fail-storybook-scripts-eval` (`eval` in `storybook/scripts/x.ts`: the exception covers markup only) | `pass-storybook-external-script` (external script there), `pass-storybook-scripts-tag-names` (`"<script>"` and `"<style>"` literals in `storybook/scripts/externalise.ts`, the stated exception) | (existing), `error-storybook-unparsable-ts` (a `.ts` file in `storybook/stories/` that does not parse: exit 2) |
| `prefix` | `fail-storybook-monospace` (`font-family: Menlo, monospace` in `storybook/.generated/swatches.css`, rule `monospace`) | (existing) | (existing) |

Every `contrast` and `brand-rules` plant that changes the token source, the generator or the pair list does so by
`delta.json` (§ Configuration set), and writes its expected locations by key. The two threshold plants
(PLAN-FRESH-2-006) set the token's value by a token override and also, by pair key, the
recorded figures of every pair of that token in the theme to the planted value, so they give only `below-threshold`
findings, and their `plant.json` lists every one: `text-below-threshold` sets light `color-ink-muted` to `#6B655A`
(4.27 on `color-inset`) and expects exactly three findings, on `color-inset`, `color-hover-bg` (same light value)
and `color-accent-low` (4.48), light; `non-text-below-threshold` sets light `color-control-border` below 3:1 on
`color-rail` and lists every required pair of that token that falls under 3:1 (the excluded pairs give no
`below-threshold`), each figure and finding computed with `--print` when the plant is written.

Registry: `gates/gates.json`, `fr020` in `gates/lib/registry.ts`, jobs `contrast` and `brand-rules` in
`.github/workflows/ci.yml`, all three changed together (the plant job checks they match). `gates/README.md`: both
gates in "The gates", "Contrast" and "Brand rules" in "Required checks on `main`" (14 checks), widened and narrowed
scopes noted (FR-023, with the narrowing of SPEC-1-05 to the Storybook inputs and HTML entries), the configuration
set change, the `delta.json` plant form and keyed locations noted, "Contrast check" row removed from "Deferred gates", the
custom-elements-manifest deferral row extended as § `style-lint` states.
