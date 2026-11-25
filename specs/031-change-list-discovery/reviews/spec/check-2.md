---
check: 2
verdict: clean
---

# Spec check 2

| ID | Severity | Where | Finding | Fix |
|---|---|---|---|---|

## Check 1 follow-up

| ID | Result | Evidence |
|---|---|---|
| SPEC-1-01 | resolved | US1–US3 have priorities, independent tests and Given/When/Then observations. US1 and US2 cover one-column reading order, text and reachability at 320 CSS pixels in forced colors, with no horizontal scrolling. US3 checks a reviewable recommendation against both examples. |
| SPEC-1-02 | resolved | US1 and FR-001 require the field name, value and visible unchanged state alongside the separately labeled retention values in reading order. |
| SPEC-1-03 | resolved | US2, FR-004 and the success criteria cover both distinguishable keyboard Copy controls, one exact digest request per activation, and an accessible result from the fixture host. |
| SPEC-1-04 | resolved | US1 and FR-005 require the supplied materiality judgment to appear with the retention diff. The acceptance scenario changes that judgment for the same diff and expects the visible result to change. |
| SPEC-1-05 | incorporated | US3 and FR-006 require the decision to map each shared input to both examples and identify the host responsibilities. An extraction recommendation must cite the common contract demonstrated by both examples. |

The revised scenarios cover the comparison, keyboard copy, narrow width, long identifiers, forced colors, and decision required by #75. Verification retains pinned visual baselines, strict CSP, browser assertions, and exact hosted evidence. No operator questions are open.
