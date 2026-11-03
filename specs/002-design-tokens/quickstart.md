# Quickstart: validating Design Tokens (002)

Prerequisites: the pinned Node and pnpm, `pnpm run setup:online` once (Chromium for Playwright).

1. **Build**: `pnpm -r build` → `packages/tokens/dist/` has `tokens.css`, `tokens.json`, `index.js`, `fonts/`;
   `storybook/dist/` has the built Storybook (externalised scripts and styles). The build makes no network request
   (Storybook telemetry is disabled). The tests below do not need this step.
2. **Tests**: `pnpm test` (no prior build) → the `tokens` project runs the source, source-table (generator output
   from the real source against the Appendix A table), generator and resolver (fixture sources), build,
   JSON-agreement, font-checksum, README and mapping tests; the `tokens-browser` project runs the Playwright browser
   tests on generator output that each suite writes to a temporary directory inside the test worker (six theme
   conditions against the Appendix A table, attribute removal, used values at 1280 × 800, reduced motion, platform
   font, tabular figures, requests, CSP with and without `font-src`, each suite's control violation reported); the
   `gates` project includes the test that the required pair set equals A.8; the `storybook` project runs the
   externalise, swatches, telemetry and scope unit tests; the `storybook-integration` project builds Storybook into a
   temporary directory and runs the CSP test under the Storybook page's header (constitution IV plus `font-src`,
   `connect-src`, `frame-src` `'self'`; research R-10). Expected: all pass. `pnpm run gate:mutation` (Stryker) skips
   `tokens-browser`, `storybook-integration` and `gates-integration`.
3. **Gates**: `pnpm run gate:contrast` → `contrast: 158 pairs checked in light, 157 in dark (149 required per
   theme)`; `pnpm run gate:brand-rules` → `brand-rules: 7 rules checked`; `pnpm run gate:style-lint`,
   `pnpm run gate:csp`, `pnpm run gate:prefix` pass (Storybook inputs and HTML entries only; bundles are
   left to the run-time test, FR-023).
4. **Plants**: `pnpm run gate:plants` → every plant of contracts/gates.md gives its expected outcome; the registry,
   CI jobs and FR-020 list match.
5. **Manual look**: open `storybook/dist/index.html` from a static server with the Storybook page's CSP header of
   research R-10 and switch the theme toolbar; each group story lists its tokens; the browser console shows no CSP violation.
6. **Records**: `THIRD_PARTY_NOTICES` lists the font; `packages/tokens/README.md` states the host contract and
   `font-src 'self'`; `packages/tokens/CHANGELOG.md` lists the added tokens;
   `gates/README.md` has no "Contrast check" deferral.

Contracts: [token-package.md](contracts/token-package.md), [gates.md](contracts/gates.md). Data:
[data-model.md](data-model.md).
