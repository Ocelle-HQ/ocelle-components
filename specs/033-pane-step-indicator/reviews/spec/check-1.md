---
check: 1
verdict: issues
---

# Spec check 1

| ID | Severity | Where | Finding | Fix |
|---|---|---|---|---|
| SPEC-1-01 | blocking | US1 scenario 1, FR-003 | #87 asks for an ochre fill on the current marker. The spec permits any ochre treatment. An implementation that colours only the number or border would meet the current wording. | Specify the current marker's ochre fill in light and dark themes, with a non-colour distinction that remains visible in forced colours. Keep the programmatic current-step requirement. |
| SPEC-1-02 | blocking | US2 scenarios 1–4, FR-001, FR-005, SC-002 | The independent test calls for exercising actual buttons, but the scenarios verify layout and focus order only. A footer with inert actions or a fixed example state could satisfy those criteria even though it would fail to demonstrate the host's control of action labels, navigation and step state. | Add a scenario that supplies action labels from the host and activates a named primary through the keyboard. Observe the fictional host's navigation effect and the resulting host-supplied current or completed step state. Keep marker gestures non-interactive. |
| SPEC-1-03 | note | US2 scenarios 3–4, FR-006, SC-003 | FR-006 requires non-current labels to compact at 1200 px, while scenario 3 says they can compact. SC-003 also permits reading 320 px and 200% text as a single combined test. | Make successful compaction observable at 1200 px without shortening accessible names. Check 320 px normal-size text and 200% text separately to exercise both reasons the footer can grow. |
| SPEC-1-04 | note | Input, user stories and assumptions | The issue and dependency scope are clear. The spec does not name the consumer whose need drives the primitive and example, as the constitution's Principle VI requests. | Name the Ocelle console's Workflow Studio pane-footer need while retaining the shared indicator contract. |

Both user stories have independently observable progress and presentation outcomes. The spec covers ordered semantics, non-interactivity, adjacent alignment, three action combinations, forced colours, theme evidence, strict CSP and the public surface. No operator questions are open.
