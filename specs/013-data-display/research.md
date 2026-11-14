# Research: Data Display, First Slice (013)

Every decision of the plan, with its reason and the alternatives. Measurements were taken in this container in
headless Chromium 153.0.8010.12 with axe-core 4.10.2. The scripts, raw outputs and summary are in [spike/](spike/)
(`spike/RESULTS.md`), and each can be rerun with `node <script>` once axe-core is packed into `spike/pkg/` as
`RESULTS.md` says. #10's `axe` gate, merged on `main` (3828d2f), pins axe-core 4.14.0 (root `package.json`). The
spike's axe results are re-run against that version in phase 1's spike (R-01) before the red commit; a failing
recheck stops the flow for the operator (R-01).

Squad rounds 1 to 3 (2026-11-13) changed this file: the operator's fork decisions are cited by finding ID with the
option taken, for example "PLAN-CORRECTNESS-1-003 (a)", "PLAN-FRESH-2-001 (c)" or "PLAN-FRESH-3-001 (c)". The
operator's plan-gate decisions (2026-11-13, `reviews/plan/operator-gate.md`) changed R-01 (FR-004 confirmed), R-08
and R-09 (#10 merged) and R-11 (the inventory to follow). The operator's inputs
([sources/013-inputs.md](sources/013-inputs.md)) then filled R-11 and the reading of #280, #498, #510 and #523 in
R-03; the gaps and conflicts they showed were open questions for the operator
([reviews/analysis/inputs-questions.md](reviews/analysis/inputs-questions.md), IQ-01 to IQ-15). The operator decided
them on 2026-11-14 ([reviews/analysis/inputs-decisions.md](reviews/analysis/inputs-decisions.md)); the decisions are
cited as "IQ-05 (b)" and so on, and changed R-01 to R-06 and R-08 to R-11 as each section says.

## R-01 `ocelle-facts`: description list through manual slot assignment (FR-003, FR-004, FR-005, FR-014)

**Decision.**
- `ocelle-facts` attaches an open shadow root with `slotAssignment: "manual"` and renders one `<dl part="list">`.
  For each pair (below), in source order, it renders `<dt part="label" lang=… dir=…>${child.label}</dt><dd
  part="value"><slot></slot></dd>`, then assigns that child to that `<dd>`'s slot with `slot.assign(child)`.
- The `ocelle-fact` shadow root, inside `ocelle-facts`, is one `<slot>`, so its own light-DOM content (the value) is
  shown in the `<dd>` unchanged.
- No `slot` attribute is added to the consumer's markup and no content is copied. The label text is the `label`
  property, which the consumer gave as data.

**Which children are pairs (PLAN-A11Y-SECURITY-1-003).** A pair is an `ocelle-fact` child that has no `hidden`
attribute and no `aria-hidden="true"`. A hidden fact gets no `<dt>`, no `<dd>` and no assignment: no row, no term, no
definition, as README § Host ARIA says of a host `hidden` ("no box and no node"). The label lives in the sheet's shadow
root, outside the fact, so the sheet carries the fact's host attributes that concern the label:
- `lang` and `dir` of the fact are copied onto its `<dt>` (WCAG 3.1.2 Language of Parts; a label in another script
  keeps its direction). Absent on the fact, absent on the `<dt>`.
- `hidden` and `aria-hidden="true"` remove the pair as above. `aria-hidden` with any other value is ignored.

**Measured** (spike A5):
- Chromium's tree is `DescriptionList > term "Owner", definition "Ada", term …, definition …`, with term and
  definition direct children of the list, in source order.
- axe has no violation, and `definition-list` and `dlitem` pass.
- No ID reference is used.

**Alternatives rejected** (spike A1 to A3, A2c):
- **A1/A1c/A1s/A3**: `<dl><slot>` in `ocelle-facts` with `<dt>`/`<dd>` in each `ocelle-fact`'s shadow root, with or
  without `display: contents`, subgrid or `internals.role = "none"`. Chromium's tree is valid (the hosts are ignored
  generics). axe reports `definition-list` (serious) and `dlitem` (serious ×4): in the flat tree the `<dl>`'s children
  are `ocelle-fact` hosts, and axe does not read ElementInternals roles. #10's `axe` gate would fail every facts story.
- **A2a**: `role="term"` and `role="definition"` divs. axe is clean, but there is no list container, which fails
  FR-004.
- **A2b**: ElementInternals `list` and `listitem`. This gives a list, not a description list.
- **A2c**: `associationlist` (ARIA 1.3 draft). Chromium shows generic nodes, and axe reports `aria-roles` (critical).

**Consequences (FR-003, edge cases, SPEC-2-06).**
- `ocelle-facts` keeps its rendering current with one `MutationObserver` on itself: `childList: true`, `subtree: true`,
  `characterData: true`, `attributes: true`, `attributeFilter: ["label", "hidden", "aria-hidden", "lang", "dir"]`.
  With manual assignment there is no `slotchange` for an unassigned child. `subtree` is needed to see the children's
  attributes; the callback re-renders only for a `childList` record on the host itself or an attribute record whose
  target's `parentElement` is the host, so attributes inside a value (a `lang` on a value's `<span>`) cause no
  re-render. A `childList` or `characterData` record whose target lies inside a pair (value text changed by Svelte or
  htmx, a node added to a value) causes no re-render but re-runs the layout decision (R-02 § Mechanism,
  PLAN-FRESH-3-001 (c)), because it can change the sheet's two-column size without changing its stacked size.
- `ocelle-fact`'s `label` property reflects to its attribute (`reflect: true`), so a property-only change reaches the
  observer. Reflection of an unset property writes nothing (PLAN-CORRECTNESS-1-011 (a), contracts/elements.md).
- Children that are not `ocelle-fact` (text, a raw `<dt>`, a `<div>`) are never assigned, so they are neither rendered
  nor exposed. Whitespace text nodes are ignored the same way. Nothing throws.
- With no pair, `ocelle-facts` renders no `<dl>` (FR-010): nothing visible and nothing exposed. An empty `<dl>` is
  valid but says nothing, and "nothing" gives one rule for the empty case.
- **`ocelle-fact` outside `ocelle-facts`** (`this.parentElement?.localName !== "ocelle-facts"`) renders `<span
  part="label">${label}</span><slot></slot>` as two blocks, with no term or definition role (edge case). A
  `MutationObserver` cannot see a re-parenting, so `ocelle-fact` decides in `connectedCallback`. Moving a fact into or
  out of `ocelle-facts` disconnects and reconnects it, which runs that decision again and re-renders; a body moves a
  fact in and out (PLAN-TESTABILITY-1-014, contracts/checks.md).
- **Missing halves** (FR-003): a `label` that is absent or empty renders an empty `<dt>`, exposed as an empty term. A
  fact with no content renders an empty `<dd>` (an empty definition). Each pair keeps its row because the grid cells
  always exist. A probe found a light-DOM empty `<dt>` exposed as a term node in Chromium 153; phase 1's spike measures
  it in the A5 shadow structure under Lit.
- **Module dependency (PLAN-CORRECTNESS-1-012 (a)).** `ocelle-facts.ts` imports `ocelle-fact.ts`, so importing the
  sheet defines both. This is a new convention, stated in README § Element conventions in phase 1: a container module
  imports its item element and no other element. A readme-test statement and a build test (`dist/ocelle-facts.js`
  imports `./ocelle-fact.js` and no other element module; every other per-element module imports none) prove it.
  Follow-on 1's containers (timeline, chain) copy it.
- **Before upgrade (PLAN-FRESH-1-009 (a)).** Until the module runs (a deferred module, a slow network, a script
  error), `ocelle-facts` and `ocelle-fact` are unknown inline elements: each value is shown as inline text, the values
  run together on one line, and no label is shown, because the label is an attribute. A server-rendered console page
  shows exactly that. The library therefore ships one recommended rule in `@ocelle/styles`' `base.css`:
  `:where(ocelle-facts:not(:defined) > ocelle-fact:not([hidden])) { display: block; }` (the whole selector inside
  `:where()`, so (0,0,0) as `base.css`' header requires, and any page rule wins),
  which puts each value on its own line before upgrade. Labels still appear only after upgrade; the README says so in
  the facts section and corrects its "until then its box is empty" sentence (README line 37) for elements with
  light-DOM content. A styles test and a fixture body (an undefined sheet, then defined) prove the rule.
- **A hidden fact before upgrade (PLAN-FRESH-2-002).** `base.css` has no `[hidden]` rule, so the only `display: none`
  on `[hidden]` is the user-agent sheet's, and any author-origin `display` overrides it whatever its specificity.
  Without `:not([hidden])`, an undefined sheet's `<ocelle-fact hidden>` computes `display: block` (18 px high, its
  text in `innerText`, measured), against FR-003 and the "A hidden fact" edge case. With it, the hidden fact keeps the
  user-agent `display: none` before upgrade as after. The styles test includes a hidden fact (no box, `display:
  none`), and the plant "`:not([hidden])` removed" must fail it.

