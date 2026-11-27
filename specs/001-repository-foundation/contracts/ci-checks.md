# Contract: CI checks (FR-020)

Workflow `.github/workflows/ci.yml`, trigger `pull_request`, every action pinned by commit SHA. One job per row; the
job name is the check name.

Security (research.md R-16):

- top-level `permissions: contents: read`, and no other permission at workflow or job level;
- every `actions/checkout` step sets `persist-credentials: false`;
- no job references a secret (`secrets.*`), including `GITHUB_TOKEN` beyond checkout's own use.

| Check | Job runs | Checkout and limits |
|---|---|---|
| Typecheck | `pnpm run gate:typecheck` | |
| Code lint | `pnpm run gate:lint` | |
| Style lint | `pnpm run gate:style-lint` | |
| Unit tests | `pnpm run gate:unit-tests` | |
| Test lint | `pnpm run gate:test-lint` | |
| Mutation testing | verdict job `mutation`: `needs: [mutation-plan, mutation-shard]`, `if: always()`; passes only when `mutation-plan` succeeded and `mutation-shard` succeeded, or was skipped because the plan had zero shards (research.md R-08) | |
| Content security | `pnpm -r build && pnpm run gate:csp` | |
| Prefix | `pnpm -r build && pnpm run gate:prefix` | |
| Story config copies | `pnpm run gate:config-copies` | |
| Install and pins | `pnpm run gate:pins` | |
| Sign-off | `pnpm run gate:signoff -- --range ${{ github.event.pull_request.base.sha }}..${{ github.event.pull_request.head.sha }}` | `fetch-depth: 0` |
| Contrast | `pnpm run gate:contrast` (job id `contrast`; since 002) | |
| Brand rules | `pnpm run gate:brand-rules` (job id `brand-rules`; since 002) | |
| Custom-elements manifest | `pnpm run gate:manifest` (job id `manifest`; since 005) | |
| Storybook build | `pnpm run gate:storybook-build` (job id `storybook-build`; since 006) | |
| Visual regression | `pnpm run gate:visual -- --engine both --remove-docker-image` (job id `visual`; since 006); then the pin record step, uploaded as the artifact `pin-record`, and on failure the artifact `visual` (`storybook/.visual/`) (006 contracts/gates.md § The registry) | |
| Accessibility | `pnpm run gate:axe` (job id `axe`; since 006) | |
| Sandbox paths | `pnpm run gate:sandbox-paths` (job id `sandbox-paths`; since op 023); binary files are skipped by content alone, so no `.gitattributes` exempts a file (op 023 operator round 4) | |
| Pack contents | `pnpm run gate:pack-contents` (job id `pack-contents`; since 030): builds the three packages, packs each with `pnpm pack` and checks every tarball against `gates/release/pack-manifest.json` (030 contracts/pack-contents-gate.md) | |
| Plants | verdict job `plants`: `needs: [plants-plan, plants-shard]`, `if: always()`; downloads every `plant-shard-*` artifact into `storybook/.visual/plant-shards/` (`actions/download-artifact` pinned by SHA, `merge-multiple`) and runs `pnpm run gate:plants -- --verdict storybook/.visual/plant-shards` (since 006; 006 contracts/gates.md § The registry) | |

Helper jobs of the mutation gate (research.md R-08; listed as `helperJobs` in `gates/gates.json`) and of the plant job
(since 006; listed as `plantHelperJobs` in `gates/lib/registry.ts`, 006 contracts/gates.md § The registry), not checks
that the ruleset requires:

