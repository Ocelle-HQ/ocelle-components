---
triage: 030
issues: [11]
decision: mission
target: "specs/030-release-v1"
in_scope: [11]
out_of_scope: [1, 2, 7, 59, 60, 73, 75, 76]
semver: major
spec_prompt: "Mission for #11 (triage/030-release-v1.md), spec directory specs/030-release-v1: make @ocelle/tokens, @ocelle/styles and @ocelle/elements publishable as 1.0.0 to the public npm registry with provenance, installable without a token: package metadata (no private flag, version, licence, repository with directory, public access, LICENSE and NOTICE in every package), the peer pin on @ocelle/tokens, changelog entries per package (constitution VII), a pack-contents gate with a plant, a tag-triggered publish workflow whose publish job runs in a protected GitHub environment with a required reviewer and least-privilege permissions, a post-publish install check from the registry with no token, and the constitution and doc updates the operator chooses at this record's questions; publishing waits until #7 (mission 018) and op 023 (#60) have landed and every gap row of #1 is met; every operator-only step stays an operator step."
status: proposed
---

# Triage 030: Release v1.0.0: publish the three packages to npm with provenance (#11)

## Issues read

**Where the issue text came from.** This session could not read GitHub. `gh issue view` fails on GraphQL with HTTP
403, and `gh api` and `curl` calls were refused by the session's permission rules. No copy of #11's body or of the
full #1 gap table is stored in the repository. This record rests on:

