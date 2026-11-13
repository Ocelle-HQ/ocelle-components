# Tasks: Layout and Headers

**Input**: design documents in `specs/011-layout-headers/`, as approved at the plan gate on 2026-11-13 after three
plan-squad rounds (`reviews/plan/round-1..3/`):
- spec.md (FR-001 to FR-039, with no FR-009 or FR-029: 37 functional requirements; SC-001 to SC-006, US1-1 to US1-19, US2-1 to US2-8, US3-1 to US3-13, US4-1 to US4-11);
- plan.md, its decisions and phase list;
- research.md, R-01 to R-17;
- data-model.md;
- contracts/elements-package.md and contracts/checks.md;
- quickstart.md.

**Precondition (operator decision, 2026-11-12)**: no task of this file starts before #10 (Storybook workbench,
`specs/006-storybook-workbench`) is merged on `main` and `main` has been merged into `claude/008-layout-headers`
(a merge, never a rebase). T001 checks this and stops the phase if it does not hold.

**Tests**: required. Constitution Principle VIII applies to every phase. The phase flow is `base.sh`, an optional
`scaffold.sh`, one red commit of test files only proven by `red.sh`, then green, `tdd-check.sh` and an independent
review. Expected values are written by hand from the spec and contracts: token values are read from the same page
by token name (never literals), and the token sentinels of R-13 override each token an element reads.

The guard rules (spec "Does not outcomes are paired", contracts/checks.md § Pairing plants):
- A "does not" assertion never stands alone: it shares its test with the positive assertion it guards.
- Each guard is proven able to fail by its named plant, applied by 005's working-tree method, run through both
  harnesses and recorded in `reviews/phase-N/plants.md`.
- Every declaration of a phase's new `css` templates is neutralised once and its catching scenario recorded (R-17);
  an uncaught declaration blocks the review unless recorded as equivalent with a reason.
- A plant that does not make its guard fail stops the phase (stop-and-ask).

**Shared scenario bodies** (R-13): each scenario is written once in `packages/elements/test/scenarios/<element>.ts`
against the driver and run by the in-process `elements` project (source, mutated) and the `elements-browser`
project (browser build on strict-CSP fixture pages, which also assert zero CSP violations, only allowed requests and
no console message).

**Environment**: Node 22 in this container, 26.13.0 in CI; `OCELLE_CHROMIUM_PATH` for every browser run; a
container engine for `visual`; one heavy job at a time; never `git stash`.

**Organization**: phase 1 is setup and spike; phases 2 to 5 are User Stories 1 to 4, one review unit each, folded
after approval (`/ocelle-run` step 4.3). Records (README, CHANGELOG, stories, baselines, plants) belong to the phase
whose behaviour they describe. There is no polish phase. Phase 5 is separable (triage 011).

**Stop-and-ask points**: the implementer records the question in the phase review and does not work around it:
- T001: #10 not on `main`, or #10 as merged differs from R-14 in a way that changes a task;
- T002 spike: any measured fact that contradicts R-02, R-04, R-09, R-10 or R-11 and has no fallback named there
  (R-09's first-section selector; R-11's role probe or a serious or critical axe finding on the seven host cases);
- a plant that does not bite; a style declaration nothing catches and that is not equivalent;
- any mutation shard over 10 minutes;
- #7 has already added eyebrow tokens with other names or values (R-16).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: the user story of the task (US1 to US4)
- Paths are relative to the repository root.

---

## Phase 1: Setup

**Purpose**: confirm #10, measure the browser facts the plan depends on, and add the slot-state controller and the
test readers every story uses.

**Independent Test**: `reviews/phase-1/spike.md` records every measurement of plan phase 1 with its result;
`pnpm exec vitest run --project elements` passes `slot-state.test.ts` and `commands.test.ts`; `tdd-check.sh 1`
reports `pass`; the phase-1 gate set of the checkpoint passes, `mutation` included.

### Recheck and spike (first)

