# Quickstart: validate 013

Prerequisites: the repository installed offline (`pnpm run setup:offline`), with Chromium from the container
(`OCELLE_CHROMIUM_PATH` as the elements README says), and docker or podman able to run #10's pinned linux/amd64 image
(`storybook/visual/container.json`; in this container, docker with its daemon started as root). Run one heavy job at
a time.

1. `pnpm --filter @ocelle/elements run build`, then `pnpm --filter @ocelle/elements run manifest`. The manifest is
   unchanged against the commit (`git diff --exit-code packages/elements/custom-elements.json`).
2. Run the `elements` project with `pnpm exec vitest run --project elements`. Every US1 to US3 scenario body passes in
   process (US1-13 to US1-19 for `layout="grid"`, US2-10 and US2-11 for the eyebrow and the body, the progress
   fallback-text and inline bodies included), and the driver additions' own tests pass.
3. Run the `elements-browser` project with `pnpm exec vitest run --project elements-browser`. The same bodies pass on
   the built browser build under the strict CSP, with zero violations and no outside request.
4. Run the `@ocelle/styles` tests with `pnpm exec vitest run --project styles --project styles-browser`, and the
   node and build tests of the elements package with `--project elements-node --project elements-build`. The
   compact-region facts hooks, the pre-upgrade facts rule, the README statements (the input decisions' statements,
   IQ-01 to IQ-15, included), the container import rule and the progress pairing test pass.
5. Run `pnpm run gate:contrast`, `gate:style-lint`, `gate:prefix`, `gate:csp` (after building the packages),
   `gate:manifest`, `gate:test-lint`, and `gate:mutation` with the phase base. Each exits 0. The `style-lint` plants, including the R-10 allowance's, behave
   as declared (`pnpm run gate:plants`).
6. Build the Storybook and run the story test with `pnpm exec vitest run --project storybook-integration`. The facts,
   empty-state and progress stories render in light and dark (the facts grid stories, the empty state's eyebrow and
   several-paragraph stories included); every facts story, grid included, has no horizontal scroll at 320 px;
   no story has a running animation under reduced motion; every progress bar in a story is named.
7. Run #10's gates (contracts in `specs/006-storybook-workbench/contracts/gates.md`): `pnpm run gate:storybook-build`
   exits 0 with the new stories built; `pnpm run gate:visual` reports every capture matching its committed baseline
   (`storybook/baselines/<story-id>.<theme>.png`, light and dark, no `missing-baseline` or `stray-baseline`);
   `pnpm run gate:axe` reports 0 serious or critical, with no `storybook/a11y-exceptions.json` entry for these
   stories.

Expected: the spec's SC-002 to SC-007 hold. SC-001 is checked in review: the README mapping covers every variant of
the operator-supplied inventory in research R-11.

The spike behind the design decisions can be rerun from [spike/](spike/) (see `spike/RESULTS.md`).
