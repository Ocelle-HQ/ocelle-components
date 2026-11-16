# Open questions from the 013 inputs

Source: the operator's inputs, `specs/013-data-display/sources/013-inputs.md` (Part A: kitty-mission-ui inventory at
`c994c8ea`; Part B: spec-kitty-design #280, #498, #510 and #523 verbatim). Recorded in research R-11 (inventory) and
R-03 (the issues). No requirement, plan decision or public surface was changed to record them.

Each entry is a gap or conflict between the inputs and the current spec or plan, with the evidence, what the
artifacts say now, and options for the operator. Option (a) changes least. "Widens the surface" means a new
property, attribute value, slot, part or CSS hook (constitution VII, MINOR before 1.0.0), which only the operator can
choose. Each entry names the phase whose red commit waits for its answer (R-11).

Source line numbers are those of `sources/013-inputs.md`.

## Facts (phase 1, before T012)

### IQ-01 Column track sizing of two-column sheets

- **Evidence.** Inventory row "facts two-col" (6 uses, line 34): every use replaces the library tracks with its own,
  "label about 0.8fr with its longest word as the minimum, value about 1.2fr with a minimum of 0", declared in two
  files. Line 56: "The element needs a way to set track sizing".
- **Now.** FR-005: the label column is the widest label's max-content, capped at a share of the element's inline size
  "no more than half"; the value column takes the rest. R-03: `fit-content(50%) minmax(0, 1fr)`. No hook sets the
  tracks. A consumer's `ocelle-facts::part(list) { grid-template-columns: … }` would beat the shadow rules in both
  states (an outer `::part()` rule wins over the element's own), so it would also break the automatic stacking; the
  artifacts do not warn against it.
- **Options.**
  - (a) Keep FR-005's tracks. "facts two-col" maps to `layout="columns"` (or unset); the consumer drops its override
    and accepts the element's columns. The README says not to restyle the list's columns through `::part(list)`.
  - (b) As (a), with the plan's cap lowered from 50% to 40% (`fit-content(40%)`), nearer the consumer's 0.8 : 1.2
    split. A plan value inside FR-005 ("no more than half"); no surface change.
  - (c) A public CSS hook for the label track in the two-column state (for example `--ocelle-facts-label-column`,
    default `fit-content(50%)`), ignored when stacked. Widens the surface; FR-005, the contract and the R-10
    allowance change.
  - (d) Not this mission: the consumer keeps its own track override as a recorded remaining stand-in, and a follow-on
    issue is opened for track sizing.

### IQ-02 Shrinking inside a grid parent (`min-width: 0`)

- **Evidence.** Inventory row "facts stacked" (line 33): the Artifact inspector sets "local `min-width: 0` [that] lets
  it shrink inside the inspector grid (E-27)". Line 56: the element needs a way "to shrink inside a grid".
- **Now.** FR-009 bounds the sheet's inline size from below in shrink-to-fit hosts (never 0; at least the smaller of
  the offered space and the widest label's or value's max-content). The plan states no `min-inline-size` on the host,
  and phase 1's spike measures a grid `auto` track but not a sheet as an item of a `1fr` track with a long value,
  whose automatic minimum is its min-content.
- **Options.**
  - (a) Consumer's: the consumer sets `min-inline-size: 0` on the `ocelle-facts` host in its own grid (host styles are
    the consumer's). The README says so; phase 1's spike adds the `1fr` grid item to its host list to confirm no
    overflow with the rule. No surface change.
  - (b) The element sets `:host { min-inline-size: 0 }` itself. A behaviour change, measured in phase 1's spike
    against FR-009's lower bound in flex items and `auto` tracks; FR-009 may need narrowing if it conflicts.
  - (c) Not this mission: the consumer keeps its local rule; nothing in the README.

### IQ-03 Default weight of the labels (terms)

- **Evidence.** #523's comment (line 326): "`dt` at normal weight (library 500, prototype 400)", among defaults "an
  `sk-facts` element could default". Inventory row "facts term regular" (1 use, Drift, E-37 G-8, line 37).
