# Workflow node public contract

Consumers import `@ocelle/elements/ocelle-workflow-node.js` for standalone registration or use the existing aggregate entry. The node exposes one native `button` with a name derived from its visible full title. Its description exposes the supplied role, kind, outcomes and any current state text.

| Input | Representation | Default and effect |
| --- | --- | --- |
| `nodeId` | String property and `node-id` attribute | The host assigns a stable identifier to each mounted instance. Incomplete setup with an empty identifier emits no selection request. |
| `label` | String property and `label` attribute | The host supplies the visible title and accessible name. |
| `kind` | String property and `kind` attribute | The host supplies a readable kind such as approval or planning. |
| `accountableRole` | String property and `accountable-role` attribute | The host supplies the displayed role. |
| `outcomes` | Readonly array of label strings, property only | Defaults to an empty collection. Present values in order. |
| `selected`, `waiting`, `invalid` | Boolean properties and attributes | Default false. Visible and accessible state text reflects the active values independently. |
| `selectionTabIndex` | Property accepting `0` or `-1` | Defaults to `0`. At `-1` the same button remains available for explicit focus and activation. |
| `status` | Named slot | Optional readable, noninteractive content. An empty slot contributes no status text. |

`focus(options?)` forwards focus to the native button after the node renders. Before the button exists it safely leaves focus where it is. The host uses the same action for standalone navigation, a canvas and read-only inspection. It can use `selectionTabIndex` to coordinate sequential navigation across nodes. Optional status content is descriptive, and the native button owns selection.

## Accessible context supplied by the host

- The full visible title comes first in the computed button name. Resolved host `aria-labelledby` elements supply additional naming context in reference order. When none resolve, a nonblank host `aria-label` is additional context. Without either value the full visible title is the name.
- The computed description includes the built-in role, kind, outcome and state text and the optional slotted status. Resolved host `aria-describedby` elements append context in reference order. Missing references contribute nothing. Host context leaves the built-in description intact.
- Resolve host references in the host’s own document or shadow root and associate the resolved elements to the button using element-reference reflection. Use a shadow-local text element for literal name context. Keep all built-in references within the node’s shadow root. Recompute the associations on connection and when the corresponding host attributes change or are removed.
- These associations refer to element instances. For text updates, keep the existing target elements and edit their text in place. If the host replaces a naming or description target with a different element under the same ID, it inserts the replacement, removes the corresponding `aria-labelledby` or `aria-describedby` attribute from the node, and lets the node update. It then reapplies the reference attribute, using the same ID if appropriate. The action retains its full title and built-in description during the refresh, then exposes the replacement context.
- Host `aria-current`, such as `step`, is reflected on the actual button independently of the node’s selected state. Replacing or removing a host attribute updates or clears the corresponding context or state on the button.

## Selection request and mounted identity

`ocelle-workflow-node-select` is a noncancelable, bubbling, composed event with detail `{ nodeId: string }`. During the native button’s click handler the node dispatches the request from the custom-element host itself. Pointer, Enter and Space use that path and issue one request per activation. The native `click` continues its normal propagation, uncancelled by the node. The canvas listens to the selection request as its single input for selection. Focus, data updates and reflecting a host’s selection emit zero requests. The node leaves the supplied data and selection state intact.

Keep the mounted element keyed by `nodeId`. A title, status or outcome update stays on that instance. Replace the element when showing a different step, even if it occupies the same position. Replacing the pressed element before pointer release cancels that gesture’s selection, and a fresh activation requests the replacement’s own ID. [Keyed host example](../quickstart.md#keyed-collection)
