# Phase 3 notes: User Story 2, link mode and ARIA passthrough

## Status

Base 2014d99 (`base.sh 3`). No scaffold: the tests needed no new module. Spike T030 first
(`reviews/phase-3/spike.md`): the plan holds, no stop-and-ask. One red commit (a94d9e8, `red.sh 3 phase`: tests only,
red, recorded; 142 of 3497 tests failed, every one an `AssertionError`, none a syntax, import or setup error), then the
green commits.

## Deviations and points for the review

- **Chromium build.** The spike and every run of this phase used Chromium 156.0.8078.4 (`/opt/pw-browsers/chromium-1248`,
  the build the pinned Playwright 1.64.1 expects, now present in the container), not 153 (`chromium-1243`), which
  tasks.md's environment note names. No `OCELLE_CHROMIUM_PATH` was set.
- **Meta-click on Linux.** tasks.md T031 expects, for each of Ctrl, Meta, Shift and Alt, "a new tab or no navigation in
  the current tab" on the fixture. Measured on this Chromium on Linux (a plain page with a plain link, no element):
  Ctrl and the middle button open a new tab, Shift a new window, Alt downloads the target, but Meta is no link modifier
  there, so a Meta-click navigates the current tab. FR-023 and US2-1 ask that the browser's default for a modifier
  click is not prevented and that no `ocelle-button-activate` is dispatched; the element does exactly that for Meta
  (the in-process sink records the click not prevented with `metaKey`, and no activate event). The fixture body
  therefore asserts the platform's default for Meta (the page navigates) and, for Ctrl, Shift, Alt and the middle
  button, the new tab, window or download with the page left where it is. On macOS, where Meta is Cmd, the default is
  a new tab. Not a design question (the element prevents nothing), so no stop; recorded here and in the scenario's
  header for the reviewer.
- **The consumer compositions carry an `id`.** SC-006 asks for "exactly that markup". The scenario renders the README's
  markup with one attribute added, an `id` on the element, which the driver needs to reach it (`withId` in
  `scenarios/link.ts`); `readme.test.ts` compares the README with the constants without the id. The page has two
  container rules (a canvas ground for the page, the chrome ground for the top bar), none on the elements.
- **Harness additions.** The driver gains `copy(id, via, into)` (an `outerHTML` parse, a `cloneNode(true)` or a
  container's `innerHTML`) and `morph(id, markup)` (idiomorph's attribute sync, written into the test), for US2-13.
  Their two self-tests in `scenarios/harness.ts` passed in the red commit, as the phase 2 harness additions did: the
  code they test is test code committed in the same commit.
- **Red tests corrected in the green commit** (7c72352, its body lists them; none loosened, each asserts the same
  outcome): US2-8, US2-9 and US2-13 named controls against their visible text, which axe reports as
  `label-content-name-mismatch` (the README's label-in-name rule), so their markup now holds the visible text in the
  name; SC-006's page had no ground, so dark ink sat on the white runner page; a `readme.test.ts` fragment held a TAB
  where the README shows `\t`; the fixture driver's `callClick` threw when a link's `click()` navigated at once.
- **Forced colours of a link.** In the dark forced-colours palette axe reported `color-contrast` for a link-mode label
  (yellow `LinkText` measured against the white it assumes behind a transparent `<a>`; a native button has
  `ButtonFace` behind it). The link now sets `background-color: Canvas` under forced colours, which is what the system
  paints there anyway (`src/control.ts`); R-12's table lists no background, so the reviewer may want it recorded there.
- **Mirrors read at the first connection.** `MovedAttributes.connected()` reads the mirrors back once, at the first
  connection (the upgrade), so a mirror a host writes while no value is held is not read when the element is moved
  in the DOM later, as the README says ("not read until the next upgrade").
- **`aria-pressed` and the `pressed` state in link mode.** The data model sets `:state(pressed)` from the moved value
  whatever the mode; `aria-pressed` itself is applied in button mode only (FR-009). US2-11 asserts the inner control
  and the tree; the state in link mode is not asserted.

## Visual baselines

The twelve new baselines (`elements-ocelle-button--{link,link-disabled,link-new-tab,expanded,current,pressed}`, light
and dark) were written only by `OCELLE_VISUAL_ENGINE=docker pnpm run visual:update` in #10's pinned container ("wrote 12
files (12 added, 0 changed, 0 removed)"; no existing baseline changed), and checked with `pnpm run gate:visual` (88
captures match, "docker only: no cross-engine comparison"). No podman cross-engine check was possible in this
environment; CI confirms the baselines at landing. No baseline PNG was hand-edited or hand-picked.

Under load (16 `yes > /dev/null` processes), `OCELLE_VISUAL_ENGINE=docker pnpm run gate:visual` ran three times: 88
captures matched each time; the processes were killed afterwards.
