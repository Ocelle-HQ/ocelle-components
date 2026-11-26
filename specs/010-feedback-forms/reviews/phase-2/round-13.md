---
phase: 2
round: 13
verdict: approved
base: b1be87ade52bbf93335993780acd20c2b69d5da3
head: ddddede1
tdd_check: pass
---

# Phase 2 review, round 13

This is a stop-rule round. It checks only two things: that operator round 12's blocking finding O12-01 is resolved,
and that fix-7 (T025q) regressed nothing. I did not search for new findings. The change under review is
`0ff98cee..ddddede1`, which is two commits. `f109b379` adds the test and `red-fix-7-mutant.log`. `ddddede1` adds
`mutation-fix-7.log`, `unit-tests-fix-7.log`, `test-lint-fix-7.log`, `round-12-fixes.md`, the new `plants.md` and the
T025q tick. The working tree was clean before and after my runs.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R13-01 | note | specs/010-feedback-forms/reviews/phase-2/plants.md:9-10; round-12.md:5 | Both files give the phase base as `6c9400c`. That is the SHA from before the history fold (`43bf955c`). `base.sha` is now `b1be87ad`, and rounds 9 to 11 use it. The plants record runs against `0ff98cee`, the same parent-of-fix convention that fix-4 and fix-6 used and that earlier rounds accepted. The selection (no plant, exit 0) does not depend on this prose. | None for this phase. A later edit of those documents can name `b1be87ad`. |

No blocking finding.

## Test quality

**The test.** It is at `packages/elements/test/announcer.test.ts:180-202`, in `describe("the hold")`: "keeps the pending
release when a second trigger comes while the copy waits for its minimum hold…".
- **Deterministic.** The file's `beforeEach` (line 40) fakes `setTimeout`, `clearTimeout` and `performance`. The test
  moves time only through `vi.advanceTimersByTime`, and the timing is the shipped `announcerDefaults`.
- **The timeline is right.** `holding("A")` writes "A" at t = 0. The first trigger at +10 ms puts the announcer in
  `releasing`, and the second trigger comes at +20 ms. The test then reads the copy at W − 1 ("A"), at W (""), at
  2W − 1 ("") and at 2W ("B"). This is the case that O12-01's required change describes: the pending release is not
  moved, and the wait runs W from the empty state.
- **Not vacuous.** The test has one unconditional `toEqual` on five observed copies of the region. It has no
  `skip`/`only`, no mock and no snapshot.
- **No test weakened.** `git diff 0ff98cee HEAD -- packages/elements/test/` adds only these 24 lines. No existing test
  changed.

**Red evidence (R-08, a hand-applied mutant).** Fix-7 has no red commit and no `fix-7` line in `red-commits`. That is
right for a behaviour-neutral coverage fix with no source change. I applied the mutant to the working tree myself:
`packages/elements/src/live.ts:162` `if (this.phase === "releasing") return;` became `if (false) return;`. My diff was
byte-identical to the one in the log (index `81ae3032..511839ca`). Then I ran
`pnpm exec vitest run --project elements packages/elements/test/announcer.test.ts`, using Chromium 1243 through
`OCELLE_CHROMIUM_PATH` as the fix note did:
- **With the mutant:** exit 1. 1 failed and 19 passed. Only the new test failed, with
  `AssertionError`: `atMinimum` was "A" where "" was expected, and `beforeWait` was "B" where "" was expected. This
  matches `red-fix-7-mutant.log`. There was no setup or import error. That only this test fails confirms the gap that
  round 12 named: no other test in the file reaches line 162.
- **After restoring:** I restored the file with `git checkout -- packages/elements/src/live.ts`. Then
  `git diff HEAD -- packages/elements/src/` was empty, and the same command gave exit 0 with 20 of 20 passed.

**Mutation result.** In `mutation-fix-7.log`, the CI shard
`node gates/bin/mutation.ts -- --base 4911fd0b… --files packages/elements/src/live.ts:151-180` ran on `f109b379` and
reports "39 mutants …, none survived; 0 timeouts, 14 compile errors, 0 zero-mutant entries; 0 equivalent records",
with exit 0. `4911fd0b` is `git merge-base HEAD origin/main`, which is the `$BASE` that CI passes (`.github/workflows/ci.yml:105`). So
this is the same shard that failed on run 44735391703. For line 162, the log lists only the `EqualityOperator` and
`StringLiteral` compile errors, so the `ConditionalExpression → false` mutant was killed. The mutant is now killed
by a fake-timer test. Before, only the real-time browser tests reached it, which explains why runs 44727062211 and
44735814022 killed it and run 44735391703 did not. I did not run the mutation gate again, as instructed.

## Checks run

| Check | Result |
|-------|--------|
| `git diff 0ff98cee HEAD -- packages/elements/src/` | empty: no source change |
| The announcer file with line 162's mutant applied by hand (my run) | exit 1: only the new test fails, on its assertion |
| The announcer file after restoring `live.ts` (my run) | exit 0: 20 of 20 passed |
| `unit-tests-fix-7.log` (`node gates/bin/test.ts` on `f109b379`, read, not re-run) | exit 0: 8667 tests passed in 254 files |
| `test-lint-fix-7.log` (read) | exit 0: 380 files, no finding |
| `plants.md` (read) | `--affected 0ff98cee`: no plant selected, 0 of 317, exit 0. The changed files are a test file and evidence documents. See R13-01 for the base wording. |
| tasks.md:217, T025q | ticked, and the work is present at the commits it names |

**tdd_check.** I accept `tdd_check: pass` as it stands. `tdd-check.json` passed at `a3f658b0` with five red
commits (phase, fix-1, fix-4, fix-5, fix-6), each with exit 1, and no problems. Fix-7 adds no red commit and changes no
source or red-commit test. Its red evidence is the hand-applied mutant that I reproduced above, which R-08 allows. The
replay of the red commits would therefore give the same result. On the head side, the full unit run on `f109b379`
passed, and `ddddede1` changes no code.

## Earlier findings

- **O12-01 (blocking, operator round 12): resolved.**
  - **The test:** a deterministic fake-timer test triggers a second time while a release is pending
    (`announcer.test.ts:180-202`). It asserts that the copy is emptied at W from its write and that the wait then runs W
    from the empty state.
  - **Red and green:** it fails with line 162's mutant applied by hand (in `red-fix-7-mutant.log`, and reproduced by
    me), and it passes on the current source.
  - **Mutation:** the local run of the `live.ts:151-180` shard has no survivor (`mutation-fix-7.log`).
  - **Source:** unchanged.
- **Regression:** none. Only test lines were added, and the full unit suite (8667) and test-lint pass.
