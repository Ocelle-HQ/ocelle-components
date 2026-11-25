# Implementation Plan: Release v1.0.0 (Public npm, Provenance, Gated Publish)

**Branch**: `030-release-v1` (work on `claude/011-release-v1`) | **Date**: 2026-11-25 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/030-release-v1/spec.md`

**Build order** (operator, 2026-11-25): design now, build after #7. Implementation starts only after mission 018
(`claude/007-status-elements`) and op 023 (`claude/060-public-repo-hygiene`, PR #80) are on `main`; `main` is merged
into this branch before the first red commit (the only merge of `main` during the run, decided by the operator).

## Summary

Make the three packages publishable as `1.0.0` and publish them only through a reviewed, provenance-attested
workflow. Three new merge gates (pack contents, release readiness, release workflow) with plants keep the packages
releasable on every pull request; a tag-triggered `release.yml` runs every gate on the tagged commit, packs and
verifies the tarballs, waits for the operator's approval of the `npm-publish` environment, publishes with npm trusted
publishing (OIDC, no token), and proves the result with a credential-free install and provenance check. A
dry-run workflow rehearses everything but the publish on pull requests. The first publish uses an operator-run
placeholder bootstrap (research D1), so the workflow never reads a token. The constitution, READMEs and a new
`RELEASING.md` say how releases work, with every operator-only step marked.

## Technical Context

**Language/Version**: TypeScript (strict) on the pinned Node 26.13.0 (type stripping, as the other gates); YAML for
workflows.

**Primary Dependencies**: existing: pnpm 12.16.1 (pack), npm CLI of the pinned Node (publish, `audit signatures`;
the publish job asserts ≥ 11.5.1), Playwright 1.64.1 (install check's browser load), vitest. New: `yaml` (exact pin,
dev only, for the release-workflow gate; research R-13).

**Storage**: committed JSON data under `gates/release/` (pack manifest, gap rows, secret allow list, provenance
reference).

**Testing**: vitest unit and integration tests under `gates/test/` (the gate tests' home); plants under
`gates/plants/<gate>/` run by the plant job; a stub registry (Node `http`) inside tests for the install check.

**Target Platform**: GitHub-hosted `ubuntu-24.04` runners; the public npm registry.

**Project Type**: library monorepo, release tooling.

**Performance Goals**: `release-readiness` under 60 s on the full history in CI; `pack-contents` under the build time
plus 30 s; install check's visibility retry bounded at 10 min.

**Constraints**: no long-lived token anywhere (Q2 (a), D1); least-privilege workflow permissions; every action
pinned by SHA; no sandbox paths or credentials in any new file (op 023); CI-first: locally only fast gates and
`gate:plants -- --affected <base>`.

**Scale/Scope**: 3 packages, 17 gap rows, 3 new gates, 2 new workflows, 1 composite action, 1 workflow change
(`ci.yml` gains `workflow_call`).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Check | Status |
|---|---|---|
| I. Framework-free elements | No element change. | pass |
| II. Tokens only | No style change. | pass |
| III. Accessible | No UI change. | pass |
| IV. Strict CSP, offline | Packages unchanged in behaviour; the install check loads `browser.js` from the installed package with no network (registry reads are the install, not the page). | pass |
| V. Storybook | No story change. | pass |
| VI. Consumer needs | Consumers named in the spec (kitty-mission-ui, Ocelle console); no code copied. | pass |
| VII. Semver | First public release `1.0.0`; per-package changelog entries (FR-005, R-09). | pass |
| VIII. Test-first, gates proven | Each new gate red-first with fail, pass and breaking plants; the install check proven by unit tests with a stub registry (including a bad signature) and by the dry-run rehearsal against a real provenance-attested package; workflow YAML proven through the release-workflow gate. Docs and constitution phases are behaviour-free and claim the exemption in review. | pass |
| Supply chain: "repository is internal until then and goes public with 1.0.0"; "npm publish token lives only in CI secrets"; "every dependency is pinned exactly" | False today / contradicted by Q2 (a) / the peer range of Q3 (a). Amended in this mission (Q1 (a), FR-040, research R-14), PATCH 1.3.1 → 1.3.2. Until the amendment phase lands, the plan relies on the operator's Q1 decision. | pass, by amendment (recorded in Complexity Tracking) |
| Workflow: gates listed | Three gates added to spec 001 FR-020 by amendment (FR-044), as op 023 did. | pass |

**Post-design re-check:** unchanged; the design adds no element, token or story, and no exception beyond the one
below.

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
packages/*/CHANGELOG.md, packages/*/README.md     # 1.0.0 entries, install sections
gates/bin/pack-contents.ts                         # gate (Story 1)
gates/bin/release-readiness.ts                     # gate (Story 2)
gates/bin/release-workflow.ts                      # gate (Story 3)
gates/lib/pack-contents.ts, release-readiness.ts, secret-scan.ts, gap-rows.ts, release-workflow-rules.ts
gates/lib/pins-rules.ts                            # accepts workspace:^<own version> in peerDependencies (R-03)
gates/release/pack-manifest.json, gap-rows.json, secret-allowlist.json, provenance-reference.json
gates/release/install-check.ts                     # Story 4 (not a gate)
gates/plants/{pack-contents,release-readiness,release-workflow}/
gates/test/…                                       # tests of the above
gates/gates.json, gates/lib/registry.ts, gates/README.md   # three new gate entries
.github/workflows/ci.yml                           # three new jobs; on: workflow_call (inputs base, head)
.github/workflows/release.yml, release-dry-run.yml
.github/actions/release-prepare/action.yml
.specify/memory/constitution.md                    # PATCH amendment (FR-040, FR-041)
specs/001-repository-foundation/spec.md, contracts/ci-checks.md, contracts/plants.md, contracts/gate-cli.md  # FR-044
RELEASING.md, CONTRIBUTING.md                      # FR-043
```

