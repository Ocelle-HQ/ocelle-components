---
check: 2
verdict: clean
---

# Spec check 2

| ID | Severity | Where | Finding | Fix |
|----|----------|-------|---------|-----|

## Verified fixes

- SPEC-1-01 is resolved. US1 scenarios 1–2 and FR-002–003 distinguish the native button trigger from host-supplied surface controls. The trigger can be tested for click, Enter and Space without changing the native keyboard semantics of the surface controls.
- SPEC-1-02 is resolved. US1 scenarios 3 and 5, FR-004 and SC-001 specify which surface closes on each Escape and where focus lands. The first Escape closes the foreground overlay and returns to the invoking action. The second closes the underlying popover and returns to its trigger.
- SPEC-1-03 is resolved. US1 scenario 1 distinguishes retained keyboard focus from the platform's native pointer behavior and rules out automatic focus into the surface.
- SPEC-1-04 is resolved. US2 and US3 define the fixture setup, user action and visible outcomes. The appearance case tests the host's pressed state after both choices and reopening.
- SPEC-1-05 is resolved. FR-008 points to SC-004 for the three pilot measurements. SC-004 requires a recorded outcome for a qualifying Visual pair or an explanation of its absence.

The fresh pass found no blocking findings, operator questions or notes. The issue's acceptance cases are traceable to the scenarios, requirements and success criteria. The documented public surface, host ownership, supported browser floor, strict CSP, forced colors, 320 px and 200% text checks remain within scope.
