# Workflow Studio Data Model

All fixtures reset when mounted. The fixture host is the authority for simulated decisions. Visible positions and navigation share stable node IDs with the data but have separate lifecycle.

| State | Keys | Contract |
| --- | --- | --- |
| Authoring graph | Ordered steps keyed by stable ID, reviewer per step, connection keyed by source and outcome | Add creates one step, accepted destination changes one connection, and rejection keeps the previous graph. |
| Layout and viewport | Position by stable node ID, viewport coordinates and scale | Movement and navigation affect only this state. |
| Selection and validation | Selected ID, inspector route, structured finding target and attempted request record | Selection and navigation are available in both modes. A finding targets the actual reviewer control. |
| Interview | Pending value, retry error, accepted answer evidence, separately identified review revision | Failure preserves pending text and leaves accepted history unchanged. Acceptance adds one event. |
| Catalog offer | Current and offered version, digest and capability facts | Opening a comparison captures the stable selected instance and source offer. |
| Catalog instance | Stable ID, reviewer, accepted version and digest | Binding and pin transitions apply to one instance. Comparison itself does not commit either value. |
