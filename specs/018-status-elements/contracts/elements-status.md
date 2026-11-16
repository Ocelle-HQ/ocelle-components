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
| attribute / property | `label` | string | `""` | non-blank → role `img` with this name; blank → hidden from AT; the only way to name it (a host `aria-label` is unsupported and not read) |
| attribute / property | `pulse` | boolean | `false` | one run of `motion-pulse-count` × `motion-pulse` (≤ 5 s by default) per start case (FR-012); a removal and re-addition within one task coalesce and start no run |
| part | `dot` | | | the solid dot, never animated |
| part | `ring` | | | the pulse ring, present while `pulse` |

No events, methods, slots or custom states. README: the host names the state in adjacent text when there is no
`label`; `label` is the one way to name it and a host `aria-label` is unsupported (what Chromium then exposes, as
pinned by US1-8); the indicator is not a busy or progress signal (#13's `ocelle-progress`); re-inserting or re-showing
it more often than every 5 s keeps it pulsing; removing and setting `pulse` within one task starts no new run (set it
again in a later task); a state-preserving move (`moveBefore()`) and a reveal from `hidden="until-found"` are not
start cases, and neither is opening a `<details>` around a pulsing indicator (a run under way when it closed goes on
while it is closed, and none starts when it opens; operator decision, PLAN-FRESH-2-001); overriding the motion tokens
must keep their product ≤ 5 s.

## `ocelle-metric`

```html
<ocelle-metric label="Open missions" display-value="12" layout="row"></ocelle-metric>
```

| Kind | Name | Type | Default | Notes |
|---|---|---|---|---|
| attribute / property | `label` | string | `""` | eyebrow style (shown uppercase); exposed as a term named by the label as written |
| attribute `display-value` / property `displayValue` | | string | `""` | tabular figures; exposed as the term's definition; text only |
| attribute / property | `layout` | `"stack" \| "row"` | `stack` | unknown → `stack` |
| part | `label` | | | the `dt` |
| part | `value` | | | the `dd` |

No events, methods, slots or custom states. README: the browser's find in page matches a metric's label twice, the
visible label and the invisible written copy that names the term (a known limitation, R-05, unless the T001 probe finds
a hiding that find skips); in a flex row a metric is not shrunk below its longest word, and a host that wants it to
shrink further sets `min-inline-size: 0` on it (its words then break inside it).

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
| attribute / property | `label` | string | `""` | not reflected; names the inner control (012 FR-006, FR-013) |
| attribute (moved) | `aria-label`, `aria-labelledby`, `aria-describedby`, `aria-controls`, `aria-current`, `aria-pressed`, `title` | | | moved to the inner control while interactive (012 FR-004); `aria-pressed` applied in button mode only; written back to the host when the pill becomes static (FR-035) |
| attribute (owned) | `data-ocelle-moved-<name>` for each moved attribute | | | mirror; hosts never write it |
| method | `focus(options?)` | | | focuses the inner control (interactive); nothing while static (the shadow root has no `delegatesFocus`) |
| method | `click()` | | | clicks the inner control (interactive); the native host click while static |
| event | `click` | `MouseEvent` | | native |
| event | `ocelle-pill-tag-activate` | `CustomEvent<{}>` | | `bubbles`, `composed`, `cancelable`; before the click's bubble phase; none on a modifier link click, a middle click, disabled or static |
| custom state | `pressed` | | | button mode, applied `aria-pressed="true"`; never in link mode (the pill's own rule, unlike `ocelle-button` as merged) |
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
pill made static; move focus yourself when making a focused pill static; `aria-pressed` has no effect on a link and
gives no `:state(pressed)` there; truncation needs a definite inline size (a flex or grid parent, a fixed table layout
or a cell or column width; an auto-layout table cell grows instead); an interactive pill keeps one focus-ring extent
(`--ocelle-focus-offset` + `--ocelle-focus-width`) of inline margin and caps its width to keep its ring inside a
clipping container, and a container that clips in the block direction keeps that much unclipped space (012's
clearance rule); a late font load that turns an exactly fitting text into an overflowing one is seen at the next width
or text change. Flex rows (operator decisions on PLAN-FRESH-2-002 and PLAN-FRESH-2-003, (a)): a static pill is not
shrunk below its longest word, so a one-word pill stays on one line, and a host that wants it to shrink further sets
`min-inline-size: 0` on it (the word then breaks inside the pill); an enabled interactive pill shrinks to truncate, and
the flex row shares that shrink with its siblings by their flex bases, so a sibling keeps its size only if the host
gives it `flex: none` or gives the pill `flex: 1 1 0` (the pill then takes the remaining room); otherwise the sibling
shrinks too, down to its longest word.

## `@ocelle/tokens`

See [data-model.md § Tokens added](../data-model.md#tokens-added-r-10).
