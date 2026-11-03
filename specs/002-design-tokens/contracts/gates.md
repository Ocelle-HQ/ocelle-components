# Contract: new and changed gates

All gates follow `gates/README.md`: `pnpm run gate:<id>`, `--root <dir>`, exit 0 / 1 / 2, one line per finding
`<path>:<line>: <gate-id>: <rule>: <message>`.

## `contrast` (new; check "Contrast"; plant form `repo-tree`)

Inputs under `--root`: `packages/tokens/src/source.ts`, `packages/tokens/contrast/pairs.json`.

| Situation | Exit | Output |
|---|---|---|
| pair list missing, not JSON, not the schema, or empty | 2 | `contrast: cannot run: <file>: <cause>` |
| token source does not load or fails validation | 2 | `contrast: cannot run: packages/tokens/src/source.ts: <cause>` |
| a theme with zero entries | 2 | `contrast: cannot run: no pairs for <theme>` |
| any finding of data-model.md § Gate findings | 1 | one line per finding, then `contrast: <k> findings` |
| otherwise | 0 | `contrast: <n> pairs checked in light, <m> in dark (130 required per theme)` |

Flag `--print`: lists every required pair with its computed ratio (four decimals), exit 0; for authoring only.

## `brand-rules` (new; check "Brand rules"; plant form `repo-tree`)

Inputs under `--root`: `packages/tokens/src/source.ts`, `packages/tokens/src/generate.ts`. Exit 2 when either does not
load. Exit 1 with one finding per broken rule (a)–(g) of FR-019. Exit 0: `brand-rules: 7 rules checked`.

## `style-lint` (changed)

New finding: `ocelle/token-only: unknown token --ocelle-<name>` for any `var()` reference to a name not in the token
source. Exit 2 if the token source does not load.

## `csp`, `prefix` (scope widened)

`isBuiltOutput` (csp) and the prefix gate's output scope cover `storybook/dist/**` (`.js`, `.css`, `.html`) as well
as `packages/*/dist/**`. `gates.json` `scope` texts updated.

## Plants (`gates/plants/<id>/<name>/plant.json`, as `gates/README.md`)

| Gate | Fail | Pass | Breaking |
|---|---|---|---|
| `contrast` | `text-below-threshold` (ink-muted at 4.3 on inset, light), `non-text-below-threshold` (control-border below 3 on rail, light), `figure-mismatch`, `unknown-token`, `missing-required-pair`, `excluded-without-reason`, `required-pair-excluded`, `not-opaque` (overlay as ground) | `repository-values` (a copy of the real source and list), `exempt-disabled-ink` | `empty-list`, `unparsable-list`, `source-throws` |
| `brand-rules` | `a-monospace`, `b-link-equals-accent`, `c-extra-radius` (a `radius-3` at 4px), `c-wrong-value`, `d-rule-as-boundary` (rule at 3:1 on sheet), `e-light-chrome`, `f-motion-not-zero`, `g-forced-colours-override` | `repository-values` | `source-throws`, `generator-throws` |
| `style-lint` | `fail-unknown-token` | `pass-known-token` | (existing) |
| `csp` | `fail-storybook-inline-script` | `pass-storybook-external-script` | (existing) |
| `prefix` | `fail-storybook-monospace` | (existing) | (existing) |

Registry: `gates/gates.json`, `fr020` in `gates/lib/registry.ts`, jobs `contrast` and `brand-rules` in
`.github/workflows/ci.yml`, all three changed together (the plant job checks they match). `gates/README.md`: both
gates in "The gates", "Contrast" and "Brand rules" in "Required checks on `main`" (14 checks), widened scopes noted,
"Contrast check" row removed from "Deferred gates".
