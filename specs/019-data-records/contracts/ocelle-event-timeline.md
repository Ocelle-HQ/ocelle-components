# Contract: `ocelle-event-timeline`

Module `packages/elements/src/ocelle-event-timeline.ts`, class `OcelleEventTimeline`. It imports
`./ocelle-timeline-event.ts` (013's container import rule) and calls `define("ocelle-event-timeline", …)`.

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

`aria-label` is observed.

## Shadow structure (one or more visible events)

```html
<ol role="list" part="list" aria-label="…">
  <li role="listitem" class="has-time">
    <span class="marker-line" aria-hidden="true"><span class="marker"></span></span>
    <slot></slot>                          <!-- assigned: one event -->
  </li>
  …
</ol>
```

With no visible event nothing is rendered. The connector is `li:not(:last-child)::before` (R-10).

## Behaviour

- Manual assignment of each visible event (no `hidden`, no `aria-hidden="true"`) to its `<li>`'s slot, in source
  order.
- A `MutationObserver` watches the child list and each child's `hidden`, `aria-hidden` and `time`, and re-renders.
- The name is `nonBlank(aria-label) ?? nonBlank(label)`, set on the `<ol>` (R-09).
- No live region, landmark, heading or tab stop.

## Accessibility tree (Chromium)

`list` (named or not) > `listitem` × N. Each item's text (FR-016) is "time content", or the content alone. No marker
or connector appears in the tree.
