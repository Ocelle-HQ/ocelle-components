# Tasks: Data Display, First Slice (Facts, Empty State, Progress)

**Input**: design documents in `specs/013-data-display/`, approved at the plan gate on 2026-11-13 after three plan-squad
rounds (`reviews/plan/round-1..3/`) and the plan-gate decisions in `reviews/plan/operator-gate.md`:
- spec.md: FR-001 to FR-058, SC-001 to SC-007, and US1 to US3 with their scenarios;
- plan.md: its Decisions and § Phases;
- research.md: R-01 to R-11;
- data-model.md;
- contracts/elements.md: the public surface;
- contracts/checks.md: bodies, oracles, plants, driver additions, scaffold, story test, styles tests and gates;
- quickstart.md;
- spike/RESULTS.md.

**Tests**: required. Constitution Principle VIII applies to every phase.

**Phase flow**: `base.sh`, then `scaffold.sh` (phases 1 to 3), then one red commit of test files only proven by
`red.sh`, then green, `tdd-check.sh` and an independent review. Following operator decision I3, the story-test
extension for each phase is written in that phase's red commit, before green, and `red.sh` keeps one red record per
phase.

**Red log**: the red log is checked per body, not only by exit code (contracts/checks.md § Scenario bodies). A body
that passes in the red run is a finding: its oracle is changed before green.

**Expected values**: written by hand from the spec, data-model and research, never read from the source under test.
Token values come from `packages/tokens/src/source.ts`, through the token names the spec names.

**Guard rules**:
- A "does not" assertion never stands alone: it shares its body with the positive assertion it guards.
- Each named plant (contracts/checks.md § Oracles and § CSS-only behaviours) is run once by the implementer and
  recorded in `reviews/phase-N/plants.md`.
- A plant that does not make its guard fail stops the phase (stop-and-ask).

**Shared scenario bodies** (R-08, contracts/checks.md § Scenario bodies):
- Every browser scenario is written once in `packages/elements/test/scenarios/*.ts` against the `Driver` interface.
- Each runs in two harnesses: in process (`elements`, mutated) and on the built browser build on the strict-CSP
  fixture (`elements-browser`).
- Fixture runs also assert zero CSP violations, only allowed requests and no console message.

**Environment**:
- Node 22 in this container, 26.13.0 in CI. Browser runs set `OCELLE_CHROMIUM_PATH` as the elements README says.
- Baselines come from `pnpm run visual:update` in #10's pinned linux/amd64 container (`storybook/visual/container.json`).
- One heavy job (browser suites, mutation, plants, visual capture) at a time. Never `git stash`.

**Dependencies**: no phase needs #15 merged, and #10 is merged on `main` and merged into this branch. Phases run in
order 1 → 2 → 3 → 4:
- Phase 2 needs only phase 1's driver additions.
- Phase 3 extends phase 2's US2-7 body.
- Phase 4 is documentation and gate runs.

**Stop-and-ask points**: the implementer stops, records the question in the phase review and does not work around it:
- **T001 (phase 1 spike)**:
  - the A5 structure under Lit 3.3.3 or axe-core 4.14.0 fails FR-004, or an empty `<dt>` is not exposed as a term
    (PLAN-CORRECTNESS-1-014 (b));
  - the two-column measure shows a state dependence that the cheap triggers do not cover and that is not one of the
    unobserved changes FR-009 is narrowed for (R-02);
  - a flip raises the `ResizeObserver` loop error.
- **T035 (phase 3 spike)**: no platform read exposes `valuetext`. US3-3 goes to the operator (R-05).
- **R-11 inventory**: a phase's `.sk-*` family is missing from research R-11 before that phase's red commit, or has a
  variant that no element or variant covers (Decision 5, operator: "proceed, inputs later").
- **Plants**: a plant that does not bite.
- **axe**: the `axe` gate fails on a new story in a way that would need a `storybook/a11y-exceptions.json` entry.
- **Baselines**: `visual:update` reports a changed or removed baseline.
- **Mutation**: any mutation shard over 10 minutes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task).
- **[Story]**: the user story of the task (US1 to US3).
- Paths are relative to the repository root.

---

## Phase 1: User Story 1 - A label and value sheet without classes (Priority: P1) 🎯 MVP

**Goal**: `ocelle-facts` and `ocelle-fact`, covering:
- US1 scenarios 1 to 12;
- FR-001 to FR-013 for facts, FR-050 to FR-058 for facts;
- the `token-only` grid-function allowance (R-10);
- `base.css`'s compact-region hooks and pre-upgrade rule (R-07);
- the phase's driver additions, the facts stories and their baselines.

