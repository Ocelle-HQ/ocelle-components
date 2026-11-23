# Workflow node public contract

Consumers import `@ocelle/elements/ocelle-workflow-node.js` for standalone registration or use the existing aggregate entry. The node exposes one native `button` with a name derived from its visible full title. Its description exposes the supplied role, kind, outcomes and any current state text.

| Input | Representation | Default and effect |
| --- | --- | --- |
| `nodeId` | String property and `node-id` attribute | The host supplies a stable identifier. Incomplete setup with an empty identifier emits no selection request. |
| `label` | String property and `label` attribute | The host supplies the visible title and accessible name. |
| `kind` | String property and `kind` attribute | The host supplies a readable kind such as approval or planning. |
| `accountableRole` | String property and `accountable-role` attribute | The host supplies the displayed role. |
| `outcomes` | Readonly array of label strings, property only | Defaults to an empty collection. Present values in order. |
| `selected`, `waiting`, `invalid` | Boolean properties and attributes | Default false. Visible and accessible state text reflects the active values independently. |
| `selectionTabIndex` | Property accepting `0` or `-1` | Defaults to `0`. At `-1` the same button remains available for explicit focus and activation. |
| `status` | Named slot | Optional readable, noninteractive content. An empty slot contributes no status text. |

`focus(options?)` forwards focus to the native button after the node renders. Before the button exists it safely leaves focus where it is. The host uses the same action for standalone navigation, a canvas and read-only inspection. It can use `selectionTabIndex` to coordinate sequential navigation across nodes. Optional status content is descriptive, and the native button owns selection.

`ocelle-workflow-node-select` is a bubbling, composed selection request with detail `{ nodeId: string }`. Pointer, Enter and Space reach the same native activation path and emit one request per activation. Focus, data updates and reflecting a host’s selection emit zero requests. The node leaves the supplied data and selection state intact.
