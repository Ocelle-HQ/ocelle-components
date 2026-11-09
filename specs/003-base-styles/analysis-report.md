---
analyzed_at: 2026-11-09T13:43:52Z
head: bfdbfd4a1f1643d39ad82795a9eb7c21c29f25d0
critical: 0
high: 0
medium: 1
low: 5
coverage: 100
---

<!-- Saved verbatim by the orchestrator on the operator's instruction for this analysis (2026-11-09, "Save verbatim
(Recommended)"): analyst-anouk's write was blocked by the harness, so the re-run after the fixes of bfdbfd4 came back
as text. It replaces the first report (at db9078a, kept in git history). -->

## Specification Analysis Report

Artifacts: `spec.md`, `plan.md` and `tasks.md` (T001 to T051, 51 tasks) at `bfdbfd4`, checked against constitution 1.3.1. The tasks cite these design artifacts, so they were read too:
- `research.md` (R-01 to R-14);
- `data-model.md`;
- `contracts/styles-package.md` and `contracts/checks.md`;
- `quickstart.md`.

To check that the tasks can be carried out, these files were also read:
- the story scripts (`red.sh`, `tdd-check.sh`, `common.sh`) and `story-config.yml` (`test_pathspec`, `setup_command`);
- `stylelint.config.ts` and the existing `gates/plants/style-lint/` plants;
- `gates/test/vitest-config.test.ts`, `vitest.config.ts` and `vitest.mutation.config.ts`;
- `packages/tokens/src/source.ts` (109 tokens) and `packages/tokens/contrast/pairs.json`;
- `packages/tokens/test/browser/serve.ts`;
- the Storybook `.storybook/` files and tests.

`.specify/extensions.yml` has `hooks: {}`, so there is no `before_analyze` or `after_analyze` hook.

