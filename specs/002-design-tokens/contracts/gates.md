# Contract: new and changed gates

All gates follow `gates/README.md`: `pnpm run gate:<id>`, `--root <dir>`, exit 0 / 1 / 2, one line per finding
`<path>:<line>: <gate-id>: <rule-id>: <message>`, rule ids as data-model.md § Gate findings.

## Configuration set (changed, `gates/lib/plant-repo.ts`)

`configurationSet` also copies `packages/tokens/src/source.ts`, `packages/tokens/src/generate.ts` (and any module
they import) and `packages/tokens/contrast/pairs.json` into every temporary repository, so `repo-tree` plants see the
real token source and pair list, and a plant carries only the files it changes (PLAN-CORRECTNESS-1-001). Unit test
first in `gates/test/plant-repo.test.ts`, then an integration test that a `repo-tree` plant root holds these files.

## `contrast` (new; check "Contrast"; plant form `repo-tree`)

Inputs under `--root`: `packages/tokens/src/source.ts`, `packages/tokens/contrast/pairs.json`.

| Situation | Exit | Output |
|---|---|---|
| pair list missing, not JSON, not the schema, or empty | 2 | `contrast: cannot run: <file>: <cause>` |
| token source does not load or fails `validateSource` | 2 | `contrast: cannot run: packages/tokens/src/source.ts: <cause>` |
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
a fallback) to a name that is neither a token of the source nor an element custom property
`--ocelle-<element>-<property>` of an element in the element name list (data-model § Element name list, FR-010). The
token and element lists are read under `--root` at plugin load and can be passed as rule options (unit tests use
fixture lists). Exit 2 if the token source does not load or fails validation, or if a token name equals an element
name or begins with `<element>-`.

The existing plants and tests that use the made-up `--ocelle-x` (`pass-var-token`, `pass-var-keyword-fallback`,
`fail-var-fallback`; `gates/test/token-only.test.ts`, `token-only-parts.test.ts`) move to real token names (for
example `--ocelle-space-2`), the reason recorded in the commit as constitution VIII requires: under the new rule
`--ocelle-x` is an unknown token.

## `csp`, `prefix` (scope widened)

`isBuiltOutput` (csp) and the prefix gate's output scope cover the Storybook build output in scope (FR-023): the
files under `storybook/dist/` (`.js`, `.css`, `.html`) except the directories Storybook copies verbatim from its
package, which `gates/gates.json` lists (for example `storybook/dist/sb-manager/`; the exact list is recorded from the
spike). A test checks that every file under an excluded directory is byte-identical to a file of the installed
`storybook` package. The prefix gate's source scope (`isCovered`) also covers `storybook/**` source
(`.storybook/`, `stories/`, `scripts/`, `test/`), outside `node_modules` and `dist`. `gates.json` `scope` texts and
`gates/README.md` updated.

## Mutation, typecheck and test scope (changed)

- `gates/lib/mutation/ranges.ts` `scopePathspecs` and its `source` regex add `storybook/scripts/**` and
  `storybook/.storybook/**` (tests first in `gates/test/mutation-ranges.test.ts`).
- `tsconfig.json` includes `storybook/.storybook/**/*.ts` explicitly (`**/*.ts` skips dot-directories).
- `vitest.config.ts` gains a `storybook` project (node, `storybook/**/*.test.ts`) with a global setup that builds the
  Storybook into a per-run temporary directory (research R-03, R-10); its mutants are killed by node unit tests in
  the worker, not by the build. The `tokens` project's browser suites generate what they serve in each suite's
  `beforeAll` inside the worker and have no `globalSetup`, so Stryker's active mutant reaches the served stylesheet
  (research R-03).

## Plants (`gates/plants/<id>/<name>/plant.json`, as `gates/README.md`)

| Gate | Fail | Pass | Breaking |
|---|---|---|---|
| `contrast` | `text-below-threshold` (ink-muted at 4.3 on inset, light), `non-text-below-threshold` (control-border below 3 on rail, light), `figure-mismatch`, `unknown-token`, `missing-required-pair`, `excluded-without-reason`, `required-pair-excluded`, `not-opaque` (overlay as ground) | `repository-values` (no file of its own: the configuration set's real source and list), `exempt-disabled-ink` | `empty-list`, `unparsable-list`, `source-throws` |
| `brand-rules` | `a-monospace`, `b-link-equals-accent`, `b-ochre-pair-not-excluded` (the excluded entry removed from the pair list), `c-extra-radius` (a `radius-4` at 4px), `c-wrong-value`, `d-rule-as-boundary` (rule at 3:1 on sheet), `e-light-chrome`, `f-motion-not-zero`, `g-forced-colours-override` (a colour token set to a hex value in a forced-colours block) | `repository-values` (no file of its own), `g-system-colour-mapping` (a colour token mapped to `CanvasText` in a forced-colours block) | `source-throws`, `generator-throws`, `source-invalid` (an A.6 name: exit 2) |
| `style-lint` | `fail-unknown-token` | `pass-known-token`, `pass-element-property` (`var(--ocelle-button-gap)` with a fixture `packages/elements/custom-elements.json` declaring `ocelle-button`) | (existing) |
| `csp` | `fail-storybook-inline-script` | `pass-storybook-external-script` | (existing) |
| `prefix` | `fail-storybook-monospace` | (existing) | (existing) |

Registry: `gates/gates.json`, `fr020` in `gates/lib/registry.ts`, jobs `contrast` and `brand-rules` in
`.github/workflows/ci.yml`, all three changed together (the plant job checks they match). `gates/README.md`: both
gates in "The gates", "Contrast" and "Brand rules" in "Required checks on `main`" (14 checks), widened and narrowed
scopes noted (FR-023), the configuration set change noted, "Contrast check" row removed from "Deferred gates".
