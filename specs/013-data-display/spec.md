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
`specs/003-base-styles/sources/spec-kitty-design-issues.md` (research R-03; FR-008 follows #531); #280, #498, #510 and
#523 are still unread.
The plan's research MUST read those six issues (fetched read-only, as for triage) and record anything in them that
changes or adds to a requirement here, in particular #531 for FR-008, #510 for FR-022 and US2, #535 for FR-007 and
#498 for US3.
Spec Kitty's `sk-*` names are kitty-mission-ui roles, not names in this library.

**Consumers** (constitution VI): kitty-mission-ui (Kitty Desktop and Kitty Dashboard) replaces its `.sk-facts` (34
class uses), `.sk-empty-state` (75) and `.sk-progress` (74) class families with these elements. The Ocelle web console
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
  layout does not depend on history (FR-005, FR-009).
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

## Scope

**In scope:** four new custom elements in `@ocelle/elements` (`ocelle-facts` with its child `ocelle-fact`,
`ocelle-empty-state`, `ocelle-progress`). This covers their stories, tests, manifest entries and README sections
(FR-001 and FR-054 say what `ocelle-fact` shares with `ocelle-facts`), any new tokens in `@ocelle/tokens` that these
elements need and that no existing token provides (FR-040), and two `@ocelle/styles` rules the facts element relies
on: the compact region's value scale (FR-008) and the pre-upgrade rule (FR-012).

**Out of scope:**

- the other five elements of #13;
- copying text to the clipboard (constitution I; #14 and the host);
- the eyebrow tokens (added by 011 or 012);
- the visual baselines and the `axe` and `visual` gates themselves. Those are #10's. This mission writes the stories
  #10's gates read and holds to #10's contributor note (`specs/006-storybook-workbench` FR-025). If #10 is on `main`
  before this mission's last phase, that phase commits the baselines. If not, #10's own rebase picks the stories up.
  See FR-051.
- `ocelle-status-indicator` and its "never pulses an empty box" rule (#498 in #7). It is #7's (mission 012).
  `ocelle-progress` is the bar only. Which of the two a consumer uses for "busy" is recorded in this README (FR-033):
  the indeterminate bar for loading a region with no known end, the status indicator for a state.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A label and value sheet without classes (Priority: P1)

A Kitty Desktop screen shows a mission's facts: status, owner, created date, mission id, and a digest or path. The
developer writes an `ocelle-facts` element with its pairs inside it instead of a `<dl class="sk-facts">`. In a wide
column the labels and values sit in a two-column grid. In a narrow column (a 320 px viewport, or a narrow inspector) the
same pairs stack, label above value. A long identifier breaks inside its own value and never widens the grid or makes
the page scroll sideways. A screen-reader user hears each label with its value, as a description list.

**Why this priority**: it replaces 34 class uses and is the first element of the "every class family is an element"
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
   one description list with three terms and three definitions, each definition following its term (FR-004; subject
   to the operator's decision after the plan's measurement).
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

---

### User Story 2 - An empty or loading panel without classes (Priority: P2)

A list screen has no items yet. The developer places an `ocelle-empty-state` with the page's own heading ("No
missions yet"), one sentence of explanation and a button. Inside a card it is a quiet block. In the `panel` variant,
which fills a list or inspector panel, it has the larger vertical rhythm and lighter heading weight of the prototype's
empty and loading panels. The same panel variant with an `ocelle-progress` inside is the loading panel. The page's
heading outline stays the page's: the element never forces a heading level.

**Why this priority**: 75 class uses. It depends on nothing from P1, but its panel variant pairs with P3 for the
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

---

### User Story 3 - A progress bar that names itself and respects motion (Priority: P3)

A mission run is 7 of 12 tasks done: the developer writes `<ocelle-progress value="7" max="12" label="Tasks
done">`. A screen-reader user hears "Tasks done, progress bar, 58%" or the value text the developer gave. While a
plan is loading with no known end, the bar is indeterminate and its motion stops when the user asks for reduced
motion. In a dense row, the compact size is a thin bar. In light mode the ochre fill is never the only mark: the bar's
track and the fill's edge are drawn so that the filled part is visible to a user who cannot tell ochre from bone.

**Why this priority**: 74 class uses, and the most accessibility behaviour of the three (live value, name without a
cross-root reference, motion, contrast).

**Independent Test**: render the four variants (determinate, indeterminate, compact, labelled). Read the accessibility
tree (role, name, value), change `value` and read it again. Read computed animation under reduced motion, and the
non-text contrast of the fill's mark against the track and the ground in light and dark.

**Acceptance Scenarios**:

1. **Given** `value="7" max="12" label="Tasks done"`, **When** the accessibility tree is read, **Then** the element
   exposes one progressbar named "Tasks done" with value 7, minimum 0 and maximum 12, and no ID reference crosses a
   shadow root.
2. **Given** the same element, **When** `value` changes to 9, **Then** the exposed value is 9 and the fill's inline
   size is 75% of the track. No event is emitted (the element has no user intent to report).
3. **Given** a `value-text` of "7 of 12", **When** the tree is read, **Then** the exposed value text is "7 of 12".
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
   and the label, if shown, is beside or above the bar as FR-035 states.
10. **Given** the labelled variant (`label` and `show-label`), **When** it renders, **Then** the visible label text is the
    progressbar's accessible name. A host `aria-label` overrides it, as in the library's Host ARIA rule.
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
- **Facts inside a shrink-to-fit host** (a `<dialog>`, a popover, a float, a default flex item). The layout switch is
  decided on the inline space available to the element (FR-005), not on its resolved size, so the same content in
  the same space gives the same layout whatever happened before (a narrow window widened, a dialog reopened). The
  element's inline size there is the one FR-009 states: never 0, and at least its widest label's or value's
  max-content inline size, capped by the available inline space.
- **A hidden fact.** An `ocelle-fact` with `hidden` or `aria-hidden="true"` is not a pair: no row, no term, no
  definition, until the attribute is removed. `lang` and `dir` on a fact apply to its label as well as its value
  (FR-003).
- **Facts before the elements are defined.** See FR-012.
- **Facts at 200% zoom and 320 px.** One column, no horizontal scroll, no cut text (WCAG 1.4.10).
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
- **Progress `value` greater than `max`.** Clamped to `max`, see FR-032.
- **Progress `max` absent.** It defaults to 100.
- **Progress inside an `ocelle-empty-state` panel that is removed.** Nothing keeps running: the indeterminate motion
  is a CSS animation that ends with the node.
- **Rapid value changes.** The exposed value follows the property. The element does not throttle or animate the
  value number. The fill's width transition, if any, uses `--ocelle-motion-base` and is 0 ms under reduced motion.
- **Right-to-left.** The progress fill grows from the inline start (right under `dir="rtl"`), and the indeterminate
  mark moves from the inline start to the inline end. The facts columns mirror.
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
  generated against FR-004 until then.
- **FR-005**: The element MUST lay its pairs out as a two-column grid (labels in the first, values in the second)
  while the inline space available to it (not the viewport's) is at least a threshold, and as one column (each value
  directly below its label) below it. In a block container the available space is the element's own inline size; in
  a shrink-to-fit host it is the space the host offers, not the element's resolved size, so the layout depends only on
  the content and the space, never on the element's previous state. The threshold is a token-derived length set in
  the plan and MUST be greater than 320 px.
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
  policy, values wrap between words.
- **FR-008**: The element MUST offer a default and a `compact` density (`density="compact"`). Compact reduces the row
  gap to a smaller `--ocelle-space-*` step and changes no type. Inside a `data-ocelle-density="compact"` region
  (003's compact scale), values MUST take the region's font size and line height (`--ocelle-font-size-sm` at
  `--ocelle-line-height-compact`), and a `regular` region nested in it returns them to FR-006's. Source:
  spec-kitty-design #531 (the compact screen scale for fact values), read by the plan's research (R-03). Operator
  decision PLAN-CORRECTNESS-1-002 (b).
- **FR-009**: In a shrink-to-fit host (a `<dialog>`, a popover, a float, a default flex item), an element with at
  least one pair MUST take an inline size that is never 0 and is at least the smaller of the available inline space
  and the max-content inline size of its widest label or value. Its layout there MUST NOT depend on its history: the
  same content in the same space gives the same layout (FR-005). The element MUST NOT cause horizontal scrolling of
  the page at 320 px CSS width or at 200% zoom. For the plan's research: a size container query is one way to switch
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
  decision PLAN-FRESH-1-009 (a).

### `ocelle-empty-state` (P2)

- **FR-020**: `ocelle-empty-state` MUST offer slots for a heading (`heading`), a body (default slot), actions
  (`actions`) and an optional visual above the heading (`visual`, for an icon or an `ocelle-progress`). The heading
  level is the consumer's: the consumer slots its own heading element, and the element has no `level` property and
  never adds a heading role (the same rule as 011's page header).
- **FR-021**: The default variant MUST lay out visual, heading, body and actions in one centred column with token gaps
  and block padding from the `--ocelle-space-*` scale: a visual-to-heading gap, a heading-to-body gap and a
  body-to-actions gap. The heading is at `--ocelle-font-weight-strong` and the body in `--ocelle-color-ink-muted`,
  with each value (padding, each gap, weight) named in the plan. Neither variant paints a ground (background) of its
  own: it sits on its container's ground. An `ocelle-progress` in `visual` spans the column, up to the reading measure
  (`--ocelle-measure-reading`), in both variants (operator decision PLAN-FRESH-1-005 (a)).
- **FR-022**: `variant="panel"` MUST use a larger block padding and larger gaps (each of FR-021's three) than the
  default variant, and a
  lighter heading weight than the default (#510). Its values come from the existing `--ocelle-space-*` and `--ocelle-font-weight-*` tokens only, with no new panel
  token (operator decision Q2); the plan names the steps.
- **FR-023**: An empty slot MUST take no space and add no gap, wherever it is: the first present part starts at the
  block padding, the last ends at it, and two present parts are separated by the gap the plan names for that pair
  (every pair that can become adjacent has one, in both variants).
- **FR-024**: The element MUST NOT add a landmark, live region, heading or tab stop of its own. It emits no event.

### `ocelle-progress` (P3)

- **FR-030**: `ocelle-progress` MUST expose exactly one progressbar to assistive technology, with its minimum
  (0), maximum (`max`, default 100) and current value (`value`), and its accessible name from `label` or a host
  `aria-label` (the library's Host ARIA rule), without any ID reference crossing a shadow root. Which platform
  basis carries this (a native `<progress>` in the shadow root, or `role="progressbar"` on an inner node or through
  `ElementInternals`) is settled in the plan's research by measuring the Chromium accessibility tree.
- **FR-031**: A `value-text` property MUST set the exposed value text. Without it, the exposed value text is the
  platform's default for the value.
- **FR-032**: Without a `value`, the bar MUST be indeterminate: no current value is exposed. A `value` that is not a
  finite number is treated as absent, and so is an empty or whitespace-only `value` attribute (`value=""` is
  indeterminate, not 0). Removing the `value` attribute, or setting the property to `null` or `undefined`, after a
  value was set makes the bar indeterminate again. A `value` below 0 is shown and exposed as 0, and above `max` as `max`. A `max`
  that is not a finite number above 0 is treated as 100. Nothing throws.
- **FR-033**: The indeterminate bar MUST show activity with a moving mark that uses token durations and easing. The
  motion MUST end by itself in less than 5 s in total (WCAG 2.2.2: the bar can be shown for minutes beside an
  interactive page) and then show the still mark, with nothing running. Under `prefers-reduced-motion: reduce` it MUST
  run no animation or transition and show the still mark at once. The still mark still reads as "in progress" (a
  partial or patterned fill, set in the plan). Operator decision PLAN-A11Y-SECURITY-1-001 (a). The loop period MAY be
  a new motion token under FR-040 if `--ocelle-motion-fast` and `--ocelle-motion-base` are too short for it; such a
  token MUST also resolve so that nothing runs under reduced motion. The README MUST say that the determinate bar is
  for work with a known amount, the indeterminate bar is for loading a region (or running work) with no known end, and
  #7's `ocelle-status-indicator` is the marker for a state (for example a row that is "running").
- **FR-034**: The element MUST offer a default and a `compact` size (`size="compact"`) with block sizes from tokens,
  the compact one thinner.
- **FR-035**: With `label` set and the boolean attribute `show-label` present (the labelled variant), the label MUST be shown
  as text above the bar (default size) or beside it (compact). A determinate bar MAY show its value text beside the
  label. Visible label and value text use `--ocelle-figures`.
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
- **FR-039**: The element emits no event and adds no tab stop.

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
  without a label or value, identifier wrap) are stories in `ocelle-facts.stories.ts`, and its behaviour outside
  `ocelle-facts` is proven by browser tests. The unnamed progress state (US3 scenario 11) has no story, because axe's
  `aria-progressbar-name` rule fails it by design; it is proven by a browser test only, and the plan records this
  exclusion.
- **FR-051**: Visual baselines and the `axe` run follow #10. If #10 is on `main` when this mission's last phase runs,
  that phase commits the baselines produced in #10's pinned container and the stories pass #10's `axe` gate with no
  serious or critical finding. If #10 is not on `main` by then, the accessibility assertions of FR-004, FR-030 and
  US1–US3 are proven by this mission's own browser tests (accessibility tree in Chromium), and the baselines are left
  to #10's rebase. The plan records which applies, and it MUST be rechecked when #10 lands.
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
  (constitution VI).

### Key Entities

- **Fact pair** (`ocelle-fact`): one label (short text) and one value (text, an identifier, a number, a date or inline content).
- **Empty state**: an optional visual, a consumer heading, an optional body, optional actions; a variant.
- **Progress**: a value (optional), a maximum, a value text (optional), a name, a size, label visibility.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The README mapping (FR-058) gives, for every `.sk-facts`, `.sk-empty-state` and `.sk-progress` variant
  kitty-mission-ui uses (183 class uses in all), an element and variant that replaces it with no `class` attribute on
  the element. Checked in review; the replacement in kitty-mission-ui itself is an outcome not gated here.
- **SC-002**: At 320 px CSS width, every facts story's page scroll width equals the viewport width.
- **SC-003**: Every story of the four elements reports no serious or critical axe finding by #10's `axe` gate once
  #10 is on `main` (the unnamed progress state has no story, FR-050). Until then, this mission's own browser tests
  prove the accessibility-tree assertions of FR-004 and FR-030 and of US1 to US3; they are not an axe run, and axe
  runs on these stories when #10 lands.
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
- 011's eyebrow tokens are not needed here. Facts labels are not eyebrows.
- #15 is not needed by any of the four elements: none has a scroll region.
- #10's design (`specs/006-storybook-workbench`) is final but not merged. Stories are written to it now, and this spec's
  evidence requirements are rechecked when it lands.
- Kitty Desktop's WebKit is not measured, the same as the library's existing Engines note. Only Chromium is.
