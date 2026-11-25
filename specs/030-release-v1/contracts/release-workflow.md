# Contract: release workflows and the `release-workflow` gate (FR-020 to FR-027)

## `.github/workflows/release.yml`

```text
on: push: tags: ["v*"]                      # nothing else
permissions: contents: read                 # workflow level
concurrency: { group: release, cancel-in-progress: false }
jobs:
  release-base:  checkout tag, fetch-depth 0, persist-credentials false; uses ./.github/actions/setup;
                 node gates/bin/release-step.ts base   -> output base
                 (previous v* tag reachable from <sha>^, else gates/release/first-release-base)
  gates:         needs release-base; uses: ./.github/workflows/ci.yml
                 with: { base: needs.release-base.outputs.base, release: true }
  prepare:       needs gates; checkout tag, fetch-depth 0, persist-credentials false; uses ./.github/actions/setup;
                 node gates/bin/release-step.ts check-tag   (tag == v<version>; commit ancestor of origin/main)
                 uses ./.github/actions/release-prepare  with: { tag: github.ref_name }
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

Values from the tag, the commit and job outputs reach `run:` scripts through `env:`, as `ci.yml` does. Every job that
runs `node` or `pnpm` gets the pinned Node first: `./.github/actions/setup` (which asserts `node --version` against
`.node-version`), or, in `publish` only, `setup-node` with `node-version-file: .node-version` (rule `node-pin`;
PLAN-FRESH-2-002).

## `.github/actions/release-prepare/action.yml`

Input `tag` (string, default empty): `release.yml` passes the pushed tag's name, `release-dry-run.yml` passes nothing
(PLAN-FRESH-2-002). In order: build; `gate:release-readiness` (`--tag <tag>` when the input is not empty, without
`--tag` otherwise); `pnpm pack` of the three packages;
`release-step digest` directly after the pack (outputs `sha256-tokens`, `sha256-styles`, `sha256-elements`);
`gate:pack-contents --tarballs`; `release-step dry-run` (the publish dry run, below; never a bare `npm publish`);
`install-check --from-tarballs` on a copy of the tarballs; `install-check --rehearse` (operator decision
PLAN-CORRECTNESS-1-002 (a)).

## `release-step` (`gates/bin/release-step.ts`, logic in `gates/lib/release-steps.ts`)

Subcommands `base`, `check-tag`, `digest`, `dry-run`, `publish` (research.md R-10).

`check-tag` (tag mode, in `release.yml`): the tag equals `v<version>` of all three manifests, and the commit is an
ancestor of `origin/main`. `check-tag --no-tag` (in `release-dry-run.yml`): the three manifests share one version and
`origin/main` resolves in the checkout (the fetch the ancestor test needs); it prints that the tag comparison and the
ancestor test are skipped because no tag is given.

`dry-run` (operator decision PLAN-FRESH-2-001 (a)): for each tarball, in the publish order, `npm view <name>@<v>
version --json` with the publish loop's classification and retry bound; `E404`: `npm publish <tgz> --dry-run` (its
failure fails the step, naming the package); found: report `<name>@<v>: already published, dry run skipped` and run
nothing for it; any other error: retry every 30 s for at most 10 min, then fail naming the package. Reason: from npm
11 on, `npm publish --dry-run` asks the registry and refuses a version it already has (the check runs before the
dry-run branch; npm 10 has no such check), so a bare dry run would fail a full re-run after a partial publish and
every pull request between a release and the next version bump.

`publish`: verifies each tarball's SHA-256 against the expected digests (`digest-mismatch`, nothing published); then for `@ocelle/tokens`, `@ocelle/styles`,
`@ocelle/elements` in that order: `npm view <name>@<v> version --json`; found: skip and report; `E404`: `npm publish
<tgz> --access public --provenance`; any other error: retry every 30 s for at most 10 min, then fail naming the
package; a failed publish is re-checked with `npm view` before any retry (visible: report and skip). A failure stops
before the next package. Never `unpublish`, `deprecate` or `dist-tag`. Imports only Node built-ins and `gates/lib`
modules with no package dependency. Unit tests with an injected npm runner and clock: all new, already published,
partial, `npm view` network error then success, error past the bound, publish error then visible, digest mismatch,
order; for `dry-run`: not on the registry (the dry run runs, with `--dry-run` and nothing else), already published
(skipped and reported, no `npm publish` call at all), partial (tokens skipped, styles and elements dry-run), `npm
view` error past the bound, a failing dry run; for `check-tag`: each tag-mode failure and the `--no-tag` mode.

## `.github/workflows/release-dry-run.yml`

`on: pull_request` only (no `workflow_dispatch`: a dispatch has no pull-request range for ci.yml's Sign-off job);
`permissions: contents: read`. The same pre-approval job graph as `release.yml` (operator decision PLAN-FRESH-2-002
(a)), so every job up to the approval runs on every pull request before it runs on a real tag:

```text
jobs:
  release-base:  as in release.yml (checkout with fetch-depth 0 of the pull request's merge commit, setup,
                 release-step base -> output base)
  gates:         needs release-base; uses: ./.github/workflows/ci.yml
                 with: { base: needs.release-base.outputs.base, release: false }
  prepare:       name "Release dry run" (the check; not required, research D5); needs gates; checkout with
                 fetch-depth 0, persist-credentials false; uses ./.github/actions/setup;
                 node gates/bin/release-step.ts check-tag --no-tag
                 uses ./.github/actions/release-prepare (no tag input: readiness without --tag; tarball
                   rehearsal and install-check --rehearse)
                 the same outputs and the same "release-tarballs" artifact upload as release.yml
