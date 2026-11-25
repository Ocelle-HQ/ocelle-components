# Contract: release workflows and the `release-workflow` gate (FR-020 to FR-027)

## `.github/workflows/release.yml`

```text
on: push: tags: ["v*"]                      # nothing else
permissions: contents: read                 # workflow level
concurrency: { group: release, cancel-in-progress: false }
jobs:
  gates:         uses: ./.github/workflows/ci.yml  (workflow_call; inputs base, head)
  prepare:       needs gates; checkout tag, fetch-depth 0, persist-credentials false;
                 ancestor-of-origin/main check; tag == v<version>;
                 uses ./.github/actions/release-prepare (readiness --tag, pack, pack-contents --tarballs,
                 npm publish --dry-run, install rehearsal from tarballs, SHA256SUMS);
                 upload artifact "release-tarballs"
  publish:       needs prepare; environment: npm-publish;
                 permissions: { contents: read, id-token: write }; no checkout;
                 setup-node (pinned SHA, registry-url https://registry.npmjs.org);
                 npm --version >= 11.5.1; download artifact; sha256sum -c;
                 for tokens, styles, elements: npm view name@v version && skip || npm publish tgz --access public --provenance
  install-check: needs publish; permissions: contents: read;
                 node gates/release/install-check.ts --version v --repository Ocelle-HQ/ocelle-components --commit <sha>
```

## `.github/workflows/release-dry-run.yml`

`on: pull_request` and `workflow_dispatch`; `permissions: contents: read`; one job `dry-run` (check **Release dry
run**, not required, research D5): checkout with `fetch-depth: 0`, `persist-credentials: false`; the composite action
without `--tag`; then `install-check --rehearse` (provenance reference: one pass, two planted failures that must
fail). No `environment`, no `id-token`, no `npm publish` without `--dry-run`.

## `ci.yml` change

Adds `on: workflow_call` with inputs `base` and `head` (strings). Jobs that read
`github.event.pull_request.base.sha` read `inputs.base || github.event.pull_request.base.sha` (same for head). No
other change; the pull-request behaviour is identical.

## `release-workflow` gate

`pnpm run gate:release-workflow [-- --root <dir>]`; `gates/bin/release-workflow.ts`; check **Release workflow**;
plant form `repo-tree`. Rules (findings `<file>:<line>: release-workflow: <rule>: <message>`): `trigger`,
`workflow-permissions`, `id-token-outside-publish`, `publish-not-in-environment`, `publish-extra-write`,
`dry-run-can-publish`, `unpinned-action`, `persisted-credentials`, `secret-read`, `token-env`, `destructive-npm`,
`file-missing` (exit 2 if a file does not parse). Plants: one fail plant per rule; pass: `pass-repository`,
`pass-local-action` (`uses: ./...` is not a remote action); breaking: `break-not-yaml`.
