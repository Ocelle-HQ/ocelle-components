# Quickstart: validating the release machinery (030)

Run from the repository root after `pnpm run setup:online`. Contracts: `contracts/`. Steps marked **operator** are
never run by an agent.

## 1. Tarballs (Story 1)

```sh
pnpm run gate:pack-contents
```

Expect one line per package (`@ocelle/tokens@1.0.0: <n> files, <m> entry points`) and exit 0. Plants:
`pnpm run gate:plants -- --affected <base>` locally (CI runs the full plant job).

## 2. Readiness (Story 2)

```sh
pnpm run gate:release-readiness                # every pull request (required check "Release readiness")
pnpm run gate:release-readiness -- --tag v1.0.0  # what the release workflow runs
```

Expect `ready (17/17 rows, 0 secrets, version 1.0.0)`. The gates-integration test runs the gap check against the
pre-018 commit `183b20f` and expects exactly rows 6, 10 and 15 unmet (research.md R-07); another test expects the
history scan of this repository's own `HEAD` to have zero hits (R-08). Both need the full history: they fail on a
shallow clone, and CI's unit-test checkouts use `fetch-depth: 0`.

## 3. Workflow static check and dry run (Story 3)

```sh
pnpm run gate:release-workflow
```

Expect exit 0. On the pull request, `release-dry-run.yml` runs the release's pre-approval job graph: `release-base`,
`gates` (ci.yml through `workflow_call`, `release: false`, no `base`, so mutation covers the pull request's own
range), and `prepare`:
`release-step check-tag --no-tag`, then the composite action without its `tag` input: build, readiness (without
`--tag`), pack, the tarball digests,
pack-contents on the tarballs, `release-step dry-run` (a dry run per tarball not yet on the registry, "already
published, dry run skipped" otherwise), the tarball install rehearsal, and the provenance rehearsal. The check
**Release dry run** is the `verdict` job: green only when `release-base`, `gates` and `prepare` all succeeded. On
today's `main` readiness is not ready, so `gates` fails, `prepare` is skipped and the check is red; a newer push to
the pull request cancels the older run.

## 4. Install check (Story 4)

```sh
node gates/bin/install-check.ts --from-tarballs <dir with the three .tgz>
node gates/bin/install-check.ts --rehearse
```

Both exit 0. `--rehearse` prints six cases (one pass; wrong repository, commit, workflow and ref; a real package with
no provenance), each with its expected and actual rule. After the release: `--version 1.0.0 --repository
Ocelle-HQ/ocelle-components --commit <tag sha>` (workflow and ref default to `release.yml` and `refs/tags/v1.0.0`).

## 5. The release (operator, RELEASING.md)

1. **Operator** confirms O1, O2; creates the `npm-publish` environment with the settings of data-model.md (O4) and
   the `v*` tag ruleset (O5), confirming the agents' GitHub identity is neither the operator's account, a reviewer,
   nor on the bypass list, and adds the agent-side deny rules (research.md R-16); adds the required checks Pack
   contents, Release readiness and Release workflow (O6) once this mission is merged.
2. A pre-tag pull request sets each `1.0.0` changelog date to the release day, empties "Unreleased" and writes
   `gates/release/first-release-base`; the **operator** confirms the date and that its **Release dry run** check is
   green (not red, not skipped), re-runs the failed jobs otherwise, and merges it.
3. **Operator** runs the readiness gate with `--tag v1.0.0` on the release commit.
4. **Operator** bootstraps and configures the trusted publishers (O3, research D1), then within 2 days pushes
   `v1.0.0` (O7).
5. The release workflow runs release-base, gates (mutation over the tagged commit's own changes, or for 1.0.0 from
   `gates/release/first-release-base`), prepare (including the provenance rehearsal), then waits;
   **operator** approves the `npm-publish` deployment.
6. Publish and install check run; **operator** completes O8 (deprecate the placeholder versions, confirm no
   credential remains, re-confirm the O4 and O5 settings, close #11).
7. On a failure, **operator** follows RELEASING.md's failure procedure (research.md R-15): after a partial publish,
   "Re-run failed jobs"; before any publish, delete and re-push the tag through the ruleset bypass, recorded in the
   release issue; after a partial publish a re-run cannot fix, or for a wrong published tarball, never move the tag
   and release lockstep `x.y.z+1` through the version-bump pull request.
