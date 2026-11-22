---
triage: 026
issues: [74]
decision: mission
target: "specs/026-form-textarea"
in_scope: [74]
out_of_scope: [9, 59, 72, 73, 75, 76]
semver: minor
spec_prompt: "Mission for #74 (triage/026-form-textarea.md): add ocelle-form-textarea for entering and correcting a multiline reviewer answer, following the existing form-control conventions. Specify value and default, before-first-render submission, reset and native required, disabled and read-only semantics, label, help and errors across the shadow boundary, input and change events, keyboard editing in a dialog, and retained text after a host-rendered failure. Include the public export and manifest, browser and Storybook evidence, light and dark baselines, forced colours, strict CSP, documentation and a minor changelog entry."
status: approved
decided_by: "human:MOES-Media"
decided_at: 2026-11-22T16:43:06Z
---

# Triage 026: Multiline form textarea (#74)

## Issues read

- #74 asks for a multiline reviewer answer that survives form submission, validation correction and a host-rendered failure. It explicitly permits delivery independently of the graph tickets. GitHub lists no blocked-by relation and the issue has no comments. The issue search found no open textarea pull request.

## Related work found

| Ref | Kind | Relation | Reason |
|---|---|---|---|
| #74 | Open feature issue | In scope | It defines the textarea use case and acceptance. |
| #9, PR #49, `specs/010-feedback-forms` | Merged mission | Precedent | `form-control.ts`, `ocelle-form-input.ts` and their browser cases establish the shared input, submission and accessibility conventions. |
| #59 | Open select fix | Out of scope | Before-first-render submission is a required textarea scenario. The select-specific correction is an independent issue. |
| #72 and #73 | Open graph issues | Out of scope | The workflow canvas consumes the workflow node. The textarea stands alone. |
| #75 | Open change-list discovery | Out of scope | It has a separate user need and acceptance criteria. |
| #76 | Open combined Storybook issue | Out of scope | It can consume the textarea alongside the graph when those pieces are available. The textarea's own stories are in #74. |
| Triage 025 | Proposed verification op | Pilot prerequisite | Use the improved workflow to exercise #74. The component itself has no runtime dependency on verification tools. |

## Decision

**One MINOR mission.** The new element, its per-element export, accessibility associations and documented public form and event behavior warrant the full Spec Kit flow. One reviewer story covers the issue. The exact public contract follows the existing form-control convention and is resolved at spec and plan review.

## Scope

- Add one form-associated `ocelle-form-textarea`. Specify and document current and default value, reset, form participation, required, disabled and read-only behavior, label, help and error association, and input and change events.
- Verify literal line breaks from typing and pasting through real `FormData` before first render, after edits and after reset where applicable. Cover editing and correcting an invalid answer inside an existing dialog and preserving the value across a host-rendered submission failure. The host retains ownership of asynchronous submission and errors.
- Add the per-element export, manifest, README and changelog. Keep component styling on existing tokens. Provide editable, invalid and read-only stories, light and dark baselines, forced-colour and accessibility evidence, and strict-CSP browser coverage under the repository's normal test and merge gates.

## Risks and open questions

Immediate form participation and native distinctions between read-only and disabled are easiest to prove in browser tests against a real form. The accessible name, description and errors need checks at the editing control. The existing dialog interaction must preserve both its focus handling and ordinary multiline keys. Library-wide revisions to form controls should be brought back to triage if they become necessary.

## What would change this decision

A requirement for graph-specific state, host persistence, or changes to other form elements would need separate scope approval. The current issue can proceed as a standalone component mission.
