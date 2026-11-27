# Validation — Anchored popover

Install the pinned dependencies with `pnpm run setup:online`. Run the component’s focused element and built strict-CSP fixture tests. Reproduce the scoped red on the recorded base and green on the candidate before requesting phase review.

Open the appearance example with Enter. Tab to Dark, activate it, reopen and verify only Dark is pressed. Select Light and check the same behavior. On the profile example, open the named initials trigger with Space, activate Sign out and verify one host callback. Verify Escape, Shift+Tab, the external focus target, and a foreground overlay’s two-step dismissal through actual input.

For placement, open each configured edge fixture at 320 CSS pixels and verify the entire panel lies inside the viewport and its outside-clip control is clickable. Repeat in a separate 200% text setup and reach the last action by scrolling inside the surface. Verify the appearance and profile stories in light and dark, then repeat their keyboard focus checks in forced colors.

Run manifest and applicable host route preflight before generating scoped baselines. Use the [verification contract](contracts/verification.md) for exact IDs and pilot logs. Finish with the full protected CI workflow.
