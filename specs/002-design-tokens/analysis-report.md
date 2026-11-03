---
analyzed_at: 2026-11-03T23:51:23Z
head: 47a953422750be645eb98c84b1bb5ad8567641bd
critical: 1
high: 1
medium: 5
low: 11
coverage: 97.1
---

> Saved verbatim by the /ocelle-run orchestrator, on the operator's instruction (2026-11-03): the harness blocked
> analyst-anouk's own write of this file ("Subagents should return findings as text"), and she returned it as text.

## Specification Analysis Report

Artifacts: `spec.md` (with Appendix A), `plan.md`, `tasks.md` (T001 to T067), checked against constitution 1.3.1, with `contracts/gates.md`, `contracts/token-package.md`, `data-model.md` and `research.md` read where tasks cite them. No `hooks.before_analyze` or `hooks.after_analyze` are registered in `.specify/extensions.yml`.

Figures cited by tasks were recomputed with the WCAG 2.x formula and agree: `#8F5E0F` on `#211D18` 3.012 (T051), `color-chrome-muted` on the light `color-chrome-hover` 6.218 (T059), `color-chrome-ink` on it 13.835, its luminance 0.0127 and 1.107:1 against `color-chrome` (plan Decisions 1), `#15130F` on `#F1EEE8` 16.02, `color-control-border` on `color-rail` 3.02. The A.8 row totals add to 149; with the A.9 excluded pairs the list has 158 light and 157 dark entries, as T059 and the phase 5 independent test state. "14 checks" in T062 matches the twelve now in `gates/README.md` plus two.

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| C1 | Constitution | CRITICAL | plan.md:L233, plan.md:L78; spec.md:L387-L409 (FR-023) | Under Complexity Tracking, plan.md's row "Exceptions to principles" says "None taken beyond" two items: the Storybook page's added `connect-src 'self'`/`frame-src 'self'` (with `font-src 'self'`), and the narrowed static `csp` scope, which leaves every `storybook/dist/` bundle to the run-time test. The row gives scope and operator approval but no sunset condition. Constitution IV says built output runs under `default-src 'none'; script-src 'self'; style-src 'self'` "with no exception". Governance requires every exception in Complexity Tracking to have scope, rationale and a sunset condition. The Constitution Check calls the same items "readings" (not exceptions), so the plan contradicts itself on whether an exception is taken. | Before `/speckit-implement`, the operator rules on this and the plan records the ruling. Choose one. (a) These are exceptions: give each its own Complexity Tracking row with scope, rationale and a sunset condition (for example "reviewed when #10 extends this Storybook" or "when the pinned Storybook runs without connect/frame"). (b) They are readings: state that the constitution IV term "built output" means the published packages' output and that the Storybook page is a host. Then remove them from the "Exceptions" row. |
| F1 | Inconsistency (task order) | HIGH | tasks.md:T021, T028 (phase 2); T050 (phase 5); contracts/gates.md:L6-L12; gates/lib/plant-repo.ts:L154 | Phase 2 adds `packages/tokens/contrast/pairs.json` to `configurationSet` (T021 test, T028 implementation), and the T021 integration test checks that a plant root contains it. The file is first created in phase 5 (T050 scaffold, `[]`). `buildRepoTree` copies each configuration path with `cp` and does not tolerate a missing source. Phase 2's `gate:plants` run (T029) would then fail for every `repo-tree` plant, and so would the T021 integration test. | Make phase 2 create `pairs.json` (as `[]`, as T050 does), or move the `pairs.json` part of T021/T028 to phase 5 (T055/T060). Record the choice in tasks.md. |
| U1 | Underspecification | MEDIUM | tasks.md:T016, T026, T032, T040, T047; spec.md:L219-L220 (edge case) | `packages/tokens/fonts/` first exists in phase 4 (T047), and git does not keep an empty directory. Yet `scripts/build.ts` (T026, phase 2, run by `pnpm -r build` in T029) and `swatches.ts` (T032/T040, phase 3) copy it. The tasks do not say what either does when the directory is missing. Meanwhile the spec's edge case says a missing font file makes the build or the font test fail. | State in T026 and T040 that a missing `fonts/` is skipped before phase 4 (the font test of T043 catches it afterwards), or commit a placeholder in phase 2. Have T016 or T032 test that behaviour. |
| E1 | Coverage gap | MEDIUM | spec.md FR-014, US2 scenario 2 (L111-L113); tasks.md:T048 | No test covers `THIRD_PARTY_NOTICES`: the font entry with its licence, repository, full commit and package paths, and the removal of "No third-party asset ships yet." T048 only edits the file, and the phase 4 independent test checks it by reading. The README, by contrast, is tested (T020, T045). | Add to T043 or T045 a test that reads `THIRD_PARTY_NOTICES` and checks every field against `fonts/SOURCE.json`. The alternative is to record a documentation exemption with its reason in the phase 4 review. |
| E2 | Coverage gap | MEDIUM | spec.md FR-023 (L385-L386); plan.md:L63; tasks.md:T034 | FR-023 requires that the Storybook build make no network request. Only the telemetry setting is tested (T034). No task watches network access during the build, for example during the `storybook-integration` global-setup build or the spike. | Have T030 record network access during the build. Add to T036's global setup (or a separate check) an assertion that the build runs with the network blocked, or record why the telemetry test is sufficient. |
| I1 | Inconsistency | MEDIUM | spec.md FR-023 (L417-L420); plan.md Decisions 4 (L94-L99); tasks.md stop-and-ask (L18-L20), T030 | According to FR-023 and the plan, the spike "then runs the widened `csp` and `prefix` gates on the files in scope". The stop-and-ask list includes "a widened gate failing on in-scope files". T030's steps (1) to (5) do not include that run, and the widened gates only exist after T041. | Either add a step to T030 that runs the widened scope by hand (as step 1 does for the bundles), or move that stop-and-ask point to T042 and say so in FR-023's spike sentence. |
| E3 | Coverage gap | MEDIUM | spec.md edge case L211-L212; tasks.md:T017 | The edge case says that when `data-theme` changes at run time, the tokens follow the new value without a reload. T017 tests only removing the attribute at run time (US1 scenario 5), not switching between `light` and `dark`. | Extend T017 so the attribute is switched light→dark→light at run time and the values are checked after each switch. |
| E4 | Coverage gap | LOW | spec.md FR-023 (L393); research.md:L481; tasks.md:T036 | FR-023 requires the run-time browser test to also assert the CSP header served. R-10 includes this, but T036's text does not. | Add "asserts the `Content-Security-Policy` header served equals the Storybook page's header" to T036. |
| I2 | Inconsistency | LOW | spec.md US3 scenario 2 (L149-L153); contracts/gates.md:L210-L212 | The spec's example says `color-ink-muted` "4.3:1 on `color-inset`" gives three `below-threshold` findings, including `color-accent-low`. At exactly 4.3, `color-accent-low` comes out at 4.509, which is not below 4.5, so there would be two findings. The contract plant uses `#6B655A` (4.27, so `color-accent-low` is 4.48) and gets three. | Change the spec example to "about 4.27:1 (`#6B655A`)", or leave it and rely on the plant, which lists its findings from `--print`. |
| I3 | Inconsistency | LOW | plan.md:L213-L214; tasks.md:T055, T060 | plan.md's Phases section puts `delta.json` plants and keyed locations under US1. The tasks put them in phase 5 (US3), where their only users, the `contrast` and `brand-rules` plants, are. | No change needed to the tasks. The plan's Phases list can be aligned when it is next edited. |
| I4 | Inconsistency | LOW | plan.md:L190; tasks.md:T037, T038 | plan.md's source tree lists "scope tests" under `storybook/test/unit/`. The tasks put the scope tests in `gates/test/csp.test.ts`, `prefix.test.ts` and `mutation-ranges.test.ts`. | Align the plan tree with the tasks. |
| I5 | Terminology | LOW | tasks.md:T038 | "the FR-022 (001) families" refers to 001's FR-022, while this feature's FR-022 is the `gates/README.md` requirement. A reader can confuse the two. | Write "001's FR-022 monospace list" or name the list (`monospaceFamilies`). |
| A1 | Ambiguity | LOW | tasks.md:T032 | "none for `color-overlay`'s ground use" leaves open whether `color-overlay` (translucent) gets a swatch rule at all. The sentence before it says swatches are generated per opaque colour token. | State "none for `color-overlay` (not opaque)", or state how the story shows it. |
| A2 | Ambiguity | LOW | tasks.md:T045 | The positive control for the platform-font check is "before the face loads, or with the font file removed". The two differ in how reliably they can fail, and the task leaves the choice to the implementer. | Name one, preferably the font file removed (served 404), since it is deterministic. |
| E5 | Coverage gap | LOW | spec.md FR-026; tasks.md (none) | FR-026 is exempt (it is shown by review), but no task asks a phase review to trace each value to Appendix A or the prototype file. | Add a review checklist line to the phase 2 review (trace values to Appendix A and `sources/console-v2-tokens.md`) and to the phase 4 review (font checksum). |
| E6 | Coverage gap | LOW | spec.md edge case L213-L214 | No task covers the edge case that tokens inherit through shadow roots. This is platform behaviour, and elements are out of scope. | Acceptable as is. Optionally add a shadow-root probe to T018. |
| E7 | Coverage gap | LOW | plan.md:L58-L60 | The performance goals "each new gate under 10 s" and "browser tests under 60 s" have no task that measures them. Only the mutation shard time is measured (T030). | Have T063 and T029/T049 record the timings, or drop the goals from the plan. |
| C2 | Constitution | LOW | plan.md:L79; constitution III, V; specs/001 plan Complexity Tracking | This feature adds the first stories, but they have no axe run and no visual baseline. 001's exception ("Storybook build, visual regression and axe gates absent", sunset when #10 merges) covers this. The 002 plan does not refer back to that exception. | Cite 001's exception and its sunset in the 002 Constitution Check row V. |

