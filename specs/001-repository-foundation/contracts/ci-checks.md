# Contract: CI checks (FR-020)

Workflow `.github/workflows/ci.yml`, trigger `pull_request`, every action pinned by commit SHA. One job per row; the
job name is the check name.

| Check | Job runs | Limits |
|---|---|---|
| Typecheck | `pnpm run gate:typecheck` | |
| Code lint | `pnpm run gate:lint` | |
| Style lint | `pnpm run gate:style-lint` | |
| Unit tests | `pnpm run gate:unit-tests` | |
| Test lint | `pnpm run gate:test-lint` | |
| Mutation testing | `pnpm run gate:mutation` (base: the pull request's base branch) | `timeout-minutes: 10` |
| Content security | `pnpm -r build && pnpm run gate:csp` | |
| Prefix | `pnpm -r build && pnpm run gate:prefix` | |
| Story config copies | `pnpm run gate:config-copies` | |
| Install and pins | `pnpm run gate:pins` | |
| Sign-off | `pnpm run gate:signoff -- --range origin/$BASE..HEAD` | full history fetch |
| Plants | `pnpm run gate:plants` | |

Every job: checkout, Node and pnpm from the pins, restore the pnpm store and Playwright cache, `pnpm run
setup:online`.
