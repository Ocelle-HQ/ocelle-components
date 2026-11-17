---
phase: 1
round: 1
verdict: changes_requested
base: 15ce56120ffdf26c35593664457a569376c0f252
head: 89c9672689213586d03efaaabba005745924093d
tdd_check: pass
---

# Phase 1 review, round 1

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | blocking | packages/elements/test/scenarios/probe.ts:51-64 (`take`); self-test packages/elements/test/scenarios/harness.ts:220-237 | `styleAttributes()` misses every `style` attribute that an element already carries when it is inserted. `take` counts `attributes` records only, and for `addedNodes` looks only for `<style>` elements. A MutationObserver produces no attribute record for a write made while the node is detached, so a node styled before insertion is never counted. That is the usual way a style attribute would arrive: Lit commits a template's bindings into the detached fragment before inserting it (`instance._update(values)` before `_commitNode(fragment)`, node_modules/.pnpm/lit-html@3.3.3/node_modules/lit-html/development/lit-html.js:1030-1041), so a first-render `style=${styleMap(...)}` would be missed, and so would a bubble created in script, positioned through `el.style.*` and then appended. I reproduced it with the real probe (`installProbe` in Chromium 1243, script in the session scratchpad): with a host and an open shadow root after `reset()`, a `<span>` given `style.color` and then appended, plus a cloned template holding `<i style="…">`, left `styleAttributes()` at **0** while `root.querySelectorAll("[style]").length` was **2**. Only a later write on a connected node counted (1). R-14 says the observer "records every `style` attribute write", and FR-047 and SC-007 ("0 elements carry a `style` attribute") rest on this probe. The `csp` gate only sees literal `style=` in built templates, not CSSOM writes or `styleMap`. As it stands, the overlay and placement rows' FR-047 assertions cannot fail for these cases. The self-test does not cover them: its stand-in writes only to connected nodes. | Make the count include every element (and its descendants) carrying a `style` attribute when it is added to the document or any observed shadow root, keeping the delta-from-mount and ignore rules. Add self-test rows in both harnesses, red first against the current probe: (a) an element given a CSSOM `style` write while detached, then appended into a nested shadow root, and (b) a shadow root filled from a cloned template whose markup holds a `style` attribute (or a Lit-style detached-fragment commit). |
| R1-02 | note | vitest.config.ts:104,121 | `elements-touch` includes `packages/elements/test/*.touch.test.ts`, and `elements` excludes only that pattern. A `*.touch.test.ts` placed deeper, for example in `test/scenarios/`, would run silently in the mouse project `elements`. This follows T009 and contracts/checks.md. R-14's text says `test/**/*.touch.test.ts`, so the plan's wording disagrees with itself. | None now. Keep touch test files at `test/` top level, or align R-14's wording. |
| R1-03 | note | packages/elements/test/fixtures/tooltip-delay.css; packages/elements/test/in-process.ts:96; packages/elements/test/browser/fixtures/overlays.html, tooltip.html | No test in this phase reads `--ocelle-tooltip-delay` (in process or on the fixture), and no test visits `overlays.html` or `tooltip.html`: the fixture self-tests run on `icon.html`. T011 does not ask for a self-test, and the Phase 3 timing rows (150 ms / 450 ms) will fail if the sheet is not applied. | None now. A one-line check in Phase 2 or 3 that the computed delay is `300ms` on both harnesses would surface a broken link early. |
| R1-04 | note | packages/elements/test/scenarios/harness.ts:117-122 | The `ocelle-harness-overlay` stand-in was changed after the red commit: it now blurs its button after `dialog.close()`. The expected values did not change, the reason is in the code comment and in notes.md, and the change touches the observed subject, not an assertion. This is not a weakening. | None. |

## Test quality

- **Red evidence.** There is one red commit, `b9628e9` (test files only, `red-commits` entry `phase`, exit 1). `red-phase.log` shows
  each new test failing for the missing behaviour: `driver.<method> is not a function` for every driver addition in
  both harnesses and both contexts, `commands.<name> is not a function` for `emulateReducedMotion`, `pointerPath` and
  `touchTap`, and assertion failures for the extended `axTree` (no `modal`, `level` or `description`) and for the
  T009 project tests. The 5 `visual.test.ts` failures in that log are environmental (no docker at that time) and pass now.
- **Final tests on base.** `check-final-tests-on-base.log`: 16 failures (exit 1). These are the command, project and
  in-process device/viewport rows, because the driver files are test-pathspec files and move with the tests.
  `tdd-check.json` is `pass`, with no problems.
- **Post-red test changes.** `git diff b9628e9..HEAD` over the test pathspec changes only harness implementation
  files, plus the one stand-in change of R1-04. No expectation was loosened, and no test was skipped, deleted or
  weakened.
- **Assertions.** Every self-test asserts a whole observed record with `toEqual` against hand-written values. There are
  no conditional assertions, no `skip`/`only` and no snapshots. The fixture runners also assert the CSP and console
  recorders (exactly the expected `style-src-elem` violations for the `<style>` row, clean otherwise).
  `gate:test-lint` reports no finding. Every row of checks.md § Harness self-tests and of T001 has a body in both harnesses, and both
  touch rows run in both touch contexts. The gap is in what the `styleAttributes()` row exercises (R1-01).
- **Mutation.** `pnpm run gate:mutation -- --base 15ce561`: "nothing to mutate: no package or gate source line
  changed". All of this phase's code is test harness code, outside the mutated source.

## Checks run

All were run at HEAD `89c9672` with the environment named in the task (docker available, `OCELLE_VISUAL_ENGINE=auto`):

- `pnpm test`: 3148 tests passed in 143 files (exit 0), including the docker visual integration tests.
- `gate:typecheck`, `gate:lint` (272 files), `gate:test-lint` (182 files), `gate:style-lint`, `gate:prefix`,
  `gate:config-copies`, `gate:pins`, `gate:brand-rules`, `gate:contrast`, `gate:manifest`, `gate:csp`: no finding,
  each exit 0.
- `gate:storybook-build` (21 stories), `gate:axe` (42 runs, 0 serious or critical), `gate:visual` (42 captures match):
  exit 0.
- `gate:mutation`: nothing to mutate (see above).
- `gate:plants`: not completed. The run stopped at this session's one-hour limit for a background command, after 292 plants had reported their time (of about 301 plant directories) and with no failure line. It is not counted as a pass. This phase changes no gate source or plant.

Tasks: T001 to T012 are all ticked and their work is present. The `ax()` self-test covers the `axTree` row. `device()`
is a driver method of its own, recorded in notes.md. Changes outside the listed files (`vitest.mutation.config.ts` and
the two gate tests) follow from T009 and are tested. Constitution: no element source changed. The new fixture pages
link only same-origin stylesheets and the module script (IV). The probe and harness perform no network I/O.

## Earlier findings

None: this is round 1.
