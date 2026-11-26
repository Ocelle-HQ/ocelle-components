---
analyzed_at: 2026-11-26T00:04:11Z
head: 2a145bf65ddac5a22e36d441963d86c071363ec7
critical: 4
high: 1
medium: 9
low: 4
coverage: 100
---

## Specification Analysis Report

Feature: `specs/030-release-v1` (spec.md, plan.md, tasks.md; research.md, data-model.md, contracts/ and quickstart.md
read for cross-checks). Constitution 1.3.1. No `before_analyze` or `after_analyze` hooks are registered
(`.specify/extensions.yml`: `hooks: {}`).

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| K1 | Constitution Alignment | CRITICAL | tasks.md:T011 (L88), T004-T009 (L78-83), T055 (L208); packages/styles/test/build.test.ts:L62-L68; packages/tokens/test/build.test.ts:L105-L113; packages/styles/test/readme.test.ts:L38-L39, L164-L168; packages/elements/test/node/readme.test.ts:L1188-L1192 | Existing package tests assert the manifests and READMEs as they are today: `files: ["dist", "CHANGELOG.md", "README.md"]`, the build `scripts`, `peerDependencies` `workspace:0.0.0`, and README sentences that must contain the same pin ("exact peer dependency, `workspace:0.0.0`", "stay at 0.0.0 until the first release"). T011 changes all of these (files plus LICENSE/NOTICE/THIRD_PARTY_NOTICES, build copies, `workspace:^1.0.0`), so these tests fail at phase 1's green commit. No phase 1 red task replaces them, and T055 rewrites the README peer sentences only in phase 5, although the README tests tie them to the phase 1 pin. Principle VIII: a test that turns out wrong is replaced by a stricter one with the reason recorded, red first in a test-only commit. Changing these tests in the green commit, or leaving them red until phase 5, breaks VIII. | Add phase 1 red tasks (in the T009 commit) that replace each of these assertions with the 1.0.0 state (files, scripts, `workspace:^1.0.0`, the new README peer and version sentences) and record why. Move the README peer and version sentence changes from T055 into phase 1 green. |
| K2 | Constitution Alignment | CRITICAL | tasks.md:T029 (L126), T020-T024 (L114-L118); packages/tokens/test/readme.test.ts:L79-L99; packages/styles/test/readme.test.ts:L172-L220; packages/elements/test/node/changelog.test.ts:L20-L30 | The changelog tests read "## Unreleased" (tokens: "names every token as added in the Unreleased section"; styles: eight "under Unreleased / Added" cases; elements: "states under Unreleased: ..."). T029 moves the Unreleased content into `## 1.0.0 - <date>` and leaves Unreleased empty, so these tests fail at phase 2's green commit. Phase 2's red commit (T020-T023) does not replace them. The tokens test also contradicts R-09: it needs every token by full name, while R-09 accepts prefix mentions. Same VIII conflict as K1. | Add a phase 2 red task that rewrites these tests to read the `1.0.0` section (or "any section", matching R-09) and record why. Decide whether the tokens test keeps the stricter full-name rule or follows R-09's prefix rule, and say so in tasks.md. |
| K3 | Constitution Alignment | CRITICAL | tasks.md Phase 5 goal (L202-L204), T055 (L208), T057 (L210), T058 (L211); plan.md § Phases 5 (L175); packages/{tokens,styles}/test/readme.test.ts, packages/elements/test/node/readme.test.ts | Phase 5 claims the VIII exemption ("behaviour-free ... no test can fail for it"). The package READMEs are under test: all three packages have readme tests that assert README content fragment by fragment. T055 (install section, removing the `workspace:0.0.0` statements) and T057 (links) change those READMEs. VIII allows the exemption only when no test could fail, so `tdd-exempt.md` would make a false statement. | Split phase 5: write the README changes (install section, peer range, provenance verification, the RELEASING.md link) red first, as new assertions in the existing readme tests. Keep the exemption only for the constitution, spec 001, RELEASING.md and CONTRIBUTING.md, or show that no test reads those files. |
| K4 | Constitution Alignment | CRITICAL | tasks.md:T047 (L185), T049 (L187); .specify/extensions/story/story-config.yml:L16 (`test_pathspec`) | T049 puts `gates/release/provenance-reference.json` into phase 4's red, test-only commit ("the fixtures and the reference file are test inputs"). That path matches none of the `test_pathspec` globs (`**/*.test.ts`, `**/*.spec.ts`, `**/test/**`, `**/*.stories.ts`). It is also production data: `install-check --rehearse` reads it in the dry run and in `release.yml`'s `prepare` job. `tdd-check.sh 4` will report "red commit changes non-test files", and VIII requires a red commit to change only test files. | Keep the recorded responses (`gates/test/fixtures/install-check/`) in the red commit. Create `gates/release/provenance-reference.json` in the green commit (T050). If the unit tests need the values, give them a copy under `gates/test/fixtures/`. |
| E1 | Coverage Gap | HIGH | spec.md:FR-006 (L307-L310), FR-044 (L432-L437); tasks.md:T017 (L94), T031 (L128), T045 (L164), T054 (L207) | FR-006 requires the pack-contents gate to be listed in `specs/001-*/contracts/ci-checks.md`. T031 and T045 add Release readiness and Release workflow to ci-checks.md, but T017 (pack-contents registration) does not touch ci-checks.md, and T054 amends spec.md, plants.md and gate-cli.md, not ci-checks.md. No task adds the "Pack contents" check to ci-checks.md. | Add the ci-checks.md entry for "Pack contents" to T017, in the same phase as its `ci.yml` job, as FR-044 and T031/T045 do for the other two gates. |
| F1 | Inconsistency | MEDIUM | tasks.md:T047 (L185); data-model.md § Provenance reference (L134-L143); contracts/install-check.md (L84) | T047 defines `provenance-reference.json` as `{ name, version, repository, commit }` plus `withoutProvenance`. data-model.md defines `withProvenance: { name, version, repository, commit, workflow, ref }`. `--rehearse` needs `workflow` and `ref` for its `workflow-mismatch` and `ref-mismatch` cases. | Align T047 with data-model.md: a `withProvenance` key that includes `workflow` and `ref`. |
| F2 | Inconsistency | MEDIUM | tasks.md:T028 (L125); data-model.md § Secret allow-list entry (L81); research.md R-08 (L177) | Allow-list entry key: T028 says `{ path, rule, sha256, reason }`, while data-model.md and R-08 say `valueSha256`. | Use `valueSha256` in T028, or change data-model.md and R-08, so the tests (T021), the plants (T030) and the file agree. |
| F3 | Inconsistency | MEDIUM | tasks.md Phase 3 independent test (L143-L145) vs T040 (L159) and Phase 3 checkpoint (L167-L168) | The phase 3 independent test says "Release dry run" runs all four jobs "and is green". T040 and the checkpoint say the composite action's install-check steps fail until US4 lands, so the verdict is red in phase 3. | Reword the phase 3 independent test: "Release dry run" is red only because the US4 install-check steps are missing, and it turns green in phase 4 (T052). |
| F4 | Inconsistency | MEDIUM | tasks.md:T007 (L81), T022 (c) (L116); research.md R-15 case 2 (L503-L507) | T007 and T022 (c) hardcode version `1.0.0` against the real workspace (`... at version 1.0.0`, `ready (17/17 rows, 0 secrets, version 1.0.0)`). R-15's version-bump pull request contains "exactly" the manifests, peers, lockfile and changelogs, so its CI would fail on these tests. K1's replaced package tests may pin the version the same way. | Make these integration tests read the expected version from `packages/tokens/package.json`, or add the test updates to R-15's list of what the version-bump pull request contains. |
| F5 | Inconsistency | MEDIUM | spec.md:Story 3 (L147), FR-022 (L345-L346), Assumptions (L519-L524); plan.md Constitution Check "DCO" row (L76); research.md R-10 Sign-off (L318-L327) | The spec says the release workflow confirms "every merge gate" (Story 3) and "every required merge-gate check (spec 001 FR-020 ...)" (FR-022). The plan skips ci.yml's Sign-off job in the release run (`release: true`). The spec's Assumptions record the narrowed mutation range but not the Sign-off skip, so spec and plan disagree. | Add the Sign-off exception and its reason (squash commits on `main`; DCO is enforced on every pull request) to the spec's Assumptions or FR-022. |
| F6 | Inconsistency | MEDIUM | spec.md:FR-040 (L411-L413), Story 5 scenario 1 (L243-L244); tasks.md:T053 (L206); research.md R-14 (L473-L474) | FR-040 requires the amended constitution to say that a bootstrap credential is "held by the operator only and revoked after use". T053 (and R-14) say "the operator's own and never reaches CI" and leave out revocation. Story 5's independent test checks each FR-040 statement. | Add "and revoked (logged out) after use" to T053's list of statements. |
| E2 | Coverage Gap | MEDIUM | spec.md:FR-033 (L395-L398); research.md R-12 (L416-L418); tasks.md:T048 (L186) | FR-033 requires the tarball rehearsal to include a planted failure. R-12 makes it a unit test of `--from-tarballs` with a fixture tarball that lacks a declared export. T048 covers `entry-point-unresolved` only through the stub registry, and no test is named for `--from-tarballs` mode with its declared-peer-only peer step. | Add to T048 a `--from-tarballs` test with a fixture tarball whose declared export is missing (`entry-point-unresolved`), plus the peer step's declared-peer-only behaviour in that mode. |
| C1 | Underspecification | MEDIUM | spec.md Build order (L67-L70); plan.md (L7-L9); tasks.md Build order (L13-L17), T002 (L48), T014 (L91) | The spec and plan start implementation only after mission 018 and op 023 are both on `main`. The tasks' "go" condition names only mission 018 and states op 023 "is already on `main`" (18 gates, `gates/lib/sandbox-paths.ts`, the redaction script). This checkout cannot confirm that: the local `origin/main` (183b20f, which may be stale) has 17 gates and no `gates/lib/sandbox-paths.ts`. T014 and T016 (`sandbox-path` rule) depend on that file. | Make the "go" condition name both mission 018 and op 023, as the spec does. T002 already rechecks `sandbox-paths.ts`; have it stop for the operator if the file is missing. |
| A1 | Ambiguity | MEDIUM | tasks.md:T047 (L185); research.md R-11 (L393-L402); constitution § Technology, Licence and Supply Chain ("Any other third-party asset needs the same treatment and the operator's approval") | T047 commits recorded registry responses (packument and attestation bundles) of third-party packages under `gates/test/fixtures/install-check/`. The plan does not say whether third-party registry metadata counts as a "third-party asset" under the constitution (licence note, `THIRD_PARTY_NOTICES`, operator approval). A full packument can carry the third party's README and licence text. | State in research.md R-11 that the fixtures hold only the fields the decoder needs (no README or licence text), and say why they are not a third-party asset. Otherwise, list them in `THIRD_PARTY_NOTICES` with the operator's approval. |
| L1 | Inconsistency | LOW | spec.md:FR-030 (L388), Story 4 scenario 1 (L213); plan.md Constitution IV row (L68); tasks.md:T050 (L191) | The spec says the browser build loads "under the constitution's strict CSP". The plan and T050 use that policy plus `font-src 'self'`. This is the project's established fixture policy (packages/tokens/test/browser/csp.test.ts) but not the constitution's text. | Say "the constitution's CSP plus `font-src 'self'` for the tokens' font" in FR-030, or note the addition in the plan's Constitution IV row. |
| L2 | Coverage Gap | LOW | plan.md Performance Goals (L48-L49) | The plan sets time bounds (release-readiness under 60 s on the full history; pack-contents under the build time plus 30 s). No task measures or records them. | Record the measured durations in T059 or T060, or drop the goals. |
| L3 | Coverage Gap | LOW | spec.md:FR-002 (L292-L293); data-model.md § Pack manifest `identical` (L13); research.md R-04 (L76-L77) | FR-002 requires licence files in the packages to be identical to the repository's. The `identical` rule compares only with root files (`LICENSE`, `NOTICE`, `THIRD_PARTY_NOTICES`). `dist/fonts/OFL.txt` has its repository copy at `packages/tokens/fonts/OFL.txt` and is required but not compared. | Allow `identical` to name a repository path (`packages/tokens/fonts/OFL.txt`) for `dist/fonts/OFL.txt`, or state why the existing font test (packages/tokens/test/font.test.ts) already covers it. |
| L4 | Underspecification | LOW | tasks.md:T001 (L45) | T001 says the merge is "signed off" but its command `git merge --no-edit -s ort FETCH_HEAD` has no `--signoff`. | Add `--signoff` to the command. |

