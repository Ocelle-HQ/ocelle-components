# Phase 2 review round 12: fixes (fix-7)

Review: round-12.md (operator round, changes_requested; operator: "Fix test-first via op round (Recommended)").
No red commit and no `fix-7` line in `red-commits`: the fix is behaviour-neutral (a test only, no source change), so
the red evidence is the hand-applied mutant, as R-08 allows. Task T025q.

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| O12-01 | fixed | hand-applied mutant, not a commit: line 162's `ConditionalExpression` → `false` mutant (`if (false) return;`) applied in the working tree on `0ff98cee`. The new test failed on its assertion, `AssertionError: expected { atSecondTrigger: 'A', …(4) } to deeply equal { atSecondTrigger: 'A', …(4) }` (`atMinimum` `"A"` for `""`, `beforeWait` `"B"` for `""`), with no setup or import error. After `live.ts` was restored by path, the test passed (red-fix-7-mutant.log) | `f109b379`: packages/elements/test/announcer.test.ts, `describe("the hold")`, "keeps the pending release when a second trigger comes while the copy waits for its minimum hold, so the copy is emptied at W from its write and the wait runs W from the empty state"; red-fix-7-mutant.log |

## O12-01

The test holds "A". It triggers at +10 ms from the write, which puts the announcer in `releasing` with the release due at
W from the write, then triggers again at +20 ms. It reads the copy at the second trigger ("A"), at W − 1 from the write
("A") and at W ("": the pending release is kept, not moved by the second trigger). It then reads at 2W − 1 (""), and at
2W reads "B", so the wait ran W from the empty state.

With the mutant, the second trigger skips the `releasing` return. The phase is not `holding`, so `trigger()` calls
`wait()`. `wait()` clears the pending release and starts a wait of W from +20 ms with "A" still in the region. At W, the
copy is still "A". At W + 20 ms, the wait ends and writes "B" over "A" without ever emptying the region, so `beforeWait`
reads "B". The fake clock moves only when the test advances it, so the outcome is deterministic. Only the browser timing
tests, in real time, reached this line before, which is why CI run 44735391703 let the mutant survive and run
44727062211 killed it.

`git diff HEAD -- packages/elements/src/` was empty at the commit: `live.ts` was restored with
`git checkout -- packages/elements/src/live.ts` before anything was staged.

## Checks

Machine: this container, 4 CPUs, Chromium build 1243 through `OCELLE_CHROMIUM_PATH`, `OCELLE_VISUAL_ENGINE=docker`.
One heavy job at a time.

| Check | Result | Log |
|-------|--------|-----|
| The new test with line 162's mutant applied by hand (`pnpm exec vitest run --project elements packages/elements/test/announcer.test.ts -t ...`) | exit 1: 1 failed, on its assertion | red-fix-7-mutant.log |
| The new test, then the whole file, on the restored source | exit 0: 1 passed (19 skipped); then 20 of 20 passed | red-fix-7-mutant.log |
| `pnpm run gate:mutation -- --base 4911fd0b971d1fa4fd0c629a0e95fe4d7a416c38 --files packages/elements/src/live.ts:151-180` (the CI shard), on `f109b379` | exit 0: "39 mutants on the changed lines of 1 file, none survived; 0 timeouts, 14 compile errors, 0 zero-mutant entries; 0 equivalent records", 1678 s. Line 162 lists only its two compile-error mutants, so the `false` mutant was killed | mutation-fix-7.log |
| `pnpm run gate:test-lint` | exit 0: 380 files, no finding | test-lint-fix-7.log |
| `pnpm run gate:unit-tests` on `f109b379` | exit 0: 8667 tests passed in 254 files, 4557 s | unit-tests-fix-7.log |
| `pnpm test` | covered by the run above: in package.json, `test` and `gate:unit-tests` are the same script (`node gates/bin/test.ts`), so it was not run a second time | unit-tests-fix-7.log |
| `pnpm run gate:plants -- --affected 0ff98cee` (skill step 5) | exit 0: no plant selected, 0 of 317 (see plants.md) | plants.md |

In red-fix-7-mutant.log, vitest's RUN banner shows the checkout path as `<repo>`, and the ANSI colour codes are
stripped.

The test and red-fix-7-mutant.log were committed first, in `f109b379`, before the long runs. This note, the other logs,
plants.md and the T025q tick are in a second commit.
