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

**Driver helpers, as on the branches (PLAN-CORRECTNESS-1-006).** 013's driver: `viewport`, `scrollWidth`, `copy`,
`text`, `pressTab`, `focused`, `frames`, `layout`, `computed(id)`, `reducedMotion(mode)`. 009's (015's) driver:
`press`, `tabWalk`, `activeElement`, `focus`, `scrollLeft`, `setScrollLeft`, `frameRecord`, `settle`,
`computed(target)`, `reducedMotion(on)`. The one addition is `itemTexts` (R-11). Where the two conflict (`computed`,
`reducedMotion`, the focus readers), the bodies use the reconciled form T001 records.

**Layout wait (PLAN-TESTABILITY-1-007).** Every body that reads a layout after a change (a resize, an item added,
removed, hidden or shown, a `time` or `variant` set, a table swapped) waits with 009's `settle` as merged (the
observers' callbacks and two animation frames). 013's `layout(id)` reads the first `dl` of a shadow root, so it is not
used for the lists.

## Oracles

| Oracle | Used by | How |
|---|---|---|
| AX tree, table | US1-1, US1-4, US1-6, US1-7, US1-15, US1-16, the R-04 caption-text bodies | The full Chromium AX tree: compare the element's subtree with the same table outside; region `group` and name |
| AX tree, lists, and `itemTexts(list)` (new, R-11) | US2-1, US2-3, US2-5, US2-6, US2-10, US3-1, US3-6, US3-7, US3-10 | `StaticText` names under each `listitem`, joined, collapsed and trimmed. Each assertion also checks the text is not empty. US2-5, US2-6, US3-6 and US3-7 also assert the `listitem` count and that no other child of the container is in the tree. No marker or connector node is in the tree, and a DOM assertion pins `aria-hidden="true"` on every marker wrapper and connector span |
| computed style | US1-2, US1-3, US1-10, US1-14, US2-3, US3-2, US3-4, the `time` bodies (R-10) | `getComputedStyle` on cells, headers, caption, time, marker and chip, against the token's computed value read from a probe |
| geometry | US1-4, US1-12, US2-2, US2-9, US3-2, US3-3, US3-4, US3-5, US3-9, ordinal fit, mixed chips, the `time` bodies, the caption bodies (R-07), the shrink-to-fit bodies (R-02), the timeline connector bodies (R-10) | `getBoundingClientRect` on real elements (markers, connector spans, `<li>`, the chip, the host, the caption's line boxes through a `Range`): marker size, centring on the first line, the caption's start against the table's and its line boxes inside the box's unmasked extent, the host's inline size in a shrink-to-fit host, each timeline connector clear of both dots with `space-1` gaps (0.5 px) and `elementFromPoint` inside each dot returning the marker, connector ends inside the chain, chip block size < `size-step`, the ordinal box inside the marker's padding box, connector centres on the row's marker centre (0.5 px). US1-12, US2-9 and US3-9 assert inline-start edges against the container's: under `dir="rtl"` the first column's, the markers' and the first step's right edges are at the container's right edge, and lines fill towards the left. US3-5 asserts the long step's box stays inside the chain |
| scroll width | US1-4, US2-4, US3-3, US3-5, 640 px bodies, the flex-item and grid-item bodies (R-02) | page `scrollWidth === innerWidth` |
| keyboard | US1-5, US1-8, US1-13, US2-7, FR-011 link in a step | See the table below |
| copy | US1-9, US2-4 | 013's `copy` |
| forced colours | US1-11, US2-8, US3-8 | `emulateMedia({ forcedColors: "active" })`. Text: a system text colour. Each mark (cell rules, timeline marker and connector, step ring and connector, chip outline): the border side that draws it has a foreground system colour (`CanvasText`, never the ground's `Canvas`) and a width above zero, and its border box is not empty (PLAN-A11Y-SECURITY-1-001) |
| contrast, source | US1-11, US2-8, US3-8 | Node checks `packages/elements/test/node/records-pairs.test.ts` and `packages/styles/test/data-table-pairs.test.ts`: each colour painted is tied to a `checked` row of `pairs.json` on the nine main grounds in both themes; a removed-row fixture must fail the check (R-13) |
| contrast, rendered | US1-11, US2-8, US3-8 | Each rendered colour (cell, header, time, content, marker, ring, ordinal, chip outline) in light and dark equals the probe-resolved value of the token the source names, and that token is then looked up in the declarations (R-13) |

**Keyboard bodies and their helpers.**

| Body | Helpers |
|---|---|
| US1-5 | `focus` on the box, `press("ArrowRight")`, `press("ArrowLeft")`, `scrollLeft` before and after, the fade read from `data-fade` |
| US1-8 | `setScrollLeft(0)`, `pressTab` until the link has focus, `focused`, `scrollLeft`, `frameRecord` for the ring's box against the fade depths |
| US1-13 | `focus` on the box, the swap, `settle`, `activeElement` (the handover target) |
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
| "throws nothing" halves (empty containers, no table, items outside a container) | an empty render throws nothing | the empty containers render no `<ol>` and expose no `listitem`; the no-table data table has `.region-box` and no slotted node; an item outside its container shows its shadow `part="content"` (and the event its `part="time"` text) |
| the "not shown" halves of US2-6 and US3-7 | an empty render shows nothing | the item children are shown: one `<li>` per item, `itemTexts` equal to the items' texts, no other child's text in the tree |
| the pre-upgrade bodies | (none: no rule exists at red) | each visible item's box starts below the previous one before definition, and a `hidden` or `aria-hidden="true"` item is not shown |
| the no-pill grep | no source exists at red | element plant: `pill` written into the chain's styles must fail it |
| define twice | the first definition wins with no element | the elements' tag names resolve to the first copy's classes, and each renders its shadow structure |

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
| The end fade subtracted from the cap unconditionally (`--data-table-end-fade` set on `.region-box` whatever its `data-fade`; R-07, PLAN-FRESH-3-002) | the one-long-word narrow-table body (no tab stop, no `data-fade`), the fitting-table caption body (wraps at the table's width) |
| `--data-table-end-fade` never set (R-07) | the 320 px at-rest caption body (line boxes inside the unmasked extent) |
| `contain: inline-size` added to the caption (R-07, PLAN-FRESH-3-002 (b)) | the one-long-word narrow-table body |
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

**Equivalent in Chromium (PLAN-TESTABILITY-1-005).** Removing `aria-hidden` from the timeline's marker wrapper, or
from a connector span, cannot fail an AX body. The squad's refute pass reran the probe (google-chrome headless,
`Accessibility.getFullAXTree`): an empty `<span class="marker-line"><span class="marker"></span></span>` with no
`aria-hidden` adds no unignored node, and the listitem holds only `StaticText "14:02 Mission created"`, while a
`<span class="marker">1</span>` adds `StaticText "1"`. These changes are recorded as equivalent in Chromium, and the
DOM assertion of § Oracles (each marker wrapper and connector span carries `aria-hidden="true"`) pins the guard for
WebKit, which is not measured.

## Stories (FR-050)

In `storybook/stories/<element>.stories.ts`, each in light and dark (PLAN-CORRECTNESS-1-007, operator decision (a)):

- **Data table (12):**
  - fits;
  - overflows, named by `label`;
  - overflows, named by its caption (no `label`);
  - overflows, unnamed (no caption, no `label`): the box is focusable with no role and no name;
  - row headers;
  - corner header;
  - `wrap="anywhere"`;
  - inside prose;
  - right-to-left;
  - empty body;
  - 320 px;
  - no table (an empty region).
- **Timeline (9):**
  - three events;
  - an event without a time;
  - a long identifier with `wrap`;
  - a link in an event;
  - one event;
  - a hidden event (three events, the second `hidden`);
  - right-to-left;
  - 320 px;
  - empty (no visible event).
- **Chain (11):**
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
  - empty (no visible step).

That is 32 stories, 64 baselines: `visual:update` reports 24, 18 and 22 added in phases 1 to 3 (R-15).

The item elements' states are in their container's file. A standalone item has no story (FR-050). No story sets a
blank or decisive host `aria-label` unless the phase 2 spike shows axe is clean on it (R-09). The story test checks
presence in light and dark, 320 px reflow of each container story, and that every list in every story has a name
except the unnamed chain story and the empty stories (which render no list). A story the `axe` gate fails (the unnamed
overflowing table is the likeliest) is fixed in the story or the element, or goes to the operator with a Complexity
Tracking row.

## Gates per phase

| Gate | When |
|---|---|
| `gate:unit-tests`, `gate:typecheck`, `gate:lint`, `gate:style-lint`, `gate:test-lint`, `gate:csp`, `gate:prefix`, `gate:manifest`, `gate:contrast`, `gate:brand-rules` | every phase |
| `gate:storybook-build`, `gate:visual`, `gate:axe` | phases 1 to 3, with the phase's baselines from `visual:update` in #10's pinned container under docker |
| `gate:plants -- --affected <phase base>` (op 016), `--list` recorded in `reviews/phase-<N>/plants.md` | every phase; never a full local `gate:plants` |
| element plants (§ Element plants), recorded in `reviews/phase-<N>/element-plants.md` | phases 1 to 3, after green |
| `gate:mutation` | every phase, under #23 and op 015 |
| `gate:signoff` | every commit signed off |
