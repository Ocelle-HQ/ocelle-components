# Tasks: Release v1.0.0 (Public npm, Provenance, Gated Publish)

**Input**: design documents in `specs/030-release-v1/`, approved at the plan gate on 2026-11-25 after three plan-squad
rounds (`reviews/plan/round-1..3/`, `reviews/plan/operator-gate.md`):
- spec.md: Stories 1 to 5 and their scenarios, FR-001 to FR-045, SC-001 to SC-009, the operator steps O1 to O8;
- plan.md: § Phases, the plan decisions D1 to D6 and the round-1 to round-3 operator decisions;
- research.md: R-01 to R-17;
- data-model.md;
- contracts/: `pack-contents-gate.md`, `release-readiness-gate.md`, `release-workflow.md`, `install-check.md`;
- sources/: `issue-11.md`, `issue-1-gap-table.md`;
- quickstart.md.

**Build order** (operator, 2026-11-25): design now, build after #7. No task below starts before the orchestrator sends
"go" after mission 018 (`claude/007-status-elements`, #7's rest) has landed on `main`. Phase 0 merges `main` first;
op 023 (#60) is already on `main` (the `sandbox-paths` gate, `gates/lib/sandbox-paths.ts`, the redaction script
`tooling/speckit/bin/redact-sandbox-paths.sh`, `SECURITY.md`, spec 001 FR-032): 18 gates and 19 required checks there,
plus whatever mission 029 changed by then.

**Standing rules for every phase**:
- Test-first (constitution VIII): the red commit changes only test files and fails for the missing behaviour; the
  plants a gate reads arrive with the green commit (spec 001 FR-025). Commits are signed off (`git commit -s`).
- CI-first: locally run only the fast gates (`gate:typecheck`, `gate:lint`, `gate:test-lint`, `gate:pins`,
  `gate:prefix`, the phase's own gate) and `pnpm run gate:plants -- --affected <base>`; CI's required checks decide
  mutation, visual and the full plant job.
- No committed file may hold a credential-shaped value or a sandbox path (FR-045, R-08): secret-shaped test values
  are assembled at run time and plant values come from `secret:` headers; run op 023's redaction script on any new
  record that quotes tool output.
- No agent performs an operator step (O1 to O8, the agent-side deny rules): see § Operator steps. No agent pushes a
  tag, runs `npm publish` without `--dry-run`, `npm login`, `npm trust`, `npm deprecate`, `npm dist-tag`, or
  `gh release`, and no agent edits `.claude/settings.json`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an incomplete task).
- **[Story]**: the user story (US1 to US5) of spec.md.

---

## Phase 0: Setup - merge main and recheck

**Goal**: bring the branch onto `main` with mission 018 and op 023 merged and confirm the design still holds there,
before any red commit. No behaviour: the phase is exempt from the red/green check, and its review states why no test
can fail for it.

- [ ] T001 Merge `origin/main` into `claude/011-release-v1` (`git fetch origin main && git merge --no-edit -s ort FETCH_HEAD`, signed off; the only merge of `main` in this run, decided by the operator) and resolve nothing by hand in `specs/030-release-v1/` (no file there exists on `main`).
- [ ] T002 Recheck the design against `main` as merged and write `specs/030-release-v1/reviews/recheck.md`, one section per item, each with "as planned", "as on `main`" (file and line) and "difference: none | <what>". Items:
  - `gates/gates.json`, `gates/lib/registry.ts` (FR-020 list) and `.github/workflows/ci.yml`: the gate ids and check names on `main` (expected 18 gates with `sandbox-paths`, 19 required checks, plus mission 029's changes), so the three new ids `pack-contents`, `release-readiness`, `release-workflow` and their check names "Pack contents", "Release readiness", "Release workflow" do not collide;
  - `gates/lib/sandbox-paths.ts`: the exported rule and the allowed-files list the pack-contents gate reuses (contract `pack-contents-gate.md`, rule `sandbox-path`);
  - `gates/lib/plant-repo.ts` (`parseCommits`, `buildCommitRepo`, the configuration set) and `gates/bin/plants.ts` (plant forms, `plantValues`) against research R-17;
  - `gates/lib/mutation/ranges.ts`: `gates/lib` and `gates/bin` are in the mutation gate's scope (R-11);
  - `gates/test/ci-workflow.test.ts` and `ci.yml`'s `mutation-plan`, `mutation-shard`, `signoff`, `unit-tests-shard`, `unit-tests-full` jobs: the exact lines the US2 and US3 red tests amend;
  - `packages/elements/custom-elements.json`: the tags mission 018 added (expected `ocelle-status-indicator`, `ocelle-metric`, `ocelle-pill-tag`) and their members for gap rows 6, 10 and 15 (data-model.md § Gap row);
  - the three `packages/*/package.json` and `CHANGELOG.md` files and the root `NOTICE` and `THIRD_PARTY_NOTICES` as merged;
  - `packages/elements/test/browser/serve.ts`: the strict-CSP server pattern the install check reuses (R-11);
  - `.node-version`, `packageManager`, and the npm CLI version the pinned Node bundles (`npm --version` after `pnpm run setup:online`): at least 11.5.1 for trusted publishing (R-01, R-02), recorded;
  - the commit `183b20f` resolves in the merged history (R-07).

  Commit `reviews/recheck.md` signed off. If any item shows a difference that changes a task, stop for the operator before T004: the difference and its effect go to the orchestrator as a multiple-choice question.
- [ ] T003 Write `specs/030-release-v1/reviews/phase-0/tdd-exempt.md`: phase 0 merges `main` and rechecks documents, with no behaviour, so no test can fail for it. Commit it with T002's record.

**Checkpoint**: `tdd-check.sh 0` reports `exempt`; `reviews/recheck.md` records no open difference.

---

## Phase 1: User Story 1 - Each package tarball is exactly what a consumer should get, and a gate proves it (Priority: P1) 🎯 MVP

**Goal**: the three packages carry public-release metadata and licence files, the peer is a registry range, and the
`pack-contents` gate (check "Pack contents") fails on every tarball defect of FR-004 (spec Story 1, FR-001 to FR-006;
research R-02 to R-05, R-17; data-model.md § Pack manifest, § Package manifest fields; contract
`pack-contents-gate.md`).

**Independent test**: the "Pack contents" check passes on the real packages; the plant job shows it failing on each
fail plant, accepting `pass-minimal` and `pass-star-export`, and reporting `break-tarball-unreadable` and
`break-manifest-invalid` as "could not run".

### Tests (red, one commit, test files only)

- [ ] T004 [P] [US1] In `gates/test/pins-rules.test.ts`, add cases: `workspace:^1.0.0` for a workspace package at version `1.0.0` is accepted in `peerDependencies`; the same in `dependencies` and `devDependencies` is a finding; `workspace:^1.0.1` (not the package's own version) in `peerDependencies` is a finding; `workspace:1.0.0` stays accepted everywhere (research R-03, D2).
- [ ] T005 [P] [US1] Create `gates/test/pack-contents.test.ts` (unit tests of `gates/lib/pack-contents.ts` on in-memory tarball listings and manifests, no build): one test per finding rule of the contract, each asserting the exact finding line `<package>[:<path>]: pack-contents: <rule>: <message>`: `entry-point-missing` (each of an `exports` target, `main`, `module`, `types`, `customElements`), `entry-pattern-empty` (a `./fonts/*` export with no match), `required-missing`, `not-identical` (a `NOTICE` that differs by one byte from the root's), `private-flag`, `workspace-specifier`, `version-mismatch` (against the other packages and against `--version`), `peer-mismatch` ("the packed `peerDependencies` exactly: `{ "@ocelle/tokens": "^<version>" }` for styles and elements; `{}` for tokens"), `not-allowed`, `denied` (each deny pattern of the contract, the deny list checked before the allow list), `sandbox-path` (the value assembled at run time from parts, never a literal), `repository-mismatch` (`url` and `directory` per data-model.md: `{ "type": "git", "url": "git+https://github.com/Ocelle-HQ/ocelle-components.git", "directory": "packages/<name>" }`), `license-field` (not `Apache-2.0`); plus the exit-0 summary line `pack-contents: <name>@<version>: <n> files, <m> entry points`, and exit 2 for an unreadable tarball and an invalid `pack-manifest.json`.
- [ ] T006 [P] [US1] In `gates/test/plant-repo.test.ts` and `gates/test/integration/plant-repo.test.ts`, add the `pack-tree` form (research R-17): a plant's `tree/packages/<name>/` is laid over the configuration set, each package directory is archived under `package/` with plain `tar` into `<tmp>/tarballs/<name>.tgz` (a `workspace:` specifier and a stray file survive as-is), and the gate is run with `--root <tmp> --tarballs <tmp>/tarballs`; and assert the configuration set now contains `.github/workflows/`, `.github/actions/`, `gates/release/`, `specs/030-release-v1/sources/issue-1-gap-table.md`, `packages/*/CHANGELOG.md`, `packages/styles/src/*.css`, `specs/*/verification.md`, and the root `LICENSE`, `NOTICE`, `THIRD_PARTY_NOTICES`.
- [ ] T007 [P] [US1] Create `gates/test/integration/pack-contents.test.ts`: on the real workspace, `pnpm run gate:pack-contents` (no `--tarballs`: build and `pnpm pack`) exits 0 and prints one line per package at version `1.0.0`; a copy of the workspace whose tokens build script exits non-zero makes the gate exit 2 naming the build (the build path's "could not run").
- [ ] T008 [P] [US1] In `gates/test/registry.test.ts`, `gates/test/gates-readme.test.ts` and `gates/test/ci-workflow.test.ts`, assert the new gate id `pack-contents` with check "Pack contents", plant form `pack-tree`, a `ci.yml` job `pack-contents` with `persist-credentials: false`, its `gates/README.md` row, and the FR-020 list entry.
- [ ] T009 [US1] Run the red tests against the code as it is, keep the output as the red evidence (`specs/030-release-v1/reviews/phase-1/red-phase.log`, redacted with op 023's script), and commit T004 to T008 as one test-only commit, signed off.

### Implementation (green)

- [ ] T010 [US1] Edit the root `NOTICE` (research R-04, PLAN-FRESH-2-006): it says that each published `@ocelle` package holds a copy and that `THIRD_PARTY_NOTICES` is in this repository and in the `@ocelle/tokens` and `@ocelle/elements` packages; nothing else changes. This must land before T013 freezes it with the `identical` rule.
- [ ] T011 [US1] Update `packages/tokens/package.json`, `packages/styles/package.json`, `packages/elements/package.json` per data-model.md § Package manifest fields: remove `private`; `version` `1.0.0`; `license` `Apache-2.0`; `repository` `{ "type": "git", "url": "git+https://github.com/Ocelle-HQ/ocelle-components.git", "directory": "packages/<name>" }`; `publishConfig` `{ "access": "public", "registry": "https://registry.npmjs.org/" }` (no `provenance` key); styles and elements `peerDependencies` `{ "@ocelle/tokens": "workspace:^1.0.0" }`; `files` plus `LICENSE`, `NOTICE` (tokens, styles) and `THIRD_PARTY_NOTICES` (tokens). Make the tokens and styles build scripts copy the root `LICENSE` and `NOTICE` (and, for tokens, `THIRD_PARTY_NOTICES`) as the elements build does; keep `dist/fonts/OFL.txt` beside the font. Update `pnpm-lock.yaml` with `pnpm install --frozen-lockfile=false` only as far as the version and peer change it.
- [ ] T012 [US1] Change `gates/lib/pins-rules.ts` so `workspace:^<the workspace package's own version>` is accepted in `peerDependencies` only (research R-03), with a comment citing D2 and the constitution amendment of US5.
- [ ] T013 [US1] Create `gates/release/pack-manifest.json` per data-model.md § Pack manifest: one entry per package with `name`, `dir`, `allow` (non-empty globs), `require` ("at least `package.json`, `LICENSE`, `NOTICE`, `README.md`, `CHANGELOG.md`; tokens adds `THIRD_PARTY_NOTICES`, `dist/fonts/OFL.txt`"), `identical` (`LICENSE`, `NOTICE`, and `THIRD_PARTY_NOTICES` where shipped), `peer`; the three packages each once.
- [ ] T014 [US1] Create `gates/lib/pack-contents.ts` (the rules of the contract, the deny list as code, entry-point resolution per research R-05 with `*` patterns expanded against the tarball, `sandbox-path` through `gates/lib/sandbox-paths.ts`) and `gates/bin/pack-contents.ts` (the CLI: `--root`, `--tarballs`, `--version`; without `--tarballs` builds with `pnpm --filter "./packages/*" -r build` and packs with `pnpm pack --pack-destination <tmp>`; exit 0, 1, 2 per `gates/README.md`), and add `"gate:pack-contents": "node gates/bin/pack-contents.ts"` to the root `package.json`.
- [ ] T015 [US1] Extend `gates/lib/plant-repo.ts` and `gates/bin/plants.ts` with the `pack-tree` form and the configuration-set additions of research R-17 (T006).
- [ ] T016 [US1] Create the plants `gates/plants/pack-contents/` (contract list): fail `fail-export-missing`, `fail-license-missing`, `fail-ofl-missing`, `fail-notice-differs`, `fail-private`, `fail-workspace-peer`, `fail-version-skew`, `fail-extra-file`, `fail-test-file`, `fail-npmrc` (an `.npmrc` with no credential-shaped value), `fail-sandbox-path` (value via the plant builder, never a literal in the plant), `fail-peer-exact`, `fail-repository-directory`; pass `pass-minimal`, `pass-star-export`; breaking `break-tarball-unreadable`, `break-manifest-invalid`; each with its `plant.json` listing the exact expected findings.
- [ ] T017 [US1] Register the gate: `gates/gates.json` entry (`id` `pack-contents`, `check` "Pack contents", `command` `pnpm run gate:pack-contents`, `plantCommand`, `plantForm` `pack-tree`, `scope`), the FR-020 list in `gates/lib/registry.ts`, a `pack-contents` job in `.github/workflows/ci.yml` (pinned checkout with `persist-credentials: false`, `./.github/actions/setup`, `pnpm run gate:pack-contents`), and its row in `gates/README.md`.
- [ ] T018 [US1] Leave the three `packages/*/CHANGELOG.md` files unchanged in this phase (US2 writes the dated `1.0.0` entries, T029); confirm in `reviews/phase-1/plants.md` that the pack-contents gate requires only the changelog's presence (`require`), not its content.
- [ ] T019 [US1] Run the fast gates, `pnpm run gate:pack-contents` and `pnpm run gate:plants -- --affected <phase base>`; commit the green change signed off; write `specs/030-release-v1/reviews/phase-1/plants.md` per the story extension's form.

**Checkpoint**: `tdd-check.sh 1` passes; the "Pack contents" check is green on the branch and its plants pass the plant job.

---

## Phase 2: User Story 2 - The operator can see, before tagging, that the release is ready (Priority: P1)

**Goal**: the `release-readiness` gate (check "Release readiness", a required pull-request check) reports the 17 gap
rows, the history secret scan, the shared version and the changelog rules, and ends in ready / not ready (spec Story
2, FR-010 to FR-015, FR-045; research R-06 to R-09, R-17; data-model.md § Gap row, § Secret allow-list entry,
§ Readiness report; contract `release-readiness-gate.md`).

**Independent test**: the gap check against commit `183b20f` reports exactly rows 6, 10 and 15 unmet; the gate on
the branch reports `ready (17/17 rows, 0 secrets, version 1.0.0)`; the plant job proves every rule.

### Tests (red, one commit, test files only)

- [ ] T020 [P] [US2] In `gates/test/plant-repo-parts.test.ts` and `gates/test/integration/plant-repo.test.ts`, add the `commit-repo` extension (research R-17): `files: <dir>` lays a plant directory over the previous commit's tree, `delete: <path>` removes a path, `secret: <rule> <path>` appends a value of that rule generated at plant time (the plant holds no literal); the readiness plants' base commit holds the configuration set; sign-off plants keep the empty base.
- [ ] T021 [P] [US2] Create `gates/test/release-readiness.test.ts` (unit tests of `gates/lib/gap-rows.ts`, `gates/lib/secret-scan.ts`, `gates/lib/release-readiness.ts`): gap rows: each evidence kind of data-model.md (`element`, `member`, `token`, `style-hook`, `spec`) met and unmet; "at least one item that is not of kind `spec`" (`gap-row-unmet` for a spec-only row); `gap-rows-mismatch` when a row's `upstream`, `need` or `metIn` differs from `sources/issue-1-gap-table.md` or a row is missing or reordered; secret scan: one test per rule of research R-08 (npm, GitHub, private key, AWS, Slack, Anthropic, OpenAI, Google, `.npmrc` auth line in a file named `.npmrc`, env assignment in a `.env*` file), each value assembled at run time from parts, asserting the finding names `<commit>:<path>` and the rule and that the matched text appears in no output; non-hits: `_authToken=${NODE_AUTH_TOKEN}`, a `*_TOKEN=${...}` line, a Markdown file describing the rules, a `sha512-` integrity hash; allow list: keyed by path, rule and the matched text's SHA-256, `allowlist-no-reason`, `allowlist-stale`; version: `version-mismatch`, `tag-mismatch`; changelog (research R-09): `changelog-missing-entry`, `changelog-undated` (`## <version> - <YYYY-MM-DD>`), `changelog-unreleased-not-empty` (with `--tag`), `changelog-missing-element`, `changelog-missing-token` (a token named neither in full nor by a `` `--ocelle-<prefix>-*` `` mention), a token covered by a prefix mention passes; the summary lines `ready (...)` and `not ready (...)`; exit 2 for a shallow clone and an invalid `gap-rows.json`.
- [ ] T022 [P] [US2] Create `gates/test/integration/release-readiness.test.ts`: (a) first asserts the clone is not shallow and that `183b20f` resolves to a commit, failing (never skipping) otherwise; then runs the gap check with the committed `gates/release/gap-rows.json` against the inputs at `183b20f` and expects exactly rows 6, 10 and 15 unmet (research R-07); (b) the same full-history assertions, then the history scan of this repository's own `HEAD` reports zero hits (research R-08); (c) `pnpm run gate:release-readiness` on the branch exits 0 with `ready (17/17 rows, 0 secrets, version 1.0.0)`.
- [ ] T023 [P] [US2] In `gates/test/ci-workflow.test.ts`, assert `fetch-depth: 0` on the checkouts of `unit-tests-shard` and `unit-tests-full` (operator decision PLAN-FRESH-2-004 (a)) and a `release-readiness` job with `fetch-depth: 0` and `persist-credentials: false`; in `gates/test/registry.test.ts` and `gates/test/gates-readme.test.ts`, the gate id `release-readiness`, check "Release readiness", plant form `commit-repo`, FR-020 list entry and README row.
- [ ] T024 [US2] Run the red tests against the code as it is, keep the red evidence (`reviews/phase-2/red-phase.log`, redacted), and commit T020 to T023 as one test-only commit, signed off.

### Implementation (green)

- [ ] T025 [US2] Extend `gates/lib/plant-repo.ts` (`parseCommits`, `buildCommitRepo`) with the `files:`, `delete:` and `secret:` headers and the configuration-set base for readiness plants (T020).
- [ ] T026 [US2] Create `gates/release/gap-rows.json`: exactly the 17 rows of `specs/030-release-v1/sources/issue-1-gap-table.md`, in order, with `upstream`, `need` and `metIn` verbatim, and evidence per data-model.md § Gap row, completed at member level against the merged `main` (row 1 points at `011-layout-headers`; rows 6, 10 and 15 name mission 018's elements and members as recorded in `reviews/recheck.md`); no row may rely on a `spec` item alone.
- [ ] T027 [US2] Create `gates/lib/gap-rows.ts`, `gates/lib/secret-scan.ts` (`git log -p -m --no-color --no-ext-diff HEAD`, added lines only, binary diffs skipped, the rules of research R-08, never writing the matched text), `gates/lib/release-readiness.ts` (version, `--tag`, changelog rules of R-09, the report of data-model.md) and `gates/bin/release-readiness.ts` (CLI `--root`, `--tag`; exit 2 on a shallow clone, a missing or invalid input); add `"gate:release-readiness": "node gates/bin/release-readiness.ts"` to the root `package.json`.
- [ ] T028 [US2] Create `gates/release/secret-allowlist.json` as an empty list `[]` (entries `{ path, rule, sha256, reason }`, all non-empty, only if the scan finds a hit the operator approves; T022 (b) expects zero hits).
- [ ] T029 [US2] Write the `1.0.0` changelog entries: in each `packages/*/CHANGELOG.md`, the "Unreleased" content becomes `## 1.0.0 - <today, YYYY-MM-DD>` naming the surface since the start (constitution VII), including mission 018's elements and every other mission merged by T001; every element tag in the manifest named as `` `ocelle-x` `` in the elements changelog; every token covered in full or by a `` `--ocelle-<prefix>-*` `` mention in the tokens changelog; "Unreleased" left empty. The pre-tag pull request sets the release date later (R-15).
- [ ] T030 [US2] Create the plants `gates/plants/release-readiness/` (contract list): fail `fail-row-unmet`, `fail-rows-reworded`, `fail-row-spec-only`, `fail-secret-npm`, `fail-secret-github`, `fail-secret-private-key`, `fail-secret-aws`, `fail-secret-slack`, `fail-secret-anthropic`, `fail-secret-openai`, `fail-secret-google`, `fail-secret-npmrc`, `fail-secret-env-assignment`, `fail-secret-deleted-later`, `fail-allowlist-no-reason`, `fail-allowlist-stale`, `fail-version-skew`, `fail-tag-mismatch`, `fail-changelog-undated`, `fail-changelog-missing-element`, `fail-changelog-missing-token-group`, `fail-unreleased-not-empty`; pass `pass-repository`, `pass-allowlisted`, `pass-npmrc-variable`, `pass-env-variable`, `pass-rule-prose`, `pass-token-prefix`, `pass-lockfile-integrity`; breaking `break-shallow`, `break-gap-rows-invalid`; every secret value through a `secret:` header, none literal.
- [ ] T031 [US2] Register the gate (`gates/gates.json`, `gates/lib/registry.ts` FR-020 list, `gates/README.md` row) and change `.github/workflows/ci.yml`: a `release-readiness` job (`fetch-depth: 0`, `persist-credentials: false`, setup, `pnpm run gate:release-readiness`) and `fetch-depth: 0` on the `unit-tests-shard` and `unit-tests-full` checkouts; amend spec 001 `specs/001-repository-foundation/contracts/ci-checks.md`'s Unit tests checkout line (`fetch-depth: 0`) and add the Release readiness check, in this commit (FR-044).
- [ ] T032 [US2] Run the fast gates, `pnpm run gate:release-readiness` and `pnpm run gate:plants -- --affected <phase base>`; commit the green change signed off; write `reviews/phase-2/plants.md`.

**Checkpoint**: `tdd-check.sh 2` passes; "Release readiness" reports ready on the branch.

---

## Phase 3: User Story 3 - A release happens only through a reviewed, provenance-attested publish (Priority: P2)

**Goal**: `release.yml` (tag-only), `release-dry-run.yml` (pull requests, same pre-approval graph plus the
"Release dry run" verdict), the `release-prepare` composite action, `release-step` (`base`, `check-tag`, `digest`,
`dry-run`, `publish`), the `ci.yml` `workflow_call`, and the `release-workflow` gate (check "Release workflow") that
fails on every rule of the contract (spec Story 3, FR-020 to FR-027; research R-01, R-02, R-10, R-13; contract
`release-workflow.md`).

**Independent test**: on this branch's pull request, "Release dry run" runs `release-base`, `gates`, `prepare` and
`verdict` and is green; "Release workflow" passes on the planned files and the plant job proves each rule;
`release-step`'s unit tests cover publish order, skip, retry bound and digest mismatch.

### Tests (red, one commit, test files only)

- [ ] T033 [P] [US3] Create `gates/test/release-steps.test.ts` (unit tests of `gates/lib/release-steps.ts` with an injected npm runner, git reader and clock): `base` returns the tagged commit's parent when a `v*` tag is reachable from it, `gates/release/first-release-base` otherwise; `check-tag`: tag not `v<version>`, versions differ, commit not an ancestor of `origin/main`, and the `--no-tag` mode (one shared version, `origin/main` resolves, prints that the tag comparison and ancestor test are skipped); `digest`: SHA-256 of each tarball as outputs `sha256-tokens`, `sha256-styles`, `sha256-elements`; `dry-run`: not on the registry (runs `npm publish <tgz> --dry-run` and nothing else), already published (reports `<name>@<v>: already published, dry run skipped`, no `npm publish` call), partial (tokens skipped, styles and elements dry-run), `npm view` error past the 10-minute bound, a failing dry run; `publish`: all new (order tokens, styles, elements, each `npm publish <tgz> --access public --provenance`), already published (skip and report), partial, `npm view` network error then success, error past the bound, publish error then visible (report and skip), `digest-mismatch` (nothing published), a failure stops before the next package, never `unpublish`, `deprecate` or `dist-tag`.
- [ ] T034 [P] [US3] Create `gates/test/release-workflow.test.ts` (unit tests of `gates/lib/release-workflow-rules.ts` on in-memory YAML): one test per rule of the contract (`trigger`, `workflow-permissions`, `id-token-outside-publish`, `publish-not-in-environment`, `publish-extra-write`, `dry-run-can-publish`, `unpinned-action`, `persisted-credentials`, `secret-read`, `token-env`, `destructive-npm`, `gates-inputs`, `prepare-needs-gates`, `publish-needs-prepare`, `install-check-needs-publish`, `publish-builds`, `publish-order`, `publish-verifies-checksums`, `publish-node-pin`, `node-pin`, `digest-after-pack`, `rehearse-in-prepare`, `dry-run-via-release-step`, `dry-run-graph` with exactly its four allowed differences and its one extra `verdict` job, `dry-run-verdict`, `dry-run-concurrency`, `signoff-skip-scope`, `release-input-caller`), each asserting the finding line `<file>:<line>: release-workflow: <rule>: <message>`; a local action (`uses: ./...`) is not remote; exit 2 (`file-missing`) for a file that does not parse.
- [ ] T035 [P] [US3] In `gates/test/ci-workflow.test.ts`, assert the `workflow_call` trigger with inputs `base` (string) and `release` (boolean, default `false`), the lines `BASE: ${{ inputs.base || github.event.pull_request.base.sha }}` in `mutation-plan` and `mutation-shard`, and the Sign-off job's `if: ${{ !inputs.release }}` with its range still from `github.event.pull_request`; in `gates/test/registry.test.ts` and `gates/test/gates-readme.test.ts`, the gate id `release-workflow`, check "Release workflow", plant form `repo-tree`, FR-020 entry and README row.
- [ ] T036 [US3] Run the red tests against the code as it is, keep the red evidence (`reviews/phase-3/red-phase.log`, redacted), and commit T033 to T035 as one test-only commit, signed off.

### Implementation (green)

- [ ] T037 [US3] Add the dev dependency `yaml` at an exact version that passes `gate:pins` (release age, exact pin) to the root `package.json` and `pnpm-lock.yaml` (research R-13).
- [ ] T038 [US3] Create `gates/lib/release-steps.ts` (only Node built-ins and dependency-free `gates/lib` modules) and `gates/bin/release-step.ts` (subcommands `base`, `check-tag [--no-tag]`, `digest`, `dry-run`, `publish`; values arrive through `env:`), and `gates/release/first-release-base` holding the commit before this mission's first commit on the branch (the pre-tag pull request rewrites it to the exact parent; R-10).
- [ ] T039 [US3] Change `.github/workflows/ci.yml`: `on: workflow_call` with inputs `base` (string) and `release` (boolean, default `false`); `mutation-plan` and `mutation-shard` read `inputs.base || github.event.pull_request.base.sha`; the Sign-off job gets `if: ${{ !inputs.release }}`; nothing else. Amend spec 001 `specs/001-repository-foundation/contracts/ci-checks.md`'s trigger line, Sign-off condition and mutation base expression in this commit (FR-044).
- [ ] T040 [US3] Create `.github/actions/release-prepare/action.yml` per the contract: input `tag` (default empty); build; `gate:release-readiness` (`--tag <tag>` only when set); `pnpm pack` of the three packages; `release-step digest` right after the pack (outputs `sha256-tokens`, `sha256-styles`, `sha256-elements`); `gate:pack-contents --tarballs`; `release-step dry-run`; `install-check --from-tarballs` on a copy; `install-check --rehearse`. (The two install-check steps call the US4 command; until US4 lands they are present and the dry run's verdict is red, which the phase review records.)
- [ ] T041 [US3] Create `.github/workflows/release.yml` per the contract: `on: push: tags: ["v*"]` only; workflow `permissions: contents: read`; `concurrency: { group: release, cancel-in-progress: false }`; jobs `release-base`, `gates` (`uses: ./.github/workflows/ci.yml` with `base` and `release: true`), `prepare` (`check-tag`, the composite action with `tag: ${{ github.ref_name }}`, outputs, artifact `release-tarballs` with the three `.tgz` only), `publish` (`environment: npm-publish`, `permissions: { contents: read, id-token: write }`, sparse checkout of `.node-version` and `gates/`, pinned `actions/setup-node` with `node-version-file: .node-version` and `registry-url: https://registry.npmjs.org`, `npm --version` at least 11.5.1, download, `release-step publish` with the digests from `needs.prepare.outputs` via `env:`), `install-check` (`permissions: contents: read`, the US4 command with `--version`, `--repository Ocelle-HQ/ocelle-components`, `--commit`, `--workflow .github/workflows/release.yml`, `--ref refs/tags/v<version>`); every remote action pinned by full SHA; every checkout `persist-credentials: false`; every job that runs `node` or `pnpm` gets the pinned Node first.
- [ ] T042 [US3] Create `.github/workflows/release-dry-run.yml` per the contract: `on: pull_request` only; `permissions: contents: read`; `concurrency: { group: release-dry-run-${{ github.event.pull_request.number }}, cancel-in-progress: true }`; `release-base`, `gates` (`release: false`, no `base`), unnamed `prepare` (`check-tag --no-tag`, the composite action without `tag`), and `verdict` named "Release dry run" (`needs: [release-base, gates, prepare]`, `if: always()`, one step failing unless all three `needs.<job>.result` are `success`); no `publish` or `install-check` job, no `environment`, no `id-token`.
- [ ] T043 [US3] Create `gates/lib/release-workflow-rules.ts` and `gates/bin/release-workflow.ts` (reads `release.yml`, `release-dry-run.yml`, `ci.yml` and the composite action with `yaml`; rules per research R-13); add `"gate:release-workflow": "node gates/bin/release-workflow.ts"` to the root `package.json`.
- [ ] T044 [US3] Create the plants `gates/plants/release-workflow/`: one fail plant per rule (among them `fail-signoff-skipped-on-pr`, `fail-publish-rebuilds`, `fail-digest-in-artifact`, `fail-prepare-no-setup`, `fail-bare-dry-run`, `fail-dry-run-graph-drift`, `fail-dry-run-graph-extra-input`, `fail-dry-run-gates-base`, `fail-dry-run-verdict-not-always`, `fail-dry-run-verdict-partial-needs`, `fail-dry-run-no-concurrency`); pass `pass-repository`, `pass-local-action`; breaking `break-not-yaml`.
- [ ] T045 [US3] Register the gate (`gates/gates.json`, `gates/lib/registry.ts`, `gates/README.md`) and add a `release-workflow` job to `.github/workflows/ci.yml`; amend spec 001 `contracts/ci-checks.md` with the check (FR-044).
- [ ] T046 [US3] Run the fast gates, `pnpm run gate:release-workflow` and `pnpm run gate:plants -- --affected <phase base>`; commit the green change signed off; write `reviews/phase-3/plants.md`.

**Checkpoint**: `tdd-check.sh 3` passes; "Release workflow" is green; the dry run's `release-base`, `gates` and the
pack and readiness steps of `prepare` run on the pull request (the install-check steps go green with US4).

---

## Phase 4: User Story 4 - A consumer installs the released packages with no token and can verify where they came from (Priority: P2)

**Goal**: `install-check` (`gates/lib/install-check.ts`, `gates/bin/install-check.ts`) installs with no credential,
resolves every entry point, loads the browser build under the strict CSP with no network, checks the peer, verifies
signatures and provenance (repository, commit, workflow, ref), retries visibility for at most 10 minutes, and is
proven offline and by `--rehearse` on real registry inputs (spec Story 4, FR-030 to FR-034; research R-05, R-11,
R-12; contract `install-check.md`).

**Independent test**: the offline unit tests pass; `install-check --from-tarballs` and `install-check --rehearse`
exit 0 in the dry run, and "Release dry run" is green.

### Tests (red, one commit, test files only)

- [ ] T047 [P] [US4] Record real registry responses into `gates/test/fixtures/install-check/` (the packument and attestations of the provenance reference package and of a package version with no provenance, fetched once with `npm view --json` and the registry's attestations endpoint; no credential involved; redacted with op 023's script if any path appears), and create `gates/release/provenance-reference.json` (`{ name, version, repository, commit }` plus `withoutProvenance` `{ name, version }`, read from the registry at implementation time).
- [ ] T048 [P] [US4] Create `gates/test/install-check.test.ts` (offline, `gates/lib/install-check.ts` with injected verifier, npm runner, browser and clock): decode-and-compare on the recorded responses, one test per provenance rule (`attestation-missing`, `repository-mismatch`, `commit-mismatch`, `workflow-mismatch`, `ref-mismatch`) and for `signature-invalid` (the injected verifier's failure), each asserting the rule line `<package>[@<version>]: install-check: <rule>: <message>`; stub-registry tests (a Node `http` server, no `dist.attestations` advertised) for `not-visible` (injected clock, 30 s interval, 600 s bound), `install-failed`, `entry-point-unresolved`, `peer-unresolved` (the installed elements manifest must declare `@ocelle/tokens` at `^<version>` and tokens must be installed at a satisfying version); fixture tarballs for `csp-violation` (an inline style) and `network-request` (a remote fetch), `import-failed`, `element-undefined`; the child environment allow list of the contract with a planted upper-case per-registry auth-token variable assembled at run time that must not reach the child; `--rehearse` judging six cases (pass; wrong repository, commit, workflow, ref; `withoutProvenance`) and exiting 0 only if all six behave.
- [ ] T049 [US4] Run the red tests, keep the red evidence (`reviews/phase-4/red-phase.log`, redacted), and commit T047 and T048 as one test-only commit, signed off (the fixtures and the reference file are test inputs).

### Implementation (green)

- [ ] T050 [US4] Create `gates/lib/install-check.ts` (steps of the contract: install with `--ignore-scripts` in a fresh `{"private": true}` project; resolve every declared entry point per R-05; import `@ocelle/tokens` in Node; peer step in a second empty project; signature and provenance comparison; retry bound) and `gates/bin/install-check.ts` (the process boundary: npm, Chromium through Playwright, a `127.0.0.1` server with `Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'` reusing the pattern of `packages/elements/test/browser/serve.ts`, off-origin requests aborted and recorded, CSP violations recorded, `ocelle-button` defined; the signature adapter `npm audit signatures --json`; options `--version`, `--repository`, `--commit`, `--workflow`, `--ref`, `--registry`, `--from-tarballs`, `--rehearse`, `--timeout`).
- [ ] T051 [US4] Confirm the composite action's two install-check steps (T040) and `release.yml`'s `install-check` job (T041) call `node gates/bin/install-check.ts` with the contract's options; fix only the command lines if they differ, keeping "Release workflow" green.
- [ ] T052 [US4] Run the fast gates and the new unit tests; commit the green change signed off; confirm "Release dry run" is green on the pull request and record the run's link in `reviews/phase-4/dry-run.md`.

**Checkpoint**: `tdd-check.sh 4` passes; "Release dry run" is green (verdict job: `release-base`, `gates`, `prepare`
all success).

---

## Phase 5: User Story 5 - The rules and the docs say how releases work now (Priority: P3)

**Goal**: the constitution, spec 001, the READMEs, `RELEASING.md` and `CONTRIBUTING.md` are true for the release
(spec Story 5, FR-040 to FR-045; research R-14 to R-16). Behaviour-free: the phase claims the exemption, and its
review states why no test can fail for it.

- [ ] T053 [US5] Amend `.specify/memory/constitution.md` through `/speckit-constitution`, version 1.3.1 → 1.4.0 (MINOR, operator decision PLAN-CORRECTNESS-1-007 (b)), "Last Amended" today, § Technology, Licence and Supply Chain per research R-14 and FR-040, FR-041: packages publish to the public npm registry from 1.0.0 with provenance through the release workflow's OIDC identity; the repository has been public since 2026-11, before 1.0.0; no publish credential is stored in the repository or in CI secrets, and a bootstrap credential, if any, is the operator's own and never reaches CI; a peer range on a workspace package is the one exception to exact pins; `SECURITY.md` exists (present tense; op 023 owns its content). Update the Sync Impact Report as the command does.
- [ ] T054 [P] [US5] Amend spec 001 (`specs/001-repository-foundation/spec.md` FR-020 and FR-025 gate lists, `contracts/plants.md` with the `pack-tree` form and the `commit-repo` headers, `contracts/gate-cli.md` with the three gates), in op 023's style; FR-032 untouched (FR-044).
- [ ] T055 [P] [US5] Add an install section to `packages/tokens/README.md`, `packages/styles/README.md` and `packages/elements/README.md` (FR-042): `pnpm add @ocelle/elements @ocelle/tokens` (and styles where used), the `@ocelle/tokens` peer range `^1.0.0`, the stylesheet and font serving order already documented, and how to verify signatures and provenance (`npm audit signatures`); replace every `workspace:0.0.0` statement.
- [ ] T056 [US5] Write `RELEASING.md` at the root (FR-043, research R-15, R-16): the readiness check; O1 to O8 in order, each marked operator-only with where (registry or GitHub settings page), exact values (environment `npm-publish`, required reviewer the operator, "Prevent self-review" off, administrator bypass off, deployment tags `v*` only; tag ruleset `v*` with the operator as sole bypass; workflow file `release.yml`; check names Pack contents, Release readiness, Release workflow), when, and how the operator confirms it; the agents' GitHub identity is neither the operator's account, a reviewer, nor on a bypass list; the agent-side deny rules of research R-16 as an operator task under O5; the D1 bootstrap commands (placeholder `0.0.0-bootstrap.0` under dist-tag `bootstrap` from an interactive `npm login`, trusted publisher per package, disallow tokens, log out, tag within 2 days); the pre-tag pull request (release date in each changelog, "Unreleased" empty, `gates/release/first-release-base`, merged only with "Release dry run" green); the tag push and the environment approval; the install check; "Re-run failed jobs" after a partial publish; the failure procedure (re-tag only before any publish; lockstep `x.y.z+1` through a version-bump pull request otherwise; a wrong tarball means `1.0.1`); O8 (deprecate the placeholders, confirm no credential remains, re-confirm O4 and O5, close #11).
- [ ] T057 [P] [US5] Link `RELEASING.md` from `CONTRIBUTING.md` and from each package README's install section.
- [ ] T058 [US5] Write `specs/030-release-v1/reviews/phase-5/tdd-exempt.md` (documentation and constitution only, no behaviour), run `pnpm run gate:sandbox-paths` and the fast gates, and commit signed off.

**Checkpoint**: `tdd-check.sh 5` reports `exempt`; every statement of FR-040 to FR-045 can be checked against the
amended files.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T059 Run `pnpm run gate:plants -- --affected <mission base>` and the fast gates on the whole branch; confirm in CI that the three new required checks and the full plant job are green, and that "Release dry run" is green on the pull request's latest commit.
- [ ] T060 Walk `specs/030-release-v1/quickstart.md` § 1 to § 4 and record each result in `specs/030-release-v1/verification.md` (§ 5 is the operator's release, listed as pending).
- [ ] T061 Check that no new or changed file holds a sandbox path or a credential-shaped value (`gate:sandbox-paths`, `gate:release-readiness`); report any repository-wide problem found to the orchestrator instead of fixing it here.

---

## Operator steps (not agent tasks; no phase counts them)

These are performed by the operator only (spec O1 to O8, research R-01, R-15, R-16); no agent performs, scripts or
simulates them. `RELEASING.md` (T056) is their procedure.

| # | Step | When |
|---|---|---|
| O1 | Claim the npm org `ocelle` | done (before triage) |
| O2 | Private vulnerability reporting on; re-confirm in settings | done per op 023; re-confirm before the tag |
| O3 | Bootstrap placeholders `0.0.0-bootstrap.0` interactively, configure the trusted publisher for each package (`Ocelle-HQ/ocelle-components`, `release.yml`, environment `npm-publish`), disallow tokens, log out | before the tag, within 2 days of it |
| O4 | Create environment `npm-publish`: required reviewer the operator, "Prevent self-review" off, administrator bypass off, deployment tags `v*` only; confirm the agents' identity is not a reviewer | before the tag |
| O5 | Ruleset protecting `v*` tags (operator the sole bypass; agents' identity not on it); add the agent-side deny rules of research R-16 to the agent permission settings | before the tag |
| O6 | Add the required checks Pack contents, Release readiness, Release workflow to the `main` ruleset | after this mission merges |
| O7 | Merge the pre-tag pull request (with "Release dry run" green), push `v1.0.0` on the release commit, approve the `npm-publish` deployment | at release |
| O8 | After the install check passes: deprecate the placeholders, confirm no credential remains, re-confirm O4 and O5, close #11 | after release |

---

## Dependencies and parallel work

- Phase 0 blocks everything (merge of `main` after mission 018).
- US1 (phase 1) before US2: US2's changelog rules and readiness read the `1.0.0` versions and metadata US1 sets.
- US2 before US3: the composite action runs the readiness gate and `release-step`'s version checks share US1/US2's
  manifests; `ci.yml`'s `fetch-depth` change (US2) precedes its `workflow_call` change (US3), each with its own red
  test.
- US3 before US4: US4 wires its command into the action and the workflow US3 creates (the dry run's verdict turns
  green with US4).
- US5 after US4: the docs describe the final commands and settings.
- In each phase the red test files marked [P] are independent and can be written in parallel; implementation tasks
  in a phase share files (`gates.json`, `ci.yml`, `registry.ts`) and run in order.

## Implementation strategy

- MVP: phase 0 and US1. With them the packages are publishable in shape and every pull request keeps them so, even
  before any release machinery exists.
- Then US2 (readiness, the operator's evidence), US3 (the gated workflow), US4 (the proof after publishing), US5 (the
  rules and docs). Each phase is folded after its review approves (`/ocelle-run` step 4.3).
- The release itself (pre-tag pull request, O3 to O8) follows the mission's merge and is the operator's.
