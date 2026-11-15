# Phase 4 notes: User Story 3, busy

## Status

Base 55ec410 (`base.sh 4`, re-run after the operator's decision; the first base, 959b366, was recorded before the
stop-and-ask below and deleted uncommitted, so no phase-4 commit sits on it). No scaffold: the tests need no new
module (`src/spinner.ts` is reached through the element only). One red commit with all of the phase's story tests,
T042a included, then the green commits.

Commits so far: b58c55f (red, `red.sh 4 phase`: tests only, red, recorded; 121 of 3579 tests failed), fdc5956 (green:
T045, T045a; the tokens, brand-rules, gates README and plant-runner tests pass), 4ceaefc (the busy button and spinner,
in progress: T046 to T048 open). The phase stopped on the operator question below; the operator answered it (option (a), 2026-11-15) and the
phase went on.

## Operator decision at phase 4 (the stop-and-ask, resolved)

The phase first stopped before its red commit: 002's brand-rules gate, rule (f), accepted exactly
`--ocelle-motion-fast` and `--ocelle-motion-base` in the reduced-motion block and so would reject the generator's new
`--ocelle-motion-spin: 0ms` (measured on 959b366 with the source and generator change applied to the working tree and
restored afterwards: `packages/tokens/dist/tokens.css:223: brand-rules: reduced-motion: --ocelle-motion-spin: 0ms in
the reduced-motion block; ...`, 1 finding). Options put to the operator: (a) rule (f) follows the generator (every
motion duration of the source at 0ms), (b) a third name in the rule's list, (c) no token change under reduced motion.

The operator chose (a) (2026-11-15). The planner recorded it at 55ec410: spec.md "Operator decisions at phase 4", plan
decision 29 (decision 5 amended), research R-07, contracts/checks.md (the brand-rules row and the mutation scope) and
tasks T042a, T045a, T049.

## Red tests that replace earlier tests (constitution VIII: stricter, reason recorded)

- `packages/tokens/test/source-table.test.ts` "sets exactly motion-fast and motion-base to 0ms under reduced motion" is
  replaced by "sets exactly the motion durations, motion-fast, motion-base and motion-spin, ...": the same exact-list
  assertion with the third duration (R-07, T042). `test/browser/values.test.ts`'s reduced-motion cases gain
  `motion-spin` (0s under reduced motion, 0.8s without) and assert `motion-turn` unchanged (360deg).
- `packages/tokens/test/generate.test.ts` keeps "sets exactly --ocelle-motion-fast and --ocelle-motion-base" on the
  fixture (which has only those two durations) and adds "sets exactly every motion duration of the source to 0ms ...":
  a fixture with `motion-spin`, `motion-turn`, an easing, a duration of another group and a further duration gives
  exactly the motion durations in source order, and the fixture without `motion-fast` gives only `motion-base`.
- `packages/tokens/test/generate.test.ts` "writes an empty source as the @font-face and empty blocks, with the
  reduced-motion block" expected the two names whatever the source. Under plan decision 29 the block follows the
  source's motion durations, so an empty source gives an empty block: the test now expects that ("... with an empty
  reduced-motion block"). This changes the expected value by design, not by loosening: the old value contradicts the
  approved rule.
- `gates/test/brand-rules.test.ts` rule (f): the three message-bearing cases of 002 keep their inputs and their
  locations and change the message tail from "only --ocelle-motion-fast and --ocelle-motion-base, each 0ms, belong
  there" to "only the motion durations, each 0ms, belong there" (plan decision 29); "does not set one of the two" is
  renamed "does not set one of the motion durations". Four cases are added: a source with `motion-spin` passes with the
  generator's block and gives one finding at the block's line when its line is dropped; `--ocelle-motion-spin` in the
  block of a source without it is rejected; `motion-turn` is neither required nor accepted there; a duration of another
  group is neither required nor accepted there.
- The pinned counts that change by design are in the red commit: 48 stories (`storybook-build`), 96 story-themes
  (`visual`, three places, and `axe`), 98 axe plant-repo runs (the `unlabelled` plant's two runs on top), 96 baselines
  (`plant-repo.test.ts`), and 229 other plants in `gates/test/plant-runner.test.ts` (the new brand-rules plant
  `f-motion-spin-missing`; still 3 other shards).

## Red run notes

`red-phase.log`: 121 of 3579 tests failed; 109 with an `AssertionError`, 12 (six bodies in two harnesses: US3-6, US3-9,
US3-7 in both palettes and the busy look in both themes) with the driver's `no .spinner svg in the shadow root of
#<id>`: the spinner the body reads is the behaviour that is missing, not a syntax, import or setup error. The Storybook
tests of the busy stories fail on the missing stories, and the tokens story's Motion tests (which read the hand-written
table) on the missing tokens.

## Operator question (stop-and-ask: red tests that cannot pass for a reason outside the behaviour)

With the implementation of 4ceaefc, every red test passes except six busy bodies, in both harnesses (in process 7
runs, fixture 6 runs; which ones fail depends on timing):

1. **The spinner's box is read while it turns.** US3-3, US3-4 (both directions), US3-5 (both directions), US3-7 (both
   palettes) and the edge case "both disabled and busy" read the spinner drawing's border box (`driver.box(id,
   ".spinner svg")`) with motion allowed. A rotated element's border box is the box of its rotated drawing, so the read
   gives 22.4 to 28 px instead of 20 (and in US3-5 a gap of 6.8 px instead of 8, `inIconPlace` false in US3-4),
   depending on the angle at the moment of the read. The red tests assumed a still box; they are wrong, not the
   element (R-07 asks for the `rotate` property on the drawing, and US3-9 reads the animation on that drawing).
2. **The dark busy-look page has no ground.** "Busy look (dark)" mounts its buttons on the bare runner page, so the
   dark-theme labels (light ink) sit on white and axe reports `color-contrast` (the same setup error phase 3 corrected
   in SC-006). Its look comparison passes.

Changing a red test after the red commit needs the operator (the auto-mode check refused the edit as a possible
weakening), so the phase stops here. Options:

- **(a) Correct the bodies, same expected values (recommended).** Each body that measures the spinner's layout box
  sets `reducedMotion("reduce")` first, so it reads the still box; US3-5 also asserts that the turning spinner's box
  does not intersect the label (stricter than before); "Busy look" gets a canvas ground rule as the other dark bodies
  have. No expected value changes; the reason goes into the commit body and these notes.
- **(b) Rotate an inner element instead.** The spinner animates a `<g>` (or the `circle`) inside a still `svg`, so the
  svg's box never turns; US3-6 and US3-9 then read the animation on that inner element (a selector change in the red
  tests), and "Busy look" still needs the ground (as in (a)).
- **(c) Something else** the operator states.

Either (a) or (b) changes red test code; no expectation is loosened in either.

**Operator decision at phase 4, 2026-11-15: option (a).** The operator authorised exactly these red-test corrections
after the red commit, and nothing else in the red tests: in each body that measures the spinner (US3-3, US3-4,
US3-5, US3-7 and the "both disabled and busy" edge case) reduced motion is turned on first, so the body reads the still
box, every expected value unchanged; US3-5 also asserts that the turning spinner's box never overlaps the label (five
reads 150 ms apart with motion allowed, each `false`; stricter than before); the "Busy look" body gets a canvas ground
rule, as the other dark bodies have. Applied in `scenarios/busy.ts` (commit after ef3cdbf); both harnesses then pass
(in process 157 of 157 with control.test.ts, fixture 101 of 101).
