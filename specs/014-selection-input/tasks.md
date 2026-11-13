# Tasks: Selection and Input Elements

**Input**: design documents in `specs/014-selection-input/`, as approved at the plan gate on 2026-11-13 after three
plan squad rounds (`reviews/plan/round-1` to `round-3`): `plan.md`, `spec.md`, `research.md` (R-01 to R-18),
`data-model.md`, `contracts/elements.md`, `quickstart.md`.

**Implementation waits for #10.** #10 (Storybook workbench) merged on `main` as `3828d2f` on 2026-11-13. By the
operator's decisions (spec check 1 Q3 (c); 2026-11-13 "defer to phase 1"), no phase starts before T001 has rechecked
this plan against #10 as merged and any difference has been fixed in plan and tasks. `main` is merged into the
branch at landing (`/ocelle-land`), not during the run.

**Tests**: required. Constitution Principle VIII applies to every phase. The phase flow is `base.sh`, `scaffold.sh`
(new modules with signatures and no behaviour), one red commit of test-only files proven by `red.sh` (one red record
per phase, operator decision I3), then green, the mutation gate, `tdd-check.sh` and an independent review. **Story
tests are in the red commit** (operator decision I3): the phase's `storybook/stories/*.stories.ts` and the story test
(`storybook/test/integration/elements-stories.test.ts`) are written before green. Baselines are produced in green
with #10's baseline command in the pinned container (a capture of a story that does not render yet is meaningless).

Expected values are written by hand from the spec, the data model and research, never read from the source under
test. Guard rules, as in mission 005:
- A "does not" assertion never stands alone; it shares its test with the positive assertion it guards
  (`contracts/elements.md` § Pairings, including the setup that makes it falsifiable).
- Each guard is proven able to fail by its named plant, run once by the implementer and recorded in
  `reviews/phase-N/plants.md`.
- A plant that does not make its guard fail stops the phase (stop-and-ask).

**Shared scenario bodies** (R-11): every browser scenario is written once in `packages/elements/test/scenarios/*.ts`
against the driver and run by the in-process `elements` project (element source, mutated by Stryker) and the
`elements-browser` project (the built browser build on the strict-CSP fixture). Pure-module tests
(`roving.test.ts`, `selection.test.ts`, `link-target.test.ts`) run in `elements`, so Stryker's elements config runs
them (R-13). Keyboard input is real (`userEvent.keyboard` in process, `page.keyboard` on the fixture), never a
synthetic `KeyboardEvent` (spec "Real input only").

**Environment**: Node 22 here, 26.13.0 in CI. Browser runs set
`OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`. One heavy job (browser suites,
mutation, plants, `gate:visual`) at a time. Never `git stash`. Under #23, Timeout, CompileError and zero-mutant
lines are reports, not findings; entries are at most 30 changed lines.

**Organization**: Phase 1 Setup; phases 2 to 6 are User Stories 1 to 5, one review unit each, folded after approval
(`/ocelle-run` step 4.3); phase 7 Polish holds only cross-element records.

**Stop-and-ask points** (the implementer stops, records the question in the phase review, does not work around it):
- **T001 recheck**: #10 as merged differs from this plan in a way that changes a spec outcome (not just a name or
  command) — gate ids, story id scheme, the pointer or focus parameters, the axe rule set or exception format.
- **T020 spike (phase 2)**: the Chromium order of `focusout`, the `focusout` microtask and the `childList` records
  contradicts R-03 (the blur of a removal is not found by `takeRecords()` in the microtask, or a user Tab/click blur
  has a null `relatedTarget`).
- **T040 spikes (phase 3)**: the tabs host with a host `aria-label` exposes more or fewer than one named node (R-01,
  plan decision 7); generated ids do not give "tab controls panel" and "panel named by tab" in Chromium's tree (R-02).
- **T060 measurement (phase 4)**: the joined rounding is not settled after the `ResizeObserver` delivery the driver
  waits for, or a resize loop warning appears (R-06).
- **T075 spike (phase 5)**: `Accessibility.nodesUpdated` does not deliver the empty-region update (only the
  frame-order check remains; plan decision 7); the clipboard controls cannot hold (record the question open with
  decision 1).
