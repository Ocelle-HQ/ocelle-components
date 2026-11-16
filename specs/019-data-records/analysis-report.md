---
analyzed_at: 2026-11-16T08:51:36Z
head: 3a5a224ff493eddc954a57573d8dc0eca8eef5ff
critical: 1
high: 0
medium: 5
low: 10
coverage: 100
---

## Specification Analysis Report

Feature: `specs/019-data-records` (spec.md, plan.md, tasks.md, with data-model.md, research.md, quickstart.md and contracts/ read for cross-checks). Constitution: `.specify/memory/constitution.md` 1.3.1. No `before_analyze` or `after_analyze` hooks are registered (`.specify/extensions.yml` has `hooks: {}`).

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| C1 | Constitution | CRITICAL | plan.md:L129, L408-L409, L417; spec.md:L598-L604 (FR-050); contracts/checks.md:L190-L193; tasks.md:L238 (T019), L320 (T045), L385 (T068) | Constitution V requires a story per variant and per state, and Governance requires every exception to be a Complexity Tracking row with scope, rationale, sunset and operator approval. Two kinds of specified state have no story and no such row. (1) `ocelle-timeline-event` outside a timeline and `ocelle-evidence-step` outside a chain (edge case at spec.md:L360-L362, FR-020, FR-030): the plan says FR-050 makes this "the spec's own rule, not an exception" and "as 013 did", but 013's plan (origin/claude/013-data-display, specs/013-data-display/plan.md:L146) recorded exactly this state (`ocelle-fact` outside `ocelle-facts`) as a Principle V exception approved by the operator. (2) The lists and the region named by a non-blank host `aria-label` (US2-10, US3-10, FR-010): checks.md says no such story unless the phase 2 spike shows axe is clean, but no task adds one if axe is clean, and no row exists if it is not. 013 recorded the matching state (progress named by a host `aria-label`) as an exception. Reading the constitution so that a spec rule removes the need for an exception row weakens the principle. | Resolve before phase 1. Either add the stories (and change the story and baseline counts in tasks.md, checks.md and plan.md), or add a Complexity Tracking row per state with scope, rationale and sunset for the operator's approval, as 013 did. See the operator question below. |
| C2 | Constitution | LOW | plan.md:L126, L415-L416; research.md:L766-L770 | The round markers use `border-radius: 50%` with no token. This is recorded as "a mark shape, not a corner radius", which keeps it outside constitution II's one-radius rule (operator decision Q-D). No conflict was found: the brand-rules gate checks only the closed set of radius tokens, and `%` passes token-only. Still, the result depends on one reading of the constitution's text. | Optional: a PATCH clarification of constitution II ("circles for marks use 50%") so later missions do not have to argue the same point again. |
| I1 | Inconsistency | MEDIUM | plan.md:L52-L56, L119-L121, L154-L157; research.md:L752, L785-L794; spec.md:L76-L80; tasks.md:L21-L22 | The operator decided Q-G as (a) in reviews/plan/operator-gate.md (commit 7956cfc). plan.md, research.md and the spec's plan-gate notes still call it "open" and "put back to the operator". tasks.md points out the drift but does not fix it. The requirement text (FR-023, US2-13) already matches (a), so only the recorded status is stale. | Mark Q-G as decided (a) in plan.md § Summary, the Constitution Check note and § Decisions 6, in research.md § Open questions, and in the spec's plan-gate notes. |
| I2 | Inconsistency | LOW | tasks.md:L90, L93 | The stop-and-ask list gives the spikes as "T003, T027, T052", but phase 2's spike is T026 (T027 is its scaffold). It gives the inventory steps as "T005, T029, T054", but phase 2's inventory is T028 (T029 is the `itemTexts` driver task). | Correct the ids to T003, T026, T052 and T005, T028, T054. |
| I3 | Inconsistency | LOW | plan.md:L275 vs plan.md:L166-L167, tasks.md T005/T028/T054 | Plan § Phases 0 lists "The operator's inventory for R-16" as a Phase 0 item. Plan decision 9 and tasks.md instead place one inventory step before each phase's red commit. | Remove the inventory bullet from plan § Phases 0, or point it at the per-phase steps. |
| I4 | Inconsistency | LOW | quickstart.md steps 4 and 6; contracts/checks.md:L202; tasks.md:L71-L72, L406 (T078) | Quickstart step 4 uses `--affected origin/main` and step 6 runs mutation "on the phase's changed source". T078 runs the quickstart with `--affected <phase-4 base>`, and phase 4 changes no source. checks.md § Gates per phase says "`--list` recorded in plants.md", while tasks.md follows op 016's record of the run itself (tasks.md says so). | Align quickstart steps 4 and 6 and checks.md § Gates per phase with tasks.md. |
| I5 | Inconsistency | LOW | tasks.md:L307 (T035), L373 (T059); plan.md:L219 | The timeline's and the chain's pre-upgrade bodies go into `packages/styles/test/browser/data-table.test.ts`. The file name says data table but the file holds the list-item rules of block 3. | Optional: name the file for the whole records block, or record why it keeps the name. |
| I6 | Inconsistency | LOW | spec.md:L7 | The spec still says **Status**: Draft, although it was approved at the spec gate and amended after the plan gate. | Update the status line. |
| I7 | Inconsistency | MEDIUM | research.md:L261-L293; contracts/styles-data-table.md:L17; contracts/ocelle-data-table.md:L47-L54, L100; plan.md:L125 | `@ocelle/elements` writes `--data-table-box-size` and `--data-table-end-fade`, and the caption cap in `@ocelle/styles` `base.css` reads them. The plan calls them "internal ... not surface". They are a contract between two separately versioned packages that consumers pin on their own (constitution VII). A rename in one package silently breaks the caption cap in the other, and semver would not signal it. Nothing covers this: no test, no README line, no version-range rule. | Choose between documenting them as a base-style hook (surface, constitution VII) and recording a version-coupling rule between the two packages. See the operator question below. |
| G1 | Coverage Gap | MEDIUM | spec.md:L534-L536 (FR-023); tasks.md:L293-L298 (T031), L325 (T050); contracts/checks.md § Element plants | FR-023 requires that changing a slotted node's `slot` attribute updates the time box, the marker line and the connectors. T031 covers adding, removing, filling, emptying, hiding and showing a slotted time, but no body changes `slot`. No element plant removes `slot` from either observer's attribute filter. | Add a body for `slot="time"` set on and removed from an existing child, and a plant that drops `slot` from the observers' filters. |
| G2 | Coverage Gap | MEDIUM | spec.md:L171-L173 (US1-11); tasks.md:L180 (T006 US1-11); contracts/checks.md:L45 (forced-colours oracle) | US1-11 requires the row rules and the header rule to be drawn in a system colour and be visible in forced colours. T006 and the oracle name only the row rules ("cell rules"). The header rule (`border-block-end-color: rule-strong` on column headers) is not asserted. | Add the header rule to T006's US1-11 forced-colours half and to the oracle's mark list. |
| G3 | Coverage Gap | MEDIUM | spec.md:L390 (FR-001), L501 (FR-015); contracts/ocelle-event-timeline.md, contracts/ocelle-evidence-chain.md (style tables); tasks.md:L317 (T042), L382 (T065) | FR-001 requires `:host([hidden]) { display: none; }` on every element. FR-015 says a data-table host with `aria-hidden="true"` or `hidden` follows the Host ARIA rule. The timeline and chain contracts and their green tasks do not list `:host([hidden])`. No body tests a `hidden` or `aria-hidden="true"` host on any of the five elements: T010's "hidden host shown" only checks for a ResizeObserver loop. | Add `:host([hidden])` to the two container contracts and to T042 and T065, plus a body per element for a hidden host (not shown, not exposed), with the data table's host `aria-hidden` case. |
| G4 | Coverage Gap | LOW | spec.md:L545-L546 (FR-026); tasks.md:L300 (T033) | FR-026 says neither list adds a live region, a landmark, a heading or a tab stop. T033 asserts "no live region" and US2-7 asserts no added tab stop. No body asserts no landmark or heading role. | Extend T033's and T056's bodies to assert no landmark or heading role in the containers' AX subtrees. |
| G5 | Coverage Gap | LOW | spec.md:L496-L499 (FR-014); tasks.md:L152 (T003), L221 (T013) | FR-014 requires that a change the module does not observe be named in research and that the README say what to do. T003 measures this, but T013 has no statement for that README line in case the spike finds such a change. | Add a conditional T013 statement (or a stop-and-ask item) for a change the spike finds unobserved. |
| D1 | Duplication | LOW | spec.md:L547-L548 (FR-027), L585-L586 (FR-036), L402-L429 (FR-013) | FR-027 and FR-036 repeat FR-013's colour and 3:1 rules for the timeline and the chain. They agree today, but they could drift apart. | Optional: cut FR-027 and FR-036 down to their element-specific choices and refer to FR-013 for the rule. |
| A1 | Ambiguity | LOW | spec.md:L363-L365 (edge case "More than one slotted time") vs L522-L528 (FR-023) | The edge case says "every visible direct child with `slot="time"` is shown". FR-023 says an empty or white-space-only slotted time "is neither shown nor exposed". With two visible nodes, one blank and one non-blank, it is unclear whether the blank one is assigned and shown (it may add white space) or left out. | State which rule governs when the nodes are mixed, and cover it in T033's two-slotted-nodes body. |

