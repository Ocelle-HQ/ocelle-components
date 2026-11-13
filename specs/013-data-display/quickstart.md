# Quickstart: validate 013

Prerequisites: the repository installed offline (`pnpm run setup:offline`), with Chromium from the container
(`OCELLE_CHROMIUM_PATH` as the elements README says). Run one heavy job at a time.

1. `pnpm --filter @ocelle/elements run build`, then `pnpm --filter @ocelle/elements run manifest`. The manifest is
   unchanged against the commit (`git diff --exit-code packages/elements/custom-elements.json`).
2. Run the `elements` project with `pnpm exec vitest run --project elements`. Every US1 to US3 scenario body passes in
   process, and the driver additions' own tests pass.
3. Run the `elements-browser` project with `pnpm exec vitest run --project elements-browser`. The same bodies pass on
   the built browser build under the strict CSP, with zero violations and no outside request.
4. Run the `@ocelle/styles` tests with `pnpm exec vitest run --project styles --project styles-browser`, and the
   node and build tests of the elements package with `--project elements-node --project elements-build`. The
   compact-region facts hooks, the pre-upgrade facts rule, the README statements, the container import rule and the
   progress pairing test pass.
5. Run `pnpm run gate:contrast`, `gate:style-lint`, `gate:prefix`, `gate:csp`, `gate:manifest`, `gate:test-lint`, and
   `gate:mutation` with the phase base. Each exits 0. The `style-lint` plants, including the R-10 allowance's, behave
   as declared (`pnpm run gate:plants`).
6. Build the Storybook and run the story test with `pnpm exec vitest run --project storybook-integration`. The facts,
   empty-state and progress stories render in light and dark; every facts story has no horizontal scroll at 320 px;
   no story has a running animation under reduced motion; every progress bar in a story is named.
7. When #10 is on `main`, run `pnpm run gate:visual` and `pnpm run gate:axe` (contracts in
   `specs/006-storybook-workbench/contracts/gates.md`). There is no serious or critical finding, and the baselines are
   committed from the pinned container.

Expected: the spec's SC-002 to SC-007 hold. SC-001 is checked in review against the README mapping.

The spike behind the design decisions can be rerun from [spike/](spike/) (see `spike/RESULTS.md`).