- **T090 spikes (phase 6)**: the `file:` page cannot load the browser build or navigate under
  `--allow-file-access-from-files` (R-09, plan decision 6); the link host with a host `aria-label` exposes other than
  one named link (R-08, plan decision 7).
- **The engine-floor raise (T064)** before kitty-mission-ui's WebKitGTK and WKWebView minimums are known (plan
  decision 1): implement the `:state()` design only if the operator has confirmed the floor; else stop.
- **A plant that does not bite. Any mutation shard over 10 minutes. A new colour pairing not in R-15/R-17.**

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: the user story of the task (US1 to US5)
- Paths are relative to the repository root.

---

## Phase 1: Setup

**Purpose**: the recheck against #10, the driver extensions every story needs, and the `elements-browser-file`
project.

**Independent Test**: `pnpm test` passes; each new driver command has a unit test that failed before it existed;
`test/browser-file/**` runs only in `elements-browser-file`.

### Recheck (first; documentation, exemption with reason)

- [ ] T001 Recheck plan, research R-12, contracts and tasks against #10 as merged on `main` (`3828d2f`): `specs/006-storybook-workbench/spec.md` (FR-016 rule set, FR-025 contributor note, FR-027, FR-031), `contracts/gates.md` (`storybook-build`, `visual`, `visual:update`, `axe`, exception format), `contracts/container.md`, `storybook/` layout and story id scheme, the story test's location; record each difference and its fix in `specs/014-selection-input/reviews/phase-1/recheck-10.md`; amend plan/tasks before T010 (stop-and-ask if a spec outcome changes)

### Tests (red, one commit)

- [ ] T002 [P] `packages/elements/test/driver-commands.test.ts`: unit tests for `press(key, modifiers)`, `click(target, { button, modifiers, count })`, child addressing by `{ parent, kind, index }`, `activeElement()` through shadow roots returning that identity, `mutate(steps)` (several DOM steps in one task), the non-settling `resize` and `afterResizeDelivery`, `computedPart`, page scroll offset and viewport size (R-11)
- [ ] T003 [P] `packages/elements/test/driver-recorders.test.ts`: unit tests for the keydown recorder (key, `defaultPrevented`, document bubble phase), the clipboard observer (`writeText`, `write`, `execCommand('copy')`) installed at every mount and fixture page, `activationRecord` (click, end of click task, first frame, request; R-07) and the `axUpdates` recorder of `Accessibility.nodesUpdated` (R-07)
- [ ] T004 [P] `packages/elements/test/ax-states.test.ts`: the separate `axStates` command reports `selected`, `pressed`, `disabled`, `controls`, `live` and names; mission 005's `axTree` output stays exactly `{ role, name }` (PLAN-TESTABILITY-1-014)
- [ ] T005 [P] `gates/test/vitest-config.test.ts`: project `elements-browser-file` exists with `--allow-file-access-from-files`, includes only `packages/elements/test/browser-file/**`; `elements` and `elements-browser` exclude it; `vitest.mutation.config.ts` excludes `elements-browser-file` (R-09)

### Implementation (green)

- [ ] T006 `packages/elements/test/scenarios/driver.ts`, `packages/elements/test/in-process.ts`, `packages/elements/test/browser/driver.ts`: the commands and recorders of T002, T003
- [ ] T007 `packages/elements/test/commands.ts` and `vitest.config.ts` (browser commands): `axStates` (T004)
- [ ] T008 `vitest.config.ts`, `vitest.mutation.config.ts`: the `elements-browser-file` project and exclusions (T005)

**Checkpoint**: `tdd-check.sh 1` reports `pass`; `recheck-10.md` committed.

---

## Phase 2: User Story 1 - Pick one item from a list with the keyboard: `ocelle-listbox` and `ocelle-option` (Priority: P1) 🎯 MVP

**Goal**: US1 scenarios 1 to 23; FR-001 to FR-018 with FR-014a; the shared keyboard mechanism, selection model, focus
record and internals symbol; `@ocelle/tokens`' new `accent-strong` pairs (R-17); the activate event (R-18).

**Independent Test**: on the strict-CSP fixture, a listbox named "Folders" with five options is tabbed into, walked
with every key, selected and activated; tree, focus, paint and events are read after each key; axe reports no
`aria-allowed-attr` on the listbox stories.

