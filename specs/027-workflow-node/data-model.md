# Workflow node data model

| Entity | Inputs | Ownership and behavior |
| --- | --- | --- |
| Step | Stable node ID, title, kind, accountable role and ordered outcome labels | The host owns the original data and supplies updated values. Renaming changes the presentation and preserves the identifier in selection requests. |
| Presentation state | Selected, waiting and invalid flags, plus optional status text | The host controls each state independently. Focus is the native control’s current user interaction state. The node displays these values together. |
| Focus preference | Whether the native button participates in sequential focus | Standalone nodes start in the tab order. A host can remove or restore the same action to its preferred tab order and focus it directly. |
| Selection request | Stable node ID | The node emits one new request per activation. The host decides how to change selection. Outcome labels and the original input collection remain unchanged. |

A valid step has a nonempty host-supplied identifier. Its outcome collection can be empty. Identifiers are distinct within the host graph. Outcome labels are descriptive data, and the canvas owns the identities and connections of graph ports.
