# Contract: `release-readiness` gate (FR-010 to FR-015)

- **Command:** `pnpm run gate:release-readiness [-- --root <dir>] [--tag <v...>]`; `gates/bin/release-readiness.ts`.
  Check name **Release readiness**, a required pull-request check (operator decision PLAN-CORRECTNESS-1-006 (a); O6).
  Plant form `commit-repo`, extended (research.md R-17): a record may carry `files:`, `delete:` and `secret:` headers,
  and the readiness plants' base commit holds the configuration set.
- **Inputs**, all read from the checkout at `--root` (default the repository root): `gates/release/gap-rows.json`,
  `specs/030-release-v1/sources/issue-1-gap-table.md`, `gates/release/secret-allowlist.json`, the three manifests
  and changelogs, the custom-elements manifest, the token source, `packages/styles/src/*.css`,
  `specs/*/verification.md`. There is no `--commit` option: the history scan starts at the checkout's `HEAD`, so
  every input belongs to the commit the verdict names (PLAN-CORRECTNESS-1-011).
- **Checks and findings:** as data-model.md "Readiness report". The history scan covers every commit reachable from
  `HEAD` (`git log -p -m HEAD`: every reachable commit, merges diffed against each parent; binary diffs skipped) with
  the rules of research.md R-08; the matched text is never written to any output, log or file. Allow-list entries
  are keyed by path, rule and the matched text's SHA-256 (data-model.md).
- **Exit 0:** `ready`. **Exit 1:** `not ready` with findings. **Exit 2:** not a git repository, a shallow clone
  (the history scan needs the whole history: CI checks out with `fetch-depth: 0`), an input file missing or invalid.
- **No network, no write** (FR-014).
- **No committed literal** (FR-045): no plant or test file matches a secret-scan rule; `secret:` headers and
  run-time assembly produce the values (research.md R-08). A gates-integration test asserts the scan of this
  repository's own `HEAD` has zero hits.
- **Plants:** fail: `fail-row-unmet` (an element removed from the manifest), `fail-rows-reworded`,
  `fail-row-spec-only`, `fail-secret-npm`, `fail-secret-github`, `fail-secret-private-key`, `fail-secret-aws`,
  `fail-secret-slack`, `fail-secret-anthropic`, `fail-secret-openai`, `fail-secret-google`, `fail-secret-npmrc`,
  `fail-secret-env-assignment`, `fail-secret-deleted-later` (added then removed in a later commit: still a finding),
  `fail-allowlist-no-reason`, `fail-allowlist-stale`, `fail-version-skew`, `fail-tag-mismatch`,
  `fail-changelog-undated`, `fail-changelog-missing-element`, `fail-changelog-missing-token-group` (a token in a new
  name family the tokens changelog does not name), `fail-unreleased-not-empty` (with `--tag`); pass:
  `pass-repository`, `pass-allowlisted`, `pass-npmrc-variable` (`_authToken=${NODE_AUTH_TOKEN}` in an `.npmrc`),
  `pass-env-variable` (a `*_TOKEN=${...}` line in a `.env` file), `pass-rule-prose` (a Markdown file that describes the
  `.npmrc` and env rules is not a hit), `pass-token-prefix` (a new token covered by a `` `--ocelle-<prefix>-*` ``
  mention), `pass-lockfile-integrity` (a `sha512-` hash is not a secret); breaking: `break-shallow`,
  `break-gap-rows-invalid`.
- **Integration test:** the gap check with the committed `gap-rows.json` against commit `183b20f` reports exactly
  rows 6, 10 and 15 unmet (research.md R-07).
