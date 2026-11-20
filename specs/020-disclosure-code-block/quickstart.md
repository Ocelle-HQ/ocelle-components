# Quickstart: validating the disclosure and the code block

Prerequisites: `pnpm install` done, Chromium from the repository's Playwright, and for baselines docker with #10's
pinned container (`nohup dockerd > /tmp/dockerd.log 2>&1 &` as root; after a container restart `pnpm run
setup:online`).

1. **Element tests, in process and on the built build.**
   `pnpm exec vitest run --project elements --project elements-browser disclosure code-block` (or `pnpm test` for the whole suite)
   Expected: every `US1-*` and `US2-*` body and the FR bodies of [contracts/checks.md](contracts/checks.md) pass.
2. **Manifest.** `pnpm --filter @ocelle/elements run manifest && git diff --exit-code -- packages/elements/custom-elements.json`
   Expected: no diff; entries as [contracts/elements.md](contracts/elements.md).
3. **Gates for the phase.** `pnpm run gate:manifest`, `gate:csp`, `gate:prefix`, `gate:style-lint`, `gate:contrast`,
   `gate:mutation` (sharded per op 015). The element plants of [contracts/checks.md](contracts/checks.md) are not a
   gate: each is applied to the green source in a scratch copy, its guarding body run, the file restored, and the
   result recorded in `reviews/phase-N/plants.md`.
4. **Stories.** `pnpm run gate:storybook-build && pnpm run gate:axe`; baselines with `pnpm run visual:update` in the
   pinned container, then `pnpm run gate:visual`. Expected: no serious or critical axe finding, no exception entry.
5. **By hand (optional).** In Storybook, open Disclosure / Closed, tab to it, press Enter and Space; open Code block /
   ScrollOverflowing, tab to it, press ArrowRight; select Code block / Digest and paste: the digest as written.
