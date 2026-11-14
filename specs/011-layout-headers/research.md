# Research: Layout and Headers (011)

Decisions for [plan.md](plan.md). Each item: Decision, Rationale, Alternatives. "Measure before red" marks a
browser fact that phase 1's spike (`reviews/phase-1/spike.md`) measures in this container's Chromium before any red
commit depends on it; if a measurement disagrees, the spike records it and the plan's fallback named in that item is
used, or the operator is asked when no fallback is named.

## R-01 Conventions and files

**Decision**: the five elements follow `packages/elements/README.md` § Element conventions as mission 005 left
them: `src/ocelle-card.ts`, `src/ocelle-section-header.ts`, `src/ocelle-page-header.ts`,
`src/ocelle-context-sidebar.ts`, `src/ocelle-personal-rail.ts`, each ending in one `define()` call, each exported from
`src/index.ts` and defined by `src/browser.ts`; entry points `@ocelle/elements/<tag>.js` in `package.json` `exports`
(public surface, contracts/elements-package.md). Internal modules beside them: `src/slot-state.ts` (R-03) and
`src/card-context.ts` (R-05). Styles are one `css` template per element; variant rules that set colours or grounds
sit inside `@media not (forced-colors: active)`, and layout-only variant rules (size, padding, gap, direction,
wrapping) stay outside it, so a compact density, a compact size and a horizontal rail keep their layout in forced
colours (FR-001 as amended in plan squad round 1, US1-13, US4-9). Phase 2 amends the README's Styles paragraph to
that rule, with a readme-test statement written red first and a documentation note in the `@ocelle/elements`
CHANGELOG (FR-036).

**Box sizing**: `packages/styles/src/base.css`'s `:where(*) { box-sizing: border-box }` is a document rule and
does not reach a shadow tree (as `packages/styles/test/readme.test.ts:46-48` states), and a page may not link
base.css at all. Every host or shadow-tree box of these elements that has a size (`inline-size`, `block-size`, a
`min-` or `max-` size) together with padding or a border sets `box-sizing: border-box` in its own rule, so the sizes
the spec states are border-box sizes with or without base.css. Each element states its host display: `block` for the
section header, page header and card; `flex` (a column) for the sidebar and rail (R-09, R-10).

**Rationale**: FR-001; the README says a later element follows these rules without a design question. Applying
FR-001's original wording to layout variants would revert them to the default layout in forced colours.

**Alternatives**: one module for all five (rejected: an entry point defines one element).

## R-02 Slotted headings and fonts on slotted content

**Decision**: each header renders `<slot name="heading">` and styles `::slotted([slot="heading"])` with the tokens of
FR-012, FR-019 and FR-031 (`font-family`, `font-size`, `font-weight`, `letter-spacing`, `line-height`, `color`,
`margin: 0`, `overflow-wrap: break-word`, and `text-transform: uppercase` in the eyebrow style). No heading, `role` or
`aria-level` is rendered. The `::slotted()` rules beat the user agent's `h1`–`h6` rules (author origin over
user-agent origin) and lose to the page's own rules (outer context first), which is the spec's "Slotted headings"
rule. `--ocelle-figures` is applied with `font-variant-numeric`.

**Edge margins of slotted content** (operator decision PLAN-FRESH-2-002 (a), FR-008): the elements trim the user
agent's block margins at the edges of the content the page slots, so a `<p>` description or body and a `<ul>` section
take the gaps and padding the spec states and no 16 px more. Each rule is a normal `::slotted()` declaration, so a
page rule still wins (outer context first):

- section header and page header: `margin-block: 0` on `::slotted([slot="eyebrow"])` and
  `::slotted([slot="description"])` (the heading already has `margin: 0`); in both headers the heading-to-description
  gap is the heading column's flex `gap` (R-04, R-07), not a margin of the slotted element or of a wrapper;
- card (R-08): `margin-block-start: 0` on the first visible body element,
  `::slotted(:nth-child(1 of :not([slot]):not([hidden])))`, and `margin-block-end: 0` on the last,
  `::slotted(:nth-last-child(1 of :not([slot]):not([hidden])))`, so paragraphs of the body keep their spacing between
  each other while the first visible one starts at the header gap (or the padding edge) and the last visible one ends
  at the padding edge;
- context sidebar (R-09): `margin-block: 0` on each section (one element per section); on the head and footer, the
  first visible element of the slot gets `margin-block-start: 0`
  (`::slotted(:nth-child(1 of [slot="head"]:not([hidden])))`, the same for `footer`) and the last visible one
  `margin-block-end: 0` (`:nth-last-child(1 of [slot="head"]:not([hidden]))`, the same for `footer`), as in the card
  body;
- the rail sets no margin rule: its items are links or `ocelle-nav-item` elements with no UA block margin.

**Hidden elements at an edge** (PLAN-FRESH-3-004): every edge-trim selector excludes `[hidden]`, as R-09's section
rules do (PLAN-FRESH-2-001). Without it, in a body `<p hidden>Draft</p><p>Body</p>` the hidden `p` takes the trim
(and stays `display: none`, since the trim sets no display) while the visible `p` keeps its UA 16 px
`margin-block-start` (probed in plan squad round 3); the same for a hidden last body element and a hidden first or
last head or footer element. With the exclusion, the first and last *visible* elements are trimmed.

Margins between slotted elements of one part (two body paragraphs, two footer lines) are the page's. The README
states the trim and that a page rule wins (FR-036). The sidebar's section padding, inline margins, divider and display
are not trims and are `!important` (R-09), so a page rule does not change them; only a section's block margins are
the page's to set.

**Rationale**: keeps the page's heading level and outline with no ID reference across a shadow root (constitution
III; spec Assumptions).

**Alternatives**: a `level` property rendering `role="heading" aria-level` (rejected in the spec: page styles and
anchors would not reach it).

Measure before red: the UA `h1` margin and font size are overridden by `::slotted()` in Chromium (expected by the
cascade), and `text-transform` on a slotted heading gives the upper-cased name (already probed for spec check 1); the
UA `p` and `ul` block margins are overridden by the edge-margin rules above, and a body or footer of two `p`
elements keeps the margin between them (`:nth-child(1 of S)` and `:nth-last-child(1 of S)` under `::slotted()`); a
body `<p hidden>` before and after the visible `p`, and a footer `<p hidden>` before and after the visible one, leave
the visible `p` trimmed at both edges (`S` with `:not([hidden])`).

## R-03 Empty slots

**Decision**: an internal controller in `src/slot-state.ts` tracks, per slot of an element, whether it is empty by
the spec's definition (no assigned element, and every assigned text node empty or whitespace only; `assignedNodes()`
read on `slotchange`). Default slots, the only ones that can hold text nodes, are also re-read when an assigned
text node's data changes: a `MutationObserver` on the host with `characterData: true, subtree: true, childList: true`.
The state is a Lit `state` field per slot (not a property, not an attribute, not in the manifest) that sets an
`empty` class on the slot's wrapper in the shadow root; the wrapper of an empty slot is `display: none`, so it takes
no gap in its flex or grid container and adds no padding or divider (FR-005). A slot's wrapper starts empty until
the first read, which runs in `firstUpdated`, so a first paint never shows a gap that then disappears in a test that
measures after `updateComplete`.

