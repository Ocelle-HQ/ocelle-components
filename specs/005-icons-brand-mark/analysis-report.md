---
analyzed_at: 2026-11-10T10:24:22Z
head: 57cad2cf9fe3db5c264a6610746975b2aafd2761
critical: 1
high: 0
medium: 7
low: 9
coverage: 100
---

## Specification Analysis Report

Feature: `specs/005-icons-brand-mark` (spec.md, plan.md, research.md, data-model.md, contracts/, quickstart.md,
tasks.md), checked against constitution 1.3.1. `.specify/extensions.yml` registers no `before_analyze` or
`after_analyze` hook (`hooks: {}`).

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| C1 | Constitution | CRITICAL | plan.md:L291 (Complexity Tracking row 2); constitution § Development Workflow ("recorded ... with scope, rationale and a sunset condition"); 002 analysis C1 (precedent) | Complexity Tracking's second row says the fixture suites and the build and pack tests are not mutated. Its sunset is "none (structural, as `styles-browser` in 003)". Governance requires every exception in that table to have a sunset condition, and "none" is not one. The cited precedent does not match: 003's plan has no such row and says Complexity Tracking gains no row. The plan also argues that element source *is* mutation-tested in-process, which would make this a reading of VIII, not an exception. So the plan contradicts itself on whether an exception is taken. This is the same pattern as 002's C1. | Before `/speckit-implement` the operator rules, and the plan records the ruling. Choose one. (a) It is an exception: give it a real sunset condition, for example "when Stryker can instrument the fixture harness" or "reviewed when #10 adds the visual baselines". (b) It is a reading: VIII's "changed source" means `packages/elements/src/**`, which is mutated, and test code and tool-run build tests are not source. State the reading in the Constitution Check VIII row, as 003 did, and remove the row from Complexity Tracking. |
| F1 | Inconsistency | MEDIUM | tasks.md:L108 (T014), L109 (T015), L121 (T024); spec.md:L256-261 (US1-10); research.md R-02 | T014 says "`ocelle-brand-mark` is a stub until phase 5", but no task creates a stub. T024 creates only `ocelle-icon.ts`, `index.ts` and `browser.ts`, and research R-02 has no stub. In phase 2, US1-10 (T015) asserts that `customElements.get("ocelle-brand-mark")` is still the first bundle's class. That fails, or passes vacuously against `undefined`, when no brand-mark is defined. The tasks also leave open whether phase 2's `exports` already lists `./ocelle-brand-mark.js`, and whether the manifest gate (which reads `src/ocelle-*.ts`) sees a stub. No task in phase 5 returns to US1-10's brand-mark half. | Decide one. (a) Phase 2 has no brand-mark: US1-10 asserts only `ocelle-icon` there, and T052 extends the US1-10 fixture test to `ocelle-brand-mark`. (b) Phase 2 ships a named stub module: add it to T024, with its manifest entry and `exports` stated. Remove the contradictory wording from T014. |
| F2 | Inconsistency | MEDIUM | tasks.md:L230-232 (Dependencies); spec.md:L367 (US3-1 `folder`), L420 (US3-10 `arrow-end`), L431 (US3-11) | Dependencies says phases 3, 4 and 5 "depend only on phase 2 and on nothing in each other". But phase 4's scenarios slot `folder` and `arrow-end`, which are drawn only in phase 3 (T037), and US3-11 asserts that both slotted icons draw. Phase 4 therefore depends on phase 3's drawings, not only on shared files. | State that phase 4 depends on phase 3 (the `folder` and `arrow-end` drawings), or have phase 4's scenarios use only `close`/`menu`. |
| I1 | Inconsistency | MEDIUM | spec.md:L340-343 (US2-4); plan.md:L124-126 (decision 11); research.md R-08; tasks.md:L143 (T031) | The spec defines "equals" for the mirroring pixel test as "the per-channel tolerance for anti-aliasing the plan names, and no more". The plan's rule is a pixel-count rule: at most 1 % of pixels over 32/255 and none over 96/255. That admits per-channel differences up to 96/255 on a share of pixels, and a "differs" threshold the spec does not mention. These are two different oracles for one acceptance scenario. | Align them. Either the spec says "the pixel rule the plan names" (count and per-channel thresholds), or the plan reduces to a pure per-channel tolerance. Running `/speckit-specify` to refine US2-4's wording is the smaller change. |
| G1 | Coverage | MEDIUM | spec.md:L798-809 (SC-002, SC-004); tasks.md:L107 (T013), L147 (T032) | SC-004 requires that, in forced colours, 100 % of the painted parts of *every icon* use the context's system colour. SC-002 requires *every icon* to measure exactly the icon size. Forced colours (US1-7) and size (US1-1/2) are tested only for `close` in phase 2. US3-8 covers one slotted icon. T032, which adds the other twelve, checks drawing data, painted area, distinctness and mirroring, but not forced-colour paint or box size per name. | Add to T032 a per-name loop that runs US1-2's box and US1-7's forced-colour contexts over all thirteen names. Or narrow SC-002 and SC-004 to "the set's shared rendering, shown on `close`", with the reason. |
| G2 | Coverage | MEDIUM | spec.md:L741-742 (FR-034 "An unknown icon name still exposes nothing"); spec.md:L248-253 (US1-8); data-model.md:L43-51 | FR-034 states that an unknown `name` exposes nothing *even with a host `aria-label`*. No scenario or task tests that combination. US1-8 covers an unknown name with `label` only. R-13 measured that Chromium names the host from a present `aria-label` "whatever the element sets". Without a test, it is unproven that internals `ariaHidden` still hides an unknown-name icon whose host `aria-label` is non-empty. | Add to US1-8 (T013) an unknown-name icon with `aria-label="Close"`, paired with a known-name twin that exposes one image node, and name the plant ("drawable ignored when the host `aria-label` names it"). |
| G3 | Coverage | MEDIUM | spec.md:L486-490 (US4-9), L620-621 (FR-010); tasks.md:L204 (T051) | US4-9 also requires that the mark's drawing contain none of the reference's literal colours, its rounded square, a `style` attribute or an `id`. FR-010 bans `href`, `xlink:href`, `<use>`, `<image>`, `<foreignObject>`, `<script>` and event-handler attributes in *every* rendered drawing. T051 lists only the geometry comparison for US4-9. T032 applies the FR-010 list to icons only, so no task applies it to the rosette. | Extend T051's US4-9 body to the forbidden-content half and to FR-010's full list for `rosette.ts`'s rendered drawing, paired with the positive geometry assertion in the same test. |
| G4 | Coverage / Constitution VIII | MEDIUM | spec.md:L272-274 (US1-13), L492-493 (US4-11), L665-669 (FR-019); tasks.md:L125 (T028), L156 (T038), L217 (T061), L85 (T010), L157 (T039) | No test proves that the Storybook holds stories for every icon, the labelled and unknown-name states, and the mark's variants in light and dark. The tasks also record no VIII exemption for the stories: T010 and T039 name other items. The csp and prefix gates check the stories' markup but not that the stories exist. | Either add a story-inventory assertion (for example a node test over the built Storybook index, red first), or list the stories under the phase's `tdd-exempt.md` with the reason no test could fail for them. |
| L1 | Inconsistency | LOW | plan.md:L60-61 (Scale/Scope) | "1 approved install script" contradicts the two approvals (`rs-module-lexer@2.9.0`, `fsevents@2.3.3`) everywhere else. | Change it to "2 approved install scripts". |
| L2 | Inconsistency | LOW | plan.md:L190 (structure tree), L213 ("the four pins plants"); tasks.md:L80 (T005); contracts/checks.md:L28 | The plan's tree lists three pins plants. Its phase text says four. T005 and the contract add `fail-allow-builds-unpinned-fsevents` as the fourth. | Add `fail-allow-builds-unpinned-fsevents` to the plan's tree. |
| L3 | Inconsistency | LOW | plan.md:L65-66 | The Constitution Check says it was re-checked "after plan squad rounds 1 and 2". Round 3 changed the design too (the token pin, percentage sizes, `calc()`). | Say "rounds 1 to 3". |
| L4 | Underspecification | LOW | tasks.md:L205 (T052 `entry-brand-mark.test.ts`), L207 (T054 `test/node/fixtures/pairs-missing-row.json`); plan.md:L173-180; contracts/checks.md:L35 | The tasks name two test files that the plan's structure and the package-tests contract do not list. Both are sound additions. | List them in the plan's tree and in contracts/checks.md § Package tests. |
| L5 | Inconsistency | LOW | spec.md:L193, L459-461, L717-719 ("the mark's stylesheet as shipped"); tasks.md:L207 (T054 "read from `ocelle-brand-mark.ts`'s style template") | The spec ties the pairing test to the stylesheet *as shipped*. T054 reads the source template. The two are the same CSS only if the build does not rewrite it. | State which file is read. If it is the source, note that the build does not transform the `css` template, or read `dist/ocelle-brand-mark.js`. |
| L6 | Coverage | LOW | tasks.md:L158 (T040), L186 (T049); spec.md FR-004, FR-019 | Phase 3 changes the stories (T038) and the element source, and phase 4 adds `icon-slot.ts` to built output. Neither phase's gate run includes `gate:csp` or `gate:prefix`, so the Storybook and built-output checks of FR-004 and FR-019 run only in phases 2 and 5. | Add `gate:csp` and `gate:prefix` to T040 and T049. |
| L7 | Coverage | LOW | spec.md:L108-109, L846-847 (WebKit open limitation in README), L585-588 (FR-002 "the README lists every entry point"); tasks.md:L114 (T020), L209 (T056) | The readme test does not assert two README statements. One is that WebKit is unmeasured, an open limitation. The other is the README's list of entry points: T020 asserts the CHANGELOG's list, and T056 does not add `@ocelle/elements/ocelle-brand-mark.js` to any README assertion. | Add both statements to the readme test (T020, and T056 for the brand-mark entry point). |
| L8 | Coverage | LOW | spec.md:L480-482 (US4-7 "and in a flex row beside it"); tasks.md:L204 (T051) | T051 lists the column flex case of US4-7 but not the flex-row case. | Add the flex-row measurement to T051. |
| L9 | Ordering | LOW | tasks.md:L121 (T024 `files`, browser build), L110 (T016 banner), L216 (T060 Lit entry, `NOTICE`); spec.md FR-029, FR-030 | From phase 2 to phase 4, the packed browser build holds Lit and its banner points to `THIRD_PARTY_NOTICES`, but that file has no Lit entry and the package has no `NOTICE` until phase 5. Nothing is published before the feature merges, but each phase is folded on its own. | Either move the Lit entry, the licence file and `NOTICE` into phase 2 with the browser build, or note in phase 2 that the records land in phase 5 before any release. |

