---
analyzed_at: 2026-11-09T13:31:11Z
head: db9078aa0786ab9e43e3f830c0aed99565164369
critical: 1
high: 1
medium: 5
low: 10
coverage: 100
---

<!-- Saved verbatim by the orchestrator on the operator's instruction (2026-11-09, "Save verbatim (Recommended)"):
analyst-anouk's write of this file was blocked by the harness ("Subagents should return findings as text, not write
report files"), so the analyst returned the report as text, as in mission 002. -->

## Specification Analysis Report

Artifacts: `spec.md`, `plan.md` and `tasks.md` (T001 to T006 and T009 to T053, 51 tasks) at `db9078a`, checked against constitution 1.3.1. The tasks cite `research.md` (R-01 to R-14), `data-model.md`, `contracts/styles-package.md`, `contracts/checks.md` and `quickstart.md`, so those were read too. The story scripts (`.specify/extensions/story/scripts/red.sh`, `tdd-check.sh`, `common.sh`), `story-config.yml` (`test_pathspec`) and `gates/lib/mutation/ranges.ts` were read to check that the tasks can be carried out. `.specify/extensions.yml` exists and has `hooks: {}`, so there is no `before_analyze` or `after_analyze` hook.

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| C1 | Constitution | CRITICAL | plan.md:L94 (Constitution Check VIII), L264-L267 (Complexity Tracking); contracts/checks.md:L42; constitution VIII "Mutation testing"; gates/lib/mutation/ranges.ts `scopePathspecs` (TypeScript only) | Constitution VIII says "Changed source is mutation-tested." `packages/styles/src/base.css` is the main changed source of this feature, and nothing mutation-tests it. The mutation gate's scope is TypeScript only (001 FR-028). The plan's VIII row says "CSS has no mutation tool, so the source-level checks and browser tests carry it", and contracts/checks.md says "CSS is not mutated". Complexity Tracking says "No new exception". So the plan relies on a reading of the principle without recording it as an exception (scope, rationale, sunset, operator approval) and without stating it as a reading the operator approved. This is the same pattern as 002's C1. 002 did not raise the question because its CSS is generated from mutation-tested TypeScript. | The operator decides before `/speckit-implement`, and the plan records the decision. (a) Treat it as an exception: add a Complexity Tracking row with scope (`packages/styles/src/*.css`), rationale (no CSS mutation tool in the pinned stack; replaced by the source-level checks, the browser tests and the named plants of R-10/R-11), a sunset (for example "when a CSS mutation tool is adopted" or "reviewed at 1.0.0") and the operator's approval. (b) Treat it as a reading: state that VIII's "source" means the mutation gate's 001 FR-028 scope, record the operator's approval, and point the Constitution Check row to it. |
| F1 | Inconsistency (task feasibility) | HIGH | tasks.md:L137-L140 (T013), L166 (T018); `.specify/extensions/story/story-config.yml` `test_pathspec`; red.sh (`tests_only`) | T018 makes the phase 2 red commit out of T010 to T017, and T017's set includes T013's style-lint plants: four new `gates/plants/style-lint/fail-styles-*-line-height/`, one new `pass-styles-line-height-token/`, and the move of `pass-line-height`. None of their paths (`plant.json`, `tree/packages/styles/src/x.css`, `tree/packages/elements/src/x.css`) matches `test_pathspec` (`**/*.test.ts`, `**/*.spec.ts`, `**/test/**`, `**/*.stories.ts`). The red commit would therefore change non-test files. red.sh would print `"tests_only":false` and record nothing, and tdd-check.sh 2 would fail. The plants are also not part of `pnpm test`, so they add nothing to the red run. In 002, plants were added in green (002 T028, T041, T061). | Move T013 into the green half, next to T021 (the lint option it proves), and keep T012's unit tests as the red evidence. Alternatively, record why this cannot work and change `test_pathspec`, which is a story-config change outside this feature. |
| E1 | Coverage gap | MEDIUM | spec.md:L620-L621 (FR-022 "in both themes"); tasks.md:L147-L156 (T015), L221-L226 (T026), L350-L356 (T046) | FR-022 requires every acceptance scenario in both themes. Only US1 scenario 1 (the six theme conditions, T015) and phase 4 (the Independent Test "in both themes", US3-7 "in both themes") state a theme. T026 (US2), T046 (US4) and the other US1 scenarios in T015 do not, so a test file written from the tasks could run in one theme only. | State in T015, T026 and T046 that each scenario runs under `emulateMedia({ colorScheme })` light and dark (R-09). If a scenario has no theme-dependent value, list it as exempt with the reason. |
| E2 | Coverage gap | MEDIUM | spec.md:L447-L451 (FR-005), L203-L204, L278-L280; tasks.md:T026, T036, T046 | FR-005 says that a hook applies only with one of its documented values, for all four hooks. The tasks test an undocumented value only for the value hook (`data-ocelle-value="true"`, T026) and the prose hook (`data-ocelle-prose="true"`, T036). No task tests `data-ocelle-density` or `data-ocelle-wrap` with an undocumented value (for example `"true"`), although data-model:L12-L16 fixes exact-match selectors for both. | Add to T026 a `data-ocelle-density="true"` region with no compact scale, and to T046 a `data-ocelle-wrap="true"` identifier that keeps the initial `overflow-wrap`. Put each in the same test as the positive case. |
| E3 | Coverage gap | MEDIUM | spec.md:L424-L425 (FR-004 bullets "any other value … has no effect" and "what each family styles and the tokens it uses"); research.md R-14; tasks.md:T016, T027, T039, T048 | FR-004 makes these two statements public surface (constitution VII). R-14 lists them among the README's contents. None of the readme-test tasks asserts them: T016 has "the base layer and its specificity", T027 and T039 have "values", and T048 has "the wrap statements". The other FR-004 bullets are each named in a task. | Name both statements in T027/T039/T048 (each family's styles and tokens, phase by phase), and the "other values do nothing" sentence in T027 or T039. |
| U1 | Underspecification | MEDIUM | tasks.md:L107-L117 (T009), L33-L41 (stop-and-ask); data-model.md:L74-L77; plan.md:L249 | The phase 2 spike copies "data-model § Prose's table, caption and cell rules" into a scratch page. Those rules use `var(--ocelle-measure-cell)` and `var(--ocelle-measure-container)`, and the R-10 prose plants use `--ocelle-line-height-prose`. All of these tokens are added only in phase 4 (T034/T042). With the phase 2 `tokens.css`, these declarations are invalid at computed-value time: there is no 12ch floor and no caption cap. The stop-and-ask outcomes "a cell … narrower than 12ch" and "caption line boxes leave the visible box" would then fire for a reason that has nothing to do with the mechanism. | Have T009 say how the spike supplies the missing values: a scratch stylesheet that defines the six R-08 tokens with their data-model values, or literal values in the scratch page only. Record that choice in `spike.md`. |
| I1 | Inconsistency | MEDIUM | tasks.md:L188 (T023); plan.md:L210; research.md:L553-L555 (R-12) | The plan and R-12 put the story layout stylesheet at `storybook/.storybook/stories-layout.css`, "imported by `preview.ts`". T023 adds `storybook/stories/stories-layout.css` and does not mention `preview.ts`. The plan's Phases list (L243) names the file without a path. | Use one path. R-12's `.storybook/` path, imported by `preview.ts`, matches how `preview.css` is loaded. Change T023 to that path and add the `preview.ts` import. |
| I2 | Inconsistency | LOW | contracts/checks.md:L7; tasks.md:L139 (T013) | The contract's pass plant `pass-styles-line-height-token` uses `var(--ocelle-line-height-prose)`. T013 uses `var(--ocelle-line-height-normal)`. The prose token only exists from phase 4, and 002's unknown-token check would reject it in phase 2, so the task is right and the contract is stale. | Update the contract to `--ocelle-line-height-normal`. |
| I3 | Inconsistency | LOW | research.md:L515 (R-11); tasks.md:L125 (T011) | R-11's source-level check reports `outline: none`, `outline: 0` and `outline-style: none`. T011 lists only `outline: none` and `outline-style: none`, and R-10 has no `outline: 0` plant. `outline: 0` also resets `outline-style` to `none`. | Add `outline: 0` to T011 and an `outline: 0` plant string to R-10. |
| I4 | Inconsistency | LOW | tasks.md:L79-L107 | Task IDs jump from T006 to T009, so T007 and T008 do not exist. A reader or script that counts tasks may stumble on this. | Renumber, or add a note that T007 and T008 are unused. |
| I5 | Inconsistency | LOW | tasks.md:L226 (T026), L204-L205 (phase 3 Goal) | T026 labels "nested compact and regular regions" as "scenario 5". US2 scenario 5 (spec:L209-L214) is about prose and compact nesting, which the phase 3 Goal and T037 assign to phase 4. The `regular` value comes from FR-004 and R-02. | Relabel the T026 item "FR-004 `regular` value (nested regions)" and leave scenario 5 to T037. |
| E4 | Coverage gap | LOW | spec.md:L661-L662 (SC-003); tasks.md:L189-L193 (T024), T033, T045, T053; quickstart.md:L285 | SC-003 requires the Contrast and Brand rules gates to report 0 findings. T024's gate list, reused by T033 and T045, leaves out `gate:contrast` and `gate:brand-rules`, although phases 3 and 4 change the token source that both gates read. These gates run only in T053, through quickstart step 3. | Add `gate:contrast` and `gate:brand-rules` to T024's list. |
| A1 | Ambiguity | LOW | spec.md:L243-L245 (US3 scenario 1); data-model.md:L78 | "every element … (… table cells) has the prose line height (1.65, 26.4 px at 16 px)". A `th` is 12 px (FR-018), so its computed line height is 19.8 px. A test written by hand could assert 26.4 px for every cell. | Have T036 state that cells are checked as 1.65 times their own computed size, or spell out `td` 26.4 px and `th` 19.8 px. |
| U2 | Underspecification | LOW | tasks.md:L151 (T015); data-model.md § Test fixtures; research.md R-09 | T015 expects "the control page's one violation". No fixture in data-model or R-09 is a control page, and its planted violation is not named. | Name the control fixture (for example `control.html` with one blocked inline style) in data-model § Test fixtures and T014. |
| U3 | Underspecification | LOW | spec.md:L406-L407 (FR-001); plan.md:L127-L128; contracts/styles-package.md:L202 | The exact peer dependency is `workspace:0.0.0`. `@ocelle/tokens` stays at 0.0.0 before and after the six new tokens, so the "version that adds the six tokens" cannot be told apart from the version without them before the 1.0.0 release (allowed by constitution VII). | Accept for pre-1.0. Optionally note in the README statement (T016) that the pin becomes meaningful at the first release (#11). |
| E5 | Coverage gap | LOW | plan.md:L67 | The goal "the `styles-browser` suite should take under 60 s" has no task that measures it. | Have T024 record the suite time, or drop the goal. |
| C2 | Constitution | LOW | plan.md:L89, L91 (Constitution Check III, V); constitution III (axe on any story), V (baselines); specs/001-repository-foundation/plan.md:L407 | The four new stories have no axe run and no visual baseline. 001's Complexity Tracking exception ("Storybook build, visual regression and axe gates absent", sunset when #10 merges) covers this, but the plan only says "as in 002" and does not cite it. | In Constitution Check rows III and V, cite 001's exception and its sunset. |

**Coverage Summary Table:**

| Requirement Key | Has Task? | Task IDs | Notes |
|-----------------|-----------|----------|-------|
| FR-001 one-external-base-css-with-peer-dep | Yes | T004, T010, T011, T015, T016, T019, T020, T022 | Peer pin is 0.0.0 pre-release (U3) |
| FR-002 token-only-and-line-height-lint | Yes | T012, T013, T020, T021 | T013 placed in red commit (F1) |
| FR-003 no-monospace-prefix-gate | Yes | T015, T020, T024 | |
| FR-004 readme-public-surface | Yes | T016, T022, T027, T032, T039, T044, T048, T052 | Two bullets unasserted (E3) |
| FR-005 attribute-hooks-exact-values | Yes | T011, T026, T036 | Density and wrap undocumented values untested (E2) |
| FR-006 root-color-scheme | Yes | T015, T020 | |
| FR-007 minimal-reset-with-guards | Yes | T015, T020 | |
| FR-008 body-regular-scale | Yes | T015, T020 | |
| FR-009 focus-ring-longhands | Yes | T011, T015, T020 | `outline: 0` not checked (I3) |
| FR-010 no-motion | Yes | T011, T020 | |
| FR-011 forced-colours-ring | Yes | T011, T015, T020 | |
| FR-012 compact-scale-root-safe | Yes | T026, T031 | |
| FR-013 value-hook-main-grounds | Yes | T026, T027, T031, T032 | |
| FR-024 nested-hooks | Yes | T026, T037, T043 | |
| FR-014 prose-element-selectors | Yes | T035, T036, T043 | |
| FR-015 prose-sizes-and-line-height | Yes | T036, T043 | `th` line height (A1) |
| FR-016 measure-and-code-wrap | Yes | T036, T043 | |
| FR-017 table-scroll-box-keyboard-caption | Yes | T009, T035, T036, T043 | Spike token values (U1) |
| FR-018 header-cells-and-rules | Yes | T036, T043 | |
| FR-019 links-and-code-ground | Yes | T036, T038, T043 | |
| FR-020 identifier-wrap | Yes | T046, T047, T051 | |
| FR-025 robustness-order-specificity-rtl | Yes | T011, T015, T036 | |
| FR-026 page-wide-code-fonts | Yes | T015, T020 | |
| FR-021 new-tokens | Yes | T025, T030, T034, T038, T042 | |
| FR-022 browser-tests-every-scenario | Yes | T015, T026, T036, T046 | Both themes not stated for US2/US4 (E1) |
| FR-023 one-story-per-family | Yes | T017, T023, T028, T032, T040, T044, T049, T052 | Layout file path (I1) |
| SC-001 zero-csp-violations | Yes | T014, T015, T017 | Control page unnamed (U2) |
| SC-002 red-first-and-guard-plants | Yes | T009, T011, T015, T018, T026, T036, T046, T047 | |
| SC-003 gates-zero-findings | Yes | T024, T053 | Contrast/brand gates only at T053 (E4) |
| SC-004 no-page-scroll-320-200pct | Yes | T036 | |
| SC-005 identifier-column-width | Yes | T046 | |
| SC-006 stand-in-mapping-doc | Yes | T048, T052 | |

**Constitution Alignment Issues:**
- C1 (CRITICAL), principle VIII: CSS is changed source that is not mutation-tested, and the plan neither records an exception nor states an approved reading.
- C2 (LOW), principles III and V: covered by 001's recorded exception, which the plan does not cite.

Every other principle is met as the plan's Constitution Check states:
- I: `data-ocelle-*` and `--ocelle-*` names, and no `sk-` names.
- II: token-only values, line heights as tokens, and no monospace page-wide.
- IV: one external stylesheet, no `@import` or `url()`, fixtures served under the strict CSP.
- VII: the four hooks and six tokens are MINOR additions, with CHANGELOG entries.
- VIII: each phase has a red commit, phase 1's exempt part is written down, and every guard has a plant or a recorded reason.

**Unmapped Tasks:** none. Every task is setup, belongs to a story phase, or runs that phase's checks (T006, T018, T024, T029, T033, T041, T045, T050, T053).

**Metrics:**

- Total Requirements: 32 (FR-001 to FR-026, SC-001 to SC-006)
- Total Tasks: 51 (T001 to T006, T009 to T053)
- Coverage % (requirements with >=1 task): 100
- Ambiguity Count: 1 (A1)
- Duplication Count: 0
- Critical Issues Count: 1

## Next Actions

- **Resolve C1 before `/speckit-implement`.** The operator decides between an exception and a reading for CSS mutation testing, and the plan records it in Complexity Tracking or the Constitution Check (edit plan.md by hand, or re-run `/speckit-plan` for that row).
- **Fix F1 in tasks.md before phase 2 starts.** Move T013's style-lint plants to the green half, next to T021, or the phase 2 red commit cannot be recorded.
- **Fix the MEDIUM findings in tasks.md.** They can be fixed by hand:
  - E1: name both themes in T015, T026 and T046.
  - E2: add the undocumented density and wrap values to T026 and T046.
  - E3: name the two FR-004 README statements in the readme-test tasks.
  - U1: say how the T009 spike supplies the phase 4 token values.
  - I1: align T023 with R-12's `storybook/.storybook/stories-layout.css` and its `preview.ts` import.
- **The LOW findings are optional.** Each can be fixed when the artifact is next edited: I2 (contract pass-plant token), I3 (`outline: 0`), I4 (ID gap), I5 (T026 label), E4 (contrast and brand-rules gates in T024), A1, U2, U3, E5 and C2 (cite 001's exception).
