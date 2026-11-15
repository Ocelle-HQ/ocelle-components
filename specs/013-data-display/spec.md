# Feature Specification: Data Display, First Slice (Facts, Empty State, Progress)

**Feature Branch**: `013-data-display` (work happens on `claude/013-data-display`)

**Created**: 2026-11-13

**Status**: Draft

**Input**: User description: "Mission for #13 (triage/013-data-display.md, approved; operator chose option B), spec
directory specs/013-data-display: this mission builds the first three of #13's eight elements, and #13 stays open for
two follow-on missions. In @ocelle/elements, following mission 005's element conventions (README § Element
conventions, manifest gate), with every class family replaced by an element (spec-kitty-design#523), no monospace,
and values and ids in Schibsted Grotesk with tabular figures (--ocelle-figures); (P1) ocelle-facts, a responsive label
and value grid (#280) that keeps the semantics of a description list across its slots, with values at
--ocelle-font-size-fact (#531) and the identifier wrap policy of 003 (data-ocelle-wrap, #535) available on values
through a part or property; (P2) ocelle-empty-state, with a consumer-set heading level and a panel variant with the
larger vertical rhythm and lighter heading weight of the prototype's empty and loading panels (#510); (P3)
ocelle-progress, determinate, indeterminate, compact and labelled (#498), named without an ID reference crossing a
shadow root, with the indeterminate motion stopped under prefers-reduced-motion, and the ochre --ocelle-color-accent
fill paired with --ocelle-color-accent-strong or text in light mode (constitution II); new tokens (panel rhythm,
progress track) only where no existing token fits, added to @ocelle/tokens with validation; done when #7's checklist
holds for each element (a story per variant and state with light and dark baselines, interaction tests for every event
and payload, keyboard and screen-reader tests, axe with no serious or critical finding, manifest entries, strict-CSP
check) plus a 320 px reflow test for facts; settle at clarify the questions the triage record lists (facts' child
structure, progress's platform basis, the panel variant's tokens). Operator decision I3 for the whole flow: story
tests are written in each phase's red commit, before green; red.sh keeps one red record per phase. Stories,
baselines and axe are planned against #10's final design (branch claude/010-storybook-workbench,
specs/006-storybook-workbench), not merged, to be rechecked when #10 lands."

**Issues**: #13, partly (triage record `triage/013-data-display.md`, approved by the operator on 2026-11-13). The
operator chose option B at the triage gate, so this mission builds three of #13's eight elements. `ocelle-data-table`,
`ocelle-event-timeline` and `ocelle-evidence-chain` are left to follow-on 1, and `ocelle-disclosure` and
`ocelle-code-block` to follow-on 2, which starts after #15 merges. #13 stays open until the last follow-on lands. The
spec-kitty-design issues #13 cites (#280, #498, #510, #523, #531, #535) were not read from this session when the
spec was written. The requirements below come from #13's body, the epic #1's gap table and the triage record, which is
the source record. The plan's research has since read #531 and #535 from their verbatim copy in
`specs/003-base-styles/sources/spec-kitty-design-issues.md` (research R-03; FR-008 follows #531).
The plan's research was to read those six issues and record anything in them that changes or adds to a requirement
here (#531 for FR-008, #510 for FR-022 and US2, #535 for FR-007, #498 for US3). It read #531 and #535; the read access
for #280, #498, #510 and #523 was denied, and the operator decided at the plan gate to proceed without them ("Proceed,
inputs later", below). Anything in them read later that changes a requirement goes to the operator. The operator has
since supplied #280, #498, #510 and #523 verbatim, with the kitty-mission-ui inventory, in `sources/013-inputs.md`;
research R-03 records what each states for this mission and R-11 the inventory. Their gaps and conflicts with this
spec were open questions for the operator (`reviews/analysis/inputs-questions.md`, IQ-01 to IQ-15), which the
operator has decided (below, "Operator decisions on the input questions"). #280's grouped grid that reflows across
four, two and one columns is answered in this mission by `layout="grid"` (FR-014, US1-13 to US1-19).
Spec Kitty's `sk-*` names are kitty-mission-ui roles, not names in this library.

**Consumers** (constitution VI): kitty-mission-ui (Kitty Desktop and Kitty Dashboard) replaces its `.sk-facts` (8
rendered uses), `.sk-empty-state` (25) and `.sk-progress` (14) class families with these elements. The triage
record's 34, 75 and 74 "class uses" (183) were text matches in its source, which count comments, local selectors and
child classes; at the inventoried commit they are 34, 75 and 76 (research R-11). The Ocelle web console
uses them in server-rendered pages under a strict CSP.

**Operator decisions while specifying** (2026-11-13, human:jeroennouwsdev):

- Split, at the triage gate: option B, as above.
- Facts pair structure (Q1), "(b) ocelle-fact child": each pair is an `ocelle-fact` child element with a `label`
  property and the value as content (FR-003). This adds a fourth element and sets the slotted-item pattern the
  follow-on timeline and chain reuse.
- Panel variant tokens (Q2), "Existing tokens": the panel rhythm uses existing `--ocelle-space-*` and
  `--ocelle-font-weight-*` tokens; no `--ocelle-panel-*` token is added (FR-022).
- Flow decision I3: the story tests (the stories each phase adds) are written in that phase's red commit, before
  green, and `red.sh` keeps one red record per phase.
- Facts semantics with `ocelle-fact` children (spec check 1, SPEC-1-04), "D: decide after measuring": Q1 (b) stands.
  The plan's research measures, in the Chromium accessibility tree and against axe's `definition-list` and `dlitem`
  rules, whether one clean description list can be had with `ocelle-fact` children while the consumer's content stays
  unchanged (FR-003). The result goes back to the operator, who decides before tasks are generated whether FR-004
  stands as written or changes (FR-004).

**Operator decisions at the plan squad, round 1** (2026-11-13, human:jeroennouwsdev; finding IDs in
`reviews/plan/round-1/refute.md`):

- Indeterminate motion (PLAN-A11Y-SECURITY-1-001, (a)): the moving mark runs for a bounded time under 5 s and ends on
  the still mark (FR-033, US3-12).
- Track boundary (PLAN-A11Y-SECURITY-1-002, (a)): on inset, accent-low, hover-bg and the state grounds the track
  boundary is `--ocelle-color-accent-strong`, selected by an attribute (FR-036, US3-13).
- Compact density (PLAN-CORRECTNESS-1-002, (b)): inside a `data-ocelle-density="compact"` region values take the
  region's size and line height; `density="compact"` only tightens gaps (FR-008).
- Stacking (PLAN-CORRECTNESS-1-003, (a)): the switch is decided on the inline space available to the element, so the
  layout does not depend on history (FR-005, FR-009). Amended in rounds 2 and 3 (PLAN-FRESH-2-001 (c),
  PLAN-FRESH-3-001 (c), below).
- Module dependency (PLAN-CORRECTNESS-1-012, (a)): a container module imports its item element, recorded in the
  README conventions (FR-056).
- FR-004 recheck (PLAN-CORRECTNESS-1-014, (b)): the recheck under Lit and axe-core 4.14.0 stays in phase 1's spike;
  any failing result stops the flow for the operator before the red commit, and FR-003, FR-004 and US1-10 are not
  changed by review.
- A progress bar in the empty state's `visual` slot (PLAN-FRESH-1-005, (a)): it spans the column up to the reading
  measure (FR-021, US2-7).
- Facts before upgrade (PLAN-FRESH-1-009, (a)): the pre-upgrade state is recorded, and `@ocelle/styles` ships a rule
  that puts each fact on its own line (FR-012).
- The plan-level decisions (a `token-only` allowance, no new contrast rows, `undefined` property defaults) are in the
  plan.

**Operator decisions at the plan squad, round 2** (2026-11-13, human:jeroennouwsdev; finding IDs in
`reviews/plan/round-2/refute.md`):

- Stacking (PLAN-FRESH-2-001, (c)), amending round 1's PLAN-CORRECTNESS-1-003 (a): the automatic switch is decided on
  the element's own inline size, as laid out in two columns, and a public `layout` property lets a consumer in a
  shrink-to-fit host choose two columns or one (FR-005, FR-009, FR-013, US1-11).
- Indeterminate motion on a page (PLAN-FRESH-2-005, (a)): the sweep is anchored to the page, so a bar replaced,
  re-shown or made indeterminate again continues the one sweep instead of starting another (FR-033, US3-14).
  Amended in round 3 (PLAN-FRESH-3-004 (a), below): the sweep belongs to a loading episode, not the whole page.
- Hidden slotted parts (PLAN-FRESH-2-007, (a)): an empty-state part is present only while something assigned to its
  slot renders, and toggling `hidden` on slotted content updates the layout (FR-023, US2-9).

**Operator decisions at the plan squad, round 3** (2026-11-13, human:jeroennouwsdev; finding IDs in
`reviews/plan/round-3/refute.md`):

- Stacking triggers (PLAN-FRESH-3-001, (c)): the automatic switch is re-decided on the element's own resize, a
  threshold change, every content change (value text included) and a window resize, and history independence is
  narrowed for any change of the offered space the element does not observe, where `layout` or an inline size is the
  consumer's remedy (FR-005, FR-009, US1-12).
- Fill transition (PLAN-FRESH-3-003, (b)): the fill has no width transition; its inline size changes at once (US3-2,
  edge case "Rapid value changes").
- Indeterminate motion per loading episode (PLAN-FRESH-3-004, (a)), amending round 2's PLAN-FRESH-2-005 (a): the one
  sweep belongs to a continuous loading episode, which ends when no indeterminate bar is connected at a frame boundary;
  a later episode gets its own sweep (FR-033, US3-15).

**Operator decisions at the plan gate** (2026-11-13, human:jeroennouwsdev; `reviews/plan/operator-gate.md`):

- FR-004 (SPEC-1-04 "D"), "Confirm FR-004": FR-004 stands as written and tasks are generated against it. Phase 1's
  spike rechecks it under Lit 3.3.3 and axe-core 4.14.0, with the empty term, and stops for the operator if it fails
  (PLAN-CORRECTNESS-1-014 (b)).
- #10 merged on `main` (3828d2f), "Merge main, then update": `main` is merged into this branch, and the stories' light
  and dark baselines and their `axe`, `visual` and `storybook-build` gate runs are part of each phase (FR-051,
  SC-003).
- Upstream inputs, "Proceed, inputs later": the kitty-mission-ui variant inventory (FR-058) stays pending and is
  needed before the red commit of each element's phase; any gap goes to the operator. spec-kitty-design #280, #498,
  #510 and #523 remain unread.

**Operator decisions at the tasks gate** (2026-11-13, human:jeroennouwsdev; `reviews/analysis/operator-decisions.md`):

- C1, "Record exception row": the three states with no story (the unnamed progress, the progress named by a host
  `aria-label`, `ocelle-fact` outside `ocelle-facts`) are one recorded exception to constitution V in the plan's
  Complexity Tracking, approved with this decision (FR-050).
- I1, "Roles, not sk- names": the README mapping table holds the `.sk-*` names (Markdown is outside the `prefix`
  gate); the readme tests assert the mapping rows by their role names, with no `sk-` string in test code (FR-002,
  FR-058).

**Operator decisions on the input questions** (2026-11-14, human:jeroennouwsdev;
`reviews/analysis/inputs-decisions.md`, questions in `reviews/analysis/inputs-questions.md`, inputs in
`sources/013-inputs.md`):

- IQ-01, (a): FR-005's tracks stay; the README warns against restyling the list's columns through `::part(list)`.
- IQ-02, (a): in a grid parent the consumer sets `min-inline-size: 0` on the `ocelle-facts` host; the README says so,
  and phase 1's spike adds a sheet as the item of a `1fr` grid track with a long value.
- IQ-03, (a): labels stay at `--ocelle-font-weight-medium` (500); a consumer sets another weight through
  `::part(label)`.
- IQ-04, (b): `break-word` and break-anywhere both map to `wrap="anywhere"` (FR-007 unchanged); the README states that
  the element has no truncation and that an ellipsis maps to `wrap="anywhere"`, the full value shown.
- IQ-05, (b): a third `layout` value, `grid`, for #280's grouped term and value cells that reflow across four, two and
  one columns on the sheet's own inline size (FR-013, FR-014, US1-13 to US1-19). This widens the public surface.
- IQ-06, (a): FR-022 stays as #510's text: the panel heading is lighter (500) with the larger rhythm.
- IQ-07, (a): no chrome (FR-021): the card, the message card and the ops card stay the consumer's; the dashed card
  belongs to the #509 panel-paint family, not this mission.
- IQ-08, (c): an `eyebrow` slot above the heading (FR-020, FR-025, US2-10). This widens the public surface. The path
  stays the consumer's body content.
- IQ-09, (b): the element zeroes the block margins of slotted body content and separates body children by
  `--ocelle-space-2` (FR-026, US2-11).
- IQ-10, (a): a bar named by a nearby heading takes the heading's text as `label`; the README says so.
- IQ-11, (b): a focusable loading heading is the consumer's own `<h2 tabindex="-1">` in the empty state's `heading`
  slot with the bar in `visual`; the README warns against a `role` or `tabindex` on the progress host.
- IQ-12, (a): the progress host is `display: block`; a consumer that places a bar inline sets its display and inline
  size from outside; the README says so.
- IQ-13, (b): the visible value text sits at the inline end of the labelled row, the label at its inline start
  (FR-035, US3-9, US3-10).
- IQ-14, (a): the label stays a `label` property, with no slot; the README says rich labels are not supported.
- IQ-15, (b): content inside `ocelle-progress` shows only before upgrade and is neither shown nor exposed after it;
  the README says so and a browser test proves the second half (FR-039, edge case "Text inside the progress
  element").

**Operator decisions after the input decisions** (2026-11-14, human:jeroennouwsdev;
`reviews/analysis/inputs-decisions.md` § After applying the decisions, `reviews/analysis/operator-decisions.md`
§ Second tasks gate):

- Grid limits, "Accept, README states": FR-007 is unchanged, so an unbroken value without `wrap="anywhere"` can
  overflow its value box or cell, and the no-horizontal-scroll rule holds for content that wraps between words or
  carries the policy (FR-009, FR-013, FR-014). A grid sheet in a shrink-to-fit host is four tracks wide unless given
  an inline size (FR-014). The README tells consumers to do both.
- Second tasks gate, "approve + fix all": the second analysis's findings are resolved by wording and added test
  bodies only, with no new public surface (`reviews/analysis/fixes-2.md`).

**Operator decisions on the phase 3 spike** (2026-11-15; `reviews/phase-3/operator-spike-decisions.md`, evidence in
`reviews/phase-3/spike.md`):

- US3-3, (a) "Prove the wiring, not the exposure": no read a test can make in Chromium exposes a progressbar's value
  text, while value, minimum and maximum read correctly. US3-3's test checks the visible `value-text` part ("7 of 12"
  with `show-label`, absent while indeterminate, kept when clamped), and the README states that the library's tests
  do not verify the value text's exposure to assistive technology (FR-031, US3-3).

## Scope

**In scope:** four new custom elements in `@ocelle/elements` (`ocelle-facts` with its child `ocelle-fact`,
`ocelle-empty-state`, `ocelle-progress`). This covers their stories, tests, manifest entries and README sections
(FR-001 and FR-054 say what `ocelle-fact` shares with `ocelle-facts`), any new tokens in `@ocelle/tokens` that these
elements need and that no existing token provides (FR-040), and two `@ocelle/styles` rules the facts element relies
on: the compact region's value scale (FR-008) and the pre-upgrade rule (FR-012).

**Out of scope:**

- the other five elements of #13;
- copying text to the clipboard (constitution I; #14 and the host);
- the eyebrow tokens (added by 011 or 012); the empty state's `eyebrow` slot uses existing type tokens (FR-025);
- the `storybook-build`, `visual` and `axe` gates themselves and the pinned container. Those are #10's, merged on
  `main`. This mission writes the stories #10's gates read, commits their baselines, and holds to #10's contributor
  note (`specs/006-storybook-workbench` FR-025, `storybook/README.md`). See FR-051.
- `ocelle-status-indicator` and its "never pulses an empty box" rule (#498 in #7). It is #7's (mission 012).
  `ocelle-progress` is the bar only. Which of the two a consumer uses for "busy" is recorded in this README (FR-033):
  the indeterminate bar for loading a region with no known end, the status indicator for a state.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A label and value sheet without classes (Priority: P1)

A Kitty Desktop screen shows a mission's facts: status, owner, created date, mission id, and a digest or path. The
developer writes an `ocelle-facts` element with its pairs inside it instead of a `<dl class="sk-facts">`. In a wide
column the labels and values sit in two columns (the two-column layout). In a narrow column (a 320 px viewport, or a narrow inspector) the
same pairs stack, label above value. A long identifier breaks inside its own value and never widens the grid or makes
the page scroll sideways. A screen-reader user hears each label with its value, as a description list. A Work
Package summary shows four facts as a strip of cells, each label above its value (#280's grid): four cells across a
wide column, two across a narrow one, one per row at 320 px, from the same markup with `layout="grid"`.

**Why this priority**: it replaces 8 rendered uses (34 text matches, R-11) and is the first element of the "every class family is an element"
rule for display content. It sets the slotted-item pattern the follow-on missions (timeline, chain) reuse.

**Independent Test**: render `ocelle-facts` with five pairs, one of them a 64-character identifier. At 1280 px and 320
px, check the layout, the absence of horizontal overflow, the computed type of the values, and the accessibility tree.

**Acceptance Scenarios**:

1. **Given** an `ocelle-facts` with three pairs in a container at least as wide as the two-column threshold
   (FR-005), **When** it renders, **Then** each label and its value share a row, labels form the first column and
   values the second, and rows follow source order.
2. **Given** the same element in a container narrower than the threshold, **When** it renders, **Then** each value is
   directly below its label, in one column, with no horizontal overflow of the element or the page.
3. **Given** a value holding a 64-character identifier with no spaces, marked as an identifier (FR-007), **When** the
   element is 320 px wide (below the threshold, FR-005), **Then** the pairs are in one column, the identifier wraps
   inside its value box, the value box's inline size equals the element's content-box inline size, and the page's
   scroll width equals the viewport width.
4. **Given** the same identifier, **When** a user selects and copies the value, **Then** the copied text is the
   identifier unchanged, with no inserted characters.
5. **Given** any value, **When** its computed style is read, **Then** its font family resolves through `--ocelle-font-sans`,
   its font size through `--ocelle-font-size-fact`, and its `font-variant-numeric` is `tabular-nums` through
   `--ocelle-figures`. No computed font family in the element is a monospace family.
6. **Given** an `ocelle-facts` with three pairs, **When** the accessibility tree is read in Chromium, **Then** it holds
   one description list with three terms and three definitions, each definition following its term (FR-004, confirmed
   by the operator at the plan gate after the plan's measurement).
7. **Given** a pair whose value is empty, **When** it renders, **Then** the row keeps its label and an empty value box,
   and the description list still holds that term with an empty definition.
8. **Given** the page in light or dark theme, **When** it renders, **Then** labels and values meet the text-contrast
   check on each main ground the tokens declare (the element paints no ground of its own). **Given** forced colours,
   **Then** every label's and value's computed text colour is a system colour (`CanvasText`, or `LinkText` for a
   link) and none is transparent.
9. **Given** a compact density (FR-008), **When** it renders, **Then** the row gap and the value size are those
   FR-008 names, and the stacking at the threshold still holds. **Given** the element inside a
   `data-ocelle-density="compact"` region, **Then** its values take the region's font size and line height
   (FR-008).
10. **Given** a pair with no `label` (absent or empty), **When** it renders, **Then** the row keeps an empty label box
    in the label column and its value in the value column, and the description list holds an empty term followed by
    that value's definition (FR-003).
11. **Given** a short sheet ("Owner" / "Ada Lovelace") in a `<dialog>` 1280 px wide, **When** it renders without
    `layout`, **Then** its pairs are in one column (its own two-column inline size is below the threshold, FR-005);
    **When** `layout="columns"` is set, **Then** they are in two columns with no horizontal overflow; and **Given**
    `layout="stacked"` in a 600 px block container, **Then** they are in one column (FR-013).
12. **Given** a sheet with the pair "Created by op" / "Ada Lovelace and Charles Babbage" (content whose two-column
    size is above the threshold at 1200 px and whose stacked size is below it; the plan fixes the exact text) in a
    `<dialog>`, loaded at a 360 px viewport (one column), **When** the viewport is widened to 1200 px, **Then** its
    layout is the layout of the same sheet loaded at 1200 px; and **Given** a stacked sheet in a 1280 px dialog with
    the label "Id" and the same value, **When** the label is changed to "Created by operator", or the value's text is
    changed in place, **Then** its layout is the layout of a fresh load of the changed content (FR-005, FR-009).
13. **Given** an `ocelle-facts` with `layout="grid"` and four pairs in a block container 1280 px wide, **When** it
    renders, **Then** the four pairs are four cells in one row, in source order from the inline start, each cell's
    label directly above its value, the cells of equal inline size, each label separated from its value by
    `--ocelle-space-1` and the columns by `--ocelle-space-4`, with no ground, divider or border painted by the sheet;
    and the accessibility tree holds one description list with four terms and four definitions, each definition
    following its term, in source order (FR-004, FR-014).
14. **Given** the same sheet in a block container 600 px wide, **When** it renders, **Then** the cells are in two
    columns and two rows, in source order row by row; **Given** a block container 320 px wide, **Then** the cells are
    in one column, with no horizontal overflow of the element or the page (FR-014).
15. **Given** a grid sheet with one, three and eight pairs, each in a block container 1280 px wide, **When** it
    renders, **Then** the cells are in four columns of equal inline size: one cell in the first column; three cells in
    the first three columns of one row; eight cells in two rows of four. No cell spans more than one column (FR-014).
16. **Given** a grid sheet in a 600 px block container whose second pair has a label of several sentences and whose
    third pair holds the 64-character identifier with `wrap="anywhere"`, **When** it renders, **Then** the label wraps
    between words inside its cell, the identifier wraps inside its cell, no cell's box overlaps another, and the
    page's scroll width equals the viewport width; at a 640 px viewport (200% zoom of 1280 px) the same holds (FR-007,
    FR-009, FR-014).
17. **Given** a grid sheet with four pairs under `dir="rtl"` in a block container 1280 px wide, **When** it renders,
    **Then** the first pair's cell is at the inline start (the right edge) and the cells follow source order towards
    the left (FR-014).
18. **Given** a grid sheet with "Created by op" / "Ada Lovelace and Charles Babbage" (the content US1-12 fixes) in a
    `<dialog>`, loaded at a 360 px viewport, **When** the viewport is widened to 1280 px, **Then** its column count is
    that of the same sheet loaded at 1280 px (FR-009, FR-014).
19. **Given** a grid sheet whose values are a link, a status text and the consumer's explicit unavailable text
    ("Not recorded"), **When** it renders, **Then** each value is shown as the consumer gave it in its cell, the link
    keeps its own tab stop inside its value box, and the element adds no text of its own (FR-003, FR-011).

---

### User Story 2 - An empty or loading panel without classes (Priority: P2)

A list screen has no items yet. The developer places an `ocelle-empty-state` with the page's own heading ("No
missions yet"), one sentence of explanation and a button. Inside a card it is a quiet block. In the `panel` variant,
which fills a list or inspector panel, it has the larger vertical rhythm and lighter heading weight of the prototype's
empty and loading panels. The same panel variant with an `ocelle-progress` inside is the loading panel. The page's
heading outline stays the page's: the element never forces a heading level. A refusal block adds a short eyebrow line
above its heading ("Refused") and a body of two paragraphs, a sentence and a file path, spaced by the element.

**Why this priority**: 25 rendered uses (75 text matches, R-11). It depends on nothing from P1, but its panel variant pairs with P3 for the
loading panel, so it comes before P3.

**Independent Test**: render the element with a slotted `h2`, a body sentence and a slotted button, in the default and
`panel` variants. Check the heading level in the accessibility tree, the computed rhythm and weight, and that the
button stays in the tab order.

**Acceptance Scenarios**:

1. **Given** an `ocelle-empty-state` with a slotted `<h3>` heading, a body paragraph and a slotted button, **When** the
   accessibility tree is read, **Then** it holds a heading of level 3 with the slotted text, the paragraph and the
   button, in that order. The element itself adds no heading, landmark or live region.
2. **Given** the same element with an `<h2>`, **When** it renders, **Then** the heading is level 2: the level is the
   consumer's, set by the element they slot.
3. **Given** the default variant, **When** computed styles are read, **Then** the heading weight, the block padding
   and the gaps between heading, body and actions are those FR-021 names.
4. **Given** `variant="panel"`, **When** computed styles are read, **Then** the block padding and gaps are larger than
   the default's, and the heading weight is lighter than the default's, with the values FR-022 names.
5. **Given** an empty-state without a body or actions, or without a visual, or with only actions, **When** it
   renders, **Then** the empty slots take no space and add no gap: the first present part starts at the block
   padding and the last ends at it (FR-023).
6. **Given** a slotted button, **When** the user presses Tab, **Then** focus reaches the button with the token focus
   ring. The element adds no tab stop of its own.
7. **Given** `variant="panel"` with an `ocelle-progress` slotted as its visual, **When** it renders, **Then** the
   progress sits above the heading, separated by the panel's visual-to-heading gap (FR-021, FR-022), its inline size
   is the smaller of the column's inline size and the reading measure (FR-021), and the screen reader reaches the
   progress before the heading.
8. **Given** light or dark theme, in either variant, **When** it renders, **Then** heading and body meet the
   text-contrast check on each main ground the tokens declare (neither variant paints a ground of its own). **Given**
   forced colours, **Then** the heading's and body's computed text colours are system colours (`CanvasText`) and
   neither is transparent.
9. **Given** an empty state with a heading, a body and one action slotted with `hidden`, **When** it renders, **Then**
   the body is the last present part and ends at the block padding, with no gap below it; **When** `hidden` is removed
   from the action, **Then** the action is shown below the body, separated by the body-to-actions gap, without any
   other change to the slots (FR-023).
10. **Given** an empty state with a `<p slot="eyebrow">Refused</p>`, a slotted `<h1>`, a body paragraph and an
    action, and no visual, **When** it renders, **Then** the eyebrow is the first present part, starting at the block
    padding, above the heading at the eyebrow-to-heading gap; its computed type is FR-025's (`--ocelle-font-sans`,
    `--ocelle-font-size-xs`, `--ocelle-font-weight-medium`, `--ocelle-color-ink-muted`, uppercase); and the
    accessibility tree holds the eyebrow's text, the level 1 heading, the paragraph and the button, in that order, with
    no role added by the element. **Given** `variant="panel"`, **Then** the eyebrow's gaps are the panel's (FR-025).
11. **Given** an empty state with a heading, two `<p>` body paragraphs and an action, **When** it renders, **Then** the
    first paragraph starts at the default-slot area's block start and the last ends at its block end (no user-agent
    paragraph margin), the two paragraphs are separated by `--ocelle-space-2`, and the body-to-actions gap is FR-021's;
    with one body paragraph, it starts and ends at the default-slot area's edges (FR-026). The default-slot area is
    the box that holds the default slot's content, not the `body` part (`::part(body)` is the whole centred column).

---

### User Story 3 - A progress bar that names itself and respects motion (Priority: P3)

A mission run is 7 of 12 tasks done: the developer writes `<ocelle-progress value="7" max="12" label="Tasks
done">`. A screen-reader user hears "Tasks done, progress bar, 58%" or the value text the developer gave. While a
plan is loading with no known end, the bar is indeterminate and its motion stops when the user asks for reduced
motion. In a dense row, the compact size is a thin bar. In light mode the ochre fill is never the only mark: the bar's
track and the fill's edge are drawn so that the filled part is visible to a user who cannot tell ochre from bone.

**Why this priority**: 14 rendered uses (76 text matches, R-11), and the most accessibility behaviour of the three (live value, name without a
cross-root reference, motion, contrast).

**Independent Test**: render the four variants (determinate, indeterminate, compact, labelled). Read the accessibility
tree (role, name, value), change `value` and read it again. Read computed animation under reduced motion, and the
non-text contrast of the fill's mark against the track and the ground in light and dark.

**Acceptance Scenarios**:

1. **Given** `value="7" max="12" label="Tasks done"`, **When** the accessibility tree is read, **Then** the element
   exposes one progressbar named "Tasks done" with value 7, minimum 0 and maximum 12, and no ID reference crosses a
   shadow root.
2. **Given** the same element, **When** `value` changes to 9, **Then** the exposed value is 9 and the fill's inline
   size is 75% of the track at once, with no transition running. No event is emitted (the element has no user intent
   to report).
3. **Given** `value="7" max="12" label="Tasks done" value-text="7 of 12"` and `show-label`, **When** it renders,
   **Then** the visible value text reads "7 of 12", and the accessibility tree holds the progressbar named "Tasks
   done" with value 7, minimum 0 and maximum 12. While the bar is indeterminate the visible value text is absent, and
   when the value is clamped it is kept as given. The value text's exposure to assistive technology is not verified by
   the library's tests, since no read a test can make in Chromium exposes it; the README says so (operator decision
   on the phase 3 spike, (a)).
4. **Given** no `value` attribute, **When** it renders, **Then** the bar is indeterminate: the progressbar has a name
   and no current value, and a moving mark shows activity (for the bounded time FR-033 states).
5. **Given** the indeterminate bar and `prefers-reduced-motion: reduce`, **When** it renders, **Then** no animation
   or transition runs on it, and a still mark (FR-033) still shows that work is going on.
6. **Given** a `value` below 0, above `max`, not a number, or a `max` of 0 or less, **When** it renders, **Then** the
   element follows FR-032: the shown and exposed values are clamped or the bar falls back as stated, and nothing throws.
7. **Given** light theme, **When** the bar renders on each main ground (determinate, indeterminate and the
   reduced-motion still mark), **Then** the filled part carries an `--ocelle-color-accent-strong` mark and its boundary
   meets 3:1 non-text contrast against the track and against the ground (FR-036). This holds with or without visible
   text: the ochre fill is never the only mark (constitution II).
8. **Given** forced colours, **When** it renders, **Then** the track's outline and the filled part are both visible
   in system colours.
9. **Given** `size="compact"`, **When** it renders, **Then** the bar's block size is the compact size FR-034 names,
   and the label, if shown, is beside or above the bar as FR-035 states; with a determinate value and `value-text`,
   the compact row holds the label at its inline start, then the bar, and the value text at its inline end (FR-035).
10. **Given** the labelled variant (`label` and `show-label`), **When** it renders, **Then** the visible label text is the
    progressbar's accessible name. A host `aria-label` overrides it, as in the library's Host ARIA rule. **Given** also a
    determinate value and `value-text` at the default size, **Then** the label row above the bar holds the label at its
    inline start and the value text at its inline end, the value text's inline end aligned with the track's (mirrored
    under `dir="rtl"`) (FR-035).
11. **Given** a bar with neither `label` nor a host `aria-label`, **When** the accessibility tree is read, **Then**
    the progressbar has no name: the element does not invent one. The README and the manifest description of `label`
    say a name is required. This state is proven by a browser test only and has no story (FR-050), since axe's
    `aria-progressbar-name` rule fails it by design.
12. **Given** the indeterminate bar without reduced motion, **When** it has been shown for 5 seconds, **Then** its
    motion has ended and the still mark (FR-033) shows that work is going on: the moving mark ran for less than 5 s in
    total.
13. **Given** a bar on an inset, accent-low, hover-bg or state ground with `ground="tinted"` (FR-036), **When** it
    renders, **Then** the track's boundary is drawn in `--ocelle-color-accent-strong`; without `ground`, on the other
    main grounds, it is drawn in `--ocelle-color-control-border`. Either meets 3:1 against its ground.
14. **Given** an indeterminate bar that is replaced by a new indeterminate bar 2 s after the first was shown (an htmx
    poll swapping the region), without reduced motion, **When** 5 s have passed since the first bar was shown, **Then**
    no animation runs on the page's bars and the still mark shows: the replacement continued the one loading
    episode, whose moving mark ran for less than 5 s in total (FR-033).
15. **Given** an indeterminate bar whose sweep has ended, and no other indeterminate bar on the page, **When** it is
    removed and, after at least one frame, a new indeterminate bar is shown (a later operation in a single-page shell),
    without reduced motion, **Then** the new bar's mark moves (a new loading episode), and its motion still ends in
    less than 5 s (FR-033).

---

### Edge Cases

- **Facts with no pairs.** The element renders no grid rows and exposes an empty description list, or nothing, as
  FR-010 states. It does not throw.
- **Facts given a label without a value, or a value without a label.** FR-003 states the rule: a missing half
  renders an empty box in its column and is exposed as an empty term or an empty definition (US1 scenarios 7 and 10).
- **`ocelle-fact` outside `ocelle-facts`.** It renders its label above its value as plain text in the facts type
  (FR-006) and exposes both as plain text, with no term or definition role, so no stray term or definition reaches
  the accessibility tree. It does not throw.
- **A child of `ocelle-facts` that is not an `ocelle-fact`** (text, a raw `<dt>`, a `<div>`). It is not rendered and
  not exposed; whitespace between pairs is ignored. Nothing throws. The README says only `ocelle-fact` children are
  allowed.
- **Facts inside a shrink-to-fit host** (a `<dialog>`, a popover, a float, a flex item, an `auto` track of a
  consumer's CSS grid, a table cell). The automatic layout switch is decided on the element's own inline size as laid out in two columns (FR-005),
  never on its stacked size, and re-decided on every change the element observes (its own resize, a threshold change,
  a content change, a window resize), so for those changes the same content in the same space gives the same layout
  whatever happened before (a narrow window widened, a label or value changed). A change of the offered space the
  element does not observe (the plan names them, for example a neighbour of a CSS grid `auto` track removed) may leave the earlier
  layout; there the consumer sets `layout` or gives the element an inline size (FR-009). In such a host the two-column
  size is the content's two-column max-content, capped by the space the host offers, so a sheet with short content
  stacks even in a wide dialog; the consumer sets `layout` (FR-013) or gives the element an inline size. The element's inline size there is the one FR-009 states: never 0,
  and at least its widest label's or value's max-content inline size, capped by the space the host offers.
- **A hidden fact.** An `ocelle-fact` with `hidden` or `aria-hidden="true"` is not a pair: no row, no term, no
  definition, until the attribute is removed. `lang` and `dir` on a fact apply to its label as well as its value
  (FR-003).
- **Facts before the elements are defined.** See FR-012.
- **Facts at 200% zoom and 320 px.** One column, no horizontal scroll, no cut text (WCAG 1.4.10), for content that
  wraps between words or carries the wrap policy (FR-009).
- **Facts in a consumer's CSS grid.** A sheet that is the item of a `1fr` track of the consumer's CSS grid has the track's automatic minimum, its
  min-content, so a long value can widen the track. The consumer sets `min-inline-size: 0` on the `ocelle-facts` host
  (host styles are the consumer's); the README says so (operator decision IQ-02 (a)).
- **Restyled columns.** A consumer rule on `ocelle-facts::part(list)` that sets `grid-template-columns` beats the
  element's own rules in every layout and so breaks the automatic switch; the README says not to restyle the list's
  columns (operator decision IQ-01 (a)).
- **Grid layout with few or many facts** (`layout="grid"`, FR-014). One, three or eight pairs keep the column count
  the sheet's inline size gives; the cells keep equal inline sizes and fill rows from the inline start, so a row may
  end with empty columns. Nothing is stretched to fill them. In a shrink-to-fit host the sheet is four tracks wide,
  each as wide as its widest cell, even with one or two pairs; the README tells consumers to give a grid sheet there
  an inline size (FR-014, operator decision "Grid limits").
- **Grid layout with long labels or values.** A long label wraps between words inside its cell. A long unbroken value
  breaks inside its cell with `wrap="anywhere"` (FR-007); without the policy it wraps between words only, as in the
  other layouts (operator decision IQ-04 (b)), so an unbroken word wider than its cell overflows the cell and can
  widen the page's scrollable area, which FR-009's qualified rule allows; the README tells consumers to set the
  policy on machine values in every layout (operator decision "Grid limits").
  With the policy, no cell overlaps another and the page does not scroll sideways at 320 px or 200% zoom.
- **Grid layout right-to-left.** Cells fill each row from the inline start (the right under `dir="rtl"`); the gaps
  are logical and need no mirroring.
- **Grid layout at 200% zoom and 320 px.** At a 640 px viewport a block container gives two columns; at 320 px, one;
  no horizontal scroll, no cut text (WCAG 1.4.10).
- **Values cut short.** The element never truncates a value: there is no ellipsis policy. A consumer that ended a long
  word in an ellipsis sets `wrap="anywhere"` and shows the full value (operator decision IQ-04 (b), #280's non-goal).
- **Very long label.** Labels wrap between words. The label column is sized by FR-005's rule (its widest label, up
  to a cap), so a long label wraps inside the cap and never takes the value column's space beyond it.
- **Long empty-state heading or body at 320 px.** Heading and body wrap between words inside the element; nothing
  overflows the element or the page horizontally, and no text is cut.
- **Long progress label beside a compact bar at 320 px.** The label wraps between words; the bar keeps a visible
  inline size (the plan names its minimum from tokens); nothing overflows the element or the page horizontally.
- **The indeterminate mark at the track's ends.** The moving mark is clipped by the track: it is never painted outside
  it and never makes the element or the page scroll horizontally.
- **Empty-state with a slotted heading of a different element** (for example a `<p>` styled as a heading). The
  element styles the slot's content and does not change its role. The consumer owns the heading semantics.
- **Empty-state with only actions.** Allowed. The actions keep their own names.
- **Empty-state with an eyebrow and no heading.** Allowed: the eyebrow is a present part like any other, and the gap
  below it is the one FR-025 names for the next present part. The eyebrow is the consumer's text and has no heading
  role; the README says to keep it a short line (a `<p>`), not a heading.
- **Empty-state body with inline content.** The default-slot area (FR-026) lays out each assigned element, and each run of assigned
  text, as its own block, separated by `--ocelle-space-2` (FR-026). Text meant to flow as one paragraph with a link or
  an identifier span inside it goes in one element (a `<p>`); the README says so. A page rule that sets margins on the
  slotted body content wins over the element's reset, as for the heading (the consumer owns its content).
- **A focusable loading heading.** A screen that moves focus to the loading block slots its own `<h2 tabindex="-1">`
  in the `heading` slot and the bar in `visual`, and focuses the heading. A `role` or `tabindex` on the
  `ocelle-progress` host would replace or alter the progressbar; the README warns against both (operator decision
  IQ-11 (b)).
- **Empty-state with hidden slotted content.** A slotted element with `hidden`, or only whitespace, makes its part
  absent (no space, no gap); removing `hidden` brings the part back (FR-023). Content hidden by the consumer's own
  class or style rule is not observed; the README says to use `hidden` or remove the node.
- **Progress `value` greater than `max`.** Clamped to `max`, see FR-032.
- **Text inside the progress element** (a "7/12" fallback). The element has no slot: such text shows only before
  upgrade and, after it, is neither shown nor exposed in the accessibility tree; the bar keeps its own name and value
  (FR-039, operator decision IQ-15 (b)).
- **Progress named by a nearby heading.** The consumer passes the heading's text as `label`; no ID reference is used
  (FR-030, operator decision IQ-10 (a)).
- **Progress inline in a row.** The host is a block (`display: block`). A consumer that places a bar inside a line of
  text sets the host's `display` (for example `inline-block`) and inline size from outside; the README says so
  (operator decision IQ-12 (a)).
- **Progress `max` absent.** It defaults to 100.
- **Progress inside an `ocelle-empty-state` panel that is removed.** Nothing keeps running: the indeterminate motion
  is a CSS animation that ends with the node.
- **Progress replaced or re-shown while loading** (an htmx poll swapping the region in one task, a bar re-shown from
  `display: none`). The sweep belongs to the loading episode, not to the node: a new or re-shown bar continues the
  episode's one sweep, and once that has ended it shows the still mark at once (FR-033). The episode ends when no
  indeterminate bar is connected at a frame boundary; a later loading region after that, on the same page or in a
  single-page shell, gets a sweep of its own. A bar removed and re-inserted with a frame or more between (a Svelte
  `{#if}` that flaps) starts a new episode; the README says to keep the node across one continuous wait.
- **Rapid value changes.** The exposed value follows the property. The element does not throttle or animate the
  value number, and the fill has no width transition: its inline size jumps to each new value (operator decision
  PLAN-FRESH-3-003 (b)).
- **Right-to-left.** The progress fill grows from the inline start (right under `dir="rtl"`), and the indeterminate
  mark moves from the inline start to the inline end. The facts columns mirror, and grid cells fill each row from the
  inline start (FR-014).
- **Two copies of the package on a page.** As the library's existing rule: the first definition wins.

## Requirements *(mandatory)*

### Common to the four elements

`ocelle-fact` is one of the four elements wherever this section and the Evidence section say "each element", with
the exceptions FR-050 and FR-054 name.

- **FR-001**: Each element MUST follow the README's § Element conventions: its own module `src/<tag>.ts` with one
  `define` call, `static properties` with `declare` fields, a `@tagname` JSDoc tag, a description and `@default` for
  every public property, one `static styles` built only from `--ocelle-*` tokens, `:host([hidden]) { display: none; }`,
  variant rules inside `@media not (forced-colors: active)`, an entry in the committed `custom-elements.json`, an export
  from `src/index.ts`, and a README section.
- **FR-002**: An element MUST NOT require or document a `class` attribute for its look. Every variant is a property or
  attribute (spec-kitty-design#523). No `sk-` name and no monospace family MAY appear in source, styles, stories or
  build output (the `prefix` gate).

### `ocelle-facts` (P1)

- **FR-003**: `ocelle-facts` MUST take its pairs from the consumer as light-DOM content, in source order, with one
  label and one value per pair. Each pair is an `ocelle-fact` child element (operator decision Q1): `<ocelle-fact label="Owner">value</ocelle-fact>`,
  with the label from its `label` property and the value as its light-DOM content, which can hold inline markup (a
  link, an identifier span). `ocelle-fact` is a fourth element on the public surface, under the same conventions
  (FR-001), and is meaningful only inside `ocelle-facts` (outside it, and for children of `ocelle-facts` that are not
  `ocelle-fact`, see Edge Cases). Whatever the structure, the content is the consumer's text: the element never
  copies or rewrites it. A pair with no `label` (absent or empty) renders an empty label box and exposes an empty
  term; a pair with no value content renders an empty value box and exposes an empty definition. Either way the
  pair keeps its row. An `ocelle-fact` with `hidden` or `aria-hidden="true"` is not a pair (no row, no term, no
  definition), and a fact's `lang` and `dir` apply to its label (the library's Host ARIA rule; WCAG 3.1.2).
- **FR-004**: The accessibility tree MUST expose a description list whose terms are the labels and whose definitions
  are the values, each definition after its term, in source order, measured in Chromium, with no serious or critical
  axe finding (including `definition-list` and `dlitem`). No ID reference MAY cross a shadow root to build this
  association. Operator decision (SPEC-1-04, "D"): the plan's research measures whether this structure can be had
  cleanly with `ocelle-fact` children (Q1 b) and the consumer's content unchanged (FR-003), and reports the result to
  the operator before tasks are generated. The operator then confirms this requirement or replaces it; tasks are not
  generated against FR-004 until then. Confirmed as written by the operator at the plan gate ("Confirm FR-004",
  2026-11-13). It holds in every `layout`, `grid` included (FR-014): there each pair is one item of the list, and the
  plan's phase 1 spike measures that structure against this requirement and stops for the operator if it fails.
- **FR-005**: Unless `layout` is set (FR-013), the element MUST lay its pairs out in the two-column layout (labels in
  the first column, values in the second) while its own inline size, as laid out in two columns (not the viewport's, and never
  its stacked size), is at least a threshold, and as one column (each value directly below its label) below it. In a
  block container that size is the container's inline size; in a shrink-to-fit host it is the content's two-column
  max-content capped by the space the host offers. The measure never reads the stacked layout, and the element MUST
  re-decide on every change it observes: its own resize, a change of the threshold (its hook or the root font size),
  a change of its pairs or of their content (value text included) and a window resize, each without a resize of the
  element. For those changes the layout depends only on the content and the space, never on the element's previous
  state (FR-009 states the narrowing for other changes; operator decision PLAN-FRESH-3-001 (c)). The threshold is a token-derived length set in the plan and
  MUST be greater than 320 px. Operator decision PLAN-FRESH-2-001 (c).
  In two columns, the label column takes the max-content inline size of the widest label, capped at a share of the
  element's inline size that the plan sets (no more than half); longer labels wrap inside the cap. The value column
  takes the rest, and its content never widens it.
- **FR-006**: Values MUST use `--ocelle-font-sans`, `--ocelle-font-size-fact` (outside a compact region, FR-008) and
  `--ocelle-figures`, in `--ocelle-color-ink`. Labels MUST use `--ocelle-font-sans` at a smaller step in
  `--ocelle-color-ink-muted` (or `-soft`, as the plan settles against the tokens' contrast declarations), so labels
  and values are distinct by more than colour (size or weight).
- **FR-007**: A value MUST be able to take 003's identifier wrap policy (`overflow-wrap: anywhere`) in a way the
  manifest documents: a property or attribute on the pair or value, or a part the consumer styles. A value holding
  `data-ocelle-wrap="anywhere"` (003's base-style hook) MUST keep that behaviour inside the element. Without the
  policy, values wrap between words. The element never truncates a value (no ellipsis); the README says so, and maps
  both a "break where the word cannot fit" rule and a "break anywhere" rule to `wrap="anywhere"` (operator decision
  IQ-04 (b); #280's non-goal "truncation that hides values").
- **FR-008**: The element MUST offer a default and a `compact` density (`density="compact"`). Compact reduces the row
  gap to a smaller `--ocelle-space-*` step and changes no type. Inside a `data-ocelle-density="compact"` region
  (003's compact scale), values MUST take the region's font size and line height (`--ocelle-font-size-sm` at
  `--ocelle-line-height-compact`), and a `regular` region nested in it returns them to FR-006's. Source:
  spec-kitty-design #531 (the compact screen scale for fact values), read by the plan's research (R-03). Operator
  decision PLAN-CORRECTNESS-1-002 (b).
- **FR-009**: In a shrink-to-fit host (a `<dialog>`, a popover, a float, a default flex item), an element with at
  least one pair MUST take an inline size that is never 0 and is at least the smaller of the inline space the host
  offers and the max-content inline size of its widest label or value. Its layout there MUST NOT depend on its
  history for any change FR-005 lists: the same content in the same space gives the same layout. A change of the
  offered space that the element does not observe (no resize of the element and no window resize: the plan's research
  names these cases from measurement, for example a neighbour of a consumer's CSS grid `auto` track removed) is outside that guarantee: the
  README MUST name those cases and tell the consumer to set `layout` or give the element an inline size there, and
  the tests assert that remedy for them instead of history independence (operator decision PLAN-FRESH-3-001 (c)). In
  a block container no case is excluded. Because the automatic switch reads the
  element's own two-column size, a sheet whose content is narrower than the threshold stacks there even where the
  host has room; `layout` (FR-013) lets the consumer choose, and the README says so (operator decision
  PLAN-FRESH-2-001 (c)). The element MUST NOT cause horizontal scrolling of
  the page at 320 px CSS width or at 200% zoom for content that wraps between words or carries the wrap policy
  (FR-007); an unbroken value without the policy can overflow its value box or cell, and the README MUST tell
  consumers to set the policy on machine values (operator decision "Grid limits: Accept, README states",
  2026-11-14). For the plan's research: a size container query is one way to switch
  on the element's own inline size, but it applies inline-size containment, which collapses a box to 0 px in
  shrink-to-fit hosts (`knowledge/speckit-flows/findings/frontend-missions.md` § Layout; 003 A11Y-SECURITY-1-001,
  FRESH-2-001). The research MUST measure the chosen mechanism in each of those hosts against this requirement.
- **FR-010**: With no pairs, the element MUST render nothing visible and throw nothing. Whether it exposes an empty
  list is set in the plan and tested.
- **FR-011**: The element emits no event. It is not interactive and adds no tab stop. Focusable content a consumer
  puts in a value (a link) keeps its own tab stop and focus ring.
- **FR-012**: Before the elements are defined (a deferred module, a slow network, a script error), `@ocelle/styles`
  MUST show each `ocelle-fact` child of an undefined `ocelle-facts` on its own line, so a server-rendered page does
  not run the values together. Labels are attributes and appear only after upgrade; the README MUST say so. Operator
  decision PLAN-FRESH-1-009 (a). An `ocelle-fact` with `hidden` stays hidden before upgrade as after it (FR-003).
- **FR-013**: `ocelle-facts` MUST offer a `layout` property (`"columns" | "stacked" | "grid"`, unset by default).
  `columns` keeps two columns and `stacked` keeps one column at any size; `grid` gives FR-014's grouped cells; unset,
  or any other value, gives FR-005's automatic switch. Every set value keeps FR-009's no-horizontal-scroll rule, as
  FR-009 qualifies it (content that wraps between words or carries the wrap policy; an unbroken value without the
  policy can overflow its value box or cell), and FR-009's lower bound in shrink-to-fit hosts. Operator decisions
  PLAN-FRESH-2-001 (c), IQ-05 (b) and "Grid limits".
- **FR-014**: With `layout="grid"` (spec-kitty-design #280), each pair MUST be one cell holding its label directly
  above its value, and the cells MUST sit in a grid of four, two or one columns of equal inline size, filled row by
  row from the inline start in source order, with no cell spanning more than one column and no empty cell added. The
  column count MUST be decided on the sheet's own inline size as laid out in four columns (never its two- or
  one-column size), with no size containment, under the same triggers, the same history independence and the same
  narrowing as FR-005 and FR-009: four columns while that size is at least twice the threshold of FR-005, two
  columns while it is at least the threshold, one column below it. The description-list semantics of FR-004 MUST hold
  (one list, each term followed by its definition, in source order, with no serious or critical axe finding,
  `definition-list` and `dlitem` included). A long label MUST wrap between words inside its cell; a value with the
  wrap policy (FR-007) MUST break inside its cell, and an unbroken value without it can overflow its cell, under
  FR-009's qualified no-horizontal-scroll rule; spacing between cells and between a label and its value MUST come
  from `--ocelle-space-*` tokens and logical properties; `density="compact"` tightens the gap between rows of cells as
  it does between pairs (FR-008); the sheet paints no ground, divider or border (the surface is the container's, as
  #280 asks). In a shrink-to-fit host a grid sheet is four tracks wide, each as wide as its widest cell, even with
  one or two pairs, unless the consumer gives it an inline size; the README MUST say so (operator decision "Grid
  limits"). Operator decision IQ-05 (b).

### `ocelle-empty-state` (P2)

- **FR-020**: `ocelle-empty-state` MUST offer slots for a heading (`heading`), a body (default slot), actions
  (`actions`), an optional visual above the heading (`visual`, for an icon or an `ocelle-progress`) and an optional
  eyebrow between the visual and the heading (`eyebrow`, a short line of text, FR-025; operator decision IQ-08 (c)). The heading
  level is the consumer's: the consumer slots its own heading element, and the element has no `level` property and
  never adds a heading role (the same rule as 011's page header).
- **FR-021**: The default variant MUST lay out visual, eyebrow, heading, body and actions in one centred column with
  token gaps and block padding from the `--ocelle-space-*` scale: a visual-to-heading gap, a heading-to-body gap and a
  body-to-actions gap (the eyebrow's gaps are FR-025's). The heading is at `--ocelle-font-weight-strong` and the body in `--ocelle-color-ink-muted`,
  with each value (padding, each gap, weight) named in the plan. Neither variant paints a ground (background) of its
  own: it sits on its container's ground. An `ocelle-progress` in `visual` spans the column, up to the reading measure
  (`--ocelle-measure-reading`), in both variants (operator decision PLAN-FRESH-1-005 (a)).
- **FR-022**: `variant="panel"` MUST use a larger block padding and larger gaps (each of FR-021's three, and each of
  FR-025's) than the default variant, and a
  lighter heading weight than the default (#510; operator decision IQ-06 (a): #510's text, not the E-13 code). Its
  values come from the existing `--ocelle-space-*` and `--ocelle-font-weight-*` tokens only, with no new panel
  token (operator decision Q2); the plan names the steps.
- **FR-023**: An empty slot MUST take no space and add no gap, wherever it is: the first present part starts at the
  block padding, the last ends at it, and two present parts are separated by the gap the plan names for that pair
  (every pair that can become adjacent has one, in both variants). A slot is empty when nothing assigned to it
  renders: no assigned element that generates a box and no non-whitespace text. A slotted element with `hidden` is
  therefore empty content, and adding or removing `hidden` on slotted content, or changing slotted text, updates the
  layout. Operator decision PLAN-FRESH-2-007 (a).
- **FR-024**: The element MUST NOT add a landmark, live region, heading or tab stop of its own. It emits no event.
- **FR-025**: The `eyebrow` slot's content MUST be laid out between the visual and the heading, in
  `--ocelle-font-sans` at `--ocelle-font-size-xs`, `--ocelle-font-weight-medium`, `--ocelle-color-ink-muted`, in upper
  case, from existing tokens only (011's or 012's eyebrow tokens do not exist yet; none is added here, FR-040). It is a
  part like the others for FR-023: absent when nothing assigned to it renders, and separated from each part that can
  follow it by a gap the plan names from the `--ocelle-space-*` scale, in both variants, the panel's gaps larger. The
  element adds no role to it. Operator decision IQ-08 (c).
- **FR-026**: The element MUST set the block margins of the elements assigned to the default slot to 0 and separate
  the body's children by `--ocelle-space-2`, in both variants, so the body's first line starts at the block start of
  the default-slot area (the box that holds the default slot's content; not the `body` part, which is the whole
  centred column with every slot in it) and its last line ends at that area's block end, one paragraph or several.
  Operator decision IQ-09 (b).

### `ocelle-progress` (P3)

- **FR-030**: `ocelle-progress` MUST expose exactly one progressbar to assistive technology, with its minimum
  (0), maximum (`max`, default 100) and current value (`value`), and its accessible name from `label` or a host
  `aria-label` (the library's Host ARIA rule), without any ID reference crossing a shadow root. Which platform
  basis carries this (a native `<progress>` in the shadow root, or `role="progressbar"` on an inner node or through
  `ElementInternals`) is settled in the plan's research by measuring the Chromium accessibility tree.
- **FR-031**: A `value-text` property MUST set the exposed value text. Without it, the exposed value text is the
  platform's default for the value. The library's tests prove the wiring through the visible `value-text` part
  (US3-3), not the exposure, which no test read in Chromium reaches; the README MUST say that the library's tests do
  not verify the value text's exposure to assistive technology (operator decision on the phase 3 spike, (a)).
- **FR-032**: Without a `value`, the bar MUST be indeterminate: no current value is exposed. A `value` that is not a
  finite number is treated as absent, and so is an empty or whitespace-only `value` attribute (`value=""` is
  indeterminate, not 0). Removing the `value` attribute, or setting the property to `null` or `undefined`, after a
  value was set makes the bar indeterminate again. A `value` below 0 is shown and exposed as 0, and above `max` as `max`. A `max`
  that is not a finite number above 0 is treated as 100. Nothing throws.
- **FR-033**: The indeterminate bar MUST show activity with a moving mark that uses token durations and easing. The
  motion MUST end by itself in less than 5 s in total (WCAG 2.2.2: the bar can be shown for minutes beside an
  interactive page) and then show the still mark, with nothing running. The total is per loading episode, not per
  node and not per page. A loading episode starts when an indeterminate bar is connected while no episode is open,
  and ends when no indeterminate bar is connected to the page at a frame boundary. Within one episode a bar
  inserted, replaced, re-shown or made indeterminate again continues the episode's one sweep, which starts with the
  episode, and after that sweep ends shows the still mark at once (operator decision PLAN-FRESH-2-005 (a), amended
  by PLAN-FRESH-3-004 (a)). The next indeterminate bar after an episode ends starts a new episode with its own sweep,
  under the same bound, on the same page (operator decision PLAN-FRESH-3-004 (a)). Under `prefers-reduced-motion: reduce` it MUST
  run no animation or transition and show the still mark at once. The still mark still reads as "in progress" (a
  partial or patterned fill, set in the plan). Operator decision PLAN-A11Y-SECURITY-1-001 (a). The loop period MAY be
  a new motion token under FR-040 if `--ocelle-motion-fast` and `--ocelle-motion-base` are too short for it; such a
  token MUST also resolve so that nothing runs under reduced motion. The README MUST say that the determinate bar is
  for work with a known amount, the indeterminate bar is for loading a region (or running work) with no known end, and
  #7's `ocelle-status-indicator` is the marker for a state (for example a row that is "running").
- **FR-034**: The element MUST offer a default and a `compact` size (`size="compact"`) with block sizes from tokens,
  the compact one thinner.
- **FR-035**: With `label` set and the boolean attribute `show-label` present (the labelled variant), the label MUST be shown
  as text above the bar (default size) or beside it (compact). A determinate bar with `value-text` MUST show its value
  text in the same row: at the default size the row above the bar holds the label at its inline start and the value
  text at its inline end; in compact the row holds the label, the bar and the value text at the row's inline end
  (operator decision IQ-13 (b)). Visible label and value text use `--ocelle-figures`.
- **FR-036**: The fill MUST be `--ocelle-color-accent` on a track drawn in a token colour. In light mode the filled
  part (the determinate extent, the indeterminate moving mark and the reduced-motion still mark) MUST always also be
  marked by `--ocelle-color-accent-strong` (an edge, an outline or the fill's end), so its boundary meets 3:1 non-text
  contrast against the track and against the ground on every main ground (constitution II and III). Visible text
  (FR-035) may be shown as well, but it does not replace the mark and waives the 3:1 rule for no variant. The
  track's boundary MUST meet 3:1 against the ground on every main ground and state ground: in a token declared at 3:1
  on canvas, sheet, pane, panel, inspector and rail by default, and in `--ocelle-color-accent-strong` with an
  attribute the consumer sets for inset, accent-low, hover-bg and the state grounds (#5 rule 1; operator decision
  PLAN-A11Y-SECURITY-1-002 (a)). The contrast check covers these pairs.
- **FR-037**: In forced colours the track MUST have a visible outline and the fill MUST use a system colour distinct
  from the track.
- **FR-038**: The fill MUST grow from the inline start, mirrored under `dir="rtl"`.
- **FR-039**: The element emits no event and adds no tab stop. It has no slot: content the consumer puts inside it
  (a fallback text) shows only before upgrade and MUST be neither shown nor exposed after it. The README MUST say so,
  and that a `role` or `tabindex` on the host replaces or alters the progressbar, that a bar named by a nearby heading
  takes the heading's text as `label`, that the label is text only (no rich label), and that the host is a block whose
  display and inline size a consumer sets from outside to place it inline (operator decisions IQ-15 (b), IQ-11 (b),
  IQ-10 (a), IQ-14 (a), IQ-12 (a)).

### Tokens

- **FR-040**: A new token MAY be added to `@ocelle/tokens` only where no existing token gives the value (for example
  a progress track colour or block size). Each new token MUST go through the token package's existing validation
  (records, generator, contrast declaration for any foreground colour, and tests) and be listed in the plan with the
  reason no existing token fits.

### Evidence (#7's checklist)

- **FR-050**: Each element MUST have a story per variant and per state in `storybook/stories/<element>.stories.ts`,
  rendered in light and dark. The stories are named in the plan and follow #10's contributor note
  (`specs/006-storybook-workbench` FR-025): open shadow roots, every surface inside the host, a declared hover or
  press state where one exists. Exceptions: `ocelle-fact` has no stories file of its own; its states (with and
  without a label or value, identifier wrap) are stories in `facts.stories.ts`, and its behaviour outside
  `ocelle-facts` is proven by browser tests, with no story. The unnamed progress state (US3 scenario 11) has no story,
  because axe's `aria-progressbar-name` rule fails it by design. The progress named by a host `aria-label` (US3
  scenario 10) has no story, because axe reports a false `aria-prohibited-attr` for a host `aria-label` on an
  ElementInternals bar (research R-05). Each of these three states is proven by browser tests only. They are one
  exception to constitution V, recorded in the plan's Complexity Tracking with scope, rationale and a sunset, and
  approved by the operator at the tasks gate (2026-11-13, "Record exception row").
- **FR-051**: Visual baselines and the `axe` run follow #10, merged on `main` (3828d2f). Each phase that adds stories
  MUST commit their light and dark baselines, produced in #10's pinned container (`storybook/visual/container.json`)
  by its baseline command, and its stories MUST pass #10's `storybook-build`, `visual` and `axe` gates, the `axe` gate
  with no serious or critical finding and no `storybook/a11y-exceptions.json` entry unless the operator approves one.
  The accessibility assertions axe cannot make (the progress name through ElementInternals, FR-030) are proven by this
  mission's own browser tests (accessibility tree in Chromium).
- **FR-052**: Browser tests MUST cover every acceptance scenario, run on the element source (in process) and on the
  built browser build on strict-CSP fixture pages, as the README's § Files and tests describes.
- **FR-053**: Facts MUST have a reflow test at 320 px CSS width (US1 scenario 2 and 3).
- **FR-054**: Each of the four elements, `ocelle-fact` included, MUST have its own manifest entry listing every public
  property, attribute, slot and part, and an empty event list. The `manifest` gate passes. `ocelle-fact` is
  documented in the `ocelle-facts` README section rather than a section of its own.
- **FR-055**: The built output MUST pass the strict-CSP check.
- **FR-056**: The README MUST record, for the follow-on missions, the conventions this mission sets: how pairs or
  items are slotted (FR-003), that a container module imports its item element (operator decision
  PLAN-CORRECTNESS-1-012 (a)), how the wrap policy is exposed (FR-007), and the empty-state heading rule (FR-020).
- **FR-057**: Each package changed gets a changelog entry naming its surface additions: the four added elements and
  their hooks, any added tokens, and the added base-style rules (constitution VII, MINOR).
- **FR-058**: The README MUST map each kitty-mission-ui `.sk-facts`, `.sk-empty-state` and `.sk-progress` variant to
  the element and variant that replaces it (SC-001). The mapping names the roles only and copies no code
  (constitution VI). The variants are those of the inventory the plan's research records (modifiers and states, with
  counts, role names only), supplied by the operator; a variant no element or variant covers goes to the operator.
  The operator's decisions on the inventory's gaps (IQ-01 to IQ-15) set the rows: among them "facts two-col" to
  `layout="columns"` with no track override, "facts term regular" to the consumer's `::part(label)` weight, "facts
  value ellipsis" to `wrap="anywhere"`, the empty-state card, message and ops card to the consumer's own card around
  the element, "empty-state card dashed" to the #509 family, "empty-state refusal" to the `eyebrow` slot, and "progress
  labelled by heading", "progress heading", "progress inline" and "progress fallback text" to the README statements of
  FR-039. The facts section of the README also states FR-005's column tracks are not to be restyled (IQ-01 (a)) and
  that a sheet in a consumer's CSS grid takes `min-inline-size: 0` from the consumer (IQ-02 (a)).

### Key Entities

- **Fact pair** (`ocelle-fact`): one label (short text) and one value (text, an identifier, a number, a date or inline content).
- **Fact sheet** (`ocelle-facts`): its pairs, a density and a layout (automatic, `columns`, `stacked` or `grid`).
- **Empty state**: an optional visual, an optional eyebrow, a consumer heading, an optional body, optional actions; a
  variant.
- **Progress**: a value (optional), a maximum, a value text (optional), a name, a size, label visibility.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The README mapping (FR-058) has, for every `.sk-facts`, `.sk-empty-state` and `.sk-progress` variant
  kitty-mission-ui uses (47 rendered uses in all, recorded in research R-11), a mapping row that names either the
  element and variant that replaces it with no `class` attribute on the element, or the consumer's remedy outside
  the element, or "not this mission" with the operator's decision. Checked in review; the replacement in kitty-mission-ui itself is an outcome not gated here.
- **SC-002**: At 320 px CSS width, every facts story's page scroll width equals the viewport width.
- **SC-003**: Every story of the four elements reports no serious or critical axe finding by #10's `axe` gate, in
  light and dark, in the phase that adds it (the unnamed progress state has no story, FR-050). This mission's own
  browser tests also prove the accessibility-tree assertions of FR-004 and FR-030 and of US1 to US3, which axe does
  not fully check.
- **SC-004**: Every foreground and non-text pair the four elements introduce passes the contrast check in light and
  dark.
- **SC-005**: Under reduced motion, no story of the four elements has a running animation or transition.
- **SC-006**: Every acceptance scenario has at least one test that fails against the code before its phase (the
  red/green check), and mutation testing under #23's rules leaves no surviving mutant in the phase's changed source,
  except mutants the review records as equivalent with the reason.
- **SC-007**: The manifest, strict-CSP, prefix and style-lint gates pass with the four elements added.

## Assumptions

- The two-column threshold for facts and the token values for gaps and paddings are set in the plan from the
  existing scale. The spec fixes only their order (panel larger than default, compact smaller).
- The progress bar's percentage text, when the platform computes it, is the platform's. The element does not format
  numbers.
- 011's eyebrow tokens are not needed here. Facts labels are not eyebrows. The empty state's `eyebrow` slot uses
  existing type tokens (FR-025); a later change to 011's or 012's eyebrow tokens, once they exist, is a baseline
  change made in a pull request that says why.
- #15 is not needed by any of the four elements: none has a scroll region.
- #10 (`specs/006-storybook-workbench`) is merged on `main` (3828d2f) and into this branch; the stories are written
  to its merged contributor note and gates.
- Kitty Desktop's WebKit is not measured, the same as the library's existing Engines note. Only Chromium is.
