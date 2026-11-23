---
check: 1
verdict: issues
---

# Spec check 1

| ID | Severity | Where | Finding | Fix |
|---|---|---|---|---|
| SPEC-1-01 | blocking | `spec.md` US2 scenario 3, FR-003, FR-008 | The host can reach the same action, but the spec leaves sequential focus ownership open. A node that always stays in the tab order could pass the stated check while the canvas also manages focus, leaving duplicate stops in #73. | Require a single sequential selection stop in standalone use. In host-managed navigation, require the host to control whether that same action participates in sequential focus while retaining the ability to focus and activate it. Add an acceptance scenario that checks tab order, explicit focus, and one selection request. |
| SPEC-1-02 | blocking | `spec.md` US2 scenarios 1–2, FR-005, SC-003 | The acceptance checks require visible text for selection, waiting and invalidity. They check the accessibility tree only for the long labels. A node could pass both while hiding its state cues from assistive technology. | Make supplied selection, run and validation states available to assistive technology. Extend the combined-state scenario to check that the focused action and its associated information expose all three states. Leave the exact naming and state mechanism to planning. |
| SPEC-1-03 | note | `spec.md` FR-008 and SC-003, `triage/027-workflow-node.md` Scope | Triage and the constitution require visual evidence in both themes. The visual example requirement identifies the cases and the forced-colors check, while the two-theme verification is implicit. | Carry the light and dark checks and committed baselines into the plan and tasks for the required examples. |

The scenarios cover the Security review and planning examples, pointer and keyboard parity, stable identity after renaming, host ownership, intact outcome data and activation during read-only inspection. The scope leaves graph layout and wiring to #73 and allows readable host-supplied status while #7 progresses. No operator questions are open.
