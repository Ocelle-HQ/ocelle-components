# Quickstart: validating 014

Prerequisites: #10 (Storybook workbench) merged into the branch (operator decision Q3 (c)). Task T001 does this: it
merges `origin/main` (`3828d2f` or later) as one recorded merge commit before phase 1's base, then rechecks the plan
(operator decision Q1 (a), plan.md "How #10 reaches this branch"). Then `pnpm install --frozen-lockfile`;
`export OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` in this container (CI uses
Playwright's own Chromium). Run one heavy job at a time.

1. Build: `pnpm -r build` → `packages/elements/dist/` holds one module per new element
   (`ocelle-listbox.js`, `ocelle-option.js`, `ocelle-tabs.js`, `ocelle-tab.js`, `ocelle-tab-panel.js`,
   `ocelle-segmented-choice.js`, `ocelle-segment.js`, `ocelle-copy-field.js`, `ocelle-link.js`) and
   `dist/browser/ocelle-elements.js` defines all of them. A parent's module also defines its children and
   `ocelle-copy-field.js` defines `ocelle-icon` (contracts/elements.md § Entry points).
2. Element tests: `pnpm exec vitest run --project elements --project elements-node --project elements-build
   --project elements-browser` (and `--project elements-browser-file` from phase 6) — all pass. The pure-module
   tests (`test/roving.test.ts`, `test/selection.test.ts`, `test/link-target.test.ts`) run in `elements`.
3. Manifest: `pnpm --filter @ocelle/elements run manifest && git diff --exit-code packages/elements/custom-elements.json`;
   `pnpm run gate:manifest` → exit 0 (contracts/elements.md).
4. Storybook (#10's gates): `pnpm run gate:storybook-build`, `pnpm run gate:visual` (pinned container; light and dark
   baselines for every new story match), `pnpm run gate:axe` → 0 serious or critical.
5. Other gates, one at a time: `gate:typecheck`, `gate:lint`, `gate:test-lint`, `gate:style-lint`, `gate:brand-rules`
   (the checked brand rules of constitution II; the copy field uses tabular figures, not monospace), `gate:unit-tests`,
   `gate:signoff` (DCO), `gate:pins`, `gate:config-copies`, `gate:contrast` (with `color-accent-strong`'s new pairs on
   the main grounds, research R-17), `gate:manifest`, `gate:csp`, `gate:prefix`, `gate:plants` → exit 0;
   `pnpm exec vitest run --project gates` passes with the updated pair counts and the `elements-browser-file` configuration test.
6. Mutation of a phase: `pnpm run gate:mutation -- --base <phase base>` → no survivor without a recorded reason
   (Timeout, CompileError and zero-mutant lines are reports, #23).
7. By hand (optional): serve `packages/elements/test/browser/fixtures/listbox.html` under the strict CSP and walk the
   listbox with the keyboard; no console message.
