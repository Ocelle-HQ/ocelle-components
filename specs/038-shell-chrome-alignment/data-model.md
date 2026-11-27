# Shell Chrome Design State

| Concept | Representation | Rules |
| --- | --- | --- |
| Top-bar chrome | Existing shadow part `bar` | Default bar has no block-end border. App pane boundaries are owned by the host. |
| Rail placement | Reflected `dividerAtEnd` boolean, existing orientation and slot presence | Opt-in vertical placement applies when both groups contain destinations. Default and horizontal retain their geometry. The divider stays decorative. |
| Brand accessory | Assigned children of the `brand-accessory` slot | The host supplies content. The app shell forwards the named slot into the top bar. One supplied badge is rendered and exposed once beside the same product text. Empty assignment takes up no layout space. |

## Transitions

- Toggling the rail opt-in redistributes spare height without changing destination positions, order or focus. A horizontal orientation uses the existing alignment. Empty-group transitions hide the divider and keep the present group usable.
- Adding or removing an accessory updates slot assignment. The original menu, host action and product text stay present and retain identity. Existing shell responsive behavior drives any drawer state.
