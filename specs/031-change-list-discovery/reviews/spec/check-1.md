---
check: 1
verdict: issues
---

# Spec check 1

| ID | Severity | Where | Finding | Fix |
|---|---|---|---|---|
| SPEC-1-01 | blocking | `spec.md` lines 6–18 and 33–37 | All three journeys name a consumer and intent. They lack priorities, independent proof, and Given/When/Then acceptance scenarios. The collection-level success criteria leave the single-column and forced-colors branches without a named observation for each consumer. | Add a priority and an independent test for each story. Give both examples explicit acceptance scenarios at the specified narrow width, in a single column, and with forced colors. Assert the text and reading order that carry the distinction, as well as the existing no-page-overflow requirement. For the decision story, require a reviewable result after running both examples. |
| SPEC-1-02 | blocking | `spec.md` US1, FR-001 and success criteria | FR-001 asks for the unchanged field's label and the scenario calls it unchanged. The observable distinction is unspecified. A fixture that presents the field as a third unlabeled change or communicates its state through placement alone could pass the current acceptance. | Define how a reviewer identifies the unchanged field and its unchanged value independently of color and columns. Assert that state alongside the explicit previous and new retention values in reading order. |
| SPEC-1-03 | blocking | `spec.md` US2, FR-004 and success criteria | Exact copy request count and payload have a clear oracle. A host that receives the request without reporting a result could still pass those criteria. The copy field contract lets the host provide the result message, and copying is initiated for two distinct values on this page. | Specify the observable result of activating either named Copy control from the keyboard. Verify the exact digest and count as well as the host's accessible result for that activation, without requiring a real clipboard or a new copy-field API. |
| SPEC-1-04 | blocking | `spec.md` FR-005 and FR-006 | “Any materiality judgment” leaves materiality optional throughout the examples. The issue assigns both the diff and materiality to the host. A fixture that hard-codes a materiality judgment in the presentation or leaves it out entirely could still pass. | Name an observable case where the fixture supplies the materiality judgment and the example presents it as supplied. Keep the recommendation clear about who owns that judgment. |
| SPEC-1-05 | note | `spec.md` US3, FR-006 and success criteria | The specification asks for an evidence-based recommendation and gives both possible outcomes. Comparing inputs item by item would make an extraction recommendation easier to verify. | In the decision record, show how each proposed shared input works in both examples and which domain meanings stay with the host. Recommend extraction only where both runnable examples demonstrate the same contract. |

The fixtures, dependency reuse, and recommendation match #75's discovery scope. The spec keeps policy and services with the hosts, and its verification uses the repository's pinned Storybook, CSP, visual, and accessibility checks. No operator questions are open.