**The grid layout's structure (IQ-05 (b), FR-014).** With `layout="grid"` the template groups each pair: `<dl
part="list">` holds, per pair, `<div class="item"><dt part="label" lang=… dir=…>…</dt><dd part="value"><slot></slot>
</dd></div>`, with the same manual assignment of the fact to that `<dd>`'s slot. HTML allows a `<dl>`'s pairs to be
wrapped in `<div>` elements, and axe's `definition-list` and `dlitem` rules accept `<dt>` and `<dd>` whose parent is a
`<div>` child of a `<dl>`; #280 asks for "each item groups one term/value pair while preserving native
description-list semantics". The group is what makes a pair a cell that a grid track can hold, label above value,
without `display: contents` (which would put the `<dt>` and `<dd>` in separate grid cells). The other layouts keep the
ungrouped A5 structure measured above, so their result does not move; the template switches structure on `layout`
(a reactive property), and the slots are re-assigned after the render that switches it. The group carries an internal
class, not a part: no `item` part is added (the surface the operator chose is the `grid` value only), and a
consumer reaches the cells' content through the existing `label` and `value` parts.
- **Not measured yet; measured in phase 1's spike.** The spike builds the grouped structure under Lit 3.3.3 and reads
  the Chromium tree (expected `DescriptionList > term, definition, …` with the groups ignored or generic, each
  definition after its term, an empty `<dt>` still a term) and axe-core 4.14.0 (`definition-list`, `dlitem`, full run,
  no serious or critical finding). Any failure (an axe violation, a group exposed as a node that separates a term from
  its list in a way that fails FR-004, or a pruned empty term) stops the flow for the operator before the red commit;
  FR-004 and FR-014 are not reworded by review.
- **Oracle.** US1-13's body asserts the same AX description list as US1-6, and the flat-tree structure axe reads: the
  `<dl>`'s element children are only `<div>` groups, each holding exactly one `<dt>` followed by one `<dd>`, one group
  per visible fact. Plant: the groups not rendered in the grid layout (the A5 structure with the grid's columns),
  which must fail the structure assertion and US1-13's cell geometry.

**Operator decision (spec SPEC-1-04 "D"): confirmed.** The measurement shows FR-004 can be met as written with Q1
(b). The operator confirmed FR-004 as written at the plan gate ("Confirm FR-004", 2026-11-13).

**Recheck in phase 1's spike, and what a failure does (PLAN-CORRECTNESS-1-014 (b)).** The spike runs axe-core 4.14.0
(#10's pin) on the A5 structure built with Lit 3.3.3: `createRenderRoot` passes `slotAssignment: "manual"`, the
template renders the `<slot>` elements, and the element sets their assignment in `updated()`. It also reads whether an
empty `<dt>` stays a term node in that structure. Any failing result (an axe `definition-list` or `dlitem` violation, a
tree that is not `DescriptionList > term, definition, …`, or an empty term pruned from the tree) stops the flow for
the operator before the red commit. FR-003, FR-004 and US1-10 are the operator's to change; review does not reword
them. Whatever the operator decides, US1-6, US1-7 and US1-10 keep an accessibility-tree oracle (contracts/checks.md).

## R-02 `ocelle-facts`: stacking on its own two-column size, with a `layout` override (FR-005, FR-009, FR-013, FR-014)

**Problem.** A size container query on the host needs `container-type: inline-size`. The spike (C) measured that host
at 0 px inline size inside a `showModal()` dialog and inside a default flex item. This is the collapse FR-009 forbids,
and the same as 003's finding. A flex-wrap row per pair never collapses, but it loses the shared label column FR-005
requires (each pair is its own flex line). A plain grid keeps the column and never collapses, but cannot stack without
a query.

**What round 1 found in the first design (PLAN-CORRECTNESS-1-003, PLAN-FRESH-1-001).** The first design compared the
host's own resolved inline size with the threshold. In a shrink-to-fit host that size is the sheet's max-content,
which depends on the sheet's state: two-column max-content can be above the threshold while stacked max-content is
below it. Reproduced: in a default flex item the sheet is 227 px and stacked at 360 px, and stays 227 px and stacked
after widening to 1200 px. The layout depended on history. The earlier rejection of flex-wrap for "stacking in a dialog
with room" applied to that design as well; flex-wrap is rejected only because it loses the shared column.

**What round 2 found in the available-space design (PLAN-FRESH-2-001).** Round 1's decision (a) read "the inline
space available to the sheet". Neither of its candidate mechanisms met it:
- the measurement pass (the `<dl>` laid out two-column, filling its containing block, then the host read) gives the
  sheet's own two-column size: 173 px for a short sheet ("Owner / Ada Lovelace") in a `showModal()` dialog at
  1280 px, so it stacks there;
- the ancestor walk (the nearest ancestor whose inline size does not depend on its content) reads a shared ancestor
  that is too wide: for a default flex item, 200 px of a 600 px row beside a 400 px sibling, the first such ancestor
  is the row, which reads 600 px and keeps a 200 px sheet in two columns. Flex rows with siblings, grid `auto` tracks
  and table cells share their container, and no platform API says whether a box's inline size depends on its content.

**Decision (PLAN-FRESH-2-001 (c), amending PLAN-CORRECTNESS-1-003 (a)).** The grid is plain, with no containment. The
automatic switch reads the sheet's own size, in a state-independent form, and a public property lets the consumer
choose where that is not what they want.
- **Measure.** The sheet's own content-box inline size **as laid out in two columns**. In a block container this is
  the container's inline size in either state. In a shrink-to-fit host (dialog, popover, float, flex item, grid `auto`
  track, table cell) it is the content's two-column max-content, capped by the space the host offers. The measure
  never reads the stacked layout. It gives one layout from any history only if it is read again whenever it can
  change, which is the trigger list below (PLAN-FRESH-3-001 (c)).
- **Rule.** With `layout` unset: two columns when the measure is at least the threshold; one column below it. A short
  sheet in a wide dialog therefore stacks, as the measurement above shows; that is the documented cost of this option.
  FR-009's bound still holds: the sheet's resolved size in a shrink-to-fit host is its max-content (two-column or
  stacked), capped by the space the host offers, never 0.
- **`layout` (FR-013).** A reflected property `"columns" | "stacked" | undefined`. `columns` keeps two columns and
  `stacked` keeps one column at any size; the measure and the threshold are not used. Unset, or any other value, gives
  the rule above. The README tells consumers with a sheet in a shrink-to-fit host to set `layout`, or to give the sheet
  an inline size (then it measures that size). With `layout="columns"` at 320 px the value column is still
  `minmax(0, 1fr)` and the label column is capped at 50%, so the page does not scroll sideways (FR-009).
- **Mechanism: the measure pass.** One function, the measure pass, makes the decision. It reads the threshold from
  the probes and, when `layout` is unset, the measure: it removes the `stacked` class from the `<dl>`, reads the host's
  content-box inline size (which forces a layout in two columns), and then sets the class from the decision with
  `classList.toggle("stacked", stacked)`, unconditionally, whether or not the decision changed. With `layout` set it
  sets the class from `layout` alone. In a block container the pass changes no size. The pass is synchronous from
  every trigger but the `ResizeObserver`; from the observer it runs one animation frame later (§ The `ResizeObserver`
  loop error, below).
- **The class is owned by the measure pass alone (PLAN-FRESH-3-002).** The template does not bind the `<dl>`'s
  `class`, and `stacked` is not a reactive property. A Lit attribute binding commits only when the new value differs
  from its own last committed value, not from the DOM, and `requestUpdate` skips an update when `hasChanged` is false;
  so a template binding would never restore a class the pass removed when the decision stays "stacked" (a narrow sheet
  resized, a probe callback), and the `<dl>` would be left in two columns. Owning the class in the pass means the pass
  never leaves the DOM different from the decision, and no Lit update follows a decision, so no update loop can
  oscillate. Because a re-render can create a new `<dl>` (from no pairs to some), the pass also runs in `updated()`
  after every render. A body resizes a 300 px sheet to 290 px and asserts one column after the layout wait; the plant
  "class not restored after the measure" (the class toggled only when the decision changes) must fail it.
- **When the pass runs (PLAN-FRESH-3-001 (c)).** While the sheet is stacked in a shrink-to-fit host, its size is its
  stacked max-content, so a change of the two-column measure that leaves the widest single label or value alone does
  not resize the host, and a `ResizeObserver` on the host alone never re-decides. Round 3 reproduced both cases: a
  dialog loaded at 360 px and widened to 1200 px stays stacked at its stacked size, and a stacked sheet relabelled
  from "Id" to "Created by operator" stays stacked, while a fresh load of the same content in the same space gives two
  columns. The pass therefore runs on each of these triggers, the cheap ones of the lens's list (operator option (c)):
  - the callback of one `ResizeObserver` that observes the host and both probes (a resize of the sheet; a threshold
    change, PLAN-FRESH-2-004). The callback does not run the pass itself: it schedules one pass in a
    `requestAnimationFrame`, so the pass runs in the next frame, never synchronously inside the callback (operator decision "(a) Defer + 2-frame wait",
    2026-11-14);
  - `updated()`, after every render: every re-render from the facts `MutationObserver` (a child added, removed,
    reordered, hidden or shown; a label, `lang` or `dir` changed) and a change of `layout`;
  - the facts `MutationObserver`'s `childList` and `characterData` records inside a pair (R-01), which do not
    re-render: value text changed in place;
  - `window` `resize`, which covers a dialog or popover, whose offered space is the viewport, and every host whose
    space follows the window. The listener is added in `connectedCallback` and removed in `disconnectedCallback`.
- **Changes the pass does not observe, and the narrowing (PLAN-FRESH-3-001 (c)).** The lens's other triggers (a
  `ResizeObserver` on the host's parent, `visualViewport` resize, `document.fonts` `loadingdone`) are not taken.
  Phase 1's spike runs, in every host of FR-009 and the shared hosts above, the cases the triggers above should cover
  (the two round 3 cases with their named content, below) and the cases they may not: the space a shared host offers
  changed without a window resize (a 400 px flex sibling shrunk to 100 px; a grid `auto` track's neighbour removed; a
  table cell's column widened by another row), a dialog closed and reopened at another width in the same window, and
  a web font that loads after the first decision. For each case, a fresh load of the same content in the same space is
  compared with the changed sheet. Where they differ, history independence is not guaranteed for that case: the
  operator's option (c) has already decided that this narrows FR-005 and FR-009 rather than adding triggers or
  returning to the operator. The spike's list of unobserved cases is recorded in `reviews/phase-1/spike.md` and copied
  into this section, the README's facts section (in a shrink-to-fit or shared host, set `layout` or give the sheet an
  inline size where such a change can happen) and FR-009's bodies, which for each such case assert the consumer's
  remedy (with `layout="columns"`, and with an inline size on the sheet, the layout after the change is the chosen
  one) instead of history independence. In a block container the measure is the container's size, which a resize of
  the host always reports, so no case is narrowed there.
- **The unobserved case the spike found (`reviews/phase-1/spike.md` §§ 5 and 7).** Of the cases above, one differs
  from a fresh load: **a sheet in a consumer's CSS grid `auto` track whose neighbour is removed.** In the two-column
  layout (a 600 px grid) the stacked sheet stays stacked at 277.9 px while a fresh load gives two columns at
  386.1 px; in `layout="grid"` (a 1000 px viewport) the sheet stays two columns at 571.9 px while a fresh load gives
  four columns at 1000 px. The stacked (or fewer-column) sheet's own size does not change, so neither the host
  observer nor a window resize fires. Every other case agreed with a fresh load: the fixed flex sibling shrunk from
  400 to 100 px (the host resizes, in both layouts), the table column widened by another row, the dialog closed and
  reopened at another width (both ways, in both layouts), and the late web font in a dialog, a flex item and a 450 px
  block. This is the narrowing of FR-009 the operator's option (c) already decided: the README names the case (in a
  CSS grid `auto` track whose neighbours can change, set `layout` or give the sheet an inline size; for
  `layout="grid"`, give it an inline size), and the unobserved-change bodies assert that remedy for it in the
  two-column and grid layouts.
- **The `ResizeObserver` loop error (operator decision "(a) Defer + 2-frame wait", 2026-11-14).** Phase 1's spike
  (`reviews/phase-1/spike.md` § 3) measured that a decision made synchronously inside the observer callback raises
  "ResizeObserver loop completed with undelivered notifications" on almost every flip: in every shrink-to-fit host and
  in block containers, on widen, narrow, relabel, value-text, hook and grid column-count flips, whenever the decided
  class changes the host's box inside the callback, so the host is observed again at the same depth. Where it shows:
  the error is a `window` `error` event with no error object. Playwright's `console` and `pageerror` events record
  nothing, so the fixture's console check does **not** catch it; Vitest's in-process harness (`@vitest/browser`'s
  error catcher) turns it into `console.error(new Error(message))`; a consumer's page error monitor sees it on each
  flip. The decision: the observer callback schedules the measure pass in a `requestAnimationFrame` (above); the
  pass from `updated()`, the `MutationObserver` and `window` `resize` stays synchronous. The spike measured no loop
  error in any of its cases with the deferred pass, and every layout in every host and case equal to the synchronous
  pass's. The cost, accepted by the operator: after a resize the observer reports, the old layout shows for one frame.
  A body in the in-process harness, the one that can observe the error, asserts that the flips raise no loop error
  (contracts/checks.md § Oracles, "No `ResizeObserver` loop error"); its plant runs the pass synchronously inside
  the callback and must fail it.
- **Threshold (PLAN-FRESH-2-008).** It comes from a hook, `--ocelle-facts-stack-below`, set by default in `:host` to
  `calc(var(--ocelle-space-10) * 6)`, which is 24rem (384 px at the default root size, more than 320 px as FR-005
  requires). The default is built from the spacing scale, not from `--ocelle-shell-sidebar-width`: the `calc()`
  resolves on the host from inherited custom properties, so a consumer that resizes its shell's sidebar on `:root`
  would otherwise move every sheet's stacking point, including in dialogs and inspectors with no sidebar. The spacing
  scale has no layout meaning of its own.
- **Probes (PLAN-A11Y-SECURITY-1-004).** The element resolves the threshold to pixels through two probes inside a
  holder: `<div class="probes" aria-hidden="true">` with `position: absolute; inline-size: 0; block-size: 0;
  overflow: visible; visibility: hidden`, holding a hook probe `<div class="probe">` at `inline-size:
  var(--ocelle-facts-stack-below)` and a default probe at the token default. Both probes are `position: absolute;
  block-size: 0`, and the host is `position: relative`. Because the holder is 0 wide, a percentage hook resolves to
  0, and a hook invalid at computed-value time gives `auto`, which is also 0 for an empty absolutely positioned box.
  **When the hook probe measures 0 or a non-finite value, the element uses the default probe's measure.** The hook
  takes an absolute length only; the README says so, and that a percentage, 0 or an invalid value falls back to
  24rem.
- **The probes are observed (PLAN-FRESH-2-004).** The same `ResizeObserver` observes both probes, so a run-time change
  of `--ocelle-facts-stack-below`, or a root font-size change while a px-sized container keeps its width, resizes a
  probe and re-runs the decision at once. Without this the layout would stay stale until an unrelated resize, which is
  the history dependence round 1 removed. A body changes the hook from 15rem to 40rem on a sheet held at 450 px and
  asserts the flip from two columns to one with no resize of the sheet.
- **Zero block size is a requirement.** The probes and their holder take no block size, so they add no scrollable
  overflow: an absolutely positioned 384 px probe with `block-size: 0` leaves the page's scroll width at 320 px, but the
  same probe with `block-size: 1px` gives 392 px (measured, Chromium 153). A body asserts the page scroll width at
  320 px with the probes present, and a plant (`block-size: 1px` on the probe) must fail it.
- **State.** The `stacked` state is a class on the `<dl>`, set only by the measure pass (above), not a host attribute,
  and the probes carry classes, not parts, so neither is public surface (`layout` is the public input). The `<dl>` then becomes one column,
  `minmax(0, 1fr)`, with each value below its label.
- **Why a hook rather than a constant.** `--ocelle-facts-stack-below` is the element's own hook (README § Element
  conventions: `--ocelle-<element>-<property>`). A consumer with a wider inspector can lower it. It is declared in the
  manifest's CSS custom properties.

**The grid layout's column count (IQ-05 (b), FR-014).** The grid reuses this mechanism rather than adding one:
- **Measure.** With `layout="grid"` the measure pass removes the column classes from the `<dl>` (so the rule without
  a class, four equal columns, applies), reads the host's content-box inline size, and sets one class from the
  decision (`cols-2` or `cols-1`; none for four), unconditionally, as for `stacked`. The measure is therefore the
  sheet's own inline size as laid out in four columns: in a block container the container's inline size, in a
  shrink-to-fit host the four-column max-content (four times the widest cell's max-content, plus three column gaps,
  since the four tracks are equal) capped by the space the host offers. It never reads the two- or one-column layout,
  so for every change the pass observes the column count depends only on the content and the space. In a
  shrink-to-fit host a grid sheet with few pairs is therefore wide (four equal tracks as wide as its widest cell); the
  README tells consumers to give a grid sheet in such a host an inline size.
- **Thresholds.** With T the resolved threshold of the probes above (`--ocelle-facts-stack-below`, 24rem by default):
  four columns when the measure is at least 2 × T, two when it is at least T, one below T. 2 × T is computed in the
  pass from the same probe reading, so no probe, hook or token is added and the hook moves both points. At the
  default (384 px) a cell in four columns at 768 px and a cell in two columns at 384 px have about the same inline
  size (less the gaps), so a cell never gets narrower when the column count rises. The class names are internal, not
  public surface.
- **Triggers and narrowing.** The same triggers as the stacking (the host and probe `ResizeObserver`, its pass
  deferred one frame, `updated()`, value text changed in place, window resize), and the same narrowing for the changes
  the pass does not observe: the phase 1 spike ran the grid in the same hosts and unobserved cases, and the one that
  differs is the same, a CSS grid `auto` track whose neighbour is removed (two columns where a fresh load gives four,
  § The unobserved case the spike found). The README's remedy is the same (an inline size on the sheet; a set
  `layout` other than `grid` gives another layout, so for the grid the remedy is the inline size).
- **Why not a container query or `auto-fit`.** A container query needs inline-size containment, which collapses the
  sheet to 0 px in shrink-to-fit hosts (above). `repeat(auto-fit, minmax(<length>, 1fr))` gives every column count
  from one to many, not four, two or one as #280 asks, and in a shrink-to-fit host its count follows the content's
  intrinsic size; it would also need a new `token-only` allowance.
- **To measure in phase 1's spike.** The four-column measure in each host of FR-009 and the shared hosts (FR-009's
  bound, the column count against a fresh load), the column count at 300, 600, 800 and 1280 px block containers
  (one, two, four, four at the default threshold; 800 px gives four, 600 px two), the widen case of US1-18 in a dialog,
  a hook changed at a fixed width moving both points, and whether a flip raises the `ResizeObserver` loop error.

**A sheet as a `1fr` grid item (IQ-02 (a)).** A sheet that is the item of a `1fr` grid track has that track's
automatic minimum, its min-content, so a long unbroken value without the wrap policy, or a long label, can widen the
track past the space the page offers. FR-009's lower bound stays as it is: the element sets no `min-inline-size` on
its host. The consumer sets `min-inline-size: 0` on the `ocelle-facts` host in its own grid (host styles are the
consumer's), and the README says so. Phase 1's spike adds the case to its host list: a sheet with a long value as the
item of a `1fr` track at 320 and 600 px, with and without the consumer's rule; with it, neither the track nor the page
overflows. The README statement is a readme test (T010); the case needs no element behaviour and no body beyond the
spike's record.

**Alternatives rejected.**
- A container query on the host (the collapse above).
- A container query on a consumer's container: it needs the consumer to set one up.
- A media query: viewport size, which FR-005 excludes.
- `contain-intrinsic-inline-size` with a fixed length: the element's width in a dialog would be that length, not its
  content's max-content, and it fails FR-009 for long values.
- Flex-wrap per pair: it loses the shared column.
- The host's own resolved inline size (the first design): history-dependent in shrink-to-fit hosts, as above.
- The available inline space with an ancestor walk (round 1's candidate 1): a shared ancestor is too wide, as above.
- PLAN-FRESH-2-001's other options, not chosen by the operator: (a) "available space" defined per shared host, (b) a
  squeeze rule on the value column's max-content and a token floor, (d) no override, with the consumer giving the
  sheet an inline size.
- PLAN-FRESH-3-001's other options, not chosen by the operator: (a) every trigger of the lens's list (also a
  `ResizeObserver` on the host's parent, `visualViewport` resize and `document.fonts` `loadingdone`) as a guarantee in
  every host; (b) the narrowing alone, with no added trigger.
- For PLAN-FRESH-3-002, measuring without touching the `<dl>` (a separate always-two-column measuring element): it
  would duplicate the pairs' content, which FR-003 forbids, or measure something other than the sheet.

**When the layout is read (PLAN-TESTABILITY-1-003, operator decision "(a) Defer + 2-frame wait").** `settle()` in
`test/in-process.ts` waits for `updateComplete` and one `requestAnimationFrame`. Animation-frame callbacks run before
layout and before `ResizeObserver` delivery in the same frame, and the observer callback only schedules the measure
pass for the next frame (with no Lit update after it), so one frame reads the pre-decision layout, and so can two
equal frames read before that deferred pass runs. The facts bodies therefore wait with a layout settle: after
`updateComplete`, the driver waits at least 2 animation frames, then reads once per animation frame until two
consecutive frames give the same host and `<dl>` geometry and the element's `updateComplete` is resolved, failing the
body after 10 frames. Phase 1's spike measured, in the Playwright harness, that a wait comparing from the first frame
returns before the deferred pass in several cases (the flex sibling, the 300 → 290 px pass, the hook change at 450 px
and 600 px, the dialog reopened, and the grid's flex-sibling and dialog cases), and that with at least 2 frames before
the comparison every result equalled the synchronous pass's (also at 3 and 4 frames). The in-process harness's frame
count is measured when the phase resumes and recorded in `reviews/phase-1/spike.md`. The stacking and probe plants
are run with this wait in place, so they fail on the layout and not on timing. A body resizes the host from 600 px to
300 px and back to 600 px, so the observer path runs after the first layout.

**To measure in phase 1's spike**, before the red commit:
- the measure (above) in a `showModal()` dialog, a popover, a float, a default flex item, a flex row with a 400 px
  fixed sibling, a grid `auto` track and a table cell: the host's inline size against FR-009's bound; a short sheet in
  a dialog at 1280 px (one column without `layout`, two columns with `layout="columns"`); a sheet loaded at 360 px
  then widened to 1200 px (the same layout as loaded at 1200 px, in each host); and whether a flip raises the
  `ResizeObserver` loop error;
- the round 3 cases with their content (PLAN-FRESH-3-001 (c)): the pair "Created by op" / "Ada Lovelace and Charles
  Babbage" in a `showModal()` dialog loaded at 360 px and widened to 1200 px gives the layout of a load at 1200 px;
  the pair "Id" / "Ada Lovelace and Charles Babbage" in a dialog at 1280 px, relabelled "Created by operator", gives
  the layout of a fresh load with that label; and the same value's text changed in place (a `characterData` change)
  across the threshold gives the layout of a fresh load. The spike first confirms in the harness's fonts that each
  content's two-column size is above the 384 px threshold at 1200 or 1280 px and its stacked size below it, and
  lengthens the value if not (round 3's refuter had to, in another font); the content used is recorded and the bodies
  use it. With the extra triggers removed, both named cases must keep the stacked layout (the plant). **Margin
  (operator decision "Widen the margin", 2026-11-14):** the spike measured "Created by op" / "Ada Lovelace and Charles
  Babbage" at 386.1 px in two columns, 2.1 px above the 384 px threshold, too close for CI's font run. Each round 3
  content's two-column size must be at least 16 px either side of the threshold: at most 368 px where the body expects
  one column (before the change) and at least 400 px where it expects two (after the change and on the fresh load).
  The implementer chooses the content (lengthening the value or the label as needed; relabel, 307.3 → 426.4 px, and
  value text, 298 → 479.7 px, already meet it as measured), re-measures every case in the harness's fonts and records
  the content and its sizes in `reviews/phase-1/spike.md` and here, before the red commit; the bodies (and US1-18,
  which uses the same content) use that content. **Chosen (T001b, `reviews/phase-1/spike.md` § 9):** the value
  "Ada Lovelace and Charles Babbage FRS" for widen, relabel and US1-18. Widen ("Created by op"): measure 322 px in the
  dialog at 360 px, 421.3 px after the widen and fresh at 1200 px (in process, fallback face: 322 → 432.8 px).
  Relabel ("Id" → "Created by operator"): 342.5 → 461.6 px (in process 351.1 → 472.9 px). Value text, unchanged
  (label "Created by the operator on duty today", value "Ada" → "Ada Lovelace and Babbage"): 298 → 479.7 px (in
  process 302.9 → 490.7 px). US1-18 with "Status" / "Running" added: one column at 360 px (measure 322 px), four
  columns at 1242 px at 1280 px. The plant (extra triggers removed) keeps widen and relabel stacked;
- the unobserved cases of § Changes the pass does not observe, each against a fresh load, to name the narrowing;
- the 300 px sheet resized to 290 px, stacked after the pass (PLAN-FRESH-3-002);
- the stacked and two-column states at 300 px and 600 px, `layout="columns"` at 320 px with no page overflow, and the
  layout-settle wait in both harnesses;
- the grid layout's structure (R-01) and column count (above), and the `1fr` grid item (IQ-02 (a), above);
- the probes with an invalid hook, a percentage hook and a 0 hook at 320 px (stacked), with a valid 15rem hook at
  300 px (two columns) and a valid 40rem hook at 600 px (stacked), and a hook changed at a fixed 450 px width;
- right-to-left mirroring of the columns (SPEC-2-08).

Measured on 2026-11-14 (`reviews/phase-1/spike.md`); the loop error and the round 3 margin were decided by the operator
the same day (`reviews/phase-1/operator-spike-decisions.md`), and the unobserved case is copied above. Measured when
the phase resumed (T001b, `reviews/phase-1/spike.md` § 9): the round 3 content above; with the deferred pass no loop
error in any case and every layout equal to the synchronous pass's after the 2-frame wait; the wait returns after 2
frames in the fixture harness and 2 or 3 in the in-process harness, which logs the synchronous pass's loop error as
`console.error`. With the chosen content the two-column CSS grid `auto` track case agrees with a fresh load, because
its stacked size (313.1 px) does not fit beside the 300 px neighbour, so the host resizes; the narrowing stays for
content whose stacked sheet fits there (the pre-margin content), and the grid case still differs.

## R-03 `ocelle-facts`: grid, type and density (FR-005 to FR-008, FR-014)

- **Columns.** `<dl>` is `display: grid; grid-template-columns: fit-content(50%) minmax(0, 1fr)`. The label column is
  the widest label's max-content, capped at 50%, and longer labels wrap between words inside the cap. The value column
  takes the rest and is never widened by content. Spike A5 measured both: 176 px for the widest normal label in 600 px,
  and 300 px (the cap) for a very long label. `minmax(auto, 50%)` was rejected because it always gives 50%. Both
  functions need a recorded `token-only` allowance (R-10, PLAN-CORRECTNESS-1-001 (a)).
- **Restyled columns (IQ-01 (a)).** These tracks stay; no hook sets them. kitty-mission-ui's two-column sheets replace
  the tracks (label about 0.8fr, value about 1.2fr); with this element the consumer drops that override and takes
  `layout="columns"` (or the automatic layout). The README says not to set `grid-template-columns` through
  `ocelle-facts::part(list)`: an outer `::part()` rule wins over the element's own in every layout, so it would also
  break the stacking and the grid.
- **Grid layout (IQ-05 (b), FR-014).** With `layout="grid"` the `<dl>` is `display: grid` with four tracks written
  out, `grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)`; the internal classes set
  two such tracks (`cols-2`) or one (`cols-1`). Every track is a `minmax(0, <flex>)` value, which R-10's allowance
  already admits in `grid-template-columns`, so the gate gains nothing. Each group (`.item`) is a cell holding its
  `<dt>` above its `<dd>` (block flow), with `min-inline-size: 0` so a cell never widens its track. Column gap
  `--ocelle-space-4`, row gap `--ocelle-space-3` (`--ocelle-space-1` with `density="compact"`), label-to-value gap
  `--ocelle-space-1` (a `margin-block-end` on the `<dt>`, a logical property). The type is the other layouts'. No
  divider or border is drawn and no ground is painted: #280's dividers and surface are the container's ("Surface/tone
  remains container-owned"), and the gaps are direction-neutral, so right-to-left needs no rule of its own (the grid
  fills each row from the inline start). With fewer pairs than columns the row ends with empty tracks; cells are not
  stretched. A long unbroken value breaks in its cell with `wrap="anywhere"`; without it, it wraps between words only
  (FR-007, IQ-04 (b)) and can overflow its cell, which the README tells consumers to avoid by setting the policy on
  machine values. FR-009's no-horizontal-scroll rule is qualified accordingly, in every layout (operator decision
  "Grid limits"). The bodies assert the label-to-value and column gaps as exact token values and the absence of a
  ground or border (US1-13, contracts/checks.md § Oracles, grid geometry).
- **Gaps.** Column gap `--ocelle-space-4`. Row gap `--ocelle-space-3`, or `--ocelle-space-1` with
  `density="compact"`. When stacked, a pair's label-to-value gap is `--ocelle-space-1` and the gap between pairs is
  the row gap. `<dt>` and `<dd>` have no margins (`margin: 0`).
- **Type.**
  - Labels: `--ocelle-font-sans`, `--ocelle-font-size-sm`, `--ocelle-font-weight-medium`, `--ocelle-color-ink-muted`
    (declared text on every main ground). Labels set no line height of their own: they take the sheet's, which is the
    surrounding text's. Labels differ from values by size and weight, not only colour.
  - Values: `--ocelle-font-sans`, `font-size: var(--ocelle-facts-value-size, var(--ocelle-font-size-fact))`,
    `--ocelle-font-weight-regular`, `--ocelle-color-ink`, `font-variant-numeric: var(--ocelle-figures)`,
    `line-height: var(--ocelle-facts-value-line-height, var(--ocelle-line-height-normal))`. The two hooks are the
    element's own (below); unset, values are at `--ocelle-font-size-fact` and `--ocelle-line-height-normal`.
- **Compact (FR-008, PLAN-CORRECTNESS-1-002 (b)).** Two switches, each doing one thing:
  - The sheet's own `density="compact"` only tightens the gaps (row gap `--ocelle-space-1`). It does not change the
    value size or line height.
  - Inside a `data-ocelle-density="compact"` region (003's compact scale, the answer to #531), values take the
    region's size and line height: `--ocelle-font-size-sm` (14 px) at `--ocelle-line-height-compact` (1.5). The
    mechanism is inheritance of the two hooks: `@ocelle/styles`' compact rule (`[data-ocelle-density="compact"]`)
    also sets `--ocelle-facts-value-size: var(--ocelle-font-size-sm)` and `--ocelle-facts-value-line-height:
    var(--ocelle-line-height-compact)`, and its regular rule sets them back to `--ocelle-font-size-fact` and
    `--ocelle-line-height-normal`. Custom properties inherit through the flat tree, so the nearest region wins
    (a regular region nested in a compact one restores the default), which a descendant selector could not do without
    `@scope` (above the engine floor). Shadow CSS cannot see the region's attribute in WebKit (`:host-context()` is not
    supported there), so the region must pass the scale by inheritance.
  - Labels are at `--ocelle-font-size-sm` in both, and take the region's line height by inheritance.
  - Colour stays `--ocelle-color-ink` (FR-006). #531's muted value colour is 003's `data-ocelle-value=""`, which a
    consumer can still put on a value's own element; the sheet does not adopt it.
  - Source: #531 (below). A body puts a sheet inside a compact region and asserts the values' computed size (14 px)
    and line height (1.5), and a nested regular region restoring 17 px and 1.45.
- **Upstream issues (SPEC-1-12, PLAN-CORRECTNESS-1-002).** Two of the six spec-kitty-design issues are in this
  repository, copied verbatim on 2026-11-09 in `specs/003-base-styles/sources/spec-kitty-design-issues.md`:
  - **#531** asks for a compact screen scale (14 px at a 1.5 line height) and a value text style ("mono face, small
    size, muted or body colour") for, among others, fact values. 003 shipped it as `data-ocelle-density="compact"` and
    `data-ocelle-value` (packages/styles/README.md § Compact scale). FR-008 follows it inside a compact region (above);
    mono is excluded by constitution II.
  - **#535** asks for an identifier wrap policy, with the local stand-in "`overflow-wrap: anywhere` … on the Facts
    `dd`". FR-007's `wrap="anywhere"` on the pair applies the same keyword to that pair's value only (below).
  - **#280, #498, #510 and #523** were not read while planning: that repository was outside this session's GitHub
    scope, and the orchestrator's request for read access was denied. At the plan gate the operator chose "Proceed,
    inputs later" (plan Decision 5). They are now read: the operator supplied their bodies, comments and timelines
    verbatim in [sources/013-inputs.md](sources/013-inputs.md) (Part B). What each states for this mission is below.
    Every gap or conflict with the spec or plan was an open question for the operator in
    [reviews/analysis/inputs-questions.md](reviews/analysis/inputs-questions.md) (IQ-01 to IQ-15), decided on
    2026-11-14 as each item below says.
    - **#280** (responsive facts grid, open; no comments). It asks to extend the class family `.sk-facts` with a grid
      modifier whose items each group one pair and reflow between four, two and one columns on the available space,
      with native description-list semantics in source order; terms visible at every width; long machine values
      wrapping inside their cells with no page overflow (200% zoom, long unbroken values, right-to-left); missing
      values as the consumer's text; tokens and logical properties; surface and tone owned by the container; the
      existing stacked, compact and two-column layouts unchanged. Its non-goals include "truncation that hides values"
      and "a custom `sk-facts` element". For this mission: FR-003, FR-004, FR-005, FR-009 and FR-010 already meet the
      semantics, the visible terms, the consumer's missing values and the no-overflow rule; US1-8 has the sheet paint
      no ground. The custom-element non-goal is overruled by #523 and the mission's input ("every class family
      replaced by an element"). The four/two/one-column strip is `layout="grid"` (IQ-05 (b), FR-014, above and R-01,
      R-02), and the hidden-truncation non-goal holds: the element has no truncation, and a consumer's ellipsis maps
      to `wrap="anywhere"` with the full value shown (IQ-04 (b)). #280's "existing stacked, compact and two-column
      output unchanged" holds too: the grid is a separate value of `layout`. Of #280's required stories, those that
      fit this library are in R-08 (forced colours is proven by US1-8's browser body, as for the other layouts).
      kitty-mission-ui cites #280 nowhere (R-11).
    - **#498** (no progress element, open; no comments). It asks for a progress element with `value`/`max`
      (determinate) or no value (indeterminate), `compact`, a label slot, its accessible name from the label, and
      reduced motion respected, so that a shadow-DOM consumer stops adopting the stylesheet and writing class markup;
      and, separately, a default marker for a pulsing status indicator. For this mission: FR-030 to FR-034 meet the
      value, indeterminate, compact, naming and motion asks (R-05, R-06). The label is a `label` property, not a slot
      (IQ-14 (a)): every inventoried label is text, and the README says rich labels are not supported. The status-indicator marker is #7's (mission 012), out of scope as the spec says.
    - **#510** (loading and empty panel spacing and weight, open; no comments). Its text: the prototype's loading and
      empty panels have a larger vertical rhythm and a lighter heading weight than the library; the ask is panel
      tokens for block padding and heading weight, or a page variant for the empty state and the progress panel; the
      stand-in E-13 sets padding-block, gap and font-weight on the panel wrappers. For this mission: FR-022 follows the
      text (`variant="panel"`, larger padding and gaps, lighter heading, existing tokens by operator decision Q2;
      R-04). But the E-13 code on kitty-mission-ui's `main` does not match the text: it sets a bold heading in the
      display face, card fill, radius, inline padding and a dashed or solid border keyed on the parent's busy state
      (R-11's "empty-state card", "message" and "ops card" rows). The operator kept #510's text (IQ-06 (a): the panel
      heading at 500 with the larger rhythm) and no chrome on the element (IQ-07 (a): the card, the message card and
      the ops card are the consumer's own card around the element; the dashed card is the #509 family's).
    - **#523** (no facts or empty-state elements, open; one comment). It asks for facts and empty-state elements that
      carry the family looks, so screens compose elements instead of classes and stop re-implementing the structure;
      progress is the same gap, tracked in #498. Its comment (2026-10-11, from the Drift screen) names three defaults
      a facts element could take: terms at normal weight (400, against the library's 500), values in the mono face at
      the small text size, and `overflow-wrap: anywhere` for long machine values, ideally a shared identifier wrap
      rule. For this mission: the four elements answer the ask (FR-002). The wrap is FR-007's `wrap="anywhere"` and
      003's `data-ocelle-wrap` (#535). The value face stays sans (constitution II: no monospace). The small value size
      is the consumer's through `--ocelle-facts-value-size` or a compact region (FR-008, #531); the default stays
      `--ocelle-font-size-fact`, which the mission's input fixed from #531. The term weight stays 500 (IQ-03 (a)): a
      consumer that wants 400 sets it through `ocelle-facts::part(label)`.
  - The kitty-mission-ui variant inventory the README mapping needs is R-11.
- **Wrap policy (FR-007, SPEC-2-10, PLAN-CORRECTNESS-1-015).** `ocelle-fact` has a `wrap` property, reflected and
  taking only `"anywhere"`. With it, the fact's shadow rule `:host([wrap="anywhere"]) slot { overflow-wrap: anywhere; }`
  sets the policy on the value's slot, which the value content inherits through the flat tree. The label never takes
  it: inside `ocelle-facts` the label is the sheet's `<dt>`, outside the fact; outside `ocelle-facts` the label is
  the fact's `<span part="label">`, a sibling of the slot, not inside it. A value element holding
  `data-ocelle-wrap="anywhere"` keeps 003's base-style behaviour, because it is light DOM styled by `base.css`.
  Without either, values wrap between words (`overflow-wrap: normal`). Copying gives the text unchanged (US1-4):
  nothing is inserted.
- **Long values in the README (IQ-04 (b)).** The element has no truncation and no ellipsis. The README maps the
  consumers' three long-value rules: `break-word` (Work Package) and break-anywhere (Drift) both to `wrap="anywhere"`,
  which in a value column whose minimum is 0 breaks at the same places; the inspector's words-with-ellipsis to
  `wrap="anywhere"` too, so the full value is shown, with any tooltip the consumer's own `title` on its value content.
- **Digests (SPEC-2-04).** A digest in a facts value is the consumer's text. The element does not group or rewrite it
  (FR-003). The README says digests are grouped by the consumer, or by follow-on 2's code-block digest mode once it
  exists.
- **200% zoom (SPEC-2-05).** At 1280 × 800 CSS px and 200% zoom, the layout viewport is 640 CSS px wide. The tests set
  a 640 px viewport for "200% zoom" and a 320 px viewport for the reflow test (FR-053, which is also 400% of 1280).
- **Focus.** Facts adds no tab stop. A link in a value keeps its own focus ring from `base.css` (FR-011).

## R-04 `ocelle-empty-state` (FR-020 to FR-026)

- **Structure.** The shadow root renders `<div part="body" class="stack">` holding `<div class="visual"><slot
  name="visual"></slot></div>`, `<div class="eyebrow"><slot name="eyebrow"></slot></div>` (IQ-08 (c)), `<div
  class="heading"><slot name="heading"></slot></div>`, `<div class="text"><slot></slot></div>` and `<div
  class="actions"><slot name="actions"></slot></div>`. None of these wrappers has a role:
  they are generic and ignored. There is no heading, landmark, live region or tab stop.
- **Present parts (FR-023, SPEC-2-06, PLAN-FRESH-2-007 (a)).** A part is present while something assigned to its slot
  renders: an assigned element whose computed `display` is not `none` (it generates a box, or `display: contents`), or
  an assigned text node with non-whitespace text. Measured in round 2: a slotted `<div hidden>` is in
  `assignedNodes()`, and removing `hidden` fires no `slotchange`, so counting assigned nodes alone would keep a hidden
  part present (its neighbour keeping a `margin-block-end`, a gap FR-023 forbids) and miss a later toggle. The flags
  (`has.visual`, `has.eyebrow`, `has.heading`, `has.text`, `has.actions`) are therefore recomputed:
  - on `slotchange` of each slot, which also re-targets the observer below at the new assigned nodes;
  - from one `MutationObserver` on the assigned nodes: `attributes` with `attributeFilter: ["hidden"]` on assigned
    elements, and `characterData` on assigned text nodes.
  An absent part's wrapper is `display: none`. Filling or emptying a slot, or toggling `hidden` on slotted content,
  updates it. `checkVisibility()` is not used: it is WebKit 17.4, above the engine floor (16.4). Content the consumer
  hides with its own class or style rule is not observed (no attribute the observer can name); the README says to
  use `hidden` or to remove the node. A body toggles `hidden` on a slotted action (US2-9), and the plant "the `hidden`
  observer removed" must fail it.
- **Alternatives (PLAN-FRESH-2-007), not chosen by the operator.** (b) Keep counting assigned nodes and document that
  a hidden slotted element counts as present; (c) a flex `gap` with `display: contents` wrappers, so hidden content
  adds no space by construction, which may not reproduce R-04's per-pair gap table.
- **Gaps between present parts (FR-021, FR-023, PLAN-CORRECTNESS-1-009).** The column has no `gap`. Each present part
  except the last present one carries a `margin-block-end`, chosen by that part (the previous present part of the
  pair); the last present part has none, and no part has a `margin-block-start`. So the first present part starts at
  the block padding edge, the last ends at it, and an absent part adds nothing. The element marks the last present
  wrapper with an internal class from the `has` flags. Every pair that can become adjacent has a named gap:

  | Adjacent pair (upper, lower) | Default | Panel |
  |---|---|---|
  | visual, eyebrow | `--ocelle-space-3` | `--ocelle-space-5` |
  | visual, heading | `--ocelle-space-3` | `--ocelle-space-5` |
  | visual, text | `--ocelle-space-3` | `--ocelle-space-5` |
  | visual, actions | `--ocelle-space-3` | `--ocelle-space-5` |
  | eyebrow, heading | `--ocelle-space-1` | `--ocelle-space-2` |
  | eyebrow, text | `--ocelle-space-2` | `--ocelle-space-3` |
  | eyebrow, actions | `--ocelle-space-2` | `--ocelle-space-3` |
  | heading, text | `--ocelle-space-2` | `--ocelle-space-3` |
  | heading, actions | `--ocelle-space-2` | `--ocelle-space-3` |
  | text, actions | `--ocelle-space-4` | `--ocelle-space-6` |

  The visual's margin is the same whichever part follows it, so the eyebrow rows add no rule to the visual. The
  eyebrow's margin is the only one that depends on the part below it (the heading, or the text or actions), so the
  element marks the eyebrow wrapper with an internal class from the `has` flags when a heading is present, as it marks
  the last present part. The eyebrow sits close to the heading it introduces (`space-1`, panel `space-2`), and with no heading it is followed by
  the heading's gaps to the text and actions (IQ-08 (c), FR-025). Each panel value is larger than the default's.

- **Default variant (FR-021).**
  - Centred column (`display: flex; flex-direction: column; align-items: center; text-align: center`), block padding
    `--ocelle-space-6`.
  - Gaps as in the table.
  - Heading: `::slotted([slot="heading"])` at `--ocelle-font-size-lg`, `--ocelle-font-weight-strong`,
    `--ocelle-color-ink`, `margin: 0`.
  - Text: `--ocelle-color-ink-muted`, `--ocelle-font-size-md`, with the measure capped by `--ocelle-measure-reading`.
  - Eyebrow (IQ-08 (c), FR-025): `::slotted([slot="eyebrow"])` at `--ocelle-font-sans`, `--ocelle-font-size-xs`
    (12 px), `--ocelle-font-weight-medium`, `--ocelle-color-ink-muted`, `text-transform: uppercase` and `margin: 0`.
    `ink-muted` is declared as text on every main ground, so no contrast row is added (SC-004). No letter spacing:
    the tokens have only `--ocelle-tracking-display` (a negative display tracking), which does not fit, and 011's or
    012's eyebrow tokens do not exist yet; switching to them later is a baseline change in its own pull request. The
    inventory's mono eyebrow stays sans (constitution II). The same values in the panel variant.
  - Body (IQ-09 (b), FR-026): `::slotted(:not([slot]))` has `margin-block: 0`, which removes the user agent's 1em
    paragraph margins (`base.css` resets them only inside `[data-ocelle-prose]`). The text wrapper is `display: flex;
    flex-direction: column; gap: var(--ocelle-space-2)`, in both variants: `::slotted()` takes a compound selector
    only, so no sibling rule can put a margin between two slotted children, and a flex gap separates the children
    without a margin on the first or last. Each assigned element, and each run of assigned text, is then a block of
    its own (a flex item); inline content meant to flow together (text with a link, an identifier span) goes in one
    element, which the README says. The gap is `--ocelle-space-2`, the smallest step that separates two paragraphs
    visibly at the body size, and the same in the panel (the panel's rhythm is between parts, FR-022). The spec
    calls this wrapper's box the default-slot area (FR-026, US2-11): the body's first line starts at its block start
    and its last line ends at its block end. It is not the public `body` part, which is the whole centred column
    (`<div part="body" class="stack">`) with the padding and every other part in it; US2-11's oracle reads the
    `.text` wrapper's box, or the first and last slotted elements' edges against it (analysis I2).
- **Panel variant (FR-022, operator Q2: existing tokens).**
  - Block padding `--ocelle-space-10`.
  - Gaps as in the table.
  - Heading at `--ocelle-font-weight-medium` (500, lighter than 600). The heading size stays `--ocelle-font-size-lg`.
  - Each gap is larger than the default's and the weight is lighter, which is the order the spec fixes.
- **A progress bar in `visual` (FR-021, US2-7, PLAN-FRESH-1-005 (a)).** The visual wrapper spans the column
  (`align-self: stretch`) and centres its content (`display: flex; flex-direction: column; align-items: center`), so
  an icon stays centred. A slotted `ocelle-progress` is as wide as the column, capped at the reading measure:
  `::slotted(ocelle-progress) { inline-size: 100%; max-inline-size: var(--ocelle-measure-reading); }`. Without this the
  centred column shrinks the bar to its 12ch minimum (a 96 px stub in a 600 px panel, measured). US2-7 asserts the
  bar's inline size equals the smaller of the column's content-box inline size and `--ocelle-measure-reading`.
- **Actions (SPEC-2-07).** The actions wrapper is `display: flex; flex-wrap: wrap; justify-content: center; gap:
  var(--ocelle-space-2)`. Several buttons wrap at 320 px without horizontal overflow.
- **Ground.** Neither variant paints a background (FR-021). It sits on its container's ground.
- **Cascade.** The heading's look comes from `::slotted()`, which beats the user-agent heading styles but not a
  page's own author rules on the heading. The same holds for the eyebrow's type and the body's margin reset: a page
  rule on the slotted content wins. `base.css` styles headings only inside `[data-ocelle-prose]` (a
  zero-specificity `:where()`), so outside prose the element's rules apply. The README says a page rule on the slotted
  heading wins, by design: the consumer owns its heading. This is not `!important` (unlike the icon slot), because
  overriding a heading's look is a legitimate consumer need.
- **Loading panel (US2-7).** The README's mapping gives `.sk-empty-state` loading as `variant="panel"` with an
  indeterminate `ocelle-progress` in `visual`.
- **Card chrome (IQ-07 (a)).** Neither variant paints a ground or a border (FR-021). The consumers' card, message card
  and ops card (card fill, radius, padding, a border dashed or solid with the parent's `aria-busy`) stay the
  consumer's own card around the element; the busy cue inside it is the slotted `ocelle-progress`. The dashed card of
  the refusal and state blocks belongs to the #509 panel-paint family, not this mission. The README mapping says so.
- **Panel heading (IQ-06 (a)).** FR-022 follows #510's text: `--ocelle-font-weight-medium` (500), lighter than the
  default's 600, not the E-13 code's bold display face. A consumer whose card heading was bold sees it change; the
  README mapping says so.
- **A focusable loading heading (IQ-11 (b)).** The consumer's own `<h2 tabindex="-1">` goes in the `heading` slot,
  with the bar in `visual`, and the consumer moves focus to the heading. The element adds no tab stop (FR-024); the
  slotted heading keeps its own. The README's progress section warns against a `role` or `tabindex` on the bar's
  host (R-05).

## R-05 `ocelle-progress`: ElementInternals progressbar (FR-030 to FR-032)

**Decision.** The host is the progressbar, through `ElementInternals` (spike B3):
- `internals.role = "progressbar"`;
- `internals.ariaValueMin = "0"`, `ariaValueMax = String(effective max)` (PLAN-CORRECTNESS-1-015: never the raw
  `max`, so an invalid or non-positive `max` exposes 100);
- `ariaValueNow = String(effective value)`, or `null` when indeterminate;
- `ariaValueText` = `value-text` when determinate and not empty, else `null`;
- `ariaLabel = label || null`.

The shadow root draws the track and fill as `<div part="track"><div part="fill"></div></div>`, plus, with
`show-label`, `<span part="label">` and `<span part="value-text">` (R-06). It has no role of its own: progressbar
children are presentational.

**Measured** (spike B3):
- one `progressbar` node with name, value, min and max;
- indeterminate shows no value;
- a host `aria-label` overrides `internals.ariaLabel`, which is the library's Host ARIA rule and constitution III (host
  ARIA reaches the control);
- no extra node.

**Alternatives rejected.**
- **B1, native `<progress aria-label>` in the shadow root.** The labelled cases are correct, but a host `aria-label`
  does not name the bar. It adds a `generic "Host name"` node around it, and axe reports `aria-prohibited-attr`
  (serious). Forwarding the host's `aria-label` into the shadow keeps the extra generic node and the axe finding
  unless the host attribute is removed, and removing a consumer's attribute is rewriting it.
- **B2, `role="progressbar"` div in the shadow root.** The same host-label problem as B1.

**Costs of B3, recorded.**
- axe does not see ElementInternals roles. It cannot check the bar's name on any story (no rule applies), and a
  host `aria-label` gets a false `aria-prohibited-attr` (serious), in this library's stories and in consumers' own axe
  runs.
- So the name, value, min, max and indeterminate state are proven by this mission's accessibility-tree tests in both
  harnesses (US3-1 to US3-4, US3-10, US3-11), not by axe.
- **Every story is checked for a name (PLAN-A11Y-SECURITY-1-005).** The story test reads the accessibility tree of
  every story and asserts that each progressbar node in it has a non-empty name: the progress stories and the
  empty-state panel-loading story, and any later story holding a bar. A plant (one story's `label` removed) must fail
  it.
- No story sets a host `aria-label`. The host-label override (US3-10) is a browser test only, beside the unnamed state
  (US3-11, FR-050). This keeps #10's `axe` gate free of a false positive with no exception entry. Both states, with
  `ocelle-fact` outside `ocelle-facts`, are the plan's one Complexity Tracking row against constitution V (operator,
  tasks gate, C1), with its sunset: stories once the pinned axe-core reads ElementInternals ARIA.
- **README.** It recommends `label` as the way to name a bar, says a host `aria-label` also names it (Host ARIA) but
  makes axe report `aria-prohibited-attr` in a consumer's own audit, a false positive of axe with ElementInternals,
  and says that axe does not check the bar's name, so a consumer's tests should.
- #10's `axe` gate (on `main`) runs on the progress stories and passes, but without testing the name.
- **A bar named by a nearby heading (IQ-10 (a)).** The consumer passes the heading's text as `label`; no ID reference
  is used, and a host `aria-labelledby` is neither specified nor measured. The README says so beside `label` and the
  host `aria-label`.
- **No role or tab stop on the host (IQ-11 (b)).** The host is the progressbar through ElementInternals, so a `role`
  attribute on it replaces the progressbar role (the bar is lost), and a `tabindex` makes the bar a tab stop, against
  FR-039. The README warns against both and points to the empty state's `heading` slot for a focusable loading
  heading (R-04); a readme-test statement proves the wording.
- **Content inside the element (IQ-15 (b)).** The shadow root has no `<slot>`, so light-DOM content (a consumer's
  "7/12" fallback text) is not assigned: after upgrade it is neither rendered nor in the accessibility tree, and the
  bar's name and value are the element's own. Before upgrade the element is an unknown inline element and its text
  shows. The README states both halves. A browser body proves the second: a bar with `label="Tasks done"` holding the
  text "7/12" has, after upgrade, no client rect for that text node, its text absent from the page's `innerText`, and
  no accessibility node with the text "7/12", paired in the same body with the bar's progressbar node named "Tasks
  done" with value 7. Plant: a default `<slot>` added to the shadow root (the text shown and exposed).

**`value-text` (FR-031, SPEC-2-01, SPEC-2-02).** It is exposed only while the bar is determinate. An indeterminate
bar exposes no value text, even when `value-text` is set, because there is no value to describe. When the value is
clamped, `value-text` is still exposed as given (the consumer's words). The element never formats numbers. Without
`value-text`, Chromium computes the value text (the percentage) itself.

**Reading the value properties (PLAN-TESTABILITY-1-006).** `AxNode` in `test/commands.ts` carries role and name only.
It is extended, in both harnesses, with `value`, `valuemin`, `valuemax` and `valuetext`, read from the platform's
accessibility tree, with its own test in `test/commands.test.ts` (a native `<progress>` and an ElementInternals bar,
each read present and absent). Every absence assertion (US3-4's "no current value", value text ignored while
indeterminate) sits in a body that also reads the same property present for a determinate bar.

**Measuring `valuetext`.** CDP's `Accessibility.getFullAXTree` returned an empty `valuetext` in every case, including
a light-DOM control (spike B). Phase 3's spike picks a platform oracle before the red commit: Playwright's
`locator.ariaSnapshot()` or CDP `Accessibility.getPartialAXTree` on the node. The `aria-valuetext` reflection read
from `internals` is not an oracle of exposure and is not used (constitution VIII: an assertion on the unit's own state
is no stand-in). If neither platform read exposes the value text, US3-3 goes to the operator before the red commit;
its oracle is not weakened.

**Value parsing (FR-032).**
- `value` and `max` are properties of type `number | undefined` (contracts/elements.md) with custom attribute
  converters.
  - An absent, empty or whitespace-only attribute, or a property set to `undefined` or `null`, gives no value
    (indeterminate).
  - A non-finite number (`NaN`, `"abc"`, `Infinity`) gives no value.
- The effective max is `max` when finite and above 0, else 100.
- The effective value is `min(max(value, 0), effective max)`.
- Nothing throws: the converters never throw, and `render()` reads only the effective values.

## R-06 `ocelle-progress`: look, motion and contrast (FR-033 to FR-038)

**Track.**
- `position: relative; overflow: clip` (PLAN-CORRECTNESS-1-006): the moving mark is never painted outside the track,
  and it adds no scrollable overflow to the element or the page. Without the clip a 40% mark at the end of its sweep
  gives a 320 px page a scroll width of 403 px (measured).
- `block-size: var(--ocelle-space-2)` (8 px). With `size="compact"`, `--ocelle-space-1` (4 px).
- `background-color: var(--ocelle-color-inset)`, `border-radius: var(--ocelle-radius-1)`. **Why `radius-1`
  (constitution II, analysis A1).** Principle II names `radius-2` as the one general radius and makes the token
  contract binding; that contract (`packages/tokens/README.md`, brand rules) reserves `radius-1` for small marks. The
  track is a small mark, not a surface: it is 8 px (compact 4 px) high and holds no text or control, like the dots and
  focus corners `radius-1` (2 px) is declared for in `packages/tokens/src/source.ts`. On the 8 px track `radius-2`
  (4 px) is half the block size, which would round the ends fully into the pill shape the brand rules keep for state
  pills; `radius-1` keeps it a bar with softened corners. So the track takes the small-mark radius, as the contract
  allows, and no radius is added; the constitution's wording is not changed.
- **Boundary (FR-036, PLAN-A11Y-SECURITY-1-002 (a)).** `box-shadow: 0 0 0 var(--ocelle-border-width)
  var(--ocelle-color-control-border)`, an outline drawn outside the box that takes no layout space and is not clipped
  by the track's own `overflow`. Zero is a permitted raw value. `color-control-border` is declared and checked at 3:1
  or more on canvas, sheet, pane, panel, inspector and rail only. On `color-inset`, `color-accent-low`,
  `color-hover-bg` and the five state grounds it is below 3:1 (2.80 to 3.21 light, 2.88 to 3.56 dark; `pairs.json`
  rows marked excluded under "#5 rule 1 extended"), and on those grounds the library draws boundaries in
  `color-accent-strong`. `ocelle-progress` follows that rule: with `ground="tinted"` the boundary is
  `var(--ocelle-color-accent-strong)`, which is declared and checked on all of them (4.11 to 4.71 light, 6.13 to 7.56
  dark) and, as `color-focus`, on every main ground. The README says which `ground` to use: the default on canvas,
  sheet, pane, panel, inspector and rail; `tinted` on inset, accent-low, hover-bg and the state grounds, and on a bar
  in a row that can be hovered or selected (its ground changes to hover-bg or accent-low). The `ground` variant rule
  sits inside `@media not (forced-colors: active)`.
- The track fills the host's inline size, with `min-inline-size: var(--ocelle-measure-cell)`, so a compact bar beside
  a long label keeps a visible length (edge case).

**Fill.**
- `position: absolute; inset-block: 0; inset-inline-start: 0`, `background-color: var(--ocelle-color-accent)` with
  `box-shadow: inset 0 0 0 var(--ocelle-border-width) var(--ocelle-color-accent-strong)`. This gives the
  `accent-strong` mark on every edge of the filled part, in both themes and in every variant (FR-036, SPEC-2-03).
- **Direction (FR-038, PLAN-CORRECTNESS-1-004).** One mirroring mechanism, logical properties, with no `scale`
  anywhere: `inset-inline-start` puts the fill and the marks at the inline start, which is the right edge under
  `dir="rtl"`, and the indeterminate sweep uses a direction-specific keyframes rule (below). The first design mirrored
  twice (a logical inset and `scale: -1 1` on the track): reproduced, the RTL mark at `translateX(-100%)` sat at
  [160, 320] of a 400 px track, mid-track.
- The determinate fill's inline size is set in `updated()` through the CSSOM:
  ``fill.style.inlineSize = `${fraction * 100}%` ``. A CSSOM write is not a `style-src` violation under the strict CSP
  (only parsed `style` attributes and `<style>` elements are), so the template keeps no `style` attribute (constitution
  IV, README § Element conventions). The fraction is `effective value / effective max`. The browser-build fixture
  tests assert zero CSP violations with a determinate bar on the page.
- **Leaving the determinate state (PLAN-CORRECTNESS-1-005).** Whenever the bar is not determinate, `updated()` calls
  `fill.style.removeProperty("inline-size")`, so the stylesheet's 40% mark applies. An inline declaration beats the
  stylesheet, and without the removal a bar whose value is removed (FR-032) would keep the last fraction as its mark.
- **No width transition (PLAN-FRESH-3-003 (b)).** The fill has no `transition`: a value change, and leaving or
  entering the determinate state, change the fill's inline size at once. Round 3 measured why: with a 200 ms
  `inline-size` transition (`--ocelle-motion-base`), the fill at 7/12 set to 75% read 233 px of 300 px one frame
  later, and after the value was removed it still read 300 px, not the 40% mark's 160 px, with a running
  `CSSTransition` in `getAnimations()`. That contradicted US3-2's 75% read, the value-removed body and the
  after-window body. The spec words the transition "if any" (Edge Cases, Rapid value changes), and the operator chose
  to drop it. US3-2 reads the fill at once, and with `animations()` empty (the bar is determinate), so a transition
  added later fails it. The value-removed body reads the 40% mark at once and asserts no `CSSTransition` on the bar,
  not `animations()` empty: without reduced motion the bar is then indeterminate in a new loading episode and its
  mark correctly runs the sweep, a `CSSAnimation` on `transform` that leaves the inline size at 40%. The plant "a
  200 ms `inline-size` transition on the fill" must fail US3-2 and the value-removed body (contracts/checks.md
  § Oracles and § CSS-only behaviours).

**Indeterminate: a bounded sweep that ends on the still mark (FR-033, PLAN-A11Y-SECURITY-1-001 (a)).**
- The mark's own geometry is the still mark: 40% wide (`inline-size: 40%`) at `inset-inline-start: 30%`, the middle
  of the track (30% to 70%). It reads as "in progress" and cannot be mistaken for a determinate fill, which always
  starts at the inline start. It keeps the `accent-strong` edge.
- The sweep is an animation on top of that geometry: `transform: translateX(-175%)` to `translateX(175%)` (the mark
  enters fully from the inline-start side, [-40%, 0], and leaves fully at the inline-end side, [100%, 140%], clipped by
  the track), `animation-duration: calc(var(--ocelle-motion-base) * 7)` (1400 ms), `--ocelle-easing-standard`,
  `animation-iteration-count: 3` and `animation-fill-mode: none`. Under `:host(:dir(rtl))` the mark uses a second
  keyframes rule with the signs swapped (`175%` to `-175%`), so the sweep runs from the inline start (right) to the
  inline end.
- **WCAG 2.2.2.** The indeterminate bar may be shown beside an interactive page for minutes, so the preload exemption
  does not apply. Three loops of 1400 ms are 4.2 s, under the 5 s of 2.2.2; with `animation-fill-mode: none` the mark
  then rests on its own geometry, the still mark, without any further motion. The bar still shows that work is going
  on. The total is `--ocelle-motion-base` × 7 × 3 = `--ocelle-motion-base` × 21, so a consumer that overrides
  `--ocelle-motion-base` above 238 ms (5000 / 21) takes the sweep past 5 s; the README says so.
- **One sweep per loading episode (PLAN-FRESH-2-005 (a), amended by PLAN-FRESH-3-004 (a)).** A CSS animation starts
  on every insertion and whenever an element leaves `display: none`. Per node, an htmx poll that swaps the loading
  region, or a Svelte `{#if}`, would start a fresh 4.2 s sweep each time, so motion would run as long as the polling
  lasts: 2.2.2's 5 s would hold per animation but not for what the user sees (constitution I names htmx pages as
  hosts). Anchoring the sweep to the document (round 2) fixed that, but in a client-routed Svelte shell or a Tauri
  webview the document lasts the whole app session, so the first indeterminate bar after launch used the only sweep and
  US3-4's moving mark was not seen again for that session (round 3). The sweep is therefore anchored to a loading
  episode: a run of time in which at least one indeterminate bar is connected to the document.
  - **The episode record.** It is kept on the `document` under `Symbol.for("ocelle.progress.sweep")`, so two copies of
    the package on a page share it: the episode's sweep start, and the set of connected indeterminate bars. It is not
    public surface: no manifest entry, no README name.
  - **Membership.** A bar joins the set when it is connected while indeterminate, or becomes indeterminate while
    connected; it leaves when it is disconnected or becomes determinate. A bar hidden with `display: none` (its own
    `hidden`, or an ancestor's) stays connected and stays in the set, so a re-show continues the episode. (The lens's
    wording "connected and shown" is read this way: the option itself requires that a re-show from `display: none`
    does not reset.)
  - **The episode start.** When the first bar's mark animation starts while the record has no start, the element
    records `document.timeline.currentTime` as the episode's sweep start.
  - **Each animation joins it.** Whenever the mark has a CSS animation (in `updated()`, after `getAnimations()` on the
    mark brings its style up to date, and on every `animationstart` event from the mark, which also covers a node
    leaving `display: none`, an ancestor re-shown and a direction change that swaps the keyframes), the element sets
    that animation's `startTime` to the episode start through the Web Animations API. This is not a style write, so
    the strict CSP is unaffected (constitution IV).
  - **After the window.** A bar inserted, re-shown or made indeterminate again during the episode but after its start
    plus the sweep's active duration has a `startTime` that puts its animation past its end: with
    `animation-fill-mode: none` it shows the still mark at once, with no running animation. A bar inserted inside the
    window continues the sweep where the episode's sweep is.
  - **The episode ends at a frame boundary.** When a bar leaves the set and the set is empty, the element requests an
    animation frame; in that callback, if the set is still empty, it deletes the episode start. An htmx swap removes
    the old bar and inserts the new one in one task, and a determinate-then-indeterminate change within one task never
    leaves the set empty at a frame boundary, so neither ends the episode, and the 2.2.2 bound holds for one continuous
    loading episode. A new operation after every indeterminate bar has been gone (removed or determinate) for a frame
    boundary gets its own sweep.
  - **Cost, accepted with the option.** Motion is bounded per episode, not per page: a bar removed and re-inserted
    with a frame or more between (a Svelte `{#if}` that flaps, a swap done in two tasks), or one alternating between
    determinate and indeterminate with gaps of a frame or more, starts a new sweep each time. The README says so, and
    tells consumers to keep one bar indeterminate across one continuous wait (keep the node, or swap it in one task).
  - **Tests.** US3-14 replaces the bar 2 s after the first insertion (the driver's `replace`, one task) and asserts no
    running animation on the page's bars 5 s after the first insertion, with the still mark's geometry; the plant "the
    shared start dropped" (each animation keeps its own start) must fail it. US3-15 removes the only bar after its
    sweep has ended, waits two animation frames (the driver's `frames`), inserts a new indeterminate bar and asserts a
    running sweep on it; the plant "the episode never ends" (the start kept for the document) must fail it. Each
    harness's `mount` deletes the episode record, so every body starts as a fresh page (contracts/checks.md § Driver
    additions).
- **Alternatives, not chosen by the operator.** PLAN-FRESH-2-005: (b) per-node restarts, with the README telling
  consumers to keep the node across polls; (c) one sweep per region or consumer-set key, which adds public surface.
  PLAN-FRESH-3-004: (b) keep one sweep per document and state that in a single-page or webview shell it runs once per
  app session; (c) one sweep per stable region or per consumer-set key, which adds public surface.
- `translateX(<percentage>)` and the bare integer of `animation-iteration-count` need a recorded `token-only`
  allowance (R-10, PLAN-CORRECTNESS-1-001 (a)).
- No new motion token is needed: `calc()` with a number factor on a token passes `token-only`, and it resolves to 0 ms
  under reduced motion because `--ocelle-motion-base` does (FR-040: no new token where an existing one fits).

**Reduced motion.** `generate.ts` sets `--ocelle-motion-base` to `0ms` under reduced motion, so the sweep's duration and
active duration are already 0 and the mark rests on the still mark. Inside `@media (prefers-reduced-motion: reduce)`
the mark also has `animation: none`, which changes only the computed `animation-name`: removing it is an equivalent
change, not a plant (PLAN-TESTABILITY-1-009). The behaviour that can regress is the still mark's geometry: its plant
is "the still-mark inset removed" (`inset-inline-start: 30%` deleted), which US3-5 and US3-12 must fail on.

**Contrast (FR-036, SC-004, PLAN-CORRECTNESS-1-007 (b)).** The mark is `accent-strong`. Every pair it makes is already
declared and checked in `packages/tokens/contrast/pairs.json`:

| Mark against | Light | Dark | Row in `pairs.json` |
|---|---|---|---|
| the track (`color-inset`) | 4.11 | 6.28 | `color-accent-strong` on `color-inset` |
| canvas, panel, inspector | 4.80 | 8.30 | `color-focus` on each |
| sheet | 5.33 | 7.44 | `color-focus` on `color-sheet` |
| pane | 5.56 | 7.78 | `color-focus` on `color-pane` |
| rail | 4.43 | 7.78 | `color-focus` on `color-rail` |
| accent-low | 4.31 | 6.13 | `color-accent-strong` on `color-accent-low` |
| hover-bg and the state grounds | 4.11 to 4.71 | 6.74 to 7.56 | `color-accent-strong` on each |

`color-focus` is `var(--ocelle-color-accent-strong)` with `ref: ["color-accent-strong"]` in `source.ts`, so its rows
check the same colour on canvas, sheet, pane, panel, inspector and rail. No row is added and `@ocelle/tokens` does not
change. The pairing test (contracts/checks.md § Contrast) ties the shipped progress stylesheet to these rows: the
mark and edge token is `color-accent-strong`, `color-focus`'s `ref` is `color-accent-strong` in both themes, the
track's ground token is `color-inset`, and the boundary tokens are `color-control-border` (default) and
`color-accent-strong` (`ground="tinted"`), each on the grounds its rows declare.

**Forced colours (FR-037, PLAN-A11Y-SECURITY-1-006).** Inside `@media (forced-colors: active)`:
- the track has `outline: var(--ocelle-border-width) solid CanvasText` and `background-color: Canvas` (its
  `box-shadow` is forced to none: the track keeps `forced-color-adjust: auto`);
- the fill has `background-color: Highlight`, `forced-color-adjust: none` on the fill only, so `Highlight` survives,
  and `box-shadow: none`, because `forced-color-adjust: none` keeps author box shadows and the `accent-strong` edge
  would otherwise be painted inside the user's palette;
- the moving and still marks use the same rule.

**Host display (IQ-12 (a)).** `:host { display: block }`, so the bar fills its container's inline size by
default. A consumer that places a bar inside a line of text (a list row while a project loads) sets the host's
`display` (for example `inline-block`) and inline size from outside (host styles are the consumer's); the track keeps
its `min-inline-size: var(--ocelle-measure-cell)`. The README says so. A body reads the host's computed `display` as
`block`, and, in the same body, a host given `display: inline-block; inline-size: 12rem` by the page's own rule sits
on the line of the text around it at 12rem.

**Labelled variant (FR-035, PLAN-CORRECTNESS-1-015, IQ-13 (b)).**
- With `label` and `show-label`, a row above the bar (default size) or beside it (compact) shows `<span part="label">`
  in `--ocelle-color-ink` at `--ocelle-font-size-sm` with `font-variant-numeric: var(--ocelle-figures)`.
- When determinate and `value-text` is set, `<span part="value-text">` follows in `--ocelle-color-ink-muted` with
  `--ocelle-figures`, at the row's inline end (IQ-13 (b)). At the default size the row is `display: flex; flex-wrap:
  wrap; align-items: baseline; gap: var(--ocelle-space-2)` and the value text has `margin-inline-start: auto`, so the
  label sits at the inline start and the value text at the inline end, aligned with the track's inline end below it,
  and on its own line at the inline end when the row wraps. These are the shell's and Pipeline's arrangement (R-11,
  "progress grid layout"). Logical properties mirror it under `dir="rtl"`.
- Both are `aria-hidden="true"`, because the host already carries the name and value text, and the visible text must
  not be read twice.
- Without `value-text`, no number is shown: the element does not format numbers (SPEC-2-01).
- In compact, the row is `display: flex; flex-wrap: wrap; align-items: center; gap: var(--ocelle-space-2)`, holding
  the label, the track (`flex: 1`) and the value text, in that order, so the value text is at the row's inline end
  (IQ-13 (b)). A long label wraps and the bar keeps `min-inline-size: var(--ocelle-measure-cell)`.
- Bodies: US3-10 asserts, at the default size with `value-text`, the label's inline start at the track's inline start
  and the value text's inline end at the track's inline end; US3-9 asserts, in compact, the value text's box after the
  track's on the same line. Plant: the value text's `margin-inline-start: auto` removed (it follows the label), which
  US3-10 must fail.

**Busy vocabulary (FR-033).** This goes in the README, as the spec words it. #7's status indicator is coordinated
through 012's spec. Nothing here depends on it.

## R-07 Tokens and base styles (FR-040, FR-008, FR-012)

No new token.
- The panel rhythm uses existing tokens (operator Q2).
- The progress track uses `color-inset`, `color-control-border`, `color-accent-strong`, `space-2`, `space-1`,
  `radius-1` and `measure-cell`.
- The loop period is `calc(var(--ocelle-motion-base) * 7)`.
- The facts threshold is the hook `--ocelle-facts-stack-below`, which defaults to existing tokens
  (`calc(var(--ocelle-space-10) * 6)`, R-02); the value scale is
  the hooks `--ocelle-facts-value-size` and `--ocelle-facts-value-line-height`, which default to existing tokens.

`@ocelle/tokens` does not change (PLAN-CORRECTNESS-1-007 (b)): no contrast row, no declared ground and no pinned count
moves. Every pair is checked by an existing row (R-06).

`@ocelle/styles` changes in phase 1, in `base.css`, with tests, README and CHANGELOG:
- the compact and regular rules of the density hook also set `--ocelle-facts-value-size` and
  `--ocelle-facts-value-line-height` (R-03, PLAN-CORRECTNESS-1-002 (b));
- the pre-upgrade rule `:where(ocelle-facts:not(:defined) > ocelle-fact:not([hidden])) { display: block; }`,
  specificity (0,0,0), which leaves a hidden fact hidden (R-01, PLAN-FRESH-1-009 (a), PLAN-FRESH-2-002).
Both are additions to documented base-style behaviour (MINOR, constitution VII).

## R-08 Test harnesses, stories and #10 (FR-050 to FR-055, I3)

- **Harnesses.** These are 005's (`packages/elements/README.md` § Files and tests).
  - Scenario bodies live in `test/scenarios/facts.ts`, `empty-state.ts` and `progress.ts`, and run in process in the
    `elements` project (the one Stryker mutates) and on the built browser build on strict-CSP fixture pages
    (`test/browser/*.test.ts`).
  - The browser commands `axTree` and `emulateForcedColors` already exist.
  - **Reduced motion (PLAN-CORRECTNESS-1-013).** Every `page.emulateMedia` call in Playwright 1.64 sends
    `Emulation.setEmulatedMedia` with all four features, `prefers-reduced-motion` as `""` unless Playwright's own
    `reducedMotion` is set; `emulate()` in `test/commands.ts` calls `page.emulateMedia` for forced colours, so a reduced
    motion set over raw CDP would be cleared. The new command `emulateReducedMotion` therefore calls
    `page.emulateMedia({ reducedMotion })` in the same `emulate()` helper. The shared driver
    (`test/scenarios/driver.ts`) gains `reducedMotion(mode)`, implemented in `test/in-process.ts` and
    `test/browser/driver.ts`. Each progress test file resets it in `afterEach`. Its test in `test/commands.test.ts`
    asserts `matchMedia("(prefers-reduced-motion: reduce)").matches` after the command, still after an
    `emulateForcedColors` call, and false after the reset.
  - **Other driver additions (PLAN-TESTABILITY-1-013).** The driver has no viewport resize, page scroll width, Tab
    press, focused-element read, copy, running-animation read or AX value properties, and `test/browser/serve.ts` fixes
    the viewport at 1280 × 800. Each is added to the driver interface and both harnesses, with its own test (contracts
    /checks.md § Driver additions).
- **Stories.** In `storybook/stories/<element>.stories.ts`, in light and dark (#10's harness captures both):
  - **facts**: default, compact, stacked (a 300 px wrapper), `layout="columns"` in a shrink-to-fit wrapper,
    `layout="stacked"` in a wide wrapper, identifier wrap, missing label, missing value, link in value, right-to-left,
    inside a compact region; and for `layout="grid"` (IQ-05 (b), #280's required stories that fit this library): the
    four-field strip (a wide wrapper), two columns (a 600 px wrapper), one column (a 300 px wrapper), one fact, three
    facts, eight facts, a long label and a long identifier value with `wrap="anywhere"`, a link and a status value, the
    consumer's explicit unavailable value ("Not recorded"), compact density, and right-to-left. #280's forced-colours
    case is US1-8's browser body (#10's gates capture no forced-colours context), its dark and light modes are the
    theme global, and its 200% zoom is US1-16's 640 px body;
  - **empty-state**: default, panel, panel loading (with an indeterminate `ocelle-progress`), heading only, actions
    only, several actions at 320 px, refusal with an eyebrow (an eyebrow, an `<h1>`, a sentence, a path with
    `data-ocelle-wrap="anywhere"` and an action; IQ-08 (c)), several body paragraphs (IQ-09 (b));
  - **progress**: determinate, zero, full, indeterminate, compact, labelled, labelled compact, value text,
    right-to-left, on a tinted ground (`ground="tinted"` on `color-inset`). The "value text" story is a labelled bar
    (`label`, `show-label`) at the default size with a determinate `value` and `value-text`, so the label row with
    the value text at its inline end has a baseline; "labelled compact" also carries a determinate `value` and
    `value-text`, so the compact row (label, bar, value text) has one (IQ-13 (b), FR-035; analysis G4). No story is
    added. The indeterminate story is captured with
    reduced motion by #10's `visual` and `axe` contexts, which gives a still, deterministic baseline.
  - No story has a hover or press state, so none declares one (#10 FR-031: a state is declared with
    `parameters: { ocelle: { pointer: { hover | press: "<selector>" } } }`); each variant and state is its own
    story, and the theme global gives light and dark, so no story is written twice.
  - Each file's meta title is `Elements/<tag>` (`Elements/ocelle-facts`, `Elements/ocelle-empty-state`,
    `Elements/ocelle-progress`), as `icon.stories.ts` does, so the story ids, and the baseline names
    `storybook/baselines/<story-id>.<theme>.png`, are `elements-ocelle-facts--<story>` and so on.
  - Wrapper widths (the 300 px, shrink-to-fit, wide and 320 px wrappers, the `color-inset` ground) are set by
    `data-story` rules in `storybook/.storybook/stories-layout.css`, as the base-style stories' layout is, with no
    `style` attribute.
  - Story text is Latin script, which Schibsted Grotesk draws: #10's `font` rule fails any text drawn in another
    face, so the right-to-left stories set `dir="rtl"` on Latin content, as `icon.stories.ts`'s set does, and
    `lang` with a non-Latin script is left to the browser tests.
  - There is no story for the unnamed progress (FR-050), for a host `aria-label` on progress (R-05) or for
    `ocelle-fact` outside `ocelle-facts` (FR-050). These three states are the plan's one Complexity Tracking row
    (constitution V, approved by the operator at the tasks gate); each is proven by shared browser bodies in both
    harnesses.
- **Story test (I3).** `storybook/test/integration/elements-stories.test.ts` is extended in each phase's red commit,
  before green. It checks each new story is present in the built Storybook and renders its element in light and dark,
  with no outside request, as the merged test does for 005's stories (since #10 the Storybook is served with no CSP
  and no violation is counted; run-time CSP is proven on the element package's strict-CSP fixture pages, 006
  FR-020, FR-023), and three story-level criteria (PLAN-TESTABILITY-1-010, PLAN-A11Y-SECURITY-1-005): every facts story at a 320 px viewport has a page scroll width equal to the viewport
  width (SC-002); every story under reduced motion has no running animation or transition (SC-005); every progressbar
  node in every story has a non-empty name. Each is paired with a positive read (the story's element rendered with a
  non-zero size; a running animation on the indeterminate story without reduced motion). The sweep lasts 4.2 s from
  the episode start (R-06), so each motion read is taken on its own freshly loaded story page within the first
  1400 ms (PLAN-FRESH-2-009). The read without reduced motion is timed by the mark animation's `currentTime`; the
  reduced-motion read, which has no animation to time, is timed by the clock (`performance.now()` from the story's
  first render) and asserts in the same read that `prefers-reduced-motion: reduce` matches, so a missing emulation
  fails loudly instead of passing as "no running animation" (PLAN-FRESH-3-005, contracts/checks.md § Story test). `red.sh` records one red record per phase. The stories themselves are not tests and land in green.
- **#10 (FR-051, SC-003).** #10 is merged on `main` (3828d2f, `specs/006-storybook-workbench`), and `main` is merged
  into this branch (plan gate, 2026-11-13). Read from the merged files: `storybook/README.md` (the contributor note,
  006 FR-025), `specs/006-storybook-workbench/contracts/gates.md` and `contracts/container.md`,
  `storybook/a11y-exceptions.json`, `storybook/visual/container.json` and `storybook/baselines/`.
  - **Per phase.** Each phase that adds stories commits their light and dark baselines in its green commit with the
    stories, produced by `pnpm run visual:update` in the pinned linux/amd64 container (`mcr.microsoft.com/playwright`
    by digest, Node 26.13.0, `chromium_headless_shell-1248`; docker or podman). The command prints `baselines: wrote
    <n> files (<added> added, <changed> changed, <removed> removed), <bytes> bytes in total`; here `<changed>` and
    `<removed>` must be 0, since no existing story moves: `base.css`'s two new rules (R-07) only set the facts hooks
    on the density regions, which no existing story reads, and style `ocelle-fact` children of an undefined
    `ocelle-facts`, which no existing story renders. CI's "Visual regression" captures are the record: when they
    differ from the local ones, the files of the job's `visual` artifact are committed (`storybook/README.md`
    § Baselines). The phase then passes `gate:storybook-build` (`built <n> stories`),
    `gate:visual` and `gate:axe` (`axe: <runs> story-theme runs, 0 serious or critical; …`), and `gate:plants`, whose
    `pass-repository` plants of the three gates run on the repository's stories and baselines.
  - **The capture and axe contexts.** Both gates open each story in light and dark at 1280 × 800, scale 1, with
    `reducedMotion: "reduce"` (`contextOptions(theme)`), so the indeterminate progress and the panel-loading story are
    captured and audited on the still mark, and a full-page screenshot at scroll (0, 0). axe audits the whole
    document minus Storybook's harness, inside open shadow roots, and fails on serious or critical violations and on
    serious or critical incomplete results (`<rule>-incomplete`).
  - **The story list against #10's index rules.** Checked on every story of R-08's list:
    - `empty` (no box with non-zero width and height and no text in the story root): every story renders text or a
      box; the zero and indeterminate progress stories render the track, and the missing-label and missing-value
      facts stories keep their other pairs;
    - `outside-root`: no element renders outside its host, and no story appends to `<body>`;
    - `closed-shadow-root`: every element attaches an open shadow root;
    - `pointer-target`: no story declares a pointer state;
    - `render-failed` and `render-timeout`: every story's render returns markup, and the elements define themselves
      from their source modules, imported by relative path as `icon.stories.ts` does;
    - `font`: Latin text only, in Schibsted Grotesk (values use `font-sans` with `figures`; no monospace);
    - `network`, `io` and `nondeterministic`: the elements do no I/O, and with reduced motion no animation runs, so two
      captures are byte-identical.
  - **Exceptions.** No `storybook/a11y-exceptions.json` entry is needed or added: the existing entries are 006's
    `base-styles--prose-document` nodes only; facts is clean under `definition-list` and `dlitem` (R-01, rechecked
    with axe-core 4.14.0 in phase 1's spike); no story sets a host `aria-label` on progress, so axe's false
    `aria-prohibited-attr` does not arise (R-05); and the unnamed progress has no story (FR-050). A serious or critical
    finding on a story is fixed in the story or the element; an entry would need a row in this plan's Complexity
    Tracking with the operator's approval (006 FR-029), and goes to the operator.
  - **Contributor note.** The stories follow it: one story per variant and state, open shadow roots, every surface
    inside the host, `font: inherit` on form controls in a shadow root (none here: the empty-state stories' action
    buttons are slotted light-DOM content, whose font `base.css`'s `:where(button, input, select, textarea)` rule
    sets, so their labels pass the `font` rule), and run-time CSP proven in the element package's own browser tests,
    not in the Storybook.
- **Mutation (#23, PLAN-TESTABILITY-1-008).** Element source under `packages/elements/src/**` is mutated in process
  under the elements-only Stryker configuration (005 R-12). A Timeout or CompileError mutant on a changed line is
  reported and passes (007's operator decisions). Stryker does not mutate a declaration inside a `css` template (005
  `reviews/phase-4/round-1.md` R1-03), so mutation testing gives no evidence on the grid, gaps, padding, weights,
  right-to-left, forced-colours, clip, still-mark or animation rules. Each CSS-only behaviour therefore has a named
  plant, or a stated reason why its expected value differs from the browser default and from the other variant
  (contracts/checks.md § CSS-only behaviours).
- **Engines.** ElementInternals ARIA reflection (`role`, `ariaValueNow`, …) is already used by `ocelle-icon`.
  `slotAssignment: "manual"` and `HTMLSlotElement.assign()` are Chromium 86 and WebKit 16.4. `ResizeObserver` is older
  than both. `fit-content()` in grid tracks is older than both. `overflow: clip` is Chromium 90 and WebKit 16. The
  floor (Chromium 120, WebKit 16.4) does not rise. Setting a CSS animation's `startTime` (R-06) and
  `MutationObserver` (R-04) are older than the floor; `checkVisibility()` (WebKit 17.4) is not used. The README's
  Engines list adds manual slot assignment with its figures.

## R-09 Wave dependencies

- **#15 (`ocelle-scroller`, overflow region):** not needed. None of the four elements has a scroll region. Follow-on
  2's `ocelle-code-block` needs it. No part of this mission waits for #15.
- **#10:** merged on `main` (3828d2f) and into this branch; its gates and baselines apply to every phase (R-08).
- **011 / 012 eyebrow tokens:** not needed (facts labels are not eyebrows). The empty state's `eyebrow` slot (IQ-08
  (c)) uses existing type tokens (R-04); adopting the eyebrow tokens once they exist is a later baseline change.
- **012 (#7):** the busy vocabulary sentence in the README only.
- **014 (#14):** none. Facts values are not copy fields.

## R-10 `token-only` allowance (PLAN-CORRECTNESS-1-001 (a))

`gates/stylelint/token-only.ts` `functionRaw()` reports every function other than `var()` and `calc()` as raw, and a
unitless number is raw outside the properties of its `unitless` set. The facts grid and the progress sweep need four
values it rejects today, and no existing element uses them. Redesigning around them was rejected by the operator
(option (a)). The gate gains one recorded allowance, as narrow as the values:

| Value | Where it is allowed | Used by |
|---|---|---|
| `fit-content(<percentage>)` | a track of `grid-template-columns` | R-03 label column |
| `minmax(0, <flex>)` (an `fr` value) | a track of `grid-template-columns` | R-02, R-03 value column |
| `translateX(<percentage>)` | `transform`, in a rule or in `@keyframes` | R-06 sweep |
| a bare positive integer | `animation-iteration-count` | R-06 bounded sweep (PLAN-A11Y-SECURITY-1-001 (a)) |

The grid layout (IQ-05 (b), R-03) uses four `minmax(0, 1fr)` tracks written out, each the allowed `minmax(0,
<flex>)` form, so it needs no further allowance; `repeat()` stays raw and is not used.

Anything else stays raw: `fit-content(200px)`, `minmax(auto, 50%)`, `minmax(0, 200px)`, `translateX(8px)`,
`translateY(…)`, a percentage translate in any other property, and `animation-iteration-count: 2.5`. (`infinite` is an
identifier and was already allowed; the sweep does not use it.)
- **Test-first.** The unit tests in `gates/test/token-only.test.ts` (each allowed form passes, each neighbour above
  fails) are in the red commit of the phase that first needs the value: the two grid functions in phase 1, the
  translate and the iteration count in phase 3. The allowance in `token-only.ts`, its comment and its plant
  directories land in green, since `gates/plants/**` is not under the red commit's `test_pathspec`.
- **Plants** (constitution VIII, gates proven): `gates/plants/style-lint/pass-grid-fit-content`,
  `fail-fit-content-length`, `fail-minmax-auto` (phase 1); `pass-translate-percentage`, `fail-translate-length`,
  `pass-iteration-count`, `fail-iteration-count-fraction` (phase 3).
- **Documentation.** The `style-lint` row of `gates/README.md` lists the allowance and its plants, with its
  `gates-readme.test.ts` statements in the same red commit, and contracts/checks.md § Gates touched records it.
- **Names the gate checks.** The same gate rejects a `var(--ocelle-…)` reference that is neither a token nor a custom
  property `custom-elements.json` declares. The three facts hooks are declared in the manifest (contracts/elements.md),
  and `base.css` sets two of them as custom-property declarations, so the regenerated manifest lands in the same green
  commit as the `base.css` change.

## R-11 kitty-mission-ui variant inventory (FR-058, SC-001, PLAN-FRESH-2-006)

**Need.** SC-001 and FR-058 ask for a README mapping of every `.sk-facts`, `.sk-empty-state` and `.sk-progress`
variant kitty-mission-ui uses. Constitution VI makes that consumer need the driver of the elements' surface. Before
the operator's inputs, the only record in this repository was the triage record (`triage/013-data-display.md`: 183
class uses, 34, 75 and 74, with no modifiers or states) and 003's copy of the spec-kitty-design issues.

**Input the operator supplied.** At the plan gate (2026-11-13) the operator chose "Proceed, inputs later". The
operator has since supplied the inventory, read at kitty-mission-ui `c994c8ea` (2026-10-17), in
[sources/013-inputs.md](sources/013-inputs.md) Part A: the three families' modifiers and states as kitty-mission-ui
uses them, with counts, role names only and no code (constitution VI). The rows below record it, one per role name
as the source gives it (without the `sk-` prefix), with the element and variant of this mission that covers it, or
"consumer's" or "not this mission" with the reason. The rows that were gaps name the question of
[reviews/analysis/inputs-questions.md](reviews/analysis/inputs-questions.md) and the operator's decision on it
(2026-11-14, [reviews/analysis/inputs-decisions.md](reviews/analysis/inputs-decisions.md)).

**Corrected counts.** The triage figures (34, 75 and 74, 183 in all) are raw text matches in kitty-mission-ui's
`packages/mission-ui/src`: they count comments, local CSS selectors and every child class separately, so they are not
use counts. At `c994c8ea` the text matches are 34, 75 and **76** (185); the earlier 74 could not be reproduced. The
uses, counted once per place a family root is rendered (a shared helper once per caller), are **8**, **25** and
**14** (47 in all), from 7, 17 and 13 template sites. The "Uses" column below is on that rendered basis; one rendered
use can carry several rows (a modifier and a state). kitty-mission-ui has no class set by script, so a variant
changes only by template branch.

| Family | Modifier or state (role name) | Uses | Element and variant | Phase |
|---|---|---|---|---|
| `.sk-facts` | facts stacked | 2 | `ocelle-facts` with `layout` unset (it stacks below the threshold) or `layout="stacked"`, each pair an `ocelle-fact`. The inspector's shrinking inside its grid: the consumer sets `min-inline-size: 0` on the `ocelle-facts` host, as the README says (IQ-02 (a)). | 1 |
| `.sk-facts` | facts two-col | 6 | `ocelle-facts` with `layout="columns"` (or unset, at or above the threshold). The consumer drops its track override (label about 0.8fr, value about 1.2fr) and takes FR-005's columns; the README says not to restyle the columns through `::part(list)` (IQ-01 (a)). | 1 |
| `.sk-facts` | facts compact | 0 | `ocelle-facts density="compact"`. Unused by the consumer. | 1 |
| `.sk-facts` | facts term | 8 | `ocelle-fact`'s `label`, rendered as the sheet's term (`part="label"`). | 1 |
| `.sk-facts` | facts term regular | 1 | Consumer's: `ocelle-facts::part(label)` with `font-weight: var(--ocelle-font-weight-regular)`. The default stays 500 (IQ-03 (a)). | 1 |
| `.sk-facts` | facts value mono | 2 | Not this mission: no monospace (constitution II). The value stays sans with tabular figures; the small size is the consumer's through `--ocelle-facts-value-size` or a compact region (FR-008); the inspector's code-wrapped path is the consumer's value content. | 1 |
| `.sk-facts` | facts value wrap | 2 | `ocelle-fact wrap="anywhere"` for both rules (Work Package `break-word`, Drift break-anywhere, #535); no rule of its own for `break-word` and no change of the default (IQ-04 (b)). | 1 |
| `.sk-facts` | facts value ellipsis | 1 | `ocelle-fact wrap="anywhere"`, with the full value shown: the element has no truncation, as #280 asks, and the README says so (IQ-04 (b)). | 1 |
| `.sk-facts` | facts value identifier | 3 | `ocelle-fact wrap="anywhere"`, or a value element with `data-ocelle-wrap="anywhere"` (FR-007). The consumer's break hints are value content, which the element does not change (FR-003). | 1 |
| `.sk-facts` | facts value tooltip | 1 | Consumer's: a `title` on the consumer's own value content; with the full value shown (IQ-04 (b)) it is optional. | 1 |
| `.sk-facts` | facts value pill | 2 | Consumer's: pills are inline content in the fact's value (FR-003). | 1 |
| `.sk-facts` | facts value action | 1 | Consumer's: a button is inline content in the value and keeps its own tab stop (FR-003, FR-011). | 1 |
| `.sk-facts` | facts row optional | 2 | Consumer's: the consumer leaves the `ocelle-fact` out, or sets `hidden` on it (FR-003). The element adds no fallback, as #280 asks. | 1 |
| `.sk-facts` | facts group heading | 2 | Consumer's: the heading stays outside the sheet, in the consumer's wrapper. | 1 |
| `.sk-facts` | facts group omitted | 2 | Consumer's: the consumer leaves the sheet out or renders an `ocelle-empty-state` instead; a sheet with no pairs renders nothing visible (FR-010). | 1 |
| `.sk-facts` | facts workspace marker | 1 | Consumer's: a `data-*` attribute on the `ocelle-facts` host. | 1 |
| `.sk-empty-state` | empty-state panel | 15 | `ocelle-empty-state variant="panel"`, with #510's lighter heading (500) and larger rhythm (IQ-06 (a)) and no chrome of its own (IQ-07 (a)). The state wrapper and its `aria-busy` stay the consumer's. | 2 |
| `.sk-empty-state` | empty-state regional | 9 | `ocelle-empty-state`, default variant, with only the default slot (FR-023). | 2 |
| `.sk-empty-state` | empty-state refusal | 1 | `ocelle-empty-state` with the eyebrow in the `eyebrow` slot (IQ-08 (c)), an `h1` heading, a body (the sentence and the path, in sans with `data-ocelle-wrap="anywhere"`, as the consumer's body content) and an action. The dashed card is the #509 family's, not this mission (IQ-07 (a)). | 2 |
| `.sk-empty-state` | empty-state heading h1 | 2 | The `heading` slot holding the consumer's `<h1>` (FR-020). | 2 |
| `.sk-empty-state` | empty-state heading h2 | 9 | The `heading` slot holding the consumer's `<h2>` (FR-020). | 2 |
| `.sk-empty-state` | empty-state heading paragraph | 1 | The `heading` slot holding the consumer's `<p>` (edge case "slotted heading of a different element"). The bar takes the paragraph's text as `label` instead of its id (IQ-10 (a)). | 2 |
| `.sk-empty-state` | empty-state no heading | 14 | The `heading` slot left empty (FR-023): a loading panel with `ocelle-progress` in `visual` (5), or a body-only notice (9). | 2 |
| `.sk-empty-state` | empty-state body multiple | 2 | The default slot holding both paragraphs: the element zeroes their margins and separates them by `--ocelle-space-2` (IQ-09 (b), FR-026). | 2 |
| `.sk-empty-state` | empty-state body optional | 2 | The default slot filled or left empty (FR-023). | 2 |
| `.sk-empty-state` | empty-state action | 4 | The `actions` slot; the element gives the body-to-actions gap (FR-021), so the consumer's own top margin goes. Disabling the button while the screen is inert stays the consumer's. | 2 |
| `.sk-empty-state` | empty-state action wrapper | 0 | The `actions` slot. Unused by the consumer. | 2 |
| `.sk-empty-state` | empty-state inline | 0 | Not this mission: never used, and the regional notices use the centred block; no left-aligned inline variant is added. | 2 |
| `.sk-empty-state` | empty-state busy | 6 | `ocelle-empty-state` with an indeterminate `ocelle-progress size="compact"` in `visual` (FR-021, US2-7); `aria-busy` stays on the consumer's wrapper. A look keyed on busy is the consumer's own card (IQ-07 (a)). | 2 |
| `.sk-empty-state` | empty-state message | 3 | Consumer's: the consumer's own dashed card around an `ocelle-empty-state` (default variant); neither variant paints a ground or border (FR-021, IQ-07 (a)). | 2 |
| `.sk-empty-state` | empty-state card | 5 | Consumer's: the card fill, radius, inline padding and busy-keyed border are the consumer's own card around `ocelle-empty-state variant="panel"` (IQ-07 (a)); its heading becomes the panel's 500, not the bold display face (IQ-06 (a)). | 2 |
| `.sk-empty-state` | empty-state card dashed | 2 | Not this mission: panel and card paint, the #509 family (E-45) (IQ-07 (a)). | 2 |
| `.sk-empty-state` | empty-state ops card | 2 | Consumer's: as "empty-state card", the consumer's own card with its busy-keyed border and padding around the element, the heading at the element's weight (IQ-06 (a), IQ-07 (a)). Its selector tests are the consumer's. | 2 |
| `.sk-empty-state` | empty-state identifier | 3 | Consumer's: the value in the body, with `data-ocelle-wrap="anywhere"` and its own `title`; no mono (constitution II). | 2 |
| `.sk-empty-state` | empty-state focus target | 2 | Consumer's: `tabindex="-1"` on the consumer's slotted heading (the element adds no tab stop, FR-024). For the loading block, the consumer's `<h2 tabindex="-1">` in the `heading` slot with the bar in `visual` (IQ-11 (b)). | 2 |
| `.sk-progress` | progress default | 1 | `ocelle-progress` with `value`, `max`, `label` and `show-label`. | 3 |
| `.sk-progress` | progress narrow | 3 | `ocelle-progress`; the track fills the host's inline size (R-06). The two uses with their own grid are "progress grid layout". | 3 |
| `.sk-progress` | progress compact | 10 | `ocelle-progress size="compact"`. In the consumer always without `value`. | 3 |
| `.sk-progress` | progress indeterminate | 10 | `ocelle-progress` with no `value` (FR-032). | 3 |
| `.sk-progress` | progress determinate | 4 | `ocelle-progress` with `value` and `max`. | 3 |
| `.sk-progress` | progress meta | 2 | `value-text` with `show-label`: the consumer passes the formatted percentage, since the element formats no numbers (Assumptions). It sits at the inline end of the label row (IQ-13 (b)). | 3 |
| `.sk-progress` | progress external text | 1 | `value-text` with `show-label`, or the consumer's own text beside the element. | 3 |
| `.sk-progress` | progress label | 12 | `ocelle-progress` with `label` and `show-label` (FR-035). The label is text only, with no slot (IQ-14 (a)). | 3 |
| `.sk-progress` | progress labelled by heading | 1 | Consumer's: the consumer passes the heading's text as `label`, with no reference (IQ-10 (a)). | 3 |
| `.sk-progress` | progress aria-label | 1 | `label` without `show-label`, or a host `aria-label` (FR-030). | 3 |
| `.sk-progress` | progress fallback text | 2 | Consumer's: the element draws the bar itself; text the consumer puts inside it shows only before upgrade and is neither shown nor exposed after it, as the README states and a browser body proves (IQ-15 (b), R-05). | 3 |
| `.sk-progress` | progress heading | 1 | Consumer's: the consumer's own `<h2 tabindex="-1">` in the empty state's `heading` slot with the bar in `visual`; the README warns against a `role` or `tabindex` on the host (IQ-11 (b), R-05). | 3 |
| `.sk-progress` | progress inline | 1 | `ocelle-progress`, whose host is `display: block`; the consumer sets `display: inline-block` and an inline size on the host from outside (IQ-12 (a), R-06). | 3 |
| `.sk-progress` | progress in empty-state | 6 | `ocelle-empty-state`'s `visual` slot (FR-021, US2-7). | 3 |
| `.sk-progress` | progress in busy region | 3 | `ocelle-progress` placed directly; `aria-busy` stays on the consumer's region. | 3 |
| `.sk-progress` | progress slotted | 2 | `ocelle-progress` in another element's slot; nothing is needed from the element. | 3 |
| `.sk-progress` | progress grid layout | 2 | `ocelle-progress` with `show-label` in the default size: the label at the inline start and the value text at the inline end of the row above, the bar across the full width below (R-06, IQ-13 (b)). The consumer no longer places the parts itself. | 3 |
| `.sk-progress` | progress centred | 1 | `ocelle-empty-state`'s `visual` slot, which centres the bar and spans it up to the reading measure (FR-021). | 3 |

Each family is recorded in full. Its gap rows went to the operator, who decided them on 2026-11-14 (IQ-01 to IQ-15);
the rows above give the decided element, variant or consumer remedy, and the spec and plan carry the changes (FR-013,
FR-014, FR-020, FR-025, FR-026, FR-035, FR-039). The red commits (T012, T028, T045) no longer wait on these questions.

**Gaps.** A variant that no element, property or slot of this plan covers goes to the operator before the red commit
of its element's phase; the surface is not widened by review. The gaps and conflicts the inputs showed are listed, with options, in
[reviews/analysis/inputs-questions.md](reviews/analysis/inputs-questions.md), and the operator's choices in
[reviews/analysis/inputs-decisions.md](reviews/analysis/inputs-decisions.md); the two surface additions (`layout="grid"`,
the `eyebrow` slot) were the operator's.

**Who records it, and when (analysis U1).** For each family an operator step precedes the phase's red tasks: the
operator supplies the family's rows and the planner records them in the table above, in a documentation commit of
their own before the phase's red commit (tasks T002a, T022a, T036a). A family still pending is a known blocker of
that phase's red commit (T012, T028, T045): the implementer stops and asks; it does not write the mapping statements
from anything else. All three families are now recorded (T002a, T022a and T036a done, from
[sources/013-inputs.md](sources/013-inputs.md)), and the questions their gap rows named are decided.

**Where the mapping is written.** Each element's mapping rows (FR-058) are written in that element's phase, red
first: the readme-test statements for the rows in the phase's red commit, the rows in its green commit (facts in
phase 1, empty state in phase 2, progress in phase 3). Phase 4 checks only that the three sections together cover
the inventory (SC-001, in review).

**How the mapping is proven without `sk-` in test code (operator decision I1, "Roles, not sk- names", tasks gate).**
The `prefix` gate reads every text file below `packages/<name>/` except Markdown, and its pattern matches `sk-` after
a `.`; FR-002 forbids `sk-` names in source and tests. So:
- the README mapping table (Markdown, outside the gate) holds the `.sk-*` family names next to each row's role name,
  its element and its variant;
- the readme tests (`packages/elements/test/node/readme.test.ts`) assert each row by its role name from the
  "Modifier or state (role name)" column above, for example the row "facts compact" names `ocelle-facts` and
  `density="compact"`, one assertion per row. No `sk-` string appears in test code, built directly or indirectly
  (no concatenation, escape or character code that would spell it);
- the `.sk-*` family column is checked against this inventory in review (SC-001, T054).
The role names in this table are therefore written without the `sk-` prefix.

