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
| Mutation testing | `pnpm run gate:mutation -- --base ${{ github.event.pull_request.base.sha }}` | `fetch-depth: 0`; `timeout-minutes: 10` |
| Content security | `pnpm -r build && pnpm run gate:csp` | |
| Prefix | `pnpm -r build && pnpm run gate:prefix` | |
| Story config copies | `pnpm run gate:config-copies` | |
| Install and pins | `pnpm run gate:pins` | |
| Sign-off | `pnpm run gate:signoff -- --range ${{ github.event.pull_request.base.sha }}..${{ github.event.pull_request.head.sha }}` | `fetch-depth: 0` |
| Plants | `pnpm run gate:plants` | |

Every job: checkout (`persist-credentials: false`), Node and pnpm from the pins, restore the pnpm store and
Playwright cache, `pnpm run setup:online`.

The set of gate jobs (every row but Plants) equals the gate ids of `gates/gates.json` and the FR-020 list; the plant
job checks this (research.md R-10).
