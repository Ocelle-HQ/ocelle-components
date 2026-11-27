# Validation — Anchored popover

Install the pinned dependencies with `pnpm run setup:online`. Run the component’s focused element and built strict-CSP fixture tests. Reproduce the scoped red on the recorded base and green on the candidate before requesting phase review.

Open the appearance example with Enter. Tab to Dark, activate it, reopen and verify only Dark is pressed. Select Light and check the same behavior. On the profile example, open the named initials trigger with Space, activate Sign out and verify one host callback. Run these cases in normal built Storybook and on the strict package fixture compiled from the same host. Verify the strict response header and zero violations. Use native keys to check the foreground overlay’s two-step Escape, the search control’s native Escape and the external stop’s visible focus after Tab leaves the panel.

For placement, set the built fixture’s browser viewport to 320 CSS pixels. Open each edge fixture and verify the full panel lies within it, with the promised placement priority and a real hit outside the clip. In a separate fixed viewport, double the root text size and compare the actual native button’s computed size and the long action’s line boxes. Reach the last action by scrolling inside the surface without scrolling or widening the page. Hide and restore a still-connected trigger and check that opening requires another activation. Run the dedicated trusted touchscreen test and repeat the keyboard focus checks in light, dark and forced colors.

Run `node packages/elements/test/browser/anchored-popover-compat-host.ts` in a terminal with the pinned repository toolchain. The host entry builds the package fixture assets, starts the strict server on `127.0.0.1` and prints its fixture URL. Leave it running while both clients complete. In a second terminal set `fixture_url` to that URL. Run the Chromium client as described in the [exact-floor acceptance path](contracts/verification.md#exact-browser-floors). On the same Linux Docker host, stage the WebKit client outside the repository and use the pinned host-network invocation in that contract.

```sh
compat_stage="$(mktemp -d)"
cp packages/elements/test/browser/anchored-popover-compat.mjs "$compat_stage/"
npm install --prefix "$compat_stage" --no-save --package-lock=false playwright@1.43.1
```

Verify the fixture URL and exact CSP from each runner before browser interaction. Capture the preflight and the runner, engine and binary versions with the results. Stop the host entry after both runs so it can close the loopback server and remove temporary assets. The default Chromium suite has its own AX evidence.

Run manifest and applicable host route preflight before generating scoped baselines. Use the [verification contract](contracts/verification.md) for exact IDs and pilot logs. Finish with the full protected CI workflow.
