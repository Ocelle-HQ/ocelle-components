# Inventory questions, 019-data-records (2026-11-18)

- **Source:** `sources/spec-kitty-design-inventory.md`, the spec-kitty design library's own variant set for the three
  families this mission replaces, read from a clone at commit 19fb6a2 (version 1.0.0); recorded in research R-16.
- **Compared with:** the approved spec (`spec.md`), plan, research, data model and contracts as at f966843.
- **Changed in this step:** research R-16 only. Spec, plan, tasks and contracts are unchanged until the operator answers.
- **How answers apply.** An answer that adds scope changes the spec, plan, contracts and tasks before the red commit
  of the phase it touches (phase 1 for the data table, 2 for the timeline, 3 for the chain). An answer of "not this
  mission" becomes a README mapping row under FR-058 (role name, the consumer's remedy or the later issue), with no
  other change.
- **The issues #470, #517 and #533** are not in the clone, which predates them (its newest cited issue is #419). So no
  question below reports a contradiction from them; IQ-25 asks what to do about that.

Each question gives the library's behaviour, what the spec says, the options and a recommendation.

## Scope of the inventory

**IQ-1. Does the library's variant set stand in for kitty-mission-ui's inventory (T005, T028, T054, SC-001)?** R-16
and FR-058 ask for kitty-mission-ui's usage, with counts. This source is the library's own variant set: no counts, and
at 1.0.0, while kitty-mission-ui built on 1.1.0-rc.10.

- (a) Yes. The README mapping has one row per modifier, state, structure role and part in the source file (role names
  only). This answers T005, T028 and T054, and no counts are needed, because the consumer can only use what the
  library defines. The operator names any variant that exists only in rc.10, and that variant gets a row too.
- (b) Provisional. The rows are written from this source now. The operator still supplies kitty-mission-ui's usage and
  rc.10's additions before the pull request lands, and SC-001 stays open until then.
- (c) Not this mission's inventory. The file is background only, and T005, T028 and T054 wait for kitty-mission-ui's
  usage as written. A variant that usage lacks goes to a later issue.

**Recommendation: (a).** A complete superset is a stronger base for SC-001 than counts. The one known gap is rc.10,
which a list of names from the operator closes.

## Data table (phase 1)

**IQ-2. The sticky header row (`sk-data-table--sticky-header`).** In the library, the header row stays pinned while
the body scrolls vertically inside a scroller whose height the consumer bounds. The spec puts sticky columns out of
scope and says nothing about a sticky header row. The element's region is 009's sideways scroll box, and FR-008 does
not let this mission change the module.

- (a) Not this mission. The README maps the modifier to a later issue: a data table bounded on the block axis with a
  pinned header row. That needs the region to scroll on the block axis, which is a request to 009's owner, like R-17.
  Until then a long table scrolls with the page.
- (b) This mission adds a `sticky-header` attribute and a block-size bound. 009's module would then have to scroll
  vertically, which goes to 009's owner first and blocks phase 1's green until it lands.

**Recommendation: (a).** (b) depends on a module change outside this mission.

**IQ-3. The numeric cell (`sk-data-table__cell--numeric`).** In the library, the cell is end-aligned with tabular
figures. The spec's Assumptions put an end-aligned numeric column out of scope as a later issue, and every cell
already gets `--ocelle-figures`.

- (a) Not this mission. The README maps the cell to tabular figures (already on every cell) plus the consumer's own
  `text-align: end` rule on the cell, which wins over FR-005's (0,0,0) rules. A later issue covers an alignment API.