**Coverage Summary Table:**

| Requirement Key | Has Task? | Task IDs | Notes |
|-----------------|-----------|----------|-------|
| FR-001 lit-pinned | Yes | T008, T016, T030 | production Lit asserted in T016 |
| FR-002 entry-points | Yes | T014, T016, T024, T052 | README list of entry points (L7) |
| FR-003 shared-static-styles | Yes | T013, T024, T030 | US1-14 |
| FR-004 no-inline-built-output | Yes | T016, T030, T063 | csp gate not in phases 3, 4 (L6) |
| FR-005 no-io-no-request | Yes | T013, T015 | |
| FR-006 guarded-define | Yes | T014, T015 | US1-10 brand-mark half (F1) |
| FR-007 manifest-generated | Yes | T017, T025, T054 | |
| FR-008 readme-conventions | Yes | T020, T029 | |
| FR-009 manifest-gate | Yes | T018, T026 | |
| FR-010 drawing-content-ban | Partial | T032 | mark not covered (G3) |
| FR-011 icon-box | Yes | T013 | |
| FR-012 currentColor | Yes | T013, T032 | |
| FR-013 unlabelled-hidden | Yes | T013, T043 | |
| FR-014 label-naming | Yes | T013 | |
| FR-015 forced-colours-icon | Yes | T013, T043 | close only (G1) |
| FR-016 unknown-name | Yes | T013, T015 | |
| FR-017 icon-set | Yes | T032, T033, T037 | |
| FR-018 own-drawings-grid | Yes | T032, T035, T039 | |
| FR-019 stories | Yes | T028, T038, T061 | no test or exemption (G4) |
| FR-020 slot-readme | Yes | T045, T048 | |
| FR-021 slot-sizing | Yes | T043, T047 | |
| FR-022 slot-robust-sizing | Yes | T043, T047 | |
| FR-023 slot-naming-test-host | Yes | T042, T043, T045 | |
| FR-024 mark-drawing-size | Yes | T051, T058 | flex row (L8) |
| FR-025 mark-variants | Yes | T051, T058 | |
| FR-026 mark-contrast-pairs | Yes | T053, T054, T059 | source vs shipped (L5) |
| FR-027 mark-forced-colours | Yes | T051 | |
| FR-028 mark-label | Yes | T051 | |
| FR-029 licence-records | Yes | T016, T035, T039, T056, T060 | ordering (L9) |
| FR-030 trademark-notice-pack | Yes | T055, T056, T060 | |
| FR-031 changelog-surface | Yes | T020, T056, T062 | |
| FR-032 skeleton-test-replaced | Yes | T021 | |
| FR-033 two-builds | Yes | T015, T016, T024 | |
| FR-034 host-aria | Yes | T013, T051, T023 | unknown name with host `aria-label` (G2) |
| SC-001 csp-zero-violations | Yes | T015, T033, T052 | |
| SC-002 icon-size-every-icon | Partial | T013, T043 | per-name size (G1) |
| SC-003 ax-tree-outcomes | Yes | T013, T043, T051 | |
| SC-004 forced-colours-every-part | Partial | T013, T043, T051 | per-name icons (G1) |
| SC-005 mark-pairs-checked | Yes | T054, T059, T063 | |
| SC-006 manifest-plants | Yes | T018, T026, T030 | |
| SC-007 slot-readme-doc-test | Yes | T035, T045 | |
| SC-008 conventions-doc-test | Yes | T020 | |

