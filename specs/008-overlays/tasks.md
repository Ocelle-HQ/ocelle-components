# Tasks: Overlays — Dialog, Drawer and Tooltip

**Input**: the design documents in `specs/008-overlays/`, approved at the plan gate on 2026-11-13 (human:MOES-Media)
after three plan-squad rounds (`reviews/plan/round-1..3/`):
- spec.md: FR-001 to FR-048, SC-001 to SC-008, US1 scenarios 1 to 16, US2 1 to 7, US3 1 to 15;
- plan.md: decisions 1 to 20 and the phase list;
- research.md: R-01 to R-18, with R-05a;
- data-model.md;
- contracts/elements-overlays.md and contracts/checks.md (the gate table and the **test matrix**, cited below as
  "matrix § …");
- quickstart.md.

**Hold**: implementation waits until #10 (Storybook workbench) is merged (operator, 2026-11-12). R-16's recheck
against merged `main` (T026) runs once, in Phase 2 before its red commit, because each phase's story tests are part of
that phase's red commit (operator decision on analysis I3, 2026-11-13).

**Tests**: required. Constitution VIII applies to every phase. The phase flow is:
1. `base.sh`;
2. one red commit holding only test files, the phase's story tests included, proven by `red.sh <phase> phase` (the
   failure must be the missing behaviour, not a syntax, import or setup error); there is no second red commit for
   the stories, so `red-commits` keeps one `phase` record per phase;
3. green (the elements, then the stories and their baselines);
4. `tdd-check.sh`;
5. an independent review.

Expected values are written by hand from the spec, research and the matrix, never read from the source under test:
token values come from `packages/tokens/src/source.ts` through the computed style, and focus lists are written out.

Rules for every scenario:
- **Shared bodies.** Every browser scenario is written once in `packages/elements/test/scenarios/*.ts` against the
  driver, and run by the in-process `elements` project (source, mutated) and by `elements-browser` (built browser
  build, strict-CSP fixture).
- **Fixture assertions.** Fixture runs also assert zero CSP violations, only allowed requests and no console message.
- **FR-047 counts.** After every scenario, the FR-047 counts are asserted as a delta from mount: 0 `style` attributes
  and 0 added `<style>` elements, transient writes included.
- **Bounded waits.** Every wait is a bounded poll (at most 1 000 ms) that fails with a message, never an unbounded
  wait (R-15).
- **"Does not" outcomes.** A "does not" assertion shares its test with the positive outcome it guards.
- **Full test names** (from Phase 3 on; settled in Phase 2). Each runner names each test by its row's full name
  (`for … it(name, …)`), never by a `$name` interpolation, which Vitest shortens to 40 characters, so rows of a shared
  prefix would share one test id for Stryker's coverage and filter and one name in reports
  (`reviews/phase-2/notes.md` § Mutation). The dialog's fixture runner still uses `$name` (review phase 2 R1-02,
  optional).

**Environment**:
- Node 22 in this container, 26.13.0 in CI. Browser runs set `OCELLE_CHROMIUM_PATH` as
  `knowledge/speckit-flows/findings/frontend-missions.md` § Browser path describes.
- One heavy job (browser suites, mutation, plants) at a time. Never `git stash`.
- **Run time** (reported 2026-11-15): a full `pnpm test` now takes more than 30 minutes (Phase 3 measured 11 m 16 s
  at `1868fb5`), and a `gate:mutation` run on elements source about 16 minutes, its dry run alone about 5.5. Plan
  each full run as a background job with its log kept in the phase directory, and run the single projects
  (`--project …`) while iterating.
- **Shared files** with the parallel missions 009 to 011 (`packages/elements/src/index.ts`, `test/exports.test.ts`,
  `package.json` `exports`, `custom-elements.json`, the README and CHANGELOGs, `storybook/.storybook/*`,
  `packages/tokens/src/source.ts`, `test/expected.ts`): conflicts are resolved by merging `main`, never by rebasing.
  The manifest is regenerated, not hand-merged (R-17). Do not merge `main` during a run; `/ocelle-land` does that.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an open task).
- **[Story]**: US1 dialog, US2 drawer, US3 tooltip.

---

## Phase 1: Setup — test harness additions (R-14)

**Goal**: the driver, browser commands and test projects every scenario of US1 to US3 needs, each proven by a
self-test.

**Independent Test**: the harness self-tests of matrix § Harness self-tests pass in both harnesses, and failed against
the driver as it was.

### Tests (red, one commit)

- [X] T001 [P] Write the self-test bodies in `packages/elements/test/scenarios/harness.ts`, one per row of matrix § Harness self-tests, with stand-in elements defined in the test file:
  - `styleAttributes()`: nested shadow root, CSSOM write, a write then removed;
  - `styleElements()`: a `<style>` added in a shadow root;
  - `topLayer()`: order with a modal dialog and a manual popover;
  - `focusPath()`: into an open shadow root and into an iframe;
  - `focusVisible()`: after Tab and after a click;
  - `record(id, names)`: the state at dispatch (`open`, `:modal`, `focusPath`);
  - `animations()`: duration, easing and keyframes of a WAAPI animation;
  - `pointer(path)`: stopping at a point;
  - `touchTap()`: pointer type `touch`, touch context only;
  - `viewport()`: 1280 × 800;
  - `reducedMotion(on)`: set, then reset;
  - `axTree`: `description`, `modal` and `level`;
  - device: the default context matches `(hover: hover)` and `(pointer: fine)` with `maxTouchPoints` 0; the touch
    context has `maxTouchPoints` above 0.
- [X] T002 [P] Write the runners for T001: `packages/elements/test/harness.test.ts` (in process), `packages/elements/test/browser/harness.test.ts` (fixture), `packages/elements/test/harness.touch.test.ts` (in process, touch device) and `packages/elements/test/browser/harness.touch.test.ts` (fixture, `visit(…, { touch: true })`).
- [X] T003 [P] Add tests for the new browser commands (`emulateReducedMotion`, `pointerPath`, `touchTap`, the extended `axTree`) to `packages/elements/test/commands.test.ts`.
- [X] T004 Make the red commit of T001 to T003 (test files only). `red.sh 1` must show each self-test failing because the driver method or command is missing.

### Implementation (green)

- [X] T005 Add the methods of T001 to the `Driver` interface in `packages/elements/test/scenarios/driver.ts`. FR-047's counts are taken as a delta from mount, with transient writes counted through a `MutationObserver` on every shadow root. No new method uses `driver.style()` (R-14).
- [X] T006 [P] Implement the additions in process in `packages/elements/test/in-process.ts`, using real CDP input via `userEvent` from `vitest/browser` and the new commands.
- [X] T007 [P] Implement the additions on the fixture in `packages/elements/test/browser/driver.ts`, using `page.keyboard`, `page.mouse`, `page.touchscreen` and CDP.
- [X] T008 [P] Add the browser commands `emulateReducedMotion`, `pointerPath` and `touchTap` to `packages/elements/test/commands.ts`, and make `axTree` also return `description`, `modal` and `level`. The reset helper resets reduced motion together with forced colours.
- [X] T009 Update `vitest.config.ts`:
  - the `elements` project gets a 1280 × 800 viewport and no touch;
  - a new `elements-touch` project includes only `packages/elements/test/*.touch.test.ts`, with the same excludes as `elements` (`test/node/**`, `test/build/**`, `test/browser/**`), browser mode with `hasTouch`;
  - the new commands are registered.

  Add `elements-touch` to `vitest.mutation.elements.config.ts`.
