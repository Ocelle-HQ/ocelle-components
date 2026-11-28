---
check: 1
verdict: issues
---

# Spec check 1

| ID | Severity | Where | Finding | Fix |
|----|----------|-------|---------|-----|
| SPEC-1-01 | blocking | spec.md Story 2 scenario 3, FR-005, SC-002 | “Focus reaches the new panel predictably” does not identify where it lands or what the next Tab reaches. Implementations that focus the heading, focus the first action immediately, or keep focus on the navigation control could each claim to satisfy this. The issue calls for predictable focus in a reusable recipe. | Define the destination for focus after category and section activation, the next Tab behavior, and an observable browser assertion for each transition. |
| SPEC-1-02 | note | spec.md Story 2 scenarios 1–2, FR-004 | The motion scenario names expansion only, while the issue describes toggling child navigation with sliding behavior. The scenario also leaves keyboard reachability of children while collapsed implicit. | Cover both directions, the expanded state in each direction, and absence of collapsed destinations from keyboard navigation. |
| SPEC-1-03 | note | spec.md FR-005, SC-003 | The success criteria require operability in forced colors but do not explicitly require visible focus and current-destination indicators there. A control can remain operable while losing those visual cues. | Make the focus and selected indicators observable across the required display modes, including forced colors. |
