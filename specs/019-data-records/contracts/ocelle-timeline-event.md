# Contract: `ocelle-timeline-event`

Module `packages/elements/src/ocelle-timeline-event.ts`, class `OcelleTimelineEvent`,
`define("ocelle-timeline-event", …)`.

## Public surface (manifest)

| Kind | Name | Type / value | Default | Description |
|---|---|---|---|---|
| property / attribute | `time` | `string \| undefined` | `undefined` | The event's time as the consumer formats it, shown above the content (Q-C). |
| property / attribute | `wrap` (reflected) | `"anywhere" \| undefined` | `undefined` | `anywhere` breaks long identifiers in the content anywhere. |
| slot | (default) | the event's content | | |
| CSS parts | `time`, `content` | | | |
| CSS custom properties | none | | | |
| events | none | | | |

## Shadow structure

```html
<span part="time">14:02</span>                <!-- only when time is non-empty -->
<span part="content"><slot></slot></span>
```

| Element | Styles |
|---|---|
| `:host` | `display: block` |
| `[part="time"]` | `display: block`; `xs`, medium weight, `ink-muted`, `figures`, `line-height-normal` |
| `[part="content"]` | `display: block`; `sm`, regular weight, `ink`, `line-height-normal`; `overflow-wrap: anywhere` under `:host([wrap="anywhere"])` |

The colours, the time's position and the content's size may change with Q-B and Q-C.

## Outside a timeline

The event shows its time above its content as plain text, with no marker, connector or list role.
