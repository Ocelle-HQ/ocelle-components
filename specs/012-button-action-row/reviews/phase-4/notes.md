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

## Visual baselines

The eight busy baselines (`elements-ocelle-button--{busy,busy-with-icon,busy-link,busy-compact}`, light and dark) and
the two `tokens--motion` baselines (which now list `motion-spin` and `motion-turn`, a change by design of T045) were
written only by `OCELLE_VISUAL_ENGINE=docker pnpm run visual:update` in #10's pinned container ("wrote 10 files (8
added, 2 changed, 0 removed)"; 2443172), and checked with `gate:visual` (96 captures match, "docker only: no
cross-engine comparison"). No podman cross-engine check was possible in this environment; CI confirms the baselines at
landing. No baseline PNG was hand-edited or hand-picked.

Under load (16 `yes > /dev/null` processes), `OCELLE_VISUAL_ENGINE=docker pnpm run gate:visual` ran three times: 96
captures matched each time; the processes were killed afterwards.

## Gate runs (T049)

- `gate:typecheck`, `gate:lint` (283 files), `gate:style-lint` (15 files), `gate:test-lint`, `gate:brand-rules` (7 rules,
  0 findings on the phase 4 tree), `gate:manifest` (3 elements, no finding): pass.
- `gate:storybook-build`: 48 stories. `gate:visual`: 96 captures match. `gate:axe`: 96 story-theme runs, 0 serious or
  critical; 10 notes (0 incomplete, 10 excepted). `gate:contrast` unchanged (no colour token changed).
- `gate:mutation -- --base 55ec410` (3 shards, `gates/bin/brand-rules.ts` in the default-config scope beside the tokens
  source and generator): 115 mutants on the changed lines of 6 files, none survived; 8 timeouts, 32 compile errors, 0
  zero-mutant entries, 0 equivalent records; 7 min 25 s. The 8 timeouts are all on the duration regex
  (`brand-rules.ts:31`, `generate.ts:269`): the anchors dropped and the fraction part changed (`\d` for `\d+`, `\D+`). No
  test feeds a fractional or prefixed millisecond value, so these are reported here as Timeout (pass, R-14), not
  proven killed.
- `gate:plants`, shard by shard (`OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard <k>`, one at a time): all 76
  shards "every plant as expected"; shards 1 to 3 judged 77, 76 and 76 other plants (with `brand-rules/f-motion-not-zero`
  and `brand-rules/f-motion-spin-missing`, 32.5 s and 27.8 s), the slowest shard 158 s (40,
  `visual/fail-token-changed`), 7241 s in all; no shard near 10 minutes.
- The element plants: reviews/phase-4/plants.md, every one bit.
- Whole suite, `pnpm test` on 2443172 + fail-token-changed: **3578 of 3579 pass; 1 fails**:
  `gates/test/integration/plants-robustness.test.ts:178` "has the two gates' plants and the registry's" pins 35
  contrast and brand-rules plants; the new plant `f-motion-spin-missing` makes 36. This pin changes by design and
  belonged in the red commit (T042a: "any pinned brand-rules plant count in gates/test/integration/ changed first"); I
  missed it there. Changing it now is a test change after the red commit outside the operator's authorised
  corrections, so it is an operator question (T049 left open).

## Operator question 2 (stop-and-ask): the plants-robustness pin

- **(a) Recommended:** change the pin from 35 to 36 in a separate signed-off test commit, recorded here as a missed
  red-commit pin (the count of plants that this phase adds by design); then rerun the suite and close T049.
- **(b)** Amend nothing; leave the failing pin for the reviewer to decide.
- **(c)** Something else the operator states.

**Operator decision at phase 4, 2026-11-15, second stop-and-ask: option (a).** The pin of
`gates/test/integration/plants-robustness.test.ts` (contrast and brand-rules plants) goes from 35 to 36 for
`f-motion-spin-missing`, in its own test commit (08246ac), changing nothing else in any test: a pin that changes by design
and was missed in the red commit.

After it, the whole suite, `pnpm test` on 08246ac: **3579 tests passed in 149 files**. A first rerun gave 5 failures, all
in `gates/test/integration/visual.test.ts` with exit 2: dockerd had stopped in the container (`docker info` failed). I
restarted dockerd as root as the environment notes say, and the rerun above passed. T049 is done.

