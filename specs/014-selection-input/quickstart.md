# Quickstart: validating 014

Prerequisites: #10 (Storybook workbench) merged into the branch (operator decision Q3 (c)). Task T001 does this: the
implementer merges `origin/main` (`3828d2f` or later) as one recorded merge commit before phase 1's base (before
`base.sh 1`, an exception to `/speckit-story-implement`'s step 2 for phase 1 only), then rechecks the plan (operator
decisions Q1 (a) and, second analysis, Q1 (b); plan.md "How #10 reaches this branch", "Who merges, and when"). Then `pnpm install --frozen-lockfile`;
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
4. Storybook (#10's gates): `pnpm run gate:storybook-build`; `pnpm run visual:update` in the pinned container under
   docker writes the light and dark baselines of every new story (and of any shared story, the token stories
   included, whose pixels change), then `pnpm run gate:visual` → every capture matches its baseline; `pnpm run
   gate:axe` → 0 serious or critical findings other than the scrolling listbox story's excepted clipped options
   (FR-051; no other exception entry is added). Operator decisions 2026-11-14 in `reviews/phase-2/operator-decisions.md`
   (FR-053, SC-007). No podman cross-engine check is possible in this session: record that in the phase's notes; CI
   runs both engines and confirms the baselines at landing. Baseline PNGs that conflict after a merge are regenerated
   with `pnpm run visual:update`, never hand-picked.
5. Other gates, one at a time: `gate:typecheck`, `gate:lint`, `gate:test-lint`, `gate:style-lint`, `gate:brand-rules`
   (the checked brand rules of constitution II; the copy field uses tabular figures, not monospace), `gate:unit-tests`,
   `gate:signoff` (DCO), `gate:pins`, `gate:config-copies`, `gate:contrast` (with `color-accent-strong`'s new pairs on
   the main grounds, research R-17), `gate:manifest`, `gate:csp`, `gate:prefix`, `gate:plants` → exit 0;
   `pnpm exec vitest run --project gates` passes with the updated pair counts and the `elements-browser-file` configuration test.
6. Mutation of a phase: `pnpm run gate:mutation -- --base <phase base>` → no survivor without a recorded reason
   (Timeout, CompileError and zero-mutant lines are reports, #23).
7. By hand (optional): serve `packages/elements/test/browser/fixtures/listbox.html` under the strict CSP and walk the
   listbox with the keyboard; no console message.
