# Data Model: Design Tokens (002)

## Token (`packages/tokens/src/source.ts`)

| Field | Type | Rule |
|---|---|---|
| `name` | string | Appendix A name without prefix, `^[a-z][a-z0-9]*(-[a-z0-9]+)*$`; unique; never in A.6 |
| `group` | `"colour" \| "type" \| "space" \| "shape" \| "size" \| "shell" \| "elevation" \| "motion"` | FR-001; `colour` and `elevation` are theme-dependent, the others are not |
| `value` | `{ light: string; dark: string }` for theme-dependent groups, `string` otherwise | Appendix A value; a theme-independent token with a `{light, dark}` value is invalid. A reference to another token is written `var(--ocelle-<name>)`, alone or inside a larger value (`calc(100vw - 2 * var(--ocelle-gutter))`, `0 0 0 1px var(--ocelle-color-control-border), 0 2px 8px …`) |
| `ref` | `readonly string[]`, or `{ light: readonly string[]; dark: readonly string[] }` for theme-dependent groups; optional | derived token (FR-002): every token name the value references, per theme where the value is per theme (`elevation-raised`: `{ light: [], dark: ["color-rule-strong"] }`). It equals exactly the set of `var(--ocelle-…)` names in the value |
| `contrast` | `{ kind: "text" \| "non-text"; grounds: readonly string[]; exempt?: true }`, colour only, optional | A.8 intended grounds; `exempt` only for `color-disabled-ink` (FR-017), enforced by `validateSource` (below) |

The use of each token (Appendix A's "Use" column, A.3 named uses) is a comment beside its record, not a field
(operator decision 2026-11-03, squad round 1, PLAN-TESTABILITY-1-003 (a)): nothing reads it, so it is not data.

`ref` and `grounds` are typed `string` in the source, not `TokenName`: `TokenName` is derived from the source, so a
source typed with it is circular (TS2456, TS2502, TS7022 under `--strict`; PLAN-FRESH-1-008). `validateSource` checks
them instead, with a unit test per rule and the gates' exit 2 on failure.

Validation (`validateSource`, used by the build, the gates and a test): unique names; no A.6 name; every `ref` name
and every ground exists; each `ref` equals the set of `var(--ocelle-…)` names in the value of the same theme; no
reference cycle; every colour value (group `colour`) is one of: a 6-digit hex; for `color-overlay`, `rgb(… / α)`;
for `color-scheme`, exactly `light` and `dark`; or exactly one reference `var(--ocelle-<name>)` making up the whole
value, where `<name>` is a colour token other than `color-scheme` (`color-focus`, `color-current`:
`var(--ocelle-color-accent-strong)`; PLAN-FRESH-2-005). Opacity is judged on the **resolved** value (below): a
colour token is opaque in a theme when its resolved value is a 6-digit hex. Grounds are colour tokens that are
opaque in both themes; `contrast` only on colour tokens that are opaque in both themes. So `color-focus` may carry
`contrast` (it resolves to `#8F5E0F` / `#E0A23A`), and a token whose value references `color-overlay` may neither
carry `contrast` nor be a ground. `contrast.exempt` is allowed on `color-disabled-ink` only: on any other token
`validateSource` fails with the problem `token <name>: exempt is allowed only on color-disabled-ink`, whatever the
token's values or figures, so a token cannot switch off the contrast threshold for itself, and the build, style-lint,
`contrast` and `brand-rules` all stop on it (landing L1-01; operator round 3 of phase 5, 2026-11-04). The `contrast`
gate exempts an entry from the threshold only through this flag, so the exemption follows the name. The colour-value
rules apply to the colour group only: `elevation-*` values, which mix `var()` references with literal shadows, are
checked only by the `ref` rules. Each failure names the token and the rule.

Resolution (`resolve(source, name, theme)`, exported from `packages/tokens/src/generate.ts`; PLAN-FRESH-2-005): the
token's value in that theme with every `var(--ocelle-<ref>)` replaced by the resolved value of `<ref>` in the same
theme, recursively (no cycle, by validation). It is the one resolver: `json()` uses it for the resolved values of
the JSON export (FR-008), `validateSource` uses it for the opacity rules, and the `contrast` gate uses it, through
`gates/lib/token-source.ts`, which imports the root's `generate.ts` (FR-017). Unit tests (fixture sources, plus one on
the real source): `color-focus` resolves to `color-accent-strong`'s value in each theme and follows a change of it;
a colour token referencing `color-overlay` is not opaque, so `contrast` on it and its use as a ground fail
validation; a reference to `color-scheme` from a colour value fails validation.