- (b) This mission adds a cell hook in `@ocelle/styles` (for example `data-ocelle-align="end"`, like 003's wrap hook).
  It is a documented base-style hook (MINOR), with a new FR, a story, tests and a prose-override entry.

**Recommendation: (a).** It matches the approved Assumptions, and the consumer's rule already works.

**IQ-4. Zebra rows.** In the library, every even body row gets a muted ground. The spec draws a row rule between body
rows and no ground.

- (a) Not this mission. The README maps zebra rows to the row rules, and the consumer's remedy is a rule of its own
  that puts a ground on even rows.
- (b) This mission adds a `striped` attribute: even rows on a main ground such as `--ocelle-color-inset` (cell text
  must be declared on that ground, FR-013), with a forced-colours substitute and two stories more.

**Recommendation: (a).** The look #13 asks for is compact rows with rules. A ground adds a forced-colours substitute
and contrast pairs for no requested need.

**IQ-5. Row hover.** In the library, a hovered body row is brightened, with a forced-colours band on its first cell.
The spec's data table is a readout that emits no event (FR-011).

- (a) Not this mission. The README states that rows have no hover, and the consumer's remedy, where rows hold links,
  is a rule of its own with `--ocelle-color-hover-bg`.
- (b) This mission adds a hover ground (`--ocelle-color-hover-bg`, a main ground, so cell text stays declared) with a
  forced-colours substitute.

**Recommendation: (a).** A hover on rows that do nothing suggests an action that is not there.

**IQ-6. A region name equal to the caption.** The library's docs require the scroller's name to differ from the
caption's text, and call a duplicate name a defect. FR-010 names the region by the caption's text when there is no
`label` and no host `aria-label`, so the group and the table it holds can be announced with the same name.

- (a) Not this mission. FR-010 stands, and the README maps the library's rule to the consumer's remedy: give an
  overflowing table a `label` that differs from its caption.
- (b) Drop the caption fallback. With no `label` and no host `aria-label` the region is a tab stop with no role and no
  name (009's unnamed case). FR-010, US1-7, US1-16 and the "named by its caption" story change.

**Recommendation: (a).** An unnamed tab stop is worse than a repeated name, and the README tells consumers how to
avoid the repeat.

**IQ-7. The column headers' look.** The library's header cells are medium weight, in the muted colour, sentence case
and untracked, with no distinct row-header style. The spec uses 011's eyebrow tokens, upper case (recheck Q1 (a),
spike Q2 (a)), and a row-header style.

- (a) Not this mission. The spec stands, and the README maps the library's header look to the eyebrow headers. A
  consumer that wants sentence case uses its own rule, which wins over the (0,0,0) rules.
- (b) Go back to the library's look: sentence case, medium weight, `ink-muted` (plan gate Q-B (a)). This reverses
  recheck Q1 and spike Q2 and changes FR-006, US1-1 and US1-3.

**Recommendation: (a).** #13 asks for eyebrow headers, citing #533, which suggests the library's look is the gap
being reported.

## Event timeline (phase 2)

**IQ-8. The compact form (`sk-event-timeline--compact`).** In the library, a modifier makes the timeline denser: a
smaller measure, smaller text, a narrower gutter and smaller gaps, and it enables the leading marker. The spec has one
timeline look, and its contract already sets content at `sm` and the time at `xs`.

- (a) Not this mission. The README maps the compact form to the default timeline, whose type is already the compact
  sizes. The consumer's remedy for more density is part rules (`::part(time)`, `::part(content)`), and a later issue
  covers a density property.
- (b) This mission adds a `density="compact"` attribute on `ocelle-event-timeline`, with smaller gaps and gutter, new
  stories in light and dark, contract and test changes, and new geometry for the connector insets (R-10).

**Recommendation: (a).** The default is already at the compact type sizes, and (b) reopens R-10's connector geometry.

**IQ-9. The measure cap and the narrow form (`sk-event-timeline--narrow`).** The library caps the timeline's inline
size: five large space steps by default, three when compact and two when narrow. The spec's timeline fills its
container and reflows at 320 px (FR-009).

- (a) Not this mission. The README maps the narrow form to the container, since the timeline follows its column's
  width. The consumer's remedy for a cap is a `max-inline-size` on the host.
- (b) This mission adds a default cap from an existing `--ocelle-measure-*` token on the host.

**Recommendation: (a).** Measure is the layout's decision, and no consumer need in #13 asks for a cap.

**IQ-10. A summary line and supporting content.** A library event has two levels of text: a semibold title line, and
an optional supporting paragraph in body colour. The spec's event has one content slot.

- (a) Not this mission. The README maps the summary and the supporting content to the consumer's markup in the
  content, for example a `<strong>` title followed by text. Rules on those light-DOM nodes are the consumer's.
- (b) This mission adds a named `detail` slot below the content, at a weight and colour of its own. FR-023's item
  text (time, content, detail), the contract, US2 and the stories change.

**Recommendation: (a).** The content slot already takes inline markup, and #13 asks only for a time and text.

**IQ-11. A metadata row: the actor and further facts.** Every library exemplar shows an actor beside the time. One
exemplar also shows tone, trust and freshness facts in a wrapping row. The spec's event has a time and content only.

- (a) Not this mission. The README maps the actor and the facts to the consumer's markup in the content. A later
  issue covers a metadata slot.
- (b) This mission adds a named `meta` slot shown on the time's line after the time, in the time's type. The item
  text (time, meta, content), FR-021's marker line, FR-023, the contract, R-10 and US2 change.
- (c) The `time` slot carries the actor too. It already shows every visible slotted node, so the only change is a
  README line, but the slot's name and its "one time element per event" README advice would then mislead.

**Recommendation: (a).** If the operator knows the Desktop V2 history always shows an actor, (b) is the clean form
and goes before phase 2's red.

**IQ-12. The time's position (plan gate Q-C).** The library puts the actor and the time on a row after the title
line, not above it. Q-C (a) put the time on its own line above the content, with the marker on the time's line. This
is the library's choice, not #470's, which is unread.

- (a) Not this mission. Q-C (a) stands, and the README maps the library's metadata-after-title order to the
  time-above-content order. The item text stays time first.
- (b) Reopen Q-C, putting the time after the content's first line, with the marker on the content's first line.
  FR-021, FR-023, US2-2, US2-11 to US2-14, the contracts, R-10 and the standalone-event story change.

**Recommendation: (a).** The operator decided Q-C with the alternatives in front of them, and nothing from #470
reopens it.

**IQ-13. The trailing verification label (`sk-event-timeline__marker`).** In the library, an event can end with a
consumer-worded trust label ("Verified by consumer") in a tinted on-tint colour. The spec's Assumptions put tones and
states on events out of scope.

- (a) Not this mission. The README maps the label to the consumer's markup in the content, worded in text. A later
  issue covers a trust slot.
- (b) This mission adds a named `marker` slot at the event's end, in an ink token (FR-013 forbids state colours),
  with a contract, stories and tests.

**Recommendation: (a).** It is a per-event state, which the approved Assumptions exclude.

**IQ-14. The leading marker (`sk-event-timeline__leading-marker`).** In compact library timelines, a decorative icon
supplied by the consumer replaces an event's drawn marker, and the connector moves to the icon's centre. The spec has
one marker look (Assumptions).

- (a) Not this mission. The README maps the leading marker to the default dot, and a later issue covers a marker slot.
- (b) This mission adds a named `marker` slot on `ocelle-timeline-event` whose decorative content replaces the dot.
  The element cannot hold consumer icons to FR-013's 3:1 or keep them out of the accessibility tree unless it hides
  the slot, so FR-013, FR-021 and the connector geometry change.

**Recommendation: (a).** Out of scope by the Assumptions, and FR-013 cannot vouch for a consumer's icon.

**IQ-15. The linked event.** In the library, an event's title line can be a native link, and its target can be
another event's item, by id. The spec covers a link in an event's content (US2-7, the "a link in an event" story),
but not an event as a fragment target.

- (a) Not this mission. The README maps the linked title to a link in the event's content (US2-7), and states that
  an `id` on an `ocelle-timeline-event` is the consumer's fragment target. That is one README statement, written test
  first in phase 2.
- (b) This mission also adds a scenario and a story, in which a link to another event's `id` scrolls that event into
  view and keeps the list's semantics.
- (c) No README line: the mapping row names the consumer's link in the content only.

**Recommendation: (a).** The behaviour is the platform's, and one README line makes the mapping complete.

**IQ-16. The degraded form.** The library has no role for this. Its exemplar mutes a whole compact list with a
greyscale filter, set as an inline style by the consumer, while the facts stay unchanged.

- (a) Not this mission. The README maps it to the consumer's remedy: a rule in the consumer's own stylesheet (no
  inline style, constitution IV), with the degraded state stated in text beside the timeline, never by muting alone.
- (b) This mission adds a `degraded` attribute that draws markers, connectors and text in muted ink tokens, with the
  FR-013 pairs rechecked and new stories.

**Recommendation: (a).** The library leaves it to the consumer too, and a muted look alone would carry meaning by
colour only.

**IQ-17. Unavailable retention.** In the library, when history is unavailable, a passive empty-state section replaces
the timeline, and an announced notice is the consumer's separate choice. The spec's empty timeline renders nothing
(FR-025).

- (a) Not this mission. The README maps the state to 013's `ocelle-empty-state` in place of the timeline (the
  consumer's remedy). An announcement is the consumer's own notice or live region (FR-026).
- (b) This mission adds an `empty` slot on the timeline, shown while no event is visible. It holds consumer text only
  and no live region, and FR-025, the contract and the empty story change.

**Recommendation: (a).** 013's element already serves the state, and the library composes the same way.

## Evidence chain (phase 3)

**IQ-18. The chain's input: a `stages` property or slotted steps.** In the library, the chain takes one JavaScript
property, `stages`: an ordered array of objects keyed by `id`, with no attributes and no slots. The spec takes
`ocelle-evidence-step` children (Q3 (a)), which fits server-rendered htmx pages under a strict CSP.

- (a) Not this mission. Q3 (a) stands, and the README maps `stages` to one `ocelle-evidence-step` per stage, in order.
  A stage's `id` maps to an `id` the consumer sets on the step, if it needs one.
- (b) This mission adds a `stages` property beside the slot, for JavaScript hosts. It needs a precedence rule,
  validation and a second rendering path, so phase 3 grows.

**Recommendation: (a).** A second input path doubles the surface for no named consumer need, and the Ocelle console
cannot set properties from HTML.

**IQ-19. What a stage holds: label, value and annotation.** Each library stage is a compact metric: a label and a
display value as a definition pair, with an optional annotation drawn as a pill tag. The library's approved example
is a funnel of four valued stages (investment, completed, deployed, verified). The spec's step holds free content
with an ordinal marker ("Spec", "Plan", ..., Assumptions: "the prototype's chain is numbered").

- (a) Not this mission. The README maps the label, value and annotation to the consumer's markup in the step's
  content, and a later issue covers a valued stage.
- (b) This mission adds named `label`, `value` and `annotation` slots on `ocelle-evidence-step`, with the value in
  tabular figures at a larger size. FR-030 to FR-035, the item text, US3, the contract and the stories change.
- (c) Both forms: the ordinal step as specified, plus a valued step form added in a later mission once the operator
  confirms which form kitty-mission-ui shows.

**Recommendation: (a),** unless the operator knows kitty-mission-ui shows the valued funnel. Then (b), before phase 3's
red. This is the largest difference between the library and the spec.

**IQ-20. A tone per stage.** Library stages take a tone (`neutral`, `info`, `success`, `attention`). The spec's
Assumptions put per-step states out of scope, and FR-013 forbids state colours on marks.

- (a) Not this mission. The README maps the tone to the consumer's remedy, the state worded in the step's text, and to
  a later issue.
- (b) This mission adds a `tone` attribute on `ocelle-evidence-step`, using state tokens for the ring or outline plus
  a non-colour sign. FR-013, the Assumptions, the contrast pairs and the light-mode ochre rule (constitution II) all
  come into play.

**Recommendation: (a).** Excluded by the approved Assumptions and by FR-013.

**IQ-21. The narrow layout: a stack or wrapping.** Below a 720 px viewport width (a media query), the library stacks
its stages vertically and turns the connectors downward. The spec wraps steps onto further lines by the chain's own
width, with connectors only within a line (FR-034).

- (a) Not this mission. FR-034 stands, and the README maps the stacked layout to the wrapping chain, which follows its
  container rather than the viewport.
- (b) This mission adds a `layout="stack"` attribute: one step per line, with vertical connectors.
- (c) The chain stacks instead of wrapping below a container width. FR-034, US3-3 and US3-9 change.

**Recommendation: (a).** Wrapping by container is what #13 asks for ("wraps onto further lines in narrow columns").

**IQ-22. A direction arrow on the connectors.** The library's connectors end in an arrow glyph (rightward, or
downward when stacked) set in a monospace face. The spec's connector is a plain decorative line.

