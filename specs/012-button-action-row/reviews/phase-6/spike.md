# Phase 6 spike (T060): row states and the card on plan decision 30's model

Run on 2026-11-16 in Chromium 156 (`chromium-1248`), in process (`vitest --project elements`), on HEAD 89a1369 with a
working-tree draft of `src/ocelle-action-row.ts`: T064's behaviour on decision 30's structure, with the positive
stacking of the note of 2026-11-16:
- `current` (`page`, `true`) gives `aria-current` and a `span.bar` inside `span.hit`, at
  `inset-inline-start: calc(var(--ocelle-focus-width) + 2 * var(--ocelle-focus-offset) - var(--ocelle-border-width))`,
  without the border term on a flush row;
- `unavailable` comes through `controlState`: `aria-disabled="true"`, and a link row has no `href` and is
  `role="link" tabindex="0"`; the title and the description, tags and trailing wrappers use `--ocelle-color-disabled-ink`;
- the card layout makes `div.layout` a grid and gives the groups `display: contents`.

The probes were scratch test files on the in-process driver. They were removed from the repository afterwards and are
not committed. The phase 5 row tests all pass on the draft (48 of 48).

## (1) Restyled host: which outside points lie outside the hit layer

The row (`Mission 42`, no other content, `row-id`) sits in a 400 px container, under each page rule on the element.
"end" is the point 4 px inside the host's inline-end edge at its block centre; "bottom" is the point 4 px inside its
bottom edge at its inline centre. Sizes are in px; the hit layer's box is given relative to the host.

| Page rule | Mode | Host | Hit layer | end outside | bottom outside |
|---|---|---|---|---|---|
| `display: block` | button | 400 × 44 | 0, 0, 400 × 44 | no | no |
| `display: block` | link | 400 × 44 | 0, 0, 400 × 44 | no | no |
| `display: flex; width: 100%` | button | 400 × 44 | 0, 0, 97.6 × 44 | yes | yes |
| `display: flex; width: 100%` | link | 400 × 44 | 0, 0, 97.6 × 44 | yes | yes |
| `display: block; height: 90px` | button | 400 × 90 | 0, 0, 400 × 44 | yes | yes |
| `display: block; height: 90px` | link | 400 × 90 | 0, 0, 400 × 44 | yes | yes |

Under `display: block` the layout wrapper is block-level and fills the host, so the hit layer covers the host and
neither point is outside. With every slot filled the figures are the same, except under
`display: flex; width: 100%`: there the layer is 344.7 px wide, so only "end" is outside. The red commit's list is
therefore, for a title-only row in both modes:
- `display: block`: no outside point;
- `display: flex; width: 100%`: end and bottom;
- `display: block; height: 90px`: end and bottom.

## (2) The bar on a focused current row

These rows have every slot filled, are focused by Tab, and sit in a 300 px box (the in-process viewport is narrower
than 500 px, see below). Distances are measured from the border edge at the inline start, in ltr and in `dir="rtl"`:

| Row | Ring band | Gap (surface) | Bar | Bar box | First content box |
|---|---|---|---|---|---|
| default, ltr and rtl | 2 to 5 px `accent-strong` | 5 to 7 px `accent-low` | 7 to 10 px `accent-strong` | start 7, width 3, block 64.4 of 66.4 (inside the 1 px border) | 13 px (icon wrapper, the wrapped tags) |
| flush, ltr and rtl | 2 to 5 px | 5 to 7 px | 7 to 10 px | start 7, width 3, the full 54 px | 12 px |

