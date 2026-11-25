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
must be byte-identical to the repository root's (`LICENSE`, `NOTICE`, and `THIRD_PARTY_NOTICES` where shipped). Any
tarball entry that matches no pattern is a finding; the deny list (test files `*.test.*`, `*.stories.*`, `.npmrc`,
`.env*`, `*.pem`, `*.key`, `id_*`, source maps of test files) is checked first and reported as such. The packages'
`files` fields stay as the first filter; the allow list is the gate's independent statement.

**Licence files per package (FR-002).** `@ocelle/tokens`: `LICENSE`, `NOTICE`, `THIRD_PARTY_NOTICES` (it ships the
font), `dist/fonts/OFL.txt`. `@ocelle/styles`: `LICENSE`, `NOTICE`. `@ocelle/elements`: unchanged (`LICENSE`,
`NOTICE`, `THIRD_PARTY_NOTICES`, `licenses/` with Lit's licence). Each package's build copies the root files as the
elements build already does.

## R-05. Entry points (FR-004, FR-030; SPEC-1-06)

**Decision.** "Declared entry point" means every target of `exports` (with `*` patterns expanded against the tarball
and required to match at least one file), plus `main`, `module`, `types` and `customElements` when present. Story 1
scenario 2's list (which names the browser build) is covered because the browser build is an `exports` target
(`./browser.js`).

## R-06. Release-readiness check: a gate on every pull request (FR-010 to FR-015; SPEC-2-03, SPEC-2-04)

**Decision (D3).** `release-readiness` is a merge gate (check "Release readiness") with plants, run on every pull
request and by the release workflows. It works on a **commit** (the checkout), never on tarballs (SPEC-2-04: the
spec's "readiness on the tarballs" is read as "on the commit the tarballs were packed from"; the tarballs are the
pack-contents gate's). It checks: the gap rows (R-07), the history secret scan (R-08), one shared version (and, with
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

## R-08. History secret scan (FR-011, #11 "the history contains no secrets")

**Decision.** The gate runs `git log -p -m --no-color --no-ext-diff <commit>` (every commit reachable from
the checked commit, all parents) and scans added lines with these patterns: npm tokens (`npm_` + 36 alphanumerics),
GitHub tokens (`gh[pousr]_` + 36 or more, `github_pat_` + 82), PEM private-key headers (`-----BEGIN ... PRIVATE
KEY-----`), AWS access key ids (`AKIA` + 16), Slack tokens (`xox[abpr]-`), and an `.npmrc` auth line
(`_authToken=` or `_auth=` followed by a literal, not `${...}`). A hit is reported as `<commit>:<path>` and the rule
name; the matched text is never printed. Exceptions are listed in `gates/release/secret-allowlist.json`
(commit, path, rule, reason); an entry with no reason, or one that matches nothing, is a finding. No generic
high-entropy rule: it would flag every baseline digest and lockfile integrity hash, and its exceptions would drown the
real rules. GitHub's own secret scanning (on for public repositories) is a complement the release procedure asks the
operator to re-check (O2 step).

**Alternatives.** gitleaks (a Go binary or a third-party action: one more pinned supply-chain dependency for a
handful of rules); trufflehog (same).

## R-09. Changelog check (FR-013; SPEC-1-10, SPEC-2-05)

**Decision.** For the version in the manifests (not a literal `1.0.0`), each package's `CHANGELOG.md` must have a
`## <version> - <YYYY-MM-DD>` heading. Every element tag in the manifest must appear (as `` `ocelle-x` ``) in
`packages/elements/CHANGELOG.md` (any section, so post-1.0 additions under "Unreleased" pass between releases). Token
names and base-style hooks are not compared one by one (more than 300 tokens; the hooks have no machine list): the
tokens and styles entries must each be non-empty. With `--tag v<x>`, the `<x>` entry must exist and "Unreleased"
must be empty (everything released is named under the version).

## R-10. The release workflows (FR-020 to FR-027)

**Decision (D4).** Two workflow files and one composite action:

- `.github/actions/release-prepare/action.yml`: build, `readiness --tag` (when a tag is given), pack, pack-contents
  gate on the tarballs, `npm publish <tgz> --dry-run` for each, the tarball install rehearsal (R-12), and a
  `SHA256SUMS` of the tarballs.
- `.github/workflows/release.yml`: `on: push: tags: ['v*']` only. Jobs:
  1. `gates`: `uses: ./.github/workflows/ci.yml` (ci.yml gains `on: workflow_call` with inputs `base` and `head`),
     so every merge gate runs on the tagged commit (#11 "run every check"); `base` is the previous release tag, or
     the commit before this mission's merge for the first release (the release procedure names it), so the sign-off
     and mutation gates cover what the release adds.
  2. `prepare` (needs `gates`): checkout of the tag with full history, `persist-credentials: false`; fails unless the
     commit is an ancestor of `origin/main` and the tag equals `v<version>`; runs the composite action; uploads the
     tarballs and `SHA256SUMS` as an artifact.
  3. `publish` (needs `prepare`): `environment: npm-publish`; `permissions: { contents: read, id-token: write }`;
     no checkout; pinned `actions/setup-node` with the registry URL; downloads the artifact and checks `SHA256SUMS`;
     for tokens, styles, elements in order: skips a version already on the registry (`npm view <name>@<v> version`),
     else `npm publish <tgz> --access public --provenance`. Never `unpublish`, `deprecate` or `dist-tag rm`.
  4. `install-check` (needs `publish`): the install check (R-11) against the public registry with the expected
     repository and commit.
- `.github/workflows/release-dry-run.yml`: `on: pull_request` and `workflow_dispatch`; one job running the composite
  action and the install check's rehearsal (R-11, R-12); `permissions: contents: read`; no environment, no
  `id-token`. It is a named check but **not required** (D5): its pack, contents and readiness parts are already
  required gates, and its rehearsal reaches the public registry for reading, which a required check should not depend
  on.

Workflow-level `permissions: contents: read`; `concurrency: release` with `cancel-in-progress: false`.

**Alternatives.** Rerun only the fast gates in the release (faster, but #11 says every check); require the dry run
(adds a registry dependency to merges).

## R-11. Install check and its proof (FR-030 to FR-034; SPEC-2-01, SPEC-2-02)

**Decision.** `gates/release/install-check.ts`, a command with inputs `--version`, `--repository`, `--commit`,
`--registry` (default the public registry) and `--from-tarballs <dir>` (rehearsal). In a fresh temporary directory
with `npm_config_userconfig` and `npm_config_globalconfig` pointing at empty files and no `NODE_AUTH_TOKEN`, it
installs the three packages at the version, resolves every declared entry point (R-05), imports `@ocelle/tokens` in
Node, and loads `@ocelle/elements/browser.js` with `tokens.css` and `base.css` in Chromium (Playwright, already a
pinned dependency) to check that `ocelle-button` is defined. It then runs `npm audit signatures` in that project
(registry signatures and attestations) and reads each package's provenance attestation from the registry's
attestations endpoint, decoding the in-toto statement to compare the source repository and the commit with the
inputs. A version not yet visible is retried every 30 seconds for at most 10 minutes (FR-032).

**Proof before the release (FR-033, FR-034).**
- Unit tests with a stub registry (a Node `http` server in the test, no new dependency) cover: a pass, a missing
  attestation, another repository, another commit, a **bad registry signature** (the stub's keys endpoint does not
  match the signature, so `npm audit signatures` fails: SPEC-2-01), a version that never appears (retry bound with an
  injected clock), and a failing entry-point import.
- The dry-run workflow's rehearsal runs the provenance part against a **real** published package that already has
  provenance, given by `gates/release/provenance-reference.json` (name, version, repository, commit, recorded at
  implementation time from the registry), once with the right expectations (pass) and once each with a wrong
  repository and a wrong commit (planted failures, which must fail); and runs the install part against the packed
  tarballs (R-12). The check takes the expected repository and commit as inputs (SPEC-2-02).

## R-12. Tarball install rehearsal (FR-033)

**Decision.** `install-check --from-tarballs <dir>` installs the three tarballs into the empty project (no
registry write, registry reads only for `lit`), then runs the same entry-point and browser checks. A planted failure
(a tarball with a declared export removed) must make it fail; that is a unit test with a fixture tarball.

## R-13. Workflow static check (FR-026)

**Decision.** Gate `release-workflow` (check "Release workflow"), plant form `repo-tree`, reads
`.github/workflows/release.yml`, `release-dry-run.yml` and `.github/actions/release-prepare/action.yml` with the
`yaml` package (new exact-pinned dev dependency; the repository's line-based YAML readers are not enough for nested
`permissions`, `environment` and `with` blocks). Rules: release trigger is exactly `push.tags` with `v*` (no
`pull_request`, `pull_request_target`, `workflow_dispatch`, `schedule`, branch push); workflow-level permissions
exactly `contents: read`; `id-token: write` only on the job bound to environment `npm-publish`, and that job holds no
other write permission; the dry-run workflow has no `id-token`, no `environment` and no `npm publish` without
`--dry-run`; every `uses:` of a remote action is `owner/repo@<40 hex>`; every `actions/checkout` has
`persist-credentials: false`; no expression reads `secrets.*` other than `secrets.GITHUB_TOKEN`, and no step sets
`NODE_AUTH_TOKEN` or `NPM_TOKEN`; no step runs `npm unpublish`, `npm deprecate` or `npm dist-tag`.

## R-14. Constitution amendment (FR-040, FR-041, Q1 (a))

**Decision.** Through `/speckit-constitution`, version 1.3.1 → 1.3.2 (PATCH), "Technology, Licence and Supply Chain"
reworded: packages publish to the public npm registry from 1.0.0 with provenance through the release workflow's
OIDC identity; the repository has been public since 2026-11, before 1.0.0; no publish credential is stored in the
repository or in CI secrets, and a bootstrap credential, if any, is the operator's own and never reaches CI
(D1); a peer range on a workspace package is the one exception to exact pins (R-03); and `SECURITY.md` "exists"
(present tense; op 023 owns its content).

## R-15. Release procedure location (FR-043)

**Decision.** A new `RELEASING.md` at the root, linked from `CONTRIBUTING.md` and each package README. It is the
operator's script: readiness, O1 to O8 with exact settings and commands, the dry run, the tag, the approval, the
install check, failures and their remedies (a wrong tarball means `1.0.1`).
