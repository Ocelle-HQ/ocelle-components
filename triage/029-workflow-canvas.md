---
triage: 029
issues: [73]
decision: mission
target: "029-workflow-canvas"
in_scope: [73]
out_of_scope: [1, 7, 13, 15, 72, 74, 75, 76]
semver: minor
spec_prompt: "Build a controlled, accessible ocelle-workflow-canvas for Workflow Studio authors and run reviewers from #73 and triage/029-workflow-canvas.md. Compose the landed workflow node's single selection action and focus contract. Specify stable graph and outcome IDs, separate host-supplied layout, viewport, selection and mode, and distinct selection, presentation and connection requests. Cover pan, zoom, fit, node movement with aligned edges, pointer, keyboard and tap connection editing, discoverable named destinations, host rejection, read-only inspection and focused-node removal. Evaluate graph rendering options on keyboard access, representative graph sizes, bundle cost and strict CSP before choosing a dependency. Demonstrate the journeys with a branching fixture host and prove accessibility, forced colors, reduced motion, narrow layout, long labels and empty states. Keep Studio's validation, serialization, undo and services with the host and the end-to-end composition with #76. Use the standard export, manifest, Storybook, visual and test-first gates. Trial Op 028 with ready disjoint tasks inside an approved phase and record its integrated proof and timing."
status: approved
decided_by: "human:MOES-Media"
decided_at: 2026-11-23T22:40:36Z
---

# Triage 029 for the workflow canvas

## Issues read

- #73 is open with no comments, labels, milestone or GitHub parent. It asks for a separate graph primitive that consumes the workflow node. Its authors place steps and connect named outcomes. Its reviewers inspect the same graph in read-only mode. [Issue #73](https://github.com/Ocelle-HQ/ocelle-components/issues/73)
- The workflow search found no existing canvas implementation or pull request. #76 names #73 in its authoring delivery order. [Issue #76](https://github.com/Ocelle-HQ/ocelle-components/issues/76)

## Related work found

| Ref | Kind | Relation | Reason |
| --- | --- | --- | --- |
| #73 | Canvas primitive | In scope | One component supplies controlled graph presentation, accessible connection editing and inspection. |
| #72, PR #81, mission 027 | Workflow node | Dependency satisfied | Main contains `7c081d12`. The node exposes one composed selection request with `nodeId` and lets its host manage sequential focus with `selectionTabIndex`. The canvas uses that action and supports explicit focus. |
| #15, mission 009 | Workflow board and list/detail | Precedent, out of scope | The board is a lane layout. List/detail demonstrates narrow composition and focus recovery. The new canvas leaves those public contracts intact. |
| #76 | Workflow Studio composition | Depends on #73 for authoring and graph inspection | The canvas needs its own acceptance fixtures. Palette, field binding, full editor composition and run or catalog journeys stay in #76 or their hosts. |
| #7, #13, #74 and #75 | Neighboring Studio work | Out of scope | Status presentation, timeline and evidence records, multiline decisions, and catalog comparison belong to their own issues. None is needed to prove the canvas with host fixtures. The draft data-records PR #82 is independent of this mission. |
| #1 | Library epic | Governance context | The new public element follows the library's accessibility, packaging and release rules. |
| Ops 025 and 028 | Verification and execution | Apply to the pilot | Use focused proof replay and the required hosted checks. Trial parallel task groups within the active phase only. |

## Decision

**Mission, semver minor.** The issue adds a public element and new observable requests. It spans authoring and inspection and needs independently verified accessibility and rendering decisions. The issue and open pull requests provide no existing mission with that surface. The landed #72 contract resolves the stated prerequisite. The remaining design questions belong to specification and planning.

## Scope

- Define the typed graph inputs, stable node and outcome identity, layout coordinates, viewport, selection and mode. Establish which intents affect presentation and which request a semantic connection. A connection identifies its source, named outcome and destination. Layout edits leave the supplied semantic graph intact.
- Cover pan, zoom and fit in a branching graph, plus node movement with aligned edges. Keep edge routes, hit targets and handles internal. Preserve the node's single selection action in the composed canvas.
- Provide pointer, keyboard and tap paths to connect, reassign and disconnect an outcome. Make destination names discoverable independently of geometry and document equivalent host inspector operations. Prove the result with a fixture host that accepts and rejects requests. Rejected changes leave the supplied graph visible with no phantom edge. Read-only inspection allows navigation and selection without mutation requests. Specify focus recovery when a focused node disappears.
- Exercise an empty graph, long labels, narrow layout, forced colors, reduced motion and concurrent selection and errors. Supply the per-element export, manifest, Storybook cases, pinned light and dark baselines, and browser evidence under the strict production CSP. Keep the existing test-first, changed-source mutation, Plants and merge gates.
- Use the first eligible phase to exercise Op 028. Have planning identify exact file ownership and prerequisites before assigning any parallel work. Keep shared integration and generated artifacts with one owner, preserve the combined red/green and independent review, and record the group timing and any serial fallback. Eligibility depends on the approved task graph.

## Risks and open questions

- Specify focus and key ownership across nested node controls, connection actions, viewport controls and the host inspector. Give removal and canceled or rejected gestures observable acceptance outcomes. Use a real focus and accessibility-tree check alongside pointer and tap interaction.
- Compare graph rendering options on representative graph sizes, keyboard and touch access, bundle cost and strict CSP before selecting a dependency. The plan needs to prove that position changes avoid inline styles or other CSP exceptions and keep coordinates separate from domain data.
- Define what a host sees while it processes and rejects an edit, how destination identity survives renames or removal, and which operations remain available during inspection. Leave persistence, domain validation, serialization, undo and runtime services in Studio.

## What would change this decision

Split or reconsider scope if the canvas requires a breaking change to the landed node contract, a CSP exception, or host workflow policy to deliver the stated interactions. A planning spike may favor a rendering approach or expose a dependency decision. Either finding can go through the normal plan review without delaying triage.