**Rationale**: FR-005, US1-3, US1-4, US1-16, US2-4, US3-5, US3-6, US3-13, US4-6. `:has-slotted` is above the engine
floor (Chromium 134) and does not ignore whitespace text; `slotchange` does not fire for text data changes, hence the
observer.

**Alternatives**: `:has-slotted` (floor, whitespace); attributes on the host reflecting emptiness (would add public
surface the manifest must list).

## R-04 Section header layout (FR-010, FR-011)

**Decision**: the host is `:host { display: block }` (a custom element is inline by default, and the card and the
sidebar place section headers as blocks). The shadow root holds an outer column (`display: flex; flex-direction:
column; gap: var(--ocelle-space-1)`) with two children: the eyebrow wrapper, on a line of its own across the element's
inline size, and the row container (`display: flex; flex-wrap: wrap; column-gap: var(--ocelle-space-4); row-gap:
var(--ocelle-space-2); align-items: flex-start`). The row has two children: the heading column (`display: flex;
flex-direction: column; gap: var(--ocelle-space-1); flex: 1 1 min-content; min-inline-size: 0`) holding the heading
and description wrappers, and the actions wrapper (`display: flex; flex-wrap: wrap; gap: var(--ocelle-space-2)`,
keeping the initial `flex: 0 1 auto`). The eyebrow is therefore outside the row: the actions' block start is the
heading's (FR-010, US1-2), and the eyebrow's words take no part in the side-by-side test. When the eyebrow slot is
empty its wrapper is `display: none` (R-03), so the outer gap collapses. In the eyebrow variant the eyebrow and
description wrappers are not rendered. Text wraps with `overflow-wrap: break-word`, so a word's min-content is the
whole word (the column wraps the actions under it only when its longest word and the actions do not fit side by side)
and a word longer than the line still breaks inside itself once the column is on its own line.

The actions wrapper is shrinkable (`flex: 0 1 auto`, not `0 0 auto`; amended after phase 2, operator decision 5 of
`reviews/operator-decisions-implementation.md`): on a line of its own and wider than that line, it shrinks to the
line and its actions wrap onto further lines, `--ocelle-space-2` apart, rather than overflow the header (FR-004; with
`0 0 auto`, six actions at 320 px stay on one line and overflow). Side by side with the heading nothing changes, since
flex line breaking uses the unshrunk sizes, so the row wraps before any item shrinks and FR-010's side-by-side test is
the same.

The heading column is hidden (`display: none`, its `empty` class) while it shows nothing: the `heading` slot is
empty and either the `description` slot is empty or the variant is `eyebrow` (which renders no description). An
empty column then takes no line and no `row-gap` when the actions wrap (FR-005), and the actions, now the row's only
item, take `margin-inline-start: auto` (`.heading-column.empty + .actions`) so they stay at the inline end (FR-010).
The row itself is hidden when heading, description and actions are all empty, so an eyebrow alone takes no gap under
it (FR-005). The page header uses the same structure, including these rules, with its own padding and rule
(R-07).

**Rationale**: FR-010's rule and US1-2, US1-14, US2-2, US2-5 (PLAN-CORRECTNESS-1-001: with the eyebrow inside the
heading column, the actions aligned with the eyebrow, 22 px above the heading). With an empty part the wrappers are
`display: none` (R-03), so no gap remains. The shrinkable actions wrapper and the hidden empty column are phase 2's
departures 4 and 6 as fixed (`reviews/phase-2/notes.md`, `round-1-fixes.md`; reviews R1-04, R2-03, R3-02), judged
right against FR-004, FR-005 and FR-010.

Measure before red: `flex-basis: min-content` with `min-inline-size: 0` and `overflow-wrap: break-word` gives (a) the
actions beside the heading when the longest word plus actions fit, (b) the actions under the column when they do
not, (c) a 60-character run broken inside the column at 320 px with no horizontal overflow, and (d) with an eyebrow,
the actions' block start equal to the heading's block start, in both the section header and the page header. Fallback
if (a)–(d) fail: a grid with `grid-template-columns: minmax(min-content, 1fr) auto` and a container-free wrap rule decided in the
spike and recorded as a plan amendment at the phase-1 review.

## R-05 How a compact card reaches a slotted section header (SPEC-2-10, FR-007, FR-017)

**Decision** (operator decision PLAN-CORRECTNESS-1-007 (a), the pull model): the section header works out for itself
whether it sits in a compact card's `header` slot, from the DOM, and the card only tells directly assigned headers to
look again. An internal module, `src/card-context.ts`, holds two functions and no state:

