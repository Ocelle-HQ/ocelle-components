# Squad round 1: fixes 1

The 24 confirmed fixes of `refute.md` and the operator's 9 fork decisions (human:jeroennouwsdev), applied to
`spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/elements-status.md`, `contracts/checks.md` and
`quickstart.md`. Duplicates are resolved with the finding they duplicate. Operator context carried into the plan: the
implementation waits for 012, 008 and op 016 on `main`; per-phase plant runs are the affected plants only (op 016's
mode, never the full set locally); T001 rechecks the tasks against op 016 as merged.

| ID | Resolution | Where |
|----|------------|-------|
| PLAN-A11Y-SECURITY-1-001 | decided: (a) | research.md § R-05 (`aria-hidden` uppercase span, visually hidden written copy from keywords and 0, T001 probe); data-model.md § ocelle-metric; plan.md phase 1 spikes; contracts/checks.md US2 row; spec.md header (FR-022 and US2-2 stand) |
| PLAN-A11Y-SECURITY-1-002 | fixed | research.md § R-08 Focus (refocus queued in a microtask after the tooltip's slotchange, spike in T001); data-model.md transitions; contracts/checks.md § US4 bodies (focus and tooltip, both directions) |
| PLAN-A11Y-SECURITY-1-003 | fixed | research.md § R-07 (`class="control pill …"`, `:host([disabled]) .control` GrayText rule); contracts/checks.md § US4 bodies (forced colours, ring) |
| PLAN-A11Y-SECURITY-1-004 | fixed | research.md § R-07 Disabled (border and text `color-disabled-ink` on `color-disabled-bg`); plan.md decision 7; contracts/checks.md § US4 bodies (disabled look) |
| PLAN-A11Y-SECURITY-1-005 | decided: (a) | research.md § R-07 Looks (inset `bar-width` box-shadow, no width change; badge hover and pressed fill with `color-<status>-bg`); plan.md decision 6; research.md § R-12 (`Pressed` with badges); contracts/checks.md § US4 bodies (equal boxes, looks) |
| PLAN-A11Y-SECURITY-1-006 | decided: (a) | research.md § R-07 Looks (resting `color-accent-strong` border on interactive `pill`s, badges keep their status border); plan.md decision 6 and Constitution Check II; contracts/checks.md § US4 bodies (resting border) |
| PLAN-A11Y-SECURITY-1-007 | decided: (a) | research.md § R-07 Focus-ring clearance (host capped at `calc(100% - 2 * (offset + width))` plus one ring extent of inline margin, from an interactive-only adopted sheet; README block-axis rule); plan.md decision 11 (the margin is the plan's reading of (a), stated for the operator); contracts/checks.md § US5 bodies (ring in a clipping container); research.md § R-12 (`Truncated`) |
| PLAN-CORRECTNESS-1-001 | fixed | research.md § R-08 (mode read from the `interactive`/`href` attributes, additive `capture()` on every static → interactive transition); plan.md decision 10; data-model.md § Mode transitions; contracts/checks.md § US4 bodies (US4-9 attribute order, at upgrade and after creation) |
| PLAN-CORRECTNESS-1-002 | fixed | research.md § R-06, § R-07, § R-08 (`guardHost` additive `active` predicate, false while static); data-model.md (click guard); plan.md decision 10; contracts/checks.md § US3 bodies (static click inside `<a href>` and under a listener, enabled and `disabled`) and the `control.test.ts` row |
| PLAN-CORRECTNESS-1-003 | fixed | research.md § R-04 (animation longhands, no `0s`; the ring grown by `inset` to `calc(var(--ocelle-size-indicator) * -0.5)`, no new token); research.md § R-10; plan.md decision 2 and Constitution Check II |
| PLAN-CORRECTNESS-1-004 | fixed | research.md § R-09 Observer lifecycle (exist iff connected and interactive; created in `updated()` and on reconnection; `ResizeObserver` re-targeted); data-model.md (observers, transitions); contracts/checks.md § US5 bodies (after static → interactive, after a mode switch) |
| PLAN-CORRECTNESS-1-005 | decided: (b) | spec.md header, FR-014, US1-8, Edge Cases, Assumptions; research.md § R-03; plan.md decision 4; data-model.md; contracts/elements-status.md; contracts/checks.md § US1 bodies (US1-8) |
| PLAN-CORRECTNESS-1-006 | fixed | data-model.md, contracts/elements-status.md (`label` attribute and property, not reflected); spec.md FR-025 wording; research.md § R-15; contracts/checks.md § US4 bodies (`label` attribute) and the manifest row |
| PLAN-CORRECTNESS-1-007 | decided: (a) | value filter dropped (research.md § R-07, contracts/checks.md § US4 bodies, values as written); the link-mode rule worded as the pill's own in spec.md header, FR-031, US4-10, Edge Cases, data-model.md, contracts/elements-status.md; plan.md decision 12. The triage note for 012 is not written by this pass (a squad fix writes no triage record): plan.md decision 12 leaves it to the orchestrator |
| PLAN-CORRECTNESS-1-008 | fixed | research.md § R-07 Disabled (`color-disabled-bg` ground, the declared exempt pair; the stop dropped); plan.md decision 7 and phase 1 (the disabled-ink recheck removed) |
| PLAN-CORRECTNESS-1-009 | fixed | research.md § R-06 (`.pill` > `.icon-row`, `--ocelle-icon-size: 1lh` on `.pill`, the row's padding 0) and § R-07 (the same structure inside the control); plan.md decision 5 |
| PLAN-CORRECTNESS-1-010 | fixed | duplicate of PLAN-A11Y-SECURITY-1-005 |
| PLAN-CORRECTNESS-1-011 | fixed | research.md § R-06 (`:host { display: inline-grid; min-inline-size: 0 }`, inner box the stretched grid item) and § R-07; contracts/checks.md § US4 bodies (stretched host, click 1 px inside its edge) |
| PLAN-CORRECTNESS-1-012 | fixed | research.md § R-09 (fractional measure by a `Range` over the assigned nodes against the span's box; recheck in T001); contracts/checks.md § Test harness (the measure on a stand-in) and § US5 bodies (sub-pixel) |
| PLAN-CORRECTNESS-1-013 | decided: (a) | spec.md header, FR-012 (b) and (d), US1-4; research.md § R-04, § R-14; data-model.md lifecycle; plan.md phase 1 spikes; contracts/checks.md § US1 bodies (`moveBefore()` and `until-found` pinned); contracts/elements-status.md README rule |
| PLAN-CORRECTNESS-1-014 | decided: (b) | spec.md header, FR-012 (a), US1-4, Edge Cases; research.md § R-04 (a); data-model.md lifecycle; contracts/elements-status.md (`pulse` row and README rule); contracts/checks.md § US1 bodies (same task) |
| PLAN-CORRECTNESS-1-015 | fixed | duplicate of PLAN-A11Y-SECURITY-1-003 |
| PLAN-CORRECTNESS-1-016 | fixed | research.md § R-05 (`.layout-row .pair { display: flex; … }`); contracts/checks.md US2 row |
| PLAN-FRESH-1-001 | fixed | duplicate of PLAN-CORRECTNESS-1-001 |
| PLAN-FRESH-1-002 | fixed | duplicate of PLAN-CORRECTNESS-1-002 (`pill.click()` on a static pill included in § US3 bodies) |
| PLAN-FRESH-1-003 | fixed | research.md § R-07 Focus (no `delegatesFocus`; `focus()` forwarded in interactive modes) and § R-06; contracts/elements-status.md (`focus`, `click`); contracts/checks.md § US3 bodies (static focus) |
| PLAN-FRESH-1-004 | fixed | duplicate of PLAN-CORRECTNESS-1-012 |
| PLAN-FRESH-1-005 | decided: (a) | duplicate of PLAN-A11Y-SECURITY-1-001 |
| PLAN-FRESH-1-006 | fixed | research.md § R-06 and § R-09 (`min-inline-size: 0` on the host; README rule on table cells); contracts/elements-status.md README rules; contracts/checks.md § US5 bodies (flex row and grid track) |
| PLAN-FRESH-1-007 | fixed | research.md § R-08 (`release()` called synchronously from the `interactive`/`href` callback; why a host-wins branch is not added); data-model.md transitions; contracts/checks.md § US4 bodies (US4-8 same task, both orders) |
| PLAN-FRESH-1-008 | decided: (b) | duplicate of PLAN-CORRECTNESS-1-014 |
| PLAN-FRESH-1-009 | decided: (a) | duplicate of PLAN-CORRECTNESS-1-013 |
| PLAN-FRESH-1-010 | fixed | duplicate of PLAN-CORRECTNESS-1-006 |
| PLAN-TESTABILITY-1-001 | fixed | contracts/checks.md § Test harness; research.md § R-01 (driver recheck) and § R-11 (harness step); plan.md phase 1, decision 1, Technical Context, Project Structure |
| PLAN-TESTABILITY-1-002 | fixed | research.md § R-11 (`settleLayout()`, self-tested; negatives after the 300 ms test delay beside a showing twin; plants `truncated` forced to false and to true); contracts/checks.md § Test harness and § US5 bodies |
| PLAN-TESTABILITY-1-003 | fixed | research.md § R-09 Re-evaluation (one row per trigger; `loadingdone` dropped with its reason and a README limit; every `updated()` re-measures, so no `variant` condition; teardown mutants recorded as equivalent); contracts/checks.md § US5 bodies and the equivalent-mutant note |
| PLAN-TESTABILITY-1-004 | fixed | duplicate of PLAN-CORRECTNESS-1-004 |
| PLAN-TESTABILITY-1-005 | fixed | research.md § R-04 Rationale; contracts/checks.md § US1 bodies (US1-5 under `reduce` with a host rule restoring `--ocelle-motion-pulse`, twin under no preference; plant) |
| PLAN-TESTABILITY-1-006 | fixed | research.md § R-04 (no other change, proven on the running animation); contracts/checks.md § US1 bodies (seek, change, same animation; positive twin; plant) |
| PLAN-TESTABILITY-1-007 | fixed | contracts/checks.md § Scenarios (SC-001 rows split into phases 2, 3 and 4, each with its assertion); plan.md phases 2, 3, 4 |
| PLAN-TESTABILITY-1-008 | fixed | contracts/checks.md § US3 bodies (seven names on a static pill, interactive twin, plant) and § US4 bodies (US4-8 later change); research.md § R-08; Edge cases table |
| PLAN-TESTABILITY-1-009 | decided: (b) | duplicate of PLAN-CORRECTNESS-1-005 |
| PLAN-TESTABILITY-1-010 | fixed | contracts/checks.md § US4 bodies (US4-7: box ≥ `target-small`, corner clicks inset 1 px, a click 1 px outside) and § Test harness (click at a point) |
| PLAN-TESTABILITY-1-011 | decided: (b) | research.md § R-12 (`Pulse` folded into `Tones` as a second row, 18 stories); plan.md decision 9, phase 2, Scale/Scope; quickstart.md |