Derived: `TokenName` (union of the record names only: `(typeof records)[number]["name"]` over the records declared
`as const satisfies readonly TokenRecord[]` with `TokenRecord` using `string`), `tokenNames` (array),
`cssName(name)` = `--ocelle-${name}`.

`source.ts` exports `records` (the token records above) and `source = applyOverrides(records, overrides)`, the list
every consumer reads (the generator, the build, the gates, the stories). `applyOverrides` is a pure function of
`generate.ts`; `overrides` comes from `packages/tokens/src/overrides.ts` (below).

## Token overrides (`packages/tokens/src/overrides.ts`)

The way a plant changes the token source by key, not by line (operator decision 2026-11-03, squad round 3,
PLAN-FRESH-3-003 (a); contracts/gates.md § Configuration set). The module exports `overrides: readonly
TokenOverride[]`, and the committed module exports an empty list; a test in the `tokens` project asserts it is empty,
so the records in `source.ts` are exactly what ships. A `TokenOverride` is one of:

| Form | Effect of `applyOverrides` |
|---|---|
| `{ token, light?, dark?, value?, ref?, contrast? }` | on the record with that name, `light` and `dark` set the value of that theme, the others replace the field; an unknown name throws, naming it |
| `{ add: TokenRecord }` | appends the record; a name already present throws |
| `{ remove: name }` | drops the record; an unknown name throws |

The result goes through `validateSource` like any source. Unit tests of `applyOverrides` on fixture records cover each
form and each error.

**Token location**: a gate finding about a token is located at the line of its `name` in `source.ts`, or, for a
token only an override adds, at the line of its `name` in `overrides.ts`; a token changed by an override keeps its
location in `source.ts`.

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

The list is a JSON array with one entry per line. A plant changes it by key `(theme, fg, bg)` through its
`delta.json` (contracts/gates.md § Configuration set), never by a line-based patch: a unified diff carries
neighbouring entries as context and a line number shifts with every insertion above it, so neither may tie a plant
to its neighbours (PLAN-FRESH-3-003). A breaking plant whose input is a list that cannot be checked replaces the
whole list through the closed `delta.json` part `"pairsList": "empty" | "not-json"`: `empty` writes `[]`, `not-json`
writes the fixed text that does not parse as JSON named in contracts/gates.md § Configuration set. No other text can
be written, so no plant carries a copy of the list, and a delta cannot have both `pairs` and `pairsList` (operator
decision 2026-11-04, phase 5 review round 1, R1-01 (c)).

Required pair set (derived, not stored): for each token with `contrast`, each ground, each theme (A.8); 149 per theme. With
the excluded pairs of A.9 the list has 158 entries in light and 157 in dark.

## Theme condition (tests only)

`system-light`, `system-dark`, `no-preference`, `system-dark+data-theme=light`, `system-light+data-theme=dark`,
`no-preference+data-theme=dark` (FR-006); expected theme: light, dark, light, light, dark, dark. Plus the run-time
removal of `data-theme`.

## Expected tables (tests only)

Transcribed by hand from Appendix A into the test code, never read from `source.ts` (PLAN-TESTABILITY-1-001, -002):

- **Token table**: every token name of Appendix A with its expected value per theme (literal values, including the
  values of A.1, A.4 and A.5 the plan supplied) and, for derived tokens, the expected reference form; and the six A.6
  names. Each entry has a comparison kind: `colour` (computed value parsed as RGBA), `keyword` (computed value,
  trimmed, compared as a string; only `color-scheme`, whose expected values are `light` and `dark` and which is never
  parsed as a colour), or the probe of R-03 for non-colour tokens.