**Independent Test**: on the strict-CSP fixture, `<ocelle-facts>` with five `ocelle-fact` children (one a
64-character identifier with `wrap="anywhere"`) passes these checks:
- at 1280 px, two columns sharing one label column;
- at 320 px, one column with the page scroll width equal to the viewport width;
- the Chromium AX tree is one description list with term and definition pairs in source order;
- zero violations;
- `gate:manifest`, `gate:style-lint`, `gate:storybook-build`, `gate:visual` and `gate:axe` pass.

### Spike (first)

- [ ] T001 [US1] Spike before the scaffold, scratch files only, recorded in `specs/013-data-display/reviews/phase-1/spike.md`. Every item is per plan § Phases 1 and research R-01/R-02:
  - the A5 structure built with Lit 3.3.3 (`createRenderRoot` with `slotAssignment: "manual"`, `slot.assign()` in `updated()`): the Chromium AX tree, axe-core 4.14.0 (`definition-list`, `dlitem`, full run) and whether an empty `<dt>` stays a term node;
  - the two-column measure with its probes, in a `showModal()` dialog, a popover, a float, a default flex item, a flex row with a 400 px fixed sibling, a grid `auto` track and a table cell:
    - FR-009's bound;
    - a short sheet in a dialog at 1280 px, stacked without `layout` and two columns with `layout="columns"`;
    - the "Created by op" / "Ada Lovelace and Charles Babbage" sheet loaded at 360 px then widened to 1200 px;
    - whether a flip raises the `ResizeObserver` loop error;
  - the round 3 cases: widen, relabel from "Id", and value text changed in place, each against a fresh load, with the content fixed so it crosses the threshold in this harness's fonts; and with the extra triggers removed, both named cases stay stacked;
  - the unobserved changes: a fixed flex sibling shrunk, a grid neighbour removed, a table column widened, a dialog reopened at another width, a late web font, each against a fresh load. The cases that differ are FR-009's narrowing, recorded into research R-02 § Changes the pass does not observe;
  - the 300 → 290 px measure-pass case;
  - the probes with an invalid (`24 rem`), a percentage and a 0 hook, valid 15rem and 40rem hooks, and a hook changed at a fixed 450 px width;
  - the `layout` settle wait in both harnesses;
  - right-to-left;
  - the `data-ocelle-density="compact"` hooks in Chromium.

  Any failing FR-004 result or unexplained state dependence stops for the operator.

### Scaffold

- [ ] T002 [US1] Scaffold commit (no behaviour, constitution VIII exemption stated in the phase review), recorded by `.specify/extensions/story/scripts/scaffold.sh 1`:
  - `packages/elements/src/ocelle-fact.ts` and `packages/elements/src/ocelle-facts.ts`, each with `define`, `@tagname`, the declared properties of contracts/elements.md (`label`, `wrap`; `density`, `layout`), each `| undefined` with `@default undefined`, and an empty `render()`;
  - `ocelle-facts.ts` imports `./ocelle-fact.ts` (PLAN-CORRECTNESS-1-012 (a));
  - exports in `packages/elements/src/index.ts`, `src/browser.ts` and `packages/elements/package.json` `exports` (`./ocelle-facts.js`, `./ocelle-fact.js`);
  - no test file.

### Tests (red, one commit, test files only)

- [ ] T003 [P] [US1] Driver additions `viewport`, `scrollWidth`, `layout`, `copy`, `move`, `text`, as contracts/checks.md § Driver additions specifies:
  - declared in `packages/elements/test/scenarios/driver.ts`;
  - implemented in `packages/elements/test/in-process.ts` and `packages/elements/test/browser/driver.ts`;
  - their own tests in `packages/elements/test/commands.test.ts` and the driver tests. Behaviour to test: `layout` polls once per frame until two equal frames and fails after 10; `copy` returns the copy event's `text/plain`; `text` makes a `characterData` change.
- [ ] T004 [US1] `packages/elements/test/scenarios/facts.ts`: the facts scenario bodies with the oracles of contracts/checks.md § Oracles (Facts). Every "does not" is paired:
  - US1 scenarios 1 to 10 as shared bodies:
    - US1-6 asserts the AX description list and the flat-tree `<dl>` children (`<dt>`/`<dd>` alternating, one pair per visible fact);
    - US1-6, US1-7, US1-10 and the reorder body read `axSubtree` with a distinct value per pair;
    - US1-3 and US1-4 use the 64-character identifier, with the copy oracle;
    - US1-1 to US1-3 and US1-9 use the `layout` wait;
    - US1-8 checks forced colours with system colours read beside the token colours;
    - the FR-011 link sits inside the value column.
  - US1-11, the `layout` property (FR-013): a short sheet in a dialog at 1280 px, one column without `layout` and two columns with `layout="columns"`; `stacked` in a 600 px block; `columns` at 320 px with no page overflow; `layout="grid"` acts as unset; removing `layout` returns to automatic.
  - US1-12's re-decide bodies (widen, relabel, value text, each compared with a fresh load), with the content T001 fixed.
  - The 300 → 290 px measure-pass body.
  - The unobserved-change bodies for each case T001 recorded: `layout="columns"` and an inline size, each paired with a fresh load.
