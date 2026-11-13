# Tasks: Feedback and Forms

**Input**: design documents in `specs/010-feedback-forms/`, as approved at the plan gate on 2026-11-13 after three
plan-squad rounds (`reviews/plan/round-1..3/`):
- spec.md (FR-001 to FR-036, SC-001 to SC-007, the operator decisions at the top);
- plan.md, decisions 1 to 11 and the phase list;
- research.md, R-01 to R-11;
- data-model.md (the notice and form-control state, both transition tables, the alert path);
- contracts/elements.md and contracts/testing.md (capture, driver steps, twins table, plants table);
- quickstart.md.

**Tests**: required. Constitution Principle VIII applies to every phase. The phase flow is `base.sh`, an optional
`scaffold.sh`, one red commit of test files only proven by `red.sh`, then green, `tdd-check.sh` and an independent
review. Every test change of a phase, the README documentation test's assertions included, is in that phase's red
commit (analysis I3, U2); green may complete test infrastructure (the capture, the driver, `test/in-process.ts`) but
adds no assertion. Records that are not test files (`packages/tokens/contrast/pairs.json`, `source.ts`, README text,
manifest, CHANGELOG) change only in green (analysis I1). Expected values are written by hand from the spec and the contracts, never read from the source under test:
announcement counts from the spec's scenarios and the SC-002 matrix, form outcomes from `contracts/testing.md`
§ Twins, colours from the token names the spec names, timing from the literals 150, 350 and 5000 ms.

The guard rules:
- Every announcement assertion states its count once and checks it under both `"settled"` and `"rendered"`
  (`expectAnnouncements`, no condition). A zero count never stands alone: its scenario also asserts the positive
  outcome it guards (the region present, the text visible, the host role).
- Every native-twin comparison also asserts the absolute outcome of the twins table.
- Each plant of `contracts/testing.md` § Plants is a row of `test/plants.test.ts` and is run by the implementer; the
  output goes to `reviews/phase-<n>/plants.md`. A plant that does not make its guard fail stops the phase.

**Shared scenario bodies** (005 R-11): every browser scenario is written once in
`packages/elements/test/scenarios/*.ts` against the driver and run by the in-process `elements` project (element
source, mutated, test timing of decision 11) and the `elements-browser` project (built browser build on strict-CSP
fixture pages, real timing). Fixture runs also assert zero CSP violations, only allowed requests and no console
message.

**Environment**: Node 22 in this container, 26.13.0 in CI. Browser runs set `OCELLE_CHROMIUM_PATH` as
`knowledge/speckit-flows/findings/frontend-missions.md` § Browser path says; one heavy job at a time; never
`git stash`.

**Organization**: Phase 1 is Setup (the capture and driver carry behaviour and go red first). Phases 2 to 4 are User
Stories 1 to 3, one review unit each. Phase 5 is User Story 4 and **starts only after #10 (mission 006) is on `main`
and the R-08 recheck (T060) is done**. Records (README, CHANGELOG, manifest, entry points) belong to the phase whose
behaviour they describe; there is no polish phase. Each phase is folded after its approval.

**Implementation waits for #10** (operator wave planning): no phase starts before #10 is merged.

**Stop-and-ask points**: the implementer stops, records the question in the phase review and does not work around it:
- **T002 spike outcomes**: the capture does not run in process; a region written after `W` does not count one under
  both rules, or one written in a microtask or the first frame counts under `"settled"`; `internals.ariaLive = "off"`
  does not keep a `role="alert"` host from being a live region node; `registerFirstLoad` or the `readyState` drive
  cannot reach the first-load path; a mutation shard over about 7 minutes (plan decisions 1, 7, 11); a node list
  re-recorded by the capture differs from T001's in a field the reading uses (analysis I6).
- **A count figure of R-04 differs** from the line T010 edits.
- **A plant that does not bite.**
- **Any mutation shard over 10 minutes.**
- **A contrast pair that fails** (FR-005; R-04 computed all to pass).
- **#10's merged design differs from R-08** in a way that changes a phase 5 task (T060).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: the user story (US1 to US4)

---

## Phase 1: Setup

**Purpose**: the live-region capture, its oracle, the driver steps and the plants runner, proven before any element.

### Tests (red, one commit)