**Structure Decision**: release tooling lives with the gates (`gates/`), because three of its four parts are gates
and share the gate CLI, finding format and plant job; release-only data sits in `gates/release/`.

## Phases (user stories) and their order

0. **Setup** (no behaviour): merge `main` (after 018 and 023). Each gate's registry entry (`gates.json`, the FR-020
   list, its `ci.yml` job) lands in its own story's green commit, since the plant job requires the three sets equal.
1. **US1, P1 — pack contents**: metadata, licence files, peer, pins-rule change (test-first), pack manifest, gate,
   plants, CI job. Changelogs move to `1.0.0` here only as far as the gate needs (no date yet).
2. **US2, P1 — release readiness**: gap rows (member-level evidence completed against merged `main`), secret scan,
   allow list, version, changelog rules, gate, plants, CI job (`fetch-depth: 0`). The `1.0.0` changelog entries are
   written here (dated the day the phase is implemented; R-09 allows any date).
3. **US3, P2 — workflows**: `yaml` dependency, release-workflow gate and plants first (red), then `ci.yml`'s
   `workflow_call`, the composite action, `release.yml`, `release-dry-run.yml`.
4. **US4, P2 — install check**: stub-registry tests (red), the check, tarball rehearsal, provenance reference and
   `--rehearse`, wired into both workflows.
5. **US5, P3 — governance and docs** (behaviour-free): constitution PATCH via `/speckit-constitution`, spec 001
   amendment (FR-044), READMEs, `RELEASING.md`, `CONTRIBUTING.md` link.

The release itself (O3 to O8) happens after the mission's pull request is merged, by the operator; "ALL PHASES DONE"
reports it as pending.

## Plan decisions for the gate

| # | Decision | Alternatives |
|---|---|---|
| D1 | First publish: operator publishes a placeholder `0.0.0-bootstrap.0` per package interactively, configures trusted publishers, then the workflow publishes `1.0.0` via OIDC (R-01) | D1-b one-time granular token in the environment secret; D1-c operator publishes 1.0.0 locally (rejected) |
| D2 | Peer `workspace:^1.0.0` in source, pins rule accepts it in peers only (R-03) | exact peer (Q3 (b)) |
| D3 | Readiness is a required merge gate on every pull request (R-06) | release-only script |
| D4 | `release.yml` reuses `ci.yml` via `workflow_call` to run every gate on the tag (R-10) | rerun fast gates only |
| D5 | The dry run is a named check, not required (R-10) | required |
| D6 | Own secret-scan rules, no gitleaks or trufflehog (R-08) | a scanner action |

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Constitution "Technology, Licence and Supply Chain" contradicted (internal until 1.0.0; token in CI secrets; exact pins for every dependency) until the US5 amendment lands. Scope: this branch until US5. Sunset: the amendment commit. Approved: operator Q1 (a). | The facts changed (public early) and the operator chose OIDC and a peer range. | Leaving the text (Q1 (c)) was rejected by the operator. |
| New dev dependency `yaml` | Nested workflow YAML must be read exactly for permission and environment rules. | The line-based readers in `gates/lib/registry.ts` cannot see nesting reliably; a hand-written YAML parser is more code to mutation-test than the gate itself. |
