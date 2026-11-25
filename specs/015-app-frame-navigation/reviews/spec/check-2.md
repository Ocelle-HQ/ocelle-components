---
check: 2
verdict: clean
---

# Spec check 2

## Prior blocking findings

- SPEC-1-01 is resolved. The layout table defines the visible regions and menu across all three tiers and the drawer contents for all three layouts. SC-004 checks that each supplied destination remains available in narrow mode.
- SPEC-1-02 is resolved. Focus on tier changes sets ordered outcomes for the menu, drawer destinations, drawer-only controls and absent targets. US2.3 and SC-002 verify that narrowing within the same tier keeps the drawer open and preserves focus.
- SPEC-1-03 is resolved. FR-002 publishes both shell thresholds and cites the length convention. Edge Cases gives input precedence, inclusive equality for the wider tier, and fallback when the resolved pair is inverted. US1.4 distinguishes defaults, overrides and fallback.

| ID | Severity | Where | Finding | Fix |
|----|----------|-------|---------|-----|
| SPEC-2-01 | note | spec.md US3.1–5 and US4.1–2 | Unlike the first two stories, several scenarios remain declarative. The actions and outcomes are observable. US3.5 repeats “visible” and can be read as permitting a missing indicator. | Carry explicit setup, action and result into the test cases. Assert the presence of a focus indicator on a focused nav pill and on the compact control when its keyboard-triggered label appears. |
| SPEC-2-02 | note | spec.md FR-007 and Assumptions | The Desktop V2 source names the nav pill but leaves its activation semantics open. The draft records ordinary destination-link behavior as an assumption for plan review. | Verify the assumption against consumer usage during plan review. |
| SPEC-2-03 | note | spec.md Layout and tier behavior, Focus on tier changes item 4, and Edge Cases | The opening rule assigns focus to the first destination. The no-navigation rule suppresses the trigger. The current text does not describe a drawer whose destinations are removed while it is open. | In planning, make the no-navigation invariant hold after consumer content updates and specify a tested focus outcome if those updates remove the active destination. |
