# Validation

Install the pinned dependencies with `pnpm run setup:online` or the repository's offline setup. Run focused Chromium browser tests for the recipe as specified in tasks, then run the Storybook build, axe, Plants and visual gates. Verify the in-process test routing with:

```sh
node tooling/speckit/bin/component-preflight.ts host --source storybook/stories/settings-dialog.ts --test storybook/test/unit/browser/settings-dialog.test.ts --project storybook-browser
pnpm exec vitest run --project storybook-browser storybook/test/unit/browser/settings-dialog.test.ts
pnpm run gate:mutation -- --base <phase-base-sha> --files storybook/stories/settings-dialog.ts
```

Use the full story base SHA and capture the candidate SHA, selected lines, outcomes and verdict. Check both the initial and replayed red logs identify a failing behavior assertion after successfully mounting the recorded fixture scaffold.

1. In Storybook open the settings recipe. Select Appearance and a section with long content. Compare the modal bounds and header before and after navigation. Tab from the detail heading to the first action and then to the named overflowing detail region. Use Page Down to expose the last detail and verify Close remains reachable. At wide and shallow dimensions, expand enough navigation to overflow; reach the last navigation item by keyboard and verify independent scroll offsets and fixed header bounds.
2. Tab through the dialog and activate the category and disclosure separately. Verify the destination heading and next Tab after navigation, current state, expansion state, and that collapsing removes child controls from Tab order. Verify current category and section context after collapsing a selected child and after entering a section directly with the category collapsed. In a wide fixture with overflowing inline choices, verify the scroller comes after the first action, exposes its name and scrolls with arrow keys.
3. Dismiss with Escape and then with Close, reopening between attempts. Confirm focus containment while open and restoration to the opener on both attempts.
4. Repeat the relevant checks at 320 CSS px, at 200% text, with reduced motion, and in light, dark and forced colors. Confirm no page or dialog horizontal overflow, visible state and focus, visible and accessible current detail context, and no disclosure slide under reduced motion. At 320 CSS px and again at 200% text, measure the inner scroller’s scroll width and client width to confirm it fits. Tab through every choice and verify it stays inside the visible inline bounds with its focus indicator and the scroller’s horizontal offset stays fixed.
5. Check `OpenLanding` and `OpenDetail` settle with an open dialog and an expanded category before audit and capture in both themes. Check the built index includes all three story IDs and the axe run includes their six story-theme pairs.
6. Run the recipe against the strict-CSP browser fixture. Verify no policy violations and the same navigation and dismissal behavior.
