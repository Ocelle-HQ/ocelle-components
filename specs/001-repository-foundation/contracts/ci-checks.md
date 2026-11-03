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
| Plants | `pnpm run gate:plants` | |

Helper jobs of the mutation gate (research.md R-08; listed as `helperJobs` in `gates/gates.json`, not checks that
the ruleset requires):

| Job id | Runs | Checkout and limits |
|---|---|---|
| `mutation-plan` | `pnpm run gate:mutation -- --base ${{ github.event.pull_request.base.sha }} --plan`; outputs the shards (the JSON array on stdout, unchanged; the cut count `--plan` writes to stderr only reaches the job log, research.md R-08) | `fetch-depth: 0` |
| `mutation-shard` | matrix over the plan's shards, skipped when there are none: `pnpm run gate:mutation -- --base ${{ github.event.pull_request.base.sha }} --files <the shard's files>`, the shard's `files` value passed unchanged (its comma-separated entries, `path` or `path:start-end`, research.md R-08) | `fetch-depth: 0`; `timeout-minutes: 10` per shard (FR-013) |

Every job: checkout (`persist-credentials: false`), Node and pnpm from the pins, restore (never save) the pnpm store
and Playwright cache, `pnpm run setup:online`.

Cache warming (research.md R-16; operator decision, plan squad round 3): a second workflow,
`.github/workflows/cache.yml`, trigger `push` to `main`, top-level `permissions: contents: read`, checkout with
`persist-credentials: false`, no secret, every action pinned by commit SHA. One job: Node and pnpm from the pins,
`pnpm run setup:online`, then save the pnpm store under a key from the hash of `pnpm-lock.yaml` and the Playwright
browser cache under a key from the pinned Playwright version, the keys `ci.yml` restores. Pull requests can restore
caches saved on their base branch, so after the first run on `main` every pull request starts with both caches.
It is not a gate, reports no check that the ruleset requires, and the registry check does not read it.

The set of gate jobs (every row of the first table but Plants) equals the gate ids of `gates/gates.json` and the
FR-020 list; the plant job checks this (research.md R-10).

Required checks: a ruleset (or branch protection) on `main` requires the twelve check names of the first table. The
operator configures it in the feature verification (plan.md § Verification); `gates/README.md` lists the same
twelve names. The registry check cannot stop one pull request from removing a gate from `ci.yml`, `gates.json` and
`registry.ts` together; the ruleset does, since the removed check then never reports.
