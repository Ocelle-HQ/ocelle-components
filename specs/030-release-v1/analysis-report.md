---
analyzed_at: 2026-11-26T01:35:59Z
head: c7073958dbbe1ec27588e3a991f42e6297de2fe5
critical: 0
high: 0
medium: 3
low: 3
coverage: 100
---

## Specification Analysis Report

Feature: `specs/030-release-v1` (spec.md, plan.md, tasks.md; research.md, data-model.md, contracts/ and quickstart.md read for cross-checks). Constitution 1.3.1. This is the second run, after the fixes in `reviews/analysis/fixes.md` (operator decisions in `reviews/analysis/operator-decisions.md`: fix scope "everything now", A1 "Treat as asset"). tasks.md is now numbered T001 to T069. No `before_analyze` or `after_analyze` hooks are registered (`.specify/extensions.yml`: `hooks: {}`).

**The 18 findings of the first run.** All are resolved in the artifacts as `fixes.md` says. The checks:

- K1: T009 replaces every pinned package test that was found (tokens and styles `build.test.ts`, styles and elements peer and README tests, elements NOTICE). Every replacement derives `<v>` from the tokens manifest, so it fails on the `0.0.0` state. The README sentences move to phase 1 (T013).
- K2: T025 covers the styles, elements and tokens changelog tests. The note on the tokens test is F8 below.
- K3: phase 5 has red tasks T058 to T060. `git grep` over `test_pathspec` finds no test that reads the constitution or spec 001. Two tests mention the constitution's path as a string; see L6.
- K4: only `gates/test/fixtures/install-check/` and `specs/` paths are in phase 4's red commit. `gates/release/provenance-reference.json` is created in T053.
- E1, E2, F1 to F6, C1, A1 and L1 to L4: each fix is present at the locations `fixes.md` names.

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| C2 | Underspecification | MEDIUM | tasks.md:T055 (L225), T018 (L113); research.md R-17 (L590-L593: package trees with "licence files"); contracts/pack-contents-gate.md (L4-L7, L14, L27); data-model.md § Pack manifest `identical` (L13) | The `pack-tree` plants hold committed package trees with their own copies of the licence files. The gate runs with `--root <tmp>`, whose root `THIRD_PARTY_NOTICES` comes from the configuration set (T006), and the `identical` rule compares the tokens and elements copies of `THIRD_PARTY_NOTICES` with that root file. Phase 4's T055 rewrites the root `THIRD_PARTY_NOTICES`: it adds the repository-only section and changes the opening sentence. After that, the plant copies from phase 1 differ from the root file. `pass-minimal` and `pass-star-export` would then report `not-identical`, and every fail plant would report it as an extra finding beside its expected one. The plant job (a required check) turns red in phase 4. No task updates the plant trees, and R-17 does not say that the plant builder copies the root licence files into the trees. | Do one of these: (a) T055 also updates the `THIRD_PARTY_NOTICES` copies in `gates/plants/pack-contents/*/tree/`; (b) R-17 and T017 state that the plant builder copies the root `LICENSE`, `NOTICE` and `THIRD_PARTY_NOTICES` into each tree unless the plant ships its own (so only `fail-notice-differs` carries a copy). Have T057 run the pack-contents plants. |
| F7 | Inconsistency | MEDIUM | tasks.md:T040 (L186); data-model.md § First-release base (L89-L91); research.md R-10 (L243-L245) | Three files give different initial values for `gates/release/first-release-base`. T040 says "the commit before this mission's first commit on the branch", which is the branch's fork point from the old `main`. data-model.md and R-10 say it is committed in US3 "holding the `main` commit merged in Setup" (T001's `FETCH_HEAD`). These are different commits whenever `main` moved after the branch was cut, which it did (mission 018, op 023). The pre-tag pull request later rewrites the file. Until then, `release-step base` in the dry run computes a range that differs depending on which document is followed. | Make T040 match data-model.md and R-10: write the `main` commit that T001 merged (recorded in `reviews/recheck.md`). Otherwise, change data-model.md and R-10 to match T040. |
| F8 | Inconsistency | MEDIUM | tasks.md:T025 (L142); research.md R-09; constitution VIII ("replaced by a stricter one with the reason recorded") | The styles and elements changelog tests now read only the `## 1.0.0 - <YYYY-MM-DD>` section. The tokens test "names every token as added" reads "any section of the changelog". The old test read only "Unreleased". T025 calls the new test stricter, but only than R-09's prefix rule. Compared with the test it replaces, the section scope is wider: a token named only under some other heading now passes. The decision is recorded, the 1.0.0 heading is still required, and the practical loss is small, so this is not a definite VIII conflict. Still, the three packages' tests disagree on which section counts, and "stricter" is not shown against the old test. | Have the tokens test read the `1.0.0` section plus "Unreleased", which are the sections at or after the first release, instead of any section. Or record in `reviews/phase-2/replaced-tests.md` why "any section" is at least as strict as the old "Unreleased" reading. |
| L5 | Inconsistency | LOW | tasks.md:T063 (L255), T065 (L257) | T063 and T065 are both marked [P], but both edit `packages/{tokens,styles,elements}/README.md`. T063 writes the install sections and T065 adds the `RELEASING.md` link to them. Running them in parallel conflicts. | Remove [P] from T065, or fold the README link into T063 and keep only the `CONTRIBUTING.md` link in T065. |
| L6 | Underspecification | LOW | tasks.md:T002 (L64), T066 (L258); gates/test/governance.test.ts:L51; gates/test/plant-runner.test.ts:L855 | T002's `git grep` must show that "no test reads `.specify/memory/constitution.md` or `specs/001-repository-foundation/`". The grep matches two test lines that name the constitution's path without reading the file: governance.test.ts asserts that `CONTRIBUTING.md` contains the path, and plant-runner.test.ts lists it as a no-plant path. A literal grep would therefore report hits, and T066's statement would need a judgement that T002 does not ask for. | In T002, record each grep hit and whether the test reads the file (both of these are mentions, not reads). Base phase 5's no-red claim for the constitution on that record. |
| L7 | Inconsistency | LOW | research.md R-17 "Configuration set" (L594-L596); tasks.md:T006 (L93); fixes.md L3 | The L3 fix added `packages/tokens/fonts/OFL.txt` to the plant configuration set in T006, for `fail-ofl-differs` and the `{ path, source }` identity. R-17's configuration-set list was not updated. T062 amends spec 001 `contracts/plants.md` from R-17, so the amendment may miss that path. | Add `packages/tokens/fonts/OFL.txt` to R-17's configuration-set list. |