- `inCompactCardHeader(header)`: true when `header.assignedSlot` is a slot named `header` whose root is the open
  shadow root of a host with `localName` `ocelle-card` and a `density` attribute equal to `"compact"` (the value
  the card's own `:host([density="compact"])` rule keys on, so an empty or invalid `density` is regular here too).
  Only a header assigned to that slot itself has it as `assignedSlot`, so a header in the body, nested in an element
  in the `header` slot, or in an inner card is not compacted (FR-017, US1-18).
- `notifyHeaders(slot, previous)`: calls `requestUpdate()` on every element with `localName`
  `ocelle-section-header` that has a `requestUpdate` method (an upgraded element) among `slot.assignedElements()`
  and among `previous` (the headers notified last time, so one that left the slot is also told), and returns the
  current set.

The card calls `notifyHeaders` on its `header` slot's `slotchange` and in `updated()` when `density` changed. The
section header resolves its size in `willUpdate`: its own `size` when valid (`"regular"` or `"compact"`), else
compact when `inCompactCardHeader(this)`, else regular; it also calls `requestUpdate()` in `connectedCallback`, so a
header moved in the DOM re-reads its slot. The card never imports the header's class (it matches by `localName`), so
`ocelle-card.js` still does not define `ocelle-section-header`.

Paths this covers (PLAN-CORRECTNESS-1-007, PLAN-TESTABILITY-1-009):

- **Definition order**: a header upgraded after the card's first `slotchange` resolves in its own first update; a
  header defined before the card is notified by the card's first `slotchange` once the card upgrades.
- **Moves**: a header whose `slot` attribute changes or that is moved out of the card is in `previous` at the next
  `slotchange` and re-resolves; one moved in by DOM insertion also re-resolves on connect. No flag is stored, so none
  can be stale.
- **Two copies on a page**: nothing is module-private; the header reads the DOM and the card's notice is the
  `requestUpdate()` every Lit element has, so a card and a header defined by different copies (for example the card
  by a bundle of `@ocelle/elements/ocelle-card.js`, the header by the browser build) still agree. The one limit: a
  header of a copy that does not answer `requestUpdate()` is not notified and re-resolves only at its next own update
  (connect or attribute change); every Lit copy answers it, and the README states the limit.

No CSS custom property, part, attribute, public property or stored flag carries it, so FR-007's empty lists hold and
the `style-lint` rule's unknown-`--ocelle-*` check is untouched.

**Rationale**: `:host-context()` is not in WebKit; an element hook custom property would be public surface that
FR-007 excludes; a CSS custom property inherited from the card would also reach a header nested in the card's body
(US1-18 forbids that). A pushed, module-private flag (the earlier design) broke across copies and needed upgrade and
leave paths of its own.

**Alternatives**: `--ocelle-card-header-size` declared in the manifest (rejected by FR-007, and it would reach nested
headers); `:host-context(ocelle-card[density=compact])` (Chromium only); a shared `Symbol.for` key or a `globalThis`
registry (option (b), not chosen); the module-private `WeakMap` with a mixed-copy page left uncompacted (option (c),
not chosen).

Tests (phase 2, contracts/checks.md): density set and then removed by script (header compact, then regular); a header
moved from the `header` slot to the body by its `slot` attribute and back, and moved out of the card by DOM removal
and back; entry tests that import `ocelle-card.js`, mount, then import `ocelle-section-header.js`, and the reverse
order; a fixture page that loads a named same-origin test bundle of the module build's `ocelle-card.js` before the
browser build, so the card and the header come from different copies.

## R-06 Variant attributes and "not set" (FR-006)

**Decision**: every variant property is declared with `reflect: true` and no initializer (`declare` field, JSDoc
`@default undefined`), so upgrade writes no attribute (US1-1). Styles key on the valid attribute values only
(`:host([density="compact"])`, `:host([size="compact"])`, `:host([orientation="horizontal"])`,
`:host([variant="eyebrow"])`), so an empty or invalid value matches no rule and draws the default look without
the element rewriting it (US1-17, US4-8). `inset` is `type: Boolean, reflect: true`, styled by `:host([inset])`,
so `inset=""` and `inset="inset"` both draw inset (US1-10). The section header's size that the card can override
(R-05) is resolved in script, since it depends on the slot the header is assigned to: the header sets an internal class `compact` on its row
container when the resolved size is compact, and its stylesheet keys the heading size on that class.

**Rationale**: FR-006, FR-012, FR-017; no attribute churn on upgrade.

## R-07 Page header (FR-019) and its ground (SPEC-2-07, SPEC-3-06)

**Decision**: the host is `display: block` with block padding `--ocelle-space-4`, inline padding `--ocelle-space-6`
and `border-block-end: var(--ocelle-border-width) solid var(--ocelle-color-rule)`; it paints **no ground of its own**
(`background: none`): the band shows the surface it sits on (the page canvas or a pane). The heading-to-description
gap is the heading column's `gap: var(--ocelle-space-1)`, exactly as in R-04; no wrapper or slotted element carries a
margin for it (PLAN-FRESH-3-003). A margin on the description wrapper would survive when the heading wrapper is
`display: none` (an empty `heading` slot, R-03), giving 2 × `--ocelle-space-1` from eyebrow to description and a
`--ocelle-space-1` offset inside the band padding when the description is the first visible part (probed in plan
squad round 3: about 8 px instead of 4 px); a flex `gap` is dropped with the hidden item, as US1-16 measures in the
section header and US2-8 in the page header. The eyebrow-to-heading gap is the outer column's `--ocelle-space-1`
(R-04: the eyebrow sits above the row, so the actions' block start is the heading's, US2-2). The host also sets
`box-sizing: border-box` (R-01). The actions follow R-04's wrap rule, `--ocelle-space-2` under the
column, with R-04's actions wrapper as amended: it keeps `flex: 0 1 auto` (not `0 0 auto`), so actions on a line of
their own wrap rather than overflow at 320 px (FR-004); and the heading column is hidden while the `heading`
and `description` slots are both empty (the page header has no eyebrow variant), the actions then taking
`margin-inline-start: auto` to stay at the inline end (FR-005, FR-010). The `<header>` element is not used in the shadow root (a `header` not inside sectioning content maps to a
banner landmark); the band is a plain `div` (US2-1).

**Rationale**: #529 names no ground; a ground of its own would differ from the pane a header sits on in Kitty Desktop
(canvas in lists, pane in detail); the README states it. Plan squad may confirm.

## R-08 Card (FR-014 to FR-018)

**Decision**: the host is `display: block; box-sizing: border-box` with the border, radius, ground and padding of
its density; inside, a
flex column with `gap` of the density (`--ocelle-space-2` regular, `--ocelle-space-4` compact) holding the `header`
wrapper and the default-slot wrapper. A card whose header slot is empty hides its wrapper (R-03), so no gap remains
(US1-11). The first and last visible body elements have their outer block margin trimmed (R-02, FR-008; a `hidden`
body element at an edge is skipped, PLAN-FRESH-3-004), so a `<p>Body</p>` starts exactly the density's gap below the
header (or at the padding edge with no header) and ends at the padding edge, with or without a `<p hidden>` before or
after it (US1-7, US1-11). `inset` swaps `background-color` to `--ocelle-color-inset`. In forced colours the border colour is left to
the system (`border-color` is forced to a system colour by the user agent) and grounds become `Canvas`; nothing
else is needed for US1-13 beyond `forced-color-adjust: auto` (the default). The density's padding and gap rules are
layout rules outside the forced-colours query (R-01), so a compact card keeps them in forced colours (US1-13). The card
renders no role and attaches no internals role (FR-018, US1-19).

## R-09 Context sidebar box and dividers (FR-020 to FR-023)

**Decision**: the host is the navigation landmark (R-11) and the box the page places:
`:host { display: flex; flex-direction: column; min-block-size: 100%; align-self: start; box-sizing: border-box;
background-color: var(--ocelle-color-rail) }`. Its shadow root holds one layout container `div` (`display: flex;
flex-direction: column; flex: 1 0 auto`), so the sidebar fills a container with a definite block size when its content
is shorter and grows with its content when it is taller (FR-023, US3-3, US3-4), in a block, flex-row or grid container
(`align-self: start`, operator decision at the phase-1 spike, below), with three wrappers: head (padding
`--ocelle-space-4`), sections (the default slot) and footer (padding `--ocelle-space-4`, `margin-block-start: auto`
so it sits at the block end when content is shorter, US3-3, and follows the last section when taller, US3-4).
Dividers follow the content (operator decision PLAN-CORRECTNESS-1-004 (b)): each is drawn on the part before the
free space, so in a sidebar taller than its content the free space lies between the last divider and the footer.

- each section (`::slotted(:not([slot]):not([hidden]))`, an element in the default slot that the page has not
  hidden) is `display: block !important` (a `span` or a custom element such as `ocelle-section-header` is otherwise
  inline, and its border and negative margins would apply to its line boxes only), has `padding:
  var(--ocelle-space-4) !important`, `margin-block: 0` (normal, R-02, FR-008: a page rule on a section's block margins
  wins), `margin-inline: calc(-1 * var(--ocelle-space-4)) !important` (below) and `border-block-start:
  var(--ocelle-border-width) solid var(--ocelle-color-rule) !important`; the first visible section
  (`::slotted(:nth-child(1 of :not([slot]):not([hidden])))`) has `border-block-start: none !important`;
- **page resets** (operator decision PLAN-FRESH-3-002 (a)): the padding, inline margins, divider and display above are
  `!important`, following the slot convention (`packages/elements/README.md`: "the convention's size rules on slotted
  elements are `!important`"). For normal declarations the outer (page) context wins whatever the specificity; for
  `!important` ones the inner (shadow) context wins, over a page's `!important` too (CSS Cascade 5 § Context). Probed
  in plan squad round 3 with normal declarations on a 320 px sidebar of two `ul` sections: a page
  `ul { margin: 0; padding: 0; list-style: none }` or `* { margin: 0; padding: 0 }` left each section 288 px wide with
  no padding and its divider inset 16 px on each side, and a preflight `*, ::before, ::after { box-sizing:
  border-box; border: 0 solid; margin: 0; padding: 0 }` removed the divider altogether. With `!important` the
  section keeps FR-021's padding and FR-022's full-width divider under any page rule. `margin-block: 0` stays normal,
  so FR-008's "a page rule wins" still holds for a section's block margins, and the README says which properties a
  page can and cannot set on a section (FR-036). The `hidden` exclusion below is unchanged, so a hidden section still
  draws nothing;
- hidden sections (PLAN-FRESH-2-001): every section rule, the first-section exception included, excludes `[hidden]`.
  A `::slotted()` rule is an author rule of the outer context, so it beats both the user agent's `[hidden] { display:
  none }` and a slotted custom element's own `:host([hidden])` (an inner-context rule); without the exclusion a hidden
  `div` or `ocelle-section-header` section would be drawn as a padded, bordered block (probed in plan squad round 2:
  51 px each). With it, a hidden section has no box, padding or divider, and when the first section is hidden the
  first visible one has no `border-block-start` of its own, so it does not double the sections wrapper's head
  divider. Hidden sections still count as content for slot emptiness (spec "Empty slot", R-03), so the sections
  wrapper and its head and footer borders stay; when every section is hidden and the slot holds no text, those two
  borders meet with no block padding between them (PLAN-FRESH-2-001, verify 1). The spec states this as the
  consequence of its Empty slot rule and the README says to remove sections rather than hide them; no rule here
  collapses it, since a hidden attribute change fires no `slotchange`;
- the sections wrapper has `border-block-start` when the head is non-empty and `border-block-end` when the footer is
  non-empty (internal classes from R-03; nothing when the default slot is empty, R-03 hides it);
- when the default slot is empty and both head and footer are non-empty, the head wrapper has `border-block-end`
  (US3-13), the same side of the free space as the sections wrapper's `border-block-end` in US3-3;
- text in the default slot: the sections wrapper has inline padding `--ocelle-space-4` and no block padding; each
  section takes negative inline margins equal to that padding (`margin-inline: calc(-1 * var(--ocelle-space-4))
  !important`) so its border spans the sidebar's whole inline size and its own padding gives the content inset
  (FR-021, FR-022, US3-11).

The head and footer content has its edge margins trimmed as R-02 states (first and last visible element, `hidden`
ones skipped), so a `<p>` footer sits `--ocelle-space-4` from every side of its part, also beside a `<p hidden>`. Element children with `slot=""` are not in scope: the README says sections carry no
`slot` attribute.

- **Stretching containers** (operator decision at the phase-1 spike, option (a); `reviews/phase-1/spike.md` § R-09
  item 6 and § Stop-and-ask): without `align-self`, the host fills a 600 px container in a block, flex-row and grid
  container but grows past a shorter one in the block container only. In a single-line flex row of definite block
  size, the default `align-self: stretch` sets the item's block size to the line's whatever its content; in a grid of
  definite block size, the item with `min-block-size: 100%` stays at the container's size. Measured with
  `align-self: start` on the host: `600px` in a 600 px container and the content's size (713 to 786 px) in a 100 px
  container, in all three kinds, with and without base.css. `align-self: start` is a normal declaration on `:host`, an
  inner-context rule, so a page rule on the host's `align-self` wins (outer context, CSS Cascade 5 § Context); the
  README says so (FR-036), and a page that stretches the host in a flex row or grid of definite block size gets the
  container's size back. It has no effect in a block container. In a flex-column container the cross axis is the
  inline axis, so the host is sized to its content inline rather than stretched; phase 4 measured it
  (`reviews/phase-4/flex-column-probe.log`, 800 px containers): the sidebar is 800 px wide in a block and a grid
  container but 95 px (its content's) in a flex column and a flex row, 800 px in a flex column with a page rule
  `align-self: stretch` on the host (not in a flex row, where it acts on the block axis) or with content wider than
  the container, and 600 px tall in every case. The sidebar's inline size
  is the container's concern (FR-023); the README says that in a flex column or flex row the container or the page
  sets it (an `inline-size`, a `flex` value, a grid track, or `align-self: stretch` on the host; FR-036, operator
  decision 6 of `reviews/operator-decisions-implementation.md`). The declaration is covered by US3-4's flex-row and
  grid variants (contracts/checks.md § Pairing plants, the US3-4 row) and by its R-17 style plant.

**Rationale**: the spec's divider placement (FR-022 as fixed for SPEC-3-01 and for PLAN-CORRECTNESS-1-004) with no
change to the page's DOM. A percentage `min-block-size` on an inner box of an auto-height block host resolves to
nothing (PLAN-CORRECTNESS-1-003), hence the flex host. `align-self: start` makes the growth hold in the flex-row and
grid containers #12's shell is likely to use, with no change to the page's DOM and no script.

Measure before red: `::slotted(:nth-child(1 of :not([slot]):not([hidden])))` matches the first visible
default-slot element when a head element precedes it in DOM order (`:nth-child(of S)` is Chromium 111, WebKit 9, inside the floor); negative margins on
`::slotted()` elements in a padded wrapper give a full-width border, for `div`, `span` and `ocelle-section-header`
sections; a hidden `div` section and a hidden `ocelle-section-header` section (whose own sheet has
`:host([hidden]) { display: none }`) between two visible ones have no box under the `:not([hidden])` rules, with
exactly one divider between the visible sections, and a hidden first section leaves the first visible one without a
border of its own (`:nth-child(1 of :not([slot]):not([hidden]))`); `ul` and `p` sections take no UA margin; under
a page `ul { margin: 0; padding: 0; list-style: none }` and under a page `* { margin: 0; padding: 0; border: 0 solid }`
the `!important` section rules keep each `ul` section's padding and full-width divider (and with `!important`
dropped they do not, as probed in plan squad round 3); the host
box fills a 600 px container and grows past a shorter one, measured in a block container, a
flex-row container and a grid container, each with and without base.css. The page's DOM is never changed, so there is
no script fallback that marks the first section; if the measurement fails, the operator is asked before the US3 red
commit. Measured in the phase-1 spike: every item holds except the host's growth past a shorter flex-row or grid
container, which failed without `align-self` and holds with `align-self: start` (operator decision, option (a),
above).

## R-10 Personal rail layout (FR-024 to FR-027; SPEC-2-04, SPEC-2-05, SPEC-3-05)

**Decision**: the host is the navigation landmark (R-11) and carries the rail's size, padding and ground:
`:host { display: flex; flex-direction: column; align-self: start; box-sizing: border-box; background-color:
var(--ocelle-color-chrome); color: var(--ocelle-color-chrome-ink) }` (`align-self: start`: operator decision at the
phase-1 spike, option (a), as R-09). Its shadow root holds one layout container `div` (`display: flex;
gap: var(--ocelle-space-1); flex: 1 0 auto`) with three children: the primary wrapper, a divider `div` (decorative,
`aria-hidden="true"`, shown only when both groups are non-empty) and the bottom wrapper. The container's `gap` is
`--ocelle-space-1`, which is also the gap on each side of the divider (SPEC-2-04). Dividers follow the content
(operator decision PLAN-CORRECTNESS-1-004 (b)): in a vertical rail taller than its items, the free space lies between
the divider and the bottom group.

- **Vertical** (default): on the host, `inline-size: var(--ocelle-shell-rail-width); min-block-size: 100%;
  padding-block: var(--ocelle-space-2); padding-inline: var(--ocelle-space-1)`, so the host's border box is 52 px wide
  with a 44 px content box, and 600 px tall in a 600 px container, padding included (border-box, R-01); the container
  is `flex-direction: column`; groups are columns with `align-items: center; gap: var(--ocelle-space-1)`; the bottom
  wrapper has `margin-block-start: auto`; the divider is `border-block-start` across the content box. **Taller content
  than its container** (SPEC-2-05): the rail grows with its content (`min-block-size: 100%`, no `max-block-size`, no
  overflow clipping), as the sidebar does (FR-023); scrolling is the container's (#12's), stated in the README.
  Without `align-self`, the spike (`reviews/phase-1/spike.md` § R-10 item 4) measured a 677 px rail in a 100 px
  container growing in a block container only and staying `100px` in a flex row and a grid, its bottom group outside
  the host's box, with and without base.css, for R-09's cause. With `align-self: start` on the host it grows to
  `677px` in all three and still fills a 600 px container (operator decision, option (a)); a page rule on the host's
  `align-self` wins (outer context), stated in the README (FR-036). US4-2's flex-row and grid variants, and its
  taller-than-container variant in the three kinds, hold it (contracts/checks.md § Pairing plants).
- **Horizontal**: on the host, `inline-size: 100%; min-block-size: auto; padding: var(--ocelle-space-2)`, so its
  border box equals its container's inline size (border-box, R-01) whatever `align-self` does (in a flex row or grid
  `align-self: start` gives it its content's block size rather than the line's or area's; in a flex column its
  explicit `inline-size: 100%` sets the inline size, which `align-self` does not change; not measured); the container is `flex-direction: row`; the
  primary wrapper is `flex: 1 1 0; display: flex; flex-wrap: wrap; gap: var(--ocelle-space-1)`; the bottom wrapper is
  `flex: 0 1 auto; max-inline-size: 50%; margin-inline-start: auto; display: flex; flex-wrap: wrap; align-self:
  flex-start; justify-content: flex-end`, so it sits at the inline end also when the primary wrapper is hidden
  (US4-6, PLAN-CORRECTNESS-1-005); the divider is `align-self: stretch; border-inline-start` over the rail's content
  block size (every row, US4-7). Items are centred in the block direction within their row (`align-items: center`).
- The focus ring fits: the vertical content box is 44 px, a 40 px item leaves 2 px each side; the ring is drawn
  `--ocelle-focus-offset` + `--ocelle-focus-width` = 5 px outside the item, i.e. 3 px into the 4 px inline padding
  (1 px inside the border box). No `overflow` clipping is set on the rail (US4-2).
- Orientation is pure CSS on `:host([orientation="horizontal"])`, outside the forced-colours query (R-01, US4-9); the
  template does not change with orientation, so focus, DOM order and the landmark node stay (US4-5).
- **Item colour and stand-in items** (operator decision PLAN-FRESH-2-003 (a), FR-027): the rail sets
  `--ocelle-color-chrome-ink` as `color` on the host and styles no item; an item takes it only when it inherits
  colour. A plain `<a>` does not: the user agent's `a:any-link` colour beats inheritance (probed in plan squad round
  2: `rgb(0, 0, 238)` on the light chrome, 18 px tall, axe 4.14.0 `color-contrast` and `target-size` serious). Since
  #12's `ocelle-nav-item` does not exist yet, every rail story and fixture holds stand-in items: `<a>` elements styled
  by a same-origin stylesheet, never a `style` attribute (strict CSP, #10's story CSP plant): `display: inline-flex;
  align-items: center; justify-content: center; box-sizing: border-box; inline-size: var(--ocelle-size-rail-item);
  block-size: var(--ocelle-size-rail-item); color: inherit`. In Storybook the rules sit in #10's story layout sheet
  (`storybook/.storybook/stories-layout.css`, keyed on `[data-story]` only) or a sheet beside it, under a
  `[data-story="rail-items"]` selector the rail stories set on their root; on the fixture pages they sit in a linked
  same-origin fixture stylesheet under the same attribute. US4-2 asserts a slotted item's computed `color` equals
  `--ocelle-color-chrome-ink` (and follows its token sentinel, R-13). The README states that `<a>` items need
  `color: inherit` (or are `ocelle-nav-item` elements) and a target of at least 24 px.
- **The README's orientation example** (operator decision PLAN-FRESH-2-005 (a), FR-026, US4-10): the page reads the
  viewport with a media query whose bound is exclusive, `matchMedia("(width < Npx)")`, and sets `orientation` to
  `"horizontal"` while it matches and `"vertical"` otherwise, on load and on the query's `change` event. A column- or
  container-driven tier is #12's to build; the README says the rail does not care where the value comes from. The
  US4-10 test runs the README's code block on the fixture page (contracts/checks.md) and sets the viewport to N and
  N − 1 px; the plant rewrites the example's query to `(max-width: Npx)`, which turns the rail horizontal at N.

**Rationale**: FR-025 as fixed; #492's exclusive-bound complaint is answered by having no threshold in the element
(FR-026). #12 drives the rail by setting `orientation` (a reflected attribute), which a drawer or a shell query can do;
no event is needed. Sizing the host, not an inner box, makes the 52 px the box the page and #12's shell place
(PLAN-CORRECTNESS-1-002, PLAN-CORRECTNESS-1-003).

Measure before red: the focus ring inside the vertical rail; the host's border box 52 px wide with a 44 px content
box, and a horizontal rail's border box equal to its container's inline size at 320 px, each with and without
base.css; the host 600 px tall in a 600 px block container, flex-row container and grid container, and a rail taller
than a 100 px container growing with its content in the same three kinds (measured in the phase-1 spike: holds with
`align-self: start` only, above); a horizontal rail
with only bottom items has its bottom group at the inline end, in left-to-right and right-to-left; the stand-in
items' computed colour equals `--ocelle-color-chrome-ink` and axe 4.14.0 reports no `color-contrast` or `target-size`
finding on them in either theme.

## R-11 Landmark naming (FR-020, FR-024, FR-028)

**Decision**: the host itself is the navigation landmark, as 005's `naming.ts` pattern makes the host the `img`:
the sidebar and rail call `attachInternals()` and set `internals.role = "navigation"` and `internals.ariaLabel =
accessibleName(this.label, null) ?? null` (`src/naming.ts`: the trimmed `label` when non-empty, else no name),
updated whenever `label` changes. There is no `<nav>` in the shadow root; the layout container is a plain `div`
(R-09, R-10). A host `aria-label` attribute, when present, overrides the internals name natively (ARIA attributes win
over `ElementInternals` default semantics): a non-empty one names the landmark, a blank one leaves it unnamed even
with a `label`, and removing it falls back to the `label` in internals. That is FR-028's rule with no observation of
`aria-label` and no second node. The element never writes, rewrites or removes the host's `aria-label`. Nothing here
adds public surface; the manifest does not list internals.

**Where the internals are held** (operator decision PLAN-FRESH-2-004 (b)): not in a `#private` field as 005's
elements do (`readonly #internals`, `src/ocelle-icon.ts:87`, `src/ocelle-brand-mark.ts:110`), but in an own property
keyed by a symbol described `internals`: `src/naming.ts` gains `export const internalsKey = Symbol("internals")`
(internal; not exported from `src/index.ts` or `src/browser.ts`), and the sidebar and rail declare
`readonly [internalsKey] = this.attachInternals()`. axe-core 4.14.0's `gather-internals` reads exactly that (own
properties `_internals`, `internals` or `internals_`, or own symbols described `internals` or `privateInternals`), so
axe's role computation gives each host the `navigation` role (`axe.commons.aria.getRole(host) === "navigation"`) and
its ARIA attribute checks judge a host `aria-*` attribute against that role. axe's landmark rules do not see the host
(PLAN-FRESH-3-001, below). The field is not public surface: it is a
symbol-keyed field with no string name, marked `@internal` (and `@ignore`) so the manifest generator omits it, and
`test/node/manifest.test.ts` asserts that neither element's manifest entry lists a member for it, paired with
the same entry listing `label`. The same change for 005's `ocelle-icon` and `ocelle-brand-mark` (whose `img` role axe's role computation does not see either)
was considered: it would change 005's source and its tests, which is outside this feature's scope, so it is raised to
the operator at the plan gate as a follow-up for those elements and 005 is not touched here.

