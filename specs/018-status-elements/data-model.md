# Data Model: Status Elements (018)

Interfaces are in [contracts/elements-status.md](contracts/elements-status.md); this file gives the state each element
holds and how it changes. References are to spec FRs and to research items (R-nn).

## Status vocabulary (`src/status.ts`, internal)

| Value | Mark / border / text | Ground |
|---|---|---|
| `info` | `--ocelle-color-info` | `--ocelle-color-info-bg` |
| `success` | `--ocelle-color-success` | `--ocelle-color-success-bg` |
| `warning` | `--ocelle-color-warning` | `--ocelle-color-warning-bg` |
| `danger` | `--ocelle-color-danger` | `--ocelle-color-danger-bg` |
| `neutral` (default and fallback here) | `--ocelle-color-neutral` | `--ocelle-color-neutral-bg` |

`statusOf(v)` = `v` if `v` is one of the five, else `"neutral"` (exact, case-sensitive match; no trimming, as 005's
attribute conventions). FR-002, R-02.

## `ocelle-status-indicator`

| Field | Source | Type / default | Notes |
|---|---|---|---|
| `tone` | attribute `tone` | `Status`, `neutral` | getter parses, attribute kept as written (R-02) |
| `label` | attribute `label`, reflected | string, `""` | trimmed for naming; blank = decorative (FR-014) |
| `pulse` | attribute `pulse`, reflected | boolean, `false` | ring rendered only while true (R-04) |

Derived: *named* = `label.trim() !== ""` → role `img`, name `label.trim()`; else `aria-hidden`. *Pulsing* = a CSS
animation on the ring, which exists iff `pulse` and the element is rendered and motion is not reduced; it runs
`motion-pulse-count` iterations of `motion-pulse` and ends (FR-012). No script state.

Pulse run lifecycle (CSS, R-04):

```text
[no ring] --pulse set (a) / connect with pulse (b) / shown again (d)--> [running]
[running] --after count × duration--> [ended: ring at opacity 0, dot solid]
[running|ended] --pulse removed--> [no ring]
[running] --reduced motion on--> [no animation]  --reduced motion off (c)--> [running]
any other change (tone, label, theme, size, position, visibility, scroll) --> no transition
```

## `ocelle-metric`

| Field | Source | Type / default | Notes |
|---|---|---|---|
| `label` | attribute `label`, reflected | string, `""` | rendered as text in `dt` |
| `displayValue` | attribute `display-value`, reflected | string, `""` | rendered as text in `dd`; never parsed |
| `layout` | attribute `layout` | `"stack" \| "row"`, `stack` | getter parses; unknown → `stack` (R-02 pattern) |

No events, methods or custom states.

## `ocelle-pill-tag`

| Field | Source | Type / default | Notes |
|---|---|---|---|
| `status` | attribute `status` | `Status`, `neutral` | R-02 |
| `variant` | attribute `variant` | `"pill" \| "badge"`, `pill` | unknown → `pill` |
| `density` | attribute `density` | `"default" \| "compact"`, `default` | unknown → `default` |
| `interactive` | attribute, reflected | boolean, `false` | |
| `href` | attribute, reflected | string, `""` | link mode iff `linkHref(href, document.baseURI)` is defined (012) |
| `disabled` | attribute, reflected | boolean, `false` | no effect while static |
| `label` | property only (not reflected) | string, `""` | trimmed; names the inner control (012 FR-006 order) |
| passthrough | host attributes `aria-label`, `aria-labelledby`, `aria-describedby`, `aria-controls`, `aria-current`, `aria-pressed`, `title` | held by 012's `MovedAttributes` while interactive | mirrors `data-ocelle-moved-<name>` |

Derived:

- **mode** = `link` if link mode by `href`; else `button` if `interactive`; else `static` (FR-035, R-07).
- **fullText** = trimmed, whitespace-collapsed text of the default slot's flattened assigned nodes (R-09).
- **truncated** = mode ≠ static and not `disabled` and the text span overflows (R-09); internal reactive state.
- **custom states**: `pressed` iff mode = button and applied `aria-pressed` = `"true"`; `current` iff mode ≠ static
  and applied `aria-current` present and ≠ `"false"` (FR-031).

Mode transitions (FR-035, R-08):

| From → to | Passthrough values | Focus | Observers |
|---|---|---|---|
| static → button / link | `connected()`: host attributes and mirrors moved and mirrored as at upgrade | not taken | truncation observers created |
| button ↔ link | stay held and mirrored; re-applied to the new control (`aria-pressed` applied on the button only) | kept on the new control if the old one had it; ring only if it showed | kept |
| button / link → static | `release()`: each held value written back to the host as last set (cleared ones not), mirrors removed | lost as for a removed node | disconnected |
| upgrade while static | `adoptMirrors()`: mirrors written back unless the host sets the attribute; mirrors removed | — | none |

Activation (interactive, enabled): one native `click` and, before its bubble phase, one `ocelle-pill-tag-activate`
(`bubbles`, `composed`, `cancelable`, `detail {}`); none on a modifier click in link mode, a middle click, while
disabled or while static (FR-031).

## Tokens added (R-10)

`--ocelle-size-indicator` (0.5rem), `--ocelle-motion-pulse` (1600ms; 0ms under reduced motion),
`--ocelle-motion-pulse-count` (3), `--ocelle-line-height-snug` (1.2), `--ocelle-target-small` (1.5rem), and only if
mission 011 is not on `main` at US2: `--ocelle-font-size-eyebrow`, `--ocelle-font-weight-eyebrow`,
`--ocelle-tracking-eyebrow`, `--ocelle-color-eyebrow` as 011's R-12 defines them.
