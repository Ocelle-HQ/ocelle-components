# Verify a workflow node

Set up the pinned toolchain and Chromium using the repository’s documented setup. Start with the focused component tests once the phase tasks add them.

```sh
pnpm exec vitest run --project elements --project elements-browser packages/elements/test/workflow-node.test.ts packages/elements/test/browser/workflow-node.test.ts
pnpm run gate:manifest
pnpm run gate:csp
pnpm run gate:storybook-build
```

1. Open the Security review and planning examples in both themes. Check the exact title, kind, role and outcome order. Click the review step and activate it with Enter and Space. Rename it between runs and compare the selection identifiers.
2. Tab forward and back through two nodes with focus sentinels. Remove one action from sequential order through the host setting, focus it directly and activate it, then restore it to the tab order. Check that only intentional activation requests selection.
3. In forced colors and a narrow layout, focus a selected, waiting and invalid step. Verify the visible focus and state text and inspect the accessible name, description and full outcome labels.
4. In the run inspection example, read the supplied status, select the node and compare the original step data and outcomes before and after activation.
5. Run each phase’s focused replay with the story extension and repeat it without changes. Record the proof outcomes and reuse separately from the full required CI verdict.

Follow the normal gate commands for mutation, Plants, visual regression and accessibility. Use the PR’s required checks to verify the complete test inventory and gates on the final revision. [Specification](spec.md) · [Contract](contracts/workflow-node.md)
