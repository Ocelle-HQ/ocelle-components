---
analyzed_at: 2026-11-13T23:25:59Z
head: 3bf2ccfd970b6ffcfedd6505eb5b780f6262e414
critical: 1
high: 1
medium: 8
low: 8
coverage: 100
---

## Specification Analysis Report

Feature: `specs/013-data-display` (spec.md, plan.md, tasks.md, research.md, data-model.md, contracts/elements.md,
contracts/checks.md, quickstart.md), checked against constitution 1.3.1. No extension hooks are registered
(`.specify/extensions.yml` has `hooks: {}`).

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| C1 | Constitution Alignment | CRITICAL | plan.md:108, plan.md:366-376; spec.md:544-551 (FR-050); research.md:444-445, 710; constitution.md:79-80, 202-203 | Constitution V requires a story per variant and per state. Three supported states have no story: the unnamed progress (US3-11), the host-`aria-label` progress (US3-10), and `ocelle-fact` outside `ocelle-facts`. Plan Constitution Check V calls the first two "excepted", but Complexity Tracking says "No exception", and the host-`aria-label` exclusion is not in spec FR-050 at all (only R-05). The constitution requires every exception to a principle to have a Complexity Tracking row with scope, rationale and a sunset condition, plus the operator's approval. | Add a Complexity Tracking row that covers the three story-less states, giving scope, rationale (axe `aria-progressbar-name` by design; axe false `aria-prohibited-attr` with ElementInternals; standalone fact proven by browser tests) and a sunset (for example, when axe reads ElementInternals ARIA), and get the operator's approval. Alternatively, the operator rules explicitly that these are not "states" in Principle V's sense. Extend FR-050 to name the host-`aria-label` exclusion. |
| I1 | Inconsistency | HIGH | tasks.md:172 (T010), 269 (T026), 374 (T043); contracts/elements.md:126-128; gates/bin/prefix.ts:1-2, 29, 64; spec.md:385-386 (FR-002) | The README-mapping statements for FR-058 go into `packages/elements/test/node/readme.test.ts` in each red commit and name `.sk-facts`, `.sk-empty-state` and `.sk-progress`. The `prefix` gate scans test code below `packages/<name>/` (Markdown excluded), and its regex matches `sk-` after a `.`, so these statements fail `gate:prefix` in T021, T034 and T052. FR-002 also forbids `sk-` names in source. No existing test names an `sk-` string. Building the string indirectly would get around the gate rather than satisfy it. | Before phase 1's red commit, the operator or planner decides how the mapping is proven: for example, a recorded and planted `prefix` scope rule for README-statement tests, mapping statements that name roles without the `sk-` string, or SC-001 checked in review only (as T054 already does). Record the decision in plan/research R-11 and contracts/checks.md § Gates touched. |
| U1 | Underspecification | MEDIUM | research.md:837-841 (R-11 table, all "pending"); tasks.md:58-59, 172, 269, 374; plan.md:139-149 | The kitty-mission-ui inventory that FR-058 and SC-001 need is still pending. No task records it in R-11 or names who does. T010, T026 and T043, and therefore the red commits T012, T028 and T045, cannot start without it. | Add a task (or a named operator step) before T010 that records the `.sk-facts` rows in R-11, and the same before T026 and T043. Treat the inventory as a known blocker for T012. |
| G1 | Coverage Gap | MEDIUM | spec.md:451-452 (FR-010), 316-317 (edge case); research.md:63; data-model.md:66; tasks.md:190 (T014); contracts/checks.md:141-177 | FR-010 says the no-pairs exposure "is set in the plan and tested". The plan sets it (no `<dl>`) and T014 implements it, but no body in T004/T005 or checks.md § Extra scenario bodies renders a sheet with no pairs, or asserts that nothing throws and nothing is exposed. | Add a no-pairs body to T005 and checks.md: nothing visible, no list in the AX tree, no exception. Pair it with a positive (one pair added gives a list). |
| G2 | Coverage Gap | MEDIUM | tasks.md:217 (T021 plant `fit-content(50%)`→`auto`); contracts/checks.md:208 ("long-label body"); spec.md:341-342 (edge case "Very long label"), 418-419 (FR-005) | The plant for the 50% label-column cap needs a "long-label body", which checks.md names, but neither T004 nor T005 lists that body. Without it the plant has no guard to fail, and the "Very long label" edge case is untested. | Add the long-label body to T005 (label column equals 50% of the sheet, label wraps inside it, value column keeps the rest) and to checks.md § Extra scenario bodies. |
| G3 | Coverage Gap | MEDIUM | spec.md:289-290 (US3-9), 518-520 (FR-035); contracts/checks.md:228; tasks.md:340 (T038 "US3-9 checks 8 px and 4 px") | US3-9 also requires the visible label to sit above the bar at the default size and beside it at compact size (FR-035). The oracle and T038 assert only the block sizes. FR-052 requires every acceptance scenario to be covered. | Extend the US3-9 oracle (checks.md and T038): with `show-label`, the label's box is above the track at the default size and on the same line at compact size, both in one body. |
| G4 | Coverage Gap | MEDIUM | spec.md:421-424 (FR-006); research.md:288-290; contracts/checks.md:218; tasks.md:123-130 | FR-006's label rules (`--ocelle-font-sans` at a smaller step, `ink-muted`, distinct from values by size or weight) have no assertion. US1-5 and the CSS-only table cover values only. Stryker does not mutate `css` templates, so nothing guards the label type. | Add label type to the US1-5 body, or add a separate body: computed size `--ocelle-font-size-sm`, weight `--ocelle-font-weight-medium`, colour `--ocelle-color-ink-muted`, each different from the value's in the same body. |
| G5 | Coverage Gap | MEDIUM | spec.md:345-346 (edge case); research.md:499-500, 642-643; contracts/checks.md:187-199 | Edge case "Long progress label beside a compact bar at 320 px": the bar keeps `min-inline-size: var(--ocelle-measure-cell)` and nothing overflows. No body, plant or story covers it. | Add a progress body at a 320 px viewport with a long label, `size="compact"` and `show-label`: track inline size at least the `measure-cell` value, page scroll width equal to the viewport width. Add a plant that removes `min-inline-size`. |
| U2 | Underspecification | MEDIUM | tasks.md:255 (T024), 293 (T034); plan.md:308-309 | Phase 2 tests US2-7 with "a plain stand-in element", yet T034 runs the plant "`::slotted(ocelle-progress)` rule removed against the stand-in". That rule matches only an element named `ocelle-progress`. A stand-in with any other tag cannot be affected, so the plant cannot bite and the phase stops. | State in T024 and plan § Phases that the stand-in is an undefined `<ocelle-progress>` element with a fixed intrinsic width, or move this plant to phase 3 only (T052 already lists it). |
| A1 | Ambiguity | MEDIUM | plan.md:105 (Constitution Check II); research.md:486, 653; constitution.md:38-39; packages/tokens/README.md:79-80 | Constitution II says "One radius (`--ocelle-radius-2`, 4 px)", with `radius-row` for rows and cards and pill for state pills, and does not mention `radius-1`. The progress track uses `--ocelle-radius-1`. The token package's README (part of the token contract) and the brand-rules radius set do allow `radius-1` for "small marks". Whether an 8 px-high progress track counts as a small mark is not argued anywhere. | Record in R-06 why the track is a "small mark" under the token contract's `radius-1` rule, or use `--ocelle-radius-2`. If the constitution's wording should list `radius-1`, change it through `/speckit-constitution`. |
| G6 | Coverage Gap | LOW | spec.md:343-344 (edge case); contracts/checks.md:178-186; tasks.md:259 | Edge case "Long empty-state heading or body at 320 px" has no body. Only "several actions at 320 px" is tested. | Extend the 320 px empty-state body with a long heading and a long body: no page overflow, and the text wraps between words. |
| G7 | Coverage Gap | LOW | spec.md:533 (FR-039); tasks.md:332-352 | FR-039 says progress "adds no tab stop", but no progress body asserts it. (FR-011 and FR-024 have their tab-stop bodies.) | Add a Tab assertion to a progress body (focus passes over the bar to a following button), paired with that positive. |
| G8 | Coverage Gap | LOW | spec.md:496-499 (FR-032); research.md:465-468; tasks.md:332-352 | FR-032's `value=""` and whitespace-only cases (indeterminate, not 0), and the property set to `null`, are implemented (T046) but not named in T038 or checks.md. US3-6 lists only below 0, above max, NaN and `max` ≤ 0. | Name these cases in the US3-6 body or the value-removed body. |
| G9 | Coverage Gap | LOW | tasks.md:173 (T011), 270 (T027); contracts/checks.md:292-293 | In phases 1 and 2 the SC-005 reduced-motion story check on facts and empty-state stories has no positive animation read, because the indeterminate progress story arrives in phase 3. Only the `matchMedia` assertion pairs it. Elements that never animate pass trivially until then. | Note in T011 and T027 that the animation positive arrives in T044, or pair the check earlier with a story-test fixture that animates. |
| I2 | Inconsistency | LOW | tasks.md:218 (T021), 294 (T034), 423 (T052); quickstart.md step 5; constitution.md:196-201 | `gate:contrast` is in phase 3's check list and quickstart step 5 but not in phases 1 and 2, although US1-8 and US2-8 rely on the existing text rows. | Add `gate:contrast` (expected unchanged) to T021 and T034. |
| I3 | Inconsistency | LOW | spec.md:38-42, 178-180 | Stale wording. The spec still says "The plan's research MUST read those six issues", although the operator waived four of them ("Proceed, inputs later"). US1-6 still says "subject to the operator's decision after the plan's measurement", although FR-004 was confirmed at the plan gate. | Reword both to reflect the recorded operator decisions. |
| I4 | Inconsistency | LOW | plan.md:115-161 | "Decisions the operator should see" are numbered 1-5, 8, 9, 6, 7. | Renumber in document order. |
| I5 | Inconsistency | LOW | plan.md:35-36; contracts/elements.md:85; spec.md:300, 527-528 | The plan summary and the `ground` manifest description say "hover", while the spec, R-06 and Decision 4 say "hover-bg". | Use `hover-bg` throughout, as in the token name. |

