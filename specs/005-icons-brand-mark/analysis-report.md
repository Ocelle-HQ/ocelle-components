---
analyzed_at: 2026-11-10T10:36:20Z
head: 5bcdcaa779aff304b4e606f195424113de729053
critical: 0
high: 0
medium: 0
low: 5
coverage: 100
---

## Specification Analysis Report

Feature: `specs/005-icons-brand-mark` (spec.md, plan.md, research.md, data-model.md, contracts/, quickstart.md,
tasks.md), checked against constitution 1.3.1. This is the second analysis after tasks. It runs after the fixes in
`reviews/analysis/fixes-1.md` (commit 5bcdcaa). The previous report was made at head 57cad2c and found 1 critical,
7 medium and 9 low. `.specify/extensions.yml` registers no `before_analyze` or `after_analyze` hook (`hooks: {}`).

New findings get new IDs (L10 onward), so they do not collide with the IDs of the previous report.

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| L10 | Inconsistency | LOW | tasks.md:L6; plan.md:L143-151 (decision 16) | The tasks' input list says "plan.md, with decisions 1 to 15". The plan now has decision 16 (the mutation scope of VIII), and tasks.md L12-14 cites the fixes that added it. | Change it to "decisions 1 to 16". |
| L11 | Coverage | LOW | tasks.md:L113 (T014 `entry-icon.test.ts`), L214 (T052); spec.md:L286-290 (US1-17); research.md:L555-559 (R-11) | In phases 2 to 4, `entry-icon.test.ts`'s "`ocelle-brand-mark` is not defined" half holds only because no brand-mark module exists. Under F1 (a), US1-17's "imports only `ocelle-icon` → the mark is not defined" first means something in phase 5. T052 extends `entry-root.test.ts` and US1-10, but it neither names this half nor runs a plant for it, such as `ocelle-icon.ts` importing `ocelle-brand-mark.ts`. The assertion is paired and stands unchanged, so it is not vacuous at red. What is missing is a record that it bites. R-11 L557 also still says that every fixture page's browser build "defines both elements", which is true only from phase 5. | In T052, state that `entry-icon.test.ts`'s mark half takes effect in phase 5, and run it once against the plant "`ocelle-icon.ts` imports `ocelle-brand-mark.ts`", recorded in `reviews/phase-5/plants.md`. Add "from phase 5" to R-11 L557. |
| L12 | Inconsistency | LOW | tasks.md:L97 (Phase 2 Goal "US1 scenarios 1 to 19"); T015, T035a, T052 | Phase 2's goal claims all of US1. Three scenarios are completed later: US1-10's brand-mark half in phase 5 (T052), US1-13's stories for every icon in phase 3 (T035a), and US1-17's root-defines-both half in phase 5 (T052). The tasks name each split where it happens, but the goal line does not, and phase 2's review reads its goal. | Change the goal to "US1 scenarios 1 to 19 for `ocelle-icon`; US1-13's full grid in phase 3, and the `ocelle-brand-mark` halves of US1-10 and US1-17 in phase 5". |
| L13 | Coverage | LOW | tasks.md:L155 (T032); spec.md:L623-624 (FR-010), L337 (US2-3) | T032's forbidden-content list for the icons names `style`, `id`, `href`, `<use>`, `<image>`, `<foreignObject>`, `<script>` and `on*`, but not `xlink:href`. FR-010 names `xlink:href`, and T051 now lists it for the mark (G3). A check that compares `href` by local name would cover it, but the task does not say so. | Add `xlink:href` to T032's list, so that the icons and the mark check the same FR-010 set. |
| L14 | Coverage | LOW | spec.md:L274-276 (US1-13 "the stories render with the base stylesheet as every story does"); tasks.md:L121 (T020a), L159 (T035a), L219 (T056a) | The new story test asserts presence, light and dark, the element's `name`/`label`, and zero CSP violations. It does not assert US1-13's base-stylesheet clause. The Storybook preview (002) applies the base stylesheet to every story, so the risk is low, but the test does not prove the clause. | Either add to T020a an assertion that the story's preview has `base.css` applied, as 002's tests check it, or record in the phase-2 review that the clause is a property of the preview configuration that this feature does not change (R-14 note). |

**Resolved since the previous report** (each checked against the current artifacts):

- **C1**: resolved as a reading of VIII. The Constitution Check VIII row (plan.md L81) states the reading and the
  operator's decision. Decision 16 records it. Complexity Tracking keeps one row with a real sunset ("the merge of
  #10"), and its note explains why the mutation scope has no row. research.md R-12 and contracts/checks.md
  § Mutation scope agree with the plan. No exception without a sunset remains.
- **F1**: resolved by option (a). No stub remains. T014, T015, T024, T052 and T058, plan phases 2 and 5, R-02
  § By phase, contracts/elements-package.md and quickstart step 1 all agree. The remaining point is L11.
- **F2**: Dependencies now records that phase 4 depends on phase 3, and plan phase 4 says the same.
- **I1**: spec US2-4 now names "the pixel rules the plan names". These match plan decision 11, research.md R-08
  and T031.
- **G1**: T032 loops over the thirteen names for US1-2's box and US1-7's forced-colour contexts. SC-002 and SC-004
  are fully covered.
- **G2**: US1-8, the pairing-table row, T013, data-model § State and R-13 all hold the unknown-name with
  host-`aria-label` case and its plant.
- **G3**: T051 checks FR-010's full list and the reference's forbidden content on the rosette, in the same test
  as the geometry assertion. data-model § Drawing agrees.
