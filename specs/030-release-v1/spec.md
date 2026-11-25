# Feature Specification: Release v1.0.0 (Public npm, Provenance, Gated Publish)

**Feature Branch**: `030-release-v1` (work happens on `claude/011-release-v1`)

**Created**: 2026-11-25

**Status**: Draft

**Input**: User description: "Mission for #11 (triage/030-release-v1.md, operator decisions in
triage/decisions/030-q1-q6-release-design.md): make @ocelle/tokens, @ocelle/styles and @ocelle/elements publishable
as 1.0.0 to the public npm registry with provenance, installable without a token: package metadata (no private flag,
version, licence, repository with directory, public access, LICENSE and NOTICE in every package), the peer pin on
@ocelle/tokens, changelog entries per package (constitution VII), a pack-contents gate with a plant, a tag-triggered
publish workflow whose publish job runs in a protected GitHub environment with a required reviewer and
least-privilege permissions, a post-publish install check from the registry with no token, and the constitution and
doc updates the operator chose; publishing waits until #7 (mission 018) and op 023 (#60) have landed and every gap
row of #1 is met; every operator-only step stays an operator step. Operator decisions: Q1 (a) amend the constitution
in this mission; Q2 (a) npm trusted publishing via GitHub Actions OIDC (first-publish bootstrap settled in the plan,
any bootstrap token operator-held and revoked); Q3 (a) lockstep 1.0.0, peer ^1.0.0; Q4 (a) no wait for
#73/#75/#76/#59; Q5 (a) operator pushes a protected v1.0.0 tag; Q6 (a) no new release tool. Also cover #11's 'the
history contains no secrets' check, and the release readiness check against #1's gap table as #1 states it (#498 is
filed under #13 there)."

**Issues**: #11 (triage record `triage/030-release-v1.md`, approved by the operator on 2026-11-25). #11's body and
#1's gap table and "Done when" were read on 2026-11-25 and are kept verbatim in `sources/issue-11.md` and
`sources/issue-1-gap-table.md`; this spec cites those files, not memory. #1 itself stays open until #11 and #7 close
and its third "Done when" item (kitty-mission-ui, tracked in that repository) is met; this mission does not close it.

**Consumers** (constitution VI): kitty-mission-ui (Kitty Desktop and Kitty Dashboard) and the Ocelle web console
install the three packages from the public npm registry instead of a workspace link. They pin by version
(constitution VII) and need to know that what they install was built from this repository (provenance).

**Operator decisions while specifying** (2026-11-25, human:jeroennouwsdev, `triage/decisions/030-q1-q6-release-design.md`):

- Q1 (a): the constitution's "internal until then and goes public with 1.0.0" and "publish token lives only in CI
  secrets" are amended in this mission (FR-040, FR-041). Q1 asked for a PATCH-level clarification; because the
  amendment also adds the peer-range exception to exact pins (Q3 (a)), the operator chose a MINOR bump instead (plan
  squad round 1, PLAN-CORRECTNESS-1-007 (b)).
- Q2 (a): npm trusted publishing (OIDC from the publish workflow, no long-lived token). The first-publish bootstrap
  is settled in the plan; any bootstrap credential is held by the operator and revoked after use (FR-024).
- Q3 (a): lockstep versions, all three at `1.0.0`; `@ocelle/tokens` is a peer at `^1.0.0` (FR-003).
- Q4 (a): 1.0.0 does not wait for #73, #75, #76 or #59.
- Q5 (a): the operator pushes a protected `v1.0.0` tag; the publish waits for the environment reviewer (FR-020).
- Q6 (a): no new release tool; changelogs stay hand-written (FR-005).
- SPEC-1-04 (answered 2026-11-25, human:jeroennouwsdev, option (b)): the release workflow's dry run is a
  dry-run-only path, started by a pull request or a manual dispatch, that runs every pre-publish step but has no
  publish job and no identity-token permission at all (FR-020, FR-027). The publish path itself still starts only
  from the operator's protected `v*` tag (Q5 (a)).
- Plan squad round 1 (2026-11-25, operator fork decisions in `reviews/plan/round-1/refute.md`): the readiness check
  is also a required pull-request gate (PLAN-CORRECTNESS-1-006 (a), FR-014, FR-044); the constitution amendment is
  MINOR, 1.3.1 to 1.4.0, and names the peer-range exception (PLAN-CORRECTNESS-1-007 (b), FR-040); the release date of
  each changelog entry is set by a pre-tag pull request the operator confirms, not by a gate rule
  (PLAN-FRESH-1-007 (b), FR-043); Story 4 scenario 4 is an observable peer check (PLAN-FRESH-1-006 (a)).