"Partial" rows have at least one task and count as covered in the coverage figure. Their gaps are the findings named
in the Notes column.

**Constitution Alignment Issues:**

- **C1 (CRITICAL)**: Complexity Tracking row 2 is listed as an exception but has no sunset condition, and the plan
  argues elsewhere that it is not an exception. See the table.
- III and V (no axe and no visual baselines for the new stories): row 1 records the exception, with #10's merge as
  the sunset. This is in order.
- I, II, IV, VI and VII: the Constitution Check's statements match the tasks. The install-script approval is recorded
  as an operator amendment to 001's policy and does not touch a constitution rule.
- VIII: every phase has a tests-only red commit. Every "does not" outcome has a pair and a named plant, and every new
  or changed gate has plants. Exemptions are written for phase 1 (T010) and US2-5 (T039). The stories are the one gap
  (G4).

**Unmapped Tasks:** none. T009 (verifying R-16), T010 (exemption record), T011 (spike) and T031 (pixel-rule
measurement) are process tasks for plan decisions 4, 3/7 and 11. T022 and T012 serve the test harness (R-11).

**Metrics:**

- Total requirements: 42 (FR-001 to FR-034, SC-001 to SC-008)
- Total tasks: 63 (T001 to T063)
- Coverage: 100 % of requirements have at least one task (3 partial: FR-010, SC-002, SC-004)
- Ambiguity count: 1 (I1)
- Duplication count: 0
- Critical issues count: 1

## Next Actions

- **Resolve C1 before `/speckit-implement`.** The operator decides whether Complexity Tracking row 2 is an
  exception, which needs a real sunset condition, or a reading of VIII. If it is a reading, state it in the
  Constitution Check VIII row as 003 did and remove the row. Then edit plan.md by hand, or run `/speckit-plan` to
  make the change.
- These MEDIUM findings should be fixed in tasks.md before the phase they touch starts:
  - F1: brand-mark stub and US1-10 in phase 2.
  - F2: phase 4 depends on phase 3's drawings.
  - G1: per-name size and forced colours.
  - G2: unknown name with a host `aria-label`.
  - G3: forbidden content of the mark's drawing.
  - G4: test or exemption for the stories.
- I1 needs a one-line spec refinement of US2-4, by `/speckit-specify` or a hand edit, so that the spec and the plan
  name the same pixel oracle.
- The LOW findings (L1 to L9) are wording and record fixes. They can be made with the MEDIUM edits or in the phase
  that touches each file.
