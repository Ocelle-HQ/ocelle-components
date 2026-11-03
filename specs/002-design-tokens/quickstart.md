# Quickstart: validating Design Tokens (002)

Prerequisites: the pinned Node and pnpm, `pnpm run setup:online` once (Chromium for Playwright).

1. **Build**: `pnpm -r build` → `packages/tokens/dist/` has `tokens.css`, `tokens.json`, `index.js`, `fonts/`;
   `storybook/dist/` has the built Storybook (externalised scripts and styles).
2. **Tests**: `pnpm test` → the `tokens` project runs the source, generator, JSON-agreement, font-checksum and
   mapping tests and the Playwright browser tests (six theme conditions, attribute removal, reduced motion, font use,
   tabular figures, requests, CSP with and without `font-src`); the Storybook CSP test runs the built Storybook under
   the constitution's CSP header. Expected: all pass.
3. **Gates**: `pnpm run gate:contrast` → `contrast: 134 pairs checked in light, 133 in dark (130 required per
   theme)`; `pnpm run gate:brand-rules` → `brand-rules: 7 rules checked`; `pnpm run gate:style-lint`,
   `pnpm run gate:csp`, `pnpm run gate:prefix` pass.
4. **Plants**: `pnpm run gate:plants` → every plant of contracts/gates.md gives its expected outcome; the registry,
   CI jobs and FR-020 list match.
5. **Manual look**: open `storybook/dist/index.html` from a static server with the CSP header of research R-03 and
   switch the theme toolbar; each group story lists its tokens; the browser console shows no CSP violation.
6. **Records**: `THIRD_PARTY_NOTICES` lists the font; `packages/tokens/CHANGELOG.md` lists the added tokens;
   `gates/README.md` has no "Contrast check" deferral.

Contracts: [token-package.md](contracts/token-package.md), [gates.md](contracts/gates.md). Data:
[data-model.md](data-model.md).
