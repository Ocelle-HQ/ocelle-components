---
check: 2
verdict: clean
---

# Spec check 2

| ID | Severity | Where | Finding | Fix |
|---|---|---|---|---|
| SPEC-2-01 | note | `spec.md` US1 scenario 4 and SC-001 | The revised reveal scenario covers acceptance, withholding, and moving focus away before acceptance. Two consecutive reveal requests can leave focus on the same named control throughout, which is another way a late viewport update could move focus away from the user's current destination. | In planning, check a second reveal from the same control before the first viewport update arrives. Keep focus transfer associated with the current reveal. |

## Check 1 follow-up

| ID | Result | Evidence |
|---|---|---|
| SPEC-1-01 | resolved | US1 scenario 3, FR-004, and SC-001 give the landed selection actions a single sequential entry, exit in both Tab directions, and bounded traversal in the supplied order. |
| SPEC-1-02 | resolved | US1 scenarios 4–5 and SC-001 exercise named reveal under controlled viewport acceptance and withholding. They check removed and clipped actions, visible successors and predecessors, the named canvas fallback, and acceptance after the user moves focus. |
| SPEC-1-03 | resolved | US3 scenario 5 and US4 scenario 1 give Escape, source removal and a switch to read-only explicit cancellation behavior. Focus recovers through the visible initiating control, source action, visible survivor order and named fallback. |
| SPEC-1-04 | resolved | US3 scenario 4 and SC-003 cancel on an authoritative connection change with surviving identifiers. Renames preserve an in-progress edit and its identifiers. |
| SPEC-1-05 | resolved | The four stories and FR-003 specify which request each operation emits. SC-001–004 cover the full stream across selection, presentation, connection editing and read-only inspection. |
| SPEC-1-06 | incorporated | US2 scenario 1 and SC-002 run a focused drag assertion in a translated viewport at twice the scale and state the expected graph-space displacement. |
| SPEC-1-07 | incorporated | US3 scenarios 1–2, FR-007 and SC-003 include named, separate taps for all three editing operations without dragging or sustained presses. |

The revised spec covers the approved consumer scope and the landed node contract, and keeps the strict-CSP rendering decision and within-phase trial criteria available for planning. No operator questions are open.
