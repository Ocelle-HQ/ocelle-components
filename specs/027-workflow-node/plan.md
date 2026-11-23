# Implementation plan for selectable workflow steps

**Branch** `027-workflow-node` · **Date** 2026-11-23 · [Specification](spec.md) · [Approved triage](../../triage/027-workflow-node.md)

## Summary

Add an `ocelle-workflow-node` element with one native selection button. The host supplies step content, the stable node ID, selected state and run or validation status. The node requests selection and displays the state it receives. The same action supports standalone use and host-managed focus in the canvas. [Public contract](contracts/workflow-node.md)

## Technical context

Use the repository’s pinned TypeScript, Lit and Chromium without new dependencies. Keep host data in the element’s public inputs. Use Vitest for element and gate tests and the built Chromium harness for keyboard, accessibility and strict CSP. Storybook supplies the visual fixtures and pinned light and dark baselines.

## Constitution check

Use the existing registration, token, button, focus and visual conventions. Keep the accessible name and description references inside the shadow root. Ship one new standalone entry and one `ocelle-` event as a MINOR addition. The element makes no network calls and has no graph editing or workflow execution. Each behavior slice starts with named failing assertions, passes focused replay and changed-source mutation, and retains the full required CI gates.

## Project structure

- `packages/elements/src/ocelle-workflow-node.ts` holds the element and its native control. Register and export it through the normal standalone entry, browser build and complete exports.
- `packages/elements/test/workflow-node.test.ts` and `packages/elements/test/browser/workflow-node.test.ts` cover the component in the normal and built browser projects. Share a scenario only when the same assertions run in both harnesses.
- `storybook/stories/workflow-node.stories.ts` holds the fixtures. Add their committed light and dark baselines and update the manifest, README, changelog and related exact inventory tests.

## Delivery sequence

1. **Select and identify a step.** Add inert registration to make the public import testable. Write assertion-red tests for the two example steps, ordinary activation, stable IDs after renaming, and unchanged host data and selection. Implement the native action and host-owned content. Verify the package entry and meaningful early Storybook cases.
2. **Navigate and read combined states.** Write red assertions for the one standalone tab stop, explicit focus with sequential participation removed, restoration, coexisting states, and accessible long labels. Add the focus handoff, state description and token-based focus and layout. Prove the same behavior in the built browser fixture and forced colors.
3. **Inspect a recorded run.** Write red assertions for readable host status and selection in read-only inspection. Add the status slot and the inspection fixture, finish the full state and theme baselines, and verify docs and inventory. Use the same public selection contract in both modes.

## Verification

- Use stable behavior-based names for phase assertions so unrelated inventory count updates do not change their identities. Test exact manifest, export, story and baseline contents through existing gates.
- Use actual keyboard and pointer interactions and capture selection events through the host boundary. Verify accessible name and description and both forward and reverse tab order with two nodes and focus sentinels.
- Record focused red/base/scaffold/head proof, cold and repeated times, changed-source mutation, Plants, and full CI for the final revision. Keep Storybook build, both theme baselines, forced colors, strict CSP, visual and accessibility coverage. Where a mechanical inventory test is designated for CI under Op 025, keep the exact file in the required inventory.
- Record time from a reviewable push to the complete hosted verdict separately from local proof timing. Compare proof reuse and hosted time with the #74 pilot using the actual recorded revisions.
