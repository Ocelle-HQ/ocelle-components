# spec-kitty-design inventory: data table, event timeline, evidence chain

Read on 2026-11-18 from a read-only shallow clone of the public spec-kitty/spec-kitty-design repository (MIT) at
`/home/user/spec-kitty/spec-kitty-design`, commit `19fb6a224c0c54ad657ac725c2d32b7c67d73728` (`19fb6a2`, "promote
develop to main", committed 2026-09-22; all packages at version 1.0.0). Pointed out by the operator on 2026-11-18.

What this is, and what it is not:

- It is the **library's own variant set**: every modifier, state, structure role, story, property and part the
  library defines for the three families mission 019 replaces. It is **not** kitty-mission-ui's usage: it has no
  counts, and it does not say which variants kitty-mission-ui uses. kitty-mission-ui built on `@spec-kitty/*`
  1.1.0-rc.10 (`specs/013-data-display/sources/013-inputs.md`, #498's body), a later line than this clone's 1.0.0, so
  rc.10 may hold variants this clone lacks.
- Constitution VI: role names and behaviour only, in this file's own words. No code, markup, style rule, comment
  text or asset is copied. The `sk-` names are the library's roles, never names in this library.

## Where the issues #470, #517 and #533 are

Not in the clone. A search of the whole tree (`docs/`, `kitty-specs/`, `CHANGELOG.md`, the packages, `llms*.txt`,
`.kittify/`) for `#470`, `#517`, `#533` and `issues/470`, `issues/517`, `issues/533` finds no reference; the bare
numbers occur only as unrelated line numbers and counts. The highest issue number the clone's CHANGELOGs and docs cite
is #419, so this snapshot predates all three. Nothing here states their content, and nothing here contradicts a
plan-gate answer on their behalf. What this repository already records of them is unchanged: #470 is titled
"Desktop V2 application-primitives consumer contract and immutable train handoff" and lists data-table,
event-timeline and evidence-chain among the Desktop V2 primitives (`specs/013-data-display/sources/013-inputs.md`,
`specs/009-workflow-layouts/sources/issues.md`); #517 and #533 are cited by #13 for the chip step and the eyebrow
headers (`triage/019-data-display-follow-on.md`).

The issues the clone does cite for these families: #176 (data table, styles-only), #213 (event timeline, styles-only
recipe for detail views), #147 (metric and evidence chain).

## 1. `sk-data-table` (styles only, no element)

**Paths.** `packages/styles/src/data-table/`: the stylesheet `sk-data-table.css`; three authored exemplars
`sk-data-table-default.html`, `sk-data-table-narrow-scrollable.html`, `sk-data-table-sticky-header.html`; the
generated `index.ts` (one string export per exemplar, marked generated, stating the family is deliberately styles
only); the stories `sk-data-table-html.stories.ts`. Documented in `docs/design-system/using-components.md`
§ Data table; origin mission `kitty-specs/dashboard-semantic-primitives-01M1S94M` (#176).

**Structure roles.**

| Role | Where it goes | What it does |
|---|---|---|
| `sk-data-table__scroller` | wrapper around the table (required by the markup contract) | The only narrow-width mechanism: scrolls in both axes, rounded corners, an inset focus outline when focused from the keyboard. The table inside is never reflowed into blocks. |
| `sk-data-table` | the native `<table>` | Full width, collapsed borders, sans face, small text, default foreground colour set explicitly (a measured contrast fix). |
| caption (element, no class) | `<caption>` | Start-aligned, muted colour, extra-small text, padded. |
| header cells (element, no class) | `<thead> <th>` | Muted colour, medium weight, stronger rule below; sentence case, no letter spacing. No distinct row-header style. |
| body cells (element, no class) | `<td>`, `<th>` | Padded, start-aligned, a default rule below each. |

**Modifiers.**

| Role | Kind | What it does | Where |
|---|---|---|---|
| `sk-data-table__cell--numeric` | cell modifier | End-aligns the cell and sets tabular figures. Used on the cost column of every exemplar. | stylesheet; all three exemplars |
| `sk-data-table--sticky-header` | table modifier | Pins the header row to the top while the body scrolls vertically inside the scroller; switches the table to separated borders with no spacing so the header's rule travels with it; gives the header a card-surface ground and an explicit stacking order above body rows. Needs the scroller as its scrolling ancestor and a height bound the consumer sets. | stylesheet; `sk-data-table-sticky-header.html` (eight rows) |

**States and built-in behaviour.**

| State | What it does | Where |
|---|---|---|
| zebra rows | Every even body row gets a muted surface ground. | stylesheet |
| row hover | The hovered body row is brightened by a filter (visible on painted even rows, subtler on odd rows, which paint no ground). | stylesheet |
| forced colours | Zebra and hover are replaced by a three-unit band on each row's first cell: the canvas colour by default, the text colour on even rows, the highlight colour on hover. The band scrolls away with the row on a sideways-scrolled table (documented limitation). | stylesheet |
| overflowing scroller | Only a scroller that really overflows gets region role, a name and a tab stop, added by the consumer; the narrow exemplar bakes in a 320 px maximum width and carries them, the sticky story adds them with a height bound at render time. The docs require the name to differ from the caption's text (a duplicate name is called a defect). | narrow exemplar; stories; docs |
| tone | None by ruling: no status or tone row colouring until a status-token axis exists. | docs |

**Stories** (`Primitives/SkDataTable (HTML)`): Default (also the forced-colours baseline), StickyHeader, NarrowScrollable,
LightMode.

## 2. `sk-event-timeline` (styles only, no element)

**Paths.** `packages/styles/src/event-timeline/`: the stylesheet `sk-event-timeline.css`; seventeen authored
exemplars (listed under Stories); the generated `index.ts` (one string export per exemplar, styles-only note); the
stories `sk-event-timeline-html.stories.ts` (which also imports the empty-state stylesheet). Documented in
`docs/design-system/using-components.md` § Event timeline and in the Work Explorer and Work Package view pattern
notes; changelog entry (#213) in `docs/design-system/changelog.md`.

**Structure roles.** The family sits on a native `<ol>`; the consumer supplies and orders every event, actor, time,
text and marker. The library neither sorts, reads clocks, formats time, infers trust nor applies retention rules, and
never adds a live region.

| Role | Where it goes | What it does |
|---|---|---|
| `sk-event-timeline` | the `<ol>` | Grid, no list bullets, body colour, sans face, base text size; capped to a maximum measure of five of the largest space steps. |
| `sk-event-timeline__item` | each `<li>` | Positioned item with an inline-start gutter and block-end gap; long text breaks anywhere. Draws a decorative hollow round marker (a ring in the sky on-tint colour, page-coloured inside, pill radius) in the gutter, and, on every item but the last, a decorative vertical connector in the strong border colour from below the marker to the item's end. |
| `sk-event-timeline__summary` | first child, a `<p>` (or an `<a>`, see linked) | The event's title line: default foreground, semibold. The exemplars write the visible ordinal into the text ("1. Created"). |
| `sk-event-timeline__metadata` | `<p>` after the summary | A wrapping inline row of facts, muted and small: an actor `<span>` and a native `<time datetime>` in every exemplar, further facts in one (tone, trust, freshness). The time sits after the summary, not above it. |
| `sk-event-timeline__content` | optional `<p>` after the metadata | Supporting detail in body colour. |
| `sk-event-timeline__marker` | optional `<span>` at the item's end | A consumer-worded trust or verification label ("Verified by consumer"), small, medium weight, in the mint on-tint colour. Meaning is supplied, never inferred. |
| `sk-event-timeline__leading-marker` | optional first child of a compact item, `aria-hidden` | A consumer-supplied decorative icon in a small ring that replaces the item's drawn marker; the item becomes a two-column grid and the connector moves to the icon's centre. Never the sole carrier of meaning; compact form only. |

**Modifiers.**

| Role | What it does |
|---|---|
| `sk-event-timeline--compact` | Denser form: a smaller maximum measure (three of the largest space steps), small text, a narrower gutter and smaller gaps; enables the leading marker. List, values and order unchanged. |
| `sk-event-timeline--narrow` | Caps the measure to two of the largest space steps, for a narrow column; metadata stays in its item. Combines with compact. |

**States, each an exemplar** (forced colours: marker ring and connector, and the leading marker's ring and icon, in
system colours).

| Exemplar | Form | What it shows |
|---|---|---|
| `sk-event-timeline-one-event.html` | default | One event, summary and metadata. |
| `sk-event-timeline-two-events.html` | default | Two events, the first with supporting content (also the Default and LightMode stories). |
| `sk-event-timeline-twenty-events.html` | default | Twenty events in supplied order. |
| `sk-event-timeline-long-transition.html` | default | A long summary, actor and formatted time wrap without leaving their item. |
| `sk-event-timeline-verified-marker.html` | default | The trailing verification label on the first event. |
| `sk-event-timeline-unavailable-retention.html` | none | No timeline at all: the library's passive empty-state section (heading and consumer copy) stands in when history is unavailable; an announced notice is the consumer's separate choice. |
| `sk-event-timeline-narrow.html` | narrow | Long summary and content wrapping in the narrow measure. |
| `sk-event-timeline-forced-colors.html` | default | Geometry evidence for forced colours. |
| `sk-event-timeline-compact-one-event.html` | compact | One event. |
| `sk-event-timeline-compact-default.html` | compact | Three events, the first with content and the verification label. |
| `sk-event-timeline-compact-twenty-events.html` | compact | Twenty events. |
| `sk-event-timeline-compact-leading-marker.html` | compact | Leading icons on the first and third events; the first event's metadata row carries tone, trust and freshness facts beside actor and time. |
| `sk-event-timeline-compact-long-content.html` | compact | Longest supplied values wrap at a narrow column and high zoom. |
| `sk-event-timeline-compact-linked.html` | compact | The summary is a native link to a fragment; the target is another event's item (by id). |
| `sk-event-timeline-compact-narrow.html` | compact and narrow | Both modifiers together. |
| `sk-event-timeline-compact-degraded.html` | compact | "Degraded": the consumer mutes the whole list with a greyscale filter (an inline style in the exemplar) while the supplied facts stay unchanged. No library role for it. |
| `sk-event-timeline-compact-forced-colors.html` | compact | Leading marker and linked summary under forced colours (boundary and focus evidence). |

**Stories** (`Primitives/SkEventTimeline (HTML)`): Default, OneEvent, TwoEvents, TwentyEvents, LongTransition,
VerifiedMarker, UnavailableRetention, Narrow, ForcedColors, LightMode, CompactOneEvent, CompactDefault,
CompactTwentyEvents, CompactLeadingMarker, CompactLongContent, CompactLinked, CompactNarrow, CompactDegraded,
CompactForcedColors, CompactLightMode (twenty).

## 3. `sk-evidence-chain` (element, with a styles sheet)

**Paths.** Styles `packages/styles/src/evidence-chain/sk-evidence-chain.css` (the sheet only; no exemplar, no static
form). Element `packages/elements/src/evidence-chain/`: `sk-evidence-chain.ts`, the generated sheet module
`sk-evidence-chain.css.js` with its `.d.ts`, the stories `sk-evidence-chain.stories.ts`. Manifest: the declaration
with tag `sk-evidence-chain` in `packages/elements/custom-elements.json` (one module, `./dist/index.js`, near line
3493). A generated React wrapper `packages/react/src/SkEvidenceChain.js`. Documented in
`docs/design-system/using-components.md` § Metric and evidence chain and `docs/design-system/using-react.md`;
changelog entry (#147).

**API (manifest entry).**

| Kind | Name | What it does |
|---|---|---|
| property (no attribute) | `stages` | The ordered stages, assigned as a JavaScript property, a frozen empty array by default; a new array reference is needed after a change. Each stage has a required non-blank `id`, `label` and `displayValue`, an optional `annotation` string and an optional `tone`, one of `neutral`, `info`, `success`, `attention`. |
| attributes | none | |
| events | none | |
| slots | none | |
| CSS part | `list` | The shadow ordered list. |
| CSS part | `stage` | Each stage's list item. |
| CSS part | `connector` | The decorative connector after each stage but the last, hidden from assistive technology. |
| CSS part | `empty-state` | The status shown for an empty or invalid whole input. |
| CSS custom properties | none | |

**Behaviour.**

| Behaviour | What it does |
|---|---|
| stage rendering | Each stage is a real compact `sk-metric` (label and value as a native definition relationship; the annotation shown as an `sk-pill-tag`; the tone passed through, neutral by default), keyed by `id`. No ordinals, no step marker, no chip form. |
| validation | The whole input fails closed: not an array, empty, a non-object entry, a blank required string, a non-string annotation, an unknown tone or a duplicate `id` renders the empty state instead of any stage. |
| empty state | A paragraph with status role and the library's own text "No evidence available." |
| wide layout | Stages in one row, each stretching, with a fixed-width connector (a rule and a rightward arrow glyph, subtle colour, mono face, extra-small) after it. |
| narrow layout | Below a 720 px viewport width (a media query, not the container), the list stacks vertically and each connector turns into a vertical rule with a downward arrow. |
| forced colours | Each stage gets a text-colour inline-start border; connectors and arrows in the text colour. |
| no static form | The docs say there is none, because the structured property cannot be expressed in HTML; consumers without JavaScript author native list and definition markup themselves. |
| composition | The approved example places the chain in a card inside a grid. |

**Stories** (`Elements/SkEvidenceChain`): Default (four generic stages), ApprovedExample (four toned stages with
annotations, in a card in a grid), TwoStages, SixStages, Narrow (mobile viewport, 360 px wrapper), LongContent,
Empty, InvalidInput (duplicate ids), LightMode.