**Coverage Summary Table:**

| Requirement Key | Has Task? | Task IDs | Notes |
|-----------------|-----------|----------|-------|
| FR-001 every-token-as-ocelle-property | Yes | T009, T010, T017, T025 | |
| FR-002 values-and-derived-by-reference | Yes | T010, T011, T025 | |
| FR-003 excluded-tokens-absent | Yes | T009, T010, T012, T017 | |
| FR-004 external-stylesheet | Yes | T016, T019, T026, T029 | |
| FR-005 theme-selection | Yes | T011, T017 | Run-time switch not tested (E3) |
| FR-006 six-conditions-real-browser | Yes | T011, T017 | |
| FR-007 reduced-motion | Yes | T011, T018 | |
| FR-008 json-export-one-source | Yes | T012, T014, T025 | |
| FR-009 typed-names | Yes | T015, T025 | |
| FR-010 unknown-token-style-lint | Yes | T022, T028, T029 | |
| FR-011 vendored-font-checksum | Yes | T043, T047 | |
| FR-012 font-face-and-csp-doc | Yes | T044, T045, T048 | |
| FR-013 font-family-values | Yes | T010, T044 | |
| FR-014 third-party-notices | Yes | T048 | Implementation only, no test (E1) |
| FR-015 no-off-origin-request | Yes | T045 | |
| FR-016 pair-list-required-set | Yes | T052, T053, T059 | |
| FR-017 wcag-ratio-and-figure-precision | Yes | T051, T053 | |
| FR-018 forced-colours-guard | Yes | T020, T054, T061 | |
| FR-019 brand-rules-a-to-g | Yes | T054, T058, T061 | |
| FR-020 two-gates-with-plants | Yes | T055, T056, T060, T061 | |
| FR-021 counts-and-zero-exit-2 | Yes | T053, T054 | |
| FR-022 gates-readme-registry | Yes | T056, T061, T062 | |
| FR-023 token-storybook-strict-csp | Yes | T030-T042 | Build network (E2), spike gate run (I1), header assertion (E4) |
| FR-024 sk-mapping-table | Yes | T064, T066, T067 | |
| FR-025 changelog | Yes | T020, T027 | |
| FR-026 no-copied-values | No | none | Exempt (shown by review); no review task (E5) |
| SC-001 every-token-six-conditions | Yes | T017, T018 | |
| SC-002 css-json-agree | Yes | T014 | |
| SC-003 font-under-csp | Yes | T045 | |
| SC-004 pair-counts-and-plants | Yes | T052, T053, T061 | |
| SC-005 pr-fails-on-drop | Yes | T061, T063 | Via threshold plants and CI job |
| SC-006 misspelt-token-lint | Yes | T022, T028 | |
| SC-007 no-deferred-contrast | Yes | T056, T062 | |
| SC-008 storybook-csp-and-monospace | Yes | T036, T037, T041, T042 | |

