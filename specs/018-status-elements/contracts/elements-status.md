# Contract: `@ocelle/elements` status elements (018)

Public surface added by this feature (MINOR). Every item below is declared in `custom-elements.json` with a
description (FR-005, R-15). Entry points: `@ocelle/elements/ocelle-status-indicator.js`,
`@ocelle/elements/ocelle-metric.js`, `@ocelle/elements/ocelle-pill-tag.js` (the last also defines `ocelle-tooltip`),
each re-exported from `@ocelle/elements`.

## `ocelle-status-indicator`

```html
<ocelle-status-indicator tone="success" label="Running" pulse></ocelle-status-indicator>
```

| Kind | Name | Type | Default | Notes |
|---|---|---|---|---|
| attribute / property | `tone` | `"info" \| "success" \| "warning" \| "danger" \| "neutral"` | `neutral` | unknown kept in the attribute; property reads `neutral` |
| attribute / property | `label` | string | `""` | non-blank → role `img` with this name; blank → hidden from AT |
| attribute / property | `pulse` | boolean | `false` | one run of `motion-pulse-count` × `motion-pulse` (≤ 5 s by default) per start case (FR-012) |
| part | `dot` | | | the solid dot, never animated |
| part | `ring` | | | the pulse ring, present while `pulse` |

No events, methods, slots or custom states. README: the host names the state in adjacent text when there is no
`label`; the indicator is not a busy or progress signal (#13's `ocelle-progress`); re-inserting or re-showing it more
often than every 5 s keeps it pulsing; overriding the motion tokens must keep their product ≤ 5 s.

## `ocelle-metric`

```html
<ocelle-metric label="Open missions" display-value="12" layout="row"></ocelle-metric>
```

| Kind | Name | Type | Default | Notes |
|---|---|---|---|---|
| attribute / property | `label` | string | `""` | eyebrow style; exposed as a term |
| attribute `display-value` / property `displayValue` | | string | `""` | tabular figures; exposed as the term's definition; text only |
| attribute / property | `layout` | `"stack" \| "row"` | `stack` | unknown → `stack` |
| part | `label` | | | the `dt` |
| part | `value` | | | the `dd` |

No events, methods, slots or custom states.

## `ocelle-pill-tag`

```html
<ocelle-pill-tag status="warning">Blocked</ocelle-pill-tag>
<ocelle-pill-tag variant="badge" density="compact">3</ocelle-pill-tag>
<ocelle-pill-tag interactive status="info" aria-pressed="true">Mine</ocelle-pill-tag>
<ocelle-pill-tag href="/missions?state=blocked" status="warning">Blocked</ocelle-pill-tag>
```

| Kind | Name | Type | Default | Notes |
|---|---|---|---|---|
| attribute / property | `status` | status vocabulary | `neutral` | |
| attribute / property | `variant` | `"pill" \| "badge"` | `pill` | badge: outlined, tabular figures |
| attribute / property | `density` | `"default" \| "compact"` | `default` | compact: 4 / 8 px padding, line height 1.2 |
| attribute / property | `interactive` | boolean | `false` | button mode |
| attribute / property | `href` | string | `""` | link mode when it is a link-mode URL (012 FR-002) |
| attribute / property | `disabled` | boolean | `false` | 012 FR-003; no effect while static |
| property | `label` | string | `""` | not reflected; names the inner control (012 FR-006) |
| attribute (moved) | `aria-label`, `aria-labelledby`, `aria-describedby`, `aria-controls`, `aria-current`, `aria-pressed`, `title` | | | moved to the inner control while interactive (012 FR-004); `aria-pressed` applied in button mode only; written back to the host when the pill becomes static (FR-035) |
| attribute (owned) | `data-ocelle-moved-<name>` for each moved attribute | | | mirror; hosts never write it |
| method | `focus(options?)` | | | focuses the inner control (interactive) |
| method | `click()` | | | clicks the inner control (interactive) |
| event | `click` | `MouseEvent` | | native |
| event | `ocelle-pill-tag-activate` | `CustomEvent<{}>` | | `bubbles`, `composed`, `cancelable`; before the click's bubble phase; none on a modifier link click, a middle click, disabled or static |
| custom state | `pressed` | | | button mode, applied `aria-pressed="true"` |
| custom state | `current` | | | interactive, applied `aria-current` present and not `false` |
| slot | (default) | | | the text |
| slot | `icon` | | | decorative leading icon (005 slot convention) |
| part | `pill` | | | the visual box, every mode |
| part | `control` | | | the inner `button` / `a`, interactive modes |

Inside its shadow root an interactive pill renders, as #16's contract shows for #7:

```js
html`<ocelle-tooltip text=${fullText} ?disabled=${!truncated}>${innerControl}</ocelle-tooltip>`
```

`truncated` is false whenever the pill is disabled (FR-033). README rules: name an interactive pill whose text is empty;
do not set `title` on an interactive pill (the tooltip shows its full text, plan decision 8); clear ARIA states from a
pill made static; move focus yourself when making a focused pill static; `aria-pressed` has no effect on a link.

## `@ocelle/tokens`

See [data-model.md § Tokens added](../data-model.md#tokens-added-r-10).
