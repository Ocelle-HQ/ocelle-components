---
analyzed_at: 2026-11-13T23:33:50Z
head: b38b8b009932c91f5efe9fca9f16cf1eff456dca
critical: 1
high: 1
medium: 7
low: 1
coverage: 98.6
---

## Specification Analysis Report

Feature `specs/014-selection-input`. Artifacts: `spec.md` (1024 lines), `plan.md`, `tasks.md` (73 tasks, T001 to T113), with `research.md`, `data-model.md`, `contracts/elements.md` and `quickstart.md` read where the plan or tasks point to them. Constitution 1.3.1. Context: #10 (Storybook workbench) merged on `origin/main` as `3828d2f`. The operator chose to recheck the plan against it as phase 1's first task (T001) and not now, so this report does not compare the plan with #10's design. It reports only what the branch as it stands makes infeasible or inconsistent (I1).

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| C1 | Constitution Alignment | CRITICAL | spec.md:925-932 (FR-050); research.md R-12; tasks.md T019, T045, T064, T079 | Constitution V says "Every element has a story per variant and per state". The spec and R-15 define a hover state with its own paint for options, tabs and segments: a `hover-bg` fill, and on a segment `accent-strong` boundary lines (spec Edge Cases "Hover", FR-029). No story covers that state, so the paint has no visual baseline. FR-050 declares a hover story for the link only. Two more states have no story: the copy field's focused Copy control (focus ring, US4-9), which FR-050 does not list although it lists "focused" for every other element, and a tab panel that is itself the tab stop (focus ring, US2-6, FR-023). | Add stories to FR-050 and to T019, T045, T064 and T079 (and to R-12): a hovered option, a hovered tab, a hovered segment in the default and joined variants (006 FR-031's pointer parameter, which R-12 already plans for the link), the focused Copy control, and a focused panel with no focusable content. The alternative is an exception in Complexity Tracking with the operator's approval. |
| I1 | Inconsistency | HIGH | plan.md:9-12; quickstart.md:3; tasks.md:7-10, T001, T019, T027, T028, T049, T068, T083, T099 | plan.md and quickstart.md require #10 to be merged into this branch before any phase is implemented. tasks.md says `main` is merged in only at landing (`/ocelle-land`), "not during the run". The branch does not contain `3828d2f`: it has no `storybook/a11y-exceptions.json`, no `storybook/baselines/`, no `storybook/visual/`, and no `gate:storybook-build`, `gate:visual` or `gate:axe` script. It also lacks `specs/006-storybook-workbench/`, which T001 reads. As written, phases 2 to 6 cannot produce baselines or run the axe gate (T027, T028 and their equivalents), so FR-053 and SC-007 ("no phase lands with baselines or axe pending") cannot be met during the run. | Choose one rule and write it the same way in plan.md, quickstart.md and tasks.md. For example, T001 (or a task right after it) merges `origin/main` into the branch before T010. Operator question Q1 below. |
| I2 | Inconsistency | MEDIUM | tasks.md:45 vs tasks.md:110, 126 | The stop-and-ask list names "T020 spike (phase 2)". Phase 2's spike is T010; T020 is `red.sh 2`. | Change the stop-and-ask entry to T010. |
| U1 | Underspecification | MEDIUM | plan.md:50 (Target Platform), 80-86 (decision 1); tasks.md:58-59, T064, T066, T067; spec.md FR-056 | Plan decision 1 (engine floor Chromium 125 / WebKit 17.4 for `:state()`) is still open: it waits on kitty-mission-ui's WebKitGTK and WKWebView minimums. Technical Context nevertheless states the raised floor as fact. The tasks stop at T064, which is inside phase 4's red commit, after the T060 measurement and the T061 scaffold. No task covers the alternative the plan names (row attributes `data-ocelle-row-*`, no floor raise), so a "no" from the operator would leave phase 4 without tasks. | Settle decision 1 before phase 4 starts (it could be asked at T001), or add the alternative's tasks behind the same stop. Mark the Target Platform line as conditional. Operator question Q2 below. |
| U2 | Underspecification | MEDIUM | tasks.md T002, T003, T006; `.specify/extensions/story/story-config.yml` (`test_pathspec` includes `**/test/**`) | Phase 1's driver commands and recorders (T006) live under `packages/elements/test/`, which counts as a test path. `tdd-check.sh` overlays the final test-path files onto the base, so T002 and T003, run "against the code from before the unit", run against the new driver too. Only `red.sh` shows that they can fail. The phase-level check fails at base only because T004 and T005 need the non-test `vitest.config.ts` changes. This is not counted as a constitution conflict, because the check as defined still fails at base, but per unit the non-vacuity proof of Principle VIII is weaker. | Have T006 or phase 1's review record this limitation, and name one plant per driver command and recorder (run in `reviews/phase-1/plants.md`). Alternatively, state in phase 1's review that `red.sh` is the proof for T002 and T003. |
| G1 | Coverage Gap | MEDIUM | spec.md:649-683 (Edge Cases); research.md R-14 (SPEC-1-15: "one scenario per parent at 320 px, phases 2 to 4"); tasks.md T014, T042, T062, T077, T093 | The scenario tasks list only "USn-1 to USn-k" plus contracts § Pairings. The Pairings table covers some edge cases (no mutation on a current-value set, motion, continuous resize, first-render `value` + `status`). Several edge cases have no task. These include long child labels wrapping at 320 px for each parent, which R-14 explicitly promises. The others: duplicate values (the first selected on a host set, the clicked one exposed on a user selection), a child outside its parent (no role, no tab stop), an empty listbox (named, no tab stop), host `hidden`, two copies of the package (the first definition wins) for the new elements, the accessible name following a text change, a `status` set without a request, and a `status` attribute that is not reflected after a clear. | Add the edge cases to the scenario tasks of phases 2 to 5 by name (or to contracts § Pairings where a "does not" outcome is involved). |
| G2 | Coverage Gap | MEDIUM | spec.md FR-049, FR-047 (README sentence), US5-9 (README sentence); tasks.md T095, T098 | T095's documentation test lists "the link, the `detail.href` warning and the label-in-name rule". It does not list three README statements the spec requires: that a modified activation keeps the browser's new tab or window, that a modified activation without `href` does nothing, and that a host that wants a new window handles the event (FR-049). It also omits that a host that navigates itself applies the same resolved-protocol check (FR-047), and that hosts needing other schemes handle the event (US5-9). | List these statements in T095 (and in T098's README section). |
| G3 | Coverage Gap | MEDIUM | spec.md SC-009; research.md R-14 ("the README has one example per listed use, checked by the documentation test"); tasks.md T026, T110, T111 | No task writes or tests the README examples for each consumer use: the Open project folder picker, tabbed screens, segmented choices, in-text links and copy fields. T110 checks only the overview's nine elements and the entry-point table. | Add the examples to T110 (red) and T111 (green), or to the per-element README tasks T019, T045, T064, T079 and T095 with their green counterparts. |
| G4 | Coverage Gap | MEDIUM | tasks.md T028 (and "the gates of T028" in T050, T069, T084, T100); quickstart.md steps 4-5; constitution "Development Workflow and Quality Gates" | The per-phase gate run and quickstart omit gates the constitution's merge list requires and the repository defines: `gate:typecheck`, `gate:lint`, `gate:test-lint`, `gate:brand-rules` (the checked brand rules of Principle II, which matter here because the copy field uses tabular figures, not monospace), `gate:unit-tests`, `gate:signoff` (DCO), `gate:pins` and `gate:config-copies`. CI runs them, but a phase could reach review with them failing. | Add them to T028's list and to quickstart step 5. |
| I3 | Inconsistency | LOW | spec.md FR-050 (`storybook/stories/<element>.stories.ts`); plan.md:162; tasks.md T019, T045, T064, T079, T095 | FR-050 says "every element has stories in `<element>.stories.ts`". The plan and tasks name five files without the `ocelle-` prefix (`listbox.stories.ts`, and so on), which matches the existing `icon.stories.ts`. The child elements (option, tab, tab panel, segment) get no file of their own; they are covered in their parents' files. | Reword FR-050 to "one stories file per control (`listbox`, `tabs`, `segmented-choice`, `copy-field`, `link`), covering its children". |

**Coverage Summary Table:**

| Requirement Key | Has Task? | Task IDs | Notes |
|-----------------|-----------|----------|-------|
| FR-001 nine-elements-conventions | Yes | T011, T017, T023, T041, T044, T047, T061, T063, T066, T076, T078, T081, T091, T094, T097 | entry tests per R-16 |
| FR-002 event-shape | Yes | T014, T042, T062, T077, T093 | |
| FR-003 no-io | Yes | T003, T015, T077, T081 | clipboard observer, allowed requests only |
| FR-004 same-scope-aria | Yes | T023, T043, T047 | SC-003 fixture |
| FR-005 shared-keyboard | Yes | T012, T021 | |
| FR-006 parent-naming | Yes | T014, T042, T047, T062 | |
| FR-007 focus-ring | Yes | T016, T042, T062, T077, T093 | |
| FR-008 selected-paint | Yes | T016, T042, T062 | |
| FR-009 child-value-default | Yes | T013, T014 | |
| FR-010 parent-value | Yes | T013, T014, T042, T062 | |
| FR-010a remembered-value | Yes | T013, T014, T042, T062 | |
| FR-011 child-list-changes | Yes | T010, T013, T014 | |
| FR-011a keep-one-selected | Yes | T013, T042, T062 | |
| FR-012 listbox-roles | Yes | T014, T023 | |
| FR-013 listbox-arrows | Yes | T012, T014 | |
| FR-014 listbox-select | Yes | T014, T023 | |
| FR-014a listbox-activate | Yes | T013, T014, T023 | |
| FR-015 listbox-keys | Yes | T012, T014 | |
| FR-016 listbox-tab-stop | Yes | T013, T014 | |
| FR-017 listbox-scroll | Yes | T014, T016, T023 | |
| FR-018 listbox-bar-edge | Yes | T016 | |
| FR-019 tablist-roles | Yes | T040, T042, T047 | |
| FR-020 tab-value-default | Yes | T042 | |
| FR-021 tabs-keys | Yes | T012, T042 | |
| FR-021a tabs-key-origin | Yes | T012, T042 | |
| FR-022 tab-row-wrap | Yes | T042, T047 | |
| FR-023 tab-to-panel-focus | Yes | T042, T047 | |
| FR-024 unselected-panels | Yes | T042 | |
| FR-025 tab-bar-edge | Yes | T042 | |
| FR-026 toolbar-roles | Yes | T062, T066 | |
| FR-027 one-pressed | Yes | T013, T062 | |
| FR-028 segment-keys | Yes | T012, T062 | |
| FR-029 joined-variant | Yes | T060, T062, T066 | engine floor open (U1) |
| FR-030 segment-target | Yes | T062, T066 | |
| FR-031 copy-value | Yes | T077, T081 | |
| FR-032 copy-wrap | Yes | T077 | |
| FR-033 copy-native-button | Yes | T077, T081 | |
| FR-034 copy-label-group | Yes | T077, T081 | |
| FR-035 copy-request-timing | Yes | T075, T077, T081 | |
| FR-036 copy-disabled | Yes | T077 | |
| FR-037 copy-flush | Yes | T077 | |
| FR-038 copy-parts | Yes | T079, T081, T082 | |
| FR-039 copy-forced-colours | Yes | T077 | |
| FR-040 copy-text-reading-order | Yes | T077 | |
| FR-041 copy-status-region | Yes | T077, T081 | |
| FR-042 copy-status-clear | Yes | T077 | |
| FR-043 copy-no-own-output | Yes | T077 | |
| FR-044 copy-swap-readme | Yes | T079, T082 | |
| FR-045 link-exposure-paint | Yes | T093, T097 | |
| FR-046 link-activation | Yes | T093, T097 | |
| FR-047 link-navigation-check | Yes | T092, T093, T097 | README sentence untested (G2) |
| FR-048 link-fragment-ring | Yes | T093 | |
| FR-049 link-no-target-readme | Partial | T098 | not in T095's documentation test (G2) |
| FR-050 stories | Yes | T019, T045, T064, T079, T095 | hover and two focus states missing (C1) |
| FR-051 axe | Yes | T019, T028, T045, T050, T095 | needs #10 on the branch (I1) |
| FR-052 stories-in-red | Yes | T019, T045, T064, T079, T095 | |
| FR-053 after-10 | Yes | T001 | merge rule conflicts (I1) |
| FR-054 composed-dialog-story | Yes | T112 | |
| FR-055 manifest | Yes | T025, T048, T067, T082, T098 | |
| FR-056 readme | Yes | T019, T026, T045, T048, T064, T067, T079, T082, T095, T098, T110, T111 | |
| FR-057 csp | Yes | T015, T028, T043, T063, T078, T094 | |
| FR-058 changelog-pairs | Yes | T018, T024, T026, T111 | |
| FR-059 keyboard-tests | Yes | T014, T042, T062, T077, T093 | |
| SC-001 every-key-tested | Yes | T014, T042, T062, T077, T093 | |
| SC-002 every-event-asserted | Yes | T014, T042, T062, T077, T093 | |
| SC-003 no-cross-root-id | Yes | T043 | |
| SC-004 copy-no-hscroll | Yes | T077 | |
| SC-005 joined-rounding | Yes | T060, T062 | |
| SC-006 no-clipboard-call | Yes | T003, T077 | |
| SC-007 baselines-axe | Yes | T027, T028, T049, T068, T083, T099 | needs #10 on the branch (I1) |
| SC-008 gates-mutation | Yes | T028, T050, T069, T084, T100, T113 | gate list incomplete (G4) |
| SC-009 readme-consumer-examples | No | none | G3 |

**Constitution Alignment Issues:**

- C1 (Principle V, "a story per variant and per state"): the hover states of options, tabs and segments, the focused Copy control, and a focused tab panel have no story and no baseline.
- No other conflict found. Complexity Tracking is empty and needs no entry under the current plan. That changes if the operator accepts C1 as an exception, or if I1 is settled by deferring baselines to landing.

**Unmapped Tasks:** none. T001 (recheck), the spikes (T010, T040, T060, T075, T090), `red.sh` runs and plant and gate runs serve FR-053 and constitution VIII, not a single requirement.

**Metrics:**

- Total Requirements: 72 (63 functional: FR-001 to FR-059 with FR-010a, FR-011a, FR-014a, FR-021a; 9 success criteria, SC-001 to SC-009)
- Total Tasks: 73
- Coverage %: 98.6 (71 of 72 with at least one task; FR-049 counted as covered, partially)
- Ambiguity Count: 0
- Duplication Count: 0
- Critical Issues Count: 1

### Next Actions

- One CRITICAL (C1) and one HIGH (I1) finding: resolve both before phase 1's T010 (the first implementation step after the T001 recheck), as amendments to `spec.md` FR-050, `research.md` R-12, `plan.md`, `quickstart.md` and `tasks.md`. Both can be done in T001's amendment step, which the operator has already scheduled as phase 1's first task, if the operator prefers that to a separate fix now.
- MEDIUM: fix I2 (rename the stop-and-ask entry), G1 to G4 (add the edge cases, README statements, consumer examples and missing gates to the named tasks), U1 (settle plan decision 1 before phase 4) and U2 (record the phase-1 proof limitation and plants).
- LOW: I3, a wording fix in FR-050.
- Suggested commands: edit `tasks.md` and `plan.md` by hand (or through T001's amendment) for I1, I2, U1, U2 and G1 to G4; edit FR-050 in `spec.md` with the operator's approval for C1 and I3 (the spec gate has passed, so a spec change goes to the operator).

### Questions for the operator

- **Q1 (I1): how does #10 reach this branch before phase 2?**
  (a) T001 merges `origin/main` (`3828d2f` or later) into `claude/014-selection-input` as a recorded merge commit, then rechecks. Plan, quickstart and tasks say so.
  (b) Merge `origin/main` now, as a separate step before T001.
  (c) Keep the merge at landing, and defer baselines and axe for phases 2 to 6 to landing. This needs a Complexity Tracking exception to Principle V and FR-053.
- **Q2 (U1): engine floor for the joined segmented choice.**
  (a) Confirm Chromium 125 / WebKit 17.4 (`:state()`) now; T064 proceeds without a stop.
  (b) Use the alternative, row attributes `data-ocelle-row-*` with no floor raise; tasks T064, T066 and T067 are rewritten for it.
  (c) Keep the stop at T064 and ask kitty-mission-ui for its WebKitGTK and WKWebView minimums first.
- **Q3 (C1): missing state stories.**
  (a) Add the hover stories (option, tab, segment default and joined), the focused Copy control and the focused panel to FR-050 and the story tasks.
  (b) Add only the hover stories, and record the two focus states as covered by computed-style reads, with a Complexity Tracking entry.
  (c) Record all of them as an exception in Complexity Tracking, with a reason and a sunset.
