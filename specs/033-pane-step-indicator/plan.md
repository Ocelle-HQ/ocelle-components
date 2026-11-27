# Implementation Plan: Step indicator and pane action footer

**Branch**: `033-pane-step-indicator` | **Spec**: [spec.md](./spec.md)

## Summary

Deliver a Lit step indicator and a responsive, documented Storybook composition for Workflow Studio using the existing button and pane styles. Keep step semantics and marker rendering in the element. Keep action labels and navigation in the story host.

## Technical Context

- TypeScript, Lit 3, existing token styles and adopted stylesheets. Vitest Chromium fixtures for the element and Playwright against built Storybook for the composition.
- Public surface: `ocelle-step-indicator` registered by the root and browser bundle with an individual bundled-host export. This is a MINOR addition to `@ocelle/elements`.
- Supply an ordered `steps` property of readonly records with a label and an upcoming, current or completed state. Render only the first requested current step as current when input contains duplicates. Empty input renders no steps. Hosts replace the array to update it.
- Use native `ol` and `li` markup with the full label and completion text equivalent. Add `role="list"` on the `ol` when suppressing native markers so Safari preserves the grouping. Hide decorative numbers, the check shape and the current outline from assistive technology. Put `aria-current="step"` on the current item. Compact CSS keeps the other full labels in the accessibility tree.
- Use the existing accent fill, on-accent text and strong edge for the current marker. In forced colours use visible system colours and keep the check and outline. Use local CSS and native controls for the recipe. No new token or element for the footer.
- Make the footer a sibling of scrolling content and size both panes together at desktop. Use a token-derived 72 px minimum and allow the row to grow. At 1200 px give the action group its intrinsic space and let the indicator compact based on available width. At phone width and enlarged text allow actions and pane footers to wrap in flow.

## Constitution Check

The package entry points and CEM expose the complete small API. All visual values derive from existing tokens. Non-interactive step semantics and the real host button order are tested with keyboard, pointer, accessibility and forced-colour checks. The strict-CSP fixture exercises the built package and shared recipe module in a separate same-origin host. Stories use original fictional data, adopted or external styles and no inline event handlers. Commit focused failing assertions before implementation and keep the base, scaffold if any, and final replay evidence. Mutation-check the changed component and prove the recipe’s behavioural assertions with targeted negative controls. Run the pinned Visual and Axe gates.

## Implementation Phases

### Phase 1 — Ordered indicator and public surface

Add browser tests for ordered labels, ordinals, completion, programmatic current, empty input, populated input with no current step, duplicate current state, immutable host replacement, colour modes and no marker interaction. Assert one accessible list with three ordered items and the same names in full and compact presentations. The populated no-current case checks that all three steps still render and no item is marked current. Use a type-only signature scaffold if needed and prove absence of implementation as assertion failures. Confirm pointer dispatch to the marker and separately establish that no action reaches the host.

Add root registration, the individual package export, and the generated manifest. Verify the browser aggregate registers the element and the individual entry registers and renders it in a bundler host. Update the exact package export array, README entry table, released-element count and overview assertions. Document starter usage and the MINOR changelog entry in this phase.

### Phase 2 — Pane footer composition and Storybook evidence

Exercise the real built Storybook composition in its normal preview policy. Check the recipe root for forbidden inline markup, observe requests for origin violations, and verify light, dark and forced colours. For each recipe case, assert the real built index contains the exact story ID before navigating or querying the fixture. Record `implementation-story storybook/stories/pane-action-footer.stories.ts` in `reviews/phase-2/test-scope.txt` to keep the recipe absent on both the red commit and final-on-base replay. The first failing assertion in each case is the missing story ID.

Assert desktop size and alignment, 1200 px compaction with both actions on one line, and 320 px flow at normal text size. At a fixed desktop viewport, double the root font size and verify that the current-step label and native button text both double in computed CSS pixels. Use realistic longer labels that make the footer grow. Assert that text remains visible, focus indicators stay within the visible bounds, the action order is preserved, and the document has no horizontal overflow. Run the phone and enlarged-text checks separately.

In the secondary-plus-primary example, activate Continue to Confirm with the keyboard and assert the Confirm pane opens, the step state changes, and the primary label updates. Keep the same primary control focused through the in-place host update. Press Tab and assert focus reaches the next expected control outside the action group, using a fixture-only control immediately after the recipe if needed. Assert actual focus after each input.

