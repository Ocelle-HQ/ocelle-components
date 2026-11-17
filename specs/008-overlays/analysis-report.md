---
analyzed_at: 2026-11-13T16:22:42Z
head: 1f8db655697874046f5ea0115cd74a5753ea23f7
critical: 0
high: 0
medium: 10
low: 7
coverage: 100
---

## Specification Analysis Report

Feature `specs/008-overlays`. This is a re-run after analysis fixes 1 (`reviews/analysis/fixes-1.md`, commit 1f8db65). Read: spec.md, plan.md, tasks.md, data-model.md, contracts/elements-overlays.md, contracts/checks.md (the test matrix), research.md R-09 to R-18, the constitution and the story extension's `red.sh` and `tdd-check.sh`.

**What changed since the previous report (head a8aba4d):**
- **I1 is resolved.** The drawer now has its own Long body, Styles and Size rows (checks.md L190-202, L216-218, and T030). They match FR-003, FR-025 and FR-026, and the inherited list no longer includes the dialog's geometry rows.
- **C1 is resolved.** A Persistence row (checks.md L232-236, T041, R-15) holds the bubble `:popover-open` for 900 ms, sampled every frame. It covers the pointer on the trigger, the pointer on the bubble and keyboard focus. The 900 ms wait stays within the 1 000 ms bound.
- **I3 is resolved.** T027, T038 and T050 are now part of the phase red commits (T020, T034 and T046). Each is recorded once with `red.sh <N> phase`, which is a label `red.sh` accepts. T026 runs before any story test is written. `pnpm test` includes the `storybook-integration` Vitest project, so `red.sh` and `tdd-check.sh` do run the story tests. The plan's Constitution Check VIII, the phase flow, the Hold, the Dependencies and the Parallel sections agree with this.
- **The other findings carry over unchanged.** Their artifacts were not edited.
- **Two new findings** (U4 MEDIUM, I7 LOW) come from the new drawer rows.

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| C2 | Coverage | MEDIUM | US3-8 (spec L224-226); checks.md § Tooltip L226-274 | No row asserts that the bubble never animates. | Assert that `animations()` on the bubble is empty. |
| C3 | Coverage | MEDIUM | US3-12 (spec L238-241); checks.md L231 | No explicit row covers this sequence: the user clicks to focus, hovering then shows the bubble, and the pointer leaves. The bubble should then hide although focus stays, and not show again. | Add this row to the matrix and to T041. |
| C4 | Coverage | MEDIUM | FR-023 (spec L420-421); checks.md nested row L150-152 | The nested row asserts Escape only. A click on the backdrop of a dialog stacked over an open drawer passes through the drawer's slot and inner `<dialog>`, so the drawer's backdrop handler runs, but nothing asserts on it. | In T031, assert that this click gives no `ocelle-drawer-close-request` and that both overlays stay open. |
| C5 | Coverage | MEDIUM | Edge Cases (spec L264-265) | No row covers `open` set in the parsed markup or before upgrade. Expected: the overlay is shown modally, initial focus follows FR-007, and focus returns to what had it. | Add a matrix row and a fixture case. |
| U1 | Underspecification | MEDIUM | FR-039, FR-037, the last sentence of FR-036, Edge "opener gone"; data-model § `ocelle-tooltip`; T019, T032, T044 | Some README duties have no expected list or no task: (a) data-model has no "Tokens read" list for the tooltip; (b) T032 does not name the drawer's tokens read; (c) T044 omits the FR-037 statement and FR-036's "set `describes` when the text adds to the name"; (d) T019 omits "documents where focus lands" when the opener is gone. | Add the tooltip token list to data-model. Name (b) to (d) as fragments in `readme.test.ts`. |
| U2 | Underspecification | MEDIUM | US3-8, FR-034/035; R-09, R-11; T048; constitution II | The bubble's radius and padding tokens are never specified. A pill radius would pass every gate, although constitution II reserves pills for state pills. | State `radius-2` (or the chosen token) and the padding tokens, and assert them in a row. |
| U3 | Underspecification | MEDIUM | T015 nested row (tasks.md L156), T031 | Phase 2's "stand-in `ocelle-drawer`-like host" cannot join the internal overlay stack on the strict-CSP fixture, because the base class is not exported from the browser build. The row then cannot test "only the topmost acts" in both harnesses. | Use a second `ocelle-dialog` as the outer overlay, or run this row in process only until T031. |
| U4 | Underspecification | MEDIUM | FR-003 (spec L337-339); checks.md drawer Styles L196-202; T036 (tasks.md L287); data-model § `ocelle-drawer` | New (from the I1 fix). FR-003 says only that the drawer is "square on its viewport edge". The two inner-edge corners have no stated value, and the Styles row says outright that it does not assert them. So `radius-2`, 0 or any other token passes every functional test, and only the visual baseline captures whichever value is chosen. | State the inner-edge radius in FR-003 or R-09 (for example `radius-2`, or 0 so the panel is square everywhere), name it in T036, and assert it in the drawer Styles row for each `side` × `dir`. |
| I2 | Inconsistency | MEDIUM | tasks.md L5 and L308; spec US3 L203-250 | The tasks say "US3 scenarios 1 to 14", but the spec has 15. Matrix rows cover scenario 15 (Following the trigger), but the Phase 4 goal and review scope state the wrong range. | Change both places to "1 to 15". |
| A1 | Ambiguity | MEDIUM | SC-001 (spec L539-541) | "each with and without a cancelling host" also covers reason `host`, which has no request to cancel, so the number of paths is ambiguous. | Reword: each user-initiated reason with and without a veto, plus `host`. |
| C6 | Coverage | LOW | Edge "theme change while open" (spec L323) | No row checks the repaint after a theme change. | Add a computed-style check, or state that it holds by construction. |
| C7 | Coverage | LOW | checks.md L134-135 vs drawer inherited list L183-189 | The drawer's inherited rows still leave out "Synthetic `cancel`". The I1 fix rewrote this list without adding it. | Add it, or state why it is dialog-only. |
| A2 | Ambiguity | LOW | US3-6, SC-006 (spec L556); R-11 | The spec does not say what happens when neither side fits. R-11 keeps the placement side, which can conflict with SC-006's "100% on screen". | State this case in FR-035, and limit SC-006 to viewports where one side fits. |
| I4 | Inconsistency | LOW | T011 `test/fixtures/tooltip-delay.css`, T027 `storybook/test/integration/elements-stories.test.ts`; plan Project Structure | The tasks name files that the plan's structure does not list. | Add them to the plan. |
| I5 | Inconsistency | LOW | FR-040 "other consumers MUST follow"; R-10 | No task checks again, at implementation time, for new `engines`, `browserslist` or `build.target` entries. A parallel mission could add one. | Add a check line to T049 or T056. |
| I6 | Inconsistency | LOW | data-model § `ocelle-dialog` "Tokens read" (L98-100); FR-030 (spec L457) vs data-model § tooltip and T043 | (a) A drawer-only token (`size-visually-hidden`) appears in the dialog's token list. (b) FR-030 states reflection only for `describes`, while data-model and T043 also reflect `placement` and `disabled`. | Align them. |
| I7 | Inconsistency | LOW | FR-026 (spec L438-439) "capped at `--ocelle-dialog-max-inline`"; checks.md drawer Size L216-218 and dialog Styles L170-172; T030 (tasks.md L265) | The capped cases assert only `width ≤ dialog-max-inline` and name no viewport width. A panel collapsed far below the cap passes, so the `min()` cap itself is never shown to apply. The drawer row was reworded in the I1 fix; the dialog row has the same gap. | Name the capped viewport (for example 320 × 800), and assert that the inline size equals the computed `dialog-max-inline` there, for both elements. |

