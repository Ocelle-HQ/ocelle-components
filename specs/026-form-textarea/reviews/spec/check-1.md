---
check: 1
verdict: issues
---

# Spec check 1

| ID | Severity | Where | Finding | Fix |
|----|----------|-------|---------|-----|
| SPEC-1-01 | blocking | User Story 1 and Assumptions | The reviewer need has no named consumer. Principle VI requires the spec to name the consumer need, and issue #76 identifies Workflow Studio run inspection as a consumer of #74. | Name Workflow Studio and the run-inspection reviewer entering or correcting a planning answer after a failed save. Cite #76 as consumer context and keep its composition deliverable outside #74. |
| SPEC-1-02 | blocking | Acceptance scenario 1, FR-002 and SC-001 | Issue #74 asks to cover submission before first scheduled render. The scenario and success criterion read FormData directly, so tests can satisfy the spec without attempting a same-task submission or observing its payload. | Explicitly exercise form submission in the same task as connection, before first scheduled render, and verify the exact initial value including line breaks in the submitted data. Keep the later edits and reset checks. |
| SPEC-1-03 | note | FR-005 and edge cases | The input and change paths are both named, but the commit trigger and observable payload are delegated to the existing convention. Choosing explicit assertions will avoid confusing Enter, which inserts a line break, with a committed change. | In the plan, state the event names, which host-observable value the listener reads, state at the event, and when a changed edit is committed. |
| SPEC-1-04 | note | FR-004, FR-007 and edge cases | The spec covers paragraphs, keyboard, invalid, disabled, read-only, both themes and forced colours. A long multiline answer at narrow width has no explicit evidence. | Add a narrow-width, wrapping and focus-visibility case to the plan using the existing responsive component conventions. |
