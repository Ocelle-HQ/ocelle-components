---
phase: 3
round: 1
verdict: approved
base: b560a426f76c0e5332a354a5d0c9860ce88d740c
head: 8fc6f6f46d5d9eec1be83c7e0c33c820dab19783
tdd_check: pass
---

# Phase 3 review, round 1

Change under review: `git diff b560a42..8fc6f6f` (9 commits, no uncommitted change). User Story 2, the icon set:
the twelve remaining drawings in `packages/elements/src/icons.ts`, the `mirror` class and
`:host(:dir(rtl)) .mirror { scale: -1 1; }` in `packages/elements/src/ocelle-icon.ts`, the `scale` allowance of
`gates/stylelint/token-only.ts` with its four plants, the code-point module order of
`packages/elements/scripts/manifest.ts`, the README icon table and licence sentence, the CHANGELOG names, the Storybook
grids, and the regenerated manifests (package and the seven manifest plants).

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | note | `packages/elements/scripts/manifest.ts:83-85`; `packages/elements/test/node/manifest.test.ts:127` | `byCodePoint` returns `1` for two equal strings in both argument orders, so it is not a consistent comparator under ECMA-262 (`Array.prototype.sort` order is then implementation-defined). The test "keeps two modules with the same path in the order the analyzer gave them" therefore pins V8's TimSort behaviour rather than a language guarantee. Harmless in practice: module paths are one per file and Node is pinned. The name says code point while the comment (correctly) says UTF-16 code unit; identical for the ASCII paths in use. | Optional: `a < b ? -1 : a > b ? 1 : 0` (stable sort then keeps equal paths in order by specification), with the matching mutation coverage; or leave as is. |
| R1-02 | note | `storybook/stories/icon.stories.ts:25` | The story export `Set` shadows the global `Set` constructor inside the story module. Nothing in the module uses `Set`, so there is no effect today; a later edit that writes `new Set(...)` in this file would get the story object. | Optional: rename the export (for example `TheSet` with `name: "Set"`, which keeps the story id only if the id is set explicitly) when the file is next touched. |

No blocking finding.

## Test quality

- **Red evidence.** `red-commits` has one entry, `654ac79` (changes only test files: test code under
  `packages/elements/test/`, `gates/test/`, `storybook/test/`). `red-phase.log` and `check-red-phase.log`: 72 of 2295
  tests failed, every failure an `AssertionError` (no import, syntax or setup error): the 13 per-harness icon-set
  scenarios that need undrawn names or mirroring (the per-name scenarios of `menu` and `close` pass at red, as
  `notes.md` explains: both were drawn in phase 2, and T032 asks for every check per name), the code-point order and the
  thirteen-name union in `manifest.test.ts`, the README and CHANGELOG statements, the 19 `token-only` cases (each
  allowed-value guard shares its test with `scale: -1 1`, which was raw before), US1-6 on `search` in both harnesses, and
  the four new story cases. `check-final-tests-on-base.log`: the final tests fail on the base, 75 of 2299, all
  assertions. `tdd-check.json`: `pass`, head exit 0, no problem.
- **No weakening.** `git diff 654ac79..HEAD` on test files: `expectedDrawing()` now also expects `class="mirror"` on
  the `svg` of the four inline-direction icons (stricter, reason in the body of `c7cdc00`: R-08 names the class);
  `251cb05` adds three `token-only` raw cases and the equal-path manifest test (additions only);
  `storybook/stories/icon.stories.ts` gains the `Set` grids (T038, the implementation of T035a's test). Nothing removed,
  skipped or loosened. Phase 2's `scenarios/icon.ts` helpers were exported and parameterised by name; the phase 2
  forced-colour scenarios still expect `close` with `painted: 3`, and US1-6 now additionally asserts the `search`
  drawing.
- **Assertions.** Every new test ends in one `toEqual`/`toContain` over observed values from the rendered DOM,
  `getBBox()` geometry, decoded screenshot pixels, the accessibility tree or the gate's output; no conditional
  assertion, no `skip`/`only`, no snapshot, no mock assertion (test-lint: 141 files, no finding). The painted-area
  check reads the rendered geometry, not the expected table; the forbidden-content check reads every element and
  attribute of the shadow root by qualified name, including `xlink:href` (analysis L13). The mirroring scenario
  asserts integer box coordinates and 80 × 80 captures as setup before comparing (R-08), in one test for all thirteen
  names, in both harnesses.
- **Scenario coverage.** US2-1 (names, manifest union, README table and need per name), US2-2 (non-empty, painted
  area 0 to 24, thirteen distinct, near-miss names draw nothing), US2-3 (shared `svg` attributes, geometry attributes
  only, forbidden list), US2-4 (pixel rules, both directions, in-process and strict-CSP fixture), US2-5 first half
  (README licence sentence). Per name: US1-2's box and US1-7's forced-colour contexts (analysis G1). No events or
  keyboard paths in this phase.
- **Exemption.** `tdd-exempt.md` exempts only US2-5's "`THIRD_PARTY_NOTICES` lists no icon set". It holds: neither
  `THIRD_PARTY_NOTICES` nor `packages/elements/THIRD_PARTY_NOTICES` mentions an icon at base or head, so a test of the
  absence passes on the base and could not be seen red.
- **Mutation.** `pnpm run gate:mutation -- --base b560a42` (rerun by the reviewer): exit 0, 135 mutants on the
  changed lines of 4 files (`token-only.ts`, `manifest.ts`, `icons.ts`, `ocelle-icon.ts`), none survived. One
  equivalent record, `gates/stylelint/token-only.ts:138` (`StringLiteral,BooleanLiteral` on
  `classify([node], "scale", false)`): checked against `classify`/`wordAllowed` (lines 51-91). Only non-number nodes
  reach that call; the property is read only for font properties and unitless numbers, and `inCalc` only for numbers
  and the operator words, which outside `calc()` are allowed anyway as identifiers that are no named colour. The record
  is equivalent as stated. The two phase 2 records on `mirror: false` are gone, as `notes.md` says.
- **Plants.** `gate:plants` (rerun): 208 plants judged as expected, including `pass-scale-mirror`,
  `fail-scale-factor`, `fail-scale-length`, `fail-scale-calc`. The pairing plant "mirroring applied to every icon" is
  recorded in `plants.md` (bites on `copy`, `file`, `folder`, `search` in both harnesses); not rerun here, since it
  needs a source edit, but its outcome agrees with `spike.md`'s measurement (12 % to 27 % of pixels over 32/255 for
  those four, against the 1 % cap) and with the scenario's per-name `rtlEqualsLtr: true` expectations.

