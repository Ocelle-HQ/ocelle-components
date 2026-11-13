---
analyzed_at: 2026-11-13T15:58:32Z
head: efafd6b67d8d6eebb1484ed14db0ae985aa68fcc
critical: 0
high: 3
medium: 5
low: 6
coverage: 100
---

## Specification Analysis Report

Feature: `specs/010-feedback-forms` (spec.md, plan.md, tasks.md; research.md, data-model.md, contracts/ and quickstart.md read where a task points at them), after `reviews/analysis/fixes-1.md`. Constitution 1.3.1. No `before_analyze` or `after_analyze` hooks are registered (`.specify/extensions.yml` has `hooks: {}`). All 18 findings of the previous report (head 3f46dc5) are resolved as `fixes-1.md` records; the R-04 figures were re-checked against the repository and match. The findings below are new; IDs continue the previous report's numbering.

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| C1 | Constitution Alignment | HIGH | tasks.md:71-85 (T001-T005), tasks.md:12-17; `.specify/extensions/story/story-config.yml:13` (`test_pathspec` includes `**/test/**` and `**/*.stories.ts`); `scaffold.sh` ("The commit must change no test file"); `tdd-check.sh` check 2; constitution VIII ("Red first", "Proven against the old code") | Phase 1's implementation (`test/live-reading.ts`, `test/live.ts`, `test/scenarios/driver.ts`, `test/in-process.ts`, `test/browser/driver.ts`, `test/browser/serve.ts`) is all under the test pathspec. Only the root `vitest.config.ts` is not. (1) `scaffold.sh` refuses those modules, so no scaffold is possible. T001 to T001c then fail at the red commit on a missing `test/live-reading.ts` or driver module, which VIII forbids as an import error, unless the red commit itself carries signature stubs. No task says so. (2) `tdd-check.sh` check 2 overlays every changed test-path file from HEAD onto the base, which puts the implementation itself back. Only the missing command registration in `vitest.config.ts` would make that run fail. So the pure reading tests (T001), the fixture-page driver tests (T001b) and the plants row (T001c) are never shown failing against the old code. The check passes vacuously. Phase 5 has the same structure: the stories T062-T064 match `**/*.stories.ts`, so the final-tests-on-base run (`storybook/test/integration/elements-stories.test.ts` plus the stories overlaid) will likely pass and make `tdd-check` report a failure. | State in tasks.md (and plan phase 1) how phase 1 proves VIII. For example: the red commit includes signature-only stubs of the capture, reading and driver modules (allowed, as test paths), so failures are on assertions. The review runs the final T001-T001c files against that red commit's stubs and keeps the log, as the scaffold run would. Record in phase 1's review that `tdd-check` check 2 cannot separate tests from code there. For phase 5, state how the check is expected to read, or keep the stories' red evidence by another recorded run. |
| C2 | Constitution Alignment | HIGH | tasks.md:12-13 ("an optional `scaffold.sh`"), tasks.md:109 (T017 "not setup errors"), T035 (:142), T053 (:169); T013 (:102), T014 (:103), T014a (:104), T033 (:139), T051 (:166); constitution VIII ("not a syntax, import or setup error") | No phase names a scaffold step. Without one, the red commits of phases 2 to 4 fail on modules that do not exist yet. Examples: T014 imports `announcerDefaults` from `src/live.ts`, and the in-process wiring files import `src/ocelle-notice.ts`, `src/ocelle-form-input.ts` and `src/ocelle-form-select.ts`. That is an import error, which T017 and VIII exclude. `tdd-check.sh` check 3 exists precisely because "against the base a missing module alone makes them fail". Mission 005 used a scaffold in phases 1, 2, 4 and 5. | Add a scaffold task before each red commit of phases 2 to 4: the new `src/` modules (`live.ts` with the setter and constant signatures, the element classes, `form-control.ts`) with signatures and no behaviour, recorded by `scaffold.sh`. Name which tests fail on what against it. Alternatively, record per phase why an import failure is the missing behaviour. |
| I7 | Inconsistency | HIGH | `gates/test/manifest.test.ts:86`, `:91` and `gates/test/integration/manifest.test.ts:19` ("manifest: 2 elements checked, no finding"); `packages/elements/test/node/readme.test.ts:125-131` (`entryRows`), `:172-173` (exact `exports` key list); tasks.md:14-16 (every test change in the red commit), T016b (:108), T034a (:141), T052a (:168), T022 (:118); research.md R-11; 005 `reviews/phase-5/notes.md` ("These pinned counts should have changed in the red commit") | Each of phases 2, 3 and 4 adds an element, an entry point and a README Entry points row. Existing tests pin those exactly: 2 elements in the manifest gate (unit and plant-tree integration), and the README Entry points table rows and `package.json` `exports` keys as an exact list. No red-commit task updates them. So the green tasks T022/T025, T039 and T056 break them, and they would have to change in green, against the tasks header and VIII. The README tasks name only "the entry point `@ocelle/elements/ocelle-notice.js`" as an item, not the exact-list assertions. R-11's "alphabetical order of tag" also does not match the existing order (`ocelle-icon` before `ocelle-brand-mark`), so the expected list cannot be written by hand without a rule. | Add to T016b, T034a and T052a (or a new red task per phase) the edits of `entryRows`, the exact `exports` list at `readme.test.ts:173`, and the "N elements checked" figures (3, 4, 5) in both manifest gate tests. State where each new entry goes in the list. Add these files to R-04-style tracking in the plan's structure tree. |
| G9 | Coverage Gap | MEDIUM | spec FR-034 (spec.md:882-890); tasks T016a (:107), T030 (:136), T036, T039, T056 (:175); `packages/elements/test/node/manifest.test.ts:246`, `:274` (per-element precedent) | The notice's manifest entry is tested (T016a), but neither form element's entry is. T030 tests only the generator's base-class folding, `focus()` and the drop list. Nothing asserts `ocelle-form-input`'s own members: `type`, the pass-through properties with `string \| undefined` / `number \| undefined` / `boolean`, the event and its detail type, the four parts, and the empty slot and CSS-property lists. Phase 4 has no manifest test task at all for `ocelle-form-select`. `gate:manifest` checks only that the committed file matches a regeneration. | Add to T030 an `ocelle-form-input` entry test, and to phase 4's red commit an `ocelle-form-select` entry test, in the style of `manifest.test.ts:246`, covering FR-034's lists. |
| G10 | Coverage Gap | MEDIUM | spec Edge Cases (spec.md:533-534, 551-554), FR-008 last bullet (spec.md:686-692), FR-027 (spec.md:839-840); tasks T011 (:100), T031 (:137), T050 (:165) | Some behaviour promises still have no scenario. (1) A notice, or a control holding `error`, inside a hidden ancestor (`hidden` container, closed `<details>`, `display: none`) that is then shown is not a reveal and announces nothing. That needs a count-0 cell with the positive outcome (region present, text visible) and, for `role="alert"`, the host role. (2) An `error` set while the field has focus is announced once, and set to the same text again with no clearing in between is not announced. US2-10 covers only the whitespace variant. | Add these cells to T011, T031 and (via scenario 7) T050, each zero count paired with the positive outcome it guards. |
| G11 | Coverage Gap | MEDIUM | contracts/testing.md:155-190 (Plants); tasks T016 (:106), T034 (:140), T052 (:167) | Several plant rows name scenarios of more than one phase. These include "insertion announcement" (US2-20), "reveal baseline" (US2-22), both "first load" rows (US2-20, US2-18), "move" (US2-20), "hidden" (US2-22) and "validity" (US3-5). T016 takes every row naming US1, but those rows' US2 and US3 cells cannot run in phase 2. T034's list ("form, naming, error, host ARIA, change event, implicit submission, validity and form value") does not clearly include the US2 cells of the announcement rows. T052 lists only "option-mirroring and indicator", so the "validity" row's US3-5 cell has no task. | Say per row and cell which phase's task adds it: the US2 cells to T034 with form-input plant classes, and the US3-5 cell to T052. |
| U4 | Underspecification | MEDIUM | tasks T011 (:100, US1-8 under `drive.readyState("interactive")`), T013 (:102), T001b (:73); contracts/testing.md:75-79 (`registerFirstLoad`, `drive.readyState` "in process") | The new `"interactive"` cell is written in the shared scenario body, but its step `drive.readyState` exists in process only. No fixture-page form is given, such as a fixture page inserting from a `DOMContentLoaded` handler under `startDocument`. T013 names only the first-load cells for the harness split. A harness check inside the body would be a conditional assertion, which test-lint forbids. T001b also lists `registerFirstLoad` and `drive.readyState` without marking them in-process only, while it marks `navigateAwayAndBack` as fixture only. | Give the cell a fixture-page step (or state that it is in process only, with how it is excluded without `skip` or a condition). Mark the in-process-only steps in T001b as the contract does. |
| A2 | Ambiguity | MEDIUM | contracts/testing.md:80-85 (`drive.after` "returns `ms` after"); tasks T001b (:73, "no earlier than `ms`"); T011 (:100, US1-13 cells), T031 (FR-027 merge) | The merge cells depend on the gap staying below `W`: changes 100 ms (`W/3`) apart count 1; `A`, `B`, `A` within the wait count 0; a change 10 ms after a write. `drive.after` has only a lower bound. On a slow runner, or in process with a small test `W`, where a frame of jitter is a large fraction, the gap can exceed `W`. The cell then fails with a wrong count, or silently tests a different case. | Have `drive.after` return the achieved gap (in page time) and have each such cell assert the gap is below `W` (and above the stated fraction), so a late step fails as a named assertion. |
| U5 | Underspecification | LOW | tasks T004 (:84); repository `vitest.config.ts` (root, lines 9-14 register `axTree`) | T004 registers the capture's browser commands in `packages/elements/vitest.config.ts`, a file that does not exist. `axTree` is registered in the root `vitest.config.ts`. | Change the path in T004 to `vitest.config.ts` (repository root). |
| I8 | Inconsistency | LOW | tasks T041 (:151), T021 (:117), T024 (:121); data-model.md:21 | T041 says phase 3 "adds" `ElementInternals` with its ARIA properties, but phase 2's notice already calls `attachInternals` and sets `internals.ariaLive` (T021). T024's floor check names "the features phase 2 uses" without listing them. | Name `ElementInternals` and its `ariaLive` in T024's floor check, and say "form association and the form-associated callbacks" for phase 3. |
| I9 | Inconsistency | LOW | tasks T010 (:99); `gates/test/contrast-required.test.ts:7` ("must equal A.8 as transcribed"); specs/002-design-tokens/spec.md:151, :316 (149 per theme with A.8) | After T010, the test that says it equals 002's Appendix A.8 holds 154 triples, while 002's spec record still says 149. The five added triples' source (010 R-04) is not named in the test. | Have T010 reword the comment at `:7` to name 010 R-04 as the source of the five added triples, so the record trail stays readable. |
| A3 | Ambiguity | LOW | tasks.md:50 ("a mutation shard over about 7 minutes"), plan decision 11 (plan.md:129) | "About 7 minutes" is not a decidable threshold for a stop point, unlike the "over 10 minutes" stop beside it. | Give the figure exactly (for example 7:00 measured as T002 states). |
| A4 | Ambiguity | LOW | tasks T031 (:137, "each absent reads `undefined`"); contracts/elements.md:259-261 (`readOnly` default `false`) | After listing `readOnly` as a boolean, T031 says "each absent reads `undefined`", which read literally includes `readOnly`, whose contract default is `false`. | Say "each absent string or number attribute reads `undefined`; `readOnly` reads `false`". |
| G12 | Coverage Gap | LOW | spec FR-035 (spec.md:896-898); tasks T034a (:141), T016b (:108), T024 (:121), T041 (:151) | Two FR-035 items are asserted only for the notice (T016b), not for form controls: that only the host's own `hidden` counts as a reveal (FR-027), and that hosts load the build before swapping in controls with `error`. T024 and T041 enumerate fewer items than their red tasks (for example T041 omits host `aria-labelledby`/`aria-describedby` and the `form` attribute). | Add both control items to T034a, and make T024 and T041 refer to their red tasks' lists instead of partial copies. |