The 17 findings of the previous report (at `db9078a`) were checked against `bfdbfd4`:
- **C1** is resolved. Plan decision 19, the Constitution Check VIII row and contracts/checks.md § Mutation scope record the operator's approved reading of VIII. 002 also recorded a reading (its font CSP reading), so this has a precedent.
- **F1** is resolved. The style-lint plants are T019, in green, and R-07 and the contract agree.
- **E2, E3, I1 to I5, E4, A1, U2, U3, E5 and C2** are resolved in the tasks and design artifacts.
- **U1** is resolved: T007 defines the six tokens in a scratch stylesheet. M1 below finds a wider gap in the same spike task.
- **E1** is resolved for T012, T024 and T044. Phase 4's test tasks do not repeat the rule; see L2.

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| M1 | Underspecification | MEDIUM | tasks.md:L108-L118 (T007), L33-L42 (stop-and-ask "any R-10 plant does not make its guard fail"); research.md:L430-L436 (R-10 "Every plant below is run once in the spike"), L479-L492; data-model.md:L28-L92 | The phase 2 spike must show that every R-10 plant makes its guard fail. A plant can only be shown to bite against the rule it undoes. T007 tells the spike to copy only "data-model § Prose's table, caption and cell rules" into the scratch page. For most R-10 plants, the rule they undo is missing in phase 2: the base media rule is written in T017, the compact and value rules arrive in phase 3, the other prose rules (scope, links, `pre`) in phase 4 and the wrap rule in phase 5. Example: the `img`/`svg`/`video` plant `block-size: revert-layer` is defined as "the state of a `base.css` without `block-size: auto`". Without the media rule, the media are 2000 px wide with or without the plant, so the bite cannot be observed. T007 also measures "every host layout of `prose-hosts.html`", which is written only in phase 4 (T033). If this is not fixed, a stop-and-ask can fire for the wrong reason, or `spike.md` can record a bite that never happened. | In T007, have the scratch stylesheet hold the whole data-model § Rule table (all four families, after the six scratch tokens). Have the spike use scratch copies of the fixture layouts it measures (`prose-hosts.html` hosts, the media page). Record both choices in `spike.md`. |
| L1 | Inconsistency (task order) | LOW | tasks.md:L77 (T003 [P]), L78 (T004 [P]), L80 (T006); story-config.yml `setup_command` (`setup:offline`, a `--frozen-lockfile` install) | T003 runs a non-frozen `pnpm install` and commits the lockfile. T004, marked parallel, adds `peerDependencies: { "@ocelle/tokens": "workspace:0.0.0" }` to `packages/styles/package.json`. pnpm checks peer dependencies against the lockfile when it auto-installs peers, which is its default. The lockfile importer `packages/styles` is `{}` today. If T003's install runs before T004, the committed lockfile is likely stale. The frozen setup in `tdd-check.sh 1` and in CI would then fail. | Drop [P] between T003 and T004 and run T003's install after T004, or have T006 run `pnpm install --frozen-lockfile` before the other checks. |
| L2 | Coverage gap | LOW | tasks.md:L280-L300 (T034), L301 (T035), L259-L261 (phase 4 Independent Test); spec.md:L620-L621 (FR-022) | The E1 fix adds "every scenario in both themes … none is exempt" to T012, T024 and T044. It does not add it to phase 4's browser test tasks. T034 says "in both themes" only for table semantics, and T035 (US2 scenarios 4 and 5 under prose) says nothing about themes. The phase 4 Independent Test does say "in both themes", so the gap is wording only. | Add the same sentence to T034 and T035. |
| L3 | Underspecification (fixtures) | LOW | data-model.md:L110-L119 (`page.html`, `compact.html`), L134-L137 (`layout.css`); tasks.md:L145 (T012 "inside and outside prose"), L224-L230 (T024), L301 (T035) | The fixture list does not say where three tested cases live. (a) US1 scenario 9 needs `code`/`pre`/`kbd`/`samp` inside a prose container, but `page.html` lists no prose container. (b) US2 scenario 4 (T024) and its `h1` half (T035) put the compact hook on `<html>`. `compact.html` cannot hold that alongside the regular page of US2 scenario 2. No fixture is named for it, and no runtime toggle is named either. (c) T024 does not list the prose-in-compact, compact-in-prose and both-hooks cases that data-model puts in `compact.html`, and T035 does not say that it adds them. | In data-model § Test fixtures: add a prose container to `page.html`, and name the compact-on-`<html>` page (or the `page.evaluate` toggle). Have T035 say that it adds the prose nesting cases to `compact.html`. |
| L4 | Inconsistency | LOW | tasks.md:L207-L209 (phase 3 Goal "FR-024's compact nesting"); spec.md:L500-L509 (FR-024) | Every case of FR-024 nests the compact hook with the prose hook. Phase 3 has no prose, and T024 leaves US2 scenario 5 to T035. Even so, the phase 3 Goal still lists "FR-024's compact nesting" as covered. The nesting that phase 3 does test, the `regular` region, comes from FR-004 (finding I5 fixed the T024 label, not the Goal). | Change the Goal to "the nested `regular` value of FR-004", and name FR-024 in the phase 4 Goal. |
| L5 | Inconsistency | LOW | plan.md:L5-L8 (Input) vs L154-L177 (decisions 17 to 19); tasks.md:L6 | The plan's Input paragraph names only squad rounds 1 and 2. It does not mention squad round 3 (decisions 17 and 18) or the post-analysis decision 19, which the plan and tasks.md:L6 rely on. | Add round 3 and the analysis ruling to the Input paragraph. |

**Coverage Summary Table:**

