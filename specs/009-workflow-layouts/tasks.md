# Tasks: Workflow and Screen Layouts

**Input**: the design documents in `specs/009-workflow-layouts/`, as the operator approved them at the plan gate on
2026-11-13 after three plan-squad rounds (`reviews/plan/round-1..3/`):

- spec.md: FR-001 to FR-035, SC-001 to SC-009, and the paired "does not" table;
- plan.md: the decisions and the phase list;
- research.md: R-01 to R-19;
- data-model.md;
- contracts/overflow-region.md, contracts/elements.md and contracts/gates.md;
- quickstart.md.

Amended after the analysis (`analysis-report.md`; operator decisions in `reviews/analysis/operator-decisions.md`;
fixes in `reviews/analysis/fixes-1.md`). No task ID changed.

**Tests**: required. Constitution Principle VIII applies to every phase. The phase flow is:

1. `base.sh`, then an optional `scaffold.sh`;
2. one red commit of test files only, proven by `red.sh`;
3. green, then `tdd-check.sh`, then an independent review.

Expected values are written by hand from the spec, the data model and research. They are never read from the source
under test. The frame widths, the lane and track widths and the thresholds are written as numbers in the tests.

**Guard rules.**

- A "does not" assertion never stands alone. It shares its test with the positive assertion it guards, as the spec's
  pairing table says.
- Each guard is proven able to fail by its named plant. The implementer runs the plant once and records the output in
  `reviews/phase-N/plants.md`.
- A plant that does not make its guard fail stops the phase (stop-and-ask).

**Shared scenario bodies** (R-17). Every browser scenario is written once in `packages/elements/test/scenarios/*.ts`
against the driver interface and runs in two harnesses:

- the in-process `elements` project, which runs element source and is mutated;
- the `elements-browser` project, which runs the built browser build on strict-CSP fixtures and is not mutated.

Keyboard and focus scenarios run in both. Fixture runs also assert, on every page, zero CSP violations, only allowed
requests and no console message.

**Environment.**

- Node 22 runs in this container, Node 26.13.0 in CI.
- Every browser run sets `OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`.
- Stryker and plant runs alias the browsers directory, as `knowledge/speckit-flows/findings/frontend-missions.md`
  § Browser path describes.
- Run one heavy job at a time: browser suites, mutation, plants, `visual:update`.
- Never `git stash`.
- Shared files (`packages/elements/src/index.ts`, `src/browser.ts`, `custom-elements.json`, the READMEs, the
  changelogs, the Storybook configuration) take conflicts by merging `main`, never by rebasing.

**Organization.**

- Phase 1 is Setup: the #10 recheck, the tokens and the frames.
- Phases 2 to 4 are User Stories 1 to 3, one review unit each.
- Phase 5 is Polish: the cross-cutting README test, quickstart, and the final merge.
- Each phase is folded after its approval (`/ocelle-run` step 4.3).
- Records (README, CHANGELOG, stories, baselines, plants) belong to the phase whose behaviour they describe.

**Stop-and-ask points.** At each of these, the implementer stops, records the question in the phase review, and does
not work around it:

- **T001 (#10 recheck):** #10 is not merged, or differs from R-15 in a way that changes a story, the baseline path or
  command, or the viewport.
- **T002 (sibling 011):** `main` holds a letter-spacing or container-tier convention from #8 that conflicts with R-12
  or R-16.
- **T030 (scrollbar test):** Chromium fades the scrollbar despite the measured mask layers.
- **T050 (list-detail spike):** a figure of R-13 does not hold.
- **Plants:** a plant that does not bite.
- **Mutation:** any mutation shard over 10 minutes.
- **Colour:** a new colour pairing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task).
- **[Story]**: the user story of the task (US1 to US3).
- Paths are relative to the repository root.

---

## Phase 1: Setup

**Purpose**: work against #10 as merged and sibling 011 as it stands, then add the six tokens and the tested frames.

**Independent Test**: these all hold:

- `pnpm vitest run --project tokens` passes with the six tokens;
- the token gates pass with the new pinned counts;
- both element harnesses measure Frames W, R, N and S at 876, 1196, 636 and 288 px at their viewports;
- `tdd-check.sh 1` reports `pass`.

### Records (exempt, first)

- [ ] T001 Recheck #10 (R-15; plan.md recheck note). Confirm #10 is merged on `main`, then merge `main` into
  `claude/015-workflow-layouts` (never rebase). Read #10 as merged against R-15's list:
  - the viewport and scale;
  - the theme global;
  - the baseline path and the `visual:update` command;
  - the render signal and its timeout;
  - the pointer-state parameter;
  - the `a11y-exceptions.json` format;
  - the story file and layout-stylesheet locations;
  - the contributor note's items;
  - the Storybook configuration.

  Record each item as "as designed" or "differs: …" in `specs/009-workflow-layouts/reviews/phase-1/recheck-10.md`.
  Where an item differs, update R-15, `contracts/elements.md` § Stories and the affected tasks below in the same
  commit, and name them in the record.
- [ ] T002 Check `main` for sibling 011's (#8) uppercase letter-spacing token and container-tier convention (R-16,
  spec Assumptions "Sibling tokens"). Record the result in `specs/009-workflow-layouts/reviews/phase-1/sibling-011.md`:
  - absent: this feature adds `--ocelle-tracking-caps` and writes the convention;
  - present: adopt its name and value in T003 to T006 and in contracts/elements.md, and record the mapping.

### Tests (red, one commit)

- [ ] T003 [P] `packages/tokens/test/` (the existing source-table and generated-output tests) asserts the six new
  records and values:
  - `lane-min-width` `10rem`, group `shell`;
  - `list-track-width` `18rem`, `shell`;
  - `list-detail-collapse` `40rem`, `shell`;
  - `list-detail-inspector-collapse` `60rem`, `shell`;
  - `scroller-fade-size` `var(--ocelle-space-7)` with `ref: ["space-7"]`, `space`;
  - `tracking-caps` `0.06em`, `type`.

  It also asserts that `tokens.css` and the documentation rows name each of the six, and that the token and gates
  tests pin the new counts (R-16, FR-033).
- [ ] T004 [P] A token test that `color-sheet` differs from `color-canvas`, `color-panel`, `color-inspector` and
  `color-pane` in light and in dark (R-10, PLAN-CORRECTNESS-1-011 (b)), in
  `packages/tokens/test/source-table.test.ts` or beside it.
