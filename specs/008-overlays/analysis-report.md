---
analyzed_at: 2026-11-13T10:10:22Z
head: a8aba4d3fda623906e9bb6e3504a923d6589c551
critical: 0
high: 2
medium: 10
low: 6
coverage: 100
---

## Specification Analysis Report

Feature `specs/008-overlays`. Read: spec.md, plan.md, tasks.md, data-model.md, contracts/elements-overlays.md, contracts/checks.md (the test matrix), research.md R-09 to R-13, the constitution (1.3.1) and the story extension's `red.sh`.

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| I1 | Inconsistency | HIGH | checks.md:L80-83, L169-173, L183-187; tasks.md:L252 (T030); spec.md FR-003 (L337-339), FR-025 (L436-437), FR-026 | The drawer inherits the dialog's "long body" and "styles" matrix rows, and T030 reuses T015's test bodies. Those rows contradict the drawer's own requirements: (a) panel height ≤ `dialog-max-block` (= `100dvh - 2*gutter`), but FR-025 makes the drawer full viewport height; (b) `radius-2`, but FR-003 makes the drawer square on its viewport edge; (c) inline size = `--ocelle-dialog-inline-size`, which the drawer does not have; (d) centred. A correct drawer cannot pass them. | Give the drawer its own expected values for these assertions in checks.md § Drawer and in T030. |
| C1 | Coverage | HIGH | spec US3-3 (L209-210), FR-032 "no timeout" (L465-467); checks.md:L211-221; T041 | Nothing tests that the bubble persists (WCAG 1.4.13, constitution III). The hover row only asserts "shown by 450 ms", so a bubble that hides on a timeout passes every planned test. | Add a row: the bubble is still `:popover-open` after a bounded wait well past the delay (for example 900 ms), for hover and for keyboard focus. |
| C2 | Coverage | MEDIUM | US3-8 (L224-226) | No row asserts that the bubble never animates. | Assert that `animations()` on the bubble is empty. |
| C3 | Coverage | MEDIUM | US3-12 (L238-241) | No explicit row for: click focus, then hover shows the bubble, then the pointer leaves, so it hides although focus stays, and it does not show again. | Add this row to the matrix and to T041. |
| C4 | Coverage | MEDIUM | FR-023 (L420-421); checks.md nested row L150-152 | The nested row asserts Escape only. A click on the backdrop of a dialog stacked over an open drawer passes through the drawer's slot and inner `<dialog>`, so the drawer's backdrop handler runs but is never asserted. | In T031: that click gives no `ocelle-drawer-close-request`, and both overlays stay open. |
| C5 | Coverage | MEDIUM | Edge Cases L264-265 | No row covers `open` in the parsed markup or set before upgrade: shown modally, initial focus per FR-007, focus returned to what had it. | Add a matrix row and a fixture case. |
| U1 | Underspecification | MEDIUM | FR-039, FR-037, the last sentence of FR-036, Edge "opener gone"; data-model § tooltip; T019, T032, T044 | Some README duties have no expected list or no task: (a) data-model has no "Tokens read" list for the tooltip; (b) T032 does not name the drawer's tokens read; (c) T044 omits the FR-037 statement and FR-036's "set `describes` when the text adds to the name"; (d) T019 omits "documents where focus lands" when the opener is gone. | Add the tooltip token list to data-model, and name (b) to (d) as fragments in `readme.test.ts`. |
| U2 | Underspecification | MEDIUM | US3-8, FR-034/035; R-09, R-11; T048; constitution II | The bubble's radius and padding tokens are never specified. A pill radius would pass every gate, though constitution II reserves it for state pills. | State `radius-2` and the padding tokens, and assert them in a row. |
| U3 | Underspecification | MEDIUM | T015 nested row (L142), T031 | Phase 2's "stand-in drawer-like host" cannot join the internal overlay stack on the strict-CSP fixture, because the base class is not exported from the browser build. The row then cannot test "only the topmost acts" in both harnesses. | Use a second `ocelle-dialog` as the outer overlay, or run this row in process only until T031. |
| I2 | Inconsistency | MEDIUM | tasks.md L5 and L301 | The tasks say "US3 scenarios 1 to 14"; the spec has 15. Scenario 15 is covered by rows, but the Phase 4 review scope is mis-stated. | Change both places to 1 to 15. |
| I3 | Inconsistency | MEDIUM | tasks.md L16-22, T027/T038/T050; `.specify/extensions/story/scripts/red.sh` | Each story red step is a second red commit after green, but the phase flow allows one. `red.sh` accepts only the labels `phase` or `fix-N`, and rerunning `phase` deletes the earlier record, so the story red evidence is lost or overwrites the phase's red record. | Fold the story tests into the phase's red commit, or define how the story red step is recorded. |
| A1 | Ambiguity | MEDIUM | SC-001 (L539-541) | "each with and without a cancelling host" also covers reason `host`, which has no request to cancel, so the path count is ambiguous. | Reword: each user-initiated reason with and without a veto, plus `host`. |
| C6 | Coverage | LOW | Edge "theme change while open" (L323) | No row checks the repaint after a theme change. | Add a computed-style check, or state that it holds by construction. |
| C7 | Coverage | LOW | checks.md L134-135 vs L183-187 | The drawer's inherited rows leave out "Synthetic `cancel`". | Add it, or state why it is dialog-only. |
| A2 | Ambiguity | LOW | US3-6, SC-006; R-11 | The spec does not say what happens when neither side fits. R-11 keeps the placement side, which can clash with SC-006's "100% on screen". | State this case in FR-035 and scope SC-006 to viewports where one side fits. |
| I4 | Inconsistency | LOW | T011 `test/fixtures/tooltip-delay.css`, T027 `storybook/test/integration/elements-stories.test.ts`; plan Project Structure | Tasks name files that the plan's structure does not list. | Add them to the plan. |
| I5 | Inconsistency | LOW | FR-040 "other consumers MUST follow"; R-10 | No task re-checks for new `engines`, `browserslist` or `build.target` entries at implementation time; parallel missions could add one. | Add a check line to T049 or T056. |
| I6 | Inconsistency | LOW | data-model dialog "Tokens read"; FR-030 vs data-model/T043 | (a) A drawer-only token (`size-visually-hidden`) appears in the dialog's token list. (b) FR-030 states reflection only for `describes`, while data-model and T043 also reflect `placement` and `disabled`. | Align them. |

