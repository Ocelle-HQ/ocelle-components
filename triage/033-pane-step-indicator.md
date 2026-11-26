---
triage: 033
issues: [87]
decision: mission
target: "033-pane-step-indicator"
in_scope: [87]
out_of_scope: [1, 7, 8, 15, 57, 72, 73, 74, 75, 76, 86, 88, 89, 90, 91, 92]
semver: minor
spec_prompt: "Resolve #87 and triage/033-pane-step-indicator.md with a reusable ordered, non-interactive step indicator and a documented Storybook pane action footer. Provide caller-supplied labels and state, numbered upcoming and current markers, a check for completed steps with a text equivalent, one programmatically current step where the host marks one, and an ochre current marker with a non-colour cue. Use fictional Review, Choose and Confirm steps. Show a 72 px desktop footer aligned with the adjacent pane footer, with markers at the start and one token-spaced action group ending with the primary. Cover primary only, secondary plus primary, and Back plus primary. At 1200 px preserve the current label, compact the other labels and fit the standard two-button group on one line. At 320 px and with 200% text keep the footer in flow and keep controls and focus visible without horizontal scrolling. The host owns state, action labels and navigation. Add the public export, manifest, usage and minor changelog note, plus test-first browser coverage, light and dark Storybook baselines, forced colours, keyboard, accessibility and strict-CSP verification."
status: approved
decided_by: "human:MOES-Media"
decided_at: 2026-11-26T01:15:57Z
---

# Triage 033 for the step indicator and pane action footer

## Issues read

Issue #87 requests an ordered, non-interactive step indicator and a responsive footer recipe that uses it beside
host-owned actions. The issue has no comments, labels, milestone or sub-issues. GitHub's dependency lists are empty
in both directions. The timeline identifies its parent, #92, and searches for the indicator and footer found no
duplicate or linked pull request. [Issue #87](https://github.com/Ocelle-HQ/ocelle-components/issues/87)

## Related work found

| Ref | Kind | Relation | Reason |
| --- | --- | --- | --- |
| #87 | Open feature issue | In scope | It defines the indicator contract, pane recipe and verification. |
| #92 | Open parent epic | Out of scope | Its sub-issue relationship tracks shared workflow components. It does not declare a dependency between its children. |
| #1 | Repository epic | Out of scope | Its existing desktop component inventory provides the library conventions. |
| #7, merged PR #50, `specs/012-button-action-row` | Open follow-on issue and merged mission | Existing input | `ocelle-button` and `ocelle-action-row` are in `main`. The outstanding pill, status indicator and metric surfaces in #7 are outside the footer recipe. |
| #8 and #15, `specs/009-workflow-layouts` | Merged layout missions | Existing input | `ocelle-context-sidebar` has a footer slot and `ocelle-list-detail` supplies responsive pane conventions. No primitive layout change is required. |
| #57, merged PR #64 | Merged control fix | Existing input | Existing button icon and accessible-name behavior applies to recipe actions. |
| #72, #73, #74 and #75 | Merged Workflow Studio work | Out of scope | Workflow graph selection, the canvas, textarea and comparison stories have separate contracts. |
| #76 | Open Studio composition issue | Out of scope | Its own delivery order calls for #7 status presentation. Its listed examples do not require the step indicator, and its sign-off does not block #87. |
| #86, #88, #89, #90 and #91 | Open sibling issues | Out of scope | Anchored popover, settings dialogue, grouped identifiers, action-row metadata, and chrome glyphs are independent surfaces. |
| #5, #10, constitution and `knowledge/speckit-flows` | Established contracts | Existing input | Existing theme, contrast and spacing tokens apply. Frontend review uses focused interaction, visual and Axe evidence and the repository's test-first checks. |

## Decision

**One MINOR mission.** The indicator adds a public element with independent accessible states. The Storybook
recipe proves the intended consumer use beside existing buttons and pane content. The component and recipe deliver
one independently testable feature and warrant the full mission flow. The GitHub and source checks show no blocker.

## Scope

- Deliver one reusable step indicator. Keep the steps ordered and outside the tab sequence, with caller-supplied
  labels and state. Current and completion states have non-colour cues, and only the current marker uses ochre.
- Document one pane action footer composition. At normal desktop text size, the footer is 72 px tall, aligns with
  the adjacent footer and leaves the primary last in visual, DOM and keyboard order. Cover all three requested action
  sets, the compact 1200 px layout, and normal-flow wrapping at 320 px and when 200% text needs more room.
- Use fictional host state with existing buttons and tokens. Add the public registration and per-element export,
  manifest and documentation, with the normal light/dark baseline, accessibility and strict-CSP checks. Prove named
  keyboard actions, current and completed semantics and forced-colour presentation in a browser.

## Risks and open questions

Choose the smallest host input contract at spec and plan review. Compact presentation should preserve the full
accessible step labels and current visual label. Test wrap and focus together at narrow widths and enlarged text,
using the real recipe, since a fixed height can hide controls even when individual buttons render correctly.

## What would change this decision

An interactive wizard, a reusable pane-footer element, or a change to the existing action or pane contracts would
need new scope. The current issue can proceed with existing action and pane primitives while #7 remains open.
