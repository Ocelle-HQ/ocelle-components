# Contract: `ocelle-evidence-step`

Module `packages/elements/src/ocelle-evidence-step.ts`, class `OcelleEvidenceStep`,
`define("ocelle-evidence-step", …)`.

## Public surface (manifest)

| Kind | Name | Type / value | Default | Description |
|---|---|---|---|---|
| property / attribute | `variant` (reflected) | `"chip" \| undefined` | `undefined` | `chip` draws the step compact inside a chain, with no marker or ordinal. |
| property / attribute | `wrap` (reflected) | `"anywhere" \| undefined` | `undefined` | `anywhere` breaks long identifiers in the content anywhere. |
| slot | (default) | the step's content | | |
| CSS part | `content` | | | |
| CSS custom properties | none | | | |
| events | none | | | |

## Shadow structure

```html
<span part="content"><slot></slot></span>
```

| Element | Styles |
|---|---|
| `:host` | `display: inline-block`; `:host([hidden]) { display: none }` |
| `[part="content"]` | `overflow-wrap: anywhere` under `:host([wrap="anywhere"])` |

The step's type, colour and chip box come from its container (`::slotted()`). Outside a chain the step inherits the
page's text and shows as plain text, with no marker, ordinal or chip box.
