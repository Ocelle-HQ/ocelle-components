# Verify a workflow node

Set up the pinned toolchain and Chromium using the repository’s documented setup. Start with the focused component tests once the phase tasks add them.

```sh
pnpm exec vitest run --project elements --project elements-browser packages/elements/test/workflow-node.test.ts packages/elements/test/browser/workflow-node.test.ts
pnpm run gate:manifest
pnpm run gate:csp
pnpm run gate:storybook-build
```

1. Open the Security review and planning examples and their first-phase baselines in both themes. Check the exact title, kind, role and outcome order. Click the review step and activate it with Enter and Space. Rename it on the same mount and compare the selection identifiers. Record the request and native click through an ancestor listener and verify the request's host target, flags, payload, order and count. Replace the pressed mount with a distinct keyed node before release. Check that the interrupted gesture produces zero requests for the replacement and a fresh activation produces one.
2. Tab forward and back through two nodes with focus sentinels. Remove one action from sequential order through the host setting, focus it directly and activate it, then restore it to the tab order. Check that only intentional activation requests selection.
3. In the narrow wrapping fixture, measure both dimensions of the actual selection button against `--ocelle-target-min`. Focus a selected, waiting and invalid step in both themes and verify text and non-text contrast against the actual grounds. Repeat in forced colors and check the visible control boundary, focus indicator and state text. Inspect the computed accessible name and description and the full outcome labels. Add host naming and description context and `aria-current="step"`, then replace and remove the attributes. Verify the resulting name, description and current-step state on the inner button while its full title and built-in description stay available.
4. In the run inspection example, read the supplied status, select the node and compare the original step data and outcomes before and after activation.
5. Before red proof for any phase with changed test support, list its complete runnable local consumers in `reviews/phase-N/test-scope.txt`. Run each phase’s replay and compare the selected project and file identities to that list. Repeat without changes and verify the same identities and the reuse flags. Keep in-process assertions in `elements` for mutation coverage and exercise the matching consumer paths under built strict CSP. Record the actual local scope and timing separately from the full required CI verdict. If you cannot establish the consumers, retain the full-suite fallback.

Follow the normal gate commands for mutation, Plants, visual regression and accessibility. Use the PR’s required checks to verify the complete test inventory and gates on the final revision. [Specification](spec.md) · [Contract](contracts/workflow-node.md)

## Keyed collection

In a Lit host, use the step ID as the key. Other renderers should use their equivalent keyed collection. Changing `step.title` for an existing ID updates its existing node. A different ID mounts a new node.

```ts
repeat(steps, step => step.id, step => html`
  <ocelle-workflow-node .nodeId=${step.id} .label=${step.title}></ocelle-workflow-node>
`)
```
