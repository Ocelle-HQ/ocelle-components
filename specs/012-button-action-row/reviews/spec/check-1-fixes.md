# Spec check 1: fixes

| ID | Resolution | Where |
|----|------------|-------|
| SPEC-1-01 | fixed | spec.md User Scenarios "Not activated" (new: no navigation, no `ocelle-*` event, no `click` reaching a bubble-phase listener on the element or its ancestors; capture-phase listeners are outside the guarantee); US1 scenario 3; US2 scenario 3; US3 scenarios 1 and 8; US5 scenario 6; FR-003; FR-008 (README states the limit); FR-033 |
| SPEC-1-02 | fixed | spec.md FR-006 (Accessible Name 1.2 order: `aria-labelledby`, `aria-label`, `label`, content); FR-034 follows it; US2 scenario 9 (new, both set, `aria-labelledby` wins, removing it falls back to `aria-label`); US4 scenario 4 (both set) |
| SPEC-1-03 | fixed | spec.md US5 scenario 8 (was 7): limited to the tags region; the title's wrapping stays in the edge case "Very long titles and unbreakable identifiers" |
| SPEC-1-04 | fixed | spec.md FR-042 (new, row contrast: default border tokens per ground, never `--ocelle-color-rule`; non-text pairs for the default border, hover border, current bar on `accent-low`, focus ring on the ground, `accent-low` and `hover-bg`; unavailable exempt except the focus ring); FR-018 (border token per ground, rule never a boundary, main and state grounds, focus state); SC-003 (every variant, size, presentation and state of both elements) |
| SPEC-1-05 | fixed | spec.md FR-012 (padding removed on both inline sides; content starts at the box's inline start; inline-start edge equals the surrounding text's within 0.5 CSS px); US1 scenario 12 (with and without icon, each size, LTR and RTL, the measure and tolerance) |
| SPEC-1-06 | fixed | spec.md US4 scenario 10 (`event.defaultPrevented` is `true`, dispatched exactly once, no navigation, no other `ocelle-*` event, focus stays on the row) |
| SPEC-1-07 | answered | Operator (2026-11-13, human:jeroennouwsdev), "(a) flush is borderless": spec.md header "Operator decisions after spec check 1"; FR-012 (no border and no fill for every variant, label in `--ocelle-color-ink`, only hover surface and focus ring); FR-019; US1 scenario 13 (new); US1 scenarios 4 and 11 ("where it has a boundary/border") |
| SPEC-1-08 | answered | Operator (2026-11-13, human:jeroennouwsdev), "(a) every row": spec.md header; FR-031 (every row at least `--ocelle-target-min` high, flush density reduces padding only; "primary navigation target" removed); US4 scenario 11 (new, each presentation and layout); Edge Cases "Row with an icon and an empty title" |
| SPEC-1-09 | answered | Operator (2026-11-13, human:jeroennouwsdev), "(a)": spec.md header; FR-033 (no event on a Ctrl, Meta or Shift click or a middle click in link mode; browser default happens); US5 scenario 2 (new) |
| SPEC-1-10 | answered | Operator (2026-11-13, human:jeroennouwsdev), "(a) keep both as specified": spec.md header; FR-009 (`aria-current` passthrough with any value, no visual mark); FR-037 unchanged in surface; FR-008 (README conventions name both surfaces); Edge Cases "`aria-current` on an `ocelle-button`" (new) |
| SPEC-1-11 | fixed | spec.md US1 scenario 2 ("no `ocelle-*` event is dispatched") |
| SPEC-1-12 | fixed | spec.md User Scenarios "Grounds" (new: main grounds and state grounds listed by token) |
| SPEC-1-13 | fixed | spec.md US5 scenario 4 (was 3): inline-start bar, `--ocelle-bar-width`, full block size, `--ocelle-color-current`, on `--ocelle-color-accent-low`; FR-037 |
| SPEC-1-14 | fixed | spec.md FR-040 and US4 scenario 7 both use the min-content inline size |
| SPEC-1-15 | fixed | spec.md FR-032 (the tags and trailing group moves as a whole to a second line when the line cannot hold its content) |
| SPEC-1-16 | fixed | spec.md FR-030 (reflection per row property; `label` not reflected; no `download`; FR-021's `noopener` rule applies to link rows); FR-021 |
| SPEC-1-17 | fixed | spec.md Edge Cases "Long button label or narrow container" and "Row with an icon and an empty title" (new) |
| SPEC-1-19 | fixed | spec.md FR-008 (README conventions state what `busy` means on each element) |
| SPEC-1-21 | fixed | spec.md FR-008 (README states a primary action uses `size="default"`) |

Notes SPEC-1-18, SPEC-1-20 and SPEC-1-22 are not blocking and are left open: SPEC-1-18 and SPEC-1-22 ask the plan
and its research for evidence and a mapping, not a spec change; SPEC-1-20 (other script-capable schemes) is a
security choice left for the plan or a later check to settle.