Probed for plan squad round 1 (CDP full AX tree, ignored nodes filtered; `reviews/plan/round-1/refute.md`): host
`aria-label="Team"` with an inner `<nav>` gave `generic "Team"` plus `navigation "Team"`; `internals.role = "none"`
gave the same (a global `aria-label` overrides `none`); the host as landmark gave `navigation "Squad"` alone,
`navigation "Other"` with `aria-label="Other"` and `navigation ""` with `aria-label=""`. The phase-1 spike repeats
these reads on the four US3-12 and three US4-11 cases.

**Axe** (operator decision PLAN-TESTABILITY-1-007 (b)): the package scenarios assert the accessibility tree only;
FR-028's axe clause is held by #10's `axe` gate on one story per US3-12 and US4-11 case, each rendering that landmark
alone (R-14).

Measured in plan squad round 2 (`reviews/plan/round-2/refute.md`, PLAN-FRESH-2-004; axe-core 4.14.0 as pinned at
`5f49794`, #10 FR-016's tag set, `region`, `landmark-one-main` and `page-has-heading-one` off), with the internals in
a `#private` field: axe does not see the internals landmark at all. The host gets no `landmark-unique` node, so two
unnamed hosts on one page raise no finding; the four US3-12 and the US4-11 cases give no violation, and the hosts
pass `aria-prohibited-attr` (axe 4.14.0 `listProhibitedAttrs` returns none for a valid custom element name) and
`aria-allowed-attr`. `region` is one of #10's excluded rules. With a `#private` field the per-case stories could
therefore only catch a regression that adds a node or attribute axe does flag, and could never fail on naming; that
is why the internals move to the `internals` symbol above.

**What axe sees under the symbol key** (measured in plan squad round 3, `reviews/plan/round-3/refute.md`,
PLAN-FRESH-3-001; operator decision (b)): axe's role computation reads the symbol, so `axe.commons.aria.getRole(host)`
is `navigation` for each host (and `null` with the `#private` field). axe's landmark rules do not: `landmark-unique`
selects its nodes by `[role=banner], [role=complementary], [role=contentinfo], [role=main], [role=navigation],
[role=region], [role=search], [role=form], form, footer, header, aside, main, nav, section` (axe-core 4.14.0
`axe.js:37604-37608`), and the other landmark rules (`landmark-*-is-top-level`, `landmark-no-duplicate-*`) select the
same way, by `role` attribute or landmark tag, before any role computation runs. A host whose role comes only from
`ElementInternals` is never a candidate, so two unnamed hosts raise no `landmark-unique` note under either key (for
real `<nav>` elements, or an explicit `role="navigation"` attribute, axe reports the note on one node of the pair,
not on both). No claim here or in the spec rests on axe's landmark rules seeing the host, and there is no
unnamed-pair story.

What the symbol key gives: on the per-case stories (US3-12, US4-11, each rendered alone), axe judges the host's ARIA
attributes against `navigation`, so the `axe` gate catches a serious or critical finding on the host and its subtree
(an ARIA attribute not allowed or prohibited on `navigation`, an invalid `aria-label` value, a second landmark node
in the template) in either theme. The stories do not check which name the landmark gets, and no axe rule checks two
unnamed landmarks; landmark naming is held by the package scenarios' tree reads (US3-12, US4-11), and the README's
"set a distinct `label`" (FR-036).

**Role probe** (the check that can fail, replacing the unnamed-pair story): the phase-1 spike and the phase evidence
of phases 4 and 5 run axe-core as pinned by #10 on a page holding the element (a story or a fixture page) and assert
`axe.commons.aria.getRole(host) === "navigation"` for one host with `label`, one with a host `aria-label` and one with
neither, recorded in `reviews/phase-N/` with the axe-core version; the plant moves the internals back into a
`#private` field, and the probe then reads `null` (contracts/checks.md). The symbol-field outcomes (the role probe,
and no serious or critical finding on the seven cases) are measured in the phase-1 spike against #10 as merged and
recorded in `reviews/phase-1/spike.md`; an adverse result is taken to the operator before the US3 red commit.

**Rationale**: the operator's "Follow convention" and FR-028; PLAN-A11Y-SECURITY-1-001 (both earlier options left a
named generic host node).