**Coverage Summary Table:**

| Requirement Key | Has Task? | Task IDs | Notes |
|-----------------|-----------|----------|-------|
| FR-001 conventions | Yes | T002, T013, T014, T017, T020, T022, T029, T036, T046 | |
| FR-002 no class, no `sk-` | Yes | T021, T034, T052 (`gate:prefix`) | See I1 |
| FR-003 pairs as `ocelle-fact` | Yes | T004, T005, T013, T014 | |
| FR-004 description list | Yes | T001, T004, T014 | Spike recheck before red |
| FR-005 stacking threshold | Yes | T001, T004, T005, T014 | |
| FR-006 value and label type | Partial | T004 (US1-5), T014 | Labels untested (G4) |
| FR-007 wrap policy | Yes | T004, T005, T013 | |
| FR-008 density | Yes | T005, T009, T014, T016 | |
| FR-009 shrink-to-fit, no h-scroll | Yes | T001, T004, T005, T014 | |
| FR-010 no pairs | Yes | T014 | No body (G1) |
| FR-011 no event, no tab stop | Yes | T004 | |
| FR-012 pre-upgrade rule | Yes | T009, T016 | |
| FR-013 `layout` | Yes | T004, T014 | |
| FR-020 slots, heading rule | Yes | T024, T029 | |
| FR-021 default rhythm | Yes | T024, T029, T039 | |
| FR-022 panel variant | Yes | T024, T029 | |
| FR-023 empty and hidden slots | Yes | T024, T029 | |
| FR-024 no landmark, no tab stop | Yes | T024 | |
| FR-030 one progressbar, name | Yes | T037, T038, T046 | |
| FR-031 `value-text` | Yes | T035, T038, T046 | Oracle depends on T035 |
| FR-032 value rules | Yes | T038, T046 | Empty-attribute cases unnamed (G8) |
| FR-033 bounded sweep, episodes | Yes | T037, T038, T043, T044, T046 | |
| FR-034 sizes | Yes | T038, T046 | |
| FR-035 labelled variant | Partial | T038 (US3-10), T046 | Position untested (G3) |
| FR-036 contrast marks | Yes | T038, T041, T046 | |
| FR-037 forced colours | Yes | T038, T046 | |
| FR-038 right-to-left | Yes | T038, T046 | |
| FR-039 no event, no tab stop | Yes | T038 (US3-2) | Tab stop unasserted (G7) |
| FR-040 tokens only when needed | Yes | T041, T052 | No token added (R-07) |
| FR-050 stories | Yes | T018, T031, T049 | See C1 |
| FR-051 baselines and #10 gates | Yes | T019, T021, T032, T034, T050, T052, T055 | |
| FR-052 both harnesses | Yes | T006, T025, T040 | |
| FR-053 320 px reflow | Yes | T004, T011 | |
| FR-054 manifest | Yes | T017, T030, T048 | |
| FR-055 strict CSP | Yes | T006, T021, T034, T052 | |
| FR-056 README conventions | Yes | T010, T020, T026, T033 | |
| FR-057 changelog | Yes | T016, T020, T033, T051, T053 | |
| FR-058 README mapping | Yes | T010, T020, T026, T033, T043, T051, T054 | Blocked on R-11 (U1); see I1 |
| SC-001 mapping covers inventory | Yes | T054 | Blocked on R-11 (U1) |
| SC-002 320 px stories | Yes | T011 | |
| SC-003 axe on stories | Yes | T021, T034, T052, T055 | |
| SC-004 contrast | Yes | T041, T052 | See I2 |
| SC-005 reduced motion stories | Yes | T011, T027, T044 | See G9 |
| SC-006 red/green, mutation | Yes | T012, T028, T045, T021, T034, T052 | |
| SC-007 gates pass | Yes | T021, T034, T052 | |

