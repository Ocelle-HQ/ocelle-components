# Shell Chrome Contracts

## Top-bar frame

The default `ocelle-top-bar` bar has no lower separator in light, dark or forced colours. A pane divider placed by the consumer remains visible at that pane’s boundary. The existing `bar`, `brand`, `actions` and `menu-button` parts, action order and menu contract continue to apply.

## Personal rail

`divider-at-end` is the boolean markup spelling of `OcellePersonalRail.dividerAtEnd`. It defaults to false and reflects changes set via the property. It only changes a populated vertical layout. With measurable spare block size, measure the divider's lower edge to the first bottom item. The result is one `--ocelle-space-1` gap, within the existing pixel helper's tolerance. The same extra height previously between the divider and lower group is before the divider. A focused destination keeps focus when the orientation prop updates in place. Existing horizontal, default, label, navigation and empty-group contracts still apply.

## Brand accessory

Both `ocelle-top-bar` and `ocelle-app-shell` accept optional host-child content with `slot="brand-accessory"`. At rendering time it is laid out immediately after the product text in the top bar. The existing actions slot remains after the brand region in keyboard order. The slot supplies no name or role of its own. The supported reference at 320 px has a long name, one short text badge, one named menu, and the reference Settings action. The full name is still available to assistive technology if it is visually truncated. The viewport fits, the focused controls remain fully visible, and the menu's hit bounds are at least `--ocelle-target-min` in both axes. Absent content introduces no extra box or gap.

## Public record

Document the public slot and attribute/property in the element manifest, README and changelog. Source story exports map to the concrete IDs and captures listed in the plan. Verify real rendered examples in light and dark. Build and serve the external-fixture path under the repository strict CSP with the same native interactions and clean fixture violation collection.
