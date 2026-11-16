# Phase 6 notes

## The T090 spikes and the decision

`spike.md` records them, before any scaffold. R-09 held: a `file:` copy of the fixture with its policy in a `<meta>`
element loads the browser build under `--allow-file-access-from-files` and navigates to its `file:` target. R-08's stop
condition held: every measured form that leaves a host `aria-label` on the host gives a second named node. The operator
chose option (c) (`operator-decisions.md` decision 1): `ocelle-link` is named by its text or by a new `label`, and a host
`aria-label` is not forwarded. The planner amended the artifacts in `aa03280`; this phase builds that design.

`data-model.md` § Link state does not list `label` yet. That file is outside the implementer's role; the coordinator
raises it at review.

## The design as built

- The host has no role. Its shadow root (`delegatesFocus`) holds one native `<a part="anchor">` around a default slot.
  Lit renders no template: the element builds the anchor in its constructor and appends it in `createRenderRoot`, so
  the anchor is in the shadow root, focusable, as soon as the host is connected. The reason is FR-023: `ocelle-tabs`
  measures a shown panel's focusables when the panel's content arrives, through open shadow roots, and does not
  observe mutations inside them. With the anchor rendered by a Lit template (a microtask after connect), the first
  draft let the tabs measure an empty shadow root, so a panel holding only the link became a stop. US2-22's real body
  (T093a) failed on that draft and passes on the built form; the tabs' source is unchanged.
- The anchor's state follows R-08: the host's `href` as written while it resolves to an allowed protocol, else no
  `href`, `role="link"` and `tabindex="0"`. It is written imperatively on each `href` attribute change (also before the
  first update), after each update, and at the first event of an activation (`pointerdown`; the `keydown` of Enter),
  so a base URL inserted after render is taken into account (US5-11).
- A plain click (primary button; no Ctrl, Meta or Shift; Alt allowed) has its default prevented and activates. Enter on
  the anchor without `href` is taken on its `keydown`, whose default is left alone; Enter on the anchor with `href`
  becomes the anchor's own click. A modified activation emits nothing and keeps its default. Space is not handled.
- The activation dispatches the cancelable `ocelle-link-activate` with `{ href }` (the attribute as written, or null)
  and, unless it was cancelled, calls `location.assign` with `navigationTarget(href, document.baseURI,
  location.protocol)` when that is not null.
- `navigationTarget` (`src/link-target.ts`) uses `URL.canParse` and `new URL(href, baseURI)`, and allows `http:`,
  `https:` and the document's own protocol.
- `label` is set as the anchor's `aria-label` after each update, trimmed, and removed when blank or absent. The host's
  `aria-label` is not read or observed; the element writes no host attribute.
- `static shadowRootOptions` carries `@internal`, as `ocelle-tabs`' does, so the manifest does not list it.
- Styles: the anchor in `link`, underlined, `link-hover` under the pointer, the token ring as an outline (drawn per
  line fragment by Chromium: before and after every fragment, above the first and below the last); forced colours
  `LinkText` and a `Highlight` ring, which Chromium applies to the anchor without `href` too (measured by US5-7). No new
  token and no new colour pairing: R-15's link row (`link`, `link-hover` and `color-focus` on the main grounds) is
  checked in `pairs.json` already.

## How the tests observe navigation

- Each body sets a marker on `window` and remembers the URL at mount. The activation events are recorded in
  `sessionStorage`, with the marker and the fragment at dispatch, so "the event first, then the navigation" is read
  after the navigation, from the new document.
- Fixture bodies activate through `Navigation` (`test/browser/link.test.ts`): real input, then 300 ms and the page's
  load. New tabs and windows are Playwright's `page` events on the context; dialogs are recorded and dismissed.
- In process the navigations are same-document fragments and `javascript:` hrefs whose body would set `window.__ran`.
  `href=""` and `data:` are fixture-only: in the Vitest frame they would replace the runner's document.
- US5-11 runs in both harnesses. In process two links with `href="#x"` show that the anchor is refreshed at Enter's
  `keydown` and at a click's `pointerdown`; on the fixture the body is the spec's, with `href="x"` and a navigation pair.