The ring reads `accent-strong` at the top, bottom and inline-end bands too. The bar's computed colour is
`color-current` (#8F5E0F light) and the layer's surface is `color-accent-low` (#F1E1C0). No title or sibling box
starts before 12 px, so the ring, the gap and the bar are clear of the content.

A first run used a 500 px box. Every `rtl` pixel then read white, because the 500 px row overflowed the in-process
viewport and focusing it scrolled the page sideways (the host's x was −86). The red tests use boxes of 300 px at most,
as US4-9 does.

## (3) The card on decision 30's model

Two cards sit in a two-column grid 400 px wide: the first with every slot, the second a link with a title that wraps
and four tags, no icon and no trailing icon.
- Each hit layer's box equals its host's: 196 × 143.9, both cards as tall as their grid row.
- In the first card the title line is the icon and title (control at 13, 8, 142 wide) with the trailing icon at its
  end (155 to 183). The description is at block 35.2 and the tags at 62.4, so each starts 4 px (`--ocelle-space-1`)
  after the line above.
- In the second card the trailing wrapper takes no space. Its tags wrap onto two lines (50.4 px), and the 196 px card
  is not widened.
- A click at the centre of the description and at the centre of a tag gave one `click` and one
  `ocelle-action-row-activate` each, in both cards.

## (4) axe `color-contrast` on a current row with every slot

The pages were a current row (`current="page"`) with every slot, in light and in dark, with no `ground` (on canvas)
and with `ground="chrome"` (on chrome), default and flush, in four states: plain, hovered, focused (by Tab) and
unavailable. That is 32 pages, run with 006's rule selection, every impact reported.

- **Plain, hovered and focused** (24 pages): 0 results of any impact. There is no `color-contrast` violation and no
  incomplete result for the title, description or tag text over the hit layer, with the bar inside the layer and the
  positive stacking. US5-4 holds.
- **Unavailable** (8 pages): each page has one **serious `color-contrast` violation**. Its nodes are the slotted
  description and the two tags (`span[slot="description"]`, `span[slot="tags"]` twice), but not the title.

### Why the title passes and the description and tags fail

axe-core 4.14.0's `color-contrast` skips any node that `isDisabled` reports: a native disabled control, or
`aria-disabled="true"` on the node or on any ancestor in its flattened tree.
- The title sits inside the inner control, which carries `aria-disabled="true"` when the row is unavailable, so axe
  skips it.
- Since decision 30, the description, tags and trailing wrappers are siblings of the inner control, not inside it.
  So axe checks their `--ocelle-color-disabled-ink` text as active text.

The disabled ink is below 4.5:1 on the row's current surface and on several other surfaces (the figures are from
`pairs.json`):
- light: `accent-low` 4.27, `inset` and `hover-bg` 4.07, `rail` 4.38, `chrome` 3.37, `chrome-hover` 3.04;
- dark: `accent-low` 3.75, `inset` 3.84, `hover-bg` 4.12, `chrome-hover` 4.39.

WCAG 1.4.3 exempts inactive components (FR-042 records the exemption), but axe does not know that these siblings
belong to the inactive control.

A wider probe covered unavailable rows with every slot, with and without `current`, default and flush, on canvas,
sheet, accent-low, inset, hover-bg, warning-bg, neutral-bg, chrome and chrome-hover (with their `ground` attribute),
in light and in dark: 72 pages. 52 of them gave the same serious violation:
- every unavailable current row;
- every unavailable flush row whose surface is not canvas or sheet;
- every unavailable chrome row.

Only default rows on the main and state grounds, whose surface is `color-sheet`, and flush rows on canvas or sheet
pass.

**This is a result against decision 30 and T060**, which require "no violation and no incomplete result" for the
unavailable state, against FR-052, and against T063's 0 serious or critical axe results on the "unavailable current"
story. The phase stops here (notes.md, operator question 1).

### A variant measured for the question

The variant puts `aria-disabled="true"` on the description, tags and trailing wrappers while the row is unavailable.
They are `aria-hidden` siblings with no accessibility node of their own. It was a trial edit, measured and then
reverted.
- All 72 pages of the wider probe gave 0 axe results of any impact, with no `aria-allowed-attr` result.
- The accessibility tree of a current row in button mode and in link mode, available and unavailable, is unchanged:
  - one control named "Mission 42", described "Due Friday Blocked Design", with `aria-current="page"`;
  - disabled only when unavailable, and focusable in every case;
  - the subtree is two unnamed generic nodes, the control and one `StaticText` "Mission 42".
