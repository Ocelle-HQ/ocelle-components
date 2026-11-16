# Contract: `ocelle-event-timeline`

Module `packages/elements/src/ocelle-event-timeline.ts`, class `OcelleEventTimeline`. It imports
`./ocelle-timeline-event.ts` (013's container import rule) and `hasTime` from the internal `./timeline-time.ts`
(R-10), and calls `define("ocelle-event-timeline", …)`.

## Usage

```html
<ocelle-event-timeline label="Mission history">
  <ocelle-timeline-event time="14:02">Mission created</ocelle-timeline-event>
  <ocelle-timeline-event time="14:20">Plan approved</ocelle-timeline-event>
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

## Shadow structure (one or more visible events)

```html
<ol role="list" part="list" aria-label="…">
  <li role="listitem" class="has-time next-has-time">  <!-- has-time when hasTime(event.time); next-has-time when hasTime(next visible event's time) -->
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
(`next-has-time` or not), so a mixed timed and untimed timeline keeps equal gaps (R-10).

## Marks

| Element | Styles |
|---|---|
| `.marker` | `box-sizing: border-box`; inline and block size `--ocelle-size-dot`; `border: calc(var(--ocelle-size-dot) / 2) solid var(--ocelle-color-ink-muted)`; `border-radius: 50%` (a mark shape, Q-D) |
| `.connector` | no inline size; `border-inline-start: var(--ocelle-border-width) solid var(--ocelle-color-rule-strong)` (decorative); block start and end insets as `calc()` over tokens from the two `<li>`'s types, `size-dot`, `space-1` and the row gap `space-3` (R-10) |

## Forced colours (PLAN-A11Y-SECURITY-1-001)

Every mark is a border, never a background (forced colours forces `background-color` to `Canvas`). Outside the
variant block: `@media (forced-colors: active) { .marker, .connector { border-color: CanvasText; } }`. The time and
content text take the system text colour. No `forced-color-adjust: none`.

## Behaviour

- Manual assignment of each visible event (no `hidden`, no `aria-hidden="true"`) to its `<li>`'s slot, in source
  order.
- A `MutationObserver` watches the child list and each child's `hidden`, `aria-hidden` and `time`, and re-renders.
  `time` reflects, so a property set from script is seen. The `has-time` and `next-has-time` classes use the
  internal `hasTime` predicate of `timeline-time.ts`, the same one the event uses for its time box (R-10).
- The name is `resolveName(host aria-label, label)`, set on the `<ol>` (R-09).
- No live region, landmark, heading or tab stop.

## Accessibility tree (Chromium)

`list` (named or not) > `listitem` × N. Each item's text (FR-016) is "time content", or the content alone. No marker
or connector appears in the tree; each marker wrapper and connector span carries `aria-hidden="true"`.

## Before upgrade

`@ocelle/styles` sets `:where(ocelle-event-timeline:not(:defined) >
ocelle-timeline-event:not([hidden]):not([aria-hidden="true"])) { display: block; }` and
`:where(ocelle-event-timeline:not(:defined) > ocelle-timeline-event[aria-hidden="true"]) { display: none; }`, so the
visible events show one per line and an `aria-hidden="true"` event is not shown, as after upgrade (R-08,
PLAN-FRESH-2-005). Their times do not show before upgrade (the time is rendered in shadow). The README's "Before
upgrade" line says both.
