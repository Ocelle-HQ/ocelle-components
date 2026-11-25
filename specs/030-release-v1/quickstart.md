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
pnpm run gate:release-readiness                # every pull request
pnpm run gate:release-readiness -- --tag v1.0.0  # what the release workflow runs
```

Expect `ready (17/17 rows, 0 secrets, version 1.0.0)`. On `main` before mission 018 the first form reports rows 6,
10 and 15 unmet (data-model.md).

## 3. Workflow static check and dry run (Story 3)

```sh
pnpm run gate:release-workflow
```

Expect exit 0. The **Release dry run** check on the pull request (or a manual dispatch of
`release-dry-run.yml`) runs the composite action: build, pack, pack-contents on the tarballs, `npm publish
--dry-run` per tarball, the tarball install rehearsal, and the provenance rehearsal.

## 4. Install check (Story 4)

```sh
node gates/release/install-check.ts --from-tarballs <dir with the three .tgz>
node gates/release/install-check.ts --rehearse
```

Both exit 0. After the release: `--version 1.0.0 --repository Ocelle-HQ/ocelle-components --commit <tag sha>`.

## 5. The release (operator, RELEASING.md)

1. **Operator** confirms O1, O2; creates the `npm-publish` environment (O4) and the `v*` tag ruleset (O5); adds the
   required checks (O6) once this mission is merged.
2. **Operator** runs the readiness gate with `--tag v1.0.0` on the release commit.
3. **Operator** bootstraps and configures the trusted publishers (O3, research D1), then within 2 days pushes
   `v1.0.0` (O7).
4. The release workflow runs gates, prepare, then waits; **operator** approves the `npm-publish` deployment.
5. Publish and install check run; **operator** completes O8 (deprecate the placeholder versions, confirm no
   credential remains, close #11).