**Alternatives**: an inner `<nav>` with nothing on the host (option i) or with `internals.role = "none"` (option ii),
both rejected by the probe above. Internals in a `#private` field as in 005, with the measurement recorded and the
stories' limits stated (PLAN-FRESH-2-004 option (a), and again PLAN-FRESH-3-001 option (a), not chosen). An
unnamed-pair story expecting axe's `landmark-unique` note (the round-2 design, dropped in round 3: the note cannot
appear on an internals-only host, so its plant was vacuous).

## R-12 Eyebrow tokens (FR-030 to FR-032)

**Decision**: four records in `packages/tokens/src/source.ts`, type group: `font-size-eyebrow` (`var(--ocelle-font-
size-xs)`, `ref: ["font-size-xs"]`), `font-weight-eyebrow` (`var(--ocelle-font-weight-strong)`), `tracking-eyebrow`
(`0.08em`); colour group: `color-eyebrow` (`{ light: "var(--ocelle-color-ink-muted)", dark: … }`, `ref` both themes,
`contrast: { kind: "text", grounds: main }`). Contrast: 9 new rows per theme in `pairs.json`; pinned counts change
from 160 light / 168 dark / 328 entries / 149 required per theme (298 in all) to 169 / 177 / 346 / 158 (316 in all),
and the planted extra row's summary from 161 to 170 light. Each is changed first, at these places (as at base
`fcc55fc`; the phase-2 task re-reads them):

