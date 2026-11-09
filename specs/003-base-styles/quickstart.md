# Quickstart: validate the base styles

Prerequisites: the 001 setup (`pnpm run setup:online` or `setup:offline`), the pinned Node and Chromium
(`OCELLE_CHROMIUM_PATH` if the machine needs it).

1. **Build**: `pnpm -r build`. Expect `packages/styles/dist/base.css`, identical to `packages/styles/src/base.css`
   (`cmp`), and `packages/tokens/dist/tokens.css` with the six new tokens (`grep -c -- '--ocelle-line-height-prose'`).
2. **Tests**: `pnpm test`. The `styles`, `styles-browser` and `tokens` projects pass, and the Storybook projects too.
   The browser suite serves the fixtures under `default-src 'none'; script-src 'self'; style-src 'self'; font-src
   'self'` (`page.html`, with its local image, adds `img-src 'self'`) and reports zero violations.
3. **Gates**: `pnpm run gate:style-lint`, `gate:prefix`, `gate:csp`, `gate:contrast`, `gate:brand-rules` and
   `gate:plants` each report no finding. `gate:plants` includes the `style-lint/fail-styles-*-line-height` plants,
   `pass-styles-line-height-token` and the moved `pass-line-height`. `gate:pins` accepts the `@ocelle/tokens` peer
   dependency of `packages/styles/package.json`.
4. **Mutation**: `pnpm run gate:mutation -- --base <base>` has no survivor in `packages/styles/scripts/build.ts`,
   `gates/stylelint/token-only.ts`, `storybook/stories/render.ts` or the changed token files.
5. **By hand**, optional:
   - `pnpm --filter storybook build`, then open `storybook/dist/iframe.html?id=base-styles--prose-document&viewMode=story`.
   - The prose document reads at 1.65 with an 18 px `h2`.
   - At 320 px the wide tables scroll inside their own box.
   - Tab lands on the plain wide table, whose ring shows on all four sides inside its box, and on the link in the
     linked table. The long caption wraps inside the table's visible box, starting at its left edge, and stays in view
     while the table is scrolled with the arrow keys.
