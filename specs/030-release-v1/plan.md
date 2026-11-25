# Implementation Plan: Release v1.0.0 (Public npm, Provenance, Gated Publish)

**Branch**: `030-release-v1` (work on `claude/011-release-v1`) | **Date**: 2026-11-25 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/030-release-v1/spec.md`

**Build order** (operator, 2026-11-25): design now, build after #7. Implementation starts only after mission 018
(`claude/007-status-elements`) and op 023 (`claude/060-public-repo-hygiene`, PR #80) are on `main`; `main` is merged
into this branch before the first red commit (the only merge of `main` during the run, decided by the operator).

## Summary

Make the three packages publishable as `1.0.0` and publish them only through a reviewed, provenance-attested
workflow. Three new merge gates (pack contents, release readiness, release workflow) with plants keep the packages
releasable on every pull request; a tag-triggered `release.yml` computes the release range, runs every gate on the
tagged commit (mutation over what `main` has not already proven), packs the tarballs and takes their digests at once, verifies them, proves the provenance check on
real registry inputs, waits for the operator's approval of the `npm-publish` environment, publishes the verified
bytes with npm trusted publishing (OIDC, no token), and proves the result with a credential-free install under the
strict CSP and a provenance check of repository, workflow, ref and commit. A dry-run workflow runs the same
pre-approval job graph on every pull request (mutation on the pull request's own range, one run per pull request),
with a verdict check that is red when any of its jobs failed or was skipped, so everything but the publish is
rehearsed before the tag exists. The first publish uses an operator-run
placeholder bootstrap (research D1), so the workflow never reads a token. The constitution, READMEs and a new
`RELEASING.md` say how releases work, with every operator-only step marked.

## Technical Context

**Language/Version**: TypeScript (strict) on the pinned Node 26.13.0 (type stripping, as the other gates); YAML for
workflows.

**Primary Dependencies**: existing: pnpm 12.16.1 (pack), npm CLI of the pinned Node (publish, `audit signatures`;
the publish job asserts ≥ 11.5.1), Playwright 1.64.1 (install check's browser load), vitest. New: `yaml` (exact pin,
dev only, for the release-workflow gate; research R-13).

**Storage**: committed data under `gates/release/` (pack manifest, gap rows, secret allow list, provenance
reference, first-release base); recorded registry responses under `gates/test/fixtures/install-check/`.

**Testing**: vitest unit and integration tests under `gates/test/` (the gate tests' home), all offline; plants under
`gates/plants/<gate>/` run by the plant job; for the install check, recorded real registry responses with an injected
signature and attestation verifier, and a stub registry (Node `http`) for the install paths (research R-11). The
provenance proof on real registry inputs is `install-check --rehearse`, run in the dry run and in `release.yml`'s
`prepare` job.

**Target Platform**: GitHub-hosted `ubuntu-24.04` runners; the public npm registry.

**Project Type**: library monorepo, release tooling.

**Performance Goals**: `release-readiness` under 60 s on the full history in CI; `pack-contents` under the build time
plus 30 s; install check's visibility retry and the publish step's registry-error retry each bounded at 10 min.

**Constraints**: no long-lived token anywhere (Q2 (a), D1); least-privilege workflow permissions; every action
pinned by SHA; no sandbox paths or credentials in any new file (op 023); CI-first: locally only fast gates and
`gate:plants -- --affected <base>`.

**Scale/Scope**: 3 packages, 17 gap rows, 3 new gates, 2 new commands (install check, release step), 2 new
workflows, 1 composite action, 1 workflow change (`ci.yml` gains `workflow_call`; its unit-test checkouts get full
history), 2 plant-form changes (`commit-repo` files, new `pack-tree`), 1 root `NOTICE` edit.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Check | Status |
|---|---|---|
| I. Framework-free elements | No element change. | pass |
| II. Tokens only | No style change. | pass |
| III. Accessible | No UI change. | pass |
| IV. Strict CSP, offline | Packages unchanged in behaviour. The install check serves the installed packages from `127.0.0.1` with the constitution's CSP header, aborts and records every off-origin request, and fails on any CSP violation or request (`csp-violation`, `network-request`; research R-11), so the published bytes are checked, not only the CI build (registry reads are the install, not the page). | pass |
| V. Storybook | No story change. | pass |
| VI. Consumer needs | Consumers named in the spec (kitty-mission-ui, Ocelle console); no code copied. | pass |
| VII. Semver | First public release `1.0.0`; per-package changelog entries (FR-005, R-09). | pass |
| VIII. Test-first, gates proven | Each new gate red-first with fail, pass and breaking plants, on plant forms planned for them (research R-17: `commit-repo` with files, `pack-tree`); no committed credential-shaped literal (R-08). The install check and the release steps live in `gates/lib` + `gates/bin`, in the mutation gate's scope; the install check is unit-tested offline on recorded real registry responses with an injected verifier, each test asserting its rule, and proven on real registry inputs by `--rehearse` (1 pass, 5 planted failures including no attestation) in the dry run and before the approval in `release.yml`; the publish loop (order, skip, retry, digests) is unit-tested with an injected npm runner, and so is the publish dry run (`release-step dry-run`: run when not on the registry, skipped when published); workflow YAML (job graph, publish job, digests, sign-off scope, pinned Node in every job, the dry run's graph equal to the release's, its verdict job and concurrency group) proven through the release-workflow gate's plants, and the pre-approval graph itself runs on every pull request in the dry run; the `ci.yml` change is red-first in `ci-workflow.test.ts`. Story 2's independent test and the own-history scan test are gates-integration tests run with full history; each first asserts a non-shallow clone in which `183b20f` resolves and fails, never skips, otherwise, so neither can pass vacuously. Docs and constitution phases are behaviour-free and claim the exemption in review. | pass |
| Supply chain: "repository is internal until then and goes public with 1.0.0"; "npm publish token lives only in CI secrets"; "every dependency is pinned exactly" | False today / contradicted by Q2 (a) / the peer range of Q3 (a). Amended in this mission (Q1 (a), FR-040, research R-14), MINOR 1.3.1 → 1.4.0 (operator decision PLAN-CORRECTNESS-1-007 (b): the peer-range exception is an expansion, not a clarification). Until the amendment phase lands, the plan relies on the operator's Q1 and squad-round decisions. | pass, by amendment (recorded in Complexity Tracking) |
| Supply chain: "No secrets, tokens ... in the repository, fixtures" | Secret-scan tests and plants assemble credential-shaped values at run time; no committed file matches a rule, checked by a test on this repository's own history (R-08, FR-045). | pass |
| Workflow: gates listed | Three gates (pack contents, release readiness, release workflow) added to spec 001 FR-020 by amendment (FR-044), as op 023 did; spec FR-014, FR-044 and O6 name the readiness gate (operator decision PLAN-CORRECTNESS-1-006 (a)). | pass |
| Workflow: DCO check | Still required on every pull request before merge. The release run skips only ci.yml's Sign-off job (`release: true`), because `main`'s squash commits cannot pass it; the release-workflow gate keeps the skip out of pull-request runs, and the dry run's `workflow_call` (`release: false`) runs Sign-off on the pull request's own range (R-10, R-13; operator decisions PLAN-FRESH-1-001 (a), PLAN-FRESH-2-002 (a)). | pass |
| Workflow: the operator merges, agents never act for the operator | Operator-only steps stay the operator's: the agents' GitHub identity is off the tag ruleset's bypass list and is not an environment reviewer (O4, O5, R-16); the agent-side deny rules are an operator task, not an agent edit. | pass |

**Post-design re-check:** unchanged; the design adds no element, token or story, and no exception beyond the one
below. Re-checked after plan squad round 2: principle VIII's row now covers the dry-run step, the dry-run graph and
the full-history tests; no other row changes. Re-checked after plan squad round 3: principle VIII's row now covers
the dry run's verdict job and concurrency group (rules `dry-run-verdict`, `dry-run-concurrency` with plants); the
narrowed mutation range of the release run relies on `main`'s required mutation check, an existing merge gate, so no
principle is weakened and no row changes status.

## Project Structure

### Documentation (this feature)

```text
specs/030-release-v1/
├── spec.md, plan.md, research.md, data-model.md, quickstart.md
├── contracts/
│   ├── pack-contents-gate.md
│   ├── release-readiness-gate.md
│   ├── release-workflow.md
│   └── install-check.md
├── sources/ (issue-11.md, issue-1-gap-table.md)
├── reviews/ (spec checks, plan squad, phases)
└── tasks.md (next step)
```

### Source Code (repository root)

```text
packages/{tokens,styles,elements}/package.json   # metadata, version, peer, files (FR-001..003)
packages/{tokens,styles}/                         # build copies LICENSE, NOTICE (+ THIRD_PARTY_NOTICES for tokens)
NOTICE                                            # "each published @ocelle package holds a copy" (R-04, US1)
packages/*/CHANGELOG.md, packages/*/README.md     # 1.0.0 entries, install sections
gates/bin/pack-contents.ts                         # gate (Story 1)
gates/bin/release-readiness.ts                     # gate (Story 2)
gates/bin/release-workflow.ts                      # gate (Story 3)
gates/lib/pack-contents.ts, release-readiness.ts, secret-scan.ts, gap-rows.ts, release-workflow-rules.ts
gates/lib/pins-rules.ts                            # accepts workspace:^<own version> in peerDependencies (R-03)
gates/lib/install-check.ts, gates/bin/install-check.ts   # Story 4 (not a gate; mutation scope, R-11)
gates/lib/release-steps.ts, gates/bin/release-step.ts    # base, check-tag (--no-tag), digest, dry-run, publish (R-10)
gates/lib/plant-repo.ts, gates/bin/plants.ts       # commit-repo files/delete/secret headers, pack-tree form,
                                                   #   configuration set extended (R-17)