**Coverage Summary Table:**

| Requirement Key | Has Task? | Task IDs | Notes |
|-----------------|-----------|----------|-------|
| FR-001 conventions | Yes | T004, T016, T018, T021, T027, T041, T042, T053, T064, T065 | containers' `:host([hidden])` missing (G3) |
| FR-002 no class, no sk-, no mono | Yes | T019, T022, T045, T068 | `gate:prefix` |
| FR-003 slotted table | Yes | T006 (US1-1, US1-15), T009, T016 | |
| FR-004 table semantics | Yes | T003, T006 (US1-1), T016 | |
| FR-005 cell styles in @ocelle/styles | Yes | T006 (US1-2, US1-14), T011, T013, T017 | |
| FR-006 eyebrow headers | Yes | T001, T006 (US1-3), T009, T017 | |
| FR-007 wrap on cells | Yes | T006 (US1-9), T009, T017 | |
| FR-008 009 overflow region | Yes | T006 (US1-4 to US1-6, US1-8, US1-13), T016 | |
| FR-009 no page scroll | Yes | T006, T014, T030, T038, T055, T061 | |
| FR-010 region name | Yes | T006 (US1-7, US1-16), T007, T013, T016 | |
| FR-011 no events, tab stops | Yes | T006 (US1-8), T030 (US2-7), T056 | |
| FR-012 prose override | Yes | T006 (US1-10), T011, T017 | |
| FR-013 contrast classes | Yes | T011, T012, T036, T060, T006/T030/T055 (US1-11, US2-8, US3-8) | header rule in forced colours (G2) |
| FR-014 re-decide after swaps | Yes | T003, T006 (US1-13, US1-15), T016 | README line for unobserved changes (G5) |
| FR-015 label property, host ARIA | Partial | T004, T016 | host hidden/aria-hidden untested (G3) |
| FR-016 item text | Yes | T029, T030, T055 | |
| FR-020 timeline items | Yes | T030 (US2-6), T033, T042 | |
| FR-021 markers, connectors | Yes | T030 (US2-2, US2-9), T032, T042 | |
| FR-022 list name | Yes | T030 (US2-1, US2-10), T042 | |
| FR-023 time and time slot | Yes | T031, T040, T041 | `slot` attribute change untested (G1) |
| FR-024 wrap on items | Yes | T030 (US2-4), T055 (US3-5), T041, T064 | |
| FR-025 hidden items, updates | Yes | T030 (US2-5), T033, T055 (US3-6) | |
| FR-026 no live region etc. | Partial | T033, T037 | landmark and heading unasserted (G4) |
| FR-027 event text colours | Yes | T030 (US2-3), T036 | |
| FR-030 chain items | Yes | T055 (US3-7), T056, T065 | |
| FR-031 step marker | Yes | T055 (US3-2), T065 | |
| FR-032 chain name, hidden marks | Yes | T055 (US3-1, US3-10) | |
| FR-033 ordinals | Yes | T055 (US3-2, US3-6), T056 | |
| FR-034 wrapping rows | Yes | T052, T055 (US3-3, US3-5, US3-9) | |
| FR-035 chip variant | Yes | T055 (US3-4), T058, T065 | |
| FR-036 step colours | Yes | T055 (US3-8), T060 | |
| FR-040 tokens | Yes | T001, T075 | no token added |
| FR-050 stories | Yes | T019, T045, T068 | states without stories (C1) |
| FR-051 baselines, gates | Yes | T020, T022, T046, T048, T069, T071 | |
| FR-052 edge-case bodies | Yes | T009, T010, T033, T034, T056, T057 | |
| FR-053 320 px reflow | Yes | T006, T014, T030, T038, T055, T061 | |
| FR-054 manifest | Yes | T018, T034, T044, T067 | |
| FR-055 strict CSP | Yes | T010, T022, T034, T057 | |
| FR-056 conventions amendment | Yes | T013, T021 | |
| FR-057 changelogs | Yes | T017, T021, T043, T047, T066, T070, T075 | |
| FR-058 sk- mapping | Yes | T005, T013, T021, T028, T037, T047, T054, T062, T070 | |
| FR-059 affected plants, mutation | Yes | T023, T025, T049, T051, T072, T074, T078 | |
| SC-001 mapping coverage | Yes | T076 | |
| SC-002 320 px stories | Yes | T014, T038, T061 | |
| SC-003 axe per story | Yes | T022, T048, T071, T078 | |
| SC-004 contrast pairs | Yes | T011, T012, T022, T036, T060 | |
| SC-005 region keyboard | Yes | T006 | |
| SC-006 red/green, mutation | Yes | T015, T025, T039, T051, T063, T074 | |
| SC-007 gates, 013 unchanged | Yes | T022, T078 | |

