# Shell Chrome Contracts

## Top-bar frame

The default `ocelle-top-bar` bar has no lower separator in light, dark or forced colours. A pane divider placed by the consumer remains visible at that pane’s boundary. The existing `bar`, `brand`, `actions` and `menu-button` parts, action order and menu contract continue to apply.

## Personal rail

`divider-at-end` is the boolean markup spelling of `OcellePersonalRail.dividerAtEnd`. It defaults to false and reflects changes set via the property. It changes placement when both groups are populated and the layout is effectively vertical. The exact `orientation="horizontal"` value selects the existing horizontal layout. An omitted, empty or other orientation value remains vertical and keeps its original attribute state. With measurable spare block size, the default vertical divider follows the primary group by one `--ocelle-space-1` gap and spare height follows the divider. In the opted-in vertical rail the same spare height precedes the divider, and the divider's lower edge is one `--ocelle-space-1` gap from the first bottom item, within the existing pixel helper's tolerance. A focused destination keeps focus when the orientation prop updates in place. Existing horizontal, default, label, navigation and empty-group contracts still apply.

## Brand accessory

Both `ocelle-top-bar` and `ocelle-app-shell` accept optional host-child content with `slot="brand-accessory"`. At rendering time it is laid out immediately after the product text in the top bar. The existing actions slot remains after the brand region in keyboard order. The slot supplies no name or role of its own. The supported reference at 320 px has a long name, one short text badge, one named menu, and the reference Settings action. The full name is still available to assistive technology if it is visually truncated. The viewport fits, the focused controls remain fully visible, and the menu's hit bounds are at least `--ocelle-target-min` in both axes. Absent content introduces no extra box or gap.

## Public record

Document the public slot and attribute/property in the element manifest, README and changelog. Source story exports map to the concrete IDs and captures listed in the plan. Verify real rendered examples in light and dark and verify the opted-in rail and 320 px badge composition separately in forced colours. Build and serve the external shell fixture under the repository strict CSP. Verify one composed and accessible badge and use the keyboard to operate the real menu and Settings action before collecting the clean runtime record.
