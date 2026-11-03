# Data Model: Design Tokens (002)

## Token (`packages/tokens/src/source.ts`)

| Field | Type | Rule |
|---|---|---|
| `name` | string | Appendix A name without prefix, `^[a-z][a-z0-9]*(-[a-z0-9]+)*$`; unique; never in A.6 |
| `group` | `"colour" \| "type" \| "space" \| "shape" \| "size" \| "shell" \| "elevation" \| "motion"` | FR-001; `colour` and `elevation` are theme-dependent, the others are not |
| `value` | `{ light: string; dark: string }` for theme-dependent groups, `string` otherwise | Appendix A value; a theme-independent token with a `{light, dark}` value is invalid |
| `ref` | token name, optional | derived token (FR-002): `value` is then written as `var(--ocelle-<ref>)` or a `calc()` over refs; `ref` lists every token referenced |
| `use` | string, optional | #5's "Use" column or A.3 named use |
| `contrast` | `{ kind: "text" \| "non-text"; grounds: readonly TokenName[]; exempt?: true }`, colour only, optional | A.8 intended grounds; `exempt` only for `color-disabled-ink` (FR-017) |

Validation (`validateSource`, used by the build, the gates and a test): unique names; no A.6 name; every `ref` and
every ground exists; no reference cycle; every colour value is a 6-digit hex or, for `color-overlay`, `rgb(… / α)`;
grounds are opaque colour tokens.

Derived: `TokenName` (union type of names), `tokenNames` (array), `cssName(name)` = `--ocelle-${name}`.

## Contrast pair (`packages/tokens/contrast/pairs.json`)

| Field | Type | Rule |
|---|---|---|
| `theme` | `"light" \| "dark"` | |
| `fg`, `bg` | token name | opaque colour tokens |
| `kind` | `"text" \| "non-text"` | threshold 4.5 or 3 |
| `figure` | string, decimal | recorded figure; precision = its number of decimals |
| `status` | `"checked" \| "excluded"` | `excluded` needs `reason`, and must not be a required pair (R-07) |
| `reason` | string | non-empty when excluded |
| `source` | `"#5" \| "computed"` | `#5` for A.7 figures (change needs operator approval), `computed` otherwise |

Required pair set (derived, not stored): for each token with `contrast`, each ground, each theme (A.8); 130 per theme.

## Theme condition (tests only)

`system-light`, `system-dark`, `no-preference`, `system-dark+data-theme=light`, `system-light+data-theme=dark`,
`no-preference+data-theme=dark` (FR-006); expected theme: light, dark, light, light, dark, dark. Plus the run-time
removal of `data-theme`.

## Font asset (`packages/tokens/fonts/SOURCE.json`)

`{ repository, commit (40 hex), files: [{ path, upstreamPath, sha256 }] }` for the WOFF2 and `OFL.txt`.

## Role mapping (`specs/002-design-tokens/sk-mapping.md`)

Header: kitty-mission-ui commit read. Table rows: role (column 1), replacement token or `dropped` (column 2),
replacement to use when dropped or merged (column 3), note. 55 rows.

## Gate findings (new rules)

| Gate | Rule id | Location |
|---|---|---|
| `contrast` | `below-threshold`, `figure-mismatch`, `unknown-token`, `not-opaque`, `missing-required-pair`, `required-pair-excluded`, `excluded-without-reason` | `packages/tokens/contrast/pairs.json:<line>` (or `source.ts` for a missing pair) |
| `brand-rules` | `monospace-font` (a), `link-accent` (b), `radius-set` (c), `rule-boundary` (d), `dark-chrome` (e), `reduced-motion` (f), `forced-colours` (g) | `packages/tokens/src/source.ts:<line>` or the generated stylesheet |
| `style-lint` | `ocelle/token-only` with message `unknown token --ocelle-<name>` | the stylesheet line |
