# Phase 3 notes for the review

Implementer's notes on phase 3 (User Story 3, `ocelle-progress`): where the work departs from the letter of tasks.md
and why, what the red record shows, and what is left open. The spike is in `spike.md` with the operator's decisions in
`operator-spike-decisions.md`; the plant runs of T052 and T052a are in `plants.md`.

## Spike (T035)

No platform read exposes a progressbar's value text in Chromium 153 through Playwright 1.64.1 (`spike.md`). The phase
stopped; the operator chose (a), "Prove the wiring, not the exposure", and the key name
`Symbol.for("ocelle.progress.sweepStart")` (`operator-spike-decisions.md`), and the planner amended the spec, research,
contracts and tasks (`ce95346`). The phase resumed at T036 from there.

## Scaffold: constitution VIII exemption (T036)

The scaffold commit (`scaffold.sha`) adds `src/ocelle-progress.ts` with its `define` call, `@tagname`, the seven
declared properties of contracts/elements.md (each `| undefined`, `@default undefined`, none reflected yet) and an
empty `render()`, and its exports (package root, and so the browser build, and `package.json`). It has no behaviour:
nothing is rendered, exposed or animated, so no test could fail for it; the red commit's tests run against it and fail
on their assertions (`red-phase.log`). This is the exemption contracts/checks.md § Scaffold states.

## The harness commit before the red commit

`30449fe` registers the `emulateReducedMotion` browser command in `vitest.config.ts`. The command itself is in
`test/commands.ts` and landed in the red commit, but `vitest.config.ts` is outside the red commit's test pathspec, and
without the registration every reduced-motion body would have failed on an unknown command (a setup error, not the
missing behaviour). The commit changes only the configuration; nothing calls the command until the red commit.

## Red record

`red-commits` holds one `phase` record (I3: the story-test extension is in the same red commit). `red.sh 3 phase`:
`{"tests_only":true,"red":true,"recorded":true,"exit_code":1}`, `red-phase.log`: `unit-tests: 200 of 3766 tests
failed`, every failure an `AssertionError`, none an import, syntax or setup error: the 28 progress bodies in each
harness, US2-7 with the real bar in each harness, the entry and root tests, the build test's pairing half, the pairing
test, the manifest declaration, the 50 readme statements, rows, entry row and CHANGELOG names, the 28 token-only
allowance tests and the gates README row, the 45 story tests, and the pinned counts of the gate tests (6 elements, 61
stories, 122 story-themes and baselines). Tests that pass at red, by design:
- the driver additions' own bodies (`animations`, `remove`, `frames`, `replace`, `changeAttributes`, `textOf`,
  `rendered`) and the command tests (the AX value properties, `emulateReducedMotion`): they test the harness, which the
  red commit itself adds (contracts/checks.md § Driver additions);
- the root exports test, the build test's import half and its browser-build half: the scaffold already exports and
  defines `OcelleProgress`, and its module imports no element;
- the story test's naming check on the facts and empty-state stories, which hold no bar: it guards the stories of the
  four elements (contracts/checks.md § Story test, "every story") and is paired, in the progress and panel-loading
  stories, with a bar present;
- the `token-only` cases whose raw value was already raw; each shares its test with an allowed value that failed.

The red commit was not amended.

## Departures from tasks.md, with the reason

- **Driver readers beyond contracts/checks.md § Driver additions** (test-only): `textOf(id, inner)` reads a shadow
  element's text, since US3-3 now reads the visible `value-text` part (operator decision (a)) and no reader gave a
  shadow element's text; `rendered(id)` gives an element's `innerText` and the client rects of a range over its
  light-DOM content, for the fallback-text body's "no client rect" and "absent from `innerText`"; `changeAttributes(id,
  changes)` sets and removes attributes in one task, for the one-episode body ("within one task", which two
  `setAttribute` calls, each settling a frame, cannot give). `setProperty` takes a number, a boolean or null as well, for
  US3-6's property set to `null` and US3-2's value 9. Each has its own driver body.
- **`animations(id)` also returns `currentTime`**, beside kind, part, property, play state and end time, so US3-5,
  US3-12, US3-14, US3-15 and the right-to-left body can show their read falls inside the first loop, or that a
  replacement joined the episode's sweep at its time.
- **The compact row does not wrap** (`flex-wrap: nowrap`), where research R-06 wrote `flex-wrap: wrap`. With wrap, a
  long label takes a line of its own and the track the next one at the full width, so the label is not beside the bar
  (the edge case "Long progress label beside a compact bar") and the T052 plant "track `min-inline-size` removed" could
  not make the compact long-label body fail. Without wrap the label shrinks and wraps between words beside the bar,
  which keeps `--ocelle-measure-cell`; the plant bites (`plants.md`).
- **Size rules sit outside `@media not (forced-colors: active)`**, as `ocelle-empty-state`'s panel padding does: they
  are layout, and must hold in forced colours too. Only the tinted boundary and the label colours are variant colour
  rules inside it. The fill's `accent-strong` edge is in the base rule, so the forced-colours `box-shadow: none` is
  what removes it under `forced-color-adjust: none` (its plant bites).
- **US2-7 (T039)** reads the bar against a probe of `--ocelle-measure-reading` in the bar's own font context, at a
  400 px column (the bar is the column) and a 1200 px column (the bar is the measure), in one body, so the
  `::slotted(ocelle-progress)` plant has a real oracle (phase 2 review R1-03). The phase 2 stand-in rule `.fill` of the
  empty-state page rules is gone with the stand-in.
- **The `token-only` iteration-count allowance is per comma-separated item**: one bare positive integer per item
  passes, so `3` and `3, 2` pass while `3 2` (two numbers in one item), `2.5`, `-1` and `1e1` are raw.
- **The episode record** holds the start and the set of connected indeterminate bars under
  `Symbol.for("ocelle.progress.sweepStart")` (the operator's key name, research R-06's record).
- **Plant trees brought up to the repository** (T052 step 2): the eight `manifest` plant manifests gained the
  `ocelle-progress` declaration, `storybook-build/fail-empty-index` replaces the progress story file too, and
  `visual/fail-token-changed` lists the five new light story-themes that show `color-ink` (the panel-loading heading and
  the four bars with a visible label).

## Review note R1-04 (phase 1)

tasks.md places no facts change in phase 3, so the Tab read for the facts link bodies was not added here.

## Visual baselines (T050)

`pnpm run visual:update` in #10's pinned container (docker; `dockerd` running as root, the pinned image present):
`baselines: wrote 22 files (22 added, 0 changed, 0 removed), 156943 bytes in total` (11 stories, light and dark). No
podman cross-engine check was possible in this container. CI's "Visual regression" captures stay the record.

## T052 step 2: gate runs

See the green commits' report; the final lines are recorded below once run.
