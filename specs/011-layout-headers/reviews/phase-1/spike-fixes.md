# Phase 1 spike: fixes for the stop-and-ask

Source: `spike.md` § Stop-and-ask (the sidebar and the vertical rail held at the size of a shorter flex-row or grid
container). Operator decision (human:jeroennouwsdev, 2026-11-13): option (a), `align-self: start` on the `:host`
rule of `ocelle-context-sidebar` and `ocelle-personal-rail`. A page rule on the host's `align-self` still wins, and the
README says so.

| ID | Resolution | Where |
|---|---|---|
| Stop-and-ask (R-09 item 6, R-10 item 4) | decided: (a) | spec.md: header "Operator decision at the phase-1 spike" |
| Sidebar box | decided: (a) | research.md R-09: `align-self: start` in the `:host` rule; new "Stretching containers" item (cause, measurement with and without it, page rule wins as the outer context, no effect in a block container, the unmeasured flex-column consequence); rationale; "Measure before red" records the spike result |
| Rail box | decided: (a) | research.md R-10: `align-self: start` in the `:host` rule; the "Taller content than its container" item records the spike result and the page rule; the horizontal item notes that `inline-size: 100%` sets the inline size whatever `align-self` does (not measured); "Measure before red" adds the taller case in the three container kinds |
| Plan | decided: (a) | plan.md decisions 5 and 6; phases 4 and 5 (US3-4 and US4-2 variants); Constitution Check note re-checked after this decision (passes, no exception) |
| FR-023, FR-025 | fixed | spec.md: growth and fill hold in a block, flex-row or grid container; the host is `align-self: start`; a page rule on it wins (FR-036) |
| US3-4 | fixed | spec.md: block, flex-row and grid containers shorter than the content; 600 px flex-row and grid containers filled with the footer at the block end |
| Rail taller than its container | fixed | spec.md US4-2: the 600 px height in a flex-row and grid container too, and a new taller-than-container variant (grows with its content, bottom group inside its border box) in a block, flex-row and grid container. Added to US4-2 rather than as a new scenario, so no scenario is renumbered |
| FR-036 README statements | fixed | spec.md FR-036: new "sidebar and vertical rail" item (fills or grows in the three container kinds because the host is `align-self: start`; a page rule on the host's `align-self` wins) |
| Tests and README tasks | fixed | tasks.md T033 (US3-4 variants), T041 (US4-2 variants), T035 and T043 (the README statement); T037 and T044 name `align-self: start` in the host rule so the green tasks match R-09 and R-10 (T044 also names R-10's `min-block-size: 100%`) |
| Plants | fixed | contracts/checks.md § Pairing plants: one row per element, the planted defect being `align-self: start` dropped from the `:host` rule (that declaration's R-17 style plant), paired with the fill outcome |
| Checklist | fixed | checklists/requirements.md: note on this decision |

No task is renumbered or ticked; T002 stays open for the orchestrator. No source or test code is changed.

Open for the operator (not measured, not a task change): in a flex-column container the cross axis is the inline
axis, so `align-self: start` sizes the sidebar to its content inline rather than stretching it. FR-023 leaves the
sidebar's inline size to the container; research.md R-09 records this, and the README statement does not cover it.
