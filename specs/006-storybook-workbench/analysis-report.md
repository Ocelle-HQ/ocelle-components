---
analyzed_at: 2026-11-10T10:22:47Z
head: 5f37eab729d710688158108bb148a88434bf1934
critical: 1
high: 1
medium: 7
low: 4
coverage: 100
---

<!-- Saved verbatim by the orchestrator on the operator's instruction for this analysis (2026-11-10, "Save
verbatim"): analyst-anouk's write was blocked by the harness ("Subagents should return findings as text, not write
report files"), so the report came back as text and is saved here unchanged, as in 003. -->

## Specification Analysis Report

Artifacts read: `spec.md` (FR-001 to FR-031, SC-001 to SC-007, US1 to US4), `plan.md` and `tasks.md` (T001 to T074,
74 tasks) at `5f37eab`, checked against constitution 1.3.1. The tasks point at other design files, so these were read
too: `contracts/plants.md`, `contracts/gates.md`, `contracts/container.md` (run arguments), `research.md` R-14 and
the summary of R-01 to R-16. Three repository files were also read: the Complexity Tracking table of
`specs/001-repository-foundation/plan.md`, the exception rows of `specs/002-design-tokens/plan.md`, and
`gates/README.md` (deferred table). `.specify/extensions.yml` registers no hooks (`hooks: {}`).

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| D1 | Constitution Alignment | CRITICAL | specs/001-repository-foundation/plan.md:409 (Complexity Tracking); spec.md:471-472 (FR-024), 466-470 (FR-023); tasks.md:213-214 (T071, T072) | 001's row "Custom-elements manifest gate absent" has the sunset "the first element feature (#7) or #10". This feature is #10, so when it merges that sunset is reached, yet the manifest gate is still missing (out of scope, spec.md:549). FR-023 and T071 move the deferral to "#17 or #7" only in `gates/README.md`. FR-024 and T072 update only the three Storybook rows. The constitution requires every exception, here a missing merge gate, to be recorded in a plan's Complexity Tracking with a sunset condition and the operator's approval. After this feature, the manifest exception's recorded sunset has passed and its new owner exists only in the README. | Add 001's manifest row to FR-024 and T072: change its sunset to "the first element feature (#17 or #7)", citing the operator's spec prompt (spec.md:16-17) as the approval. Or record the row in this plan's Complexity Tracking. |
| C1 | Coverage Gap | HIGH | spec.md:170-173 (US2 scenario 13), 384-389 (FR-030); tasks.md:130 (T023), 146 (T036); contracts/plants.md:48-53; research.md R-14 | US2 scenario 13 and FR-030 list xhr, WebSocket, EventSource, ping, session storage, the Cache API, clipboard writes, `execCommand` copy and cut, beacons, and storage left when the render ends. Only fetch, `localStorage.setItem`, named-property `localStorage`, `document.cookie` and `indexedDB.open` have a plant or an integration test. The other kinds are covered only by T023's classification unit tests. The recorder wraps and request hooks that feed those tests (T036, `story-page.ts`, wiring) are excluded from mutation by `Stryker disable` comments, which by tasks.md:16-18 must name a real integration test. No such test exists for these kinds, so a broken wrap (for example `CacheStorage.prototype`, `navigator.sendBeacon` or the storage-state backstop) would pass every check. | Add plants or one integration fixture per untested kind (at least xhr, WebSocket, `sessionStorage`, `caches.open`, `navigator.clipboard.writeText`, `execCommand("copy")`, `sendBeacon`, and a write the recorder misses but the storage-state read catches), each expecting `io` on both themes, to contracts/plants.md and T027 or T040. |
| G1 | Coverage Gap | MEDIUM | spec.md:346-349 (FR-008); contracts/gates.md:72-73; tasks.md:134 (T027), 149 (T039) | FR-008 requires the baseline command to report the number and total size of the baselines it wrote (contract line `baselines: wrote <n> files (<changed> changed, <removed> removed), <bytes> bytes in total`). No test asserts this line. T027 checks only that nothing is written on an unchanged tree, and T039 records the size by hand. | Add the summary line to T021 (from `updatePlan`) or T027 (the plant-mode regeneration prints the expected counts and bytes). |
| G2 | Coverage Gap | MEDIUM | spec.md:130-133 (US2 scenario 2), 330-334 (FR-005); contracts/gates.md:57-60; tasks.md:127 (T020), 133 (T026), 147 (T037) | FR-005 requires kept outputs in `storybook/.visual/`: `.actual.png` and `.diff.png` per `differs`, `.run-1.png` and `.run-2.png` per `nondeterministic`, and run 1's capture in baseline layout under `storybook/.visual/baselines/` for `differs` and `missing-baseline`. CI's role as producer of record depends on these files. T020 tests the diff-image function and T026 the upload step, but no test checks that the gate writes these files with these names and layout. Plants judge findings only. | Add to T027 one `differs` and one `missing-baseline` run that asserts the files and the baseline-layout copy, with bytes equal to the capture. |
| G3 | Coverage Gap | MEDIUM | spec.md:178-179 (US2 scenario 15), 364-366 (FR-012); contracts/plants.md:42, 67 | The only control for `pass-overflow-and-popover` is `fail-overflow-changed`, which changes only the overflowing child. Nothing changes the top-layer popover alone. A capture that leaves out top-layer content would make its own baselines without it and pass, so the top-layer clause of FR-012 has no control (constitution VIII, assertions that can fail). | Add a fail plant (`baselinesOf: "pass-overflow-and-popover"`) that changes only the popover's content and expects `differs` on both themes. |
| G4 | Coverage Gap | MEDIUM | spec.md:390-394 (FR-031); contracts/plants.md:57, 68 | `fail-hover-style-changed` is the control for the hover story of `pass-hover-and-press`. The press story has no control: if a press state were silently not applied, its baselines would be made without it and still pass, which is the failure FR-031 says must never be silent. | Add a fail plant that changes only the `:active` rule of the press story and expects `differs` on both themes. |
| F1 | Inconsistency | MEDIUM | tasks.md:109 (T018), 145 (T035), 132 (T025) | T018 (phase 2) says to run `gate:plants` "with `--skip-container` if the visual gate is still a stub". `--skip-container` does not exist until T035 in phase 3 (it is not in `gates/` today). Also, `visual` is not registered in `gates.json` until T042, so in phase 2 the plant job has no `visual` plants to skip. | Remove the clause from T018, or replace it with "no `visual` plants exist yet". |
| F2 | Inconsistency | MEDIUM | tasks.md:226 (Dependencies), 204 (T065), 213 (T071), 215 (T073) | "Phase 5 (US4) depends only on Phase 1 and can follow any phase" is wrong. T071's README must list the three gates' plants (made in T016, T040 and T058). T065 and T073 document the pointer parameter, the plant mode (`--plant`, `--story`), the Plants job's artifact and `pass-second-render` (phase 3). FR-023's seventeen checks need all three jobs. Running Phase 5 early would document behaviour that does not exist yet. | Change the line to "Phase 5 depends on Phases 2 to 4 for T065, T071 and T073; T061 to T064 and T066 to T070 depend only on Phase 1". |
| F3 | Inconsistency | MEDIUM | spec.md:428 (FR-017); tasks.md:99, 108, 133, 152, 175, 184 (T011, T017, T026, T042, T053, T059); plan.md:113 | "The FR-020 list" means the gate list of 001's FR-020 (`gates/lib/registry.ts`). This spec has its own FR-020, the CSP retarget, and the tasks cite both meanings: Phase 5's goal "FR-020 to FR-025" against "the FR-020 list" in six registry tasks. Readers must guess which one is meant. | Write it "001 FR-020's list (`gates/lib/registry.ts`)" in FR-017 and in the tasks, or name the list itself. |
| F4 | Inconsistency | LOW | spec.md:444 (FR-017 `axe`), 192-193 (US3 Independent Test); contracts/plants.md:79; tasks.md:174 (T052) | FR-017 says the unlabelled-control plant gives "(one finding)", but the plant contract and T052 expect two (one per theme). "Two text nodes below the contrast threshold (two findings)" is likewise per theme in the contract ("in each theme it fails"). SC-003 judges "exactly its expected findings", and the contract is the exact source, so this does not block. | Say "one finding per theme" in FR-017. |
| A1 | Ambiguity | LOW | spec.md:313 (FR-001); contracts/gates.md:25-27 | FR-001 says exit 2 for "configuration unreadable". The contract lists exit-2 causes as a missing `storybook/package.json` or build script, an unresolvable CLI, `pnpm` missing, and an unreadable `dist/index.json`. A broken `.storybook/main.ts` would be a `build-error` (exit 1) at `storybook/package.json`. Which configuration counts as "unreadable" is not stated. | Name the configuration in FR-001 (`storybook/package.json` and the built index), matching the contract. |
| A2 | Ambiguity | LOW | plan.md:71 (Performance Goals); tasks.md:41 (Stop-and-ask) | The thresholds are vague: "each new job well under 10 minutes" and "the Plants job near 30 minutes". | Give numbers (for example "stop and ask when the Plants job exceeds 25 minutes"). |
| U1 | Underspecification | LOW | contracts/gates.md:44 (`render-timeout`); spec.md:328-329 (FR-004); tasks.md:130 (T023) | The contract adds a `render-timeout` finding (no render signal within 15 s) that the spec does not name. It has a unit test (T023) but no plant, so the timeout itself is never seen to fire. | Name it in FR-004 as a kind of failing to render, or add a plant (a story whose render never resolves). |

