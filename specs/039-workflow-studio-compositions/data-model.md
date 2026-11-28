# Workflow Studio Data Model

All fixtures reset when mounted. The fixture host is the authority for simulated decisions. Visible positions and navigation share stable node IDs with the data but have separate lifecycle.

| State | Keys | Contract |
| --- | --- | --- |
| Authoring graph | Ordered steps keyed by stable ID, reviewer per step, connection keyed by source and outcome | Add creates one step. The authoritative graph supplies immutable serialized observations including reviewer bindings. An accepted destination changes only the intended edge and rejection keeps the previous bytes. |
| Layout and viewport | Position by stable node ID, viewport coordinates and scale | Movement and navigation affect only this state. Verify movement changes visible position while the authoritative semantic bytes stay identical. |
| Selection, validation and routes | Selected ID, observed recipe inline size, active list or detail pane, finding target and attempted request | The recipe container determines the compact route. Set public narrow and detail-open state from that route and pane. The selected step supplies the form-select value. An empty binding maps to the enabled Unassigned option. Record each delivered request before the host decides. |
| Removal | Selected step ID and current authoritative state | One accepted authoring update removes that step, its binding, incoming and outgoing edges and layout entry. Reconcile selection and inspector state and preserve unrelated records. |
| Focus recovery | Actual opener, owning overlay or canvas, settled route, visible successor or fallback | Preserve unaffected focus. The host verifies deep focus after public close and settled layout, restoring the visible operable opener or selecting the applicable visible fallback. The canvas retains recovery for its own focused actions. |
| Interview | Pending value, retry error, accepted answer evidence, separately identified review revision | Failure preserves pending text and leaves accepted history unchanged. Acceptance adds one event. |
| Catalog offer | Current and offered version, digest and capability facts | Opening a comparison captures the stable selected instance and source offer. |
| Catalog instance | Stable ID, reviewer, accepted version and digest | Binding and pin transitions apply to one instance. Comparison itself does not commit either value. |
