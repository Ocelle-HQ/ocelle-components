# Implementation Plan: Shell Chrome Alignment

**Branch**: `038-shell-chrome-alignment` | **Date**: 2026-11-28 | **Spec**: [spec.md](spec.md)

## Summary

Ship three ordered, independently verified user stories. Remove the top bar’s default lower rule, add an opt-in vertical rail divider placement, and project host-owned status content beside the product name through the app shell. The integration keeps the public surface to one additive boolean and one named slot on each of two elements.

The mission is MINOR as approved in [triage](../../triage/038-shell-chrome-alignment.md). The visual adjustment leaves existing elements and parts in place. The rail flag and accessory slots are additive and optional.

## Technical Context

- **Language and runtime**. The existing TypeScript and Lit custom elements in `@ocelle/elements`, built with the repository-pinned Node and pnpm versions.
- **State and storage**. The existing rail orientation and slot-presence logic, a reflected opt-in, and normal DOM slot assignment. No persisted data or new package dependencies.
- **Verification**. Vitest `elements` and `elements-browser` projects, concrete built Chromium fixtures, pinned Storybook capture, Axe, manifest Plants, and scoped Mutation plus required CI.
- **Targets and constraints**. Light and dark, forced colours, narrow 320 px and wide viewports, with native keyboard, existing hit targets and strict CSP. All visual dimensions, colors, focus and hit target values come from existing tokens.

## Constitution Check

Code stays in the existing framework-neutral element package. Public names and docs follow the current prefix and semantic-versioning policy. Layout uses tokens and stable native controls, with targeted accessibility assertions for visible focus, order, names, activation, and selection retention. No inline execution, external asset, or new runtime dependency is needed. Every implementation phase preserves a behavioral tests-only red and a focused green. Storybook has pinned visual evidence and separate built strict-CSP evidence. The design described in [research.md](research.md) and [contracts/shell-chrome.md](contracts/shell-chrome.md) passes the same checks after design.

## Scope and Sequence

### Phase 1 — Continuous chrome

Remove the default lower border from `packages/elements/src/ocelle-top-bar.ts` and its forced-colour override. Keep the menu's system-color outline and associated native behavior. The browser test first establishes the expected visible top-bar bounds and waits for rendering to settle. Its tests-only assertions expect zero top-bar divider pixels along the lower edge in light, dark and forced colours. Independently require visible consumer-owned separator pixels at the intended pane boundary in each mode. The pane separator is fixture-owned CSS outside the top bar. Keep the failure at the zero-divider assertion against the exact pinned old source and the unchanged assertions passing after removal. Reuse the built shell fixture and root strict-CSP checks. Keep the direct top-bar and integrated shell interaction coverage.

The default appearance changes across existing host compositions. The capture owner inventories direct and indirect top-bar consumers, including examples outside the three component story files, and checks the entire comparison against the exact phase base. Reuse existing Storybook stories. Do not change their IDs or inventory counts in this phase. Update only baseline images that the observed lower-edge change explains, in both themes. Retain the resulting capture receipt and commit package documentation and changelog for the visible behavior.

### Phase 2 — Bottom rail divider

Add reflected boolean `dividerAtEnd` / `divider-at-end` to `packages/elements/src/ocelle-personal-rail.ts`. Default false. In an effectively vertical rail with both destination groups, move the layout's auto margin from the bottom wrapper to the existing visible divider. Only the exact `orientation="horizontal"` attribute value selects the horizontal layout. An omitted, empty or other orientation stays vertical with the opt-in and keeps its original attribute state. Preserve that bottom wrapper's auto margin in empty-group cases. Keep the original divider node, slots, presentation and horizontal geometry. Preserve focus through both orientation transitions on a destination that remains rendered.

Extend the shared `packages/elements/test/scenarios/personal-rail.ts` checks via `test/personal-rail.test.ts` and `test/browser/personal-rail.test.ts`. Compare identical default and opted-in rails at the same fixed height with measurable spare height. Omit `orientation` in that pair and repeat the opted-in positioning assertion with empty and other attribute values, checking that each attribute state is preserved. Assert the divider's bottom gap in token units, spare height before the divider and unchanged primary and bottom destination boxes and order. In the shared forced-colours palette scenarios, include the populated fixed-height opt-in and its same-height default control. Verify visible divider pixels in the resolved system text colour against the system canvas, the one-token gap, spare height and unchanged destination boxes and order. Exercise empty primary, empty bottom, default vertical, horizontal with the opt-in present, and an orientation change from a focused destination. Verify the public property, attribute and reflected toggles at markup and runtime. In `packages/elements/README.md`, replace the equal-gap description. In the default vertical rail one item gap follows the primary group and spare height follows the divider. In the opted-in vertical rail spare height precedes the divider and one item gap precedes the bottom group. Preserve the horizontal, divider thickness and colour, and empty-group descriptions. Add the pinned `elements-ocelle-personal-rail--divider-at-end` story in both themes using populated groups and positive spare height.

### Phase 3 — Brand accessory

Add the `brand-accessory` slot after the product text in `packages/elements/src/ocelle-top-bar.ts` and forward the app shell's slot through `packages/elements/src/ocelle-app-shell.ts`. Use native slot projection and existing host-child/slot-presence behavior so the empty slot creates no flex item, gap, or layout shift. Keep the rosette, menu and host action inputs and behavior. Allow the product text to shrink and visually ellipsize using the existing tokens and CSS. Preserve the text node and accessible name. A short badge must stay visible at 320 px with a long product name, menu and the reference Settings action.