- [ ] T005 [P] Frame tests in `packages/elements/test/frames.test.ts` (in-process) and
  `packages/elements/test/browser/frames.test.ts` (fixture). In each harness, set the frame's viewport with
  `driver.viewport()`, mount a `[data-frame]` box, and assert its measured inline size:
  - W at 1280: 876 px;
  - R at 1280: 1196 px;
  - N at 720: 636 px;
  - S at 320: 288 px.

  Assert `innerWidth` too, so a wrong viewport fails (R-17, PLAN-TESTABILITY-1-008). Also add the driver method's
  own test in `packages/elements/test/driver.test.ts`: `viewport(width, height)` changes `innerWidth` in both
  harnesses.

### Implementation (green)

- [ ] T006 `packages/tokens/src/source.ts`: the six records of T003, as plain records (never `as const`). Then
  regenerate the tokens output and docs, and update the pinned counts in the token and gates tests where the tests
  read them.
- [ ] T007 `driver.viewport()` in `packages/elements/test/scenarios/driver.ts` (interface),
  `packages/elements/test/in-process.ts` (through `vitest/browser`'s `page.viewport`) and
  `packages/elements/test/browser/driver.ts` (through `page.setViewportSize`); R-17.
- [ ] T008 `packages/elements/test/fixtures/frames.css` is the one frame source: `[data-frame="W"]` 876 px,
  `[data-frame="R"]` 1196 px, `[data-frame="N"]` 636 px, `[data-frame="S"]` 288 px. The in-process driver adopts it as
  text through `driver.rules()`, and the fixture pages link it same-origin. No `style` attribute anywhere (R-17).
- [ ] T009 Write `specs/009-workflow-layouts/reviews/phase-1/tdd-exempt.md`: T001 and T002 are records with no
  behaviour; T003 to T005 are the red commit for T006 to T008.

**Checkpoint**: `tdd-check.sh 1` reports `pass`; `pnpm run gate:contrast` and `gate:brand-rules` pass.

---

## Phase 2: User Story 1 - A horizontal strip that is a tab stop only while it overflows (Priority: P1) 🎯 MVP

**Goal**: US1 scenarios 1 to 16; FR-001 to FR-011 and FR-030 to FR-032, FR-034 and FR-035 for the scroller. The
overflow-region module as contracts/overflow-region.md defines it, and the `token-only` gradient change of
contracts/gates.md. The README § Host ARIA and § Styles changes.

**Independent Test**: on the strict-CSP fixture, an overflowing `<ocelle-scroller label="Filters">`:

- is one tab stop and one `group` node named "Filters";
- scrolls 40 px per ArrowRight with no animation;
- fades only on its sides with content off-screen;
- keeps every focused chip's ring whole and clear of the fades.

Its fitting twin is none of these. `ocelle-test-overflow-host` passes US1-1, US1-3, US1-4 and US1-12.
`pnpm run gate:style-lint` passes with the gradients, and its new plants are judged as expected.

### Tests (red, one commit)

- [ ] T010 [P] [US1] Driver methods, tests first, in `packages/elements/test/driver.test.ts` (R-17). Each method is
  proven against a plain fixture in both harnesses:
  - `press(key)` with `Tab`, `Shift+Tab`, `ArrowLeft`, `ArrowRight`, `Home`, `End`, `Alt+ArrowLeft`, `Ctrl+ArrowRight`,
    `Meta+ArrowRight` and `Shift+ArrowRight`, as real input only;
  - `click(target, point)`;
  - `wheel(target, deltaX)`;
  - `activeElement()` (deep);
  - `tabWalk(from, to)`;
  - `scrollLeft` and `setScrollLeft`;
  - `lastKeyPrevented()`;
  - `reducedMotion(on)`;
  - `frameRecord(target, read)`;
  - `settle()`: `updateComplete` after two animation frames;
  - `messages()`;
  - `sheets()`.
- [ ] T011 [P] [US1] `gates/test/token-only.test.ts` (and `token-only-parts.test.ts` if `rawValues` changes): every row
  of the contracts/gates.md table, red against the current rule. The three token-only gradients pass. `#000`, `45deg`,
  `2rem`, `black` and `rgb(0 0 0)` inside a gradient are each raw. `radial-gradient()` and
  `repeating-linear-gradient()` are raw whole. The `var(--ocelle-…)` name check applies inside a gradient
  (PLAN-CORRECTNESS-1-002 (a)).
- [ ] T012 [P] [US1] `packages/elements/test/overflow-region.test.ts` (in-process, pure helpers):
  - `edgeState(scrollLeft, scrollWidth, clientWidth)`: the 1 px tolerance on each side and the negative `scrollLeft`
    under `rtl`;
  - `clearanceScroll({ ring, box, fade, fadeStart, fadeEnd, direction })` in LTR and RTL, for three controls:
    - one that fits with clearance: its ring box ends at least the fade depth from each edge that still fades;
    - one wider than the box less two fade depths: aligned at the inline start, with the covering side suppressed;
    - one wider than the box: aligned at the inline start, both suppressed;
  - `resolveName(hostAriaLabel, label)`: a non-blank host label wins, trimmed; a blank host label falls back to the
    trimmed label; a blank label gives none (R-01, R-06, FR-010).
- [ ] T013 [US1] `packages/elements/test/scenarios/scroller.ts`: US1 scenarios 1 to 16 as shared bodies with real
  input. Each "does not" is paired as the spec table says, with the plant named in the body's comment:
  - **US1-1:** a fitting scroller vs. its overflowing twin, a tab stop and one `group` named "Filters". Plant:
    `tabindex` and role set whatever the overflow.
  - **US1-2:** a tab walk with links.
  - **US1-3:** resize and content changes both ways. The state is asserted inside a later-registered
    `ResizeObserver`'s own callback, not in a later frame. Plant: the state write moved into a
    `requestAnimationFrame` (R-03, PLAN-TESTABILITY-1-004 (a)).
  - **US1-4:** the handover.
    - Focus goes to the first focusable slotted element in the flat tree, including a slotted element whose button is
      in its open shadow root and one that delegates focus. With none, it goes to `.region-frame`.
    - The ring is drawn by `.region-ring` and asserted on pixels inside an `overflow: hidden` container, at rest and
      after the content overflows again while the frame holds focus; `Highlight` in forced colours.
    - Plants: the light-DOM-only walk; the frame's ring rule removed; the ring as an outline of the frame (R-07,
      PLAN-A11Y-SECURITY-1-007 (a), PLAN-FRESH-2-004).
  - **US1-5:** a 40 px step reached within one frame, under `reducedMotion` on and off, in `ltr` and `rtl`.
    - At the extent, the key is prevented and nothing changes.
    - Home and End are not prevented.
    - Alt+ArrowLeft, Ctrl+ArrowRight, Meta+ArrowRight and Shift+ArrowRight are not prevented and do not scroll.
    - Plant: no modifier check (R-02).
    - No composition case: the box is not editable, so no composition reaches it, and the module reads no
      `isComposing` (R-02, analysis B1 (b)).
  - **US1-6 and US1-7:** the fades, asserted on pixels on `color-canvas` and `color-pane`, in both themes, `ltr` and
    `rtl`, never on `data-fade`.
    - A fitting box has no `data-fade` and a computed `mask-image` of `none`.
    - The box's ring overlay is not faded at a fading edge.
    - Plants: both fades always; the `rtl` mirror removed; the ring overlay inside the masked box; `data-fade=""`
      bound with the mask on attribute presence (R-05, PLAN-FRESH-2-006).
  - **US1-8:** forced-colours lines, asserted on each edge element's computed border, side and box. Plant: both
    lines always.
  - **US1-9:** the box's ring on `:focus-visible`, not after a click.
  - **US1-10:** a key on a focused link is not prevented, while the box-focused key scrolls. Plant: `preventDefault`
    on every arrow key.
  - **US1-11:** the box-focused key and the fades do not animate. The browser's own scroll from a focused slotted
    control is not asserted (FR-009, PLAN-FRESH-2-003 (a)).
  - **US1-12:** the exact tree of the unlabelled scroller, a tab stop with no role and no name (SPEC-1-10).
    - A host `aria-label="Ready strip"` gives one `group` named by it.
    - `aria-label=" "` counts as absent (FR-010).
  - **US1-13:** the ring room and the tab walk through twelve links, forward and back, in `ltr` and `rtl`.
    - Every ring box lies clear of each fading edge, while each edge with content off-screen still fades.
    - The wide-button fallback is held over at least two animation frames, then restored by a wheel scroll, by an
      arrow key on the box, and when focus leaves the button (`focusout`, with Tab to the next control): the fade
      shows again on that side. Plant: the synchronous flag (R-06, PLAN-A11Y-SECURITY-1-001).
    - Pointer focus is compared with a twin plain `overflow-x: auto` box, with the Tab case paired in the same test.
      Plant: clearance on every `focusin`.
    - A text input is cleared on a click, while a button is not moved.
    - The forced-colours line follows the same suppression (SC-001 fallback).
    - Plants: no ring room; no fade clearance (R-04, R-06).
  - **US1-14:** a hidden scroller. Plant: `:host([hidden])` removed.
  - **US1-15:** the fixture checks.
  - **US1-16:** run against the test host.
  - **20 px root case:** a 40 px clearance, and 24 px with `--ocelle-scroller-fade-size: calc(1rem + 4px)` on the
    element (R-17).
  - **Sheets:** over two scrollers, `sheets()` shows the shared sheets plus exactly one per-instance sheet per root
    (R-13, PLAN-FRESH-2-005 (a)).