```

No `publish` or `install-check` job, no `environment`, no `id-token`, no `npm publish` in any `run:`. With `release:
false` ci.yml's Sign-off job runs on the pull request's own range, as in the `ci.yml` run (rule `signoff-skip-scope`
unchanged). Cost: the `gates` job runs every ci.yml job again, the mutation gate over the release range (from the
last release, or `gates/release/first-release-base`, to the pull request); the check is not required, so its
duration blocks no merge.

## `ci.yml` change

Adds `on: workflow_call` with inputs `base` (string) and `release` (boolean, default `false`). The jobs that read
`github.event.pull_request.base.sha` for a range base (`mutation-plan`, `mutation-shard`) read `inputs.base ||
github.event.pull_request.base.sha`. The Sign-off job keeps its pull-request range (the pull request's base SHA to
its head SHA, both from `github.event.pull_request`) and gets
`if: ${{ !inputs.release }}` (operator decision PLAN-FRESH-1-001 (a)): on `pull_request` `inputs` is empty, so it always runs there; in `release-dry-run.yml` (`release: false`, a
pull-request event) it runs on the pull request's range; it is skipped only when `release.yml` calls with `release:
true`. A `head` input is not needed: the release run's checkouts default to the tagged commit and only Sign-off read a
head, which the release run skips (PLAN-FRESH-2-002). The unit-test checkouts (`unit-tests-shard`,
`unit-tests-full`) gain `fetch-depth: 0` in US2 (operator decision PLAN-FRESH-2-004 (a)), so the history-reading
gates-integration tests see the whole history. No other change; the pull-request behaviour is otherwise identical.

Test-first (PLAN-FRESH-2-005): `gates/test/ci-workflow.test.ts` is amended first (red) to assert the new
`BASE: ${{ inputs.base || github.event.pull_request.base.sha }}` lines of `mutation-plan` and `mutation-shard`, the
`workflow_call` trigger with its two inputs, the Sign-off `if` and (US2) the two `fetch-depth: 0` lines; then `ci.yml`
changes. Spec 001 `contracts/ci-checks.md` is amended in the same phase as each `ci.yml` change (FR-044): the trigger
line (`pull_request`, and `workflow_call` with inputs `base` and `release`), the Sign-off condition, the mutation
commands' base expression (US3), and the Unit tests checkout (`fetch-depth: 0`, US2).

## `release-workflow` gate

`pnpm run gate:release-workflow [-- --root <dir>]`; `gates/bin/release-workflow.ts`; check **Release workflow**;
plant form `repo-tree`; reads `release.yml`, `release-dry-run.yml`, `ci.yml` and the `release-prepare` action. Rules
(findings `<file>:<line>: release-workflow: <rule>: <message>`): `trigger`, `workflow-permissions`,
`id-token-outside-publish`, `publish-not-in-environment`, `publish-extra-write`, `dry-run-can-publish`,
`unpinned-action`, `persisted-credentials`, `secret-read`, `token-env`, `destructive-npm`, `gates-inputs`,
`prepare-needs-gates`, `publish-needs-prepare`, `install-check-needs-publish`, `publish-builds`, `publish-order`,
`publish-verifies-checksums`, `publish-node-pin`, `node-pin`, `digest-after-pack`, `rehearse-in-prepare`,
`dry-run-via-release-step`, `dry-run-graph`, `signoff-skip-scope`, `release-input-caller`, `file-missing` (exit 2 if a
file does not parse). Rule meanings: research.md R-13. `dry-run-graph` compares `release-dry-run.yml`'s `release-base`,
`gates` and `prepare` with `release.yml`'s step for step and allows exactly three differences: `gates`' `release:
false` (`release.yml`: `true`), `check-tag --no-tag` (`release.yml`: `check-tag`), and the composite-action step
without the `tag` input (`release.yml`: `with: tag: ${{ github.ref_name }}`); the planned pair of files passes it
(`pass-repository`). Plants: one fail plant per rule (among them
`fail-signoff-skipped-on-pr`: the Sign-off job with any other `if`; `fail-publish-rebuilds`: a build step in publish;
`fail-digest-in-artifact`: publish reads digests from a file instead of `needs.prepare.outputs`;
`fail-prepare-no-setup`: `prepare` runs `release-step` with no setup step before it; `fail-bare-dry-run`: the composite
action runs `npm publish --dry-run` itself; `fail-dry-run-graph-drift`: `release-dry-run.yml`'s `prepare` lacks a step
`release.yml`'s has; `fail-dry-run-graph-extra-input`: `release-dry-run.yml`'s composite-action step passes a `with:`
key that `release.yml`'s lacks); pass: `pass-repository`, `pass-local-action` (`uses: ./...` is not a remote action); breaking:
`break-not-yaml`.