- [ ] T001 [P] Write the per-rule unit tests of `regionText()` and `announcements()` in `packages/elements/test/live.test.ts`. The reading rules run on `getFullAXTree` node lists in `packages/elements/test/fixtures/ax/`, recorded first, before the tests are written, by a throwaway Playwright script against the pre-installed Chromium on planted regions, one list per rule case (as research's "spike 2026-11-13": the script is not committed; each fixture's header comment names the Chromium version and the planted markup); the keeping rules run on hand-written snapshot sequences. These lists are committed with the red commit and are not replaced or edited afterwards (T002 compares; analysis I6). Rules: StaticText taken; an `img`'s name taken and its descendants not visited; a link's own name skipped and its StaticText children taken; inline text boxes skipped; an ignored subtree contributes nothing; whitespace collapsed and trimmed; the keeping rules (`"rendered"`: a state current in at least one lifecycle snapshot; `"settled"`: rendered and current for at least `D`, 150 ms when `loaded`, 350 ms otherwise) on a state set and cleared in one task, cleared in the first animation frame, and shorter than `D`; the vacuous cases (a region whose text never changes, a region that appears holding text, a nested pair whose texts both change counts two); `expectAnnouncements` asserts both rules with no condition (`contracts/testing.md` § Live-region capture)
- [ ] T001a [P] Write the capture tests in `packages/elements/test/live-capture.test.ts` (in process) and `packages/elements/test/browser/live-capture.test.ts` (fixture pages): `liveCapture.start(containerId)` observes the container subtree and shadow roots attached afterwards (the `attachShadow` patch); `startDocument(url)` sees the document from its first node; snapshots carry `at`, `frame`, `lifecycle`, `loaded`, `regions` and `hosts`; `stop()` waits the derived quiet window (largest `W` + minimum hold + largest `D` + two rendering updates) and `stop({ atLeast })` at least that long; a step over 2000 pauses or 5000 ms fails with "capture exceeded …", on a test-only element that mutates in a loop; each against planted regions under `packages/elements/test/fixtures/`
- [ ] T001b [P] Write the driver-step tests in `packages/elements/test/driver.test.ts` and `packages/elements/test/browser/driver.test.ts`: `insert(containerId, markup, how)` for `innerHTML`, `template`, `domparser` and `createElement`; `laterTask()` puts a removal and an insertion in different tasks; `registerFirstLoad`; `drive.readyState(value)`; `drive.after(ms)` returns no earlier than `ms` after the previous step's end, measured in the page, and the driver's `W` in force for both load states (in process from the one timing constant of `test/in-process.ts`, on fixture pages 300 and 700 ms) so that scenario bodies state times as fractions of it (`contracts/testing.md` § Driver steps; analysis G6); `hostRole(id)` reads the final snapshot's `hosts`; the form helpers `formData`, `submit` (in process: entries recorded by a capture-phase `submit` listener that calls `preventDefault()`, or `null`; fixture: the server's request body, or `null`), `reset`, `type`, `press`, `blur`, `click(id, at)`, `focusPath()`; fixture only: `navigateAwayAndBack()` on a `Cache-Control: no-store` route returns `pageshow.persisted`; each test fails without its step
- [ ] T001c [P] Write `packages/elements/test/plants.test.ts` with its row format and one planted reading row (a `regionText` that takes a link's own name must fail the named T001 unit test), and the `elements-browser` variant for rows that need `startDocument`
- [ ] T001d Commit T001 to T001c as the red commit; `red.sh` shows each failing for the missing capture and driver, not for a syntax or import error

### Spike (after red, before green; stop-and-ask)

- [ ] T002 Run the capture prototype in both harnesses on planted regions and record in `specs/010-feedback-forms/reviews/phase-1/spike.md`: a region written after `W` counts one under both rules; one written in a microtask, or in the first animation frame, counts zero under `"settled"`; `internals.ariaLive = "off"` on a `role="alert"` host keeps its node from being a live region node; `registerFirstLoad` and `drive.readyState` reach the first-load path (name any mutant that stays unreachable); the in-process test `D` (at least two rendering updates); that the timing setter changes the element's and the capture's figures together and returns the timing it replaced; that each test file gets its own `src/live.ts` module instance; the bounds' figures (including the hold scenario at the real `H` on fixture pages); the `elements` dry-run time and a worst-case 60-line `src/live.ts` shard against the 10-minute limit (`.github/workflows/ci.yml:84-89`); the fixture-page suite time at the real figures; the test `D`, below Chromium's 150 ms; T001's node lists re-recorded on the same planted markup and compared field by field with the committed ones (a difference in a field the reading uses is a stop; T001's lists are not changed). The prototype is the capture as drafted for T004 (the recorder, the CDP reading and the browser commands of `packages/elements/test/live.ts`, in the working tree and not committed), run by a spike test file that is not committed either; T004 completes and commits that code. **Stop for the operator** on any outcome listed under Stop-and-ask

### Implementation (green)