- [ ] T005 [US1] `packages/elements/test/scenarios/facts.ts` (continued): the extra facts bodies of contracts/checks.md § Extra scenario bodies:
  - dynamic add, remove, reorder and label change;
  - hidden facts: at first render, toggled after render, and `aria-hidden="true"`;
  - `lang` on a fact, read from its `<dt>`;
  - right-to-left columns;
  - the 640 px "200% zoom" case;
  - a standalone `ocelle-fact` with `wrap="anywhere"` (value wraps anywhere, label between words);
  - a fact moved into and out of `ocelle-facts`;
  - a non-`ocelle-fact` child is hidden;
  - the shrink-to-fit and shared hosts, with FR-009's bound and widen-after-load;
  - the resize body (600 → 300 → 600);
  - the hook fallbacks at 320 px, and the probe-overflow body;
  - the valid-hook bodies (15rem at 300 px gives two columns, 40rem at 600 px gives one column);
  - the hook changed at 450 px with no resize;
  - the compact-region bodies (14 px and 1.5 in a compact region, 17 px and 1.45 in a nested regular region, `density="compact"` alone with 17 px and a row gap of `--ocelle-space-1`);
  - unset properties write no attribute (`density`, `layout`, `label`, `wrap`).
- [ ] T006 [P] [US1] Test files for facts:
  - `packages/elements/test/facts.test.ts`: the in-process harness over T004/T005;
  - `packages/elements/test/browser/facts.test.ts`: the fixture harness over T004/T005, which also asserts zero violations, allowed requests and no console message;
  - `packages/elements/test/entry-facts.test.ts`: importing `src/ocelle-facts.ts` alone defines `ocelle-facts` and `ocelle-fact` and no other element;
  - `packages/elements/test/entry-fact.test.ts`: importing `src/ocelle-fact.ts` defines `ocelle-fact` only;
  - `packages/elements/test/entry-root.test.ts`: extended to the two tags and their exported classes.
- [ ] T007 [P] [US1] `packages/elements/test/build/build.test.ts`: the container import rule. `dist/ocelle-facts.js` imports `./ocelle-fact.js` and no other element module, and `dist/ocelle-fact.js` imports no element module (PLAN-CORRECTNESS-1-012 (a)).
- [ ] T008 [P] [US1] `gates/test/` `token-only` unit tests for the R-10 grid allowance, plus the `gates/README.md` statement test:
  - `fit-content(<percentage>)` and `minmax(0, <flex>)` in `grid-template-columns` pass;
  - other arguments, other properties, and nested functions are each a finding.
- [ ] T009 [P] [US1] `@ocelle/styles` tests (contracts/checks.md § `@ocelle/styles` tests):
  - `packages/styles/test/browser/compact.test.ts`: the facts hooks inside compact and nested regular regions;
  - a browser test on an undefined `ocelle-facts`: each `ocelle-fact` is a block; a `hidden` child computes `display: none`, has no client rects and is absent from `innerText`; the rule stops matching once the elements are defined;
  - `packages/styles/test/readme.test.ts`: statements for both rules.
- [ ] T010 [P] [US1] `packages/elements/test/node/readme.test.ts`: statements for the `ocelle-facts` section, one assertion per statement:
  - usage, `layout` and the threshold hook `--ocelle-facts-stack-below` (absolute lengths only, with the fallback);
  - FR-009's narrowing as recorded by T001;
  - only `ocelle-fact` children; the wrap policy; digests are the consumer's; compact regions; before upgrade; tokens read;
  - the slotted-item convention with the container import rule (FR-056);
  - the Builds correction, and the Engines line for manual slot assignment (Chromium 86, WebKit 16.4, floor unchanged).

  Also the `.sk-facts` mapping-row statements (FR-058), written from the `.sk-facts` inventory in research R-11. That inventory must be recorded before this red commit; if it is missing or has a gap, stop and ask the operator (Decision 5).
- [ ] T011 [P] [US1] `storybook/test/integration/elements-stories.test.ts` (I3, contracts/checks.md § Story test): each facts story of research R-08 is in the built index and renders its `ocelle-facts` in light and dark with no outside request. Each facts story at a 320 px viewport has a page scroll width equal to the viewport width, paired with a non-zero sheet size. Each facts story under reduced motion has no running animation, read on a fresh load and timed by the clock with the `matchMedia` assertion.
- [ ] T012 [US1] Red commit of T003 to T011 (test files only). Run `.specify/extensions/story/scripts/red.sh 1 phase` and confirm per body in the red log that each fails on an assertion against the scaffold.

