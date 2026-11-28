---
triage: 040
issues: [91]
decision: mission
target: "040-chrome-glyphs-initials"
in_scope: [91]
out_of_scope: [1, 5, 7, 8, 12, 17, 56, 57, 69, 70, 76, 86, 87, 88, 89, 90, 92, 93, 109]
semver: minor
spec_prompt: "Specify #91 and triage/040-chrome-glyphs-initials.md: extend the shared icon set for five chrome actions and provide an accessible token-based initials trigger on existing controls, with isolated stories, bottom-rail fit and focused test-first browser verification."
status: approved
decided_by: "human:MOES-Media"
decided_at: 2026-11-28T01:53:51Z
---

# Triage 040 — Shared chrome glyphs and an initials button treatment

## Issues read

Issue #91 has no comments, labels, milestone, sub-issues or linked pull request in its timeline. Its parent is the workflow editor epic #92. The requested controls have a standalone library use case. The host supplies account content and actions. [Issue #91](https://github.com/Ocelle-HQ/ocelle-components/issues/91)

## Related work found

| Ref | Kind | Relation | Reason |
| --- | --- | --- | --- |
| #91 | Feature | In scope | Adds glyphs and the initials treatment to the existing chrome controls. |
| #5, #17 | Token and icon foundations | Out of scope | Reuse semantic colour pairs and the icon grammar in feature 005. The exported IconName on main covers 13 names and lacks all five requested meanings. |
| #7, #56, #57, #69, #70 | Controls and accessible naming | Out of scope | Feature 012 and op 022 provide button behavior and decorative-slot precedents. Assert the host-provided name with real rendered initials and glyphs. |
| #8, #12, #109 | Rail and shell | Out of scope | Use existing bottom slots. Mission 038 owns divider placement and explicitly excludes #91. |
| #86, PR #108 | Anchored popover | Out of scope | The standalone trigger can ship independently. A live account-popover integration depends on the public #86 contract, currently under review. |
| #1, #92, #93 | Library and consumer epics | Out of scope | #92 tracks delivery. Console orchestration and application state belong to consumers. |
| #76, #87–#90 | Studio compositions and sibling features | Out of scope | Mission 039 excludes #91. The pane, dialog, copy and action-row work can ship independently. |

## Decision

Propose a MINOR mission. Additional accepted icon names extend the typed public surface. The initials treatment also requires design and accessibility review. Neither active chrome mission owns these changes. The issue establishes enough product intent for specification.

## Scope

- Supply original Inbox, History, Settings, Notifications and Appearance drawings using the existing grid, sizing, stroke and currentColor conventions. Demonstrate each on an existing, meaningfully named control with visible focus.
- Support caller-supplied initials in a circular ochre fill with dark text, preserving the button's accessible name and keyboard activation. Demonstrate a standalone trigger with fictional content.
- Verify placement below Settings in the personal rail, including spacing and divider alignment. Keep account actions and content host-owned.
- Exercise both themes, forced colours, keyboard use, 320 px and 200% text where applicable. Use focused browser interaction tests, isolated Storybook examples and existing strict-CSP and token conventions. Follow the constitution's test-first and non-vacuous verification requirements.

## Risks and open questions

Review the initials API and visible focus treatment during specification. Check the actual accessibility tree for duplicate naming, and verify that forced colours preserve the control boundary and text. The pending popover contract affects integration evidence only.

## What would change this decision

Fold into 038 if its approved scope expands to own the same glyph and button contracts. Reassess as documentation work if the full public behavior lands independently before implementation.