### Spike (first)

- [ ] T010 [US1] Spike R-03 in Chromium, recorded in `specs/014-selection-input/reviews/phase-2/spike.md`: the order of `blur`, `focusout` (with `relatedTarget`), the `focusout`-queued microtask and the `childList` records for (a) a script removal and a script move of a focused option, (b) a user Tab and a user click out followed by a host move or removal in a microtask and in a `requestAnimationFrame`; stop-and-ask on contradiction

### Scaffold

- [ ] T011 [US1] `scaffold.sh`: `packages/elements/src/{roving,selection,internals,ocelle-listbox,ocelle-option}.ts` with exported signatures and no behaviour; `src/index.ts`, `src/browser.ts` re-export; `package.json` `exports` for `./ocelle-listbox.js` and `./ocelle-option.js` (contracts § Entry points)

### Tests (red, one commit)

- [ ] T012 [P] [US1] `packages/elements/test/roving.test.ts`: `owns(event, children)` (target is a child itself and not `defaultPrevented`) and `target(key, { index, enabled, wrap, rtl, axis })` for every key of the three key maps (R-04), ends, all disabled, single child, rtl, unhandled keys → `null`; "Disabled children stay in the list with `enabled` false (focusable at `tabindex="-1"`, skipped by every move)"
- [ ] T013 [P] [US1] `packages/elements/test/selection.test.ts`: every transition of data-model § Transitions for all three kinds, FR-009 defaults ("missing or blank (only whitespace) → index as string", "never `""`; not trimmed"), FR-010 current-value no-op, FR-010a remembered value and Precedence, FR-011/FR-011a targets, batching "one batch per microtask checkpoint" with the `value` setter taking pending records, the focus record (`blurred` set only on a `relatedTarget`-null `focusout`, kept only when its microtask's `takeRecords()` lists the child in `removedNodes`), moves keeping selection (SPEC-3-03), a focused child becoming disabled keeping focus at `tabindex="-1"` (PLAN-CORRECTNESS-1-004 (a))
- [ ] T014 [P] [US1] `packages/elements/test/scenarios/listbox.ts`: US1-1 to US1-23 as shared scenario bodies, each "does not" outcome paired as `contracts/elements.md` § Pairings states (including "a move does not steal focus back", "Tab out while the host re-renders on blur", Space does not scroll, disabled click, forgotten remembered value)
- [ ] T015 [P] [US1] `packages/elements/test/listbox.test.ts` (in-process) and `packages/elements/test/browser/listbox.test.ts` with `packages/elements/test/browser/fixtures/listbox.html` (strict-CSP fixture; zero violations, allowed requests only, no console message)
- [ ] T016 [P] [US1] Paint and ring reads in `scenarios/listbox.ts`: selected bar on the inline-start edge in `accent-strong` on the main grounds and `Highlight` in forced colours (R-15), the option's focus ring on a raised `::after` read on all four sides beside a hovered next and previous option inside the US1-16 clip (R-06, R-15)
- [ ] T017 [P] [US1] `packages/elements/test/entry-ocelle-listbox.test.ts`, `entry-ocelle-option.test.ts`: importing `ocelle-listbox.js` alone defines `ocelle-listbox` and `ocelle-option` (R-16; plant: parent not importing child); `entry-root.test.ts` gains both
- [ ] T018 [P] [US1] `packages/elements/test/node/selection-pairs.test.ts` with `test/node/selection-pairs-check.ts`: every fill, bar, border and text token the listbox's stylesheet paints, per ground, is a checked pair in `packages/tokens/contrast/pairs.json` (R-17); `gates/test/contrast-pairs.test.ts` pinned counts move from 160 light / 168 dark to 166 / 174
- [ ] T019 [P] [US1] `storybook/stories/listbox.stories.ts` (no selection, selected, disabled option, focused option, scrolling listbox, option with icon; FR-050) and `storybook/test/integration/elements-stories.test.ts`: each listbox story renders its options in light and dark, and axe reports no `aria-allowed-attr` (R-01; plant: internals in a private field); `packages/elements/test/node/readme.test.ts` gains the listbox statements (usage, properties, events and payloads including `ocelle-listbox-activate`, keyboard model, naming, tokens read, the amended module rule "importing the module defines that element and the elements it renders or owns as children")
- [ ] T020 [US1] `red.sh 2`: the red record of the phase

### Implementation (green)

- [ ] T021 [US1] `packages/elements/src/roving.ts` (R-04) and `packages/elements/src/selection.ts` (R-05, R-03) passing T012, T013
- [ ] T022 [US1] `packages/elements/src/internals.ts`: the internals symbol axe 4.14 reads (PLAN-FRESH-1-001 (a), R-01)
- [ ] T023 [US1] `packages/elements/src/ocelle-option.ts` and `packages/elements/src/ocelle-listbox.ts`: roles via internals, state attributes on option hosts, roving tabindex, `part="list"` scroll container with ring padding, `ocelle-listbox-change` and `ocelle-listbox-activate` (R-18), minimum block size `--ocelle-target-min` (R-10), raised `::after` ring, icon slot per the slot convention
- [ ] T024 [US1] `packages/tokens/src/source.ts`, `packages/tokens/contrast/pairs.json`, `packages/tokens/CHANGELOG.md`: `color-accent-strong` non-text pairs on the main grounds (R-17), figures from `gates/lib/wcag.ts`
- [ ] T025 [US1] `pnpm --filter @ocelle/elements run manifest`: `packages/elements/custom-elements.json` per contracts § `ocelle-listbox`, § `ocelle-option`
- [ ] T026 [US1] `packages/elements/README.md` listbox section and amended module rule; `packages/elements/CHANGELOG.md` entry
- [ ] T027 [US1] Baselines for the listbox stories with #10's baseline command in the pinned container (`storybook/baselines/`), inspected and committed with the reason in the commit message
- [ ] T028 [US1] Run each US1 plant once, record in `specs/014-selection-input/reviews/phase-2/plants.md`; then `gate:contrast`, `gate:style-lint`, `gate:manifest`, `gate:csp`, `gate:prefix`, `gate:storybook-build`, `gate:visual`, `gate:axe`, `gate:plants`, `gate:mutation -- --base <phase base>` one at a time

**Checkpoint**: `tdd-check.sh 2` reports `pass`; quickstart steps 1 to 6 pass for the listbox.

---

## Phase 3: User Story 2 - Switch between panels with real tabs: `ocelle-tabs` (Priority: P2)

**Goal**: US2 scenarios 1 to 23; FR-019 to FR-025 with FR-021a; tablist on the shadow part, manual slot assignment,
generated ids (R-02), `aria-labelledby` on the assigned panel only.

**Independent Test**: on the strict-CSP fixture, three tabs and panels are walked with every key, keys typed in a
panel's text field stay in the field, and the tree shows the tablist, the controlled panel named by its tab, and no
unselected panel node; the tabs stories pass #10's full axe rule set.

### Spikes (first)

- [ ] T040 [US2] Spikes recorded in `specs/014-selection-input/reviews/phase-3/spike.md`: R-02 generated ids vs ARIA element reflection in Chromium; the tabs host with a host `aria-label` exposes exactly one named node (R-01); axe 4.14's `color-contrast` incomplete on unassigned panels with `aria-labelledby`, for an upstream report (PLAN-FRESH-2-002); stop-and-ask per the list above

### Scaffold

- [ ] T041 [US2] `scaffold.sh`: `packages/elements/src/{ocelle-tabs,ocelle-tab,ocelle-tab-panel}.ts`; `index.ts`, `browser.ts`; `exports` entries

### Tests (red, one commit)

- [ ] T042 [P] [US2] `packages/elements/test/scenarios/tabs.ts`: US2-1 to US2-23 with pairings (unselected panels have no node, no id reference across a shadow root, keys from panel content not handled, Enter/Space on the selected tab silent), the selected bar on the block-end edge, the focused tab's raised ring read
- [ ] T043 [P] [US2] `packages/elements/test/tabs.test.ts`, `packages/elements/test/browser/tabs.test.ts`, `packages/elements/test/browser/fixtures/tabs.html` (children with no host-written id or `aria-*`, SC-003)
- [ ] T044 [P] [US2] `packages/elements/test/entry-ocelle-tabs.test.ts` (defines tab and panel too), `entry-ocelle-tab.test.ts`, `entry-ocelle-tab-panel.test.ts`; `entry-root.test.ts`
- [ ] T045 [P] [US2] `storybook/stories/tabs.stories.ts` (first selected, another selected, disabled tab, wrapped rows, focused tab, tab with icon) and the story test: #10's full rule set on the tabs stories, no violation and no serious or critical `incomplete` (plant: `aria-labelledby` on every panel); `selection-pairs.test.ts` and `readme.test.ts` gain the tabs
- [ ] T046 [US2] `red.sh 3`

### Implementation (green)

- [ ] T047 [US2] `packages/elements/src/ocelle-tab.ts`, `ocelle-tab-panel.ts`, `ocelle-tabs.ts`: `role="tablist"` on `part="tablist"` with the forwarded name, manual slot assignment per batch, generated ids, `aria-controls` on every paired tab, `aria-labelledby` on the assigned panel only, panel focusability observer (R-03), wrapped rows (FR-022), raised `::after` ring with the host unraised (R-06)
- [ ] T048 [US2] Manifest; README tabs section; CHANGELOG
- [ ] T049 [US2] Baselines for the tabs stories in the pinned container, committed with the reason
- [ ] T050 [US2] Plants recorded in `reviews/phase-3/plants.md`; the gates of T028 one at a time

**Checkpoint**: `tdd-check.sh 3` reports `pass`.

---

## Phase 4: User Story 3 - Choose one of a few options as a toggle group: `ocelle-segmented-choice` (Priority: P3)

**Goal**: US3 scenarios 1 to 19; FR-026 to FR-030; a toolbar of toggle buttons; the joined variant with its internal
`ResizeObserver`, custom states and `accent-strong` lines around the pressed segment; the engine-floor raise.

**Independent Test**: on the strict-CSP fixture, four segments are walked and pressed; the joined variant is measured
at one-row and two-row widths after the observer's delivery; shared lines beside the pressed and a hovered segment
stay `accent-strong` with a focused neighbour on either side.

### Measurement (first)

- [ ] T060 [US3] Measure in Chromium, recorded in `specs/014-selection-input/reviews/phase-4/measure.md`: when the joined group's rounding is settled after a resize relative to `afterResizeDelivery`, re-wrap without a size change (font load, text change), no resize-loop warning (R-06); stop-and-ask per the list above

### Scaffold

- [ ] T061 [US3] `scaffold.sh`: `packages/elements/src/{ocelle-segmented-choice,ocelle-segment}.ts`; `index.ts`, `browser.ts`; `exports`

### Tests (red, one commit)

- [ ] T062 [P] [US3] `packages/elements/test/scenarios/segmented-choice.ts`: US3-1 to US3-19 with pairings (focus-only moves emit nothing, joined: no `style` attribute, shared line not widened, pressed lines not `control-border` also with a focused neighbour), resize measurements, four-sided ring read beside the pressed and a hovered segment, the focused pressed segment beside a later hovered one
- [ ] T063 [P] [US3] `packages/elements/test/segmented-choice.test.ts`, `packages/elements/test/browser/segmented-choice.test.ts`, `fixtures/segmented-choice.html`; `entry-ocelle-segmented-choice.test.ts`, `entry-ocelle-segment.test.ts`; `entry-root.test.ts`
- [ ] T064 [P] [US3] `storybook/stories/segmented-choice.stories.ts` (default, joined one row, joined wrapped, pressed, disabled, focused, icon) and the story test; `selection-pairs.test.ts`; `readme.test.ts` gains the segmented choice and the engine floor Chromium 125 / WebKit 17.4 with `:state()` as the feature (only if the operator confirmed plan decision 1; otherwise stop-and-ask)
- [ ] T065 [US3] `red.sh 4`

### Implementation (green)

- [ ] T066 [US3] `packages/elements/src/ocelle-segment.ts`, `ocelle-segmented-choice.ts`: `toolbar` role, toggle buttons with `aria-pressed`, roving with wrap on both axes, `joined` with the internal `ResizeObserver` on the group and its segments, custom states for rows, `accent-low` fill and block-end bar for the pressed segment, `accent-strong` lines around it, raised `::after` ring, target size
- [ ] T067 [US3] Manifest; README segmented-choice section and engines section; CHANGELOG
- [ ] T068 [US3] Baselines in the pinned container, committed with the reason
- [ ] T069 [US3] Plants recorded in `reviews/phase-4/plants.md`; the gates of T028

**Checkpoint**: `tdd-check.sh 4` reports `pass`.

---

## Phase 5: User Story 4 - Copy a long command through the host: `ocelle-copy-field` (Priority: P4)

**Goal**: US4 scenarios 1 to 12; FR-031 to FR-044; request-only, deferred past the next rendering update; polite live
region; native Copy control with `copy-control` part.

**Independent Test**: on the strict-CSP fixture, a 300-character command wraps at 320 px with no horizontal scroll;
click, Enter and Space each emit one request after the next frame; no clipboard call; a synchronous listener's status
reaches the tree as empty → text.

### Spike (first)

- [ ] T075 [US4] Spike R-07 recorded in `specs/014-selection-input/reviews/phase-5/spike.md`: `Accessibility.nodesUpdated` delivers the empty-region update before the refill for deferred dispatch and not for synchronous dispatch; on a spike page with no clipboard permission granted, the reject control (write with no click) and the resolve control (write in the click handler) hold, then a write from the deferred request is recorded with `navigator.userActivation.isActive`; stop-and-ask per the list above

### Scaffold

- [ ] T076 [US4] `scaffold.sh`: `packages/elements/src/ocelle-copy-field.ts`; `index.ts`, `browser.ts`; `exports`

### Tests (red, one commit)

- [ ] T077 [P] [US4] `packages/elements/test/scenarios/copy-field.ts`: US4-1 to US4-12 with the clipboard observer, the live-region MutationObserver, US4-6's synchronous listener with `activationRecord` and `axUpdates` (plants: synchronous dispatch, microtask dispatch, dispatch in the element's own frame callback), disabled control emits nothing, flush border and target size, `accent-strong` divider against the inset well
- [ ] T078 [P] [US4] `packages/elements/test/copy-field.test.ts`, `packages/elements/test/browser/copy-field.test.ts`, `fixtures/copy-field.html`; `entry-ocelle-copy-field.test.ts` (defines `ocelle-icon` too); `entry-root.test.ts`
- [ ] T079 [P] [US4] `storybook/stories/copy-field.stories.ts` (short, wrapped long command, with a status, empty) and the story test; `selection-pairs.test.ts`; `readme.test.ts` gains the copy field, the `copy-control` surface (box, name, events), the future `ocelle-button` swap as a PATCH (FR-044), and the request outside the click's task with the user-activation note
- [ ] T080 [US4] `red.sh 5`

