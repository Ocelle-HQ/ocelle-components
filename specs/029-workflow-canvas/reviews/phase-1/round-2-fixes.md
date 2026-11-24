# Phase 1 review round 2 fixes

| ID | Resolution | Red test | Where |
| --- | --- | --- | --- |
| R2-01 | fixed | Built Chromium verifies that paint-clipped Publish is absent from the accessibility tree, cannot take focus through ArrowRight or direct focus, and cannot emit a selection when paint containment takes effect during trusted activation. Named Reveal sends one exact viewport proposal and retains focus until the host accepts it. The exposed native action then receives focus and Enter selects Publish exactly once. | [Traversal and accessibility](../../../../packages/elements/test/browser/workflow-canvas.test.ts#L374) · [Native activation](../../../../packages/elements/test/browser/workflow-canvas.test.ts#L417) · [Named reveal](../../../../packages/elements/test/browser/workflow-canvas.test.ts#L458) · [Viewport geometry](../../../../packages/elements/src/workflow-canvas-viewport.ts#L32) |

The shared viewport geometry intersects both axes with the host pane's scaled client bounds for `contain: paint`, `layout paint`, `content` and `strict`. In-process Chromium verifies those four forms and confirms the full map stays visible through `display: contents`, non-atomic `display: inline` and layout-only containment. [Geometry cases](../../../../packages/elements/test/workflow-canvas-viewport.test.ts#L65)

The signed test-only commit `b62a8bbb4f68e3d5645979532764fcf235b115e1` follows the reviewed parent `4d7dcf481c946e2aee0a239b34c4ad6cce2a88d4`. The story command `red.sh 1 fix-2` recorded three built strict-CSP failures and four in-process geometry failures. [Recorded red](red-fix-2.log)

The integrated local run passed 125 tests across five files. Typecheck, code lint, test lint, style lint and the 43-element manifest gate passed. The local affected selector listed all 317 Plants for hosted verification. [Local checks](check-fix-round-2.log) · [Plants record](plants.md#round-2-fix)
