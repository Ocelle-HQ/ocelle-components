# Feature specification for an accessible workflow canvas

**Feature branch** `029-workflow-canvas`

**Created** 2026-11-23

**Status** Draft

**Input** [Issue #73](https://github.com/Ocelle-HQ/ocelle-components/issues/73) and [approved triage](../../triage/029-workflow-canvas.md)

## User Scenarios & Testing

### User Story 1 — Select and navigate a workflow (Priority P1)

A Workflow Studio author opens a branching graph, identifies the steps and their outcomes, and selects the step to work on. A keyboard user can find the same steps by name and in a predictable order.

**Independent test** Mount a host fixture with an Initial review step whose Approved and Rejected outcomes lead to Publish and Revise. Select steps by pointer and keyboard, rename Publish, and remove the focused step. Record which requests the host receives and which controls have focus.

**Acceptance scenarios**

1. **Given** the branching graph, **when** it is displayed, **then** each supplied step shows its title and kind, each named outcome retains its source identity, and each supplied connection joins the expected steps. Two steps with the same title are distinguishable by their supplied context or stable identifiers.
2. **Given** the existing workflow-node action, **when** an author uses pointer, Enter, or Space, **then** each activation exposes one selection request with the stable node identifier. Host-supplied selection stays in effect until the host updates it. Renaming a step retains its identity and any existing selection or focus.
3. **Given** the node navigation area, **when** a keyboard user enters it with Tab, **then** it starts at an available selected node or the first available node. Arrow keys move in the supplied node order and Home and End reach its ends. Navigation and focus changes issue zero selection requests. An offscreen destination remains reachable by name, and keyboard focus stays on a visible control until that destination can receive visible focus.
4. **Given** accessibility focus inside the node navigation area, **when** the host removes the focused step, **then** focus goes to the next surviving step in the previous order, or the previous surviving step if there is no successor. A named canvas control receives focus if no step can receive visible focus. Removing a step while focus is elsewhere leaves that focus in place. A pointer press interrupted by replacement emits zero requests for the replacement.

### User Story 2 — Arrange and view a branching graph (Priority P1)

An author arranges steps so the graph is easier to read. An author or run reviewer can pan, zoom or fit the graph while keeping its connections and outcomes intact.

**Independent test** Drag the middle step of a branching graph, accept its new position, then reject a second move. Pan, zoom and fit from a constrained viewport using pointer and keyboard controls. Compare the original graph against the received requests and the resulting display.

**Acceptance scenarios**

1. **Given** a node with incoming and outgoing connections, **when** the author drags it from its layout control, **then** the node and both sets of incident edges stay aligned throughout the gesture. Completing the gesture emits one position request with that node's identifier and proposed graph-space position. The same action is available without dragging through a named control or the host inspector.
2. **Given** the host leaves the supplied position unchanged or cancels the gesture, **when** the gesture ends, **then** the node and edges return to that supplied position. Canceling a gesture emits zero position requests. A successful position request changes presentation data only when the host applies it.
3. **Given** a graph that extends beyond the viewport, **when** a user pans, zooms, or fits it by the available controls, **then** each completed operation requests a viewport change. Accepting Fit brings the entire test graph into view at a valid scale. Position and semantic connection data retain their values, and viewport requests identify their own change separately.
4. **Given** a viewport control, **when** a user operates it by keyboard or tap, **then** they can pan in each direction, zoom both ways and fit the graph while preserving a visible focus target. The operation issues zero node-position and connection requests.

### User Story 3 — Edit named outcome connections (Priority P1)

A workflow author connects, reassigns, or disconnects an outcome by pointer, keyboard, or tap. They can identify the proposed destination from its name and context.

**Independent test** Drive the same connect, reassign, and disconnect sequence with each input method. Have the host accept the first proposal, reject a reassignment, then accept a repeated reassignment and a disconnect. Compare the requests and rendered connections at each step.

**Acceptance scenarios**

1. **Given** the Approved outcome of Initial review, **when** an author connects it to Publish, reassigns it to Revise, or disconnects the current destination, **then** each completed operation produces exactly one semantic request. It identifies the operation, source node, named outcome, and destination node. The requested destination is the new target for connect or reassign and the current target for disconnect.
2. **Given** steps with repeated titles and outcomes with repeated labels, **when** the author chooses a source, outcome or destination by keyboard or tap, **then** the choices expose names with distinguishing context. The same destination remains selectable when it is outside the viewport. Canceling returns focus to the initiating control if it survives and emits zero semantic requests.
3. **Given** a host that may accept or reject an edit, **when** the author completes an edit and the host keeps the supplied graph, **then** the canvas continues to show the supplied connections and clears any transient gesture preview. After an accepted replacement, the display reflects only the new host-supplied connection. Repeating the same completed gesture on the accepted connection issues zero requests if it would leave the connection unchanged.
4. **Given** an edit in progress, **when** the host changes or removes its source, outcome or proposed destination so the edit no longer applies, **then** the gesture cancels, clears its preview, restores focus predictably, and emits zero stale requests.

### User Story 4 — Inspect a run across display and access needs (Priority P2)

A run reviewer follows named outcomes in the same graph and examines selected or invalid steps. They can inspect the graph on a narrow screen, with assistive technology, or with display preferences that change motion or color.

**Independent test** Open the branching fixture in read-only mode, select and follow named destinations, and inspect a selected invalid step using keyboard, pointer, and tap. Switch modes during a pending edit, then repeat in the narrow, forced-colors and reduced-motion fixtures.

**Acceptance scenarios**

1. **Given** read-only inspection, **when** a reviewer navigates, selects a step, or uses the viewport controls, **then** the reviewer can identify the selected step and its supplied state and named destinations. The host receives zero node-position or semantic connection requests, including when the mode changes before the completion of an in-progress edit.
2. **Given** long step and outcome labels, a narrow viewport, and concurrent selection and validation error, **when** a reviewer inspects the graph, **then** the full accessible labels and both states remain available. The selected, invalid and focused cues remain distinguishable in forced colors. Reduced motion suppresses nonessential animation during navigation or viewport changes.
3. **Given** an empty graph, **when** the user enters the canvas, **then** they encounter a named empty state and a predictable focus destination. Controls that require steps or edges cannot issue edit requests.

### Edge Cases

- A source node can have several named outcomes, and several sources can connect to one destination. An outcome identifier is scoped to its source node. Each outcome can have at most one supplied destination.
- Incoming graph updates retain focus and relationships for unchanged identifiers. A connection whose endpoint or outcome no longer exists stops being displayed. An unavailable subject cannot be edited through a stale control.
- Releasing a pointer outside an edit target, canceling, switching to read-only, or losing the edited subject clears transient interactions. Selection, editing, and viewport controls preserve their separate keyboard behaviors.
- A pending host decision retains the supplied layout, graph, selection and viewport. Temporary interaction feedback clears when the gesture ends or cancels.

## Requirements

### Functional Requirements

- **FR-001** The canvas MUST compose the existing workflow node and accept typed host-owned graph, layout, viewport, selection and mode inputs. Stable node identifiers distinguish both layout and selection. Stable source-scoped outcome identifiers distinguish connections after renaming.
- **FR-002** The canvas MUST render the supplied steps and named outcome connections. It MUST keep handle positions, edge routing and edge hit areas internal. A connection with a missing endpoint or outcome stops being displayed.
- **FR-003** Each activation of the existing node action MUST expose one selection request with the node identifier. The selected state and graph data MUST reflect host updates. Focus movement alone MUST issue zero selection requests.
- **FR-004** Node navigation MUST provide an orderly keyboard entry, arrow-key traversal, Home and End, visible focus and a way to reach offscreen destinations by name. The canvas MUST apply the focus recovery in User Story 1. Navigation and editing controls MUST each retain their expected keyboard behavior.
- **FR-005** The canvas MUST support pan, zoom and fit on a branching graph. Its pointer, keyboard and tap-accessible viewport operations MUST request presentation changes separately from node movement, selection and connection edits. Fitting the supplied test graph MUST show its complete extent.
- **FR-006** An author MUST be able to request a graph-space node position with drag and an equivalent operation without dragging. The node and incident edges MUST stay aligned during the drag. Completion emits one request with the node identifier and position. Cancellation emits zero requests and restores the supplied layout.
- **FR-007** An author MUST be able to connect, reassign and disconnect a named outcome by pointer, keyboard and tap without relying on edge geometry. Each completed edit requests one operation with explicit source node, outcome and destination identifiers. The canvas documentation MUST explain how a host inspector can offer equivalent operations and keep the host-owned values authoritative.
- **FR-008** The canvas MUST make named destinations discoverable independently of their position and distinguish repeated titles and labels. A canceled action or unchanged connection MUST emit zero semantic requests. An edit whose subject or target becomes obsolete during the gesture MUST cancel.
- **FR-009** The host MUST own acceptance, rejection and supplied graph, layout, selection and viewport values. Displayed connections MUST reflect those values after an accepted update or a rejection. Transient feedback MUST clear after the gesture. The display of accepted connections MUST contain at most one connection per outcome.
- **FR-010** Read-only mode MUST retain navigation, selection and viewport controls while producing zero layout-edit or semantic connection requests. Entering read-only during an edit MUST cancel that edit.
- **FR-011** The canvas MUST expose full accessible labels and coexisting selected, focused and invalid states in the narrow fixture and under forced colors. It MUST retain visible focus and honor reduced motion. The empty state MUST provide predictable focus and prevent edits with no available subject.
- **FR-012** The canvas MUST run in the library's offline, strict-CSP environment with token styling. Before introducing any graph rendering dependency, the project MUST compare candidate rendering approaches for keyboard access, responsiveness at representative graph sizes, shipped bytes and strict-CSP compatibility. The comparison and decision MUST be available for plan review.
- **FR-013** The library MUST publish the per-element export and generated custom-elements manifest entry. Consumer documentation MUST describe the typed inputs, host ownership, event distinctions, keyboard navigation and inspector equivalents. Storybook and browser evidence MUST cover the declared interaction and display states, including light and dark visual baselines.

### Key Entities

- **Workflow graph** A host-supplied ordered set of steps and directed connections. A step carries a stable identifier, display data, current status and named outcomes compatible with the workflow-node contract.
- **Connection** An explicitly identified relationship from a source node and one of its named outcomes to a destination node. Several connections may reach the same destination.
- **Layout and viewport** Separate presentation records. Layout supplies a position per node in shared graph coordinates. The viewport supplies translation and a finite positive scale. Changing either can preserve every graph value.
- **Selection and mode** The selected node identifier or empty selection, and the mode for authoring or read-only inspection. The host supplies both.
- **Request** One observable user intent. Selection identifies a node. Presentation requests identify either a proposed node position or viewport. Semantic requests identify an operation and the source, outcome and destination.

## Success Criteria

### Measurable Outcomes

- **SC-001** In the branching fixture, pointer, Enter and Space each give the host one request with the expected node identifier. The accessibility and browser checks verify the stated Tab entry, arrow and endpoint traversal, repeated labels, offscreen reachability, interrupted activation and removal recovery, with zero requests from focus changes.
- **SC-002** In the branching fixture at the narrow viewport, the drag check verifies alignment for all incident edges and one final position request. Both the drag and non-drag operations exercise host acceptance and rejection. Pan, zoom in, zoom out and fit can each be reached through keyboard and tap controls. The payload and state checks verify that all original semantic graph values survive presentation changes.
- **SC-003** The fixture completes connect, reassign, and disconnect by each of pointer, keyboard and tap. Each of the nine completed operations reports one exact tuple and operation. Rejection clears the preview, acceptance shows exactly the supplied connection, and cancellation, stale targets and unchanged edits report zero requests.
- **SC-004** A read-only run can select and discover named destinations on the same fixture. Navigation and viewport interactions, including a mode switch before edit completion, produce zero edit requests. Automated accessibility and browser evidence retrieves the full long labels, both coexisting states and visible focus at the tested narrow width, in both themes and under forced colors. The reduced-motion and empty-graph checks exercise the stated outcomes.
- **SC-005** The plan review compares at least a small branching graph and a larger representative graph for interaction responsiveness, shipped byte change, keyboard coverage and behavior under the unchanged strict CSP. It documents the fixture sizes and why they represent the trial, along with the chosen approach. The built fixture loads without extra CSP allowances or external resources.
- **SC-006** The component has a per-element export, matching manifest and consumer documentation. Its story inventory and pinned light and dark baselines cover the required interaction and display states. Browser interaction evidence covers the events and keyboard paths above.

## Assumptions

- The consumer is Workflow Studio in the Ocelle web console. It owns validation, persistence, serialization, undo and runtime services. Its composition is covered by #76. The canvas consumes the #72 node contract and uses the existing workflow board and list/detail only as reference for layout and focus behavior.
- The host supplies well-formed records with unique nonempty node identifiers and outcome identifiers unique within their source, finite coordinates and a valid viewport scale. The host owns domain policy for self-connections, cycles and outcome eligibility.
- A matching host update represents acceptance. Keeping the supplied state represents rejection or a pending decision. The fixture exercises both without external services.
- Keep phases in order and use the reviewed Op 028 instructions for the first eligible group inside a phase. Planning establishes each task's dependencies and exact write paths. The trial records dispatch-to-combined-green time, the integrated red/green proof and any serial fallback. Standard review and hosted gates apply.
