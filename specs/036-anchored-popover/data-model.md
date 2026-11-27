# Data model — Anchored popover

| Surface | Representation | Rules |
| --- | --- | --- |
| Trigger name | Required `label` string | A nonblank name enables the native trigger. The visible icon or initials provide presentation and the label reaches the actual button. |
| Preferred placement | `placement` string | `below` for the top bar and `above` for the bottom rail. Missing or unsupported values resolve to `below`. |
| Surface state | Actual native popover state | Closed initially. Click and native key activation toggle. The popover’s own Escape, outside primary pointer dismissal, native sequential focus leaving its scope, the host close method, loss of the rendered trigger box and disconnect close it. A foreground overlay or the native populated-search action can own Escape. |
| Position | Instance-local numeric CSS rule | Measured fixed position and maximum extents. Cleared with the open lifetime. Geometry has no public persisted value. |
| Pointer tracking | Active primary pointer id and down/up boundary | Track for an open lifetime. Clear on cancel, close and disconnect. A drag crossing the boundary leaves the surface open. |
| Sequential focus tracking | Native Tab or Shift+Tab from the trigger or panel | Resolve after default navigation. Close without moving focus if it left the scope for an ordinary external stop. Preserve the open panel for internal navigation and a foreground overlay. Clear on close and disconnect. |
| Fixture data | Light or Dark choice and one fictional Sign out callback | Owned by the stories’ hosts. Pressed appearance state is exclusive. |

The native panel is the single state source. Synchronize the real button’s exposed state with native transitions. Stale events from a closed or disconnected lifetime cannot close or reposition a later opening. [Public contract](contracts/element.md)
