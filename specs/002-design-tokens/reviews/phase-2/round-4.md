---
phase: 2
round: 4
verdict: changes_requested
base: 98c1dcdaa0731fa7e9b668001eb78dbb7831d1d7
head: 6cbec1a93d8d49f6803c708efb75209b3e514e03
tdd_check: pass
---

# Phase 2 review, round 4

Scope: the fix of operator round 3 (O3-01, task T069). The fix is `6e526ac`, the tdd evidence is `c9fb1aa`, and
the note is `round-3-fixes.md`. Red evidence is CI, as `operator-decisions.md` § Round 3 O3-01 decides.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R4-01 | blocking | specs/002-design-tokens/tasks.md:95 | T069 is still `- [ ]`. Its work is present (the test change in `6e526ac`, and the checks the fix note lists all pass, see below), but the box was not ticked. In this feature the implementer ticks a review-fix task in its fix commit (T068 was ticked in `c097c8c`). Every task of `## Phase 2:` must be ticked. | Tick T069 (`- [X]`). No code change is needed. |
| R4-02 | note | specs/002-design-tokens/reviews/phase-2/red-commits | There is no `fix-3` entry and no local red commit. The operator decided this (`operator-decisions.md`), so it is not a finding. I checked the CI evidence myself with `gh`. The "Unit tests" jobs 126629249005 (run 41845918777, head `0fc3fe8`) and 126657932265 (run 41854105381, head `649c433`) ran `node: v26.13.0` and failed with `unit-tests: 1 of 1794 tests failed`, at `gates/test/token-only.test.ts:295 ... throws naming the file, the reason and the cause when the manifest cannot be read: Error: expected a thrown error to be Error: token-only: cannot read packages/e…`. That is an assertion on Node's wording, the right reason, and not a load error. Job 126926675379 (run 41930740532, head `6cbec1a`) ran `node: v26.13.0` and reports `unit-tests: 1798 tests passed in 88 files`. | None. |

## Test quality

- **The changed test** (`gates/test/token-only.test.ts:294-306`) is the only change of the fix. `gates/stylelint/token-lists.ts`
  is unchanged and already builds the message from `describe(error)` with `{ cause: error }` (line 66).
- **Against T069:** the test asserts `cause.code` is `EISDIR` (line 298), that the message starts with
  `token-only: cannot read packages/elements/custom-elements.json: ` (line 303), and that it ends with the cause's own
  `message` (line 304). It contains no Node wording. All three things T069 requires are present.
- **Not weakened:** the old assertion compared the whole message to Node 22's literal text. The new assertion on
  line 305 still compares the whole message exactly, as the prefix followed by the cause's message. Lines 300-302
  add that the error and its cause are `Error`s and that the cause message is not empty, so the exact comparison
  cannot pass with an empty cause message. Only the dependency on the runtime's wording is gone. The test is at least
  as strict about the unit's own behaviour, and the fix note gives the reason for the change.
- **Can fail:** the test has no conditional assertions, no skip or only, and no swallowed error. The `.catch`
  on line 299 only gets back the rejection that line 298 already proved happened. If the prefix or file changes, or
  the cause is dropped, or a different cause message is used, an assertion fails. The mutation run confirms this.
- **Mutation** (`round-4-mutation.log`): `pnpm run gate:mutation -- --base 98c1dcd --files gates/stylelint/token-lists.ts`
  (the source the test covers; the fix changed no source) gives `115 mutants on the changed lines of 1 file, none
  survived; 0 equivalent records`.

## Checks run

All checks ran on Node 22.23.4 at `6cbec1a`, with `PLAYWRIGHT_BROWSERS_PATH` set to the scratchpad browsers.

- `tdd-check.sh 2`: `pass`, head `6cbec1a`, no problems. The re-run evidence is committed with this review.
- `pnpm test`: 1798 tests passed in 88 files.
- `gate:typecheck`, `gate:lint` (156 files), `gate:test-lint` (98 files), `gate:style-lint`, `gate:contrast`,
  `gate:brand-rules`, `gate:prefix`, `gate:csp`, `gate:config-copies` and `gate:pins` all pass.
- `gate:plants`: 177 plants judged, every one as expected. This is 176 plus the phase 5 plant `exempt-not-disabled-ink`.
- `gate:mutation` as above.
- CI on Node 26.13.0: "Unit tests" passes at `6cbec1a` (see R4-02).

## Earlier findings

- **O3-01 (blocking):** resolved. The test no longer depends on Node's `EISDIR` wording and checks the code, the
  prefix and file, and the cause's own message, as T069 requires. The red result is on CI (Node 26.13.0, runs
  41845918777 and 41854105381) and the green result is on CI (run 41930740532, job 126926675379), as the operator
  decided. The only open item is the unticked T069 box (R4-01).
