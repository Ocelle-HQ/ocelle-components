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

## Keyboard, touch and host inspector

Tab or Shift+Tab enters the node group at the eligible selected node or the first eligible node in graph order. An eligible action and its focus inset are in view and free from overlap. Left and Up reach the previous eligible action, Right and Down reach the next, and Home and End reach the ends. These motions stop at the bounds. Tab or Shift+Tab from the currently active node action leaves the group. Use the named navigator to find a covered, clipped or unpositioned step. An in-bounds target can be raised and focused locally while the host's graph and coordinates stay intact. For a clipped target, focus stays on the initiating control until a host viewport puts the latest target in view and its action can be exposed. If no position is available, the name stays visible and reveal is unavailable. Moving focus elsewhere cancels the automatic reveal handoff. Host reorder retains the same eligible action's focus when the canvas owns the focus loss.

In either mode, the named view presents the supplied source, outcome and current destination together, including connections to clipped destinations. Follow a named destination through the same reveal operation. It uses the existing viewport request when a host viewport update is needed and emits zero edit requests.

Native named controls outside the clipped map provide pan, zoom, Fit and authoring operations. Use the named move control or the host inspector to move without dragging. The on-map move and outcome affordances are pointer hit targets. Separate named choices of source, outcome and destination enable keyboard and taps without dragging, and the named disconnect action removes the supplied connection after host acceptance. Escape, a geometry-frame change during a captured gesture, or switching to read-only during an authoring edit cancels the preview and emits zero requests. The existing native node action remains the sole selection control for that step.

A host inspector can show the same named choices and use the same operation and identifier tuple when applying its own domain policy. It can propose an absolute graph-space position or a viewport independently. For acceptance it replaces the corresponding property, and for rejection it keeps the existing one. The host owns validation, persistence, serialization, execution and undo.