| File | Lines | Change |
|---|---|---|
| `gates/test/contrast-pairs.test.ts` | 5 (comment), 59, 61 | 160 / 168 → 169 / 177 |
| `gates/test/contrast-pairs.test.ts` | 63, 67 | 328 → 346 |
| `gates/test/contrast-required.test.ts` | 7 (comment), 58, 59, 63 | 149 → 158 |
| `gates/test/contrast-required.test.ts` | 67, 69, 70 | 298 → 316 |
| `gates/test/contrast-required.test.ts` | 13-46, the hand-transcribed A.8 table | `color-eyebrow` added to the first row's text foregrounds on `main` |
| `gates/test/contrast.test.ts` | 80, 81 | 160 / 168 / 149 → 169 / 177 / 158 |
| `gates/test/integration/plants-robustness.test.ts` | 116, 128 | 160 / 168 / 149 → 169 / 177 / 158 |
| `gates/test/integration/plants-robustness.test.ts` | 122 | 161 / 168 / 149 → 170 / 177 / 158 |
| `gates/test/integration/token-gates.test.ts` | 6 (comment), 27 | 298 → 316 |
| `gates/test/integration/token-gates.test.ts` | 13, 16 | 160 / 168 / 149 → 169 / 177 / 158 |
| `gates/bin/contrast.ts` | 116 (comment) | 160 / 168 / 149 → 169 / 177 / 158 |
| `packages/tokens/src/source.ts` | 4 (comment) | 149 → 158 |