## Fix round 2 (operator round from the landing review: O2-01, O2-02; tasks.md T049b to T049f)

- **Red** (T049d): 2041399, tests only (`gates/test/brand-rules.test.ts`, `packages/tokens/test/validate.test.ts`,
  `packages/tokens/test/generate.test.ts`, the pins in `gates/test/plant-runner.test.ts`,
  `gates/test/integration/plants-robustness.test.ts` and `gates/test/gates-readme.test.ts`). `red.sh 4 fix-2`:
  `"recorded": true`, exit 1, **18 of 7061 tests failed**, every one an `AssertionError` against the code before the
  fix (red-fix-2.log): rule (f) exit 0 with no finding where one is expected (7: the three misplaced markers, `1s`,
  `var()`, `calc()` and a per-theme motion value); `validateSource` not throwing (6); `css()` leaving a misplaced marker
  out of the block (1); the pins (4: 17 brand-rules cases, 239 other plants, 39 contrast and brand-rules plants, the
  two plant names missing from the README row). No load or setup error. A first `red.sh` run was stopped by the
  agent's own 10-minute command limit before it finished (nothing recorded, its worktree removed) and was run again.
- **Cases that passed at once** (the behaviour already existed; reported, not forced red, T049d): the C1 case
  (`tooltip-delay` needs no block entry); "requires a -delay name without the marker at 0ms in the block";
  "keeps the motion values that are no durations out of scope ..." (`1turn`, `90deg`, `cubic-bezier(...)`, `steps(4)`,
  `ease-in`, and `fade-delay` at `1s` with `delay: true`); in validate.test.ts "delay: true on a motion token whose
  name ends in -delay, and the motion angles and easings" and "for a motion value per theme, by the theme rule alone"
  (added so that the generator's string check is pinned: a per-theme motion value gets the theme rule only).
- **How rule (f) tells durations apart** (O2-02): a motion-group value is out of scope when it is a literal angle
  (`<number>deg|grad|rad|turn`) or an easing function or keyword (`cubic-bezier(...)`, `steps(...)`, `linear(...)`,
  `linear`, `ease`, `ease-in`, `ease-out`, `ease-in-out`, `step-start`, `step-end`); a literal `<number>ms` is a
  required duration; anything else, a per-theme value included, is a finding (fail closed). A valid delay (`delay:
  true` on a motion token named `-delay`) is skipped whatever its value. A misplaced marker is a finding and exempts
  nothing. Both findings are at the record (`inputs.locate`), rule `reduced-motion`, before the block's findings.
- **Green** checks on the fix tree: `pnpm test` **7061 tests passed in 208 files** (2027 s; dockerd restarted first, it
  had stopped); `pnpm vitest run --project tokens --project tokens-browser` 196 passed; `gate:typecheck` no type
  error; `gate:lint` 402 files, no finding; `gate:test-lint` 291 files, no finding; `gate:contrast` unchanged (207
  pairs in light, 215 in dark, 196 required per theme); `gate:brand-rules` "7 rules checked" (0 findings: `tooltip-delay`
  a valid delay, every other motion duration literal `ms`). The real source's stylesheet is byte-identical before and
  after the fix (`css(source)` compared).
- **Plants**: plants.md § Fix round 2 (both new plants as expected in shards 2 and 3; shards 1 to 3, all 239 other
  plants, as expected).
- **Mutation** (`pnpm run gate:mutation -- --base 2041399 --files packages/tokens/src/generate.ts,gates/bin/brand-rules.ts`,
  alone, 371 s): **121 mutants on the changed lines of 2 files, none survived**; 13 timeouts, 30 compile errors, 0
  zero-mutant entries, 0 equivalent records. The 13 timeouts (pass, R-14): 12 are regex mutants of the kind phase 4
  already recorded, the anchors dropped and the fraction part changed (`\d` for `\d+`, `\D+`), on the `ms` regex
  (`generate.ts:80`, moved up from its old line, so counted as changed) and on the new not-a-duration regex
  (`generate.ts:85`, `brand-rules.ts:37`); no test feeds a prefixed, suffixed or fractional angle or duration. The
  13th is `isDelay` returning `true` (`generate.ts:100`), which empties the reduced-motion block and makes every
  record a delay; the run timed out rather than reporting the kill. The 30 compile errors are mutants the type checker rejects (listed in the run's output).
