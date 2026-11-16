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
| `label` | attribute `label`, reflected | string, `""` | trimmed for naming; blank = decorative (FR-014); the only name source: a host `aria-label` is not read (R-03) |
| `pulse` | attribute `pulse`, reflected | boolean, `false` | ring rendered only while true (R-04) |

Derived: *named* = `label.trim() !== ""` → role `img`, name `label.trim()`; else `aria-hidden`. *Pulsing* = a CSS
animation on the ring, which exists iff `pulse` and the element is rendered and motion is not reduced; it runs
`motion-pulse-count` iterations of `motion-pulse` and ends (FR-012). No script state.

Pulse run lifecycle (CSS, R-04):

```text
[no ring] --pulse set, rendered (a) / connect with pulse (b) / shown again from display: none or hidden (d)--> [running]
[running] --after count × duration--> [ended: ring at opacity 0, dot solid]
[running|ended] --pulse removed, rendered--> [no ring]
[running] --reduced motion on--> [no animation]  --reduced motion off (c)--> [running]
pulse removed and set within one task --> no transition (one Lit update, ring kept)
moveBefore() (state-preserving move), hidden="until-found" revealed --> as the T001 spike shows, pinned; not a start case
<details> closed --> no transition: [running] goes on while closed and may reach [ended] unseen
<details> opened --> no transition: no run starts (Chromium 153, squad round 2), pinned; not a start case
any other change (tone, label, theme, size, position, visibility, scroll) --> no transition
```

FR-012 (a), (b) and (d) as amended after squad round 1 (operator decisions on PLAN-CORRECTNESS-1-013 (a) and
PLAN-CORRECTNESS-1-014 (b)) and squad round 2 (PLAN-FRESH-2-001 (b): no observer and no script state for the
`<details>` case).

## `ocelle-metric`

| Field | Source | Type / default | Notes |
|---|---|---|---|
| `label` | attribute `label`, reflected | string, `""` | rendered twice as text in `dt`: an `aria-hidden` uppercase eyebrow span and a visually hidden written copy that names the term (R-05); find in page matches it twice, a recorded limitation (R-05) |
| `displayValue` | attribute `display-value`, reflected | string, `""` | rendered as text in `dd`; never parsed |
| `layout` | attribute `layout` | `"stack" \| "row"`, `stack` | getter parses; unknown → `stack` (R-02 pattern) |

No events, methods or custom states. Box: `overflow-wrap: break-word` on `dt` and `dd`, and in `row` `min-inline-size:
0` on both inside the pair, so a flex row does not shrink the metric below its longest word while a long value still
breaks inside it (R-05).

## `ocelle-pill-tag`

| Field | Source | Type / default | Notes |
|---|---|---|---|
| `status` | attribute `status` | `Status`, `neutral` | R-02 |
| `variant` | attribute `variant` | `"pill" \| "badge"`, `pill` | unknown → `pill` |
| `density` | attribute `density` | `"default" \| "compact"`, `default` | unknown → `default` |
| `interactive` | attribute, reflected | boolean, `false` | |
| `href` | attribute, reflected | string, `""` | link mode iff `linkHref(href, document.baseURI)` is defined (012) |
| `disabled` | attribute, reflected | boolean, `false` | no effect while static |
| `label` | attribute and property, not reflected | string, `""` | trimmed; names the inner control (012 FR-006 order; 012 FR-013) |
| passthrough | host attributes `aria-label`, `aria-labelledby`, `aria-describedby`, `aria-controls`, `aria-current`, `aria-pressed`, `title` | held by 012's `MovedAttributes` while interactive | mirrors `data-ocelle-moved-<name>` |

Derived:

- **mode** = `link` if `linkHref(host.getAttribute("href"), document.baseURI)` is defined; else `button` if the host
  has the `interactive` attribute; else `static` (FR-035, R-07). Read from the attributes, never from Lit properties,
  in every `attributeChangedCallback` (R-08).
- **fullText** = trimmed, whitespace-collapsed text of the default slot's flattened assigned nodes (R-09).
- **truncated** = mode ≠ static and not `disabled` and the slotted text's fractional inline extent passes the text
  span's content box (R-09); internal reactive state, re-measured in every `updated()` while interactive and by the
  observers.
- **custom states**: `pressed` iff mode = button and applied `aria-pressed` = `"true"` (the pill's own rule; in link
  mode the held value gives none, unlike `ocelle-button` as merged, plan decision 12); `current` iff mode ≠ static
  and applied `aria-current` present and ≠ `"false"` (FR-031).
- **observers** (`ResizeObserver` on the text span, `MutationObserver` on the host, `slotchange` on the default slot)
  exist iff connected and mode ≠ static (R-09).
- **interactive host sheet** (the focus-ring clearance cap and margin; the host's `display: inline-grid` and the
  `min-inline-size: 0` chain on host, control, `.icon-row` and text span; the disabled pill's `overflow-wrap:
  anywhere`, R-07) is in `adoptedStyleSheets` iff mode ≠ static. While static the host is `inline-block` with no
  `min-inline-size: 0` anywhere, so a flex row does not shrink it below its longest word (R-06).

Mode transitions (FR-035, R-08). Every passthrough step runs synchronously in the `interactive`/`href`
`attributeChangedCallback` that changes the mode; rendering follows in Lit's update.

| From → to | Passthrough values | Focus | Observers and host sheet |
|---|---|---|---|
| static → button / link | `capture()`: each host passthrough attribute handed to `handle()` (moved and mirrored as at upgrade), then mirrors read back for names not held | not taken | observers created in `updated()`; host sheet adopted |
| button ↔ link | stay held and mirrored; re-applied to the new control (`aria-pressed` applied on the button only) | kept on the new control if the old one had it, refocused in a microtask after the tooltip's slotchange; ring only if it showed | `ResizeObserver` re-targeted to the new text span; host sheet kept |
| button / link → static | `release()`: each held value written back to the host as last set (cleared ones not), mirrors removed; a host attribute set later in the same task stays as set | lost as for a removed node | disconnected in `updated()`; host sheet removed |
| upgrade while interactive | each passthrough callback handed to `handle()`, in attribute order, the mode read from the attributes; `connected()` reads back mirrors | — | created at the first render |
| upgrade while static | `adoptMirrors()`: mirrors written back unless the host sets the attribute; mirrors removed | — | none |
| while static | passthrough and mirror callbacks ignored: the attribute stays on the host, no mirror, no custom state | — | none |

Click guard: `guardHost` with `active` = mode ≠ static; while static every click passes to the ancestors untouched.

Activation (interactive, enabled): one native `click` and, before its bubble phase, one `ocelle-pill-tag-activate`
(`bubbles`, `composed`, `cancelable`, `detail {}`); none on a modifier click in link mode, a middle click, while
disabled or while static (FR-031).

## Tokens added (R-10)

`--ocelle-size-indicator` (0.5rem), `--ocelle-motion-pulse` (1600ms; 0ms under reduced motion),
`--ocelle-motion-pulse-count` (3), `--ocelle-line-height-snug` (1.2), `--ocelle-target-small` (1.5rem), and only if
mission 011 is not on `main` at US2: `--ocelle-font-size-eyebrow`, `--ocelle-font-weight-eyebrow`,
`--ocelle-tracking-eyebrow`, `--ocelle-color-eyebrow` as 011's R-12 defines them.
