# Workflow node data model

| Entity | Inputs | Ownership and behavior |
| --- | --- | --- |
| Step | Stable node ID, title, kind, accountable role and ordered outcome labels | The host owns the original data and keeps one mounted instance for its ID. Updates such as renaming keep that instance. A different ID uses a different instance. |
| Presentation state | Selected, waiting and invalid flags, plus optional status text | The host controls each state independently. Focus is the native control’s current user interaction state. The node displays these values together. |
| Accessible host context | Additional name and description, plus current-step state | The button’s accessible name retains the full title. Host description supplements the built-in metadata and states. Host current-step state remains independent of selection. |
| Focus preference | Whether the native button participates in sequential focus | Standalone nodes start in the tab order. A host can remove or restore the same action to its preferred tab order and focus it directly. |
| Selection request | Stable node ID | The custom-element host dispatches one noncancelable request during native button activation. The host decides how to change selection. Outcome labels and the original input collection remain unchanged. Replacing a pressed element before release emits no request for the replacement. |

A valid step has a nonempty host-supplied identifier. Its outcome collection can be empty. Identifiers are distinct within the host graph. Outcome labels are descriptive data, and the canvas owns the identities and connections of graph ports.
