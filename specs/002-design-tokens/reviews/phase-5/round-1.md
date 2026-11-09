---
phase: 5
round: 1
verdict: approved
base: eeb95d43d7ffa147e14193e215859c2c4a41586d
head: 334c708202fcaa992dfcbfb638109f12c618c1b4
tdd_check: pass
---

# Phase 5 review, round 1

Scope: `git diff eeb95d4..334c708` (scaffold 9c157b2, red 06a58cb, green 47ce6a9, mutation survivors 334c708) plus
the uncommitted `tdd-check.sh 5` evidence. T050 to T063 are ticked and their work is present: `gates/lib/wcag.ts`,
`gates/lib/token-source.ts`, `gates/bin/contrast.ts`, `gates/bin/brand-rules.ts`, the delta and keyed-location
handling in `gates/lib/plant-repo.ts` and `gates/lib/plant-runner.ts`, `packages/tokens/contrast/pairs.json`
(158 light, 157 dark), the 27 plants of contracts/gates.md § Plants, the registry, the FR-020 list, the CI jobs,
`gates/README.md` and the ruleset note in `notes.md`. Nothing outside the phase was changed.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | note (operator decision) | gates/lib/plant-repo.ts:164, :189, :213-214, :354; contracts/gates.md:17, :36 | `delta.json` has a fourth part, `pairsText`, which is not in the contract. The contract says "up to three parts" and that `tree/` must not hold `pairs.json`. That is an operator decision (PLAN-FRESH-3-003 (a)). FR-020 still requires the `empty-list` and `unparsable-list` breaking plants. An unparsable list cannot be written in any contract form. An empty list can be written only by removing all 315 entries by key, which ties the plant to every entry and breaks under robustness variant (2), so the gap is real. Two problems remain. (1) contracts/gates.md and data-model.md still describe three parts, so the record and the code disagree. (2) Nothing limits `pairsText` to breaking plants: `parseDelta` and `treeProblems` never look at `plant.json`. A future fail or pass plant could carry a whole copy of the pair list in `pairsText`, which is exactly what the operator decision forbids. Today only `contrast/empty-list` and `contrast/unparsable-list` use it, both `expect: "error"`. | Operator chooses one. **(a)** Keep `pairsText`. Amend contracts/gates.md § Plant deltas and data-model.md § Contrast pair to list it. Have the plant job reject `pairsText` unless the plant's `expect` is `error` (with a red test first). **(b)** Remove `pairsText` and allow `tree/packages/tokens/contrast/pairs.json` in plants with `expect: "error"` only (change local to `treeProblems`, with a red test). Amend the contract the same way. **(c)** Replace the free text with a closed form, for example `"pairsList": "empty" \| "not-json"`, which the runner turns into `[]\n` or a fixed broken text. This is the tightest: no copy can ever be expressed. Amend the contract the same way. With (a) or (b), the contract amendment is the operator's change. I recommend (c), or (a) with the enforcement. |
| R1-02 | note | gates/bin/brand-rules.ts:250; contracts/gates.md:84 | The contract says "exit 1 with one finding per broken rule (a)–(g)". The gate gives one finding per token, entry or declaration that breaks a rule, in rule order (a) to (g) and in source or stylesheet order within a rule. For example, two missing radii give two `radius-set` findings. This is the reading that lets each finding name its token and location, as US3 scenario 6 and data-model § Gate findings require, and `brand-rules.test.ts` ("prints the findings in rule order (a) to (g), then the count") pins it. I accept it. If the operator wants the contract wording changed to "at least one finding per broken rule, one per token", that is a documentation edit. | None for this phase. |
| R1-03 | note | gates/lib/token-source.ts:148 | The pair list must hold one entry per line: an entry is a line whose trimmed start is `{`, and a different count is exit 2 "not one entry per line". This is not a silent choice. data-model.md:88 states "The list is a JSON array with one entry per line", and line locations depend on it. An entry spread over several lines still passes and is located at its first line, which is harmless. | None. |
| R1-04 | note | gates/bin/brand-rules.ts:247 | If a root's generator returns CSS that PostCSS cannot parse, `postcss.parse` throws a `CssSyntaxError`, not `CannotRun`. `cli.ts` turns it into exit 2 `could not run: …`, not the contract form `brand-rules: cannot run: <file>: <cause>`. The gate still never passes, and no plant or requirement covers this case. | Optional: wrap it as `CannotRun(tokenPaths.generator, …)`, test first, in a later change. |
| R1-05 | note | gates/bin/contrast.ts:83-86 | `--print` writes `<theme> <fg> on <bg> (<kind>): <ratio to 4 decimals>`, one line per required pair in source order, exit 0. The contract gives no format. This one is readable, matches the findings' pair label, and `token-gates.test.ts` asserts 298 lines. Summary lines `contrast: <k> finding(s)` and `brand-rules: <k> finding(s)` follow the 001 `plural` convention. | None. |

