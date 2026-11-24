# Phase 1 review round 5 fixes

| ID | Resolution | Red test | Where |
| --- | --- | --- | --- |
| R5-01 | fixed | Built Chromium verifies native traversal, accessibility exposure, trusted capture before the observer changes, and exact named Reveal requests through the translated notch and the ellipse. Circle cases exercise the same convex proof. An accepted viewport exposes the original action and hands off focus without scrolling the host pane. | [Trusted traversal, reveal and capture](../../../../packages/elements/test/browser/workflow-canvas.test.ts#L1077) · [In-process activation and reveal](../../../../packages/elements/test/workflow-canvas.test.ts#L1287) · [Resolved bounds](../../../../packages/elements/test/workflow-canvas-viewport.test.ts#L153) |
| R5-02 | fixed | The native Step picker misses Chromium's hit test while Reveal hits. The trusted Publish activation stays suppressed, and actual focus goes to Reveal with zero requests and unchanged pane scroll. The in-process case proves the same exclusion with both controls enabled. | [Trusted capture and fallback](../../../../packages/elements/test/browser/workflow-canvas.test.ts#L1144) · [In-process fallback](../../../../packages/elements/test/workflow-canvas.test.ts#L1322) |
| R5-03 | exact hosted verification required | CI evidence for the exact next candidate. | [Round 5 review](round-5.md) |

The map, named fallback and pending Reveal use one live clip measurement path. It checks the rectangular bounds and resolved straight edges and asks Chromium whether all four corners hit a temporary probe. The probe is removed before focus changes or any paint. Translated and positively scaled 2D axis-aligned CSS transform matrices preserve the reference box mapping for straight polygon vertices. Insets, ellipses and circles use native corner containment. The existing rotation, fragmentation, and boxless controls retain their behavior. [Live clip measurement](../../../../packages/elements/src/ocelle-workflow-canvas.ts#L440) · [Reference geometry](../../../../packages/elements/src/workflow-canvas-viewport.ts#L72)

The viewport proposal starts with the visible bounds. When the live clip rejects that placement, it checks the measured placements of visible actions. A notch fixture proves the first placement misses the aperture and that accepting the alternate proposal focuses the original action. Host-accepted updates still require actual exposure to complete the pending handoff. [Proposal geometry](../../../../packages/elements/src/workflow-canvas-viewport.ts#L282)

The signed test-only commit `efc45e614bdee8284be6e8658e6096e3fc5548ee` recorded 18 named assertion failures under `red.sh 1 fix-5`. The ten built failures cover real Chromium interaction under strict CSP. Four in-process interaction and four geometry failures give mutation coverage. [Canonical RED](red-fix-5.log)

The five focused files passed all 221 tests. Strict local mutation across the changed ranges of both TypeScript files scored 100%, with zero survivors and zero uncovered mutants. [Local checks](check-fix-round-5.log)

### Usable viewport when no map action is visible

A translated C-shaped pane hid every map action. Its bounding center fell in the notch, while the lower arm could fit Publish and its focus outline. The viewport search keeps a valid preferred placement and then tests alternatives derived from the contour. It uses the positions where the outline touches a segment or vertex to divide the space into intervals, and validates each proposed outline through the live clip. [Placement search](../../../../packages/elements/src/workflow-canvas-viewport.ts#L289)

The signed test-only commit `fa1b18c358eedbdd99a95642832a3748efd68ff5` recorded four named failures. The built test accepts the one emitted viewport, keeps scroll fixed, and verifies that focus reaches the original native Publish action, which then emits one selection. In-process Chromium also checks an off-center vertical strip, a diagonal edge, an opening that fits the outline exactly, and a pane with no usable aperture. [Supplemental RED](red-fix-51.log) · [Placement checks](check-fix-round-51.log)

All 232 focused tests passed. Strict mutation across the changed ranges of both production files scored 100%, with zero survivors and zero uncovered mutants. [Placement checks](check-fix-round-51.log)

The exact next candidate needs all 18 required checks, including the passing Unit aggregate and exact deferred visual and axe shard artifacts, all 41 emitted strict changed-source mutation shards and aggregate, and the complete Plants verdict. The phase-base and CI-base selectors agree. [Placement checks](check-fix-round-51.log) · [Plants record](plants.md#round-5-placement-follow-up)
