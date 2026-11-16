---
analyzed_at: 2026-11-14T00:25:27Z
head: d221dd581ec3ac455d38c7056d242749e070fd44
critical: 0
high: 1
medium: 5
low: 6
coverage: 100
---

## Specification Analysis Report

Feature: `specs/013-data-display`. This is the second analysis after tasks. It reads spec.md, plan.md, tasks.md, research.md, data-model.md, contracts/elements.md, contracts/checks.md and quickstart.md against constitution 1.3.1, after two changes: the resolution of the first analysis (`reviews/analysis/fixes-1.md`) and the operator's input decisions IQ-01 to IQ-15 (commit 5ff7abe; `reviews/analysis/inputs-decisions.md`, including the two decisions recorded in d221dd5). No extension hooks are registered (`.specify/extensions.yml` has `hooks: {}`).

All 18 findings of the previous report (C1, I1, U1, U2, G1 to G9, A1, I2 to I5) are resolved as `fixes-1.md` records them. The Complexity Tracking row, the role-keyed mapping statements, the R-11 inventory steps (T002a, T022a and T036a, now done) and the added bodies and plants are all present in the artifacts. The findings below are new, and they come from the input decisions.

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| I1 | Inconsistency | HIGH | spec.md:577-578 (FR-009), 592-593 (FR-013), 438-442 (edge case "Grid layout with long labels or values"); reviews/analysis/inputs-decisions.md:29-31; research.md:365-367 (R-03) | FR-009 says without condition that the element "MUST NOT cause horizontal scrolling of the page at 320 px CSS width or at 200% zoom". FR-013 says every `layout` value keeps that rule. But the new edge case, R-03 and the operator's "Grid limits: Accept, README states" decision all say an unbroken value without `wrap="anywhere"` overflows its cell. Its visible overflow then widens the page's scrollable area. Values in the two-column and stacked layouts behave the same way: they wrap only between words without the policy. So the MUST is conditional in fact, but not in text. US1-3, US1-16 and SC-002 test it only with the policy. A reviewer can fail the phase against FR-009 as written. | Qualify FR-009, and FR-013 by reference, as the operator decided: "no horizontal page scroll for content that wraps between words or carries the wrap policy (FR-007); an unbroken value without the policy can overflow its value box or cell, and the README tells consumers to set the policy on machine values". Then FR-009, FR-013, FR-014 and the edge case say the same thing. |
| I2 | Inconsistency | MEDIUM | spec.md:330-333 (US2-11), 639-641 (FR-026); contracts/elements.md:73; research.md:474-476 (R-04); data-model.md:114; tasks.md:321 (T024a) | Terminology drift with a test consequence. The spec calls the default-slot area the "body part" ("the first paragraph starts at the body part's block start"). The public surface has a part named `body`, but that part is the whole centred column (`<div part="body" class="stack">`, contracts/elements.md "The centred column"), and the default slot sits in the internal `.text` wrapper. Read against `::part(body)`, US2-11's oracle is false: a heading and the block padding come before the first paragraph. T024a copies the ambiguous wording. | Rename the spec's term ("the body", "the default-slot area" or "the text part") in FR-026, US2-11 and T024a. Say that the oracle reads the `.text` wrapper's box, or the first and last slotted element's edges, not `part="body"`. Alternatively rename the public part, which is a surface change for the operator. |
| I3 | Inconsistency | MEDIUM | spec.md:760-762 (SC-001), 736-746 (FR-058); research.md:1074, 1096, 1100 (R-11) and the "Consumer's" rows | SC-001 requires "for every `.sk-facts`, `.sk-empty-state` and `.sk-progress` variant … an element and variant that replaces it". R-11, which carries the operator's decisions, maps three variants to "Not this mission": facts value mono, empty-state inline and empty-state card dashed. It maps many others to "Consumer's" (a remedy outside the element). FR-058 allows such rows ("a variant no element or variant covers goes to the operator"). SC-001's wording does not, so T054's review check cannot pass as SC-001 is written. | Reword SC-001: every inventoried variant has a mapping row that names the element and variant, or the consumer's remedy, or "not this mission" with the operator's decision. Leave FR-058 as it is. |
| G1 | Coverage Gap | MEDIUM | spec.md:633-638 (FR-025: "between the visual and the heading"); research.md:494-511 (R-04 gap table: visual→eyebrow, eyebrow→text); tasks.md:319-322 (T024a); contracts/checks.md:258-259 | No body puts a visual and an eyebrow in one element, so nothing checks that the eyebrow sits below the visual, in layout or in accessibility-tree order, or that the visual→eyebrow gap applies. No body has an eyebrow followed by body text without a heading, so the eyebrow→text gap (`space-2`, panel `space-3`) is untested. US2-10, "eyebrow only" and "eyebrow plus actions" all have no visual and no eyebrow→text pair. If the template put the eyebrow above the visual, every planned test would still pass. | Add a body to T024a and checks.md § Extra scenario bodies: a visual, an eyebrow, a heading and a body in markup out of order. Assert the order visual, eyebrow, heading in the column and in the accessibility tree, and the visual→eyebrow gap in both variants. Add an eyebrow plus body text with no heading, asserting the eyebrow→text gap. |
| G2 | Coverage Gap | MEDIUM | spec.md:602-606 (FR-014: spacing from `--ocelle-space-*`, no ground, divider or border); research.md:355-367 (R-03: column gap `space-4`, label-to-value `space-1`); contracts/checks.md:107-120, 281-334 (§ CSS-only behaviours); tasks.md:161-170 (T004a) | The CSS-only table has rows for the grid tracks, the cell, the compact row gap and right-to-left. It has none for the grid's label-to-value gap (`space-1` as a `<dt>` margin), its column gap value (`space-4`) or FR-014's "paints no ground, divider or border". US1-13's oracle needs only the `<dt>` block end "at or above" the `<dd>` block start, so removing the margin passes. Stryker does not mutate `css` templates, and the plan's own rule (PLAN-TESTABILITY-1-008) needs a plant or a stated reason for each CSS-only behaviour. | Add the label-to-value gap and the column gap as exact token values to US1-13's geometry oracle. Add a read of the sheet's background and borders (transparent, none) beside a non-default value on a sibling, or record a reason. Add the rows to § CSS-only behaviours, and a plant for the `<dt>` margin. |
| U1 | Underspecification | LOW | reviews/analysis/inputs-decisions.md:29-31 ("A grid sheet in a shrink-to-fit host is four cells wide unless given an inline size"); research.md:261-262 (R-02); tasks.md:213 (T010a); spec.md:594-606 (FR-014), 566-577 (FR-009) | In a shrink-to-fit host a grid sheet takes four tracks as wide as its widest cell, which makes a dialog wide even with one or two pairs. The operator accepted this and said the README says so. T010a asserts the statement, but no spec text records the behaviour or the README duty. FR-009 lists the README's duties for the other layouts only. | Add one sentence to FR-014 or to the edge case "Grid layout with few or many facts": in a shrink-to-fit host the grid sheet is four tracks wide, and the README tells consumers to give it an inline size. |
| G3 | Coverage Gap | LOW | spec.md:463-466 (edge case "Empty-state body with inline content"); research.md:536-541 (R-04 Body); tasks.md:319-322 | The edge case says each run of assigned text in the default slot becomes its own block, so text, a link and more text placed directly in the slot stack as three lines. This changes how consumers' current markup looks. Only a README statement (T026a) covers it, and no body asserts it. | Add to US2-11's body, or to a body of its own, a default slot holding "text `<a>` text": three block boxes separated by `--ocelle-space-2`. Pair it with a single `<p>` holding the same content on one line box. |
| G4 | Coverage Gap | LOW | research.md:910-911 (R-08 progress stories: "labelled, labelled compact, value text"); spec.md:674-678 (FR-035); constitution.md:79-80 | IQ-13 (b) adds a visible layout: the value text at the inline end of the label row, at the default size and in compact. R-08 does not say whether the "value text" story uses `show-label`, or whether any compact story shows value text. Without that, the new look has no baseline (Principle V: a story per variant and per state). | In R-08 and T049, state that the "value text" story is labelled (`show-label`) at the default size and that "labelled compact" carries `value-text`, or add those two stories. |
| I4 | Inconsistency | LOW | tasks.md:563 (Implementation strategy); spec.md:205; research.md R-11 ("Corrected counts") | The tasks' MVP line says phase 1 "replaces 34 `.sk-facts` uses". 34 is the raw text-match count, and the spec and R-11 give 8 rendered uses. | Change it to "8 rendered uses (34 text matches)". |
| I5 | Inconsistency | LOW | tasks.md:98-104 (Phase 1 Independent Test) | The phase 1 Goal now includes US1-13 to US1-19, but its Independent Test still covers only the two-column and stacked layouts. Quickstart step 2 and plan § Phases name the grid. | Add a `layout="grid"` check to the Independent Test, for example four cells at 1280 px, one at 320 px and one description list. |
| A1 | Ambiguity | LOW | spec.md:199, 537 (FR-005 "two-column grid"), 429-431 ("grid parent"), 414 ("grid `auto` track"); tasks.md:245 (T014 "Grid `fit-content(50%) minmax(0, 1fr)`"); spec.md:594 (FR-014 `layout="grid"`) | "Grid" now names three things: the CSS grid every layout uses (the "two-column grid"), a consumer's grid parent, and the public `layout="grid"` value. T014's "Grid `fit-content(50%) …`" (the two-column tracks) sits next to T014a's `layout="grid"`, which invites misreading during implementation. | Use "the grid layout" or `layout="grid"` only for the value. Use "two-column tracks" in T014 and "two-column layout" in FR-005 and US1. |