`packages/tokens/test/expected.ts` gains the four tokens. The `token-only` rule's named-colour list
(`gates/test/token-only-parts.test.ts:27-28`, the 148 CSS Color 4 named colours) does not depend on the token set
and does not change. The `brand-rules` gate's rules are unaffected (no monospace, no radius, no chrome) and it runs in
the phase's gate set.

**Rationale**: FR-030's aliases keep one source of truth for the eyebrow's size, weight and colour, while #7 can use
the same names. `0.08em` is the spec's assumption. A list of exact places, not a grep, because the numbers also
occur in unrelated tests (for example `gates/test/mutation-shards.test.ts:86-88`).

## R-13 Tests: harnesses, fixtures, readers and pairing plants

**Decision**: as 005: shared scenario bodies in `packages/elements/test/scenarios/<element>.ts` against the driver,
run in process by `test/<element>.test.ts` (mutated) and on strict-CSP fixture pages by
`test/browser/<element>.test.ts` (browser build). Measurements read computed styles against the token values read
from the same page (never literals), boxes by `getBoundingClientRect`, the AX tree by the `axTree` command, forced
colours by `emulateForcedColors`. Right-to-left runs set `dir="rtl"` on `<html>`. Keyboard: Playwright `Tab` presses
on the fixture and `userEvent.tab` in process, asserting the deep active element (through shadow roots) per press.

- **Reflow** at 320 px sets the viewport and asserts, together with the positive stacking outcome, that
  `document.scrollingElement.scrollWidth <= 320` and that no text is clipped: for each slotted text node, a `Range`
  over it gives client rects that lie inside the border box of the element it is slotted into and inside every
  ancestor (in the flat tree) whose computed `overflow` clips. Plant: `overflow: hidden` plus `white-space: nowrap` on
  a wrapper, which keeps the scroll width green and fails the text-box assertion.
- **Token sentinels** (PLAN-TESTABILITY-1-002): several tokens share values (`font-display` is
  `var(--ocelle-font-sans)`, `color-chrome-ink` and `color-chrome-muted` agree, the eyebrow aliases equal their
  targets), so a comparison against resolved values cannot tell a wrong token from the right one. Each element has a
  token-sentinel scenario: through `driver.rules`, each token in contracts/elements-package.md § Tokens each element
  reads is overridden on `:root` with a distinct sentinel value of its type, and the computed style that reads it is
  asserted to follow; with the overrides removed the element draws its default again. The list of tokens comes from
  the same table the readme test checks, so the README list, FR-007 and the element's real reads cannot drift.
- **Card tree** (FR-018, US1-19): a card in each density, with and without `inset` and header, read from the AX tree:
  its subtree holds only the slotted content, paired with the slotted `h2` being present; plant: a `role="region"`
  wrapper in the template.
- **No event** (FR-002): each element's scenarios spy on `dispatchEvent` of the host and of every node in its shadow
  root, and listen on the host in the capture phase for every event type, across mount, slot changes and attribute
  changes; they assert that the element dispatched nothing, paired with the positive outcome of the same step (the
  layout change); plant: a `this.dispatchEvent(new Event("change"))` on slot change.