- (a) Not this mission. The README maps the arrow to the plain connector, and a later issue covers an arrowhead.
- (b) This mission adds a drawn arrowhead (no glyph, no monospace), mirrored under `dir="rtl"`, still decorative and
  hidden. The contract, the geometry and the stories change.

**Recommendation: (a).** The ordered list and the ordinals already convey direction.

**IQ-23. Empty and invalid input.** The library shows a status line with its own text ("No evidence available.") for
an empty input, and for an invalid whole input such as duplicate ids. The spec's empty chain renders nothing (FR-025),
and with slotted steps there is no invalid input, because non-step children are ignored (FR-030).

- (a) Not this mission. FR-025 stands, and the README maps the empty state to 013's `ocelle-empty-state`, placed by
  the consumer. The invalid-input state has no counterpart.
- (b) This mission adds an `empty` slot shown while no step is visible, holding consumer text only (no library text,
  no live region).

**Recommendation: (a).** It is consistent with IQ-17 and keeps library-authored text out.

**IQ-24. The chain's parts.** The library exposes `list`, `stage`, `connector` and `empty-state`. The spec's chain
exposes `list`, and its step exposes `content`.

- (a) Not this mission. The README maps `list` to `list` and `stage` to the `ocelle-evidence-step` host (a light-DOM
  element the consumer styles directly) and its `content` part. `connector` maps to none (decorative, not a hook), and
  `empty-state` to none (IQ-23).