**Coverage Summary Table:**

| Requirement Key | Has Task? | Task IDs | Notes |
|-----------------|-----------|----------|-------|
| FR-001 storybook-build-gate | Yes | T004, T008, T009, T010, T014, T015, T016 | A1 |
| FR-002 build-no-network-summary | Yes | T010, T064, T070 | telemetry test kept unchanged |
| FR-003 capture-every-story-both-themes | Yes | T021, T027, T031, T037 | |
| FR-004 visual-findings | Yes | T021, T031, T040 | U1 |
| FR-005 keep-diff-and-baseline-layout | Yes | T020, T026, T037, T042, T046 | G2 |
| FR-006 deterministic-capture | Yes | T020, T023, T027, T040 | |
| FR-007 pinned-amd64-image | Yes | T001, T002, T022, T032 | |
| FR-008 baseline-command | Yes | T021, T027, T037, T039 | G1 |
| FR-009 two-layers | Yes | T022, T023, T027, T032, T033, T040 | |
| FR-010 baseline-naming | Yes | T021, T031 | |
| FR-011 twelve-story-baselines | Yes | T039 | |
| FR-012 full-page-capture | Yes | T023, T027, T040 | G3 |
| FR-013 axe-per-node-findings | Yes | T048, T055, T058 | |
| FR-014 axe-empty-outside-root-closed | Yes | T049, T055, T056, T058 | |
| FR-015 axe-from-index-count | Yes | T052, T056 | |
| FR-016 axe-rule-set | Yes | T047, T055 | |
| FR-017 plants-and-ci-jobs | Yes | T011, T016, T017, T026, T040, T042, T053, T058, T059 | F3, F4 |
| FR-018 plant-job-container | Yes | T025, T026, T035, T041, T042 | |
| FR-019 mutation-scope | Yes | T019, T029, T018, T043, T060, T074 | |
| FR-020 csp-packages-only | Yes | T061, T066, T068 | |
| FR-021 render-test-kept-assertions | Yes | T064, T070 | |
| FR-022 prefix-scope-unchanged | Yes | T062, T069 | |
| FR-023 readme-gates-and-checks | Yes | T071 | D1, F2 |
| FR-024 close-exception-rows | Yes | T072 | D1 |
| FR-025 contributor-note | Yes | T065, T073 | F2 |
| FR-026 double-capture-cross-engine | Yes | T022, T027, T040, T045 | |
| FR-027 font-and-closed-shadow | Yes | T024, T034, T036, T038, T040 | |
| FR-028 fresh-page | Yes | T027, T040, T056, T058 | |
| FR-029 axe-exceptions | Yes | T004, T050, T055, T057, T058 | |
| FR-030 run-time-io | Yes | T023, T033, T036, T040 | C1 |
| FR-031 pointer-states | Yes | T023, T033, T040, T051, T056, T058 | G4 |
| SC-001 baselines-24 | Yes | T039, T043 | |
| SC-002 cross-engine-ci | Yes | T040, T044, T045 | |
| SC-003 plants-exact | Yes | T016, T040, T041, T058, T045 | |
| SC-004 axe-100-percent | Yes | T052, T057, T060 | |
| SC-005 note-test-and-walkthrough | Yes | T065, T073, T074 | |
| SC-006 one-pixel-one-finding | Yes | T020, T040 (`fail-one-pixel`) | |
| SC-007 no-storybook-iv-exception | Yes | T071, T072 | |

