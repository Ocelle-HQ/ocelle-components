# Feature Specification: Workflow Studio Compositions

**Feature Branch**: `039-workflow-studio-compositions`

**Created**: 2026-11-28

**Status**: Draft

**Input**: [Issue #76](https://github.com/Ocelle-HQ/ocelle-components/issues/76) and [approved triage](../../triage/039-workflow-studio-compositions.md).

## User Scenarios & Testing

### User Story 1 — Author and validate a branching workflow (P0)

As a workflow author, I want to place a step, bind its accountable reviewer, and wire its outcomes so I can see exactly what is ready and what still needs attention.

**Why this priority**. This is the primary authoring journey and the first delivery phase.

**Independent test**. Open the authoring example from its reset state. Use the keyboard to add one Security review step, use its validation finding to reach the missing reviewer field, fill it, connect Approved and Rejected to two distinct named destinations, try a rejected edit, and remove the selected step. Exercise a tap-based editing path and the narrow inspector transition in the same journey.

1. Given a palette and an initial graph, when a user adds Security review using the keyboard, then exactly one new selectable step appears with a stable identity, no accountable reviewer, and a visible missing-binding finding. The placed step can be selected without editing layout or connections.
2. Given the missing binding, when the user activates its finding, then the inspector reveals and focuses the actual accountable-reviewer control, including when the narrow layout needs to reveal the inspector first. Binding the named reviewer clears that finding and visibly updates the selected step’s binding state.
3. Given a selected Security review step, when the user connects Approved and Rejected to two different named destinations, then each outcome displays its approved destination. An accepted layout move changes the visible position while the serialized semantic fixture remains byte for byte the same. An accepted destination change updates the correct semantic connection. A host-rejected change leaves the previously accepted connection and semantic fixture in place and reports the rejection.
4. Given a selected step, when the author removes it, then exactly that step is removed and focus moves to the next deterministic reachable workflow control. The user can immediately resume selecting or adding steps through that control. At a narrow width, closing the inspector returns focus to the control that opened it if it still exists.
5. Given the existing graph in inspection mode, when users select or navigate to a step and attempt an authoring gesture, then selection and reading still work and no mutation request is emitted. Keyboard and tap paths reach the related controls without requiring a drag.

### User Story 2 — Inspect a run and complete a planning interview (P1)

As a run reviewer, I want to inspect the recorded workflow and enter an interview answer so I can understand who did what, preserve an unfinished answer after a save failure, and see which plan revision was reviewed.

**Why this priority**. This follows authoring and demonstrates inspection and decisions using the same component family.

**Independent test**. Open a fictional planning run, inspect its read-only workflow, and open the interview dialog. The data owner answers “one hour”. The first save fails. Correct or resubmit the retained answer, then follow the later engineering lead’s review of a named plan revision.

1. Given the recorded graph in read-only inspection, when the user moves between steps or opens decision information, then the selected step and its status are available for reading and the graph emits no edit or mutation request. Navigation and visual arrangement belong to the story fixture’s view state.
2. Given a planning interview waiting for an answer, when the data owner enters “one hour” and the host refuses the save, then the same answer remains present and editable, with an accessible failure message and a way to retry. After the host accepts the retry, the timeline shows the answer once, authored by the data owner.
3. Given the engineering lead’s subsequent review, when the user opens it or reads the timeline, then the lead and data owner are distinguishable by name and role, and the timeline distinguishes their events and their evidence. The review identifies the plan revision by a stable fictional reference and shows its decision separately from the original answer.
4. Given the decision dialog was opened from a focusable run action, when it closes using the keyboard or a visible dismissal action, then focus returns to that action. On the narrow layout, users can reach the same run information, answer and evidence without losing a retained answer during the pane transition.

### User Story 3 — Compare a catalog upgrade and change a pin deliberately (P2)

As a workflow maintainer, I want to compare an available node version, keep distinct instances independent, and decide explicitly when to change the pinned digest.

**Why this priority**. This is the final phase and consumes the existing version comparison recipe.

**Independent test**. Open the catalog example with an admitted fictional Security review node. Place two instances. Change only one instance’s reviewer, preview the new version’s capabilities, dismiss it, then revisit and explicitly accept the upgrade for the first instance.

1. Given the admitted entry, when the host places it twice, then each instance has a distinct stable identity and its own role binding. Changing the first accountable reviewer leaves the second binding intact, including after switching selection.
2. Given an available version, when a maintainer opens its comparison, then the example shows the current and offered versions, their distinct pinned and offered digests, and the new capabilities in a meaningful reading order. The selected instance’s pin and the other instance’s pin keep their original values while the comparison is open, previewed or dismissed.
3. Given the maintainer explicitly accepts the upgrade for one instance and the host reports success, then that instance’s pin becomes the offered digest once and its reviewer binding is retained. The other instance keeps its version, digest and binding.
4. Given the compact layout, when the same controls are operated by keyboard or tap, then the comparison, accept and dismiss actions are reachable, focus returns to the originating instance after dismissal, and the visible version state matches the fixture’s accepted state.

### Edge Cases

- Selecting a validation finding after the narrow inspector is closed reaches the actual, enabled binding field.
- Closing a pane after its opener was deleted reaches the documented fallback control. It remains visible and usable.
- A rejected destination update and a failed interview save each preserve the last successfully committed host state. The editor retains any pending interview text for retry.
- Selection and opening details in a read-only view remain usable. They never change nodes, connections, role bindings, or evidence.
- Comparing or dismissing a version offer can be repeated without changing a pin or disturbing the other instance.

## Requirements

### Functional Requirements

- **FR-001**. Deliver three executable Storybook journeys in this order: Authoring, Run inspection, and Catalog upgrades. Each works with deterministic fictional state and can run independently.
- **FR-002**. The authoring fixture supports keyboard palette placement of one Security review step, distinct stable identity, a named accountable reviewer binding, and separately wired Approved and Rejected outcomes. The composed UI visibly presents step selection, status and binding.
- **FR-003**. Activating a missing-binding finding reveals and focuses the exact inspector field. Binding clears that finding. Deleting the selected step recovers focus to a known reachable workflow control.
- **FR-004**. Separate serialized workflow semantics from layout state. A successful move keeps the serialized semantic fixture identical. A successful destination edit changes the intended semantic connection, and host rejection preserves the accepted graph and surfaces a visible result.
- **FR-005**. The authoring example teaches the read-only transition, and the run example reuses the existing read-only graph. Inspection selection and navigation remain available, and no graph mutation is requested.
- **FR-006**. The run fixture composes an interview dialog and decision facts. It retains the multiline draft and shows a clear error when the host refuses a save. The successful retry records one answer, and the later engineering lead review refers to the named version of the plan.
- **FR-007**. The run timeline exposes distinct actors, roles, event types and evidence for the answer and later plan review. The lead’s review and the data owner’s answer are distinguishable by reading or navigating the timeline.
- **FR-008**. The catalog fixture admits a fictional reusable entry. Two placed instances retain independent identities, bindings and pinned digests. An available version presents added capabilities and keeps each pin until explicit successful acceptance for that instance.
- **FR-009**. Keyboard-only and tap paths support the primary actions of all three journeys. The narrow pane transitions keep the active state, and dismissal or deletion transfers focus to the originating or documented fallback control as appropriate.
- **FR-010**. Prove the executable interactions, light and dark pinned Visual baselines, Axe, the representative forced-colour paths, and the relevant strict-CSP built interactions. Reuse existing element, token and responsive patterns without new public component APIs, assets, package dependencies, network calls, or runtime services.

### Key Entities

- **Workflow step**. A stable instance identity, visible name, reviewer binding, and named accepted destination per outcome.
- **Layout state**. The step positions and view settings determined by the authoring fixture and stored independently of the semantic example.
- **Run event**. A fictional actor, role, action, and evidence reference. The interview answer and plan revision review are distinct records.
- **Catalog entry and instance**. An admitted reusable entry has current and offered versions with distinct fictional digests. Each instance has its own reviewer and accepted pin.

## Success Criteria

- **SC-001**. In the authoring acceptance route, add exactly one step with the keyboard, focus the exact reviewer field from the validation finding, wire both destinations, and retain a usable focus destination after removing the selected step.
- **SC-002**. An observed layout-only movement leaves the serialized semantic fixture byte identical. An accepted destination change alters the intended connection. Rejection preserves the previous accepted connection. The read-only fixture records zero edit requests while it is inspected.
- **SC-003**. The failed interview save leaves “one hour” in the field and displays a visible error. On success, the timeline contains one answer and one later review, names distinct actors and roles, and identifies the reviewed plan revision.
- **SC-004**. Across two catalog instances, changing one role binding leaves the other intact. Preview and dismissal leave both original digests intact. After one explicit accepted upgrade, only the selected instance’s digest changes.
- **SC-005**. Each phase has independently executable keyboard and tap evidence and a representative narrow layout assertion with focus return or recovery where relevant. Pinned light and dark captures and Axe results cover the delivered examples. Representative forced-colour paths and relevant built interactions operate under the repository’s applicable strict policy.

## Assumptions

- The delivered node, canvas, status, textarea, event timeline, comparison, pane, form and dialog surfaces are dependencies. The examples reuse their existing contracts and the repository’s Storybook and responsive inspector patterns. [Approved triage](../../triage/039-workflow-studio-compositions.md)
- Storybook fixtures own all simulated validation, save, admission and upgrade outcomes. Data is fictional and resets when each example starts. Editor services, persistence, the Basket client and runtime admission remain in their host products.