### Implementation (green)

- [ ] T013 [US1] `packages/elements/src/ocelle-fact.ts` (R-01, R-03, data-model § `ocelle-fact`):
  - `label` reflected; `wrap` reflected (`"anywhere" | undefined`);
  - inside `ocelle-facts`, a single `<slot>`; outside it, `<span part="label">` plus the slot as two blocks;
  - placement decided in `connectedCallback`;
  - `:host([wrap="anywhere"]) { overflow-wrap: anywhere }`;
  - `:host([hidden]) { display: none; }`;
  - static styles from tokens only.
- [ ] T014 [US1] `packages/elements/src/ocelle-facts.ts` (R-01, R-02, R-03, data-model § `ocelle-facts`):
  - shadow root and pairs:
    - `slotAssignment: "manual"`;
    - `<dl part="list">` with `<dt part="label">{label}</dt><dd part="value"><slot></slot></dd>` per visible `ocelle-fact` child;
    - `slot.assign()` in `updated()`;
    - no `<dl>` with no pairs;
    - hidden or `aria-hidden` facts skipped;
    - `lang` and `dir` carried to the `<dt>`.
  - `MutationObserver` on `childList`, `characterData`, and the `label`/`hidden`/`aria-hidden`/`lang`/`dir` attributes (subtree).
  - Stacking:
    - the probes `part="probe"`, observed by one `ResizeObserver` with the host;
    - the measure pass alone owns the `stacked` class and is re-run after every render, on value text changes and on window resize;
    - `--ocelle-facts-stack-below`, defaulting to `calc(var(--ocelle-space-10) * 6)`, with its fallback.
  - `layout` override (FR-013).
  - Grid `fit-content(50%) minmax(0, 1fr)`, row gaps `--ocelle-space-3` (compact `--ocelle-space-1`).
  - Label and value type and colours per R-03; values read `--ocelle-facts-value-size` and `--ocelle-facts-value-line-height`.
  - Forced-colours rules; `:host([hidden])`.
- [ ] T015 [US1] `gates/stylelint/token-only.ts`: the R-10 allowance for `fit-content(<percentage>)` and `minmax(0, <flex>)` in `grid-template-columns`. Add its style-lint plants in `gates/plants/style-lint/` (a pass plant and fail plants for other arguments and properties) and its `gates/README.md` row.
- [ ] T016 [US1] `packages/styles/src/base.css`: in the density rules, the compact and regular `--ocelle-facts-value-size`/`--ocelle-facts-value-line-height` hooks; the pre-upgrade rule `:where(ocelle-facts:not(:defined) > ocelle-fact:not([hidden])) { display: block; }`; plus `packages/styles/README.md` and `packages/styles/CHANGELOG.md` (R-07, FR-012).
- [ ] T017 [US1] Manifest: run `pnpm --filter @ocelle/elements run manifest` and commit `packages/elements/custom-elements.json` with the two declarations of contracts/elements.md. Every list is stated and every member described.
- [ ] T018 [US1] `storybook/stories/facts.stories.ts`, the facts stories of research R-08 (`title: "Elements/ocelle-facts"`):
  - Latin text only;
  - right-to-left stories with `dir="rtl"`;
  - wrapper widths from `data-story` rules in `storybook/.storybook/stories-layout.css`;
  - no `style` attribute, no pointer state.
- [ ] T019 [US1] Baselines: run `pnpm run visual:update` in the pinned container. It must print `(<n> added, 0 changed, 0 removed)`, with `<n>` twice the new facts stories. Commit `storybook/baselines/elements-ocelle-facts--*.{light,dark}.png`. If CI's "Visual regression" captures differ, commit CI's artifact instead (`storybook/README.md` § Baselines).
- [ ] T020 [US1] Documentation in `packages/elements/README.md`:
  - the `ocelle-facts` section, the slotted-item convention, the Builds correction and the Engines line, with the statements of T010;
  - the `.sk-facts` mapping rows (roles only, no code).

  Also a `packages/elements/CHANGELOG.md` entry for `ocelle-facts` and `ocelle-fact`.