**Coverage summary:** all 48 FRs and 8 SCs have at least one task. Three are only partly covered: FR-023 (C4, U3), FR-032 (C1, C3) and FR-039 (U1). Main mappings:
- dialog: T013 to T025;
- drawer: T030 to T037;
- tooltip: T041 to T049;
- stories: T026 to T029, T038 to T040, T050 to T052;
- FR-041: T053;
- harness for FR-043 and FR-047: T001 to T012.

**Constitution alignment:** no conflict with a MUST, and Complexity Tracking is empty, which is consistent. C1 and C2 touch III and V as missing tests, not as plan conflicts. U2 is a risk to II that no gate catches.

**Unmapped tasks:** none.

**Metrics:**
- Requirements: 56
- Tasks: 56
- Coverage: 100%
- Ambiguities: 2
- Duplications: 0
- Critical: 0

## Next Actions
- There is no CRITICAL finding, so implementation may proceed once the #10 hold lifts.
- Fix I1 and C1 first, because they decide what Phase 3 and Phase 4 test. Both are edits to checks.md, T030 and T041.
- Fix the MEDIUM findings before the phase each one affects:
  - edit tasks.md and checks.md for C2 to C5, U1, U3, I2 and I3;
  - edit R-09 and data-model for U2;
  - fix A1 with `/speckit-specify` refinement or an edit to SC-001.
- The LOW findings can be handled during implementation or review.
