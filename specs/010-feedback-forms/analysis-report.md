---
analyzed_at: 2026-11-13T16:42:06Z
head: 5cb5420a3efef7769d218e67e39db04c70a3e60a
critical: 0
high: 0
medium: 2
low: 2
coverage: 100
---

## Specification Analysis Report

Feature: `specs/010-feedback-forms` (spec.md, plan.md, tasks.md; research.md, data-model.md, contracts/ and quickstart.md read where a task points at them), after `reviews/analysis/fixes-3.md`. Constitution 1.3.1. No `before_analyze` or `after_analyze` hooks are registered (`.specify/extensions.yml` has `hooks: {}`).

All 10 findings of the previous report (head 6e748fe) are resolved as `fixes-3.md` records. Its repository claims were re-checked and match:
- the pinned fragments `packages/elements/test/node/readme.test.ts:33`, `:74`, `:79` against `packages/elements/README.md:189-196` and `:234-238`;
- the normaliser's attribute filter and `isPublic` (`packages/elements/scripts/manifest.ts:66-68`, `:72-75`);
- the gate's `no-description` check (`gates/bin/manifest.ts:96-106`);
- `git diff <base>` in `gates/bin/mutation.ts:142`, and the shard limits `gates/lib/mutation/shards.ts:43-45` (30 lines, 10 entries, 250 lines);
- `test/browser/serve.ts:30`, `:35`, `:59`, `:115-126` and `test/browser/global-setup.ts`'s test-host bundle;
- the story pathspec (`story-config.yml`: `storybook/stories/render.ts` is not a test path);
- `.github/workflows/ci.yml:84-89`.

One thing could not be checked here: how analyzer 0.11.0 merges the `@attribute` tag with the bare `observedAttributes` entry. The analyzer is not installed in this container. The artifacts make that a recorded check in T036, with a stop-and-ask.