- [ ] T003 Implement `packages/elements/test/live-reading.ts` (`regionText`, `announcements`, `expectAnnouncements`) until T001 passes
- [ ] T004 Implement `packages/elements/test/live.ts` (recorder, `start`, `startDocument`, frame hook, `stop` with the derived window and `atLeast`, bounds) and register its browser commands in `packages/elements/vitest.config.ts` beside `axTree`; same code over the fixture page's CDP session in `packages/elements/test/browser/driver.ts`
- [ ] T005 Add the driver steps, `drive.after(ms)` and the `W` in force included, to `packages/elements/test/scenarios/driver.ts`, `packages/elements/test/in-process.ts` and `packages/elements/test/browser/driver.ts`, and the no-store route and submission recorder to `packages/elements/test/browser/serve.ts`, until T001a to T001c pass. `test/in-process.ts` gets the one timing constant of `contracts/testing.md` § Timing (the test `D` of T002, and a test `H`) and gives the capture its `D` from it; it does not call the setter yet, since `src/live.ts` does not exist before phase 2 (T020a)

**Checkpoint**: the capture, driver and plants runner are green; the spike note is committed; no stop condition hit.

---

## Phase 2: User Story 1 - `ocelle-notice` (Priority: P1) 🎯 MVP

**Goal**: the notice of spec User Story 1, with the announcer of R-02.

**Independent test**: the notice scenarios and the SC-002 matrix pass in both harnesses; its plants bite.

### Tests (red, one commit)