- **Required pair table**: the 149 `(fg, bg, kind)` triples per theme of A.8.

The token table is used twice: by the browser suites (computed values, R-03), and by a node test that runs the
generator on the **real** source and compares its output with the table (PLAN-FRESH-2-002): for each token, the
stylesheet declaration's value per theme (for colours the token stream, hex compared case-insensitively; for the
others the exact text, derived tokens in their expected reference form) and the resolved value of `json()`. This
node test, not the browser suites, is what kills the value mutants of `source.ts` (R-03).

## Element property list (style-lint, R-09)

The custom property names the custom-elements manifest of `@ocelle/elements` declares: the `cssProperties[].name` of
every declaration in `packages/elements/custom-elements.json` (operator decision 2026-11-03, squad round 2,
PLAN-FRESH-2-003 (a)). The manifest is a committed file at that path (constitution I public surface), kept current
by the element features; while it does not exist (no element yet) the list is empty (PLAN-FRESH-2-004). A
`var(--ocelle-…)` reference whose full name is in the list is an element custom property and is exempt from the
unknown-token check (FR-010); no prefix is exempt, so `--ocelle-button-gpa` is unknown even when the manifest
declares `--ocelle-button-gap`. A declared name equal to a token's full name is a clash: the rule fails to load
(exit 2). The rule also takes the token and element property lists as options, for unit tests.

## Font asset (`packages/tokens/fonts/SOURCE.json`)

`{ repository, commit (40 hex), files: [{ path, upstreamPath, sha256 }] }` for the WOFF2 and `OFL.txt`.

## Role mapping (`specs/002-design-tokens/sk-mapping.md`)

Header: kitty-mission-ui commit read. Table rows: role (column 1), replacement token or `dropped` (column 2),
replacement to use when dropped or merged (column 3), note. 55 rows.

## Gate findings (new rules)

Each finding line is `<path>:<line>: <gate-id>: <rule-id>: <message>` (gates/README.md). The rule ids below are the
one form used in code, plants and documents; plants match the rule id and message exactly. A `contrast` or
`brand-rules` plant writes the location by key (`pairs.json#<theme>/<fg>/<bg>`, `source.ts#<name>`,
`overrides.ts#<name>`, `tokens.css#<text>`, each with its repository path), which the plant runner resolves to the
line in the plant's built tree (contracts/gates.md § Configuration set, *Keyed locations*).

`contrast` per entry (PLAN-FRESH-2-006): an entry with an `unknown-token` or `not-opaque` finding has no ratio and
gives no other finding. Otherwise the ratio is computed and each applicable finding is given, independently, in
this order: `figure-mismatch`, then `below-threshold` (checked, non-exempt entries only), then
`excluded-without-reason` and `required-pair-excluded` (excluded entries). So an entry can give both
`figure-mismatch` and `below-threshold`. Findings are printed in the order of the list's lines, then the
`missing-required-pair` findings in the order of the source.

| Gate | Rule id | Location |
|---|---|---|
| `contrast` | `below-threshold`, `figure-mismatch`, `unknown-token`, `not-opaque`, `missing-required-pair`, `required-pair-excluded`, `excluded-without-reason` | `packages/tokens/contrast/pairs.json:<line>` (or the foreground token's location, § Token overrides, for a missing pair) |
| `brand-rules` | `monospace-font` (a), `link-accent` (b), `radius-set` (c), `rule-boundary` (d), `dark-chrome` (e), `reduced-motion` (f), `forced-colours` (g) | the token's location (§ Token overrides), `packages/tokens/contrast/pairs.json:<line>` (b, the excluded ochre pair), or `packages/tokens/dist/tokens.css:<line>`, the line in the stylesheet text the root's generator produces (f, g; no file is read) |
| `style-lint` | `ocelle/token-only` with message `unknown token --ocelle-<name>` | the stylesheet line |
