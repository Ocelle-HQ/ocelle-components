# Data Model: Design Tokens (002)

## Token (`packages/tokens/src/source.ts`)

| Field | Type | Rule |
|---|---|---|
| `name` | string | Appendix A name without prefix, `^[a-z][a-z0-9]*(-[a-z0-9]+)*$`; unique; never in A.6 |
| `group` | `"colour" \| "type" \| "space" \| "shape" \| "size" \| "shell" \| "elevation" \| "motion"` | FR-001; `colour` and `elevation` are theme-dependent, the others are not |
| `value` | `{ light: string; dark: string }` for theme-dependent groups, `string` otherwise | Appendix A value; a theme-independent token with a `{light, dark}` value is invalid. A reference to another token is written `var(--ocelle-<name>)`, alone or inside a larger value (`calc(100vw - 2 * var(--ocelle-gutter))`, `0 0 0 1px var(--ocelle-color-control-border), 0 2px 8px …`) |
| `ref` | `readonly string[]`, or `{ light: readonly string[]; dark: readonly string[] }` for theme-dependent groups; optional | derived token (FR-002): every token name the value references, per theme where the value is per theme (`elevation-raised`: `{ light: [], dark: ["color-rule-strong"] }`). It equals exactly the set of `var(--ocelle-…)` names in the value |
| `contrast` | `{ kind: "text" \| "non-text"; grounds: readonly string[]; exempt?: true }`, colour only, optional | A.8 intended grounds; `exempt` only for `color-disabled-ink` (FR-017) |

The use of each token (Appendix A's "Use" column, A.3 named uses) is a comment beside its record, not a field
(operator decision 2026-11-03, squad round 1, PLAN-TESTABILITY-1-003 (a)): nothing reads it, so it is not data.

`ref` and `grounds` are typed `string` in the source, not `TokenName`: `TokenName` is derived from the source, so a
source typed with it is circular (TS2456, TS2502, TS7022 under `--strict`; PLAN-FRESH-1-008). `validateSource` checks
them instead, with a unit test per rule and the gates' exit 2 on failure.

Validation (`validateSource`, used by the build, the gates and a test): unique names; no A.6 name; every `ref` name
and every ground exists; each `ref` equals the set of `var(--ocelle-…)` names in the value of the same theme; no
reference cycle; every colour value is a 6-digit hex or, for `color-overlay`, `rgb(… / α)`, except `color-scheme`,
whose values are exactly `light` and `dark`; grounds are opaque colour tokens; `contrast` only on opaque colour
tokens. Each failure names the token and the rule.

Derived: `TokenName` (union of the record names only: `(typeof source)[number]["name"]` over a source declared
`as const satisfies readonly TokenRecord[]` with `TokenRecord` using `string`), `tokenNames` (array),
`cssName(name)` = `--ocelle-${name}`.

## JSON export (`dist/tokens.json`, contracts/token-package.md)

Per token: `name` (full, `--ocelle-…`), `group`, `light` and `dark` or `value`, all resolved (FR-008), and, for a
derived token, `ref` in the same full-name form and the same shape as the source's `ref`
(`"ref": ["--ocelle-space-4"]`; `"ref": { "light": [], "dark": ["--ocelle-color-rule-strong"] }`). No `use`.

## Contrast pair (`packages/tokens/contrast/pairs.json`)

| Field | Type | Rule |
|---|---|---|
| `theme` | `"light" \| "dark"` | |
| `fg`, `bg` | token name | opaque colour tokens |
| `kind` | `"text" \| "non-text"` | threshold 4.5 or 3 |
| `figure` | string, decimal | recorded figure; precision = its number of decimals |
| `status` | `"checked" \| "excluded"` | `excluded` needs `reason`, and must not be a required pair (R-07, FR-016) |
| `reason` | string | non-empty when excluded |
| `source` | `"#5" \| "computed"` | `#5` for A.7 figures (change needs operator approval), `computed` otherwise |

Required pair set (derived, not stored): for each token with `contrast`, each ground, each theme (A.8); 144 per theme.

## Theme condition (tests only)

`system-light`, `system-dark`, `no-preference`, `system-dark+data-theme=light`, `system-light+data-theme=dark`,
`no-preference+data-theme=dark` (FR-006); expected theme: light, dark, light, light, dark, dark. Plus the run-time
removal of `data-theme`.

## Expected tables (tests only)

Transcribed by hand from Appendix A into the test code, never read from `source.ts` (PLAN-TESTABILITY-1-001, -002):

- **Token table**: every token name of Appendix A with its expected value per theme (literal values, including the
  values of A.1, A.4 and A.5 the plan supplied) and, for derived tokens, the expected reference form; and the six A.6
  names.
- **Required pair table**: the 144 `(fg, bg, kind)` triples per theme of A.8.

## Element name list (style-lint, R-09)

The tag names, without `ocelle-`, of the elements declared in the custom-elements manifest of `@ocelle/elements`
(`packages/elements/custom-elements.json`; empty while no element exists). A `var(--ocelle-<element>-<property>)`
reference with `<element>` in the list is an element custom property and is exempt from the unknown-token check
(FR-010). The rule also takes the token and element lists as options, for unit tests.

## Font asset (`packages/tokens/fonts/SOURCE.json`)

`{ repository, commit (40 hex), files: [{ path, upstreamPath, sha256 }] }` for the WOFF2 and `OFL.txt`.

## Role mapping (`specs/002-design-tokens/sk-mapping.md`)

Header: kitty-mission-ui commit read. Table rows: role (column 1), replacement token or `dropped` (column 2),
replacement to use when dropped or merged (column 3), note. 55 rows.

## Gate findings (new rules)

Each finding line is `<path>:<line>: <gate-id>: <rule-id>: <message>` (gates/README.md). The rule ids below are the
one form used in code, plants and documents; plants match the rule id and message exactly.

| Gate | Rule id | Location |
|---|---|---|
| `contrast` | `below-threshold`, `figure-mismatch`, `unknown-token`, `not-opaque`, `missing-required-pair`, `required-pair-excluded`, `excluded-without-reason` | `packages/tokens/contrast/pairs.json:<line>` (or `source.ts` for a missing pair) |
| `brand-rules` | `monospace-font` (a), `link-accent` (b), `radius-set` (c), `rule-boundary` (d), `dark-chrome` (e), `reduced-motion` (f), `forced-colours` (g) | `packages/tokens/src/source.ts:<line>`, `packages/tokens/contrast/pairs.json:<line>` (b, the excluded ochre pair), or the generated stylesheet |
| `style-lint` | `ocelle/token-only` with message `unknown token --ocelle-<name>` | the stylesheet line |
