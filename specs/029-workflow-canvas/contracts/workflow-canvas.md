# Workflow canvas consumer contract

[Specification](../spec.md) · [Data model](../data-model.md) · [Verification guide](../quickstart.md)

## Element and inputs

`ocelle-workflow-canvas` is a standalone custom element in `@ocelle/elements/ocelle-workflow-canvas.js`. The aggregate and browser entries register the same element. Rich values are JavaScript properties, with their readonly types available from the module. Default to an empty graph, empty layout, identity viewport, no selected node and read-only inspection.

| Property | Value | Consumer behavior |
| --- | --- | --- |
| `graph` | Ordered nodes and connections described in the data model | Supply stable IDs and replace the snapshot when accepting a semantic edit. The connector display reflects the supplied graph. |
| `layout` | Array of `{ nodeId, x, y }` in one graph coordinate space | Supply a layout entry per displayed node. Replace it to accept a node position. |
| `viewport` | `{ x, y, scale }` | Supply the current pan and scale. Apply a proposed viewport independently of a node move or semantic edit. |
| `selectedNodeId` | Stable node ID or null | Set the ID in response to the original workflow-node selection request or other host selection. |
| `mode` | `author` or `read-only` | Read-only retains selection, named relationships, navigation and viewport commands. It cancels pending authoring edits and removes their controls. |

Node labels remain accessible at narrow widths. Where supplemental context is needed to disambiguate names, use the displayed title with accountable role, kind or the visible identifier. Pass node status to the existing noninteractive status content. The documented public surface keeps routing geometry, edge hit areas and editing handles private.

## Host-visible requests

All four request kinds are synchronous, bubbling, composed and noncancelable custom events. A listener above the canvas observes each completed intent once. The host accepts by applying an input update.

| Event | Detail | Trigger |
| --- | --- | --- |
| `ocelle-workflow-node-select` | `{ nodeId }` | Native pointer, Enter or Space activation of the existing node action. The original event reaches the host without a canvas-generated duplicate. |
| `ocelle-workflow-canvas-viewport-request` | `{ viewport: { x, y, scale } }` | Completion of pan, zoom, fit or an offscreen named reveal request. |
| `ocelle-workflow-canvas-position-request` | `{ nodeId, position: { x, y } }` | Completion of an authoring move or its non-drag equivalent. The values are in graph coordinates. |
| `ocelle-workflow-canvas-connection-request` | `{ operation, sourceId, outcomeId, destinationId }` | Completion of an authoring connect, reassign or disconnect. Connect and reassign describe the proposed destination. Disconnect describes the supplied destination to remove. |

The graph, layout, viewport and selected ID are independent. An input update is how the host may change multiple values after handling a request. An unchanged host snapshot retains the same committed display. Displayed drag and connection previews end on completion or cancellation. Focus changes, canceled gestures, no-op connection edits and stale connection submissions give the host an empty request stream.

## Host clipping

Use a rectangular overflow or paint-containment pane, or one of these CSS clip paths on an HTML host pane.

- `inset()` with pixel or percentage offsets, including a linear combination of pixels and percentages. Rounded corners and the border, padding, content and margin reference boxes are supported.
- `circle()` and `ellipse()` with numeric pixel or percentage radii and centers in the default border box.
- A simple straight-edge `polygon()` with pixel or percentage vertices in the default border box.

Keep the shaped host pane in one unfragmented box and its HTML ancestor chain axis-aligned. Use translation and positive scaling through the CSS `transform` property. A wrapper with `display: contents` has no clipping box.

Use a supported host clip when placing the canvas inside a clipped panel. Custom CSS outlines such as `path()` and shapes supplied through SVG clip references are tracked separately. [Custom clipping follow-up](https://github.com/Ocelle-HQ/ocelle-components/issues/95)

## Keyboard, touch and host inspector

Tab or Shift+Tab enters the node group at the eligible selected node or the first eligible node in graph order. An eligible action and its focus inset are fully visible through the map and its enclosing panes and free from overlap. Unavailable map actions are excluded from focus, assistive-technology navigation and user activation. Find their names in the visible named navigator. Left and Up reach the previous eligible action, Right and Down reach the next, and Home and End reach the ends. These motions stop at the bounds. Tab or Shift+Tab from the currently active node action leaves the group. Host reorder retains the same eligible action's focus when the canvas owns the focus loss.

A target inside the effective clip can be raised and focused locally while the host's graph and coordinates stay intact. Revealing a positioned but clipped target emits one viewport request. A target still hidden by an enclosing pane stays unavailable after a map-only change. Focus stays on the visible initiating control or recovers to a visible named canvas control. A host scroll that exposes the latest target can complete the reveal while the initiating control still owns focus. Moving focus elsewhere cancels that handoff. If no position is available, the name stays visible and reveal is unavailable. Canvas-programmatic focus and recovery leave host scroll unchanged. The user can still navigate and scroll normally.

Moving an enclosing pane alone refreshes map action availability. When an action leaves the effective clip it becomes unavailable for Tab, assistive technology and selection. Its name remains available in the named navigator. Returning the pane restores the same eligible action and its place in the canvas focus order even without changes to canvas inputs, sizes or scroll. These availability changes emit zero requests.

In either mode, the named view presents the supplied source, outcome and current destination together, including connections to clipped destinations. Follow a named destination through the same reveal operation. It uses the existing viewport request when a host viewport update is needed and emits zero edit requests.

Native named controls outside the clipped map provide pan, zoom, Fit and authoring operations. Use the named move control or the host inspector to move without dragging. The on-map move and outcome affordances are pointer hit targets for eligible nodes. Separate named choices of source, outcome and destination enable keyboard and taps without dragging, and the named disconnect action removes the supplied connection after host acceptance. Escape, a geometry-frame change during a captured gesture, or switching to read-only during an authoring edit cancels the preview and emits zero requests. A frame change clears the preview while capture is active, even when the pointer is stationary and the user has yet to release it. The existing native node action remains the sole selection control for that step.

A host inspector can show the same named choices and use the same operation and identifier tuple when applying its own domain policy. It can propose an absolute graph-space position or a viewport independently. For acceptance it replaces the corresponding property, and for rejection it keeps the existing one. The host owns validation, persistence, serialization, execution and undo.
