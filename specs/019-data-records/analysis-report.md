---
analyzed_at: 2026-11-18T10:05:40Z
head: 4ad30733094cf2ad4fb737c886da9bd4047f85ac
critical: 1
high: 0
medium: 3
low: 3
coverage: 100
---

## Specification Analysis Report

Feature: `specs/019-data-records`. The analysis read spec.md, plan.md and tasks.md, and cross-checked them against data-model.md, research.md (R-16 to R-20 in full), quickstart.md, contracts/ (`overflow-region-block-axis.md`, `styles-data-table.md`, `ocelle-data-table.md`, `checks.md`) and the operator's records in reviews/ (`recheck-decisions.md`, `phase-1/operator-spike-decisions.md`, `phase-1/inventory-decisions.md`, `main-merge.md`). Constitution: `.specify/memory/constitution.md` 1.3.1. No `before_analyze` or `after_analyze` hooks are registered (`.specify/extensions.yml` has `hooks: {}`).

This run follows the analysis at 3a5a224. Of that analysis's findings, C1, I1 to I7, G1 to G5, D1 and A1 are resolved in the current artifacts. C2 still applies and is kept with its ID. Every other ID below is new and refers to a change made since then: the main merge, the recheck, the phase 1 spike, and the inventory decisions IQ-1 to IQ-7 and Q-I1 to Q-I7.

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| C1 | Constitution | CRITICAL | plan.md:L178 (row V), L644 (Complexity Tracking), L654-L655; spec.md:L864-L876 (FR-050), L293-L295 (US1-20), L320-L326 (US1-26); contracts/checks.md § Stories ("the block-end fade of Q-I4 adds no story"); research.md R-18 "Stories and baselines"; reviews/phase-1/inventory-decisions.md (Q-I7 (a)) | Constitution V requires a story for every variant and every state. Governance requires each exception to be a Complexity Tracking row with its scope, rationale, a sunset condition and the operator's approval. The inventory decisions add states that have no story, and the table has no row for them. (1) The block-end fade's off state (scrolled to the block end). Q-I7 calls it "the fade's off state", and the operator chose (a), no story. That is an approval, but it was never recorded as a row with scope, rationale and sunset. (2) The room-rule state: rows are below, but no fade is drawn because less than twice the fade depth shows under the header. (3) `sticky-header` with no page bound (US1-20). It has its own acceptance scenario, a different border model and `data-axis="both"`. No story, no row and no operator decision cover it. Plan L654 states that "Every other spec'd state has a story", which is no longer true. | Resolve this before phase 1's red commit (T015). Option (a) below only needs a plan.md edit. See the operator question below. |
| A1 | Ambiguity | MEDIUM | contracts/overflow-region-block-axis.md:L22 (input `blockStartBox`: "reads its laid-out block size"), L35-L36 (output `fadeBlockEnd`: "the pinned box's block-end edge"), § Effects "Focus clearance"; spec.md:L320-L326 (US1-26), L518-L521 (edge case); tasks.md T079 (the test host has a pinned first child and no caption), T080 (US1-26) | The room rule and the block clearance are measured from the pinned box. The contract gives this measure as the `<thead>`'s laid-out *block size* in one place and as its *block-end edge* in another. At the block start the `<thead>` is not yet pinned, because the caption above it pushes it down by the caption's height. A caption on two lines, as at 320 px (US1-21, US1-27), can push the header row's block-end edge below `clientHeight − fade depth`. In that case a room rule computed from block size draws the fade, and US1-26's assertion ("the fade's block-start edge at or below the pinned header row's block-end edge") fails. T079's host has no caption, so the module's own bodies never exercise this case. | Choose one measure (the current edge or the block size as if pinned) in the contract and in FR-018, and add a captioned case to T079 and to US1-26. T082's spike can measure it. See the operator question below. |
| A2 | Ambiguity | MEDIUM | spec.md:L536 (edge case "Hover on a row holding a link": "On a device with no hover nothing shows"); contracts/styles-data-table.md block 1 (`… tbody > tr:hover > :is(td, th)`, no media query); research.md R-20; tasks.md T017, T080 (US1-24) | The spec promises that nothing shows on a device with no hover. The rule in block 1 has no `@media (hover: hover)` guard, though, and touch browsers apply `:hover` to a tapped row until the next tap elsewhere. No task asserts the promise, and no plant guards it. | Either guard the rule and test the guard, or drop the sentence. See the operator question below. |
| G1 | Coverage Gap | MEDIUM | spec.md:L727-L738 (FR-018); contracts/overflow-region-block-axis.md § Effects "Arrow keys"; tasks.md T079, T080 (US1-18); constitution V ("every keyboard path") | With the option on, the box gets `overflow-y: auto`. While it has focus, Chromium then scrolls it in the block axis with PageUp, PageDown, Home, End, Space and Shift+Space. Before the option, `overflow-y: hidden` blocked all of these. FR-018 and the contract specify only ArrowUp and ArrowDown, and no body asserts the other keys: the block scroll, the fade following, the header staying pinned. These are new keyboard paths of the data table's region, and none has a test. | Specify these keys in FR-018 and the contract (either left to the browser or handled by the module), and add a body per key to T079 and T080. See the operator question below. |
| C2 | Constitution | LOW | plan.md:L175 (row II), L652-L653; research.md Q-D | Carried over unchanged. The markers use `border-radius: 50%` with no token, and the plan records this as "a mark shape, not a corner radius". This run found no conflict: the brand-rules gate checks only the closed set of radius tokens, and `token-only` allows `%`. The result still depends on one reading of constitution II's text. | Optional: a PATCH clarification of constitution II through `/speckit-constitution`. |
| I1 | Inconsistency | LOW | plan.md:L332-L334; tasks.md:L69-L70, L156-L158; research.md:L982, L1008; checklists/requirements.md:L77; spec.md:L146-L156 (decision list) | The operator answered Q-I6 (a) and Q-I7 (a) in commit 4ad3073 (inventory-decisions.md:L35-L37), choosing the defaults. plan.md, tasks.md, research.md and the checklist still call both questions open, "followed until answered". tasks.md still has a stop-and-ask item for an answer that differs from the default. The spec's decision list ends at Q-I5. No requirement changes, because both answers are the defaults. | Mark Q-I6 and Q-I7 as decided in each of these places. Add both to the spec's decision list. Remove the now-moot stop-and-ask clause at tasks.md L156-L158. |
| I2 | Inconsistency | LOW | plan.md:L157 (Scale/Scope: "1 driver addition"), L376 (Project Structure: "+ itemTexts"); plan.md:L108-L110; tasks.md T029, T079 | The plan's Testing section and the tasks add three driver functions: `scrollTop` and `setScrollTop` in phase 1, and `itemTexts` in phase 2. Scale/Scope still counts one, and the Project Structure comment names only `itemTexts`. | Change the count to 3 and name `scrollTop` and `setScrollTop` in the structure comment. |

