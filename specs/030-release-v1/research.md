# Research: Release v1.0.0 (030)

Each entry: decision, rationale, alternatives. Facts about npm were checked on 2026-11-25 by web search (the docs host
`docs.npmjs.com` is not reachable from the planning session; the sources are listed under R-01). Where a fact could
not be read from npm's own page, the entry says so and the implementation re-checks it (T-tasks name the check).

## R-01. First publish under trusted publishing (FR-024, Q2 (a))

**Facts.** npm has no "pending publisher": a trusted publisher can only be configured for a package that already
exists on the registry (npm CLI docs for `npm trust`; several community write-ups). A new trusted-publisher
configuration must be used for a successful publish within 2 days or it expires (npm's trusted-publishers page, as
quoted by search). Trusted publishing needs npm CLI 11.5.1 or later and Node 22.14.0 or later; the publish job needs
`id-token: write`; provenance is generated automatically for a trusted publish (GitHub changelog 2025-07-31).
`npm trust` (npm 11.10.0+) configures the publisher from the command line but still needs the package to exist.

Sources: https://docs.npmjs.com/trusted-publishers, https://docs.npmjs.com/cli/v11/commands/npm-trust,
https://github.blog/changelog/2025-07-31-npm-trusted-publishing-with-oidc-is-generally-available/,
https://dev.to/jurijtokarski/npm-publish-without-tokens-4692, https://github.com/azu/setup-npm-trusted-publish.

**Decision (plan decision D1, for the operator at the plan gate): placeholder bootstrap by the operator.** Before
the release, the operator (O3) publishes, from their own machine with an interactive `npm login` (2FA, no token
written to any file the repository sees), a placeholder version `0.0.0-bootstrap.0` of each of the three names,
under the dist-tag `bootstrap`, containing only a `package.json` and a README that says "placeholder, install
1.0.0". The operator then configures the trusted publisher of each package (repository `Ocelle-HQ/ocelle-components` (the case GitHub reports; the `repository` field uses the same, R-04),
workflow `release.yml`, environment `npm-publish`), sets each package to disallow token publishing, logs out, and
pushes the `v1.0.0` tag within 2 days. The first real version, `1.0.0`, is then published only by the workflow's
OIDC identity, with provenance, from the tarballs the workflow verified. After the install check passes (O8), the
operator deprecates `0.0.0-bootstrap.0` and removes its dist-tag. The release procedure gives the exact commands.

**Rationale.** The workflow never reads a token of any kind (FR-024 holds without an exception), the release-workflow
gate can forbid every token read without a bootstrap branch (FR-026), and every real version carries provenance.
The cost is one placeholder version per package that stays visible (deprecated) in the registry's version list.

**Alternatives.**
- (D1-b) A one-time granular token, scoped to the `@ocelle` packages with publish rights and the shortest lifetime
  npm allows, stored by the operator as a secret of the `npm-publish` environment; the first workflow run publishes
  `1.0.0` with `--provenance` through that token; the operator then configures trusted publishing, deletes the
  secret and revokes the token (O8). No placeholder version, but the workflow needs a token code path that the
  gate must allow on exactly one run, and a long-lived credential exists for the bootstrap window.
- (D1-c) The operator publishes `1.0.0` itself from a laptop. Rejected: no provenance, not the verified tarball.

## R-02. Pack with pnpm, publish the tarball with npm (FR-004, FR-023, FR-024)

**Decision.** Each package is packed with `pnpm pack` (which rewrites `workspace:` specifiers into registry ranges)
into one directory; the gate and the publish both use those exact files; the publish job runs
`npm publish <tarball> --access public --provenance` with the npm CLI of the pinned Node, after asserting
`npm --version` is at least 11.5.1 (the job fails otherwise, naming the version).

**Rationale.** pnpm owns the workspace rewrite; the npm CLI owns OIDC trusted publishing and provenance (search found
no confirmation that `pnpm publish` does both). Publishing a tarball means the published bytes are the verified bytes
(FR-023). `--provenance` is redundant with trusted publishing but makes the intent explicit and fails loudly if OIDC
is missing.

**Alternatives.** `pnpm publish` (unconfirmed OIDC support); `npm publish` from the package directory (would not
rewrite `workspace:`, and repacks).

## R-03. Peer range under the pins rule (FR-003, Q3 (a); spec check note SPEC-1-09)

**Facts.** The pins gate (`gates/lib/pins-rules.ts`) requires every dependency to be exact, a workspace package as
`workspace:<its version>`. `pnpm pack` turns `workspace:1.0.0` into `1.0.0` and `workspace:^1.0.0` into `^1.0.0`.

**Decision (D2).** Source manifests declare the peer as `workspace:^1.0.0`. The pins rule is amended to accept
`workspace:^<the workspace package's own version>` **in `peerDependencies` only** (a peer range is a statement to
consumers about compatibility, not an install pin of this repository; the lockfile still pins the linked workspace
package). The constitution amendment (FR-040) adds that sentence. The pack-contents gate requires the packed peer
to be exactly `^<release version>`.

**Alternatives.** Exact peer `1.0.0` (Q3 (b), rejected by the operator); plain `^1.0.0` in source (breaks the
workspace link and the pins rule for dependencies generally).

## R-04. Declared contents of each tarball (FR-004; SPEC-1-07, SPEC-1-08)

**Decision.** A committed allow list, `gates/release/pack-manifest.json`, gives per package the glob patterns a
tarball may contain (for example `dist/**/*.js`, `dist/**/*.d.ts`, `dist/tokens.css`, `dist/fonts/*.woff2`,
`dist/fonts/OFL.txt`, `LICENSE`, `NOTICE`, `README.md`, `CHANGELOG.md`, `package.json`, and for elements
`custom-elements.json`, `licenses/**`, `THIRD_PARTY_NOTICES`), the files that must be present, and the files that
must be byte-identical to their repository copy (`LICENSE`, `NOTICE`, and `THIRD_PARTY_NOTICES` where shipped,
compared with the root file of the same name; and, for tokens, `dist/fonts/OFL.txt`, compared with
`packages/tokens/fonts/OFL.txt` through an `identical` entry that names its repository path, so every licence file
FR-002 requires is compared, not only the root ones; analysis L3). Any
tarball entry that matches no pattern is a finding; the deny list (test files `*.test.*`, `*.stories.*`, `.npmrc`,
`.env*`, `*.pem`, `*.key`, `id_*`, source maps of test files) is checked first and reported as such. The packages'
`files` fields stay as the first filter; the allow list is the gate's independent statement.

