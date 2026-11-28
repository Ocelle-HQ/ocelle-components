# Verification guide

Use the Node and pnpm versions pinned by the repository, then run `pnpm run setup:online` and `pnpm --filter @ocelle/elements run build`. Use the repository's built fixtures for strict-CSP evidence and the in-process Chromium project for focused replay and mutation coverage. Use the commands and test file names in the phase tasks when running the focused cases.

## Shared chrome glyphs

- Open each isolated action story. Verify the intended rendered glyph and exact control name for Inbox, History, Settings, Notifications and Appearance. Reach each action by trusted Tab and activate it using the keys supported by its native role. Check the host's observed navigation or activation and check that the icon contributes no second name.
- Compare light, dark and forced-colours rendering of each glyph and its focus outline. Probe the icon dimensions against the resolved icon size and stroke conventions. Include the narrow and enlarged-text action fixture. Check the existing set, directional mirroring and unknown-name case.

## Initials trigger

- Open the standalone fixture for a named fictional account trigger. Check one-letter and two-letter initials, including a wide two-letter sample. Confirm the button keeps its full caller-supplied name and the graphic is decorative. Keyboard activation reaches the host once per Enter or Space gesture. A host listener records the intent in the fixture without implementing an account panel.
- Exercise every input and live transition in the Phase 2 table. Check exact trimmed code points for the decomposed and joined samples and verify ordinary rendering for each rejected value. Inspect the standalone busy spinner and disabled initials palette in their dedicated light and dark captures.
- In light and dark, assert that the computed HTML initials text color equals the resolved --ocelle-color-on-accent and the computed SVG circle fill equals the resolved --ocelle-color-accent. Run `pnpm run gate:contrast` for this declared text/background pair. Check system colours separately in forced colours.
- At each measured root size compare the initials and ordinary flush controls at that same size and verify the width and height of both native targets against the resolved --ocelle-target-min (2.75rem, giving 44 CSS px at a 16 px root and 88 CSS px at a 32 px root).
- Compare the same populated vertical rail with a same-size reference control and the initials trigger in its bottom group. Measure target boxes, Settings position, divider position and item gap. Check trusted Tab order and the rendered focus indicator. Repeat the standalone and rail examples at 320 CSS px and at 200% text. Confirm no new clipping or horizontal overflow. Inspect both themes and the forced-colours palette.
- Exercise the built fixtures under the repository's strict CSP. Assert the expected visible target and host behavior before asserting a clean runtime record, so a blank page cannot pass.

## Phase and landing evidence

Run the focused cases on the pinned old source before making them green. Keep the failing assertion, green result and final replay evidence. Run `pnpm run gate:mutation -- --base <full-phase-base-sha>` against each exact green candidate and retain the selected source ranges and report.

Run `pnpm --filter @ocelle/elements run manifest`, `pnpm run gate:manifest` and `node tooling/speckit/bin/component-preflight.ts manifest --base <full-phase-base-sha>` for the phase's declaration and fixture updates. Preserve the intended Plant findings. Repeat the preflight against integrated main at landing and reconcile all generated changes.

Run `pnpm run gate:storybook-build` and confirm the intended story IDs in the built index before using `pnpm run visual:update -- --engine both --stories <id>[,<id>...]`. Verify both pinned captures and review the image diffs. Run `pnpm run gate:visual`, `pnpm run gate:axe`, `pnpm run gate:csp` and `pnpm run gate:plants`. Use the pinned phase base and exact candidate for the evidence. Required CI applies to the integrated landing candidate.