| Job id | Runs | Checkout and limits |
|---|---|---|
| `mutation-plan` | `pnpm run gate:mutation -- --base ${{ github.event.pull_request.base.sha }} --plan`; outputs the shards (the JSON array on stdout, unchanged; the cut count `--plan` writes to stderr only reaches the job log, research.md R-08) | `fetch-depth: 0` |
| `mutation-shard` | matrix over the plan's shards, skipped when there are none: `pnpm run gate:mutation -- --base ${{ github.event.pull_request.base.sha }} --files <the shard's files>`, the shard's `files` value passed unchanged (its comma-separated entries, `path` or `path:start-end`, research.md R-08) | `fetch-depth: 0`; `timeout-minutes: 10` per shard, or 75 for a shard with a `packages/elements/src/` entry (op 015, 2026-11-15; FR-013 amendment; mission 010 operator rounds 6 and 8, 2026-11-18) |
| `plants-plan` | `pnpm --silent run gate:plants -- --plan`, the shard numbers as the job output `shards` (since 006) | |
| `plants-shard` | matrix `shard: ${{ fromJSON(needs.plants-plan.outputs.shards) }}`, `fail-fast: false`; `df -h /`; the toolset removal step with `df -h /`; `pnpm run gate:plants -- --shard "$SHARD"` with `SHARD` from the matrix and `OCELLE_VISUAL_ENGINE=both`; `df -h /` always; uploads `plant-shard-<k>` (`storybook/.visual/plant-shards/<k>.json`) always and `plants-<k>` (`storybook/.visual/plants/`) on failure (since 006) | |

Every job: checkout (`persist-credentials: false`), Node and pnpm from the pins, restore (never save) the pnpm store
and Playwright cache, `pnpm run setup:online`.

Cache warming (research.md R-16; operator decision, plan squad round 3): a second workflow,
`.github/workflows/cache.yml`, trigger `push` to `main`, top-level `permissions: contents: read`, checkout with
`persist-credentials: false`, no secret, every action pinned by commit SHA. One job: Node and pnpm from the pins,
`pnpm run setup:online`, then save the pnpm store under a key from the hash of `pnpm-lock.yaml` and the Playwright
browser cache under a key from the pinned Playwright version, the keys `ci.yml` restores. Pull requests can restore
caches saved on their base branch, so after the first run on `main` every pull request starts with both caches.
It is not a gate, reports no check that the ruleset requires, and the registry check does not read it.

The set of gate job ids (one per row of the first table but Plants; for Mutation testing the verdict job `mutation`,
not its helper jobs) equals the gate ids of `gates/gates.json` and the FR-020 list `fr020` of `gates/lib/registry.ts`:
the eleven gates of this feature's FR-020 plus `contrast` and `brand-rules` of 002 FR-020, `manifest` of 005
FR-009, `storybook-build`, `visual` and `axe` of 006 FR-020, `sandbox-paths` of op 023, and `pack-contents` of 030 FR-006, nineteen in all. The plant job
checks this (research.md R-10).

Required checks: a ruleset (or branch protection) on `main` requires the twenty check names of the first table. The
operator configures it in the feature verification (plan.md § Verification); `gates/README.md` lists the same
twenty names. The registry check cannot stop one pull request from removing a gate from `ci.yml`, `gates.json` and
`registry.ts` together; the ruleset does, since the removed check then never reports.

Mission 002 (specs/002-design-tokens, note of 2026-11-04, landing review L1-02 of PR #19): 002 FR-020 added the
`Contrast` and `Brand rules` checks, so the first table has fourteen rows (it had twelve). The ruleset on `main` must
add the two check names `Contrast` and `Brand rules`; until the operator does so, neither gate blocks a merge
(`gates/README.md` § Required checks on `main`).

Mission 005 (specs/005-icons-brand-mark, note of 2026-11-12, landing review L1-01 of PR #26, operator round OP2-01):
005 FR-009 added the `Custom-elements manifest` check, so the first table has fifteen rows. The ruleset on `main` must
add the check name `Custom-elements manifest`; until the operator does so, the gate does not block a merge
(`gates/README.md` § Required checks on `main`).

Mission 006 (specs/006-storybook-workbench, note of 2026-11-13, landing review L1-01 of PR #24, operator round
`reviews/phase-5/round-2.md` O2-02): 006 FR-020 added the `Storybook build`, `Visual regression` and `Accessibility`
checks, so the first table has eighteen rows. The ruleset on `main` must add the three check names `Storybook build`,
`Visual regression` and `Accessibility`; until the operator does so, none of the three gates blocks a merge
(`gates/README.md` § Required checks on `main`).

Op 023 (ops/023-public-repo-hygiene, note of 2026-11-20, #60): op 023 added the `Sandbox paths` check, so the first
table has nineteen rows. The ruleset on `main` must add the check name `Sandbox paths`; until the operator does so,
the gate does not block a merge (`gates/README.md` § Required checks on `main`).

Mission 030 (specs/030-release-v1, US1, FR-006, FR-044): 030 added the `Pack contents` check, so the first table has
twenty rows. The ruleset on `main` must add the check name `Pack contents` (030 operator step O6); until the operator
does so, the gate does not block a merge (`gates/README.md` § Required checks on `main`).