- **Now.** R-03 and the contract: labels at `--ocelle-font-weight-medium` (500), `--ocelle-font-size-sm`,
  `--ocelle-color-ink-muted`. FR-006 needs labels and values distinct "by more than colour (size or weight)"; with
  labels at the small size that holds at either weight. `part="label"` lets a consumer set the weight already.
- **Options.**
  - (a) Keep 500. Drift sets 400 through `ocelle-facts::part(label)` (mapping row "consumer's").
  - (b) Default 400 (`--ocelle-font-weight-regular`) for every sheet. Plan change (R-03, the contract's tokens-read
    list); FR-006 still met by size; no surface change.
  - (c) A property for the label weight. Widens the surface.

### IQ-04 Long values: words with ellipsis, `break-word`, break anywhere

- **Evidence.** Inventory: "facts value wrap" (2 uses, line 39: Work Package `break-word`, E-21, kept on purpose;
  Drift breaks anywhere, E-39, #535); "facts value ellipsis" (1 use, line 40: words only, a single word wider than the
  column ends in an ellipsis with the full value in a tooltip); "facts value tooltip" (line 42). Line 58: "A single
  default won't cover them; the element needs a stated wrap policy." #280 (lines 202, 219, 229): long machine values
  wrap within their cells, no document overflow with long unbroken values, and "truncation that hides values" is a
  non-goal. #523's comment (line 326): `overflow-wrap: anywhere`.
- **Now.** FR-007: values wrap between words; `wrap="anywhere"` on the fact (or 003's `data-ocelle-wrap`) breaks
  anywhere. No ellipsis policy. Without `wrap`, a single word wider than the value column overflows its box (the
  column never grows, R-03), which #280's no-overflow rule would not accept; US1-3 tests the identifier with the
  policy set.
- **Options.**
  - (a) As planned: `break-word` and break-anywhere both map to `wrap="anywhere"` (in the value column, whose minimum
    is 0, they break at the same places); the ellipsis and tooltip stay the consumer's own markup inside the value,
    which the element neither provides nor prevents; the README cites #280's non-goal.
  - (b) As (a), but the README says the element has no truncation and the inspector's ellipsis maps to
    `wrap="anywhere"` (the full value is shown). README and mapping only.
  - (c) Default values to `overflow-wrap: break-word` (words first; a word that cannot fit breaks), keeping
    `wrap="anywhere"`. FR-007's "without the policy, values wrap between words" changes; no new surface; meets #280's
    no-overflow rule by default.
  - (d) Add `wrap="ellipsis"` (words, a too-wide word ends in an ellipsis) with the full value exposed. Widens the
    surface, conflicts with #280's non-goal, and needs WCAG 1.4.13 handling of the tooltip. Not recommended.

### IQ-05 #280's grouped grid that reflows four, two and one columns

- **Evidence.** #280 (lines 202, 206, 208–209, 235): a grid modifier with one pair per item, "four, two and
  one-column arrangements based on available space", a "four-field W1 strip". kitty-mission-ui cites #280 nowhere
  (line 70) and no inventory row uses a strip.
- **Now.** FR-005 and FR-013: label and value columns, or stacked; `layout` is `"columns" | "stacked"`. Nothing gives
  pairs as cells of a reflowing grid.
- **Options.**
  - (a) Not this mission: 013 answers #280 only for semantics, visible terms, consumer-supplied missing values and
    long values; the README and the spec's Issues line say the strip is left open (a follow-on, when a consumer
    needs it).
  - (b) Add a third `layout` value (for example `layout="grid"`: each pair a cell, label above value, four, two or one
    columns on the sheet's own inline size) in this mission. Widens the surface; new FR, scenarios, stories and spike
    cases in phase 1.
  - (c) Move it to follow-on 1 (with `ocelle-data-table`), recorded in #13's follow-on list.

## Empty state (phase 2, before T028)

### IQ-06 Panel heading weight and rhythm: #510's text or the E-13 code

- **Evidence.** #510 (lines 287–291): the prototype's panels "use a larger vertical rhythm and a lighter heading
  weight". Line 306: the E-13 code on `main` "makes the heading bold in the display face, which is heavier than the
  library's semibold"; "Treat the code as the record of what was actually built, and check with the operator which
  is wanted." Inventory "empty-state card" (5 uses, line 90): "a bold heading in the display face"; "ops card" (line
  92): "a bold heading with tighter line height".
