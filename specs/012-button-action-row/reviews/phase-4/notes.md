# Phase 4 notes: User Story 3, busy

## Status

Base 55ec410 (`base.sh 4`, re-run after the operator's decision; the first base, 959b366, was recorded before the
stop-and-ask below and deleted uncommitted, so no phase-4 commit sits on it). No scaffold: the tests need no new
module (`src/spinner.ts` is reached through the element only). One red commit with all of the phase's story tests,
T042a included, then the green commits.

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

- Six bodies (US3-6, US3-9, US3-7 in both palettes and the busy look in both themes) fail on the base with the driver's
  `no .spinner svg in the shadow root of #<id>`: the spinner the body reads is the behaviour that is missing, not a
  setup error of the test.