- [X] T010 [P] Add a `visit(page, { touch: true })` option to `packages/elements/test/browser/serve.ts` that opens a separate context with `hasTouch`. The default context is unchanged (1280 × 800, no touch).
- [X] T011 [P] Add the fixture pages `packages/elements/test/browser/fixtures/overlays.html` and `tooltip.html` (linking `tokens.css` and `ocelle-elements.js`, no inline script or style), and the test delay stylesheet `packages/elements/test/fixtures/tooltip-delay.css` (`--ocelle-tooltip-delay: 300ms`), linked on the fixture and adopted in process (R-15).
- [X] T012 Run the `elements`, `elements-touch` and `elements-browser` projects and `pnpm run gate:test-lint`: all self-tests pass. Record the red and green runs in `specs/008-overlays/reviews/phase-1/notes.md`.

**Checkpoint**: `tdd-check.sh 1` reports `pass`.

---

## Phase 2: User Story 1 - A modal dialog (Priority: P1) 🎯 MVP

**Goal**:
- US1 scenarios 1 to 16;
- FR-001 to FR-024 and FR-042 to FR-047 for the dialog;
- `overlay.ts`, `focusable.ts` and `ocelle-dialog.ts`, with the entry point, manifest, README section and CHANGELOG.

**Independent Test**: matrix § Dialog passes in both harnesses, and the dialog stories pass the visual and axe gates
(after #10).

### Measurement (first)

- [X] T013 [US1] Measure R-01: does the manifest analyzer list members inherited from a base class in `src/overlay.ts`, which is outside `src/ocelle-*.ts`, on the subclass, with their descriptions?
  - Use a scratch subclass outside the repository; do not commit scratch code.
  - Record the outcome in `specs/008-overlays/reviews/phase-2/measure.md`.
  - If inherited members are missing, the fallback is to widen `packages/elements/scripts/manifest.ts`'s module filter and replace the pinned rule in `test/node/manifest.test.ts:205`, red first, inside this phase.
  - Outcome (measured, `reviews/phase-2/measure.md`): inherited members are missing. Operator decision "analyse, then drop it" (decided by the operator, 2026-11-14, R-01): the fallback is taken, and the generator also removes the `src/overlay.ts` module from the published manifest. The red test is in T018, the generator change in T024.
- [X] T014 [US1] In Chromium, measure the exact `focusPath()` lists for the matrix rows that research left to measurement. Write them into `specs/008-overlays/contracts/checks.md` before any code, in a commit of that file and `reviews/phase-2/measure.md` only. The rows:
  - § Dialog "Opaque content", cases (i) and (ii), both directions, with and without `delegatesFocus`;
  - "Positive `tabindex` at the ends", case (iii);
  - whether the engine signals focus leaving a slotted iframe or closed root for the body (R-04's repair; Risks "Opaque slotted content").

  Each list must meet the rules the row states. If one cannot, stop and ask the operator.
  - Operator decision (decided by the operator, 2026-11-14, R-04): the (ii) backward lists are taken with the sentinel wrap (option (b) of `measure.md`): closed host with and without `delegatesFocus` `xc[c2] xc[c1] b1 close xc[c2] xc[c1] b1`, iframe `fr[f2] fr[f1] b1 close fr[f2] fr[f1] b1`; the (i), (ii) forward and (iii) lists are the hybrid stand-in's lists of `measure.md`. Write them into the row against its updated rules (every inner button reached backward in (ii), no sentinel in any list).

### Story recheck (after #10 is merged; before the red commit)

- [X] T026 [US1] R-16 recheck against merged `main`, before any story test is written (so before T020's red commit, which holds T027). Compare #10's merged state with research R-16 and update R-16 and tasks T027 to T029, T038 to T040 and T050 to T052 in one commit of `research.md` and `tasks.md` only (done against merge `588d5a7`; operator decisions A to D of 2026-11-13 widened the commit to R-17, T049, T051, data-model § Stories and plan decision 7):
  - the pointer-state parameter shape;
  - the capture context (viewport, reduced motion, animations);
  - the top-layer capture;
  - per-story viewport support (for the 320 × 256 story);
  - the baseline path and the produce command;
  - the axe rule set and `storybook/a11y-exceptions.json`;
  - the story-index test;
  - `storybook/README.md`.

### Tests (red, one commit)

- [X] T015 [P] [US1] Write the shared bodies for matrix § Dialog in `packages/elements/test/scenarios/dialog.ts`, every row:
  - open and initial focus;
  - the Tab cycle with its non-stop, body, scroller, opaque-content, end-sentinel, native-middle and positive-`tabindex` rows (exact lists, n + 2 presses, both directions);
  - Escape in a slotted iframe;
  - long body and the 320 × 256 viewport;
  - one-line body (132 px);
  - Escape × veto, including after a click on body prose and with focus on the body;
  - Escape with slotted content, slotted close watchers and slotted non-modal dialogs (every case of the row); the veto-then-Escape-twice case first runs, in the same page, one unasserted warm-up sequence on a stand-in native `<dialog>` (`showModal()` after a click, a focused button that stops Escape's propagation, `cancel` vetoed, Escape twice), then asserts one `…-close-request` with reason `escape` with the dialog open and `:modal`, and on the second Escape `…-close` with reason `host` and focus on the opener (operator decision, 2026-11-14, R-02);
  - synthetic `cancel`;
  - the close control (click, Enter, Space; target size; focus ring);
  - backdrop click (nothing);
  - host close;
  - platform close and the `method="dialog"` form (nothing);
  - focus return and conditional focus return (a), (b), (c);
  - nested: an inner `ocelle-dialog` slotted inside an open outer `ocelle-dialog`, so the row runs in both harnesses (a stand-in host cannot join the internal overlay stack on the strict-CSP fixture, since the base class is not exported from the browser build); the drawer-under-dialog case is added in T031;
  - open at first render: `open` in the mounted markup, and `open` set before the element is defined (focus returns to the page button that had it);
  - removed and moved while open;
  - rapid toggle;
  - input during the exit;
  - stale native `close` event;
  - motion read from `animations()`;
  - computed styles and sizes: the panel's computed `inline-size` equals the computed `--ocelle-dialog-inline-size` at 1280 × 800 and the computed `dialog-max-inline` (288 px) at the capped 320 × 800;
  - forced colours, both palettes;
  - accessibility tree, including the host `aria-label` open and closed and no node for the end sentinel.

  Event rows read the state at dispatch from `record()`, and every row ends with the FR-047 counts.
- [X] T016 [P] [US1] Write the runners `packages/elements/test/dialog.test.ts` (in process) and `packages/elements/test/browser/dialog.test.ts` (fixture `overlays.html`) over T015. For the before-definition case of the open-at-first-render row: `packages/elements/test/dialog-upgrade.test.ts` (in process, imports `src/ocelle-dialog.ts` only after the mount) and the fixture page `packages/elements/test/browser/fixtures/overlays-upgrade.html` (like `overlays.html` but loading no element script; the test adds `ocelle-elements.js` by URL as a module script), run from `test/browser/dialog.test.ts`.
- [X] T017 [P] [US1] Write `packages/elements/test/entry-dialog.test.ts`: `@ocelle/elements/ocelle-dialog.js` defines `ocelle-dialog` and `ocelle-icon` and no other tag. Add `OcelleDialog` to the sorted keys in `packages/elements/test/exports.test.ts`.
- [X] T018 [P] [US1] In `packages/elements/test/node/manifest.test.ts`, the `ocelle-dialog` entry must list:
  - properties and attributes `open` (reflected, default `false`), `label`, `closeLabel`/`close-label` (default "Close");
  - events `ocelle-dialog-close-request` (detail `{ reason: "escape" | "close-button" }`) and `ocelle-dialog-close` (detail `{ reason: "escape" | "close-button" | "host" }`);
  - slots default and `footer`;
  - parts `panel`, `heading`, `body`, `footer`, `close-button`;
  - CSS property `--ocelle-dialog-inline-size`;
  - every member with a description (SC-003, R-01);
  - `open`, `label` and `closeLabel` (and their attributes) with `inheritedFrom: { name: "OcelleOverlay", module: "src/overlay.ts" }`, and the published manifest (the committed `custom-elements.json` and `generate(root)`'s output) has no `src/overlay.ts` module and no declaration named `OcelleOverlay` (operator decision, 2026-11-14, R-01).

  Replace the pinned test "reads every src/ocelle-*.ts, its modules in path order, and nothing else of src/" (`test/node/manifest.test.ts:205`) with "reads every src/ocelle-*.ts and src/overlay.ts, and nothing else": on a scratch root with `src/ocelle-zeta.ts`, `src/ocelle-alpha.ts` (a subclass of a base in `src/overlay.ts`), `src/ocelle-beta.ts` (a subclass of a base in `src/helper.ts`), `src/overlay.ts`, `src/helper.ts` and `src/ocelle-alpha.test.js`, the published modules are exactly `src/ocelle-alpha.ts`, `src/ocelle-beta.ts`, `src/ocelle-zeta.ts` in path order (no `src/overlay.ts`, no `src/helper.ts`, no test file); `ocelle-alpha` lists the base's members with `inheritedFrom` naming `src/overlay.ts`; `ocelle-beta` lists none of its base's members (R-01, constitution VIII: the reason is recorded in the test's comment).
- [X] T019 [P] [US1] Add `ocelle-dialog.js` to the dist file lists in `packages/elements/test/build/build.test.ts` and `test/build/pack.test.ts`. Add the `ocelle-dialog` README fragments to `packages/elements/test/node/readme.test.ts`:
  - the intro line naming the element;
  - the section with the tokens read (data-model § `ocelle-dialog`);
  - the host pattern;
  - the R-02, R-03, R-04, R-05 and R-08 statements: the stated limits (the repeated-Escape one keeps "can close" and adds that the first vetoed sequence in a page may hold the veto on a second press as well, contract § Platform behaviour), focus moves in the `…-close` listener, the `method="dialog"` advice, a label being required, and the closed-host `aria-label` behaviour;
  - where focus lands when the opener is gone (edge case "Opener gone", R-05): the opener while it is connected, not `disabled` and not inert; otherwise the initial focus target of the overlay beneath, if one is open; otherwise the document body;
  - the opaque-content Tab statement (R-04, contract § Platform behaviour): Tab and Shift+Tab reach the inner focusable parts of content with a closed shadow root, an iframe or media controls in both directions, Shift+Tab from the close control entering such content at the dialog's end from its end, with or without `delegatesFocus`; and leaving a slotted iframe past the cycle's end with Tab can cost one extra press. The test also asserts the README states no reverse-wrap limit (no sentence that a closed shadow root is skipped by the Shift+Tab wrap).
- [X] T027 [P] [US1] Red, in `storybook/test/integration/elements-stories.test.ts` (`open(id, theme, "ocelle-dialog")`): the dialog stories of data-model § Stories exist in light and dark, each renders an open, modal `ocelle-dialog` with base.css applied and no request outside the origin (the Storybook is not a CSP target, R-16). The red commit also holds the story-count updates of R-16 (operator decision D), written by hand from the story files: `gates/test/integration/storybook-build.test.ts` (`built 29 stories`), `gates/test/integration/axe.test.ts` and `gates/test/integration/visual.test.ts` (58 story-themes), counted again after any merge of `main` (R-17). Part of T020's red commit; T026 first.
- [X] T020 [US1] Make the red commit of T015 to T019 and T027 (test files only). `red.sh 2 phase` must show each failing because `ocelle-dialog` is undefined, its entry, manifest or README section is missing, the generator does not yet read `src/overlay.ts` or still publishes it, or the dialog stories are missing.

### Implementation (green)

- [X] T021 [US1] `packages/elements/src/focusable.ts`: two orders over the overlay's flat tree, following open shadow roots and slots (R-04):
  - flat-tree order;
  - the engine's sequential navigation order, with positive `tabindex` first within each scope.

  Stops:
  - a stop is focusable, rendered (not `display: none` or `visibility: hidden`), and not `disabled`, `inert` or `hidden`;
  - a radio group is one stop (its checked radio, else the first);
  - iframes and media elements with `controls` are stops;
  - overflowing scroll containers with nothing focusable inside are stops where the engine focuses them;
  - custom elements whose `shadowRoot` reads null are tried as stops when the overlay moves focus.
- [X] T022 [US1] `packages/elements/src/overlay.ts`, the internal base `OcelleOverlay` (no tag), per R-01 to R-08 and R-18:
  - **Rendering and properties**:
    - the shadow root renders `<dialog part="panel">` with a header holding `<h2 part="heading" id="heading">`, the close `<button part="close-button">` with `ocelle-icon name="close"` and the `close-label`, the body `<div part="body">` with the default slot, and `<footer part="footer">` with the `footer` slot, not rendered while the slot is empty, then the end sentinel as the panel's last child (`tabindex="-1"`, `aria-hidden="true"`, empty, no name, no role, no part, zero block size; R-04);
    - properties `open` (reflected), `label` and `closeLabel` (`close-label`, default "Close"); `aria-label` is observed, and the name follows `naming.ts`'s `accessibleName` (R-08).
  - **Open and close**:
    - `showModal()` on `open`, with explicit initial focus (R-04);
    - the module-level overlay stack; only the topmost acts;
    - focus return to the deepest opener, only while focus is still the overlay's (R-05);
    - disconnection closes silently and sets `open` to false (R-05a).
  - **Keyboard**:
    - the keydown Escape path on the `<dialog>`, plus the topmost overlay's `document` listener for Escape and Tab with focus on the body;
    - the exceptions: Escape already handled by slotted content, `isComposing`, a search field with a value, slotted close watchers by the below record taken at `showModal()`;
    - the cancelable-`cancel` fallback; a non-cancelable `cancel` closes with reason `host` (R-02);
    - the hybrid Tab handling: explicit moves only at the ends, from a non-stop and from the body; native middle moves; a move that lands on the body is repaired to the first stop; no Tab handling while a slotted popover or nested modal dialog is open (R-04);
    - the sentinel wrap: when the cycle's last candidate is an opaque container, Shift+Tab from the first stop focuses the end sentinel and calls no `preventDefault()`, so the native move enters the content from its end (operator decision, 2026-11-14, R-04).
  - **Events**:
    - `…-close-request` is cancelable, `…-close` is not; both bubble and are composed;
    - close order: `open` false, then the exit animation, then `<dialog>.close()`, then focus returned, then `…-close` (R-06);
    - user input while closing requests nothing;
    - own-`close()` counting against stale native `close` events (R-03).
  - **Motion**: through WAAPI, with duration and easing read from the computed tokens; skipped under `prefers-reduced-motion: reduce` by `matchMedia` as well as the token (R-06).
  - **Body**: the overflowing body becomes a Tab stop (`tabindex="0"` only while it overflows) and keeps the minimum block size `calc(3 * var(--ocelle-target-min))` with `box-sizing: border-box` (R-18).
  - **Styles**: shared static styles from tokens only:
    - the UA reset;
    - `::backdrop` with `color-overlay`;
    - forced colours: a `CanvasText` border, `Canvas` ground and an outline focus ring, with variant rules inside `@media not (forced-colors: active)`;
    - `:host([hidden]) { display: none; }`.
- [X] T023 [US1] `packages/elements/src/ocelle-dialog.ts`, class `OcelleDialog extends OcelleOverlay`:
  - the event prefix `ocelle-dialog`, and no backdrop handler;
  - centred, with `inline-size: var(--ocelle-dialog-inline-size)` (default `var(--ocelle-measure-reading)`), `max-inline-size: var(--ocelle-dialog-max-inline)`, `max-block-size: var(--ocelle-dialog-max-block)`, radius `radius-2` and shadow `elevation-raised`;
  - JSDoc tags `@tagname`, `@fires {…} ocelle-dialog-close-request - …`, `@fires {…} ocelle-dialog-close - …`, `@slot`, `@csspart` and `@cssprop`, each with a description (R-01);
  - `define("ocelle-dialog", OcelleDialog)`, and the `HTMLElementTagNameMap` entry.
- [X] T024 [US1] Packaging and docs:
  - export `OcelleDialog` from `packages/elements/src/index.ts`;
  - add the `./ocelle-dialog.js` entry point to `packages/elements/package.json` `exports`;
  - regenerate `packages/elements/custom-elements.json` (`pnpm --filter @ocelle/elements run manifest`); first apply T013's fallback as decided (R-01): `packages/elements/scripts/manifest.ts` reads every `src/ocelle-*.ts` and `src/overlay.ts` and nothing else, and removes the `src/overlay.ts` module from its output, so T018 passes;
  - write the README `ocelle-dialog` section and the intro line (T019);
  - add the CHANGELOG "Added" entry for `ocelle-dialog`.
- [X] T025 [US1] Run the T015 to T019 suites green in both harnesses. Then run, one at a time: `gate:typecheck`, `gate:lint`, `gate:style-lint`, `gate:test-lint`, `gate:manifest`, `gate:csp`, `gate:prefix`, and `gate:mutation -- --base <phase base>`. Record every Timeout report line with its cause in `reviews/phase-2/notes.md`, and add an assertion that kills it where possible (R-15).

### Stories (green, after T025)

- [X] T028 [US1] Green: `storybook/stories/dialog.stories.ts` with the stories of data-model § Stories (no 320 × 256 story: #10 has no per-story viewport, R-16). The long-scrolling-body and prose-with-a-table stories are designed so no text is clipped at a scroll edge (a table narrow enough for the panel; R-16, operator decision C). The long-scrolling-body story places an empty `<div data-story="dialog-scroll-edge">` in the slotted body between two paragraphs, across the body's scroll edge in the 1280 × 800 capture, so no paragraph's box crosses that edge (operator decision, 2026-11-14, measured at T029); it is laid out only by a `[data-story="dialog-scroll-edge"]` rule (block size) added to `storybook/.storybook/stories-layout.css` with a comment in the file's style: no text, no role, no name, no `style` attribute, no exception entry (R-16).
- [X] T029 [US1] Produce the baselines in the pinned container (`pnpm run visual:update`), then run `gate:storybook-build` (`built 29 stories`), `gate:visual` and `gate:axe`. The axe expectation is zero serious or critical findings with no entry added to `storybook/a11y-exceptions.json`: the long-scrolling-body story's `color-contrast-incomplete` (`elmPartiallyObscured`, whichever paragraph's box sat across the body's scroll edge inside the 800 px viewport) is removed by T028's `dialog-scroll-edge` block (R-16, operator decision 2026-11-14). If `gate:axe` still reports any `color-contrast-incomplete` node, stop for the operator (R-16, decision C); no exception entry is added without that decision. Commit the baselines. CI's captures win over local ones (006 FR-005): take the files of the `visual` artifact. Then add a `differs` line to `gates/plants/visual/fail-token-changed/plant.json` for each new light story-theme that shows `color-ink`, measured in the pinned container as 006 T046s did (R-16), commit it with the baselines, and run `gate:plants`.

**Checkpoint**: `tdd-check.sh 2` reports `pass`.

---

## Phase 3: User Story 2 - A modal side drawer (Priority: P2)

**Goal**:
- US2 scenarios 1 to 7;
- FR-025 to FR-028, FR-048 and FR-012's drawer half;
- the `drawer-inline` token.

**Independent Test**: matrix § Drawer passes in both harnesses, and the drawer stories pass the visual and axe gates
(after #10).

### Tests (red, one commit)

- [X] T030 [P] [US2] Write `packages/elements/test/scenarios/drawer.ts`:
  - matrix § Drawer's inherited dialog rows, reusing T015's bodies with the `ocelle-drawer` tag and event prefix (not the dialog's one-line body, long body or styles rows, whose dialog geometry contradicts FR-003, FR-025 and FR-026), every row of that list, among them:
    - the end sentinel row (the sentinel is the panel's last child, after the footer; no list holds it, its attributes and zero block size, no node in the tree);
    - synthetic `cancel` (the shared base's `cancel` handling, R-02: reason `host` for a non-cancelable `cancel` then the inner `close()`, one request for a cancelable one);
    - Escape with slotted content, whose veto-then-Escape-twice case runs T015's warm-up on a stand-in native `<dialog>` first, in the same page (operator decision, 2026-11-14, R-02), and is exported apart from the other rows so it runs on a page of its own (T031);
    - open at first render (a) and (b), the (b) case run by `test/drawer-upgrade.test.ts` (T031);
    - the accessibility tree with the host `aria-label` open and closed;
  - the drawer's own long body: panel block size equal to the viewport's (800 px, and 256 px at 320 × 256, not capped at `dialog-max-block`), each `side`, then the dialog's scrolling, Tab and `tabindex` assertions;
  - the drawer's own styles: the UA reset, `max-inline-size` equal to `dialog-max-inline`, no block cap below the viewport, `color-overlay` backdrop, `elevation-raised` shadow, for each of the four `side` × `dir` cases the four physical corner radii written out (FR-003, matrix § Drawer "Styles": `start`/`ltr` and `end`/`rtl` top-left and bottom-left 0, top-right and bottom-right the computed `radius-2`; `end`/`ltr` and `start`/`rtl` the reverse), not centred, definite body inline size, footer box present only when filled;
  - the drawer's own one-line body (fills the column, footer at the panel's end, each `side`);
  - backdrop during the exit;
  - backdrop on each side under `ltr` and `rtl` × veto;
  - panel-padding click, press inside released outside, press outside released inside, and a secondary-button click: nothing;
  - placement `side` × `dir`;
  - size, the panel's computed `inline-size`, each `side`: equal to the computed `--ocelle-drawer-inline` uncapped at 1280 × 800, equal to the computed `dialog-max-inline` (288 px) at the capped 320 × 800, unchanged by `--ocelle-dialog-inline-size` on the host;
  - motion `translate` sign by side and direction;
  - `ground`;
  - `heading-hidden`.
- [X] T031 [P] [US2] Write the runners over T030, each test named by its row's full name (Rules § Full test names):
  - `packages/elements/test/drawer.test.ts` (in process) and `packages/elements/test/browser/drawer.test.ts` (fixture `overlays.html`);
  - `packages/elements/test/drawer-repeated-escape.test.ts` (in process): the veto-then-Escape-twice case with slotted content, warm-up included, alone in its file so it runs on a page of its own, as `test/dialog-repeated-escape.test.ts` does; on the fixture it runs from `test/browser/drawer.test.ts`, which visits a fresh page per test;
  - `packages/elements/test/drawer-upgrade.test.ts` (in process) for the inherited open-at-first-render row's before-definition case: the markup (a page button and `<ocelle-drawer open>` with two slotted buttons) mounted while `ocelle-drawer` is undefined and the page button focused, then `src/ocelle-drawer.ts` imported; after upgrade shown modally with initial focus on the first slotted button, no event on open, `open = false` gives reason `host` and focus back on the page button. On the fixture the same case runs on `overlays-upgrade.html` from `test/browser/drawer.test.ts` (the test adds `ocelle-elements.js` by URL as a module script).

  In `test/scenarios/dialog.ts`, add to the nested row the cases with an open `ocelle-drawer` as the outer overlay (the dialog slotted inside it); the dialog-in-dialog case stays:
  - the nested row's assertions (one Escape, one request on the dialog, the drawer dispatches nothing and stays open and `:modal`, focus back on the drawer's button that opened the dialog; Tab never runs the drawer's wrap; the opener removed);
  - the backdrop click over the open drawer (matrix § Dialog "Nested", "Backdrop click over an open drawer"; FR-012, FR-023, R-07): a primary click on the dialog's backdrop outside both panels, and inside the drawer panel's border box but outside the dialog's, each × {drawer host veto, no veto}: no `ocelle-drawer-close-request`, no `ocelle-drawer-close` and no `ocelle-dialog-*` event; both overlays stay open (`open` true, both inner dialogs open and `:modal`, `topLayer()` the drawer then the dialog); `focusPath()` reads the dialog's inner `<dialog>`, as Phase 2 measured for a backdrop click (matrix § Dialog "Backdrop click"); then one Escape gives exactly one `ocelle-dialog-close-request` with reason `escape` and `ocelle-dialog-close` with focus on the drawer's opener button, and the drawer still dispatches nothing.
- [X] T032 [P] [US2] Write `packages/elements/test/entry-drawer.test.ts` and update the exports test keys. The `manifest.test.ts` entry for `ocelle-drawer` must list:
  - the dialog's members: `open` (reflected, default `false`), `label`, `closeLabel`/`close-label` (default "Close"), the slots default and `footer`, the parts `panel`, `heading`, `body`, `footer`, `close-button`;
  - `open`, `label` and `closeLabel` (and their attributes) with `inheritedFrom: { name: "OcelleOverlay", module: "src/overlay.ts" }`, as T018 asserts for the dialog; the published manifest (the committed `custom-elements.json` and `generate(root)`'s output) still has no `src/overlay.ts` module and no declaration named `OcelleOverlay` (operator decision, 2026-11-14, R-01);
  - `side` (`"start" | "end"`, default `"start"`, reflected), `ground` (`"sheet" | "chrome"`, default `"sheet"`, reflected), `headingHidden`/`heading-hidden` (boolean, default `false`, reflected), these three with no `inheritedFrom`;
  - the events `ocelle-drawer-close-request` (detail `{ reason: "escape" | "close-button" | "backdrop" }`) and `ocelle-drawer-close` (detail `{ reason: "escape" | "close-button" | "backdrop" | "host" }`);
  - no `--ocelle-dialog-inline-size` and no other CSS property;
  - every member with a description (SC-003, R-01).

  The manifest gate's repository counts go from 3 to 4 elements (`manifest: 4 elements checked, no finding`) in `gates/test/manifest.test.ts` (both repository runs) and `gates/test/integration/manifest.test.ts`, written by hand (a count test outside R-16's list; review phase 2 Test quality).

  Add `ocelle-drawer.js` to the dist file lists in the build and pack tests. Add the README drawer fragments to `readme.test.ts`, including #12's personal-drawer example and the tokens sentence of data-model § `ocelle-drawer`, in the dialog's sentence form: "`ocelle-drawer` reads the tokens `--ocelle-color-sheet`, `--ocelle-color-ink`, `--ocelle-color-overlay`, `--ocelle-color-chrome`, `--ocelle-color-chrome-ink`, `--ocelle-elevation-raised`, `--ocelle-radius-2`, `--ocelle-border-width`, `--ocelle-drawer-inline`, `--ocelle-dialog-max-inline`, `--ocelle-font-sans`, `--ocelle-font-size-md`, `--ocelle-font-size-lg`, `--ocelle-font-weight-strong`, `--ocelle-line-height-normal`, `--ocelle-line-height-tight`, `--ocelle-space-2`, `--ocelle-space-3`, `--ocelle-space-4`, `--ocelle-space-6`, `--ocelle-target-min`, `--ocelle-size-visually-hidden`, `--ocelle-focus-width`, `--ocelle-focus-offset`, `--ocelle-color-focus`, `--ocelle-motion-base` and `--ocelle-easing-standard`, and its close icon `--ocelle-icon-size`" (no `--ocelle-dialog-max-block` and no `--ocelle-measure-reading`: the drawer has no block cap and no `--ocelle-dialog-inline-size`).
- [X] T033 [P] [US2] Tokens: add the `drawer-inline` row (group `shell`, value `var(--ocelle-shell-sidebar-width)`, ref `["shell-sidebar-width"]`) to `packages/tokens/test/expected.ts`. Add the computed value 20rem to the `tokens-browser` value tests, and the token to the tokens README and CHANGELOG checks (`test/readme.test.ts`).
- [X] T038 [P] [US2] Red, in `storybook/test/integration/elements-stories.test.ts` (`open(id, theme, "ocelle-drawer")`): the drawer stories of data-model § Stories exist in light and dark and each renders an open `ocelle-drawer` with base.css applied and no request outside the origin. The red commit also holds the story-count updates of R-16 (operator decision D), written by hand from the story files: `gates/test/integration/storybook-build.test.ts` (`built 35 stories`), `gates/test/integration/axe.test.ts` and `gates/test/integration/visual.test.ts` (70 story-themes), counted again after any merge of `main` (R-17). It also holds the count tests outside R-16's list that follow from the same story files (review phase 2 Test quality, from Phase 2's 58): the axe gate's unlabelled-button plant run in `gates/test/integration/axe.test.ts` (`axe: 2 findings in 72 story-theme runs`, the repository's 70 and the plant's 2) and the repository's baseline files in `gates/test/integration/plant-repo.test.ts` (`toHaveLength(70)`). Part of T034's red commit.
- [X] T034 [US2] Make the red commit of T030 to T033 and T038. `red.sh 3 phase` must show each failing for the missing element, token or stories.

### Implementation (green)

- [X] T035 [US2] Add `drawer-inline` to `packages/tokens/src/source.ts` (group `shell`, value `var(--ocelle-shell-sidebar-width)`, ref `["shell-sidebar-width"]`, with a comment naming #450), and to the tokens README and CHANGELOG.
- [X] T036 [US2] `packages/elements/src/ocelle-drawer.ts`, class `OcelleDrawer extends OcelleOverlay`:
  - the `ocelle-drawer` prefix;
  - `side`, `ground` and `heading-hidden`; unknown values render as the default;
  - logical edge placement, full block size, `inline-size: var(--ocelle-drawer-inline)` capped by `max-inline-size: var(--ocelle-dialog-max-inline)`; the two inner-edge corners `radius-2` (logical `border-*-end-radius` for `side="start"`, `border-*-start-radius` for `side="end"`) and the two viewport-edge corners 0 (FR-003, data-model § `ocelle-drawer` Shape), so each of the four `side` × `dir` cases gives the physical corners T030's styles row asserts;
  - the body fills the column, with the footer at the panel's end (R-18);
  - the chrome ground uses `color-chrome` with `color-chrome-ink`;
  - `heading-hidden` uses the visually hidden pattern with `--ocelle-size-visually-hidden`, keeps the heading in the tree, and keeps the close control at the block start;
  - backdrop click per R-07: primary button, both `pointerdown` and `click` outside the border box, target the `<dialog>`, ignored while closing;
  - the slide motion signed by side and `:dir(rtl)`;
  - JSDoc tags and `define`.
- [X] T037 [US2] Packaging and docs: the export, the `./ocelle-drawer.js` entry point, the regenerated manifest, the README section and the CHANGELOG entry. Run the T030 to T033 suites green, then the gates as in T025, plus `gate:contrast` and `gate:brand-rules` because of the token, and `pnpm vitest run --project tokens --project tokens-browser`.

### Stories (green, after T037)

- [X] T039 [US2] Green: `storybook/stories/drawer.stories.ts`. (The long-scrolling-body story's scroll-edge block, decided after this task by the operator on 2026-11-15, is added in T040.)
- [X] T040 [US2] Two operator decisions of 2026-11-15 come first (plan decisions 24 and 25, `reviews/analysis/fixes-8.md`):
  - **Scroll edge** (R-16, generalised): in `storybook/stories/drawer.stories.ts`, the long-scrolling-body story places an empty `<div data-story="drawer-scroll-edge"></div>` in the slotted body between two paragraphs, across the body's scroll edge in the 1280 × 800 capture, as the dialog's story does with `dialog-scroll-edge`; in `storybook/.storybook/stories-layout.css`, a `[data-story="drawer-scroll-edge"]` rule sets only its block size (layout only, a comment in the file's style), large enough that the edge falls inside the block. No text, role, name or `style` attribute; no entry in `storybook/a11y-exceptions.json`. T038's story tests still pass. If `gate:axe` still reports a `color-contrast-incomplete` node on the story, stop for the operator.
  - **Elements dry-run limit** (R-15): red first, change the pinned test in `gates/test/vitest-config.test.ts` ("is stryker.config.json with its own Vitest config and its own report file"): the elements configuration equals `stryker.config.json` plus its own Vitest config, its own report file and `dryRunTimeoutMinutes: 30`, and `stryker.config.json` has no `dryRunTimeoutMinutes`. Commit the test alone and save its failing run as `reviews/phase-3/red-dry-run.log` (failing on the missing key). Then add `"dryRunTimeoutMinutes": 30` to `stryker.elements.config.json` (repository root) and nothing else; `stryker.config.json` is not changed (its dry run passed within the default, `reviews/phase-3/mutation.log` run 3). Re-run the test green, then run `gate:mutation -- --base 4aaf9e4 --files packages/elements/src/ocelle-drawer.ts,packages/elements/src/overlay.ts,packages/elements/src/index.ts` with the gate unmodified (no scratch runner) and record its result and every report line in `reviews/phase-3/notes.md` § Mutation and `reviews/phase-3/mutation.log`; any survivor is handled test first as in T037.

  Then produce the baselines; run `gate:storybook-build` (`built 35 stories`), `gate:visual` (70 captures match) and `gate:axe` (70 story-theme runs, 0 serious or critical); commit the baselines (70 files in `storybook/baselines/`, so T038's `plant-repo.test.ts` count passes, and the axe plant run gives 72). Then add a `differs` line to `gates/plants/visual/fail-token-changed/plant.json` for each new light story-theme that shows `color-ink`, measured in the pinned container as 006 T046s did (R-16), commit it with the baselines, and run `gate:plants`.

**Checkpoint**: `tdd-check.sh 3` reports `pass`.

---

## Phase 4: User Story 3 - A tooltip that meets WCAG 1.4.13 (Priority: P3)

**Goal**:
- US3 scenarios 1 to 15;
- FR-029 to FR-041;
- the `tooltip-delay` and `tooltip-max-inline` tokens;
- the engine floor raised to WebKit 17.

**Independent Test**: matrix § Tooltip passes in both harnesses and in the touch contexts, and the tooltip stories pass
the visual and axe gates (after #10).

### Tests (red, one commit)

- [X] T041 [P] [US3] Write `packages/elements/test/scenarios/tooltip.ts`, covering matrix § Tooltip:
  - hover delay at 300 ms: not shown at 150 ms, shown by 450 ms; re-entry; reduced motion with the same bounds; delay 0 shows in the same task;
  - keyboard focus; click focus; late `:focus-visible` (assert `focusVisible()` true first); the text-field trigger;
  - persistence (FR-032 "no timeout", US3-3): once shown, still `:popover-open` after a bounded 900 ms wait sampled every frame, for the pointer resting on the trigger, the pointer resting on the bubble, and keyboard focus with the pointer outside both, each in the test of the show it guards;
  - the hoverable gap (`pointer()` stops); leave;
  - Escape: stays dismissed, and the recorders see nothing; inside a dialog, two presses (SC-005);
  - a trigger that opens an overlay (dialog and drawer);
  - empty `text`, `disabled`, a trigger disabled or removed while shown, a slot change, two tooltips;
  - placement: each value, flip, cross-axis clamp, `ltr` and `rtl`, clipped and transformed containers, inside an open dialog and drawer;
  - following the trigger: container scroll, dialog body scroll, viewport resize;
  - size and unbreakable text;
  - host layout (`display: contents`, the pill still ellipsises);
  - the accessibility tree with and without `describes`;
  - the `describes` lifecycle: `textContent` only, a unique id, the host's ids kept, the observer re-adding the id, the span re-created after one microtask, slot change;
  - forced colours;
  - click focus, then hover (matrix § Tooltip "Click focus, then hover", US3-12, analysis C3): the bubble shown after the delay hides when the pointer leaves both boxes while the trigger keeps focus, is not shown at any frame of a bounded 900 ms wait, and shows again only after the pointer rests on the trigger again or focus arrives with `:focus-visible`;
  - no animation (analysis C2): `animations()` on the bubble part and its painted box is empty after the show, through the persistence wait and after the hide, motion allowed;
  - bubble styles (analysis U2): the painted box's four corner radii equal the computed `radius-2` (not `radius-pill`), `padding-block` `space-1`, `padding-inline` `space-2`; the bubble part's padding `space-2` on the trigger's side only;
  - neither side fits (analysis A2): `placement="top"` in a 1280 × 120 viewport, the bubble stays on top, not flipped, cross axis inside the viewport less `gutter`;
  - theme change while shown inside an open dialog (analysis C6): the bubble's and the panel's computed colours follow `data-theme` within one frame, the bubble stays shown, no event.
- [X] T042 [P] [US3] Write the runners `packages/elements/test/tooltip.test.ts` and `test/browser/tooltip.test.ts` (fixture `tooltip.html`), each test named by its row's full name, never by a `$name` interpolation (Rules § Full test names). Write `packages/elements/test/tooltip.touch.test.ts` and `test/browser/tooltip.touch.test.ts` for the touch row (a tap on a button trigger: the action runs, no bubble). Write `packages/elements/test/tooltip-no-popover.test.ts` (in process, `showPopover` removed before definition: nothing shows, no box, nothing throws).
- [X] T043 [P] [US3] Write `packages/elements/test/entry-tooltip.test.ts` and update the exports keys. The `manifest.test.ts` entry for `ocelle-tooltip` must list:
  - `text` (default `""`), `placement` (`"top" | "bottom" | "start" | "end"`, default `"top"`, reflected), `disabled` (reflected), `describes` (reflected);
  - the default slot and the `description` slot;
  - part `bubble`;
  - an empty events list.

  The manifest gate's repository counts go from 4 to 5 elements (`manifest: 5 elements checked, no finding`) in `gates/test/manifest.test.ts` (both repository runs) and `gates/test/integration/manifest.test.ts`, written by hand (R-16 § Story counts, the counts outside its list).

  Add the dist files to the build and pack tests.
- [X] T044 [P] [US3] In `packages/elements/test/node/readme.test.ts`:
  - change the § Engines floor line (pinned at `:65`) to "Chromium 120+ and WebKit 17+", with the Popover API (Chromium 114, WebKit 17) as the newest feature;
  - add the tooltip section fragments:
    - the tokens sentence of data-model § `ocelle-tooltip`, in the dialog's sentence form: "`ocelle-tooltip` reads the tokens `--ocelle-color-chrome`, `--ocelle-color-chrome-ink`, `--ocelle-radius-2`, `--ocelle-border-width`, `--ocelle-font-sans`, `--ocelle-font-size-sm`, `--ocelle-line-height-normal`, `--ocelle-space-1`, `--ocelle-space-2`, `--ocelle-gutter`, `--ocelle-tooltip-delay` and `--ocelle-tooltip-max-inline`" (analysis U1(a));
    - the FR-037 statement (analysis U1(c)): the trigger carries its own accessible name; the bubble only repeats or supplements what is available otherwise; touch input shows no bubble, except on a text-field trigger, which shows it on any focus;
    - FR-036's advice (analysis U1(c)): set `describes` when the text adds to the trigger's name;
    - the stated limits (text-field triggers, custom-element triggers with `describes`, touch);
    - #7's and #12's usage.
- [X] T045 [P] [US3] Tokens: add the `tooltip-delay` row (group `motion`, `500ms`) and the `tooltip-max-inline` row (group `size`, `18rem`) to `packages/tokens/test/expected.ts`, and the computed values to `tokens-browser`. Test that the reduced-motion block still sets only `motion-fast` and `motion-base`, so `tooltip-delay` is not zeroed (brand rule (f)). Add the README and CHANGELOG checks.
- [X] T050 [P] [US3] Red, in `storybook/test/integration/elements-stories.test.ts`: the tooltip stories of data-model § Stories exist in light and dark. In a page with viewport 1280 × 800 and `reducedMotion: "reduce"`, the mouse moves to the centre of each story's trigger (the selector, written by hand, that the story's `parameters.ocelle.pointer.hover` names: an id or data attribute, R-16); that box lies wholly inside 1280 × 800, and after `fonts.ready` and two frames the bubble is `:popover-open`. The bubble being open two frames after the move holds only with R-16's delay override, so this check is also the red test of `[data-story="tooltip"] { --ocelle-tooltip-delay: 0ms; }`; the test also asserts that each story's trigger lies inside a `[data-story="tooltip"]` element and that the computed `--ocelle-tooltip-delay` on the trigger is `0ms`. The parameter itself is proven by `gate:visual` and `gate:axe` (`pointer-target`) at T052. The red commit also holds the story-count updates of R-16 (operator decision D), written by hand from the story files: `gates/test/integration/storybook-build.test.ts` (`built 44 stories`), `gates/test/integration/axe.test.ts` and `gates/test/integration/visual.test.ts` (88 story-themes), counted again after any merge of `main` (R-17). It also holds the counts outside R-16's list (R-16 § Story counts): the axe gate's unlabelled-button plant run in `gates/test/integration/axe.test.ts` (`axe: 2 findings in 90 story-theme runs`, the repository's 88 and the plant's 2), the repository's baseline files in `gates/test/integration/plant-repo.test.ts` (`toHaveLength(88)`) and the baseline-command test of `gates/test/integration/visual.test.ts` (88 baseline files). Before the commit, search the repository for every Phase 3 value (`35 stories`, `70 story-themes`, `72 story-theme`, `toHaveLength(70)`, `toBe(70)` (the baseline-command test, `visual.test.ts:244` at Phase 3), `70 captures`, `70 baseline`, and T043's `4 elements`) and update each copy in a test by hand; the Stryker comments in gate source that quote the renamed titles change with the green (comment text only). Part of T046's red commit.
- [X] T046 [US3] Make the red commit of T041 to T045 and T050. `red.sh 4 phase` must show each failing for the missing element, token, floor text or stories.

### Implementation (green)

- [X] T047 [US3] Add `tooltip-delay` and `tooltip-max-inline` to `packages/tokens/src/source.ts`, and to the tokens README and CHANGELOG.
- [X] T048 [US3] `packages/elements/src/ocelle-tooltip.ts`, class `OcelleTooltip`, per R-10 to R-13:
  - **Host**: `:host { display: contents }`; the trigger is the first assigned element, tracked on `slotchange`.
  - **Bubble**:
    - `<div part="bubble" popover="manual" aria-hidden="true">`, hidden by default and shown only through `:popover-open`;
    - the element does nothing when `showPopover` is absent;
    - the UA `[popover]` styles reset;
    - colours `color-chrome` and `color-chrome-ink`; forced colours `Canvas`, `CanvasText` and a `CanvasText` border;
    - `max-inline-size: var(--ocelle-tooltip-max-inline)`, wrapping unbreakable strings;
    - the transparent `--ocelle-space-2` padding on the trigger's side, 0 on the other three, and no radius or ground on the part;
    - the painted box (the part's only element child): `border-radius: var(--ocelle-radius-2)` on all four corners, never `radius-pill` (constitution II), `padding-block: var(--ocelle-space-1)`, `padding-inline: var(--ocelle-space-2)`, `font-sans` at `font-size-sm` with `line-height-normal` (R-09, data-model § `ocelle-tooltip` Shape);
    - no animation of any kind (US3-8).
  - **Show and hide**:
    - hover tracked by `pointerover`/`pointerout` with `relatedTarget`, ignoring `touch`;
    - the delay read from the computed `--ocelle-tooltip-delay`, through `setTimeout` with a function; 0 ms shows synchronously;
    - `:focus-visible` checked on focus arrival only;
    - the capture-phase `window` Escape listener while shown;
    - one shown bubble at a time; hidden when an overlay opens.
  - **Placement**:
    - a per-instance constructable sheet with physical `top`/`left` coordinates (no `style` attribute, FR-047);
    - logical `placement` under `:dir(rtl)`; flip; cross-axis clamp within `--ocelle-gutter`;
    - a per-frame trigger-rect check while shown.
  - **`describes`**: a light-DOM `span[slot="description"][role="tooltip"][hidden]` written with `textContent`, with a unique id. A `MutationObserver` re-adds the id to the trigger's `aria-describedby`, keeping the host's ids, and re-creates a removed span within one microtask. Everything is cleaned up on unset and disconnect.
  - **Manifest and registration**: JSDoc tags, `define`.
- [X] T049 [US3] Packaging and docs:
  - the export and the `./ocelle-tooltip.js` entry point;
  - the regenerated manifest;
  - the README tooltip section, and § Engines raised to WebKit 17;
  - CHANGELOG entries for `@ocelle/elements` (`ocelle-tooltip` and the floor) and `@ocelle/tokens`;
  - `storybook/.storybook/stories-layout.css`: the rule `[data-story="tooltip"] { --ocelle-tooltip-delay: 0ms; }` (R-16, operator decision A), with a comment in the file's style;
  - the floor consumers again (FR-040, R-10, analysis I5): search the whole workspace at this point, after any merge of `main`, for `engines`, `browserslist` (a key or a `.browserslistrc`) and `build.target` (Vite, esbuild, or a `tsconfig` `target` read as an engine floor); each browser floor found follows Chromium 120 / WebKit 17 in this task; the root `package.json` `engines` is Node's and stays. Record the search and its result in `reviews/phase-4/notes.md`.

  Run the suites green, including `elements-touch`, then the gates as in T037. Mutation: `gate:mutation -- --base <phase base> --plan` first, then one `gate:mutation -- --base <phase base> --files <entries>` run per planned shard (`ocelle-tooltip.ts` in its 30-line entries, `overlay.ts` for the hide-on-open call, `index.ts`, `packages/tokens/src/source.ts`), each with the gate unmodified (no scratch runner) and `stryker.elements.config.json` as committed (`dryRunTimeoutMinutes` 30; R-15). Record each run's result and every report line in `reviews/phase-4/notes.md` § Mutation and `reviews/phase-4/mutation.log`, with the dry run's measured time; any survivor is handled test first, its failing run kept as a `red-*.log` in the phase directory; every Timeout line is named with its cause (R-15). Do not change `.github/workflows/ci.yml`: its `mutation-shard` limit is op 015's (R-15, plan decision 25).

### Stories (green, after T049)

- [X] T051 [US3] Green: `storybook/stories/tooltip.stories.ts`, each story's markup inside `<div data-story="tooltip">` (the delay override, R-16), each pointer selector an id or data attribute matching exactly one element. The inside-an-open-dialog story keeps the dialog body short enough not to scroll at 1280 × 800. If a tooltip story has a scrolling body after all, R-16's scroll-edge rule applies: an empty `<div data-story="tooltip-scroll-edge">` across the body's scroll edge, sized only by its own `[data-story="tooltip-scroll-edge"]` block-size rule in `storybook/.storybook/stories-layout.css`, with no text, role, name or `style` attribute and no `a11y-exceptions.json` entry.
- [X] T052 [US3] Produce the baselines in the pinned container; run `gate:storybook-build` (`built 44 stories`), `gate:visual` (88 captures match) and `gate:axe` (88 story-theme runs, 0 serious or critical, no new `a11y-exceptions.json` entry; a `color-contrast-incomplete` node stops for the operator, R-16); commit the baselines (88 files in `storybook/baselines/`, so T050's `plant-repo.test.ts` and baseline-command counts pass, and the axe plant run gives 90). Then add a `differs` line to `gates/plants/visual/fail-token-changed/plant.json` for each new light story-theme that shows `color-ink`, measured in the pinned container as 006 T046s did (R-16), commit it with the baselines, and run `gate:plants` (at least shards 16, 19 and 27, as in Phases 2 and 3; the rest is CI's). After any fix that lands after the baselines (a story, stylesheet or element change), produce the baselines again and re-run `gate:visual` and `gate:axe`, and shard 16 if a light story-theme changed.

### Record (FR-041)

- [X] T053 [US3] Record Kitty Desktop's WebKitGTK version against WebKit 17 (FR-041). Outcome, decided by the operator on 2026-11-15 (plan decision 26, spec § Operator decisions in Phase 4) and already in research R-10: **not yet determinable: Kitty Desktop has no webview until kitty-mission-ui #20** (at kitty-mission-ui `c994c8e` its Tauri crate is a compile-only placeholder with no dependencies, and no WebKitGTK version is pinned anywhere). The floor stays Chromium 120 / WebKit 17. Remaining work: write the hand-off in `reviews/phase-4/notes.md`: the outcome and the evidence above; that #20, when it adds Tauri 2 on Linux (the distro's webkit2gtk-4.1), must choose a WebKitGTK that meets WebKit 17 (by R-10's reading the 2.44 line or later, unverified); and that the elements README § Engines states that floor (T044, T049). T053 does not block Phase 4's approval.

**Checkpoint**: a full `pnpm test` passes at HEAD (more than 30 minutes, Environment § Run time; log kept in `reviews/phase-4/`), then `tdd-check.sh 4` reports `pass`.

---

## Phase 5: Polish & cross-cutting

- [X] T054 Close out R-16: confirm that research R-16 states the merged #10's facts and that no story task depends on the unmerged branch. Record this in `reviews/phase-5/notes.md`.
- [ ] T055 Walk through `quickstart.md` steps 1 to 7 and the two hand checks, and record the results in `reviews/phase-5/notes.md`.
- [X] T056 Check the three CHANGELOGs name every surface addition (three elements, three entry points, three tokens, the floor). Docs only; `reviews/phase-5/tdd-exempt.md` states why no test could fail beyond those of T019, T032, T044 and T045.
- [X] T057 Fix the three notes of `reviews/phase-4/round-1.md` (operator decision, 2026-11-15: "Fix them in Phase 5"). Start the phase with `base.sh` before this task's first commit.
  - **R1-02** (`packages/elements/test/scenarios/tooltip.ts`, the FR-031 click-focus row, about :658 to :672): measure the row's wait from the click, as its name says. `Frames.clicked` is already recorded in the page (capture-phase listener, ms from the entry, the origin of the frame times), so: `to450` holds when the last frame's `t` is at least `f.clicked + 450`, and "no bubble" covers every frame up to that time (a `never` measured from `f.clicked`, or a check over the frames from the entry to `f.clicked + 450`, with the span from the click, not from the entry, at least 400 ms). A run where `f.clicked` is `null` fails with a message, as in `beforeDelay`. The name stays "… a 450 ms wait from the click". Only if `Frames.clicked` cannot serve (state why in `notes.md`), rename the row "… from the entry" instead.
  - **R1-03** (`tooltip.ts`, "Escape, then a brief hover", about :836 to :850): pass a bound of 100 to `beforeDelay` (`beforeDelay("the leave", …, 100)`), so only a run whose page-side leave came before 100 ms is judged, as the name says. The name and the expected values stay.
  - **R1-01** (`packages/elements/src/bubble.ts`:2-3 and :9, comment only): say that `dismiss` hides the shown bubble (R-10 "hide current", `ocelle-tooltip.ts`:137-144) until the pointer or keyboard focus enters its trigger again, and that a pending delay is not ended by the hook but by the trigger's own `pointerout` or `focusout`; the `dismiss` member's doc comment says "Hides the shown tooltip bubble (an overlay is opening)". No code changes. Out of scope: making `dismiss` end pending delays, and a WebKit 17 row for the pending delay under a modal: the elements suites have no WebKit harness, so none can be added cheaply; record this in `notes.md` as open for a later mission.
  - **Test first.** Commit the two test changes alone (test files only) and run `red.sh 5 phase`. A red recorded there counts only if a row fails by its assertion on the tooltip's behaviour (a bubble within 450 ms of the click, or within the wait after a leave under 100 ms); that is a real defect, fixed in the source in green with the row unchanged. A failure that is only "no run it can judge" (every leave at or after 100 ms) is a setup failure, not red: fix the row's timing and amend. If the rows pass at that commit, which is expected because the code already meets them, no red commit is recorded and no red is made up. The evidence is then break checks, each a temporary source change that is never committed, run against the old row (at the phase base) and the new row, with the commands and results in `reviews/phase-5/notes.md`:
    - R1-02: a break that shows the bubble on click focus after more than 450 ms from the entry but less than 450 ms from the click (for example, a show timer started at the click of 450 ms minus half the measured click offset); the new row must fail it; record whether the old row missed it;
    - R1-03: the existing break that drops the `clearTimeout` in the trigger's `pointerout` must still fail the row with the 100 ms bound; and a test-side check (a pause of 150 ms before the leave, not committed) must make the row fail with `beforeDelay`'s "no run it can judge" message, not pass;
    - R1-01: none; `reviews/phase-5/tdd-exempt.md` gets a line: the change is comment text only, Stryker makes no mutant of a comment, so no test can fail.

    With no red commit, `tdd-exempt.md` also gets a line for R1-02 and R1-03: the rows were made stricter against code that already meets them, so they could not fail before a fix; the break checks above, in `notes.md`, are their test-first evidence.
    Then commit the comment. Run `elements` and `elements-browser` (the tooltip rows), `gate:typecheck`, `gate:lint` and `gate:test-lint`, and `gate:mutation -- --base <phase base> --plan` (it plans no shard for `bubble.ts`'s comment; if it plans one, run it and record the result in `notes.md` § Mutation).

**Checkpoint**: a full `pnpm test` passes at HEAD (log kept in `reviews/phase-5/`), then `tdd-check.sh 5` runs before the review, as in the other phases, and its `tdd-check.json` is kept. It reports `pass` when `red.sh 5 phase` recorded a red commit; with none, `tdd-exempt.md` (T056's reason and T057's lines above, with the break checks in `notes.md`) makes it report `exempt`, and the review reads the break checks as the test-first evidence.

---

## Dependencies & Execution Order

- Phase 1 blocks everything. Phase 2 blocks Phase 3, because the drawer reuses `overlay.ts` and the dialog
  scenarios. Phase 4 needs Phase 2 for the dialog rows, and Phase 3 for the drawer rows (inside a drawer, a trigger
  that opens a drawer).
- In each phase: measurement first (Phase 2, then the R-16 recheck T026), then the one red commit with the phase's
  story tests (T027, T038, T050), then green, then story green and baselines.
- **Stories**: every story task (T026 to T029, T038 to T040, T050 to T052) waits until #10 is merged, and so does
  each red commit that holds one (T020, T034, T046). T026 runs first and once, before any story test is written.
- Within a red commit, the [P] tasks touch different files.

## Parallel Opportunities

- Phase 1: T001 to T003 in parallel, then T005 to T011 in parallel after T005's interface.
- Phase 2: T015 to T019 and T027 in parallel.
- Phase 3: T030 to T033 and T038 in parallel.
- Phase 4: T041 to T045 and T050 in parallel.

## Implementation Strategy

- **MVP**: Phases 1 and 2. This gives the dialog for the Open project consumer.
- Then the drawer for #12, then the tooltip for #7 and #12. Each phase lands as its own reviewed unit and is folded
  after approval (`/ocelle-run` step 4.3).
