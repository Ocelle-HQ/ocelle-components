# Validation guide — app frame and navigation

Use the Node and pnpm versions in the root package. Install with `pnpm setup:online` or the repository's documented offline setup.

1. Run `pnpm gate:unit-tests` and inspect the new element browser tests. Test each shell width just below, at and above both defaults with a fixed viewport. Repeat with token and explicit inputs, invalid inputs, equality, and inverted bounds.
2. Open the shell story in the Storybook build from `pnpm gate:storybook-build`. Test mission, project and personal layouts. In each layout, narrow the shell to 320 px and confirm the page has no horizontal scroll. Open the drawer by keyboard, Tab through the real destinations, reverse with Shift+Tab, and close it with Escape and the close button in separate runs.
3. Open the drawer again and resize within narrow, then across the threshold. Verify which element retains or receives focus when starting on a destination and when starting on the close control. Exercise the no-navigation and removed-destination cases. Repeat in RTL for logical padding.
4. In the navigation stories, inspect the real link's accessible name/current state. Hover or focus the compact nav item, move the pointer to its bubble, and dismiss it. In the drawer, confirm that the next Escape reaches the modal only after the bubble closes. Repeat with long labels, forced colors and reduced motion.
5. Tab to a skip link and activate it in the same-root selector and cross-root reference fixtures. Check deep active focus and press Tab to continue into the content. Repeat with a disconnected reference and invalid selector.
6. Run `pnpm gate:manifest`, `pnpm gate:csp`, `pnpm gate:axe` and `pnpm gate:visual` against the integrated build. Refresh visual baselines only through the pinned baseline workflow. Preserve red-first and mutation evidence for each unit through the story scripts.
