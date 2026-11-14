# Phase 1 notes: test harness additions (R-14)

## Red run (T004)

- Red commit `b9628e9` (`test(008-overlays): phase 1 red — Setup: test harness additions`), test files only;
  `red.sh 1 phase` reported `tests_only: true`, `red: true`, recorded in `red-commits`. Log: `red-phase.log`.
- 44 of 3148 tests failed. 39 are this phase's tests, each for the missing behaviour:
  - the self-tests of `scenarios/harness.ts`, in process and on the fixture, default and touch context:
    `TypeError: driver.<method> is not a function` (`styleAttributes`, `styleElements`, `topLayer`, `focusPath`,
    `press`, `record`, `animations`, `hover`, `viewport`, `device`, `touchTap`); the `ax()` row by assertion (no
    `modal`, `level` or `description` in the nodes);
  - `commands.test.ts`: `commands.emulateReducedMotion` / `commands.pointerPath is not a function`, and the extended
    `axTree` by assertion; `commands.touch.test.ts`: `commands.touchTap is not a function`;
  - the project tests of T009 (`gates/test/vitest-config.test.ts`, `gates/test/integration/vitest-mutation-config.test.ts`)
    by assertion: no `elements-touch` project, touch files owned by `elements`, no viewport, no `hasTouch`, no new commands.
- The other 5 failures are `gates/test/integration/visual.test.ts` (visual gate and baseline command under docker): the
  docker daemon is not reachable in this container. They fail the same way before and after the phase.

## Green run (T012)

- `vitest run --project elements --project elements-touch --project elements-browser`: 20 files, 218 tests passed
  (the self-tests in both harnesses and both contexts, the command tests, and every existing element test at the new
  1280 × 800 in-process viewport).
- `gates/test/vitest-config.test.ts` and `gates/test/integration/vitest-mutation-config.test.ts`: 13 passed.
- `pnpm test`: 3143 of 3148 passed; the 5 failures are the docker-only `visual.test.ts` rows above.
- `gate:typecheck`, `gate:lint`, `gate:test-lint` (182 files), `gate:style-lint`, `gate:prefix`, `gate:config-copies`:
  no finding.

## Changes from the plan worth knowing in Phase 2

- `device()` is a driver method of its own (hover, fine pointer, `maxTouchPoints`, reduced motion), so the device rows
  read through the driver like every other row.
- `focusPath()` and `topLayer()` name an element by its `id`, else its local name, with the inner active element of a
  shadow root (open or closed: the probe keeps closed roots from `attachShadow`) or frame in brackets: `ov[in]`,
  `fr[f1]`.
- `styleAttributes()` counts elements whose `style` attribute was written since mount (a write removed again counts
  once); the driver's own `resolveColour` probe is left out. `style()` still writes one and is not for the overlay rows.
- On the strict-CSP fixture, a `<style>` element added to a shadow root is blocked and reported as a `style-src-elem`
  violation and a console error; the `styleElements()` self-test expects exactly those.
- `axTree` gives `description` only when non-empty, and `modal` and `level` only where Chromium reports them, so the
  existing `{ role, name }` expectations are unchanged.
- The touch command test lives in `test/commands.touch.test.ts` (the `elements` project has no touch context).
- The overlay stand-in of the `record()` self-test blurs its button after closing its dialog: Chromium keeps focus on
  the button of a dialog closed with nothing focused before it opened. The expected values are unchanged.
