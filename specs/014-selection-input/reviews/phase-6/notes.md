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

## Review round 1 fixes

- **R1-01, operator decision 2 (a).** For Meta, US5-13 states only the element's part. The fixture body now also presses
  Meta+Enter on the link with `href`, after the Meta click, on a fresh page. For both, it asserts no
  `ocelle-link-activate` and a `click` whose default the element did not prevent, and nothing about the navigation
  that follows. The in-place navigation check stays for Ctrl, Shift and the middle click. The README's sentence now
  says a modified activation's default is left to the browser: a new tab or window for Ctrl, Shift and the middle
  click, and the platform's convention for Meta. The CHANGELOG entry says the same, and the documentation test checks
  the new README sentence. No source changed.
- **R1-03, operator decision 4.** The README's link section states the axe-core 4.14.0 limitation: a serious
  `color-contrast` incomplete (`bgOverlap`) on a link whose slotted text wraps onto exactly two lines, not a contrast
  failure. The documentation test checks it.
- **Upstream axe-core report: still to be filed.** The limitation above (axe's `getVisibleChildTextRects` reads only
  the element's own child text nodes; for a shadow anchor whose text is slotted it falls back to the union box, whose
  centre lies between two lines) goes to axe-core as an upstream report. It has not been filed from this run.
- **R1-02, operator decision 3.** The planner added `label` to `data-model.md` § Link state in `039018a`; no change in
  this phase's code or tests.

## Landing fold (T115)

Operator round 3, O3-01 (landing L1-01, L1-02), "Space the test link". Red `ca18374`, green `96dd714`. Every run below
used `OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` unless it says otherwise, one at a
time, on 2026-11-19.

### The red step

`ca18374` adds `packages/elements/test/browser/link-subpixel.test.ts` (in `elements-browser` by its path; no
`vitest.config.ts` change) and `packages/elements/test/browser/subpixel/fonts.conf` (the system `/etc/fonts/fonts.conf`
with `rgba` `rgb`, `lcdfilter` `lcddefault` and `hintstyle` `hintslight`). The suite launches its own Chromium with
`FONTCONFIG_FILE` set to the file's absolute path; the shared `launch()`, `serve.ts` and every other suite are
unchanged. Its precondition counts the pixels of black text on white whose channels differ by more than 8 and needs more
than 0; its second test is the one body whose name starts with `US5-7:`, asserted to be exactly one, run unchanged with
a navigation whose members throw.

`red.sh 6 fix-3`: `"tests_only":true,"red":true,"recorded":true`, exit 1; `red-commits` holds `phase` and
`fix-3 ca18374…`. `red-fix-3.log` (the pnpm store path redacted): "1 of 8009 tests failed", the only failure being
`link-subpixel.test.ts`'s US5-7; no load, launch or setup error. The precondition and US5-7 in `link.test.ts` and
`browser/link.test.ts` passed in that run. The gate's summary line does not show the diff, so the same file was run
alone at the red commit (`vitest run --project elements-browser packages/elements/test/browser/link-subpixel.test.ts`):
1 failed, 1 passed (the precondition); the one diff hunk is `ring`, `[true, true]` expected, `[false, true]` received
(the left side).

### Checks against the operator's required change

`FONTCONFIG_FILE` must be an absolute path. With the relative path T115 step 3 gives
(`FONTCONFIG_FILE=packages/elements/test/browser/subpixel/fonts.conf`), US5-7 passed at the red commit in both harnesses:
fontconfig resolves a relative `FONTCONFIG_FILE` against its own configuration directory, not the working directory, so
the file was not loaded and the text stayed grayscale. The CI-like rows below use
`FONTCONFIG_FILE=$PWD/packages/elements/test/browser/subpixel/fonts.conf` from the repository root. The committed suite
already uses the absolute path (`fileURLToPath(new URL(…, import.meta.url))`).

The commands: `pnpm exec vitest run --project elements packages/elements/test/link.test.ts -t US5-7` (in process) and
`pnpm exec vitest run --project elements-browser packages/elements/test/browser/link.test.ts -t US5-7` (fixture), plus
the subpixel suite `pnpm exec vitest run --project elements-browser packages/elements/test/browser/link-subpixel.test.ts`.

