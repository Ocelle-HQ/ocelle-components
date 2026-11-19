---
phase: 4
round: 2
verdict: changes_requested
base: 55ec4105f5ad82f7efbbab81d478b36b75ef98b3
head: 70f2936
tdd_check: pass
reviewer: human:jeroennouwsdev (operator round, recorded by the orchestrator)
---

# Phase 4, round 2: operator round from the landing review

<!-- Not a reviewer-renata phase review. The /ocelle-land landing review of PR #50 (reviews/landing/round-1.md)
found R1-04 (note) in brand rule (f) and the reduced-motion generator, which phase 4 built (plan decision 29) and
operator decision C1 (2026-11-17, landing merge of mission 008) extended with the `delay: true` marker. On
2026-11-17 the operator chose to fold it into this pull request. Recorded as an operator round so that the fix
procedure (label fix-2) and a round 3 review apply. The operator's answers are quoted verbatim. -->

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| O2-01 | blocking | gates/bin/brand-rules.ts (rule (f)); packages/tokens/src/generate.ts (`motionDurations`); packages/tokens/src/source.ts | Landing review R1-04 (1): the `delay: true` marker is unbounded, so any motion token, `motion-base` included, can be exempted from reduced motion with no finding. Operator, 2026-11-17, "Fold all including R1-04", then on the marker: "Names ending in -delay (Recommended)": "The generator and rule (f) accept `delay: true` only on a motion token whose name ends in `-delay` (tooltip-delay today), and fail with a finding otherwise. Future delays need no list edit." | Red test first. Rule (f) reports a finding for a `delay: true` record whose name does not end in `-delay`; the generator refuses (throws or reports, as the token build's existing error path does) such a record. A unit test for each, and a fail plant for rule (f) (for example `f-delay-marker-misplaced`). `tooltip-delay` keeps passing. |
| O2-02 | blocking | gates/bin/brand-rules.ts (rule (f)); packages/tokens/src/generate.ts | Landing review R1-04 (2): a motion-group duration written in seconds (`1s`) or as `var()`/`calc()` is skipped silently and is not zeroed under reduced motion. Operator, 2026-11-17, "Fail on non-ms motion (Recommended)": "Rule (f) (and a generator check) reports a finding for any motion-group duration that isn't a literal `<number>ms`, unless it is a valid delay. That forces one unit and keeps every motion duration zeroable." | Red test first. Rule (f) reports a finding for a motion-group duration record that is not a literal `<number>ms` and is not a valid delay (O2-01); the generator refuses it the same way. Unit tests (seconds, `var()`, `calc()`) and a fail plant (for example `f-motion-not-ms`). Records that are not durations (for example easing curves in the motion group, if any) stay out of scope; state how the rule tells them apart. Update the brand-rules plant count pins, gates/README.md's brand-rules row and 002's contracts/gates.md plant table. |

## Verdict

changes_requested (operator round).