gates/release/pack-manifest.json, gap-rows.json, secret-allowlist.json, provenance-reference.json,
              first-release-base                   # data only
gates/plants/{pack-contents,release-readiness,release-workflow}/
gates/test/…, gates/test/integration/…             # tests of the above; 183b20f gap test; own-history scan test
gates/test/ci-workflow.test.ts                     # amended red-first for each ci.yml change (US2, US3)
gates/test/fixtures/install-check/                 # recorded real registry responses (R-11)
gates/gates.json, gates/lib/registry.ts, gates/README.md   # three new gate entries
.github/workflows/ci.yml                           # three new jobs; on: workflow_call (inputs base, release);
                                                   #   Sign-off if: ${{ !inputs.release }} (R-10); unit-test
                                                   #   checkouts fetch-depth: 0 (R-07)
.github/workflows/release.yml, release-dry-run.yml # the same pre-approval job graph (R-10)
.github/actions/release-prepare/action.yml
.specify/memory/constitution.md                    # MINOR amendment 1.3.1 → 1.4.0 (FR-040, FR-041, R-14)
specs/001-repository-foundation/spec.md, contracts/ci-checks.md, contracts/plants.md, contracts/gate-cli.md  # FR-044
RELEASING.md, CONTRIBUTING.md                      # FR-043, R-15, R-16
```

**Structure Decision**: release tooling lives with the gates (`gates/`), because three of its four parts are gates
and share the gate CLI, finding format and plant job; release-only data sits in `gates/release/`.

## Phases (user stories) and their order

0. **Setup** (no behaviour): merge `main` (after 018 and 023). Each gate's registry entry (`gates.json`, the FR-020
   list, its `ci.yml` job) lands in its own story's green commit, since the plant job requires the three sets equal.
1. **US1, P1 — pack contents**: metadata, licence files, the root `NOTICE` edit (R-04: every published package holds
   a copy; where `THIRD_PARTY_NOTICES` is) before the pack manifest's `identical` rule freezes it, peer, pins-rule
   change (test-first), pack manifest, the
   `pack-tree` plant form and the configuration-set extension (test-first, R-17), gate, plants, the build-path
   integration test, CI job. Changelogs move to `1.0.0` here only as far as the gate needs (no date yet).
2. **US2, P1 — release readiness**: the `commit-repo` extension (`files:`, `delete:`, `secret:`; test-first, R-17);
   the 183b20f gates-integration test, red before the gap-row evidence is completed (R-07); gap rows (member-level
   evidence completed against merged `main`), secret scan with run-time-assembled test values and the own-history
   test (R-08), allow list keyed by path, rule and value hash, version, changelog rules with the token-prefix
   comparison (R-09), gate, plants, CI job (`fetch-depth: 0`). Full history for the two history-reading tests
   (operator decision PLAN-FRESH-2-004 (a)): `ci-workflow.test.ts` first (red) for `fetch-depth: 0` on
   `unit-tests-shard` and `unit-tests-full`, then `ci.yml`, with spec 001 `contracts/ci-checks.md`'s Unit tests
   checkout amended in the same phase; each of the two tests starts by asserting a non-shallow clone in which
   `183b20f` resolves (R-07, R-08). The `1.0.0` changelog entries are written here, dated
   the day the phase is implemented; the pre-tag pull request sets the release date later (R-15, operator decision
   PLAN-FRESH-1-007 (b)).
3. **US3, P2 — workflows**: `yaml` dependency, release-workflow gate and plants first (red, including `node-pin`,
   `dry-run-via-release-step` and `dry-run-graph`, whose only allowed differences are `release: false`, the absent
   `base` input of `gates`, `check-tag --no-tag`, the composite action's absent `tag` input and the one extra `verdict`
   job, plus `dry-run-verdict` and `dry-run-concurrency`; PLAN-FRESH-3-001 (a), PLAN-FRESH-3-002 (b)), the
   `release-step` module and its unit tests (red, including `dry-run`, `check-tag --no-tag` and `base` returning the
   tagged commit's parent when an earlier `v*` tag is reachable, the first-release base otherwise), `gates/release/first-release-base` (R-10); then `ci-workflow.test.ts` amended
   first (red: the `inputs.base || ...` lines of `mutation-plan` and `mutation-shard`, the `workflow_call` trigger with
   inputs `base` and `release`, the Sign-off `if`; PLAN-FRESH-2-005), then `ci.yml`'s `workflow_call`, with spec 001
   `contracts/ci-checks.md`'s trigger, Sign-off and mutation lines amended in the same phase (FR-044); the composite
   action, `release.yml` (with `release-base`, every job on the pinned Node), `release-dry-run.yml` (the same
   pre-approval job graph with no `base` for `gates`, the `verdict` job "Release dry run" and the per-pull-request
   concurrency group; operator decisions PLAN-FRESH-2-002 (a), PLAN-FRESH-3-001 (a), PLAN-FRESH-3-002 (b)).
4. **US4, P2 — install check**: unit tests on recorded real responses and the stub registry (red), the check in
   `gates/lib` + `gates/bin` (environment allow list, strict-CSP browser load, peer step, workflow and ref
   comparison), tarball rehearsal, provenance reference (with and without provenance) and `--rehearse`, wired into
   the composite action (so both workflows run it) and `release.yml`'s `install-check` job.
5. **US5, P3 — governance and docs** (behaviour-free): constitution MINOR 1.3.1 → 1.4.0 via `/speckit-constitution`,
   the rest of the spec 001 amendment (FR-044: plant forms, gate CLI; the ci-checks lines already landed with their
   `ci.yml` changes), READMEs, `RELEASING.md` (O4 and O5 settings, identities, the agent-side deny rules as an
   operator task, the pre-tag pull request, the re-run button after a partial publish, and the failure procedure:
   re-tag only before any publish, lockstep `x.y.z+1` through a version-bump pull request otherwise; R-15),
   `CONTRIBUTING.md` link.

The release itself (the pre-tag pull request, O3 to O8) happens after the mission's pull request is merged, by the
operator; "ALL PHASES DONE" reports it as pending, together with the operator task of adding the agent-side deny
rules to the agent permission settings (O5, research R-16), which no agent performs.

## Plan decisions for the gate

| # | Decision | Alternatives |
|---|---|---|
| D1 | First publish: operator publishes a placeholder `0.0.0-bootstrap.0` per package interactively, configures trusted publishers, then the workflow publishes `1.0.0` via OIDC (R-01) | D1-b one-time granular token in the environment secret; D1-c operator publishes 1.0.0 locally (rejected) |
| D2 | Peer `workspace:^1.0.0` in source, pins rule accepts it in peers only (R-03) | exact peer (Q3 (b)) |
| D3 | Readiness is a required merge gate on every pull request (R-06); accepted by the operator, PLAN-CORRECTNESS-1-006 (a) | release-only script |
| D4 | `release.yml` reuses `ci.yml` via `workflow_call` to run every gate on the tag (R-10) | rerun fast gates only |
| D5 | The dry run is a named check ("Release dry run", its verdict job), not required (R-10) | required |
| D6 | Own secret-scan rules, no gitleaks or trufflehog (R-08) | a scanner action |

**Operator decisions, plan squad round 1** (`reviews/plan/round-1/refute.md`, Decision column):

| Finding | Option | Effect |
|---|---|---|
| PLAN-A11Y-SECURITY-1-008 | (a) | Anthropic, OpenAI, Google and env-assignment rules with fail plants; scan stays reachable-only (R-08) |
| PLAN-CORRECTNESS-1-002 | (a) | `install-check --rehearse` runs in the composite action, so in `release.yml`'s `prepare` before the approval (R-10) |
| PLAN-CORRECTNESS-1-005 | (a) | tokens compared by name or prefix mention against the tokens changelog (R-09) |
| PLAN-CORRECTNESS-1-006 | (a) | D3 accepted; spec FR-014, FR-044, O6 name the readiness gate |
| PLAN-CORRECTNESS-1-007 | (b) | constitution amendment MINOR 1.3.1 → 1.4.0, spec FR-040 names the peer-range exception (R-14) |
| PLAN-FRESH-1-001 | (a) | `release-base` job; Sign-off skipped in `workflow_call` runs only, guarded by gate rules (R-10, R-13) |
| PLAN-FRESH-1-006 | (a) | Story 4 scenario 4 reworded; install-check peer step, rule `peer-unresolved` (R-11) |
| PLAN-FRESH-1-007 | (b) | no date rule; the pre-tag pull request sets the release date, the operator confirms (R-15) |
| PLAN-TESTABILITY-1-003 | (a) | `commit-repo` carries files; pack-contents plants on `pack-tree` fixture trees, build path in an integration test (R-17) |

**Operator decisions, plan squad round 2** (`reviews/plan/round-2/refute.md`, Decision column):

| Finding | Option | Effect |
|---|---|---|
| PLAN-FRESH-2-001 | (a) | `release-step dry-run`: dry run only for a version `npm view` answers `E404`, "already published, dry run skipped" otherwise; rule `dry-run-via-release-step`; RELEASING.md names "Re-run failed jobs" (R-10, R-13, R-15) |
| PLAN-FRESH-2-002 | (a) | every release job on the pinned Node (rule `node-pin`); `release-dry-run.yml` runs the same pre-approval graph (`release-base`, `gates` with `release: false`, `prepare` with `check-tag --no-tag` and the composite action without its `tag` input), rule `dry-run-graph`; pull request trigger only; ci.yml's `head` input dropped, Sign-off keeps its pull-request range (R-10, R-13) |
| PLAN-FRESH-2-004 | (a) | `fetch-depth: 0` on the unit-test shard and full checkouts, spec 001 ci-checks amended; the two history tests assert a non-shallow clone first (R-07, R-08) |

**Operator decisions, plan squad round 3** (`reviews/plan/round-3/refute.md`, Decision column):

| Finding | Option | Effect |
|---|---|---|
| PLAN-FRESH-3-001 | (a) | `release-step base` returns the tagged commit's parent (`first-release-base` for 1.0.0), so the release run mutates only what `main` has not already proven; the dry run passes no `base` (pull request's own range) and has a cancel-in-progress concurrency group per pull request; rules `gates-inputs`, `dry-run-graph`, `dry-run-concurrency`; spec Assumptions and FR-027 (R-10, R-13) |
| PLAN-FRESH-3-002 | (b) | `verdict` job "Release dry run" in the dry run, `needs: [release-base, gates, prepare]`, `if: always()`, fails unless all three succeeded; `prepare` loses the check name; rule `dry-run-verdict`; FR-027's last sentence corrected, Story 3 scenario 8, SC-009 (R-10, R-13) |

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Constitution "Technology, Licence and Supply Chain" contradicted (internal until 1.0.0; token in CI secrets; exact pins for every dependency) until the US5 amendment (MINOR 1.4.0) lands. Scope: this branch until US5. Sunset: the amendment commit. Approved: operator Q1 (a) for the public and credential statements; operator Q3 (a) for the peer range and plan squad round 1 PLAN-CORRECTNESS-1-007 (b) for adding the pin exception to the constitution as a MINOR amendment. | The facts changed (public early) and the operator chose OIDC and a peer range. | Leaving the text (Q1 (c)) was rejected by the operator; a PATCH for the pin exception (PLAN-CORRECTNESS-1-007 (a)) was not chosen. |
| New dev dependency `yaml` | Nested workflow YAML must be read exactly for permission and environment rules. | The line-based readers in `gates/lib/registry.ts` cannot see nesting reliably; a hand-written YAML parser is more code to mutation-test than the gate itself. |
