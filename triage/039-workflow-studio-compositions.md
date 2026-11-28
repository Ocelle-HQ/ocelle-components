---
triage: 039
issues: [76]
decision: mission
target: "039-workflow-studio-compositions"
in_scope: [76]
out_of_scope: [1, 7, 8, 9, 12, 13, 14, 16, 72, 73, 74, 75, 86, 87, 88, 89, 90, 91, 92, 93, 109]
semver: none
spec_prompt: "Resolve #76 and triage/039-workflow-studio-compositions.md as one Storybook composition mission with independently testable Authoring, Run inspection, and Catalog upgrades phases in that order. Reuse the delivered node, canvas, status, form, timeline, pane, decision, and comparison contracts. Use fictional host fixtures to prove keyboard add, binding, outcome wiring, exact-field validation focus, deletion recovery, layout versus semantic updates, host rejection, read-only inspection, retained multiline drafts after failed save, distinct actors and revision evidence, independent bindings for two admitted instances, and explicit acceptance before changing a pinned digest. Verify keyboard and tap paths, narrow transitions, focus return, strict-CSP compatibility where applicable, light and dark baselines, forced colours, and axe. Keep editor, persistence, Catalog policy and runtime services in their host products."
status: approved
decided_by: "human:MOES-Media"
decided_at: 2026-11-28T01:02:20Z
---

# Triage 039 — Workflow Studio compositions in Storybook

## Issues read

- #76 is open without comments, labels, a milestone, sub-issues, or registered blockers. Its body defines Authoring, Run inspection and Catalog upgrades in that order and names #72, #73, #7, #74, #13 and #75 as prerequisites. Its actual parent is #93. #92 cross-references #76 for delivery order. [#76](https://github.com/Ocelle-HQ/ocelle-components/issues/76) · [#93](https://github.com/Ocelle-HQ/ocelle-components/issues/93) · [#92](https://github.com/Ocelle-HQ/ocelle-components/issues/92)
- All six named prerequisites are closed as completed. The status-element PR #105 merged to `main` at `d45efd57402395999fcd7ab8fc29fba2c14a4e88`. That revision includes the existing Workflow Studio primitives and the plan and node-upgrade discovery stories. [#105](https://github.com/Ocelle-HQ/ocelle-components/pull/105) · [#99](https://github.com/Ocelle-HQ/ocelle-components/pull/99)
- Issue, PR and source searches found the landed primitives and discovery examples. The discovery covers comparison presentation, leaving the #76 acceptance journeys to this mission. [Discovery recommendation](../specs/031-change-list-discovery/recommendation.md)

## Related work found

| Ref | Kind | Relation | Reason |
| --- | --- | --- | --- |
| #76 | Issue | In scope | Defines the three executable composition journeys. [#76](https://github.com/Ocelle-HQ/ocelle-components/issues/76) |
| #72, #73, #7 | Authoring dependencies | Satisfied | The node exposes a stable selectable step, the canvas requests host-controlled layout and semantic changes, and the status elements supply visible state. [Node](../specs/027-workflow-node/spec.md) · [Canvas](../specs/029-workflow-canvas/spec.md) · [Status](../specs/018-status-elements/spec.md) |
| #74, #13 | Run-inspection dependencies | Satisfied | The textarea retains the edited host draft on failure. The timeline and evidence components present actor, event and revision details. [Textarea](../specs/026-form-textarea/spec.md) · [Timeline](../specs/019-data-records/contracts/ocelle-event-timeline.md) |
| #75 | Catalog comparison dependency | Satisfied | The landed recipe combines existing facts, copy fields and notice for old and new versions with explicit changes. Admission, pinning and acceptance belong to the fixture host. [Discovery recommendation](../specs/031-change-list-discovery/recommendation.md) |
| #8, #9, #12, #14, #16 | Existing layout, form, navigation and overlay contracts | Use as dependencies | Reuse the controls, list/detail layout, focus behavior and dialogs already in the library. [List/detail](../specs/009-workflow-layouts/spec.md) · [App frame](../specs/015-app-frame-navigation/spec.md) |
| #86–#91 and #109 | Other product examples and public surface work | Out of scope | #76 can use landed canvas, form, status and copy contracts. Anchored popovers, specific new chrome, optional copy-field display and other sibling features do not block the three stories. [#86](https://github.com/Ocelle-HQ/ocelle-components/issues/86) · [#89](https://github.com/Ocelle-HQ/ocelle-components/issues/89) · [#109](https://github.com/Ocelle-HQ/ocelle-components/issues/109) |
| #1, #92, #93 | Broader epics | Out of scope for closure | #76 supplies reusable Storybook evidence for the editor and shared console UI. [#92](https://github.com/Ocelle-HQ/ocelle-components/issues/92) · [#93](https://github.com/Ocelle-HQ/ocelle-components/issues/93) |

## Decision

**One mission with no package-release impact.** The three user journeys are independently testable and share the objective of proving the existing components together. Keep the issue's delivery order and verify each phase before advancing. The fixture hosts and stories are the deliverable, so the work needs the full Spec Kit review cycle even with no new public element or token.

## Scope

- **Authoring.** Provide a fictional palette and a Security review step. Prove keyboard add, binding to a named reviewer and wiring Approved and Rejected outcomes. Select a missing-binding finding and verify focus at the exact inspector field. Delete the selected step and verify focus recovery. Keep layout state separate from the serialized semantic graph, prove movement preserves it and rewiring changes it, and exercise a rejected request. Use the landed canvas mode contract to prove read-only inspection sends no mutation request.
- **Run inspection.** Compose the read-only graph with a planning interview, decision surfaces, and event evidence. Prove the data owner's “one hour” answer survives a failed save. The timeline distinguishes the data owner and engineering lead, the events, and the identified plan revision reviewed by the lead. Use host fixtures for all save and review outcomes.
- **Catalog upgrades.** Use the #75 comparison recipe for old and new node versions and their capabilities. Add two admitted Security review instances with separate identities and bindings. Prove changing one reviewer leaves the other instance unchanged. Show the new version and named differences while the original digest remains pinned until explicit acceptance.
- **Verification.** Exercise the built examples through keyboard and tap alternatives, narrow pane transitions, focus return and meaningful text under forced colours. Include pinned light and dark visual evidence and Axe. Scope source and tests to the Storybook compositions and their fixtures, documentation and evidence. Use the current repository's package CSP gate and verify offline/local fixture compatibility through the appropriate browser harness. Run the full applicable gates on the integrated candidate.

## Risks and open questions

- Prove the host's rejected request separately from the canvas preview. Check both the full request stream and authoritative fixture state so an optimistic display cannot stand in for an accepted semantic edit.
- Verify focus on the actual accessible inspector editor and graph selection actions, including one-column transitions. A host wrapper receiving focus or a selector matching hidden content is insufficient evidence.
- Keep instance identity and bindings independent of the Catalog ID and pinned version. Verify the pre-acceptance digest at the actual host state boundary. Keep fixture persistence, admission, comparison, and upgrade outcomes local and deterministic.
- Adding stories changes exact Storybook, baseline, Axe and Plant inventories. Establish them from the integration base and preserve each existing planted defect. Check default Mutation reachability before treating executable Storybook host logic as covered.
- No operator fork is needed at triage. Selection of existing primitives, the story layout and narrow focus details belong in specification and plan review.

## What would change this decision

Reopen scope if a runnable scenario requires a missing public element contract or a real editor, runtime, Catalog, Basket, or persistence integration. Propose any public surface change separately before starting it.
