---
phase: 1
round: 2
verdict: changes_requested
base: dd69835e5500a7bf0757b43e542f8d9dc978953f
head: 5e08c50
tdd_check: pass
reviewer: human:jeroennouwsdev (operator round, recorded by the orchestrator)
---

# Phase 1, round 2: operator round from the landing review

<!-- Not a reviewer-renata phase review. The /ocelle-land landing review of PR #64 (reviews/landing/round-1.md)
found L1-01 (blocking) and L1-02 to L1-06 (notes). On 2026-11-21 the operator chose how to resolve them. Recorded as
an operator round so that the fix procedure (label fix-2) and a round 3 review apply. The operator's answers are
quoted verbatim. -->

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| O2-01 | blocking | packages/elements/src/focusable.ts (opaque branch, about line 116) | Landing review L1-01: the opaque branch still counts a custom element whose `shadowRoot` reads null (a closed-shadow host, or a light-DOM custom element wrapping a link) with no rendering check, so inside a closed `<details>` at the end of an `ocelle-dialog` or `ocelle-drawer` Tab still escapes to `body` (measured by the reviewer: `body dlg[button] b1 s body` where `dlg[button] b1 s dlg[button] b1` is expected). README:488-489 and CHANGELOG:271-273 promise the case without condition. Operator: "Extend fix, test-first (Recommended)". | Red test first under `red.sh 1 fix-2`: rows for both cases in the dialog (and the drawer through `inheritedRows`), Tab and the open-`details` counterpart. Then the opaque branch applies the same rendering check as stops. README and CHANGELOG stay true. |
| O2-02 | blocking | packages/elements/README.md (about line 1037) | Landing review L1-03 (and R1-04): "slotted icons never contribute to `ocelle-button`'s name" is unconditional, while an icon-only button with no name source is still named from its content. Operator: "L1-03 README condition". | Scope the sentence to a button named by its label, `label` or the host, keeping the `readme.test.ts` pin contiguous. |
| O2-03 | blocking | ops/022-focus-trap-details-icon-name/spec.md (about lines 67 and 131) | Landing review L1-06 (and R1-01): the spec says scenario 2 fails on main and SC-001 lists it as red; the red run shows it passes on main. Operator: "L1-06 stale SC-001". | Correct the sentence and SC-001, citing the measurement. |
| O2-04 | blocking | packages/elements/src/focusable.ts (about line 59) | Landing review L1-04 (and R1-03): `getClientRects().length > 0` is implied by `checkVisibility()`, and its equivalent-mutant record also disables two non-equivalent mutants. Operator: "L1-04 drop redundant check". | Amend FR-001 (planner), then drop the check and its equivalent-mutant record; the mutation gate on the changed lines must leave no survivor. |
| O2-05 | blocking | ops/022-focus-trap-details-icon-name/reviews/phase-1/notes.md | Landing review L1-05: `red-widen.log` and `red-slot.log` name `f5b0bdf` and `3f86a0c`, folded into `55b77a6` and not in `history-map.txt`. Operator: "L1-05 map red logs". | Note in notes.md that both commits live only on `archive/claude/057-focus-trap-icon-a11y-prefold-phase-1`. |
| O2-06 | note | ocelle-option, ocelle-tab, ocelle-segment (main) | Landing review L1-02: their icon wrappers have no `aria-hidden` while the README says the icon adds nothing to their names; not measured. Operator: "Into the follow-up (Recommended)". | No change in this op; added to the ocelle-action-row follow-up issue proposal. |

## Verdict

changes_requested (operator round).
