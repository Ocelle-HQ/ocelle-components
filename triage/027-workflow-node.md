---
triage: 027
issues: [72]
decision: mission
target: "workflow-node"
in_scope: [72]
out_of_scope: [1, 7, 13, 15, 73, 74, 75, 76]
semver: minor
spec_prompt: "Build `ocelle-workflow-node` for Workflow Studio from #72 and `triage/027-workflow-node.md`. Define a controlled, selectable node that carries a stable node ID in its selection request and displays the title, kind, accountable role, named outcomes, and optional validation and run status. Specify one accessible selection action and focus ownership for standalone use and integration with the future canvas in #73. Prove equivalent pointer and keyboard activation, stable identity after renaming, read-only inspection, and unchanged host data after selection. Show a Security review step with approved and rejected outcomes and a planning step with one outcome. Preserve full accessible labels for long values, distinguish coexisting selected, focused, waiting, and invalid states in forced colours, and support readable host-provided status content while #7 progresses. Keep graph edits and navigation in #73 and workflow semantics in Studio. Use the landed card, action-row and icon precedents, token-only styling, and the standard export, manifest, stories and light/dark visual baselines. Record focused red/green replay, repeat timing and hosted CI evidence using Op 025."
status: proposed
---

# Triage 027 — Selectable workflow nodes (#72)

## Issues read

- #72 is open with no comments, labels, milestone, parent, sub-issues, or recorded blockers. It asks for one selectable node for both planning and approval steps. Issue and pull request searches found no existing implementation of `ocelle-workflow-node`. [#72](https://github.com/Ocelle-HQ/ocelle-components/issues/72)
- #73 explicitly consumes #72. It assigns graph navigation, positioning, wiring, layout and focus recovery after node removal to the canvas. #76 uses both elements in a fictional authoring story and also covers run inspection and catalog upgrades. [#73](https://github.com/Ocelle-HQ/ocelle-components/issues/73) · [#76](https://github.com/Ocelle-HQ/ocelle-components/issues/76)
- The library epic establishes standalone, framework-free elements and strict CSP. The related open status issue includes the already-landed action row. The pill tag, status indicator and metric are absent from the triage baseline. [#1](https://github.com/Ocelle-HQ/ocelle-components/issues/1) · [#7](https://github.com/Ocelle-HQ/ocelle-components/issues/7)

## Related work found

| Ref | Kind | Relation | Reason |
|---|---|---|---|
| #72 | New element | In scope | Supplies a selectable presentation primitive for Workflow Studio authors and run reviewers. |
| #1 | Library epic | Out of scope | Its platform and quality requirements apply. The release and consumer migrations retain their own scope. |
| #7 / mission 012 / PR #50 | Action and status primitives | Related, out of scope | The landed row sets precedents for a single native action, a name on the real control, and a composed event with a stable ID. The node can present readable host-provided status before the remaining status primitives land. |
| #15 / mission 009 / PR #46 | Workflow layout primitives | Precedent, out of scope | The board, lane and list/detail elements lay out content. Node presentation is a separate contract, and graph layout belongs to #73. |
| #73 | Canvas | Out of scope and depends on #72 | The canvas consumes the node’s identity and selection contract. It owns graph navigation, connections, viewport, layout and node-removal focus recovery. |
| #13 and #74 / PR #79 | Run inspection components | Related, out of scope | Display primitives and multiline decisions belong to later run-inspection composition. The node alone can support selection during read-only inspection. |
| #75 | Change-list discovery | Out of scope | Its revision and upgrade examples consume host-provided diffs and remain separate. |
| #76 | Studio composition stories | Out of scope and consumes #72 | This mission adds standalone node stories. End-to-end authoring, run inspection and catalog stories stay in #76. |
| Landed card and icon modules | Visual and accessibility precedents | Available | Use existing tokens and decorative icon conventions. The static card has no interactive role. |
| Op 025 / PR #78 | Verification tooling | Landed prerequisite | Use focused phase replay and the required sharded unit suite for this mission. Record timing and evidence without changing gate thresholds or workflow code. |

## Decision

**Mission, MINOR.** The new element adds public properties, an event and a focus and accessibility contract. It needs specification, a design review and independent test-first acceptance. The standalone node can be demonstrated and verified with fictional host data, so the canvas and full Studio composition can follow separately. No existing feature or op owns this contract.

## Scope

- Show the title, kind, accountable role and named outcomes for one approval node and one planning node. Support readable optional validation and run status and preserve full labels for long values.
- Specify one selection action in both standalone and future canvas composition. Pointer and keyboard activation must identify the same stable node after a title change. Run inspection allows selection. Studio retains ownership of selection and all supplied data.
- Show selection, focus, waiting and invalid states together. Use text and forced-colours cues that remain understandable without colour. Cover both themes, real keyboard and accessibility behavior, strict CSP, the per-element export, manifest, Storybook and committed baselines.
- Capture the focused first replay, repeat or resume timing, and hosted check results on the improved workflow. Keep tests that cover the node’s public contract in the required suites.

## Risks and open questions

- The specification needs a focus ownership contract with #73 that permits one activation path in composition and a usable standalone control. Resolve the accessible name, selection state semantics, and event payload before implementation so unchanged identity and host data can be asserted.
- Verify that the focus ring, selected cue and invalid cue remain distinguishable when forced colours replace fills and borders. Test long names, roles and outcomes for full accessible text as well as layout.
- Specify the readable status contract using available primitives. If the landed #7 surfaces later provide the same contract, use them through composition.

## What would change this decision

A required joint node-and-canvas release, a required status primitive unavailable on `main`, or an incompatible change to a landed element would need a new scope decision. Graph edits, Studio runtime behavior and a shared change-list element remain with their corresponding issues.
