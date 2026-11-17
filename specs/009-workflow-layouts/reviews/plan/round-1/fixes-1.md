# Squad round 1: fixes 1

Applied from `refute.md` (31 confirmed: 21 fixes, 10 forks with the operator's decisions). No verify file existed
yet. The six duplicates (PLAN-CORRECTNESS-1-010, PLAN-FRESH-1-001, 1-002, 1-004, 1-005, 1-007) are covered by the rows
of the findings they duplicate.

| ID | Resolution | Where |
|----|------------|-------|
| PLAN-A11Y-SECURITY-1-001 | fixed | research R-06 (position check against the recorded `scrollLeft`, test over two frames, wheel and arrow restore, plant: the synchronous flag); data-model `suppressed`, `written`; contracts/overflow-region.md § Effects; spec US1-13; plan phase 2 |
| PLAN-A11Y-SECURITY-1-002 | fixed | research R-07 (flat-tree walk into open shadow roots, `delegatesFocus`, inert ancestor, box check), R-18 (box check instead of `checkVisibility()`, which would raise the WebKit floor); spec FR-004, US1-4; contracts/overflow-region.md § Effects; plan phase 2 (plant: the light-DOM-only walk) |
| PLAN-A11Y-SECURITY-1-003 | fixed | research R-14 (inset ring, `Highlight`, test in an `overflow: hidden` frame, plant: the outset ring); spec FR-028, US3-6; contracts/elements.md list-detail; plan phase 4 |
| PLAN-A11Y-SECURITY-1-004 | fixed | research R-02 (Alt, Ctrl, Meta, Shift and composition left to the browser; test and plant); spec FR-006, US1-5; contracts/overflow-region.md § Effects, contracts/elements.md scroller keyboard; plan phase 2; quickstart |
| PLAN-A11Y-SECURITY-1-005 | fixed | research R-14 (temporary `tabindex`, tree at rest, click on pane text, plant), R-11 tree; data-model focus rule; spec FR-028, US3-6; contracts/elements.md; plan phase 4 |
| PLAN-A11Y-SECURITY-1-006 | decided: (b) | spec operator decisions, Assumptions ("Scroller semantics"), table row 1, US1 intro and Independent Test, US1-1, US1-3, US1-12, US2-2, US2-14, Edge Cases (nested scrollers), FR-002, FR-010, FR-011 inputs, FR-014, FR-034, SC-001; research R-01, R-08, R-15, R-17; data-model `role`; contracts/overflow-region.md § Inputs, § Effects; contracts/elements.md scroller and board; plan Summary, Constitution Check III, decisions; quickstart |
| PLAN-A11Y-SECURITY-1-007 | decided: (a) | spec operator decisions, FR-004, FR-011 effects, US1-4; research R-07 (`.region-frame` with temporary `tabindex`, inset ring, `Highlight`, no host write); data-model transitions; contracts/overflow-region.md § Effects, § Stylesheet; contracts/elements.md tree; plan phase 2 |
| PLAN-A11Y-SECURITY-1-008 | fixed | research R-06 (text-entry controls cleared on any focus); spec FR-001, US1-13 (input versus button pair); contracts/overflow-region.md § Effects; plan phase 2 |
| PLAN-CORRECTNESS-1-001 | fixed | research R-08 (`contain: inline-size` on the board's slotted children, the measured figures, sentence-length test cards); spec US2-1, US2-15, table row (US2-14 plant); contracts/overflow-region.md § Stylesheet, contracts/elements.md board; plan Summary, phase 3 (plant: lane containment removed) |
| PLAN-CORRECTNESS-1-002 | decided: (a) | contracts/gates.md (new: rule, red-first tests, plants, records); research R-05 § Lint, R-17 mutation; plan Testing, Constitution Check II and VIII, structure, Structure Decision ("No gate changes" dropped), phase 2; quickstart |
| PLAN-CORRECTNESS-1-003 | decided: (a) | spec operator decisions, FR-023, US3-1, US3-12 (1073 px); research R-11, R-13; contracts/elements.md list-detail widths; plan phase 4 spike |
| PLAN-CORRECTNESS-1-004 | fixed | research R-13 (per-instance constructed stylesheet, rule declarations through the CSSOM, no `style` attribute test); data-model `intrinsic`; plan Constraints, Constitution Check IV, decision 5, phase 4 |
| PLAN-CORRECTNESS-1-005 | decided: (a) | spec operator decisions, FR-010 ("as in 005's FR-034" dropped), US1-12, FR-034; research R-01 (Host ARIA scope); contracts/elements.md scroller and list-detail; plan phase 2 records (red first in `readme.test.ts`) |
| PLAN-CORRECTNESS-1-006 | decided: (a) | spec operator decisions, FR-001 (clearance on `:focus-visible` focus), FR-011 outputs, SC-001 (fallback exception), FR-018 and US2-6 (count grammar), FR-025, US3-10 and the table row (`*-below` grammar), FR-028 and Edge Cases (upgrade); research R-06, R-12, R-14; plan decisions 3 and 6 |
| PLAN-CORRECTNESS-1-007 | fixed | research R-11 (slot always rendered); data-model `hasInspector`; spec US3-8 (add after render, then remove); plan phase 4 (plant: slot rendered only when an inspector is present) |
| PLAN-CORRECTNESS-1-008 | fixed | research R-13 (triggers named: `slotchange` on three slots, `ResizeObserver` on host and shown panes, before every change, `MutationObserver` on hidden panes; stale content spike case, 1196 px); data-model re-measure triggers; plan phase 4 spike |
| PLAN-CORRECTNESS-1-009 | fixed | research R-06 (fade depth from the edge element's box, ring room from the track's used padding), R-05 (edge elements always laid out); contracts/overflow-region.md § Inputs, § Stylesheet |
| PLAN-CORRECTNESS-1-011 | decided: (b) | spec operator decisions, US2-4 (`color-sheet`, differs from canvas, panel, inspector and pane in both themes), US2-11; research R-10 (values, component and token tests, plant, the card consequence for #8); contracts/elements.md lane tokens and stories; plan Summary, Constitution Check II and III, phases 1 and 3; quickstart |
| PLAN-CORRECTNESS-1-012 | fixed | research R-04 (block room on `.region-box` for every host), R-05 (edge line `var(--ocelle-border-width) solid CanvasText`), R-08; contracts/overflow-region.md § Use (`querySelector<HTMLElement>`), § Stylesheet; contracts/elements.md scroller and board tokens read (`--ocelle-border-width`) |
| PLAN-FRESH-1-003 | decided: (a) | spec operator decisions, FR-001, FR-007, US1-7, US1-13; research R-04 (block size with the scrollbar, `--hide-scrollbars` off test), R-05 (fade layer clipped to the padding box so the scrollbar is unmasked; see note), R-18; contracts/overflow-region.md § Stylesheet; contracts/elements.md scroller; plan phase 2 (`test/browser/scrollbar.test.ts`); quickstart |
| PLAN-FRESH-1-006 | decided: (b) | spec operator decisions, FR-014 (reading of FR-002 for the board); research R-03, R-08 (SPEC-2-06 case added after first render with block growth); data-model transitions; contracts/overflow-region.md § Lifecycle; plan phase 3 |
| PLAN-TESTABILITY-1-001 | fixed | research R-17 (driver methods, real input, two-frame settle, keyboard and focus scenarios in-process); plan Testing, structure (driver files), phase 2 driver task |
| PLAN-TESTABILITY-1-002 | fixed | research R-17 (`viewport()`, per-frame viewports, 414 px in-process default, `vw` case asserts 1280 px); plan phases 1 and 4 |
| PLAN-TESTABILITY-1-003 | fixed | research R-05 (pixel assertions on two grounds, both themes, LTR and RTL, ring pixels at a fading edge, US1-8 on computed borders, `data-fade` never the assertion); plan Constitution Check V, phase 2 |
| PLAN-TESTABILITY-1-004 | decided: (a) | spec operator decisions; research R-03 (later-registered observer, plant: write moved into rAF; see note); contracts/overflow-region.md § Lifecycle; plan phase 2 |
| PLAN-TESTABILITY-1-005 | fixed | research R-06 (twin plain box oracle, paired Tab case, plant: clearance on every `focusin`); spec US1-13; plan phase 2 |
| PLAN-TESTABILITY-1-006 | fixed | research R-13 (per-frame record replaces the screenshot, in the spike and US3-12; plant: measurement pass split across rAF); R-17 `frameRecord`; plan phase 4 |
| PLAN-TESTABILITY-1-007 | fixed | research R-14 (in-process `test/list-detail-upgrade.test.ts` with dynamic import; fixture page kept); plan structure, phase 4 |
| PLAN-TESTABILITY-1-008 | fixed | research R-17 (one frame source `test/fixtures/frames.css`, `[data-frame]`, frames tested in both harnesses, red first), R-15; contracts/elements.md § Stories; plan structure, phase 1 (frames not exempt), phase 5 |
| PLAN-TESTABILITY-1-009 | fixed | research R-17 (plants run once, recorded in `reviews/phase-N/plants.md`, stop the phase); spec table (US2-7 corrected to US2-9); plan Constitution Check VIII, phases preamble, phase 3 (US2-9 plant) |
| PLAN-TESTABILITY-1-010 | fixed | research R-17 (20 px root case per element with fixed figures), R-08 (1070 px at a 20 px root; the lens's 1058 px used 12 px gaps, but `space-3` is `0.75rem`); spec Edge Cases (zoom and root font size); plan phases 2 to 4 |

**Notes for the verifier.**

- PLAN-FRESH-1-003 (a): the option's text says the mask "moves to an inner element". Every element inside the scroll
  box scrolls with the content and the scrollbar belongs to the box itself, so the mask stays on the box and is kept
  off the scrollbar by clipping its fade layer to the padding box, with two composited opaque layers keeping the area
  outside it (the scrollbar) opaque (research R-05). The decision's outcome is unchanged: the native scrollbar is
  kept, counted in the block size, never faded, and tested with `--hide-scrollbars` off. If Chromium does not place the
  scrollbar outside the mask's padding box, that test's red run shows it and the phase stops for the operator.
- PLAN-TESTABILITY-1-004 (a): the option names a check "in the first rAF after its callback". Against the named plant
  (state write moved into a `requestAnimationFrame`) that check passes, because the module's deferred frame callback
  runs first. The test asserts in the later-registered observer's own callback instead, which the lens's remedy also
  offered (research R-03).