**Coverage Summary Table:**

| Requirement Key | Has Task? | Task IDs | Notes |
|-----------------|-----------|----------|-------|
| FR-001 conventions | Yes | T004, T009, T016, T018, T021, T027, T033, T041, T042, T053, T056, T064, T065 | `:host([hidden])` bodies per element |
| FR-002 no class, no sk-, no mono | Yes | T019, T022, T045, T068 | `gate:prefix` |
| FR-003 slotted table | Yes | T006 (US1-1, US1-15), T009, T016 | |
| FR-004 table semantics | Yes | T003, T006 (US1-1), T016 | upper-case header names (spike Q2 (a)) |
| FR-005 cell styles in @ocelle/styles | Yes | T006 (US1-2, US1-14), T011, T013, T017 | |
| FR-006 eyebrow headers | Yes | T006 (US1-1, US1-3), T011, T013, T017 | 011's four eyebrow tokens (recheck Q1 (a)) |
| FR-007 wrap on cells | Yes | T006 (US1-9), T009, T017 | |
| FR-008 009 overflow region | Yes | T006 (US1-4 to US1-6, US1-8, US1-13), T016, T081 | amended for FR-018 only |
| FR-009 no page scroll | Yes | T006, T008, T014, T030, T038, T055, T061, T080 (US1-21) | |
| FR-010 region name | Yes | T006 (US1-7, US1-16, host `aria-label`), T007, T013, T016, T019 | IQ-6 (a) README advice in T013 |
| FR-011 no events, tab stops | Yes | T006 (US1-8), T030 (US2-7), T056, T080 (US1-24) | |
| FR-012 prose override | Yes | T006 (US1-10), T011, T017 | sticky table in prose (T011) |
| FR-013 contrast classes | Yes | T006, T011, T012, T030, T036, T055, T060, T080 (US1-23 to US1-25, US1-28) | grounds and row band included |
| FR-014 re-decide after swaps | Yes | T003, T006 (US1-13, US1-15), T013, T016 | R-05 records "none" |
| FR-015 label, host ARIA | Yes | T004, T009, T016 | |
| FR-016 item text | Yes | T029, T030, T031, T055 | |
| FR-017 sticky header row | Yes | T004, T011, T013, T016, T017, T019, T080 (US1-17 to US1-21) | unbounded state has no story (C1) |
| FR-018 block-axis option | Yes | T013, T024, T025, T079, T080 (US1-26 to US1-28), T081, T082 | room-rule measure (A1); keys beyond arrows (G1) |
| FR-019 numeric hook | Yes | T011, T013, T017, T080 (US1-22) | |
| FR-060 striped rows | Yes | T011, T017, T019, T080 (US1-23, US1-25) | |
| FR-061 row hover | Yes | T011, T017, T019, T080 (US1-24, US1-25) | no-hover devices (A2) |
| FR-020 timeline items | Yes | T030 (US2-6), T033, T042 | |
| FR-021 markers, connectors | Yes | T030 (US2-2, US2-9), T032, T042 | |
| FR-022 list name | Yes | T030 (US2-1, US2-10), T042 | |
| FR-023 time and time slot | Yes | T031, T040, T041, T050 | `slot` change covered |
| FR-024 wrap on items | Yes | T030 (US2-4), T055 (US3-5), T041, T064 | |
| FR-025 hidden items, updates | Yes | T030 (US2-5), T033, T055 (US3-6) | |
| FR-026 no live region etc. | Yes | T033, T037, T056 | landmark and heading asserted |
| FR-027 event text colours | Yes | T030 (US2-3), T036 | |
| FR-030 chain items | Yes | T055 (US3-7), T056, T065 | |
| FR-031 step marker | Yes | T055 (US3-2), T065 | |
| FR-032 chain name, hidden marks | Yes | T055 (US3-1, US3-10) | |
| FR-033 ordinals | Yes | T055 (US3-2, US3-6), T056 | |
| FR-034 wrapping rows | Yes | T052, T055 (US3-3, US3-5, US3-9) | |
| FR-035 chip variant | Yes | T055 (US3-4), T058, T065 | |
| FR-036 step colours | Yes | T055 (US3-8), T060 | |
| FR-040 tokens | Yes | T001, T075 | no token added |
| FR-050 stories | Yes | T019, T045, T068 | block-axis states without a story or row (C1) |
| FR-051 baselines, gates | Yes | T020, T022, T046, T048, T069, T071 | 38 / 22 / 24 |
| FR-052 edge-case bodies | Yes | T009, T010, T033, T034, T056, T057, T080 | |
| FR-053 320 px reflow | Yes | T006, T014, T030, T038, T055, T061 | |
| FR-054 manifest | Yes | T018, T034, T044, T067 | |
| FR-055 strict CSP | Yes | T010, T022, T034, T057, T079 | |
| FR-056 conventions amendment | Yes | T013, T021, T081 | module entry names the option |
| FR-057 changelogs | Yes | T017, T021, T043, T047, T066, T070, T075, T081 | |
| FR-058 sk- mapping | Yes | T005, T013, T021, T028, T037, T054, T062, T070 | R-16 data-table rows |
| FR-059 affected plants, mutation | Yes | T023, T025, T049, T051, T072, T074, T078 | |
| SC-001 mapping coverage | Yes | T076 | |
| SC-002 320 px stories | Yes | T014, T038, T061 | |
| SC-003 axe per story | Yes | T022, T048, T071, T078 | |
| SC-004 contrast pairs | Yes | T011, T012, T036, T060 | |
| SC-005 region keyboard | Yes | T006, T080 (US1-18) | |
| SC-006 red/green, mutation | Yes | T015, T025, T039, T051, T063, T074 | |
| SC-007 gates, 009/013 unchanged | Yes | T022, T078, T079 | |

