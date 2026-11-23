# Phase 1 setup verification

The repository pins Node 26.13.0 and pnpm 12.16.1. Set those versions on PATH before running the commands from the checkout root.

```sh
node --version
pnpm --version
pnpm run setup:online
pnpm run setup:offline
pnpm exec playwright --version
pnpm gate:typecheck
pnpm gate:lint
pnpm gate:test-lint
pnpm exec vitest run --project tokens --maxWorkers 1
pnpm exec vitest run --project elements packages/elements/test/personal-rail.test.ts
pnpm test
```

The Node release archive matched the published SHA-256 checksum. The frozen online install and the offline setup both succeeded. Playwright 1.64.1 launched its pinned Chromium revision 1248 and reported browser version 156.0.8078.4. Typecheck, lint and test lint passed. All 166 token tests and all 28 Chromium personal-rail tests passed.

In this workspace, `source /workspace/work/ocelle-toolchain/env.sh` sets the pinned tools and shared package and browser caches for the checkout and detached review worktrees.