- **Now.** FR-022 and US2-4: the panel has larger padding and gaps and a lighter heading than the default, from
  existing tokens (operator Q2). R-04: default heading `--ocelle-font-weight-strong` (600), panel
  `--ocelle-font-weight-medium` (500), size `--ocelle-font-size-lg` in both; panel padding `--ocelle-space-10`. The
  tokens have `--ocelle-font-weight-display` (800) and `--ocelle-font-display` (Schibsted Grotesk, the same family).
- **Options.**
  - (a) Keep FR-022 as #510's text: lighter heading (500) and larger rhythm. The consumer's bold headings change look.
  - (b) Follow the code: the panel heading heavier than the default (`--ocelle-font-weight-display`, with
    `--ocelle-font-display`), rhythm still larger. FR-022's "lighter" and US2-4 change; no new surface.
  - (c) The panel keeps the default's weight (600) and only enlarges the rhythm. FR-022 and US2-4 change; no new
    surface.

### IQ-07 Card chrome, the busy-keyed border and the message card

- **Evidence.** Inventory: "empty-state card" (5 uses, line 90: card fill, large radius, wide inline padding, border
  solid while the parent is busy and dashed otherwise; E-13, #510); "empty-state message" (3 uses, line 89: a dashed
  card for an empty list and "no filter matches"); "empty-state ops card" (2 uses, line 92); "empty-state card
  dashed" (2 uses, line 91: E-45, the #509 panel-paint family). Line 104: "The element needs explicit `busy` and
  `message`/`card` variants, so ancestors don't style its insides." #280 (line 213): "Surface/tone remains
  container-owned" (for facts).
- **Now.** FR-021: "Neither variant paints a ground (background) of its own: it sits on its container's ground." No
  border, no `busy` property, no message or card variant. Constitution II: one radius (`--ocelle-radius-2`), rows and
  cards `--ocelle-radius-row`; `--ocelle-color-rule` is decorative only.
