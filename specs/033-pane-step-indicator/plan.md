# Implementation Plan: Step indicator and pane action footer

**Branch**: `033-pane-step-indicator` | **Spec**: [spec.md](./spec.md)

## Summary

Deliver a Lit step indicator and a responsive, documented Storybook composition for Workflow Studio using the existing button and pane styles. Keep step semantics and marker rendering in the element. Keep action labels and navigation in the story host.

## Technical Context

- TypeScript, Lit 3, existing token styles and adopted stylesheets. Vitest Chromium fixtures for the element and Playwright against built Storybook for the composition.
- Public surface: `ocelle-step-indicator` registered by the root and browser bundle with an individual bundled-host export.
- Supply an ordered `steps` property of readonly records with a label and an upcoming, current or completed state. Render only the first requested current step as current when input contains duplicates. Empty input renders no steps. Hosts replace the array to update it.
- Expose an ordered list with the full label and completion text equivalent. Decorative numbers, the check shape and the current outline are hidden from assistive technology. Put `aria-current="step"` on the current item. Compact CSS keeps the other full labels in the accessibility tree.
- Use the existing accent fill, on-accent text and strong edge for the current marker. In forced colours use visible system colours and keep the check and outline. Use local CSS and native controls for the recipe. No new token or element for the footer.
- Make the footer a sibling of scrolling content and size both panes together at desktop. Use a token-derived 72 px minimum and allow the row to grow. At 1200 px give the action group its intrinsic space and let the indicator compact based on available width. At phone width and enlarged text allow actions and pane footers to wrap in flow.

## Constitution Check

The package entry points and CEM expose the complete small API. All visual values derive from existing tokens. Non-interactive step semantics and the real host button order are tested with keyboard, pointer, accessibility and forced-colour checks. Stories use original fictional data, adopted/external styles and no inline event handlers. Commit focused failing assertions before implementation and keep the base, scaffold if any, and final replay evidence. Mutation-check changed source and run the pinned Visual and Axe gates.

## Implementation Phases

### Phase 1 — Ordered indicator and public surface

Add browser tests for ordered labels, ordinals, completion, programmatic current, empty and duplicate state, immutable host replacement, compact semantics, colour modes and no marker interaction. Use a type-only signature scaffold if needed and prove absence of implementation as assertion failures. Confirm pointer dispatch to the marker and separately establish that no action reaches the host. Implement the component, its manifest, package entry points and starter usage.

### Phase 2 — Pane footer composition and Storybook evidence

Add browser assertions for the real built composition. Exercise the primary-only, secondary and Back variants and assert desktop size/alignment, 1200 px compaction with a one-line action group, 320 px and separately enlarged text, focus order, no hidden focus, and the positive keyboard action that updates both step state and the host-supplied action label. Verify regular and forced colours and strict CSP.

Test the planned final story IDs `recipes-pane-action-footer--primary-only`, `recipes-pane-action-footer--secondary-and-primary`, and `recipes-pane-action-footer--back-and-primary`. Keep all states represented in the examples. Capture light and dark PNGs per ID with the pinned image. Review the exact Storybook index, the repository and violating-story Axe inventories, the empty-index Plant stub and token-change Plant expectations. Keep existing data and configuration in unaffected fixtures. Use the scoped CI-only directive only for existing aggregate count assertions, with the new behaviour proof local.

## Structure

- `packages/elements/src/ocelle-step-indicator.ts` owns the element.
- `packages/elements/test/step-indicator.test.ts` owns focused element behaviour and visual semantics.
- `storybook/stories/pane-action-footer.stories.ts` and `storybook/stories/pane-action-footer.css` own the composition.
- `storybook/test/integration/pane-action-footer.test.ts` owns the built story behaviour, browser geometry, keyboard and CSP.
- `packages/elements/README.md` documents public input. `storybook/README.md` documents the recipe and compact behaviour.
- One phase 2 task owns existing build, Visual, Axe and Plant inventory changes. A separate evidence owner captures the six PNGs after the stories render.

## Verification

Run focused red/green replay, changed-source mutation, build and manifest, typecheck, lint, style, CSP, contrast, exact Storybook index and test-first browser checks. Confirm the full required suite on the final PR candidate. The two phases share the public element contract. Within phase 2, disjoint planning, layout and coverage changes can be performed in separate worktrees only once their prerequisite inputs exist.