**Coverage Summary Table:**

| Requirement Key | Has Task? | Task IDs | Notes |
|-----------------|-----------|----------|-------|
| FR-001 element-conventions | Yes | T011, T021, T022, T025, T031, T038, T039, T050, T055, T056, T062-T065 | |
| FR-002 open-shadow-font-inherit | Yes | T021, T031, T037, T050, T061 | |
| FR-003 no-io-no-other-events | Yes | T031, T038, T050 | |
| FR-004 notice-tone | Yes | T011, T021 | |
| FR-005 tone-contrast | Yes | T010, T018 | A.8 record trail (I9) |
| FR-006 heading-slot-absence | Yes | T011, T016b, T021, T024 | |
| FR-007 notice-size | Yes | T011, T021 | |
| FR-008 announce-rules | Yes | T011, T012, T013, T019, T020, T021 | Hidden-ancestor cell (G10); `"interactive"` cell harness (U4); merge-gap bound (A2) |
| FR-009 politeness-role-rows | Yes | T011, T012, T020, T021 | |
| FR-010 notice-forced-colours | Yes | T011, T021 | |
| FR-011 notice-focus-semantics | Yes | T011 | |
| FR-020 form-association | Yes | T032, T037, T050 | |
| FR-021 shared-attributes | Yes | T031, T037, T050 | |
| FR-022 naming | Yes | T031, T037 | |
| FR-023 validity | Yes | T031, T032, T037 | |
| FR-024 events | Yes | T031, T038, T050, T055 | |
| FR-025 size-look | Yes | T031, T038 | |
| FR-026 parts-slots | Yes | T030, T037, T039 | Parts not asserted in the form elements' manifest entries (G9) |
| FR-027 error-announcement | Yes | T031, T037 | Hidden ancestor, error while focused (G10) |
| FR-028 error-mark | Yes | T031, T038 | |
| FR-029 input-type-passthrough | Yes | T031, T038 | `readOnly` unset reading (A4) |
| FR-030 implicit-submission | Yes | T031, T032, T038 | |
| FR-031 select-options | Yes | T050, T055 | |
| FR-032 select-indicator | Yes | T050, T054, T055 | |
| FR-033 stories-baselines | Yes | T060-T065 | Phase 5 red/green check (C1) |
| FR-034 manifest | Yes | T016a, T022a, T025, T030, T036, T039, T056 | Form-input and form-select entries untested (G9); pinned element counts (I7) |
| FR-035 readme | Yes | T016b, T024, T034a, T041, T052a, T057, T066 | Two control items (G12); Entry points exact list (I7) |
| FR-036 changelog-engine-floor | Yes | T016b, T025, T034a, T041, T052a, T057 | Floor features of phase 2 (I8) |
| SC-001 scenarios-both-harnesses | Yes | T011, T013, T031, T033, T050, T051 | `"interactive"` cell (U4) |
| SC-002 announcement-matrix | Yes | T012, T013 | |
| SC-003 native-twins | Yes | T032, T050 | |
| SC-004 absent-heading-zero-gap | Yes | T011 | |
| SC-005 baselines-axe-gates | Yes | T061, T065 | |
| SC-006 form-control-readme | Yes | T034a, T041, T066 | |
| SC-007 mutation | Yes | T025, T041, T057, T066 (phase-end gates incl. `gate:mutation`) | |