- [ ] T001 #10 recheck (R-14), recorded in `specs/011-layout-headers/reviews/phase-1/spike.md`: confirm #10 is merged on `main` and merged into this branch; compare #10 as merged with R-14 (story file location `storybook/stories/<element>.stories.ts`, story id scheme, baseline path `storybook/baselines/<story-id>.<theme>.png`, `pnpm run visual:update`, `gate:storybook-build`, `gate:visual`, `gate:axe`, the axe rule set and excluded rules of #10 FR-016, the contributor note items of #10 FR-025, whether the `axe` gate is still a stub as at `5f49794`, the pinned axe-core version); record every difference and stop-and-ask on one that changes a task
- [ ] T002 Spike in this container's Chromium on scratch pages (scratchpad, not committed), recorded in `specs/011-layout-headers/reviews/phase-1/spike.md` with the measured values: R-02 (UA `h1`–`h6` rules lose to `::slotted()`; UA `p` and `ul` margins trimmed by the edge-margin rules, the margin between two `p` kept, a `<p hidden>` at a body or footer edge skipped); R-04 wrap rule (a) actions beside the heading when the longest word plus actions fit, (b) under the column when not, (c) a 60-character run broken inside the column at 320 px with no horizontal overflow, (d) with an eyebrow, the actions' block start equals the heading's; R-09 (`::slotted(:nth-child(1 of :not([slot]):not([hidden])))` with a head element before the first section in DOM order; negative inline margins on `div`, `span`, `ocelle-section-header`, `ul` and `p` sections giving full-width borders; `ul` sections under a page `ul { margin: 0; padding: 0; list-style: none }` reset and under `* { margin: 0; padding: 0; border: 0 solid }` with the `!important` rules; hidden `div` and `ocelle-section-header` sections and a hidden first section; the host box in block, flex-row and grid containers with and without base.css); R-10 (vertical rail border box 52 px and content box 44 px, horizontal border box equal to a 320 px container, with and without base.css; the focus ring of a 40 px item inside the border box and unclipped; the host in the three container kinds; a horizontal rail with no primary items keeps its bottom group at the inline end; the stand-in items' computed colour and axe `color-contrast` and `target-size` on them); R-11 (the host-as-landmark tree for the four US3-12 and three US4-11 cases: one navigation node with the expected name and no other node carrying it; axe-core as pinned by #10 with the internals under a `Symbol("internals")` key: no serious or critical finding on the seven cases, and `axe.commons.aria.getRole(host) === "navigation"`, reading `null` when the internals are in a `#private` field)

### Tests (red, one commit)

- [ ] T003 [P] `packages/elements/test/slot-state.test.ts`: on a test host whose shadow root holds a default slot and a named slot wired to `src/slot-state.ts`, the slot is empty with no assigned node, with only empty or whitespace-only assigned text nodes, and not empty with one assigned element (also when `hidden`) or one non-whitespace text node; the state follows an element appended and removed, the `slot` attribute changed, and an assigned text node's data changed from whitespace to text and back (R-03); the empty state's wrapper class is set after `updateComplete` on first render
- [ ] T004 [P] `packages/elements/test/commands.test.ts`: `axTree(id)` nodes carry `level` for a heading (`<h3 id>` gives role `heading`, level 3); the new readers return the document's scrolling width (a 400 px wide child in a 320 px viewport reads 400), the deep active element through open shadow roots, and, for each text node under an element, its box and its clipping ancestors (a text inside `overflow: hidden` is reported clipped) (R-13)

### Implementation (green)

- [ ] T005 `packages/elements/src/slot-state.ts`: the internal controller of R-03 (`slotchange` per slot; `MutationObserver` on the host with `characterData`, `childList`, `subtree` for default slots; one Lit `state` field per slot; an `empty` class on the slot's wrapper, which the element styles `display: none`); not exported from `src/index.ts`
- [ ] T006 `packages/elements/test/commands.ts` and `vitest.config.ts` browser commands: `AxNode.level`, the scroll-width, deep-active-element and text-box readers of T004
- [ ] T007 [P] Exempt plumbing in `packages/elements/test/scenarios/driver.ts`, `packages/elements/test/in-process.ts` and `packages/elements/test/browser/driver.ts`: DOM append, remove and text-data change of light DOM, Tab presses (Playwright `Tab` on fixtures, `userEvent.tab` in process), viewport and container size, `driver.rules` for token overrides; fixture page templates `packages/elements/test/browser/fixtures/{card,section-header,page-header,context-sidebar,personal-rail}.html`
- [ ] T008 Write `specs/011-layout-headers/reviews/phase-1/tdd-exempt.md`: T001, T002 and T007 have no behaviour (record, measurement, plumbing), with the reason; T003 and T004 are the red commit for T005 and T006

**Checkpoint**: `tdd-check.sh 1` reports `pass`; every spike item is recorded; gates `typecheck`, `lint`,
`test-lint`, `test` and `mutation` (phase base; the changed source is `packages/elements/src/slot-state.ts`) pass,
before the phase-1 review. A surviving mutant in `slot-state.ts` is a blocking review finding unless the review
records it as equivalent with a reason (constitution VIII, SC-005); phase 2's mutation run uses phase 2's base and
does not cover it again.

---

## Phase 2: User Story 1 - Section header, card and the eyebrow tokens (Priority: P1) 🎯 MVP

**Goal**: US1-1 to US1-19; FR-001 to FR-018 and FR-030 to FR-039 for `ocelle-section-header` and `ocelle-card`;
the four eyebrow tokens with their contrast rows.

**Independent Test**: on the strict-CSP fixture, a compact card with a section header in its `header` slot and `p`
body content measures `--ocelle-space-5` padding, `--ocelle-space-4` header gap and the compact heading size, with
zero CSP violations; `pnpm run gate:contrast` reports 169 light / 177 dark / 158 required; stories pass `visual`,
`axe` and the 320 px story pass.

### Tests (red, one commit)

- [ ] T009 [P] [US1] Token tests, changed first at the places R-12 lists (re-read them at the phase base): `packages/tokens/test/expected.ts` gains `font-size-eyebrow` = `var(--ocelle-font-size-xs)`, `font-weight-eyebrow` = `var(--ocelle-font-weight-strong)`, `tracking-eyebrow` = `0.08em`, `color-eyebrow` = `var(--ocelle-color-ink-muted)` in light and dark; `gates/test/contrast-pairs.test.ts` 160 / 168 → 169 / 177 and 328 → 346; `gates/test/contrast-required.test.ts` 149 → 158, 298 → 316 and `color-eyebrow` in the A.8 table's text foregrounds on `main`; `gates/test/contrast.test.ts`, `gates/test/integration/plants-robustness.test.ts` (161 → 170 for the planted row), `gates/test/integration/token-gates.test.ts` likewise (US1-15)
- [ ] T010 [P] [US1] `packages/elements/test/card-context.test.ts`: `inCompactCardHeader(header)` is true only for a header whose `assignedSlot` is a slot named `header` in an `ocelle-card` shadow root with `density="compact"` (false for `density=""`, `"bogus"`, `"regular"`, absent, the body slot, a header nested in a `div` in the `header` slot, a header in an inner card); `notifyHeaders(slot, previous)` calls `requestUpdate` on upgraded `ocelle-section-header` elements among the assigned and previous sets and returns the current set (R-05)
- [ ] T011 [P] [US1] `packages/elements/test/scenarios/section-header.ts`: US1-1 to US1-6, US1-14, US1-16, US1-17 (outside-card half) as shared bodies; US1-2 with `p` description and `span` eyebrow measured to the slotted element's border box (FR-008), in LTR and RTL and both themes; US1-5 with the name compared ignoring case and the DOM text unchanged, the three eyebrow-variant headers equal; US1-4 comparing every other element's border box; the token-sentinel scenario over contracts/elements-package.md § Tokens each element reads; the no-event check (mount, slot changes, attribute changes); FR-006's invalid-value cases for `variant`: headers with `variant=""` and `variant="bogus"` drawn with the default heading style and with their eyebrow and description rendered, each keeping the value the page wrote, in the same test as a `variant="eyebrow"` twin drawn in the eyebrow style (plant: contracts/checks.md § Pairing plants, the empty-or-invalid row); each "does not" paired as contracts/checks.md says
- [ ] T012 [P] [US1] `packages/elements/test/scenarios/card.ts`: US1-7 to US1-13, US1-17 (in-card half), US1-18, US1-19 as shared bodies; US1-7 and US1-11 with `p` bodies measured to the slotted element's border box, US1-7 also with a `<p hidden>` at each body edge (FR-008); US1-10's three ways of setting `inset` and removal; US1-13 in forced colours with the compact card's layout held (FR-001); the R-05 transitions (density set then removed by script; a header moved between `header` slot and body by its `slot` attribute and by DOM moves); FR-006's cases for the card: cards with `density=""` and `density="bogus"` drawn with the regular padding and header gap of US1-7 and their slotted section header at the default size, each keeping the value the page wrote, in the same test as a `density="compact"` twin drawn with US1-8's padding, gap and compact header; and a card written with no `density` or `inset` carrying neither attribute after upgrade, in the same test as `card.density = "compact"` and `card.inset = true` set by property reflecting both (plants: contracts/checks.md § Pairing plants, the upgrade and empty-or-invalid rows); token sentinel; no-event check
- [ ] T013 [P] [US1] `packages/elements/test/section-header.test.ts` and `packages/elements/test/card.test.ts` (in-process over T011 and T012); `packages/elements/test/browser/section-header.test.ts` and `card.test.ts` (fixture over T011 and T012), plus the mixed-copy fixture page: a named same-origin test bundle of the module build's `ocelle-card.js` loaded before the browser build, on which a header in a compact card's `header` slot is compact (R-05)
- [ ] T014 [P] [US1] `packages/elements/test/entry-section-header.test.ts`, `entry-card.test.ts` (importing `../src/ocelle-card.ts` defines `ocelle-card` and not `ocelle-section-header`), `entry-card-order.test.ts` (import card, mount, import header, and the reverse: the header is compact in both orders), `entry-root.test.ts` extended to the two elements and their classes
- [ ] T015 [P] [US1] `packages/elements/test/node/manifest.test.ts`: entries for `ocelle-section-header` (`size`, `variant`, reflected, types `"regular" | "compact" | undefined` and `"default" | "eyebrow" | undefined`, default absent; slots `heading`, `eyebrow`, `description`, `actions`; empty events, parts, CSS properties) and `ocelle-card` (`density`, `inset` boolean, reflected; slots `header` and default) (FR-034); `packages/elements/test/build/build.test.ts` and `pack.test.ts`: `dist/ocelle-section-header.js`, `dist/ocelle-card.js`, each importing only own files and `lit`
- [ ] T016 [P] [US1] `packages/elements/test/node/readme.test.ts`: the FR-036 statements for both elements, one assertion each (usage, slots, properties and values with the "not set" look, tokens read, the empty-slot rule with "remove an element from the slot rather than hide it", the slotted-heading rule, "place outside a `[data-ocelle-prose]` region", the eyebrow variant's upper case with unchanged DOM text, the card's compact rule for a slotted header without a valid `size`, the card has no role, the edge-margin trim of FR-008 and that a page rule wins, the Consumer-need workaround the section header replaces: part-level padding and gap overrides, per FR-036's mapping); the amended Styles convention paragraph (layout-only rules outside `@media not (forced-colors: active)`, FR-001); both CHANGELOGs naming the elements, entry points and tokens. The existing engine fragments ("Engine floor: Chromium 120+ and WebKit 16.4+ …" and the per-feature engine lines) stay as they are, so the readme test keeps holding FR-039 (R-15)
- [ ] T016a [US1] Pinned element lists (E1 of `reviews/analysis/fixes-1.md`), re-listed at the phase base as R-12 does for the contrast counts: search `packages/elements/test`, `gates/test` and `storybook/test` at the phase base for every assertion that pins the package's element classes, entry points, `exports` keys, manifest module paths or `dist` files exactly, record the list in `specs/011-layout-headers/reviews/phase-2/notes.md`, and change each one that this phase's green tasks (T020–T024) change, in this red commit. At the first analysis's head (`5bb0e04`) these are: `packages/elements/test/exports.test.ts` (the root's run-time exports exactly the base's list plus `OcelleCard` and `OcelleSectionHeader`, in the module namespace's sorted order, each a function); `packages/elements/test/node/readme.test.ts` `entryRows` (the README's Entry points table gains the rows `@ocelle/elements/ocelle-card.js` | `dist/ocelle-card.js` | "`ocelle-card` only; for hosts with a bundler" and the same row for `ocelle-section-header`, in the form of the base's rows, after the base's element rows and before the `browser.js` row, in the order of contracts/elements-package.md § Entry points) and its `exports` keys assertion (the same two keys in the same place); `packages/elements/test/node/manifest.test.ts:250` (module paths by code point: `src/ocelle-card.ts` and `src/ocelle-section-header.ts` added); `packages/elements/test/build/build.test.ts:44-49` (the module-build file list); `pack.test.ts` and `entry-root.test.ts` as T014 and T015 say. A list that a sibling has changed by the phase base is taken as it is at the base, plus this phase's additions
- [ ] T017 [P] [US1] `storybook/test/integration/elements-stories.test.ts` extended first: the section-header and card story ids present and rendering in light and dark, and each loaded at 320 × 800 px with `scrollWidth <= 320` and no clipped text node, paired with the element rendering its content (SC-002)

### Implementation (green)

- [ ] T018 [US1] `packages/tokens/src/source.ts` (four records per R-12 and the 149 → 158 comment), regenerate `tokens.css`, `packages/tokens/contrast/pairs.json` (9 rows per theme for `color-eyebrow` on the main grounds), the comment in `gates/bin/contrast.ts`; `packages/tokens/README.md` and `CHANGELOG.md`
- [ ] T019 [US1] `packages/elements/src/card-context.ts` per R-05 (no state, no export from `index.ts`)
- [ ] T020 [US1] `packages/elements/src/ocelle-section-header.ts`: `size` and `variant` reflected with no initializer (`@default undefined`), slots and wrappers per R-04 with the eyebrow above the row, `box-sizing: border-box`, `:host { display: block }` and `:host([hidden])`, slotted heading styles per FR-012 and FR-031 with `margin: 0`, the edge margins of FR-008, size resolved in `willUpdate` from own valid `size` else `inCompactCardHeader(this)`, `requestUpdate()` in `connectedCallback`, slot state from T005; eyebrow variant omits the eyebrow and description slots
- [ ] T021 [US1] `packages/elements/src/ocelle-card.ts` per R-08: `density` and `inset` (`type: Boolean, reflect: true`), border, `radius-row`, grounds, padding and gap per density, header wrapper hidden when empty, FR-008 first and last visible body-element trims with `:not([hidden])`, `notifyHeaders` on `slotchange` of `header` and in `updated()` when `density` changed; no role
- [ ] T022 [US1] `packages/elements/src/index.ts`, `src/browser.ts`, `packages/elements/package.json` `exports` (`./ocelle-card.js`, `./ocelle-section-header.js`, after the base's element entries and before `./browser.js`, the order T016a pins); regenerate and commit `packages/elements/custom-elements.json`
- [ ] T023 [US1] `storybook/stories/section-header.stories.ts` and `storybook/stories/card.stories.ts`: a story per variant and state US1 names (sizes, eyebrow variant, empty and filled slots, densities, inset, header and no header), no `style` attribute; baselines by `pnpm run visual:update`, CI's captures committed when they differ (R-14)
- [ ] T024 [US1] `packages/elements/README.md` (sections for both elements, the amended Styles paragraph, and the Entry points table rows for `@ocelle/elements/ocelle-card.js` and `@ocelle/elements/ocelle-section-header.js` as T016a pins them) and `packages/elements/CHANGELOG.md` with the statements of T016
- [ ] T025 [US1] Evidence in `specs/011-layout-headers/reviews/phase-2/plants.md`: every pairing plant of contracts/checks.md whose rows name US1 scenarios, and the R-17 style plants for both templates, each with the scenarios that failed in each harness; `pnpm run gate:plants` after the contrast counts changed

**Checkpoint**: `tdd-check.sh 2` reports `pass`; gates `typecheck`, `lint`, `style-lint`, `test-lint`, `test`, `manifest`, `csp`, `prefix`, `contrast`, `brand-rules`, `storybook-build`, `visual`, `axe`, `mutation` (phase base) pass.

---

## Phase 3: User Story 2 - Page header (Priority: P2)

**Goal**: US2-1 to US2-8; FR-019 and the common FRs for `ocelle-page-header`.

**Independent Test**: on the fixture, `<ocelle-page-header size="compact">` with an `h1`, eyebrow, `p` description
and actions draws a 24 px display title, the eyebrow tokens, a `--ocelle-space-1` gap to the description, the band's
padding and rule, and exposes one level-1 heading and no landmark.

### Tests (red, one commit)

- [ ] T026 [P] [US2] `packages/elements/test/scenarios/page-header.ts`: US2-1 to US2-8 as shared bodies (US2-2 with a `p` description, FR-008, LTR and RTL, both themes; US2-5 at 320 px with scroll-width and text-box assertions; US2-7 in forced colours; US2-8 with an empty heading, the heading column's `gap` of R-07); FR-006's cases for the page header: headers with `size=""` and `size="bogus"` drawn at the regular size of US2-2, each keeping the value the page wrote, in the same test as a `size="compact"` twin drawn at US2-3's compact size; and a header written with no `size` carrying no `size` attribute after upgrade, in the same test as `header.size = "compact"` set by property reflecting it (plants: contracts/checks.md § Pairing plants, the upgrade and empty-or-invalid rows); token sentinel; no-event check; each "does not" paired
- [ ] T027 [P] [US2] `packages/elements/test/page-header.test.ts`, `packages/elements/test/browser/page-header.test.ts`, `packages/elements/test/entry-page-header.test.ts`, `entry-root.test.ts` extended; manifest test entry (`size` reflected; slots `heading`, `eyebrow`, `description`, `actions`; empty lists); build and pack tests for `dist/ocelle-page-header.js`
- [ ] T028 [P] [US2] `packages/elements/test/node/readme.test.ts` page-header statements of FR-036, one assertion each: the common ones (usage, slots `heading`, `eyebrow`, `description`, `actions`, `size` with its values and its "not set" look, the tokens read, the empty-slot rule with "remove an element from the slot rather than hide it", the edge-margin trim of FR-008 and that a page rule wins), the slotted-heading rule, "place outside a `[data-ocelle-prose]` region", "no ground of its own" of R-07, and the Consumer-need workaround it replaces: pinned page-header font rules, per FR-036's mapping; the `@ocelle/elements` CHANGELOG naming the element and its entry point as a MINOR addition, as T016 does; story test extended to the page-header stories with the 320 px pass
- [ ] T028a [US2] Pinned element lists (E1 of `reviews/analysis/fixes-1.md`), re-listed at the phase base as T016a says, recorded in `specs/011-layout-headers/reviews/phase-3/notes.md` and changed in this red commit where this phase's green tasks (T030, T031) change them: `packages/elements/test/exports.test.ts` (the base's root exports plus `OcellePageHeader`, in the namespace's sorted order); `packages/elements/test/node/readme.test.ts` `entryRows` (the row `@ocelle/elements/ocelle-page-header.js` | `dist/ocelle-page-header.js` | "`ocelle-page-header` only; for hosts with a bundler", in the form of the base's rows, after the base's element rows and before the `browser.js` row) and its `exports` keys assertion (the same key in the same place); `packages/elements/test/node/manifest.test.ts` module paths (`src/ocelle-page-header.ts` added, by code point); `packages/elements/test/build/build.test.ts`'s module-build file list; `pack.test.ts` and `entry-root.test.ts` as T027 says

### Implementation (green)

- [ ] T029 [US2] `packages/elements/src/ocelle-page-header.ts` per R-07: no `<header>`, no ground, block padding `--ocelle-space-4`, inline `--ocelle-space-6`, `border-block-end` rule, heading column `gap: var(--ocelle-space-1)`, R-04's wrap rule, FR-019 fonts, FR-008 margins, `box-sizing: border-box`, `:host([hidden])`
- [ ] T030 [US2] `src/index.ts`, `src/browser.ts`, `exports` (`./ocelle-page-header.js`, after the base's element entries and before `./browser.js`, the order T028a pins), manifest regenerated
- [ ] T031 [US2] `storybook/stories/page-header.stories.ts` (sizes, every slot empty and filled, empty heading) and baselines; README section, the Entry points table row for `@ocelle/elements/ocelle-page-header.js` as T028a pins it, and CHANGELOG
- [ ] T032 [US2] Evidence in `specs/011-layout-headers/reviews/phase-3/plants.md`: the US2 pairing plants and the R-17 style plants for the template

**Checkpoint**: `tdd-check.sh 3` reports `pass`; the phase-2 gate set without `contrast` and `brand-rules` passes.

---

## Phase 4: User Story 3 - Context sidebar (Priority: P3)

**Goal**: US3-1 to US3-13; FR-020 to FR-023, FR-028 for `ocelle-context-sidebar`.

**Independent Test**: on the fixture, a sidebar with `label`, head, three sections and a footer in a 600 px container
exposes one navigation landmark with that name, four full-width dividers with `--ocelle-space-4` padding, the
footer at the block end, and survives the two page resets.

### Tests (red, one commit)

- [ ] T033 [P] [US3] `packages/elements/test/scenarios/context-sidebar.ts`: US3-1 to US3-13 as shared bodies; US3-3 with `div`, `span` and `ocelle-section-header` sections, `ul` and `p` sections, head and footer content, the footer `<p hidden>` edge variant, the page-reset variants `ul { margin: 0; padding: 0; list-style: none }` and `* { margin: 0; padding: 0; border: 0 solid }`, and the hidden-section variant; US3-11 text between sections; US3-12 reading the tree only (one navigation node per sidebar, the four naming cases, no other node carrying the name, the host `aria-label` never written or removed); token sentinel; no-event check; each "does not" paired
- [ ] T034 [P] [US3] `packages/elements/test/context-sidebar.test.ts`, `packages/elements/test/browser/context-sidebar.test.ts`, `packages/elements/test/entry-context-sidebar.test.ts`, `entry-root.test.ts` extended; manifest test (`label` not reflected; slots `head`, default, `footer`; empty lists; no member for the internals key, R-11); build and pack tests for `dist/ocelle-context-sidebar.js`
- [ ] T035 [P] [US3] `packages/elements/test/node/readme.test.ts` sidebar statements of FR-036, one assertion each: the common ones (usage, slots `head`, default and `footer`, `label` with its "not set" look, the tokens read, the empty-slot rule with "remove an element from the slot rather than hide it", the edge-margin trim of FR-008 for head and footer and that a page rule wins), the Consumer-need workarounds it replaces, per FR-036's mapping: part-level padding and gap overrides, and token-painted dividers; and its own ("set a distinct `label`" with the assistive-technology reason, the host `aria-label` rule, wrap each section in an element, remove sections rather than hide them all, which section properties a page rule can and cannot change); the `@ocelle/elements` CHANGELOG naming the element and its entry point as a MINOR addition, as T016 does; story test extended to the sidebar stories, including one story per US3-12 case rendered alone
- [ ] T035a [US3] Pinned element lists (E1 of `reviews/analysis/fixes-1.md`), re-listed at the phase base as T016a says, recorded in `specs/011-layout-headers/reviews/phase-4/notes.md` and changed in this red commit where this phase's green tasks (T038, T039) change them: `packages/elements/test/exports.test.ts` (the base's root exports plus `OcelleContextSidebar`, in the namespace's sorted order); `packages/elements/test/node/readme.test.ts` `entryRows` (the row `@ocelle/elements/ocelle-context-sidebar.js` | `dist/ocelle-context-sidebar.js` | "`ocelle-context-sidebar` only; for hosts with a bundler", in the form of the base's rows, after the base's element rows and before the `browser.js` row) and its `exports` keys assertion (the same key in the same place); `packages/elements/test/node/manifest.test.ts` module paths (`src/ocelle-context-sidebar.ts` added, by code point); `packages/elements/test/build/build.test.ts`'s module-build file list; `pack.test.ts` and `entry-root.test.ts` as T034 says

### Implementation (green)

- [ ] T036 [US3] `packages/elements/src/naming.ts`: `internalsKey` (`Symbol("internals")`, `@internal`) for the sidebar's and rail's internals (005's elements unchanged, R-11). Phase 5 needs this task: if phase 4 is deferred or runs after phase 5, T036 moves into phase 5's green tasks before T044, and its test is then T042's manifest no-member assertion and T047's role probe
- [ ] T037 [US3] `packages/elements/src/ocelle-context-sidebar.ts` per R-09 and R-11: the host is the navigation landmark through `ElementInternals` (`role = "navigation"`, `ariaLabel` from `label`, the host `aria-label` winning natively and never written), no inner `<nav>`; host box `display: flex; flex-direction: column; min-block-size: 100%`; head, sections and footer wrappers; section rules with `:not([hidden])` and `!important` on padding, `margin-inline`, `border-block-start`, `display` (`margin-block: 0` normal); first section without a border; divider placement per FR-022 and US3-13; FR-008 head and footer edge trims with `:not([hidden])`; `--ocelle-color-rail` ground
- [ ] T038 [US3] `src/index.ts`, `src/browser.ts`, `exports` (`./ocelle-context-sidebar.js`, after the base's element entries and before `./browser.js`, the order T035a pins), manifest regenerated
- [ ] T039 [US3] `storybook/stories/context-sidebar.stories.ts` (full, no head, no footer, one section, text in the slot, empty sections, hidden sections, the four US3-12 cases each alone) and baselines; README section, the Entry points table row for `@ocelle/elements/ocelle-context-sidebar.js` as T035a pins it, and CHANGELOG
- [ ] T040 [US3] Evidence in `specs/011-layout-headers/reviews/phase-4/`: `plants.md` with the US3 pairing plants and the R-17 style plants; the role probe of contracts/checks.md (`axe.commons.aria.getRole(host) === "navigation"` for a host with `label`, with a host `aria-label` and with neither, with axe-core's version, and the `#private`-field plant reading `null`)

**Checkpoint**: `tdd-check.sh 4` reports `pass`; the phase-3 gate set passes.

---

## Phase 5: User Story 4 - Personal rail (Priority: P4)

**Goal**: US4-1 to US4-11; FR-024 to FR-028 for `ocelle-personal-rail`.

**Independent Test**: on the fixture, a rail with `label`, three stand-in links and one bottom link is one
navigation landmark on the chrome, 52 px wide with a 44 px content box when vertical, a wrapping row when
horizontal, and keeps its orientation at 721, 720, 719 and 320 px.

### Tests (red, one commit)

- [ ] T041 [P] [US4] `packages/elements/test/scenarios/personal-rail.ts`: US4-1 to US4-11 as shared bodies; US4-2 with the stand-in items' computed colour equal to `--ocelle-color-chrome-ink` and the focus ring inside the border box; US4-4 at 721, 720, 719 and 320 px; US4-5 orientation change with focus kept; US4-6 in both orientations; US4-7 at 320 px in LTR and RTL; US4-9 with the horizontal rail still a row in forced colours; US4-10 running the README's `matchMedia("(width < Npx)")` example (read from `packages/elements/README.md`) through a same-origin module with the viewport at N and N − 1, its first assertion being that the README's rail section holds the example's code block (an `expect` on the located block, so at red, before T046 writes it, the test fails with an assertion failure on the missing example, not a throw or a setup error), and only then running it; FR-006's empty-value case for the rail, beside US4-8's invalid value: rails with `orientation=""` and `orientation="sideways"` laid out vertically as with no `orientation`, each keeping the value the page wrote, in the same test as an `orientation="horizontal"` twin laid out as US4-3's row (plant: contracts/checks.md § Pairing plants, the empty-or-invalid row); a rail written with no `orientation` carrying no `orientation` attribute after upgrade, in the same test as `rail.orientation = "horizontal"` set by property reflecting it (FR-006; plant: the upgrade row); US4-11 reading the tree only; token sentinel; no-event check; each "does not" paired
- [ ] T042 [P] [US4] `packages/elements/test/personal-rail.test.ts`, `packages/elements/test/browser/personal-rail.test.ts` with the linked same-origin stand-in stylesheet `packages/elements/test/browser/fixtures/rail-items.css`, `packages/elements/test/entry-personal-rail.test.ts`, `entry-root.test.ts` extended to all five; manifest test (`label` not reflected; `orientation` reflected with type `"vertical" | "horizontal" | undefined`; slots default and `bottom`; empty lists; no internals member); build and pack tests for `dist/ocelle-personal-rail.js`
- [ ] T043 [P] [US4] `packages/elements/test/node/readme.test.ts` rail statements of FR-036, one assertion each: the common ones (usage, slots default and `bottom`, `label` and `orientation` with its values and its "not set" look, the tokens read, the empty-slot rule with "remove an element from the slot rather than hide it"; FR-008's edge-margin statement does not apply to the rail), "set a distinct `label`" with the assistive-technology reason and the host `aria-label` rule, the Consumer-need workaround it replaces: personal-rail `::part` overrides, per FR-036's mapping; and its own (the orientation example with an exclusive bound `width < N`, items sized by themselves at `--ocelle-size-rail-item`, `<a>` items need `color: inherit` and a 24 px target, a taller rail grows and scrolling is the container's, the note for #12 that `orientation` and `label` are the whole interface); the `@ocelle/elements` CHANGELOG naming the element and its entry point as a MINOR addition, as T016 does; story test extended to the rail stories, including one per US4-11 case rendered alone
- [ ] T043a [US4] Pinned element lists (E1 of `reviews/analysis/fixes-1.md`), re-listed at the phase base as T016a says, recorded in `specs/011-layout-headers/reviews/phase-5/notes.md` and changed in this red commit where this phase's green tasks (T045, T046) change them: `packages/elements/test/exports.test.ts` (the base's root exports plus `OcellePersonalRail`, in the namespace's sorted order); `packages/elements/test/node/readme.test.ts` `entryRows` (the row `@ocelle/elements/ocelle-personal-rail.js` | `dist/ocelle-personal-rail.js` | "`ocelle-personal-rail` only; for hosts with a bundler", in the form of the base's rows, after the base's element rows and before the `browser.js` row) and its `exports` keys assertion (the same key in the same place); `packages/elements/test/node/manifest.test.ts` module paths (`src/ocelle-personal-rail.ts` added, by code point); `packages/elements/test/build/build.test.ts`'s module-build file list; `pack.test.ts` and `entry-root.test.ts` as T042 says

### Implementation (green)

- [ ] T044 [US4] `packages/elements/src/ocelle-personal-rail.ts` per R-10 and R-11: host navigation landmark through `ElementInternals` under `internalsKey`; vertical default (`inline-size: var(--ocelle-shell-rail-width)`, padding block `--ocelle-space-2` and inline `--ocelle-space-1`, `box-sizing: border-box`, groups centred, `--ocelle-space-1` gaps, divider `aria-hidden` only when both groups are non-empty); `:host([orientation="horizontal"])` row with wrapping primary group, bottom group `max-inline-size: 50%` and `margin-inline-start: auto`, block-direction divider over every row; chrome ground and chrome-ink colour; no media or container query; template identical in both orientations
- [ ] T045 [US4] `src/index.ts`, `src/browser.ts`, `exports` (`./ocelle-personal-rail.js`, after the base's element entries and before `./browser.js`, the order T043a pins), manifest regenerated
- [ ] T046 [US4] `storybook/stories/personal-rail.stories.ts` (vertical, horizontal, no bottom, no primary, wrapped at a narrow width, the three US4-11 cases each alone; root `data-story="rail-items"`) with the stand-in item rules in the story stylesheet, no `style` attribute; baselines; README section (the #12 note, the orientation example, the `<a>` item note), the Entry points table row for `@ocelle/elements/ocelle-personal-rail.js` as T043a pins it, and CHANGELOG
- [ ] T047 [US4] Evidence in `specs/011-layout-headers/reviews/phase-5/`: `plants.md` with the US4 pairing plants (including the README `max-width` plant for US4-10 and the `@media` and `@container` flips for US4-4) and the R-17 style plants; the role probe for the rail as in T040

**Checkpoint**: `tdd-check.sh 5` reports `pass`; the phase-3 gate set passes; quickstart.md steps 1 to 8 hold.

---

## Dependencies & Execution Order

- Phase 1 needs #10 on `main` merged into the branch (T001), then T002 before any red commit of phases 2–5.
- Phase 2 (US1) needs phase 1; it adds the eyebrow tokens phase 3 uses and the `ocelle-section-header` phase 4 uses.
- Phase 3 (US2) needs phase 2 (eyebrow tokens, wrap rule); phase 4 needs phase 1 and phase 2 (`ocelle-section-header` for
  US3-3's section variants); phase 5 needs phase 1 and
  T036 (`internalsKey` in `src/naming.ts`, phase 4). Phases 4 and 5 run after phase 3 in order because they share
  `index.ts`, `exports`, the manifest and the README.
- Phase 5 can be split off without touching phases 1–4. Phase 4 cannot be deferred behind phase 5 unless T036 moves
  into phase 5 (T036 says how).
- The pinned element lists (T016a, T028a, T035a, T043a) are re-listed at each phase base, so a phase written after a
  sibling or an earlier phase changed them starts from the lists as they are.
- Within a phase: the red commit (Tests) first, then Implementation, then the evidence task.

## Parallel Opportunities

- Inside each red commit, the `[P]` test tasks touch different files and can be written in parallel.
- The pinned-list tasks (T016a, T028a, T035a, T043a) are not `[P]`: they edit files that their phase's other red
  tasks also edit (`exports.test.ts`, `entry-root.test.ts`, `readme.test.ts`, `manifest.test.ts`, `build.test.ts`,
  `pack.test.ts`; T014–T016, T027–T028, T034–T035, T042–T043), and are written together with those tasks in the same
  red commit.
- T007 runs in parallel with T003–T004.
- Implementation tasks within a phase are sequential (shared `index.ts`, `exports`, manifest).

## Implementation Strategy

MVP is phase 2 (section header and card with the eyebrow tokens): a usable screen section. Each later phase adds one
element and is reviewed and folded on its own. Siblings #16, #15 and #9 touch the same shared files; conflicts are
resolved at landing by merging `main` (R-16), with `custom-elements.json` regenerated.
