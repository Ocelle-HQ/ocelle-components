# Phase 7, review round 1: fixes

There is no red commit. R1-01 only corrects a records file, contracts/checks.md, and changes no behaviour, source,
test or story. So nothing can fail first, and `red-commits` is unchanged (skill step 3: red is skipped only for
non-behavioural findings). R1-02 to R1-04 are notes, and none of them needed a change.

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| R1-01 | fixed: the dropped-override plant is now named as both declarations together, `.icon-row { align-items: baseline } .icon-slot { align-self: flex-start }`, in the pill's own styles after `iconSlotStyles`. The reason now says the wrappers' block-starts stay equal because the plant's own `.icon-slot { align-self: flex-start }` holds the icon wrapper at the row's start, and the icon-only pill hanging below the line (top −4.00 px, as with `bare` never set) is what catches it. Checked against the sources: plan.md:174-175 (decision 15's earlier override, both declarations), reviews/phase-1/spikes.md:63 (the plants table: −4.00 / +17.09, block-starts equal) and :216-217, reviews/phase-4/notes.md:126 (the plant as run, after `iconSlotStyles`, 4 failed, top −4.00 px). Also checked that neither `icon-slot.ts` nor `ocelle-pill-tag.ts` has an `align-self: flex-start` rule. The citation now names the spike's § R-06, R-07 table and plan.md decision 15 | none (records only) | specs/018-status-elements/contracts/checks.md:80 |
| R1-02 | acknowledged, no change: the plant record's base is phase 2's, as plan.md and T065 prescribe. I reran `gate:plants -- --affected 4fc2ed5b… --list` after this fix and got the output plants.md records (exit 0, 317 of 317 selected, none judged), so plants.md is kept as it is | n/a | specs/018-status-elements/reviews/phase-7/plants.md |
| R1-03 | acknowledged, no change: the `slotchange` pin's before-run is in check-slotchange-pin-before-sentence.log. The back-link pin is a literal `toContain` in a named section and fails if the sentence goes | n/a | packages/elements/test/node/readme.test.ts:1003, :1006 |
| R1-04 | acknowledged, no change locally: CI's Visual, Axe and Storybook checks judge these on the pull request | n/a | specs/018-status-elements/reviews/phase-7/notes.md |

## Checks run

Node 26 first on PATH:

- `gate:plants -- --affected 4fc2ed5b90303d239a97d0beb430c7f295f3c825 --list`: exit 0, 317 of 317 selected, none
  judged. This matches plants.md.
- `gate:lint`: exit 0.
- `vitest --project elements-node`: 846 of 846 passed.

The full tdd-check was not run, as instructed.