- [ ] T014 [US1] `packages/elements/test/scroller.test.ts` (in-process over T013) and
  `packages/elements/test/browser/scroller.test.ts` (fixture over T013, plus US1-15's request and console checks).
  It follows T013, whose bodies it runs.
- [ ] T015 [P] [US1] `packages/elements/test/fixtures/overflow-host.ts`: the test-only `ocelle-test-overflow-host`.
  It is built on `OverflowRegion` with its own scroll-box markup and the default `group` role, and ships in no
  package. Add `packages/elements/test/overflow-host.test.ts`, which runs US1-1, US1-3, US1-4 and US1-12 from T013
  against it (US1-16, SC-008).
- [ ] T016 [P] [US1] `packages/elements/test/browser/scrollbar.test.ts`, launched with
  `ignoreDefaultArgs: ["--hide-scrollbars"]`:
  - the block size includes the scrollbar;
  - at a faded edge the scrollbar's pixels equal a twin plain box's, while the content just above is faded;
  - when the scrollbar appears (content grown past the box), the mask size updates within one frame;
  - the handover ring shows over the scrollbar band.

  Plant: the fade layer sized to the whole box (R-04, R-05, PLAN-FRESH-1-003 (a), PLAN-FRESH-2-001 (a)).
- [ ] T017 [P] [US1] `packages/elements/test/entry-scroller.test.ts`: importing `../src/ocelle-scroller.ts` defines
  `ocelle-scroller` and no other new element. Extend `entry-root.test.ts` and `exports.test.ts` to `ocelle-scroller`.
- [ ] T018 [P] [US1] `packages/elements/test/node/manifest.test.ts`: the `ocelle-scroller` entry has `label`
  (`string | undefined`, not reflected, described), one default slot, and no events, parts or CSS custom properties
  (contracts/elements.md).
- [ ] T019 [P] [US1] `packages/elements/test/node/readme.test.ts`, one assertion per statement:
  - § `ocelle-scroller`: the attribute, the slot and the tokens read; the tree (a named `group` while overflowing);
    the keyboard; the scrollbar; the guidance to give repeated scrollers an item-specific name; in a shrink-to-fit
    host (a default flex item, a dialog, a table cell), give the scroller a definite or maximum inline size so that it
    scrolls (spec Edge Cases, "Scroller or board inside a shrink-to-fit host");
  - § Element conventions: the overflow-region module's interface (inputs, outputs, effects, lifecycle, the
    stylesheet class names, what a later element must not do);
  - § Host ARIA, scoped per element. Icon and brand mark: a blank host `aria-label` decides. Scroller, board and
    lane: blank counts as absent, with R-01's reason. List-detail: no name. This replaces the package-wide sentence
    the test pins now (PLAN-CORRECTNESS-1-005 (a)).
  - § Styles: the shared `static styles` plus at most one per-instance sheet of measured px figures. It never holds
    values from attributes, properties, token text or slotted text. It names the module and list-detail. This
    replaces the "one shared stylesheet" sentence (FR-030, PLAN-FRESH-2-005 (a)).
  - the reduced-motion statement for keys pressed while a slotted control has focus (FR-009, PLAN-FRESH-2-003 (a));
  - § Engines: the mask properties with their figures (R-18).
