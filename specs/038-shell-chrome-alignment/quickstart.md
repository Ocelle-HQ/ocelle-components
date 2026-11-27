# Shell Chrome Validation

## Setup

Use the repository-pinned Node, pnpm, Chromium and theme fonts. Install with `pnpm install --frozen-lockfile`, then use the standard `.github/actions/setup` build/browser inputs or the corresponding documented local setup. Record the exact phase base and tested head.

## Run the targeted checks first

- Phase 1. Run `pnpm run gate:unit-tests --project elements packages/elements/test/top-bar.test.ts` and the built app-shell test in the `elements-browser` project. Compare the actual top-bar edge and the fixture-owned pane separator across both normal themes and forced colours. Recheck the existing native menu and actions.
- Phase 2. Run the in-process and built personal-rail tests using their corresponding Vitest projects. The same test scenarios check both-group defaults, opt-in placement, orientation with focus retained, and empty-group behavior.
- Phase 3. Run the direct top-bar, app-shell-actions and app-shell-reflow tests in `elements` and the built app-shell test in `elements-browser`. Exercise the badge directly and through the shell with and without content. At 320 px use the existing Settings fixture, verify order and operation using the keyboard, and capture overflow, focus visibility and hit dimensions.
- Run `pnpm run gate:csp` and keep the built shell fixture’s clean CSP verdict. The standard Storybook preview is for visual and Axe checks. The external-module shell fixture provides the strict-CSP proof.

## Verify derived files

1. Before capture run the relevant phase-scoped red evidence and manifest preflight. Build Storybook with `pnpm run gate:storybook-build`, deriving exact story IDs and theme counts from the built index.
2. Compare against the pinned phase base with the repository-pinned browser and fonts. Review actual visual findings before updating any baseline. Use the documented scoped capture mode when supported on the phase's workflow version. The shared chrome change also needs a full comparison across existing consumers to justify its selected PNGs.
3. Run `pnpm run gate:visual`, `pnpm run gate:axe`, `pnpm run gate:manifest` and changed Plants for generated evidence. Compare unrelated findings against the pinned base. Include both theme PNGs for every added story. Retain a capture receipt with the pin, resolved selection, result and paths.
4. Verify the phase's non-vacuous red/green replay and scoped Mutation on the integrated candidate. Go through every required CI gate on the exact landing candidate.