## Checks run

Node 22, `OCELLE_CHROMIUM_PATH` as given, one job at a time, at HEAD `8fc6f6f`:

| Check | Result |
|---|---|
| `gate:typecheck` | exit 0 |
| `gate:lint` | exit 0, 209 files |
| `gate:test-lint` | exit 0, 141 files |
| `gate:style-lint` | exit 0, 9 files |
| `gate:manifest` | exit 0, 1 element |
| `gate:pins`, `gate:config-copies`, `gate:contrast`, `gate:brand-rules` | exit 0 |
| `pnpm -r build` (incl. Storybook build), then `gate:csp`, `gate:prefix` | exit 0; csp 30 files, prefix 182 files, no finding |
| `pnpm test` | exit 0, 2299 tests in 113 files (in-process, strict-CSP fixture and built-Storybook story tests included) |
| `gate:mutation -- --base b560a42` | exit 0, 135 mutants, none survived, 1 equivalent record (accepted above) |
| `gate:plants` | exit 0, 208 plants of 14 gates |
| `gate:signoff -- --range b560a42..HEAD` | exit 0, 9 commits |

Visual baselines and axe over stories are deferred to #10 (FR-019, plan Complexity Tracking); not a finding of this
phase.

Tasks: T031 to T040 are ticked and present (`spike.md`; `icons-expected.ts`, `scenarios/icon-set.ts`, both harness
files, manifest union test; `token-only` tests and plants; README/CHANGELOG tests; story test; `token-only.ts`;
`icons.ts` and `ocelle-icon.ts` with the regenerated `custom-elements.json`; the grids; README, CHANGELOG,
`tdd-exempt.md`; `plants.md`). Changes outside the task list have reasons in `notes.md`: `.gitignore` (`.vitest/`),
the seven manifest plants' regenerated copies (`7a725e2`), `gates/README.md` (the style-lint row). Drawings match
R-07 (geometry within 2 to 22, every shape kind used, `mirror` on exactly the four inline-direction icons, table typed
`Readonly<Record<IconName, Icon>>` and not `as const`); mirroring matches R-08; the `scale` rule matches R-03 (bare
`-1`/`1` only, any function raw). Constitution: `ocelle-` names only; no I/O; tokens only (the one new declaration is
the lint-allowed `scale: -1 1`); the drawings stay `aria-hidden`, `currentColor`, no ID references; no inline style
or network request on the fixture or in the stories (asserted clean in every fixture test and story test); the
package exports no list of names (FR-018); licence sentence present, no third-party icon asset.

## Earlier findings

First review of phase 3; no earlier round. Phase 2 round 1's notes carried into this phase are resolved:

- **Phase 2 R1-03** (driver `pixels`/`dir`, the other `Shape` kinds, US1-6 on `search`): `scenarios/driver.ts`
  declares `elements`, `geometry`, `dir`, `pixels`; `icons.ts` has the line, polyline, path, rect and circle kinds,
  each used; US1-6 mounts `search` and asserts its drawing (`scenarios/icon.ts`).
- **Phase 2 R1-06** (locale-dependent module order): `normalise` sorts by code unit; the test "orders the modules by
  code point, not by locale" was red in `654ac79` (`red-phase.log`, `manifest.test.ts:120`). See R1-01 for a note on
  the comparator's equal case.