- **Options.**
  - (a) As the spec: no chrome. The consumer keeps its own card around the element (a surface the container owns);
    the busy cue is the slotted `ocelle-progress`; "card", "message" and "ops card" map to "consumer's", "card
    dashed" to the #509 family, not this mission.
  - (b) Add `variant="card"` (fill, `--ocelle-radius-row`, a border) with a `busy` boolean that makes the border solid
    (dashed otherwise), and a message look as `variant="message"` (dashed, no fill). Widens the surface; FR-021,
    FR-022 and US2 change; contrast rows for the borders.
  - (c) Add only `variant="message"` (dashed border, no fill, no gap) for empty lists and no-match notices; the card
    and its busy border stay the consumer's. Widens the surface; FR-021 changes.
  - (d) As (a) now, and a follow-on for a card or panel surface primitive (the #509 family) that the empty state is
    placed in.

### IQ-08 The refusal block's eyebrow and path

- **Evidence.** Inventory "empty-state refusal" (1 use, line 78): "small uppercase mono eyebrow, h1 title, optional
  mono path, one sentence, optional Retry". Line 107: "the refusal block adds an eyebrow and a path that the library
  has no parts for." "empty-state identifier" (3 uses, line 93).
- **Now.** FR-020: slots `visual`, `heading`, default and `actions`. The eyebrow tokens are out of scope (011 or 012).
  No monospace (constitution II).
- **Options.**
  - (a) Consumer's: the eyebrow is the consumer's text in the `visual` slot (above the heading, at the
    visual-to-heading gap), styled by the consumer, with 011's or 012's eyebrow tokens once they exist; the path is
    body content with `data-ocelle-wrap="anywhere"`, in sans. The README mapping says so; no change to the element.
  - (b) Consumer's, in the heading slot: the consumer slots an `<hgroup>` holding the eyebrow `<p>` and the `<h1>`;
    the element's heading styles then reach the eyebrow too, which the consumer overrides. No change to the element.
  - (c) Add an `eyebrow` slot above the heading, with its gaps. Widens the surface; FR-020, FR-023's gap table and US2
    change; the eyebrow tokens would be needed here.

### IQ-09 Several paragraphs in the body

- **Evidence.** Inventory "empty-state body multiple" (2 uses, line 83): two body paragraphs in one state ("clean"
  plus a last-scan time; a body plus a skipped-items note).
- **Now.** FR-023 and R-04 set gaps between parts, and the heading's margin to 0; nothing sets the margins of slotted
  body paragraphs. `base.css` resets paragraph margins only inside `[data-ocelle-prose]`, so a slotted `<p>` keeps the
  user agent's 1em block margins inside the body part, a single paragraph included.
- **Options.**
  - (a) Consumer's: paragraph margins are the consumer's; the README says to zero them or use the consumer's own
    spacing. No change.
  - (b) The plan sets `::slotted(:not([slot]))` block margins to 0 and a token gap between body children (for example
    `--ocelle-space-2`), so the body's first and last lines sit at the part's edges. A plan detail with a test; no
    surface change.
  - (c) As (b), without the gap between body children (only the margins reset).

## Progress (phase 3, before T045)

### IQ-10 A bar named by a heading outside it

- **Evidence.** Inventory "progress labelled by heading" (1 use, line 132: the bar takes its name from the nearby
  state heading through `aria-labelledby`); "empty-state heading paragraph" (line 81: "The paragraph's id names the
  progress bar"). Line 153: three ways of naming the bar.
- **Now.** FR-030: the name comes from `label` or a host `aria-label`. Constitution III: no ID reference crosses a
  shadow root. The host is the progressbar through ElementInternals (R-05), so an `aria-labelledby` on the host that
  points at a heading in the host's own tree crosses no root; it is neither specified, measured nor documented, and
  R-05's axe false positive for a host `aria-label` may apply to it too (not measured).
- **Options.**
  - (a) Consumer's: the consumer passes the heading's text as `label` (no reference). The README says so. No change.
  - (b) Support a host `aria-labelledby` that points into the host's own tree: phase 3's spike measures the Chromium
    name and axe's result, a US3 scenario and browser tests prove it, and the README documents it beside `aria-label`
    (no story if axe reports a false positive, under the existing Complexity Tracking row's reasoning, which would
    need the operator's approval to extend). No manifest change; FR-030 widens.

### IQ-11 A bar that is also a focusable heading

- **Evidence.** Inventory "progress heading" (1 use, line 135: "The whole progress block acts as a level-2 heading
  and is focusable, so Ops loading can take focus", role heading, aria-level 2, tabindex -1); "empty-state focus
  target" (line 94). Line 154.
- **Now.** R-05: the host is the progressbar through ElementInternals; a `role` on the host would override it and the
  bar would be lost. FR-039: no tab stop. Nothing tells a consumer not to set a role or `tabindex` on the host.
- **Options.**
  - (a) Consumer's: the consumer places its own focusable heading (`<h2 tabindex="-1">`) in the empty state's
    `heading` slot and the bar in `visual`, and moves focus to the heading. Mapping row only; no change.
  - (b) As (a), and the README warns that a `role` or `tabindex` on the host replaces or alters the progressbar, with
    a readme-test statement. Documentation only.

### IQ-12 A bar inline in a list row

- **Evidence.** Inventory "progress inline" (1 use, line 136: "Rendered as an inline span inside a Projects list row
  while that project loads. The root is a span, not a block.").
- **Now.** R-06: the track fills the host's inline size with `min-inline-size: var(--ocelle-measure-cell)`. The plan
  does not state the host's `display`.
- **Options.**
  - (a) The plan states `:host { display: block }`; a row consumer sets the host's `display` and inline size from
    outside (host styles are the consumer's), and the README says so. No surface change.
  - (b) The plan makes the host `display: inline-block` with `inline-size: 100%` by default, so it sits in inline
    content and still fills a block. A plan detail with tests; no surface change.
  - (c) An `inline` variant. Widens the surface.

### IQ-13 Label, bar and percentage laid out by the consumer

- **Evidence.** Inventory "progress grid layout" (2 uses, line 140: "label and percent on one row, bar below across
  the full width", consumer CSS styling the internal parts from outside); "progress meta" (2 uses, line 129); line
  155: "an encapsulated element won't allow [this] without parts or slots."
- **Now.** R-06: with `show-label`, the default size shows `part="label"` and, when determinate with `value-text`,
  `part="value-text"` in a row above the bar, which spans the width: the consumers' arrangement. Where the value text
  sits in that row (after the label, or at the row's inline end) is not stated. The consumer passes the percentage as
  `value-text`, since the element formats no numbers (Assumptions).
- **Options.**
  - (a) As planned; the value text follows the label in the row, and the consumer accepts that placement.
  - (b) The plan puts the value text at the row's inline end (label at the start, value text at the end), as the
    shell and Pipeline layouts do. A plan detail with a test; no surface change.
  - (c) A `row` part on the label row so a consumer can lay it out. Widens the surface.

### IQ-14 #498's label slot

- **Evidence.** #498 (line 262): "a label slot, accessible name from the label".
- **Now.** FR-030 and FR-035: `label` is a string property; with `show-label` it is shown, and it is the name. No
  slot (the contract: no slots on `ocelle-progress`). Every inventoried label is text (line 131: "progress label", 12
  uses).
- **Options.**
  - (a) Keep the `label` property: #498's ask is met in substance (a visible label that is the name); the README says
    rich labels are not supported.
  - (b) Add a default slot for the label, whose text is mirrored into the name by the element. Widens the surface;
    FR-030 and FR-035 change; an observer and its tests.

### IQ-15 Fallback text inside the bar

- **Evidence.** Inventory "progress fallback text" (2 uses, line 134: the bar holds "done/total" text for browsers
  that don't draw it).
- **Now.** The element has no slot and no pre-upgrade rule; text inside it would show before upgrade and, being
  unslotted, would neither show nor be exposed after it. Neither the spec nor the plan says so or tests it.
- **Options.**
  - (a) Consumer's, unstated: the mapping row says the fallback is not needed. No change.
  - (b) The README states that text inside the element shows only before upgrade and is neither shown nor exposed
    after it, and a browser test proves the second half. Documentation and a test; no surface change.
  - (c) The README tells consumers to put no content inside the element. Documentation only.

## Candidates checked and dropped (already covered)

- **Value size (#523's comment: `dd` at the small text size).** Covered: a consumer sets `--ocelle-facts-value-size`
  on a sheet or puts it in a compact region (FR-008, #531). The default, `--ocelle-font-size-fact`, was fixed by the
  mission's input from #531. The mono face is excluded by constitution II (no monospace), so it is no option.
- **The visible percentage ("progress meta") against "the element does not format numbers".** Covered: the consumer
  passes the formatted percentage as `value-text` with `show-label` (FR-031, FR-035), which is also the exposed value
  text. Only its place in the row is open (IQ-13).
- **Compact only ever with indeterminate.** Covered: `size="compact"` with no `value` is a supported combination
  (FR-032, FR-034); the element allows compact with a value too, which no consumer use contradicts.
- **#280's "no custom `sk-facts` element" against #523's ask for one.** Decided by the mission's input (every class
  family replaced by an element, #523) and the operator's split at triage; recorded in R-03.
- **#510's panel tokens (`--sk-panel-padding-block`, `--sk-panel-heading-weight`).** Decided by operator Q2 (existing
  tokens, no panel token, FR-022).
- **#498's status-indicator marker.** Out of scope already: #7's (mission 012), as the spec says.
- **#523's `overflow-wrap: anywhere` and a shared identifier wrap rule.** Covered by FR-007 (`wrap="anywhere"`) and
  003's `data-ocelle-wrap` (#535).
- **Facts missing values, surface and semantics in #280.** Covered by FR-003, FR-004, FR-010 and US1-8 (no ground).
- **Progress in an empty state, in a busy region, slotted, centred.** Covered by FR-021 and US2-7, or need nothing
  from the element (R-11 rows).
