# Squad round 3 fixes 1

| ID | Resolution | Where |
| --- | --- | --- |
| PLAN-FRESH-3-001 | fixed | [Rendering and input](../../../plan.md#rendering-and-input-boundaries) observes idle containment transitions for available and inert nodes, recomputes the actual eligibility and captures affected focus before demotion. It verifies live bounds at native focus entry, handoff and activation before a selection request can be dispatched. [Eligibility state](../../../data-model.md#local-interaction-state) and [consumer behavior](../../../contracts/workflow-canvas.md#keyboard-touch-and-host-inspector) document unchanged input and same-action restoration. [Verification](../../../quickstart.md#exercise-a-controlled-host) covers a host-only move out and back, Tab and accessibility-tree exclusion, observer timing, zero unsolicited requests and one restored activation. |
