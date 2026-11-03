# Contract: new and changed gates

All gates follow `gates/README.md`: `pnpm run gate:<id>`, `--root <dir>`, exit 0 / 1 / 2, one line per finding
`<path>:<line>: <gate-id>: <rule-id>: <message>`, rule ids as data-model.md § Gate findings.

## Configuration set (changed, `gates/lib/plant-repo.ts`)

`configurationSet` also copies `packages/tokens/src/source.ts`, `packages/tokens/src/generate.ts` (and any module
they import) and `packages/tokens/contrast/pairs.json` into every temporary repository, so `repo-tree` plants see the
real token source and pair list, and a plant carries only the files it changes (PLAN-CORRECTNESS-1-001). Unit test
first in `gates/test/plant-repo.test.ts`, then an integration test that a `repo-tree` plant root holds these files.

**Plant deltas** (PLAN-FRESH-2-007): a plant that changes `source.ts`, `generate.ts` or `pairs.json` states the change
as a delta over the real file, never as a copy. The form is a patch file: `gates/plants/<id>/<name>/tree.patch`, a
unified diff relative to the repository root, which `buildRepoTree` applies (no fuzz) after laying the plant's
`tree/` over the configuration set. A patch that does not apply is a plant-runner error that fails the plant job,
naming the plant and the file. A plant's `tree/` must not contain any of these three files (the plant job checks
this). Tests first in `gates/test/plant-repo.test.ts`: a patch is applied over the set; a patch that does not apply
fails naming the plant; a `tree/` holding one of the three files is rejected. A plant-job test then changes one
token value in a copy of the real source that no plant's patch touches (for example the light `color-danger`),
updates that token's recorded figures in the copy of the pair list, and asserts that every `contrast` and
`brand-rules` plant still gives its expected outcome.

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
there. Every other file under `storybook/dist/` (the Vite preview bundle, `sb-addons/`, `sb-manager/`, the files
`externalise.ts` writes out of the HTML) is outside the static scope and covered by the run-time CSP test
(`storybook/test/csp.test.ts`): Vite compiles Storybook's preview runtime (`storybook/internal/preview/runtime`,
which holds `Function(…)` calls and `<span style=…>` strings) into the preview bundle and esbuild builds
`sb-addons/` from Storybook's manager code, so no byte-identity fence can separate vendor code from this
repository's code there. No exclusion list and no byte-identity test. The prefix gate's source scope (`isCovered`)
also covers `storybook/**` source (`.storybook/`, `stories/`, `scripts/`, `test/`), outside `node_modules` and
`dist`. Unit tests of both gates' scope functions list the files in and out of scope. `gates.json` `scope` texts and
`gates/README.md` record the narrowing of SPEC-1-05.

The spike's first output (R-10) is the `csp` gate's findings on the Vite preview bundle and on `sb-addons/`, run by
hand with those paths and recorded in the review; they are not a gate result.

## Mutation, typecheck and test scope (changed)

- `gates/lib/mutation/ranges.ts` `scopePathspecs` and its `source` regex add `storybook/scripts/**` and
  `storybook/.storybook/**` (tests first in `gates/test/mutation-ranges.test.ts`).
- `tsconfig.json` includes `storybook/.storybook/**/*.ts` explicitly (`**/*.ts` skips dot-directories).
- `vitest.config.ts` gains (PLAN-FRESH-2-002):
  - a `tokens-browser` project (node, `packages/tokens/test/browser/**/*.test.ts`): the Playwright suites, which
    generate what they serve in each suite's `beforeAll` inside the worker, with no `globalSetup` (research R-03);
  - a `storybook` project (node, `storybook/test/unit/**/*.test.ts`): the externalise, swatches, telemetry and
    scope unit tests, with no build; these kill the mutants of `storybook/scripts/**` and `storybook/.storybook/**`;
  - a `storybook-integration` project (node, `storybook/test/integration/**/*.test.ts`) with a global setup that
    builds the Storybook into a per-run temporary directory, holding the run-time CSP test (research R-10).
- `vitest.mutation.config.ts` excludes `tokens-browser` and `storybook-integration` besides `gates-integration`, so
  Stryker never launches Chromium or builds Storybook; a test of the mutation config asserts the excluded project
  list. `pnpm test` and the `unit-tests` CI job still run every project.
- Mutants of `source.ts` (all static: the module-level records) are killed by the node test that compares the
  generator output from the real source with the transcribed Appendix A table (data-model § Expected tables);
  mutants of `css()`, `json()` and `resolve()` by the generator tests on fixture sources. The browser suites prove
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
| `csp` | `fail-storybook-inline-script` (inline script in `storybook/dist/index.html`) | `pass-storybook-external-script` (external script there) | (existing) |
| `prefix` | `fail-storybook-monospace` | (existing) | (existing) |

Every `contrast` and `brand-rules` plant that changes `source.ts`, `generate.ts` or `pairs.json` does so by
`tree.patch` (§ Configuration set). The two threshold plants (PLAN-FRESH-2-006) patch the token's value and also the
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
set change and the `tree.patch` plant form noted, "Contrast check" row removed from "Deferred gates", the
custom-elements-manifest deferral row extended as § `style-lint` states.