- The file: suite (`elements-browser-file`) builds the browser build itself into a temporary directory, as the
  fixture's global setup does, because that project has no global setup. It records the events through a function
  Playwright exposes on the context, which survives the navigation.

## The Meta key on Linux (US5-13)

Measured on this machine (Chromium 153, Linux), with a plain `<a href>`: Ctrl and a middle click open a new tab, Shift a
new window, and **Meta follows the link in place**. Off macOS, Chromium does not treat Meta as a new-tab modifier. So
for Meta, US5-13's three outcomes cannot all hold on Linux: the element emits nothing and leaves the default (FR-046,
both asserted), and the browser then navigates in place, its own behaviour on this platform. The fixture body asserts
the event and the default for Meta, and "the page does not navigate in place" for Ctrl, Shift and the middle click.
This is a reading of the spec, not a design change: FR-046 states the element's part ("emits no event, and the element
does not prevent its default, so the browser's own behaviour is kept"), and on macOS Meta is the Cmd key the spec means.
It is raised in the phase report for the operator.

## The wrapped link story and axe

On two lines, axe-core 4.14.0 reports a serious `color-contrast` incomplete (`bgOverlap`) on the wrapped link. Its
`getVisibleChildTextRects` reads the anchor's own child text nodes; the anchor's text is slotted, so it falls back to
the anchor's union box, whose centre lies between the two lines, on the paragraph. A native `<a>` in the same sentence
reads its text nodes' rects and has no incomplete; the same link on one line or on three lines has none. The story
therefore wraps the link onto three lines (`stories-layout.css`, 240 px), and the story test pins three lines. No axe
exception is added (FR-051). A host page with a link wrapped onto exactly two lines meets the same incomplete in its own
axe runs; it is an axe-core limitation with slotted text, for an upstream report like phase 3's.

## Tests changed after the red commit

None: the green commit `3ceacb6` and the commits after it change no test file. The red commit was amended once before `red.sh` recorded it: the file: suite's wait for the element's
definition was unbounded, so on the scaffold its two tests timed out instead of failing on their assertions. The wait
is now bounded to 5 s. The recorded red commit is `2794722`.

## The red run

`red-phase.log`: 124 of 4027 tests fail, every one with an `AssertionError`. The failing files are the phase's new and
changed tests: link-target, the in-process and fixture link suites, the file: suite, the real US2-22 body in both
harnesses, the entry tests, the root exports, the build test, the manifest and README tests, the selection pairs check,
the story test, and the gate test counts. The visual gate's tests fail with exit 2 in that run because dockerd was not
running at the time; they fail on their counts and missing baselines either way, and pass on green with docker.

## Visual baselines under docker (T099)

By the operator's decision of 2026-11-14 (`reviews/phase-2/operator-decisions.md`), the baselines were produced in #10's
pinned container under docker with `pnpm run visual:update`. It wrote 10 files: the five link stories, light and dark.
No shared baseline changed or was removed, the token stories included.

No podman cross-engine check was possible in this session, because there is no podman. CI's `visual` gate, which runs
both engines, confirms the baselines at landing.

The counts the gate tests pin moved:
- story-themes and baselines from 100 to 110: `visual.test.ts`, `plant-repo.test.ts`, `axe.test.ts` (112 with the
  plant story);
- stories from 50 to 55: `storybook-build.test.ts`;
- elements from 10 to 11: the manifest gate tests.

The five light link stories joined the findings of the `visual/fail-token-changed` plant and its note (53 findings):
the sentence around each link is `color-ink`. The empty-index plant gained an empty copy of the link stories, and the
eight manifest plant copies gained the link's module.

The baselines were inspected:
- the paragraph story shows the link underlined in `link` inside the sentence;
- the wrapped story's link runs over three lines in the 240 px sentence, underlined on each;
- the focused story's ring is drawn around the link's one fragment;
- the hovered story's link is drawn in `link-hover`, underlined;
- the label story looks as the paragraph story (the label is not visible).

## The mutation gate (T100)