- [ ] T010 [P] [US1] Change only the gate tests (`gates/test/**`) for the ink-on-state-ground pairs, each figure as research R-04's table gives it with its file and line: in `gates/test/contrast-required.test.ts` add `[["color-ink"], "text", stateGrounds]` to the A.8 transcription and change 149 → 154 (`:7`, `:58-59`, `:63`) and 298 → 308 (`:67`, `:69`, `:70`); in `gates/test/contrast-pairs.test.ts` 160/168 → 165/173 (`:5`, `:59`, `:61`) and 328 → 338 (`:63`, `:67`); in `gates/test/contrast.test.ts:80-81`, `gates/test/integration/token-gates.test.ts:13,16` and `gates/test/integration/plants-robustness.test.ts:116,128` the summary 160/168/149 → 165/173/154; in `plants-robustness.test.ts:122` 161/168/149 → 166/173/154; in `token-gates.test.ts:6,27` 298 → 308. `packages/tokens/contrast/pairs.json` is not touched here: its rows are T018's (analysis I1, U1)
- [ ] T011 [P] [US1] Write the notice scenario bodies in `packages/elements/test/scenarios/notice.ts` for spec US1 scenarios 1 to 19: 8 and 9 once per way of inserting; 12 and 15 with the focused-link variants; 13 with changes in different tasks 100 ms apart (count 1), `A`, `B`, `A` within the wait (count 0), a change 10 ms after a write and the hold (copy settled for `H`, then emptied); 15 with the `alert` cells (count 0 and host role `alert`), the same-task text, `tone` and role-change cells of PLAN-FRESH-3-002 (b), and inserted or revealed as `alert` then changed to `status` in the same task (count 1, polite, host role `status`); 17 with first loaded hidden then revealed, and announced, hidden and revealed with the same text (count 1 each); styles read as computed token values (`--ocelle-color-<tone>-bg`, `--ocelle-bar-width` marker, `--ocelle-radius-row`, padding of FR-007, heading tokens of FR-006); SC-004's content-box measure on the shadow box; forced colours as FR-010. Also the Edge Cases (analysis G1, G4): removed and inserted again in a later task (`laterTask()`, count 1); whitespace only (`"Saved"` → `" Saved "`, count 0, with the region present and the text visible); an empty notice with no heading (a box with FR-007's padding only, count 0 with `announce` set and the region present); two announcing notices changed in one task (count 1 per host, 2 in all); long unbroken text in the heading and the body inside a container narrower than the text (the host's inline size within the container's, no inline overflow of the box, block size above one line); two copies (a second class defined for `ocelle-notice` through `define` after the module's import leaves the first class, and a notice created afterwards renders and announces as the first). And US1-8 inserted while `readyState` is `"interactive"` (`drive.readyState("interactive")`): an insertion, count 1, its copy written no earlier than the pre-load `W` after the insertion (spec FR-008, analysis A1). Attributes (analysis G5): `tone="bogus"` and `size="huge"` stay in the attribute as written while `tone` reads `"info"` and `size` reads `"regular"` (FR-001)
- [ ] T012 [P] [US1] Write the SC-002 matrix as a table-driven body in `packages/elements/test/scenarios/notice-matrix.ts`: five tones × triggers (insertion, reveal, text change, politeness change) and non-triggers (first load, same text, re-render, move, `announce` set later, change while hidden) × the no-role, `alert` and `status` rows, one expected count per cell written by hand, no conditional assertion; politeness change and "`announce` set later" read per row as SC-002 says
- [ ] T013 [P] [US1] Wire the bodies in `packages/elements/test/notice.test.ts` (in process) and `packages/elements/test/browser/notice.test.ts` (fixture pages, first-load cells under `startDocument`); first-load cells in process under `registerFirstLoad` and `drive.readyState`
- [ ] T014 [P] [US1] Write `packages/elements/test/live-timing.test.ts`: the timing returned by the setter's first call and `announcerDefaults` equal `{ delayLoaded: 150, delayLoading: 350, hold: 5000 }` written as literals; and the `test/node/` check that only `packages/elements/test/in-process.ts` calls the setter, in `packages/elements/test/node/timing-setter.test.ts`
- [ ] T014a [P] [US1] Write `packages/elements/test/in-process-timing.test.ts` (the `elements` project, through the driver's per-scenario setup): the capture's `D` for both load states equals the timing constant `test/in-process.ts` exports, and an announcing notice inserted after load has its copy written no earlier than `2 × delayLoaded` of that constant after the insertion and before Chromium's 300 ms, so element and oracle take their timing from the one constant (analysis G7)
- [ ] T015 [P] [US1] Write `packages/elements/test/entry-notice.test.ts` (importing `ocelle-notice.js` defines `ocelle-notice` and no other tag) and add the notice to `packages/elements/test/entry-root.test.ts` and `packages/elements/test/exports.test.ts`
- [ ] T016 [P] [US1] Add the notice's plant rows to `packages/elements/test/plants.test.ts` with their fixtures in `packages/elements/test/fixtures/notice-plants.ts`: every row of `contracts/testing.md` § Plants whose "must turn red" names US1, SC-002, `live-timing`, the first-load paths or a notice Edge case (the "later task" and "text baseline" rows run the Edge-case bodies T011 writes; analysis G1)
- [ ] T016a [P] [US1] Extend `packages/elements/test/node/manifest.test.ts` for the notice's entry: attributes and properties `tone`, `size`, `announce` with types and defaults of `contracts/elements.md`, slots `heading` and default, parts `heading` and `body`, events and CSS custom properties each an empty list, and neither `role` nor `hidden` declared as an attribute (FR-034; analysis I2)
- [ ] T016b [P] [US1] Extend `packages/elements/test/node/readme.test.ts` with the phase 2 README items, each asserted by the text T024 writes (analysis U2, I3): the `ocelle-notice` section naming its attributes, slots and parts and the tokens it reads; the entry point `@ocelle/elements/ocelle-notice.js`; what "announced" covers in the tests (accessibility tree, not a screen reader); the announcer, `W` and its source; merging and starvation; `H` as a chosen figure not measured, and the double reading for up to `H`; the platform alert event and its source, with the WebKit limit for live regions; the end-of-task alert baseline and its later-task double reading, with the advice to set the text first; the same-task change back to `status`; the hidden-ancestor reveal for `role="alert"` and that only the host's own `hidden` counts; unsupported host roles and attributes; first load and loading the build before swaps; icon-only heading absent; unspecified announced text for other slotted content. And the `packages/elements/CHANGELOG.md` line under Unreleased naming the notice, its attributes, properties, events, slots and parts as new (FR-036). Each assertion checks text this phase adds, so it fails before T024 and the CHANGELOG line; the engine floor's existing assertions (`readme.test.ts:65-71`) stay as they are
- [ ] T017 [US1] Commit T010 to T016b as the red commit; `red.sh` shows the failures are the missing element, records, timing, manifest entry and README items, not setup errors

### Implementation (green)

- [ ] T018 [US1] Add the state grounds to `color-ink`'s contrast grounds in `packages/tokens/src/source.ts` (`:43`, and the count comment at `:4`, 149 → 154), the ten rows to `packages/tokens/contrast/pairs.json` (the only task that touches it), and update the count comment in `gates/bin/contrast.ts:116` (165/173/154) until T010 passes (R-04; no token value changes)
- [ ] T019 [US1] Add the registration flag to `packages/elements/src/define.ts` (an element upgraded during its own `customElements.define` call counts as first load; R-02)
- [ ] T020 [US1] Implement `packages/elements/src/live.ts`: `announcerDefaults = { delayLoaded: 150, delayLoading: 350, hold: 5000 }`, the test-only timing setter returning the timing it replaced, first-load and move detection (module `MessageChannel`), and the announcer of R-02 and data-model.md (hidden atomic live region, wait `W` = 2 × `D` restarted by each trigger, baseline re-check for change-only waits, baseline none on insertion and reveal, hold `H` or until the next announcement but at least `W`, the alert path with the end-of-task baseline step that does nothing once the pending marker is reset)
- [ ] T020a [US1] Wire `packages/elements/test/in-process.ts`: before each scenario call `setAnnouncerTimingForTests` of `src/live.ts` with the timing constant T005 added (the one that sets the capture's `D`), and keep the timing its first call in the file returned, read-only, for `test/live-timing.test.ts`; until T014 and T014a pass (`contracts/testing.md` § Timing; analysis G7)
- [ ] T021 [US1] Implement `packages/elements/src/ocelle-notice.ts` per contracts/elements.md and data-model.md: `tone`, `size`, `announce` (reflected, unknown attribute kept, property reads the default), slots `heading` and default, parts `heading` and `body`, the shadow box with normalised classes (R-03), heading absence (FR-006), host `role` and `hidden` observed, `internals.ariaLive = "off"` for `alert`/`status` hosts, token-only static styles with `:host([hidden]) { display: none; }` and variant rules inside `@media not (forced-colors: active)`
- [ ] T022 [US1] Register `ocelle-notice` in `packages/elements/src/index.ts` and `packages/elements/src/browser.ts`, add `./ocelle-notice.js` to `packages/elements/package.json` exports (alphabetical by tag, R-11)
- [ ] T022a [US1] Add `role` and `hidden` to the drop list of observed standard attributes in `packages/elements/scripts/manifest.ts` (beside `aria-label`) until T016a passes (FR-034; analysis I2)
- [ ] T023 [US1] Run the notice plants; record the output in `specs/010-feedback-forms/reviews/phase-2/plants.md`
- [ ] T024 [US1] README section `ocelle-notice` in `packages/elements/README.md` with every item plan phase 2 lists (announcer, `W` and its source, merging and starvation, `H` as a chosen figure, double reading for up to `H`, the platform alert event and its source, the end-of-task alert baseline and its later-task double reading, set text first, same-task change back to `status`, hidden-ancestor reveal for `role="alert"`, unsupported host roles and attributes, first load and loading the build before swaps, icon-only heading absent, unspecified announced text for other slotted content, the engine floor checked unchanged against the features phase 2 uses, recorded in the phase review) until T016b passes
- [ ] T025 [US1] Regenerate `packages/elements/custom-elements.json` (`pnpm --filter @ocelle/elements run manifest`) after T022a, so it declares neither `role` nor `hidden`, add the CHANGELOG line in `packages/elements/CHANGELOG.md` (MINOR), and run the phase-end gates of plan.md

**Checkpoint**: User Story 1 works on its own; the MVP.

---

## Phase 3: User Story 2 - `ocelle-form-input` (Priority: P2)

**Goal**: the form-control convention (FR-020 to FR-028) and the input.

**Independent test**: the input scenarios and twins pass in both harnesses; its plants bite.

### Tests (red, one commit)

- [ ] T030 [P] [US2] Extend `packages/elements/test/node/manifest.test.ts`: the generator folds `src/form-control.ts`'s members into each subclass's entry without a new kind of source path (#27), declares `focus()`, and drops the observed standard attributes `form`, `aria-invalid`, `aria-required`, `aria-disabled`, `aria-description` from the form elements' entries, beside `aria-label`, `role` and `hidden` already dropped in phase 2 (T022a) and asserted again here (PLAN-CORRECTNESS-1-004, FR-034)
- [ ] T031 [P] [US2] Write `packages/elements/test/scenarios/form-input.ts` for spec US2 scenarios 1 to 23: 20 once per way of inserting; 21 with the mixed form; 22 with first loaded hidden then revealed and with announced, hidden and revealed with the same `error` (count 1 each); 13 with the exact names, the label text once, the host's duplicate name and description pinned (decision PLAN-A11Y-SECURITY-1-005 (b)) and the `aria-label` containing the visible label (1-006 (b)); 23 with host `"true"` combined and `"false"` unsupported (1-006 (a)); FR-027's merge (two `error` changes 100 ms apart count 1; `A`, `B`, `A` count 0); styles as computed token values of FR-025 and FR-028; `display: block` and fill (scenario 19). Also: `font: inherit` (FR-002; analysis G3): with a distinctive font family, size, weight and line height set on the host, the inner field's computed values equal the host's. Properties and attributes (FR-001, FR-021, FR-029; analysis G5): each pass-through attribute reflects to its property and back, and reaches the inner field unchanged; `readOnly` is a boolean, `minLength` and `maxLength` numbers, the others strings; each absent reads `undefined` and the inner field has no such attribute, and with no `maxlength` a 600-character typed value is kept whole; `"defaultValue" in host` is false; `type="bogus"` stays in the attribute while `type` reads `"text"` and the inner input's `type` is `text`. Edge Cases (analysis G4): `type="number"` with a typed text the native number input cannot parse (the same keys typed into a native twin, for example `1e`), `value` `""` and `badInput` true on both; long unbroken text in the label, description and error inside a narrow container (the host's inline size within the container's, no inline overflow, block size grows); `dir="rtl"` on an ancestor, the label, field, description and error follow the inline direction (computed `direction` `rtl`, the label's and error's inline start at the right edge of the host's content box); two copies (a second class defined for `ocelle-form-input` through `define` after the module's import leaves the first class, and an element created afterwards is in its form's data)
- [ ] T032 [P] [US2] Write the twin bodies in `packages/elements/test/scenarios/form-twins.ts` from `contracts/testing.md` § Twins: each row asserts element equals native twin and each side equals the table's absolute outcome; history restore rows on fixture pages only; the in-process restore test calls `formStateRestoreCallback(state, "restore")` directly; the `form="other"` and outside-any-form rows (FR-020, Edge Cases; analysis G2)
- [ ] T033 [P] [US2] Wire them in `packages/elements/test/form-input.test.ts` and `packages/elements/test/browser/form-input.test.ts`; write `packages/elements/test/entry-form-input.test.ts`; add the input to `entry-root.test.ts` and `exports.test.ts`
- [ ] T034 [P] [US2] Add the form, naming, error, host ARIA, change event, implicit submission, validity and form value plant rows to `packages/elements/test/plants.test.ts` with fixtures in `packages/elements/test/fixtures/form-input-plants.ts`
- [ ] T034a [P] [US2] Extend `packages/elements/test/node/readme.test.ts` with the phase 3 README items, each asserted by the text T041 writes (analysis U2, I3): the "Form controls" section with every item of FR-020 to FR-028 (SC-006: how a form-like element takes part in forms, names its control and shows an error, as the convention #14 follows); the `ocelle-form-input` section naming its attributes, properties, event, parts and the tokens it reads; the entry point `@ocelle/elements/ocelle-form-input.js`; host ARIA `"true"` only; `aria-label` containing the visible label; the host's duplicate name and description; host `aria-labelledby` and `aria-describedby` not supported; the `form` attribute; the mixed-form Enter limitation; the htmx trigger `ocelle-form-input-change` (or `input`); first-load error advice; the not-yet-upgraded state and the host rule of R-10; form controls not supported on state grounds; the limits not measured (autofill restore, the validation message's anchor, the `email` keyboard hint, `password` masking); the WebKit limitation for form association and `ElementInternals`. And the `packages/elements/CHANGELOG.md` line under Unreleased naming the input, its attributes, properties, events, slots and parts as new (FR-036). Each assertion checks text this phase adds, so it fails before T041 and the CHANGELOG line
- [ ] T035 [US2] Commit T030 to T034a as the red commit; `red.sh`

### Implementation (green)

- [ ] T036 [US2] Change `packages/elements/scripts/manifest.ts` and `packages/elements/custom-elements-manifest.config.mjs` until T030 passes
- [ ] T037 [US2] Implement `packages/elements/src/form-control.ts` (R-05, R-06): `formAssociated`, `attachInternals`, open shadow root with `delegatesFocus`; `name`, `label`, `description`, `error`, `required`, `disabled` reflected; `form`, `labels`, `validity`, `validationMessage`, `willValidate`, `checkValidity()`, `reportValidity()`, `focus()`; `setFormValue(value, value)` (or `null` without `name` or when effectively disabled); validity mirrored after every change; `formResetCallback`, `formStateRestoreCallback`, `formDisabledCallback`; naming by `aria-labelledby` to a `hidden` span in FR-022's order, recomputed on connect, attribute changes, `focusin` and label text change; description by `aria-describedby` (description, host `aria-description`, error); host `"true"` ARIA combination; the error announcer from `src/live.ts` with whitespace normalisation and the cleared baseline
- [ ] T038 [US2] Implement `packages/elements/src/ocelle-form-input.ts`: `type` (unknown reads `text`), the pass-through attributes of FR-029 with native camel-case properties, the `value` attribute as default value with dirtiness, `ocelle-form-input-change` with `{ value }` (`bubbles`, `composed`) on each committed change and never for script, reset or restore; Enter handled with `preventDefault()` on the keydown and HTML's implicit-submission rule (FR-030, PLAN-CORRECTNESS-1-002); token-only styles of FR-025 and FR-028 with forced-colours rules
- [ ] T039 [US2] Register in `src/index.ts`, `src/browser.ts` and `package.json` exports; regenerate the manifest
- [ ] T040 [US2] Run the input plants; record in `specs/010-feedback-forms/reviews/phase-3/plants.md`
- [ ] T041 [US2] README "Form controls" and `ocelle-form-input` sections in `packages/elements/README.md` (FR-020 to FR-028 items, host ARIA `"true"` only, `aria-label` containing the visible label, the host's duplicate name and description, mixed-form Enter limitation, htmx triggers, first-load error advice, not-yet-upgraded state and the host rule of R-10, autofill and other unmeasured limits, WebKit) until T034a passes; the engine floor checked unchanged against the features phase 3 adds (form-associated custom elements and `ElementInternals` with its ARIA properties, `delegatesFocus`, the form-associated callbacks), each compared with the README's floor figures and recorded in `specs/010-feedback-forms/reviews/phase-3/`, and a feature newer than the floor stops for the operator (plan decision 2; analysis G8); CHANGELOG line; phase-end gates

**Checkpoint**: User Stories 1 and 2 work independently.

---

## Phase 4: User Story 3 - `ocelle-form-select` (Priority: P3)

**Goal**: the select on the same convention.

**Independent test**: the select scenarios and twins pass in both harnesses; its plants bite.

### Tests (red, one commit)

- [ ] T050 [P] [US3] Write `packages/elements/test/scenarios/form-select.ts` for spec US3 scenarios 1 to 9 and the shared cases of scenario 7 (reusing the US2 bodies with the select's tag), the select's twin rows in `packages/elements/test/scenarios/form-twins.ts`, and the indicator: drawn from `chevron-down` in `currentColor`, decorative, visible in forced colours, at the inline end in both directions, and a click on it opens the native select's focus path (`pointer-events: none`). Also: the select's `form="other"` and outside-any-form twin rows (analysis G2); `font: inherit` on the inner select as T031 checks it (FR-002; analysis G3); a host `value` attribute ignored (the selection and `value` follow the option marked `selected`), `"defaultValue" in host` false (FR-021; analysis G5); no `<option>` children (an empty native select, `value` `""`, and with `required` `valueMissing` true); a long unbroken label inside a narrow container (as T031); `dir="rtl"` for the label, description and error as T031 (analysis G4)
- [ ] T051 [P] [US3] Wire them in `packages/elements/test/form-select.test.ts` and `packages/elements/test/browser/form-select.test.ts`; write `packages/elements/test/entry-form-select.test.ts` (defines `ocelle-form-select` only, PLAN-CORRECTNESS-1-003 (a)); add to `entry-root.test.ts` and `exports.test.ts`
- [ ] T052 [P] [US3] Add the option-mirroring and indicator plant rows to `packages/elements/test/plants.test.ts` with fixtures in `packages/elements/test/fixtures/form-select-plants.ts`
- [ ] T052a [P] [US3] Extend `packages/elements/test/node/readme.test.ts` with the phase 4 README items, each asserted by the text T057 writes (analysis U2, I3): the `ocelle-form-select` section naming its attributes, properties, event, parts and the tokens it reads with `icon-size`; options from light-DOM `<option>` and `<optgroup>`; the ignored `value` attribute; the unmeasured list opening; the htmx trigger `ocelle-form-select-change` (or `input`); the entry point `@ocelle/elements/ocelle-form-select.js`. And the `packages/elements/CHANGELOG.md` line under Unreleased naming the select, its attributes, properties, events, slots and parts as new (FR-036). Each assertion checks text this phase adds, so it fails before T057 and the CHANGELOG line
- [ ] T053 [US3] Commit T050 to T052a as the red commit; `red.sh`

### Implementation (green)

- [ ] T054 [US3] Move the icon drawing (the shape-to-SVG rendering) into `packages/elements/src/icon-svg.ts`, used by `packages/elements/src/ocelle-icon.ts` (the icon data stays in `src/icons.ts`), with the existing icon tests green and the manifest unchanged for `ocelle-icon`
- [ ] T055 [US3] Implement `packages/elements/src/ocelle-form-select.ts` (R-07): native `<select part="control">` with no slot, options mirrored from light-DOM `<option>`/`<optgroup>` by a `MutationObserver` (childList, subtree, attributes `value`, `label`, `selected`, `disabled`, characterData), selection by the dirtiness rule, host `value` attribute ignored, `ocelle-form-select-change`, the chevron (icon data `iconOf("chevron-down")` from `icons.ts`, drawn by `icon-svg.ts`; analysis I4) at the inline end with `pointer-events: none`, `appearance: none`, token-only styles reading `--ocelle-icon-size`
- [ ] T056 [US3] Register in `src/index.ts`, `src/browser.ts` and `package.json` exports; regenerate the manifest; run and record the plants in `specs/010-feedback-forms/reviews/phase-4/plants.md`
- [ ] T057 [US3] README `ocelle-form-select` section (tokens read with `icon-size`, options, ignored `value` attribute, unmeasured list opening, htmx trigger) until T052a passes; the engine floor checked unchanged against the features phase 4 adds (the select's `appearance: none`, logical properties for the indicator, the option `MutationObserver`), recorded in `specs/010-feedback-forms/reviews/phase-4/`, a feature newer than the floor a stop for the operator (plan decision 2; analysis G8); CHANGELOG line; phase-end gates

**Checkpoint**: all three elements work independently.

---

## Phase 5: User Story 4 - Stories, baselines, axe and records (Priority: P4)

**Goal**: spec User Story 4 on #10's harness.

**Starts only after #10 is on `main`.**

### Recheck (first; stop-and-ask)

- [ ] T060 [US4] Merge `main` into the branch (never rebase) and compare #10's merged contributor note, `contracts/gates.md` and `contracts/container.md` with research R-08 (story location, render helper, pointer parameter, baseline naming and command, `closed-shadow-root`, `font` and `outside-root` rules, whether a focused state from `autofocus` survives the capture); record the result in `specs/010-feedback-forms/reviews/phase-5/recheck.md`. **Stop for the operator** if a difference changes a task of this phase

### Tests (red, one commit)

- [ ] T061 [US4] Extend `storybook/test/integration/elements-stories.test.ts`: the index holds a story for each notice tone, each size, with and without a heading, and an announcing notice; for each form element the empty, placeholder, filled, with description, with error, required, disabled, read-only (input only) and focused states, and the select with option groups; hover declared with #10's pointer parameter; commit as red; `red.sh`

### Implementation (green)

- [ ] T062 [P] [US4] Write `storybook/stories/notice.stories.ts`
- [ ] T063 [P] [US4] Write `storybook/stories/form-input.stories.ts`
- [ ] T064 [P] [US4] Write `storybook/stories/form-select.stories.ts`
- [ ] T065 [US4] Produce the baselines with `pnpm run visual:update` in the pinned container and commit `storybook/baselines/*.png`; `pnpm run gate:storybook-build`, `gate:visual` and `gate:axe` green (SC-005)
- [ ] T066 [US4] Check, without changing `packages/elements/test/node/readme.test.ts`, that it asserts every item of FR-035 and SC-006: record in `specs/010-feedback-forms/reviews/phase-5/readme-map.md` each item, its assertion and the red commit (T017, T035 or T053) whose `red.sh` run showed it failing. Phase 5 adds no README item and no README assertion (analysis U2); an item found without an assertion stops the phase for the operator, since an assertion added now could not be seen failing. Phase-end gates

**Checkpoint**: every story has baselines in light and dark and no serious or critical axe finding.

---

## Dependencies & Execution Order

- Phase 1 blocks everything (the capture and driver every scenario uses; the T002 stop). Within it, T001's node lists
  are recorded before T001 is written, and T002 compares them after the red commit.
- Phase 2 (US1) needs Phase 1. Its `src/live.ts` and `src/define.ts` are used by Phase 3.
- Phase 3 (US2) needs Phase 2's `src/live.ts`; it establishes `src/form-control.ts` for Phase 4.
- Phase 4 (US3) needs Phase 3.
- Phase 5 (US4) needs Phases 2 to 4 and #10 on `main`.
- Within a phase: red commit, then green in task order; [P] tasks of the red step touch different files.

## Parallel Opportunities

- Phase 1: T001, T001a, T001b, T001c (different files).
- Phase 2: T010 to T016b (gate tests, scenarios, matrix, wiring, timing, in-process timing, entry, plants, manifest
  and README tests).
- Phase 3: T030 to T034a. Phase 4: T050 to T052a. Phase 5: T062 to T064.

## Implementation Strategy

MVP first: Phase 1 then Phase 2 gives a usable `ocelle-notice` (28 uses in kitty-mission-ui). Phases 3 and 4 add the
form controls on one convention #14 reuses. Phase 5 adds stories and baselines once #10's harness is on `main`. Each
phase is reviewed and folded before the next starts.
