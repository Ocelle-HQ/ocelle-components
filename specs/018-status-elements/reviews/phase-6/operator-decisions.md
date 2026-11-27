# Phase 6 operator decisions

## Q-P6-1: the three rules no Chromium test can observe

The question: R-07 and data-model.md call for `min-inline-size: 0` on the pill host and on `.icon-row`, and for `overflow-wrap: anywhere` on disabled text. The implementer did not write them because their plants survive every test body in Chromium. The behaviour they stand for is tested and passes: a pill shrinks in a flex row and in a grid track, and a disabled pill breaks a long word.

Options:
- (a) Leave them out and amend the docs.
- (b) Write them and mark them unobservable in Chromium.
- (c) Write them and add a WebKit run.

**Decision: (a) Leave them out, as committed.** data-model.md and R-07 are amended to match. The existing tests pin the behaviour. The amendment is assigned to the round-1 fix or to phase 7 (Polish).

## Round 1 (reviews/phase-6/round-1.md)

- **R1-03: in fix-1.** The fix round amends data-model.md, research.md (R-06, R-07, R-09), plan.md and the plant column of contracts/checks.md:115 to match Q-P6-1 (a). The amendment also says that the control's minimum is `--ocelle-target-small` (FR-043).
- **R1-05: interactive only, and recorded.** The fix round:
  - limits the pill's `slotchange` stop to the interactive modes, where the tooltip wraps the control;
  - records the stop in R-08 or R-09;
  - states in the README that the stop happens.

  The 008 point stays open: the tooltip reads `event.target`, not its own slot. It goes to the orchestrator as a triage item for 008, and this run does not touch GitHub.
- **R1-04: in fix-1.** The fix round corrects the comment at ocelle-pill-tag.ts:72-73 and CHANGELOG.md:130: the module now defines `ocelle-tooltip` too.

## Q-F1: the README sentence on the slotchange stop (round 1 fix)

The README now says that in button and link mode a forwarded slot's `slotchange` stops at the pill (R1-05). No README test pins that sentence. Fix-1's red commit had already been recorded when the gap was found.

**Decision: (c) defer to phase 7's T063** (README and CHANGELOG). The pin is added there, test-first, in that phase's red commit.