**Coverage Summary Table:**

| Requirement Key | Has Task? | Task IDs | Notes |
|-----------------|-----------|----------|-------|
| FR-001 package-metadata | Yes | T005, T009, T012, T016 | `repository-mismatch`, `license-field`, `private-flag` |
| FR-002 licence-files | Yes | T005, T009, T011, T012, T015, T016, T018 | OFL.txt identity covered (L3 fixed); C2 |
| FR-003 peer-range | Yes | T004, T005, T009, T012, T014, T016 | |
| FR-004 pack-contents-gate | Yes | T005, T007, T015, T016, T018 | |
| FR-005 changelog-1.0.0 | Yes | T025, T031 | F8 |
| FR-006 pack-contents-check | Yes | T008, T018, T019 | ci-checks.md entry in T019 (E1 fixed) |
| FR-010 gap-rows | Yes | T022, T023, T028, T029, T032 | |
| FR-011 secret-scan | Yes | T022, T023, T029, T030, T032 | `valueSha256` throughout (F2 fixed) |
| FR-012 version-tag | Yes | T022, T029, T032 | |
| FR-013 changelog-check | Yes | T022, T029, T031, T032 | |
| FR-014 readiness-verdict-gate | Yes | T023, T024, T029, T033 | |
| FR-015 readiness-proven | Yes | T022, T023, T032 | |
| FR-020 tag-only-trigger | Yes | T035, T036, T043, T046 | |
| FR-021 least-privilege | Yes | T036, T043, T046 | |
| FR-022 pre-publish-steps | Yes | T041, T042, T043 | Sign-off exception in spec (F5 fixed) |
| FR-023 env-publish-order | Yes | T035, T040, T043 | |
| FR-024 oidc-bootstrap | Yes | T043, T064 | bootstrap procedure in RELEASING.md |
| FR-025 rerun-safe | Yes | T035, T040 | |
| FR-026 workflow-static-check | Yes | T036, T045, T046, T047 | |
| FR-027 dry-run-path | Yes | T035, T036, T044, T046, T057 | F7 (base value) |
| FR-030 install-check | Yes | T043, T050, T054 | CSP wording aligned (L1 fixed) |
| FR-031 provenance-verify | Yes | T049, T050, T054 | |
| FR-032 visibility-retry | Yes | T050, T054 | |
| FR-033 tarball-rehearsal | Yes | T042, T050, T054, T057 | planted `--from-tarballs` failure (E2 fixed) |
| FR-034 provenance-proof-real | Yes | T049, T050, T053, T054, T057 | |
| FR-040 constitution-amendment | Yes | T061 | revocation stated (F6 fixed) |
| FR-041 security-md-line | Yes | T061 | |
| FR-042 readme-install | Yes | T009, T013, T058, T063, T065 | L5 |
| FR-043 release-procedure | Yes | T059, T064 | |
| FR-044 spec-001-amendment | Yes | T019, T033, T041, T047, T062 | L7 |
| FR-045 no-credential-no-sandbox | Yes | T022, T023, T032, T069 | |
| SC-001 clean-install | Yes | T043, T054 | measured at release (O7) |
| SC-002 provenance-3-of-3 | Yes | T050, T054 | measured at release |
| SC-003 plants-100pct | Yes | T018, T032, T046 | C2 |
| SC-004 readiness-17-of-17 | Yes | T023, T028 | |
| SC-005 approval-rerun | Yes | T035, T043, T064 | |
| SC-006 no-long-lived-credential | Yes | T061, T064, T069 | O8 is the operator's |
| SC-007 operator-steps-listed | Yes | T059, T064 | |
| SC-008 provenance-proof-1-and-3 | Yes | T049, T050, T053, T054, T057 | |
| SC-009 dry-run-zero-writes | Yes | T036, T044, T046 | |

