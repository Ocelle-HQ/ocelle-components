# Spec check 2: fixes

| ID | Resolution | Where |
|----|------------|-------|
| SPEC-2-01 | fixed | spec.md SC-005 (scoped per element: an available row, busy or not, produces exactly one event; a disabled or busy `ocelle-button` or an unavailable `ocelle-action-row` produces no `click` reaching a bubble-phase listener and no event, and in link mode no navigation by any click) |
| SPEC-2-02 | fixed | spec.md User Scenarios "Not activated" (in link mode it covers plain, modifier (Ctrl, Meta, Shift, Alt) and middle clicks; no navigation in the current tab, a new tab or window); FR-003; FR-033 (the SPEC-1-09 modifier-click default applies only to a row that is not unavailable); US3 scenario 8 and US5 scenario 6 (modifier and middle clicks added) |
| SPEC-2-03 | fixed | spec.md FR-031 (a flush row stays borderless in every state: hover changes the surface only, as the flush button; the current mark is drawn in full, `accent-low` surface and bar, with no border; no state moves or resizes content); FR-036 (hover border on `default` presentation only); FR-042 (hover-border pair limited to `default`, current bar pair for both presentations); US4 scenario 8 (split into `default` and `flush`, including forced colours); US5 scenario 4 (full mark in both presentations, no border on flush) |
| SPEC-2-04 | answered | Operator (2026-11-13, human:jeroennouwsdev), "(a) in the description": spec.md header "Operator decision after spec check 2"; FR-034 (description slot text, then tags slot text in slot order; host `aria-describedby` wins and neither slot contributes); US4 scenario 3; US4 scenario 12 (new, including the host `aria-describedby` case); US5 scenario 5; Key Entities "Row parts" |

Notes SPEC-2-05 to SPEC-2-12 are not blocking and are left open for the plan or a later check. US4 scenario 12 also
covers the row half of SPEC-2-07 (host `aria-describedby` on the row); the button half stays open.
