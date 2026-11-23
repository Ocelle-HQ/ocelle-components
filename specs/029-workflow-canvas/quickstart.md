# Workflow canvas verification guide

On branch `029-workflow-canvas`, use the Node and pnpm versions pinned by the repository. Install from the existing toolchain cache with `pnpm run setup:offline`, or initialize it using the repository's documented online setup. The feature lives under `specs/029-workflow-canvas`. Run the following after their corresponding paths have landed in the phase.

## Exercise a controlled host

1. Start Storybook with `pnpm --dir storybook exec storybook dev`. Open Workflow Canvas and begin with Initial review, Publish and Revise. Tabs cross the node group once in each direction. With the group focused, arrows follow the supplied visible order and Enter or Space requests one selection.
2. Request an offscreen node by name. In a host that withholds the viewport, focus stays on the reveal control. Echo a viewport that reveals the latest requested node and verify its native action receives focus. Try two reveals before either update and move focus away in a separate run.
3. Drag a node with an incoming and outgoing edge with a translated viewport at scale two. Its edges track the preview. Accept one move, reject another, then position it without dragging. Pan, zoom in, zoom out and Fit using the named controls.
4. Connect a named outcome by pointer, reassign by keyboard and disconnect by tap. Repeat the entire sequence for each input method. The host logs the operation and exact stable IDs and can reject a reassignment. During an edit, change its current destination in the host or switch to read-only and inspect focus and the request stream.
5. Repeat read-only selection and named navigation, remove the focused node, and compare the empty, narrow, long-label, combined error and selected, forced-colors and reduced-motion examples.

## Run the normal gates

- In-process browser coverage and mutation inputs use `pnpm run gate:unit-tests packages/elements/test/workflow-canvas-graph.test.ts packages/elements/test/workflow-canvas-navigation.test.ts packages/elements/test/workflow-canvas.test.ts` once those files exist. Run the separate built fixture and touch files listed in the plan as they are added. Avoid inserting an extra `--` before Unit file filters.
- For each phase, record a canonical test-only red with `.specify/extensions/story/scripts/red.sh N phase`. Run `.specify/extensions/story/scripts/tdd-check.sh N` on the integrated green, with the exact shared test consumers in `reviews/phase-N/test-scope.txt` when needed. Record an unchanged replay and its actual reuse. The approved Op 028 guide is on branch `codex/028-within-phase-worktrees` at `dce21bac`. Use it for the first eligible in-phase task group.
- Build and verify with `pnpm run gate:typecheck`, `pnpm run gate:manifest`, `pnpm run gate:csp`, `pnpm run gate:storybook-build`, `pnpm run gate:visual`, and `pnpm run gate:axe`. Run the configured changed-source mutation and affected Plants from the recorded phase base. Record exact selections and outcomes. Full hosted checks are required for the final revision, including any inventory cases the approved Op 025 rules delegate to CI.
