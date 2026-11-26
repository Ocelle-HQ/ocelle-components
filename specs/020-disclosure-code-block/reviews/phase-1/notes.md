# Phase 1 notes for the review

Implementer's notes on phase 1 (User Story 1, `ocelle-disclosure`): where the work departs from the letter of
tasks.md and why, what the red record shows, and what is left open. The spike is in `spike.md` and the operator's
decision on its stop in `operator-spike-decisions.md`; the plant runs (the gate's affected run and the element plants of T013 step 1)
are in `plants.md`, the gate runs in § Gates below.

## Scaffold: constitution VIII exemption (T002)

The scaffold commit (`scaffold.sha`) adds `src/ocelle-disclosure.ts` with its `define` call, `@tagname`, the declared
property `open` (`boolean | undefined`, `@default undefined`, not reflected) and an empty `render()`, and its exports
(the package root, which the browser build's entry imports, and `package.json`'s `./ocelle-disclosure.js`). It has no
behaviour: nothing is rendered, observed, reflected or dispatched, and it does not import `ocelle-icon`, so no test
could fail for it; the red commit's tests run against it and fail on their assertions (`red-phase.log`).

## Red record

`red-commits` holds one `phase` record (I3: the stories file and the story-test extension are in the same red
commit). `red-phase.log`: 175 of 7941 tests fail, every one on an `AssertionError`, none on an import, syntax or setup
error:

- the 45 bodies of `test/scenarios/disclosure.ts`, in process (`test/disclosure.test.ts`) and on the strict-CSP
  fixture (`test/browser/disclosure.test.ts`): all 45 fail in each harness. Reads of shadow parts the scaffold does not
  render go through `attempt()`, which turns a lookup error into the value `"absent"`, and clicks and hovers on a part
  with no box are skipped, so each body fails on its assertion rather than on a thrown lookup or a 60 s wait;
- the entry test, the root entry's new case and the module build test of `dist/ocelle-disclosure.js`;
- the manifest, README (15 statements and the Entry points table) and changelog node tests;
- the 49 story tests of the extension (render in light and dark, named summary, keyboard, no animation under both
  motion settings, the long summary's reflow);
- the pinned counts of the gate tests that read the committed manifest or the baselines (`manifest`: 21 elements;
  `axe`: 404 story-themes, the new stories failing axe on the scaffold; `visual`: 404 baselines).

Tests that pass at red, by design:
- the driver additions' own tests (`test/driver.test.ts`, `test/browser/driver.test.ts`): they test the harness, which
  the red commit itself adds (contracts/checks.md § Driver additions: "tested on its own ... in the red commit");
- the root exports test and the browser build's defined tags: the scaffold already exports and defines the element;
- `gates/test/integration/storybook-build.test.ts` (202 stories): the stories file is in the red commit.

## Departures from tasks.md, with the reason

- **Two driver readers beside the contract's two additions** (T003), as 013 added readers beside its six:
  `visible(id)`, the element's `checkVisibility()` (the closed-panel oracle of contracts/checks.md § Oracles, which no
  driver method read), and `reflected(id, inner, property)`, the elements an element-reflection property of a shadow
  element holds (the summary's `ariaLabelledByElements` and `ariaDescribedByElements`, FR-006, FR-007). Each is tested
  with `findText` and `setProperties` in `scenarios/driver-additions.ts`, in both harnesses.
- **`findText` in process takes the fragment off again.** The in-process AX and axe commands find the test's frame
  by its URL (test/commands.ts), so a fragment left on the frame's URL broke every later AX read of the file. After the
  navigation and two settles the driver restores the URL with `history.replaceState`, which navigates nothing. The
  fixture driver needs no restore: each fixture body opens its own page.
- **US1-20's dispatched click and US1-22's scroll go through the driver's `module()`** (an ES module of the page, served
  same-origin under the fixture's policy), so the fixture pages allow `module.js`; no driver method dispatches an event
  on a host or scrolls the document.
- **The test page's buttons sit in paragraphs.** Axe's `target-size` rule reported the 21 px "before" and "after"
  buttons of the scenario page, which touched the summary; each is in its own `<p>`, whose margins give the spacing
  the rule allows. The summary itself passes (31.2 px high).
- **The source was simplified after the first mutation run** (§ Mutation): equivalent branches removed, behaviour
  unchanged; eight bodies added in a test-only commit for the survivors that were not equivalent.
- **The motion bodies read after the driver's click settles.** contracts/checks.md § Oracles asks for the reading "one
  frame after the toggle, inside a 200 ms transition's duration"; the driver's `click` settles (two frames, the
  updates, one frame) before it returns, about 50 ms, which is inside that duration. The plants of a 200 ms
  transition on the summary and on the chevron bite (`plants.md`).
- **US1-13's "no id copied".** Setting `ariaDescribedByElements` makes Chromium put an empty `aria-describedby`
  attribute on the summary (element reflection), so the body asserts that no attribute in the shadow root holds the id
  `hint`, not that no `aria-describedby` attribute exists.
- **The summary's name when a host `aria-labelledby` resolves to nothing.** The element relates the resolved list only
  when it is not empty; an `aria-labelledby` whose ids are not in the host's tree falls back to the host `aria-label`,
  then to `.label`, as `ocelle-button` treats an unresolved list. R-03's rule reads "while the host gives an
  `aria-labelledby`, its resolved list"; with an empty list Chromium would name the summary from its content, which
  phase 1's operator decision avoids.
- **The story test's toggled state one frame after a pointer click** is read from the inner `details`, which changes
  with the click; the host attribute follows the native `toggle` task and is read two frames later (both asserted).
  The focused story's keyboard check starts on the summary the story focuses, so it presses no Tab first.
- **`aria-expanded` at upgrade.** The mapped value is held until the first connection and applied there, after
  every attribute of the markup, so it wins over `open` whatever the attribute order.

## Known gaps, recorded, not worked around

- The closed-`details` case of `src/focusable.ts` (a closed disclosure last in an `ocelle-dialog` or `ocelle-drawer`
  lets Tab leave the overlay) is op 022's (#57), as research.md § Repository-wide notes records. No disclosure story or
  test in this phase places a disclosure in an overlay, so nothing here needs that fix; the README states the
  limitation.
- The icon-slot naming of `ocelle-button` (a slotted titled svg names the control) is op 022's as well; the disclosure
  names its summary from `.label` and does not depend on it.

## Mutation (T013 step 2)

`pnpm run gate:mutation -- --base <phase base>`, the whole diff in one run (not op 015's CI shards; the shard plan is
10 shards, and one shard alone took 1240 s here, almost all of it the elements suite's dry run, so 10 sandbox shards
would take over three hours):
- first run (2856 s): `mutation: 26 findings in 3 changed files (169 mutants on changed lines; 2 timeouts, 34 compile
  errors, 2 zero-mutant entries)`. The equivalent ones were removed from the source rather than recorded: the moved
  attributes' callback re-resolves the references on any change (idempotent); the focus rescue is computed in every
  `willUpdate` (closing and focus in the host's light DOM) instead of a flag reset after use; the mapped value is
  applied at each connection from a pending value cleared after use; the `toggle` handler assigns `details.open`
  unconditionally and reads the final state from `details`; the describedby list is set as is. The rest got eight
  bodies (test commit after the red commit): an update that does not close leaves focus in the panel, a close with
  focus outside leaves it there, the upgrade takes no focus, the mapped attribute first in the markup still wins,
  another value on an open disclosure, the upgrade's mapped value applied once across a move, aria-describedby set
  later, and an aria-labelledby resolved on a later connection;
- final run (2622 s): `mutation: 121 mutants on the changed lines of 3 files, none survived; 2 timeouts, 25 compile errors, 2
  zero-mutant entries; 0 equivalent records` (the two timeouts are `connectedCallback`'s body removed and its
  `super.connectedCallback()` removed: the element never renders and the wait never ends).

CI runs the shards; the 45-minute limit of op 015 was not measured here for each shard. One sandbox shard of 1240 s,
at CI's 1.5 to 3.4 times slower runners, is 31 to 70 minutes: a shard may come near or over the limit on a slow
runner. If CI's shard times show that, it is op 015's stop-and-ask point.

## Gates (T013 steps 2 to 4)

Run locally on the green tree (operator decision of 2026-11-20, CI-first: the fast gates, the affected plants, and
the browser and visual tests this phase changes; the coordinator records the decision):
- `gate:typecheck`, `gate:lint`, `gate:style-lint`, `gate:test-lint`, `gate:config-copies`, `gate:prefix`: no finding;
  `gate:manifest`: `manifest: 21 elements checked, no finding`; `gate:csp` (after `pnpm -r run build`): `csp: 47 files
  checked, no finding`; `gate:signoff --range <base>..HEAD`: no finding; `gate:contrast`: `contrast: 207 pairs checked
  in light, 215 in dark (196 required per theme)` (no new pair).
- The disclosure's browser tests: `test/disclosure.test.ts` 53 passed, `test/browser/disclosure.test.ts` 53 passed,
  the entry, root, exports, driver and node tests passed; the story-test extension's 49 disclosure tests passed.
- `visual:update` in #10's pinned container under docker: `baselines: wrote 16 files (16 added, 0 changed, 0
  removed), 301342 bytes in total` (8 stories × 2 themes). No podman cross-check was possible in this environment.
- Run before the CI-first decision: `gate:storybook-build`: `storybook-build: built 202 stories`; `gate:axe`: `axe:
  404 story-theme runs, 0 serious or critical; 10 notes (0 incomplete, 10 excepted)`, with no
  `storybook/a11y-exceptions.json` entry; `gate:visual`: `visual: 404 captures match their baselines (docker only: no
  cross-engine comparison)`; the whole-diff mutation runs above.
- `gate:plants -- --affected <base>`: the full set (not mapped), stopped after 252 plants with no finding printed
  (`plants.md`); left to CI.
- Left to CI: `pnpm test` (the full unit-tests gate; the red run of `red.sh` ran the whole suite on the red commit),
  the full plant set, the mutation shards.
- Scope guards (SC-007, SC-008): `git diff 4911fd0b --` over `src/overflow-region.ts`,
  `specs/009-workflow-layouts/contracts/`, `src/focusable.ts`, `src/overlay.ts` and mission 013's element sources,
  stories and scenario and harness tests is empty. Mission 019 is not on this branch, so it has no file to diff.