- what earlier triage records quote from #11 and #1 (triage 001, 005, 008, 010, 011, 012, 013, 014, 018 on
  `origin/claude/007-status-elements`, 019, 020, 023 on `origin/claude/060-public-repo-hygiene`), and
  `specs/009-workflow-layouts/sources/issues.md` (verbatim excerpts of #1);
- the operator's facts given for this triage (quoted under Scope and Risks);
- the repository on `main` at `183b20f` and the branches named below.

Anything posted to #11 or #1 that those sources do not quote is not reflected here. The operator should check the
Scope against #11's current body.

- **#11** "Release v1.0.0" (open, parent epic #1). As quoted in earlier records:
  - "Blocked by: #4 and every element issue (#7, #8, #9, #12, #13, #14, #15, #16, #17)." (triage 008)
  - v1.0.0 ships only when "every row of the gap table in #1" is met (triage 008, 011, 013). The day-one rule: every
    gap row is met in the first release (triage 005, 010).
  - The npm org claim follow-up of #2 belongs to #11 (triage 001).
  - Originally, #11 made the repository public at 1.0.0 (triage 001; spec 001 FR-032; constitution).
- **#1** (epic, open). Its "Done when", per the operator: every gap-table row met, and the packages installable
  without a token. Naming rules (`ocelle-*`, `--ocelle-*`, `ocelle-<element>-<action>` events) and "written from
  scratch, not ported" (`specs/009-workflow-layouts/sources/issues.md`).
- **Operator facts for this triage:**
  - The repository is already public. It went public before v1.0.0, which reverses #11's original order.
  - Op 023 (#60, PR #80) is landing now. It adds a "Sandbox paths" gate, makes `SECURITY.md` name GitHub private
    vulnerability reporting as the only channel, and amends spec 001 FR-032.
  - #7 is the last open element issue under #1 (mission 018 on `claude/007-status-elements`).
  - The operator has already claimed the npm org `ocelle`.
  - Operator-only steps stay with the operator, never with agents. Publishing is designed for npm provenance.
  - The publish credential is an operator choice (Q2). The publish job runs in a protected GitHub environment with a
    required reviewer, and release tags are protected (both are settings the operator sets).

### Gap table of #1 checked against `main` (`183b20f`)

The rows were put together from the records listed above. Each row maps spec-kitty-design issues to an Ocelle issue.
A row is "met" when the element or token that answers it is on `main`, by the merged mission named.

| spec-kitty-design rows | Need | Ocelle issue | Met on `main`? |
|---|---|---|---|
| #496, #504 | icon sizing and icon set, brand mark as SVG | #17 | met (mission 005, `476602e`); the button and action-row parts by mission 012 (`4911fd0`) |
| #531, #535, #519 | compact type scale, value style, identifier wrap policy, base styles | #5, #6 | met (missions 002 `ec0f533`, 003 `64c61d9`) |
| #505, #506, #507, #514, #530 | inspector width, flat lane, lane min width, scroller, list/detail layout | #15 | met (mission 009, `b594b7e`) |
| #503 (+ #450 drawer) | dialog chrome reset, drawer, tooltip | #16 | met (mission 008, `13af7a9`) |
| #492, #497, #516, #529 | personal rail tier, section header and sidebar, compact card, compact page header | #8 | met (mission 011, `bea3130`) |
| #513; #509 (compact notice part) | notice without empty heading block; compact notice | #9 | met (mission 010, `3352365`) |
| #511, #521, #522, #527, #534 | segmented choice, tabs, inline link, listbox, request-only copy field | #14 | met (mission 014, `1b8b0b2`) |
| #450, #499, #500, #502, #512, #518 | personal drawer, shell tiers, icon-only nav item, top bar, flush content cell, breadcrumbs | #12 | met (mission 015, `951a398`; #518's button padding by 012) |
| #280, #498 (progress part), #510, #517, #520, #523, #533 | facts, progress, panel tokens, evidence chain, code block, every class family an element, compact data table | #13 | met (missions 013 `23ba5c5`, 020 `fe9bf2d`, 019 `183b20f`) |
| #493, #495, #501, #504 (action-row part), #508, #518, #525, #528, #532 | button and action row | #7 (mission 012) | met (mission 012, `4911fd0`) |
| **#498 (marker part)** | status indicator that never pulses an empty box | **#7 (mission 018)** | **not met**: no `ocelle-status-indicator` on `main` |
| **#509 (metric part)** | `ocelle-metric` `layout="row"`, eyebrow label | **#7 (mission 018)** | **not met**: no `ocelle-metric` on `main` (the eyebrow tokens exist, from mission 011) |
| **#524** | interactive pill tag, ellipsis with full-text tooltip, focus ring | **#7 (mission 018)** | **not met**: no `ocelle-pill-tag` on `main` |
| **#526** | compact pill density, outlined badge variant | **#7 (mission 018)** | **not met**: no `ocelle-pill-tag` on `main` |

The second condition of #1's "Done when" is also **not met**: the packages are installable without a token. All three
`package.json` files on `main` say `"private": true` and `"version": "0.0.0"`, and nothing has been published.

## Related work found

| Ref | Kind | Relation | Reason |
|---|---|---|---|
| #11 | issue (open) | in scope | The release itself. |
| #1 | epic (open) | out of scope; **blocked by this mission and by #7** | Its "Done when" needs every gap row (four rows still open, all #7) and the packages installable without a token (this mission). #1 closes after both. |
| #7, mission 018 (`origin/claude/007-status-elements`, `specs/018-status-elements`, triage 018) | mission in implementation (phase 6, last commit `27ffc83`) | **blocks** the publish step | It answers the last four gap rows (#498 marker, #509 metric, #524, #526). Its changelog entry for `@ocelle/elements` must be in place before the 1.0.0 entry is cut. Spec, plan and the publishing machinery do not wait for it. |
| #60, op 023 (`origin/claude/060-public-repo-hygiene`, PR #80, triage 023) | op landing | **blocks** the publish step; already settles the "public" half of #11 | Op 023 makes `SECURITY.md` name GitHub private vulnerability reporting as the only channel. It amends spec 001 FR-020 (gate 18, `sandbox-paths`), FR-032 and the governance test. Operator decision `triage/decisions/023-q1-q3-security-scope.md` records that private vulnerability reporting **is switched on** (Q3 (a)). `triage/decisions/023-op-gate.md` left the constitution's "goes public with 1.0.0" sentence as a known gap (Q1 below). On `main`, `SECURITY.md` still says reporting "is switched on when the repository goes public with release 1.0.0 (#11)". This mission must not touch `SECURITY.md` or FR-032 again. Its new files must pass the `sandbox-paths` gate. |
| #2 (closed) | issue | out of scope (done) | Package names decided (`@ocelle/tokens`, `@ocelle/styles`, `@ocelle/elements`, public npm). Its follow-up, claiming the npm org, was handed to #11. The operator reports it **done**. |
| #4, mission 001 (`eaf1689`) | mission, merged | done; **amended by this mission** | `LICENSE`, `NOTICE`, `THIRD_PARTY_NOTICES`, `CONTRIBUTING.md`, `SECURITY.md`, the CI gates and the pins check (FR-027). A publish workflow and a pack-contents gate add to the FR-020 gate list and `contracts/ci-checks.md`, as op 023 did. |
| #5, #6, #17, #8, #9, #12, #13, #14, #15, #16 | element and token issues | done (dependencies met) | Their missions are merged (table above). Each wrote an "Unreleased" changelog entry, which this mission turns into the 1.0.0 entry. |
| #10, mission 006 (`3828d2f`) | mission, merged | applies | Storybook build, visual regression and axe gates must be green on the release commit. Whether a Storybook site is published with 1.0.0 is not in what earlier records quote from #11. It is out of scope unless #11's body asks for it (see "What would change"). |
| #72 / mission 027 (`7c081d1`), #74 / mission 026 (`ff85ae5`) | missions, merged | applies (content of 1.0.0) | Additions after the epic's scope (workflow node, form textarea). They ship in 1.0.0 because they are on `main`. Their changelog entries are part of the 1.0.0 entry. |
| #73, mission 029 (`origin/029-workflow-canvas`, triage 029) | mission in implementation | out of scope; **not a blocker** (Q4) | Workflow canvas for Workflow Studio. It is not a gap row of #1, so it is a 1.x MINOR unless the operator holds 1.0.0 for it. |
| #75, #76 | issues (open) | out of scope | Workflow Studio follow-ons (triage 027). They are not gap rows, so they belong to 1.x. |
| #59 | issue (open) | out of scope | A select fix (triage 026). It is not a gap row and can ship as a PATCH before or after 1.0.0. It goes in 1.0.0 only if it lands first. |
| `packages/*/package.json` | repository | **changed here** | All three are `private: true`, `0.0.0`. None has `license`, `repository` (with `directory`) or `publishConfig`. A scoped package publishes as restricted unless access is public. `@ocelle/tokens` and `@ocelle/styles` do not ship `LICENSE` or `NOTICE`: their `files` lists only `dist`, `CHANGELOG.md` and `README.md`. `@ocelle/elements` copies all three notice files at build. |
| `packages/styles/package.json`, `packages/elements/package.json` | repository | **changed here** | The peer dependency is `"@ocelle/tokens": "workspace:0.0.0"`, and `packages/styles/README.md:20` and `packages/elements/README.md:120` say the pin "becomes meaningful at the first release (#11)". The published range must be decided (Q3). |
| `packages/*/CHANGELOG.md` | repository | **changed here** | Each has an "Unreleased" section (elements 359 lines). Constitution VII requires "a changelog entry per package that names surface changes". |
| `.github/workflows/ci.yml`, `cache.yml` | repository | **extended here** | No release or publish workflow exists, and there is no `id-token: write` anywhere. The CI conventions (pinned actions, least privilege, `persist-credentials: false`) apply to the new workflow. |
| `.specify/memory/constitution.md` lines 107, 149-151, 157-160 | constitution | **conflict** (Q1) | "published to the public npm registry from 1.0.0, with provenance. The repository is internal until then and goes public with 1.0.0." This is no longer true. "The npm publish token lives only in CI secrets." That sentence assumes a token; option (a) of Q2 uses none. |
| `knowledge/speckit-flows/` | findings | none specific | No finding or guard covers releasing or publishing. The general guards (test-first, plants for gates, evidence committed) apply. |
| `triage/`, `specs/`, `ops/` | repository | none to fold into | No feature or op covers publishing. Op 023 explicitly left "publishing and the release itself" with #11. |

GitHub search for further related issues and pull requests was not possible from this session. The operator should
add any related issue this record misses.

## Decision

**mission.** Several rules each require it:

- **Public surface and semver.** This is the first public release. Constitution VII says "The first public release is
  1.0.0": the three packages go from an unpublished `0.0.0` to a published `1.0.0`, and from then on every surface
  change is governed by semver. The packages' published metadata (entry points, the peer range, `files`) becomes a
  contract three consumers pin.
- **It spans packages.** All three `package.json` files, all three changelogs, and the peer pin between them.
- **Security and supply-chain behaviour beyond a local fix.** This covers the publish credential, OIDC permissions,
  npm provenance, a protected environment and protected tags, and what ships in each tarball (licences, no sandbox
  paths, no `workspace:` specifiers).
- **Design decisions the issue does not settle** (Q1 to Q6): the constitution's "public with 1.0.0", trusted
  publishing or a token, lockstep versions and the peer range, the trigger, the release tooling, and whether 1.0.0
  waits for work after the epic.
- **More than one user story.** A consumer installs the packages with no token and verifies their provenance. The
  operator cuts a release through a reviewed, gated workflow. A maintainer sees a pack-contents gate fail on a
  planted defect.

Why not the others:

- **Not `op`.** It has open design questions and cross-package supply-chain behaviour, and it fixes the first
  published version. "When in doubt, mission" applies in any case.
- **Not `fold`.** No work in progress covers publishing. Op 023 covers only the "public repository" half (SECURITY.md,
  FR-032, sandbox paths) and excludes the release by its own scope. Mission 018 must not carry release machinery.
- **Not `none`.** Nothing is published. The repository going public early did not do the release.
- **Not `decision-needed`.** The open questions shape the spec but do not stop scoping. Q1 and Q2 must be answered by
  the spec's clarify step, and the spec can be written around them. If the operator wants the constitution amended
  on its own first, see "What would change this decision".

## Scope

**In scope (#11).** The mission makes the packages releasable and releases them. The publish step runs only once its
blockers have landed.

1. **Release readiness check.** A recorded check, run on the release commit, that every gap row of #1 is met (the
   table above, completed against #1's current body), and that #7 and #60 are closed or their missions merged.
2. **Package metadata, for all three packages.** Remove `private` and set `version` (Q3). Add `license: Apache-2.0`,
   `repository` (with the `directory` of the package, which npm provenance checks against the source repository),
   and `publishConfig` with public access (and provenance, depending on Q2). `LICENSE` and `NOTICE` go into
   `@ocelle/tokens` and `@ocelle/styles` as `@ocelle/elements` already does. The tokens package's `OFL.txt` beside
   the font stays as `THIRD_PARTY_NOTICES` says. The `@ocelle/tokens` peer range is set by Q3, and the two READMEs
   that describe the `workspace:0.0.0` pin are updated.
3. **Changelogs.** Each package's "Unreleased" section becomes its `1.0.0` entry, dated, naming the surface. This
   includes the additions from missions 018, 026, 027 and anything else merged before the cut.
4. **Pack-contents gate, test-first, with a plant** (constitution "Gates are proven, too"). It runs `pnpm pack` (or
   equivalent) for each package and fails when:
   - a declared export or `files` entry is missing from the tarball;
   - `LICENSE` or `NOTICE` is absent, or `OFL.txt` is absent beside the tokens font;
   - a `workspace:` specifier survives;
   - a file outside the package's `files` list ships;
   - a sandbox path (op 023's rule) appears.
   It joins the FR-020 gate list as op 023's gate did.
5. **Publish workflow.** It is triggered by a release tag (Q5) and checks out the tagged commit. It runs every gate,
   or requires them green on that commit. It publishes the three packages in dependency order
   (`@ocelle/tokens` → `@ocelle/styles` → `@ocelle/elements`) with provenance. The **publish job runs in a protected
   GitHub environment** (for example `npm-publish`) **with a required reviewer**, so no publish happens without a
   human approval. Permissions are least privilege: `contents: read` by default and `id-token: write` only on the
   publish job. Actions are pinned and `persist-credentials` is `false`. The credential follows Q2. The workflow must
   be safe to re-run: a version that is already published is reported, not overwritten.
6. **Post-publish install check.** In a clean project with no `.npmrc` token, the workflow installs the three
   packages at the released version from the public registry. It then imports each entry point and the browser build,
   and checks the provenance attestations (for example `npm audit signatures`). This proves the "installable without
   a token" half of #1's "Done when".
7. **Docs.** Add an install section to each package README with the registry install, the peer dependency and the
   link order. Add a short release procedure to `CONTRIBUTING.md` (or a `RELEASING.md`) that lists the operator
   steps below verbatim.
8. **Constitution and spec updates** as Q1 decides. Spec 001's FR-020 and `contracts/ci-checks.md` get amendments
   for the new gate and workflow, in op 023's style.

**Operator-only steps** (never done by an agent; the spec lists them as such and the workflow cannot do them):

| # | Step | State |
|---|---|---|
| O1 | Claim the npm org `ocelle` | **done** (operator, before this triage) |
| O2 | Turn on GitHub private vulnerability reporting | **done** per `triage/decisions/023-q1-q3-security-scope.md` (Q3 (a), 2026-11-20). The operator re-confirms in the settings before the release. |
| O3 | Set up the publish credential as Q2 decides: (a) configure the GitHub Actions trusted publisher for each package on npmjs.com, after any first-publish bootstrap; or (b) create a granular automation token limited to the three packages and store it as a **secret of the protected environment** (never committed, never in a file, never echoed) | to do |
| O4 | Create the protected GitHub environment for the publish job with a required reviewer (and, if wanted, limited to release tags) | to do |
| O5 | Add a tag protection ruleset for the release tag pattern (for example `v*`), so only the operator can create, move or delete release tags | to do |
| O6 | Add the new required checks (the pack-contents gate) to the `main` ruleset | to do, after merge |
| O7 | Push the release tag (for example `v1.0.0`) on the release commit, and approve the environment deployment | to do, at release |
| O8 | After the install check passes, revoke any bootstrap token (Q2 (a)) or schedule its rotation (Q2 (b)), and close #11 and then #1 | to do, after release |

**Out of scope:**

- #7's elements (mission 018).
- `SECURITY.md`, FR-032 and the sandbox-paths gate (op 023, #60).
- Workflow Studio work after the epic (#73 / mission 029, #75, #76) and the select fix #59, unless Q4 says otherwise.
- Publishing Storybook.
- Consumer migrations in kitty-mission-ui and the Ocelle web console.
- Rewriting git history.
- Any 1.x release machinery beyond what 1.0.0 needs, such as automated version bumps (Q6).

## Risks and open questions

**Q1. The constitution still says the repository "is internal until then and goes public with 1.0.0" (lines
149-151).** The repository went public before 1.0.0, and op 023's gate left this sentence as a known gap. Line 157-158
("The npm publish token lives only in CI secrets") also assumes a token. What should happen?

- (a) Amend the constitution in this mission (a PATCH-level clarification of the constitution's own version). Lines
  149-151 become "published to the public npm registry from 1.0.0, with provenance; the repository has been public
  since 2026-11 (before 1.0.0)". Line 157-158 becomes "No publish credential is committed; a publish credential, if
  any, lives only in a protected environment's secrets." **Suggested default.**
- (b) Amend the constitution first, in a separate op that the operator approves before this mission's spec. This
  mission's spec then cites the amended text.
- (c) Leave the constitution as is until after 1.0.0 and record the gap in the run summary, as op 023 did. This is
  not recommended: the plan's Constitution Check would gate on a sentence that is known to be false.
- (d) Something else the operator states.

**Q2. Which publish credential (operator fork; no default).**

- (a) **npm trusted publishing via GitHub Actions OIDC.** There is no long-lived token, and provenance is automatic.
  A package may need to exist on npm before its trusted publisher can be configured, which needs a first-publish
  bootstrap. The plan must settle how the first `1.0.0` gets there. Options include a one-time token used only for
  that publish and revoked at O8, or a placeholder publish; the plan must check npm's current rules.
- (b) **A granular automation token** limited to the three packages, stored in the protected environment's secret
  (never committed), with `--provenance`.

**Q3. Versions and the peer range.** The spec needs a default, which the operator can override:

- (a) Lockstep: all three packages at `1.0.0`, and the peer `@ocelle/tokens` at `^1.0.0`. **Suggested default.**
- (b) Lockstep at `1.0.0`, and an exact peer pin `1.0.0`. The READMEs say "the exact tokens version" (spec 003). That
  is stricter, and it forces a styles and elements release for every tokens patch.
- (c) Independent versions from the start.

**Q4. Does 1.0.0 wait for work outside #1's gap table** (#73 / mission 029, #75, #76, #59)?

- (a) No. 1.0.0 is cut once #1's gap rows are met and #7 has landed, and later work ships as 1.x. **Suggested
  default.**
- (b) Yes, for the issues the operator names.

**Q5. Trigger.**

- (a) The operator pushes a protected `v1.0.0` tag, and the publish job waits for the environment reviewer.
  **Suggested default.**
- (b) Manual `workflow_dispatch` with the version as input, still gated by the environment.

**Q6. Release tooling.**

- (a) No new release tool. Changelogs stay hand-written, as now, and the version is set in the mission's commit.
  **Suggested default** (fewer pinned dependencies).
- (b) Adopt a release tool such as Changesets for 1.x. This adds a dependency and a workflow, and needs its own
  approval.

**Risks:**

- **Ordering.** The publish step must run after mission 018 and op 023 land. If either lands after the changelog
  cut, the 1.0.0 entries and the gate count must be redone. Spec and plan can run now, and the release phase is last.
- **Irreversibility.** An npm version cannot be republished after unpublish. A wrong tarball means shipping 1.0.1.
  The pack-contents gate and a dry run (`pnpm publish --dry-run` or pack-and-inspect) before the environment approval
  reduce this risk.
- **Provenance.** Provenance needs the publish to run on GitHub-hosted runners from a public repository, and the
  `repository` field must match the source repository. Both hold once item 2 is done. A mismatch fails the publish.
- **Gates on the release commit.** Mutation and visual gates are slow (ops 015, 025). The publish workflow should
  require the CI result of the tagged commit, not rerun everything, if the plan can prove that it cannot be bypassed.
- **Secrets hygiene.** No credential, `.npmrc` with a token, or sandbox path may be committed (constitution; op 023's
  gate). The workflow must not print the token.
- **The issue text was not read directly.** If #11's body asks for more (see below), the scope grows.

## What would change this decision

- **`decision-needed`**, if the operator wants Q1 settled as a constitution change before any spec work (Q1 (b)
  turned into a precondition), or if #11's current body contradicts the gap-row criterion.
- **Split into an op plus this mission**, if the operator wants the package metadata and pack-contents gate (items
  2 and 4) landed now as an op, separately from the release itself. That is possible only if Q3 is answered first,
  since the metadata fixes the version and peer range.
- **Larger scope**, if #11's body also asks for a published Storybook, a docs site, a GitHub Release with notes, or
  SBOMs. Each would be added to this mission or split out as its own op.
- **Blocked longer**, if the operator answers Q4 (b), until the named issues land.
