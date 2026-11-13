# Data Model: Feedback and Forms

The "data" of this feature is element state: what each element holds, what it derives, and how it moves between
states. Public members are in `contracts/elements.md`; the reasons are in `research.md`.

## Notice (`ocelle-notice`)

| Field | Source | Values | Derived from |
|---|---|---|---|
| `tone` | attribute and property, reflected | `info` `success` `warning` `danger` `neutral`; anything else reads `info` | — |
| `size` | attribute and property, reflected | `regular` `compact`; anything else reads `regular` | — |
| `announce` | boolean attribute and property, reflected | true / false | — |
| host `role` | standard attribute, observed | any string | — |
| host `hidden` | standard attribute, observed | present / absent | — |
| heading present | private | true / false | assigned elements of `heading` slot with non-whitespace text content (FR-006) |
| live | private | true / false | `announce`, or host role `alert` or `status` |
| politeness | private | `polite` / `assertive` | host role `alert` → assertive, `status` → polite, else tone (FR-009) |
| region | private | `host` / `inner` / `none` | `host` when the role is `alert` or `status`; `inner` when `announce` without such a role; else `none` |
| first load | private, set once | true / false | upgraded while connected, or connected while `document.readyState === "loading"` (R-02) |
| moving | private | true / false | set on disconnect, cleared in a later task (R-02) |

### Announcement transitions (R-02)

| Event | Condition | Action |
|---|---|---|
| first connect | first load | none (region appears holding text) |
| first connect | not first load, live, not `hidden` | withhold one frame |
| connect | moving | none |
| `hidden` removed | live | withhold one frame |
| `announce` set, or role set to `alert`/`status` | — | none (baseline) |
| politeness changes | live, not `hidden` | withhold one frame |
| light-DOM text changes | live, not `hidden` | none (browser updates the region in place) |
| `announce` removed, live role removed | — | region `none` unless the other source remains |

*Withhold one frame*: set `aria-hidden="true"` on the content wrapper, remove it in the next animation frame. A new
withhold during a pending one restarts it.

## Form control (shared: `ocelle-form-input`, `ocelle-form-select`)

| Field | Source | Notes |
|---|---|---|
| `name`, `label`, `description`, `error` | attributes and properties, reflected | strings; `error` normalised (collapse, trim) for display and comparison |
| `required`, `disabled` | boolean attributes and properties, reflected | |
| `value` | property | input: string as typed; select: the selected option's value or `""` |
| default value | input: the `value` attribute; select: the `selected` option children | restored on reset |
| dirty | private | set by user edit or script `value`; cleared on reset |
| form disabled | private | from `formDisabledCallback` (fieldset) |
| effective disabled | private | `disabled` or form disabled |
| computed name | private | FR-022 order: host `aria-label`; else labels' text then `label` |
| computed description | private | description, host `aria-description`, error (non-empty parts, in that order) |
| invalid for AT | private | `error` non-empty or host `aria-invalid="true"` |
| first load, moving | private | as for the notice |

Form value submitted: `value` under `name` when `name` is set and not effectively disabled (`setFormValue(null)`
otherwise). Validity: the inner control's flags and message, mirrored after every change (FR-023).

### Error announcement transitions (R-06)

| Event | Condition | Action |
|---|---|---|
| first connect | first load | none |
| first connect | not first load, `error` non-empty, not `hidden` | withhold the error region one frame |
| `hidden` removed | `error` non-empty | withhold the error region one frame |
| `error` changes to a different non-empty normalised text | not `hidden` | none (region text changes in place) |
| `error` cleared | — | region empties (baseline reset) |

## Input-only fields (`ocelle-form-input`)

`type` (reflected; unknown reads `text`), `placeholder`, `readOnly`, `autocomplete`, `inputMode`, `minLength`,
`maxLength` (numbers, absent = no limit), `pattern`, `min`, `max`, `step` (strings): passed to the inner `<input>`.

## Select-only fields (`ocelle-form-select`)

Options: an ordered list mirrored from the host's light-DOM `<option>` and `<optgroup>` children (label, value,
`selected` as default selection, `disabled`, group label). Single choice only.
