# Phase 5 spike (T049a): plan decision 30's shadow structure

Run on 2026-11-15 in Chromium 156 (`chromium-1248`), in process (`vitest --project elements`). The row ran in the
working-tree draft of `src/ocelle-action-row.ts` on decision 30's structure: `div.layout` (`position: relative`), the
lead and end groups, the inner `button|a.control` holding `span.hit`, the icon wrapper and `[part=title]`, and the
`aria-hidden`, `pointer-events: none` siblings `[part=description]`, `[part=tags]` and `.trailing`. The probes were a
scratch test file, deleted afterwards. Each check ran in button mode and link mode (`href="#m"`).

## (1) The hit layer's box

The layer's box equals the host's box in both axes in every case. The absolute `span.hit` inside a `<button>` or an
`<a>` takes `div.layout` as its containing block. The inner control's own box stays its content's.

| Row | Host | Hit layer | Inner control |
|---|---|---|---|
| card, short, in a two-column grid | 196 × 89.6 | 196 × 89.6 | 93.8 × 46.4 |
| card, wrapping title | 196 × 89.6 | 196 × 89.6 | 170 × 69.6 |
| row stretched in a flex row beside a 120 px sibling | 472 × 120 | 472 × 120 | 99.6 × 23.2 |
| flush row, 500 px container | 500 × 44 | 500 × 44 | 90.6 × 21 |

## (2) Clicks on the siblings

A pointer click at the centre of the description, of a tag and of the trailing icon gave one
`ocelle-action-row-activate` and one `click` at the host each, in the card and the stretched row. `:hover` matched the
inner control at each of those points.

## (3) Accessibility tree with the wrappers `aria-hidden`

The inner control is `button` (link mode: `link`), named "Mission 42" and described "Due Friday Blocked Design". The
host's subtree is three unnamed `generic` nodes, the control and one `StaticText` "Mission 42". No node exists for the
description, a tag or the trailing icon.

## (4) Clearance of the ring's bands and the bar

Distance from the host's edge to the title, description, tag and trailing boxes, in px:

| Row | Top | Bottom | Inline start | Inline end |
|---|---|---|---|---|
| flush (block padding 4 px, 44 px tall) | ≥ 11.5 | ≥ 11.5 | ≥ 40 | ≥ 12 |
| default | ≥ 48.4 (stretched) | ≥ 48.4 (stretched) | ≥ 41 | ≥ 13 |

No box reaches the ring's bands (2 to 5 px in) or the bar's place (7 to 10 px in).

## (5) axe, with 006's rule selection

Pages: rows with all slots, default and flush, plain and `ground="chrome"`, light and dark, idle and hovered.

**As decision 30 wrote it** (the hit layer at `z-index: -1` in the wrapper's stacking context): every title,
description and tag text had one **serious `color-contrast` incomplete result**, with `messageKey: "bgOverlap"`. This
happened with `isolation: isolate` on the wrapper and again with `z-index: 0` on it. axe's text-element stack
(`getTextElementStack` on the title) put `span.hit` on top: `span.hit, span, span.title, button.control, …`. So axe
models the negative layer as covering the text, though Chromium paints it beneath. That is against FR-052 and against
T049a's "no `color-contrast` incomplete result".

**The variant that holds** (same painting order, positive stacking):
- `span.hit` at `z-index: 0` in the wrapper's stacking context (`div.layout`: `position: relative; z-index: 0`);
- the icon wrapper, the title and the three siblings at `position: relative; z-index: 1`.

With it, axe's stack is `span, span.title, span.hit, …`, so the text is on top. Every page above gave 0 results of
any impact, so no `label-content-name-mismatch`, no `aria-hidden-focus` and no `color-contrast` incomplete result.
Checks (1) to (4) gave the same figures with this variant (re-run).

The variant keeps decision 30's model: the layer paints beneath the title and every sibling, and it is the topmost
hit target outside the icon and the title, because the siblings take no pointer events. Only the z-index values
differ. The deviation is recorded in notes.md.