### Implementation (green)

- [ ] T081 [US4] `packages/elements/src/ocelle-copy-field.ts` (R-07): group role, `part="value"` text, imperative live-region text, native button `part="copy-control"` with `ocelle-icon name="copy"`, deferred request with status cleared first
- [ ] T082 [US4] Manifest; README copy-field section; CHANGELOG
- [ ] T083 [US4] Baselines in the pinned container, committed with the reason
- [ ] T084 [US4] Plants recorded in `reviews/phase-5/plants.md`; the gates of T028

**Checkpoint**: `tdd-check.sh 5` reports `pass`.

---

## Phase 6: User Story 5 - Follow or act on a link in running text: `ocelle-link` (Priority: P5)

**Goal**: US5 scenarios 1 to 14; FR-045 to FR-049; native anchor, plain activations intercepted, navigation only to
allowed resolved protocols.

**Independent Test**: on the strict-CSP fixture, links with and without `href` are activated by Enter and click,
with and without a cancelling listener, with modifiers; events, navigation (window marker) and the tree are read;
the `file:` copy navigates to its `file:` target.

### Spikes (first)

- [ ] T090 [US5] Spikes recorded in `specs/014-selection-input/reviews/phase-6/spike.md`: the `file:` fixture loads the browser build and navigates under `--allow-file-access-from-files` (R-09); the link host with a host `aria-label` exposes exactly one named link (R-08); stop-and-ask per the list above