**Constitution Alignment Issues:** none rated CRITICAL; no task, as written, breaks a MUST of the constitution by itself. Three HIGH findings concern Principle VIII and should be fixed before phase 1 starts:
- C1: phase 1's code and phase 5's stories are test paths, so no scaffold is possible and the old-code check is vacuous there.
- C2: phases 2 to 4 have no scaffold, so their red failures would be import errors.
- I7: the pinned surface tests would have to change in green.

**Unmapped Tasks:** none. Phase 1 (T001-T005) is the test infrastructure SC-001, SC-002 and Principle VIII require; T002 is the spike of plan decisions 1, 7 and 11; T054 is a refactor serving FR-032; T060 is the R-08 recheck FR-033 requires; T066 maps FR-035 and SC-006 to their red commits.

**Metrics:**

- Total Requirements: 35 (FR-001 to FR-011, FR-020 to FR-036, SC-001 to SC-007)
- Total Tasks: 59
- Coverage % (requirements with >=1 task): 100%
- Ambiguity Count: 3 (A2, A3, A4)
- Duplication Count: 0
- Critical Issues Count: 0

## Next Actions

- No CRITICAL issues. Resolve the three HIGH findings in tasks.md (and plan phase 1) before phase 1 starts:
  - C1: say how phase 1's red commit avoids import errors (stubs in the red commit) and how its tests are shown failing against code without the capture, since `tdd-check` check 2 cannot separate them. Say how phase 5's check is read.
  - C2: add a scaffold task, recorded by `scaffold.sh`, before the red commits of phases 2, 3 and 4.
  - I7: put the edits of "2 elements checked" (both manifest gate tests), `entryRows` and the exact `exports` list into each phase's red commit, with the list order stated.
- The MEDIUM findings are task edits:
  - G9: add form-input and form-select manifest entry tests.
  - G10: add the hidden-ancestor and error-while-focused cells.
  - G11: assign the cross-phase plant cells.
  - U4: give the `"interactive"` cell a fixture-page form, and mark the in-process-only driver steps.
  - A2: bound and assert the `drive.after` gaps.
- The LOW findings (U5, I8, I9, A3, A4, G12) are wording fixes and can go in the same pass.
- Suggested commands: edit `tasks.md` by hand (or re-run `/speckit-tasks`) for C1, C2, I7, G9-G12, U4, U5, A2-A4. Run `/speckit-plan` refinement for C1 (phase 1 text), I7 (structure tree, R-11 order) and U4 (`contracts/testing.md` driver steps). No spec change is needed.
