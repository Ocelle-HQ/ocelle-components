# Implementation Plan: Make the token source mutation-testable

**Op**: `ops/004-token-source-mutation` | **Date**: 2026-11-10 | **Spec**: [spec.md](spec.md) | **Record**: [op.md](op.md)
**Branch**: `claude/020-token-value-mutation`

## Summary

Remove every type assertion around the token data in `packages/tokens/src/source.ts`, so that Stryker instruments it.
Keep `TokenName` literal with a `const` type parameter on a small identity function that the records are passed
through. Then show, with a whole-file Stryker run, that the existing tests kill every value mutant, and correct the
002 records.

## Technical Context

- TypeScript 6.0.3 (strict), Vitest, Stryker 10.1.1 with the vitest runner and the TypeScript checker
  (`stryker.config.json`, `vitest.mutation.config.ts`). The `tokens-browser` and `storybook-integration` projects are
  excluded from mutation (002 research *Mutation path*).
- One source file changes: `packages/tokens/src/source.ts`. `packages/tokens/src/index.ts` stays as it is: `TokenName =
  (typeof records)[number]["name"]` keeps working once `records` has literal names.
- Environment: the container runs Node 22, CI pins 26.13.0. Run `pnpm run setup:offline` if `node_modules` is
  missing. Set `OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` for `pnpm test` and the
  browser suites. For Stryker and gate runs, point `PLAYWRIGHT_BROWSERS_PATH` at a scratchpad alias, as in
  `knowledge/speckit-flows/findings/frontend-missions.md` § Browser path: link `chromium-1248` to
  `/opt/pw-browsers/chromium-1243`, and link the other entries of `/opt/pw-browsers` under their own names. Without
  it, Stryker's initial run exits 2.
- Run one heavy job at a time (a mutation run and `gate:plants` together ran out of memory in 002). Concurrent Stryker
  runs in one checkout share `reports/mutation/mutation.json`.

## Files to change

| File | Change |
|---|---|
| `packages/tokens/test/source-form.test.ts` (new) | The red test (acceptance 1). |
| `packages/tokens/src/source.ts` | Drop `as const` from `main`, `stateGrounds`, `chrome`. Pass the record array through the identity function below, without `as const` and without `satisfies`. Update the header comment. Add an R-08 record above any line with a mutant shown to be equivalent. |
| `packages/tokens/test/*.test.ts` | Only if the whole-file run finds a survivor: a kill-test, added to an existing table-style test or as a new case. No existing assertion is weakened. |
| `ops/004-token-source-mutation/mutation/` (new) | The evidence: each entry's Stryker clear-text output and JSON report, and `README.md` with the summary table, per-entry times, and the Timeout and equivalent explanations. |
| `specs/002-design-tokens/reviews/phase-2/notes.md` (new) | The correction note (OR-007). |
| `specs/002-design-tokens/data-model.md`, `specs/002-design-tokens/research.md` | Dated addenda after the affected paragraphs. The original text stays. |
| `knowledge/speckit-flows/log.md` | An Update entry under the op's date that closes the 2026-11-04 `as const` finding. The zero-mutant gate candidate stays open as a candidate. |

Nothing under `gates/`, no Stryker or Vitest configuration, no `package.json`, no changelog (semver `none`).

## Approach

### Keeping `TokenName` literal (OR-001 to OR-003)

In `source.ts`, an unexported identity function that takes the names as a `const` type parameter and the rest as
`TokenRecord`:

```ts
/** The records as given; N keeps each name literal, so TokenName (index.ts) is their union without `as const`. */
function tokenRecords<const N extends string>(list: readonly (TokenRecord & { readonly name: N })[]): readonly (TokenRecord & { readonly name: N })[] {
  return list;
}
export const records = tokenRecords([ /* the records, unchanged */ ]);
```

