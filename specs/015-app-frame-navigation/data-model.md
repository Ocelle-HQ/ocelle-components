# State model — App frame and navigation

| State | Owner | Values and transition source |
| --- | --- | --- |
| Layout | Host | `mission`, `project`, `personal`. Omission or invalid input selects mission |
| Bounds | Host and tokens | Resolve each explicit length, computed token or default in order. Invalid or non-finite candidates fall through. An inverted resolved pair resets both to published defaults |
| Tier | Shell | Below lower is narrow. Below upper is collapsed. Otherwise expanded. Equal boundaries omit collapsed |
| Navigation | Host slots | Mission projects rail then sidebar. Project and personal project sidebar only. Empty regions produce no landmark or trigger. Preserve assignment identity through topology changes |
| Drawer | Shell | Closed at initialization. Opening is permitted only in narrow with available destinations. User dismissal, leaving narrow, or removing all destinations closes it. Resizing inside narrow keeps it open |
| Active destination | Browser and shell | Capture deep focused node before changing visible regions. After render, preserve identity if still available, else apply the spec's trigger, first destination or main fallback in order |
| Route/current state | Host | Each destination exposes its current value. Breadcrumbs map ordered host items to links and one final current page |
| Skip target | Host | Defined element reference wins over selector, including on a failed focus attempt. Selector is evaluated afresh at activation |

## Focus settlement

Capture focus before a transition hides or reprojects regions. Update the layout and drawer in one transition, await the rendered state and drawer completion when needed, then restore according to the spec. A later resize or disconnect invalidates an older pending restoration. If the user has deliberately moved focus to a still-visible control during settlement, keep it there. Check actual composed focus order, modal entry and close restoration with slotted and nested controls. If all drawer destinations are removed while open, close it and use main when the trigger disappears. If only the focused destination is removed, choose the next first focusable destination or the drawer close control.
