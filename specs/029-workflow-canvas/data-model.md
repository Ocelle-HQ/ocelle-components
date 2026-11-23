# Workflow canvas data model

[Specification](spec.md) · [Consumer contract](contracts/workflow-canvas.md)

## Authoritative inputs

| Entity | Fields and identity | Rules |
| --- | --- | --- |
| Graph | Ordered steps and connections | The host replaces input snapshots. Step order is independent of positions and drives bounded keyboard traversal, named choices and focus recovery. |
| Step | `id`, `label`, `kind`, `accountableRole`, ordered `outcomes`, optional `waiting`, `invalid` and readable `status` | One nonempty unique ID per graph. Display fields can change under that ID. The canvas retains the keyed workflow-node instance and passes descriptive outcome labels and states through its existing contract. |
| Outcome | `id` and `label` under a step | IDs are unique within the source step. Display labels can repeat and change. Use source context and the local outcome identifier to distinguish repeated labels. |
| Connection | `sourceId`, `outcomeId`, `destinationId` | A source/outcome pair admits at most one connection. Several sources may reach the same destination. Render a connection only when both steps and the source outcome exist and can be positioned. The host owns domain validity and cycle policy. |
| Layout entry | `nodeId` and finite `x`, `y` | The pair is the rendered node's upper-left origin in graph coordinates. The host supplies one entry per displayed step. Ignore orphan layout entries. Unpositioned steps remain in named navigation without a visible graph action until the host supplies a position. |
| Viewport | Finite `x`, `y` and positive finite `scale` | Graph origin maps to local canvas coordinates `canvasX = graphX × scale + x` and analogously for Y. A position delta in graph units is the canvas-local pointer delta divided by the captured scale. |
| Selection and mode | `selectedNodeId` or null, and `author` or `read-only` | Host-owned and independent of focus. Default to empty graph and selection, identity viewport, and read-only mode. Only attached controls act on available inputs. |

Consumer data remains read-only to the element. Graph projections use maps or tuples keyed by IDs. IDs stay as data, including when they contain characters with selector or object-key syntax. Invalid or unavailable positions cannot enter transform arithmetic. Presentation coordinates are distinct from graph relations and from the current viewport.

## Local interaction state

- **Node focus** holds the current roving node ID within the group or none. For recovery, retain the previous ordered IDs and the previously focused action through the next render. Prefer the next surviving visible action in that order, then the previous one, then the named navigation control. Do this only for focus inside the affected controls.
- **Pending reveal** holds the latest requested node ID, initiating control and local generation. Set it before emitting its viewport request. A later reveal replaces it. Before and after the rendering wait, verify the generation, current target, visible action and focus ownership. An updated host viewport can fulfil the latest reveal when that target is now visible. A viewport that reveals only an older target leaves focus on the initiator. If it reveals both, the latest target owns the handoff. Clear the pending reveal on focus departure, target removal, or disconnect so unrelated later updates cannot take focus. An already visible target can be focused directly without a reveal request.
- **Presentation gesture** holds the initiating pointer, node ID or viewport target, starting canvas-local pointer point, starting authoritative layout and viewport, and transient proposal. For node movement, preview the node and its incident edges together. Keep request payloads independent of preview state. Cancel on capture loss, invalid target or leaving the authoring mode during a layout edit. A host change to the gesture's starting presentation basis cancels it so coordinate math stays coherent.
- **Connection edit** holds source ID, outcome ID, currently supplied destination at start, candidate destination, and initiating control. Compare those IDs and the authoritative source/outcome destination again immediately before publishing an intent. Renames leave their identities intact. Loss of an endpoint or outcome, or a change to the captured current destination, clears the edit. Compare the proposed destination to the current one to suppress no-op requests.
- **Viewport or edit completion** consumes its transient session before dispatch. A duplicate completion, pointer-capture loss after release, or host update inside an event listener then cannot publish again. Canceling an edit restores the visible initiating control, the source action, the survivor order or the named canvas control, in that order. Focus outside the affected controls stays where the user left it.

Selection requests, viewport poses, position proposals and connection intents are separate records. The host can replace any corresponding input after observing one request. Component updates and focus recovery themselves publish no requests. A declined edit needs no rollback of graph state because the element renders the supplied graph and discards its transient preview.
