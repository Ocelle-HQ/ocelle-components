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
- Reuse the browser fixture and fixture-serving pattern used by the Pane action footer recipe. Put behavior coverage in the browser test suite and use the visual gate for rendered story baselines.

## Design

Constrain the modal panel size against the available viewport through its public styling surface. Keep its header and Close under the overlay's ownership. Give the content pane a constrained block size and vertical overflow. On narrow viewports stack navigation above content and allow vertical scrolling in the dialog body when space runs out, leaving the header reachable. Verify both branches with actual panel geometry and overflow ownership.

Use a category destination and an adjacent disclosure summary. Place the named child destinations inside the disclosure. Use a text summary and suppress the default decorative chevron through the icon slot. Keep the current destination independently tracked from expansion. Use the horizontal scroller for a supplementary set of example settings choices. Make the primary detail action the first actionable control following the detail heading.

Start test-first with the stable shell and landing-to-detail navigation. Follow with the independent disclosure, modal keyboard path and responsive and preference checks. See [research](research.md), [data model](data-model.md), [interaction contract](contracts/interaction.md) and [validation](quickstart.md).
