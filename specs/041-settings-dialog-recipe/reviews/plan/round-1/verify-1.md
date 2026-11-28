# Squad round 1: verify 1

| ID | Status | Reason |
|----|--------|--------|
| PLAN-A11Y-SECURITY-1-001 | resolved | FR-005 and the interaction contract require visible and accessible category and section context outside the collapsible navigation. The contract retains current-link semantics on the actual link, and quickstart covers both collapse and entry while collapsed. |
| PLAN-A11Y-SECURITY-1-002 | resolved | The design puts the meaningfully named inline scroller after the first detail action. Quickstart exercises its accessible name and arrow-key scrolling under actual overflow, alongside the next-Tab check after navigation. |
| PLAN-A11Y-SECURITY-1-003 | resolved | The design puts a named, conditionally focusable vertical scroll region after the first action. Quickstart checks the Tab route and Page Down to the last detail while Close stays available. |
| PLAN-CORRECTNESS-1-002 | resolved | The design bounds both grid columns in the dialog body and assigns wide-layout overflow to the two columns. SC-001 and quickstart check the last navigation destination, independent offsets and stationary header at a wide, shallow viewport. |
| PLAN-CORRECTNESS-1-003 | resolved | FR-007 and the interaction contract require the choices to wrap into reach. SC-004 and quickstart require every individual choice to be reachable without sideways scrolling within the recipe at 320 CSS px and 200% text. |
| PLAN-TESTABILITY-1-001 | resolved | The plan routes tests that import the recipe to the retained `storybook-browser` mutation project. Quickstart specifies the host preflight and scoped mutation command, plus candidate SHA, selected lines, mutant results and verdict as evidence. |
| PLAN-TESTABILITY-1-002 | resolved | The plan identifies open landing and long-detail examples with expanded navigation, plus a separate opener-driven example. Quickstart requires the two open dialogs to settle before capture in both themes, checks the built index and counts all six axe runs. |
| PLAN-TESTABILITY-1-003 | resolved | The design records a neutral source-only scaffold before red, with a named dialog and stable queries in a mounted fixture. Quickstart requires both the initial and replayed red logs to show the intended failed assertion after successful mount. |
