# Changes for the phase 1 spike 2 decisions

Source: `reviews/phase-1/spike-2.md` (T082 and T003's re-measure, 2026-11-18) and the operator's answers in
`reviews/phase-1/operator-spike-2-decisions.md` (2026-11-18, human:jeroennouwsdev). Design artifacts only; no source or
test file is touched. T082 stays unticked for the implementer: it now carries the Q-3 (c) measurement (an addendum
recorded in `spike-2.md` before the red commit), and it is ticked once that is recorded with no contradiction.

## Decisions applied

| Item | Decision | Change | Where |
|---|---|---|---|
| Q-1 | (a) the current edge | `pinnedEnd` is the `blockStartBox()`'s current laid-out block-end edge (the client block-start edge without one); the "as if pinned" candidate recorded as measured and not used; under a tall caption in a small bound no fade at rest until the caption scrolls away | contracts/overflow-region-block-axis.md (header paragraph, § The pinned-box measure, § Pure functions); contracts/ocelle-data-table.md § Sticky header row (Module); research.md R-18 (The pinned-box measure, Result); spec.md § Operator decisions on the re-analysis (A1 note), new § Operator decisions on phase 1's second spike, FR-018, edge case "Block-end fade and the pinned header"; data-model.md § Data table (States); plan.md § Summary, § Decisions on the re-analysis items 2 and 6, new § Decisions on phase 1's second spike; tasks.md § Phase 1 spike 2 decisions in force, § Stop-and-ask points, T081 |
| Q-1 | (a) | Captioned expected values: at 320 px with a two-line caption (two line boxes asserted first), 100 px bound: no `data-block-fade` at rest (precondition: less than twice the depth below the header's current edge), `end` once scrolled past the caption with the fade at or below the pinned header; 300 px bound: `end` at rest, the fade at or below the header's current edge; a row-1 link's ring box at or below the header's current edge within 0.5 px, at rest and past the caption; spike-2 § 11's in-process figures as reference (80.6, 27, 32 px) | spec.md US1-26; contracts/overflow-region-block-axis.md § Tests (captioned cases, `blockEdgeState` figures); contracts/checks.md § Oracles (geometry, US1-26); tasks.md T079, T080 (US1-26) |
| Q-1 | (a) | The room-rule story's note "both candidates give the same point" (wrong by the 5 px of § 1 at rest) replaced by "measured from the `<thead>`'s current edge" | contracts/checks.md § Stories; plan.md § Decisions on the re-analysis item 6 |
| Q-2 | (a) negative inset | Block 1's `<thead>` rule: `inset-block-start: calc(-1 * (var(--ocelle-focus-offset) + var(--ocelle-focus-width)))`, with the reason (sticky measures from the padding edge; 5 px ring room); `@ocelle/styles` README states the position | contracts/styles-data-table.md (block 1 row, § Consumer rules); contracts/ocelle-data-table.md § Sticky header row (The pin); research.md R-18 (The data table's side, Result); tasks.md T011, T017 |
| Q-2 | (a) | Oracles: the header's block-start edge at the client block-start edge once scrolled by the ring room or more, at its at-rest position (read before the first key) back at the block start; after `PageDown`, `End`, `Space` the former, after `PageUp`, `Home`, `Shift+Space` the latter | spec.md FR-017, US1-18; contracts/checks.md § Oracles (geometry), keyboard table (US1-18); contracts/overflow-region-block-axis.md § Tests (keys body; the test host's pinned child takes the same inset); tasks.md T079 (fixture, keys body), T080 (US1-18); data-model.md (States); quickstart.md step 5 (sticky header) |
| Q-2 | (a) | Element plant: the `<thead>`'s negative inset replaced by `0`, guard US1-17 | contracts/checks.md § Element plants; tasks.md T024 |
| Q-3 | (c) block axis only while overflowing | The module writes `data-axis="both"` only while the option is on and `scrollHeight − clientHeight > 1`; removed when the block overflow ends; a `data-axis` change is an output change (`requestUpdate()`) followed by a fresh read of the mask figures; four mask layers only while `data-axis="both"`, 009's two otherwise; the browser's keys scroll only then; the monotonicity argument (no oscillation) | contracts/overflow-region-block-axis.md (header, § Effects: Scrolling, Mask figures, Keys the browser keeps, Block overflow ending, Triggers; § Pure functions); research.md R-18 (The option, Mask composition, Result); spec.md FR-018, new edge case "Sticky header, right-to-left, overflowing only sideways", § Operator decisions on phase 1's second spike; plan.md § Constitution Check (intro, row III); data-model.md (overflow state); tasks.md T081 |
| Q-3 | (c) | The data table keeps the measured `.box-size` size and, one animation frame after the box's `data-axis` changes (the end fade's single frame), rewrites `--data-table-box-size` less the current gutter (0 without `data-axis`) | contracts/ocelle-data-table.md § Sticky header row (Module, The caption cap, Toggling); research.md R-07 (the measured width) and R-18 (The caption cap with a block-axis scrollbar); data-model.md (box size); tasks.md T016 |
| Q-3 | (c) | US1-20 and the unbounded story: no `data-axis`, no reserved gutter (`offsetWidth` equals `clientWidth`); US1-20's pair becomes a test-only bound giving `data-axis="both"`; new bodies: the RTL inline-only sticky table (`scrollLeft` 0, `data-fade="end"` at rest, start reachable) paired with the block-bounded one; `data-axis` following the bound set and lifted; the sticky caption body rewritten after the gutter comes and goes | spec.md US1-20; contracts/checks.md § Oracles (computed style), § Bodies that the platform alone could pass (US1-20), § Stories (unbounded); contracts/overflow-region-block-axis.md § Tests; tasks.md T014, T079, T080; quickstart.md step 5 |
| Q-3 | (c), measured by the implementer | Stop-and-ask point added; T082 gains the addendum listing the cases (LTR and RTL, hidden and classic scrollbars, inline only, block only, both, the bound set and lifted, the cap rewrite, no loop error, the classic-scrollbar case whose block overflow comes only from the gutter's own inline scrollbar) | tasks.md § Stop-and-ask points, T082; research.md R-18 (Result); plan.md § Phases (Spike 2), § Decisions on phase 1's second spike; quickstart.md § Prerequisites |
| Q-4 | (a) zero-wide edge | `.region-edge.block-end`: `inset-inline-start: 0`, `inline-size: 0` outside forced colours; `inset-inline: 0`, `inline-size: auto` inside them; the reason (axe `color-contrast` incomplete, `bgOverlap`, in every data table) | contracts/overflow-region-block-axis.md (header, § Template, § Stylesheet); contracts/ocelle-data-table.md § Shadow structure, § Sticky header row (The block-end fade); research.md R-18 (Forced colours, Result); spec.md FR-018; plan.md § Constitution Check row III; tasks.md T016, T081 |
| Q-4 | (a) | Bodies: outside forced colours the edge's inline size 0 and block size the fade depth; in forced colours as wide as the frame. Element plant: the edge laid out full width outside forced colours | contracts/overflow-region-block-axis.md § Tests; contracts/checks.md § Oracles (forced colours), § Element plants; tasks.md T079, T080 (US1-28), T024 |
| All | record | Decision blocks added | spec.md § Operator decisions on phase 1's second spike; plan.md § Summary (bullet), § Constitution Check (intro), § Decisions on phase 1's second spike; tasks.md § Phase 1 spike 2 decisions in force; checklists/requirements.md § Notes |

## Spike facts recorded for the contracts and the red bodies

| Fact (spike-2.md) | Change | Where |
|---|---|---|
| § 3: mask layers top first block scrollbar, inline scrollbar, block-end fade, inline fade; `mask-composite: add, add, intersect, add`; sizes and positions per layer, RTL with the block-scrollbar layer on the left | Contract states the order, sizes, positions and the composite list; bodies assert the computed `mask-composite` as that list | contracts/overflow-region-block-axis.md § Effects (Mask figures), § Stylesheet, § Tests; research.md R-18 (Mask composition); contracts/checks.md § Oracles (computed style); tasks.md T079, T080 (US1-27), T081 |
| § 8: collapsed and separated row rules differ by exactly 0.5 px | "Within 0.5 px" is inclusive (`≤ 0.5`) everywhere | contracts/checks.md § Oracles (geometry); contracts/overflow-region-block-axis.md § Tests; research.md R-18 (Result); tasks.md § Phase 1 spike 2 decisions in force |
| § 8: stripes per `<tbody>`, hidden rows counted; light hover equals the stripe | R-20 Result; US1-24's hover over a stripe read in dark | research.md R-20; contracts/styles-data-table.md (stripe row); contracts/checks.md § Bodies (US1-24); tasks.md T080 (US1-24) |
| § 10: the browser's keys as real key events; none prevented; focus stays; `PageDown`/`Space` 262 px in a 300 px box; `Home` at the block start does not move | Keys in the order `PageDown`, `PageUp`, `End`, `Home`, `Space`, `Shift+Space`, each from the previous position, asserted by direction and a non-zero move | contracts/overflow-region-block-axis.md § Effects (Keys the browser keeps), § Tests; contracts/checks.md keyboard table (US1-18); tasks.md T079, T080 (US1-18) |
| § 6: Chromium's focus scroll before `focusin`, one clearance write, no jump back | Stated | contracts/overflow-region-block-axis.md § Effects (Focus clearance); research.md R-18 (Result) |
| § 2, § 5, § 7: gutter 15 px with hidden and classic scrollbars; two `.box-size` callbacks in the open `<dialog>`; caption cap 305 px at 320 px | Stated | contracts/overflow-region-block-axis.md § Effects (Scrolling); contracts/ocelle-data-table.md § The caption cap; research.md R-18 (The caption cap with a block-axis scrollbar) |
| § 4: fade depth 32 px; room-rule bounds (63 px none, 68 px fade) | `blockEdgeState` cases with spike figures; "at exactly twice the depth the fade shows" stated | contracts/overflow-region-block-axis.md § Pure functions, § Tests; tasks.md T079 |
| § 11: captioned figures | See Q-1 above | as above |

Counts: no story, baseline or task added, removed or renumbered (phase 1: 21 stories, 42 baselines; mission 44 and
88). Element plants in T024 and contracts/checks.md: two more (Q-2, Q-4). `units.sh` reports phase 1 with 27 tasks,
25 open, as before; T082 stays open.

## Question for the operator

**Q-S2-1. A focusable element above the pinned `<thead>` (a link in the caption) under the current-edge measure.**
With Q-1 (a), the block clearance keeps a focused element's ring box below `pinnedEnd`, the `<thead>`'s current
block-end edge. A link in the caption sits above the `<thead>` in flow, so no scroll position puts it below that edge:
at rest the clearance would be clamped at 0 (and could suppress the fade), and once the caption has scrolled under the
pinned header no position clears it either. The spike did not measure a caption link; the contract does not say what
happens. Options:

- (a) For a focused element that precedes the pinned box in tree order, the clearance's upper bound is the box's
  client block-start edge (the in-flow `<thead>` is then below it and cannot cover it); the block-end bound is as
  today. One contract sentence, one `blockClearanceScroll` case and one T079/T080 body; the implementer measures it
  before the red commit with the Q-3 (c) addendum.
- (b) Make no block-axis scroll for a focused element that precedes the pinned box (as for focus inside it); Chromium's
  own focus scroll alone brings it into view, and it may sit under the pinned header. Documented in the README.
- (c) Leave the contract as it is and have the implementer measure the caption-link case before the red commit; a
  wrong result stops for the operator then.