Use a separate same-origin strict-CSP page with the existing elements-browser policy. Load the built browser aggregate, the same recipe host implementation and the recipe stylesheet as external assets. Assert built indicator registration before interaction. Use the real secondary-plus-primary recipe to exercise the keyboard action, updated pane, step state and label, and assert zero CSP violations, failed requests, cross-origin requests or browser errors. Assert the recipe assets exist before loading them so the red run fails on a missing-recipe assertion. Stage the compiled host script and the shared CSS in the temporary served build fixture after checking their source presence. Keep the Storybook preview and build configuration unchanged for this proof.

Test the final story IDs `recipes-pane-action-footer--primary-only`, `recipes-pane-action-footer--secondary-and-primary`, `recipes-pane-action-footer--back-and-primary`, and `recipes-pane-action-footer--empty`. The empty story covers a host with no configured steps. Capture the primary-only story with Review completed and two upcoming steps, with no current step. Capture the secondary-plus-primary transition fixture with Choose current at rest. Capture light and dark PNGs per ID with the pinned image. Review the exact Storybook index, the repository and violating-story Axe inventories, the empty-index Plant stub and token-change Plant expectations. Keep existing data and configuration in unaffected fixtures. Use the scoped CI-only directive only for existing aggregate count assertions, with the new behaviour proof local.

On a temporary build with all story IDs intact, show that the live host navigation assertion fails when the primary action leaves the pane or progress state unchanged. In a separate temporary build, show that the responsive assertion fails when the fixed footer clips enlarged or narrow content. Record the actual failing assertions for both controls and restore the canonical sources before recording a clean run. Keep this evidence separate from changed-source mutation of the component.

The hosted capture run reported 61 uncovered mutants in the shared recipe host. The built Storybook Playwright and strict-CSP probes remain required. Add direct, in-process coverage of the imported host in the `storybook-browser` Vitest project, scoped to `storybook/test/unit/browser/**/*.test.ts`. Exclude that subfolder from the existing Storybook Node project only. The default mutation config retains the new project. Prove exact routing and mutation retention red in the gates project so the recorded assertion keeps its project identity throughout replay. Add the shared host tests after routing. When final replay evaluates them on the original Node configuration, use an assertion about the browser environment before a dynamic host import, so the absence of the new project remains observable without import or setup errors.

Exercise the real host through native actions and check the observable pane, step state and button labels. Keep the shared production host as implemented unless mutation identifies a behaviour defect. Rerun the standard changed-source mutation scope and record the outcome before review. [Hosted capture run](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45743218289)

## Structure

- `packages/elements/src/ocelle-step-indicator.ts` owns the element.
- `packages/elements/test/step-indicator.test.ts` owns focused element behaviour and visual semantics.
- `packages/elements/package.json`, `packages/elements/src/index.ts` and `packages/elements/custom-elements.json` own the package surface. `packages/elements/README.md` documents public input, `packages/elements/CHANGELOG.md` records the addition, and `packages/elements/test/node/readme.test.ts` keeps the public inventory assertions exact. `packages/elements/test/browser/step-indicator.test.ts` proves both built entry points.
- `storybook/stories/pane-action-footer.stories.ts` registers the four variants. `storybook/stories/pane-action-footer.ts` and `storybook/stories/pane-action-footer.css` hold the shared host and presentation.
- `storybook/test/integration/pane-action-footer.test.ts` owns the built story behaviour, geometry, keyboard and origin checks.
- `storybook/test/unit/browser/pane-action-footer.test.ts` owns direct host coverage in the in-process browser project defined in `vitest.config.ts`. `gates/test/vitest-config.test.ts` verifies exclusive routing and default mutation retention.
- `packages/elements/test/browser/pane-action-footer.test.ts` and `packages/elements/test/browser/fixtures/pane-action-footer.html` own the separate strict-CSP fixture. Load the shared recipe assets in this case after checking their presence so existing browser fixtures can build on the red revision.
- `specs/033-pane-step-indicator/reviews/phase-2/test-scope.txt` records the exact implementation story path. `storybook/README.md` documents the recipe and compact behaviour.
- One phase 2 task owns existing build, Visual, Axe and Plant inventory changes. A separate evidence owner captures the eight PNGs after the stories render.

## Verification

Run focused red/green replay, changed-source mutation, the recipe’s two negative controls, build and manifest, typecheck, lint, style, CSP, contrast, exact Storybook index and test-first browser checks. Confirm the full required suite on the final PR candidate. The two phases share the public element contract. Within phase 2, disjoint layout and coverage changes can be performed in separate worktrees once their prerequisite inputs exist.