- Plan squad round 2 (2026-11-25, operator fork decisions in `reviews/plan/round-2/refute.md`): the publish dry run
  skips a version already on the registry and says so, by the registry answer the publish job uses
  (PLAN-FRESH-2-001 (a), FR-027); the dry-run path runs the release workflow's whole pre-approval job graph on every
  pull request (PLAN-FRESH-2-002 (a), FR-027); the history-reading tests run with full history in the unit-test jobs
  (PLAN-FRESH-2-004 (a), FR-044).
- Already done by the operator: the npm org `ocelle` is claimed (O1). Private vulnerability reporting is on per op
  023's decision Q3 (a) (O2, re-confirmed at release).

**Build order** (operator, 2026-11-25): design now, build after #7. Implementation starts only after mission 018
(#7's rest) lands on `main`; `main` is merged into this branch before the first red commit. Op 023 (#60, PR #80)
lands before this mission's implementation too, and this mission builds on its sandbox-paths gate and its
`SECURITY.md`; it does not change `SECURITY.md` or spec 001 FR-032.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Each package tarball is exactly what a consumer should get, and a gate proves it (Priority: P1)

A maintainer prepares the three packages for their first public release. Each package declares the metadata a
public package needs (version, licence, repository and the package's directory in it, public access), ships its
licence files, names `@ocelle/tokens` as a peer by a registry range instead of a workspace link, and carries a
dated `1.0.0` changelog entry. A pack-contents gate packs each package the way the registry would receive it and
fails, naming the package and the problem, when anything a consumer needs is missing or anything that must not ship
is present. The gate is proven by planted defects like every other gate.

**Why this priority**: an npm version can never be republished. Everything else in the release is only safe if the
tarballs are right before the first publish; this story is also fully useful on its own (every pull request after
it keeps the packages publishable).

**Independent Test**: on a pull request, the new pack-contents check passes on the real packages, and the plant job
shows it failing on each of its planted defects, accepting its pass plants and reporting its breaking plant as
"could not run".

**Acceptance Scenarios**:

1. **Given** the three packages on the release branch, **When** the pack-contents gate runs, **Then** it passes and
   reports, per package, the version, the file count and that every declared entry point is present.
2. **Given** a package whose packed tarball lacks a file one of its declared entry points (`exports`, `main`,
   `types`, `customElements` or the browser build) names, **When** the gate runs, **Then** it fails naming the
   package and the missing path.
3. **Given** a package whose tarball lacks `LICENSE` or `NOTICE`, or `@ocelle/tokens` without the font's `OFL.txt`
   beside the font, **When** the gate runs, **Then** it fails naming the package and the missing file.
4. **Given** a packed manifest that still contains a `workspace:` specifier, a `private: true` flag, or a version
   other than the release version, **When** the gate runs, **Then** it fails naming the field.
5. **Given** a tarball that contains a file outside the package's declared contents (for example a test, a story, a
   source map of test code, a `.npmrc`, or an environment file), or a file that contains a sandbox path (op 023's
   rule), **When** the gate runs, **Then** it fails naming the file.
6. **Given** a pull request, **When** CI runs, **Then** the pack-contents gate runs as its own named check and the
   plant job runs its plants (spec 001 FR-020, FR-025).

---

### User Story 2 - The operator can see, before tagging, that the release is ready (Priority: P1)

Before pushing the release tag, the operator runs (or reads the CI result of) a release-readiness check on the
release commit. It reports, row by row, whether #1's gap table is met on that commit, whether the blocking work has
landed, whether the repository history contains a secret, and whether the packages agree on one version. It ends in
a single ready / not-ready verdict and never publishes anything.

**Why this priority**: #11 says v1.0.0 ships only when every row of #1's gap table is met and the history contains
no secrets. The operator needs that as evidence, not as memory, at the one moment that cannot be undone.

**Independent Test**: run the readiness check on the current `main` (before mission 018 lands): it reports
not-ready and names exactly three unmet gap-table rows, identified by their first upstream number and whatever their
owner: the `#498` row (owned by #13; the status-indicator part of #498 is still missing), the `#509` row (#7, #9,
#5) and the `#524 #526` row (#7); every other row is reported met. Run it on a fixture where every row is met and
the history is clean: it reports ready.

**Acceptance Scenarios**:

1. **Given** a commit where every gap-table row of `sources/issue-1-gap-table.md` maps to evidence in the
   repository, **When** the readiness check runs, **Then** it lists each row with its evidence and reports ready.
2. **Given** a commit where any row's evidence is missing (for example today's `main`, before mission 018 lands:
   the `#498` row, the `#509` row and the `#524 #526` row), **When** the readiness check runs, **Then** it reports not-ready and names each
   unmet row and the evidence it expected.
3. **Given** a repository history in which any commit reachable from the release commit adds a file containing a
   credential pattern (an npm token, a GitHub token, a private key block, or a further pattern the plan names in
   research.md R-08), **When** the readiness check runs, **Then** it reports not-ready and names the commit and path,
   without printing the matched secret.
4. **Given** packages whose versions differ from each other or from the tag being prepared, **When** the readiness
   check runs, **Then** it reports not-ready and names the mismatch.
5. **Given** a pull request, **When** CI runs, **Then** the readiness check runs as its own named required check and
   the plant job runs its plants (spec 001 FR-020, FR-025; FR-014, FR-044).

---

### User Story 3 - A release happens only through a reviewed, provenance-attested publish (Priority: P2)

The operator pushes the protected `v1.0.0` tag on the release commit. A release workflow starts from that tag,
confirms the commit passed every merge gate (including the prefix and no-monospace checks), builds and packs the
three packages, runs the pack-contents gate and the readiness check on what it is about to publish, and then waits.
Only after the operator approves the protected environment does the publish job run: it publishes
`@ocelle/tokens`, then `@ocelle/styles`, then `@ocelle/elements`, with provenance, using the workflow's own
short-lived identity and no stored long-lived token. Nobody else can create, move or delete a release tag, and
nobody can skip the approval.

**Why this priority**: it is the release itself, but it depends on Story 1's tarballs and Story 2's readiness, and
it runs once per release.

**Independent Test**: the dry-run path (FR-027, operator answer to SPEC-1-04), started by a pull request (the
start the plan chose, research.md R-10), runs every pre-publish step on its commit and ends without publishing, because it has no publish
job and no job in it can request an identity token; the release path's publish job permissions, environment and
pinned actions are as FR-021 says; a static check of the workflow files fails on each planted misconfiguration,
including a dry-run path that gains a publish step, an environment binding or an identity-token permission.

**Acceptance Scenarios**:

1. **Given** a `v<version>` tag whose version does not equal the three packages' version, **When** the workflow
   runs, **Then** it fails before the environment approval, naming the mismatch.
2. **Given** a tag on a commit whose merge-gate checks did not all pass (or whose readiness check reports
   not-ready), **When** the workflow runs, **Then** it fails before the environment approval and publishes nothing.
3. **Given** a valid tag, **When** the pre-publish steps pass, **Then** the publish job waits for a required reviewer
   of the protected environment and does not run without that approval.
4. **Given** approval, **When** the publish job runs, **Then** it publishes the three packages in dependency order,
   each with a provenance attestation that names this repository, the workflow and the tagged commit.
5. **Given** a re-run after a partial publish (for example tokens published, styles failed), **When** the publish
   job runs again, **Then** it skips each package version already on the registry (reporting it) and publishes the
   rest; it never fails because a version already exists and never tries to overwrite one. A registry error other
   than "not found" is retried for the bounded time the plan states and is never read as "not published".
6. **Given** the workflow file, **When** its static check runs on every pull request, **Then** it fails if any job
   other than the publish job may request an identity token, if the default token permissions exceed read-only
   contents, if the publish job is not bound to the protected environment, if any action is referenced by anything
   other than a full commit SHA, if a checkout keeps credentials, or if the workflow reads a long-lived npm token.
7. **Given** a pull request (the dry run's start, FR-027), **When** the dry-run path runs, **Then** it runs
   every pre-publish step of FR-022 and reports the result, contains no publish job, binds no job to the protected
   environment, grants no job an identity-token permission and writes nothing to any registry.

---

### User Story 4 - A consumer installs the released packages with no token and can verify where they came from (Priority: P2)

A developer on a clean machine with no npm credentials adds `@ocelle/elements`, `@ocelle/styles` and their peer
`@ocelle/tokens` to a project, imports an element, links the token and base stylesheets, and verifies the packages' signatures and
provenance. The release workflow does this automatically after publishing, as the last proof that the release
worked.

**Why this priority**: this is #1's "installable without a token" and #11's clean-machine check; it can only be
proven after a publish, so it follows Story 3.

**Independent Test**: the post-publish check runs against a registry where the three packages are present at the
release version: in an empty project with an empty credentials file it installs them, imports every declared entry
point, resolves the stylesheets and the browser build, and verifies signatures and provenance; it fails when any of
these fails. Before the real release it is exercised against packed tarballs and a local registry (the plan names
how), and its signature and provenance verification is exercised on real registry inputs with a pass case and
planted failures (FR-034), so every part of it is proven before it matters.

**Acceptance Scenarios**:

1. **Given** the three packages published at the release version, **When** the post-publish check runs in an empty
   project with no registry credentials, **Then** installing `@ocelle/tokens`, `@ocelle/styles` and
   `@ocelle/elements` succeeds, importing or resolving every entry point each package declares succeeds, and the
   browser build defines its elements under the constitution's strict CSP with no request off the page's origin.
2. **Given** the installed packages, **When** the check verifies them, **Then** every package's registry signature
   and provenance attestation verify, and the attestation names this repository, the release workflow, the release
   tag's ref and the release commit.
3. **Given** a package version not yet visible on the registry (propagation delay), **When** the check runs,
   **Then** it retries for a bounded time the plan states and then fails, naming the package.
4. **Given** `@ocelle/elements` installed alone (its peer not named) in an empty project, **When** the post-publish
   check inspects the result, **Then** the installed `@ocelle/elements` manifest declares the peer
   `@ocelle/tokens` at `^1.0.0` and `@ocelle/tokens` resolves at a `1.x` version, as the README's install section
   says (npm and pnpm install missing peers instead of reporting them, so the check asserts what is installed).

---

### User Story 5 - The rules and the docs say how releases work now (Priority: P3)

A contributor or operator reads the constitution, the package READMEs and the release procedure and finds them
true: the repository has been public since before 1.0.0, packages publish to the public registry with provenance,
the publish credential is the workflow's own identity with no stored token, and every step only the operator can
take is listed as an operator step.

**Why this priority**: docs and the constitution must not contradict the release (the plan's Constitution Check
gates on them), but they carry no runtime behaviour.

**Independent Test**: read the amended constitution, the READMEs and the release procedure; check each statement
of FR-040 to FR-045 against them.

**Acceptance Scenarios**:

1. **Given** the amended constitution, **When** a reader looks for when the repository went public and how
   publishing is credentialled, **Then** it states the repository is public (since before 1.0.0), packages publish
   from 1.0.0 with provenance, and no long-lived publish credential is stored in the repository or CI secrets except
   a one-time bootstrap credential the operator holds and revokes (if the plan's bootstrap needs one).
2. **Given** each package README, **When** a consumer reads its install section, **Then** it gives the registry
   install command, the `@ocelle/tokens` peer range, the stylesheet link order and how to verify provenance.
3. **Given** the release procedure, **When** the operator follows it, **Then** every operator-only step (O1 to O8)
   appears in order, marked as operator-only, and no step asks an agent to do one.

---

### Edge Cases

- **A blocker lands after the changelog cut.** If mission 018, op 023, or any other change to the public surface
  merges after the `1.0.0` changelog entries were written, the readiness check (Story 2) still passes only if the
  entries name every surface the manifest and token list contain; the plan defines how it compares them (research.md
  R-09: every element tag, and every token by name or by a name-prefix mention).
- **Partial publish.** Covered by Story 3, scenario 5: re-runs skip versions already on the registry; the release
  procedure names the re-run the operator uses (FR-043).
- **Wrong tarball published.** npm versions cannot be republished; the fix is a `1.0.1`. The pack-contents gate and
  the dry run exist to make this unlikely; the release procedure says so.
- **Trusted publisher not yet configurable for a package that does not exist on the registry.** The plan settles the
  bootstrap (Q2); the release procedure gives the operator the exact sequence, and any bootstrap credential is
  revoked in O8.
- **Tag pushed on the wrong commit.** The workflow checks that the tagged commit is on `main` and passed every merge
  gate; otherwise it fails before approval.
- **Someone other than the operator pushes a `v*` tag.** The tag ruleset (O5) blocks it; the environment approval
  (O4) is a second barrier. This includes an agent: the GitHub identity agents use is not the operator's account, is
  not on the tag ruleset's bypass list and is not a reviewer of the environment (O4, O5, FR-043).
- **A fork's pull request.** The publish path does not run on pull requests at all. The dry-run path (FR-027) and
  the workflow's static check run on pull requests, including from forks, without any secret, identity token or
  publish job, so a fork cannot reach a publish.
- **Registry outage or slow propagation.** The publish job and the post-publish check retry for a bounded time and
  then fail with the package named; nothing is overwritten on re-run.
- **A secret found in history.** The readiness check reports not-ready and names the commit and path but never the
  secret; rewriting history is not part of this mission (the operator decides what to do, for example revoke the
  credential).
- **A package with no runtime entry (tokens' CSS-only and font exports).** The pack-contents gate and the install
  check resolve every declared export, including CSS, JSON and font paths, not only JavaScript.

## Requirements *(mandatory)*

### Functional Requirements

**Package metadata and contents (Story 1)**

- **FR-001**: Each of `@ocelle/tokens`, `@ocelle/styles` and `@ocelle/elements` MUST, in its own manifest, have no
  `private` flag, version `1.0.0` at release, licence `Apache-2.0`, a `repository` that names this repository and the
  package's directory in it, and publish settings for public access to the public npm registry.
- **FR-002**: Each package's published contents MUST include `LICENSE` and `NOTICE`; `@ocelle/tokens` MUST include
  the font's `OFL.txt` beside the font files, and the package that ships the font MUST list it in its shipped
  `THIRD_PARTY_NOTICES` (or the package's `NOTICE` MUST point to it); the plan states which file each package
  ships. Licence files in the packages MUST be identical to the repository's.
- **FR-003**: `@ocelle/styles` and `@ocelle/elements` MUST declare `@ocelle/tokens` as a peer dependency at `^1.0.0`
  in their published manifests (operator decision Q3 (a)). No published manifest may contain a `workspace:`
  specifier. The three versions move in lockstep.
- **FR-004**: The pack-contents gate MUST, for each package, produce the tarball the publish would upload and fail
  (naming package and item) on: a declared entry point (every `exports` target, `main`, `module`, `types`,
  `customElements`) with no file in the tarball; a missing `LICENSE`, `NOTICE` or (tokens) `OFL.txt`; a `private`
  flag; a `workspace:` specifier; a version that differs from the other packages or from the version the gate is
  given; a file outside the package's declared contents list; any file matching a deny list the plan gives (at
  least test files, stories, `.npmrc`, environment files, private keys, source maps of test code); a sandbox path
  (op 023's rule). It MUST report "could not run" (not a finding) when a package cannot be packed.
- **FR-005**: Each package's changelog MUST turn its "Unreleased" section into a dated `1.0.0` entry that names the
  surface changes since the start (constitution VII), including every mission merged before the cut; the entries
  stay hand-written (Q6 (a)).
- **FR-006**: The pack-contents gate MUST join spec 001's FR-020 gate list as its own named pull-request check, with
  failing, pass and breaking plants run by the plant job (spec 001 FR-025), and be listed in
  `specs/001-*/contracts/ci-checks.md`, in the same way op 023 added its gate. The new check MUST be added to the
  `main` ruleset's required checks by the operator (O6).

**Release readiness (Story 2)**

- **FR-010**: A readiness check MUST map every row of `sources/issue-1-gap-table.md` (as #1 states it, including
  #498 under #13 and #509 under #7, #9 and #5) to repository evidence on the commit it checks (the plan defines the
  evidence per row: an element in the custom-elements manifest, a token in the token list, a story, a merged spec
  directory), and report each row as met or unmet with that evidence.
- **FR-011**: The readiness check MUST scan every commit reachable from the checked commit for committed secrets
  (at least npm tokens, GitHub tokens, private key blocks, and the further patterns the plan names) and report each
  hit by commit and path without printing the matched value. A hit makes the verdict not-ready. A pattern exception
  MUST be listed in a committed allow list with a reason per entry, keyed so that it stays valid when a commit is
  rebased or squash-merged (the plan says how; not by commit).
- **FR-012**: The readiness check MUST verify that the three packages share one version and, when given a tag, that
  the tag is `v` followed by that version.
- **FR-013**: The readiness check MUST verify that each package's `1.0.0` changelog entry exists and is dated, and
  that the plan's chosen comparison between the manifest and token list and the changelog finds no public element or
  token missing from the changelogs.
- **FR-014**: The readiness check MUST end in one verdict (ready / not-ready), exit non-zero when not-ready, perform
  no network write and never publish. It MUST be runnable locally by the operator, as a required pull-request gate
  (its own named check, with plants run by the plant job; operator decision PLAN-CORRECTNESS-1-006 (a)) and in the
  release workflow.
- **FR-015**: The readiness check MUST itself be proven: tests cover each verdict path, and its secret scan and gap
  mapping are each shown failing on a planted input (constitution VIII, "Gates are proven, too").

**Release workflow (Story 3)**

- **FR-020**: The release workflow's publish path (the path that contains the publish job) MUST start only from a
  pushed tag matching the release tag pattern (`v*`, Q5 (a)); it MUST NOT run on pull requests, branch pushes,
  schedules or manual dispatch. It MUST check out exactly the tagged commit and fail unless that commit is on `main`.
  The only other way to run the release steps is the dry-run path of FR-027.
- **FR-021**: The workflow MUST use least privilege: default token permissions read-only for contents and nothing
  else; only the publish job may request an identity token (`id-token: write`) and it may hold no other write
  permission the plan does not justify; every third-party action MUST be pinned by full commit SHA; checkouts MUST
  NOT persist credentials; no step may print a credential.
- **FR-022**: Before the publish job, the workflow MUST: confirm every required merge-gate check (spec 001 FR-020
  plus this mission's gate) passed on the tagged commit, or run them; build and pack the three packages; run the
  pack-contents gate and the readiness check on exactly those tarballs; and run a publish dry run. Any failure stops
  the workflow before the environment approval.
- **FR-023**: The publish job MUST run in a protected GitHub environment that requires a reviewer's approval
  (O4) and MUST publish the tarballs the earlier job verified (not a rebuild), in the order `@ocelle/tokens`,
  `@ocelle/styles`, `@ocelle/elements`, each with a provenance attestation.
- **FR-024**: The publish job MUST authenticate through npm trusted publishing (the workflow's OIDC identity) and
  MUST NOT read a long-lived npm token (Q2 (a)). If npm requires a package to exist before its trusted publisher can
  be configured, the plan MUST define the bootstrap: who performs it (the operator), with what credential, how that
  credential is scoped, kept out of the repository and revoked (O3, O8), and how the bootstrap still yields the
  `1.0.0` tarballs this mission verified with provenance or states, for the operator's decision, what it cannot.
- **FR-025**: The publish job MUST be safe to re-run: for each package it checks whether the version is already on
  the registry and skips it (reporting so), and it MUST NOT unpublish, deprecate or overwrite anything. Only a "not
  found" answer means "not published"; any other registry error is retried for a bounded time (the plan states it)
  and then fails naming the package.
- **FR-026**: A static check of the release workflow file MUST run on every pull request as a named check (with
  plants), failing on each violation of FR-020, FR-021 and FR-023 that a file can show (trigger, permissions,
  environment binding, unpinned action, persisted credentials, a token secret read) and of FR-027 (a publish job or
  publish step, an environment binding or an identity-token permission in the dry-run path; a trigger other than a
  `v*` tag push that can reach the publish job).
- **FR-027**: A dry-run path MUST exist (operator answer to SPEC-1-04, option (b)), started by a pull request or a
  manual dispatch (the plan chooses one or both; it chose the pull request, research.md R-10). It MUST run every
  pre-publish step of FR-022 on its commit (build, pack, the pack-contents gate, the readiness check on those
  tarballs, the publish command's no-write mode) and report the result. For a package version already on the
  registry, the no-write mode is reported as skipped instead of run, decided by the same "not found" answer the
  publish job uses (FR-025), so the dry run of FR-022 does not fail a re-run after a partial publish or a pull request
  after a release (PLAN-FRESH-2-001 (a)). It MUST run the same pre-approval jobs as the publish path (the gates
  through the same reusable call, the base computation and the tarball hand-off), not only the shared steps
  (PLAN-FRESH-2-002 (a)). It MUST contain no publish job, bind no job to the protected environment and grant no job an
  identity-token permission, so that nothing started by it can publish. The plan states how the pre-publish steps
  are shared between the dry-run path and the publish path so both run the same steps. On today's `main` the
  readiness step of a dry run reports not-ready by design (Story 2); the dry run still shows every other step.

**Post-publish install check (Story 4)**

- **FR-030**: After the publish job, the workflow MUST run an install check in an empty project with no registry
  credentials (no token in any user, project or environment configuration) that installs the three packages at the
  released version from the public registry, imports or resolves every entry point each package declares, loads the
  browser build under the constitution's strict CSP with every off-origin request blocked and recorded, and fails
  naming the package and entry point (or the violation or request) on any failure.
- **FR-031**: The install check MUST verify each installed package's registry signature and provenance attestation
  and that the attestation names this repository, the release workflow (`.github/workflows/release.yml`), the
  release tag's ref (`refs/tags/v<version>`) and the tagged commit.
- **FR-032**: The install check MUST retry a not-yet-visible version for a bounded time (the plan states it) before
  failing.
- **FR-033**: Before the first real release, the install check MUST be exercised against the packed tarballs served
  from a local registry or equivalent (the plan names how), including a planted failure, so it is proven before it
  is relied on; this rehearsal performs no write to the public registry. Locally served tarballs carry no registry
  signature or provenance attestation, so this rehearsal does not prove FR-031; FR-034 does.
- **FR-034**: Before the first real release, the signature and provenance verification of FR-031 MUST be proven on
  real registry inputs (constitution VIII, "Gates are proven, too"): it MUST pass on a pass case (a package version
  already on the public registry with a valid signature and a valid provenance attestation) and fail, naming the
  package and the reason, on each planted failure: a package version with no provenance attestation, an attestation
  that names another repository, and an attestation that names a commit other than the expected one. The plan picks
  the inputs; proving it performs no write to the public registry.

**Governance and docs (Story 5)**

- **FR-040**: The constitution's "Technology, Licence and Supply Chain" section MUST be amended (Q1 (a); MINOR by
  operator decision PLAN-CORRECTNESS-1-007 (b)) so it states: the packages publish to the public npm registry from
  1.0.0 with provenance; the repository has been public since before 1.0.0 (2026-11); no long-lived publish
  credential is stored in the repository or CI secrets, publishing uses the release workflow's OIDC identity, and a
  one-time bootstrap credential, if the plan needs one, is held by the operator only and revoked after use; a peer
  range on a workspace package (`@ocelle/tokens` at `^<version>`, Q3 (a)) is the one exception to exact pins. The
  amendment goes through `/speckit-constitution`, bumps the version as a MINOR (1.3.1 to 1.4.0, materially expanded
  guidance: a new exception to a supply-chain rule) and updates "Last Amended".
- **FR-041**: The constitution's line that `SECURITY.md` exists "before the repository goes public" MUST be kept
  true as a past fact or reworded, without changing op 023's `SECURITY.md` or spec 001 FR-032.
- **FR-042**: Each package README MUST have an install section: the registry install command, the `@ocelle/tokens`
  peer range, the stylesheet and font serving order already documented, and how to verify signatures and
  provenance. The `workspace:0.0.0` statements in the styles and elements READMEs MUST be replaced.
- **FR-043**: A release procedure (in `CONTRIBUTING.md` or a new `RELEASING.md`; the plan chooses) MUST list, in
  order, the readiness check, every operator-only step O1 to O8 (below) marked as operator-only, the dry run, the
  pre-tag pull request that sets each `1.0.0` changelog entry's date to the release day and empties "Unreleased"
  (the operator confirms the date before merging it; operator decision PLAN-FRESH-1-007 (b)), the tag push, the
  environment approval, the post-publish check and what to do on each failure: which re-run to use after a partial
  publish; a failure before any package is published (the operator deletes and re-pushes the tag through the
  ruleset bypass, recorded in the release issue); a failure after a partial publish that a re-run cannot fix (the tag
  is never moved; lockstep `x.y.z+1` through a version-bump pull request whose contents the procedure lists); and "a
  wrong tarball means 1.0.1", by the same version-bump pull request (research.md R-15). It MUST state that the GitHub identity agents use is not the operator's account, is not on the `v*` tag
  ruleset's bypass list and is not a reviewer of the protected environment, and O4 and O5 MUST record how the
  operator confirmed it.
- **FR-044**: Spec 001's FR-020 and `contracts/ci-checks.md` MUST gain the new gates (pack contents, release
  readiness, release workflow static check) by amendment, in op 023's style, and spec 001's `contracts/plants.md`
  MUST gain the plant-form changes the plan needs for them; FR-032 is not touched. `contracts/ci-checks.md` MUST also
  state every other change this mission makes to `ci.yml`: the `workflow_call` trigger and its inputs, the Sign-off
  job's condition, the mutation commands' base expression and the unit-test checkouts' full history; each of these
  lands in the same phase as the `ci.yml` change it describes (PLAN-FRESH-2-004, PLAN-FRESH-2-005).
- **FR-045**: No new file in this mission may contain a sandbox path (op 023's rule) or a credential. Tests and
  plants that need a credential-shaped input assemble it at run time, so no committed file matches a secret-scan
  rule (research.md R-08).

**Operator-only steps** (never performed by an agent or by the workflow on the operator's behalf; the release
procedure lists them, FR-043):

| # | Step | State |
|---|---|---|
| O1 | Claim the npm org `ocelle` | done (operator, before triage) |
| O2 | Private vulnerability reporting on | done per op 023 decision Q3 (a); re-confirm in settings before the tag |
| O3 | Configure the trusted publisher for each package on the registry (after the bootstrap the plan defines, if one is needed); hold and revoke any bootstrap credential | before the release |
| O4 | Create the protected environment the publish job uses: the operator's account as the only required reviewer, deployments limited to `v*` tags, administrator bypass off, "Prevent self-review" off (the operator is both the tag pusher and the only reviewer), no environment secrets; confirm the agents' GitHub identity is not a reviewer | before the release |
| O5 | Add a ruleset protecting release tags (`v*`): creation, update, deletion and force push restricted, bypass list naming only the operator's account; confirm the agents' GitHub identity is not the operator's and is not on the bypass list; add the agent-side deny rules for tag pushes, `gh release` and the npm account verbs to the agent permission settings (the plan lists them; the ruleset is the barrier, the deny rules a convenience) | before the release |
| O6 | Add the new required checks (FR-006, FR-014, FR-026) to the `main` ruleset | after this mission merges |
| O7 | Push the `v1.0.0` tag on the release commit and approve the environment deployment | at release |
| O8 | After the install check passes, revoke any bootstrap credential, confirm none remains, close #11 | after release |

**Out of scope**: #7's elements (mission 018); `SECURITY.md`, spec 001 FR-032 and the sandbox-paths gate (op 023,
#60); #73, #75, #76 and #59 (Q4 (a)); publishing Storybook or a docs site; GitHub Releases with notes, SBOMs;
consumer migrations; rewriting git history; automated version bumps or a release tool (Q6 (a)); closing #1.

### Key Entities

- **Package tarball**: the exact archive the registry receives for one package and version; what the pack-contents
  gate and the publish job both see.
- **Gap row**: one row of #1's gap table (upstream issue numbers, need, owning issue) with the repository evidence
  that meets it.
- **Readiness report**: per-row evidence, secret-scan result, version check, changelog check and one verdict for a
  commit (and optionally a tag).
- **Release tag**: `v<version>` on a commit of `main`, protected by ruleset; its push is the only trigger of the
  release workflow's publish path.
- **Dry-run path**: the run of every pre-publish step started by a pull request (FR-027 allows a manual dispatch
  too; the plan chose the pull request only), with no publish job and no identity-token permission (FR-027).
- **Protected environment**: the GitHub environment the publish job runs in; its required reviewer is the human
  approval.
- **Provenance attestation**: the registry's signed statement linking each published version to this repository,
  the workflow and the commit.
- **Operator step**: an action only the operator performs (O1 to O8), listed in the release procedure.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: From a clean machine with no registry credentials, adding `@ocelle/tokens`, `@ocelle/styles` and
  `@ocelle/elements` at `1.0.0` and importing or resolving every declared entry point succeeds on the first attempt (100% of entry points, 3 of 3
  packages).
- **SC-002**: 3 of 3 published packages carry a provenance attestation that verifies and names this repository, the
  release workflow, the `v1.0.0` tag's ref and the `v1.0.0` commit.
- **SC-003**: The pack-contents gate, the readiness check and the release-workflow static check each fail on 100% of
  their planted defects, accept 100% of their pass plants and report their breaking plants as "could not run", in
  the plant job on every pull request.
- **SC-004**: On the release commit, the readiness report shows 17 of 17 gap-table rows met with evidence, zero
  secret hits in history, and one shared version.
- **SC-005**: No publish happens without a recorded human approval of the protected environment; a re-run of the
  release after any partial failure completes without an error from an already-published version and overwrites
  nothing.
- **SC-006**: After release, zero long-lived publish credentials exist for the three packages (any bootstrap
  credential revoked, confirmed in O8), and zero credentials or sandbox paths are in the repository.
- **SC-007**: Every operator-only step appears in the release procedure, and none is performed by an agent or by the
  workflow on the operator's behalf.
- **SC-008**: Before the `v1.0.0` tag is pushed, the install check's signature and provenance verification passes on
  1 of 1 pass case and fails on 3 of 3 planted failures (no attestation, another repository, another commit) on real
  registry inputs (FR-034).
- **SC-009**: Every dry-run path run (FR-027) completes the pre-publish steps with zero registry writes, and the
  static check fails on 100% of its planted dry-run misconfigurations (publish step, environment binding,
  identity-token permission).

## Assumptions

- Mission 018 (#7) and op 023 (#60) land on `main` before this mission's implementation starts; until then the
  readiness check reports not-ready by design.
- The npm org `ocelle` exists and the operator controls it (O1 done). Package names `@ocelle/tokens`,
  `@ocelle/styles` and `@ocelle/elements` are available in that org.
- The repository is public and the release runs on GitHub-hosted runners, which npm provenance requires.
- npm's trusted-publishing rules (including whether a package must exist before a trusted publisher can be set) are
  checked by the plan against npm's documentation at planning time; the spec does not assume either answer.
- The workspace keeps its pinned Node and pnpm versions; the plan states whether publishing uses the pinned package
  manager or the npm CLI, and why.
- "Every check" in #11 means the merge gates of spec 001 FR-020 plus this mission's new gates; the slow suites
  (mutation, visual) are trusted from the tagged commit's CI results when the plan shows that result cannot be
  bypassed, and re-run otherwise.
- The constitution amendment is MINOR (operator decision PLAN-CORRECTNESS-1-007 (b)): no principle is added or
  removed, but the peer-range exception materially expands the supply-chain guidance.
