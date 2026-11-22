---
phase: 3
round: 3
verdict: changes_requested
base: 38e9bd5e683c506e6b83a5d12ad22d8a17def72a
head: 3972c2b3
tdd_check: pending
reviewer: human:jeroennouwsdev (operator round, recorded by the orchestrator)
---

# Phase 3, round 3: operator round, the manifest documents FormControl as an inherited base

<!-- Not a reviewer-renata review. The second merge of main (13af7a9) during the /ocelle-land pass of PR #49 stopped on
a design clash (reviews/landing/merge-stop-2.md): this mission's manifest generator copies FormControl's members into
each form element, while mission 008 on main (operator decision of 2026-11-14) lists an internal base's members with
inheritedFrom and reads only named base files. The question was put to the operator on 2026-11-17; the answer is quoted
verbatim (the option label the operator chose). The merge resolution applies it, and a phase 3 review round covers it. -->

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| O3-01 | blocking | packages/elements/scripts/manifest.ts, packages/elements/custom-elements-manifest.config.mjs; packages/elements/test/node/manifest.test.ts (the T030 and T036 tests); spec and plan text on the manifest | The generator rules of this mission and of mission 008 on main clash; no single generator passes both sides' tests. Operator, answering: "Main's rule + FormControl (Recommended)". | Keep main's generator and its 2026-11-14 rule. Add `src/form-control.ts` beside `src/overlay.ts` as a second named base, so `ocelle-form-input` and `ocelle-form-select` list FormControl's members with `inheritedFrom` (name `FormControl`, module `src/form-control.ts`) and keep their superclass. Change this mission's T030 and T036 manifest tests to pin that (test first: the changed assertions fail on the flattening generator), leave main's tests as they are, regenerate the manifest and the manifest plant copies, and update the spec and plan text that describes the flattening. |

## Verdict

changes_requested (operator round).
