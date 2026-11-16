---
phase: 1
round: 5
verdict: approved
base: 30e513065d010f5c6ffcb81db0e0b83e79cacc0f
head: 2646ca347dc733c30751cd79a38a39b89aab3dd4
tdd_check: pass
---

# Phase 1 review, round 5

Scope: the round 4 fix 2e1215d (packages/elements/test/facts.test.ts, specs/013-data-display/data-model.md :66 and
:82, round-4-fixes.md) and the tdd-check outputs that 2646ca3 re-ran on it. The rest of phase 1 was judged in round 4
and has not changed since 7ff2ba1. `git diff --stat 7ff2ba10..HEAD` lists only these two files, the fix note,
tdd-check.json and four check logs. The only change in those logs is the pnpm install time. I judged the test and the
document against the source. I did not take the fix note's word for them.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R5-01 | note | packages/elements/src/ocelle-facts.ts:13 | The header comment still reads "sets `cols-1` below the threshold or `cols-2` below twice it". This can be read as exclusive. The pass at :305-306 sets both classes below the threshold. data-model.md now describes this correctly. The fix note says it left the comment alone on purpose, to keep this round off the source. Comment only, and the behaviour is correct. | Optional, at a later source change: use the same wording as data-model.md :66. |
| R5-02 | note | specs/013-data-display/reviews/phase-1/tdd-check.json `final_tests_on_scaffold_exit: 2` | R4-03 is unchanged: the scaffold run still exits 2 on a Storybook build startup error, caused by later phases' stories in the overlay. It does not exit on behaviour. This is a known tooling issue, left to the retrospective. For phase 1 the evidence still rests on bb27aa5's behavioural scaffold log and on the hand plants (round-4.md R4-03). | None for this phase. |

No blocking finding.

## Test quality

- **R4-01 plant, re-applied by me.** I deleted `window.addEventListener("resize", this.#resized);`
  (ocelle-facts.ts:216 at HEAD; it was the only match) and ran `pnpm exec vitest run
  packages/elements/test/facts.test.ts -t "removed sheet"`. Result: **1 failed**. The diff is
  `"connected": []` against `["stacked"]`. `"undispatched": []` matches, so the only thing that put the connected
  sheet's class back was the listener's pass. I restored the file with `git checkout`, and the test **passes**.
  `git status` was clean afterwards.
- **The `undispatched` pin makes the control sound.** The new assertion `undispatched: []` (facts.test.ts:67-69, :75)
  is taken after a full `layoutWait` and before the dispatch. Suppose a `ResizeObserver` callback put the class back,
  as in round 4. The assertion would then fail; it would not pass vacuously. So the `connected: ["stacked"]` at the end
  can come only from the `resize` dispatch. The new comment at :64-66 is now true. The fixed `block-size` with
  `overflow: hidden` keeps the host's border box the same when the class is cleared. The `ResizeObserver` observes the
  host and the two probes (ocelle-facts.ts:215, :278), not the `<dl>`. The probes take their size from the
  custom-property value (:146), not from the `<dl>` class. The `MutationObserver` watches the light DOM (`this`, :214),
  so a class change in the shadow root never reaches it.
- **Viewport dependence.** None. The sheet's inline size is a fixed 300 px. The threshold is the 24rem default probe
  (384 px at the default font size, ocelle-facts.ts:146), with no viewport unit. Removing `#r` moves `#c` but does not
  resize it. Scratch runs with `beforeEach` changed to 360 × 640 and to 2560 × 1440 both passed (restored afterwards).
- **Timing and flakiness.** Every read comes after `layoutWait`. That wait returns only after two matching frames with
  no update pending, so any pass that a `ResizeObserver` callback queued has already run (layout-wait.ts). The test
  has no fixed sleeps. I ran it 25 times in a row at 1280 × 800 and it passed all 25. With every core (4) busy-looping,
  I ran it 8 more times and it passed all 8. I stopped the load processes afterwards.
- **No weakening.** `git diff 7ff2ba10..HEAD -- packages/elements/test` changes one mount attribute, adds one layout
  wait, adds one read and one expected key, and replaces the comment. It removes no assertion. The removed half
  (`atStart`, `atRemoval`, `removed`) is unchanged, so round 4's plants 1 to 3 still apply.
- **Red evidence.** There is no `fix-4` red commit. That is correct: R4-01 found the test vacuous, and the code was
  already right. The plant above stands in for the red step. `red-commits` holds only the phase entry.
- **Mutation.** `pnpm run gate:mutation -- --base 30e5130 --files packages/elements/src/ocelle-facts.ts`:
  `mutation: 190 mutants on the changed lines of 1 file, none survived; 0 timeouts, 34 compile errors, 0 zero-mutant
  entries; 12 equivalent records`. The result is the same as round 4 for this file, and the source has not changed.

## R4-02 wording against the source

data-model.md :66 now reads "sets the internal class `cols-2` below 2 × threshold, and `cols-1` as well below the
threshold (none for 4), unconditionally". :82 reads the same way with T. The source matches: the grid branch of
`#measure` (ocelle-facts.ts:301-307) first removes all three classes. It then does `toggle("cols-1", size <
threshold)` and `toggle("cols-2", size < 2 * threshold)`. So below T both classes are set, between T and 2T only
`cols-2` is set, and at 2T or more neither is set. The 4/2/1 decision in the same paragraph still matches, because
the later `cols-1` rule (:121) overrides `cols-2` (:117). "Unconditionally" is also accurate, since the toggles run on
every pass. The header comment is R5-01.

## Checks run

All at 2646ca3, with `OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` and
`OCELLE_VISUAL_ENGINE=docker` (dockerd running).

- `pnpm test`: `unit-tests: 3793 tests passed in 152 files`
- `gate:typecheck`: `typecheck: no type error in the files of tsconfig.json`
- `gate:lint`: `lint: 296 files checked, no finding`
- `gate:test-lint`: `test-lint: 202 files checked, no finding`
- `gate:style-lint`: `style-lint: 16 files checked, no finding`
- `gate:prefix`: `prefix: 252 files checked, no finding`
- `gate:signoff -- --range 30e5130..HEAD`: `signoff: 31 commits checked, no finding`
- `gate:mutation`: as above.
- tdd-check.json (head 2e1215d): `pass`, `problems: []`, `head_exit: 0`. HEAD 2646ca3 adds only those outputs.
  For the scaffold exit, see R5-02.
- Not re-run, because nothing they cover has changed since round 4: visual, axe, storybook-build, csp, contrast,
  brand-rules, manifest, pins and config-copies. All passed at b79c61c (round-4.md § Checks run), and the diff since
  then touches only one test file and docs. `gate:plants` was not run, as the brief asked: the diff changes no gate
  code.

## Earlier findings

- **R4-01 (blocking)**: resolved. The connected sheet has a fixed block size, so clearing its class resizes nothing.
  `undispatched: []` shows that no `ResizeObserver` pass restored the class. With `addEventListener` deleted, the
  test now fails on `connected`, and it passes on the source. The false comment is replaced. The fix note records
  the plant (round-4-fixes.md, plant 4). T021b's pairing and contracts/checks.md § Oracles "A removed sheet stops
  listening" are now really present.
- **R4-02 (note)**: resolved in data-model.md :66 and :82. The text matches the source. The header comment remains,
  as R5-01.
- **R4-03 (note)**: not addressed, as agreed. Carried as R5-02 for the retrospective.