**Coverage Summary Table:**

| Requirement Key | Has Task? | Task IDs | Notes |
|-----------------|-----------|----------|-------|
| FR-001 conventions | Yes | T002, T013, T014, T017, T020, T022, T029, T036, T046 | |
| FR-002 no class, no `sk-` | Yes | T010, T021, T026, T034, T043, T052 | Role-keyed mapping statements (decision I1) |
| FR-003 pairs as `ocelle-fact` | Yes | T004, T005, T013, T014 | |
| FR-004 description list | Yes | T001, T001a, T004, T004a, T014, T014a | Grid groups measured in T001a, stop for the operator on failure |
| FR-005 stacking threshold | Yes | T001, T004, T005, T014 | |
| FR-006 value and label type | Yes | T004 (US1-5 with label type), T014 | |
| FR-007 wrap policy | Yes | T004, T004a, T005, T010a, T013 | |
| FR-008 density | Yes | T004a, T005, T009, T014, T016 | |
| FR-009 shrink-to-fit, no h-scroll | Yes | T001, T001a, T004, T005, T014, T014a | See I1 |
| FR-010 no pairs | Yes | T005, T014 | |
| FR-011 no event, no tab stop | Yes | T004, T004a (US1-19) | |
| FR-012 pre-upgrade rule | Yes | T009, T016 | |
| FR-013 `layout` | Yes | T004, T004a, T014, T017 | See I1 |
| FR-014 grid layout | Yes | T001a, T004a, T008a, T010a, T014a, T018a, T020a, T021a | See G2, U1 |
| FR-020 slots, heading rule | Yes | T024, T024a, T029, T029a, T030 | |
| FR-021 default rhythm | Yes | T024, T029, T039 | |
| FR-022 panel variant | Yes | T024, T024a, T029 | |
| FR-023 empty and hidden slots | Yes | T024, T024a, T029, T029a | |
| FR-024 no landmark, no tab stop | Yes | T024 | |
| FR-025 eyebrow slot | Yes | T024a, T026a, T029a, T031a, T033a, T034a | Order below the visual and eyebrow→text gap untested (G1) |
| FR-026 body spacing | Yes | T024a, T026a, T029a, T031a, T034a | See I2, G3 |
| FR-030 one progressbar, name | Yes | T037, T038, T046 | |
| FR-031 `value-text` | Yes | T035, T038, T046 | |
| FR-032 value rules | Yes | T038, T046 | |
| FR-033 bounded sweep, episodes | Yes | T037, T038, T043, T044, T046 | |
| FR-034 sizes | Yes | T038, T046 | |
| FR-035 labelled variant, value text row | Yes | T038, T038a, T046, T046a, T052a | Baseline coverage unclear (G4) |
| FR-036 contrast marks | Yes | T038, T041, T046 | |
| FR-037 forced colours | Yes | T038, T046 | |
| FR-038 right-to-left | Yes | T038, T046 | |
| FR-039 no slot, no tab stop, README | Yes | T038, T038a, T043a, T046a, T051a, T052a | |
| FR-040 tokens only when needed | Yes | T041, T052 | No token added (R-07) |
| FR-050 stories | Yes | T018, T018a, T031, T031a, T049 | Recorded exception (Complexity Tracking) |
| FR-051 baselines and #10 gates | Yes | T019, T021, T032, T034, T050, T052, T055 | |
| FR-052 both harnesses | Yes | T006, T025, T040 | |
| FR-053 320 px reflow | Yes | T004, T004a, T011 | |
| FR-054 manifest | Yes | T017, T030, T048 | |
| FR-055 strict CSP | Yes | T006, T021, T034, T052 | |
| FR-056 README conventions | Yes | T010, T020, T026, T033 | |
| FR-057 changelog | Yes | T016, T020, T020a, T033, T033a, T051, T053, T053a | |
| FR-058 README mapping | Yes | T010, T010a, T020, T020a, T026, T026a, T033, T033a, T043, T043a, T051, T051a, T054 | |
| SC-001 mapping covers inventory | Yes | T054 | See I3 |
| SC-002 320 px stories | Yes | T011 | Grid stories included |
| SC-003 axe on stories | Yes | T021, T034, T052, T055 | |
| SC-004 contrast | Yes | T021, T034, T041, T052 | |
| SC-005 reduced motion stories | Yes | T011, T027, T044 | |
| SC-006 red/green, mutation | Yes | T012, T021, T028, T034, T045, T052 | |
| SC-007 gates pass | Yes | T021, T034, T052 | |