- [ ] T020 [P] [US1] `storybook/test/integration/elements-stories.test.ts`: the six scroller stories of
  contracts/elements.md § Stories are in the built Storybook, and each renders `ocelle-scroller` in light and dark with
  zero CSP violations.

### Implementation (green)

- [ ] T021 [US1] The driver methods of T010 in `packages/elements/test/scenarios/driver.ts`,
  `packages/elements/test/in-process.ts` and `packages/elements/test/browser/driver.ts`. Use real input through
  `vitest/browser`'s `userEvent` in-process and through Playwright's `page.keyboard` and `page.mouse` on the fixture
  pages, never synthetic events (R-17). This is test infrastructure that T010 tests, so it is not exempt.
- [ ] T022 [US1] `gates/stylelint/token-only.ts`: classify `linear-gradient()` arguments as contracts/gates.md says.
  Add the plants of contracts/gates.md under `gates/plants/style-lint/` and the `gates/README.md` row
  (PLAN-CORRECTNESS-1-002 (a)). Done before T023's styles.
- [ ] T023 [US1] `packages/elements/src/overflow-region.ts`, exactly as contracts/overflow-region.md defines it:
  - the `OverflowRegion` controller, with the `box()` and `role` options (`group` by default) and the `step` of 40;
  - `setLabel`, and the observed host `aria-label`;
  - outputs: `overflowing`, `offStart`, `offEnd`, `fadeStart`, `fadeEnd`, `fadeAttribute`
    (`"start" | "end" | "both" | undefined`), `name`;
  - effects on the box: `tabindex`, `role`, `aria-label`;
  - arrow keys: unmodified `ArrowLeft` and `ArrowRight` with the box as composed target, an instant `scrollLeft`
    assignment, `preventDefault`; no `isComposing` check (R-02, analysis B1 (b));
  - clearance on `focusin` of a `:focus-visible` descendant (`composedPath()[0]`), with the suppression cleared on
    `focusout` or on a `scroll` whose `scrollLeft` differs from the `written` value by more than 1 px;
  - handover to the first focusable element in the flat tree (a box check through `getClientRects()` and
    `visibility`, not `checkVisibility()`), else to `.region-frame` with a temporary `tabindex="-1"`;
  - one `ResizeObserver` on the box (border box) and the track, `slotchange`, and a passive `scroll` listener;
  - state written in the callback that observed the change;
  - the pure helpers of T012;
  - `overflowRegionStyles`, with the mask layers sized from measured px figures in one per-instance constructed
    stylesheet (R-05, R-13).
- [ ] T024 [US1] `packages/elements/src/ocelle-scroller.ts`:
  - `static override properties` with `label`; `observedAttributes` plus `aria-label`; `@tagname`/`@default` JSDoc;
  - the contract's template (`region-frame`, `region-box` with `data-fade` bound through `ifDefined`, `region-track`
    holding the default slot, `region-ring`, two `region-edge` elements, all `aria-hidden` except the box);
  - `static styles` = its own rules plus `overflowRegionStyles`, including `:host([hidden]) { display: none; }`, and
    the variant and mask rules inside `@media not (forced-colors: active)`;
  - `define("ocelle-scroller", …)`.
- [ ] T025 [US1] `packages/elements/src/index.ts` and `src/browser.ts` export and define `ocelle-scroller`.
  `packages/elements/package.json` gets the export `./ocelle-scroller.js`.
- [ ] T026 [US1] Regenerate and commit `packages/elements/custom-elements.json`
  (`pnpm --filter @ocelle/elements run manifest`).
- [ ] T027 [US1] `storybook/stories/scroller.stories.ts`: Fits; Overflowing at start; Overflowing in the middle;
  Overflowing at the end; Right to left; Unlabelled. Frames use `data-frame` and `[data-story]` rules in
  `storybook/.storybook/stories-layout.css`, taken from `frames.css` by import or as a copy checked by a
  `storybook-integration` test. No `style` attribute and no class anywhere. The mid-scroll and end stories set
  `scrollLeft` after `updateComplete` in their render (R-15).
