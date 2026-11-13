# Contract: the three elements' public surface

What the manifest declares and the README documents (FR-034, FR-035). All additions are MINOR (constitution VII).
Entry points: `@ocelle/elements/ocelle-notice.js`, `/ocelle-form-input.js`, `/ocelle-form-select.js`; the package root
and the browser build define all three.

## `ocelle-notice`

| Member | Kind | Type | Default | Reflects |
|---|---|---|---|---|
| `tone` | attribute + property | `"info" \| "success" \| "warning" \| "danger" \| "neutral"` | `"info"` | yes (unknown attribute kept, property reads `"info"`) |
| `size` | attribute + property | `"regular" \| "compact"` | `"regular"` | yes (as above) |
| `announce` | boolean attribute + property | `boolean` | `false` | yes |

Slots: `heading`, default (body). Parts: `heading`, `body`. Events: none. CSS custom properties: none.
Documented, not declared: host `role` (`alert`, `status` supported as live roles; `log`, other live roles and host
`aria-live`/`aria-atomic`/`aria-relevant` not supported), host `hidden`. Announcements go through a visually hidden
live region in the shadow root that holds a copy of the text for `H` (5000 ms, or until the next announcement but at
least `W`) after a wait of `W` (300 ms after load, 700 ms before), which changes closer together than `W` restart
(research R-02); for a host `role="alert"`, insertion, reveal and a change to `alert` are left to the platform's
alert event and write no copy, with the baseline taken at the end of the task (text or a `tone` set in the same task is read once,
and a change back to `status` in that task announces as a `status` notice would;
a change in a later task before the next serialisation is read twice). The README states the figures, their sources,
the starvation case, the alert event and that it also reads a `role="alert"` notice shown by a hidden ancestor.
`src/live.ts`'s test-only timing setter and its `announcerDefaults` constant are internal and not part of this
surface (research R-09).
Tokens read: `color-<tone>`, `color-<tone>-bg`, `color-ink`, `radius-row`, `bar-width`, `border-width`, `space-1` to
`space-4`, `font-size-subhead`, `font-size-sm`, `font-weight-strong`, `line-height-tight`, `line-height-compact`.

## Shared by `ocelle-form-input` and `ocelle-form-select`

| Member | Kind | Type | Default |
|---|---|---|---|
| `name` | attribute + property, reflected | `string` | `""` |
| `label` | attribute + property, reflected | `string` | `""` |
| `description` | attribute + property, reflected | `string` | `""` |
| `error` | attribute + property, reflected | `string` | `""` |
| `required` | boolean attribute + property, reflected | `boolean` | `false` |
| `disabled` | boolean attribute + property, reflected | `boolean` | `false` |
| `value` | property | `string` | `""` (input: the `value` attribute) |
| `form` | read-only property | `HTMLFormElement \| null` | |
| `labels` | read-only property | `NodeList` | |
| `validity` | read-only property | `ValidityState` | |
| `validationMessage` | read-only property | `string` | |
| `willValidate` | read-only property | `boolean` | |
| `checkValidity()` | method | `() => boolean` | |
| `reportValidity()` | method | `() => boolean` | |
| `focus()` | method | `(options?: FocusOptions) => void` | |

Parts: `label`, `control`, `description`, `error`. Slots: none. CSS custom properties: none.
Documented, not declared: the `form` attribute, host `aria-label` (names the control; with a visible label drawn it
must contain the visible label text, otherwise not supported; it also stays on the host's node), host `aria-invalid`,
`aria-required`, `aria-disabled` (combined for the value `"true"` only; any other value not supported),
`aria-description` (added to the description; it also stays on the host's node), as research R-05 says; host
`aria-labelledby` and `aria-describedby` (not supported).
Tokens read: `color-sheet`, `color-control-border`, `color-ink`, `color-ink-muted`, `color-danger`, `color-focus`,
`color-disabled-bg`, `color-disabled-ink`, `border-width`, `bar-width`, `radius-2`, `target-min`, `focus-width`,
`focus-offset`, `font-size-sm`, `font-weight-strong`, `line-height-normal`, `space-1`, `space-2`, `space-3`.

## `ocelle-form-input`

| Member | Kind | Type | Default |
|---|---|---|---|
| `type` | attribute + property, reflected | `"text" \| "email" \| "url" \| "tel" \| "search" \| "password" \| "number"` | `"text"` |
| `placeholder`, `autocomplete`, `inputMode` (`inputmode`), `pattern`, `min`, `max`, `step` | attribute + property, reflected | `string` | unset |
| `readOnly` (`readonly`) | boolean attribute + property, reflected | `boolean` | `false` |
| `minLength` (`minlength`), `maxLength` (`maxlength`) | attribute + property, reflected | `number` | unset (no limit) |

Events: `ocelle-form-input-change`, `CustomEvent<{ value: string }>`, `bubbles`, `composed`; the native composed
`input` reaches the host.

## `ocelle-form-select`

Options from light-DOM `<option>` and `<optgroup>` children. A host `value` attribute is ignored. The open-list
indicator is drawn in the select's own shadow root from the shared set's `chevron-down` (research R-07); importing
the module defines `ocelle-form-select` and no other element.
Tokens read, in addition to the shared list: `icon-size` (the indicator).
Events: `ocelle-form-select-change`, `CustomEvent<{ value: string }>`, `bubbles`, `composed`; the native composed
`input` reaches the host.

## htmx

`hx-trigger="ocelle-form-input-change"` / `"ocelle-form-select-change"` (or `input`); a plain form submit or
`hx-post` on the form needs nothing, since the values are in the form's data.