The first run of `pnpm run gate:mutation -- --base 493142e` (on `3ceacb6`) reported 4 findings in
`src/ocelle-link.ts`. `cf475d4` (`refactor(...)`) handles them; there was no behaviour defect among them.

- **Removed by simplifying the source.** The anchor's refresh in `updated()` and the one in `attributeChangedCallback`
  each survived alone, because each covered the other: `href` reflects, so every `href` change reaches the attribute.
  The refresh in `updated()` is removed; the attribute path is now the one refresh after render, and R-08's anchor
  body kills its removal (`plants.md`, *the anchor's state not refreshed on an href change*).
- **Equivalent records** (2), each applied by hand first: the in-process link and entry suites (21 tests) and the
  fixture link suite (25 tests) pass with each mutant.
  - `if (event.button !== 0) return;` with the condition forced `false`: Chromium fires `click` for the primary button
    only (a middle click is an `auxclick`), so no click with another button reaches the handler. The check stays for
    the engines that are not measured, on its own line; the record names forced `false` as equivalent, and forced
    `true`, which Stryker disables with it, as killed (US5-3 fails with it, run by hand).
  - The `label` entry of `static properties` as `{}`: Lit's default options are type `String`'s (attribute `label`, the
    default converter, not reflected), the same record as `ocelle-tabs`' `label`.

The second run (on `cf475d4`), `mutation.log`, exits 0:
- 115 mutants on the changed lines of 3 files, none survived;
- 1 timeout (`ocelle-link.ts:151`, a `StringLiteral`);
- 27 compile errors: type-checker rejections, such as a condition forced `true` before `location.assign(target)` with
  `target` typed `string | null`;
- 1 zero-mutant entry (`src/index.ts`, an export line);
- 2 equivalent records, above.

## Plants (T100)

`plants.md` records 53 plants, each applied alone to `cf475d4`, run once and reverted; every one made a test fail.
- Two plant forms did not bite on their first run, and neither was the defect its name states: *resolving once at
  render* cached a `null` target with `??=`, which assigns again at every refused activation, and the `:host` display
  plant only reordered two rules whose specificity already decides. Their corrected forms bite (`plants.md`).
- *Navigating on every activation* for a link without `href` reloads the document: in process it reloads the Vitest
  runner's frame, which ends the run with an error rather than an assertion, so its record is the fixture run, where
  US5-2 and US5-3 fail.
- Every contract row of the link and US2-22's row bite (`plants.md`, "The contract's link rows").

## The gate run (T100)

The gates were run one at a time on the code of `cf475d4`, with
`OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` and `OCELLE_VISUAL_ENGINE=docker`. The
commit after it adds only these records.

| Gate | Result |
|---|---|
| typecheck, lint (320 files), test-lint (217 files), style-lint (25 files), brand-rules (7 rules), pins (5 manifests), config-copies, prefix (302 files) | exit 0, no finding |
| contrast | exit 0: 166 pairs in light, 174 in dark, 155 required per theme. The link adds no pair: every pair of its R-15 row is already checked |
| manifest | exit 0: 11 elements |
| csp | exit 0: 30 files |
| signoff `--range 493142e..HEAD` | exit 0: 7 commits, no finding |
| unit-tests | exit 0: 4027 tests in 168 files |
| `vitest run --project elements-browser-file` | exit 0: 2 tests (US5-12) |
| storybook-build | exit 0: 55 stories |
| visual | exit 0: 110 captures match their baselines (docker only, no cross-engine comparison; no podman in this session) |
| axe | exit 0: 110 story-theme runs, 0 serious or critical; 22 notes, all excepted (the Prose document's ten and the scrolling listbox story's twelve); no new exception |
| `mutation -- --base 493142e` | exit 0: 115 mutants on the changed lines of 3 files, none survived; 1 timeout, 27 compile errors, 1 zero-mutant entry, 2 equivalent records (`mutation.log`) |
| plants | exit 0: 301 plants of 17 gates and the registry, every plant as expected; this includes `visual/fail-token-changed` with the five link findings, `storybook-build/fail-empty-index` with the link stories' empty copy and the manifest plants with the link's module |