| Launch | Harness | At red `ca18374` | At green `96dd714` |
|---|---|---|---|
| grayscale (default) | in process | pass (1 passed, 18 skipped) | pass (1 passed, 18 skipped) |
| grayscale (default) | fixture | pass (1 passed, 24 skipped) | pass (1 passed, 24 skipped) |
| CI-like, `FONTCONFIG_FILE` absolute | in process | fails on `ring` only, left `false` (1 failed, 18 skipped) | pass (1 passed, 18 skipped) |
| CI-like, `FONTCONFIG_FILE` absolute | fixture | fails on `ring` only, left `false` (1 failed, 24 skipped) | pass (1 passed, 24 skipped) |
| subpixel suite (committed) | fixture | fails on `ring` only, left `false`; precondition passes (1 failed, 1 passed) | pass (2 passed) |
| Playwright 1.64.1 Docker image | in process | fails on `ring` only, left `false` (1 failed, 18 skipped) | pass (1 passed, 18 skipped) |
| Playwright 1.64.1 Docker image | fixture | fails on `ring` only, left `false` (1 failed, 24 skipped) | pass (1 passed, 24 skipped) |
| Playwright 1.64.1 Docker image, subpixel suite | fixture | fails on `ring` only, left `false`; precondition passes (1 failed, 1 passed) | pass (2 passed) |

The Docker rows ran `./node_modules/.bin/vitest run --project …` in
`mcr.microsoft.com/playwright@sha256:ee15712262f017b8157421b212b12099146645f44b1bc5c0514cbbe6a229b1d0` (the image the
diagnosis pulled for Playwright 1.64.1: Node 26.13.0, `chromium-1248` and `chromium_headless_shell-1248`), with the
repository mounted at its own path, `CI=true`, `--ipc=host` and no `OCELLE_CHROMIUM_PATH`, so Playwright's own browsers
ran with the image's default fontconfig. The red column there ran the green tree with `scenarios/link.ts` checked out
from `ca18374` and restored after. The image reproduces CI's failure at red in both harnesses and passes after the
spacing.

The planted wrong rings still fail US5-7 after the spacing, under the grayscale and the subpixel launch, in both
harnesses and in the subpixel suite; the colour-only swap of the ring is equivalent in Chromium (`plants.md`,
"Landing fold, operator round 3").

### The gate run

Run one at a time on `96dd714` with `OCELLE_VISUAL_ENGINE=docker` as well.

| Command | Exit | Result |
|---|---|---|
| `pnpm run gate:typecheck` | 0 | no type error in the files of tsconfig.json |
| `pnpm run gate:lint` | 0 | 476 files checked, no finding |
| `pnpm run gate:test-lint` | 0 | 348 files checked, no finding (the new suite included) |
| `pnpm test` | 0 | 8009 tests passed in 248 files (the new suite's 2 included) |
| `pnpm run gate:plants -- --affected ca18374^` | 0 | no plant selected, 0 of 314 plants judged (`plants.md`) |

The fold's diff against `cafa4ba` touches only `test/browser/link-subpixel.test.ts`, `test/browser/subpixel/fonts.conf`,
`test/scenarios/link.ts` (US5-7's mount and its plant comment) and the phase 6 review records: no baseline, no other
pixel or visual test, no `vitest.config.ts` or `serve.ts` change and no element source change. No registry,
completeness gate or plant-repository count names test files of `test/browser/`, so none changed. The mutation gate
was not rerun: no source file changed.

### The red/green check

`tdd-check.sh 6` on `857cd29` reports `pass` (`tdd-check.json`): both red commits fail at their commit (`phase`
`d4875fa`, `fix-3` `ca18374`: 1 of 8009 tests failed, the subpixel US5-7), the final tests fail against the base and
the scaffold, and 8009 tests pass at HEAD. It took three runs. In the first two the HEAD run failed one test each, a
different motion row each time, both from mission 008 and outside this fold: "Rapid toggle during the entry, motion on"
in `browser/dialog.test.ts`, then the same row in `browser/drawer.test.ts`, each with `entry: []` (the entry animation
had already ended when it was read). `browser/dialog.test.ts` run alone after the first passed (370 tests), and the
whole `elements-browser` project after the second passed (1652 tests); the third run passed at HEAD. No test was
changed for it.

The final tests now fail against the base and the scaffold with exit 2, "no test file found", where the last check
(`c77845e`) had exit 2 against the base and exit 1 against the scaffold. Since the merge of main the final test set of
the phase (the test files changed from the base to HEAD, 230 files) includes main's test changes, and overlaid on the
pre-merge scaffold the suite collects no file. That comes from the merge, not from this fold; both runs still fail, as
the check needs.

### CI (to be recorded after the push)

Run [44539529359](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/44539529359) on the fold's head
`8fd8c47` (8fd8c47b8498cbbe34749c79aaedffd4001e4357): conclusion success. The job list, read with `gh run view`
(read only): 129 jobs, all success. Among them Unit tests, the 80 Mutation shards, the Mutation testing aggregate
(L1-02), Mutation plan, the 29 Plants shards and the Plants aggregate, Visual regression and Accessibility. US5-7 and
the mutation shards, red in CI before the fold (landing L1-01, L1-02), are green. No surviving mutant is reported in
new or changed code; the fold changes no source file. T115 is ticked.
