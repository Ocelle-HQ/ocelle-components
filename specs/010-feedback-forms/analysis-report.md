---
analyzed_at: 2026-11-13T16:23:46Z
head: 6e748fe4dcdf57dce12e03fdf69e13cdafb9bf1c
critical: 0
high: 2
medium: 4
low: 4
coverage: 100
---

## Specification Analysis Report

Feature: `specs/010-feedback-forms` (spec.md, plan.md, tasks.md; research.md, data-model.md, contracts/ and quickstart.md read where a task points at them), after `reviews/analysis/fixes-2.md`. Constitution 1.3.1. No `before_analyze` or `after_analyze` hooks are registered (`.specify/extensions.yml` has `hooks: {}`). All 14 findings of the previous report (head efafd6b) are resolved as `fixes-2.md` records. Its repository claims were re-checked and match:
- the pinned lines `gates/test/manifest.test.ts:86,91`, `gates/test/integration/manifest.test.ts:19`, `readme.test.ts:125-131,173`, `test/node/manifest.test.ts:250` and `exports.test.ts:9-10`;
- the story scripts' `test_pathspec`, scaffold, red and check 2/3 behaviour;
- the root `vitest.config.ts` command registration;
- the generator's `src/ocelle-*.ts` glob.

The findings below are new; IDs continue the previous reports' numbering.

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| I10 | Inconsistency | HIGH | spec FR-001 (spec.md:587-593: "Each element follows the README's 'Element conventions'"); `packages/elements/README.md:189-196` (Host ARIA), `:233-236` (Properties); `packages/elements/test/node/readme.test.ts:33`, `:74`, `:79` (pinned fragments); contracts/elements.md:9-13, :32-48, :62-67 (defaults `"info"`, `"regular"`, `false`, `""`, `"text"`); spec FR-009 (:693-707), FR-022 item 1 (:767); tasks T016a (:136), T016b (:137), T030 (:170), T034a (:175), T050a (:205); tasks.md:27-28 (every test change in the red commit) | The README's existing conventions and Host ARIA text, pinned word for word by the README test, contradict the new elements. (1) `:33` says every public property carries `@default undefined`, while the contracts and the manifest tests T016a, T030 and T050a require other defaults. (2) `:74` says a blank host `aria-label` "decides alone" and leaves the element unlabelled, while FR-022 names the form control by a *non-empty* host `aria-label` and otherwise by its labels. (3) `:79` says "A host `role` … is not supported", while FR-009 supports `role="alert"` and `role="status"` on the notice. No red task rewords or scopes these fragments, and the tasks header puts every test change in the red commit, so the README would either state contradicting rules or change pinned text in green. No scenario covers a blank host `aria-label` on a form control. | Add to T016b the rewording of the pinned `@default` and host-`role` fragments (scoped to the elements they describe, or restated per element), and to T034a the `aria-label` fragment. Add to T031 a cell with a blank host `aria-label` and a `label` (named by the label, as FR-022 item 1 says). |
| U6 | Underspecification | HIGH | spec FR-021 (spec.md:756-761: the input's `value` attribute is its default value), FR-034 (:882-890: "every public property and attribute"; exceptions `role`, host ARIA, `form`); contracts/elements.md:40 (`value` kind "property"), :51-55 ("Documented, not declared" omits it); data-model.md:119; tasks T030 (:170: "`value` a property only"), T038 (:183); constitution I ("the custom-elements manifest declares every public property, attribute, …") | The input's `value` attribute is public surface: US2-4 writes `value="draft"`, and it is restored on reset. No artifact says whether the manifest declares it. T030 asserts `value` as "a property only". FR-034's exception list and the contract's "documented, not declared" list do not name it. If the attribute is observed by hand, the analyzer emits an attribute with no field and no description, and the gate's "every member described" or T030's entry test then decides the outcome by accident. Left undeclared without an FR-034 exception, the manifest misses a public attribute, against constitution I. | Decide it in contracts/elements.md and FR-034. Either declare an attribute `value` (string, default `""`, described as the default value, no field) and assert it in T030, or record it beside `form` as a standard-like attribute that is documented and not declared, with the reason. Assert the choice in T030 and T034a. |
| I11 | Inconsistency | MEDIUM | tasks.md:257-260 (Dependencies: "then phase 1's T005a or phase 5's T066 record before `tdd-check.sh` and the review"); T005a (:110, part (2) "names the failing tests of `check-final-tests-on-base.log`"; "If check 2 exits 0 … stop"); T066 (:243, same log); `.specify/extensions/story/scripts/tdd-check.sh` (writes `check-final-tests-on-base.log`) | T005a (2) and T066 read the log that `tdd-check.sh` check 2 writes, and act on its exit code. The Dependencies section orders both before `tdd-check.sh`. | Order them after `tdd-check.sh` and before the review: "green, `tdd-check.sh`, then T005a / T066, then the review". T005a (1), the run against the stubs, may stay before it. |
| U7 | Underspecification | MEDIUM | contracts/testing.md:159-170 (a plant is "an element class derived from the real one with one defect, or a planted reading function", run through a scenario body with the tag mapping), :180-197 (merge window, minimum hold, baseline re-check, hold, first load late write, short-lived empty state, move, later task, first load rows), :184 ("shipped timing": `announcerDefaults` with `delayLoaded: 0`, must turn `test/live-timing.test.ts` red), :209 (oracle rows turn T001 unit tests red); tasks T009a (:124: `src/live.ts` scaffold exports `announcerDefaults` and the setter only), T016 (:135), T001 (:92), T001c (:95) | Most notice plants change behaviour that lives in the internal announcer and first-load/move code of `src/live.ts` and `src/define.ts`, not in the element class. No artifact names the seam a derived plant class overrides (protected hooks on the element, or an exported announcer class). "Shipped timing" plants a module constant and targets a test file, not a scenario body, so it does not fit the row format. The oracle rows need T001's unit tests to be callable with a planted reading, which T001 does not ask for. If `notice-plants.ts` imports any `src/live.ts` export the scaffold lacks, `plants.test.ts` fails at import in the red commit and at check 3, and T001c's rows fail with it. That is an import error, which VIII forbids. | State the seam in contracts/testing.md § Plants and data-model.md (what each plant overrides, and which internal exports it imports). Add those signatures to T009a's and T029a's scaffolds. Say how the shipped-timing row runs (for example a module-level override through the setter's own seam) and that T001 exports its rule bodies parameterised by the reading. |
| U8 | Underspecification | MEDIUM | tasks T002 (:100: "a worst-case 60-line `src/live.ts` shard … stop over 7:00"), Stop-and-ask (:61-68); plan decision 11 (plan.md:127-132), phase 1 (:221-226); research R-09 (Timing in process); root `vitest.config.ts` `elements` project (`include: packages/elements/**/*.test.ts`, so `plants.test.ts` runs under Stryker) | Decision 11's 7:00 stop is measured only in T002, in phase 1. At that point `src/live.ts` does not exist (the phase 2 scaffold adds it), and neither do its scenarios, the SC-002 matrix or the plant rows that cover it and run in the mutated project. So the shard T002 measures has no defined subject, and the figure that matters is not measured again when it becomes measurable. Only the general 10-minute stop remains. | Say what T002 mutates (for example the uncommitted prototype with a 60-line synthetic `src/live.ts` and the spike scenarios). Add the 7:00 check to phase 2's phase-end `gate:mutation` run (T025), recorded in the phase review, with the same stop. |
| C3 | Constitution Alignment | MEDIUM | tasks T061 (:235), T066 (:243), tasks.md:23-25; plan phase 5 (plan.md:329-336); `tdd-check.sh` check 2; constitution VIII ("Proven against the old code … so tests rewritten after the red step cannot pass vacuously") | In phase 5, check 2 overlays the final story files (test paths) onto the base, so only the baseline assertions fail there. The final index and render assertions of `elements-stories.test.ts` are never run against code without the stories. `red-phase.log` shows only the red version failing. Phase 1 has T005a for the same gap; phase 5 has no equivalent. The suite-level MUST is met, since check 2 fails, so this is not CRITICAL. A story change to `storybook/stories/render.ts` (not a test path) would also be missing at that base. | Add to T066 a recorded run like T005a: the final `elements-stories.test.ts` at T060's base without the three story files, with the log kept and each index and render assertion failing on an assertion. State whether phase 5 changes `render.ts`. |
| I12 | Inconsistency | LOW | tasks T005 (:106: the `insertInteractive` page "under `packages/elements/test/fixtures/`"), T001a (:93: planted regions "under `packages/elements/test/fixtures/`"), T005a (:110: overlay of "every file under `packages/elements/test/fixtures/`"); plan.md:182; `packages/elements/test/browser/serve.ts:30,59` (serves only `test/browser/fixtures/`), `:115-122` (allowed requests) | Fixture pages are served from `test/browser/fixtures/`, not `test/fixtures/`. A page placed where T005 says would get a 404. T005a's overlay set names only `test/fixtures/`. The `insertInteractive` page's module script must also be in the page's allowed requests, or the "only allowed requests" assertion fails. | Put the fixture-page files in `packages/elements/test/browser/fixtures/` in T001a, T005, T005a and the plan's tree, and have T005 add the module script to that page's allowed list. |
| C4 | Constitution Alignment | LOW | tasks T009a (:124: "`timing-setter.test.ts` on no caller in `test/in-process.ts`"), T014 (:132), T020a (:146); `tdd-check.sh` check 3 | Check 3 overlays the final `test/in-process.ts`, which calls the setter, onto the scaffold. So `timing-setter.test.ts` passes there, and its only evidence is the red run, a smaller case of C1's pattern. T009a lists it as failing "against" the scaffold, which holds only at the red commit. | Say in T009a that this test's evidence is `red-phase.log`, and name it in the review's reading of `check-final-tests-on-scaffold.log`. |
| I13 | Inconsistency | LOW | tasks.md:259 ("[P] tasks of the red step touch different files"); T015/T016c (`exports.test.ts`), T016a/T016c (`test/node/manifest.test.ts`), T016b/T016c (`readme.test.ts`); T033/T034b, T030/T034b, T034a/T034b; T051/T052b, T050a/T052b, T052a/T052b | Pairs marked [P] edit the same file. | Drop [P] from T016c, T034b and T052b, or order them after the task that edits the same file. |
| U9 | Underspecification | LOW | tasks T001c (:95: "the `elements-browser` variant for rows that need `startDocument`"); contracts/testing.md:164-165; plan.md:173; root `vitest.config.ts` (`test/browser/**` is `elements-browser`) | `test/plants.test.ts` belongs to the `elements` project. The `elements-browser` variant needs its own file under `test/browser/`, which no task or tree names. | Name it (for example `packages/elements/test/browser/plants.test.ts`) in T001c and the plan's tree. |

**Coverage Summary Table:**

| Requirement Key | Has Task? | Task IDs | Notes |
|-----------------|-----------|----------|-------|
| FR-001 element-conventions | Yes | T011, T021, T022, T025, T031, T038, T039, T050, T055, T056, T062-T065 | README conventions text vs new defaults and roles (I10) |
| FR-002 open-shadow-font-inherit | Yes | T021, T031, T037, T050, T061 | |
| FR-003 no-io-no-other-events | Yes | T031, T038, T050 | |
| FR-004 notice-tone | Yes | T011, T021 | |
| FR-005 tone-contrast | Yes | T010, T018 | |
| FR-006 heading-slot-absence | Yes | T011, T016b, T021, T024 | |
| FR-007 notice-size | Yes | T011, T021 | |
| FR-008 announce-rules | Yes | T011, T012, T013, T019, T020, T021 | Plant seam into `src/live.ts` (U7) |
| FR-009 politeness-role-rows | Yes | T011, T012, T020, T021 | README "host `role` not supported" fragment (I10) |
| FR-010 notice-forced-colours | Yes | T011, T021 | |
| FR-011 notice-focus-semantics | Yes | T011 | |
| FR-020 form-association | Yes | T032, T037, T050 | |
| FR-021 shared-attributes | Yes | T031, T037, T050 | Input `value` attribute in the manifest (U6) |
| FR-022 naming | Yes | T031, T037 | Blank host `aria-label` (I10) |
| FR-023 validity | Yes | T031, T032, T037 | |
| FR-024 events | Yes | T031, T038, T050, T055 | |
| FR-025 size-look | Yes | T031, T038 | |
| FR-026 parts-slots | Yes | T030, T037, T039, T050a | |
| FR-027 error-announcement | Yes | T031, T037 | |
| FR-028 error-mark | Yes | T031, T038 | |
| FR-029 input-type-passthrough | Yes | T031, T038 | |
| FR-030 implicit-submission | Yes | T031, T032, T038 | |
| FR-031 select-options | Yes | T050, T055 | |
| FR-032 select-indicator | Yes | T050, T054, T055 | |
| FR-033 stories-baselines | Yes | T060-T066 | Final index and render assertions vs old code (C3) |
| FR-034 manifest | Yes | T016a, T022a, T025, T030, T036, T039, T050a, T056 | Input `value` attribute (U6) |
| FR-035 readme | Yes | T016b, T024, T034a, T041, T052a, T057, T066 | Pinned convention fragments (I10) |
| FR-036 changelog-engine-floor | Yes | T016b, T025, T034a, T041, T052a, T057 | |
| SC-001 scenarios-both-harnesses | Yes | T011, T013, T031, T033, T050, T051 | Fixture page location (I12) |
| SC-002 announcement-matrix | Yes | T012, T013 | |
| SC-003 native-twins | Yes | T032, T050 | |
| SC-004 absent-heading-zero-gap | Yes | T011 | |
| SC-005 baselines-axe-gates | Yes | T061, T065 | |
| SC-006 form-control-readme | Yes | T034a, T041, T066 | |
| SC-007 mutation | Yes | T002, T025, T041, T057, T066 (phase-end gates incl. `gate:mutation`) | 7:00 stop measured before its subject exists (U8) |

**Constitution Alignment Issues:** none rated CRITICAL; no task, as written, breaks a MUST of the constitution by itself. Two findings touch a principle:
- U6 (Principle I): if the input's `value` attribute ends up neither declared nor recorded as an exception, the manifest would miss a public attribute.
- C3 (Principle VIII): the suite-level check 2 holds in phase 5, but the final story index and render assertions are never run against code without the stories.

C4 is a smaller case of the same VIII pattern in phase 2.

**Unmapped Tasks:** none.
- Phase 1 (T001-T005a) is the test infrastructure SC-001, SC-002 and Principle VIII require; T002 is the spike of plan decisions 1, 7 and 11.
- The scaffolds T009a, T029a and T049a serve Principle VIII for phases 2 to 4.
- T054 is a refactor serving FR-032.
- T060 is the R-08 recheck FR-033 requires.
- T066 maps FR-035 and SC-006 to their red commits.

**Metrics:**

- Total Requirements: 35 (FR-001 to FR-011, FR-020 to FR-036, SC-001 to SC-007)
- Total Tasks: 67
- Coverage % (requirements with >=1 task): 100%
- Ambiguity Count: 0
- Duplication Count: 0
- Critical Issues Count: 0

## Next Actions

- No CRITICAL issues. Resolve the two HIGH findings before phase 2 starts (phase 1 can proceed):
  - I10: in T016b and T034a, reword or scope the pinned README fragments (`readme.test.ts:33`, `:74`, `:79`) as part of the red commits. Add the blank host `aria-label` cell to T031.
  - U6: decide whether the manifest declares the input's `value` attribute. Record the choice in contracts/elements.md and FR-034, and assert it in T030 and T034a.
- The MEDIUM findings are task and contract edits:
  - I11: put T005a (2) and T066 after `tdd-check.sh`.
  - U7: define the plant seam into `src/live.ts` and `src/define.ts`, add it to the scaffolds, and say how the shipped-timing and oracle rows run.
  - U8: define T002's mutation subject and repeat the 7:00 check at phase 2's phase-end mutation run.
  - C3: add a T005a-style run of the final story test at T060's base without the stories.
- The LOW findings (I12, C4, I13, U9) are wording and path fixes and can go in the same pass.
- Suggested commands:
  - Edit `tasks.md` by hand (or re-run `/speckit-tasks`) for I10, I11, U7, U8, C3, C4, I12, I13 and U9.
  - Run `/speckit-plan` refinement for U6 (contracts/elements.md, and FR-034 if the attribute is not declared), U7 (contracts/testing.md § Plants, data-model.md), U8 (decision 11) and I12 (structure tree).
  - Change the spec only if U6 is resolved by an FR-034 exception.
