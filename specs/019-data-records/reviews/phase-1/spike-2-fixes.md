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

## Operator answer to Q-S2-1 applied

Answer recorded at the end of `reviews/phase-1/operator-spike-2-decisions.md` (2026-11-18, human:jeroennouwsdev):
(a), for a focusable element before the pinned box (a link in the caption) the block clearance's upper bound is the
box's client block-start edge, so the box scrolls back to show it. Design artifacts only; no source or test file is
touched. T082 stays open: its addendum now also measures this case before the red commit.

| Item | Change | Where |
|---|---|---|
| Q-S2-1 (a) | Rule: when the focused element precedes `blockStartBox()` in tree order (`DOCUMENT_POSITION_PRECEDING`, not `CONTAINS`), the upper bound is the client block-start edge instead of `pinnedEnd`; the smallest scroll back; nothing written or suppressed when already inside (a caption link at rest); the block-end bound, the room rule (still from `pinnedEnd`) and the fallback (aligned at the client block-start edge) unchanged | contracts/overflow-region-block-axis.md (§ The pinned-box measure, § Effects: Focus clearance) |
| Q-S2-1 (a) | `blockClearanceScroll({ ring, box, pinnedEnd, fade, before })`: `before` selects the client block-start bound; new pure case "before the pinned box" (with `before` a ring box between the client block start and `pinnedEnd` unchanged, paired without `before` moved; a ring box above the client block start scrolled back to it) | contracts/overflow-region-block-axis.md (§ Pure functions, § Tests); tasks.md T079 |
| Q-S2-1 (a) | New module body: the captioned test host's block holds a link on its second line; 300 px bound: at rest `scrollTop` 0 and `data-block-fade="end"` kept; past the block the ring box's block-start edge at the client block-start edge within 0.5 px, its block-end edge at or above the pinned child's current block-start edge, `elementFromPoint` returning the link; paired with the link below the pinned child | contracts/overflow-region-block-axis.md § Tests; tasks.md T079 (fixture, bodies) |
| Q-S2-1 (a) | The data table's module bullet: a caption link is bounded by the client block-start edge, not scrolled at rest, scrolled back past the caption | contracts/ocelle-data-table.md § Sticky header row (Module) |
| Q-S2-1 (a) | Why and the answer; not measured in spike 2, measured with the Q-3 (c) addendum | research.md R-18 (Focus clearance, Result) |
| Q-S2-1 (a) | FR-018 sentence; FR-017's focus bullet names the caption; US1-26 gains the caption-link half (300 px bound, at rest and past the caption); new edge case "A link in the caption of a sticky table"; decision block bullet | spec.md; checklists/requirements.md § Notes |
| Q-S2-1 (a) | Oracles: geometry (US1-26's caption link), keyboard (US1-26 helpers; the module bodies' caption link); a "platform alone" row for the at-rest half, paired with the past-caption half; one element plant (the clearance measuring an element before the pinned box from `pinnedEnd`, guard US1-26's caption-link half and T079's element-before body) | contracts/checks.md § Oracles, keyboard table, § Bodies that the platform alone could pass, § Element plants; tasks.md T024 |
| Q-S2-1 (a) | T080's US1-26 body carries the caption link; T082's addendum measures the case (100 and 300 px bounds, at rest and past the caption, LTR and RTL, Chromium's focus scroll alone recorded first; a past-caption result it already meets is a failure, since the red body would pass at red); stop-and-ask point extended; decisions in force and plan decision item 5 | tasks.md T080, T082, § Stop-and-ask points, § Phase 1 spike 2 decisions in force; plan.md § Decisions on phase 1's second spike |

Counts: no story, baseline or task added, removed or renumbered (phase 1: 21 stories, 42 baselines; mission 44 and
88). Element plants in T024 and contracts/checks.md: one more (Q-S2-1). `units.sh` reports phase 1 with 27 tasks, 25
open, as before; T082 stays open.

## Operator answers to the T082 addendum questions applied

Answers recorded at the end of `reviews/phase-1/operator-spike-2-decisions.md` (2026-11-18, human:jeroennouwsdev) on
`reviews/phase-1/spike-2.md` § Addendum: Q-A1 (a), drop `scrollbar-gutter` (`overflow-y: auto` only while the box
overflows in the block axis; the scrollbar's room read as `offsetWidth − clientWidth`); Q-A2 (a), US1-26's
past-caption half and T079's element-before body move to the partly scrolled position (the link 2 to 12 px above the
client block-start edge), the fully-past position kept as a paired assertion the platform alone meets. Design
artifacts only; no source or test file is touched. T082 stays unticked for the implementer: its addendum is recorded
and both contradictions are answered and applied here, so the implementer ticks it once satisfied the section holds
no further contradiction.

| Item | Change | Where |
|---|---|---|
| Q-A1 (a) | `.region-box[data-axis="both"]`: `overflow-y: auto` only, no `scrollbar-gutter` (computed `auto`); the block-axis scrollbar's room is `offsetWidth − clientWidth` (15 px classic, 0 hidden, 0 without `data-axis`); the why (hidden scrollbars: 15 px reserved but the inline range sized without it, a both-ways table losing its LTR end and RTL start; classic: RTL left at −14 when the gutter went); `data-axis` still only while overflowing (Q-3 (c)); the monotonicity argument restated for the scrollbar | contracts/overflow-region-block-axis.md (header, § Effects: Scrolling, Mask figures, § Stylesheet) |
| Q-A1 (a) | Mask figures: the block-scrollbar layer `0px 100%` under hidden scrollbars; "where Chromium puts the scrollbar" (not "and the gutter") | contracts/overflow-region-block-axis.md § Effects (Mask figures), § Stylesheet; tasks.md T079, T081 |
| Q-A1 (a) | The caption cap subtracts the scrollbar's room (not "the gutter"); 0 under hidden scrollbars; rewrite one frame after `data-axis` changes, measured 305px/320px with classic scrollbars; the oscillation note now cites the addendum's measurement | contracts/ocelle-data-table.md § Sticky header row (Module, The caption cap); research.md R-07 (the measured width), R-18 (The option, The caption cap with a block-axis scrollbar, The caption cap); data-model.md (box size, overflow state); tasks.md T016 |
| Q-A1 (a) | New and changed bodies: the `data-axis` body asserts `overflow-y` `auto`, computed `scrollbar-gutter` `auto`, room 0 and the four layers; a both-ways inline-range body in LTR and RTL (range `scrollWidth − clientWidth`, far end `data-fade="start"`, last column inside within 0.5 px); RTL bound set and lifted (`scrollLeft` 0, `data-fade="end"` after each change); T080's RTL pair gains the far end and the lift; US1-20 and the unbounded story assert `overflow-y` `hidden` instead of the now-vacuous `offsetWidth` equal to `clientWidth`; the sticky caption body reads "less the scrollbar's room" | contracts/overflow-region-block-axis.md § Tests; contracts/checks.md § Oracles (computed style, US1-20), § Stories (unbounded); tasks.md T014, T079, T080 |
| Q-A1 (a) | Element plant: `scrollbar-gutter: stable` added to `.region-box[data-axis="both"]`, guard the both-ways inline range body (T079) and T080's block-bounded RTL pair; the `.box-size` plant renamed to the scrollbar's room, its guard under hidden scrollbars open (Q-A3 below) | contracts/checks.md § Element plants; tasks.md T024 |
| Q-A1 (a) | FR-018 sentence (no room beyond the scrollbar the platform draws; the whole inline range reachable both ways); new edge case "Sticky header overflowing both ways, either direction"; decision bullet; checklist note | spec.md; checklists/requirements.md § Notes |
| Q-A2 (a) | The element-before body: at rest unchanged; the expected value (ring box at the client block-start edge within 0.5 px, `<thead>` below, `elementFromPoint` the link, no jump back) at the partly scrolled position (link's border box 2 to 12 px above the edge, asserted first), with A5's figures (Chromium alone −4.7, without `before` 21.3, with it 0.3); paired with the fully-past position asserting only "shown whole above the pinned child" | contracts/overflow-region-block-axis.md § Tests; tasks.md T079 |
| Q-A2 (a) | US1-26's caption-link half: the same move; the data-table module bullet states the three positions | spec.md US1-26, edge case "A link in the caption of a sticky table", decision bullet; contracts/ocelle-data-table.md § Sticky header row (Module); tasks.md T080 |
| Q-A2 (a) | Oracles (geometry US1-26, keyboard US1-26 helpers); the platform-alone row for "not scrolled at rest" now pairs with the partly scrolled half; a new platform-alone row for the fully-past half (US1-26 and T079), recorded as met by Chromium's focus scroll alone and kept as a regression guard | contracts/checks.md § Oracles, keyboard table, § Bodies that the platform alone could pass |
| Q-A2 (a) | The `before` plant's guards: US1-26's caption link at rest and at the partly scrolled position, T079's element-before body at the partly scrolled position; not the fully-past half | contracts/checks.md § Element plants; tasks.md T024 |
| Q-A2 (a) | Focus clearance: "not measured" replaced by the addendum's figures and the answer | research.md R-18 (Focus clearance), new Result (T082's addendum) |
| Both | Decisions in force; stop-and-ask points (Q-3 (c) and Q-S2-1 bullets record the stop and the answers; new Q-A3 bullet); T082's addendum text records the outcome and the answers, T082 left open; plan summary and decision items 6 and 7; quickstart prerequisites and step 5 (no empty band, the sticky table reachable to its last column, and its first under RTL) | tasks.md; plan.md § Summary, § Decisions on phase 1's second spike, § Phases (Spike 2); quickstart.md |

Counts: no story, baseline or task added, removed or renumbered (phase 1: 21 stories, 42 baselines; mission 44 and
88). Element plants in T024 and contracts/checks.md: one more (the gutter back). `units.sh` reports phase 1 with 27
tasks, 25 open, as before; T082 stays open.

## Question for the operator (after the addendum answers)

**Q-A3. The data table's scrollbar-room subtraction has no biting guard under hidden scrollbars.** With
`scrollbar-gutter: stable` the room the data table subtracts from `--data-table-box-size` (`offsetWidth −
clientWidth`) was 15 px in every run, so the plant "the `.box-size` write without the gutter subtracted" made the
sticky caption body fail. With Q-A1 (a) the room is 0 under `--hide-scrollbars`, which every harness, story and
baseline uses, so the subtraction and its absence give the same cap there and the plant cannot bite (a plant that
does not bite stops the phase, contracts/checks.md § Element plants). The subtraction still matters to users with
classic scrollbars (15 px: without it the caption's last 15 px run under the scrollbar). The same holds, more
mildly, for the block-scrollbar mask layer's figure (`0px 100%` under hidden scrollbars; its plant still bites on the
layer count). Options:

- (a) Add a classic-scrollbar half to T080's sticky caption body, run in a suite launched without
  `--hide-scrollbars` as 009's `packages/elements/test/browser/scrollbar.test.ts` does (fixture harness only): at
  320 px with block overflow the room 15 px, `--data-table-box-size` the measured size less 15 px and every caption
  line inside the unmasked width; the bound set and lifted (`305px` and `320px` following one frame after each
  change, spike-2 § Addendum); the RTL both-ways table at `scrollLeft` 0 at rest and after the lift; and T079's mask
  figure with a non-zero block-scrollbar layer. The plant is guarded there. No task added; one more browser test file
  or a new describe block in an existing one.
- (b) As (a) but only the caption cap half (no RTL or mask figure in classic mode).
- (c) Keep hidden scrollbars only; record the subtraction plant as not run with the reason (vacuous under hidden
  scrollbars) in `element-plants.md`, an accepted gap; the README states the classic-scrollbar behaviour without a
  test. Not recommended (constitution VIII: a behaviour with no failing test).

## Operator answer to Q-A3 applied

Answer recorded at the end of `reviews/phase-1/operator-spike-2-decisions.md` (2026-11-18, human:jeroennouwsdev):
(a), a classic-scrollbar half for T080's sticky caption body, the RTL lift and the mask figure, run in a suite
launched without `--hide-scrollbars` like 009's `scrollbar.test.ts`. On this branch that file is
`packages/elements/test/browser/scrollbar.test.ts`, in the `elements-browser` project of `vitest.config.ts` (node
environment, `packages/elements/test/browser/**/*.test.ts`, global setup `test/browser/global-setup.ts`); its
`beforeAll` serves `inject("elementsFixture")` and launches Playwright's `chromium` with `ignoreDefaultArgs:
["--hide-scrollbars"]` (`OCELLE_CHROMIUM_PATH` as `executablePath` when set). Since 009's test files are not edited
here, the half is a new file in the same project and form: `packages/elements/test/browser/data-table-scrollbar.test.ts`.
Design artifacts only; no source or test file is touched. T082 stays open for the implementer.

| Item | Change | Where |
|---|---|---|
| Q-A3 (a) | The classic-scrollbar suite: file, project, launch, served build, `fixtureDriver`, zero CSP violations; file-local bodies (the in-process harness cannot draw a classic scrollbar); each body asserts `data-axis="both"` and a room above 0 first, so a run with hidden scrollbars fails instead of passing vacuously; 009's `scrollbar.test.ts` not edited | contracts/checks.md § Harnesses; contracts/overflow-region-block-axis.md § Tests (009's unedited files, new classic-half bullet); plan.md § Technical Context (Testing), § Project Structure |
| Q-A3 (a) | New oracle row "classic scrollbar": the sticky caption body at 320 px (two caption line boxes first; `--data-table-box-size` the measured size less the room, 305px; caption line boxes inside the unmasked extent; bound lifted 320px, set again 305px, one frame after `settle`; no loop error), the RTL lift (both-ways RTL table: `scrollLeft` 0 and `data-fade="end"` at rest, far end reachable, the same after the bound is lifted and set again), T079's mask figure on the block-axis test host (first layer `<room>px 100%`, inline end in LTR, left in RTL; composite list; two layers with the bound lifted) | contracts/checks.md § Oracles; tasks.md T080 (new sub-item), T079 (cross-reference) |
| Q-A3 (a) | The mask figure runs on T079's test host on the page T079's `test/browser/overflow-region-block.test.ts` visits, as the operator's option named it; the caption body and the RTL lift on the data table's fixture page | contracts/checks.md; contracts/overflow-region-block-axis.md § Tests; contracts/ocelle-data-table.md § Sticky header row (The caption cap); research.md R-18; tasks.md T080 |
| Q-A3 (a) | Plant guards: the `.box-size` write without the room now guarded by the classic sticky caption body (the hidden-scrollbar bodies named as not its guard); `scrollbar-gutter: stable` also guarded by the classic RTL lift; one new plant, the block-scrollbar mask layer written `0px 100%` whatever the room, guarded by the classic mask figure. Classic guards run in `elements-browser` (`pnpm exec vitest run --project elements-browser packages/elements/test/browser/data-table-scrollbar.test.ts`; the global setup rebuilds the browser build from the planted source), not in process | contracts/checks.md § Element plants (intro, rows); tasks.md T024 |
| Q-A3 (a) | Mutation: mutants on the room survive the in-process run (room 0); they are not equivalent, and their record names the classic body that kills them and the plant run, as 009's landing review L1-02 settled | contracts/checks.md § Harnesses; research.md R-18; plan.md § Technical Context (Testing); tasks.md T025 |
| Q-A3 (a) | The red commit carries the new file, its bodies read in `red-phase.log` like the others | tasks.md T015 |
| Q-A3 (a) | Decision recorded; "open" replaced; the hidden-scrollbar note on the caption cap and the mask composition point at the classic half; rejected options (b) and (c) with reasons | research.md R-18 (Mask composition, The caption cap with a block-axis scrollbar, new Q-A3 (a) paragraph after the Result); plan.md § Summary, § Decisions on phase 1's second spike item 8 (was "Open: Q-A3"); tasks.md § Phase 1 spike 2 decisions in force |
| Q-A3 (a) | Stop-and-ask bullet: answered; the implementer stops if the suite measures a room of 0 or a plant it guards does not bite; a vacuous plant found while writing the bodies still stops | tasks.md § Stop-and-ask points |
| Q-A3 (a) | Prerequisite answered; step 1 runs the classic suite and states what it shows | quickstart.md |

Counts: no story, baseline or task added, removed or renumbered (phase 1: 21 stories, 42 baselines; mission 44 and
88). One test file added to T080 (and so to T015's red commit). Element plants in T024 and contracts/checks.md: one
more (the block-scrollbar layer written `0px 100%` whatever the room). `units.sh` reports phase 1 with 27 tasks, 25
open, as before; T082 stays open. No question for the operator.