- **Driver and command additions** (phase 1, PLAN-TESTABILITY-1-006): DOM append, remove and text-data change of light
  DOM; Tab presses and the deep active element; viewport size and a container's inline and block size; the document's
  scroll width; text-node boxes and clipping ancestors; the heading level in `axNodes` (`AxNode` in
  `test/commands.ts` gains `level`). The behavioural readers (AX level, scroll width, deep active element, text
  boxes) are red first: a test in `test/commands.test.ts` or a driver test on a known page, each able to fail (a
  level-3 heading read as 3 and not 2; a page 400 px wide read as overflowing; focus inside a shadow root read as the
  inner element; a clipped text node reported). Pure plumbing (passing a viewport size to Playwright, mounting a
  container) is exempt, with the reason recorded in the phase-1 review.
- **Rail stand-in items** (R-10, PLAN-FRESH-2-003): the rail fixture pages link a same-origin fixture stylesheet that
  sizes `<a>` items under `[data-story="rail-items"]` to `--ocelle-size-rail-item` squares with `color: inherit`;
  nothing is styled through a `style` attribute, so the CSP record stays clean.
- **Plants**: each "does not" outcome has its pair and plant listed in contracts/checks.md § Pairing plants. A plant
  is applied by 005's method (`specs/005-icons-brand-mark/reviews/phase-4/plants.md`): a working-tree edit of the
  element source, the named scenarios run through both harnesses (the browser build rebuilt with the plant), the file
  restored, and the result recorded in `reviews/phase-N/plants.md` with the scenarios that failed in each harness. No
  plant is committed and no test hook is added to source.

## R-14 Stories, baselines and axe against #10 (FR-033, FR-037, FR-038)

**Decision**: planned against #10's design at commit `5f49794` of `claude/010-storybook-workbench`
(`specs/006-storybook-workbench`: spec FR-012, FR-013 to FR-016, FR-025 to FR-031; contracts/gates.md;
contracts/container.md). One story file per element, `storybook/stories/<element>.stories.ts`, each story rendering
one element state inside the story root, open shadow roots only, no element outside the root, no pointer state (none
of these elements has hover or press behaviour). Baselines are produced by `pnpm run visual:update` in the pinned
container and committed under `storybook/baselines/<story-id>.<theme>.png`; when a local capture and CI's disagree,
CI's captures from the job artifact are committed (#10 FR-005). The `axe` gate runs every story in both themes;
sidebar and rail stories each render one landmark, with a distinct label where they have one (axe's landmark rules do
not select an internals-only host, R-11, so no story relies on them). Rail stories hold the stand-in items of R-10 under `[data-story="rail-items"]`, so
`color-contrast` and `target-size` hold on them. FR-028's axe clause is held here (operator decision PLAN-TESTABILITY-1-007
(b)): one story per US3-12 case (host `aria-label` only, both, blank host `aria-label` with `label`, neither) and per
US4-11 case (host `aria-label` only, both, blank with `label`), each rendering that one landmark alone.
`storybook/test/integration/elements-stories.test.ts` (005) is extended first in each phase to the new stories: each
present in the built Storybook and rendering its element in light and dark, and, for SC-002 (operator decision
PLAN-CORRECTNESS-1-009 (a)), each loaded at 320 × 800 px with `scrollingElement.scrollWidth <= 320` and the text-box
rule of R-13, paired with the element rendering its slotted content; plant: a story whose slotted text is an
unbreakable `white-space: nowrap` run. #10's capture stays at 1280 × 800 px; the 320 px pass is the story test's.

**Recheck when #10 lands**: before phase 1 starts, the implementer compares #10 as merged on `main` against this
item (story file location, story id scheme, baseline path and naming, `visual:update` and gate commands, the axe rule
set and its excluded rules, the contributor note's items, the story layout sheet and whether a story may add rules
to it or a sheet beside it, and the axe-core version #10 pins, which the role probe of R-11 runs) and records any difference
in `reviews/phase-1/spike.md`; a difference that changes a task is raised to the operator before the red commit. At
`5f49794` the `axe` gate is not implemented (`gates/bin/axe.ts` is the "not implemented (axe, phase 4)" stub), so
the recheck confirms that #10 as merged runs axe-core on every story in both themes with FR-016's rule set; if it
does not, FR-038 and FR-028's axe clause have no gate and the operator is asked before the phase-1 red commit.

## R-15 Engine floor (FR-039)

**Decision**: the features used are inside the current floor (Chromium 120, WebKit 16.4): flexbox `gap`,
`flex-wrap`, logical properties, `:nth-child(of S)` (Chromium 111, WebKit 9), `::slotted()`, `MutationObserver`,
`ElementInternals` with `role` and `ariaLabel` (Chromium 90 and WebKit 16.4, inside the floor; 005 already uses
them), `assignedSlot`, and, in the README's orientation example only, the media-query range syntax `(width < N)`
(Chromium 104, WebKit 16.4). No container query, `:has()`, `:has-slotted`, `:state()` or `:host-context()`. The floor is
unchanged; the README's Engines list is not touched.

## R-16 Shared files and siblings

**Decision**: `packages/elements/src/index.ts`, `src/browser.ts`, `package.json` `exports`, `custom-elements.json`,
the README, the CHANGELOG and `storybook/test/integration/elements-stories.test.ts` are shared with #16 (008), #15
(009) and #9 (010). Conflicts are resolved by merging `main` into the branch (never a rebase), at landing
(`/ocelle-land`); `custom-elements.json` is regenerated after the merge, never hand-merged. No phase merges `main`
during the run (`/ocelle-run` step 4.3). #7 may land the eyebrow tokens first: if so, phase 1 uses them and drops its
token task, recorded at the phase-1 review.

## R-17 Declaration-level style plants (constitution VIII, SC-005)

**Decision** (operator decision PLAN-TESTABILITY-1-001 (a)): nearly all of this feature's behaviour is static
declarations in one `css` template per element, which Stryker mutates at most as one string-literal mutant per
template, and which CI's 30-line shards (`gates/lib/mutation/shards.ts:12-14`) leave unmutated when the template
spans a cut. So each phase adds a style-plant step to its evidence: for every declaration in the phase's new `css`
templates, the declaration is neutralised (deleted, or set to its initial value where deletion changes nothing
visible) in the working tree, both harnesses run that element's scenarios (the browser build rebuilt), the file is
restored, and `reviews/phase-N/plants.md` records the scenario that failed in each harness. A declaration that no
scenario catches is a blocking finding of the phase review unless the review records it as equivalent with a reason
(for example a declaration whose value equals the inherited or initial value in every case the spec names). Nothing is committed and no test hook is added to source. Stryker still runs on the changed
source as 005 decision 16 says, and covers the script logic (slot state, card context, size resolution, naming).

**Rationale**: Principle VIII requires every behaviour to be held by a test that can fail; for CSS the declaration
plant is the only per-declaration evidence.

**Alternatives**: a traceability table from each declaration to its scenario plus a Complexity Tracking exception
(option (b), not chosen).
