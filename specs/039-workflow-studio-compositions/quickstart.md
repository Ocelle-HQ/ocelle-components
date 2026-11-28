# Verification Quickstart

## Before a phase

Use the exact committed environment pins and `pnpm install --frozen-lockfile`. Record the full base, select only the real changing tests and implementation-story paths, and verify the phase’s new cases at the intended tests-only red assertions. Retain the same assertions green, then run the canonical phase replay.

## Run the three proof layers

1. Run `pnpm run gate:unit-tests --project storybook-browser storybook/test/unit/browser/workflow-studio.test.ts`. Exercise real controls and the host transitions in the named phase. Run its scoped host preflight and normal Mutation result with the same base and candidate.
2. Run `pnpm run gate:unit-tests --project storybook-integration storybook/test/integration/workflow-studio.test.ts`. Read the actual built index before reaching the story’s iframe. Verify actions and focus with real keyboard and tap, the narrow layout, local-only requests and fixture markup. Include a representative forced-colour path.
3. Run `pnpm run gate:unit-tests --project elements-browser packages/elements/test/browser/workflow-studio.test.ts` on the existing packaged browser setup. In each phase exercise the specified composed interaction with the same shared runtime host and clean fixture result. Verify `pnpm run gate:csp` separately.
4. Run `pnpm run gate:storybook-build`, record the exact final IDs and reconcile actual inventory and targeted Plant expectations. Follow the repository's scoped visual mode only if the candidate's CLI supports it. Otherwise use the full pinned harness. Keep the measured artifacts. Run `pnpm run gate:visual`, `pnpm run gate:axe` and `pnpm run gate:plants -- --affected <full-phase-base-sha>` against the exact candidate.

The authoring test checks a delivered request and rollback while preserving semantic state during movement. The run test checks both the original and multiline failed saves, one successful answer and the later review. The catalog test compares both pins and reviewers before, during and after the accepted action. All three tests check reachable focus and distinguish the documented state changes.

Reconcile the inventory and review both the historical phase evidence and current-main checks before landing. Keep all required CI.
