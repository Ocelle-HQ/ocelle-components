---
check: 1
verdict: issues
---

# Spec check 1

| ID | Severity | Where | Finding | Fix |
|----|----------|-------|---------|-----|
| SPEC-1-01 | blocking | US1 scenarios 1–2, FR-002 and FR-003 | FR-003 leaves “button or link” unqualified. If a link can be the disclosure trigger, Space must open it even though Space on a native link does not activate it. A planner could also put button semantics on the panel’s host-supplied links. These choices change the keyboard contract and what a test should assert. | State that the trigger has native button semantics and support named icon and initials presentations. State separately that host-supplied panel controls retain their own native semantics. |
| SPEC-1-02 | blocking | US1 scenario 3, FR-004, SC-001 | US1 requires Escape to close the surface when focus is on or within it. FR-004 also says to dismiss “only the active surface” if another overlay is above it, with no definition of which surface is active. An overlay opened from a popover action can put both requirements in effect for the same Escape. There is no observable scenario that distinguishes closing the foreground overlay alone from also closing the popover. | Specify precedence and expected focus with a foreground overlay opened from a popover action. Verify a single Escape leaves the underlying popover open when the foreground overlay handles it, and verify its own Escape once focus returns. |
| SPEC-1-03 | note | US1 scenarios 1–2 | “Opening the surface leaves focus on the trigger” reads as both a postcondition for pointer activation and as a promise to keep existing trigger focus. Native pointer focus differs across browser platforms, so a cross-engine test needs the intended result. | State the expected post-open focus for pointer and keyboard activation separately, including any preservation of platform pointer behavior. |
| SPEC-1-04 | note | US2 scenarios 1–3, US3 scenarios 1–3 | The narrated scenarios state observable results, but some omit the action or initial state the test should use. For example, US3’s pressed state could be asserted only on the initial render and still leave its selection behavior untested. | State the starting choice, the activation and the changed choice after reopening, and express the other placement and Storybook scenarios in Given/When/Then form. |
| SPEC-1-05 | note | FR-008, SC-004 | FR-008 refers to “the three workflow measurements” before defining them. SC-004 names all three, but “if one is available” leaves no record requirement if there is no qualifying Visual pair. | Reference SC-004 from FR-008 and have the pilot report whether an exact Visual control pair was available and the reason when it was unavailable. |

The issue’s compact placement, outside-pointer focus, host-driven close, fictional Storybook actions, 320 px, 200% text, both themes, forced colors and strict CSP are represented. No operator questions remain.