| Requirement Key | Has Task? | Task IDs | Notes |
|-----------------|-----------|----------|-------|
| FR-001 one-external-base-css-with-peer-dep | Yes | T004, T005, T008, T009, T011, T012, T013, T016, T020 | Lockfile order (L1) |
| FR-002 token-only-and-line-height-lint | Yes | T010, T017, T018, T019 | |
| FR-003 no-monospace-prefix-gate | Yes | T012, T017, T022 | |
| FR-004 readme-public-surface | Yes | T013, T020, T025, T030, T037, T042, T046, T050 | Every bullet is now asserted |
| FR-005 attribute-hooks-exact-values | Yes | T009, T024, T025, T034, T044 | All four hooks have an undocumented-value case |
| FR-006 root-color-scheme | Yes | T012, T017 | |
| FR-007 minimal-reset-with-guards | Yes | T012, T017 | |
| FR-008 body-regular-scale | Yes | T012, T017 | |
| FR-009 focus-ring-longhands | Yes | T009, T012, T017 | |
| FR-010 no-motion | Yes | T009, T017 | |
| FR-011 forced-colours-ring | Yes | T009, T012, T017 | |
| FR-012 compact-scale-root-safe | Yes | T024, T029 | Root-hook fixture unnamed (L3) |
| FR-013 value-hook-main-grounds | Yes | T024, T025, T029, T030 | |
| FR-024 nested-hooks | Yes | T035, T041 | Phase 3 Goal claims it (L4) |
| FR-014 prose-element-selectors | Yes | T033, T034, T041 | |
| FR-015 prose-sizes-and-line-height | Yes | T034, T041 | |
| FR-016 measure-and-code-wrap | Yes | T034, T041 | |
| FR-017 table-scroll-box-keyboard-caption | Yes | T007, T033, T034, T041 | Spike scope (M1) |
| FR-018 header-cells-and-rules | Yes | T034, T041 | |
| FR-019 links-and-code-ground | Yes | T034, T036, T041 | |
| FR-020 identifier-wrap | Yes | T044, T045, T049 | |
| FR-025 robustness-order-specificity-rtl | Yes | T009, T012, T025, T034, T036 | |
| FR-026 page-wide-code-fonts | Yes | T012, T017 | Prose container in `page.html` (L3) |
| FR-021 new-tokens | Yes | T023, T028, T032, T040 | |
| FR-022 browser-tests-every-scenario | Yes | T009, T012, T024, T034, T035, T044 | Both themes not restated in T034/T035 (L2) |
| FR-023 one-story-per-family | Yes | T014, T021, T026, T030, T038, T042, T047, T050 | |
| SC-001 zero-csp-violations | Yes | T011, T012, T014 | |
| SC-002 red-first-and-guard-plants | Yes | T001, T007, T009, T012, T015, T024, T027, T034, T039, T044, T045, T048 | Plant bites in the spike (M1) |
| SC-003 gates-zero-findings | Yes | T022, T031, T043, T051 | |
| SC-004 no-page-scroll-320-200pct | Yes | T034 | |
| SC-005 identifier-column-width | Yes | T044 | |
| SC-006 stand-in-mapping-doc | Yes | T046, T050 | |

**Constitution Alignment Issues:** none.

How each principle is met:
- **VIII (mutation testing)**: met under the operator-approved reading recorded as plan decision 19, with the CSS covered by source-level checks, browser tests and named plants. Every phase has a tests-only red commit that `test_pathspec` accepts, and the style-lint plants now land in green. Phase 1's exempt part is written down. Every guard has a plant or a recorded reason.
- **III and V (axe runs and visual baselines of the four new stories)**: covered by 001's recorded exception, "Storybook build, visual regression and axe gates absent" (sunset: when #10 merges). The plan now cites it.
- **I**: `data-ocelle-*` and `--ocelle-*` names, and no `sk-` names.
- **II**: token-only values, line heights as tokens, and no monospace page-wide. Every colour pairing is an existing `checked` pair; spot-checked in `pairs.json`.
- **IV**: one external stylesheet with no `@import` or `url()`, and fixtures served under the strict CSP.
- **VI**: the consumers are named (#6, #519, #531, #535, E-23, E-37, E-39).
- **VII**: the four hooks and six tokens are MINOR additions, with CHANGELOG entries and an exact peer dependency.

**Unmapped Tasks:** none. Every other task is setup, red-commit or check work for a story phase: T002, T003, T006, T015, T022, T027, T031, T039, T043, T048 and T051.

**Metrics:**

- Total Requirements: 32 (FR-001 to FR-026, SC-001 to SC-006)
- Total Tasks: 51 (T001 to T051)
- Coverage % (requirements with >=1 task): 100
- Ambiguity Count: 0
- Duplication Count: 0
- Critical Issues Count: 0

## Next Actions

- Nothing blocks `/speckit-implement`: there is no CRITICAL or HIGH finding.
- **Fix M1 in tasks.md before the phase 2 spike (T007).** Have the scratch stylesheet hold the full data-model § Rule table and have the spike use scratch copies of the fixture layouts it measures. Otherwise the stop-and-ask on plant bites can fire for the wrong reason.
- **The LOW findings are optional.** Each can be fixed by hand in tasks.md, data-model.md or plan.md:
  - L1: order T004 before T003's install, or have T006 run a frozen install;
  - L2: add the both-themes sentence to T034 and T035;
  - L3: name the fixtures for US1-9 in prose, compact on `<html>` and the nesting cases;
  - L4: fix the phase 3 Goal's FR-024 claim;
  - L5: complete the plan's Input paragraph.
