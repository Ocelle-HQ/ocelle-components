# Squad round 3: fixes 1

Applied from `refute.md` (3 confirmed: 1 fix, 2 forks, decided (a) and (b) by the operator). No verify file existed
yet.

| ID | Resolution | Where |
|----|------------|-------|
| PLAN-FRESH-3-001 | decided: (a) | spec operator decisions (round 2 bullet amended; round 3 added), FR-025 (`remeasure()`, the unseen changes), FR-030 (manifest methods), FR-034 (README methods and convention), FR-035 (changelog), US3-12 (shadow-content case), "does not" table; research R-13 (`remeasure()` trigger, recorded cost, unseen-changes case with plant `remeasure()` as a no-op, spike pass condition, options (b) and (c) under Alternatives); data-model re-measure triggers; contracts/elements.md (`remeasure()` row, Methods, convention: unseen changes); plan summary, Constitution Check I and VII, decision 5, round-3 decisions table, phase 4 spike, US3-12, records |
| PLAN-FRESH-3-002 | fixed | spec FR-025 (per-frame scheduling, reading for mutations inside callbacks), FR-034 (loop message), US3-12 (`ResizeObserver` callback case), "does not" table (two rows); research R-13 (Scheduling, round-3 measurement and the three-column case the element cannot prevent, case set where the pass is the only writer with plant "the pass run in the `MutationObserver` callback", once-per-frame counted case across tasks, frame record read from the grid's `ResizeObserver` delivery, lens's second remedy under Alternatives); data-model `pending` and triggers; contracts/elements.md convention (scheduling, loop message); plan Project Structure (`list-detail-measure.ts`), round-3 note, phase 4 spike, US3-12, once-per-frame case, records |
| PLAN-FRESH-3-003 | decided: (b) | spec operator decisions (round 3), FR-025 and FR-034 (attribute-only changes unseen), US3-12 (class-swap case); research R-13 (`attributes` dropped, per-pass cost and trigger set, plant `attributes` observed, options (a) and (c) under Alternatives); data-model triggers; contracts/elements.md convention (cost); plan round-3 decisions table, phase 4 US3-12 and records |

**Notes for the verifier.**

- PLAN-FRESH-3-001 (a): `remeasure()` schedules the pass through the same once-per-frame path rather than running it
  synchronously, so a host calling it from its own `ResizeObserver` callback cannot write the sizer inside that
  delivery (the round-2 decision). Called from a task, the figures are in force before the next frame's layout, which
  is what the US3-12 case asserts ("in the first frame after the call").
- The unseen-changes cases are set with `narrow` in a 1196 px row (one column, the list shown, 1073 px), where CSS does
  not carry the change and the stale max-content figure is observable. In three columns a shown pane's content counts
  in the grid's own intrinsic size, and removing `narrow` runs the synchronous pass, so neither setting could show the
  gap.
- The once-per-frame case needs a count no public surface gives, so it reads a test-only counter in the internal
  `src/list-detail-measure.ts` and runs in-process only. With option (b) the case uses text changes across three
  tasks, per the refuter's note that one task already gives one delivery.
- The synchronous pass before a host-set tier change is kept (as the fix says). R-13 and the README convention say
  that a host setting `narrow`, `detail-open` or a threshold inside its own `ResizeObserver` callback runs it there,
  and tell hosts to set them from a task.
- Plan Constitution Check rechecked: I (the one method, internal scheduling module), VII (an addition), VIII (the new
  cases and plants). Complexity Tracking stays empty.
