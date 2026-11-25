# Contract: `release-readiness` gate (FR-010 to FR-015)

- **Command:** `pnpm run gate:release-readiness [-- --root <dir>] [--commit <sha>] [--tag <v...>]`;
  `gates/bin/release-readiness.ts`. Check name **Release readiness**. Plant form `commit-repo` (a plant is a small
  repository with history, as the sign-off gate's plants are, so the history scan has commits to read).
- **Inputs:** `gates/release/gap-rows.json`, `specs/030-release-v1/sources/issue-1-gap-table.md`,
  `gates/release/secret-allowlist.json`, the three manifests and changelogs, the custom-elements manifest, the token
  source, `packages/styles/src/*.css`, `specs/*/verification.md`. `--commit` defaults to `HEAD`.
- **Checks and findings:** as data-model.md "Readiness report". The history scan covers every commit reachable from
  `--commit` (`git log -p -m <commit>`: every reachable commit, merges diffed against each parent; binary diffs skipped); the matched text is never written to any output,
  log or file.
- **Exit 0:** `ready`. **Exit 1:** `not ready` with findings. **Exit 2:** not a git repository, a shallow clone
  (the history scan needs the whole history: CI checks out with `fetch-depth: 0`), an input file missing or invalid.
- **No network, no write** (FR-014).
- **Plants:** fail: `fail-row-unmet` (an element removed from the manifest), `fail-rows-reworded`, `fail-row-spec-only`,
  `fail-secret-npm`, `fail-secret-github`, `fail-secret-private-key`, `fail-secret-npmrc`, `fail-secret-deleted-later`
  (added then removed in a later commit: still a finding), `fail-allowlist-no-reason`, `fail-allowlist-stale`,
  `fail-version-skew`, `fail-tag-mismatch`, `fail-changelog-undated`, `fail-changelog-missing-element`,
  `fail-unreleased-not-empty` (with `--tag`); pass: `pass-repository`, `pass-allowlisted`, `pass-npmrc-variable`
  (`_authToken=${NODE_AUTH_TOKEN}`), `pass-lockfile-integrity` (a `sha512-` hash is not a secret); breaking:
  `break-shallow`, `break-gap-rows-invalid`.