**Licence files per package (FR-002).** `@ocelle/tokens`: `LICENSE`, `NOTICE`, `THIRD_PARTY_NOTICES` (it ships the
font), `dist/fonts/OFL.txt`. `@ocelle/styles`: `LICENSE`, `NOTICE`. `@ocelle/elements`: unchanged (`LICENSE`,
`NOTICE`, `THIRD_PARTY_NOTICES`, `licenses/` with Lit's licence). Each package's build copies the root files as the
elements build already does.

**Root NOTICE edit (US1, PLAN-FRESH-2-006).** The root `NOTICE` today says "The published @ocelle/elements package
holds a copy" and points to `THIRD_PARTY_NOTICES` without saying where it is. Since the `identical` rule ships it
byte for byte in all three packages, US1 edits it before the pack manifest freezes it: "Each published @ocelle package
holds a copy.", and "Third-party assets and their licences are listed in THIRD_PARTY_NOTICES, in this repository and
in the @ocelle/tokens and @ocelle/elements packages." Styles ships no `THIRD_PARTY_NOTICES` (it has no third-party
asset); the edited sentence says where the file is instead.

## R-05. Entry points (FR-004, FR-030; SPEC-1-06)

**Decision.** "Declared entry point" means every target of `exports` (with `*` patterns expanded against the tarball
and required to match at least one file), plus `main`, `module`, `types` and `customElements` when present. Story 1
scenario 2's list (which names the browser build) is covered because the browser build is an `exports` target
(`./browser.js`).

## R-06. Release-readiness check: a gate on every pull request (FR-010 to FR-015; SPEC-2-03, SPEC-2-04)