**Constitution Alignment Issues:**

- D1 (CRITICAL): the custom-elements manifest exception in 001's Complexity Tracking has "#10" as its sunset. This
  feature reaches that sunset without the gate and without moving the row (constitution, Development Workflow:
  exceptions recorded in Complexity Tracking with a sunset and the operator's approval; the manifest check is a
  listed merge gate).
- C1 touches constitution VIII (assertions that can fail, gates proven). It is rated HIGH, not CRITICAL, because
  every new gate does have fail, pass and breaking plants. The gap is the run-time I/O kinds that have no
  end-to-end test.
- The rest of the plan meets the constitution. Principle III is met by axe on every story in both themes. Principle
  IV: the Storybook is not a package output, per the operator's decision Q1 (a), so both 002 exceptions close.
  Principle V: baselines come from the pinned container and the gate fails on missing and stray ones. Principle
  VIII: every phase has a red commit and `red.sh`, `tdd-check.sh` and mutation, and `tdd-exempt.md` covers phase 1's
  exempt tasks.

**Unmapped Tasks:** none. T005 (`tdd-exempt.md`) and the check runs T018, T043, T060 and T074 serve constitution
VIII and their phases. T044 is the stop-and-ask for the CI run that SC-002 needs.

**Metrics:**

- Total Requirements: 38 (31 functional, 7 buildable success criteria)
- Total Tasks: 74
- Coverage: 100% (38 of 38 requirements have at least one task)
- Ambiguity Count: 2 (A1, A2)
- Duplication Count: 0
- Critical Issues Count: 1 (D1)