**Coverage summary:** all 48 FRs and 8 SCs have at least one task. Four are only partly covered:

| Requirement | Partial because of |
|---|---|
| FR-003 | U4 |
| FR-023 | C4, U3 |
| FR-032 | C3; persistence is now covered |
| FR-039 | U1 |

Main mappings:

| Area | Tasks |
|---|---|
| Dialog | T013 to T025 |
| Drawer | T030 to T037 |
| Tooltip | T041 to T049 |
| Stories | T026 to T029, T038 to T040, T050 to T052 (story red now inside T020, T034 and T046) |
| FR-041 | T053 |
| Harness for FR-043 and FR-047 | T001 to T012 |

**Constitution alignment:**
- No conflict with a MUST. Complexity Tracking is empty, which is consistent.
- Principle II: the plan's Constitution Check now says "dialog `radius-2`, drawer square on its viewport edge", which agrees with FR-003.
- Principle III (WCAG 1.4.13): persistence is now tested.
- Principle VIII: each phase has one recorded red commit, and its story tests are in it.
- C2 touches III and V as a missing test, not a plan conflict. U2 and U4 are risks to II that no gate catches.

**Unmapped tasks:** none.

**Metrics:**
- Requirements: 56 (48 FR, 8 SC)
- Tasks: 56
- Coverage: 100%
- Ambiguities: 2 (A1, A2)
- Duplications: 0
- Critical: 0
- High: 0

## Next Actions
- There is no CRITICAL or HIGH finding. Implementation may proceed once the #10 hold lifts.
- Fix the MEDIUM findings before the phase each one affects:
  - Phase 2: U3 (T015's nested row), U1(d) and C5 (checks.md and T015/T019).
  - Phase 3: U4 (state the drawer's inner-edge radius in FR-003 or R-09, then in T036 and the drawer Styles row), C4 (T031) and U1(b).
  - Phase 4: C2, C3, U1(a, c) and U2 (R-09, data-model and T041/T048). Also fix I2 in tasks.md L5 and L308.
  - A1: refine SC-001 with `/speckit-specify`, or edit it directly.
- The LOW findings (C6, C7, A2, I4 to I7) can be handled during implementation or review. I7 is a one-line strengthening of two Size assertions, and is cheapest to fold in with T015 and T030.
