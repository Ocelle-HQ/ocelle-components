# Data model — Anchored popover

| Surface | Representation | Rules |
| --- | --- | --- |
| Trigger name | Required `label` string | A nonblank name enables the native trigger. The visible icon or initials provide presentation and the label reaches the actual button. |
| Preferred placement | `placement` string | `below` for the top bar and `above` for the bottom rail. Missing or unsupported values resolve to `below`. |
| Surface state | Actual native popover state | Closed initially. Click and native key activation toggle. Escape, outside primary pointer dismissal, the host close method and disconnect close it. |
| Position | Instance-local numeric CSS rule | Measured fixed position and maximum extents. Cleared with the open lifetime. Geometry has no public persisted value. |
| Pointer tracking | Active primary pointer id and down/up boundary | Track for an open lifetime. Clear on cancel, close and disconnect. A drag crossing the boundary leaves the surface open. |
| Fixture data | Light or Dark choice and one fictional Sign out callback | Owned by the stories’ hosts. Pressed appearance state is exclusive. |

The native panel is the single state source. Synchronize the real button’s exposed state with native transitions. Stale events from a closed or disconnected lifetime cannot close or reposition a later opening. [Public contract](contracts/element.md)
