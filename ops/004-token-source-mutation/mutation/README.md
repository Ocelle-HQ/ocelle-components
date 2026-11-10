# Op 004 mutation evidence

All runs on 2026-11-10, in the sandbox: 4 cores, Node 22.23.4 (CI pins 26.13.0), Stryker 10.1.1, concurrency 8 (as
configured). `PLAYWRIGHT_BROWSERS_PATH` pointed at a scratchpad alias (`chromium-1248` → `/opt/pw-browsers/chromium-1243`,
the other entries under their own names), and `NODE_OPTIONS` held the coverage-record preload of
`gates/lib/mutation/coverage.ts` (`strykerEnv`), as the gate sets it.

## How the whole-file runs were made

From the repository root, one entry at a time:

```sh
node node_modules/@stryker-mutator/core/bin/stryker.js run <scratch config> --mutate packages/tokens/src/source.ts:<start>-<end>
```

The scratch config is `stryker.config.json` with `"checkers": []`, the TypeScript checker plugin dropped from
`plugins`, and absolute paths for `vitest.configFile` and `tsconfigFile`. Everything else is as configured
(`coverageAnalysis: perTest`, `timeoutMS` and `timeoutFactor` at Stryker's defaults, `ignoreStatic` off). Each entry's
clear-text output is `entry-<start>_<end>.txt` (its last line is the exit code and the wall time), and its JSON report
is `entry-<start>_<end>.json`.

## Final source (T009)

`source.ts` has 230 lines. Entries `1-60`, `61-120`, `121-180` and `181-230`.

| Entry | Mutants | Killed | Timeout | Survived | NoCoverage | CompileError | Time | Within 176 s |
|---|---|---|---|---|---|---|---|---|
| `1-60` | 135 | 135 | 0 | 0 | 0 | 0 | 58 s | yes |
| `61-120` | 202 | 202 | 0 | 0 | 0 | 0 | 65 s | yes |
| `121-180` | 224 | 127 | 97 | 0 | 0 | 0 | 578 s | **no** |
| `181-230` | 120 | 96 | 24 | 0 | 0 | 0 | 188 s | **no** |
| **Total** | **681** | **560** | **121** | **0** | **0** | **0** | 889 s | |

Before the op the file had 0 mutants (002 phase 3 `spike.md` § 5).

**SC-001.** Every line of `source.ts` from line 13 on that holds a string literal outside a comment (every line of a
record or of a ground list) carries at least one mutant in the reports. The check read the source line by line and
looked each line up in the four JSON reports; it found no line without a mutant.

**Stryker's initial test run passed in every entry** (1826 tests), so `packages/tokens/test/source-form.test.ts`
passes on the instrumented copy of `source.ts` in the sandbox, as acceptance 1 requires.

**Killed by.** 545 kills by `gates/test/contrast.test.ts` ("passes the repository's values": a mutant that breaks
validation or a contrast pair makes the gate exit 2 or 1), 10 by `storybook/test/unit/stories.test.ts` (the Shell and
Motion story lists, against `expected.ts`) and 5 by `gates/test/brand-rules.test.ts`.

## Timeouts (T010)

Stryker runs a static mutant against every test (`ignoreStatic` off), with a limit of
`timeoutFactor × net time of all tests + timeoutMS + overhead` = 1.5 × ≈6 s + 5 s + ≈18 s ≈ 32 s
(`@stryker-mutator/core` `mutant-test-planner.js`; net time and overhead from each entry's initial run). Every Timeout
is a `StringLiteral` mutant to `""`. They fall into three groups:

| Group | Count | Mutants |
|---|---|---|
| A. `group` of a type, space, shape, size, shell or motion record → `""` | 65 | every such record from `font-sans` to `motion-fast`, except `shell-inspector-width`, `shell-main-max`, `shell-collapse-inspector`, `motion-base` and `easing-standard`, whose `group` mutants the Shell and Motion story tests killed within the limit |
| B. `value` of a non-colour, non-derived record → `""` | 53 | the plain values of A.2 to A.5 (type sizes, line heights, weights, spacing, widths, sizes, shell, measures, motion) |
| C. one themed value of an elevation record → `""` | 3 | `elevation-raised` light (line 209), `elevation-bar` light and dark (line 224) |

None of them breaks validation or a contrast pair, so the fast killer (`contrast.test.ts`, the fourth test the run
reaches) passes. They are caught by `source-table.test.ts` and the story list tests, which come later in the run,
after the ≈32 s limit when eight full-suite runs share four cores.

One representative per group was applied by hand to the final `source.ts` in the working tree, and the in-process
suite (`vitest run --config vitest.mutation.config.ts`, the projects Stryker runs) was run alone under a 120 s bound.
The tree was restored afterwards.

| Group | Mutant applied | Result | Failing tests |
|---|---|---|---|
| A | `font-size-xs`: `group: "type"` → `group: ""` | exit 1 in 10 s, 4 failed | `source-table.test.ts` "gives each token its group, its resolved value per theme …"; three Type story tests in `stories.test.ts` |
| B | `space-1`: `value: "0.25rem"` → `value: ""` | exit 1 in 11 s, 5 failed | `source-table.test.ts` "declares each token's light value … in the unconditioned :root block" and the JSON test; three Space story tests |
| C | `elevation-bar`: `dark: "none"` → `dark: ""` | exit 1 in 10 s, 3 failed | `source-table.test.ts` "declares each theme-dependent token's dark value under both dark selectors …" and the JSON test; the Elevation dark story test |

So each group's mutant makes the suite fail, on an assertion against `expected.ts`, because of the mutated value; no
test loops and no function hangs. The Timeouts are kills that Stryker reports late, not slowness of a surviving
mutant. No equivalent-mutant record was needed, and none was added.

## Pre-red measurement (T002)

`pre-red/` holds the same four runs on the working-tree change before the red commit (the identity function and the
dropped `as const`, without the two new header comment lines, so 228 lines: entries `1-60`, `61-120`, `121-180`,
`181-228`).

| Entry | Mutants | Killed | Timeout | Survived | NoCoverage | CompileError | Time |
|---|---|---|---|---|---|---|---|
| `1-60` | 147 | 147 | 0 | 0 | 0 | 0 | 61 s |
| `61-120` | 194 | 194 | 0 | 0 | 0 | 0 | 83 s |
| `121-180` | 228 | 123 | 105 | 0 | 0 | 0 | 564 s |
| `181-228` | 112 | 88 | 24 | 0 | 0 | 0 | 157 s |
| **Total** | **681** | **552** | **129** | **0** | **0** | **0** | |

No survivor, so T004 (kill-tests) had nothing to do, and the red commit holds only the form test.

## CI risk (OR-006)

The bound is 600 s / 3.4 ≈ 176 s locally. Entries `121-180` (578 s) and `181-230` (188 s) exceed it. `121-180` holds
the dense non-colour records (A.2 type, A.3 space, shape and size, the start of A.4 shell), and two thirds of its
mutants run the whole in-process suite until they time out. At the CI factor of 1.5 to 3.4 it would take 870 s to
1970 s, over the 10-minute `mutation-shard` limit. This does not affect this op's gate run (below: only the changed
lines are mutated). It affects any later change that touches most of lines 121-180 in one go, such as a rewrite of the
type or space scale. Bringing it down needs a change to the entry bound or the mutation configuration (for example a
bound on mutants per shard, `knowledge/speckit-flows/findings/frontend-missions.md` § Mutation shard time), which is
outside this op (OR-008). Reported to the operator.

## Gate (T011)

`pnpm run gate:mutation -- --base 7cb34304e8d4e096fbdcd869367b7906c7e971c1` (the op's base, checker on as configured):
exit 0 in 69 s, "10 mutants on the changed lines of 1 file, none survived; 0 equivalent records". Output in
`gate.log`.

## `TokenRecord` is still checked (OR-003, T007)

Two scratch records were added in front of `color-canvas` and `gate:typecheck` was run, then the file was restored:

```text
packages/tokens/src/source.ts:36: typecheck: TS2561: Object literal may only specify known properties, but 'contrats' does not exist in type 'TokenRecord & { readonly name: "color-disabled-ink" | … | "easing-standard"; }'. Did you mean to write 'contrast'?
packages/tokens/src/source.ts:37: typecheck: TS2820: Type '"colours"' is not assignable to type 'Group'. Did you mean '"colour"'?
typecheck: 2 findings in 1 file
```

On the final source `gate:typecheck` passes, so the `// @ts-expect-error` on `cssName("color-canvs")` in
`packages/tokens/test/index.test.ts` is still used: `TokenName` is still the literal union.

## Outputs unchanged (OR-004, T008)

`pnpm --filter @ocelle/tokens build` before the change (on the base) and after it:

| File | `cmp` |
|---|---|
| `dist/tokens.css` | identical |
| `dist/tokens.json` | identical |
| `dist/index.d.ts` | identical; it still declares `export type TokenName = (typeof records)[number]["name"]` |

`dist/source.d.ts` now declares `records` as `readonly (TokenRecord & { readonly name: "color-disabled-ink" | … })[]`,
the literal union of the record names.

Scratch consumer: the built `dist/` and `package.json` copied to `node_modules/@ocelle/tokens` of a scratch directory,
compiled with `tsc --noEmit --strict --module nodenext --moduleResolution nodenext --target es2022`:

| File | Result |
|---|---|
| `ok.ts`: `cssName("color-canvas")` | exit 0 |
| `bad.ts`: `cssName("color-canvs")` | exit 2, `TS2345: Argument of type '"color-canvs"' is not assignable to parameter of type '"color-disabled-ink" \| "color-overlay" \| … \| "easing-standard"'` |
