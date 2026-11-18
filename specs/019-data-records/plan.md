# Implementation Plan: Data Records (Data Table, Event Timeline, Evidence Chain)

**Branch**: `019-data-records` (work on `claude/013-data-display-2`) | **Date**: 2026-11-15 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/019-data-records/spec.md`, approved by the operator at the spec gate on
2026-11-15 after three checks (`reviews/spec/operator-gate.md`). Spec check 3's notes SPEC-3-01 to SPEC-3-05 are
taken up in research R-04, R-06 and R-12 and in the red commits' bodies (below).

## Summary

This mission adds five elements to `@ocelle/elements`: `ocelle-data-table`, `ocelle-event-timeline` with its item
`ocelle-timeline-event`, and `ocelle-evidence-chain` with its item `ocelle-evidence-step`. It also adds a data-table
block to `@ocelle/styles`. It replaces kitty-mission-ui's `.sk-data-table` family and the Desktop V2 prototype's event
history and evidence chain.

- **Data table.** The consumer's own `<table>` is slotted unchanged into a scroll region built on 009's
  `OverflowRegion` (R-01, R-02). Its caption, headers and cells keep the platform's table semantics in the consumer's
  tree. The cells are styled by zero-specificity rules in `@ocelle/styles`, because shadow styles cannot reach them,
  with a prose override at (0,1,0) (R-06). The region is a named `group` tab stop only while the table overflows. It
  is named from the host `aria-label`, then `label`, then the caption's text, hidden parts skipped and image `alt`
  read (R-04). One host rule sizes the module's track to `fit-content`, so cells wrap before the table scrolls
  (decision 1 (a), decided at the plan gate; R-03). `:host { min-inline-size: 0 }` lets it shrink as a flex or grid item
  (R-02). No box sets `container-type`, so the element keeps its table's width in a shrink-to-fit host such as a
  dialog (R-02, R-07). The caption is not sticky until 009's module has an option, requested of 009's owner, that
  keeps a pinned start box out of the start fade (R-17; Q-F decided (b)). Until then it scrolls with the table, starts
  at the table's start edge, and is capped by the box's measured width, less the end fade only while it shows, so it
  wraps inside the box at rest. The exact (unrounded) width is read through an empty `block-size: 0` measuring
  element, and the end fade's share is written one animation frame after the fade changes, outside 009's
  `ResizeObserver` delivery, so writing the cap raises no `ResizeObserver` loop, and the caption has no inline size containment, so its longest word widens a
  fitting table instead of making it overflow (R-07).
- **Timeline and chain.** Each renders a shadow `<ol role="list">` with one `<li role="listitem">` per visible item,
  assigned manually (R-08). Each list is named on the `<ol>`, and a blank host `aria-label` counts as absent (R-09).
  The name comes from 009's exported `resolveName`. Markers, connectors and ordinals are `aria-hidden`; markers and
  connectors are real spans drawn with borders, so they are measurable and visible in forced colours (R-08, R-10,
  R-12). Markers are round (`border-radius: 50%`, Q-D decided).
  - **Timeline.** Each event has a time line above its content (Q-C (a)), and a dot marker is centred on the event's
    first line with `1lh`. The time is the event's named `time` slot when that has visible non-blank content, else the
    reflected `time` attribute (Q-E, "Yes: named time slot"); the slotted time is styled through `::slotted()` and the
    item text stays time first. One internal `hasTime(event)` predicate, with `hasSlottedTime(event)`, in a module
    outside the manifest and the exports map, decides the time box and the marker's line, in the event and in the
    timeline (R-10). Each connector is gapped: it runs from its own dot's end
    to the next dot's start and never crosses a dot, with its end taken from the next event's type (R-10).
  - **Chain.** The chain is a wrapping flex row. Connectors sit in each step's trailing padding, and a line end is
    measured from layout, so no connector dangles or crosses lines (R-12). Every step reserves a `size-step` line box,
    so all connectors share the marker's centre line. A chip step is drawn by the container through `::slotted()`:
    `radius-2`, outline only (Q-A (a)), 20.4 px tall.
  - **Before upgrade.** Four (0,0,0) `@ocelle/styles` rules put one visible item per line and hide `aria-hidden="true"`
    items, as the upgraded containers do (R-08).
- **Tokens and contrast.** No new token and no new contrast row. Contrast is checked twice: a node check ties each
  painted colour to a `checked` row of `pairs.json`, and the browser bodies tie each rendered colour to its token
  (R-13).
- **Decided at the plan gate (2026-11-16).** Decision 1 (a), Q-A (a), Q-B (a) and Q-C (a) confirm the plan's
  defaults. Q-E is "Yes: named time slot", a change to FR-023 now in the spec. Q-D was decided at squad round 1, Q-F
  at squad round 2 as (b), through PLAN-FRESH-2-002's option (c). Q-G, whether an empty or hidden slotted time lets
  the `time` attribute apply, was decided (a) after the gate (`reviews/plan/operator-gate.md`, 2026-11-16): the
  attribute applies, as FR-023 and US2-13 read.
- **Decided after the analysis (2026-11-16).** C1 (c): a story for a standalone `ocelle-timeline-event` and one for a
  standalone `ocelle-evidence-step`, and one Principle V exception for the states named by a host `aria-label`
  (Complexity Tracking). I7 (a): the caption cap's `--data-table-box-size` and `--data-table-end-fade` are a
  documented base-style hook between `@ocelle/elements` and `@ocelle/styles` (constitution VII). See § Decisions after
  the analysis.
- **Decided on the T001 recheck (2026-11-17).** Q1 (a): the column headers use 011's four eyebrow tokens (weight 600),
  superseding Q-B (a). Q2 (c): the end fade is written as the measured px width of `.region-edge.end`, so the data
  table's own per-instance sheet holds px figures only, and the README's Styles convention is amended for the count of
  sheets. Q3 (a): phases fold from bases at 8ee3351 or later. Q4 (a): research cites the merged lines. Q5 (b): the
  pre-upgrade list rules go in `base.css`'s base layer beside 013's facts rule. See § Decisions after the recheck.
- **Decided on the phase 1 spike (2026-11-18).** Q1 (b): two data-table stories named through a host `aria-label`
  (non-blank and blank), so phase 1 has 14 stories and 28 baselines (19 and 38 since the inventory decisions, 20 and
  40 since the re-analysis, 21 and 42 since fixes-2 Q-1 (b)), and the Principle V exception drops the data
  table. Q2 (a): the column headers stay upper case; US1-1 compares with an outside table drawn the same way and
  asserts the upper-case names; both READMEs say so. T005 "Proceed, map later": the data-table mapping rows read
  "pending inventory" until the inventory is supplied before the pull request lands (SC-001 open), since superseded
  by IQ-1 (a). See § Decisions after the phase 1 spike.
- **Decided on the library inventory (2026-11-18).** IQ-1 (a): the spec-kitty design library's variant set, re-read
  at `develop` a6518cd, is the inventory, one README mapping row per modifier, state, structure role and part; the
  data-table rows are written in phase 1, no row reads "pending inventory". IQ-2: a sticky header row
  (`sticky-header`, the page's block bound on the host), built on an opt-in block-axis option this mission adds to
  009's overflow-region module (FR-008 amended, FR-018; 009's tests unchanged). IQ-3: `@ocelle/styles`'
  `data-ocelle-align="end"` hook for numeric cells (block 4). IQ-4 and IQ-5: `striped` rows on `inset` and a row hover
  on `hover-bg`, with a forced-colours row band. IQ-6 (a) and IQ-7 (a): README statements. Phase 1 grows to 19
  stories and 38 baselines (the mission 42 and 84; 20, 40, 43 and 86 since the re-analysis; 21, 42, 44 and 88 since fixes-2 Q-1 (b)). See § Decisions on the
  library inventory.
- **Decided on the inventory follow-up questions (2026-11-18).** Q-I1 to Q-I3 confirm the defaults (the `sheet`
  header ground; the light-theme hover collision accepted and noted in the README; the hover always on). Q-I4: the
  block-axis option also fades the block end while content is below, never under the pinned header, with a
  `CanvasText` line in forced colours (FR-018, R-18, US1-26 to US1-28). Q-I5: 009's contract file gets a one-line
  pointer to `contracts/overflow-region-block-axis.md`. Q-I6 (a) and Q-I7 (a) confirm the defaults (twice the fade
  depth; no story for the fade's off state). Story and baseline counts are unchanged.
- **Decided on the re-analysis (2026-11-18).** C1 (b): a "sticky header, unbounded" story (US1-20), so phase 1 had 20
  stories and 40 baselines and the mission 43 and 86, and one more Principle V exception row covered the block-end
  fade's two scroll-position states (scrolled to the block end; the room-rule state). Fixes-2 Q-1 (b): a "sticky
  header, under the room rule" story (rows below, no fade), so phase 1 has 21 stories and 42 baselines and the
  mission 44 and 88, and that row covers only the scrolled-to-end state. A1 (c): T082 measures
  both pinned-box measures at 320 px with a two-line caption and stops for the operator's choice before the scaffold.
  A2 (a): the row hover (and its forced-colours band) under `@media (hover: hover)`, with a no-hover body and element
  plants. G1 (a): PageUp, PageDown, Home, End, Space and Shift+Space are the browser's on the block-axis box, stated
  and tested. I1 and I2 fixed; C2 stays. See § Decisions on the re-analysis.
- **Decided on phase 1's second spike (2026-11-18).** T082 measured R-18's and R-20's points
  (`reviews/phase-1/spike-2.md`). Q-1 (a): the pinned-box measure is the `<thead>`'s current block-end edge. Q-2 (a):
  block 1 pins the `<thead>` at a negative block-start inset of the ring room. Q-3 (c): the module sets
  `data-axis="both"` (`overflow-y: auto`) only while the box overflows in the block axis, measured by the
  implementer before the red commit (a stop-and-ask point). Q-4 (a): `.region-edge.block-end` is zero-wide outside
  forced colours. T082's addendum: Q-A1 (a), no `scrollbar-gutter` (the scrollbar's room read as `offsetWidth −
  clientWidth`); Q-A2 (a), the caption-link rule asserted at a partly scrolled position, the fully-past position a
  paired platform-alone assertion; Q-A3 (a), a classic-scrollbar half (`test/browser/data-table-scrollbar.test.ts`,
  launched without `--hide-scrollbars`) for the sticky caption body, the RTL lift and the mask figure. Story, baseline and task counts are unchanged. See § Decisions on phase 1's second spike.

009, 013 and op 016 are on `main`, and `main` (b594b7e) is merged into this branch (8ee3351, operator decision of
2026-11-17, `reviews/main-merge.md`). The first task rechecked the plan against it (R-14, `reviews/recheck.md`):
009's pinned-start option (R-17) has not landed, so the caption is not sticky (Q-F (b)).

## Technical Context

**Language/Version**: TypeScript 6.0.3 (strict, `erasableSyntaxOnly`); Node 26.13.0 in CI, 22.23.4 in this container.

**Primary Dependencies**: `lit` 3.3.3. No new dependency. Internal: 009's `src/overflow-region.ts` (on `main`): the
data table uses `OverflowRegion` (R-02), and the timeline and chain import its `resolveName` (R-09). Changed here, by
the operator's decision IQ-2: one opt-in block-axis option in that module (FR-018, R-18,
contracts/overflow-region-block-axis.md), set only by the data table's `sticky-header`; 009's elements do not set it.
Requested of 009's owner, not built here: a module option that keeps a pinned start box out of the start fade (R-17).

**Storage**: N/A.

**Testing**:
- The two harnesses of 005 and 013: shared scenario bodies run in process (the `elements` project, mutated) and on
  the built browser build on strict-CSP fixture pages (`elements-browser`).
- The harness paths are 013's: `packages/elements/test/in-process.ts`, `test/browser/driver.ts` and
  `test/scenarios/driver.ts`.
- Driver additions, each with its own test in both harnesses: `scrollTop` and `setScrollTop` (phase 1, the block-axis
  option, R-18) and `itemTexts` (phase 2, R-11). Everything else is reused as merged (the row hover uses the merged
  `hover`): 013's
  `viewport`, `scrollWidth`, `copy`, `pressTab`, `focused`, `layout` and `text`, and 009's `press`, `focus`,
  `activeElement`, `scrollLeft`, `setScrollLeft`, `frameRecord` and `settle`. T001 records how `main` reconciled the
  two drivers' `computed`, `reducedMotion` and focus readers, and checks.md names the helper each keyboard body uses
  (R-14).
- `@ocelle/styles` tests in the package's own layout: browser bodies in `test/browser/data-table.test.ts` (the
  data-table block and the override) and `test/browser/list-items.test.ts` (block 3's pre-upgrade list rules, phases
  2 and 3; analysis I5); a node test `test/prose-override.test.ts` that the
  override restates every property of every 003 prose rule that can match a table part (R-06); a contrast node test
  `test/data-table-pairs.test.ts` (R-13); and the change to 003's `test/source.test.ts` that each phase's red commit
  makes for the rules its green adds (R-06).
- `packages/elements/test/node/records-pairs.test.ts`, the contrast node check for the five templates (R-13).
- The module's block-axis option (R-18): a new test-only host `packages/elements/test/fixtures/overflow-host-block.ts`
  and its bodies in `packages/elements/test/overflow-region-block.test.ts` (in process) and
  `packages/elements/test/browser/overflow-region-block.test.ts` (fixture), with the pure `blockClearanceScroll` and
  `blockEdgeState` cases and the block-end fade's bodies (Q-I4). The classic-scrollbar half (Q-A3 (a)):
  `packages/elements/test/browser/data-table-scrollbar.test.ts` in `elements-browser`, its own `beforeAll` launching
  Playwright's `chromium` with `ignoreDefaultArgs: ["--hide-scrollbars"]` as 009's `test/browser/scrollbar.test.ts`
  does: on the data table's fixture page the sticky caption body with the block-axis scrollbar's room subtracted and
  the RTL lift, and on the block-axis test host's page T079's mask figure with a non-zero block-scrollbar layer (the
  room is 0 in both harnesses). Its element-plant
  guards run in that project; mutants on the room, which the in-process mutation run cannot kill, are recorded naming
  its bodies (009's landing L1-02). 009's own module, scroller and board tests are not edited and must pass (SC-007); the README sentence on the
  module's inputs that `test/node/readme.test.ts` pins changes in phase 1's red, named in its body.
- The story test in `storybook-integration`, extended per phase with 320 px reflow per container story.
- #10's gates on the stories: `storybook-build`, `visual` (light and dark baselines from the pinned container) and
  `axe`.
- Gate plant runs through op 016's `--affected` selection (R-15). Element plants (CSS-only behaviour) run after each
  phase's green and are recorded in `reviews/phase-<N>/element-plants.md` (contracts/checks.md § Element plants).
- Details: [contracts/checks.md](contracts/checks.md).

**Target Platform**: evergreen Chromium, measured. WebKit 16.4+ is unmeasured (the README's Engines note). No new
engine-floor feature: manual slot assignment (013) and the module's features (009) are already listed.

**Project Type**: library (web components) in a pnpm workspace.

**Performance Goals**: none specific.
- Each class adopts one shared stylesheet. The data table also gets the module's one per-instance sheet (009) and its
  own per-instance sheet, which holds the measured box width and the measured end fade depth, px figures only (R-07;
  the README's Styles convention amended for the count of sheets, recheck Q2 (c)).
- Per container: one `MutationObserver` (the timeline's on its events' subtrees too, for the slotted time). Per
  event: one `MutationObserver` on its own subtree, for the slotted time (R-10). The chain also has one `ResizeObserver`, on its list and its items. The data
  table has one `ResizeObserver` of its own, on its `block-size: 0` measuring element (not on `.region-box`), for
  the caption's cap, and at most one pending animation frame request per instance, for the end fade's share of the
  cap (R-07).

**Constraints**: strict CSP with no exception; token-only styles with no new `style-lint` allowance (every value is a
token, a keyword, a system colour in forced colours, `0`, a `%` (which `token-only.ts` allows: the table's
`inline-size: 100%` and the markers' `border-radius: 50%`), `1lh`, or `calc()` over tokens); no `sk-` names; no
monospace; no I/O; one heavy job at a time in this container.

**Scale/Scope**: 5 elements, 0 tokens, 0 contrast rows, 4 `@ocelle/styles` blocks (the data-table rules, their prose
override, the four pre-upgrade list-item rules, and the numeric-cell hook), 2 documented base-style hooks (the caption
cap's two custom properties, I7 (a); the `data-ocelle-align` attribute, IQ-3), 1 internal module option (009's
block-axis option, IQ-2), 3 driver additions (`scrollTop` and `setScrollTop` in phase 1, `itemTexts` in phase 2), 44
stories (21 in phase 1, 11 in phase 2, 12 in phase 3, each with two baselines: 88 PNGs; spike Q1 (b), inventory
decisions IQ-2 to IQ-5, re-analysis C1 (b), fixes-2 Q-1 (b)).

## Constitution Check

*Gate: passes before Phase 0 and again after Phase 1 design (rechecked after squad rounds 1 and 2, and after the plan
gate's answers of 2026-11-16: decision 1, Q-A, Q-B and Q-C (a), Q-E a named `time` slot; Q-D and Q-F decided at squad
rounds 1 and 2; Q-G decided (a)), after the analysis decisions of 2026-11-16 (C1 (c), I7 (a)), and after the recheck
decisions of 2026-11-17 (Q1 (a), Q2 (c), Q3 (a), Q4 (a), Q5 (b)), and after the phase 1 spike decisions of 2026-11-18
(Q1 (b), Q2 (a), T005 "Proceed, map later"), and after the library inventory decisions of 2026-11-18 (IQ-1 (a),
IQ-2 to IQ-5 added, IQ-6 (a), IQ-7 (a)), after the follow-up answers Q-I1 to Q-I7, and after the re-analysis
decisions of 2026-11-18 (C1 (b), A1 (c), A2 (a), G1 (a)) and the answer to fixes-2 Q-1 (b), and after the decisions on
phase 1's second spike (Q-1 (a), Q-2 (a), Q-3 (c), Q-4 (a)), none of which changes a verdict below. Two Principle V
exceptions are recorded (Complexity Tracking): the host `aria-label` states, chosen by the operator as C1 (c) and
narrowed to the timeline and the chain by spike Q1 (b); and the block-end fade's scrolled-to-end state, chosen
by the operator on the re-analysis (C1 (b), with Q-I7 (a)) and narrowed to that one state by the answer to fixes-2 Q-1
(b). IQ-2's change to 009's module is the operator's decision under FR-008 as amended, not a principle
exception (Complexity Tracking, notes).*

| Principle | How this plan meets it |
|---|---|
| I. Names, no I/O, small interface, manifest | **Tags**: `ocelle-data-table`, `ocelle-event-timeline`, `ocelle-timeline-event`, `ocelle-evidence-chain`, `ocelle-evidence-step`. **Events**: none. **I/O**: none. **Properties**: `label`, `wrap`, `stickyHeader` (attribute `sticky-header`), `striped` (data table; the two booleans reflected, as `ocelle-card`'s `inset`, IQ-2, IQ-4); `label` (timeline, chain); `time`, `wrap` (event); `variant`, `wrap` (step). Every property is `\| undefined` with `@default undefined`; `wrap`, `variant`, `time`, `sticky-header` and `striped` reflect, because the styles or the container's observer read them (`time`: PLAN-CORRECTNESS-1-003). **Parts**: `list` on the two containers; `time` and `content` on the event; `content` on the step. **CSS hooks**: one base-style hook between the packages, `--data-table-box-size` and `--data-table-end-fade`, written by the data table and read by `@ocelle/styles`' caption cap (analysis I7 (a); row VII); and `@ocelle/styles`' `data-ocelle-align="end"` hook for numeric cells (IQ-3, FR-019), a `data-ocelle-` attribute set by the consumer, not an element member; no element declares a CSS custom property in the manifest. **Internal module**: 009's overflow-region module gains the opt-in block-axis option (IQ-2, FR-018), internal and outside the manifest as the module is. **Slots**: the default slot of each element, and the event's named `time` slot (Q-E), which the manifest declares. The manifest declares everything, with every list stated ([contracts/](contracts/)). No element module exports a function: the internal `hasTime` and `hasSlottedTime` live in `src/timeline-time.ts`, outside the manifest glob and the exports map, and a manifest test statement pins that (R-10). The caption's measured width and the end fade's depth are custom properties with no `--ocelle-` prefix (the prefix is the tokens'), documented as the base-style hook above, not manifest members: the element writes them and its styles never read them (R-07). |
| II. Tokens only, brand rules | **Tokens**: every value is a token (R-06, R-10, R-12); no new token (R-13); the column headers use 011's eyebrow tokens as they are (recheck Q1 (a)). **No monospace**: cells, times, ordinals and chips use `font-sans` with `figures`. **`color-rule`**: only on decorative lines (the row and header rules, the connectors; FR-013). **Radius**: `radius-2` on the chip (the one radius, never `radius-pill`). The dot and the step marker are round, `border-radius: 50%` with no token: a mark shape, not a corner radius, so the one-radius rule is not engaged and no radius token is added (FR-031, FR-040; Q-D, operator decision (a) on PLAN-CORRECTNESS-1-004). **Ochre**: none. **Grounds** (IQ-2, IQ-4, IQ-5): the pinned header on `color-sheet`, stripes on `color-inset`, the hover on `color-hover-bg`, three main grounds, never a rule token; the forced-colours row band is `bar-width` in system colours (R-18, R-20). |
| III. Accessible by construction | **ID references**: none across a root. The table's references stay in the consumer's tree (R-01), and the region is named by copied text (R-04). **Roles**: the table's own roles; a `group` on the region while it overflows (009); `list` and `listitem` on the shadow lists, explicit for WebKit (R-08). **Hidden**: markers, connectors and ordinals are `aria-hidden`; item text is asserted by `itemTexts` (R-11). **Keyboard**: the overflowing region is the only added tab stop, with arrows, clearance and handover from the module; slotted links keep theirs. **Contrast**: text and structural marks use ink tokens with text declarations on the nine main grounds (a slotted time takes the attribute time's `ink-muted` through `::slotted()`); decorative lines are exempt (FR-013), checked by a node check against `pairs.json` and by rendered-colour bodies (R-13). **Forced colours**: every mark is a border drawn in `CanvasText`; the chip's box rule sits outside the variant block (R-10, R-12); the stripe and the hover, whose grounds forced colours remove, are drawn by a first-cell row band in `CanvasText` and `Highlight`, and the pinned header is opaque (R-18, R-20). **Sticky header** (IQ-2): the module keeps a focused body element clear of the pinned header (WCAG 2.4.11), the block-axis region is a tab stop only while it overflows, with ArrowUp and ArrowDown from the module and PageUp, PageDown, Home, End, Space and Shift+Space left to the browser, each a tested keyboard path (re-analysis G1 (a)), and its block end fades while rows are below (Q-I4), never under the header, with the ring kept clear of the fade and a `CanvasText` line in forced colours (R-18); the block-axis scrollbar's room is reserved only while the region overflows in the block axis, so a right-to-left table that overflows only sideways keeps its start reachable (WCAG 1.4.10; spike-2 Q-3 (c)), and the block-end edge is zero-wide outside forced colours, so axe reports nothing on the rows under it (spike-2 Q-4 (a)). **Hover** (IQ-5): a look only, no event, tab stop or cursor, and only under `@media (hover: hover)`, so a touch screen's tapped row keeps no hover ground (re-analysis A2 (a)). **Reflow**: 320 px tests per container, the data table as a flex and a grid item, and in three shrink-to-fit hosts (a dialog, an inline-block, a start-aligned column flex), where it is never 0 px wide (R-02); the caption wraps inside the box's unmasked width at rest (R-07). **Naming**: a blank host `aria-label` counts as absent on the lists, through 009's `resolveName` (R-09); the region's caption name skips hidden parts and reads image `alt` (R-04). **axe**: #10's `axe` gate on every story, with no exception entry planned. |
| IV. Strict CSP, offline | Adopted stylesheets and `base.css` only. No `style` attribute; the module's mask figures use its per-instance sheet (009), and the data table's measured box width and end fade depth use its own, px figures only (R-07, recheck Q2 (c)). Fixture pages assert zero violations. |
| V. Storybook, behaviour tests | A story per variant and state, light and dark ([contracts/checks.md](contracts/checks.md) § Stories); the inventory decisions add five data-table stories (a bounded sticky header, a numeric column, striped rows, a hovered row and a striped table with an even row hovered, the two hover states through #10's pointer parameter), the re-analysis adds a sixth, the sticky header with no bound (US1-20, C1 (b)), and the answer to fixes-2 Q-1 (b) a seventh, the sticky header under the room rule (a bound leaving rows below but less than twice the fade depth under the header: no fade; US1-26's room-rule half). The item elements' states are stories in their container's file, the standalone event and the standalone step included (analysis C1 (c)). Every spec'd state has a story, the hidden item, the unnamed overflowing table, the table-less data table and the empty containers included (PLAN-CORRECTNESS-1-007, operator decision (a)), except the states named by a host `aria-label` of the timeline and the chain: one exception row in Complexity Tracking, chosen by the operator (C1 (c)), proven by browser bodies, with a sunset each phase's spike checks. The data table's host `aria-label` states, non-blank and blank, have stories since phase 1's spike met the sunset (spike Q1 (b)). The block-end fade's scrolled-to-end state (the bounded table scrolled to its block end, the fade off) is a second exception row, chosen by the operator (re-analysis C1 (b); Q-I7 (a); narrowed to that state by fixes-2 Q-1 (b)), proven by US1-26, US1-28 and T079's bodies. |
| VI. Consumer-driven, own code | Needs: kitty-mission-ui's `.sk-data-table` family and the Desktop V2 primitives (#470, #517, #533). The issues are unread, so their points were the plan gate's questions Q-A to Q-C and Q-E (spec SPEC-1-06 (b)), which the operator answered on 2026-11-16 (Q-E's answer, the `time` slot, is in FR-023); the operator pastes their bodies before phase 2's red (IQ-25). The inventory is the open-source library's own variant set, read from a clone at `main` and `develop` (IQ-1 (a), R-16); #470's hand-off material on `develop` is recorded as background (`sources/issue-470-handoff-background.md`). The sticky header, numeric cell, stripes and hover are added because the library defines them and the operator chose to cover them (IQ-2 to IQ-5). Nothing is copied: the sources record role names and behaviour in their own words, and the README mapping names roles only. |
| VII. Semver | **MINOR**: five elements, five entry points, four `base.css` blocks, the `data-ocelle-align` hook (IQ-3, a documented base-style hook in `@ocelle/styles`' Hooks table) and one base-style hook (`--data-table-box-size`, `--data-table-end-fade`, analysis I7 (a)), which couples the two separately versioned packages and so is surface: both CHANGELOGs and both READMEs name it, and a rename or removal is MAJOR from 1.0.0. CHANGELOG entries go in `@ocelle/elements` and `@ocelle/styles`. `@ocelle/tokens` is unchanged. The overflow-region module's block-axis option is internal, not surface (009's contract § Status); the `@ocelle/elements` CHANGELOG mentions it with no effect on `ocelle-scroller` or `ocelle-workflow-board`. |
| VIII. Test-first, non-vacuous | A scaffold comes before each red commit. The red commit holds the phase's scenario bodies, the driver test, the node and styles tests and the story-test extension (operator decision I3), and `red.sh` keeps one red record per phase. The red log is read per body: every scenario body fails on an assertion, never on an import or setup error, and each body the platform alone could pass carries a paired assertion only the element gives (contracts/checks.md). Each phase's red commit changes 003's `source.test.ts` for the `base.css` rules that phase's green adds (phase 1 blocks 1 and 2 after the wrap rule, phase 2 the timeline's two pre-upgrade rules and phase 3 the chain's two in its base-layer slice, recheck Q5 (b)), and phase 1's red also changes the two Styles sentences `packages/elements/test/node/readme.test.ts` pins, for the convention amendment of recheck Q2 (c); each red message names its changed test and the reason (R-06, R-07). Item-text bodies also assert a non-empty text (FR-016). Each CSS-only behaviour has a named element plant or a stated reason, because Stryker does not mutate `css` templates or `base.css`; element plants mutate green source, so they run after green, are never committed, and are recorded in `reviews/phase-<N>/element-plants.md` (contracts/checks.md § Element plants). Spikes run before the scaffolds of phases 1 to 3, and a failing spike result goes to the operator. The module's block-axis option (IQ-2) is behaviour, so its bodies are in phase 1's red commit with the data table's, and its changed source is mutation-tested; 009's existing tests of the module, the scroller and the board are not edited (only the README sentence on the module's inputs that `readme.test.ts` pins, named in the red commit's body) and stay green. |
| Licence, supply chain | No new dependency or asset. |
| Workflow gates | No gate changes. The gates run unchanged; the gate plants run by op 016's selection locally and in full in CI (R-15). |

## Decisions at the plan gate

Answered by the operator on 2026-11-16 (`reviews/plan/operator-gate.md`); the changes are listed in
`reviews/plan/gate-answers.md`.

1. **The track's inline size (R-03). Decided: (a).** `:host .region-track { inline-size: fit-content }` in the data
   table's own styles. It overrides one property of 009's module stylesheet, so cells wrap before the table scrolls.
   (b), a sizing option in 009's module, and (c), max-content with a changed US1-9, are not taken.
2. **Q-A, the chip step's look** (#517). **Decided: (a)**, an outline with no fill.
3. **Q-B, the column headers' weight and colour** (#533). **Decided: (a)**, medium weight in `ink-muted`.
   **Superseded** on 2026-11-17 by the recheck's Q1 (a): 011's four eyebrow tokens (§ Decisions after the recheck).
4. **Q-C, the event's time position** (#470). **Decided: (a)**, the time on its own line above the content, with the
   marker on that line.
5. **Q-D, the markers' shape.** Decided at squad round 1: `border-radius: 50%` for both markers, no token (R-10,
   R-12).
6. **Q-E, marked-up times** (#470). **Decided: "Yes: named time slot".** `ocelle-timeline-event` gets a named `time`
   slot that takes precedence over the `time` attribute, styled through `::slotted()`, the item text still time
   first. FR-023 is changed in the spec, with US2-11 to US2-14; the contracts, data model, research R-08 and R-10
   (the shared `hasTime(event)` and the connector's `next-has-time`), checks, stories and phase 2 follow.
   - **Q-G, an empty or hidden slotted time beside a `time` attribute. Decided: (a)** (`reviews/plan/operator-gate.md`,
     2026-11-16). The attribute applies when the slot has no visible non-blank content (FR-023, US2-13). The
     alternative, that any `slot="time"` child silences the attribute, is not taken.
7. **Q-F, the caption until 009's option exists (R-17).** Decided at squad round 2 as (b) (PLAN-FRESH-2-002,
   operator decision (c), 2026-11-16). The caption is not sticky until 009's option lands: it scrolls with the table,
   with no inset, and is capped by the box's measured width (R-07). It becomes sticky at inset 0 once the option is on
   `main`, a later MINOR. Round 1's default (a), a fade-depth inset, is withdrawn: that inset applied at rest too.
8. **Dependencies.** Implementation waits for 009, 013 and op 016 on `main`. T001 rechecks the plan and tasks
   against `main` as merged and stops for the operator on any difference (R-14). One request goes to 009's owner
   through the operator: a module option that keeps a pinned start box (the caption, sticky once it lands) out of the
   start fade's mask (R-17, PLAN-A11Y-SECURITY-1-002 operator decision (c)). This mission does not make that change.
   Its one change to 009's module is the block-axis option the operator chose on 2026-11-18 (IQ-2, FR-018, R-18).
9. **The inventory (R-16).** Since 2026-11-18 (IQ-1 (a)) the inventory is the spec-kitty design library's own
   variant set, recorded in `sources/spec-kitty-design-inventory.md` (at `main` 19fb6a2 and `develop` a6518cd): one
   README mapping row per modifier, state, structure role and part, no counts. A gap goes to the operator. Phase 1's
   rows are in R-16 and are written test first in phase 1; the earlier "Proceed, map later" is superseded
   (§ Decisions on the library inventory).

## Decisions after the analysis

Answered by the operator on 2026-11-16 (`reviews/analysis/operator-decisions.md`); the changes are listed in
`reviews/analysis/fixes.md`.

1. **C1, states without a story. Decided: (c).** A story for a standalone `ocelle-timeline-event` in the timeline's
   file and one for a standalone `ocelle-evidence-step` in the chain's (stories 35, baselines 70; 37 and 74 since the
   phase 1 spike's Q1 (b); 42 and 84 since the inventory decisions; 43 and 86 since the re-analysis; 44 and 88 since
   fixes-2 Q-1 (b)). One Principle V
   exception row (Complexity Tracking) covers only the states named by a host `aria-label`: the data table's region,
   the timeline and the chain (R-09's axe risk), proven by browser bodies. The data table's region left the row on
   2026-11-18 (§ Decisions after the phase 1 spike, Q1 (b)).
2. **I7, the caption cap's custom properties across packages. Decided: (a).** `--data-table-box-size` and
   `--data-table-end-fade` are a documented base-style hook between `@ocelle/elements` (the writer) and
   `@ocelle/styles` (the reader): public surface under constitution VII, named in both CHANGELOGs and READMEs, with a
   README test statement in each package (T011, T013).

## Decisions after the recheck

Answered by the operator on 2026-11-17 (`reviews/recheck-decisions.md`, human:jeroennouwsdev) on the five questions of
`reviews/recheck.md`; the changes are listed in `reviews/recheck-fixes.md`.

1. **Q1, the column headers' tokens. Decided: (a).** `--ocelle-tracking-caps` is not on `main`, and 011's eyebrow
   tokens are. The column headers use all four: `--ocelle-font-size-eyebrow`, `--ocelle-font-weight-eyebrow` (600),
   `--ocelle-tracking-eyebrow` and `--ocelle-color-eyebrow`, as `ocelle-page-header` and `ocelle-section-header` do.
   This supersedes Q-B (a). FR-006, US1-3, R-06, R-13, contracts/styles-data-table.md, T006 and T017 follow; the
   contrast node check ties the header colour to `color-eyebrow`'s `checked` rows. No token is added.
2. **Q2, the data table's per-instance sheet. Decided: (c).** The end fade's share of the caption cap is written as
   the measured px inline size of `.region-edge.end` (the fade depth from layout, as 009's module reads it), never as
   `var(--ocelle-scroller-fade-size)`. The README's Styles convention ("at most one" per-instance sheet, pinned by
   `test/node/readme.test.ts`) is amended in phase 1 for the count only: an element that uses the overflow-region
   module may hold one sheet of its own beside the module's, and the data table's caption cap joins the list of uses
   (R-07 gives the two sentences). A new element plant writes the token's text and must fail the end-fade body.
3. **Q3, history folds after the merge. Decided: (a).** Each phase is folded after its approval from a base at
   8ee3351 or later (its `base.sha` or a later remap commit), which `fold-history.sh` accepts. The merge commit 8ee3351
   stays in the branch's history; `/ocelle-run`'s "no merge commits on the branch" is read as "no merge commit after
   the fold base", and `/ocelle-land` handles the pull request's shape. No skill or script changes here.
4. **Q4, stale line citations. Decided: (a).** R-06 and R-07 cite `base.css` and `source.test.ts` at their lines at
   8ee3351 (every `base.css` line +12; `source.test.ts`'s prose slice and last-rule assertion at 204 to 212).
5. **Q5, the pre-upgrade rules' place. Decided: (b).** The timeline's and the chain's pre-upgrade rules (block 3) go
   in `base.css`'s base layer right after 013's facts rule, before the focus rule, and `source.test.ts` transcribes
   them in its `baseLayer` slice; the last-rule assertion keeps phase 1's form, "the wrap rule, block 1, block 2".

## Decisions after the phase 1 spike

Answered by the operator on 2026-11-18 (`reviews/phase-1/operator-spike-decisions.md`, human:jeroennouwsdev) on the
two stop-and-ask points of `reviews/phase-1/spike.md` and on T005; the changes are listed in
`reviews/phase-1/spike-fixes.md`.

1. **Q1, the data table named by a host `aria-label`. Decided: (b).** axe-core 4.14.0, with the `axe` gate's rule
   selection, reports no violation and no incomplete result on an overflowing or fitting data table named by a
   non-blank host `aria-label`, nor with a blank one (spike § 2), so the Complexity Tracking row's sunset is met for
   the data table. Phase 1 adds two stories: "overflows, named by a host `aria-label`" (`aria-label="Deployments"`
   beside `label="Work packages"`, the region named "Deployments") and "overflows, blank host `aria-label`"
   (`aria-label="  "` beside `label="Work packages"`, the region named "Work packages"). Phase 1 then has 14 stories
   and 28 baselines (`visual:update` prints `(28 added, 0 changed, 0 removed)`), the mission 37 and 74 (19, 38, 42
   and 84 since the inventory decisions' five stories, § Decisions on the library inventory; 20, 40, 43 and 86 since
   the re-analysis, § Decisions on the re-analysis; 21, 42, 44 and 88 since fixes-2 Q-1 (b), the same section). The row drops
   the data table's region; the timeline and the chain stay in it until their spikes (T026, T052) measure them. T006's
   FR-010 browser body stays.
2. **Q2, upper-case column-header names. Decided: (a).** Block 1 keeps `text-transform: uppercase` on the column
   headers. Chromium names each column header and its static text by the drawn text ("ID", not "Id"; spike § 1), as
   the elements README already records for 011's eyebrow heading. US1-1's oracle compares the element's subtree with
   the same table outside given the same column-header `text-transform` by a test-only rule (so the element adds
   nothing, FR-003, FR-004), plus one assertion that the column headers are named in upper case. Both READMEs state
   that the accessible names of column headers follow the drawn upper-case text (FR-006; T011, T013).
3. **T005, the `.sk-data-table` inventory. Decided: "Proceed, map later".** Phase 1's red commit does not wait for
   it. The README's data-table mapping rows (FR-058) read "pending inventory", which T013 asserts; the inventory is
   supplied by the operator, recorded in R-16 and mapped test first before the pull request lands, and SC-001 stays
   open until then (T076). **Superseded on 2026-11-18** by IQ-1 (a) (§ Decisions on the library inventory): the
   inventory is recorded, and the rows are written in phase 1.

## Decisions on the library inventory

Answered by the operator on 2026-11-18 (`reviews/phase-1/inventory-decisions.md`, human:jeroennouwsdev) on
`reviews/phase-1/inventory-questions.md`; the changes are listed in `reviews/phase-1/inventory-fixes.md`, with the
questions these changes raise (Q-I1 to Q-I5).

1. **IQ-1, the inventory. Decided: (a).** The library's variant set is the inventory for T005, T028, T054 and SC-001,
   one README mapping row per modifier, state, structure role and part, no counts. No release tag exists, so the
   newest line, `develop` (a6518cd), was fetched and re-inventoried: it changes none of the three families' roles and
   adds #470's Desktop V2 contract and hand-off (R-16). The data-table rows (R-16's table) are asserted in phase 1's
   red (T013) and written in its green (T021); "pending inventory" is gone.
2. **IQ-2, the sticky header row. Decided: add it; the mission changes the module.** `sticky-header` on the data table
   pins the `<thead>` while the body scrolls in a block size the page bounds on the host (FR-017). It needs 009's
   module to scroll in the block axis, so this mission adds an opt-in block-axis option to it
   (contracts/overflow-region-block-axis.md, FR-018, R-18), and FR-008 is amended to allow exactly that. 009's
   contract stands for every host that does not set it; `ocelle-scroller` and the workflow board do not; 009's tests
   pass unchanged. A second spike (T082) measures the open points before the scaffold.
3. **IQ-3, the numeric cell. Decided: add it.** `data-ocelle-align="end"`, a documented base-style hook in
   `@ocelle/styles` (block 4, after the prose override), sets `text-align: end` and the tabular figures (FR-019, R-19).
4. **IQ-4, zebra rows. Decided: add it.** `striped` puts `--ocelle-color-inset` on each `<tbody>`'s even rows
   (FR-060, R-20).
5. **IQ-5, row hover. Decided: add it.** A hovered body row takes `--ocelle-color-hover-bg` (FR-061, R-20), always
   on. In forced colours a first-cell row band stands in for both grounds (FR-013).
6. **IQ-6. Decided: (a).** FR-010's caption fallback stands; the README tells consumers to give an overflowing table a
   `label` that differs from its caption (T013, T021).
7. **IQ-7. Decided: (a).** The eyebrow headers stand; the README maps the library's header look to them (R-16's row).
8. **IQ-25.** The operator pastes #470, #517 and #533 before phase 2's red; the planner records them verbatim in
   `sources/`. The #470 hand-off material on `develop` is recorded as background
   (`sources/issue-470-handoff-background.md`); its bearing on phases 2 and 3 is asked as IQ-26 to IQ-28, with IQ-8 to
   IQ-24, before those phases (T028, T054).
9. **The follow-up questions Q-I1 to Q-I5** (`reviews/phase-1/inventory-fixes.md`, answered at the end of
   `reviews/phase-1/inventory-decisions.md`, 2026-11-18). Q-I1: the pinned header's ground is `--ocelle-color-sheet`.
   Q-I2: a hovered striped row in light (where `hover-bg` equals `inset`) is accepted, and both READMEs note it. Q-I3:
   the hover is always on. Q-I4 (changes the default): the module's block-axis option fades the block end while
   content is below it, at the inline fades' depth; no block-start fade; never under the pinned box (no fade when less
   than twice the depth shows below it); the two fade mask layers intersect and the scrollbar layers add (four
   layers); the block clearance keeps the ring clear of the fade, with 009's suppression fallback; in forced colours a
   `CanvasText` line drawn by a new `.region-edge.block-end` in the host's template (contracts/overflow-region-block-axis.md,
   FR-018, R-18, US1-26 to US1-28; T079 to T082, T016, T024). No story is added. Q-I5 (changes the default): one line
   at the top of `specs/009-workflow-layouts/contracts/overflow-region.md` points to this mission's amendment, in a
   documentation commit of its own; nothing else of 009 changes. Q-I4 raised two questions, which the operator
   answered with their defaults (commit 4ad3073, end of `reviews/phase-1/inventory-decisions.md`): Q-I6 (a), the room
   rule's factor of two, and Q-I7 (a), no story for the fade's off state (recorded since the re-analysis as a
   Principle V exception row, § Complexity Tracking).

## Decisions on the re-analysis

Answered by the operator on 2026-11-18 (end of `reviews/analysis/operator-decisions.md`, human:jeroennouwsdev) on
`analysis-report.md` at 4ad3073; the changes are listed in `reviews/analysis/fixes-2.md`.

1. **C1, block-axis states without a story. Decided: (b).** Phase 1 adds the story "sticky header, unbounded"
   (`sticky-header`, the twenty-row table, no bound: full height, no block scroll, no tab stop at 1280 px, no fade;
   US1-20). Phase 1 had 20 stories and 40 baselines, the mission 43 and 86. One Principle V exception row
   (§ Complexity Tracking) covered only the block-end fade's two scroll-position states: the bounded table scrolled
   to its block end (the fade off; Q-I7 (a)) and a bound that leaves less than twice the fade depth below the header
   (the room-rule state). Item 6 adds a story for the second and narrows the row to the first.
2. **A1, the pinned-box measure of the room rule and the block clearance. Decided: (c).** T082 measures both
   candidates, the `<thead>`'s current block-end edge and its block size as if pinned, at 320 px with a two-line
   caption, and stops for the operator's choice before the scaffold (T004). The contract names the point `pinnedEnd`
   (contracts/overflow-region-block-axis.md § The pinned-box measure); the captioned bodies in T079 and T080 take
   their expected values from the choice. Chosen on 2026-11-18: (a), the current edge (§ Decisions on phase 1's
   second spike).
3. **A2, the row hover on a device with no hover. Decided: (a).** Block 1's hover rule and the forced-colours band's
   `Highlight` rule go inside `@media (hover: hover)`. US1-24 gains a no-hover half, run in 008's touch context
   (`hover: none`) with no driver addition, and two element plants remove the guards.
4. **G1, the block-axis keys beyond the arrows. Decided: (a).** PageUp, PageDown, Home, End, Space and Shift+Space are
   left to the browser, which scrolls the focused box in the block axis; FR-018 and the contract say so, and T079 and
   T080 assert per key that the box scrolls, its default is not prevented, the block-end fade follows and the header
   stays pinned.
5. **I1 and I2.** Q-I6 and Q-I7 are recorded as decided everywhere; the driver additions are counted as three. C2
   stays as it is (a constitution clarification, outside this mission).
6. **Fixes-2 Q-1, the room-rule state. Decided: (b)** (2026-11-18, human:jeroennouwsdev, end of
   `reviews/analysis/operator-decisions.md`). Phase 1 adds the story "sticky header, under the room rule"
   (`sticky-header`, `label="Work packages"`, the twenty-row table with no caption, the host's `max-block-size` a
   `calc()` over tokens in a `data-story` rule, bounded so that rows are below but less than twice the fade depth
   shows under the header: a `group` tab stop by its block overflow, no block-end fade; US1-26's room-rule half).
   The story has no caption; its space is measured from the `<thead>`'s current block-end edge (A1 (c), decided (a)
   on phase 1's second spike), which at rest lies the ring room plus the header's block size below the client
   block start. Phase 1 has 21 stories and 42 baselines (`visual:update` prints `(42 added, 0 changed, 0 removed)`), the
   mission 44 and 88. The block-axis exception row (§ Complexity Tracking) now covers only the scrolled-to-end state.

## Decisions on phase 1's second spike

Answered by the operator on 2026-11-18 (`reviews/phase-1/operator-spike-2-decisions.md`, human:jeroennouwsdev) on
`reviews/phase-1/spike-2.md` (T082); the changes are listed in `reviews/phase-1/spike-2-fixes.md`.

1. **Q-1, the pinned-box measure (A1 (c)). Decided: (a), the current edge.** `pinnedEnd` is the `<thead>`'s laid-out
   block-end edge as it is when read. The fade never covers the header and the clearance clears the header where it
   is; under a tall caption in a small bound the fade is absent at rest until the caption scrolls away. US1-26's
   captioned case and T079's and T080's captioned bodies take spike-2 § 11's outcomes (100 px bound: no fade at rest,
   a fade past the caption; 300 px: a fade at rest; a row-1 link's ring at the header's current edge within 0.5 px).
2. **Q-2, the header pinned 5 px low. Decided: (a).** Block 1 pins the `<thead>` at
   `inset-block-start: calc(-1 * (var(--ocelle-focus-offset) + var(--ocelle-focus-width)))`: at the client
   block-start edge once scrolled by the ring room, the ring room above it at rest. US1-17, US1-18 and T079's keys
   body read the header's edge at the client edge once scrolled and at its at-rest position back at the block start.
   One element plant (the inset back to `0`) guards it. No module change.
3. **Q-3, RTL and the reserved gutter. Decided: (c).** The module writes `data-axis="both"` only while the option
   is on and the box overflows in the block axis; the gutter (dropped by item 6; now the scrollbar) comes and goes
   with it, the module re-reads its mask
   figures, and the data table rewrites `--data-table-box-size` one frame after `data-axis` changes. US1-20 and the
   unbounded story's test assert no `data-axis`. Not measured in the spike: the implementer measures it before the red
   commit (T082) and stops if it fails (tasks.md § Stop-and-ask points).
4. **Q-4, axe and the block-end edge. Decided: (a).** `.region-edge.block-end` is `inline-size: 0` outside forced
   colours and full width inside them, where it draws the line; measured clean. One element plant guards it.
5. **Q-S2-1, a focusable element above the pinned `<thead>` (asked in `spike-2-fixes.md`). Decided: (a).** For a
   focused element that precedes the pinned box in tree order (a caption link) the block clearance's upper bound is
   the box's client block-start edge, so the box scrolls back to show it; `blockClearanceScroll` takes it as
   `before`. US1-26 and T079's captioned bodies carry a caption link; T082's addendum measures it before the red
   commit; one element plant guards it.
6. **Q-A1, the stable gutter loses 15 px of inline range (T082's addendum). Decided: (a).** No `scrollbar-gutter`:
   `[data-axis="both"]` gives `overflow-y: auto` only, still written only while the box overflows in the block axis;
   the scrollbar's room is `offsetWidth − clientWidth` (15 px classic, 0 hidden), which the module's mask figures and
   the data table's caption cap read. T079 and T080 gain the both-ways inline range bodies (LTR far end, RTL start,
   the bound set and lifted); one element plant (the gutter back) guards it.
7. **Q-A2, the caption link "past the caption" met by Chromium alone (T082's addendum). Decided: (a).** US1-26's
   caption-link half and T079's element-before body assert the ring box at the client block-start edge with the link
   2 to 12 px above it (spike-2 § Addendum A5), the fully-past position kept as a paired assertion the platform alone
   meets (contracts/checks.md).

8. **Q-A3, the scrollbar-room plant cannot bite under hidden scrollbars (`spike-2-fixes.md`). Decided: (a).** A
   classic-scrollbar half in `packages/elements/test/browser/data-table-scrollbar.test.ts` (`elements-browser`,
   Chromium launched with `ignoreDefaultArgs: ["--hide-scrollbars"]` as 009's `test/browser/scrollbar.test.ts`), part
   of T080 and phase 1's red commit: the sticky caption body with the room subtracted, the RTL lift and T079's mask
   figure on the block-axis test host with a non-zero block-scrollbar layer, each asserting `data-axis="both"` and a room above 0 first. Its
   plant guards run in `elements-browser`; one element plant added (the block-scrollbar layer written `0px 100%`
   whatever the room). No task added (contracts/checks.md § Harnesses, § Element plants; research R-18).

The spike's settled facts for the red bodies (research R-18's and R-20's Results): the mask layer order and
`mask-composite: add, add, intersect, add`; "within 0.5 px" inclusive (`≤ 0.5`); the stripe per `<tbody>`; a
hovered striped row read in dark; the browser's keys as real key events, asserted by direction and a non-zero move.

## Project Structure

### Documentation (this feature)

```text
specs/019-data-records/
├── plan.md              # this file
├── research.md          # R-01 to R-20, the plan gate's questions Q-A to Q-G, decision 1
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── ocelle-data-table.md
│   ├── ocelle-event-timeline.md
│   ├── ocelle-timeline-event.md
│   ├── ocelle-evidence-chain.md
│   ├── ocelle-evidence-step.md
│   ├── styles-data-table.md  # the @ocelle/styles rules, their prose override and the numeric-cell hook
│   ├── overflow-region-block-axis.md  # the block-axis option this mission adds to 009's module (IQ-2)
│   └── checks.md             # tests, oracles, plants, stories, gates
├── checklists/requirements.md
├── sources/              # the library inventory (main and develop) and the #470 hand-off background
├── reviews/              # spec checks, plan squad, phases (spike, element-plants, plants), recheck.md, inventory
└── tasks.md              # /speckit-tasks
```

### Source Code (repository root)

```text
packages/elements/
├── src/
│   ├── overflow-region.ts         # changed: the opt-in block-axis option (IQ-2, FR-018); default behaviour unchanged
│   ├── ocelle-data-table.ts       # new (uses overflow-region.ts, the block-axis option with sticky-header)
│   ├── ocelle-event-timeline.ts   # new (imports ocelle-timeline-event.ts and timeline-time.ts; resolveName from overflow-region.ts)
│   ├── ocelle-timeline-event.ts   # new (imports timeline-time.ts; exports only its class)
│   ├── timeline-time.ts           # new, internal: hasTime(event) and hasSlottedTime(event), outside the manifest glob and the exports map (R-10)
│   ├── ocelle-evidence-chain.ts   # new (imports ocelle-evidence-step.ts; resolveName from overflow-region.ts)
│   ├── ocelle-evidence-step.ts    # new
│   ├── index.ts, browser.ts       # re-export / define the five
├── test/
│   ├── scenarios/{data-table,event-timeline,evidence-chain}.ts
│   ├── scenarios/driver.ts, in-process.ts, browser/driver.ts   # + scrollTop, setScrollTop (phase 1), itemTexts (phase 2)
│   ├── data-table.touch.test.ts, browser/data-table.touch.test.ts  # US1-24's no-hover half in 008's touch context (A2 (a))
│   ├── {data-table,event-timeline,evidence-chain}.test.ts      # in process (mutated); the chain's no-loop test
│   ├── overflow-region-block.test.ts, browser/overflow-region-block.test.ts, fixtures/overflow-host-block.ts  # the block-axis option (R-18)
│   ├── browser/{data-table,event-timeline,evidence-chain}.test.ts
│   ├── browser/data-table-scrollbar.test.ts                    # classic scrollbars, no --hide-scrollbars (Q-A3 (a), R-18)
│   ├── define.test.ts                                          # the define-twice fixture gains the five
│   ├── entry-*.test.ts                                         # the five entry points
│   ├── node/readme.test.ts (changed in phase 1: the Styles sentences, recheck Q2 (c), and the module's inputs sentence, IQ-2), node/manifest.test.ts, node/chain-no-pill.test.ts
│   ├── node/records-pairs.test.ts, node/records-pairs-check.ts # contrast source check (R-13)
│   └── build/build.test.ts                                     # container import rule for the two containers
├── custom-elements.json           # regenerated
├── package.json                   # exports
├── README.md, CHANGELOG.md
packages/styles/
├── src/base.css                   # the data-table block, the prose override, the pre-upgrade list rules, the numeric-cell hook
├── test/browser/data-table.test.ts, test/browser/list-items.test.ts, test/prose-override.test.ts, test/data-table-pairs.test.ts
├── test/source.test.ts (changed: blocks 1, 2 and 4 after the wrap rule, block 3 in the base-layer slice, R-06), test/readme.test.ts
├── README.md, CHANGELOG.md
storybook/stories/{data-table,event-timeline,evidence-chain}.stories.ts
storybook/.storybook/stories-layout.css                        # wrapper widths on data-story selectors
storybook/baselines/elements-ocelle-{data-table,event-timeline,evidence-chain}--<story>.{light,dark}.png
storybook/test/integration/elements-stories.test.ts
```

**Structure Decision**: the existing workspace layout, with every file where 005's and 013's conventions put it, and
each package's own test layout (`packages/styles/test` has `browser/` and top-level tests, no `node/`). The test file
names follow 013's on `main` after the recheck (T001).

## Phases (user stories) for `/speckit-tasks`

Each phase is one unit for `/ocelle-run` step 4 and is folded after its approval, from a fold base at 8ee3351 (the
merge of `main`) or later: its `base.sha` or a later remap commit (recheck Q3 (a)). The merge commit stays in the
branch's history, and `/ocelle-land` handles the pull request's shape. Phases 1 to 3 run in this order:

1. **Spike.** Run before the scaffold, recorded in `reviews/phase-<N>/spike.md`. A failing result goes to the operator.
2. **Scaffold.** The phase's modules with `define`, `@tagname`, declared properties and an empty `render()`, plus
   their exports and entries. `scaffold.sh` records it, so the red bodies fail on their assertions.
3. **Red commit** (operator decision I3; `red.sh`). It holds the phase's scenario bodies, its edge-case bodies
   (FR-052), driver tests, node and styles tests, README test statements and the story-test extension. It changes
   test files only, and holds no plant (a plant mutates green source). The README mapping rows' statements need
   R-16's inventory recorded first (phase 1's rows are in R-16 since IQ-1 (a); phases 2 and 3 wait for the operator's
   answers to their inventory questions, T028 and T054). The red log is read per body: each scenario body fails on an assertion, not on an
   import or setup error, and the review checks contracts/checks.md § Bodies that the platform alone could pass against
   that log.
4. **Green.** The phase's source, `base.css` rules, manifest, stories and baselines, README sections and CHANGELOG.

Every phase with stories also does the following:

- **Baselines.** It commits its stories' light and dark baselines, produced by `pnpm run visual:update` in #10's
  pinned container under docker. The command must report `<n> added, 0 changed, 0 removed`. Conflicting PNGs are
  regenerated, never hand-picked. When CI's captures differ from the local ones, CI's are committed
  (`storybook/README.md`).
- **Gates.** It passes `gate:storybook-build`, `gate:visual` and `gate:axe` with no exception entry beyond those of
  § Complexity Tracking (phase 1's 74 nodes, operator decision (a) at the stop T022, 2026-11-18); any other is a
  stop-and-ask.
- **Gate plants.** It runs the gate plants its diff affects: `pnpm run gate:plants -- --affected <phase base>` (op
  016), recorded in `reviews/phase-<N>/plants.md` in op 016's form, never a full local `gate:plants` (FR-059, R-15).
- **Element plants.** After green, each element plant of contracts/checks.md for the phase is applied to the green
  source or `base.css`, its guard bodies run in process, and the source is restored; nothing is committed. The results
  go in `reviews/phase-<N>/element-plants.md`. A plant that does not make its guard fail stops the phase for the
  operator.
- **Index rules.** Its stories follow #10's index rules and contributor note.

0. **Setup (no stories).**
   - **T001, the recheck (R-14).** Compare this plan and the tasks with `main` as merged and write
     `reviews/recheck.md`. The flow stops for the operator on any difference. The recheck covers:
     - 009's module interface, `resolveName`, its `.region-track` rule and its fade mask rules;
     - whether 009's module has the pinned-start option requested in R-17 (if so, the caption is sticky through it at
       inset 0; if not, it is not sticky, Q-F (b));
     - `--ocelle-tracking-caps`, `--ocelle-measure-container` and `--ocelle-scroller-fade-size`;
     - 013's README conventions;
     - both drivers as merged: 009's additions, and how `computed`, `reducedMotion` and the focus readers were
       reconciled with 013's (R-14);
     - 011's or 012's eyebrow tokens;
     - op 016's `--affected` and its record file;
     - #10's commands and container.
   - Recorded on 2026-11-17 in `reviews/recheck.md` (five differences), answered in `reviews/recheck-decisions.md`
     and applied as § Decisions after the recheck states; T001 stays for the implementer to tick.
   - The inventory for R-16 is not a phase 0 item: it is one step per phase, before that phase's red commit
     (decision 9; tasks T005, T028, T054). Phase 1's is recorded (IQ-1 (a), 2026-11-18); T005 stays for the
     implementer to confirm and tick.
   - The `itemTexts` driver addition belongs to phase 2's red commit, not here, so it is proven red first.
1. **US1 Data table** (P1, MVP).
   - **Spike.** R-01, R-03, R-05 and R-07 (done 2026-11-17, `reviews/phase-1/spike.md`; answered as § Decisions after
     the phase 1 spike states):
     - the accessibility tree and axe in and out of the element, fitting and overflowing;
     - the track at `fit-content` at 1280, 600 and 320 px, with and without `wrap="anywhere"`;
     - the swaps of a `tbody` or the whole table, a cell edit and a late web font, each against a fresh load;
     - the caption at 320 px, not sticky and capped by the measured box width, and the measured property reaching the
       slotted caption through the flat tree (R-07);
     - the element in a `<dialog>`, an inline-block and a start-aligned column flex: never 0 px wide, one observer
       callback, a stable width (the cap equals the table's width, so no shrink step) and no `ResizeObserver` loop
       error; and no loop error in a block host on first load with a caption that rewraps between the fallback and the
       measured cap, in the narrow-column resize, when a `hidden` host is shown, or when a cell edit takes a
       block-host table from fitting to overflowing and back with a caption that rewraps across the end fade's depth
       (one end fade write per change); the one-long-word inline-block with a caption text (or test-only
       `letter-spacing`) whose box width has a fractional part between 0.1 and 0.4 px, written unrounded (R-02,
       R-07);
     - the prose override in Chromium;
     - print to PDF;
     - axe on an overflowing element named by a non-blank host `aria-label` (the exception row's sunset check);
     - any change of R-05 the module does not observe (FR-014), named in R-05 and sent to the operator.
   - **Spike 2 (T082, IQ-2 to IQ-5; R-18, R-20), before the scaffold**, recorded in `reviews/phase-1/spike-2.md`: the
     slotted sticky `<thead>` against the shadow `.region-box`; `data-axis="both"` with `scrollbar-gutter: stable` (dropped after the addendum, Q-A1 (a)) and
     the four-layer mask in LTR and RTL (the two fade layers intersecting, the scrollbar layers added); the block-end
     fade (at rest, at the end, the room rule, forced colours); the host's column-flex bound (a bound, none, the shrink-to-fit hosts); block
     clearance under the pinned header, clear of the block-end fade and inside the header; the caption cap less the gutter with no loop error; separated
     borders against collapsed ones; `:nth-child(even)` per `<tbody>` with a hidden row; the hover over a stripe; the
     forced-colours band's system colours and reserved width; axe on a bounded sticky table; the pinned-box measure
     (re-analysis A1 (c)): both candidates at 320 px with a two-line caption, recorded side by side, then a stop for
     the operator's choice before the scaffold; and the keys the browser keeps (G1 (a)) scrolling the focused box. A
     contradiction stops for the operator. Recorded on 2026-11-18 with four questions, decided the same day (§ Decisions
     on phase 1's second spike); before the red commit the implementer adds the measurement of Q-3 (c) to the record
     (T082), and a failure stops for the operator.
   - **Red.**
     - US1-1 to US1-16 as shared bodies.
     - US1-7 with a blank caption (SPEC-3-05).
     - FR-010's host `aria-label` (non-blank decides, blank counts as absent), also shown by two stories since spike
       Q1 (b).
     - US1-1 against the same table outside given the same column-header upper case by a test-only rule, plus the
       upper-case names of the column headers (spike Q2 (a)).
     - US1-11's forced colours with the header rule as well as the row rules (analysis G2).
     - US1-10 comparing every property of R-06's list on every target (SPEC-3-01).
     - US1-3 with 011's four eyebrow tokens (SPEC-3-04, recheck Q1 (a)).
     - US1-16 twice: the caption's text node edited (`characterData`) and the caption replaced (`childList`).
     - The caption-text bodies of R-04: a `hidden` span, an `aria-hidden="true"` span, an `<img alt>`.
     - Edge-case bodies: no table, two tables, a nested table not styled, no `thead`, a `<thead>` with an empty
       `<tbody>` (rendered unchanged, no added text), two `<tbody>` groups and a `<tfoot>` (the row rule between every
       pair of consecutive rows, none below the last, R-06), row and corner headers, a `colspan` header, a hidden host
       (`hidden`, and `aria-hidden="true"`; analysis G3), pre-upgrade, 640 px.
     - The caption bodies of R-07: at 320 px at rest (inside the unmasked extent, start equal to the table's), scrolled
       to the middle and the end (start still equal to the table's), a fitting table (no `data-fade`, a long caption
       wrapping at the table's width), a narrow column resized from 400 to 600 px whose table overflows and whose
       caption is longer than the box at both widths (`data-fade="end"` asserted at rest before the line boxes), and
       the end-fade body (a 400 px block-host table that fits, a cell edit making it overflow and the edit undone:
       `data-fade="end"` at rest, a two-line caption inside the unmasked extent and `--data-table-end-fade` the end
       edge's measured px width, then no `data-fade`, one line and no end fade),
       and the no-`ResizeObserver`-loop check around a block host on first load with a caption that rewraps between
       the fallback and the measured cap, the narrow-column resize, a `hidden` host shown, both edits of the end-fade
       body, and the shrink-to-fit bodies (the one-long-word body with its rounding-down precondition asserted first).
     - The element as a default flex item and as a `1fr` grid item at 320 px (R-02).
     - The shrink-to-fit bodies of R-02: in an open `<dialog>`, an inline-block and a start-aligned column flex, the
       host as wide as the table plus the ring room on both sides (never 0 px), the caption not narrower than its
       longest word, a long caption wrapping at a narrow table's width, and a two-column narrow table in an
       inline-block whose caption's words are wider than the grid: the table widens to the longest word and the
       region does not overflow (no tab stop, no `data-fade`).
     - The five elements in 013's define-twice fixture (two copies of the package: the first definition wins); the
       data table's entry goes in here, and phases 2 and 3 add theirs to the same body.
     - The change to 003's `packages/styles/test/source.test.ts` (R-06): blocks 1 and 2 after the wrap rule, the
       last-rule assertion "the wrap rule, block 1, block 2"; named with its reason in the commit message.
     - The change to the two Styles sentences `packages/elements/test/node/readme.test.ts` pins (R-07, recheck
       Q2 (c)): a per-instance sheet of the element's own beside the overflow-region module's, and the data table's
       caption cap among the uses; named with its reason in the commit message.
     - The `@ocelle/styles` browser tests, the prose-override node test and the data-table contrast node test.
     - The data table's part of `test/node/records-pairs.test.ts` (R-13).
     - README statements for the data-table section, the conventions amendment (FR-056), its mapping rows (R-16's
       data-table rows, IQ-1 (a); see the inventory-decisions item below), the column headers' accessible names
       following the drawn upper-case text (both packages, spike Q2 (a)), the Host
       ARIA list (the data table added beside 009's elements, with the module's blank-counts-as-absent rule), the
       Sizing line (a wrapper that is the flex or grid item needs `min-inline-size: 0`; in a shrink-to-fit host the
       data table takes its table's width and overflows only when its own inline size is bounded), the caption rules
       (the `hidden` attribute, not CSS, hides part of a caption from the name; the caption scrolls with the table
       until 009's option lands; its longest word widens the table, and in a bounded host a caption word wider than
       the box overflows it and the region scrolls), print (printed content past the box is clipped; a consumer who
       prints sets a print rule of its own, spike § 8), and the base-style hook in both packages' README tests
       (analysis I7 (a)).
     - The story-test extension.
     - **Inventory decisions (IQ-1 to IQ-7)**, in the same red commit:
       - the module's block-axis option (T079): the block-axis test host and its bodies in both harnesses (the
         block-end fade's among them), the pure `blockClearanceScroll` and `blockEdgeState` cases, and the change to the README sentence on the module's inputs that
         `packages/elements/test/node/readme.test.ts` pins (line 155 at 8ee3351), named with its reason in the commit
         message; 009's own test files untouched;
       - US1-17 to US1-28 and their edge cases as shared bodies (T080): the pinned header, the block-axis keyboard and
         clearance, the keys the browser keeps (G1 (a)), the block-end fade (with the header, the sideways fades, focus and forced colours, and the captioned case of A1 (c)), no bound, both axes at 320 px, toggling `sticky-header`, the numeric hook (in a data table, in
         prose, in a plain prose table, RTL), the stripes (two `<tbody>` groups, a hidden row), the hover (with a
         paired unhovered row and the cursor, and its no-hover half in 008's touch context, A2 (a)), forced colours (the row band and the opaque pinned header), and the
         rendered grounds against their tokens;
       - in `@ocelle/styles`' tests: block 1's new rules, block 2's sticky-table `border-collapse`, block 4 and its
         order after block 2, the grounds tied to main grounds in `data-table-pairs.test.ts`, `source.test.ts`'s
         last-rule assertion "wrap, block 1, block 2, block 4", and README statements (the Hooks table row, § Numeric
         cells, the sticky header, stripes, hover and band);
       - in `test/node/readme.test.ts`: the data-table mapping rows of R-16 (one statement per row, by role name, no
         `sk-` string), IQ-6 (a)'s `label`-differs-from-caption statement, IQ-7 (a)'s header-look statement, and the
         statements on `sticky-header` (the page's bound, the caption, print), `striped` (hidden rows counted), the
         hover and the numeric hook;
       - the seven new stories in the story test (21 in all, the two hover stories by their pointer parameter, the
         unbounded sticky-header story of re-analysis C1 (b) and the room-rule sticky-header story of fixes-2 Q-1 (b)
         among them).
   - **Green.** First 009's module option (`overflow-region.ts`, T081, with the README conventions entry), then
     `ocelle-data-table.ts` (with `sticky-header` and `striped`), the `base.css` blocks, exports and the manifest, the stories with baselines,
     the README (section, conventions with the Styles amendment of recheck Q2 (c), overflow-region users, Host ARIA list, sizing, prose specificity, the
     `<tfoot>` order, print, pre-upgrade, the base-style hook, the upper-case column-header names, the sticky header,
     stripes, hover and the numeric hook, the overflow-region entry's block-axis option, and the mapping rows of R-16)
     and the CHANGELOGs, which name the hook, `sticky-header`, `striped` and `data-ocelle-align` as surface. Then the
     data table's element plants, the module option's among them; 009's tests and baselines unchanged (SC-007).
2. **US2 Event timeline** (P2).
   - **Spike.** R-08, R-09, R-10 and R-11: the tree with `role="list"`, the item-text oracle, the empty connector and
     marker spans, the host `aria-label` against 009's lane (axe's verdict is the exception row's sunset check), and
     the `time` slot (a slotted `<time>` after the content
     read first, an unrendered slot leaving an empty or hidden slotted node out of the tree and layout, and
     `::slotted(*)` setting the type over a `<b>`'s UA bold).
   - **Red.**
     - `itemTexts` and its test, in both harnesses.
     - US2-1 to US2-14, with US2-8's forced-colours and rendered-contrast halves (R-10, R-13).
     - The `time` bodies of R-10: set, changed and cleared by property after mount, `time=""` and `time=" "`.
     - The `time` slot bodies of R-10 (Q-E): US2-11 to US2-14 (a slotted `<time datetime>` after the content shown
       above it and read first, with the attribute time's type, a `<b slot="time">` included; the attribute ignored
       while the slot has content and shown again when the slotted node is removed; an empty, white-space-only,
       `hidden` and `aria-hidden="true"` slotted time, with and without a `time` attribute; filled, emptied, hidden and
       shown after mount; a child's `slot` attribute set to `time` and removed, analysis G1), with the paired
       assertions of checks.md § Bodies.
     - The connector geometry bodies of R-10: three timed events and a mixed timeline (timed, untimed, timed by its
       slot, untimed with an empty slotted time), with each connector clear of both dots and both gaps `space-1`
       within 0.5 px, and `elementFromPoint` inside each dot returning the marker.
     - The manifest test statements that the `ocelle-timeline-event` module declares only its class, and that the
       event declares the default slot and the `time` slot (R-10).
     - Edge-case bodies: an event outside the timeline (with an attribute time and with a slotted time), an empty
       timeline (no `<ol>`), `aria-hidden` items, `lang` and `dir` on an event and on a slotted time, two slotted time
       nodes of which one is `aria-hidden="true"`, two visible slotted time nodes of which one is blank (analysis A1),
       order kept, no live region, landmark or heading (FR-026), a hidden timeline and a hidden standalone event
       (analysis G3), pre-upgrade (the `base.css` list-item
       rules: a `hidden` and an `aria-hidden="true"` event not shown; a slotted time's text shown before the
       content's), 640 px.
     - The change to 003's `packages/styles/test/source.test.ts` (R-06, recheck Q5 (b)): the timeline's two
       pre-upgrade rules in the `baseLayer` slice right after 013's facts rule, before the focus rule; the last-rule
       assertion unchanged; named with its reason in the commit message.
     - The timeline's entries in the define-twice body and in `test/node/records-pairs.test.ts`.
     - README statements (the section, the Host ARIA list, the overflow-region users of `resolveName`, "Before
       upgrade" with the slotted time shown inline, and the `time` slot of Q-E: it takes precedence over the
       attribute, carries `datetime`, `title`, `lang`, `dir` or an htmx target, which the attribute cannot, one time
       element per event, and a consumer rule on the slotted node beating the `::slotted()` type), mapping rows and
       the story-test extension.
   - **Green.** `timeline-time.ts` (`hasTime(event)`, `hasSlottedTime(event)`), `ocelle-timeline-event.ts` (the `time`
     slot, its `::slotted()` rules and its own observer) and `ocelle-event-timeline.ts` (its observer on the events'
     subtrees), the two pre-upgrade rules in `base.css`'s base layer after the facts rule (with the layer's header
     comment), exports, the manifest (the `time` slot included), the 11
     stories with baselines (the standalone event among them), the README section (with the Host ARIA list update and the `time` slot) and the
     CHANGELOGs (the `time` slot named as surface). Then the timeline's element plants, the slot plants of checks.md
     among them.
3. **US3 Evidence chain** (P3).
   - **Spike.** R-12: line ends at 1280, 600 and 320 px and after the R-12 changes, two-digit fit for ordinal 20, the
     chip's block size, the shared centre line with chips, `dir="rtl"`, and axe on a chain named by a host
     `aria-label` (the exception row's sunset check).
   - **Red.**
     - US3-1 to US3-10, with US3-6 per SPEC-3-02 (ordinals are positions among visible steps, chip steps counted;
       includes a chip hidden and shown again), the ordinal-fit body for twenty steps (SPEC-3-03), and US3-8's
       forced-colours and rendered-contrast halves (R-12, R-13).
     - The mixed-chips geometry body (each connector's centre on the row's marker centre within 0.5 px, R-12).
     - The in-process no-`ResizeObserver`-loop test with its synthetic self-check (R-12).
     - Edge-case bodies: a step outside the chain, an empty chain, mixed chips, a link in a step (FR-011), `lang` and
       `dir`, no live region, landmark or heading (FR-026), a hidden chain and a hidden standalone step (analysis G3),
       pre-upgrade (a `hidden` and an `aria-hidden="true"` step not shown), 640 px.
     - The change to 003's `packages/styles/test/source.test.ts` (R-06, recheck Q5 (b)): the chain's two pre-upgrade
       rules in the `baseLayer` slice right after the timeline's, before the focus rule; the last-rule assertion
       unchanged; named with its reason in the commit message.
     - The chain's entries in the define-twice body and in `test/node/records-pairs.test.ts`.
     - The no-pill node test, README statements ("Before upgrade" among them), mapping rows and the story-test
       extension.
   - **Green.** `ocelle-evidence-step.ts` and `ocelle-evidence-chain.ts`, the two pre-upgrade rules in `base.css`'s
     base layer after the timeline's,
     exports, the manifest, the 12 stories with baselines (the standalone step among them), the README section and the CHANGELOGs. Then the chain's element
     plants, the no-pill plant among them.
4. **Polish.** Documentation only:
   - the final CHANGELOG surface lists;
   - the review check that the mapping rows cover R-16's inventory, one row per modifier, state, structure role and
     part of each family (SC-001, IQ-1 (a));
   - the quickstart run, recorded in `reviews/phase-4/`, with the three Storybook gates on all the mission's stories
     and 013's baselines unchanged (SC-007), its plants and mutation steps on the mission's base (phase 1's base),
     since phase 4 changes no source.

Phases 2 and 3 do not depend on phase 1 and run in order, so the README, exports and driver change one phase at a
time. Phase 3 reuses phase 2's `itemTexts`; both containers import 009's `resolveName` (R-09).

## Complexity Tracking

| Exception | Principle | Scope | Rationale | Sunset | Approval |
|---|---|---|---|---|---|
| The states named by a host `aria-label` have no story | V (a story per variant and per state) | `ocelle-event-timeline` and `ocelle-evidence-chain`, each with a host `aria-label`, blank or not (FR-022, FR-032; US2-10, US3-10). Each is proven instead by shared browser bodies in both harnesses: T030's US2-10 and T055's US3-10. The data table's region is no longer in scope: phase 1's spike found axe-core 4.14.0 clean on it (`reviews/phase-1/spike.md` § 2), and its two states (non-blank and blank host `aria-label`) are stories (spike Q1 (b)), with T006's FR-010 body kept. No other state of the five elements is excepted (the standalone event and step have stories, analysis C1 (c)), and no `storybook/a11y-exceptions.json` entry is added. | Each of these hosts keeps the consumer's `aria-label` on a generic host node while the name sits on a shadow node (the `<ol>`), so axe may report `aria-prohibited-attr` (serious) on the host, which a story would turn into a failing `axe` gate or an exception entry (R-09). The naming itself is asserted on the Chromium AX tree in both harnesses, so the behaviour has evidence without a story. | Per element: the pinned axe-core reports no serious or critical finding on that element named by a host `aria-label`. Each remaining phase's spike measures it (T026, T052) and the check is repeated on every axe-core upgrade. A clean result is a stop-and-ask point: the operator decides whether that phase adds the state's story and its two baselines (and the row's scope shrinks) or the row stays. Met for the data table on 2026-11-17 (T003). | Operator, 2026-11-16, analysis decision C1 (c) (`reviews/analysis/operator-decisions.md`); scope narrowed by the operator on 2026-11-18, spike Q1 (b) (`reviews/phase-1/operator-spike-decisions.md`). |
| The block-end fade's scrolled-to-end state has no story | V (a story per variant and per state) | `ocelle-data-table` with `sticky-header` and a bound (FR-017, FR-018), in one state only: scrolled to the block end, where the block-end fade is off (no `data-block-fade`, no mask, no forced-colours line). It is proven instead by shared bodies in both harnesses: US1-26's block-end half (no fade at the block end, back after ArrowUp) and US1-28 (the line gone at the block end) in T080, and T079's block-end fade bodies (absent at the block end) and `blockEdgeState`'s at-the-end cases on the test host, each "does not" paired with the fade at rest. Not in scope: the bounded table at rest with the fade (story "sticky header, bounded"), the table with no bound (story "sticky header, unbounded", US1-20, added by C1 (b)) and the room-rule state, rows below with less than twice the fade depth under the header and no fade (story "sticky header, under the room rule", added by fixes-2 Q-1 (b)); no other state of the five elements, and no `storybook/a11y-exceptions.json` entry. | A story renders at its initial scroll position, so the off state at the block end cannot be shown without a scroll parameter #10's stories do not have. The state differs from the bounded story only in the module's `data-block-fade` decision, which the bodies read directly (attribute, mask layers, the forced-colours line), with no pixel needed. The room-rule state is a state at rest, drawn by a smaller bound with no scroll parameter, so it left this row for a story (fixes-2 Q-1 (b)). | #10's stories gain an initial-scroll parameter: then the off state gets a story and its two baselines, and the row goes. A stop-and-ask point; the phase's `<n>` changes with the story. | Operator, 2026-11-18: the fade's off state by Q-I7 (a) (`reviews/phase-1/inventory-decisions.md`); the row by the re-analysis decision C1 (b); its scope narrowed to the off state by the answer to fixes-2 Q-1 (b) (both at the end of `reviews/analysis/operator-decisions.md`). |
| 74 axe incomplete results on the data table's stories are excepted, node by node | III (accessible: serious and critical incomplete results fail the `axe` gate) | `storybook/a11y-exceptions.json`, 74 entries naming this plan, one per row of the table "axe exceptions under FR-029" below, and nothing else: `color-contrast-incomplete` (serious) on the cells that the data table's scroll box partly clips (`elmPartiallyObscured`), at the inline end in the overflowing stories (overflows named by label, by caption, by host `aria-label`, with a blank host `aria-label`, unnamed; right to left; width 320) and at the block end in the bounded ones (sticky header, bounded; sticky header, under the room rule), both themes; and `th-has-data-cells-incomplete` (serious) on the `<table>` of the empty-body story, both themes. No other node, story or rule. | axe cannot compute the contrast of text the scroll box partly clips, so it reports the node as incomplete, which the `axe` gate counts as a finding (006 FR-029); the contrast of the same cell colours is decided elsewhere (US1-11's token pairs in both themes, `gate:contrast`). The empty-body story shows an edge case of the spec (a table whose `<tbody>` holds no row), where axe cannot tell which data cells the header cells name. 006 excepted the prose table's clipped column the same way (006 plan.md § Complexity Tracking). | Per rule: the clipped-cell entries go with the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box; the empty-body entries go with the op that settles axe's th-has-data-cells incomplete result on that state; each op to be opened by the operator. A changed or vanished node is a `stale-exception` and a stop-and-ask. | Operator, 2026-11-18, phase 1 stop T022, decision (a) (`reviews/phase-1/operator-stop-decisions.md`). |

- A story the `axe` gate fails is fixed in the story or the element. An exception entry, or any further state without
  a story, needs a row here and the operator's approval. Three rows stand: the host `aria-label` states of the timeline
  and the chain, the block-end fade's scrolled-to-end state (re-analysis C1 (b), narrowed by fixes-2 Q-1 (b)), and
  the data table's 74 axe incomplete results (phase 1 stop T022 (a)), whose nodes are the table below.
- The host rule on `.region-track` (R-03) is a styling override inside the data table's own stylesheet, and the
  measured caption width and end fade depth (R-07) are written by the data table into its own per-instance sheet, px
  figures only, beside the module's (the README's Styles convention amended for the count, recheck Q2 (c)). Neither
  changes 009's module. The operator chose the first at the plan gate (decision 1 (a), 2026-11-16).
- The markers' `border-radius: 50%` is recorded under constitution II as a mark shape, not a corner radius (Q-D,
  operator decision (a) on PLAN-CORRECTNESS-1-004); it is not an exception and adds no token.
- Every other spec'd state has a story (contracts/checks.md § Stories): every state but those of the two rows above,
  the sticky header with no bound (US1-20) included since the re-analysis (C1 (b)) and the room-rule state since
  fixes-2 Q-1 (b), so FR-050 records no further
  state without one.
- The base-style hook `--data-table-box-size` / `--data-table-end-fade` (analysis I7 (a)) is surface under
  constitution VII, not an exception: it is documented in both packages' READMEs and CHANGELOGs. So is the
  `data-ocelle-align` hook (IQ-3): `@ocelle/styles`' Hooks table and CHANGELOG.
- The change to 009's internal overflow-region module (FR-018) is not a principle exception: the operator chose it
  (IQ-2, 2026-11-18), FR-008 is amended to allow exactly it, the module stays internal (constitution VII), and its
  default leaves `ocelle-scroller`, `ocelle-workflow-board` and 009's tests unchanged. It is recorded here because it
  reaches outside this mission's own elements: scope, the opt-in block-axis option only; sunset, none needed (it is a
  permanent, documented part of the module, contracts/overflow-region-block-axis.md).
- The hover stories (IQ-5) use #10's pointer parameter, as the tooltip's do; no story without a pointer state is
  added for a hover state, and no exception entry is needed.
- The row hover and stripes paint grounds in forced colours' place by a row band (R-20), not by
  `forced-color-adjust: none`, which 003's `source.test.ts` rejects in `base.css`.

### axe exceptions under FR-029

Opened by phase 1 (operator decision (a) at the stop T022, 2026-11-18, `reviews/phase-1/operator-stop-decisions.md`), as 006 did for the prose table's clipped column. Each row below is one entry of `storybook/a11y-exceptions.json` (same story, theme, rule, selector, reason and sunset; `plan` `specs/019-data-records/plan.md`), in the gate's run order. Selectors are those `gate:axe` reported on the green commit 7c9a166 (two runs, the same 74 nodes).

| Story | Theme | Rule | Selector | Reason | Approval | Sunset |
|---|---|---|---|---|---|---|
| `elements-ocelle-data-table--overflows-named-by-label` | `light` | `color-contrast-incomplete` | `ocelle-data-table > table > tbody > tr:nth-child(1) > td:nth-child(2)` | cell partly clipped at the inline end of the overflowing data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--overflows-named-by-label` | `light` | `color-contrast-incomplete` | `ocelle-data-table > table > tbody > tr:nth-child(2) > td:nth-child(2)` | cell partly clipped at the inline end of the overflowing data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--overflows-named-by-label` | `light` | `color-contrast-incomplete` | `ocelle-data-table > table > tbody > tr:nth-child(3) > td:nth-child(2)` | cell partly clipped at the inline end of the overflowing data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--overflows-named-by-label` | `light` | `color-contrast-incomplete` | `tr:nth-child(4) > td:nth-child(2)` | cell partly clipped at the inline end of the overflowing data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--overflows-named-by-label` | `dark` | `color-contrast-incomplete` | `ocelle-data-table > table > tbody > tr:nth-child(1) > td:nth-child(2)` | cell partly clipped at the inline end of the overflowing data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--overflows-named-by-label` | `dark` | `color-contrast-incomplete` | `ocelle-data-table > table > tbody > tr:nth-child(2) > td:nth-child(2)` | cell partly clipped at the inline end of the overflowing data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--overflows-named-by-label` | `dark` | `color-contrast-incomplete` | `ocelle-data-table > table > tbody > tr:nth-child(3) > td:nth-child(2)` | cell partly clipped at the inline end of the overflowing data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--overflows-named-by-label` | `dark` | `color-contrast-incomplete` | `tr:nth-child(4) > td:nth-child(2)` | cell partly clipped at the inline end of the overflowing data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--overflows-named-by-caption` | `light` | `color-contrast-incomplete` | `ocelle-data-table > table > tbody > tr:nth-child(1) > td:nth-child(2)` | cell partly clipped at the inline end of the overflowing data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--overflows-named-by-caption` | `light` | `color-contrast-incomplete` | `ocelle-data-table > table > tbody > tr:nth-child(2) > td:nth-child(2)` | cell partly clipped at the inline end of the overflowing data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--overflows-named-by-caption` | `light` | `color-contrast-incomplete` | `ocelle-data-table > table > tbody > tr:nth-child(3) > td:nth-child(2)` | cell partly clipped at the inline end of the overflowing data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--overflows-named-by-caption` | `light` | `color-contrast-incomplete` | `tr:nth-child(4) > td:nth-child(2)` | cell partly clipped at the inline end of the overflowing data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--overflows-named-by-caption` | `dark` | `color-contrast-incomplete` | `ocelle-data-table > table > tbody > tr:nth-child(1) > td:nth-child(2)` | cell partly clipped at the inline end of the overflowing data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--overflows-named-by-caption` | `dark` | `color-contrast-incomplete` | `ocelle-data-table > table > tbody > tr:nth-child(2) > td:nth-child(2)` | cell partly clipped at the inline end of the overflowing data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--overflows-named-by-caption` | `dark` | `color-contrast-incomplete` | `ocelle-data-table > table > tbody > tr:nth-child(3) > td:nth-child(2)` | cell partly clipped at the inline end of the overflowing data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--overflows-named-by-caption` | `dark` | `color-contrast-incomplete` | `tr:nth-child(4) > td:nth-child(2)` | cell partly clipped at the inline end of the overflowing data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--overflows-unnamed` | `light` | `color-contrast-incomplete` | `ocelle-data-table > table > tbody > tr:nth-child(1) > td:nth-child(2)` | cell partly clipped at the inline end of the overflowing data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--overflows-unnamed` | `light` | `color-contrast-incomplete` | `ocelle-data-table > table > tbody > tr:nth-child(2) > td:nth-child(2)` | cell partly clipped at the inline end of the overflowing data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--overflows-unnamed` | `light` | `color-contrast-incomplete` | `ocelle-data-table > table > tbody > tr:nth-child(3) > td:nth-child(2)` | cell partly clipped at the inline end of the overflowing data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--overflows-unnamed` | `light` | `color-contrast-incomplete` | `tr:nth-child(4) > td:nth-child(2)` | cell partly clipped at the inline end of the overflowing data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--overflows-unnamed` | `dark` | `color-contrast-incomplete` | `ocelle-data-table > table > tbody > tr:nth-child(1) > td:nth-child(2)` | cell partly clipped at the inline end of the overflowing data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--overflows-unnamed` | `dark` | `color-contrast-incomplete` | `ocelle-data-table > table > tbody > tr:nth-child(2) > td:nth-child(2)` | cell partly clipped at the inline end of the overflowing data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--overflows-unnamed` | `dark` | `color-contrast-incomplete` | `ocelle-data-table > table > tbody > tr:nth-child(3) > td:nth-child(2)` | cell partly clipped at the inline end of the overflowing data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--overflows-unnamed` | `dark` | `color-contrast-incomplete` | `tr:nth-child(4) > td:nth-child(2)` | cell partly clipped at the inline end of the overflowing data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--overflows-named-by-host-aria-label` | `light` | `color-contrast-incomplete` | `ocelle-data-table > table > tbody > tr:nth-child(1) > td:nth-child(2)` | cell partly clipped at the inline end of the overflowing data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--overflows-named-by-host-aria-label` | `light` | `color-contrast-incomplete` | `ocelle-data-table > table > tbody > tr:nth-child(2) > td:nth-child(2)` | cell partly clipped at the inline end of the overflowing data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--overflows-named-by-host-aria-label` | `light` | `color-contrast-incomplete` | `ocelle-data-table > table > tbody > tr:nth-child(3) > td:nth-child(2)` | cell partly clipped at the inline end of the overflowing data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--overflows-named-by-host-aria-label` | `light` | `color-contrast-incomplete` | `tr:nth-child(4) > td:nth-child(2)` | cell partly clipped at the inline end of the overflowing data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--overflows-named-by-host-aria-label` | `dark` | `color-contrast-incomplete` | `ocelle-data-table > table > tbody > tr:nth-child(1) > td:nth-child(2)` | cell partly clipped at the inline end of the overflowing data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--overflows-named-by-host-aria-label` | `dark` | `color-contrast-incomplete` | `ocelle-data-table > table > tbody > tr:nth-child(2) > td:nth-child(2)` | cell partly clipped at the inline end of the overflowing data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--overflows-named-by-host-aria-label` | `dark` | `color-contrast-incomplete` | `ocelle-data-table > table > tbody > tr:nth-child(3) > td:nth-child(2)` | cell partly clipped at the inline end of the overflowing data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--overflows-named-by-host-aria-label` | `dark` | `color-contrast-incomplete` | `tr:nth-child(4) > td:nth-child(2)` | cell partly clipped at the inline end of the overflowing data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--overflows-blank-host-aria-label` | `light` | `color-contrast-incomplete` | `ocelle-data-table > table > tbody > tr:nth-child(1) > td:nth-child(2)` | cell partly clipped at the inline end of the overflowing data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--overflows-blank-host-aria-label` | `light` | `color-contrast-incomplete` | `ocelle-data-table > table > tbody > tr:nth-child(2) > td:nth-child(2)` | cell partly clipped at the inline end of the overflowing data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--overflows-blank-host-aria-label` | `light` | `color-contrast-incomplete` | `ocelle-data-table > table > tbody > tr:nth-child(3) > td:nth-child(2)` | cell partly clipped at the inline end of the overflowing data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--overflows-blank-host-aria-label` | `light` | `color-contrast-incomplete` | `tr:nth-child(4) > td:nth-child(2)` | cell partly clipped at the inline end of the overflowing data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--overflows-blank-host-aria-label` | `dark` | `color-contrast-incomplete` | `ocelle-data-table > table > tbody > tr:nth-child(1) > td:nth-child(2)` | cell partly clipped at the inline end of the overflowing data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--overflows-blank-host-aria-label` | `dark` | `color-contrast-incomplete` | `ocelle-data-table > table > tbody > tr:nth-child(2) > td:nth-child(2)` | cell partly clipped at the inline end of the overflowing data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--overflows-blank-host-aria-label` | `dark` | `color-contrast-incomplete` | `ocelle-data-table > table > tbody > tr:nth-child(3) > td:nth-child(2)` | cell partly clipped at the inline end of the overflowing data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--overflows-blank-host-aria-label` | `dark` | `color-contrast-incomplete` | `tr:nth-child(4) > td:nth-child(2)` | cell partly clipped at the inline end of the overflowing data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--right-to-left` | `light` | `color-contrast-incomplete` | `ocelle-data-table > table > tbody > tr:nth-child(1) > td:nth-child(2)` | cell partly clipped at the inline end of the overflowing data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--right-to-left` | `light` | `color-contrast-incomplete` | `ocelle-data-table > table > tbody > tr:nth-child(2) > td:nth-child(2)` | cell partly clipped at the inline end of the overflowing data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--right-to-left` | `light` | `color-contrast-incomplete` | `ocelle-data-table > table > tbody > tr:nth-child(3) > td:nth-child(2)` | cell partly clipped at the inline end of the overflowing data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--right-to-left` | `light` | `color-contrast-incomplete` | `tr:nth-child(4) > td:nth-child(2)` | cell partly clipped at the inline end of the overflowing data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--right-to-left` | `dark` | `color-contrast-incomplete` | `ocelle-data-table > table > tbody > tr:nth-child(1) > td:nth-child(2)` | cell partly clipped at the inline end of the overflowing data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--right-to-left` | `dark` | `color-contrast-incomplete` | `ocelle-data-table > table > tbody > tr:nth-child(2) > td:nth-child(2)` | cell partly clipped at the inline end of the overflowing data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--right-to-left` | `dark` | `color-contrast-incomplete` | `ocelle-data-table > table > tbody > tr:nth-child(3) > td:nth-child(2)` | cell partly clipped at the inline end of the overflowing data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--right-to-left` | `dark` | `color-contrast-incomplete` | `tr:nth-child(4) > td:nth-child(2)` | cell partly clipped at the inline end of the overflowing data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--empty-body` | `light` | `th-has-data-cells-incomplete` | `ocelle-data-table > table` | header cells of a table with an empty `<tbody>` (spec edge case), so axe cannot decide which data cells they name | operator, 2026-11-18 | the op that settles axe's th-has-data-cells incomplete result on `ocelle-data-table`'s empty-body state, to be opened by the operator |
| `elements-ocelle-data-table--empty-body` | `dark` | `th-has-data-cells-incomplete` | `ocelle-data-table > table` | header cells of a table with an empty `<tbody>` (spec edge case), so axe cannot decide which data cells they name | operator, 2026-11-18 | the op that settles axe's th-has-data-cells incomplete result on `ocelle-data-table`'s empty-body state, to be opened by the operator |
| `elements-ocelle-data-table--width-320` | `light` | `color-contrast-incomplete` | `ocelle-data-table > table > tbody > tr:nth-child(1) > td:nth-child(2)` | cell partly clipped at the inline end of the overflowing data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--width-320` | `light` | `color-contrast-incomplete` | `ocelle-data-table > table > tbody > tr:nth-child(2) > td:nth-child(2)` | cell partly clipped at the inline end of the overflowing data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--width-320` | `light` | `color-contrast-incomplete` | `ocelle-data-table > table > tbody > tr:nth-child(3) > td:nth-child(2)` | cell partly clipped at the inline end of the overflowing data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--width-320` | `light` | `color-contrast-incomplete` | `tr:nth-child(4) > td:nth-child(2)` | cell partly clipped at the inline end of the overflowing data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--width-320` | `dark` | `color-contrast-incomplete` | `ocelle-data-table > table > tbody > tr:nth-child(1) > td:nth-child(2)` | cell partly clipped at the inline end of the overflowing data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--width-320` | `dark` | `color-contrast-incomplete` | `ocelle-data-table > table > tbody > tr:nth-child(2) > td:nth-child(2)` | cell partly clipped at the inline end of the overflowing data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--width-320` | `dark` | `color-contrast-incomplete` | `ocelle-data-table > table > tbody > tr:nth-child(3) > td:nth-child(2)` | cell partly clipped at the inline end of the overflowing data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--width-320` | `dark` | `color-contrast-incomplete` | `tr:nth-child(4) > td:nth-child(2)` | cell partly clipped at the inline end of the overflowing data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--sticky-header-bounded` | `light` | `color-contrast-incomplete` | `tr:nth-child(10) > td:nth-child(1)` | cell partly clipped at the block end of the bounded data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--sticky-header-bounded` | `light` | `color-contrast-incomplete` | `tr:nth-child(10) > td:nth-child(2)` | cell partly clipped at the block end of the bounded data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--sticky-header-bounded` | `light` | `color-contrast-incomplete` | `tr:nth-child(10) > td:nth-child(3)` | cell partly clipped at the block end of the bounded data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--sticky-header-bounded` | `light` | `color-contrast-incomplete` | `tr:nth-child(10) > td:nth-child(4)` | cell partly clipped at the block end of the bounded data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--sticky-header-bounded` | `dark` | `color-contrast-incomplete` | `tr:nth-child(10) > td:nth-child(1)` | cell partly clipped at the block end of the bounded data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--sticky-header-bounded` | `dark` | `color-contrast-incomplete` | `tr:nth-child(10) > td:nth-child(2)` | cell partly clipped at the block end of the bounded data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--sticky-header-bounded` | `dark` | `color-contrast-incomplete` | `tr:nth-child(10) > td:nth-child(3)` | cell partly clipped at the block end of the bounded data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--sticky-header-bounded` | `dark` | `color-contrast-incomplete` | `tr:nth-child(10) > td:nth-child(4)` | cell partly clipped at the block end of the bounded data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--sticky-header-room-rule` | `light` | `color-contrast-incomplete` | `ocelle-data-table > table > tbody > tr:nth-child(3) > td:nth-child(1)` | cell partly clipped at the block end of the bounded data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--sticky-header-room-rule` | `light` | `color-contrast-incomplete` | `ocelle-data-table > table > tbody > tr:nth-child(3) > td:nth-child(2)` | cell partly clipped at the block end of the bounded data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--sticky-header-room-rule` | `light` | `color-contrast-incomplete` | `ocelle-data-table > table > tbody > tr:nth-child(3) > td:nth-child(3)` | cell partly clipped at the block end of the bounded data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--sticky-header-room-rule` | `light` | `color-contrast-incomplete` | `ocelle-data-table > table > tbody > tr:nth-child(3) > td:nth-child(4)` | cell partly clipped at the block end of the bounded data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--sticky-header-room-rule` | `dark` | `color-contrast-incomplete` | `ocelle-data-table > table > tbody > tr:nth-child(3) > td:nth-child(1)` | cell partly clipped at the block end of the bounded data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--sticky-header-room-rule` | `dark` | `color-contrast-incomplete` | `ocelle-data-table > table > tbody > tr:nth-child(3) > td:nth-child(2)` | cell partly clipped at the block end of the bounded data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--sticky-header-room-rule` | `dark` | `color-contrast-incomplete` | `ocelle-data-table > table > tbody > tr:nth-child(3) > td:nth-child(3)` | cell partly clipped at the block end of the bounded data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
| `elements-ocelle-data-table--sticky-header-room-rule` | `dark` | `color-contrast-incomplete` | `ocelle-data-table > table > tbody > tr:nth-child(3) > td:nth-child(4)` | cell partly clipped at the block end of the bounded data table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-18 | the op that fixes the color-contrast incomplete results of cells partly clipped by `ocelle-data-table`'s scroll box, to be opened by the operator |