- [ ] T028 [US1] Baselines: `pnpm run visual:update` in the pinned container under docker for the six stories in light
  and dark, committed under `storybook/baselines/`. Confirm them by a CI run of the branch, and commit CI's artifact
  files when they differ (#10 FR-005). Run `pnpm run gate:axe`: 0 serious or critical, nothing in
  `a11y-exceptions.json`.
- [ ] T029 [US1] `packages/elements/README.md` with the statements of T019, and `packages/elements/CHANGELOG.md`:
  `ocelle-scroller`, its entry point, the module convention, and the `style-lint` gradient change in
  `gates/README.md`'s history if it keeps one.
- [ ] T030 [US1] Run each pairing plant of T011, T013, T015 and T016 once. Record them in
  `specs/009-workflow-layouts/reviews/phase-2/plants.md`. The scrollbar plant of T016 is a stop-and-ask point. Then
  run, one at a time: `pnpm run gate:style-lint`, `gate:csp`, `gate:prefix`, `gate:manifest`, `gate:plants`, and
  `gate:mutation -- --base <phase base>`.

**Checkpoint**: `tdd-check.sh 2` reports `pass`; the review approves.

---

## Phase 3: User Story 2 - A board whose lanes fit a 1280 px window and scroll by themselves when narrower (Priority: P2)

**Goal**: US2 scenarios 1 to 15; FR-012 to FR-021 and FR-030 to FR-035 for the board and the lane. The board uses
`OverflowRegion` with `role: "region"`.

**Independent Test**:

- five lanes with sentence-length cards fit Frame W (858 of 876 px) with no board overflow, and overflow Frame N;
- `<ocelle-workflow-lane label="Ready" count="3">` is one `group` named "Ready, 3";
- a flat lane shows an uppercase sans title with `--ocelle-tracking-caps`, never monospace;
- the default lane's `color-sheet` ground differs from the canvas.

### Tests (red, one commit)

- [ ] T031 [P] [US2] `packages/elements/test/lane-count.test.ts` (in-process, pure): the count grammar of R-09.
  - Attribute values accepted: `"3"`, `" 3 "` and `"03"` (shown as "3").
  - Attribute values rejected: `"+3"`, `"3e0"`, `"3.0"`, `"-1"`, `"2.5"`, `"abc"`, `""`, and a value above
    `Number.MAX_SAFE_INTEGER`.
  - The property accepts safe integers ≥ 0 only.
  - The name function: `"Ready, 3"`; `"Ready, 3 work packages"`; `"3"` and `"3 work packages"` without a title;
    `"Ready"` without a count; none with neither. A non-blank host `aria-label` wins, and a blank one counts as
    absent (FR-018, FR-019).
- [ ] T032 [US2] `packages/elements/test/scenarios/board.ts` and `scenarios/lane.ts`: US2 scenarios 1 to 15 as shared
  bodies, each frame at its viewport. US2-1, US2-3, US2-14 and US2-15 use sentence-length card text. Pairs and plants:
  - **US2-1:** Frame W, no overflow and no region, vs. Frame N, a tab stop and one `region` named by `label`.
    Plants: always region; the board's `::slotted(*)` `contain: inline-size` removed (R-08).
  - **US2-2:** in Frame N, the board is one tab stop and one `region` named by `label`, and the page has no horizontal
    scroll. With the board focused, in `ltr`, ArrowRight moves `scrollLeft` toward the hidden end in 40 px steps until
    the end is reached, and ArrowLeft back; Alt+ArrowLeft and Shift+ArrowRight are not prevented and do not scroll.
    The board's fades are asserted on pixels: at the start only the inline-end side fades, in the middle both, at the
    end only the inline-start side (SC-002, US1-5, US1-6). Plant: no modifier check (as US1-5).
  - **US2-3:** equal shares within 1 px, `--ocelle-space-3` gaps.
  - **US2-4:** the lane chrome. Its computed ground is `color-sheet` and differs from `color-canvas`, `color-panel`,
    `color-inspector` and `color-pane` in both themes. The title's computed style is `--ocelle-font-size-sm`,
    `--ocelle-font-weight-strong` and `--ocelle-color-ink`; the count follows it in `--ocelle-color-ink-muted` with
    `tabular-nums`. Plant: the lane ground set to `color-panel` (R-10).
  - **US2-5:** one `group` named "Ready, 3", and no further node with the title or count text. Plant: the visible
    title not hidden from the tree.
  - **US2-6:** every count and title case of the spec, including host `aria-label`. Plants: count "0" when absent;
    the group role and ", " always applied.
  - **US2-7:** the flat lane's computed `font-family` is `--ocelle-font-sans` with `tabular-nums`, plus
    `text-transform`, `letter-spacing` and colour.
  - **US2-8:** title wrapping.
  - **US2-9:** at 320 px the page has no horizontal scroll while the board scrolls. Plant: a board without its own
    overflow, so the page scrolls.
  - **US2-10:** right to left. The first lane is at the right and the count follows the title inline. In Frame N
    with the board focused under `dir="rtl"`, ArrowLeft reaches the hidden end in 40 px steps and ArrowRight comes
    back, modified arrows are not prevented, and the fades are mirrored: at the start only the left side fades
    (SC-002, US1-5, US1-6).
  - **US2-11:** forced colours. A default lane has a 1 px `CanvasText` border; a flat lane has none.
  - **US2-12:** a hidden board and a hidden lane. Plant: `:host([hidden])` removed.
  - **US2-13:** fixture checks.
  - **US2-14:** with `base.css`: equal lanes, the identifier broken, the image capped, the nested `Tags` scroller a
    `group` tab stop of its own. Plants: min-content minimum; the board's `::slotted(*)` without inline-size containment
    (R-08).
  - **US2-15:** flat lanes with card rings, whole at the board's edges and clear of the fades in Frame N. Plant: no
    ring room.
  - **SPEC-2-06** (R-08): wide fixed content overlaps the next lane. Added after the first render as a card that
    grows the last lane, it makes the board overflow within one frame (FR-014).
  - **20 px root case:** lanes at 200 px, so five overflow Frame W (1070 px > 876 px; R-17).
  - **Sheets:** `sheets()` shows one per-instance sheet per board root and none on the lane.
  - **Edge cases** (spec Edge Cases; analysis C3), one assertion each, paired as the spec table says:
    - **Many lanes:** twelve lanes in Frame W are each at least 160 px wide, and the board overflows and is a tab
      stop while the page has no horizontal scroll.
    - **One lane:** one lane in Frame W is the board's inline size less the ring room on each side (866 px, within
      1 px), and the board does not overflow.
    - **No lanes:** an empty board in Frame N draws a box, does not overflow, is not a tab stop and adds no node,
      beside a twin with five lanes in Frame N that is a tab stop and a named `region`. Plant: always region.
    - **Non-lane children:** five children in Frame W, three lanes and two `div`s, each `div` holding a sentence wider
      on one line than its share: all five are equal within 1 px and at least 160 px, and the board does not
      overflow. Plant: `contain: inline-size` on the lane host only, not in the board's `::slotted(*)` (R-08,
      analysis F1).
    - **Lane count updates:** on a lane with `label="Ready"` and `count="3"`, setting `count` to 4, then
      `count-label` to "4 work packages", updates the visible count ("4") and the group's name ("Ready, 4", then
      "Ready, 4 work packages"); the lane's tree has no `aria-live` attribute and no `status`, `alert` or `log` node.
      Plant: `aria-live="polite"` on the header.
    - **Content changes while scrolled:** five lanes in Frame N scrolled to the end; removing one lane leaves the
      board overflowing at the clamped end, with the start fade and no end fade (on pixels); removing two more makes
      it fit, with no tab stop, no region and no fade. Plant: the fades and the tab stop computed from a cached
      `scrollLeft` (the value read before the removal) instead of the clamped one (analysis U1). The state not
      recomputed on `slotchange` or the track's resize is US1-3's plant, which the clamp's `scroll` would mask here.
- [ ] T033 [US2] `packages/elements/test/workflow-board.test.ts` and `workflow-lane.test.ts` (in-process over
  T032), and `packages/elements/test/browser/workflow-board.test.ts` (fixture over T032). It follows T032, whose
  bodies it runs.
