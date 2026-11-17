# Analysis after tasks: fixes 1

Applied from `analysis-report.md` (head eefba9f; 0 critical, 1 high, 6 medium, 6 low) with the operator's decisions
in `operator-decisions.md`. No task ID changed and no task was added: every fix is a case or a statement inside an
existing task.

| ID | Resolution | Where |
|----|------------|-------|
| B1 | decided: (b) | spec operator decisions (after the analysis), US1-5 and FR-006 (composition clause removed); research R-02 (Decision, new "Composition" paragraph: why no composition reaches the non-editable box, the check an equivalent mutant, option (a) not taken); contracts/overflow-region.md § Effects, Arrow keys (no `isComposing`); contracts/elements.md scroller Keyboard; plan Constitution Check note, decisions table; tasks T013 US1-5, T023 |
| C1 | fixed | tasks T047 (US3-1 and US3-2 in forced colours, plant: border rule inside `@media not (forced-colors: active)`), T056 (border rule outside that query); plan phase 4 |
| C2 | fixed | tasks T032 (new US2-2 case and US2-10: arrow keys to the hidden end in 40 px steps in `ltr` and `rtl`, modified arrows not prevented, fades on pixels); plan phase 3 |
| C3 | decided: test the edge cases, drop the performance goal | spec operator decisions, "does not" table (four rows: no lanes, non-lane children, lane count updates, content changes while scrolled); tasks T032 (many lanes, one lane, no lanes, non-lane children, lane count updates, content changes while scrolled) and T047 (empty list slot); plan Performance Goals (timing goal dropped), phases 3 and 4, decisions table |
| C4 | fixed | tasks T047 US3-6 (Tab after the switch lands on the detail's first focusable element; the wrapper has no `tabindex`); plan phase 4 |
| F1 | fixed | tasks T038 (no containment on the lane), T039 (`contain: inline-size` in the board's `::slotted(*)`), T032 US2-1 plant and the non-lane-children case; research R-08 (Lanes, Test content); contracts/elements.md board Layout; plan phase 3 |
| F2 | decided: the spec takes the 23 stories | spec FR-032 (board right-to-left, lane flat without count, list-detail right-to-left), operator decisions; plan decisions table |
| A1 | fixed | spec FR-015 (takes FR-016's statement), FR-016 (kept as a folded ID), "does not" table row for US2-1 now cites FR-015. FR-020 stays: it applies FR-013's wrapping rule to the title, which US2-8 tests on its own |
| F3 | fixed | tasks T014 and T050 lose [P] and state that they follow T013 and T047 (T050 also follows T049, which writes the same browser file); Parallel Opportunities |
| F4 | fixed | tasks T052 (the contract's wording: about 10 ms (7 to 19 ms) with a 1000-row list) |
| C5 | fixed | tasks T032 US2-4 (title and count computed type and colour, `color-pane` in the comparison); plan phase 3 |
| C6 | fixed | tasks T013 US1-13 (the fade restored on `focusout`); plan phase 2 |
| C7 | fixed | tasks T019 (the shrink-to-fit guidance in the scroller's README section); plan phase 2 Records |

**Notes.**

- B1: the operator's option (b) both records the reason in R-02 and removes the check from the module's contract, so
  no equivalent mutant remains to record at review. Constitution V and VIII are rechecked in the plan's note.
- C3: the "content changes while scrolled" plant ("the state not recomputed on `slotchange` or on the track's
  resize") may not bite if Chromium's clamp fires a `scroll` that recomputes the state alone. The guard rules already
  make that a stop-and-ask point at T044.
- A1 kept FR-016 as an ID that points to FR-015, so the report's coverage table and the round records stay valid.
