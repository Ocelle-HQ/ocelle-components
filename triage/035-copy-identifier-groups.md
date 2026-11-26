---
triage: 035
issues: [89]
decision: mission
target: "035-copy-identifier-groups"
in_scope: [89]
out_of_scope: [1, 13, 14, 75, 76, 86, 87, 88, 90, 91, 92]
semver: minor
spec_prompt: "Resolve #89 and triage/035-copy-identifier-groups.md with opt-in four-character grouping and a compact first/last-group preview on the existing ocelle-copy-field. Preserve a prefix such as sha256:, short final groups, proportional tabular figures and group-boundary wrapping at 320 px. Give the reveal control a meaningful name and native keyboard operation, keep focus predictable, expose the complete value to assistive technology and retain exact raw host copy with the existing default presentation. Provide fictional record ID and digest stories, public manifest and usage documentation, a minor changelog entry, focused browser and accessibility verification, light and dark baselines, forced colours, 200% text and strict CSP. Use the Op 034 workflow pilot and record its delivery checkpoint."
status: proposed
---

# Triage 035 — Grouped display for copyable identifiers

## Issues read

#89 requests an opt-in grouped and compact presentation for opaque identifiers on `ocelle-copy-field`. It is
open under the workflow editor epic #92, with no comments, labels, milestone, sub-issues or listed dependencies in
either direction. The timeline and open pull request search showed no linked implementation. Closed #14 established
the existing copy field, including its native Copy button, request-only event, raw text rendering and host-owned
copy outcome. [Issue #89](https://github.com/Ocelle-HQ/ocelle-components/issues/89) · [Issue #14](https://github.com/Ocelle-HQ/ocelle-components/issues/14)

## Related work found

| Ref | Kind | Relation | Reason |
| --- | --- | --- | --- |
| #89 | Open feature issue | In scope | Its grouped presentation, accessible compact reveal and exact raw copy form one independently testable change. [Issue #89](https://github.com/Ocelle-HQ/ocelle-components/issues/89) |
| #14, PR #54, mission 014 | Merged selection and input work | Existing control contract | The existing field supplies a native Copy button, `ocelle-copy-field-request`, host `status`, a polite live region, and a plain-text default for commands and identifiers. [Selection and input spec](../specs/014-selection-input/spec.md#user-story-4---copy-a-long-command-through-the-host-ocelle-copy-field-priority-p4) · [PR #54](https://github.com/Ocelle-HQ/ocelle-components/pull/54) |
| #13, mission 020 | Merged code-block work | Grouping precedent | The code block already presents digest prefixes and groups of four in proportional type with tabular figures. Its grouping rules and accessibility evidence inform the copy field. Its public surface stays outside this issue. [Code-block spec](../specs/020-disclosure-code-block/spec.md) |
| #75, mission 031 | Merged Storybook discovery | Composition precedent | Its upgrade example combines a grouped code block with a separate copy field and proves exact host requests for both digests. A migration of that example has independent scope. [Discovery spec](../specs/031-change-list-discovery/spec.md) |
| #92, #76, #1 | Broader product tracking | Out of scope | The wider library and Studio compositions have their own acceptance. The field can be used on its own. [Epic #92](https://github.com/Ocelle-HQ/ocelle-components/issues/92) · [Studio #76](https://github.com/Ocelle-HQ/ocelle-components/issues/76) · [Epic #1](https://github.com/Ocelle-HQ/ocelle-components/issues/1) |
| #86, #87, #88, #90 and #91 | Sibling issues | Out of scope | Each has a separate surface. #86 is the next planned pilot once the #89 checkpoint is complete and #86 is ready. [Triage 034](034-workflow-pilots.md) |
| Op 034 | Approved verification tooling | First live pilot | Use the preflight and matched verification on #89. After delivery, compare outcomes and tune the workflow through its own record. [Triage 034](034-workflow-pilots.md) |

## Decision

**One MINOR mission.** The opt-in presentation adds a public contract to `ocelle-copy-field`, and its reveal adds
observable keyboard, focus and accessibility behaviour. One product mission can deliver the grouped display and
compact reveal together on the existing element. Settle the smallest public API during spec and plan review. The
workflow trial is governed separately under Op 034.

## Scope

- Add opt-in grouped display to the existing field. Display the prefix separately and group the identifier body in
  four-character groups with a short final group where needed. Use existing proportional type and tabular figures.
  Preserve character order and case, and wrap at group boundaries at 320 px. Keep the current rendering and public
  behaviour for callers using the default, including wrapped commands and the disabled Copy control for empty values.
- Add an optional compact preview with the first and last groups and an ellipsis where content is omitted. One
  activation of a meaningfully named native control reveals the complete grouped value. Preserve predictable focus
  and tab order, visible focus, and access to the complete identifier and reveal state for assistive technology.
  Keep Copy available in both presentations and use the existing library tokens.
- Preserve the `ocelle-copy-field-request` contract, including the exact raw `value` at activation and the host's
  ownership of the clipboard and copy status. Prove that case and prefix survive and that the presentation's gaps or
  ellipsis never enter the event payload. Verify Copy and Reveal with pointer and keyboard input and keep their
  actions and announcements distinct.
- Add fictional record ID and digest Storybook cases, focused interaction and accessibility evidence, light and dark
  baselines, forced colours, 320 px and 200% text cases, and strict-CSP verification. Document the public additions in
  the custom-elements manifest and package usage, with a minor changelog entry. Use the normal test-first and
  independent review gates. Apply the Op 034 preflight to the manifest overlays and any shared Storybook host.

## Risks and open questions

The spec must define prefix and grouping behaviour for short or changing values and determine how the full value
stays readable in the compact accessibility tree without duplicate announcements. Verify how focus behaves as the
preview expands and how narrow and enlarged layouts keep both controls visible. The raw value is the source of truth
for copying even when the preview is visible or a host updates the value after activation.

## What would change this decision

Revisit scope if the opt-in needs changes to other elements, a new primitive, or a change to the host clipboard
protocol. Check for newly declared dependencies or overlapping pull requests before starting implementation.
