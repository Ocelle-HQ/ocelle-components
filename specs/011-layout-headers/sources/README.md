# Sources read for this specification

Read on 2026-11-12. Everything below is a requirements source only (constitution VI): no code, styles or assets were
copied from it.

| Source | How it was read | What it gave |
|---|---|---|
| Ocelle-HQ/ocelle-components #8 (body; no comments) | GitHub tools, read-only, by the orchestrator | The five elements, their use counts, the gap list, "Done when" |
| Ocelle-HQ/ocelle-components #7 ("Done when"), #12, #16, #1 (gap table) | GitHub tools, read-only | The inherited checklist; #12's shell, tiers and personal drawer; #16's drawer; gap rows #492, #497, #516, #529 → #8 |
| spec-kitty/spec-kitty-design #529 (body and one comment) | Public issue page (web fetch) | 32 px title and plain eyebrow today; 24 px display title, 12 px mono uppercase tracked subtle eyebrow wanted; band padding space-4 / space-6, zero title-subtitle gap, space-1 subtitle margin, 1 px rule under the band, `-0.01em` title tracking, line height 1.2 |
| spec-kitty/spec-kitty-design #492 (body; no comments) | Public issue page | Inclusive `max-width: 720px` viewport flip; asks for an exclusive bound or container query and `orientation` (`vertical`, `horizontal`, `auto`), and an item density; consumer workaround on `::part(rail|primary|bottom|divider)` |
| spec-kitty/spec-kitty-design #497 (body; no comments) | Public issue page | Sidebar: padding and gaps on empty parts, no dividers or footer; prototype rules between head, navigation and footer, footer pinned to the bottom. Section header: gaps for empty areas, no eyebrow-only mode; no eyebrow letter-spacing token. No numeric values |
| spec-kitty/spec-kitty-design #516 (body and one comment) | Public issue page | Roomy panel: 2 px border, 16 px radius, 32 px padding, 20 px / 600 title, 8 px gap. Compact: 1 px border, 12 px radius, 20 px padding, 18 px / 700 title, 16 px title-to-body gap (the comment reports a zero gap on another screen) |
| spec-kitty/spec-kitty-design #450 (body; no comments) | Public issue page | Personal state: a 240 px personal bar on desktop, a drawer behind a 53 px top bar at narrow width; team state is the 56 px personal rail plus the 240 px context sidebar. Belongs to #12 |

The issue pages show only comments visible without signing in.