Test direct and shell projection, a single accessible instance, addition and removal, and empty layout equivalence in `packages/elements/test/top-bar.test.ts`, `packages/elements/test/app-shell-actions.test.ts` and `packages/elements/test/app-shell-reflow.test.ts`. Set a true 320 CSS px viewport and use a long product name, a short visible text badge, real shell navigation in the narrow tier, the real menu and the reference host-supplied Settings action. Verify the full accessible product name, exactly one accessible badge, both control names, no horizontal page overflow and the menu's token minimum on both axes. Confirm the menu and Settings are present and reached in their existing order by trusted Tab, and keep keyboard activation checks for both. Sample rendered focus pixels to establish that each complete indicator remains visible with the accessory. Run the same specimen in forced colours with visible badge text and both complete focus indicators. Keep the direct and the shell cases and the relevant wide checks.

The Phase 3 built verification owner owns `packages/elements/test/browser/app-shell.test.ts` and its external `packages/elements/test/browser/fixtures/app-shell.html`, `packages/elements/test/browser/fixtures/app-shell.css` and `packages/elements/test/browser/fixtures/app-shell.js`. In a separate built browser case, render a real badge and Settings action through the built narrow shell under strict CSP, with actual navigation. Verify one composed badge and one accessible instance. Reach the real menu and the host Settings action with trusted keyboard input, verify menu operation and a single Settings activation, then require the fixture's clean runtime record. Retain the existing built resize, drawer dismissal, Escape focus return and skip-link regression. The explicit reflow test supplies the 320 CSS px geometry evidence.

Add narrow representative `elements-ocelle-top-bar--brand-accessory` and `elements-ocelle-app-shell--brand-accessory` stories with a short fictional badge. Verify the relevant wide cases through existing component and built fixtures. Default story captures may change only where an observed intended layout effect explains the change.

## Ownership and Required Evidence

- Each phase owns its implementation and scoped browser tests. The phase reviewer checks tests-only red evidence. A red commit must change a runnable test file in addition to any scenario helper or fixture, so focused replay selects the real test. Stories belong in the green implementation. New compound layout checks separate setup failures, target dimensions, and behavior failures. A comparison against the design token is independent of the new implementation. Run the standard Mutation gate against each phase pin and record the tested head, base, selected files and lines, outcomes and exit verdict. For deletion-only Phase 1 use the normal diff-based scope. If the deletions select zero new-side lines, record the observed empty scope and use the pinned red and unchanged green assertion for behavioral sensitivity. Keep the usual mutation evidence for any selected lines.
- Each phase has one owner per shared output. Package manifest and all applicable manifest Plant paths belong to one task in Phases 2 and 3. Run `node tooling/speckit/bin/component-preflight.ts manifest --base <full-phase-base-sha>` against the pinned full base. Register each exact snapshot descriptor, fixture and intended finding in the tasks. Generate with `pnpm --filter @ocelle/elements run manifest`. Compare the regenerated declarations and preserve each fixture’s intended defect, including the clean reordered fixture.
- Assign added Storybook IDs and the complete light/dark baseline paths, the built-index, Axe and Visual inventories, the empty-index Plant story stub, and the token-change Plant expectations to exact named ownership before implementation. Read actual counts and findings from the built index and pinned browser receipts. Preserve existing Axe exceptions and unrelated registered findings. The [validation guide](quickstart.md) specifies capture and verification order.
- If a shared Storybook host needs changes, list the actual host source, active Vitest configuration, retained in-process project and focused tests. Run the host preflight for each route and attach real scoped Mutation results for the changed host. The current design uses existing Storybook render modules and the existing external JavaScript built-shell fixture.
- Within a phase, only ready tasks with exact disjoint write sets may run in parallel. The integration owner validates any worktree returns from the clean pin, owns conflicting output, and keeps the phase folding order.
- The landing integration owner reconciles the generated files on the exact candidate after integrating current `main`. Review the built Storybook IDs and capture paths, actual Visual and Axe findings and inventories, and the token-change Plant expectations. Regenerate `packages/elements/custom-elements.json` and reconcile every applicable manifest Plant descriptor and fixture. Run `node tooling/speckit/bin/component-preflight.ts manifest --base <full-integrated-main-sha>` from that candidate and verify every overlay's intended finding. Compare with integrated main to preserve concurrent additions, unrelated registered findings, intentionally seeded Plant defects and the clean reordered fixture. Retain the candidate head, integrated main SHA, actual inventory and finding comparisons, and new preflight and capture receipts alongside the phase receipts.
- Required landing CI applies to that exact integrated candidate. Phase evidence records the tested base and head, retains the original red and post-fold replay, and stays attached to the issue-linked PR.

## Project Structure

```text
specs/038-shell-chrome-alignment/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/shell-chrome.md

packages/elements/src/
├── ocelle-top-bar.ts
├── ocelle-personal-rail.ts
└── ocelle-app-shell.ts
packages/elements/test/
├── top-bar.test.ts
├── personal-rail.test.ts
├── scenarios/personal-rail.ts
├── app-shell-actions.test.ts
├── app-shell-reflow.test.ts
└── browser/
storybook/{stories,baselines}/
gates/{test/integration,plants}/
```

The existing shell, rail, Storybook renderer, and fixture harness remain the implementation boundaries.