**Constitution Alignment Issues:**

- C1 (CRITICAL, Principle V and Governance): three block-axis states have no story and no Complexity Tracking row: the fade off at the block end, the room-rule state, and `sticky-header` without a bound. The operator's Q-I7 (a) approves no story for the first state but is not a recorded row, and nothing covers the third. Plan L654's claim that every other state has a story is now false.
- C2 (LOW, Principle II): carried over. This run found no conflict.
- G1 is also a Principle V concern ("every keyboard path"). It is rated MEDIUM because the keys in question are the platform's native scrolling, not keys the element handles itself.
- Principles I, III, IV, VI, VII and VIII: no conflict found. The block-axis option stays internal (VII). Its changed source is mutation-tested (T025), and its bodies go into phase 1's red commit (T079, T015). 009's behaviour tests stay unedited, and T022 checks that with a diff. The `data-ocelle-align` hook and the caption-cap properties are documented base-style hooks (VII). The forced-colours row band does not use `forced-color-adjust: none` (III).

**Unmapped Tasks:** none. T001, T002 and T077 are record tasks: the recheck, the phase 0 exemption and the R-17 request. T082 is phase 1's second spike, and it maps to FR-017, FR-018, FR-060 and FR-061.

**Metrics:**

- Total Requirements: 54 (47 FR, 7 SC)
- Total Tasks: 82 (T001 to T082)
- Coverage % (requirements with >=1 task): 100%
- Ambiguity Count: 2 (A1, A2)
- Duplication Count: 0
- Critical Issues Count: 1