**Decision (D3, accepted by the operator: plan squad round 1, PLAN-CORRECTNESS-1-006 (a)).** `release-readiness` is
a required merge gate (check "Release readiness") with plants, run on every pull request and by the release
workflows; spec FR-014, FR-044 and O6 name it. It works on the **checkout** (`HEAD` of `--root`), never on tarballs
(SPEC-2-04: the spec's "readiness on the tarballs" is read as "on the commit the tarballs were packed from"; the
tarballs are the pack-contents gate's). It has no `--commit` option (PLAN-CORRECTNESS-1-011): every input is read
from the working tree of the checkout and the history scan starts at that checkout's `HEAD`, so the verdict always
belongs to one commit. It checks: the gap rows (R-07), the history secret scan (R-08), one shared version (and, with
`--tag`, the tag), and the changelogs (R-09). It exits 1 when not-ready. Because implementation starts after mission
018 lands, the gate is green from its first commit on this branch; on `main` today it would be red by design.

**Rationale.** A gate on every pull request keeps readiness true between releases (a secret committed in March is
caught in March) and gives the check its plant job proof for free.

**Alternative.** A release-only script (not a gate): weaker evidence, the secret scan would run once a year.

## R-07. Gap-row evidence (FR-010)

**Decision.** `gates/release/gap-rows.json` lists the 17 rows of `sources/issue-1-gap-table.md` in #1's words, each
with one or more evidence items of these kinds: `element` (a tag in `packages/elements/custom-elements.json`),
`member` (an attribute, property, slot, part, event or CSS property of a tag in the manifest), `token` (a name in
`packages/tokens/src/source.ts`), `style-hook` (a selector in `packages/styles/src/*.css`), `spec` (a feature
directory with `verification.md`, the record of a landed feature). Every row needs at least one `element`, `member`,
`token` or `style-hook` item (a `spec` item alone does not meet a row). The initial evidence per row is in
`data-model.md`; the member-level items for the rows mission 018 delivers are completed after `main` is merged.

**Proof against the pre-018 tree (Story 2's independent test, PLAN-TESTABILITY-1-006).** A gates-integration test,
written red before the gap-row evidence is completed, runs the gap check with the committed `gap-rows.json` against
the custom-elements manifest, token source and stylesheets of commit `183b20f` (the pre-018 `main`, read with
`git show 183b20f:<path>` into a temporary tree) and asserts that exactly rows 6 (`#498 ...`), 10 (`#509`) and 15
(`#524 #526`) are `gap-row-unmet`, each naming the mission 018 evidence it expected, and every other row is met. It
fails if a row of 018 is given evidence that already existed before 018, so the evidence cannot be vacuous.

**Where it runs with full history (operator decision PLAN-FRESH-2-004 (a)).** The test is in project
`gates-integration`, which CI runs in the unit-test shards. Their checkouts (`unit-tests-shard`, `unit-tests-full`)
gain `fetch-depth: 0` in US2, with spec 001 `contracts/ci-checks.md` amended in the same phase (FR-044). The test's
first assertion is that the clone is not shallow (`git rev-parse --is-shallow-repository` prints `false`) and that
`183b20f` resolves to a commit; either failing fails the test with a message naming the cause. It never skips
(constitution VIII). Cost: a full clone in every unit-test shard.

## R-08. History secret scan (FR-011, FR-045, #11 "the history contains no secrets")

**Decision.** The gate runs `git log -p -m --no-color --no-ext-diff HEAD` (every commit reachable from the checked
commit, all parents; binary diffs skipped) and scans added lines with these rules:

- `npm-token`: `npm_` + 36 alphanumerics;
- `github-token`: `gh[pousr]_` + 36 or more, `github_pat_` + 82;
- `private-key`: PEM private-key header lines (`-----BEGIN ... PRIVATE KEY-----`, any key type);
- `aws-key-id`: `AKIA` + 16;
- `slack-token`: `xox[abpr]-` + a token body;
- `anthropic-key`: `sk-ant-` followed by at least 32 characters of `[A-Za-z0-9_-]`;
- `openai-key`: `sk-proj-` followed by at least 32 characters of `[A-Za-z0-9_-]`;
- `google-api-key`: `AIza` + exactly 35 characters of `[0-9A-Za-z_-]`;
- `npmrc-auth`: in a file named `.npmrc` or `*.npmrc` only, an `_authToken=` or `_auth=` assignment followed by a
  literal (not `${...}`);
- `env-assignment`: in a file named `.env`, `.env.*` or `*.env` only, a line `NAME=value` whose name ends in `KEY`,
  `TOKEN`, `SECRET` or `PASSWORD` and whose value is a non-empty literal (not `${...}`).

The four agent-era rules (Anthropic, OpenAI, Google, env assignment) were added by operator decision
PLAN-A11Y-SECURITY-1-008 (a); the implementation re-checks the documented key shapes and records the source of each.
The scope stays "reachable from the release commit", as FR-011 states: other refs (abandoned branches, pull-request
heads) are not scanned; GitHub's own secret scanning (on for public repositories) covers them, and the release
procedure asks the operator to re-check its alerts (O2 step). The two path-bound rules match only files with those
names, so prose that describes the rules (this file, the contract, the README) is never a hit.

A hit is reported as `<commit>:<path>` and the rule name; the matched text is never printed, logged or written.
**No committed literal** (PLAN-TESTABILITY-1-002; FR-045): no file in the repository matches any rule. Unit tests
assemble each credential-shaped value at run time from fragments that match no rule on their own (for example a
prefix constant joined with a generated body), and readiness plants name the rule instead of holding the value (a
`secret:` line in a commit-repo record, which the plant builder expands into a generated value at plant time,
R-17). A gates-integration test runs the history scan on this repository's own `HEAD` and asserts zero hits with an
empty allow list for the gate's own fixtures; the test file itself holds no literal. It runs in the unit-test shards
with full history (R-07, PLAN-FRESH-2-004 (a)) and first asserts that the clone is not shallow and that `183b20f`
(an old commit) resolves, failing otherwise, so a shallow checkout cannot make it scan one commit and pass vacuously.

**Allow list.** Exceptions are listed in `gates/release/secret-allowlist.json` as `{ path, rule, valueSha256,
reason }`: the path the hit is in, the rule, the SHA-256 of the matched text (hex) and a reason. An entry is keyed by
content, not by commit, so it survives a rebase, an amend and a squash merge (`main` lands every pull request as one
squash commit). An entry with no reason, or one that matches no hit, is a finding (`allowlist-no-reason`,
`allowlist-stale`). The file starts empty.

No generic high-entropy rule: it would flag every baseline digest and lockfile integrity hash, and its exceptions
would drown the real rules.

**Alternatives.** gitleaks (a Go binary or a third-party action: one more pinned supply-chain dependency for a
handful of rules); trufflehog (same). An `--all-refs` mode over a mirror clone (PLAN-A11Y-SECURITY-1-008 (b)) was
not chosen by the operator.

## R-09. Changelog check (FR-013; SPEC-1-10, SPEC-2-05)

**Decision.** For the version in the manifests (not a literal `1.0.0`), each package's `CHANGELOG.md` must have a
`## <version> - <YYYY-MM-DD>` heading. Every element tag in the manifest must appear (as `` `ocelle-x` ``) in
`packages/elements/CHANGELOG.md` (any section, so post-1.0 additions under "Unreleased" pass between releases).

**Tokens (operator decision PLAN-CORRECTNESS-1-005 (a)).** Every token in `packages/tokens/src/source.ts` must be
covered by `packages/tokens/CHANGELOG.md` (any section), either by its full name (`` `--ocelle-<name>` ``) or by a
prefix mention `` `--ocelle-<prefix>-*` `` that covers every token whose name starts with `<prefix>-` (for example
`` `--ocelle-color-*` ``, `` `--ocelle-space-*` ``). A hand-written changelog meets this at group level; a token added
in a new family that the changelog never names is a finding `changelog-missing-token`, which lists the uncovered
names grouped by their first name segment. Base-style hooks have no machine list, so the styles entry must be
non-empty only.

**The package changelog tests (analysis K2).** The packages' own changelog tests (`packages/tokens/test/readme.test.ts`,
`packages/styles/test/readme.test.ts`, `packages/elements/test/node/changelog.test.ts` and the changelog cases of
`packages/elements/test/node/readme.test.ts`) read "Unreleased" today. Phase 2 replaces them red-first so they read the
`## 1.0.0 - <YYYY-MM-DD>` section, which stays in the changelog after later releases. The tokens test keeps its
stricter rule (every token named in full, now in the `1.0.0` section and "Unreleased", the sections at or after the
first release, not in any section; analysis F8), rather than the gate's prefix rule: the gate is the
floor for every future release, the package test is the 1.0.0 contract the changelog already meets, and VIII
replaces a test only with a stricter one.

With `--tag v<x>`, the `<x>` entry must exist and "Unreleased" must be empty (everything released is named under
the version). The entry's date is not compared with the tag (operator decision PLAN-FRESH-1-007 (b)): the release
procedure has a pre-tag pull request that sets each entry's date to the release day and empties "Unreleased", and
the operator confirms the date before merging it (R-15).

## R-10. The release workflows (FR-020 to FR-027)

**Decision (D4).** Two workflow files, one composite action, one `ci.yml` change and one release-step module:

- `gates/lib/release-steps.ts` with the process boundary `gates/bin/release-step.ts` (PLAN-TESTABILITY-1-005): the
  release logic that would otherwise be inline shell, unit-tested with an injected git and npm runner and in mutation
  scope. Subcommands: `base` (`<sha>^`, the tagged commit's parent, when a `v*` tag is reachable from `<sha>^`, else
  the SHA in `gates/release/first-release-base`; operator decision PLAN-FRESH-3-001 (a), below), `check-tag` (the tag equals `v<version>` of all three manifests, and the commit
  is an ancestor of `origin/main`; with `--no-tag`, used by the dry run, only the shared version and that `origin/main`
  resolves, saying that the tag and ancestor checks are skipped), `digest` (SHA-256 of each tarball, written as step
  outputs), `dry-run` (below) and `publish` (below). It imports only Node built-ins and other `gates/lib` modules with no package dependency (a unit test
  asserts the import graph), so the publish job runs it without `pnpm install`.
- `.github/actions/release-prepare/action.yml`, the steps both paths share. It has one input, `tag` (string, default
  empty; PLAN-FRESH-2-002): `release.yml` passes the pushed tag's name, `release-dry-run.yml` passes nothing. Steps:
  build; `release-readiness` (with `--tag <tag>` when the input is not empty, without `--tag` otherwise); `pnpm pack` of the three packages; **immediately after the pack**, before any other step,
  `release-step digest`, whose digests the action exposes as outputs `sha256-tokens`, `sha256-styles`,
  `sha256-elements` (PLAN-A11Y-SECURITY-1-004); the pack-contents gate on the tarballs; `release-step dry-run` (the
  publish dry run, below; the action never runs `npm publish` itself); the tarball install rehearsal (R-12) on a **copy** of the tarballs in a temporary directory; and
  `install-check --rehearse` (R-11; operator decision PLAN-CORRECTNESS-1-002 (a): the provenance proof runs in the
  release path, before the approval, so a failing proof blocks the publish).
- `.github/workflows/release.yml`: `on: push: tags: ['v*']` only. Jobs:
  1. `release-base`: checkout of the tag with full history, `persist-credentials: false`; `./.github/actions/setup`
     (pinned Node, PLAN-FRESH-2-002); `release-step base`; output `base` (PLAN-FRESH-1-001). For the first release,
     `gates/release/first-release-base` holds the parent of this mission's squash commit on `main`; the file is
     committed in US3 holding the `main` commit merged in Setup (so the dry run has a base from its first run), and
     the pre-tag pull request (R-15) rewrites it to the exact parent.
  2. `gates` (needs `release-base`): `uses: ./.github/workflows/ci.yml` with `base: ${{
     needs.release-base.outputs.base }}` and `release: true`, so every merge gate runs on the tagged commit (#11 "run
     every check"), the mutation gate over what `main` has not already proven (below).
  3. `prepare` (needs `gates`): checkout of the tag with full history, `persist-credentials: false`;
     `./.github/actions/setup`; `release-step check-tag`; the composite action with `tag: ${{ github.ref_name }}`; job outputs `sha256-tokens`, `sha256-styles`, `sha256-elements` from the
     action's outputs; uploads the tarballs (only) as the artifact `release-tarballs`.
  4. `publish` (needs `prepare`): `environment: npm-publish`; `permissions: { contents: read, id-token: write }`;
     sparse checkout of the tag (`.node-version` and `gates/` only, `persist-credentials: false`,
     PLAN-CORRECTNESS-1-010); pinned `actions/setup-node` with `node-version-file: .node-version` and the registry
     URL; asserts `npm --version` ≥ 11.5.1; downloads the artifact; runs `release-step publish` with the three
     expected digests from `needs.prepare.outputs.*` passed through `env:`. No build, pack or install step.
  5. `install-check` (needs `publish`): checkout of the tag (`persist-credentials: false`) and
     `./.github/actions/setup` (pinned Node, pnpm, dependencies, Playwright's browser), then the install check (R-11)
     against the public registry with the expected repository, workflow, ref and commit (PLAN-CORRECTNESS-1-010).
- `.github/workflows/release-dry-run.yml` (operator decision PLAN-FRESH-2-002 (a)): `on: pull_request` only;
  `permissions: contents: read`; no environment, no `id-token`; `concurrency: { group: release-dry-run-${{
  github.event.pull_request.number }}, cancel-in-progress: true }` (PLAN-FRESH-3-001 (a)). It runs **the same
  pre-approval job graph** as `release.yml`: `release-base` (same steps; its output is computed but not passed on),
  `gates` (`ci.yml` through `workflow_call` with `release: false` and **no** `base`, so the mutation gate covers the
  pull request's own range; PLAN-FRESH-3-001 (a)), and `prepare` (no job name, as in `release.yml`: setup,
  `release-step check-tag --no-tag`, the composite action without its `tag` input, so readiness runs without `--tag`,
  with the tarball rehearsal and `install-check --rehearse`, and the same artifact upload). A fourth job, `verdict`
  (check **Release dry run**; operator decision PLAN-FRESH-3-002 (b)), needs `release-base`, `gates` and `prepare`,
  runs with `if: always()` and fails unless all three concluded `success`. A job whose `needs` failed is skipped, and
  GitHub shows a skipped check as passing (the reason ci.yml's own `mutation` and `unit-tests` verdict jobs exist), so
  without the verdict a failing `gates` would leave a green-looking dry run that packed and rehearsed nothing.
  So the reusable-workflow call, the `base` computation, the job outputs, the setup of every job and the artifact
  hand-off run on every pull request, not first on the real tag; the rule `dry-run-graph` (R-13) keeps the two
  graphs equal. What only the tag can run is the tag comparison and ancestor test of `check-tag` (unit-tested), the
  `publish` job and `install-check` in registry mode. `workflow_dispatch` is dropped: a dispatch has no pull-request
  range, so ci.yml's Sign-off job (which keeps its pull-request range, below) could not run in it. The pre-tag pull
  request's own dry run is the rehearsal on the release tree. It is a named check but **not required** (D5): its pack,
  contents and readiness parts are already required gates, its rehearsal reaches the public registry for reading,
  which a required check should not depend on, and the release path runs the same rehearsal before the approval.
  The pre-publish steps show only when `gates` passes: on today's `main` readiness is not ready by design, so
  `gates` fails, `prepare` is skipped and **Release dry run** is red, as the release would stop (spec FR-027).
  Cost: its `gates` job runs every ci.yml job a second time on each pull request, bounded by the pull request's own
  size (mutation over its own changed lines, as in the required run); the concurrency group cancels a superseded run;
  being not required, it blocks no merge.
- **Mutation range in `workflow_call` runs** (operator decision PLAN-FRESH-3-001 (a)). Every commit on `main` came
  through a pull request whose required **Mutation testing** check covered that pull request's changed lines, and
  `main`'s ruleset requires that check (spec 001 FR-020); this is the spec Assumption's "trusted ... when the plan
  shows that result cannot be bypassed". So the release run mutates only what `main` has not already proven:
  `release-step base` returns the tagged commit's parent, so the range is the pre-tag pull request's own commit, and
  for 1.0.0 (no earlier `v*` tag) `gates/release/first-release-base`, so the range is this mission's squash commit and
  the pre-tag pull request. A probe of the repository's own `planShards` over real ranges of `main` found 43 to 80
  shards for one element mission, 298 for eight missions and 743 for all of `main`, against GitHub Actions' limit of
  256 matrix jobs per run and a 75-minute limit per element shard; a range since the last release would outgrow that
  limit after a few element missions, and a rerun could not fix it. The narrowed range stays the size of one pull
  request. The dry run passes no `base` at all, so it mutates the pull request's own range.

**`release-step dry-run`** (operator decision PLAN-FRESH-2-001 (a)). From npm 11 on (checked in npm 11.21.3 and
12.2.3, `lib/commands/publish.js`), `npm publish` without `--force` asks the registry for the package's versions and
throws "You cannot publish over the previously published versions" before its dry-run branch, so `--dry-run` refuses
a version that is already on the registry (prerelease and deprecated versions are ignored, so the `0.0.0-bootstrap.0`
placeholders of D1 do not trigger it; npm 10 has no such check). A bare dry run would therefore fail a full re-run of
`release.yml` after a partial publish (before `publish` can skip anything, FR-025) and every dry run between a
release and the next version bump. `release-step dry-run` classifies each package as the publish loop does (`npm view
<name>@<v> version --json`, same retry bound): `E404` runs `npm publish <tgz> --dry-run`; a version found is
reported as `already published, dry run skipped`; any other error is retried, then fails naming the package. Unit
tests cover both paths (dry run runs; skipped with no `npm publish` call), a partial state and the error bound; the
rule `dry-run-via-release-step` (R-13) keeps the composite action from calling `npm publish` itself.

**Re-run after a partial publish (FR-025, SC-005).** `RELEASING.md` tells the operator to use **"Re-run failed
jobs"**: it re-runs `publish` (and `install-check`) with the artifact and the digests of the run the operator already
approved, asks for the environment approval again, and `release-step publish` skips what is on the registry. "Re-run
all jobs" also completes (the dry run skips published versions), but it re-runs every gate and repacks, so the
remaining packages would come from new tarballs instead of the ones verified before the first approval; the
procedure says to use it only when the failed run's artifact has expired.

**`release-step publish`** (FR-023, FR-025, edge case "Registry outage"; PLAN-CORRECTNESS-1-009): first it compares
each downloaded tarball's SHA-256 with the expected digest from `prepare`'s job outputs (not a file in the artifact)
and stops on any difference, naming the package (`digest-mismatch`). Then, for `@ocelle/tokens`, `@ocelle/styles`,
`@ocelle/elements` in that fixed order (a constant of the module): `npm view <name>@<v> version --json`; a version
found means skip and report; an `E404` answer means publish (`npm publish <tgz> --access public --provenance`); any
other failure (network, 5xx, timeout) is retried every 30 seconds for at most 10 minutes, then fails naming the
package. A failed `npm publish` is re-checked with `npm view` before any retry: if the version is now on the
registry it is reported as published and skipped, otherwise the publish is retried within the same bound. A failure
of one package stops the run before the next package (so the order holds on a re-run). It never runs `npm
unpublish`, `npm deprecate` or `npm dist-tag`. Unit tests with an injected npm runner and clock cover: all new;
already published; partial (tokens published, styles failing); `npm view` network error then success; `npm view`
error past the bound; publish error after which the version is visible; digest mismatch; and the order.

**Sign-off in the release run (operator decision PLAN-FRESH-1-001 (a)).** `main` lands every pull request as one
single-parent squash commit committed by GitHub, which the sign-off gate (spec 001 FR-023) cannot pass: its range
check fails on every release range. `ci.yml` therefore gains a boolean `workflow_call` input `release` (default
`false`), and its Sign-off job runs with `if: ${{ !inputs.release }}`. On `pull_request`, `inputs` is empty, so the
job always runs; the DCO check is enforced on every pull request before merge and `main`'s ruleset requires it. The
Sign-off job keeps its pull-request range (base and head SHA of `github.event.pull_request`) and never reads
`inputs.base`, so in the dry run's `workflow_call` (`release: false`, a pull-request event) it checks the pull
request's own commits, not the release range; `ci.yml` needs no `head` input (PLAN-FRESH-2-002 (a)). The
release-workflow gate keeps the skip out of pull-request runs (rules `signoff-skip-scope`, `release-input-caller`,
R-13).

Workflow-level `permissions: contents: read`; `concurrency: release` with `cancel-in-progress: false`.

**Alternatives.** A bare `npm publish --dry-run` run only on `github.run_attempt == 1` and only while the version
is not on the registry (PLAN-FRESH-2-001 (b), not chosen); an operator rehearsal with a pre-release tag such as
`v1.0.0-rc.0` whose approval is rejected, instead of the dry run's full graph (PLAN-FRESH-2-002 (b), not chosen);
rerun only the fast gates in the release (faster, but #11 says every check); keep the full release range in the
release run and fail `--plan` above 256 shards or batch shards over several matrix jobs (PLAN-FRESH-3-001 (b), not
chosen: the run grows with every merge until the next release and only re-proves merged commits); a corrected FR-027
plus an operator step to confirm the pre-tag dry run ran, without a verdict job (PLAN-FRESH-3-002 (a), not chosen: a
skipped rehearsal would still look green); require the dry run
(adds a registry dependency to merges); a sign-off exemption for commits committed by GitHub
(PLAN-FRESH-1-001 (b), not chosen); a `SHA256SUMS` file inside the artifact (detects only transport corruption, since
whoever can change the tarballs can change the file).

## R-11. Install check and its proof (FR-030 to FR-034; SPEC-2-01, SPEC-2-02)

**Decision.** The logic lives in `gates/lib/install-check.ts` (entry-point list, child environment, attestation
decode and compare, retry schedule, peer check, rehearse judgement), with a thin process boundary
`gates/bin/install-check.ts` (spawning npm, Chromium and the HTTP server); `gates/release/` holds data only. Both are
in the mutation gate's scope (`gates/bin`, `gates/lib`; PLAN-TESTABILITY-1-001). It is not a merge gate and has no
`gates.json` entry. Inputs: `--version`, `--repository`, `--commit`, `--workflow` (default
`.github/workflows/release.yml`), `--ref` (default `refs/tags/v<version>`), `--registry` (default the public
registry), `--from-tarballs <dir>` (rehearsal) and `--rehearse`.

**Credential-free environment (FR-030; PLAN-A11Y-SECURITY-1-010).** Every child process gets an environment built
from an allow list, not the parent's minus named variables: `PATH`; `HOME` and `TMPDIR` set to the temporary
directory; `npm_config_userconfig` and `npm_config_globalconfig` pointing at empty files; `npm_config_cache` in the
temporary directory; `npm_config_registry` set to `--registry`; and, if present in the parent, the proxy variables
(`HTTP_PROXY`, `HTTPS_PROXY`, `NO_PROXY`, either case) and the CA variables (`NODE_EXTRA_CA_CERTS`, `SSL_CERT_FILE`).
Nothing else passes: no other variable matching `/^npm_config_/i`, no `NODE_AUTH_TOKEN`, `NPM_TOKEN`, `GITHUB_TOKEN`
or `GH_TOKEN`. A unit test plants an upper-case per-registry auth-token variable (`NPM_CONFIG_` + the registry key +
`:_authToken`, assembled at run time) and other npm variables in the parent and asserts none reaches the child.

**Steps.** In a fresh temporary project with `{"private": true}`: install the three packages at the version (npm,
`--ignore-scripts`); resolve every declared entry point (R-05); import `@ocelle/tokens` in Node; load the browser
build (below); verify signatures and provenance (below). Then the peer step (operator decision PLAN-FRESH-1-006 (a)):
in a second empty project, install `@ocelle/elements@<version>` alone; the installed
`node_modules/@ocelle/elements/package.json` must declare `peerDependencies` `{ "@ocelle/tokens": "^<version>" }` and
`node_modules/@ocelle/tokens/package.json` must exist with a version that satisfies it (`peer-unresolved`
otherwise). In `--from-tarballs` mode, before any publish, the tokens version cannot resolve from the registry, so
the peer step checks the declared peer only; the resolution half runs in registry mode after the publish.

**Browser load under the strict CSP (FR-030, Constitution IV; PLAN-A11Y-SECURITY-1-009).** Chromium will not load
module scripts from `file://`, so the check serves the installed `node_modules/@ocelle/` tree and a generated page
from `127.0.0.1` on an ephemeral port, every response carrying `Content-Security-Policy: default-src 'none';
script-src 'self'; style-src 'self'; font-src 'self'`, the same pattern as `packages/elements/test/browser/serve.ts`
(reimplemented in `gates/lib`, since a gate does not import package test code). The page links `tokens.css` and
`base.css` and loads `browser.js` as a module. Playwright routes every request: one not to the page's origin is
aborted and recorded (`network-request`); every `securitypolicyviolation` event and CSP console report is recorded
(`csp-violation`); `ocelle-button` must be defined (`element-undefined`).

**Signatures and provenance (FR-031; PLAN-FRESH-1-005, PLAN-A11Y-SECURITY-1-007).** `npm audit signatures` always
initialises Sigstore's TUF client over the network and a stub cannot produce a Sigstore-valid bundle, so the
verifier is an injected adapter: the real adapter runs `npm audit signatures --json` in the project and fetches each
package's attestations from the registry's attestations endpoint (network: the public registry and Sigstore's TUF
CDN); the pure logic in `gates/lib/install-check.ts` decides from the adapter's results. It decodes the SLSA
provenance statement of each package and compares the source repository, the commit, the workflow path and the ref
with the inputs (`repository-mismatch`, `commit-mismatch`, `workflow-mismatch`, `ref-mismatch`); a package with no
provenance attestation is `attestation-missing`; a failed signature audit is `signature-invalid`.

**Retry (FR-032).** A version not yet visible is retried every 30 seconds for at most 10 minutes (`not-visible`), with
an injected clock in tests.

**Proof before the release (FR-033, FR-034).**
- Unit tests, all offline: the decode-and-compare and decision functions run on **recorded real responses**
  committed under `gates/test/fixtures/install-check/registry/` (recorded from the public registry at implementation
  time:
  the attestations response of a package version with provenance, the answer for a version without one, and `npm
  audit signatures --json` output for a passing and a failing audit), with the injected verifier returning them;
  each test asserts the specific rule line (`attestation-missing`, `repository-mismatch`, `commit-mismatch`,
  `workflow-mismatch`, `ref-mismatch`, `signature-invalid`), not only a non-zero exit. The install, entry-point,
  peer, retry and environment paths use a stub registry (a Node `http` server in the test, no new dependency) that
  advertises no `dist.attestations`, so no Sigstore verification runs against it. The browser rules use fixture
  tarballs whose browser build injects an inline style (`csp-violation`) or fetches a remote URL
  (`network-request`). Recorded responses hold public registry data only (no credential).
- `--rehearse` runs the real adapter against the public registry, on the two entries of
  `gates/release/provenance-reference.json`: the pass case (a real package version with valid provenance, with its
  recorded repository, commit, workflow and ref), then planted failures that must each fail with their own rule: a
  wrong repository (`repository-mismatch`), a wrong commit (`commit-mismatch`), a wrong workflow path
  (`workflow-mismatch`), a wrong ref (`ref-mismatch`), and a real package version that has a registry signature but
  no provenance attestation (`attestation-missing`; PLAN-CORRECTNESS-1-001). It prints each case's expected and
  actual rule and exits 0 only if the pass case passes and every planted failure fails with its expected rule. It
  runs in the composite action, so in the dry run on every pull request and in `release.yml`'s `prepare` job before
  the approval (SC-008: 1 of 1 pass, 3 of 3 of FR-034's planted failures, plus the workflow and ref cases).
- `gates/release/provenance-reference.json` is production data (`--rehearse` reads it in both workflows), so it is
  created in phase 4's green commit, not in the test-only red commit (constitution VIII, `test_pathspec`; analysis
  K4). The unit tests read a copy, `gates/test/fixtures/install-check/provenance-reference.json`, and one test
  asserts that the two files hold the same values, so they cannot drift.

**Recorded registry responses are third-party assets (operator decision A1 "Treat as asset", 2026-11-26,
`reviews/analysis/operator-decisions.md`).** The recorded packuments, attestation bundles and signature-audit output
under `gates/test/fixtures/install-check/registry/` are other projects' registry data, and a packument can carry the
package's README and licence text. The constitution (§ Technology, Licence and Supply Chain) says any third-party
asset other than the font needs the font's treatment and the operator's approval, so: the fixtures are recorded
only from package versions whose licence is a permissive OSI licence (the pick is recorded with the fixtures); each
fixture file is listed in `THIRD_PARTY_NOTICES`, in a section for repository-only assets that ship in no package,
with the package name and version, the registry URL it was fetched from, the date and the package's licence; the
operator approved this treatment at the tasks gate. The recorded responses live in
`gates/test/fixtures/install-check/registry/`; the project's own fixtures (the fixture tarballs, the
provenance-reference copy) sit beside that directory and are not listed. A governance test asserts that every file
under `gates/test/fixtures/install-check/registry/` is named in `THIRD_PARTY_NOTICES` with a licence. The fixtures
sit in no package directory, so no tarball carries them.

## R-12. Tarball install rehearsal (FR-033)

**Decision.** `install-check --from-tarballs <dir>` installs the three tarballs into the empty project (no registry
write, registry reads only for `lit`), then runs the same entry-point, browser and declared-peer checks. A planted
failure (a tarball with a declared export removed) must make it fail; that is a unit test of `--from-tarballs` mode
with a fixture tarball whose `exports` names a file the tarball lacks, asserting `entry-point-unresolved` for that
package and entry point. A second `--from-tarballs` test proves the declared-peer-only peer step: a fixture elements
tarball that declares `@ocelle/tokens` at `^<version>` passes without any registry read for tokens, and one that
declares another range (or `workspace:`) fails with `peer-unresolved`. In the composite action it runs on a copy of
the tarballs, after the digests are taken (R-10).

## R-13. Workflow static check (FR-026)

**Decision.** Gate `release-workflow` (check "Release workflow"), plant form `repo-tree`, reads
`.github/workflows/release.yml`, `release-dry-run.yml`, `ci.yml` and `.github/actions/release-prepare/action.yml`
with the `yaml` package (new exact-pinned dev dependency; the repository's line-based YAML readers are not enough
for nested `permissions`, `environment` and `with` blocks). Rules:

- trigger: release trigger is exactly `push.tags` with `v*` (no `pull_request`, `pull_request_target`,
  `workflow_dispatch`, `schedule`, branch push);
- permissions: workflow-level permissions exactly `contents: read`; `id-token: write` only on the job bound to
  environment `npm-publish`, and that job holds no other write permission;
- dry run: the dry-run workflow has no `id-token`, no `environment` and no `npm publish` without `--dry-run`;
- pinning and credentials: every `uses:` of a remote action is `owner/repo@<40 hex>`; every `actions/checkout` has
  `persist-credentials: false`; no expression reads `secrets.*` other than `secrets.GITHUB_TOKEN`, and no step sets
  `NODE_AUTH_TOKEN` or `NPM_TOKEN`; no step runs `npm unpublish`, `npm deprecate` or `npm dist-tag`;
- job graph (PLAN-TESTABILITY-1-005, PLAN-FRESH-1-001): `gates` needs `release-base`; in `release.yml` it takes its
  `base` input only from `needs.release-base.outputs.base`, in `release-dry-run.yml` it passes no `base`
  (`gates-inputs`; PLAN-FRESH-3-001 (a)); `prepare` needs `gates` (`prepare-needs-gates`);
  `publish` needs `prepare` (`publish-needs-prepare`); `install-check` needs `publish`
  (`install-check-needs-publish`);
- publish job: no build, pack or install step and no `pnpm` command (`publish-builds`); exactly one publishing step,
  `release-step publish`, and no `npm publish` in any `run:` of the job (`publish-order`: the order is the module's,
  unit-tested); that step receives all three `needs.prepare.outputs.sha256-*` digests (`publish-verifies-checksums`);
  the job's checkout is sparse (`.node-version`, `gates/`) and `setup-node` reads `node-version-file: .node-version`
  (`publish-node-pin`);
- pinned Node in every job (PLAN-FRESH-2-002): in `release.yml` and `release-dry-run.yml`, every job with a step that
  runs `node` or `pnpm` has `./.github/actions/setup` before that step, or, in `publish` only, `setup-node` with
  `node-version-file: .node-version` (`node-pin`);
- composite action: the digest step comes directly after the pack step (`digest-after-pack`); it runs
  `install-check --rehearse` (`rehearse-in-prepare`); its publish dry run is `release-step dry-run`, and no `run:` of
  the action runs `npm publish` (`dry-run-via-release-step`, PLAN-FRESH-2-001);
- dry-run graph (PLAN-FRESH-2-002): `release-dry-run.yml` has the jobs `release-base`, `gates` and `prepare` with the
  same `needs` and, step for step, the same steps as `release.yml`'s, except exactly four differences:
  `gates`' `release: false` (`release.yml`: `true`), `gates` without the `base` input (`release.yml`: from
  `needs.release-base.outputs.base`; PLAN-FRESH-3-001 (a)), `prepare`'s `check-tag --no-tag` (`release.yml`:
  `check-tag`), and `prepare`'s composite-action step without the `tag` input (`release.yml`: `with: tag: ${{
  github.ref_name }}`); any other difference, or a `with:` key other than `tag` and `base` that only one side has, is a
  finding; its only other job is `verdict` (`dry-run-graph`, PLAN-FRESH-2-002, PLAN-FRESH-3-002 (b));
- dry-run verdict (PLAN-FRESH-3-002 (b)): the `verdict` job is named "Release dry run", needs exactly
  `release-base`, `gates` and `prepare`, has `if: always()`, and its step fails unless all three
  `needs.<job>.result` are `success`; no other dry-run job carries that name (`dry-run-verdict`);
- dry-run concurrency (PLAN-FRESH-3-001 (a)): `release-dry-run.yml`'s workflow-level `concurrency` has the group
  `release-dry-run-${{ github.event.pull_request.number }}` and `cancel-in-progress: true` (`dry-run-concurrency`);
- sign-off scope: `ci.yml`'s Sign-off job has no `if` other than `${{ !inputs.release }}` (`signoff-skip-scope`);
  the `release` input is declared only under `workflow_call` with default `false`; only `release.yml` passes `true`,
  `release-dry-run.yml` passes `false`, and no other file passes it (`release-input-caller`).

## R-14. Constitution amendment (FR-040, FR-041, Q1 (a), PLAN-CORRECTNESS-1-007 (b))

**Decision.** Through `/speckit-constitution`, version 1.3.1 → 1.4.0 (MINOR: the peer-range exception materially
expands the supply-chain guidance; operator decision PLAN-CORRECTNESS-1-007 (b), approved again at the amendment's
pull request as Governance requires), "Technology, Licence and Supply Chain" reworded: packages publish to the public
npm registry from 1.0.0 with provenance through the release workflow's OIDC identity; the repository has been public
since 2026-11, before 1.0.0; no publish credential is stored in the repository or in CI secrets, and a bootstrap
credential, if any, is the operator's own and never reaches CI (D1); a peer range on a workspace package
(`@ocelle/tokens` at `^<version>`) is the one exception to exact pins (R-03); and `SECURITY.md` "exists" (present
tense; op 023 owns its content). The bootstrap statement says, as FR-040 does, that such a credential is held by the
operator only, never reaches CI, and is revoked (the operator logs out) after use (analysis F6). Spec FR-040 lists
every one of these statements.

## R-15. Release procedure location and content (FR-043)

**Decision.** A new `RELEASING.md` at the root, linked from `CONTRIBUTING.md` and each package README. It is the
operator's script: readiness, O1 to O8 with exact settings and commands, the dry run, the pre-tag pull request, the
tag, the approval, the install check, failures and their remedies (a wrong tarball means `1.0.1`; the failure
procedure below).

- **Pre-tag pull request** (operator decision PLAN-FRESH-1-007 (b)): sets each package's `1.0.0` changelog date to
  the planned release day, empties "Unreleased", and for the first release writes `gates/release/first-release-base`
  (R-10). The operator confirms the date and that the pull request's **Release dry run** check is green (the
  verdict of R-10, which is red when any dry-run job failed or was skipped; PLAN-FRESH-3-002 (b)) before merging it,
  and pushes the tag (O7) on the merged commit; if the tag
  slips past that day, a new pre-tag pull request corrects the date first.
- **Re-run after a partial publish** (R-10): "Re-run failed jobs"; "Re-run all jobs" only when the failed run's
  artifact has expired; with the reason.
- **Failure procedure** (PLAN-FRESH-2-003). The `v*` tag moves only in case 1, and only through the operator's
  ruleset bypass (O5):
  1. *Failure before any publish* (every `npm view <name>@<version>` answers `E404`; for example a red gate, a
     `check-tag` or workflow bug, a failed rehearsal, or a rejected approval, which publishes nothing): the operator
     deletes the `v<version>` tag through the bypass, the fix lands through a normal pull request (with a new pre-tag
     pull request if the date changes), and the operator tags the same version on the new `main` commit. The release
     issue (#11) records the old and new commit SHA, the failed run's URL and the reason.
  2. *Failure after a partial publish that a re-run cannot fix* (at least one package of the version is on the
     registry): the tag of that version is never moved or re-pushed, because the packages already published name its
     commit in their provenance and the install check takes one `--commit`. The release continues as lockstep
     `<x.y.z+1>` through a **version-bump pull request** containing exactly: the three manifests' `version` set to
     `<x.y.z+1>`; the peers of styles and elements set to `workspace:^<x.y.z+1>`; `pnpm-lock.yaml` as `pnpm install`
     rewrites it; the peer range `^<x.y.z+1>` in the styles and elements READMEs' peer sentences and in the three
     install sections (the readme tests derive the expected range from the manifests, and every other test that
     names the version reads it from `packages/tokens/package.json`, so no test file changes; analysis F4); in each
     package's changelog a dated `<x.y.z+1>` entry that names the fix, and the `<x.y.z>` entry
     kept with a line saying which packages of it were published and that `<x.y.z+1>` supersedes it; "Unreleased"
     empty. The operator then tags `v<x.y.z+1>` (O7) on the merged commit; `release-step base` finds `v<x.y.z>` as
     the previous tag. The operator (never the workflow) deprecates the published `<x.y.z>` versions with a message
     naming `<x.y.z+1>`, after the install check of `<x.y.z+1>` passes. SC-002 and SC-004 are then read for
     `<x.y.z+1>`.
  3. *A wrong tarball that is already published*: the same version-bump pull request as case 2; that is what "a
     wrong tarball means `1.0.1`" refers to.
- **O4 settings** (PLAN-A11Y-SECURITY-1-002): environment `npm-publish`; required reviewer: the operator's account
  only; deployment branches and tags: tags `v*` only; "Allow administrators to bypass configured protection rules"
  off; "Prevent self-review" off (the operator pushes the tag and is the only reviewer, so with it on the release
  could never be approved); no environment secrets. The implementation re-checks GitHub's exact labels.
- **O5 settings**: a tag ruleset on `refs/tags/v*` restricting creation, update, deletion and force pushes; bypass
  list: the operator's account only (no app, team, role or agent identity; an empty list would block the operator
  too).
- **Identities** (PLAN-A11Y-SECURITY-1-001, R-16): O4 and O5 each record how the operator confirmed the agents'
  GitHub identity, and O8 re-confirms every setting of O4 and O5.

## R-16. Release identities and the agent side (FR-043, SC-007; PLAN-A11Y-SECURITY-1-001)

**Facts.** Agent sessions in this repository act on GitHub with a token, and the agent permission settings
(`.claude/settings.json`) deny pushes to `main`, `npm publish` and some `gh` verbs, but not tag pushes, `gh release`
or the npm account verbs. Both release barriers (O4, O5) are GitHub identity checks.

**Decision.** The barrier is GitHub's: the identity agents use MUST NOT be the operator's account, MUST NOT be on the
`v*` tag ruleset's bypass list and MUST NOT be a required reviewer of `npm-publish`; O4 and O5 record how the
operator confirmed it (FR-043). The agent-side deny rules are a convenience on top, and agents do not change their
own permission settings, so adding them is an **operator task** listed under O5 in `RELEASING.md`: deny `git push`
of `refs/tags/*` and of `v*` refs, `git push --tags`, `git push --follow-tags`, `git tag`, `gh release`, `gh workflow
run release.yml`, and the npm verbs `login`, `adduser`, `token`, `trust`, `deprecate`, `dist-tag`, `unpublish`,
`access` and `owner`. This mission writes no change to the agent permission settings.

## R-17. Plant forms for the new gates (FR-006, FR-015, FR-026, FR-044; PLAN-TESTABILITY-1-003 (a))

**Facts.** `gates/lib/plant-repo.ts` builds `commit-repo` plants with `commit-tree` on the empty tree and accepts only
`author`, `parent` and `merge` headers, so no commit carries a file; the `workspace` form (`gates/bin/plants.ts`)
copies the plant directory only, so nothing can be built in it; the configuration set has no `.github/`,
`gates/release/`, changelogs, styles sources beyond `base.css`, gap-table source or `verification.md` files.

**Decision (operator decision PLAN-TESTABILITY-1-003 (a)).** Planned explicitly, test-first, with spec 001
`contracts/plants.md` amended (FR-044):

- **Readiness (`commit-repo`, extended in US2).** A `commits.txt` record may carry `files: <dir>` (a directory of the
  plant laid over the previous commit's tree), `delete: <path>` and `secret: <rule> <path>` (the plant builder
  appends a generated value of that rule to the file at plant time, so no plant holds a literal, R-08) headers. For
  the readiness gate the base commit holds the configuration set instead of the empty tree (sign-off plants keep the
  empty base). `parseCommits` and `buildCommitRepo` change test-first with `plant-repo` integration tests.
- **Pack contents (new form `pack-tree`, US1).** A plant's `tree/` holds small committed package trees
  (`packages/<name>/` with a `package.json` and `dist/` files, no build; licence files as below), laid over the configuration
  set; the plant builder archives each package directory under `package/` into `<tmp>/tarballs/<name>.tgz` (plain
  `tar`, no `pnpm pack`, so a plant can ship a `workspace:` specifier or a stray file as-is) and runs the gate with
  `--root <tmp> --tarballs <tmp>/tarballs`. Before archiving, the plant builder copies the root licence files of the
  laid-over tree into each package directory: `LICENSE` and `NOTICE` into every package, `THIRD_PARTY_NOTICES` into
  `tokens` and `elements` (R-04), unless the plant's tree ships that file itself (only `fail-notice-differs` does) or
  the plant's `omit.txt` lists its tree path (`fail-license-missing`). So the plant trees carry no copy of the root
  files, and a later edit of a root file (phase 4's `THIRD_PARTY_NOTICES`, T055) keeps every plant as it was (analysis
  C2). The build-and-pack path (no `--tarballs`) is proven once by a
  gates-integration test on the real workspace.
  The form is registered where op 023 registered `tracked-tree`: the `PlantForm` union, the `forms` list and its error
  text in `gates/lib/registry.ts` (with the gate's registration, US1), and the build map of `gates/bin/plants.ts`;
  `plantValues` lives in `gates/lib/plant-runner.ts` and needs no change, because `plantArgs` replaces `{root}` inside
  an argument (recheck item 4).
- **Configuration set.** Extended with `.github/workflows/`, `.github/actions/`, `gates/release/`, the gap-table
  source, `packages/*/CHANGELOG.md`, `packages/styles/src/*.css`, `packages/tokens/fonts/OFL.txt` (the `source` of the tokens
  `identical` entry, for `fail-ofl-differs`; analysis L3, L7), `specs/*/verification.md` and the root `LICENSE`,
  `NOTICE` and `THIRD_PARTY_NOTICES`, so the `pass-repository` plants of `release-workflow` and `release-readiness`
  see their inputs.

**Alternative.** A form that lays plant files over a full repository copy with `node_modules` linked and builds for
real (PLAN-TESTABILITY-1-003 (b)): closer to CI, slower; not chosen.
