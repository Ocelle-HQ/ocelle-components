---
triage: 041
issues: [88]
decision: mission
target: "041-settings-dialog-recipe"
in_scope: [88]
out_of_scope: [1, 12, 13, 15, 16, 57, 61, 67, 71, 76, 86, 87, 89, 90, 91, 92]
semver: none
spec_prompt: "Resolve #88 and triage/041-settings-dialog-recipe.md with an executable Storybook recipe for a stable split-pane settings dialog. Compose the existing dialog, disclosure, navigation, scroller, and controls with fictional host-supplied content. Specify and prove stable modal sizing and Close access, separate named category navigation and disclosure actions, selected destinations and predictable focus, keyboard modal behavior and narrow reflow. Follow test-first, strict-CSP and token conventions and verify light, dark, forced colors, reduced motion, 320 px and 200% text."
status: approved
decided_by: "human:MOES-Media"
decided_at: 2026-11-28T15:08:58Z
---

# Triage 041 — Stable split-pane settings dialog recipe

## Issues read

- #88 is open without comments, labels, milestone, sub-issues or a linked implementation PR. Its parent #92 tracks shared Workflow Studio components. [#88](https://github.com/Ocelle-HQ/ocelle-components/issues/88) · [#92](https://github.com/Ocelle-HQ/ocelle-components/issues/92)
- #76 specifies separate Workflow Studio compositions. Mission 039 explicitly excludes the settings dialog recipe. Issue, PR and story searches found the underlying primitives and no existing equivalent recipe. [#76](https://github.com/Ocelle-HQ/ocelle-components/issues/76)

## Related work found

| Ref | Kind | Relation | Reason |
| --- | --- | --- | --- |
| #88 | Issue | In scope | Defines the settings recipe and its verification. |
| #12, #13, #15, #16 | Delivered primitives | Existing inputs | The navigation, disclosure, scroller and modal contracts supply the composition. [Navigation](../specs/015-app-frame-navigation/spec.md) · [Disclosure](../specs/020-disclosure-code-block/spec.md) · [Scroller](../specs/009-workflow-layouts/spec.md) · [Dialog](../specs/008-overlays/spec.md) |
| #57 | Delivered accessibility fix | Existing input | The closed-details focus fix informs modal keyboard checks. [Fix record](../ops/022-focus-trap-details-icon-name/op.md) |
| #61, #67, #71 | Open verification follow-ups | Out of scope | Dialog animation timing, clipped-scroll axe coverage and WebKit closed-details investigation remain independently tracked. Exercise the recipe's relevant behavior directly. |
| #76 | Workflow Studio compositions | Out of scope | Mission 039 has distinct authoring, run-inspection and catalog scenarios. |
| #86, #87, #89, #90, #91 | Sibling work | Out of scope | The settings recipe can use the landed primitives and its own fixture independently. |
| #1, #92 | Epics | Out of scope | Track the broader library and Workflow Studio work. |

## Decision

**One mission with no package-release impact.** The composition needs design review for independent navigation and disclosure controls, focus transitions and responsive modal sizing. Those behaviors span modal layout and accessible navigation. The normal mission checks apply even though the expected deliverable is a Storybook recipe using existing public contracts.

## Scope

- Compose a standard dialog sheet with reachable Close, a stable frame and header when short and long content is swapped, and a content pane that scrolls independently. Stack at narrow widths without horizontal overflow.
- Use fictional host-supplied categories and sections. Each category label opens its landing view. An independently operable named disclosure action toggles its children, exposes expanded state, slides without a visible chevron and honors reduced motion. Provide selected-state cues, useful headings and predictable focus across navigation.
- Add test-first browser coverage for modal focus containment, Escape, Close and trigger focus return, category and section navigation, narrow layout and zoomed text. Verify themes, forced colors, reduced motion, existing token use and strict-CSP conventions in the executable examples.

## Risks and open questions

- Verify the existing disclosure contract can express the chevron-free split control and the navigation action without nested interactive elements. Spec and plan should resolve composition details before implementation.
- Long content, 200% text and one-column layouts can change scroll ownership and hide Close. Exercise these cases in the built recipe and verify focus against visible controls.
- Adding a story changes Storybook, visual and accessibility inventories. Confirm the relevant existing gates cover the recipe.

## What would change this decision

Reopen scope if the composition requires a new public element contract, changes to a primitive's behavior, or a real host settings integration.