- [ ] T021 [US1] Checks, one heavy job at a time:
  1. Run each facts plant of contracts/checks.md once (§ Oracles and § CSS-only behaviours: the A1 `<dl><slot>` structure, slots in reverse order, the U+200B copy, the extra triggers removed, `characterData` removed, class not restored after the measure, `fit-content(50%)`→`auto`, `minmax(0, 1fr)`→`1fr`, the `stacked` rule removed, the hook probe ignored, the default probe removed, probes not observed, probe `block-size: 1px`, the compact hooks removed, the `wrap` rule removed, the styles rule removed, `:not([hidden])` removed) and record the results in `specs/013-data-display/reviews/phase-1/plants.md`.
  2. Run `pnpm run gate:manifest`, `gate:style-lint`, `gate:csp`, `gate:prefix`, `gate:test-lint`, `gate:storybook-build`, `gate:visual`, `gate:axe` (no `storybook/a11y-exceptions.json` entry added), `gate:plants`, then `gate:mutation -- --base <phase base>`.
  3. Record the three Storybook gates' summary lines and the `visual:update` line in the phase review.

**Checkpoint**: `tdd-check.sh 1` reports `pass`; quickstart steps 1 to 6 pass for facts.

---

## Phase 2: User Story 2 - An empty or loading panel without classes (Priority: P2)

**Goal**: `ocelle-empty-state`, covering:
- US2 scenarios 1 to 9 (US2-7 with a stand-in until phase 3);
- FR-020 to FR-024;
- its stories and baselines.

**Independent Test**: on the strict-CSP fixture, `ocelle-empty-state` passes these checks:
- with an `<h3>`, a body and a button written out of slot order, it exposes heading 3, paragraph, button in slot order;
- `variant="panel"` has a larger padding and gaps and a lighter weight;
- empty and hidden parts add no gap;
- the gates pass.

### Scaffold

- [ ] T022 [US2] Scaffold commit, recorded by `scaffold.sh 2`:
  - `packages/elements/src/ocelle-empty-state.ts` with `define`, `@tagname`, `variant` (`"panel" | undefined`, `@default undefined`) and an empty `render()`;
  - its exports in `src/index.ts`, `src/browser.ts` and `package.json` (`./ocelle-empty-state.js`);
  - no test file.

### Tests (red, one commit, test files only)

