---
phase: 1
round: 4
verdict: changes_requested
base: 30e513065d010f5c6ffcb81db0e0b83e79cacc0f
head: b79c61cec42836c250d1d7b924ff2b69e73a9f8f
tdd_check: pass
---

# Phase 1 review, round 4

Scope: the operator round 3 fix, 13f7a00 (T021b to T021d of af7c01d), and the tdd-check outputs that b79c61c
re-ran on it. I compared them against round-3.md (O3-01 to O3-03, binding operator decisions), T021b to T021d and
contracts/checks.md § Oracles "A removed sheet stops listening". I judged the source and the test, not the fix
note. I re-applied every hand plant myself, plus one plant the note does not have.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R4-01 | blocking | packages/elements/test/facts.test.ts:48, :62-64, :73 (the connected half); tasks.md T021b "paired with the same dispatch on a connected sheet re-running the pass"; contracts/checks.md § Oracles "A removed sheet stops listening" ("Paired: the same dispatch on a connected sheet re-runs the pass") | **The connected half of the new test is vacuous.** The comment at :63-64 says that clearing the connected sheet's class "changes no size, so no ResizeObserver callback restores it; only the window resize listener's pass does". That is false. With one fact in a 300 px sheet, removing `stacked` changes the host's block size from 45.64 px to 24.64 px (a scratch probe: clear the class, wait one frame, read `getBoundingClientRect().height`). The host's `ResizeObserver` callback then re-runs the pass and puts `stacked` back without any `resize` event, because the probe reads `["stacked"]` after the layout wait with no dispatch. Plant: delete `window.addEventListener("resize", this.#resized);` (ocelle-facts.ts:214). Run with `-t "removed sheet"`, the test still **passes** (1 passed). So the half that the name ("while a connected sheet re-runs the pass on the same dispatch"), the task and the contract describe as the paired control cannot fail when the connected sheet ignores the dispatch. The removed half does bite (see Test quality), and the listener's addition is covered elsewhere: with the same plant, 7 other tests in facts.test.ts fail. So no behaviour goes untested. The gap is a test that claims a control it does not have, plus a false comment, and T021b's pairing is not actually present (Principle VIII, "every test must be shown able to fail"). | Make the connected half depend on the listener alone. For example, give the connected sheet a fixed block size (`display: block; inline-size: 300px; block-size: 100px; overflow: hidden`), so that clearing the class resizes nothing. Assert that the class is still cleared after a layout wait with no dispatch, and `["stacked"]` again after the dispatch. I checked this shape in a scratch test: it passes on the source and fails with `addEventListener` removed (`"after": []`). Correct the comment, and record the `addEventListener` plant (it must fail) in the fix note next to the two existing plants. If the pairing is dropped instead, that changes T021b and contracts/checks.md and needs an operator decision. |
| R4-02 | note | specs/013-data-display/data-model.md:66, :82; packages/elements/src/ocelle-facts.ts:13 | Since O3-02, below the threshold the grid `<dl>` holds both `cols-1` and `cols-2`. Before, it held only `cols-1`. The layout does not change, because `cols-1`'s one-track rule (ocelle-facts.ts:121) comes after `cols-2`'s (:117) at the same specificity. Every grid scenario asserts computed tracks, not classes, and the visual and axe gates match. But data-model.md says the pass sets "`cols-2` or `cols-1`" (:66), and :82 also reads as exclusive. The class is internal to the shadow root, and the operator chose this change (round-3.md O3-02), so it does not block. | Optional: word data-model.md :66 and :82 (and the header at :13) as "`cols-2` below 2 × T, and `cols-1` as well below T". |
| R4-03 | note | specs/013-data-display/reviews/phase-1/check-final-tests-on-scaffold.log; tdd-check.json `final_tests_on_scaffold_exit: 2` | You asked about this. The scaffold run now cannot start, where before it failed on behaviour. The cause is the tool's scope, not phase 1. `story_test_changes base HEAD` (common.sh:67) takes every test-path file changed since the phase 1 base. HEAD is now the end of the branch, so the overlay on the scaffold 5dbab1d holds the tests and stories of phases 2 to 4 (54 files, against 34 at c48615b), including storybook/stories/empty-state.stories.ts and progress.stories.ts. I reproduced it in a scratch worktree of 5dbab1d with that overlay. The `storybook-integration` project's globalSetup (storybook/test/integration/setup.ts, unchanged) builds the Storybook, and the build fails on the stories of elements that do not exist at the scaffold. Vitest then reports a "Startup Error" (its own stack printer throws `code.charCodeAt is not a function`), writes a report with no test results, and gates/lib/vitest-report.ts:87-88 turns that into "no test file found", exit 2. In the same worktree, `--project gates` runs (73 failures). One correction to the brief: the earlier 314-of-3429 run is bb27aa5's, made after the fold at head c48615b, when HEAD was still the end of phase 1. It was not made before the fold. **Does it weaken the evidence?** Taken alone, yes: exit 2 is a setup error, and it is not the failure-for-behaviour that the scaffold check exists to show. tdd-check.sh:61 treats any non-zero exit as a pass of that check, so it no longer tells a behavioural failure from a crash. For phase 1, though, the evidence still holds. bb27aa5's log (`git show bb27aa5:specs/013-data-display/reviews/phase-1/check-final-tests-on-scaffold.log`, 314 failed on behaviour) covers phase 1's final tests. The only phase 1 test change since then is this round's facts.test.ts addition, which round-3.md says cannot be red, and the hand plants stand in for that. | None for this phase. For the tooling: when a later phase has landed on the branch, the scaffold run should take `head` as the phase's own last commit, or tdd-check should treat exit 2 as `unavailable`, not as a failure. |

