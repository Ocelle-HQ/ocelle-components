# Feature Specification: Workflow Studio Compositions

**Feature Branch**: `039-workflow-studio-compositions`

**Created**: 2026-11-28

**Status**: Draft

**Input**: [Issue #76](https://github.com/Ocelle-HQ/ocelle-components/issues/76) and [approved triage](../../triage/039-workflow-studio-compositions.md).

## User Scenarios & Testing

### User Story 1 — Author and validate a branching workflow (P0)

As a workflow author, I want to place a step, bind its accountable reviewer, and wire its outcomes so I can see exactly what is ready and what still needs attention.

**Why this priority**. This is the primary authoring journey and the first delivery phase.

**Independent test**. Open the authoring example from its reset state. Use the keyboard to add one Security review step, reach its missing reviewer field from the finding, bind the reviewer, and connect Approved and Rejected to different destinations. Observe the request and retained state for a rejected destination edit. Delete Security review with Publish decision as the next visible step. Exercise a tap-based editing path and the narrow inspector transition in the same journey.

1. Given a palette and an initial graph in the list-detail layout, when a user adds Security review using the keyboard through the listbox or action-row palette, then exactly one new selectable step appears with a stable identity, no accountable reviewer, and a visible missing-binding finding. The placed step can be selected without editing layout or connections.
2. Given the missing binding, when the user activates its finding, then the inspector reveals and focuses the actual accountable-reviewer form-select control. At a narrow width the drawer reveals the inspector before focus moves to the field. Binding the named reviewer clears that finding and visibly updates the selected step’s binding state.
3. Given a selected Security review step, when the user connects Approved and Rejected to two different named destinations, then each outcome displays its approved destination. An accepted layout move changes the visible position while the serialized semantic fixture remains byte for byte the same. An accepted destination change updates the correct semantic connection. For a rejected destination edit, the observed host request identifies the intended source step, outcome and proposed destination. The notice reports the rejection, and the previously accepted connection and serialized semantic fixture remain unchanged.
4. Given focus on Security review or a control that disappears when that selected step is removed, when the author removes it, then exactly that step disappears and focus moves to the operable Publish decision selection action, the next visible step in the fixture. If there is no visible successor, use the previous visible step when it survives. If no visible step action survives, the Step selector is the fallback when steps remain, and the Add step palette control is the fallback when the graph is empty. An unaffected control already holding focus retains it. At a narrow width, closing the inspector returns focus to the operable control that opened it when it survives, or uses the same fallback when it is gone.
5. Given the same graph in inspection mode, when users select a step, navigate the viewport and exercise authoring gestures against the corresponding visible graph targets, then selection and reading still work. Confirm each attempted gesture reaches the intended target. The observed request stream allows the existing explicit selection and viewport requests and contains zero step-position, connection or other workflow edit requests. Keyboard and tap paths reach the inspection controls without requiring a drag.

### User Story 2 — Inspect a run and complete a planning interview (P1)

As a run reviewer, I want to inspect the recorded workflow and enter an interview answer so I can understand who did what, preserve an unfinished answer after a save failure, and see which plan revision was reviewed.

**Why this priority**. This follows authoring and demonstrates inspection and decisions using the same component family.

**Independent test**. Open a fictional planning run, inspect its read-only workflow and open the interview dialog. The data owner answers “one hour”. The first save fails. Correct or resubmit the retained answer, then follow the later engineering lead’s review of a named plan revision. Repeat the failed-save path with a separate two-line answer and verify the exact line break.

1. Given the recorded graph in read-only inspection, when the user moves between steps, navigates the viewport, opens decision information or attempts an authoring gesture on the corresponding visible graph target, then the selected step and its status are available for reading. Observe that the gesture reaches the intended target. The graph’s observed request stream allows the existing explicit selection and viewport requests and contains zero step-position, connection or other workflow edit requests. Navigation and view arrangement belong to the story fixture’s view state.
2. Given a planning interview waiting for an answer, when the data owner enters “one hour” and the host refuses the save, then the same answer remains present and editable, with an accessible failure message and a way to retry. After the host accepts the retry, the timeline shows the answer once, authored by the data owner. In a separately reset run, enter “one hour” on the first line and “for the initial review” on the second. Reject that save, verify both lines and the line break are retained in the editing control, then edit and resubmit the answer.
3. Given the engineering lead’s subsequent review, when the user opens it or reads the timeline, then the lead and data owner are distinguishable by name and role, and the timeline distinguishes their events and their evidence. The review identifies the plan revision by a stable fictional reference and shows its decision separately from the original answer.
4. Given the decision dialog was opened from a focusable run action, when it closes using the keyboard or a visible dismissal action, then focus returns to that action when it remains visible and operable, or to the run’s visible Step selector when it is unavailable. On the narrow layout, users can reach the same run information, answer and evidence without losing a retained answer during the pane transition.

### User Story 3 — Compare a catalog upgrade and change a pin deliberately (P2)

As a workflow maintainer, I want to compare an available node version, keep distinct instances independent, and decide explicitly when to change the pinned digest.

**Why this priority**. This is the final phase and consumes the existing version comparison recipe.

**Independent test**. Open the catalog example with an admitted fictional Security review node. Place two instances. Change only one instance’s reviewer, preview the new version’s capabilities, dismiss it, then revisit and explicitly accept the upgrade for the first instance.

1. Given the admitted entry, when the host places it twice, then each instance has a distinct stable identity and its own role binding. Changing the first accountable reviewer leaves the second binding intact, including after switching selection.
2. Given an available version, when a maintainer opens its comparison, then the example shows the current and offered versions, their distinct pinned and offered digests, and the new capabilities in a meaningful reading order. The selected instance’s pin and the other instance’s pin keep their original values while the comparison is open, previewed or dismissed.
3. Given the maintainer explicitly accepts the upgrade for one instance and the host reports success, then that instance’s pin becomes the offered digest once and its reviewer binding is retained. The other instance keeps its version, digest and binding.
4. Given the compact layout, when the same controls are operated by keyboard or tap, then the comparison, accept and dismiss actions are reachable, focus returns to the operable comparison opener after dismissal or to the relevant visible instance selection action when the opener is unavailable, and the visible version state matches the fixture’s accepted state.

### Edge Cases

- Selecting a validation finding after the narrow inspector is closed reaches the actual, enabled binding field.
- Closing a pane returns focus to its visible, operable opener or to the specified fallback if that opener is hidden, disabled or removed. Verify a mounted opener in a hidden narrow pane. Focus stays on an unaffected control that already holds it.
- A rejected destination update and a failed interview save each preserve the last successfully committed host state. The editor retains any pending interview text for retry.
- Selection, viewport navigation and opening details in a read-only view remain usable. Selection and viewport requests leave step positions, connections, role bindings and evidence unchanged.
- Comparing or dismissing a version offer can be repeated without changing a pin or disturbing the other instance.

## Requirements

### Functional Requirements

- **FR-001**. Deliver three executable Storybook journeys in this order: Authoring, Run inspection, and Catalog upgrades. Each works with deterministic fictional state and can run independently.
- **FR-002**. The authoring fixture supports keyboard palette placement of one stable Security review step, a named accountable reviewer and separately wired Approved and Rejected outcomes. Compose the existing list-detail for graph and inspector presentation, a listbox or action-row for the palette, form-select for reviewer binding, notice for feedback and drawer for the narrow inspector. The existing workflow node, canvas and status presentation show step selection, status and binding.
- **FR-003**. Activating a missing-binding finding reveals and focuses the exact inspector field, including in a constrained recipe container at a wide viewport. Binding clears that finding. An author can remove the selected step through its named action by keyboard or tap. Deletion clears its binding, incoming and outgoing edges and layout entry, reconciles selection and inspector state, and preserves unrelated records. Verify visible Publish decision focus in the named specimen, the Step or Add step fallback where applicable, and focus preserved on an unaffected control.
- **FR-004**. Separate serialized workflow semantics from layout state. A successful move keeps the serialized semantic fixture identical and a successful destination edit changes the intended connection. Observe the rejected destination request before verifying that the accepted graph and visible connection are preserved, the notice reports the rejection through its existing live behavior, and focus remains on the available editing control.
- **FR-005**. The authoring example demonstrates the read-only transition and the run example reuses the existing read-only graph. Inspect both graphs’ request streams. Explicit selection and viewport requests remain available, with zero step-position, connection or other workflow edit requests during the exercised inspection paths.
- **FR-006**. The run fixture composes an interview dialog and decision facts. A refused save gives a clear error and preserves the editable answer exactly, including its line break in the two-line specimen. The successful retry records one answer, and the later engineering lead review refers to the named version of the plan.
- **FR-007**. The run timeline exposes distinct actors, roles, event types and evidence for the answer and later plan review. The lead’s review and the data owner’s answer are distinguishable by reading or navigating the timeline.
- **FR-008**. The catalog fixture admits a fictional reusable entry. Two placed instances retain independent identities, bindings and pinned digests. An available version presents added capabilities and keeps each pin until explicit successful acceptance for that instance.
- **FR-009**. Keyboard-only and tap paths support the primary actions of all three journeys. The narrow pane transitions keep the active state, and dismissal or deletion transfers focus to the originating or documented fallback control as appropriate.
- **FR-010**. Prove the real interactions in the built Storybook compositions and verify that the fixture markup contains no inline scripts, styles or event handlers and that all requests stay on the local origin. Provide pinned light and dark Visual baselines, Axe and representative forced-colour evidence. Separately, use the strict package-runtime harness to exercise authoring selection and reviewer binding, read-only run navigation and failed interview save, and opening and dismissing a catalog comparison. Verify the composed interactions run cleanly under that policy and retain the package CSP gate in its existing scope. Reuse existing element, token and responsive patterns. Keep public API changes, new runtime assets or dependencies, and runtime integrations outside this mission. Simulated domain actions complete within the fixture.

### Key Entities

- **Workflow step**. A stable instance identity, visible name, reviewer binding, and named accepted destination per outcome.
- **Layout state**. The step positions and view settings determined by the authoring fixture and stored independently of the semantic example.
- **Run event**. A fictional actor, role, action, and evidence reference. The interview answer and plan revision review are distinct records.
- **Catalog entry and instance**. An admitted reusable entry has current and offered versions with distinct fictional digests. Each instance has its own reviewer and accepted pin.

## Success Criteria

- **SC-001**. Add exactly one step with the keyboard, open the real drawer from a finding in a narrow recipe container and focus the Unassigned reviewer control. Bind the named reviewer and wire both destinations. Activate the selected step's Remove control, verify its state and references are gone, retain an unrelated edge, and check actual Publish decision focus or the appropriate fallback.
- **SC-002**. A layout-only movement leaves the authoritative serialized semantic fixture byte identical. An accepted destination change alters only the intended edge. For rejection, observe the intended host request, unchanged accepted graph, one meaningful accessible notice announcement, and focus on the operable editing control. For both read-only examples, record exercised selection and viewport requests and zero step-position, connection or other workflow edit requests.
- **SC-003**. The first failed interview save leaves “one hour” in the field and displays a visible error. A separate failed save retains both lines and the line break of the two-line draft, which remains editable and can be resubmitted. After a successful retry, the timeline contains one answer and one later review, names distinct actors and roles, and identifies the reviewed plan revision.
- **SC-004**. Across two catalog instances, changing one role binding leaves the other intact. Preview and dismissal leave both original digests intact. After one explicit accepted upgrade, only the selected instance’s digest changes.
- **SC-005**. Each phase has executable keyboard and tap evidence and a representative narrow layout assertion with focus return or recovery. Verify minimum primary target size and unclipped visible keyboard focus in representative normal and forced-colour paths. Verify built Storybook interactions, local-only requests and fixture markup without inline scripts, styles or event handlers. Retain pinned light and dark captures and Axe results. Record separate passing representative strict package-runtime interactions and the existing package CSP gate.

## Assumptions

- The delivered node, canvas, status, list-detail, palette, form-select, notice, drawer, textarea, event timeline, comparison, facts and dialog surfaces are dependencies. The examples reuse their existing contracts and the repository’s Storybook and responsive inspector patterns. [Approved triage](../../triage/039-workflow-studio-compositions.md)
- Storybook fixtures own all simulated validation, save, admission and upgrade outcomes. Data is fictional and resets when each example starts. Editor services, persistence, the Basket client and runtime admission remain in their host products.
