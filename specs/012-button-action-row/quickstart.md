# Quickstart: validating 012

Prerequisites: `pnpm run setup:offline`; in this container `export OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`
(CI installs Playwright's own build). Run one heavy job at a time.

1. Build: `pnpm -r build` — `packages/elements/dist/ocelle-button.js`, `dist/ocelle-action-row.js` and the browser
   build defining both.
2. Element tests: `pnpm vitest run --project elements --project elements-browser` — every scenario of
   [spec.md](spec.md) US1 to US5 passes in both harnesses; the fixture runs report zero CSP violations.
3. Tokens: `pnpm vitest run --project tokens --project tokens-browser` and `pnpm run gate:contrast` — the rows of
   [research.md](research.md) R-08 pass in both themes.
4. Gates: `pnpm run gate:manifest`, `gate:style-lint`, `gate:csp`, `gate:prefix`, `gate:pins`, `gate:test-lint`, then
   `pnpm run gate:mutation -- --base <phase base>`.
5. Stories: `pnpm vitest run --project storybook-integration` — the new stories render in light and dark.
6. With #10 merged: `pnpm run visual:update` in the pinned container, then the visual and axe gates (see
   [contracts/checks.md](contracts/checks.md) § With #10).

Manual check (optional): open the Storybook, Tab through the button and row stories, press Enter and Space, and read
them with a screen reader; the interface is in [contracts/elements-package.md](contracts/elements-package.md).