- `(typeof records)[number]["name"]` is then `N`, the union of the name literals. `index.ts` needs no change.
- The argument is a plain call argument, not a `TSAsExpression` or `TSSatisfiesExpression`, so Stryker descends into
  it. Check this against the installed instrumenter's `tsTypeAnnotationNodeTypes`
  (`@stryker-mutator/instrumenter`, `util/syntax-helpers.js`).
- The object literals are checked against `TokenRecord & { name: N }`, so a misspelt key or a wrong group stays a
  type error (OR-003). Check this by hand: add a scratch record with `contrats:` and with `group: "colours"`, run
  `gate:typecheck`, record both errors in the evidence README, and revert.
- The ground lists become plain `const main = [ … ];` (type `string[]`, matching `Contrast.grounds`).
- If this form does not keep the union (the `@ts-expect-error` in `index.test.ts` becomes unused), any other form is
  acceptable that meets OR-001 to OR-003 without a second hand-kept name list. For example, a
  `<const T extends readonly TokenRecord[]>(list: T): T` identity, with OR-003 checked by hand the same way. If no
  form keeps the union without changing the public `TokenName` type or adding an exported name list, stop: that is a
  surface decision (the triage record's *What would change this decision*). Record it in `op.md` and tell the
  operator the work is a mission.

The function's own mutants (the block statement emptied, so `records` is `undefined`) are killed by every test that
imports the source.

### Whole-file mutation run (OR-005, OR-006)

`gate:mutation` mutates only lines changed against the base (`gates/lib/mutation/ranges.ts`). This op changes only a
handful of lines, so the gate alone would again see almost nothing of the file. The evidence run therefore calls
Stryker directly, from the repository root:

```sh
node node_modules/@stryker-mutator/core/bin/stryker.js run <config> --mutate packages/tokens/src/source.ts:<start>-<end>
```

- `<config>` is a scratchpad copy of `stryker.config.json` with `"checkers": []` and absolute paths where the copy
  needs them, so that no name mutant counts as a CompileError. Set `NODE_OPTIONS` to the coverage-record preload
  that `gates/lib/mutation/coverage.ts` `strykerEnv` adds, as the gate does.
- Entries: `1-60`, `61-120`, `121-180`, `181-<last line>`, run one at a time. Copy `reports/mutation/mutation.json`
  and the clear-text output of each run into `ops/004-token-source-mutation/mutation/` before the next run.
- Time each entry. The bound is 600 s / 3.4 ≈ 176 s locally, the worst CI factor in `knowledge/speckit-flows/log.md`.
  An entry over it is not a failure of the op, but its time goes to the operator as a CI risk for any later change
  that touches that many record lines. The spike's 120-line entry took 304 s, so a 60-line entry is expected near
  that bound.
- **Timeouts**: list each Timeout mutant (id, line, mutator, replacement). Group them by cause, and for each group
  apply one representative mutant by hand in a scratch tree, run the relevant test file with a time bound, and record
  what happens. Examples: `resolve()` throws on a cycle, or the tests loop in a named function. A Timeout whose
  mutant makes the suite fail or loop because of the mutated code is a kill. A Timeout that is only slowness is a
  survivor in disguise and gets a test like any survivor.
- **Survivors**: each gets a kill-test (see *Test approach*) or, if no input can tell it apart, an R-08 record with
  the reason (`// Stryker disable next-line <Mutator>: <reason>`). Rerun the entry after either.
- Finally, `pnpm run gate:mutation -- --base <op base>` with the checker on, as configured. It must exit 0. Keep
  its output in the evidence directory as well.

### Outputs unchanged (OR-004)

Before any source change, build the package (`pnpm --filter @ocelle/tokens build`) and copy `dist/tokens.css`,
`dist/tokens.json` and `dist/index.d.ts` to the scratchpad. After the change, build again: `cmp` both outputs and
record the result (no difference) in the evidence README. Repeat the 002 landing review's scratch-consumer check: a
scratch TypeScript project that imports the built package must reject `cssName("color-canvs")` and accept
`cssName("color-canvas")`.

## Test approach (red first)

Most of this change is a refactor: the outputs and the type are meant to stay the same, so the tests that guard them
(source-table, json, index, the browser suites) pass before and after by design. The behaviour the op adds is that
the token data are visible to Stryker. The red test checks the condition for that directly.

- **Red test, `packages/tokens/test/source-form.test.ts`**: read `packages/tokens/src/source.ts` from disk
  (`new URL("../src/source.ts", import.meta.url)`). Parse it with `ts.createSourceFile` (TypeScript is a pinned
  devDependency). For each of `records`, `main`, `stateGrounds` and `chrome`, find its variable declaration (the
  test fails if one is missing) and collect every `AsExpression`, `SatisfiesExpression` and `TypeAssertion` in its
  initializer subtree. Expect, for all four names at once, a list of offenders that is empty, so that the failure
  names each offender. A non-vacuity check in the same test: the `records` initializer contains the string literal
  `"color-canvas"`.
  - Against the code before the change it fails with all four names. That is the missing behaviour, not a setup
    error.
  - Under Stryker the sandbox holds the instrumented `source.ts`. The test must pass there too: Stryker adds
    conditionals and calls, not type assertions, and keeps the declarations and the string literals. Confirm this
    with the first whole-file entry: Stryker's initial test run must pass. If it does not, make the test robust to
    the instrumented form. Do not exclude it from the mutation projects (OR-008).
- **Pre-red measurement (no commit)**: before writing the red commit, measure in the working tree. Drop `as const`
  and add the identity function, run the four whole-file entries with the checker off, list the survivors and
  timeouts, then restore both files with `git checkout -- <paths>` (never `git stash`). A survivor found here gets
  its kill-test in the red commit. Its red evidence is that scratch report, where the mutant is Survived, and the
  final report, where it is Killed. This follows the coverage-only precedent of 001 phase 3 round 6 (R6-01). Keep the
  scratch reports in the evidence directory under `pre-red/`.
- **Green**: the source change of *Approach*. It makes the red test pass and leaves every other test unchanged and
  passing.
- **After green**: the whole-file run and the gate (above). A survivor found only now is a review finding, and is fixed
  test-first in a fix round.
- `tdd-check` final-tests-on-base: the red test fails against the base, so the check holds.
- Node 22 against 26.13.0: the red test does not depend on Node's messages, so its red run reproduces locally.

## Constitution Check

| Principle | Status |
|---|---|
| I Framework-free, `ocelle-` names | Not touched. |
| II Tokens only, brand rules | Pass: no token value changes, and the outputs are byte-identical (OR-004). |
| III Accessible by construction | Not touched: same tokens, same contrast data. |
| IV Strict CSP, offline | Not touched: same built output. |
| V Storybook, tests prove behaviour | Pass: the existing tests are kept unchanged. Any kill-test asserts generator output on the real source. |
| VI Consumer needs, own code | Pass: no copied code, and no new scope. |
| VII Semantic versioning | Pass: token names and `TokenName` unchanged (OR-002), checked in the repository and against the built `.d.ts`. Semver `none`. |
| VIII Test-first, non-vacuous | Pass. The red test fails before the change for the missing behaviour, and kill-tests take their red evidence from the mutation reports. The whole-file run closes the gap that made the 002 claim vacuous, and Timeouts and name mutants are not taken as kills without a run-time cause. No gate change, so no new plant is needed. |

No violation, so there is no Complexity Tracking entry.

## Stop conditions

- `TokenName` cannot stay literal without a public type change or an exported name list: write that into `op.md`
  and stop. The work is a mission.
- A survivor needs a test or a change outside `@ocelle/tokens`, for example in a gate contract: stop and report. Per
  the triage record, that is a mission.
- An entry cannot be brought under the 10-minute limit without changing the entry bound or the mutation
  configuration: report it to the operator. That would be a change to 001's FR-013 and SC-005.
