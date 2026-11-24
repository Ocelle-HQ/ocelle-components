# Phase 1 review round 1 fixes

| ID | Resolution | Red test | Where |
| --- | --- | --- | --- |
| R1-01 | fixed | The first trusted ArrowLeft and the first trusted Enter on Reveal each expose Review in capture while its existing wrapper is still inert. The resulting focus handoff emits zero requests. | [Strict-CSP Chromium](../../../../packages/elements/test/browser/workflow-canvas.test.ts#L350) · [Action handoff](../../../../packages/elements/src/ocelle-workflow-canvas.ts#L391) |
| R1-02 | fixed | The only pending destination is removed with Reveal focused and its viewport proposal withheld. The picker takes focus with no extra request or pane scroll. The controls also cover focus claimed by the host and a successor that keeps Reveal enabled. | [Strict-CSP Chromium](../../../../packages/elements/test/browser/workflow-canvas.test.ts#L377) · [Removal handling](../../../../packages/elements/src/ocelle-workflow-canvas.ts#L261) |
| R1-03 | fixed | The standalone node defines its tag before the aggregate. ArrowRight reaches Publish and its native Enter requests exactly one Publish selection. A separate trusted Enter that becomes clipped in capture adds no selection. The in-process guard also rejects a matching-ID action from outside the canvas shadow root. | [Strict-CSP Chromium](../../../../packages/elements/test/browser/workflow-canvas.test.ts#L431) · [Action lookup](../../../../packages/elements/src/ocelle-workflow-canvas.ts#L363) |

The signed test-only commit `66d43d1f4d98494710275ea7ab7cbaeb6b5075f3` follows the signed review `68358e12a5fde4f840a5ea75fd4f775fb37cdb29`. The story red command `red.sh 1 fix-1` recorded five named assertion failures. The standalone module is independently bundled from the compiled package entry and loaded over the mixed page's same origin before the aggregate. The test uses the existing CSP and request recorders. [Recorded red](red-fix-1.log)

The signed test-only commit `38fec580ab1cf5be0455b9a11ac8b4287fef9bdc` adds four cases in the Chromium project used by Stryker. The direct filtered run of that project failed on all four named assertions before the production change. The story runner continues to track the canonical built red as `fix-1`. [Supplemental Chromium red](check-review-fix-1-chromium-red.log)

The initial integrated run passed 113 tests across all five workflow-canvas files, including 11 against the built aggregate in Chromium. Typecheck, scoped source lint, scoped test lint and the 43-element manifest gate passed.

A local Stryker run exercised 231 mutations in the changed areas. Two survived. One let the picker take focus from the host when the reveal initiator never owned focus. The other let canvas navigation consume key input from a native non-node control in the map. Separate Chromium tests each failed on the corresponding isolated mutation and passed on the corrected source. The expanded focused suite passed 115 tests across the same five files.

The exact corrected commit `8f7d54bcf394b69e431a2e7a1ec5bc7a4fc6c69f` passed all 18 required hosted checks, including all 29 change-scope mutation shards and the full 317-Plant judge. [Hosted run](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45327915909) · [Implementation evidence](implementation.md#verification-after-round-1-fixes) · [Plants record](plants.md)