No blocking finding.

## Test quality

**Red evidence.** `red-phase.log` (06a58cb) fails on assertions or on the scaffold's `not implemented` throws, for
example `contrastRatio(...)`, `requiredPairs(109)`, a promise that resolved instead of rejecting, gates printing the
scaffold line instead of findings, and missing `gates/plants/contrast`. All of these are missing behaviour, not syntax
or import errors. `tdd-check.json`: `status: pass`. The final tests fail on the base (exit 2) and on the scaffold
(exit 1), and pass at head (exit 0). The scaffold commit adds exported signatures and two package scripts only. No
test file is in it, and every function throws or returns 0.

**Tests changed after red** (`git diff 06a58cb..334c708 -- gates/test`). I checked each correction in the green
commit:

- `contrast.test.ts` "holds an excluded pair to its figure": 4.0 → 3.9. The computed ratio 3.9858 lies in
  [3.95, 4.05), so 4.0 *matched* and the test could not show a mismatch. 3.9 misses. **Fixed a wrong test.**
- `contrast.test.ts` ordering test: 6.1 → 6.2. 6.0830 lies in [6.05, 6.15), so 6.1 matched. **Fixed a wrong test**;
  the asserted finding order is unchanged.
- `contrast.test.ts` "counts a pair outside the required set": ink on ink, text, 1.0, is far below 4.5:1, so it gives
  `below-threshold` and the success line can never appear. The replacement is dark `color-border` on `color-ink`,
  non-text, 3.45 (3.4522, ≥ 3), outside the required set. It tests what the name says. **Fixed a wrong test.**
- `brand-rules.test.ts` missing radius: the red test expected a bare `source.ts` location for a token an override
  removes. data-model § Token overrides says a token changed by an override keeps its `source.ts` location. The
  replacement asserts the exact record lines (19, 23) and adds the bare-file case for a token absent from
  `source.ts`. **Stricter.**
- `brand-rules.test.ts` not-opaque: the fixture override set `color-link` to `var(--ocelle-color-overlay)` with no
  matching `ref`, so `validateSource` made it exit 2 for the wrong reason. Adding the `ref` makes the test reach the
  rule. The asserted finding is unchanged. **Fixed a wrong fixture.**
- `plants.test.ts`: 43 → 37. The base count was 31 and every other count in the file moved by +6 in the red
  commit, so 43 was shifted twice. **Fixed a wrong figure.**
- `plant-repo.test.ts`, `plant-runner.test.ts`, `plants-robustness.test.ts`, `contrast.test.ts`: lint and type
  fixes only (`not.toThrow()` instead of `toBeUndefined()` on a void call; tool doubles for the new `read` and
  `stylesheet` fields; a `named()` helper instead of an `as` cast). Meaning unchanged.
- 334c708 only adds tests (33 + 8 + 13 + 3 + 50 lines; no `-` line in any test file).

No test was weakened, skipped or deleted. `gate:test-lint` finds no assertion-free, conditional, skipped or focused
test. The tests assert gate output lines, exit codes and resolved locations, not mocks.

**Scenarios.** US3 1 (token-gates and contrast success on the repository: 158/157/149), 2 and 3 (threshold tests and
the two threshold plants with every finding listed), 4 (mismatch, and mismatch then below-threshold on one entry),
5 (every exit-2 cause, unknown-token, missing-required-pair, required-pair-excluded), 6 (one fixture and one plant per
rule (a) to (g), plus the ochre-pair removal), 7 (plants job: 176 plants pass; registry tests), 8
(`gates-readme.test.ts`). The A.8 set is transcribed by hand in `contrast-required.test.ts`. The A.7 figures and A.9
exclusions are checked against the real list in `contrast-pairs.test.ts`. The three robustness changes are in
`plants-robustness.test.ts`.

