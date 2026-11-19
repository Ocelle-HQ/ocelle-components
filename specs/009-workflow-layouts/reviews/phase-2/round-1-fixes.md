# Phase 2 review, round 1: fixes

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| R1-01 | fixed | none: a records-only finding (the contract, T012 and research lag behind the code, which the review accepted on substance), so no behaviour changes and step 3 does not apply. No code was changed | `contracts/overflow-region.md` § Effects, Mask figures (the thickness is `offsetHeight − clientHeight`, with no block border to subtract because the module sets `.region-box { border: 0 }`); § Lifecycle `hostUpdated` (`slotchange` heard on the box, where it bubbles from every slot inside the track); § Stylesheet `.region-box` (`border: 0`, and what relies on it: the thickness and the clearance's border-box inline start); § Pure functions (`clearanceScroll({ ring, box, fade, direction })`, the sides that still fade worked out from the new position). `tasks.md` T012 (the same signature). `research.md` R-03 (Slot: heard on the box) and R-05 (the opaque layer's `<bar>`: no block borders to subtract). R-06 already says "each inline edge that would then still fade", which is what the code does, so it is unchanged |
| R1-02 | deferred: note, not fixed in this round as instructed. `hostDisconnected` removes only the host's three listeners and disconnects the observer; the box's `scroll` and `slotchange` listeners and the frame's `focusout` stay, with no observable effect. The contract's "removes its listeners" (§ Lifecycle) is still broader than the code | none | `packages/elements/src/overflow-region.ts:344-353`, `contracts/overflow-region.md:121` |
| R1-03 | deferred: note, to be rechecked in phase 3. The `slotchange` listener's equivalent-mutant record holds for the scroller, whose track is `max-content`. The board's lanes are contained, so its track does not follow its content, and `slotchange` may be load-bearing there: phase 3 must recheck that record when the board reuses the module | none | `packages/elements/src/overflow-region.ts:363-364`, `:487-491` |
| R1-04 | deferred: note, no change required by the review (the rest-state `mask-size` case asserts only the fade layer's figure, because with no `data-fade` the box has one mask layer) | none | `packages/elements/test/browser/scrollbar.test.ts:140-142` |
| R1-05 | deferred: note, no change required by the review (130 compile-error mutants, among them the modifier check and the `:focus-visible` guard, covered by plants S6, S12 and S16) | none | `packages/elements/src/overflow-region.ts:440`, `:453` |

## Left as is

`data-model.md` § `maskFigures` still says "`offsetHeight − clientHeight` less block borders". The review counts this as
agreeing with the code (the block borders are 0 because the module sets them to 0), and the fix was scoped to the
contract, T012 and research.md, so it is unchanged.

## Checks

Only Markdown under `specs/009-workflow-layouts/` changed; no source, test or stylesheet. `gate:signoff` was run on
the range including this commit.
