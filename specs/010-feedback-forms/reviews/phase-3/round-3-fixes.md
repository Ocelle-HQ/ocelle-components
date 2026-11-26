# Phase 3 review round 3: fixes

Review: round-3.md (operator round, changes_requested, head `3972c2b3`). Red commit `d260a95f` (T041c), on
`cc139254`; the fix commit holds T041d, this note and the new evidence.

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| O3-01 | fixed | `d260a95f` (`fix-3` in red-commits, red-fix-3.log: 3 of 4739 failed, exactly the three changed tests, each on an `AssertionError`, no setup or import error) | packages/elements/scripts/manifest.ts, packages/elements/custom-elements-manifest.config.mjs; packages/elements/test/node/manifest.test.ts; packages/elements/custom-elements.json and the manifest plant copies |

## O3-01

The operator's answer, "Main's rule + FormControl (Recommended)", is applied as T041c and T041d describe it.

**Red (T041c, `d260a95f`, test file only).** In `packages/elements/test/node/manifest.test.ts`:

- T030's generator test now pins mission 008's rule, modelled on main's `src/overlay.ts` case. A base in
  `src/form-control.ts` (class `FormControl`) gives the element its public members and attributes, `focus()` included.
  Each one carries `inheritedFrom: { name: "FormControl", module: "src/form-control.ts" }`, the element's own carry
  none, and the superclass is `{ name: "FormControl", module: "/src/form-control.ts" }`. The same base in
  `src/base-control.ts` gives nothing, and only `src/ocelle-*.ts` modules are published.
- The `ocelle-form-input` and `ocelle-form-select` entry tests now pin the superclass `FormControl`. They also pin
  `inheritedFrom` on each member and attribute declared in `src/form-control.ts` (the fifteen shared members and the six
  reflected shared attributes), and on none of the element's own. Every other assertion is unchanged.
- T036's two `fold(raw)` tests and the `fold` import are removed. The operator decision replaces the rule they pin,
  and the green removes `fold`. A `normalise(raw, names)` case now keeps `inheritedFrom` and the superclass as they are
  given. That case passes at once, because `normalise` does not change them.

The red run failed on the generator test and the two entry tests, the three changes that pin behaviour. The file
loads against the old generator. The reason for changing pinned assertions is recorded in the commit message and in
comments in the test file (constitution VIII).

**Green (T041d).** The analyzer's raw output matched what T041c pins, so there was no stop. Measured before the
change: the analyzer reads `src/form-control.ts` with the form elements and writes each element's superclass as
`{ name: "FormControl", module: "/src/form-control.ts" }` and each inherited entry's `inheritedFrom.module` as
`src/form-control.ts`.

- `scripts/manifest.ts` has main's shape. Main's single `internalBase = "overlay.ts"` becomes
  `internalBases = ["form-control.ts", "overlay.ts"]`. `generate` reads every `src/ocelle-*.ts` plus the named bases
  that are present, then drops those bases' modules from the output.
- `fold`, `own`, `bases`, `isElementModule` and the second analyzer pass are removed.
- The standard-attribute list, `isPublic`, the `IconName` expansion and `normalise` are unchanged.
- Main's Stryker equivalence comment on the `readdirSync` line is carried over, worded for a list of bases.
- `src/overlay.ts` does not exist on this branch and is not added. Its name is in the list so that the merge of
  `origin/main` can take main's generator with the `form-control.ts` entry added.
- The config's globs are main's (`src/ocelle-*.ts`, `src/overlay.ts`) with `src/form-control.ts` added. The head
  comments of both files state the rule and say that there is no fold.
- `packages/elements/custom-elements.json` is regenerated with `pnpm --filter @ocelle/elements run manifest`. The only
  change is `inheritedFrom` on the form elements' inherited entries and their superclass `FormControl`.
- The manifest plant copies follow T025's procedure. The seven `fail-*` copies that hold the manifest have the same
  old-to-new manifest diff applied, so each keeps its own planted change. `pass-reordered` is the new manifest with
  every object's keys reversed; its old copy was checked to be exactly the old manifest reversed.
  `break-not-json` is unchanged.
- `packages/elements/README.md` and `packages/elements/CHANGELOG.md` do not describe the flattening at the fix's
  parent, so neither changes. The spec and plan text was already changed in `cc139254`.

## Checks

| Check | Result |
|---|---|
| `pnpm test` | exit 0, "unit-tests: 4739 tests passed in 174 files". The first run had 1 failure: the phase 2 timing-sensitive plant row "minimum hold: a trigger during the hold empties the c… turns US1-13 10 ms after a write red", in `packages/elements/test/plants.test.ts`, which this fix does not touch. The file then passed alone (79 of 79), and so did the whole suite on the rerun |
| `gate:typecheck` | exit 0, no type error |
| `gate:lint` | exit 0, 355 files, no finding |
| `gate:test-lint` | exit 0, 255 files, no finding |
| `gate:manifest` | exit 0, "9 elements checked, no finding" |
| `gate:unit-tests` | the same run as `pnpm test` (`node gates/bin/test.ts`), exit 0 |
| `gate:mutation -- --base 38e9bd5e --files packages/elements/scripts/manifest.ts` | exit 0 in 109 s: "33 mutants on the changed lines of 1 file, none survived; 1 timeout, 6 compile errors, 0 zero-mutant entries; 1 equivalent record" |
| `gate:plants -- --affected cc139254` (`OCELLE_VISUAL_ENGINE=docker`) | every plant was affected (the config path is not mapped). The run was stopped at the agent's 2-hour background limit after 262 plants, with no exit line. The same set was then run as CI runs it: 28 shards, each exit 0, then `--verdict` exit 0, "309 plants of 17 gates and the registry judged, every plant as expected". Details in `plants.md` |

The mutation run's one timeout is at line 49: `"overlay.ts"` in `internalBases` replaced by `""`. Stryker counts a
timeout as detected, but no test on this branch kills that mutant. No test here has an `overlay.ts` fixture, and the
branch has no `src/overlay.ts`, so the entry is not exercised before the merge. Main's test "reads every
src/ocelle-*.ts and src/overlay.ts, and nothing else" covers it once the merge brings that test in. The
`"form-control.ts"` entry's mutant is killed.

`red-fix-3.log` is the tool's log as written. It keeps the pnpm setup line naming the content-addressable store under
`<pnpm store>`.