## Test quality

- **Red evidence.** There is no fix-3 red commit. The operator ruled that it cannot be red (round-3.md O3-01, "the test cannot
  be red: show it fails with the cleanup removed by hand"). O3-02 and O3-03 change no behaviour. `red-commits` holds
  only the phase entry, which is correct for this round.
- **Hand plants, re-applied by me** (`pnpm exec vitest run packages/elements/test/facts.test.ts -t "removed sheet"`;
  source restored and `git status` clean after each):
  1. `disconnectedCallback` body emptied: fails, `"removed": []` against `["stacked"]` (facts.test.ts:69).
  2. `window.removeEventListener("resize", this.#resized);` deleted: fails, same diff.
  3. The event name mutated to `""` (the `StringLiteral` mutant whose record was deleted): fails, same diff.
  4. `window.addEventListener("resize", …)` deleted: **passes**, which is R4-01. With the same plant, the whole file
     has 7 failures (US1-12 widen, US1-18, the four shrink-to-fit hosts, the no-loop-error flips).
  5. Source restored: passes.
- **Is the removed half vacuous?** No. `atStart` and `atRemoval` pin `["stacked"]` before the dispatch, so the final
  `removed: ["stacked"]` can only fail through a pass that runs after removal. Plants 1 to 3 show it does fail. The `throw`
  at :58 guards element lookups, not an assertion. The only assertion is unconditional.
- **Weakened tests.** `git diff 13f7a00^..13f7a00 -- packages/elements/test` only adds lines. No test changed or was
  removed.
- **O3-02 behaviour.** `size < 2 * threshold` gives the same result as the old expression whenever
  `size >= threshold`. Below the threshold it adds `cols-2` next to `cols-1`, and the later `cols-1` rule wins
  (R4-02). Every grid scenario reads computed `grid-template-columns`, and all pass. The visual gate matches all 122
  captures.
- **O3-03 record.** I checked the reason at token-only.ts:286 against the code. `wordAllowed` reads the property
  only through `unitless.has(property)` (:67) and `isFont` (:71). `isFont` matches only `font` and `font-family`
  (:56). `functionRaw` compares it only with `grid-template-columns` and `transform` (:177-178), and passes it on
  through `var()` and `calc()`. `""` and `animation-iteration-count` are none of these, so every read gives the
  same result. The reason is complete and correct.
- **Mutation.** I ran `pnpm run gate:mutation -- --base 30e513065d010f5c6ffcb81db0e0b83e79cacc0f --files
  packages/elements/src/ocelle-facts.ts,gates/stylelint/token-only.ts`. Result:
  `mutation: 372 mutants on the changed lines of 2 files, none survived; 0 timeouts, 98 compile errors, 0 zero-mutant
  entries; 13 equivalent records`. Lines 219 (`disconnectedCallback`), 231 (`removeEventListener`) and 306 (`cols-2`)
  carry no record any more, and none of their mutants survived. I read the 13 records: they are those of rounds 1 and 2 and
  the landing review's "sound" list, plus the corrected one at token-only.ts:286. The deleted ones are gone.

## Checks run

All at b79c61c, with `OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` and
`OCELLE_VISUAL_ENGINE=docker` (dockerd already running).

- `pnpm test`: `unit-tests: 3793 tests passed in 152 files`
- `gate:typecheck`: `typecheck: no type error in the files of tsconfig.json`
- `gate:lint`: `lint: 296 files checked, no finding`
- `gate:test-lint`: `test-lint: 202 files checked, no finding`
- `gate:style-lint`: `style-lint: 16 files checked, no finding`
- `gate:prefix`: `prefix: 252 files checked, no finding`
- `gate:csp`: `csp: 21 files checked, no finding`
- `gate:config-copies`: identical
- `gate:signoff -- --range 30e5130..HEAD`: `signoff: 28 commits checked, no finding`
- `gate:pins`: `pins: 5 manifests checked, no finding`
- `gate:contrast`: `contrast: 160 pairs checked in light, 168 in dark (149 required per theme)`
- `gate:brand-rules`: `brand-rules: 7 rules checked`
- `gate:manifest`: `manifest: 6 elements checked, no finding`
- `gate:storybook-build`: `storybook-build: built 61 stories`
- `gate:visual`: `visual: 122 captures match their baselines (docker only: no cross-engine comparison)`
- `gate:axe`: `axe: 122 story-theme runs, 0 serious or critical; 10 notes (0 incomplete, 10 excepted)`
- `gate:plants`: not completed. It was stopped at the two-hour background limit after 289 plant timings, with no plant failure in its output. The diff changes no gate code: the only gates/ change is the token-only.ts:286 comment. So I rely on CI for this gate and did not restart it.
- `gate:mutation`: as above.
- tdd-check.json (b79c61c, head 13f7a00): `pass`, no problems. HEAD b79c61c adds only evidence files on top of it.
  For the scaffold exit, see R4-03.

## Earlier findings

Round 3 was the operator round:

- **O3-01**: partly resolved. The test exists, in process, and kills the `disconnectedCallback` block and
  `removeEventListener` mutants (plants 1 to 3, and mutation with no survivor on :219 and :231). Both records are
  deleted, and only comment lines were removed (`git show 13f7a00 -- packages/elements/src/ocelle-facts.ts`). The
  pairing that T021b and the contract require is not real (R4-01).
- **O3-02**: resolved. The operand and the record at :308 are removed (now :306). The other `ConditionalExpression`
  records stay (:198, :241, :245, :250, :274). The layout is unchanged (all grid scenarios and the visual gate pass),
  and mutation leaves no survivor. Wording note: R4-02.
- **O3-03**: resolved. The reason is complete and checked against the code (Test quality).
