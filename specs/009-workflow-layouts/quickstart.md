# Quickstart: validating Workflow and Screen Layouts

How to see that the feature works, end to end, once it is implemented. The behaviour is in [spec.md](spec.md) and the
interfaces are in [contracts/](contracts/).

## Prerequisites

- Run `pnpm install` from the repository root (offline after `pnpm run setup:offline` where the network is limited).
- Set `OCELLE_CHROMIUM_PATH` to the installed Chromium for browser runs (findings: browser path).
- #10 must be merged and `main` merged into the branch, for the `visual` and `axe` gates. Docker must be startable for
  `visual:update`.

## Run

| Step | Command | Expected |
|---|---|---|
| Elements, in process | `pnpm vitest run --project elements` | every scenario of US1 to US3 passes, including the overflow-host proof (US1-16) |
| Elements, on strict-CSP fixtures | `pnpm vitest run --project elements-browser` | the same scenarios pass from the browser build, with zero CSP violations and zero stray requests |
| Tokens | `pnpm vitest run --project tokens` and `pnpm run gate:contrast` | the six tokens are present with their values; the pinned counts match |
| Manifest | `pnpm --filter @ocelle/elements run manifest`, then `pnpm run gate:manifest` | there is no diff; every member of contracts/elements.md is described |
| Lint and CSP | `pnpm run gate:style-lint` and `pnpm run gate:csp` | no raw values (the fade gradients pass the extended `ocelle/token-only`, contracts/gates.md), no inline style in built output |
| Gate plants | `pnpm run gate:plants` | the new `style-lint` gradient plants are caught or accepted as contracts/gates.md says |
| Mutation | `pnpm run gate:mutation` | no surviving mutant in `packages/elements/src/**` and `packages/tokens/src/source.ts` changes |
| Stories | `pnpm run gate:storybook-build`, `pnpm run gate:visual` and `pnpm run gate:axe` | every story of contracts/elements.md § Stories matches its baseline in light and dark; 0 serious or critical axe findings |

## Look at it by hand

1. **Scroller.** In the Storybook, open "Elements/ocelle-scroller/Overflowing at start". Tab into the strip: it is
   one stop. Press ArrowRight: the strip moves 40 px at once, and the start fade appears. Tab on through the chips:
   none sits under a fade. Alt+ArrowLeft is not taken by the strip. In "Fits", Tab skips the strip. On a desktop with
   classic scrollbars, the strip's scrollbar shows below the chips and is not faded.
2. **Board.** Open "Elements/ocelle-workflow-board/Five lanes": no scroll, with sentence-length cards. The default
   lanes show a sheet ground on the canvas. In "Five lanes, narrow" the board scrolls
   by itself, and the page does not.
3. **list-detail.** Resize a page with a list-detail across 40rem and 60rem of the element's own width: the tiers
   change at those widths, not at the window's. With focus in the detail, narrow it: focus lands on the list pane.
4. **Screen reader (Chromium accessibility tree).**
   - An overflowing labelled scroller reads as "Filters, group", and is not in the landmark list.
   - An overflowing labelled board reads as "<label>, region".
   - A lane reads as "Ready, 3, group".
   - A fitting scroller adds nothing.

## Rechecks before implementation

- #10 as merged against research.md R-15's list.
- `main` for an uppercase letter-spacing token or a container-tier convention from sibling 011 (#8), against R-16.