**Coverage Summary Table:**

| Requirement Key | Has Task? | Task IDs | Notes |
|-----------------|-----------|----------|-------|
| FR-001 package-metadata | Yes | T005, T011, T016 | `repository-mismatch`, `license-field`, `private-flag` rules |
| FR-002 licence-files | Yes | T005, T010, T011, T013, T016 | L3 (OFL.txt identity) |
| FR-003 peer-range | Yes | T004, T005, T011, T012, T016 | |
| FR-004 pack-contents-gate | Yes | T005, T007, T013, T014, T016 | |
| FR-005 changelog-1.0.0 | Yes | T029 | K2 (existing changelog tests) |
| FR-006 pack-contents-check | Yes | T008, T016, T017 | E1 (ci-checks.md listing missing) |
| FR-010 gap-rows | Yes | T021, T022, T026, T027, T030 | |
| FR-011 secret-scan | Yes | T021, T022, T027, T028, T030 | F2 |
| FR-012 version-tag | Yes | T021, T027, T030 | |
| FR-013 changelog-check | Yes | T021, T027, T029, T030 | |
| FR-014 readiness-verdict-gate | Yes | T022, T023, T027, T031 | |
| FR-015 readiness-proven | Yes | T021, T022, T030 | |
| FR-020 tag-only-trigger | Yes | T033, T034, T041, T044 | |
| FR-021 least-privilege | Yes | T034, T041, T044 | |
| FR-022 pre-publish-steps | Yes | T039, T040, T041 | F5 (Sign-off skip) |
| FR-023 env-publish-order | Yes | T033, T038, T041 | |
| FR-024 oidc-bootstrap | Yes | T041, T056 | bootstrap procedure in RELEASING.md |
| FR-025 rerun-safe | Yes | T033, T038 | |
| FR-026 workflow-static-check | Yes | T034, T043, T044, T045 | |
| FR-027 dry-run-path | Yes | T033, T034, T042, T044, T052 | F3 |
| FR-030 install-check | Yes | T048, T050, T041 | L1 |
| FR-031 provenance-verify | Yes | T047, T048, T050 | F1 |
| FR-032 visibility-retry | Yes | T048, T050 | |
| FR-033 tarball-rehearsal | Yes | T040, T050, T052 | E2 (planted failure test) |
| FR-034 provenance-proof-real | Yes | T047, T048, T050, T052 | K4 |
| FR-040 constitution-amendment | Yes | T053 | F6 |
| FR-041 security-md-line | Yes | T053 | |
| FR-042 readme-install | Yes | T055, T057 | K1, K3 |
| FR-043 release-procedure | Yes | T056 | |
| FR-044 spec-001-amendment | Yes | T031, T039, T045, T054 | E1 |
| FR-045 no-credential-no-sandbox | Yes | T021, T022, T030, T061 | |
| SC-001 clean-install | Yes | T041, T050 | measured at release (O7) |
| SC-002 provenance-3-of-3 | Yes | T048, T050 | measured at release |
| SC-003 plants-100pct | Yes | T016, T030, T044 | |
| SC-004 readiness-17-of-17 | Yes | T022, T026 | |
| SC-005 approval-rerun | Yes | T033, T041, T056 | |
| SC-006 no-long-lived-credential | Yes | T053, T056, T061 | O8 is the operator's |
| SC-007 operator-steps-listed | Yes | T056 | |
| SC-008 provenance-proof-1-and-3 | Yes | T047, T048, T050, T052 | |
| SC-009 dry-run-zero-writes | Yes | T034, T042, T044 | |

