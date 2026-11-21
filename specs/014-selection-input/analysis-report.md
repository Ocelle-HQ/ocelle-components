---
analyzed_at: 2026-11-13T23:46:01Z
head: dd9b39b3100c564fa21206ec8eed94e0b676e801
critical: 0
high: 1
medium: 4
low: 1
coverage: 100
---

## Specification Analysis Report

Feature `specs/014-selection-input`, second analysis after tasks. Artifacts: `spec.md` (1028 lines), `plan.md`, `tasks.md` (79 tasks, T001 to T113, with T005a, T008a, T062a, T064a, T066a and T067a), and `research.md`, `data-model.md`, `contracts/elements.md` and `quickstart.md` where the plan or tasks point to them. Constitution 1.3.1. This run reads the artifacts as fixed by `reviews/analysis/fixes-1.md` with `reviews/analysis/operator-decisions.md` (Q1 (a), Q2 (c), Q3 (a)). It also reads the workflow files that T001's merge depends on: `.claude/skills/speckit-story-implement/SKILL.md`, `.specify/extensions/story/scripts/base.sh`, `tooling/speckit/bin/fold-history.sh`, `.claude/skills/ocelle-run/SKILL.md` and `.claude/skills/ocelle-land/SKILL.md`. Context: #10 merged on `origin/main` as `3828d2f`. T001 merges `origin/main` into the branch (operator decision Q1 (a)). As before, the comparison with #10's design is left to T001's recheck. The one exception: this run read 006 FR-031 at `3828d2f` to confirm that a pointer state can target one child element, which the new hover stories need. It can.