**Mutation.** I ran `pnpm run gate:mutation -- --base eeb95d4`: *1174 mutants on the changed lines of 9 files, none
survived; 31 equivalent records*, exit 0. I read each record:

- 25 `all` records, "process boundary, covered by gates-integration". They are on `readDelta`, `applyDelta` and
  `buildRepoTree` (plant-repo.ts), on the `read`/`stylesheet` runner tools (plants.ts) and on the two `import.meta.main`
  lines. Each names an integration test that exists and runs in `pnpm test`. This is the 001 convention for builders;
  the decisions they call (`parseDelta`, `treeProblems`, `checkWrapper`, `applyPairChanges`, `overridesText`) are pure
  and fully mutated.
- `wcag.ts:9` `<= 0.04045`: no 8-bit channel value c/255 equals 0.04045 (10/255 = 0.0392, 11/255 = 0.0431).
  Equivalent.
- Five threshold and bound records (`contrast.ts` `< threshold`; `brand-rules.ts` `< 4.5`, `>= 3`, `< 3`, `> 0.05`).
  These records are valid only if no reachable input sits exactly on the bound. Both gates pass only `#RRGGBB` values
  (checked by the `hex` regex before `contrastRatio` and `relativeLuminance`) to the comparisons. **I re-ran the
  search independently** in a separate script with the same float64 formula as `wcag.ts`
  (`parseInt/255`, `<= 0.04045`, `0.2126/0.7152/0.0722`, `(max + 0.05) / (min + 0.05)`):
  - all 2^24 luminances: 16 777 216 distinct, none equal to 0.05;
  - for every luminance as the darker colour, a binary search for the first lighter one with ratio ≥ T (the ratio is
    monotone in it): no ratio exactly 3 and none exactly 4.5. The smallest overshoots were 1.47e-13 and 7.9e-14.
  The records are correct equivalents.

## Checks run

Node 22.23.4, `PLAYWRIGHT_BROWSERS_PATH` set to the scratchpad browsers.

| Check | Result |
|---|---|
| `pnpm test` | exit 0: 1778 tests passed in 87 files |
| `pnpm run gate:contrast` | exit 0: `contrast: 158 pairs checked in light, 157 in dark (149 required per theme)` |
| `pnpm run gate:brand-rules` | exit 0: `brand-rules: 7 rules checked` |
| `pnpm run gate:plants` | exit 0: 176 plants of 13 gates and the registry judged, every plant as expected |
| `pnpm run gate:typecheck` | exit 0 |
| `pnpm run gate:lint` | exit 0: 155 files, no finding |
| `pnpm run gate:test-lint` | exit 0: 97 files, no finding |
| `pnpm run gate:style-lint` | exit 0 |
| `pnpm run gate:config-copies` | exit 0 |
| `pnpm run gate:pins` | exit 0 |
| `pnpm -r build` then `pnpm run gate:csp` | exit 0: 19 files, no finding. The implementer had not run this; it passes. |
| `pnpm -r build` then `pnpm run gate:prefix` | exit 0: 75 files, no finding |
| `pnpm run gate:mutation -- --base eeb95d4` | exit 0: 1174 mutants, none survived, 31 equivalent records |

Visual regression and axe run under `pnpm test`'s browser projects. This phase changes no element or story.

**CI** (`.github/workflows/ci.yml`). The `contrast` ("Contrast") and `brand-rules` ("Brand rules") jobs have the
same shape as the existing gate jobs: pinned `actions/checkout` SHA, `persist-credentials: false`, the shared setup,
`pnpm run gate:<id>`. They need no secret, add no permission and need no build step, because both gates import the
source and generator directly. The comment's check count is updated to fourteen. The registry plants' `ci.yml` and
`gates.json` copies were updated alongside, and the plant job's registry check passes. Making the checks required on
`main` is the operator's ruleset change, as `notes.md` records.

**Constitution.** II: the brand rules are now checked, and III: contrast is verified by an automated check. Both
gates have plants proving they fail (VIII). The gates add no I/O to elements and no network or CSP surface. VIII was
followed as described above.

**Plan.** R-07 and R-08 are followed: dynamic import under `--root`, the generator's own `resolve` and
`validateSource`, PostCSS for (f) and (g). Keyed locations and deltas follow contracts/gates.md, except R1-01. The
"Contrast check" deferral row is removed. The 001 Complexity Tracking item is closed by plan.md:247.

## Earlier findings

None. This is round 1.