- [ ] T034 [P] [US2] `packages/elements/test/entry-workflow-board.test.ts`: the module defines `ocelle-workflow-board`
  and not the lane. `entry-workflow-lane.test.ts`: it defines `ocelle-workflow-lane` only. Extend `entry-root.test.ts`
  and `exports.test.ts`.
- [ ] T035 [P] [US2] `packages/elements/test/node/manifest.test.ts`: the board entry (`label`, default slot) and the
  lane entry (`label`; `count` `number | undefined`; `count-label`/`countLabel`; `variant` `"flat" | undefined`,
  reflected; default slot). Neither has events, parts or CSS custom properties.
- [ ] T036 [P] [US2] `packages/elements/test/node/readme.test.ts`:
  - § `ocelle-workflow-board`: its slot and tokens; a board holds lanes (Edge Cases "Non-lane children of a
    board", analysis C8); the board paints no ground and goes on a main ground; wrap wide content in an
    `ocelle-scroller`; `base.css` caps nested images; a shrink-to-fit host needs a definite inline size;
    a width-only change inside a lane is picked up at the next size, slot or scroll event (FR-014, PLAN-FRESH-1-006 (b)).
  - § `ocelle-workflow-lane`: its attributes, the name rule with no built-in words, the `color-sheet` ground, and
    the flat variant.
- [ ] T037 [P] [US2] `storybook/test/integration/elements-stories.test.ts`: the five board and six lane stories of
  contracts/elements.md § Stories.

### Implementation (green)

- [ ] T038 [US2] `packages/elements/src/ocelle-workflow-lane.ts`: `label`, `count` (an attribute converter per R-09),
  `count-label`, and `variant` (reflected); the group wrapper with its name; the `aria-hidden` header; the content
  slot. Styles: the `color-sheet` ground, `--ocelle-radius-row` and `--ocelle-space-3` padding for the default
  variant; the flat title style; no inline-size containment of its own (the board's `::slotted(*)` gives it, R-08);
  `overflow-wrap: anywhere`; `::slotted(*)` with
  `max-inline-size: 100%`; the forced-colours border with `--ocelle-border-width`; `:host([hidden])`.
- [ ] T039 [US2] `packages/elements/src/ocelle-workflow-board.ts`: `OverflowRegion` with `role: "region"`. The track as
  a flex row with `gap: var(--ocelle-space-3)`, `align-items: stretch` and `min-inline-size: 100%`. `::slotted(*)` with
  `flex: 1 1 var(--ocelle-lane-min-width)`, `min-inline-size: var(--ocelle-lane-min-width)` and `contain: inline-size`,
  so every child, a lane or not, is contained (R-08, contracts/elements.md, analysis F1). The block ring room
  is placed once, as contracts/overflow-region.md places it (R-04, R-08). `:host([hidden])`.
- [ ] T040 [US2] `index.ts` and `browser.ts` define and export both elements. `package.json` gets the exports
  `./ocelle-workflow-board.js` and `./ocelle-workflow-lane.js`. Regenerate `custom-elements.json`.
- [ ] T041 [US2] `storybook/stories/workflow-board.stories.ts` (Five lanes; Five lanes, narrow; One lane; No lanes;
  Right to left) and `workflow-lane.stories.ts` (Default with count; Default without count; Flat with count; Flat
  without count; Long title; Untitled with count), on `color-canvas`. Frames come from `frames.css` and the cards use
  sentence-length text.
- [ ] T042 [US2] Produce the baselines with `visual:update` and confirm them in CI, as in T028. Run `gate:axe`.
- [ ] T043 [US2] README sections of T036, and the changelog entries for the two elements and their entry points.
- [ ] T044 [US2] Run each pairing plant of T032 once and record them in
  `specs/009-workflow-layouts/reviews/phase-3/plants.md`. Then run the gates as in T030.

**Checkpoint**: `tdd-check.sh 3` reports `pass`; the review approves.

---

## Phase 4: User Story 3 - A list beside its detail that collapses to one column by the space it has (Priority: P3)

**Goal**: US3 scenarios 1 to 16; FR-022 to FR-035 for list-detail, including the public `remeasure()`. The
container-tier convention in the README.

**Independent Test**: a list-detail with all three slots shows:

- three columns in Frame R;
- two columns in Frame W, with the inspector stacked;
- one column in Frame N and with `narrow`, where `detail-open` chooses the pane and focus follows the shown pane.

Also, `collapse-below="56rem"` gives one column in Frame W, and in a 1196 px flex row the element is 1073 px wide
with three columns.

### Spike (first)

- [ ] T045 [US3] Spike in scratch files only, recorded in `specs/009-workflow-layouts/reviews/phase-4/spike.md`. The
  measurement pass, run in one animation-frame callback, and the sizer, written to the per-instance constructed sheet,
  give US3-12's figures:
  - 1073 px and three columns in a 1196 px flex row;
  - 636 px and one column in a 636 px row;
  - three columns in a `<dialog>` in a 1280 px viewport;
  - one column in a table cell of a 636 px table;
  - the stale content case: 1196 px, three columns;
  - the two content-change cases: a 35rem detail, taller and same height, 1153 px in the first frame record after
    the change;
  - the two unseen cases (shadow-rendered content; a class swap): 1073 px until `remeasure()`, then 1196 px;
  - a slotted element that appends content from its own `ResizeObserver`, one column with the detail shown: 1153 px
    after settle.

  In every case `driver.messages()` is empty, the tier is stable over ten frames, and the frame record never shows the
  measurement grid (R-13). If any figure fails: stop and ask the operator (the fork in R-13).

### Tests (red, one commit)

- [ ] T046 [P] [US3] `packages/elements/test/tiers.test.ts` (in-process, pure): the grammar of R-12 after trimming.
  - Accepted: `0`, `0px`, `0rem`, `56rem`, `55.5rem`, `880px`, `55em`, `56REM`, `" 56rem "`.
  - Rejected: `+56rem`, `.5rem`, `56.rem`, `5.6e1rem`, `-0`, `-1rem`, `120%`, `80vw`, `110cqi`, `700pt`, `900`,
    `calc(56rem)`, `var(--x)`, `wide`, `" "`, `""`.
  - Resolution: `rem` against the root's font size, `em` against the host's.
  - The exclusive comparison.
  - The token default parsed with the same grammar, and its fallback to the published values. The constants (40rem,
    60rem) are compared with `packages/tokens/src/source.ts`.
  - The tier choice of data-model § list-detail for every `narrow`, `hasInspector` and size combination.
- [ ] T047 [US3] `packages/elements/test/scenarios/list-detail.ts`: US3 scenarios 1 to 16 as shared bodies, each frame
  at its viewport. Pairs and plants:
  - **US3-1, US3-2, US3-3:** the tracks, the 1 px `color-rule` borders, and the inspector width including its border
    (1073 px, PLAN-CORRECTNESS-1-003 (a)).
  - **US3-1 and US3-2 in forced colours** (FR-023, spec Assumptions "Forced colours and axe"; analysis C1): under
    emulated forced colours, each border between adjacent panes is 1 px in `CanvasText`, side by side in Frame R and
    stacked between the detail and the inspector in Frame W. Plant: the border rule placed inside
    `@media not (forced-colors: active)`.
  - **US3-4:** `detail-open` in two columns hides nothing. Plant: `detail-open` applied in every tier.
  - **US3-5:** `narrow`.
  - **US3-6:** keyboard focus in the list, then the host sets `detail-open` from a task: focus moves to the detail
    pane, which shows the ring. After a click, the ring is absent. Removing `detail-open` moves focus back. With focus
    outside, or in the pane that stays, focus is not moved. At rest no wrapper has a `tabindex`, and the tree shows no
    focusable wrapper. A click on pane text does not focus a wrapper. The ring is drawn inset inside an
    `overflow: hidden` container in Frame N, with `Highlight` in forced colours. After the switch, `press("Tab")`
    lands on the detail's first focusable element, and the detail wrapper then has no `tabindex` (analysis C4).
    Plants: focus moved on every switch; wrappers focusable at all times; the default outset ring (R-14,
    PLAN-A11Y-SECURITY-1-003 and 1-005).
  - **US3-7:** narrowing with focus in the detail.
  - **US3-8:** no inspector, then an inspector added after the first render, then removed again. Plants: the
    inspector always rendered; the slot rendered only when an inspector is present (R-11).
  - **US3-9:** at 320 px, no page scroll. Plant: the page scrolls.
  - **US3-10:** every value of the spec, plus `56REM`, `+56rem`, `.5rem` and `5.6e1rem`, for both attributes and the
    token overrides. It asserts the 1280 px viewport for the `vw` case. Plant: any resolvable length accepted.
  - **US3-11:** long content in the detail.
  - **US3-12:** the spike's figures. Plants:
    - an intrinsic size that follows the tier;
    - the pass split across a `requestAnimationFrame`, caught by the frame record;
    - the shown-pane `ResizeObserver` as the trigger, caught by the same-height case and `driver.messages()`;
    - `remeasure()` as a no-op;
    - `attributes` observed;
    - the pass run in the `MutationObserver` callback.
  - **US3-13:** right to left.
  - **US3-14:** the tree adds no role or landmark.
  - **US3-15:** a hidden list-detail. Plant: `:host([hidden])` removed.
  - **US3-16:** fixture checks.
  - **20 px root case:** one column in a 720 px frame, two at 16 px.
  - **Style and sheets:** no shadow element carries a `style` attribute, and `sheets()` shows one per-instance sheet
    per root over two instances.
  - **Edge case "list-detail with an empty list slot"** (analysis C3): with nothing in the `list` slot, in Frame R,
    the list pane is still 288 px wide and the detail takes the rest; with an empty default slot the detail column
    still shows, empty, at its width.
- [ ] T048 [P] [US3] `packages/elements/test/list-detail-pass.test.ts` (in-process only): the once-per-frame pass.
  - Three `setTimeout(0)` tasks each make a light-DOM change in a pane, before one animation frame, and the test-only
    counter of `src/list-detail-measure.ts` reads exactly one pass.
  - The test first confirms, from the frame record (the `requestAnimationFrame` timestamp seen by each task), that
    all three tasks ran before that same frame. If they did not, the case retries until they do, and never counts
    across two frames (round 3 verify note).
  - Plant: one pass per `MutationObserver` delivery (FR-025, R-13).
- [ ] T049 [P] [US3] `packages/elements/test/list-detail-upgrade.test.ts` (in-process, mutated): the upgrade rule of
  R-14. Focus inside the list of an un-upgraded one-column element with `detail-open` moves to the detail at upgrade.
  Focus in the pane that stays shown is not moved. Also add the server-rendered fixture page for the same two cases in
  `packages/elements/test/browser/list-detail.test.ts`.
- [ ] T050 [US3] `packages/elements/test/list-detail.test.ts` (in-process over T047) and
  `packages/elements/test/browser/list-detail.test.ts` (fixture over T047). It follows T047, whose bodies it runs, and
  T049, which writes the same browser file.
- [ ] T051 [P] [US3] `packages/elements/test/entry-list-detail.test.ts`. Extend `entry-root.test.ts` and
  `exports.test.ts`. In `node/manifest.test.ts`, the list-detail entry has:
  - `collapse-below`/`collapseBelow` and `inspector-below`/`inspectorBelow` (`string | undefined`, not reflected);
  - `narrow` and `detail-open`/`detailOpen` (boolean, reflected);
  - the method `remeasure(): void`, described;
  - the `list`, default and `inspector` slots;
  - no events, parts or CSS custom properties.
- [ ] T052 [P] [US3] `packages/elements/test/node/readme.test.ts`, one assertion per item of FR-034:
  - § `ocelle-list-detail`: its attributes, slots, `remeasure()`, the tokens read, the focus rule, and that the host
    names its own landmarks or headings;
  - § Element conventions, the container-tier convention:
    - the own measured inline size, never the viewport;
    - the `*-below` grammar exactly as R-12, and `rem` and `em` resolution;
    - the token default and its fallback;
    - exclusive bounds;
    - the forcing boolean;
    - no `container-type`;
    - tier-independent intrinsic sizes;
    - the re-measure triggers;
    - that the unseen changes (images, fonts, shadow-rendered content, attribute-only changes) wait for the next
      trigger or for `remeasure()`;
    - the cost of one pass, in contracts/elements.md's wording: about 10 ms (7 to 19 ms) with a 1000-row list;
    - that content mutated inside a consumer's own `ResizeObserver` callback can still bring the browser's loop message
      through layout alone;
    - and that hosts set `narrow`, `detail-open` and the `*-below` thresholds from a task, not from a `ResizeObserver`
      callback (R-13; round 3 verify note).
- [ ] T053 [P] [US3] `storybook/test/integration/elements-stories.test.ts`: the six list-detail stories.

### Implementation (green)

- [ ] T054 [US3] `packages/elements/src/tiers.ts`: the grammar, resolution, token default and tier choice of R-12 and
  data-model § list-detail.
- [ ] T055 [US3] `packages/elements/src/list-detail-measure.ts` (internal, not exported, not in the manifest): the
  measurement pass, the sizer figures written to the instance's constructed sheet, and the test-only pass counter.
  It is scheduled at most once per animation frame from the `MutationObserver` (`childList`, `characterData`,
  `subtree`, without `attributes`), `slotchange` and `remeasure()`. It runs synchronously before a tier change set
  through a property or attribute, and never from the host `ResizeObserver` (R-13).
- [ ] T056 [US3] `packages/elements/src/ocelle-list-detail.ts`:
  - properties `collapseBelow`, `inspectorBelow`, `narrow` and `detailOpen` (the last two reflected), and the public
    `remeasure()`;
  - the host `ResizeObserver` measures and chooses the tier only;
  - the shadow grid with `data-tier` and the three panes, with the `inspector` slot always rendered and
    `hasInspector` taken from `slotchange`;
  - borders with `--ocelle-border-width` and `--ocelle-color-rule`, the border rule outside
    `@media not (forced-colors: active)` so the borders stay in `CanvasText` under forced colours (FR-023);
  - the focus rule with a temporary `tabindex="-1"` on the shown pane's wrapper, removed on `focusout`;
  - the inset ring on `:focus-visible`, `Highlight` in forced colours;
  - the upgrade rule;
  - `:host([hidden])`;
  - `define`.
- [ ] T057 [US3] `index.ts` and `browser.ts` define and export the element. `package.json` gets the export
  `./ocelle-list-detail.js`. Regenerate `custom-elements.json`.
- [ ] T058 [US3] `storybook/stories/list-detail.stories.ts`: Three columns; Two columns, inspector stacked; One column,
  list; One column, detail; No inspector; Right to left. Frames come from `frames.css`.
- [ ] T059 [US3] Produce the baselines with `visual:update` and confirm them in CI, as in T028. Run `gate:axe`.
- [ ] T060 [US3] README sections of T052, and changelog entries for `ocelle-list-detail`, its entry point,
  `remeasure()` and the container-tier convention. The `@ocelle/tokens` changelog names the six tokens (FR-035).
- [ ] T061 [US3] Run each pairing plant of T047 to T049 once and record them in
  `specs/009-workflow-layouts/reviews/phase-4/plants.md`. Then run the gates as in T030.

**Checkpoint**: `tdd-check.sh 4` reports `pass`; the review approves.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: the cross-cutting documentation checks, the quickstart run and the final integration with `main`.

**Independent Test**: `readme.test.ts` holds every FR-034 item; quickstart's commands all pass; `tdd-check.sh 5`
reports `pass`.

### Tests (red, one commit)

- [ ] T062 [P] `packages/elements/test/node/readme.test.ts`:
  - the frames of User Scenarios (W, R, N and S, with their widths) as the tested screen sizes;
  - "WebKit is not measured", naming the scroller's tab stop, the arrow keys, the focus handover and list-detail's
    focus moves;
  - the print note (Edge Cases);
  - loading, error and disabled states do not apply to these layout elements (R-15).
- [ ] T063 [P] `packages/elements/test/node/changelog.test.ts` (or the existing changelog assertions): the elements
  changelog names the four elements, their entry points, `remeasure()`, the overflow-region convention and the
  container-tier convention. The tokens changelog names the six tokens (FR-035).

### Implementation (green)

- [ ] T064 README and changelog statements of T062 and T063 where earlier phases did not already write them.
- [ ] T065 Run every command of `specs/009-workflow-layouts/quickstart.md` once, one heavy job at a time, and record
  the outputs in `specs/009-workflow-layouts/reviews/phase-5/quickstart.md`.
- [ ] T066 If #8 (011), #9 (010) or #16 (008) has landed on `main`, merge `main` (never rebase). Resolve
  `packages/elements/src/index.ts`, `src/browser.ts`, `custom-elements.json` (regenerate), the READMEs, the changelogs
  and the Storybook configuration. Reconcile `--ocelle-tracking-caps` and the container-tier convention with #8 as R-16
  says. Re-run the gates, and record the result in `specs/009-workflow-layouts/reviews/phase-5/merge.md`.

**Checkpoint**: `tdd-check.sh 5` reports `pass`; the review approves.

---

## Dependencies & Execution Order

- **Phase 1 → everything.** T001 (#10 merged and rechecked) blocks all other tasks. The tokens (T006) and the frames
  (T008) are used by every story.
- **Phase 2 (US1) → Phase 3 (US2).**
  - The board uses `OverflowRegion` (T023), and the `token-only` gradient change (T022) comes before any element's
    mask styles.
  - The driver methods (T021) are used by every later scenario.
- **Phase 4 (US3)** depends on Phase 1 and on the driver (T021), not on the module or the board. It may follow Phase
  2 directly, but `/ocelle-run` runs phases in order.
- **Phase 5** comes after all stories.
- **Within a phase:** spike (phase 4) → tests (one red commit) → implementation → stories → baselines → records →
  plants and gates.

## Parallel Opportunities

- Phase 1: T003, T004 and T005 (different packages).
- Phase 2: T010, T011, T012 and T015 to T020 are separate files. T013 is the shared body that T014 runs, so T014
  follows T013.
- Phase 3: T031 and T034 to T037. T033 follows T032, whose bodies it runs.
- Phase 4: T046, T048, T049 and T051 to T053. T050 follows T047 (its bodies) and T049 (the same browser file).
- Never in parallel: browser suites, mutation, plants and `visual:update` (one heavy job at a time).

## Implementation Strategy

- **MVP**: Phase 1, then Phase 2, `ocelle-scroller` with the overflow-region module. It is usable on its own, and it is
  the base #13 needs.
- Then Phase 3, the board and lanes, which closes spec-kitty-design #506 and #507 and the lane counts.
- Then Phase 4, list-detail, which closes #530 and #505's pane.
- Then Phase 5.
- Each phase is reviewed and folded before the next starts.