The findings of the previous report are resolved: C1 (FR-050, R-12, T019, T045, T064, T079), I1 (T001, plan, quickstart), I2, U1 (T062a, T064a, T066a, T067a; conditional Target Platform), U2 (T005a, T008a), G1 (T014, T042, T062, T077, T093 and § Pairings), G2 (T095, T098), G3 (T110, T111), G4 (T028, quickstart step 5) and I3 (FR-050 wording). The findings below are new or follow from those fixes.

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| I1 | Inconsistency | HIGH | tasks.md:11-12, T001, phase 1 checkpoint (l.106); plan.md:20-31, phase 1 (l.211-212); `.claude/skills/speckit-story-implement/SKILL.md` step 2; `.specify/extensions/story/scripts/base.sh`; `tooling/speckit/bin/fold-history.sh`:31 | T001 says the merge of `origin/main` comes *before* `base.sh 1`, so that phase 1's `base.sha` is the merge commit. But `implementer-ivan` runs phase 1 under `/speckit-story-implement`, whose step 2 runs `base.sh <N>` "once, before any change" and before it reads the phase's tasks. `base.sh` writes `base.sha` only if it is absent. An implementer following its procedure therefore records the pre-merge HEAD, and the merge lands inside phase 1's range. Three consequences follow. Phase 1's fold fails, because `fold-history.sh $FB` with FB = phase 1's `base.sha` refuses a range with a merge ("history has merge commits"). Phase 1's review diff and `gate:mutation -- --base <phase base>` would also cover all of #10's changes. Nothing in tasks, plan or the delegation says who performs the merge or how the procedure's order is overridden. | Take the merge out of the implementer's phase: the orchestrator (or the operator) makes the recorded merge commit before delegating "implement phase 1", and T001 keeps only the check that the merge is present plus the recheck. The alternative is to state in T001 and in the phase 1 delegation that the implementer does T001 (1) before the procedure's step 2. Operator question Q1. |
| I2 | Inconsistency | MEDIUM | plan.md:20-31 ("Step 4.3.1's 'no merge commits on the branch' is read for this feature as 'none in the fold range'"); `.claude/skills/ocelle-run/SKILL.md` step 3.1 ("never merge `main` during a run"); `.claude/skills/ocelle-land/SKILL.md` step 8.1 ("no merge commits since the PR base") | The plan rereads one workflow rule for this feature. The text the orchestrator follows is unchanged in two places. `/ocelle-run` step 3.1 checks "no merge commits on the branch" before every fold and says never to merge `main` during a run. `/ocelle-land` step 8.1 checks "no merge commits since the PR base", and that range still holds the T001 merge commit, which is not an ancestor of `origin/main`. Taken literally, the orchestrator stops at each fold and at landing. The scripts themselves are fine: `fold-history.sh` checks only `FB..HEAD`. | Record the range reading where the orchestrator reads it: in `operator-decisions.md` as an explicit decision covering both `/ocelle-run` 3.1 and `/ocelle-land` 8.1, or in the delegation notes for this run. Cite it from plan.md. |
| U1 | Underspecification | MEDIUM | tasks.md:64-68, T061, T062a, T064, T064a, T065, Dependencies (l.325-326); plan.md decision 1 | The stop for plan decision 1 is placed at T064. T062a, which comes before T064 in the same red commit, is "only if the operator does not confirm plan decision 1 (stop at T064)", so the implementer reaches a conditional task before the condition can be known. Phase 4 has one red commit (T062 to T064a, proven by `red.sh 4` at T065), so in practice the decision blocks the whole red commit, not just T064. T064 is also marked [P], although it is a blocking stop. | Move the stop to the start of phase 4's red commit (after T060 and T061, before T062), or to before phase 4 starts. Drop the [P] marker from the stop, and word T062a, T064a, T066a and T067a as "if decision 1 was answered no at the stop". |
| U2 | Underspecification | MEDIUM | contracts/elements.md § `ocelle-segmented-choice` (l.101-105); research.md R-06 Status; tasks.md T064a, T067a; constitution I ("the custom-elements manifest declares every public property, attribute ..."), VII (public surface includes "the documented base-style hooks") | Under the row-attribute alternative, the README documents `data-ocelle-row-start`, `data-ocelle-row-end`, `data-ocelle-first-row` and `data-ocelle-last-row` on segment hosts as element-owned, and the contract says they are not manifest attributes. They are documented and selectable by host CSS, though, so nothing says whether hosts may style on them or whether renaming them is a MAJOR change. R-01's `aria-*` state attributes are a precedent, but those are ARIA states with platform meaning. These are new names the library invents. This is not counted as a constitution conflict, because the contract declares them non-public, but the semver status is open. | State in contracts and in T064a's README assertion that the row attributes are internal, not a styling hook, and may change in a PATCH. Alternatively, declare them in the manifest as read-only attributes. |
| G1 | Coverage Gap | MEDIUM | spec.md:666-669 (Edge Cases "Hover": "Disabled children show no hover paint"); research.md R-15 table ("disabled child: none, as rest"); tasks.md T016, T042, T062; contracts/elements.md § Pairings | No task, scenario or pairing tests that a disabled option, tab or segment under the pointer shows no `hover-bg` fill (and, for a segment, no `accent-strong` lines). It is a "does not" outcome, so under the guard rules it needs a paired positive (an enabled child's hover fill), a plant (hover paint not gated on `aria-disabled`), and a setup that can fail. | Add it to T014, T042 and T062 by name and add a § Pairings row: "a disabled child shows no hover paint", paired with an enabled sibling's `hover-bg` under the pointer; plant: a `:host(:hover)` rule with no disabled exclusion. |
| I3 | Inconsistency | LOW | plan.md Constitution Check VII (l.97: "the engine-floor raise is documented in the README and the changelog"); plan.md Source Code (l.168: `internals.ts # ... and the row-state method (R-01, R-06)`); plan.md phase 4 (l.248-249: "custom states (R-06), the engine-floor raise in the README") | After the Q2 (c) fix, the Summary, Technical Context and Constitution Check IV are conditional on decision 1. Three places still state the custom-state design as decided: the floor raise in Principle VII's row, the row-state method in `internals.ts`, and phase 4's first clause. T061 now scaffolds no row mechanism. | Make the three places conditional ("if decision 1 is confirmed"), as Constitution Check IV is. |

**Coverage Summary Table:**

| Requirement Key | Has Task? | Task IDs | Notes |
|-----------------|-----------|----------|-------|
| FR-001 nine-elements-conventions | Yes | T011, T014, T017, T023, T041, T042, T044, T047, T061, T062, T063, T066, T076, T077, T078, T081, T091, T093, T094, T097 | edge cases hidden and second definition now named |
| FR-002 event-shape | Yes | T014, T042, T062, T077, T093 | |
| FR-003 no-io | Yes | T003, T008a, T015, T077, T081 | clipboard observer plants in T008a |
| FR-004 same-scope-aria | Yes | T023, T043, T047 | SC-003 fixture |
| FR-005 shared-keyboard | Yes | T012, T021 | |
| FR-006 parent-naming | Yes | T014, T042, T047, T062 | |
| FR-007 focus-ring | Yes | T016, T019, T042, T045, T062, T064, T077, T079, T093 | focus stories added |
| FR-008 selected-paint | Yes | T016, T042, T062 | |
| FR-009 child-value-default | Yes | T013, T014 | |
| FR-010 parent-value | Yes | T013, T014, T042, T062 | duplicate values named |
| FR-010a remembered-value | Yes | T013, T014, T042, T062 | |
| FR-011 child-list-changes | Yes | T010, T013, T014 | |
| FR-011a keep-one-selected | Yes | T013, T042, T062 | |
| FR-012 listbox-roles | Yes | T014, T023 | empty listbox named |
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
| FR-023 tab-to-panel-focus | Yes | T042, T045, T047 | focused panel story |
| FR-024 unselected-panels | Yes | T042 | |
| FR-025 tab-bar-edge | Yes | T042 | |
| FR-026 toolbar-roles | Yes | T062, T066 | |
| FR-027 one-pressed | Yes | T013, T062 | |
| FR-028 segment-keys | Yes | T012, T062 | |
| FR-029 joined-variant | Yes | T060, T062, T062a, T066, T066a | decision 1 open; stop placement (U1) |
| FR-030 segment-target | Yes | T062, T066 | |
| FR-031 copy-value | Yes | T077, T081 | |
| FR-032 copy-wrap | Yes | T077 | |
| FR-033 copy-native-button | Yes | T077, T081 | |
| FR-034 copy-label-group | Yes | T077, T081 | |
| FR-035 copy-request-timing | Yes | T075, T077, T079, T081 | |
| FR-036 copy-disabled | Yes | T077, T079 | |
| FR-037 copy-flush | Yes | T077 | |
| FR-038 copy-parts | Yes | T079, T081, T082 | |
| FR-039 copy-forced-colours | Yes | T077 | |
| FR-040 copy-text-reading-order | Yes | T077 | |
| FR-041 copy-status-region | Yes | T077, T081 | |
| FR-042 copy-status-clear | Yes | T077 | unreflected attribute paired |
| FR-043 copy-no-own-output | Yes | T077 | |
| FR-044 copy-swap-readme | Yes | T079, T082 | |
| FR-045 link-exposure-paint | Yes | T093, T097 | |
| FR-046 link-activation | Yes | T093, T097 | |
| FR-047 link-navigation-check | Yes | T092, T093, T095, T097, T098 | README sentence now tested |
| FR-048 link-fragment-ring | Yes | T093 | |
| FR-049 link-no-target-readme | Yes | T095, T098 | |
| FR-050 stories | Yes | T019, T045, T064, T079, T095 | hover and focus states added |
| FR-051 axe | Yes | T019, T028, T045, T050, T095 | depends on T001's merge order (I1) |
| FR-052 stories-in-red | Yes | T019, T045, T064, T079, T095 | |
| FR-053 after-10 | Yes | T001 | merge order vs procedure (I1) |
| FR-054 composed-dialog-story | Yes | T112 | |
| FR-055 manifest | Yes | T025, T048, T067, T082, T098 | row attributes' status (U2) |
| FR-056 readme | Yes | T019, T026, T045, T048, T064, T064a, T067, T067a, T079, T082, T095, T098, T110, T111 | |
| FR-057 csp | Yes | T015, T028, T043, T063, T078, T094 | |
| FR-058 changelog-pairs | Yes | T018, T024, T026, T111 | |
| FR-059 keyboard-tests | Yes | T014, T042, T062, T077, T093 | |
| SC-001 every-key-tested | Yes | T014, T042, T062, T077, T093 | |
| SC-002 every-event-asserted | Yes | T014, T042, T062, T077, T093 | |
| SC-003 no-cross-root-id | Yes | T043 | |
| SC-004 copy-no-hscroll | Yes | T077 | |
| SC-005 joined-rounding | Yes | T060, T062 | |
| SC-006 no-clipboard-call | Yes | T003, T008a, T077 | |
| SC-007 baselines-axe | Yes | T027, T028, T049, T068, T083, T099 | |
| SC-008 gates-mutation | Yes | T028, T050, T069, T084, T100, T113 | full gate list |
| SC-009 readme-consumer-examples | Yes | T110, T111 | |

**Constitution Alignment Issues:** none found. Every state with its own paint now has a story (Principle V). Complexity Tracking is empty and needs no entry. U2 is close to Principle I's manifest rule and Principle VII's "documented base-style hooks": it would become a conflict if the README presented the row attributes as a styling hook without declaring them.

**Unmapped Tasks:** none. T001 (merge and recheck), the spikes and measurement (T010, T040, T060, T075, T090), `red.sh` runs (T005a, T020, T046, T065, T080, T096), the plant runs (T008a and the plant part of T028, T050, T069, T084, T100) and the gate runs serve FR-053 and constitution VIII, not a single requirement.

**Metrics:**

- Total Requirements: 72 (63 functional: FR-001 to FR-059 with FR-010a, FR-011a, FR-014a, FR-021a; 9 success criteria, SC-001 to SC-009)
- Total Tasks: 79 (four of them, T062a, T064a, T066a and T067a, run only if decision 1 is answered no)
- Coverage %: 100 (72 of 72 with at least one task)
- Ambiguity Count: 0
- Duplication Count: 0
- Critical Issues Count: 0

### Next Actions

- No CRITICAL finding. One HIGH (I1): resolve it before "implement phase 1" is delegated. Otherwise phase 1's base is recorded before the merge, and phase 1's fold, review diff and mutation base all include #10. The fix is a tasks/plan edit (who merges, and when relative to `base.sh 1`), plus the operator's choice below.
- MEDIUM: I2 (record the range reading of the "no merge commits" checks where the orchestrator reads it), U1 (move the decision-1 stop to before phase 4's red commit), U2 (state the semver status of the row attributes) and G1 (add the "disabled child shows no hover paint" scenario and pairing). These can be fixed with I1 in one pass, or at phase 4 for U1 and U2, since those only take effect there.
- LOW: I3, three plan sentences to make conditional on decision 1.
- Suggested commands: edit `tasks.md` and `plan.md` by hand for I1, I3 and U1; edit `contracts/elements.md` and T064a for U2; edit T014, T042, T062 and § Pairings for G1; record I2's reading in `reviews/analysis/operator-decisions.md`. No spec change is needed.

### Questions for the operator

- **Q1 (I1): who makes the T001 merge, relative to `base.sh 1`?**
  (a) The orchestrator makes the recorded merge commit (`git merge --no-ff --signoff origin/main`) before delegating "implement phase 1". T001 keeps only the check that the merge is on the branch, plus the recheck. Tasks and plan say so.
  (b) The implementer does it, as T001 says now. The phase 1 delegation and T001 both state that T001 (1) comes before the procedure's step 2 (`base.sh 1`), as an exception to `/speckit-story-implement` for this phase.
  (c) The operator merges now, as a separate step before any implementation, and T001 becomes the recheck only.
- **Q2 (I2): how is the "no merge commits" rule of `/ocelle-run` 3.1 and `/ocelle-land` 8.1 applied to this feature?**
  (a) Record an operator decision that, for this feature, both checks mean "none in the fold range `FB..HEAD`", which is what `fold-history.sh` checks.
  (b) The same, and also amend both skills to state the range reading for every feature (a separate change outside this feature).
- **Q3 (U1): where does phase 4 stop for plan decision 1?**
  (a) Before phase 4's red commit (after T060 and T061), with the conditional tasks worded against that stop.
  (b) Before phase 4 starts (before T060).
  (c) Keep it at T064, and state that the implementer drafts both T062 and T062a, then drops the one that does not apply before committing red.