The findings below are new; IDs continue the previous reports' numbering.

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| C5 | Constitution Alignment | MEDIUM | contracts/testing.md:289 (Seams, "timing values": each call "must throw the check's message"), :315 (shipped-timing row); research.md:587-590; tasks T009a (:132: scaffold `announcerDefaults` neutral `{0, 0, 0}`), T014 (:140), T016 (:143), T017 (:147: "each on an assertion as T009a lists"); constitution VIII ("Run against the code as it was, they MUST fail"; "Assertions that can fail") | The shipped-timing plant row passes when it should fail. It only asserts that `checkShippedTiming` throws, first for `{ ...announcerDefaults, delayLoaded: 0 }` with the real first return, then for the real `announcerDefaults` with another first return. At the scaffold and the red commit, `announcerDefaults` is the neutral `{0, 0, 0}` and the first return is the stub's `undefined`, so both calls throw. The row therefore passes at the red commit and at `tdd-check.sh` check 3. It would also pass for a check that throws on everything. T009a's list of what each red test fails on does not name this row. The oracle row (T001c) avoids the same gap by also asserting that the unplanted case passes; this row has no such assertion. The suite-level red holds, so this is not CRITICAL. | Add to the row (contracts/testing.md § Plants, Seams; T016) an assertion that `checkShippedTiming(announcerDefaults, firstReturn)` with the real values does not throw. Against the scaffold the row then fails on its assertion. Name the row in T009a's list. |
| U10 | Underspecification | MEDIUM | tasks T016b (:145: `:79` becomes "On `ocelle-icon` and `ocelle-brand-mark`, a host `role` or `aria-hidden="false"` is not supported …"); `packages/elements/README.md:194-196`; spec FR-022 (:770-796), FR-034 (:888-899), FR-035; contracts/elements.md:53-58 (form controls' "Documented, not declared"); T034a (:183), T041 (:194) | The I10 fix limits the README's "host `role` or `aria-hidden="false"` is not supported" sentence to the two 005 elements. The notice gets its own role text. For the form controls, no artifact says anything about a host `role` or `aria-hidden="false"`. The spec, the contract's documented list and T034a's README items are all silent. Before the fix the unscoped sentence covered them. After it, the README states no rule for them, and no scenario fixes an outcome. The same holds for `aria-hidden="false"` on the notice. | State the form controls' rule in FR-022 or FR-035, for example "a host `role` or `aria-hidden="false"` is not supported", as for 005's elements. Add it to contracts/elements.md's documented list and to T034a's README items, with a fragment, in the red commit. Do the same for `aria-hidden="false"` on the notice in T016b. |
| I14 | Inconsistency | LOW | `packages/elements/test/node/readme.test.ts:75-76` ("When both are set, the host `aria-label` is the name; removing it falls back to `label`"; "Chromium uses a host `aria-label` as written, surrounding spaces included …"); `packages/elements/README.md:189-191`; tasks T034a (:183), T041 (:194); data-model.md:467 ("computed name: FR-022 order: host `aria-label`; else …") | Of the § Host ARIA sentences, the fix restates only `:74`. The pinned `:75` stays unscoped, and a form control with a blank host `aria-label` and a `label` contradicts it (the `label` names the control). It reads as limited to the two 005 elements only while it stays right after the restated `:74` in the same paragraph, and no task requires that. Similarly, `:76`'s "as written, surrounding spaces included" is not stated for the form controls' inner control, whose name comes through the name span. data-model.md's computed-name row leaves out the blank-skip rule. | In T034a, either limit `:75` (and `:76` if needed) to the two 005 elements or state in T041 that they stay in the paragraph the restated `:74` opens. Add "a non-blank host `aria-label`" to data-model.md's computed-name row. |
| I15 | Inconsistency | LOW | tasks T016b (:145: `:33` becomes "… every public property a description and a `@default` tag with the value the property reads before anything sets it, `@default undefined` for an optional one …"); contracts/elements.md:43-47 (`form`, `labels`, `validity`, `validationMessage`, `willValidate` with no default); T030 (:178), T050a (:213) | The restated convention requires a `@default` tag on every public property. The form controls' read-only properties have no default in the contract, and T030 and T050a assert none for them. So the convention text written in phase 2 does not fit the members phase 3 adds, which is the kind of mismatch FR-001 says the README restates in the phase that adds the element. | Limit the restated `:33` text to settable properties (for example "every public property that can be set"), or give the read-only properties a stated default and assert it in T030 and T050a. |

**Coverage Summary Table:**

| Requirement Key | Has Task? | Task IDs | Notes |
|-----------------|-----------|----------|-------|
| FR-001 element-conventions | Yes | T011, T016b, T021, T022, T024, T025, T031, T034a, T038, T039, T041, T050, T055, T056, T062-T065 | Restated convention text: read-only properties' `@default` (I15) |
| FR-002 open-shadow-font-inherit | Yes | T021, T031, T037, T050, T061 | |
| FR-003 no-io-no-other-events | Yes | T031, T038, T050 | |
| FR-004 notice-tone | Yes | T011, T021 | |
| FR-005 tone-contrast | Yes | T010, T018 | |
| FR-006 heading-slot-absence | Yes | T011, T016b, T021, T024 | |
| FR-007 notice-size | Yes | T011, T021 | |
| FR-008 announce-rules | Yes | T011, T012, T013, T019, T020, T021 | |
| FR-009 politeness-role-rows | Yes | T011, T012, T016b, T020, T021, T024 | |
| FR-010 notice-forced-colours | Yes | T011, T021 | |
| FR-011 notice-focus-semantics | Yes | T011 | |
| FR-020 form-association | Yes | T032, T037, T050 | |
| FR-021 shared-attributes | Yes | T030, T031, T036, T037, T038, T050 | |
| FR-022 naming | Yes | T031, T034a, T037, T041 | Host `role` / `aria-hidden="false"` on form controls (U10); unscoped `:75` (I14) |
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
| FR-033 stories-baselines | Yes | T060-T066 | |
| FR-034 manifest | Yes | T016a, T022a, T025, T030, T036, T039, T050a, T056 | |
| FR-035 readme | Yes | T016b, T024, T034a, T041, T052a, T057, T066 | Form controls' host-role rule missing (U10) |
| FR-036 changelog-engine-floor | Yes | T016b, T024, T025, T034a, T041, T052a, T057 | |
| SC-001 scenarios-both-harnesses | Yes | T011, T013, T031, T033, T050, T051 | |
| SC-002 announcement-matrix | Yes | T012, T013 | |
| SC-003 native-twins | Yes | T032, T050 | |
| SC-004 absent-heading-zero-gap | Yes | T011 | |
| SC-005 baselines-axe-gates | Yes | T061, T065 | |
| SC-006 form-control-readme | Yes | T034a, T041, T066 | |
| SC-007 mutation | Yes | T002, T014, T016, T025, T041, T057, T066 (phase-end gates incl. `gate:mutation`) | Shipped-timing plant row's red evidence (C5) |

**Constitution Alignment Issues:** none rated CRITICAL. No task, as written, breaks a MUST of the constitution by itself.
- C5 (Principle VIII): the suite-level red holds in phase 2. One new plant row, the shipped-timing row, passes at the scaffold and the red commit, because its only assertion is that planted values throw.

**Unmapped Tasks:** none.
- Phase 1 (T001-T005a) is the test infrastructure SC-001, SC-002 and Principle VIII require; T002 is the spike of plan decisions 1, 7 and 11.
- The scaffolds T009a, T029a and T049a serve Principle VIII for phases 2 to 4.
- T054 is a refactor serving FR-032.
- T060 is the R-08 recheck FR-033 requires.
- T066 maps FR-035 and SC-006 to their red commits and records phase 5's red evidence.

**Metrics:**

- Total Requirements: 35 (FR-001 to FR-011, FR-020 to FR-036, SC-001 to SC-007)
- Total Tasks: 67
- Coverage % (requirements with >=1 task): 100%
- Ambiguity Count: 0
- Duplication Count: 0
- Critical Issues Count: 0

## Next Actions

- No CRITICAL or HIGH issues. Implementation may proceed once #10 is merged, as the operator's wave planning requires. The MEDIUM findings are best fixed before the phase each one affects.
- Before phase 2's red commit:
  - C5: give the shipped-timing plant row an unplanted assertion, so it fails against the scaffold. Name it in T009a's list.
  - U10 (notice part): state the notice's rule for `aria-hidden="false"` in T016b.
- Before phase 3's red commit:
  - U10: state the form controls' host `role` and `aria-hidden="false"` rule in FR-022 or FR-035, contracts/elements.md and T034a.
  - I14: limit or place the pinned `:75` and `:76` Host ARIA sentences; add the blank-skip rule to data-model.md's computed-name row.
  - I15: limit the restated `@default` convention to settable properties, or give the read-only properties a stated default.
- Suggested commands:
  - Edit `tasks.md` by hand (or re-run `/speckit-tasks`) for C5, U10, I14 and I15.
  - Refine with `/speckit-plan` for contracts/testing.md § Plants, Seams (C5), contracts/elements.md (U10) and data-model.md (I14).
  - Change the spec (FR-022 or FR-035) only for U10.