**Constitution Alignment Issues:**

- C1 (CRITICAL, Principle V and Governance): specified states with no story and no approved Complexity Tracking row. The plan's claim that it follows 013 contradicts 013's own record, which treated the same state as an exception.
- C2 (LOW, Principle II): `border-radius: 50%` on marks rests on reading the text as "a mark shape, not a radius". This pass found no conflict.
- Principles I, III, IV, VI, VII and VIII: no conflict found. Every behaviour phase has a scaffold, then a red commit of test files only, then green. The red log is read per body. Element plants run after green and are not committed. Each phase runs mutation and the affected plants. Phases 0 and 4 have exemption records. I7 is a constitution VII risk (a coupling across separately versioned packages), not a breach: before 1.0.0 the surface may change.

**Unmapped Tasks:** none. T001, T002 and T075 to T078 are setup and record tasks that map to FR-040, FR-057, FR-059, SC-001, SC-003 and SC-007 and to the R-14 and R-17 records.

**Metrics:**

- Total Requirements: 49 (42 FR, 7 SC)
- Total Tasks: 78 (T001 to T078)
- Coverage % (requirements with >=1 task): 100% (FR-015 and FR-026 are partial, G3 and G4)
- Ambiguity Count: 1
- Duplication Count: 1
- Critical Issues Count: 1