**Constitution Alignment Issues:** C1 (CRITICAL) concerns governance: an exception listed in Complexity Tracking with no sunset condition, or a reading that the plan does not state as one. C2 (LOW) is covered by 001's recorded exception. Every other principle is met as the plan's Constitution Check states. Each phase has a red commit; phase 1 is exempt with a written note. Every new gate and rule has plants. Expected values are transcribed from Appendix A. Mutation scope is extended to the Storybook scripts.

**Unmapped Tasks:** none without purpose. T001 to T007 (setup, exempt), T008/T031/T050 (scaffolds) and T023 (test-project overlap, plan *Testing*) carry infrastructure for the requirements above and map to no single FR.

**Metrics:**

- Total Requirements: 34 (FR-001 to FR-026, SC-001 to SC-008)
- Total Tasks: 67
- Coverage %: 97.1 (33 of 34; FR-026 is review-only)
- Ambiguity Count: 2
- Duplication Count: 0
- Critical Issues Count: 1

## Next Actions

- **Resolve C1 before `/speckit-implement`.** The operator decides whether the Storybook page's host additions and the static-scope narrowing are constitution IV exceptions, which need a sunset condition each in plan.md's Complexity Tracking, or readings, in which case the plan states that "built output" means the published packages and takes them out of the Exceptions row. Then edit plan.md by hand, or run `/speckit-plan` to make the edit.
- **Resolve F1 before phase 2 starts.** Edit tasks.md by hand so that phase 2 creates `packages/tokens/contrast/pairs.json` (as `[]`), or move the `pairs.json` part of T021/T028 to phase 5.
- **Medium items, recommended before the phase they affect:** U1 (phases 2 and 3: missing `fonts/`), E3 (phase 2: run-time switch test in T017), E2 and I1 (phase 3: build network check, spike gate run), E1 (phase 4: `THIRD_PARTY_NOTICES` test). Each is a tasks.md edit. I1 also needs one sentence in FR-023 if the stop point moves to T042.
- **Low items** can be folded into the phase reviews or the next plan edit.
