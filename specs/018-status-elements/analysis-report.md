---
analyzed_at: 2026-11-16T02:57:32Z
head: 779f679fddd2359df9d4ceb561de6f726f23bf61
critical: 0
high: 2
medium: 5
low: 5
coverage: 100
---

## Specification Analysis Report

Feature `018-status-elements`, branch `claude/007-status-elements`. Artifacts read: spec.md, plan.md, tasks.md, research.md, data-model.md, contracts/elements-status.md, contracts/checks.md, quickstart.md, reviews/plan/plan-gate.md, the constitution (1.3.1). Dependency facts were spot-checked read-only on `origin/claude/007-actions-status` (012), `origin/claude/016-overlays` (008), `origin/claude/008-layout-headers` (011) and `origin/main` (op 016, `c4c0af45`).

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| I1 | Inconsistency | HIGH | spec.md:143-145 (Terms, "State pill"), spec.md:460-462 (FR-003); plan.md:67, :95-96 (decision 3); research.md:72-76 (R-03) | FR-003 says the pill radius "is used only by the pill tag", and the spec's Terms define a state pill as every `ocelle-pill-tag`. The plan draws the indicator dot with `--ocelle-radius-pill`, treating the dot as a state pill. Spec and plan contradict each other. Constitution II is met only under the plan's wider reading, and the spec does not record that reading (SPEC-1-11 already flagged this). plan-gate.md records "Plan: approved" but does not name decision 3. If that approval does not count as deciding decision 3, this is a constitution conflict (CRITICAL). | Operator confirms decision 3 explicitly; amend the spec's Terms and FR-003 so the indicator dot counts as a state mark. Otherwise add a token-only circle shape and use it instead. |
| I2 | Inconsistency (task ordering) | HIGH | contracts/checks.md:67-68, :72 (§ US3 "static click", "static focus", "seven names"); tasks.md:188 (T035), :197 (T041), :202; spec.md:697-698 | Phase 4's red commit (T035) holds every § US3 body. Three of them have interactive twins: a click on an interactive pill is guarded, a click focuses the inner control, and an attribute is moved and mirrored. Those twins and their plants need the interactive mode, `MovedAttributes` and `guardHost`, which are built only in phase 5 (T050, T052). T041 builds the static mode only, so phase 4's green run and `tdd-check.sh 4` cannot pass as written. This also contradicts the spec's assumption that US1-3 do not need 012 (T041 already uses 012's `linkHref`). | Move these interactive twins to § US4 and phase 5, and keep phase 4's positives static-only (for example compared with a plain `<span>` twin). Or make phase 4 depend on 012's helpers. Correct the spec assumption and the phase-4 checkpoint either way. |
| U1 | Underspecification | MEDIUM | research.md:82-84; contracts/checks.md:55; spec.md:198-202; tasks.md:91 (T002), :129 (T012), :252 (T057) | Some pinned values have no task that produces them. US1-8's resulting Chromium tree is "measured in the US1 red step", but the red step runs before the element exists, and T002's spikes do not include it. T057's rule "tooltip only when focus re-enters, as measured" is not measured by any spike either. Meanwhile the tasks require expected values to be written by hand. | Add both measurements to T002, on stand-ins (an `ElementInternals` role `img` element with a host `aria-label`; a tooltip trigger whose truncation changes while focused), and record them in `spikes.md`. |
| G1 | Coverage gap | MEDIUM | tasks.md:127 (T014), :159 (T026), :190 (T037); contracts/checks.md:31, :33, :35 | SC-001's bodies are written into `test/scenarios/consumers.ts`, but no task creates a runner (for example `test/consumers.test.ts`). As written, the SC-001 bodies may never run and so are never seen failing (constitution VIII). | Add the runner to T013's red commit and extend it in T025 and T036, or say that each element's test imports `consumers.ts`. |
| G2 | Coverage gap (gates) | MEDIUM | contracts/checks.md:139-145; tasks.md T023, T034, T044, T055, T062 | § Gates per phase requires typecheck, lint, unit-tests and signoff every phase, plus contrast and brand-rules when the eyebrow tokens are added. The phase-end tasks of phases 2-6 omit typecheck, lint, unit-tests and signoff, and T034 omits brand-rules. | Align the phase-end task lists, or cite § Gates per phase in each as T065 does. |
| I3 | Inconsistency | MEDIUM | tasks.md:90 (T001 (c)); :161, :166, :196-197 | T001 (c) says 011's state "decides T040 and T041". The tasks that actually branch on 011 are T028 and T030. | Change the reference to T028 and T030. |
| I4 | Inconsistency | MEDIUM | plan.md:242-243; tasks.md:272 (T065) | The plan runs phase-7 plants "against phase 2's base" (the whole feature). T065 runs them against `reviews/phase-7/base.sha`, a docs-only diff that likely selects no plant. | Pick one base (the plan's gives the run meaning) and record it in both files. |
| I5 | Inconsistency (stale) | LOW | spec.md:120-124, :697; tasks.md:15-16 | The spec still says op 016 is "approved, not merged" on `origin/claude/041-plants-affected`. It is on `origin/main` at `c4c0af45`, as tasks.md says. | Update the spec's dependency line. |
| I6 | Terminology | LOW | contracts/checks.md:51, :60; contracts/elements-status.md:42; data-model.md (pulse lifecycle); research.md:134 | "T001 spike" and "T001 probe" are used, but the spikes are T002. | Say T002 or "the phase-1 spikes". |
| I7 | Inconsistency (paths) | LOW | plan.md:182; tasks.md:104 (T009); research.md:34 | The plan's tree puts `in-process.ts`, `browser/driver.ts` and `commands.ts` under `test/scenarios/`. On 012, 008 and 011, and in T009, they live at `test/in-process.ts`, `test/browser/driver.ts` and `test/commands.ts`. | Fix the plan tree. |
| I8 | Inconsistency | LOW | tasks.md:179; :136 (T020); plan.md:95-96 | Phase 4's goal lists plan decision 3 (the indicator dot radius), which belongs to phase 2, and T020 does not name `--ocelle-radius-pill` for the dot. | Move decision 3 to phase 2 and name the radius in T020 (subject to I1). |
| D1 | Duplication | LOW | spec.md:404-405, :442-444, :506-512; contracts/elements-status.md:27-35; tasks.md T016 | The indicator's README rules are restated in FR-012, the Edge Cases, the contract and T016, and have been revised in several rounds, so the copies risk drifting apart. | Make FR-012 the single source and have the others refer to it. |

**Coverage Summary Table:**

| Requirement Key | Has Task? | Task IDs | Notes |
|---|---|---|---|
| FR-001 | Yes | T013, T020, T025, T031, T036, T041 | |
| FR-002 | Yes | T011, T018, T012, T035 | |
| FR-003 | Yes | style-lint and prefix in each phase-end task, T035 | I1 |
| FR-004 | Yes | T017, T022, T029, T033, T039, T043, T049, T054, T058, T061 | 21 stories |
| FR-005 | Yes | T016, T027, T038, T048, T021, T032, T042, T053 | |
| FR-006 | Yes | CSP fixtures in T013, T025, T036, T047, T057; gate:csp | |
| FR-007 | Yes | T016, T021, T027, T032, T038, T042, T048, T053, T057, T060, T063 | |
| FR-010 to FR-016 | Yes | T002, T012, T015, T016, T020 | U1 for FR-012, FR-014 |
| FR-020 to FR-024 | Yes | T024, T027, T028, T030, T031 | |
| FR-025 to FR-029 | Yes | T035, T038, T041, T046, T052 | I2 |
| FR-030 to FR-032, FR-035 | Yes | T045, T046, T048, T050, T052 | |
| FR-033, FR-034 | Yes | T056, T059 | |
| FR-040 | Yes | T038, T040 | |
| FR-041 | Yes | T015, T019 | |
| FR-042 | Yes | T001, T028, T030 | I3 |
| FR-043 | Yes | T048, T051 | |
| SC-001 | Yes | T014, T026, T037 | no runner task, G1 |
| SC-002 | Yes | story tasks, gate:visual, gate:axe | |
| SC-003 | Yes | gate:contrast, T030 | existing pairs per R-06, R-07 |
| SC-004 | Yes | T012, T015 | |
| SC-005 | Yes | T046, T056 | |
| SC-006 | Yes | manifest tests, phase-end gates | G2 |

**Constitution Alignment Issues:**

- Principle II: I1. The pill radius on the indicator dot rests on an unrecorded wider reading of "state pill". The operator must decide it explicitly; otherwise it is a constitution conflict.
- Principle VIII: G1 and U1 leave gaps in how those tests are proven, and I2 would make phase 4's green run impossible. The artifacts as they stand break no MUST.

**Unmapped Tasks:** T001 to T010 (setup, spikes, harness) and T063 to T065 (polish) are infrastructure and verification tasks, which serve all requirements.

**Metrics:** 40 requirements; 65 tasks; coverage 100 %; ambiguity 0; duplication 1; critical 0.

## Next Actions

- No CRITICAL finding, so `/speckit-implement` is not blocked. Settle I1 and I2 before phase 2:
  - I1: the operator confirms plan decision 3, and the spec's Terms and FR-003 are amended (or a non-pill circle token is adopted).
  - I2: edit tasks.md and contracts/checks.md to move the § US3 interactive twins to phase 5 (or make phase 4 depend on 012's helpers), and correct the spec assumption.
- MEDIUM (manual edits to tasks.md): add the measurements to T002 (U1), add a consumers runner (G1), align the gate lists (G2), fix T001 (c) (I3), settle phase 7's plant base (I4).
- LOW: fix I5 to I8 and D1 in the same edit, or at T001, which already corrects task-list mismatches before T003.
