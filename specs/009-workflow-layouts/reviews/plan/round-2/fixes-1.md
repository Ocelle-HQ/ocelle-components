# Squad round 2: fixes 1

Applied from `refute.md` (6 confirmed: 2 fixes, 4 forks, each decided (a) by the operator). PLAN-FRESH-2-007 was
refuted and needs nothing. No verify file existed yet.

| ID | Resolution | Where |
|----|------------|-------|
| PLAN-FRESH-2-001 | decided: (a) | research R-05 (two border-box layers, the fade sized to the measured client height and an opaque layer the scrollbar's thickness, `mask-composite: add`; the clip mechanism dropped and recorded under Alternatives; plant: the fade layer sized to the whole box), R-03 (box observed by border box), R-04 (scrollbar test assertions), R-18 (`mask-size`, `mask-position`); contracts/overflow-region.md § Effects (Mask figures), § Lifecycle, § Stylesheet; data-model `maskFigures`; contracts/elements.md scroller; spec operator decisions (round 2); plan Constraints, Constitution Check III and IV, round-2 decisions table, phase 2 scrollbar test |
| PLAN-FRESH-2-002 | decided: (a) | research R-13 (`MutationObserver` over all panes' assigned elements, one pass per delivery; host `ResizeObserver` for `measured` and the tier only; recorded cost; content-change cases at 1153 px with `driver.messages()` empty; spike pass condition; option (b) under Alternatives); data-model re-measure triggers; spec FR-025 (the no-mutation reading), US3-12 (the two cases), FR-034 (convention); contracts/elements.md container-tier convention; plan round-2 decisions table, phase 4 spike, US3-12 plant, records |
| PLAN-FRESH-2-003 | decided: (a) | spec FR-009, US1-11, FR-034 (README item), operator decisions (round 2); research R-02 (measurement, option (b) under Alternatives); contracts/overflow-region.md § Effects (scroll writes); contracts/elements.md scroller keyboard; plan Constitution Check III, decision 2, round-2 decisions table, phase 2 (US1-11 scope, README records) |
| PLAN-FRESH-2-004 | fixed | research R-07 (handover ring drawn by `.region-ring` through `.region-frame:focus-visible > .region-ring`; pixel assertions at rest, after content overflows again, over the scrollbar band; plant: the ring as an outline of the frame), R-05 § Ring, R-04; contracts/overflow-region.md § Stylesheet (`.region-frame`, `.region-ring`), § What a later element must not do; spec US1-4; plan Constitution Check III, phase 2 US1-4 and scrollbar test |
| PLAN-FRESH-2-005 | decided: (a) | spec FR-030, FR-034 (README item), operator decisions (round 2); research R-13 § The conventions and constitution II (named cases, `sheets()` counts, phase 2 README change red first), R-05; contracts/overflow-region.md § Effects; contracts/elements.md list-detail styles; plan Constraints, Constitution Check II (the reading for the operator; Complexity Tracking stays empty), round-2 decisions table, phase 2 records and `sheets()` assertion, phases 3 and 4 `sheets()` assertions |
| PLAN-FRESH-2-006 | fixed | contracts/overflow-region.md § Use (`ifDefined`), § Outputs (`"start" \| "end" \| "both" \| undefined`), § Stylesheet (three values only); research R-05 (selectors, US1-6 computed `mask-image: none` on a fitting box, plant: `data-fade=""` with the mask on presence); data-model `fadeAttribute`; plan phase 2 US1-6 |

**Notes for the verifier.**

- PLAN-FRESH-2-005 (a): the finding put the README § Styles change in phase 4 Records. With PLAN-FRESH-2-001 (a) the
  overflow-region module is the first user of a per-instance sheet, so the README sentence changes red first in
  phase 2 Records instead, and phases 3 and 4 add their `sheets()` assertions.
- PLAN-FRESH-2-002 (a): the option names `childList`, `characterData` and `subtree`. `attributes` is added to the
  observed record types, because a class or attribute swap on slotted content is a mutation that can change its size
  and the element writes nothing to light DOM, so it cannot feed itself. The option's "before applying every tier
  change" trigger is kept for tier changes set by a property or attribute only; a tier change caused by the host
  `ResizeObserver` runs no pass, since that observer "never writes the figures".
- PLAN-FRESH-2-001 (a): the measured figures are written in the same callback that writes the edge state, and the
  scroll box is observed by its border box, because a horizontal scrollbar that appears changes the border box but not
  the content box. Whether Chromium honours a per-layer `mask-size` on a scroll container exactly as the lens's probe
  showed (`mask-size: 100% 40px`, border-box origin) is proven by the scrollbar test's red run in phase 2.
