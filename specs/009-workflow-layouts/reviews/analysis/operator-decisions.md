# Operator decisions on the analysis after tasks (2026-11-13, human:jeroennouwsdev)

Taken after the tasks gate, before implementation, on `analysis-report.md` (head eefba9f). The operator chose to settle
the findings now, while implementation waits for #10's merge.

- **B1** (HIGH, composition keys), "b: equivalent + reword": record in R-02 why a composition cannot reach the
  non-editable scroll box. Remove the composition clause from US1-5 and FR-006 (a spec change), and the `isComposing`
  check from the module's contract, so nothing untestable remains.
- **F2** (FR-032's story list), "Spec takes the 23": amend FR-032 to the contract's 23 stories (adding board right to
  left, lane flat without count, list-detail right to left), so SC-007 and the story tests check one set.
- **C3** (edge cases and the performance goal), "Test edges, drop perf goal":
  - add one assertion per spec edge case to T032 and T047, paired where a "does not" is involved: many lanes, one lane,
    no lanes, non-lane children, lane count updates, content changes while scrolled, and an empty list slot;
  - remove the timing goal (twelve lanes of forty cards within one frame) from the plan.
- **C1, C2, C4, F1** and the LOW findings (A1, F3, F4, C5, C6, C7): fixed in the tasks as the report recommends.

## On the re-run analysis (head 321ea0f, 2026-11-13, human:jeroennouwsdev)

- **U1** (MEDIUM, the "content removed while scrolled" plant), "New plant": the case keeps its own guard, with a plant
  only it catches: the fades and the tab stop computed from a cached `scrollLeft` instead of the clamped one.
- **F5, F6, C8, F7** (LOW), "Fix now with U1": fixed together with U1 in one commit, with no new analysis run. F7
  rewords the spec's one-lane edge case to "the board's inline size less its ring room on each inline side".
- **Next**: wait for #10's merge before implementation. Retrospective notes go to `/ocelle-land`'s step 4.2.

## Standing decision for this run (2026-11-13, human:jeroennouwsdev, confirmed in this session)

When the environment refuses a profile's write of its own record (analysis report, spec check, squad round, review,
verify), the orchestrator saves that profile's output verbatim and commits it without asking each time. The commit
message says it was saved verbatim because the write was refused; the content is never edited. Relayed by the wave-1
orchestrator session and confirmed here by the operator.
