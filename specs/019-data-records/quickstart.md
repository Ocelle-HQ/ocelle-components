# Quickstart: Data Records

A run guide that proves the feature end to end once phases 1 to 3 are in. Contracts: [contracts/](contracts/);
checks: [contracts/checks.md](contracts/checks.md).

## Prerequisites

- 009, 013 and op 016 are on `main` and merged into this branch, and `reviews/recheck.md` (T001) records no open
  difference.
- `reviews/recheck.md` records whether 009's pinned-start option (research R-17) is on `main`, and the caption follows
  it or the operator's answer to Q-F.
- Each phase's `reviews/phase-<N>/element-plants.md` records every element plant biting (contracts/checks.md).
- `pnpm install --offline` works (`pnpm run setup:online` after a container restart).
- For baselines: docker running (`nohup dockerd > /tmp/dockerd.log 2>&1 &`, as root), and #10's pinned container
  (`storybook/visual/container.json`).

## Validate

1. **Unit and browser tests.** Run `pnpm run gate:unit-tests`. It passes, and the data-table, timeline and chain
   bodies run in both harnesses.
2. **Static gates.** Run `pnpm run gate:typecheck`, `gate:lint`, `gate:style-lint`, `gate:test-lint`, `gate:csp`,
   `gate:prefix`, `gate:manifest`, `gate:contrast` and `gate:brand-rules`. All pass. The manifest lists the five
   elements with empty event lists.
3. **Storybook.** Run `pnpm run gate:storybook-build`, `gate:visual` and `gate:axe`. All pass. `visual` reports no
   change to 013's or any earlier baseline (SC-007).
4. **Plants.** Run `pnpm run gate:plants -- --affected origin/main --list`, then the same without `--list`. Every
   selected plant passes. The record goes in `reviews/phase-4/plants.md`.
5. **By hand, in Storybook** (`pnpm --filter storybook run dev`, or the built `storybook-static`):
   - **Data table, overflows.** At 320 px, Tab reaches the region, a screen reader announces the "Work packages"
     group, and the arrows scroll it. At 1280 px Tab skips it.
   - **Timeline.** The screen reader reads a list of three items, "14:02 Mission created" first, with no dot or line
     announced.
   - **Chain, wrapped.** The steps wrap at 320 px with no connector at a line's end, and the ordinals read 1 to 6 on
     the visible default steps.
6. **Mutation.** Run `pnpm run gate:mutation` on the phase's changed source. No mutant survives unless the review
   records it as equivalent.
