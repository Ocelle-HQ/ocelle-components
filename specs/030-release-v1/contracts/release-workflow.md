# Contract: release workflows and the `release-workflow` gate (FR-020 to FR-027)

## `.github/workflows/release.yml`

```text
on: push: tags: ["v*"]                      # nothing else
permissions: contents: read                 # workflow level
concurrency: { group: release, cancel-in-progress: false }
jobs:
  release-base:  checkout tag, fetch-depth 0, persist-credentials false;
                 node gates/bin/release-step.ts base   -> output base
                 (previous v* tag reachable from <sha>^, else gates/release/first-release-base)
  gates:         needs release-base; uses: ./.github/workflows/ci.yml
                 with: { base: needs.release-base.outputs.base, head: github.sha, release: true }
  prepare:       needs gates; checkout tag, fetch-depth 0, persist-credentials false;
                 node gates/bin/release-step.ts check-tag   (tag == v<version>; commit ancestor of origin/main)
                 uses ./.github/actions/release-prepare
                 outputs: sha256-tokens, sha256-styles, sha256-elements (from the action's outputs)
                 upload artifact "release-tarballs" (the three .tgz only)
  publish:       needs prepare; environment: npm-publish;
                 permissions: { contents: read, id-token: write };
                 sparse checkout of the tag (.node-version, gates/), persist-credentials false;
                 setup-node (pinned SHA, node-version-file .node-version, registry-url https://registry.npmjs.org);
                 npm --version >= 11.5.1; download artifact;
                 node gates/bin/release-step.ts publish   (digests from needs.prepare.outputs.* via env)
                 no build, pack, install or pnpm step; no other npm publish
  install-check: needs publish; permissions: contents: read;
                 checkout tag, persist-credentials false; uses ./.github/actions/setup;
                 node gates/bin/install-check.ts --version v --repository Ocelle-HQ/ocelle-components
                   --commit <sha> --workflow .github/workflows/release.yml --ref refs/tags/v<version>
```

Values from the tag, the commit and job outputs reach `run:` scripts through `env:`, as `ci.yml` does.

## `.github/actions/release-prepare/action.yml`

In order: build; `gate:release-readiness` (`--tag` when given); `pnpm pack` of the three packages;
`release-step digest` directly after the pack (outputs `sha256-tokens`, `sha256-styles`, `sha256-elements`);
`gate:pack-contents --tarballs`; `npm publish <tgz> --dry-run` per tarball; `install-check --from-tarballs` on a copy
of the tarballs; `install-check --rehearse` (operator decision PLAN-CORRECTNESS-1-002 (a)).

## `release-step` (`gates/bin/release-step.ts`, logic in `gates/lib/release-steps.ts`)

Subcommands `base`, `check-tag`, `digest`, `publish` (research.md R-10). `publish`: verifies each tarball's SHA-256
against the expected digests (`digest-mismatch`, nothing published); then for `@ocelle/tokens`, `@ocelle/styles`,
`@ocelle/elements` in that order: `npm view <name>@<v> version --json`; found: skip and report; `E404`: `npm publish
<tgz> --access public --provenance`; any other error: retry every 30 s for at most 10 min, then fail naming the
package; a failed publish is re-checked with `npm view` before any retry (visible: report and skip). A failure stops
before the next package. Never `unpublish`, `deprecate` or `dist-tag`. Imports only Node built-ins and `gates/lib`
modules with no package dependency. Unit tests with an injected npm runner and clock: all new, already published,
partial, `npm view` network error then success, error past the bound, publish error then visible, digest mismatch,
order.

## `.github/workflows/release-dry-run.yml`

`on: pull_request` and `workflow_dispatch`; `permissions: contents: read`; one job `dry-run` (check **Release dry
run**, not required, research D5): checkout with `fetch-depth: 0`, `persist-credentials: false`; the composite action
without `--tag` (so it runs the tarball rehearsal and `install-check --rehearse`). No `environment`, no `id-token`,
no `npm publish` without `--dry-run`.

## `ci.yml` change

Adds `on: workflow_call` with inputs `base` and `head` (strings) and `release` (boolean, default `false`). Jobs that
read `github.event.pull_request.base.sha` read `inputs.base || github.event.pull_request.base.sha` (same for head).
The Sign-off job gets `if: ${{ !inputs.release }}` (operator decision PLAN-FRESH-1-001 (a)): on `pull_request`
`inputs` is empty, so it always runs there; it is skipped only when `release.yml` calls with `release: true`. No other
change; the pull-request behaviour is identical.

## `release-workflow` gate

`pnpm run gate:release-workflow [-- --root <dir>]`; `gates/bin/release-workflow.ts`; check **Release workflow**;
plant form `repo-tree`; reads `release.yml`, `release-dry-run.yml`, `ci.yml` and the `release-prepare` action. Rules
(findings `<file>:<line>: release-workflow: <rule>: <message>`): `trigger`, `workflow-permissions`,
`id-token-outside-publish`, `publish-not-in-environment`, `publish-extra-write`, `dry-run-can-publish`,
`unpinned-action`, `persisted-credentials`, `secret-read`, `token-env`, `destructive-npm`, `gates-inputs`,
`prepare-needs-gates`, `publish-needs-prepare`, `install-check-needs-publish`, `publish-builds`, `publish-order`,
`publish-verifies-checksums`, `publish-node-pin`, `digest-after-pack`, `rehearse-in-prepare`, `signoff-skip-scope`,
`release-input-caller`, `file-missing` (exit 2 if a file does not parse). Rule meanings: research.md R-13. Plants: one
fail plant per rule (among them `fail-signoff-skipped-on-pr`: the Sign-off job with any other `if`;
`fail-publish-rebuilds`: a build step in publish; `fail-digest-in-artifact`: publish reads digests from a file
instead of `needs.prepare.outputs`); pass: `pass-repository`, `pass-local-action` (`uses: ./...` is not a remote
action); breaking: `break-not-yaml`.
