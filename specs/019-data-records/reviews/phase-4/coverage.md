# Coverage of the README mapping (T076, SC-001) and the R-17 request (T077)

Checked on 2026-11-23 on 4106d7d (phase 4's base), read from the repository only.

- **The rows checked:** `packages/elements/README.md` § Mapping from kitty-mission-ui, the 12 `.sk-data-table`, 19
  `.sk-event-timeline` and 20 `sk-evidence-chain` rows (51 rows). `packages/styles/README.md` holds no mapping row
  (no `sk-` string).
- **Checked against:** research R-16 (its three tables and the notes under them); the library's variant set,
  `sources/spec-kitty-design-inventory.md` §§ 1 to 3 and § What `develop` adds or changes (IQ-1 (a)); the
  operator's decisions in `reviews/phase-1/inventory-decisions.md` (IQ-1 to IQ-7, Q-I1 to Q-I7),
  `reviews/phase-2-inventory-decisions.md` (IQ-8 to IQ-17, IQ-26, IQ-28), `reviews/phase-3-inventory-decisions.md`
  (IQ-18 to IQ-24, IQ-27) and `reviews/issue-texts-check.md` (Q-T1 to Q-T5, and its point-by-point check of #470,
  #517 and #533).
- **Result:** every modifier, state, structure role, property and part of R-16's three tables has its README row, with
  the decision R-16 cites, and each row names an element and variant, the consumer's remedy, or "none" by the
  operator's decision. One state of the library's data table has **no row**: light mode, a #470 required state that
  R-16 says "the rows above" cover, while the timeline and the chain each have a light-mode row. Not filled here:
  question G-1 below. The operator chose G-1 (b) (`operator-coverage-decision.md`); phase 4's review round 1 fix adds
  the row test-first (red `fix-1`, `round-1-fixes.md`), the README's data-table rows becoming 13 (52 rows in all), and
  **T076 is ticked**.

## The family names

| README family | R-16 and the inventory | Kind in the library | Verdict |
|---|---|---|---|
| `.sk-data-table` (12 rows) | `.sk-data-table` (R-16); `sk-data-table`, the table class (inventory § 1) | styles only, a class | agrees: a class family, written with its dot |
| `.sk-event-timeline` (19 rows) | `.sk-event-timeline` (R-16); `sk-event-timeline`, the list class (inventory § 2) | styles only, a class | agrees |
| `sk-evidence-chain` (20 rows) | `sk-evidence-chain` (R-16); the element's tag (inventory § 3) | an element | agrees: a tag, written with no dot |

The README's lead-in names the same three: "the design library's `.sk-data-table` and `.sk-event-timeline` (which have
no part), and each property, stage field, behaviour state and part of its `sk-evidence-chain` element". Every row's
family cell is one of the three, and each family's rows are contiguous.

## The data table (R-16 phase 1 table; inventory § 1)

| Library role (kind) | README row | Maps to | Decision | Verdict |
|---|---|---|---|---|
| the scroller wrapper (structure role) | data table scroller | `ocelle-data-table`'s region, a named `group` tab stop only while it overflows, with the focus ring; a `label` that differs from the caption | IQ-6 (a) | covered |
| the table class (structure role) | data table class | the consumer's own `<table>`, with no class | R-16 | covered |
| the caption (structure role) | data table caption | the `<caption>`, styled by `@ocelle/styles` | R-16 | covered |
| the header cells (structure role) | data table header cells | the eyebrow column headers; sentence case by the consumer's own rule; the mono face, the 0.06em tracking and the larger padding noted | IQ-7 (a); Q-T1 (a), Q-T2 (a), Q-T3 (a) | covered, with each of #533's three notes |
| the body cells (structure role) | data table body cells | the compact body cells; the mono face noted | Q-T1 (a) | covered |
| the numeric cell (modifier) | data table numeric cell | `data-ocelle-align="end"` | IQ-3 | covered |
| the sticky header (modifier) | data table sticky header | `ocelle-data-table sticky-header`, with the page's block bound | IQ-2 | covered |
| zebra rows (state) | data table zebra rows | `ocelle-data-table striped` | IQ-4 | covered |
| row hover (state) | data table row hover | built in, on a device that can hover | IQ-5; Q-I3 | covered |
| forced colours (state) | data table forced colours | built in: system colours and the row band | R-16 (FR-013) | covered |
| the overflowing scroller (state) | data table overflowing | built in: the tab stop, role and name while it overflows | R-16 | covered |
| tone (state, none by ruling) | data table tone | none: no tone | R-16 (spec scope) | covered |
| light mode (a #470 required state; the library's LightMode story) | data table light mode (added in review round 1) | built in: the light and dark themes | G-1 (b); R-16 (FR-013) | covered (was gap G-1) |

The library's table has no part (styles only), so no part row (R-16). #470's other required states: default (the
structure rows), responsive narrow (the overflowing row; the library's narrow exemplar is the overflowing scroller),
hover (the hover row), focus (the scroller row's focus ring) and sticky header (its row); active and disabled are
declared not applicable there.

## The event timeline (R-16 phase 2 table; inventory § 2)

| Library role (kind) | README row | Decision | Verdict |
|---|---|---|---|
| the list (structure role), with its measure cap | event timeline class | IQ-9 (a) | covered |
| the item (structure role) | event timeline item | R-16 (FR-021, FR-024) | covered |
| the summary (structure role) | event timeline summary | IQ-10 (a) | covered |
| the metadata: the time (structure role) | event timeline metadata time | Q-C (a), IQ-12 (a) | covered |
| the metadata: the actor and further facts (structure role) | event timeline metadata actor and facts | IQ-11 (a) | covered |
| the supporting content (structure role) | event timeline content | IQ-10 (a) | covered |
| the trailing verification label (structure role) | event timeline marker | IQ-13 (a) | covered |
| the leading marker (structure role) | event timeline leading marker | IQ-14 (a) | covered |
| compact (modifier; #470 required state) | event timeline compact | IQ-8 (a), IQ-26 (a) | covered |
| narrow (modifier; #470 responsive narrow) | event timeline narrow | IQ-9 (a), IQ-26 (a) | covered |
| one event (state) | event timeline one event | R-16 | covered |
| two events, the first with supporting content (state) | event timeline two events | IQ-10 (a) | covered |
| twenty events (state) | event timeline twenty events | R-16 | covered |
| a long transition (state) | event timeline long transition | R-16 | covered |
| the linked event (state) | event timeline linked | IQ-15 (a) | covered |
| degraded (state, no library role) | event timeline degraded | IQ-16 (a) | covered |
| unavailable retention (state) | event timeline unavailable retention | IQ-17 (a) | covered |
| forced colours (state) | event timeline forced colours | R-16 (FR-013) | covered |
| light mode (state; #470 required state) | event timeline light mode | R-16 (FR-013) | covered |

The remaining exemplars and stories map through these rows, as R-16 states: the verified-marker exemplar by the marker
row, the narrow exemplar by the narrow row, and each compact exemplar (one event, default, twenty events, leading
marker, long content, linked, narrow, degraded, forced colours, light mode) by the compact row and its state's row.
The library's timeline has no part, so no part row. IQ-28 (a) changes no row.

## The evidence chain (R-16 phase 3 table; inventory § 3)

| Library role (kind) | README row | Decision | Verdict |
|---|---|---|---|
| `stages` (property) | evidence chain stages | IQ-18 (a) | covered |
| a stage's `id` (property field) | evidence chain stage id | IQ-18 (a) | covered |
| a stage's label, display value and annotation (property fields) | evidence chain stage label, value and annotation | IQ-19 (a) | covered |
| a stage's tone (property field) | evidence chain stage tone | IQ-20 (a) | covered |
| the compact step (stage rendering, behaviour) | evidence chain compact step | Q-T4 (a) (#517's pill-shaped chip to `variant="chip"`, `--ocelle-radius-2`) | covered |
| part `list` | evidence chain list part | IQ-24 (a) | covered |
| part `stage` | evidence chain stage part | IQ-24 (a) | covered |
| part `connector` | evidence chain connector part | IQ-24 (a) | covered ("none", by the decision) |
| the connector's arrow (wide and narrow layout) | evidence chain connector arrow | IQ-22 (a) | covered |
| part `empty-state` | evidence chain empty-state part | IQ-24 (a), IQ-23 (a) | covered ("none", by the decision) |
| the empty state (behaviour; the Empty story) | evidence chain empty state | IQ-23 (a) | covered |
| invalid input (behaviour, validation; the InvalidInput story) | evidence chain invalid input | IQ-23 (a) | covered ("none", by the decision) |
| the wide layout (behaviour; the Default story) | evidence chain wide layout | R-16 (FR-034) | covered |
| the narrow layout (behaviour; the Narrow story) | evidence chain narrow layout | IQ-21 (a); 517-1 | covered |
| forced colours (behaviour) | evidence chain forced colours | R-16 (FR-013) | covered |
| light mode (the LightMode story) | evidence chain light mode | R-16 (FR-013) | covered |
| two stages, six stages (the TwoStages and SixStages stories) | evidence chain two and six stages | R-16 | covered |
| long content (the LongContent story) | evidence chain long content | R-16 | covered |
| no static form (behaviour) | evidence chain static form | R-16 | covered |
| composition (the ApprovedExample story) | evidence chain composition | R-16 (FR-034); IQ-27 (a) | covered |

The library's chain has no attribute, event, slot or CSS custom property, so none has a row. The approved example's
toned, valued stages map through the stages, the label, value and annotation, and the tone rows (R-16). Q-T5 (b) is a
test body (US3-3 at 200 px), not a row.

## The other checks of SC-001

- **"pending inventory":** no row reads it. The phrase occurs once in the README, in the lead-in's sentence "No
  data-table row of the mapping reads "pending inventory"" (line 1017).
- **rc.10 variants:** the operator named none. IQ-1 (a) fetched the newest line, `develop` a6518cd, in place of an
  rc.10 tag, which the remote does not have; `develop` changes no role of the three families (inventory § What
  `develop` adds or changes). No other decision file names an rc.10-only variant.
- **No `class` attribute:** no row maps to a class; the class row maps the library's table class to the consumer's
  `<table>` "with no class".
- **"none" rows:** the six rows reading "none" (data-table tone, chain stage tone, connector part, empty-state part,
  invalid input, and the static form's "none needed") are each R-16's mapping by the operator's decision cited above.
  The README states no planning ID (its test forbids them), so the decision is cited here and in R-16, not in the row.
- **The issue texts:** #533's notes (Q-T1 to Q-T3 (a)) are in the header-cells and body-cells rows; #517's chip (Q-T4
  (a)) is in the compact-step row; the points `issue-texts-check.md` rates *agrees*, *no bearing* or *bears* change
  no row. #470's required states are covered for the timeline (default, light mode, narrow, compact) and for the data
  table, light mode by the row G-1 (b) added.

## Question for the operator

**G-1. The data table has no light-mode row.** #470's Desktop V2 contract requires a light-mode state of the library's
data table, and the library has a LightMode story for it (inventory § 1, § What `develop` adds or changes). R-16 says
the data table's required states "are covered by the rows above", but no row names light mode, while the timeline's
table (R-16 phase 2) and the chain's (R-16 phase 3) each have a "light mode" row, "built in: the light and dark
themes". The behaviour exists: every data-table story runs and is baselined in both themes.

- (a) No change. R-16 stands: light mode is the theme, not a data-table state, and the data table's rows cover it.
  This file records the asymmetry with the other two families, and T076 is ticked on this answer.
- (b) Add the row `.sk-data-table` | data table light mode | "built in: the light and dark themes", as on the other
  two families, and R-16's phase 1 table gains it. The README statement is written test first: a red body in
  `packages/elements/test/node/readme.test.ts` and its README row, in a phase 4 fix round, which is no longer exempt
  for that row.
- (c) As (b), but the row goes to a later issue with the other open data-table notes, and T076 is ticked with this
  question recorded as its answer.

**Recommendation: (b).** SC-001 asks for one row per state of the inventory, the two sibling families have the row,
and the cost is one row and one test statement, with no story, baseline or source change.

## The R-17 request to 009's owner (T077)

**State: open.** It has not landed, so T016 uses nothing and the caption is not sticky (Q-F (b)).

- **What was asked** (research R-17, operator decision (c), 2026-11-16): a module option that keeps a box pinned at
  the start edge (the sticky caption) out of the overflow-region module's start-fade mask, asked of 009's owner
  through the operator.
- **On `main`:** the local `origin/main` is b594b7e ("Mission 009: workflow and layouts"), an ancestor of this branch
  (merged at 8ee3351). Its `OverflowRegionOptions` has `box`, `role` and `step` only, as T001's recheck found
  (`reviews/recheck.md` § 2: "Difference: none", the request "stays open with the operator").
- **On this branch (4106d7d):** `OverflowRegionOptions` has `box`, `role`, `step` and this mission's block-axis pair
  `blockAxis` and `blockStartBox` (FR-018, the pinned header row at the block start, IQ-2); no option keeps a box at
  the inline start out of the start fade. Nothing in `packages/elements/src/`, `specs/009-workflow-layouts/` or the
  history names a pinned-start option.
- **Where it shows:** `packages/elements/README.md` § `ocelle-data-table` says "The caption scrolls with the table
  until the overflow-region module's pinned-start option lands"; R-07 and Q-F (b) hold.
- **Not checked:** the request's state outside this repository (an issue or a message to 009's owner); this check
  read the repository only and contacted no one. Landing it is a later MINOR (R-17).
