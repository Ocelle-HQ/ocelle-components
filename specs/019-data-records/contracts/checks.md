# Contract: checks (tests, oracles, plants, stories, gates)

Names of files and driver functions follow 013's and 009's on `main`; T001 rechecks them and rewrites the helper names
below to the merged ones (R-14).

## Harnesses

The harness paths are 013's: `packages/elements/test/in-process.ts` (in process), `test/browser/driver.ts` (the
built browser build) and `test/scenarios/driver.ts` (the shared driver interface). Each shared scenario body in
`test/scenarios/<element>.ts` runs twice:

- in process, on the element source, through `test/<element>.test.ts` (the `elements` project, mutated);
- on the built browser build, on strict-CSP fixture pages, through `test/browser/<element>.test.ts`.

Each body is named after its scenario (`US1-4 …`) or its edge case. Every acceptance scenario and every edge case
that states behaviour has a body (FR-052).

**Driver helpers, as merged on `main` (PLAN-CORRECTNESS-1-006; T001, `reviews/recheck.md` § 5).** From 013:
`viewport`, `scrollWidth`, `copy`, `text`, `pressTab`, `focused`, `frames`, `layout`. From 009: `press`, `tabWalk`,
`deepActive`, `focus`, `scrollLeft`, `setScrollLeft`, `frameRecord`, `settle`. The conflicts are reconciled on `main`
as `computed(target, property)`, where a target is an id or `{ id, inner }` (013's id form is the string case);
`reducedMotion(mode)`, with `"reduce"` or `"no-preference"`; and the focus readers `focused()` (013, the innermost
focused element's id), `deepActive()` (009, the deep active element as a string, `"s1 >> div.region-box"`) and
`activeElement()` (011, the same element as a record `{ name, id, hosts }`); and `hover(id, inner?)`, used for the
row hover (US1-24). The additions are `scrollTop` and `setScrollTop` (phase 1, T079, for the block-axis option, R-18)
and `itemTexts` (phase 2, R-11): three in all. The no-hover bodies of US1-24 (re-analysis A2 (a)) need no addition:
they run in 008's touch context as merged, the `elements-touch` project (`*.touch.test.ts`, in process) and
`visit(…, { touch: true })` (fixture), where Chromium matches `(hover: none)` (008 research R-14), read through the
merged `device()`.

**Layout wait (PLAN-TESTABILITY-1-007).** Every body that reads a layout after a change (a resize, an item added,
removed, hidden or shown, a `time` or `variant` set, a table swapped) waits with 009's `settle` as merged (the
observers' callbacks and two animation frames). 013's `layout(id)` reads the first `dl` of a shadow root, so it is not
used for the lists.

## Oracles

| Oracle | Used by | How |
|---|---|---|
| AX tree, table | US1-1, US1-4, US1-6, US1-7, US1-15, US1-16, US1-18, US1-20, the R-04 caption-text bodies, the FR-010 host `aria-label` body, the hidden-host bodies | The full Chromium AX tree: compare the element's subtree with the same table outside, whose column headers a test-only rule gives `text-transform: uppercase` (a constructed sheet adopted by the document in the fixture harness), because Chromium names column headers by their drawn upper-case text (spike Q2 (a)); US1-1 also asserts the column headers' names in upper case ("ID", "TITLE", "LANE", "OWNER", "LINK"); region `group` and name |
| AX tree, lists, and `itemTexts(list)` (new, R-11) | US2-1, US2-3, US2-5, US2-6, US2-10, US2-11 to US2-14 (US2-14's `slot` change included), the slotted-time edge bodies (R-10), US3-1, US3-6, US3-7, US3-10, the FR-026 bodies (no live region, landmark or heading node in the container's subtree), the hidden-host bodies | `StaticText` names under each `listitem`, joined, collapsed and trimmed. Each assertion also checks the text is not empty. US2-5, US2-6, US3-6 and US3-7 also assert the `listitem` count and that no other child of the container is in the tree. No marker or connector node is in the tree, and a DOM assertion pins `aria-hidden="true"` on every marker wrapper and connector span |
| computed style | US1-2, US1-3, US1-10, US1-14, US1-17 (the header cells' ground), US1-22 (`text-align`, `font-variant-numeric`, the eyebrow type kept), US1-23 and US1-24 (each cell's `background-color` against `--ocelle-color-inset` or `--ocelle-color-hover-bg`, and `cursor`), US1-26 and US1-27 (the box's `data-block-fade` and `data-fade`, its computed `mask-image` layer count, `mask-composite` equal to the list `add, add, intersect, add` and the four `mask-size` figures, top first the block scrollbar's, the inline scrollbar's and the two fades', against the box's client size and scrollbar thicknesses; spike-2 § 3), US1-20 (no `data-axis` while nothing overflows in the block axis, spike-2 Q-3 (c)), US2-3, US2-11, US3-2, US3-4, the `time` bodies (R-10) | `getComputedStyle` on cells, headers, caption, time (the attribute time's `part="time"` and each slotted time node, a `<b slot="time">` included), marker and chip, against the token's computed value read from a probe |
| geometry | US1-4, US1-12, US1-17 and US1-21 (the `<thead>`'s block-start edge against the box's client block-start edge once scrolled by the ring room or more, and at its at-rest position, the ring room below the edge or below the caption, back at the block start (block 1's negative inset, spike-2 Q-2 (a)); each column header's inline start against its column's cells, within 0.5 px; `elementFromPoint` at each header cell's centre returning that cell), US1-19 (the link's ring box below the header row's block-end edge and inside the box), US1-26 (the block-end fade's block-start edge, the box's client block-end edge less `.region-edge.block-end`'s block size, at or below the header row's block-end edge; in the captioned case at 320 px, against the `<thead>`'s current block-end edge, A1 (c) decided (a) after T082: in a 100 px bound no fade at rest and a fade once scrolled past the caption, in a 300 px bound a fade at rest, and a row-1 link's ring box cleared to the header's current block-end edge, spike-2 § 11; a caption link, Q-S2-1 (a): in the 300 px bound at rest `scrollTop` unchanged and `data-block-fade="end"` kept, and past the caption its ring box's block-start edge at the client block-start edge, its block-end edge at or above the `<thead>`'s current block-start edge and `elementFromPoint` at its centre returning it), US1-27 (the link's ring box above the fade's block-start edge and below the header row), US1-22 (the text's line box end against the cell's content box end, through a `Range`), US2-2, US2-9, US2-11, US2-13, US2-14, US3-2, US3-3, US3-4, US3-5, US3-9, ordinal fit, mixed chips, the `time` bodies, the caption bodies (R-07), the shrink-to-fit bodies (R-02), the timeline connector bodies (R-10) | "Within 0.5 px" is inclusive everywhere (`\|difference\| ≤ 0.5`, never `< 0.5`): spike-2 § 8 measured the separated row rules exactly 0.5 px from the collapsed ones. `getBoundingClientRect` on real elements (markers, connector spans, `<li>`, the chip, the host, the caption's line boxes through a `Range`): marker size, centring on the first line, the caption's start against the table's and its line boxes inside the box's unmasked extent, the host's inline size in a shrink-to-fit host, each timeline connector clear of both dots with `space-1` gaps (0.5 px) and `elementFromPoint` inside each dot returning the marker, connector ends inside the chain, chip block size < `size-step`, the ordinal box inside the marker's padding box, connector centres on the row's marker centre (0.5 px). US1-12, US2-9 and US3-9 assert inline-start edges against the container's: under `dir="rtl"` the first column's, the markers' and the first step's right edges are at the container's right edge, and lines fill towards the left. US3-5 asserts the long step's box stays inside the chain |
| scroll width | US1-4, US1-21, US2-4, US3-3, US3-5, 640 px bodies, the flex-item and grid-item bodies (R-02) | page `scrollWidth === innerWidth` |
| keyboard | US1-5, US1-8, US1-13, US1-18 (the arrows, and the keys the browser keeps, G1 (a)), US1-19, US1-26, US1-27, US2-7, FR-011 link in a step, the block-axis module bodies | See the table below |
| pointer | US1-24, the hover halves of US1-25 | the merged driver's `hover(id, inner?)` on a body cell, then `hover(null)`, with an unhovered row in the same body as the paired assertion. US1-24's no-hover half (A2 (a)) runs in the touch context: `device().hover` false asserted first, then `touchTap` on a body cell of a striped table and `hover` on another: no cell of either row has `--ocelle-color-hover-bg`, paired with the striped even row's cells keeping `--ocelle-color-inset`; and under forced colours the tapped row's band is `Canvas` or `CanvasText` (its stripe), never `Highlight` |
| copy | US1-9, US2-4 | 013's `copy` |
| forced colours | US1-11, US1-25, US1-28, the module's forced-colours body (T079), US2-8, US3-8 | `emulateMedia({ forcedColors: "active" })`. US1-28: the box's computed `mask-image` is `none`, and `.region-edge.block-end`'s `border-block-end` is `CanvasText` with a width above zero and a non-empty border box as wide as the frame while rows are below, and its width is zero at the block end; outside forced colours the edge's inline size is 0 (spike-2 Q-4 (a)). US1-25: the first body cell's `border-inline-start-width` equals `--ocelle-bar-width` and its colour is `CanvasText` on striped even rows, `Highlight` on the hovered row and `Canvas` otherwise; the pinned header cells' background is not transparent and their block-end border `CanvasText`. Text: a system text colour. Each mark (cell rules, the header rule below the column headers, timeline marker and connector, step ring and connector, chip outline): the border side that draws it has a foreground system colour (`CanvasText`, never the ground's `Canvas`) and a width above zero, and its border box is not empty (PLAN-A11Y-SECURITY-1-001) |
| contrast, source | US1-11, US1-17, US1-23, US1-24, US2-8, US3-8 | Node checks `packages/elements/test/node/records-pairs.test.ts` and `packages/styles/test/data-table-pairs.test.ts`: each colour painted is tied to a `checked` row of `pairs.json` on the nine main grounds in both themes, and each ground block 1 paints (`sheet`, `inset`, `hover-bg`) is one of the nine main grounds; a removed-row fixture must fail the check (R-13) |
| contrast, rendered | US1-11, US1-17, US1-23, US1-24, US2-8, US3-8 | Each rendered colour (cell, header, the three grounds, time, content, marker, ring, ordinal, chip outline) in light and dark equals the probe-resolved value of the token the source names, and that token is then looked up in the declarations (R-13) |

**Keyboard bodies and their helpers.**

| Body | Helpers |
|---|---|
| US1-5 | `focus` on the box, `press("ArrowRight")`, `press("ArrowLeft")`, `scrollLeft` before and after, the fade read from `data-fade` |
| US1-8 | `setScrollLeft(0)`, `pressTab` until the link has focus, `focused`, `scrollLeft`, `frameRecord` for the ring's box against the fade depths |
| US1-13 | `focus` on the box, the swap, `settle`, `deepActive` (the handover target) |
| US1-18 | `focus` on the box, `press("ArrowDown")`, `press("ArrowUp")`, a modified ArrowDown, `press("ArrowRight")` with no inline overflow; the box's block scroll position read by `scrollTop` and set by `setScrollTop`, two driver additions in phase 1's red (T079), the block-axis twins of 009's `scrollLeft` and `setScrollLeft`, each with its own test in both harnesses. The keys the browser keeps (G1 (a)): from the block start, `press("PageDown")`, `press("PageUp")`, `press("End")`, `press("Home")`, `press(" ")` and `press(" ", { shift: true })`, in that order, each from the position the previous key left, each followed by `settle`, `lastKeyPrevented()` (false), `scrollTop` (the key's direction and a non-zero move, never a fixed amount: `PageDown` and `Space` move by less than the client height, 262 px in a 300 px box in spike-2 § 10; the scroll range's end after `End`, 0 after `Home`), the box's `data-block-fade` and the `<thead>`'s block-start edge (0.5 px): at the box's client block-start edge after `PageDown`, `End` and `Space`, at its at-rest position (read before the first key) after `PageUp`, `Home` and `Shift+Space` (spike-2 Q-2 (a)); paired with `ArrowDown`'s `lastKeyPrevented()` true |
| US1-19 | the box scrolled so row 12 is under the header, `pressTab` to the link, `focused`, `frameRecord` for the ring box against the header's block-end edge; then a link in a header cell focused, the box's block scroll unchanged |
| US1-26 | `setScrollTop` to the end, `data-block-fade` absent; `focus` on the box, `press("ArrowUp")`, `settle`, `data-block-fade="end"` again. The caption link (Q-S2-1 (a)): `focus` on the box, `pressTab` to the link on the caption's second line, `focused`, `scrollTop` (unchanged at rest), `data-block-fade`; then `setScrollTop` past the caption, `focus` on the box, `pressTab` again, `settle`, `scrollTop` (lower), `frameRecord` for the ring box against the client block-start edge and the `<thead>`'s current block-start edge |
| US1-27 | `setScrollTop(0)`, `pressTab` to the link in the faded rows, `focused`, `scrollTop`, `frameRecord` for the ring box against the fade's block-start edge and the header's block-end edge |
| the block-axis module bodies (T079) | as US1-18 (the keys the browser keeps included), US1-19, US1-26 (its caption link as the element before the pinned child) and US1-27 on the test host, plus `deepActive` for the handover when both axes stop overflowing, and for the block fallback a ring box taller than the space, then `focusout` and a `setScrollTop` of more than 1 px each bringing `data-block-fade="end"` back |
| US2-7, FR-011 link in a step, FR-026 | `pressTab`, `focused`, `tabWalk` (the link is the only added stop) |

**US1-16 runs twice (PLAN-TESTABILITY-1-011).** Once with 013's `text` on the caption's text node (a `characterData`
change) and once replacing the `<caption>` element (a `childList` change). Each asserts the region's new name. The
element plant "the observer without `characterData`" must fail the first run.

## Bodies that the platform alone could pass (PLAN-TESTABILITY-1-002)

`red.sh` records the suite's exit code, so one failing body makes the whole run red. The red log is therefore read per
body: every scenario body must fail at red on an assertion, never on an import or setup error, and the review checks
this table against the red log. Each body below has an outcome the light DOM or the scaffold gives anyway, and so also
asserts something only the element gives, or is proven by a green-time element plant:

| Body | Outcome that holds without the element | Assertion only the element gives, or the plant |
|---|---|---|
| US1-14 | with no data-table rule, a consumer `td` rule always wins | the same body asserts a cell the consumer rule does not match has the compact padding (`space-1` / `space-2`), and a header keeps the eyebrow style |
| nested table not styled | a table with no rule is unstyled | the outer table's cells, in the same body, have the compact padding and the row rule |
| no `overflow-wrap` on header cells (FR-007) | no cell has `overflow-wrap: anywhere` | the body cells, in the same body under `wrap="anywhere"`, have `overflow-wrap: anywhere` |
| `<thead>` with an empty `<tbody>` | the table renders as written | the header row has the eyebrow style and the region exists (`.region-box` in the shadow root), with no added text node |
| US2-7, FR-026 | the link keeps its tab stop; no live region exists | the link's box is inside the `<li>`'s content column, after the marker column (inline offset at least `size-dot` plus `space-3`), and the list is in the AX tree with its name |
| FR-011 link in a step | the link keeps its tab stop | the link's box is inside its `<li>`, after the marker |
| "throws nothing" halves (empty containers, no table, items outside a container) | an empty render throws nothing | the empty containers render no `<ol>` and expose no `listitem`; the no-table data table has `.region-box` and no slotted node; an item outside its container shows its shadow `part="content"` (and the event its `part="time"` text, or its `part="time"` holding the `time` slot with the slotted node assigned) |
| US2-13, the empty or hidden slotted time with no `time` attribute | an unstyled `<time>` with no text, or a `hidden` one, shows nothing anyway | the same body asserts the event has no `part="time"` in its shadow root, its `<li>` has no `has-time`, the marker's centre is on the content's first line, and the slotted node is unassigned (`assignedSlot` is `null`) |
| US2-12, the attribute not shown | the light DOM never holds "09:00" | the same body asserts `part="time"` holds the `time` slot with the slotted node assigned, and after the slotted node is removed `part="time"`'s text is "09:00" |
| the "not shown" halves of US2-6 and US3-7 | an empty render shows nothing | the item children are shown: one `<li>` per item, `itemTexts` equal to the items' texts, no other child's text in the tree |
| the pre-upgrade bodies | (none: no rule exists at red) | each visible item's box starts below the previous one before definition, and a `hidden` or `aria-hidden="true"` item is not shown |
| the no-pill grep | no source exists at red | element plant: `pill` written into the chain's styles must fail it |
| define twice | the first definition wins with no element | the elements' tag names resolve to the first copy's classes, and each renders its shadow structure |
| the hidden-host bodies (FR-001, FR-015) | at red the scaffold has no `:host` display rule, so the user-agent `[hidden]` rule hides the host anyway | the same body asserts a sibling without `hidden` renders its shadow structure (`.region-box` with the table assigned, the `<ol>`, or the item's `part="content"`); element plant: `:host([hidden])` removed must fail it at green |
| FR-026, no landmark or heading | an empty render adds none | the same body asserts the container's named `list` is in the AX tree |
| US2-14's `slot` change | with no element, a `<time>` child shows wherever it is written | the same body asserts `part="time"` holds the node after `slot="time"` is set and the `<li>` has `has-time`, and neither after `slot` is removed |
| US1-20, `sticky-header` with no bound | a table with no rule has no block scroll and no tab stop anyway, and no `data-axis` | the same body asserts the table's computed `border-collapse` is `separate` and the `<thead>`'s `position` is `sticky` (the attribute took effect), and, after a test-only bound below the table's block size is set on the host, that the box carries `data-axis="both"` and scrolls in the block axis (spike-2 Q-3 (c)) |
| US1-24's "no other row changes" and "header rows paint nothing" | no rule paints any ground | the hovered row's cells, in the same body, have `--ocelle-color-hover-bg` (on a striped even row read in the dark theme, where `hover-bg` differs from `inset`; in light they are equal, spike-2 § 8) |
| US1-23's "odd rows paint none" | no rule paints any ground | the even rows' cells, in the same body, have `--ocelle-color-inset` |
| US1-22's "other cells stay start-aligned" | cells are start-aligned by default | the hooked cells, in the same body, are end-aligned with their text at the content box's end |
| the block-axis option off (T079) | 009's module never handles ArrowDown | the same host with the option on, in the same body, scrolls on ArrowDown and carries `data-axis="both"` |
| US1-19's "a link in a header cell is not cleared" | no clearance happens without the option | the same body first asserts the body-row link is cleared below the header |
| US1-26's "no block-end fade at the block end" and its room-rule half (Q-I4) | nothing fades in the block axis without the option | the same body first asserts `data-block-fade="end"` and the four-layer mask at the block start with rows below |
| US1-24's no-hover half (A2 (a)) | at red no rule paints any ground | the same body asserts, in the touch context, a striped even row's cells on `--ocelle-color-inset`; element plant: the `@media (hover: hover)` guard removed must fail it at green |
| US1-18's "the module does not prevent the keys the browser keeps" (G1 (a)) | a key nobody handles is never prevented | the same body asserts each key scrolled the box in its direction and `data-block-fade` followed, and that `ArrowDown` (the module's key) was prevented |
| US1-26's caption link "not scrolled at rest" (Q-S2-1 (a)) | with no block clearance nothing scrolls | the same body then asserts, past the caption, the link's ring box brought back to the client block-start edge within 0.5 px, which Chromium's own focus scroll is not expected to do (it brings the link's border box, not its ring box, into view; T082's addendum measures this before the red commit); the at-rest half fails under the element plant below |
| US1-28's "line gone at the block end" | no line is drawn without the option | the same body first asserts the `CanvasText` line at the block start with rows below |
| the option-off guard's "no `data-block-fade`" (T079) | 009's module never writes it | the same host with the option on, in the same body, carries `data-block-fade="end"` |
| the two visible slotted times, one blank (A1) | the light DOM holds both nodes anyway | the same body asserts both are assigned to the `time` slot (`assignedSlot` is the `time` slot) and the item text is time first with no added text |

## Element plants (CSS-only behaviour Stryker does not mutate)

An element plant mutates green source, so it cannot exist at red (constitution VIII). After each phase's green, each
plant of the phase is applied to the green source or `base.css`, its guard bodies run in process, and the source is
restored; nothing is committed. The results go in `reviews/phase-<N>/element-plants.md` (plant, guard, the failing
assertion). A plant that does not make its guard fail stops the phase for the operator. `reviews/phase-<N>/plants.md`
stays op 016's gate-plant record in its set form, which the review compares line by line (PLAN-TESTABILITY-1-004).

| Plant | Must fail |
|---|---|
| The `fit-content` track rule removed (R-03) | US1-9 |
| `:host { min-inline-size: 0 }` removed (R-02) | the flex-item and grid-item bodies |
| `:host .region-box { container-type: inline-size; }` added (R-02, R-07) | the shrink-to-fit bodies |
| The caption's `max-inline-size` cap removed (R-07) | the 320 px caption bodies |
| The measured box size never written, so the cap falls back to `--ocelle-measure-container` (R-07) | the narrow-column caption body, whose table overflows at both 400 and 600 px (`data-fade="end"` asserted at rest first) and whose caption is longer than the box at both widths (PLAN-FRESH-3-003) |
| The observer moved back to `.region-box`, writing synchronously in its callback (R-07, PLAN-FRESH-3-001) | the no-loop check around the block host on first load with a caption that rewraps between the fallback and the measured cap |
| The end fade subtracted from the cap unconditionally (`--data-table-end-fade` written whatever the box's `data-fade`; R-07, PLAN-FRESH-3-002) | the one-long-word narrow-table body (no tab stop, no `data-fade`), the fitting-table caption body (wraps at the table's width) |
| `--data-table-end-fade` never set (R-07) | the 320 px at-rest caption body (line boxes inside the unmasked extent) |
| `contain: inline-size` added to the caption (R-07, PLAN-FRESH-3-002 (b)) | the one-long-word narrow-table body |
| The box size written as `.region-box`'s `clientWidth` (rounded) instead of the entry's unrounded inline size (R-07, PLAN-FRESH-3-002 verify 1) | the no-loop check around the one-long-word narrow-table body, whose precondition (the box's unrounded width has a fractional part between 0.1 and 0.4 px) is asserted first |
| The end fade written in the task in which the fade changes (synchronously in `updated()`, or by a shadow rule on `.region-box[data-fade="end"]` and `[data-fade="both"]`; R-07, PLAN-FRESH-3-002 verify 1) | the no-loop check around the end-fade body (a block-host table taken from fitting to overflowing by a cell edit, its caption rewrapping across the fade's depth) |
| The end fade written as the token's text `var(--ocelle-scroller-fade-size)` instead of `.region-edge.end`'s measured px width (R-07, recheck Q2 (c)) | the end-fade body (the computed `--data-table-end-fade` on `.region-track` is a px length equal to the edge's width within 0.01 px; the token's text computes to `2rem`) |
| The caption made sticky with `inset-inline-start: var(--ocelle-scroller-fade-size)` (Q-F (a)) | the caption bodies at rest and scrolled (start equal to the table's) |
| The caption text read as `textContent` (R-04) | the `hidden`, `aria-hidden` and `img alt` caption bodies |
| The observer without `characterData` (R-04) | US1-16, the `text` run |
| The prose override removed, or one property of it removed (the node test lists each) | US1-10, prose-override node test |
| The data-table block's `:where()` removed from the cell selector | US1-14 |
| The last-row selector back to `:is(tbody, tfoot) > tr:last-child` | the two-`<tbody>`-and-`<tfoot>` body |
| The header selection's `scope="row"` rule placed before the column-header rule | the corner-header body |
| `overflow-wrap` set on header cells too | the FR-007 header body |
| The header text in `rule-strong` | US1-11 rendered contrast, data-table contrast node check |
| The step marker's `aria-hidden` removed | US3-1, US3-10 (the ordinal becomes a `StaticText`) |
| `time` not reflected | the `time` set-by-property body (the marker's centre is off the first line) |
| The connector span rendered for the last `<li>` | US2-2 |
| The timeline connector started at its dot's centre (R-10) | the connector geometry bodies |
| `next-has-time` never set (R-10) | the mixed timeline's connector body |
| `hasTime` reading the `time` attribute only, ignoring the slot (R-10, plan gate Q-E) | US2-11, the mixed timeline's connector body |
| The attribute's text rendered beside the `time` slot while the event has a slotted time | US2-12 |
| `hasSlottedTime` counting a `hidden` or `aria-hidden="true"` node, or one with blank text | US2-13 |
| The `time` slot always rendered, whatever `hasSlottedTime` gives | US2-13 (the empty-slot halves: the time box exists) |
| The event's own observer without `characterData` | US2-14, the filled case |
| The timeline's observer without `subtree` | US2-14, the marker and connector halves |
| `slot` dropped from the event's observer's attribute filter (analysis G1) | US2-14's `slot` change (the time box) |
| `slot` dropped from the timeline's observer's attribute filter (analysis G1) | US2-14's `slot` change (`has-time`, the marker's line and the connector's end) |
| The `slot[name="time"]::slotted(*)` type rule removed | US2-11, the `<b slot="time">` case |
| The `::slotted([aria-hidden="true"])` `display: none` rule removed | the two-slotted-nodes body |
| The pre-upgrade `aria-hidden="true"` `display: none` rules removed (R-08) | the pre-upgrade `aria-hidden` bodies of both containers |
| The timeline dot drawn as a `background-color`, with no border | US2-8 forced colours |
| The timeline marker in `rule-strong` | US2-8 rendered contrast, records contrast node check |
| `data-line-end` never set | US3-3 |
| The ordinal counting only default steps | US3-6 |
| The chip radius changed to `radius-pill` | US3-4 |
| The chip block padding raised to `space-1` | US3-4 (block size) |
| The chip `<li>` without the reserved line box (no `min-block-size`) | the mixed-chips geometry body |
| The chip's box rule moved inside the variant block | US3-8 forced colours |
| A chain connector drawn as a `background-color` | US3-8 forced colours |
| The step ring in `rule`; the chip outline in `control-border` | US3-8 rendered contrast, records contrast node check |
| The line-end callback also toggling the `<li>`'s `padding-inline-end` | the chain's no-loop test |
| `pill` written into the chain's styles | the no-pill node test |
| `role="list"` removed | the explicit-role body |
| A blank host `aria-label` treated as decisive | US2-10, US3-10 |
| `:host([hidden])` removed, per element (FR-001, analysis G3) | that element's hidden-host body |
| The `<thead>`'s `position: sticky` removed (R-18) | US1-17 (the header's edge moves with the rows) |
| The sticky table's `border-collapse: separate` removed (R-18) | US1-17 (the header rule stays behind; its rendered position at the box's block start fails) |
| The pinned header cells' `--ocelle-color-sheet` ground removed (R-18) | US1-17 (`elementFromPoint` at a header cell's centre returns a body cell) |
| Block 2's sticky-table `border-collapse` removed (R-18) | the prose-override node test; US1-17 inside prose |
| The module's block-axis option ignored (`data-axis` never set) | US1-17, US1-18, the block-axis module bodies |
| The module's block clearance skipped, or measured without the pinned box | US1-19 |
| The module handling ArrowDown with the option off | the option-off guard body (T079) |
| The module's block-scrollbar mask layer dropped (the block-axis scrollbar masked) | the block-axis mask-figure body (T079) |
| The module's block-end fade never drawn (`data-block-fade` never set; Q-I4) | US1-26, the block-end fade bodies (T079) |
| The module's room rule dropped (the fade drawn into the pinned header) | US1-26's small-bound half, the room-rule body (T079) |
| The two fade layers composited by `add` instead of `intersect` | the block-axis mask-figure body (T079: the computed `mask-composite`), US1-27 |
| The `<thead>`'s negative `inset-block-start` replaced by `0` (spike-2 Q-2 (a)) | US1-17 (the header 5 px below the client block-start edge while scrolled) |
| `.region-edge.block-end` laid out full width outside forced colours (`inline-size: 0` removed, `inset-inline: 0` outside the forced-colours block; spike-2 Q-4 (a)) | the block-end fade body's edge geometry (T079: inline size 0 outside forced colours) |
| The module's block clearance ignoring the block-end fade | US1-27, the fade clearance body (T079) |
| The module's block clearance measuring an element before the pinned box from `pinnedEnd` (`before` always false; Q-S2-1 (a)) | US1-26's caption-link half (the link scrolled at rest), the element-before-the-pinned-box body (T079) |
| The module's block suppression never ending (no `focusout` or `scroll` reset) | the block fallback body (T079) |
| The forced-colours block-end line removed | US1-28, the module's forced-colours body (T079) |
| The `.box-size` write without the gutter subtracted while `sticky-header` is set (R-18) | the sticky caption body (line boxes inside the unmasked extent) |
| The host's column flex for `sticky-header` removed | US1-17 (the box is as tall as the table; no block scroll) |
| `data-ocelle-align` placed before block 2 | US1-22 inside prose |
| `data-ocelle-align` without `font-variant-numeric` | US1-22 in the plain prose table |
| The stripe on `:nth-child(odd)` | US1-23 |
| The stripe rule placed after the hover rule | US1-24 on a striped even row |
| The hover on `thead` and `tfoot` rows too | US1-24 (header rows paint nothing) |
| The forced-colours row band removed, or its `Highlight` rule placed before the stripe's | US1-25 |
| The hover rule's `@media (hover: hover)` guard removed (A2 (a)) | US1-24's no-hover half (a tapped row's cells on `hover-bg` in the touch context) |
| The forced-colours `Highlight` band rule's `@media (hover: hover)` guard removed (A2 (a)) | US1-24's no-hover half under forced colours (the tapped row's band `Highlight`) |

**Equivalent in Chromium (PLAN-TESTABILITY-1-005).** Removing `aria-hidden` from the timeline's marker wrapper, or
from a connector span, cannot fail an AX body. The squad's refute pass reran the probe (google-chrome headless,
`Accessibility.getFullAXTree`): an empty `<span class="marker-line"><span class="marker"></span></span>` with no
`aria-hidden` adds no unignored node, and the listitem holds only `StaticText "14:02 Mission created"`, while a
`<span class="marker">1</span>` adds `StaticText "1"`. These changes are recorded as equivalent in Chromium, and the
DOM assertion of § Oracles (each marker wrapper and connector span carries `aria-hidden="true"`) pins the guard for
WebKit, which is not measured.

## Stories (FR-050)

In `storybook/stories/<element>.stories.ts`, each in light and dark (PLAN-CORRECTNESS-1-007, operator decision (a)):

- **Data table (21):**
  - fits;
  - overflows, named by `label`;
  - overflows, named by its caption (no `label`);
  - overflows, unnamed (no caption, no `label`): the box is focusable with no role and no name;
  - overflows, named by a host `aria-label` (`aria-label="Deployments"` beside `label="Work packages"`): the region is
    a `group` named "Deployments" (spike Q1 (b));
  - overflows, blank host `aria-label` (`aria-label="  "` beside `label="Work packages"`): the region is a `group`
    named "Work packages" (spike Q1 (b));
  - row headers;
  - corner header;
  - `wrap="anywhere"`;
  - inside prose;
  - right-to-left;
  - empty body;
  - 320 px;
  - no table (an empty region);
  - sticky header, bounded (`sticky-header`, `label="Work packages"`, twenty rows, the host's `max-block-size` from a
    token in a `data-story` rule of `stories-layout.css`; at rest the region is a `group` tab stop by its block
    overflow and shows the block-end fade; inventory decision IQ-2, follow-up decision Q-I4);
  - sticky header, unbounded (`sticky-header`, `label="Work packages"`, the same twenty rows, no bound on the host:
    the table at full height, no block scroll, no tab stop at 1280 px, no block-end fade and no reserved scrollbar
    gutter (no `data-axis`, spike-2 Q-3 (c)); US1-20, the operator's decision C1 (b) on the re-analysis, 2026-11-18);
  - sticky header, under the room rule (`sticky-header`, `label="Work packages"`, the same twenty rows, no caption, the
    host's `max-block-size` a `calc()` over tokens in a `data-story` rule of `stories-layout.css`, bounded so that rows
    are below but less than twice the fade depth shows under the header: at rest the region is a `group` tab stop by
    its block overflow and draws no block-end fade, the space measured from the `<thead>`'s current block-end edge
    (A1 (c), decided (a) after T082, spike-2 Q-1 (a)); US1-26's room-rule half, the operator's answer to fixes-2 Q-1 (b), 2026-11-18);
  - numeric column (an estimate column whose header and body cells carry `data-ocelle-align="end"`, IQ-3);
  - striped (`striped`, two `<tbody>` groups, IQ-4);
  - row hovered (`parameters.ocelle.pointer.hover` on one body row's first cell, inside the 1280 × 800 viewport,
    IQ-5);
  - striped, an even row hovered (the pointer parameter on an even row of a striped table, IQ-4 and IQ-5).
- **Timeline (11):**
  - three events;
  - an event without a time;
  - marked-up times (each event's time a `<time slot="time" datetime>`, one event also with a `time` attribute that
    the slot overrides);
  - a long identifier with `wrap`;
  - a link in an event;
  - one event;
  - a hidden event (three events, the second `hidden`);
  - right-to-left;
  - 320 px;
  - empty (no visible event);
  - standalone events (analysis C1 (c)): two `ocelle-timeline-event`s outside a timeline, one with a `time` attribute
    and one with a `<time slot="time" datetime>`, each its time above its content as plain text, no marker.
- **Chain (12):**
  - six steps in one row;
  - wrapped at 320 px;
  - mixed chips;
  - all chips;
  - twenty steps;
  - a long step;
  - `wrap`;
  - a hidden step (six steps, the third `hidden`);
  - right-to-left;
  - unnamed;
  - empty (no visible step);
  - standalone steps (analysis C1 (c)): a default and a `variant="chip"` `ocelle-evidence-step` outside a chain, each
    plain text with no marker, ordinal or chip box.

That is 44 stories, 88 baselines: `visual:update` reports 42, 22 and 24 added in phases 1 to 3 (R-15; phase 1's two
host `aria-label` stories added by spike Q1 (b), 2026-11-18, five by the inventory decisions IQ-2 to IQ-5,
2026-11-18, the unbounded sticky-header story by the re-analysis decision C1 (b), 2026-11-18, and the room-rule
sticky-header story by the answer to fixes-2 Q-1 (b), 2026-11-18). The block-end fade of Q-I4 shows at rest in the
bounded sticky-header story, whose baselines capture it, and the room-rule story's baselines capture a bounded box
with rows below and no fade. The one scroll-position state left, the bounded table scrolled to its block end (the fade
off, Q-I7 (a)), has no story: it is plan.md § Complexity Tracking's block-axis row, proven by US1-26, US1-28 and
T079's block-end fade bodies.
No existing baseline moves, 009's scroller and board baselines included (SC-007).

The item elements' states are in their container's file, the standalone item included (analysis C1 (c)). Only the
data table has stories with a host `aria-label` (the two above): phase 1's spike found axe-core 4.14.0 clean on that
state, and the operator chose both stories (spike Q1 (b)); the FR-010 host `aria-label` body stays. No story sets a
host `aria-label`, blank or not, on the timeline or the chain: those states are plan.md § Complexity Tracking's one
Principle V exception (R-09's axe risk), proven by the browser bodies (US2-10, US3-10). Each remaining phase's spike
(T026, T052) runs axe on the state; a clean result meets the row's sunset and goes to the operator, who decides
whether the phase adds the story. The story test checks presence in light
and dark, 320 px reflow of each story, and that every list in every story has a name except the unnamed chain story,
the empty stories and the standalone-item stories (which render no list). A story the `axe` gate fails (the unnamed
overflowing table is the likeliest) is fixed in the story or the element, or goes to the operator with a Complexity
Tracking row.

## Gates per phase

| Gate | When |
|---|---|
| `gate:unit-tests`, `gate:typecheck`, `gate:lint`, `gate:style-lint`, `gate:test-lint`, `gate:csp`, `gate:prefix`, `gate:manifest`, `gate:contrast`, `gate:brand-rules` | every phase |
| `gate:storybook-build`, `gate:visual`, `gate:axe` | phases 1 to 3, with the phase's baselines from `visual:update` in #10's pinned container under docker |
| `gate:plants -- --affected <phase base>` (op 016), the run itself (base, command, exit, verbatim output) recorded in `reviews/phase-<N>/plants.md` in op 016's form; the reviewer reruns it with `--list` and compares the `note: affected:` lines | every phase (phase 4: the mission's base, `reviews/phase-1/base.sha`, quickstart step 4); never a full local `gate:plants` |
| element plants (§ Element plants), recorded in `reviews/phase-<N>/element-plants.md` | phases 1 to 3, after green |
| `gate:mutation` | every phase with source, `--base <phase base>`, under #23 and op 015; phase 4 (quickstart step 6) on the mission's base |
| `gate:signoff` | every commit signed off |