- (b) This mission adds a `connector` part on the chain and a `marker` part on the step, as manifest surface (MINOR),
  with tests.

**Recommendation: (a).** Each part is public surface under constitution VII, and no consumer asks for these.

## The unread issues

**IQ-25. #470, #517 and #533 are still unread.** The clone predates all three. Nothing found contradicts Q-A (the
chip without fill), recheck Q1 (011's eyebrow tokens, which superseded Q-B), Q-C (the time above the content) or Q-E
(the `time` slot). The library's own differences are IQ-7, IQ-12 and IQ-19.

- (a) The answers stand as decided, with no further step.
- (b) The answers stand, and the operator supplies the three issue bodies (or a clone of the develop line that holds
  rc.10) before phase 2's red commit. The planner records them verbatim in `sources/`, as 003 did, and asks again only
  where they contradict an answer.
- (c) Not this mission. A contradiction found later goes to a later issue, and the README maps from this source only.

**Recommendation: (b).** Phase 1 is unaffected (#533's point is settled by recheck Q1 and spike Q2). Phases 2 and 3
have not started, so the chip (#517) and the time (#470) can still change cheaply.

## Covered, no question

The library has these, and the spec covers them the same way:

- The table is kept intact and never reflowed, and only a scroller that overflows is a named tab stop (FR-008).
- The table rules stay visible in forced colours (FR-013).
- Tables carry no tone (spec scope).
- Light-mode stories exist (FR-050).
- Timelines keep the consumer's source order, with no sorting, clock reading, time formatting or live region (FR-020,
  FR-026, Edge Cases).
- A machine-readable `<time datetime>` is supported (the `time` slot, Q-E).
- One event, twenty events and long wrapping content are covered (FR-024, FR-025).
- Markers and connectors use system colours in forced colours (FR-013).
- A chain of two or six stages and long stage content wrap without page overflow (FR-034).
- The chain's connectors are hidden from assistive technology (FR-032).
- The chain has a before-upgrade form; the library has none, so the spec covers more.

## Added after the `develop` re-inventory (2026-11-18)

- **Source:** the re-inventory of the three families on spec-kitty-design `develop` (a6518cd) and the #470 hand-off
  material there (`sources/spec-kitty-design-inventory.md` § What `develop` adds or changes;
  `sources/issue-470-handoff-background.md`), made after the operator's decisions of 2026-11-18
  (`inventory-decisions.md`). `develop` changes no role, modifier, state, story, property or part of the three
  families; it adds #470's Desktop V2 contract and a frozen hand-off. These questions are for phases 2 and 3, asked
  with IQ-8 to IQ-24, and nothing here is decided. Phase 1's answers (IQ-1 to IQ-7) are not reopened.

**IQ-26. The timeline's compact and narrow forms are Desktop V2 required states.** #470's contract requires four
timeline states of the library: default, light mode, responsive narrow (the narrow form) and compact (the compact
default exemplar, with supporting content and the verification label). IQ-8 and IQ-9 recommend mapping the compact
form to the default timeline and the narrow form to the container.

- (a) No change: IQ-8 (a) and IQ-9 (a) as recommended. The README maps the compact required state to the default
  timeline (already at the compact type sizes) and the narrow state to the container; a Desktop V2 screen that vendors
  the library's compact look is not this mission's consumer.
- (b) IQ-8 (b): this mission adds `density="compact"` (smaller gaps and gutter), with stories in light and dark, so
  each Desktop V2 required timeline state has a counterpart. R-10's connector geometry is redone for it.
- (c) Ask kitty-mission-ui's owner which timeline form the Desktop V2 history uses before phase 2's red, and decide
  IQ-8 and IQ-9 on that answer.

**Recommendation: (c),** then (a) unless the compact form is the one Desktop uses.

**IQ-27. The evidence chain is not a Desktop V2 family.** #470's contract lists 22 families; the evidence chain is
not one of them, and the hand-off holds no chain file, while the metric and the pill tag, of which each library stage
is built, are. The spec bases the chain on #13 (#517, the epic's gap table) and the Desktop V2 prototype's evidence
chain, and IQ-19 asks whether a stage is an ordinal step or a valued metric.

- (a) No change: phase 3 builds the chain as specified for #13 and the Ocelle console; the README maps the library's
  chain role by role (IQ-18 to IQ-24), and the metric and pill-tag families are not this mission's (013's
  `ocelle-facts` and #7's pill tag already serve those needs).
- (b) Phase 3 waits until the operator confirms from kitty-mission-ui whether Desktop V2 shows the chain at all, and
  in which form (ordinal steps, or valued metrics as IQ-19 (b)).
- (c) Phase 3 is dropped from this mission and the chain goes to a later issue; phases 1, 2 and 4 stand, and the
  counts lose phase 3's 12 stories and 24 baselines.

**Recommendation: (a),** because #13 asks for the chain independently of #470, and IQ-19 already carries the form
question.

**IQ-28. Kitty Desktop vendors the library's own data table and timeline.** #470's Stage A gives Kitty Desktop a
frozen, offline copy of the library's styles-only data table and event timeline (byte-identical to the 1.0.0 files),
with a contract of their states. The spec's Consumers line says kitty-mission-ui replaces those families with this
library's elements. If Desktop V2 keeps the vendored copy, the timeline's named consumer is the Ocelle console only.

- (a) No change: kitty-mission-ui replaces the families as #13 and the spec state; the hand-off is the library's
  interim channel, and the README mapping is the replacement path.
- (b) The spec's Consumers line for phases 2 and 3 names the Ocelle console as the confirmed consumer and
  kitty-mission-ui as the intended one, until its owner confirms; scope is unchanged.
- (c) The operator asks kitty-mission-ui's owner before phase 2's red and records the answer in `sources/`; a "no"
  goes back to the operator for phases 2 and 3.

**Recommendation: (a),** with (c) if the operator has reason to think Desktop V2 keeps the vendored copy.