**Constitution Alignment Issues:**

- Principle VIII (Test-First, NON-NEGOTIABLE), the rule that a test that turns out wrong is replaced by a stricter
  one with the reason recorded, red first. Existing package tests pin the 0.0.0 manifests, the `workspace:0.0.0`
  peer, the README peer sentences and the "Unreleased" changelog content. Phases 1 and 2 change all of these without
  a red task to replace the tests (K1, K2).
- Principle VIII, the exemption. Phase 5 claims "no test can fail" for README changes that existing readme tests
  assert (K3).
- Principle VIII, red first. Phase 4's red commit would include a non-test file, `gates/release/provenance-reference.json` (K4).
- Supply chain. Whether recorded third-party registry responses count as a third-party asset is not stated (A1,
  MEDIUM; not a definite conflict).
- The supply-chain contradictions (internal until 1.0.0, token in CI secrets, exact pins) are recorded in Complexity
  Tracking with scope, sunset and operator approval, as Governance requires. No finding.

**Unmapped Tasks:** none. T001 to T003 (setup and recheck), T018 (an explicit no-op with a confirmation), T019,
T032, T046, T052 (run and record), and T059 to T061 (polish) support every story and need no requirement of their
own.

**Metrics:**

- Total Requirements: 40 (31 functional requirements, 9 success criteria)
- Total Tasks: 61 (T001 to T061), plus the operator steps O1 to O8, which are not agent tasks
- Coverage % (requirements with >=1 task): 100% (40 of 40); FR-006 is only partly covered (E1)
- Ambiguity Count: 1
- Duplication Count: 0
- Critical Issues Count: 4

## Next Actions

- Resolve the four CRITICAL findings before `/speckit-implement` (the `ocelle-implement` workflow). All four are
  tasks.md changes that make the phases test-first in full:
  - K1: add phase 1 red tasks that replace the existing manifest, build and README peer tests. Move the README peer
    and version sentence changes into phase 1.
  - K2: add a phase 2 red task that moves the existing changelog tests to the `1.0.0` section.
  - K3: make the README part of phase 5 test-first, or move it into the earlier phases. Keep the exemption only for
    untested documents.
  - K4: create `gates/release/provenance-reference.json` in T050 (green), not in T049's red commit.
- Fix the HIGH finding E1 in tasks.md: T017 adds "Pack contents" to spec 001 `contracts/ci-checks.md`.
- MEDIUM findings: F1 to F6, E2 and C1 are edits to tasks.md (F5 and F6 also touch spec.md and research.md R-14).
  A1 needs one sentence in research.md R-11, or an operator decision on third-party data. Run `/speckit-tasks` again
  or edit tasks.md by hand, then re-run this analysis.
- LOW findings (L1 to L4) can be fixed during implementation or folded into the same edit.
