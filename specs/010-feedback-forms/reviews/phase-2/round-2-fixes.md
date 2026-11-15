# Phase 2 review round 2: fixes

Review: round-2.md (changes_requested, head `c8600f8`). Fixes made on `4781f1f`.

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| R2-01 | fixed | none recorded with `red.sh`: the finding is a test gap, and the code already holds the rule (skill step 3, for findings that a test is weak). The new case is in the fix commit. It fails on the `live.ts:134` mutant and passes on the code (fix-2-mutants.log). A tests-only commit would be green at its own commit, so `red.sh 2 fix-2` would not record it; `red-commits` keeps `phase` and `fix-1` as they were | packages/elements/test/notice-rules.test.ts (§ the wait from the empty state's start, "counts from aria-live set from off"); reviews/phase-2/fix-2-mutants.log |
| R2-02 | fixed | none: not behavioural (an equivalent mutant; behaviour unchanged) | packages/elements/src/ocelle-notice.ts:22 and :213-214 |
| R2-03 | handed to the planner: design-artifact scope (contracts/testing.md § Timing should name `withTiming()` as the second caller of the setter), not changed here | none | none |
| R2-04 | deferred: a note, no change asked. No plant tree changed in this round either, so `gate:plants` was not run | none | none |
| R2-05 | deferred: a note, no change asked | none | none |

## R2-01

The case follows the review's probe on the fake clock with the shipped timing. A notice is rendered while the
document loads, without `announce`, so its region is `off`. The load completes, and 20 ms later `announce` is set,
which takes the region from `off` to `polite`. The text then changes. The copy is `""` at `W` - 1 after the change
and `"B"` at `W`, and the region is `polite`. With the mutant (`=== ""`), `live()` never begins a new empty state,
so the region keeps the start from its loading render. The wait's floor then binds: the copy is still `""` at `W`
(`expected { live: 'polite', before: '', at: '' } to deeply equal { ..., at: 'B' }`). The `aria-live` to `""`
mutant of the same line fails the same way. `src/live.ts` is unchanged.

On why there is no `fix-2` red entry: the skill makes a red commit for behaviour defects, which must fail at the
commit itself. Here the code meets the rule, and only the test was missing. So the case goes into the fix commit,
like round 1's R1-01 plant rows. Its proof that it can fail is the mutant run, recorded in fix-2-mutants.log, and
the mutation gate, which now kills the mutant. The automatic check also runs the final tests against the code from
before the phase.

## R2-02

`get tone()` now reads `tones.find((tone) => tone === value) ?? "info"`, with `value` the raw attribute (null when
absent), and `tones` is typed `readonly NoticeTone[]`. So it needs no `as NoticeTone` cast and has no fallback
literal. The result is the same for every attribute value, because null and an unknown string match no entry. The
remaining `"info"` literal is the result itself: its mutants `""` and `&&` are compile errors under the getter's
return type. Every other mutant of the line is killed by the tone cases of notice-rules.test.ts on the fake clock
(fix-2-mutants.log). No equivalent record was needed.

## Mutation gate (the whole diff, as CI runs it)

`pnpm run gate:mutation -- --base 6c9400c` with the fix commit's working tree: **exit 0**, "634 mutants on the
changed lines of 7 files, none survived; 1 timeout, 174 compile errors, 2 zero-mutant entries; 14 equivalent
records", 1575 s. The log is mutation-fix-2.log, and the record is in mutation.md § Review round 2.

The one timeout is `ocelle-notice.ts:257`, `value !== attribute` to `===`. It is not a timing kill: applied by hand,
it fails three assertions of notice-rules.test.ts in 2.8 s. The same holds for every mutant of the lines changed in
this round (fix-2-mutants.log). mutation.md § Phase 2 stop 2 now corrects shard 2's "none survived" and the
paragraph after it, because the `:134` kill there was not an assertion.

## Checks run (after the fixes, this container, Chromium 153 build 1243, one heavy job at a time)

| Check | Result |
|---|---|
| `vitest run --project elements packages/elements/test/notice-rules.test.ts` | 50 passed (the new case among them) |
| `gate:mutation -- --base 6c9400c` (whole diff) | exit 0, no survivor, 1 timeout (killed by assertion, above), 1575 s |
| `gate:unit-tests` | exit 0, "3532 tests passed in 153 files" (3531 and the new case), 499 s |
| `gate:typecheck` | exit 0, "no type error in the files of tsconfig.json" |
| `gate:lint` | exit 0, "303 files checked, no finding" |
| `gate:test-lint` | exit 0, "211 files checked, no finding" |
