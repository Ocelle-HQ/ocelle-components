# Feature specification for selectable workflow steps

**Feature branch** `027-workflow-node`

**Created** 2026-11-23

**Status** Draft

**Input** [Issue #72](https://github.com/Ocelle-HQ/ocelle-components/issues/72) and [approved triage](../../triage/027-workflow-node.md)

## User Scenarios & Testing

### User Story 1 — Select a workflow step (Priority P1)

A workflow author selects a Security review step and identifies its accountable role and named outcomes. A planning step uses the same presentation and selection action.

**Why this priority** Selection and readable step information are the core behavior shared by the standalone node and the canvas.

**Independent test** Render the review and planning steps side by side. Activate the review step by pointer and keyboard, rename it, then activate it again and compare all selection requests.

**Acceptance scenarios**

1. **Given** a Security review step with the Reviewer role and Approved and Rejected outcomes, and a planning step with one outcome, **when** the author inspects the nodes, **then** each shows its supplied title, kind, role and outcomes in the supplied order.
2. **Given** a step with a stable identifier, **when** the author clicks its selection action or activates it with Enter or Space, **then** each activation requests selection once with that same identifier. Renaming the step updates its visible title and accessible name and preserves the identifier in the next request.
3. **Given** the host has left the step unselected, **when** the author requests selection, **then** the step keeps the host-supplied state until the host changes it. The host’s step and outcome data keep their original values.
4. **Given** the author begins a pointer press on one step, **when** the host replaces it with a different step before release, **then** that gesture requests no selection for the replacement. A new activation selects the replacement by its own identifier.

### User Story 2 — Understand state while navigating (Priority P1)

A keyboard or assistive technology user identifies the step, reads its role and outcomes, and distinguishes its selection, focus, run and validation states.

**Why this priority** The user needs the same decision information in a dense canvas and when color cues are unavailable.

**Independent test** Focus a selected, waiting and invalid step with long supplied labels. Compare its visible cues under forced colors with the states exposed to assistive technology. Check tab order and selection with the host coordinating focus.

**Acceptance scenarios**

1. **Given** a selected step that is waiting and invalid, **when** the keyboard user focuses it under forced colors, **then** the focus indicator remains visible and the user can identify selection, waiting and invalidity from text cues without relying on color. The focused action and its associated information expose all three distinctions to assistive technology.
2. **Given** a constrained layout and long titles, roles and outcome labels, **when** the user inspects the node, **then** the selection action’s accessible name contains the full visible title and the full role and outcome labels remain available to assistive technology.
3. **Given** a standalone step between two controls in the tab order, **when** the user presses Tab through the controls, **then** focus stops once on the step's selection action.
4. **Given** a host coordinating focus across multiple nodes, **when** the host removes a step's selection action from the tab order, **then** Tab skips it and the host can still focus the same action directly. Activating that action once with the keyboard requests selection exactly once. Restoring the action to the tab order gives the step one Tab stop again. Focus and tab order changes on their own request zero selections.
5. **Given** the host supplies an accessible name, descriptive context and current-step state, **when** it changes or clears those values, **then** the focused action exposes the updated values and keeps its full visible title and built-in state description.
6. **Given** the host supplies naming and description references, **when** it edits the text on those same targets, **then** the action exposes the new text. If the host replaces the targets under the same identifiers, refreshing the references makes the replacement text available, and the full title and built-in state description remain available throughout the refresh.
7. **Given** a narrow layout with wrapping metadata, **when** the user focuses the selection action in either theme or forced colors, **then** the action itself meets the library’s minimum target size and remains visually distinguishable from its surroundings.

### User Story 3 — Inspect a recorded run (Priority P2)

A reviewer selects a step in a read-only run to inspect its recorded role, outcomes and status. A host can supply a readable status while the separate library status elements are in development.

**Why this priority** Read-only runs reuse the node and its selection behavior so the reviewer can reach step details.

**Independent test** Mount the Security review step in a read-only inspection and request selection with pointer and keyboard while monitoring the original host data.

**Acceptance scenarios**

1. **Given** a step shown in read-only run inspection with a supplied status, **when** the reviewer selects it, **then** the host receives the same stable selection request as in authoring, the status is readable and the original data is intact.
2. **Given** an outcome label, **when** the reviewer examines or activates the node, **then** the outcome remains descriptive. The canvas owns graph layout, moving and wiring.

### Edge Cases

- A renamed step keeps its identifier. Two steps with the same title can still be selected independently by identifier.
- A mounted node keeps its step identity. The host mounts a different node instance when it displays a different step in the same position.
- A node with no optional status or outcomes keeps its selection action and presents the supplied information without empty status text or outcome controls.
- Text cues and focus remain discernible when selected, focused, waiting and invalid states occur together.
- Long labels retain their full accessible text even when the visible presentation wraps or truncates.

## Requirements

### Functional Requirements

- **FR-001** The node MUST present its host-supplied title, kind, accountable role and named outcomes, preserving outcome order.
- **FR-002** A step MUST expose one accessible selection action. Activation by pointer, Enter or Space MUST issue one selection request containing the host’s stable node identifier. The action’s accessible name MUST include the complete supplied title.
- **FR-003** The selection action MUST be the step's sole Tab stop in standalone use. A host coordinating navigation MUST be able to remove and restore that same action in the tab order. The host MUST still be able to focus it directly, and a user MUST still be able to activate it once focused. Focus movement, tab order changes, renaming and other data updates MUST issue zero selection requests.
- **FR-004** The host MUST retain ownership of selection and step data. The node MUST reflect the supplied selection and status values and preserve the original step and outcome data when requesting selection. The host MUST keep the same mounted node for updates to the same identifier and mount a different instance for a different identifier. An interrupted activation MUST issue no request for the replacement.
- **FR-005** The node MUST present supplied run and validation states together with selection and focus. Text MUST convey selection, waiting and invalidity under forced colors, and the focus indicator MUST stay visible. The selection action and its associated information MUST expose the supplied selection, run and validation states to assistive technology when the action has focus, including when all three coexist. The action itself MUST meet the library’s minimum target size in both dimensions and remain distinguishable in both themes and forced colors.
- **FR-006** The node MUST retain the full accessible title, kind, role and outcome text in a constrained layout. The host MUST be able to supply readable optional status content and provide accessible naming context, a description and current-step state on the actual selection action. Updating or clearing host accessibility information MUST preserve the full visible title and built-in state description. An edit to a referenced element’s text MUST update the action’s accessible context. The host MUST be able to refresh its references after replacing the target elements.
- **FR-007** Read-only run inspection MUST retain the same selection action and identifier. Outcomes MUST remain descriptive. Host and canvas controls handle workflow edits and graph operations.
- **FR-008** The library MUST document the selection request, state ownership, accessible name and focus handoff to a host. The visual examples MUST demonstrate both kinds of step and the combined state and read-only inspection scenarios in light and dark themes.

### Key Entities

- **Workflow step** A host-owned record with a stable identifier, title, kind, accountable role, named outcomes and optional run and validation states.
- **Named outcome** A descriptive label supplied in the step’s ordered collection of outcomes.
- **Selection request** The node asks its host to select the step identified by the stable identifier. The host decides how to apply it.

## Success Criteria

### Measurable Outcomes

- **SC-001** In the Security review and planning examples, every supplied title, kind, role and outcome is available and the outcomes appear in the expected order.
- **SC-002** Across pointer, Enter and Space activation before and after renaming, every activation issues exactly one request with the expected identifier. Replacing the pressed node before release issues zero requests for the replacement. Tab stops once on the standalone action, skips it while the host excludes it, and stops once again when the host restores it. A keyboard activation while directly focused on the excluded action still issues exactly one request. Focus, tab order and data changes issue zero requests.
- **SC-003** Under forced colors, a focused node conveys selection, waiting and invalidity by text while retaining a visible focus indicator. The accessibility check retrieves all three states from the focused action and its associated information, along with the full long title, role and outcome labels at the narrow test width. Changing and clearing host accessibility information leaves these built-in values available. At the same width, both dimensions of the native action meet the target minimum and its visual cues pass the contrast checks in both themes.
- **SC-004** Selecting a step in run inspection produces the expected request and leaves every supplied step and outcome value unchanged.

## Assumptions

- The host supplies stable, nonempty identifiers and owns identifier uniqueness within its graph. A mounted instance represents one identifier for its lifetime.
- Workflow Studio handles semantics and persistence. #73 consumes the node’s selection and focus contract and owns graph navigation, layout and wiring.
- A readable host-supplied status supports standalone delivery while #7 progresses. The larger Workflow Studio composition is covered by #76.
- The team will exercise Op 025 by recording focused replay timing, reuse on repeat, and the complete hosted checks for this mission.