- [ ] T023 [P] [US2] Driver additions `pressTab()` and `focused()` (contracts/checks.md § Driver additions), in the `Driver` interface, both harnesses and their tests.
- [ ] T024 [US2] `packages/elements/test/scenarios/empty-state.ts`, with the element-only assertions of contracts/checks.md § Bodies that the platform alone could pass:
  - US2 scenarios 1 to 6 and 8 as shared bodies:
    - US2-1 with consumer markup out of slot order;
    - US2-2 with the heading's geometry in the column;
    - US2-3/US2-4 read R-04's padding, gaps and weights (600 vs 500) in one body each;
    - US2-6 asserts the button's position in the actions part, paired with no added tab stop;
    - US2-8 checks forced colours.
  - US2-7 with a plain stand-in element in `visual` (phase 3 extends it).
  - The present-parts bodies (heading only, actions only, visual plus text: the first and last present parts at the padding edge, each gap R-04's).
  - Slots filled and emptied after first render.
  - US2-9, hidden slotted content: a hidden action; `hidden` removed; a hidden only-visual; whitespace changed to words.
  - Several actions at 320 px with no page overflow.
  - Unset `variant` writes no attribute.
- [ ] T025 [P] [US2] Test files for the empty state:
  - `packages/elements/test/empty-state.test.ts` (in process) and `packages/elements/test/browser/empty-state.test.ts` (fixture) over T024;
  - `packages/elements/test/entry-empty-state.test.ts`;
  - `entry-root.test.ts` extended.
- [ ] T026 [P] [US2] `packages/elements/test/node/readme.test.ts`: statements for the `ocelle-empty-state` section, one assertion per statement:
  - the heading rule (the consumer's own heading, no `level`, FR-056);
  - slots, variants, the cascade note, the loading panel, tokens read.

  Also the `.sk-empty-state` mapping-row statements (FR-058), written from research R-11's `.sk-empty-state` inventory, which must be recorded before this red commit; if it is missing or has a gap, stop and ask the operator.
- [ ] T027 [P] [US2] `storybook/test/integration/elements-stories.test.ts`: the empty-state stories of research R-08, present, in light and dark, with no outside request; under reduced motion, no running animation, using the same clock-timed fresh-load read.
- [ ] T028 [US2] Red commit of T023 to T027. Run `red.sh 2 phase`, and check the red log per body.

### Implementation (green)

- [ ] T029 [US2] `packages/elements/src/ocelle-empty-state.ts` (R-04, data-model § `ocelle-empty-state`):
  - `<div part="body">` with the visual, heading, text and actions wrappers;
  - a part is present only if an assigned element's computed `display` is not `none` or it has non-whitespace text, recomputed on `slotchange` and by a `MutationObserver` (`hidden`, text);
  - absent parts are `display: none`;
  - per-part margins with the "last present part has no margin" rule;
  - the default and panel values of R-04;
  - `::slotted([slot="heading"])` weights;
  - the actions wrapper wraps;
  - `::slotted(ocelle-progress)` spans the column up to `--ocelle-measure-reading`;
  - no ground painted;
  - forced-colours rules; `:host([hidden])`.
- [ ] T030 [US2] Regenerate and commit the manifest with the `ocelle-empty-state` declaration.
- [ ] T031 [US2] `storybook/stories/empty-state.stories.ts` (`title: "Elements/ocelle-empty-state"`): the stories of research R-08 except panel loading, which comes in phase 3.
- [ ] T032 [US2] Baselines: run `pnpm run visual:update` in the pinned container (`<n>` added, 0 changed, 0 removed) and commit `storybook/baselines/elements-ocelle-empty-state--*.{light,dark}.png`.
- [ ] T033 [US2] Documentation:
  - `packages/elements/README.md`: the `ocelle-empty-state` section and the `.sk-empty-state` mapping rows;
  - `packages/elements/CHANGELOG.md` entry.
- [ ] T034 [US2] Checks:
  1. Run the empty-state plants once: the "last present part has no margin" rule removed, the `hidden` observer removed, and the `::slotted(ocelle-progress)` rule removed against the stand-in. Record them in `reviews/phase-2/plants.md`.
  2. Run `gate:manifest`, `gate:style-lint`, `gate:csp`, `gate:prefix`, `gate:test-lint`, `gate:storybook-build`, `gate:visual`, `gate:axe`, `gate:plants`, then `gate:mutation -- --base <phase base>`, and record the summary lines.

**Checkpoint**: `tdd-check.sh 2` reports `pass`.

---

## Phase 3: User Story 3 - A progress bar that names itself and respects motion (Priority: P3)

**Goal**: `ocelle-progress`, covering:
- US3 scenarios 1 to 15;
- FR-030 to FR-039;
- US2-7 with the real bar;
- the `token-only` translate and iteration-count allowance (R-10);
- the progress stories and the panel-loading story, with their baselines.

**Independent Test**: on the strict-CSP fixture, these hold with zero violations:
- `<ocelle-progress value="7" max="12" label="Tasks done">` exposes one progressbar named "Tasks done" with value 7, min 0 and max 12, and its fill is 7/12 of the track at once;
- the indeterminate bar sweeps for less than 5 s per loading episode, and not at all under reduced motion, where it shows the still mark.

### Spike (first)

- [ ] T035 [US3] Spike before the scaffold, recorded in `specs/013-data-display/reviews/phase-3/spike.md`: the `valuetext` oracle among platform reads only (`locator.ariaSnapshot()`, CDP `Accessibility.getPartialAXTree`, other CDP reads) on an ElementInternals bar with `ariaValueText` (R-05). If none exposes it, stop: US3-3 goes to the operator.

### Scaffold

- [ ] T036 [US3] Scaffold commit, recorded by `scaffold.sh 3`:
  - `packages/elements/src/ocelle-progress.ts` with `define`, `@tagname`, the properties of contracts/elements.md (`value`, `max`, `valueText`, `label`, `showLabel`, `size`, `ground`), each `| undefined` with `@default undefined`, and an empty `render()`;
  - its exports (`./ocelle-progress.js`);
  - no test file.

### Tests (red, one commit, test files only)

- [ ] T037 [P] [US3] Driver additions from contracts/checks.md § Driver additions, with their tests:
  - `reducedMotion(mode)`: the `emulateReducedMotion` command through `page.emulateMedia` in `emulate()`, reset in each progress test file's `afterEach`. Its test in `packages/elements/test/commands.test.ts` asserts `matchMedia` after the command, after a later `emulateForcedColors`, and after the reset.
  - `animations(id)`, returning kind, target part, property, play state and end time.
  - AX value properties (`value`, `valuemin`, `valuemax`, `valuetext`) on `AxNode`, `axNodes` and `axSubtree`, tested on a native `<progress>` and an ElementInternals bar.
  - `replace`, `remove`, `frames`.
  - The loading-episode reset in `mount`.
- [ ] T038 [US3] `packages/elements/test/scenarios/progress.ts`, with the oracles of contracts/checks.md § Oracles (Progress):
  - US3 scenarios 1 to 15 as shared bodies:
    - US3-2 reads 75% at once, with `animations()` empty;
    - US3-3 uses the T035 oracle;
    - US3-4 pairs absence with a determinate read;
    - US3-5 reads reduced motion first, inside the first iteration, then motion, plus the still mark at 30% to 70%;
    - US3-7 checks the `accent-strong` edge;
    - US3-8 checks forced colours (system colours that differ, fill `box-shadow: none`);
    - US3-9 checks 8 px and 4 px;
    - US3-10 checks the host `aria-label` override and visible label figures;
    - US3-11 checks the unnamed bar;
    - US3-12 checks the end time below 5000 ms and the still mark after `finished`;
    - US3-13 checks `ground="tinted"`;
    - US3-14 is the shared episode with `replace`;
    - US3-15 is a new episode after `remove` + `frames(2)`.
  - SPEC-2-02's bodies: `value-text` ignored while indeterminate and kept when clamped.
  - The value-removed body: a 40% mark, no `CSSTransition`, with and without reduced motion.
  - The determinate-then-indeterminate within one task after the window.
  - The right-to-left indeterminate and determinate bodies.
  - The 320 px sweep body: page scroll width sampled at several animation times.
  - Unset properties write no attribute (`size`, `ground`).
- [ ] T039 [US3] `packages/elements/test/scenarios/empty-state.ts`: extend US2-7 to a real `ocelle-progress` in `visual`:
  - above the heading at the panel's visual-to-heading gap;
  - the screen reader reaches the bar first;
  - the bar spans the column up to `--ocelle-measure-reading`.
- [ ] T040 [P] [US3] Test files for progress:
  - `packages/elements/test/progress.test.ts` (in process) and `packages/elements/test/browser/progress.test.ts` (fixture) over T038;
  - `packages/elements/test/entry-progress.test.ts`;
  - `entry-root.test.ts` extended.
- [ ] T041 [P] [US3] The pairing test in two halves (contracts/checks.md § Contrast):
  - `packages/elements/test/node/progress-pairs.test.ts`: from `src/ocelle-progress.ts`, the mark and edge token is `color-accent-strong`, the track `color-inset`, and the boundaries `color-control-border` and, under `ground="tinted"`, `color-accent-strong`. Against `packages/tokens/src/source.ts` and `packages/tokens/contrast/pairs.json`: `color-focus` `ref` is `color-accent-strong` in both themes, and each (token, ground) pair the README assigns is a `checked` row.
  - `packages/elements/test/build/build.test.ts`: `dist/ocelle-progress.js` uses the same tokens.
- [ ] T042 [P] [US3] `gates/test/` `token-only` unit tests for the R-10 phase 3 allowance, plus the `gates/README.md` statement test:
  - `translateX(<percentage>)` in `transform` and a bare integer `animation-iteration-count` pass;
  - other functions, non-integers and other properties are findings.
- [ ] T043 [P] [US3] `packages/elements/test/node/readme.test.ts`: statements for the `ocelle-progress` section, one per statement:
  - naming (`label` or host `aria-label`, an unnamed bar is a consumer error, axe does not check the name);
  - the value rules and `value-text`;
  - the bounded sweep, once per loading episode, with the 238 ms `--ocelle-motion-base` limit;
  - reduced motion; no fill transition; `ground="tinted"`;
  - the busy vocabulary (FR-033); tokens read.

  Also the `.sk-progress` mapping-row statements (FR-058), written from research R-11's `.sk-progress` inventory, which must be recorded before this red commit; if it is missing or has a gap, stop and ask the operator.
- [ ] T044 [P] [US3] `storybook/test/integration/elements-stories.test.ts`: the progress stories and the empty-state panel-loading story of research R-08, present, in light and dark, with no outside request. Also:
  - each motion read on its own fresh story load within the first iteration: without reduced motion, a running animation on the indeterminate story, guarded by `currentTime` under 1400 ms; under reduced motion, no running animation, timed by `performance.now()`, with `matchMedia("(prefers-reduced-motion: reduce)").matches` asserted first;
  - every progressbar in every story has a non-empty name, paired with a count above 0 in the progress and panel-loading stories.
- [ ] T045 [US3] Red commit of T037 to T044. Run `red.sh 3 phase` and check the red log per body.

### Implementation (green)

- [ ] T046 [US3] `packages/elements/src/ocelle-progress.ts` (R-05, R-06, data-model § `ocelle-progress`):
  - ElementInternals:
    - `role="progressbar"`;
    - `ariaValueMin` `"0"`, `ariaValueMax` the effective max (100 when `max` is not finite and above 0);
    - `ariaValueNow` the value clamped to [0, max], or null when indeterminate (absent, empty or whitespace attribute, null, or not finite);
    - `ariaValueText` only while determinate;
    - `ariaLabel` from `label`; a host `aria-label` overrides it.
  - Parts `track`, `fill`, `label`, `value-text` (the last two `aria-hidden="true"`, shown with `show-label`).
  - Fill width set in `updated()` through the CSSOM, with no transition.
  - Track `overflow: clip`, sizes 8 px / compact 4 px.
  - `accent-strong` inset edge; `ground="tinted"` boundary.
  - Indeterminate sweep:
    - `translateX` keyframes, mirrored for right-to-left;
    - duration `calc(var(--ocelle-motion-base) * 7)`, iteration count 3;
    - the loading-episode start kept on `document` under `Symbol.for("ocelle.progress.sweepStart")` and applied through `startTime`;
    - the episode ends when no indeterminate bar is connected at the next frame.
  - The still mark (inset 30%, 40% wide) under reduced motion and after the sweep.
  - Forced-colours rules; `:host([hidden])`.
- [ ] T047 [US3] `gates/stylelint/token-only.ts`: the R-10 phase 3 allowance (`translateX(<percentage>)`, integer `animation-iteration-count`), its plants in `gates/plants/style-lint/`, and its `gates/README.md` row.
- [ ] T048 [US3] Regenerate and commit the manifest with the `ocelle-progress` declaration (`aria-label` observed, not declared).
- [ ] T049 [US3] Stories, following research R-08:
  - `storybook/stories/progress.stories.ts` (`title: "Elements/ocelle-progress"`): every bar named; no host `aria-label` story and no unnamed story;
  - the panel-loading story added to `storybook/stories/empty-state.stories.ts`.
- [ ] T050 [US3] Baselines: run `pnpm run visual:update` in the pinned container (`<n>` added, 0 changed, 0 removed). The indeterminate stories are captured on the still mark under reduced motion. Commit the new `storybook/baselines/*.png`.
- [ ] T051 [US3] Documentation:
  - `packages/elements/README.md`: the `ocelle-progress` section and the `.sk-progress` mapping rows;
  - `packages/elements/CHANGELOG.md` entry.
- [ ] T052 [US3] Checks:
  1. Run each progress plant of contracts/checks.md once and record it in `reviews/phase-3/plants.md`:
     - still-mark inset removed;
     - `infinite` restored;
     - track clip removed;
     - inset shadow removed;
     - tinted rule removed;
     - forced-colours `box-shadow: none` removed;
     - right-to-left keyframes removed;
     - the shared start dropped;
     - the episode never ends;
     - a 200 ms fill `inline-size` transition added;
     - the `::slotted(ocelle-progress)` rule removed, against the real bar;
     - a story's `label` removed.
  2. Run `gate:manifest`, `gate:style-lint`, `gate:csp`, `gate:prefix`, `gate:test-lint`, `gate:contrast` (unchanged), `gate:storybook-build`, `gate:visual`, `gate:axe`, `gate:plants`, then `gate:mutation -- --base <phase base>`. Timeout and CompileError mutants are reported and pass (#23).

**Checkpoint**: `tdd-check.sh 3` reports `pass`.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Goal**: the final records and a full-mission check. No new behaviour; every task here is exempt (documentation and
gate runs), and the phase review states why no test can fail for them.

- [ ] T053 Final surface lists in `packages/elements/CHANGELOG.md` and `packages/styles/CHANGELOG.md` (FR-057): the four elements, their entry points, the `--ocelle-facts-stack-below` hook and the two facts value hooks, `base.css`'s two rules, and the `token-only` allowance. Mark this exempt (documentation).
- [ ] T054 Review check, recorded in `specs/013-data-display/reviews/phase-4/coverage.md`: the three README mapping sections together cover every variant in research R-11's inventory (SC-001; the rows themselves landed red first in phases 1 to 3). A gap goes to the operator. Mark this exempt.
- [ ] T055 Run quickstart.md steps 1 to 7 on the whole mission, one heavy job at a time. `gate:storybook-build`, `gate:visual` and `gate:axe` must pass on all the mission's stories (SC-003, FR-051), and the summary lines are recorded in `specs/013-data-display/reviews/phase-4/quickstart.md`. Mark this exempt.

**Checkpoint**: the phase 4 review approves; `summary.sh` follows in `/ocelle-run` step 4.4.

---

## Dependencies and parallel work

- **Phase order**: phase 1 → phase 2 → phase 3 → phase 4. Phase 2 uses phase 1's driver additions. Phase 3 extends
  T024's US2-7 (T039) and adds the panel-loading story to phase 2's stories file.
- **Within each phase**: spike, then scaffold, then red tasks. Red tasks marked [P] write different files and can be
  written in parallel, but land in one red commit. Green tasks run in order: element, lint allowance, manifest,
  stories, baselines, docs, checks.
- **Parallel examples**:
  - Phase 1: T003, T006, T007, T008, T009, T010 and T011 are independent files.
  - Phase 2: T023, T025, T026 and T027.
  - Phase 3: T037, T040, T041, T042, T043 and T044.

## Implementation strategy

- **MVP**: phase 1, `ocelle-facts` with `ocelle-fact`, which replaces 34 `.sk-facts` uses and sets the slotted-item
  convention the follow-on missions reuse.
- **Then**: the empty state, then progress, each folded after approval (`/ocelle-run` step 4.3).
- **Last**: phase 4 closes the records.