### Next Actions

- Resolve D1 before `/speckit-implement`. Extend FR-024 (spec) and T072 (tasks) so that 001's "Custom-elements
  manifest gate absent" row gets the sunset "the first element feature (#17 or #7)". The operator's spec prompt
  already states this ownership, so this is an edit to the spec and tasks; the operator confirms it at the tasks
  gate.
- Fix C1 before Phase 3 starts: in contracts/plants.md § `visual` and in T040 (or a T027 fixture), add one fail
  plant per untested run-time I/O kind, including a storage write that only the storage-state backstop catches.
- Medium items, best fixed by editing `tasks.md` and contracts/plants.md before the phase they belong to:
  - G1, G2: assertions in T027 or T021;
  - G3, G4: two control plants;
  - F1: T018's `--skip-container` clause;
  - F2: the Phase 5 dependency line;
  - F3: the "FR-020 list" wording.
- Low items (F4, A1, A2, U1) are wording fixes and can be made in the same pass or left as they are.
- Suggested commands:
  - "Run /speckit-specify with refinement" for FR-024 (D1), FR-017 (F3, F4), FR-001 (A1) and FR-004 (U1);
  - "Manually edit tasks.md to add coverage for 'run-time-io' kinds, 'baseline-command summary', 'kept outputs',
    'top-layer control' and 'press control'", together with contracts/plants.md.