### Scaffold

- [ ] T091 [US5] `scaffold.sh`: `packages/elements/src/{link-target,ocelle-link}.ts`; `index.ts`, `browser.ts`; `exports`

### Tests (red, one commit)

- [ ] T092 [P] [US5] `packages/elements/test/link-target.test.ts`: `navigationTarget(href, baseURI, documentProtocol)` for `http:`, `https:`, the document's own protocol, `javascript:` padded and tab-split, `data:`, protocol-relative, custom-scheme `<base>`, `""` and fragments (FR-047)
- [ ] T093 [P] [US5] `packages/elements/test/scenarios/link.ts`: US5-1 to US5-14 with "Observing navigation" (fragments in process; cross-document on the fixture; US5-11's base inserted after load; `context.on("page")` for US5-13), modified activations emit nothing, Space not handled, per-fragment focus ring
- [ ] T094 [P] [US5] `packages/elements/test/link.test.ts`, `packages/elements/test/browser/link.test.ts`, `fixtures/link.html`, `fixtures/link-target.html`; `packages/elements/test/browser-file/link-file.test.ts` with `browser-file/fixtures/` (policy in a `<meta>` element; US5-12); `entry-ocelle-link.test.ts`; `entry-root.test.ts`
- [ ] T095 [P] [US5] `storybook/stories/link.stories.ts` (in a paragraph, wrapped across lines, focused, hover via #10's pointer parameter, host label containing the visible text) and the story test asserting no `label-content-name-mismatch` (plant: a label without the visible text); `readme.test.ts` gains the link, the `detail.href` warning and the label-in-name rule
- [ ] T096 [US5] `red.sh 6`

### Implementation (green)

- [ ] T097 [US5] `packages/elements/src/link-target.ts` and `packages/elements/src/ocelle-link.ts` (R-08): `part="anchor"`, `delegatesFocus`, `href` on the anchor only when allowed, `role="link"` and `tabindex="0"` otherwise, plain-activation interception (Alt included) with Enter handled on keydown for anchors without `href`, cancelable event, `location.assign` of the allowed target, host `aria-label` forwarded
- [ ] T098 [US5] Manifest; README link section; CHANGELOG
- [ ] T099 [US5] Baselines in the pinned container, committed with the reason
- [ ] T100 [US5] Plants recorded in `reviews/phase-6/plants.md`; the gates of T028 plus `vitest run --project elements-browser-file`

**Checkpoint**: `tdd-check.sh 6` reports `pass`.

---

## Phase 7: Polish

**Purpose**: cross-element records only.

- [ ] T110 `packages/elements/test/node/readme.test.ts` (red first): the README overview names the nine elements and the entry-point table lists every new specifier (contracts § Entry points)
- [ ] T111 `packages/elements/README.md` overview and entry-point table; `packages/elements/CHANGELOG.md` MINOR entry naming the nine elements, six events and the engine floor
- [ ] T112 If #16 (mission 008) has merged before this feature lands: the composed `ocelle-dialog` + `ocelle-listbox` story with its baselines (FR-054); otherwise record in `reviews/phase-7/notes.md` that 008 adds it
- [ ] T113 Full gate run per `specs/014-selection-input/quickstart.md`, one heavy job at a time; record in `reviews/phase-7/gates.md`

**Checkpoint**: `tdd-check.sh 7` reports `pass` (or the review records the documentation exemption for T111 to T113).

---

## Dependencies & Execution Order

- T001 (recheck against #10) blocks every other task.
- Phase 1 blocks phases 2 to 6 (driver commands and recorders, the file project).
- Phase 2 (US1) blocks phases 3 and 4: it creates `roving.ts`, `selection.ts`, `internals.ts`, the pairs check and the
  token pairs.
- Phases 5 (US4) and 6 (US5) depend only on phase 1 and the conventions, but share the README, the readme test, the
  story test, the manifest and `index.ts`, so phases run in order 2 to 7, one review unit at a time.
- T064's engine-floor statement needs the operator's confirmation of plan decision 1.

## Parallel Opportunities

- Within each red commit, the test files marked [P] touch different files and can be written in parallel.
- Heavy runs (browser suites, plants, mutation, `gate:visual`) never run in parallel.

## Implementation Strategy

- MVP: phases 1 and 2 give a gated, keyboard-complete `ocelle-listbox` for #16's Open project dialog.
- Then tabs (phase 3) and the segmented choice (phase 4) on the same mechanism, the copy field (phase 5) and the
  link (phase 6), each folded after approval; phase 7 closes the cross-element records.