**Questions for the operator:**

- **C1, the states without a story.** (a) Add stories: a standalone `ocelle-timeline-event` in the timeline's file and a standalone `ocelle-evidence-step` in the chain's, plus one story per container and for the data table named by a host `aria-label`, if the phase 2 spike shows axe is clean (story counts 13 / 12 / 12, baselines 26 / 24 / 24). (b) Record one Principle V exception row in plan Complexity Tracking, with scope, rationale and a sunset condition, covering the standalone items and the host `aria-label` names, which the browser bodies prove, as 013 did; you approve it at the tasks gate. (c) Add the two standalone item stories and record an exception row only for the host `aria-label` states (R-09's axe risk).
- **I7, the caption-cap properties across packages.** (a) Document `--data-table-box-size` and `--data-table-end-fade` as a base-style hook between the two packages, a public surface under constitution VII, named in both CHANGELOGs and READMEs. (b) Keep them internal and record a version-coupling rule: `@ocelle/styles` and `@ocelle/elements` releases with matching minor versions, stated in both READMEs. (c) Accept the coupling as it is, before 1.0.0, and revisit it at the 1.0.0 surface review.

## Next Actions

- One CRITICAL issue (C1). Resolve it before `/speckit-implement` (the `ocelle-implement` workflow). After the operator chooses for C1, either edit plan.md Complexity Tracking or extend checks.md § Stories, T019, T045, T068 and the baseline counts (a /speckit-plan adjustment, then a manual tasks.md edit).
- MEDIUM: edit tasks.md and the contracts by hand to add coverage for the `slot` attribute change (G1), the header rule in forced colours (G2) and the hidden host (G3). Mark Q-G decided in plan.md, research.md and the spec's notes (I1). Take the operator's answer on I7.
- LOW: fix the stop-and-ask ids (I2), the plan's Phase 0 inventory bullet (I3), quickstart and checks.md alignment (I4), the spec status (I6) and the remaining optional items (C2, I5, G4, G5, D1, A1) during the same edit, or leave them as they are.
