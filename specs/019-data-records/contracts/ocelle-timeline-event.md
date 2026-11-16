# Contract: `ocelle-timeline-event`

Module `packages/elements/src/ocelle-timeline-event.ts`, class `OcelleTimelineEvent`,
`define("ocelle-timeline-event", …)`. It imports `hasTime` from the internal `./timeline-time.ts` and exports only
its class.

## Public surface (manifest)

| Kind | Name | Type / value | Default | Description |
|---|---|---|---|---|
| property / attribute | `time` (reflected) | `string \| undefined` | `undefined` | The event's time as the consumer formats it, shown above the content (Q-C). Empty or white space counts as no time. |
| property / attribute | `wrap` (reflected) | `"anywhere" \| undefined` | `undefined` | `anywhere` breaks long identifiers in the content anywhere. |
| slot | (default) | the event's content | | |
| CSS parts | `time`, `content` | | | |
| CSS custom properties | none | | | |
| events | none | | | |

## Shadow structure

```html
<span part="time">14:02</span>                <!-- only when hasTime(time) -->
<span part="content"><slot></slot></span>
```

| Element | Styles |
|---|---|
| `:host` | `display: block` |
| `[part="time"]` | `display: block`; `xs`, medium weight, `ink-muted`, `figures`, `line-height-normal` |
| `[part="content"]` | `display: block`; `sm`, regular weight, `ink`, `line-height-normal`; `overflow-wrap: anywhere` under `:host([wrap="anywhere"])` |

The colours, the time's position and the content's size may change with Q-B and Q-C.

## Has a time (PLAN-CORRECTNESS-1-003)

`time` reflects to its attribute (as 013's `ocelle-fact` reflects `label`), so the timeline's `MutationObserver` sees a
property set from script. One internal predicate, `hasTime(time)`, is true when `time` is a string whose trimmed
value is not empty. It decides the time box here and the `has-time` and `next-has-time` classes on the timeline's
`<li>`, so `time=""` and `time=" "` give no time box, no `has-time`, and an item text of the content alone.
`hasTime` lives in `packages/elements/src/timeline-time.ts` (PLAN-FRESH-2-003), which this module and
`ocelle-event-timeline.ts` import. The file is outside the manifest's glob (`src/ocelle-*.ts`) and the package's
`exports` map, and is not re-exported from `index.ts`, so `hasTime` is neither manifest surface nor importable from a
public entry point. A manifest test statement asserts that this module declares only `OcelleTimelineEvent`.

## Limits (Q-E)

The time is plain text in the event's shadow root: it cannot carry a `<time datetime>`, a title, its own `lang` or
`dir`, or an htmx target. The README states this; a consumer that needs them puts them in the content. Whether #470
needs a marked-up time is the plan gate's Q-E.

## Outside a timeline

The event shows its time above its content as plain text, with no marker, connector or list role.
