# Contract: `ocelle-event-timeline`

Module `packages/elements/src/ocelle-event-timeline.ts`, class `OcelleEventTimeline`. It imports
`./ocelle-timeline-event.ts` (013's container import rule) and `hasTime` from the internal `./timeline-time.ts`
(R-10; it reads the event's slotted time as well as its `time` attribute, plan gate Q-E), and calls `define("ocelle-event-timeline", …)`.

## Usage

```html
<ocelle-event-timeline label="Mission history">
  <ocelle-timeline-event time="14:02">Mission created</ocelle-timeline-event>
  <ocelle-timeline-event time="14:20">Plan approved</ocelle-timeline-event>
  <ocelle-timeline-event>
    <time slot="time" datetime="2026-11-15T14:41">14:41</time>
    Review requested
  </ocelle-timeline-event>
</ocelle-event-timeline>
```

## Public surface (manifest)

| Kind | Name | Type / value | Default | Description |
|---|---|---|---|---|
| property / attribute | `label` | `string \| undefined` | `undefined` | Names the list when the host has no non-blank `aria-label`. |
| slot | (default) | `ocelle-timeline-event` children | | Other children, and hidden events, are not shown. |
| CSS part | `list` | the shadow `<ol>` | | |
| CSS custom properties | none | | | |
| events | none | | | |

`aria-label` is observed. The name comes from `resolveName`, imported from `./overflow-region.ts` (R-09).

## Host styles

`:host { display: block; }` and `:host([hidden]) { display: none; }` beside it (FR-001; the display rule would
otherwise beat the user-agent `[hidden]` rule). A hidden timeline has no box and no list node (analysis G3).

## Shadow structure (one or more visible events)

```html
<ol role="list" part="list" aria-label="…">
  <li role="listitem" class="has-time next-has-time">  <!-- has-time when hasTime(event); next-has-time when hasTime(next visible event); each counts a slotted time -->
    <span class="marker-line" aria-hidden="true"><span class="marker"></span></span>
    <span class="connector" aria-hidden="true"></span>   <!-- not rendered on the last visible <li> -->
    <slot></slot>                          <!-- assigned: one event -->
  </li>
  …
</ol>
```

With no visible event nothing is rendered. The connector is a real span (PLAN-TESTABILITY-1-001), absolutely
positioned in the marker column. It is gapped (PLAN-FRESH-2-004, operator decision (a)): it starts `--ocelle-space-1`
after its own dot's block end and ends `--ocelle-space-1` before the next visible dot's block start, so it never
crosses a dot. Its start follows this `<li>`'s marker line (`has-time` or not) and its end the next `<li>`'s
(`next-has-time` or not), so a mixed timed and untimed timeline keeps equal gaps (R-10). An event timed by its
`time` slot is a timed event here, and one whose slotted time is empty or hidden is untimed unless its `time`
attribute is non-blank.

## Marks

| Element | Styles |
|---|---|
| `.marker` | `box-sizing: border-box`; inline and block size `--ocelle-size-dot`; `border-block-start: var(--ocelle-size-dot) solid var(--ocelle-color-ink-muted)` and no other border side, so the one side fills the box with no unpainted centre (phase 2 spike Q3 (a): four sides of `calc(var(--ocelle-size-dot) / 2)` floor to 3px each and leave a hole, `reviews/phase-2/spike.md` § 5); `border-radius: 50%` (a mark shape, Q-D) |
| `.connector` | no inline size; `border-inline-start: var(--ocelle-border-width) solid var(--ocelle-color-rule-strong)` (decorative); block start and end insets as `calc()` over tokens from the two `<li>`'s types, `size-dot`, `space-1` and the row gap `space-3` (R-10) |

## Forced colours (PLAN-A11Y-SECURITY-1-001)

Every mark is a border, never a background (forced colours forces `background-color` to `Canvas`). Outside the
variant block: `@media (forced-colors: active) { .marker, .connector { border-color: CanvasText; } }`. The side that
draws each mark is the marker's `border-block-start` and the connector's `border-inline-start`: each is `CanvasText`
with a width above zero (R-10, contracts/checks.md § Oracles, forced colours). The time and content text take the
system text colour. No `forced-color-adjust: none`.

## Behaviour

- Manual assignment of each visible event (no `hidden`, no `aria-hidden="true"`) to its `<li>`'s slot, in source
  order.
- A `MutationObserver` watches the host's subtree: `childList`, `characterData`, and the attributes `hidden`,
  `aria-hidden`, `time` and `slot` (`subtree: true`), and re-renders. So an event added, removed, hidden or shown, a
  `time` set (it reflects, so a property set from script is seen), and an event's slotted time added, removed,
  emptied, filled, hidden or shown all re-decide the classes (plan gate Q-E). A record from inside an event's content
  re-renders to the same classes, which changes nothing. The `has-time` and `next-has-time` classes use the internal
  `hasTime(event)` predicate of `timeline-time.ts`, the same one the event uses for its time box (R-10).
- The name is `resolveName(host aria-label, label)`, set on the `<ol>` (R-09). Chromium also shows the host as a
  `generic` node of the host's name beside the `list`, as on 009's lane; axe-core 4.14.0 reports nothing on it, blank
  or not (`reviews/phase-2/spike.md` § 2), so both states have stories (phase 2 spike Q1 (b), contracts/checks.md
  § Stories).
- No live region, landmark, heading or tab stop.

## Accessibility tree (Chromium)

`list` (named or not) > `listitem` × N. Each item's text (FR-016) is "time content", or the content alone; the time
is the slotted time's text when the event has one, else the `time` attribute's, and never both. No marker or
connector appears in the tree; each marker wrapper and connector span carries `aria-hidden="true"`. A slotted
`<time>` adds a `time` node around its `StaticText` (R-11).

axe judges the list's structure by `aria-required-children` and `aria-required-parent`, which it applies to the
explicit `role="list"` and `role="listitem"`; its `list` and `listitem` rules select only elements with no `role`
attribute and so do not apply (phase 2 spike Q2 (a), R-08). The `axe` gate on the timeline's stories meets US2-1's
axe clause.
## Before upgrade

`@ocelle/styles` sets, in `base.css`'s base layer beside 013's facts rule (recheck Q5 (b)), `:where(ocelle-event-timeline:not(:defined) >
ocelle-timeline-event:not([hidden]):not([aria-hidden="true"])) { display: block; }` and
`:where(ocelle-event-timeline:not(:defined) > ocelle-timeline-event[aria-hidden="true"]) { display: none; }`, so the
visible events show one per line and an `aria-hidden="true"` event is not shown, as after upgrade (R-08,
PLAN-FRESH-2-005). Their attribute times do not show before upgrade (rendered in shadow); a slotted time is light DOM
and shows inline where written. The README's "Before upgrade" line says both.

## README mapping (FR-058, research R-16)

The README's event-timeline mapping rows are research R-16's phase 2 table (operator, 2026-11-20,
`reviews/phase-2-inventory-decisions.md`), asserted by role name in phase 2's red (T037) and written in its green
(T047). The rows this element carries:

- The list maps to this element, an ordered list in source order; the library's measure cap and its narrow form map
  to the container, and the consumer's remedy for a cap is `max-inline-size` on the host (IQ-9 (a), IQ-26 (a)).
- The compact form maps to the default timeline, already at the compact type sizes; more density is the consumer's
  rules on `::part(time)` and `::part(content)`, and a later issue covers a density property (IQ-8 (a), IQ-26 (a)).
- The degraded form maps to a rule in the consumer's own stylesheet (no inline style), with the state stated in text,
  never by muting alone (IQ-16 (a)).
- Unavailable retention maps to 013's `ocelle-empty-state` in place of the timeline; an announcement is the
  consumer's own notice or live region (IQ-17 (a), FR-026).
- Forced colours and light mode are built in (FR-013).

No attribute, slot, part or story is added for any of them.
