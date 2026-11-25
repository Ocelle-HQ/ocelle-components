# Feature specification for an accessible workflow canvas

**Feature branch** `029-workflow-canvas`

**Created** 2026-11-23

**Status** Draft

**Input** [Issue #73](https://github.com/Ocelle-HQ/ocelle-components/issues/73) and [approved triage](../../triage/029-workflow-canvas.md)

## User Scenarios & Testing

### User Story 1 — Select and navigate a workflow (Priority P1)

A Workflow Studio author opens a branching graph, identifies the steps and their outcomes, and selects the step to work on. A keyboard user can find the same steps by name and in a predictable order.

**Independent test** Mount a host fixture with an Initial review step whose Approved and Rejected outcomes lead to Publish and Revise. Put focusable controls before and after the node group. Select steps by pointer and keyboard, rename Publish, reveal an offscreen step by name, and remove the focused step. Record the full stream of requests and actual focus on the landed workflow-node actions and neighboring controls.

**Acceptance scenarios**

1. **Given** the branching graph, **when** it is displayed, **then** each supplied step shows its title and kind, each named outcome retains its source identity, and each supplied connection joins the expected steps. Two steps with the same title are distinguishable by their supplied context or stable identifiers.
2. **Given** the existing workflow-node action, **when** an author uses pointer, Enter, or Space, **then** the full request stream contains exactly one selection request with the stable node identifier. Host-supplied selection stays in effect until the host updates it. Renaming a step retains its identity and selection, and retains focus while its action stays visible.
3. **Given** multiple nodes with visible, focusable selection actions, **when** a keyboard user enters the group from either direction, **then** the visible selected node or first visible node provides the single sequential entry. Inside the group, Left and Up move to the previous visible node in supplied order, Right and Down move to the next one, and Home and End reach the first and last visible nodes. Movement stops at the ends. Only the current node action is in the Tab sequence, so Tab and Shift+Tab leave the group for neighboring controls. A named canvas navigation control remains a Tab stop when no node action can receive visible focus. Focus navigation itself emits zero requests.
4. **Given** a clipped node, **when** a keyboard user finds it by name in the canvas navigation control and asks to reveal it, **then** the canvas emits one viewport request and keeps focus on the visible initiating control while the host withholds the viewport change. If the host accepts a viewport that reveals the node, focus moves to its existing selection action while the initiating control still holds focus. The destination remains available by name if the host keeps the viewport unchanged.
5. **Given** focus on a node action, **when** the host removes the node or updates the viewport so its action is clipped, **then** focus goes to the next surviving visible node in the previous node order, or the previous surviving visible node if there is no visible successor. If neither exists, focus goes to the named canvas navigation control. If focus is already outside the affected controls, it stays in place. A pointer press interrupted by replacement emits zero requests for the replacement.

### User Story 2 — Arrange and view a branching graph (Priority P1)

An author arranges steps so the graph is easier to read. An author or run reviewer can pan, zoom or fit the graph while keeping its connections and outcomes intact.

**Independent test** Drag selected and unselected steps in a branching graph with a translated viewport scaled by two. Accept one position and reject another. Pan, zoom and fit from a constrained viewport using pointer and keyboard controls. Compare the original graph, full request stream and resulting display.

**Acceptance scenarios**

1. **Given** a selected or unselected node with incoming and outgoing connections, **when** the author drags it from its layout control, **then** the node and both sets of incident edges stay aligned throughout the gesture. At twice the scale, moving 40 screen units right and 20 up requests the node's original graph-space position plus 20 right and 10 up. The complete request stream contains exactly one position request with that node's identifier. The same action is available without dragging through a named control or the host inspector.
2. **Given** the author cancels the gesture or the host keeps the supplied position after a request, **when** the canvas clears the drag preview, **then** the node and edges return to that supplied position. Canceling a gesture emits zero requests of any kind. A successful position request changes presentation data only when the host applies it.
3. **Given** a graph that extends beyond the viewport, **when** a user pans, zooms, or fits it by the available controls, **then** each completed operation requests a viewport change. Accepting Fit brings the entire test graph into view at a valid scale. Position and semantic connection data retain their values, and viewport requests identify their own change separately.
4. **Given** a viewport control, **when** a user operates it by keyboard or tap, **then** they can pan in each direction, zoom both ways and fit the graph while preserving a visible focus target. Each completed operation emits exactly one viewport request, and any resulting focus recovery emits zero additional requests.

### User Story 3 — Edit named outcome connections (Priority P1)

A workflow author connects, reassigns, or disconnects an outcome by pointer, keyboard, or tap. They can identify the proposed destination from its name and context.

**Independent test** Drive the same connect, reassign, and disconnect sequence with mouse, keyboard and single-pointer taps. Have the host accept the first proposal, reject a reassignment, then accept a repeated reassignment and a disconnect. Compare the full request stream and rendered connections at each step.

**Acceptance scenarios**

1. **Given** the Approved outcome of Initial review, **when** an author connects it to Publish, reassigns it to Revise, or disconnects the current destination through the edit controls, **then** each completed operation produces exactly one request in the full stream. It is a semantic request identifying the operation, source node, named outcome, and destination node. The requested destination is the new target for connect or reassign and the current target for disconnect. The same request counts apply while selection is unchanged throughout the edit.
2. **Given** steps with repeated titles and outcomes with repeated labels, **when** the author chooses a source, outcome or destination by keyboard or taps, **then** the choices expose names with distinguishing context. The same destination remains selectable for the edit when it is outside the viewport. Separate taps on the named source, outcome and destination controls can complete connect and reassign. A named disconnect control completes disconnect by tap. All three tap paths work without dragging or sustained presses.
3. **Given** a host that may accept or reject an edit, **when** the author completes an edit and the host keeps the supplied graph, **then** the canvas continues to show the supplied connections and clears any transient gesture preview. After an accepted replacement, the display reflects only the new host-supplied connection. Repeating the same completed gesture on the accepted connection issues zero requests if it would leave the connection unchanged.
4. **Given** an edit in progress, **when** the host invalidates its source, outcome or proposed destination or changes the current connection of the edited outcome, **then** the edit cancels, clears its preview and emits zero requests of any kind. This includes connecting an outcome that was disconnected when its edit began and changing the current destination during reassignment or disconnect while all identifiers survive. Changes limited to display names preserve the in-progress edit and its identifiers.
5. **Given** focus on an edit control, **when** the author presses Escape or a host update cancels the edit, **then** the canvas returns focus to the visible initiating control if it still exists. If it disappears or is clipped, focus goes to the source node's visible selection action. If the source action is unavailable, focus follows the visible survivor order and named canvas fallback in User Story 1. The test covers Escape, removal of the source and switching to read-only so the initiating control disappears. Each cancellation emits zero requests of any kind.

### User Story 4 — Inspect a run across display and access needs (Priority P2)

A run reviewer follows named outcomes in the same graph and examines selected or invalid steps. They can inspect the graph on a narrow screen, with assistive technology, or with display preferences that change motion or color.

**Independent test** Open the branching fixture in read-only mode, select and follow named destinations, and inspect a selected invalid step using keyboard, pointer, and tap. Switch modes during a pending edit, then repeat in the narrow, forced-colors and reduced-motion fixtures.

**Acceptance scenarios**

1. **Given** read-only inspection, **when** a reviewer navigates, selects a step, or uses the viewport controls, **then** the reviewer can identify the selected step and its supplied state and named destinations. The host receives only the explicit selection and viewport requests described above. If the mode changes before an edit finishes, that edit cancels with zero requests and focus recovers as described in User Story 3.
2. **Given** long step and outcome labels, a narrow viewport, and concurrent selection and validation error, **when** a reviewer inspects the graph, **then** the full accessible labels and both states remain available. The selected, invalid and focused cues remain distinguishable in forced colors. Reduced motion suppresses nonessential animation during navigation or viewport changes.
3. **Given** an empty graph, **when** the user enters the canvas, **then** they encounter a named empty state and a predictable focus destination. Controls that require steps or edges cannot issue edit requests.

### Edge Cases

- A source node can have several named outcomes, and several sources can connect to one destination. An outcome identifier is scoped to its source node. Each outcome can have at most one supplied destination.
- Incoming graph updates retain visible focus and relationships for unchanged identifiers. A connection whose endpoint or outcome no longer exists stops being displayed. Unavailable subjects and outcomes whose current connection has changed invalidate pending edits.
- Releasing a pointer outside an edit target, canceling, switching to read-only, or losing the edited subject clears transient interactions. Selection, editing, and viewport controls preserve their separate keyboard behaviors.
- A pending host decision retains the supplied layout, graph, selection and viewport. Temporary interaction feedback clears when the gesture ends or cancels.

## Requirements

### Functional Requirements

- **FR-001** The canvas MUST compose the existing workflow node and accept typed host-owned graph, layout, viewport, selection and mode inputs. Stable node identifiers distinguish both layout and selection. Stable source-scoped outcome identifiers distinguish connections after renaming.
- **FR-002** The canvas MUST render the supplied steps and named outcome connections. It MUST keep handle positions, edge routing and edge hit areas internal. A connection with a missing endpoint or outcome stops being displayed.
- **FR-003** Each activation of the existing node action MUST expose exactly one selection request with the node identifier. The selected state and graph data MUST reflect host updates. Focus movement and host updates alone MUST emit zero requests. Each explicit selection, node position, viewport change or connection edit MUST emit only its own request kind.
- **FR-004** Node navigation MUST provide a single sequential entry when a node action can receive visible focus, predictable arrows and endpoints, and exit to neighboring controls in both Tab directions. A visible, named canvas navigation control MUST let users find clipped nodes and request their reveal while the host retains viewport control. The canvas MUST follow User Story 1 for accepted and withheld views and for focus recovery after removal or clipping.
- **FR-005** The canvas MUST support pan, zoom and fit on a branching graph. Each completed pointer, keyboard or tap viewport operation MUST emit exactly one viewport request. Fitting the supplied test graph MUST show its complete extent.
- **FR-006** An author MUST be able to request a graph-space node position with drag and an equivalent operation without dragging. The node and incident edges MUST stay aligned during the drag. Completion emits exactly one position request with the node identifier and graph-space position. Cancellation emits zero requests and restores the supplied layout.
- **FR-007** An author MUST be able to connect, reassign and disconnect a named outcome by pointer, keyboard and separate taps without dragging. Named choices MUST work independently of edge geometry and the current viewport. Each completed edit emits exactly one semantic request with explicit source node, outcome and destination identifiers. The canvas documentation MUST explain equivalent host inspector operations.
- **FR-008** The canvas MUST distinguish repeated destination titles and outcome labels. Escape, loss of the edited subject or target, and a host update to the edited outcome's current connection MUST cancel the edit and recover focus as described in User Story 3. Canceled actions and unchanged connections MUST emit zero requests of any kind.
- **FR-009** The host MUST own acceptance, rejection and supplied graph, layout, selection and viewport values. Displayed connections MUST reflect those values after an accepted update or a rejection. Transient feedback MUST clear after the gesture. The display of accepted connections MUST contain at most one connection per outcome.
- **FR-010** Read-only mode MUST retain navigation, selection and viewport controls while producing zero node-position or semantic connection requests. Entering read-only during an edit MUST cancel the edit and apply the focus recovery in User Story 3.
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

- **SC-001** In the branching fixture, pointer, Enter and Space each give the host one selection request with the expected node identifier. Tests traverse the actual node actions and neighboring controls in both Tab directions and verify arrow directions and bounds, duplicate labels, interrupted activation and recovery from removal or clipping. A named reveal emits one viewport request. Focus stays visible while the host withholds the change and moves to the revealed node on acceptance if the initiating control still holds focus. Acceptance after the user moves focus leaves their new focus in place. The other navigation and focus checks observe zero requests.
- **SC-002** In the branching fixture with translation and a non-unit scale, dragging selected and unselected nodes proves alignment of all incident edges and exactly one final position request with the expected graph-space coordinates. Both drag and non-drag operations exercise host acceptance and rejection. Pan, zoom in, zoom out and fit by keyboard and tap each emit one viewport request. The full request stream and host data show that position and viewport actions preserve the graph.
- **SC-003** The fixture completes connect, reassign, and disconnect by each of mouse, keyboard and single-pointer taps without dragging on the tap paths. The full stream for each of the nine operations contains one semantic request with the exact operation and tuple. Rejection clears the preview, and acceptance shows exactly the supplied connection. Escape, source removal, unchanged edits and a changed authoritative connection with surviving identifiers each emit zero requests. The cancellation tests check the stated focus destinations.
- **SC-004** A read-only run can select and discover named destinations on the same fixture. Its full request stream contains only the explicit selection and viewport requests, including after cancellation of an in-progress edit on a mode change. The mode-change test checks focus recovery when the initiating control disappears. Automated accessibility and browser evidence retrieves the full long labels, both coexisting states and visible focus at the tested narrow width, in both themes and under forced colors. The reduced-motion and empty-graph checks exercise the stated outcomes.
- **SC-005** The plan review compares at least a small branching graph and a larger representative graph for interaction responsiveness, shipped byte change, keyboard coverage and behavior under the unchanged strict CSP. It documents the fixture sizes and why they represent the trial, along with the chosen approach. The built fixture loads without extra CSP allowances or external resources.
- **SC-006** The component has a per-element export, matching manifest and consumer documentation. Its story inventory and pinned light and dark baselines cover the required interaction and display states. Browser interaction evidence covers the events and keyboard paths above.

## Assumptions

- The consumer is Workflow Studio in the Ocelle web console. It owns validation, persistence, serialization, undo and runtime services. Its composition is covered by #76. The canvas consumes the #72 node contract and uses the existing workflow board and list/detail only as reference for layout and focus behavior.
- The host supplies well-formed records with unique nonempty node identifiers and outcome identifiers unique within their source, finite coordinates and a valid viewport scale. The host owns domain policy for self-connections, cycles and outcome eligibility.
- The host uses the clipping panes described in the [consumer contract](contracts/workflow-canvas.md#host-clipping). Custom CSS outlines and SVG clip references are follow-up work.
- A matching host update represents acceptance. Keeping the supplied state represents rejection or a pending decision. The fixture exercises both without external services.
- Keep phases in order and use the reviewed Op 028 instructions for the first eligible group inside a phase. Planning establishes each task's dependencies and exact write paths. The trial records dispatch-to-combined-green time, the integrated red/green proof and any serial fallback. Standard review and hosted gates apply.
