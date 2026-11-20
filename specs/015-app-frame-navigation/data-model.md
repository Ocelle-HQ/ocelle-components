# State model — App frame and navigation

| State | Owner | Values and transition source |
| --- | --- | --- |
| Layout | Host | `mission`, `project`, `personal`. Omission or invalid input selects mission |
| Bounds | Host and tokens | Resolve each explicit length, computed token or default in order. Invalid or non-finite candidates fall through. An inverted resolved pair resets both to published defaults |
| Tier | Shell | Below lower is narrow. Below upper is collapsed. Otherwise expanded. Equal boundaries omit collapsed |
| Navigation | Host slots | Mission projects rail then sidebar. Project and personal project sidebar only. Each supplied landmark retains its accessible name. Bare content receives one named landmark per nonempty region. Empty regions produce no landmark or trigger. Preserve assignment identity through tier changes |
| Sidebar presentation | Shell and host | Shell tier controls effective compactness through grouped mission and project sidebar content. The nav item's host compact setting remains intact and applies again when it leaves that content. The drawer uses full presentation |
| Drawer | Shell | Closed at initialization. Opening is permitted only in narrow with available destinations. User dismissal, leaving narrow, or removing all destinations closes it. Resizing inside narrow keeps it open |
| Active destination | Browser and shell | Capture deep focus before changing visible regions for either a tier or layout change. After render, preserve the control if still available or apply the spec's ordered fallback to the trigger, first destination, drawer close control or main |
| Route/current state | Host | The vertical nav item exposes its current value. The nav pill owns an ordered group of host routes, with the first declared current link marked as current page. Breadcrumbs map ordered host items to links and one final current page |
| Skip target | Host | Defined element reference wins over selector, including on a failed focus attempt. Selector is evaluated afresh at activation |

## Focus settlement

Capture focus before a tier or layout transition hides or reprojects regions. A same-tier change in the host's layout value uses the same settlement path, without emitting a tier change event. When collapse hides focused head or footer chrome, choose the first focusable destination in the resulting navigation, then main. Update the layout and drawer in one transition, await the rendered state and drawer completion when needed, then restore according to the spec. A later resize or disconnect invalidates an older pending restoration. If the user has deliberately moved focus to a still-visible control during settlement, keep it there. Resolve modal entry from the destinations' sequential keyboard order, independent of drawer chrome and autofocus. Check actual composed focus order, modal entry and close restoration with slotted and nested controls. If a layout change or live content update leaves no navigation to open, close the drawer and settle focus on main when focus was inside the drawer or on its disappearing trigger. If the drawer remains open but the focused control disappears, choose the first focusable destination or the drawer close control if no sequential destination remains.