**Constitution Alignment Issues:**

- C1 (Principle V and the Complexity Tracking rule of Development Workflow): the story-less states are an unrecorded
  exception. The fix is a record and an operator decision, not a design change.
- A1 (Principle II, radius) is reported as an ambiguity, not a violation. The token contract, which Principle II makes
  binding, allows `radius-1` for small marks.
- No other conflict found. Principles I, III, IV, VI, VII and VIII are met by the plan as written: no I/O, no events,
  no cross-root ID reference, CSSOM width writes under strict CSP, red-first phases with scaffolds and plants, and
  mutation testing.

**Unmapped Tasks:** none. T001 and T035 (spikes), T002, T022 and T036 (scaffolds), and T053 to T055 (exempt
documentation and gate runs) each serve named requirements or decisions.

**Metrics:**

- Total Requirements: 45 (38 FR, 7 SC)
- Total Tasks: 55
- Coverage % (requirements with >=1 task): 100% (45/45; FR-006 and FR-035 only partly tested)
- Ambiguity Count: 1
- Duplication Count: 0
- Critical Issues Count: 1

## Next Actions

- **Resolve C1 before `/speckit-implement`.** Add a Complexity Tracking row in plan.md for the three story-less states,
  with scope, rationale and a sunset, and get the operator's approval (or the operator's explicit ruling that they are
  not Principle V states). Extend FR-050 for the host-`aria-label` state.
- **Resolve I1 before phase 1's red commit (T012).** The operator or planner decides how the FR-058 mapping is proven
  without `sk-` strings in test code, or how the `prefix` gate treats them. Then update tasks T010, T026 and T043 and
  contracts/checks.md.
- **Supply the R-11 inventory (U1).** The `.sk-facts` rows are needed before T010/T012. Add a task or named step that
  records each family's rows.
- **Edit tasks.md and contracts/checks.md for the medium coverage gaps:** G1 (no pairs), G2 (long label), G3 (label
  position), G4 (label type), G5 (compact bar at 320 px) and U2 (stand-in tag). Run `/speckit-tasks` again, or edit the
  files by hand, after the plan and contract edits. A1 needs one sentence in R-06, or a change to `radius-2`.
- The low findings (G6 to G9, I2 to I5) can be folded into the same edits. None of them blocks implementation.