**Constitution Alignment Issues:** none at CRITICAL.

- Principle VIII. Every story phase (1 to 5) now has a test-only red commit, and only phase 0 claims the exemption. Existing tests that a phase makes wrong are replaced in that phase's red commit, with the reasons recorded. No red commit holds production data: the plants, `pack-manifest.json`, `gap-rows.json`, `secret-allowlist.json`, `first-release-base` and `provenance-reference.json` all arrive in green commits. Version-dependent assertions read the tokens manifest. F8 is a VIII-adjacent consistency point, not a definite conflict.
- Supply chain. The recorded registry fixtures are third-party assets, listed in `THIRD_PARTY_NOTICES` with the operator's approval (A1, T049, T051, T055). The amended supply-chain statements remain in Complexity Tracking, each with a sunset.

**Unmapped Tasks:** none. These tasks support every story and need no requirement of their own:

- T001 to T003: setup and recheck.
- T010, T026, T038, T052 and T060: red runs and red commits.
- T020, T034, T048 and T057: green runs and records.
- T056: command-line confirmation.
- T067 to T069: polish. T067 and T068 also measure the plan's performance goals (L2 fixed).

**Metrics:**

- Total Requirements: 40 (31 functional requirements, 9 success criteria)
- Total Tasks: 69 (T001 to T069), plus the operator steps O1 to O8, which are not agent tasks
- Coverage % (requirements with >=1 task): 100% (40 of 40)
- Ambiguity Count: 0
- Duplication Count: 0
- Critical Issues Count: 0

## Next Actions

- There are no CRITICAL or HIGH findings. Implementation (the `ocelle-implement` workflow) may proceed once the orchestrator sends "go" (mission 018 and op 023 on `main`).
- Fix the three MEDIUM findings before their phases, preferably now. All three are short edits:
  - C2, before phase 4: in tasks.md T055 or T017, together with research.md R-17, keep the pack-contents plant trees' `THIRD_PARTY_NOTICES` identical to the root file after T055. Otherwise the plant job turns red.
  - F7, before phase 3: make T040's initial `first-release-base` the `main` commit that T001 merged, as data-model.md and R-10 say, or change those two files.
  - F8, before phase 2: narrow the tokens changelog test in T025 to the `1.0.0` section and "Unreleased", or record why "any section" is at least as strict as the old test.
- LOW findings: L5 (the [P] marker on T065), L6 (T002 records grep mentions as non-reads) and L7 (R-17's configuration-set list) can be folded into the same edit or fixed during implementation.
- No re-run of `/speckit-tasks` is needed. Edit tasks.md and research.md (and data-model.md for F7, if that direction is chosen) by hand.
