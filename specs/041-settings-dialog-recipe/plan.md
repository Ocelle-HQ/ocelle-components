# Implementation Plan: Split-pane settings dialog recipe

**Branch**: `workflow/issue-88` | **Date**: 2026-11-28 | **Spec**: [spec.md](spec.md)

## Summary

Add a Storybook settings recipe that uses the existing dialog, disclosure, navigation, scroller and buttons. Keep composition, sample data and styling in Storybook. Share the recipe with a strict-CSP browser fixture to prove the behavior of the example itself.

## Technical Context

- TypeScript and external token-based CSS, using existing custom elements and Storybook HTML/Vite.
- Host-provided content and transient view state. No storage or network requests.
- Browser interaction coverage in the existing harness, with Storybook visual and axe checks.
- Theme, forced colors, reduced motion, and narrow and enlarged-text layouts follow the existing library conventions.

## Constitution Check

Use existing public contracts and local DOM relationships. Use library tokens, external styles and event listeners. Verify focus and accessible state at the actual controls. Add pinned light and dark visual baselines and exercise the recipe under strict CSP. Follow red/green replay and review for each independently testable story. The proposed design requires no exception.

## Project Structure

- `storybook/stories/settings-dialog.ts` owns the recipe composition and host-facing state transitions.
- `storybook/stories/settings-dialog.css` owns recipe layout and token-based styling.
- `storybook/stories/settings-dialog.stories.ts` supplies fictional Appearance and Shortcuts examples.
- Use `storybook/test/unit/browser/settings-dialog.test.ts` in the mutation-enabled `storybook-browser` project to import the real recipe and exercise its navigation, disclosure-independent state and settings actions.
- Use `storybook/test/integration/settings-dialog.test.ts` for built-index and settled open-state checks and `packages/elements/test/browser/settings-dialog.test.ts` for the strict-CSP browser fixture. Follow the Pane action footer fixture-serving pattern.
- Use the story title `Recipes/Settings dialog` and exports `UserOpens`, `OpenLanding` and `OpenDetail`. Track the resulting `recipes-settings-dialog--user-opens`, `recipes-settings-dialog--open-landing` and `recipes-settings-dialog--open-detail` IDs and each ID's light and dark `storybook/baselines/<id>.<theme>.png` file. Start both open exports in the top layer with an expanded category, and give OpenDetail a selected long section. Assert the named open dialog and child navigation in both examples before using them for axe and visual capture.
- Assign the story addition one owner for the build-index checks, baseline paths, repository and negative-fixture story-theme counts in `gates/test/integration/axe.test.ts`, the matching stub at `gates/plants/storybook-build/fail-empty-index/tree/storybook/stories/settings-dialog.stories.ts` and any added token-change visual findings in `gates/plants/visual/fail-token-changed/plant.json`. Derive counts from the built index and visual findings from the pinned capture. Keep the negative axe fixture's expected two findings in both themes and the repository's existing exception inventory.

## Design

Constrain the modal panel size against the available viewport through its public styling surface. Keep its header and Close under the overlay's ownership. Bound the split grid and both column tracks within the dialog body. The navigation column scrolls independently, including with expanded categories on a wide, shallow viewport. In the content column, keep the active heading and first action before a named detail region. The region owns vertical overflow and gains a sequential focus stop when scrollable so that Page Down reaches the final content after the first action. On narrow viewports stack navigation above content, let both columns grow in normal flow and let the dialog body own vertical overflow. Keep the header and Close stationary in both layouts. Verify geometry, independent scroll offsets, visible focus, and keyboard reachability of the last item in each column.

Use a category destination and an adjacent disclosure summary. Place the named child destinations inside the disclosure. Use a text summary and suppress the default decorative chevron through the icon slot. Track the current destination independently from expansion. Include the current category and section in the visible detail heading context even when the child link is hidden. Leave `aria-current` on its actual destination link. Place supplementary settings choices in a meaningfully named horizontal scroller after the first detail action, and assert name, focus and arrow-key scrolling when it overflows. Let the same choices wrap when the available inline space relative to the text size requires reflow. Check each choice at 320 CSS px and 200% text without relying on the outer frame's overflow measurement.

Pin the phase base. Before the first red commit, build and mount a neutral recipe module and external stylesheet with the public mount entry point, a named opener, a named dialog and stable role-based queries. Record that source-only commit with `.specify/extensions/story/scripts/scaffold.sh 1`. Use one fixture instance and role/name selectors for Open settings, Settings, Appearance and the destination heading; establish that assets load and the dialog mounts before the failing behavior assertion. Initial and replayed red logs must reach the intended geometry or navigation assertion. Follow with the independent disclosure, modal keyboard path and responsive and preference checks.

Run host preflight for the recipe module and its focused `storybook-browser` test through `stryker.config.json` and `vitest.mutation.config.ts`. Run scoped Mutation for the changed module on the same candidate and phase base and attach head, base, selected lines, mutant outcomes and verdict. Keep strict CSP, built-browser coverage, the normal Plants run and pinned two-engine baselines, followed by the complete Visual and Axe checks. See [research](research.md), [data model](data-model.md), [interaction contract](contracts/interaction.md) and [validation](quickstart.md).