- **G4**: there is now a story test, `storybook/test/integration/elements-stories.test.ts` (T020a, T035a and
  T056a, red first). It lives in the existing `storybook-integration` project, which `vitest.mutation.config.ts`
  already excludes. `*.stories.ts` and `**/test/**` fall within the story extension's `test_pathspec`, so the red
  commits stay tests-only. The remaining point is L14.
- **L1 to L9**: all applied, in the places fixes-1.md names. L5 is resolved by a shared check that runs on both the
  source and the built `dist/ocelle-brand-mark.js`. L9 is resolved by moving the Lit records into phase 2 (T016a,
  T024a).

**Coverage Summary Table:**

| Requirement Key | Has Task? | Task IDs | Notes |
|-----------------|-----------|----------|-------|
| FR-001 lit-pinned | Yes | T008, T016, T030 | |
| FR-002 entry-points | Yes | T014, T016, T020, T024, T052, T056, T058 | brand-mark entry point in phase 5 |
| FR-003 shared-static-styles | Yes | T013, T024, T030 | US1-14 |
| FR-004 no-inline-built-output | Yes | T016, T030, T040, T049, T063 | csp gate in every phase |
| FR-005 no-io-no-request | Yes | T013, T015 | |
| FR-006 guarded-define | Yes | T014, T015, T052 | US1-10's mark half in T052 |
| FR-007 manifest-generated | Yes | T017, T025, T054 | |
| FR-008 readme-conventions | Yes | T020, T029 | |
| FR-009 manifest-gate | Yes | T018, T026 | |
| FR-010 drawing-content-ban | Yes | T032, T051 | `xlink:href` not named for icons (L13) |
| FR-011 icon-box | Yes | T013, T032 | |
| FR-012 currentColor | Yes | T013, T032 | |
| FR-013 unlabelled-hidden | Yes | T013, T043 | |
| FR-014 label-naming | Yes | T013 | |
| FR-015 forced-colours-icon | Yes | T013, T032, T043 | every name |
| FR-016 unknown-name | Yes | T013, T015 | |
| FR-017 icon-set | Yes | T032, T033, T037 | |
| FR-018 own-drawings-grid | Yes | T032, T035, T039 | |
| FR-019 stories | Yes | T020a, T028, T035a, T038, T056a, T061 | base-stylesheet clause (L14) |
| FR-020 slot-readme | Yes | T045, T048 | |
| FR-021 slot-sizing | Yes | T043, T047 | |
| FR-022 slot-robust-sizing | Yes | T043, T047 | |
| FR-023 slot-naming-test-host | Yes | T042, T043, T045 | |
| FR-024 mark-drawing-size | Yes | T051, T058 | |
| FR-025 mark-variants | Yes | T051, T058 | |
| FR-026 mark-contrast-pairs | Yes | T053, T054, T055, T059 | source and as shipped |
| FR-027 mark-forced-colours | Yes | T051 | |
| FR-028 mark-label | Yes | T051 | |
| FR-029 licence-records | Yes | T016, T016a, T020, T024a, T035, T039 | Lit records in phase 2 |
| FR-030 trademark-notice-pack | Yes | T016a, T055, T056, T060 | |
| FR-031 changelog-surface | Yes | T020, T056, T062 | |
| FR-032 skeleton-test-replaced | Yes | T021 | |
| FR-033 two-builds | Yes | T015, T016, T024 | |
| FR-034 host-aria | Yes | T013, T023, T051 | unknown name with host `aria-label` included |
| SC-001 csp-zero-violations | Yes | T015, T033, T052 | |
| SC-002 icon-size-every-icon | Yes | T013, T032, T043 | |
| SC-003 ax-tree-outcomes | Yes | T013, T043, T051 | |
| SC-004 forced-colours-every-part | Yes | T013, T032, T043, T051 | |
| SC-005 mark-pairs-checked | Yes | T054, T055, T059, T063 | |
| SC-006 manifest-plants | Yes | T018, T026, T030 | |
| SC-007 slot-readme-doc-test | Yes | T035, T045 | |
| SC-008 conventions-doc-test | Yes | T020 | |

**Constitution Alignment Issues:** none.

- VIII, mutation scope: this is now a reading of the principle, stated in the Constitution Check with the operator's
  decision (decision 16), as 003 did. It is no longer an exception without a sunset.
- III and V (no axe and no visual baselines for the new stories): Complexity Tracking row 1 records the exception,
  with #10's merge as the sunset. This is in order.
- I, II, IV, VI and VII: the Constitution Check's statements match the tasks.
- VIII: every phase has a tests-only red commit, and the story test now covers V's per-story requirement. Every
  "does not" outcome in the spec table has a pair and a named plant. Exemptions are written for phase 1 (T010) and
  US2-5 (T039).

**Unmapped Tasks:** none.

- Process tasks for plan decisions 4, 3/7 and 11: T009 (verifying R-16), T010 (exemption record), T011 (spike) and
  T031 (pixel-rule measurement).
- Test-harness tasks (R-11): T012 and T022.

**Metrics:**

- Total requirements: 42 (FR-001 to FR-034, SC-001 to SC-008)
- Total tasks: 68 (T001 to T063, plus T016a, T020a, T024a, T035a, T056a)
- Coverage: 100 % of requirements have at least one task (none partial)
- Ambiguity count: 0
- Duplication count: 0
- Critical issues count: 0

## Next Actions

- No CRITICAL, HIGH or MEDIUM finding remains, so `/speckit-implement` can proceed.
- The five LOW findings are one-line edits to tasks.md (L10, L12, L13, and L11's T052 note), to research.md R-11
  (L11) and to T020a or the phase-2 review (L14). Make them by hand now, or in the phase that touches each task:
  - L10 and L12 before phase 2;
  - L13 before phase 3's red commit;
  - L11 before phase 5's red commit;
  - L14 in phase 2.
