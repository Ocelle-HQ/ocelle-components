# Validation

Install the pinned dependencies with `pnpm run setup:online` or the repository's offline setup. Run focused Chromium browser tests for the recipe as specified in tasks, then run the Storybook build, axe and visual gates.

1. In Storybook open the settings recipe. Select Appearance and a section with long content. Compare the modal bounds and header before and after navigation. Scroll the content and verify Close remains reachable.
2. Tab through the dialog and activate the category and disclosure separately. Verify the destination heading and next Tab after navigation, current state, expansion state, and that collapsing removes child controls from Tab order.
3. Dismiss with Escape and then with Close, reopening between attempts. Confirm focus containment while open and restoration to the opener on both attempts.
4. Repeat the relevant checks at 320 CSS px, at 200% text, with reduced motion, and in light, dark and forced colors. Confirm no page or dialog horizontal overflow, visible state and focus, and no disclosure slide under reduced motion.
5. Run the recipe against the strict-CSP browser fixture. Verify no policy violations and the same navigation and dismissal behavior.