**Questions for the operator:**

- **C1, the block-axis states without a story.**
  - (a) Record one Principle V exception row in plan.md § Complexity Tracking. Scope: `ocelle-data-table` with `sticky-header` scrolled to the block end (fade off), under the room rule (rows below, no fade), and without a page bound (US1-20). Rationale: a story renders at its initial scroll position, and US1-20, US1-26 and US1-28 prove these states in both harnesses. Sunset: #10's stories gain an initial-scroll parameter. Approval: Q-I7 (a) for the first two states, and your approval now for the third. Counts stay at 19 and 38 in phase 1.
  - (b) Add one story, "sticky header, unbounded" (US1-20: no block scroll and no fade). Phase 1 becomes 20 stories and 40 baselines, the mission 43 and 86, and T020's `<n>` 40. Record the row only for the scrolled-to-end and room-rule states.
  - (c) Decide that scroll positions and a missing page bound are not "states" under Principle V. Write that reading into the plan's Complexity Tracking notes now, and propose a PATCH clarification of constitution V through `/speckit-constitution`, outside this mission.
- **A1, where the room rule and the block clearance measure the pinned header from.**
  - (a) From the `<thead>`'s current laid-out block-end edge, which respects the caption. At rest under a tall caption the fade may be absent until the caption scrolls away. Add a captioned host to T079 and a captioned case to US1-26.
  - (b) From the `<thead>`'s block size as if it were pinned (`clientHeight` minus the header's block size). Amend US1-26 so that, while a caption is in view, the fade's block-start edge is compared with the box's client block start plus the header's block size.
  - (c) Let T082's spike measure both at 320 px with a two-line caption, and stop for your choice before the scaffold.
- **A2, row hover on devices without hover.**
  - (a) Wrap the hover rule in `@media (hover: hover)`. Add a body under an emulated `hover: none` that asserts no ground after the pointer hovers a row, and an element plant that removes the guard.
  - (b) Drop the sentence "On a device with no hover nothing shows" from the spec's edge case and keep the rule unguarded. The README notes that a tapped row may keep the hover ground on touch devices.
- **G1, block-axis keys other than ArrowUp and ArrowDown.**
  - (a) Leave PageUp, PageDown, Home, End, Space and Shift+Space to the browser. State this in FR-018 and the contract, and add bodies to T079 and T080 asserting that each key scrolls the box in the block axis, that `data-block-fade` follows, and that the header stays pinned.
  - (b) Have the module handle Home and End (block start and end) and PageUp and PageDown (by the client height less the pinned box) itself, with bodies, pure-function cases and element plants.
  - (c) Leave these keys unspecified and record why in plan.md § Complexity Tracking, as a Principle V note.

## Next Actions

- One CRITICAL issue (C1). Resolve it before phase 1's red commit (T015) in the `ocelle-implement` workflow. With (a) or (c), edit plan.md § Complexity Tracking and the line at L654. With (b), also change checks.md § Stories, T014, T019 and T020, and the story and baseline counts in spec.md, plan.md and tasks.md.
- MEDIUM: take the operator's answers on A1, A2 and G1. Then edit FR-018 or the spec's edge case, the block-axis contract or block 1 of `styles-data-table.md`, and T079 and T080 by hand. T082's spike (still open) is the natural place to measure A1 and G1 before the scaffold.
- LOW: mark Q-I6 and Q-I7 as decided everywhere and remove the moot stop-and-ask clause (I1). Fix the driver count (I2). C2 is optional and stays as it is unless the constitution is clarified.
