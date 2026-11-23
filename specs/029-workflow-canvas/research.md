# Workflow canvas design research

[Specification](spec.md) · [Implementation plan](plan.md)

## R1 — Native vector rendering

**Decision** Use SVG for connections and position existing HTML workflow-node controls in SVG `foreignObject` elements. Keep the controls in their HTML namespace and at their original screen size. Use SVG geometry attributes for numeric placement and a decorative edge layer. Add zero renderer dependencies.

**Alternatives evaluated** A native SVG edge layer with embedded real node controls and a Canvas2D edge layer with HTML node controls placed through per-instance CSSOM rules. Both prototypes bundled the same landed workflow node and ran separate local scripts and styles under `default-src 'none'; script-src 'self'; style-src 'self'`.

| Measure | SVG and HTML node controls | Canvas2D and CSSOM-positioned HTML controls |
| --- | --- | --- |
| Renderer-only minified and gzip bytes | 976 and 516 | 1,271 and 662 |
| Added package bytes | 0 | 0 |
| 12-node viewport update median JS and forced layout | 0.10–0.20 ms across repeat runs | 0.20–0.30 ms |
| 12-node drag update median JS and forced layout | 0.10–0.20 ms across repeat runs | 0.20–0.30 ms |
| 12-node viewport frame interval p95 | 16.8–17.1 ms across runs | 16.8–16.9 ms |
| 12-node drag frame interval p95 | 16.8–21.8 ms across runs | 16.7–16.8 ms |
| 96-node viewport update median JS and forced layout | 0.30–0.40 ms across repeat runs | 0.30–0.40 ms |
| 96-node drag update median JS and forced layout | 0.10–0.20 ms | 0.30–0.40 ms |
| 96-node viewport frame interval p95 | 16.8–27.7 ms across runs | 16.8–20.6 ms |
| Native buttons exposed and keyboard journey | All 12 or 96, matching Tab, Right, Enter, Space and reverse Tab | Same |
| Strict CSP, dynamic inline styles and added network traffic | Zero violations, inline style attributes or requests during updates | Same |

Each candidate ran on pinned Node 26.13.0 and Chromium 156.0.8078.4. The small fixture had 12 nodes and 14 branching edges. The larger fixture had 96 nodes and 126 edges to exercise a multi-branch graph beyond a single viewport. They are comparison fixtures rather than production size estimates. Each fixture used three fresh pages per renderer, 10 warmup frames and 40 measured animation frame samples for each operation. Every trial loaded six local resources before the update runs. The native #72 control bundle was the same for both and is excluded from renderer-only bytes. The repository CSP gate also passed all seven scratch fixture outputs.

SVG preserves accessible HTML controls like the alternative and takes less renderer code in this probe. A small drag can update the retained incident edges without painting the full bitmap. The Canvas2D approach also needs bitmap sizing and device pixel ratio work. Frame interval spread makes the comparison unsuitable as a responsiveness guarantee. The probes measure alternatives on one browser and synthetic data. The implementation still measures its actual edge and node projection, reports built bundle deltas, and reruns focus, forced-colors, strict-CSP and touch evidence with the shipped component. Whole-graph scaling in a prototype does not establish compliant target sizes in the product.

## R2 — Target size and visible focus

**Decision** Scale the graph's coordinate projection and keep HTML controls at screen size. Determine eligible actions from containment in the effective clip through enclosing scroll and shadow roots and clearance from later-painted geometry, including the focus inset. Keep unavailable node wrappers inert and their names available in the persistent navigator. A named reveal can raise an eligible target with local paint order. Keep native authoring controls outside the clipped graph. Hide the decorative edges from accessibility.

A separate probe nested the real #72 node inside SVG and two shadow roots under the exact strict header. Chromium exposed distinct contextual native names and the combined selected and invalid state. Setting `.selectionTabIndex` to `-1` excluded the native button from Tab and retained direct focus. Enter, Space and real touchscreen tap each emitted one composed selection request and the separate native click. Scaling the whole graph to 0.4 reduced the measured 44-pixel button height to 17.6 pixels while its computed minimum stayed 44 pixels. Translating the node completely offscreen left it reachable by Tab until its participation was changed. Hiding the shared SVG root removed the real buttons from the accessibility tree. Check screen-space size, visibility and the actual accessible tree in the implementation.

The round 1 Chromium checks reproduced in-bounds occlusion, focus loss on a keyed move, and a clipped native authoring control remaining in Tab order. Keep paint order separate from supplied keyboard order and host positions. Preserve focus on the same eligible action across canvas-owned moves. Use non-focusable pointer affordances in the map and native alternatives in the visible controls. [Probe observations](reviews/plan/round-1/refute.md#independent-checks)

Round 2 found that a clipped native button with `tabindex="-1"` remained focusable in the accessibility tree and accepted direct focus. Making its HTML wrapper inert removed the action from that tree and blocked focus. Another target sat entirely inside the SVG while an enclosing pane hid it. Focusing it with `preventScroll` put focus on the hidden action, and default focus scrolled the pane. Check effective clipping before using `preventScroll` and keep visible focus on the named control when the pane still hides the target. [Probe observations](reviews/plan/round-2/refute.md#independent-checks)

## R3 — Controlled updates and interaction boundaries

**Decision** Keep accepted values host-owned. Native named controls and graph gestures converge on one validated completion per request type. Capture a connection's starting destination and re-read it before dispatch. Use the latest reveal destination and its initiating focus epoch for delayed viewport updates. A pending reveal never focuses an obsolete destination.

The landed workflow node supplies its public `.selectionTabIndex` and `focus` behavior and composed `ocelle-workflow-node-select` event. Compose that event directly. Key node instances by stable ID, pass its supported properties, and inspect the actual inner focus or composed path where outer trees retarget. Existing list/detail focus handling uses the relevant shadow root and recovers only when the previously focused area is affected. The canvas extends that idea with visible survivors in supplied graph order. Use native controls for named source, outcome, destination, disconnect, reveal and viewport actions. Pointer drag can optionally reach the same operation via internal hit geometry. No library dependency or host assumption is needed for keyboard or tap equivalence.

The focus loop saves identities before a render, verifies visibility after layout, and rechecks the current request and initiating focus after child rendering. An older viewport update that shows only the older target cannot pull focus there. Focus departure clears the pending reveal, including departure followed by a return. Mode changes and stale authoring sessions are checked using the current properties even before the DOM has redrawn.

The pointer-capture probe held the client Y coordinate at 150 while scrolling changed the map-local Y by 40 pixels. At scale two this would submit a 20-unit move if samples used different frames. Use one captured frame and cancel when the live frame changes. [Probe observations](reviews/plan/round-1/refute.md#independent-checks)

In round 2 a scroll inside an enclosing shadow pane changed the screen transform while pointer capture and SVG dimensions stayed the same. Only that enclosing root received the scroll event. Observe the live frame on animation frames scoped to active capture and clear the stale preview before further input. [Probe observations](reviews/plan/round-2/refute.md#independent-checks)