**Constitution Alignment Issues:** none.

- Principle V: the one exception, the three story-less states, is now a Complexity Tracking row with scope, rationale, a sunset and the operator's approval (tasks gate, C1). The grid layout, the eyebrow and the several-paragraph body have stories (R-08, T018a, T031a). G4 asks only that R-08 state which story carries the value-text row.
- Principle VII: the two surface additions (`layout="grid"`, the `eyebrow` slot) were chosen by the operator and are listed as MINOR, with changelog tasks (T020a, T033a, T053a).
- Principle II: the eyebrow is sans with existing tokens and no monospace, `ink-muted` is a declared text row on every main ground, and the grid's four tracks fall under the recorded R-10 allowance (T008a proves it).
- Principles I, III, IV, VI and VIII hold. The grid adds no part, slot or hook. FR-004 holds in the grid, with a spike stop. The fallback text is neither shown nor exposed. The new behaviour (T004a, T024a, T038a) is red first, and its plants are T021a, T034a and T052a.

**Unmapped Tasks:** none. The spikes (T001, T001a, T035), the scaffolds (T002, T022, T036), the inventory steps (T002a, T022a, T036a, done) and phase 4's exempt tasks (T053, T053a, T054, T055) each serve named requirements or decisions.

**Metrics:**

- Total Requirements: 48 (41 FR, 7 SC)
- Total Tasks: 78 (55 numbered, 23 suffixed)
- Coverage % (requirements with >=1 task): 100% (48/48)
- Ambiguity Count: 1
- Duplication Count: 0
- Critical Issues Count: 0

## Next Actions

- No critical issue blocks `/speckit-implement`.
- **Resolve I1 before phase 1's red commit (T012).** Qualify FR-009 and FR-013 as the operator's "Grid limits" decision already states, so that no reviewer fails a layout on an unbroken value without the wrap policy. This is a spec wording edit only: the bodies already assert with the policy.
- **Edit the spec and tasks for the medium findings:**
  - I2: rename the "body part" in FR-026, US2-11 and T024a, or say which box the oracle reads.
  - I3: reword SC-001 so that "consumer's" and "not this mission" rows count.
  - G1: add the visual-plus-eyebrow and eyebrow-plus-text bodies to T024a and contracts/checks.md.
  - G2: add the grid's label-to-value gap, column gap and no-ground or border reads to US1-13, with rows in § CSS-only behaviours.

  Edit spec.md, tasks.md and contracts/checks.md by hand, or run `/speckit-tasks` again after the spec edits.
- The low findings (U1, G3, G4, I4, I5, A1) can be folded into the same edits. None of them blocks implementation.
