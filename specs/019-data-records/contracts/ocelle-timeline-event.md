# Contract: `ocelle-timeline-event`

Module `packages/elements/src/ocelle-timeline-event.ts`, class `OcelleTimelineEvent`,
`define("ocelle-timeline-event", …)`. It imports `hasTime` and `hasSlottedTime` from the internal `./timeline-time.ts`
and exports only its class.

## Public surface (manifest)

| Kind | Name | Type / value | Default | Description |
|---|---|---|---|---|
| property / attribute | `time` (reflected) | `string \| undefined` | `undefined` | The event's time as the consumer formats it, shown above the content (Q-C (a)). Empty or white space counts as no time. Ignored while the event has a slotted time. |
| property / attribute | `wrap` (reflected) | `"anywhere" \| undefined` | `undefined` | `anywhere` breaks long identifiers in the content anywhere. |
| slot | (default) | the event's content | | |
| slot | `time` | the event's time as marked-up nodes (for example `<time datetime>`) | | Takes precedence over the `time` attribute when one of its visible nodes has non-blank text; styled to the time's type through `::slotted()`. Plan gate Q-E. |
| CSS parts | `time`, `content` | | | |
| CSS custom properties | none | | | |
| events | none | | | |

## Shadow structure

The shadow root uses the platform's named slot assignment (not manual), so `slot="time"` children go to the `time`
slot and every other child to the default slot.

```html
<span part="time">                <!-- only when hasTime(this) -->
  <slot name="time"></slot>       <!-- only when hasSlottedTime(this) -->
  14:02                           <!-- the time attribute's text, only when !hasSlottedTime(this) -->
</span>
<span part="content"><slot></slot></span>
```

The `time` slot is rendered only while the event has a slotted time. Otherwise the `slot="time"` children are
unassigned, so an empty, white-space-only or hidden slotted time is neither shown nor exposed, and an attribute time
is never shown beside a slotted one. While the event has a slotted time, every `slot="time"` child is assigned in
source order, a blank one beside a non-blank one included: a blank node adds no text to the item text (white space
is collapsed), and a `hidden` or `aria-hidden="true"` one is not shown (below; analysis A1). Setting or removing a
child's `slot` attribute moves it between the slots, and the observer below re-decides the time box (analysis G1).

| Element | Styles |
|---|---|
| `:host` | `display: block`; `:host([hidden]) { display: none }` (FR-001) |
| `[part="time"]` | `display: block`; `xs`, medium weight, `ink-muted`, `figures`, `line-height-normal` |
| `slot[name="time"]::slotted(*)` | the same type as `[part="time"]`: `font-family: var(--ocelle-font-sans)`, `xs`, medium weight, `ink-muted`, `figures`, `line-height-normal` (so a `<b>`, `<small>` or `<strong>` takes the time's type); in forced colours the system text colour |
| `slot[name="time"]::slotted([hidden]), slot[name="time"]::slotted([aria-hidden="true"])` | `display: none` (a hidden node beside a visible one in the slot) |
| `[part="content"]` | `display: block`; `sm`, regular weight, `ink`, `line-height-normal`; `overflow-wrap: anywhere` under `:host([wrap="anywhere"])` |

The colours and sizes are the plan gate's answers (Q-B (a), Q-C (a)). A consumer rule on a slotted node beats the
`::slotted()` rule (the cascade's rule for slotted content); the README states this.

## Has a time (PLAN-CORRECTNESS-1-003; plan gate Q-E)

`time` reflects to its attribute (as 013's `ocelle-fact` reflects `label`), so the timeline's `MutationObserver` sees
a property set from script. Two internal predicates in `packages/elements/src/timeline-time.ts` (PLAN-FRESH-2-003)
take the event element:

- `hasSlottedTime(event)`: true when at least one direct child with `slot="time"`, with neither `hidden` nor
  `aria-hidden="true"`, has a trimmed `textContent` that is not empty.
- `hasTime(event)`: `hasSlottedTime(event)`, or the event's `time` attribute is a string whose trimmed value is not
  empty.

They decide the time box and the slot here, and the `has-time` and `next-has-time` classes on the timeline's `<li>`.
So `time=""`, `time=" "`, an empty `<time slot="time"></time>` and a `hidden` slotted time with no `time` give no
time box, no `has-time`, and an item text of the content alone. Both read the light DOM directly (never
`assignedNodes()`, which is empty while the slot is not rendered), so they give the same answer in the event and in
the container. The file is outside the manifest's glob (`src/ocelle-*.ts`) and the package's `exports` map, and is
not re-exported from `index.ts`, so neither predicate is manifest surface nor importable from a public entry point. A
manifest test statement asserts that this module declares only `OcelleTimelineEvent`.

**Its own observer.** The event observes itself with one `MutationObserver` (`childList`, `characterData`,
`subtree`, and the attributes `slot`, `hidden` and `aria-hidden`), from `connectedCallback` to
`disconnectedCallback`. On each record batch it recomputes `hasSlottedTime` and requests an update when the result
changed, so a slotted time added, removed, emptied, filled, hidden or shown updates the time box without a reload,
inside or outside a timeline.

## Item text

The time box comes before the content in the shadow tree, so the item text (FR-016) is the time first, a space and
the content, wherever the consumer wrote the slotted node in source.

## What the slot carries (Q-E)

The slotted nodes are the consumer's, unchanged: a `<time datetime>`, a `title`, their own `lang` or `dir`, or an
htmx target stay theirs. The element does not read `datetime` and does not parse or format the time. An attribute
time is still plain text in the shadow root and carries none of these; the README says to use the slot when they are
needed, and asks for one time element per event.

## Outside a timeline

The event shows its time (slotted or attribute) above its content as plain text, with no marker, connector or list
role.

## Before upgrade

An attribute time does not show (it is rendered in shadow). A slotted time is light DOM and shows inline where it is
written, before the content when written first; an `aria-hidden="true"` one shows, unexposed, until upgrade. The
README's "Before upgrade" line says both. No `@ocelle/styles` rule is added for it.
