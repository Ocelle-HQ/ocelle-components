# Phase 4 stop 1: the T049a scaffold does not compile, so the red run fails on setup

Recorded 2026-11-15 by the implementer, after `red.sh 4 phase`. Phase 4 is at its red commit; nothing of green is on
this branch. The operator decides how the phase continues.

## What happened

- **Scaffold** `80188b1` (`scaffold.sha`), written as T049a says: `packages/elements/src/ocelle-form-select.ts` holds
  only `export class OcelleFormSelect extends FormControl {}`, with its description and `@tagname`, no member, not
  defined. Phase 3 made `FormControl` (`src/form-control.ts`) abstract, with four abstract members (`control()`,
  `initialValue()`, `renderControl()`, `dispatchChange()`). The phase 3 scaffold did not meet this, because the base
  class had no members then. A non-abstract class with no members does not compile against the abstract base:
  `tsc` reports `TS2654: Non-abstract class 'OcelleFormSelect' is missing implementations for the following members of
  'FormControl': 'control', 'initialValue', 'renderControl', 'dispatchChange'`. I did not notice this before the red
  commit: Vitest runs the tests untyped, and the typecheck gate runs at the phase's end.
- **Red commit** `9a0824b` (`red-commits`, `phase` line), tests only. `red.sh` reported `"tests_only": true,
  "red": true` with exit code 2. `red-phase.log` holds a single line from the unit-tests gate: `unit-tests: could not run:
  packages/elements/test/build/build.test.ts: error outside tests: Command failed: pnpm run build`. The package build
  runs `tsc -p tsconfig.json`, which fails on the scaffold. The gate's classification stops at that error, so the log
  names no test.
- **The same suite run directly** at `9a0824b` (`red-phase-direct.log`: Vitest's own run of every project, without
  the gate's classification) gives **402 failed, 3493 passed, 8 skipped**:
  - The new in-process and node tests fail on their assertions, as T049a lists: the 52 cells of
    `test/form-select.test.ts`, the entry, root and exports tests, the manifest entry and module list, the README
    and CHANGELOG fragments, the gate counts and the three US3 plant rows.
  - The elements-browser global setup builds the browser build with the same `tsc`, so it fails too ("tsc exited 2:
    … TS2654 …"). As a result **every fixture-page test of every element fails on the missing build, not on missing
    select behaviour**: `browser/notice.test.ts` 78, `browser/form-input.test.ts` 60, `browser/form-select.test.ts`
    52, `browser/slot.test.ts` 40, `browser/driver.test.ts` 29, `browser/icon.test.ts` 17, `browser/brand-mark.test.ts`
    15, `browser/icon-set.test.ts` 15, `browser/live-capture.test.ts` 7 and `browser/plants.test.ts` 3. The 7 tests of
    `test/build/build.test.ts` are skipped after its `beforeAll` failed, and `pack.test.ts` fails the same way.
  - Also failing, and not caused by phase 4: one test of `gates/test/integration/setup-offline.test.ts`, which runs
    `pnpm install --offline` against an empty store and expects a "missing: is-number" message. It looks environmental;
    it is not looked into here.
- So the red evidence for the select's fixture-page cells is not valid: they fail for the wrong reason. Their failure
  says nothing about the select (constitution VIII; the implement procedure, step 5). `tdd-check.sh` check 3 runs the
  final tests on the scaffold and would meet the same build error.

## Why I stopped

The fix is in the scaffold, which is source. A red commit may change only test files, so amending the red commit
cannot fix it. The only fix is a scaffold commit that compiles, with the red tests committed again on top of it. That
means replacing two local commits, `80188b1` and `9a0824b`, which are not pushed. My instructions allow no history
rewrite except amending my own red commit. A scaffold that implements the abstract members also departs from T049a's
literal text ("no member"). Both are for the operator.

## Options

- **(a) Replace the scaffold and the red commit (recommended).** Make a new scaffold commit on `94af87b`.
  `OcelleFormSelect` stays undefined, with its description and `@tagname`. It implements the four abstract members as
  neutral stubs, as the implement procedure's scaffold rule allows ("functions throw `not implemented` or return a
  neutral value"): `control()` throws `not implemented`, `initialValue()` returns `""`, `renderControl()` returns an
  empty template and `dispatchChange()` does nothing. Nothing is wired and no test file changes. Then commit the
  unchanged red tree (`9a0824b`'s tree) on top, delete this phase's `scaffold.sha`, `red-commits` and `red-phase.log`,
  and run `scaffold.sh 4` and `red.sh 4 phase` again. T049a gets a note that the scaffold implements the base class's
  abstract members as stubs (phase 3 made the base abstract). The browser build then builds, so each fixture-page cell
  fails on the select's missing definition and the other elements' fixture tests pass.
- **(b) As (a), but the scaffold declares `export abstract class OcelleFormSelect extends FormControl {}`.** This is
  closest to T049a's "no member", and `tsc` accepts it. The class would be abstract at the scaffold and concrete at
  green, and the plant classes derived from it would not typecheck against the scaffold (Vitest does not typecheck,
  so they still load).
- **(c) Keep both commits and accept the evidence as it is.** `red-phase-direct.log` is the red evidence for the
  in-process and node cells. The fixture-page cells would have no valid red run, and check 3 would fail on the build
  error. Not recommended: phase 3's reviewers asked for every red failure to be an assertion of the missing behaviour.

## State left

- `claude/009-feedback-forms` is at the red commit `9a0824b` with this record. The tree is clean.
- The green draft (T054 to T057) is parked on the local, unpushed branch `claude/009-feedback-forms-phase-4-green-wip`,
  in one commit (`9513344`) on top of `9a0824b`: `src/icon-svg.ts`, `src/ocelle-form-select.ts`, the base class's control
  type widened, index and exports, the regenerated manifest and its plants' copies, README, CHANGELOG, the engine-floor
  record and `test/form-select-rules.test.ts`. Its typecheck is clean and the README and manifest node tests pass on
  it. The element suites, plants and mutation have not been run on it. Under option (a) or (b) it is put back on
  top of the new red commit. Under (c) it continues as it is.
- Before the red commit, the red tests were checked in process against the scaffold. Every new in-process cell failed
  on an assertion, and the native-twin sides matched their hand-written outcomes. The input's 60 in-process cells still
  passed after their bodies took a control kind.

## Replaced by the decision

Under `decision-stop-1.md` (option (a)), `80188b1` and `9a0824b` were replaced on `94af87b` by the stub scaffold
`4c73b0a` and the red commit `43bec71` (the tree of `9a0824b`'s tests, unchanged). `scaffold.sha`, `red-commits` and
`red-phase.log` were written again by those runs; the old `red-phase.log` and `red-phase-direct.log` are not kept (they
are at the local tag `local/phase-4-stop-1-prerewrite`).
