# Quickstart: validate the overlays

Prerequisites: the repository installed (`pnpm run setup:offline`), Chromium as in `knowledge/speckit-flows/findings/
frontend-missions.md`. For stories and baselines: #10 merged and its pinned container available.

1. `pnpm run gate:typecheck && pnpm run gate:lint && pnpm run gate:style-lint`: all pass.
2. `pnpm vitest run --project elements --project elements-browser`: the scenarios of
   [contracts/checks.md § Test matrix](contracts/checks.md) pass in both harnesses.
3. `pnpm vitest run --project tokens`: the three new tokens validate and are listed in the README and CHANGELOG.
4. `pnpm run gate:manifest`: the committed manifest matches a regeneration.
5. `pnpm run gate:csp && pnpm run gate:prefix && pnpm run gate:contrast && pnpm run gate:brand-rules`: all pass.
6. `pnpm run gate:mutation`: no survivor on changed lines. Read the Timeout report lines (R-15).
7. After #10: `pnpm run gate:storybook-build && pnpm run gate:visual && pnpm run gate:axe`. Every dialog, drawer and
   tooltip story has baselines in light and dark, and axe reports no serious or critical finding.

By hand, in the built Storybook:

- Open the Open project dialog story. Tab cycles inside it, Escape closes it, and focus returns to the page.
- Open the tooltip-in-dialog story. The first Escape hides the bubble and the second closes the dialog.
