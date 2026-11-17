---
scope: landing
phase: landing
round: 2
verdict: approved
base: 3828d2fee8dccab6f5c2697f859e2af7247d3378
head: 7f07329
tdd_check: pass
---

# Landing review, round 2 (PR #46, mission 009-workflow-layouts, issue #15)

This is a later landing round. By the operator's stop rule (2026-11-03) it checks two things only: that round 1's
findings are resolved, and that the landing fold regressed nothing. I did not search afresh. The fold is the range
`be82474..7f07329` (16 commits: the round 1 record, the two operator rounds, phase 2 fix 3 and its round 4 review,
phase 4 fixes 4 and 5 and their rounds 6 and 7). The merge base with `origin/main` is still `3828d2f`. `origin/main` is
now `23ba5c5` (PR #43) and conflicts with the branch; the merge comes after this fold and is out of scope here (see
"What remains").

All five `tdd-check.json` files have `status: pass`. Phase 2 round 4 and phase 4 round 7 approved their folds.

## Findings

No blocking finding and no new finding.

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|

## Earlier findings

| Round 1 | Status | Evidence |
|---|---|---|
| L1-01 (blocking) | resolved | Folded as phase 4 O5-01 (fix 4: red `243bd28`, green `aaaa19b`) and R6-01 (fix 5: red `6f66c61`, green `d61c3c3`). `ListDetailMeasure.measure()` returns before any write when the grid has no client rects and marks the pass pending (list-detail-measure.ts:90-94). The probe's `ResizeObserver` calls `suspend()` on an observation with no box, and `resume()` once rendered, which schedules the pass for the next frame, never inside the delivery (ocelle-list-detail.ts:222-226, list-detail-measure.ts:70-80). `#remeasured` returns while the probe is not rendered, so the `NaN` path is gone (ocelle-list-detail.ts:341). This is the shape round 1 suggested. The red test round 1 asked for is in the shared scenarios (test/scenarios/list-detail.ts: "US3-12, not rendered at first (O5-01)" with the closed `<dialog>` opened by `showModal()`, the `display: none` inline-block wrapper, the `hidden` flex item and the `hidden` host, each against a twin rendered from the start; "US3-12, hidden then remeasured (O5-01)"; and "US3-12, hidden, changed unseen, then shown (R6-01)"). They run in both harnesses, and `red-fix-4.log` and `red-fix-5.log` show them failing on assertions before the fix. The operator chose the fix, not a documented limitation, and FR-025, US3-12, contracts/elements.md § Container-tier convention "Not rendered" and the README were changed to match (readme.test.ts holds three new fragments). Round 1's side note R4-02 (a reconnected element schedules no pass) is not part of this fix; the contract still asks the host to call `remeasure()` after inserting a changed removed element again, as before. |
| L1-02 (blocking) | resolved | Folded as phase 2 O3-02. The new elements-browser case in test/browser/scrollbar.test.ts ("a card's inner block that grows past the board's end makes the board a tab stop and a region named "Board", scrollable by 443 px, though only the box's border box changed") is the case round 1 described. I planted the mutant myself on HEAD (`this.#observer.observe(box)` in `#follow`, overflow-region.ts:375) and ran `vitest run --project elements-browser test/browser/scrollbar.test.ts`: 1 failed, 4 passed; the case fails with `tabindex: null` where `"0"` is expected. I restored the file afterwards (`git checkout`). The record at overflow-region.ts:374 no longer claims equivalence: it says the mutant is not killed in process and names this test, file and test name, as round 1 asked. |
| L1-03 (note) | resolved | Folded as O3-03. `hostUpdated` now releases the old box (`#release`, overflow-region.ts:392-401): unobserves it and its track, takes off its `scroll`, `slotchange` and frame `focusout` listeners and removes `tabindex`, `role` and `aria-label`. Covered red first by the three swap cases and a guard in test/overflow-host.test.ts (fixture `current` attribute). Contract § Lifecycle and FR-011 changed to match. |
| L1-04 (note) | resolved | Folded as O3-04. contracts/overflow-region.md § Lifecycle, the README Lifecycle statement (pinned by readme.test.ts) and the JSDoc of the three hooks now say exactly what the code does on disconnect. |
| L1-05 (note) | resolved | Folded as O3-05. `passCount()` and the `passes` counter are gone from list-detail-measure.ts. test/list-detail-pass.test.ts counts passes from their effect on the grid (`data-tier` records whose old value is `max`); every expected count is the same as before, and plant F3-4 still bites (3 passes where 1 is expected). test/build/build-output.test.ts guards `dist/`. |
| L1-06 (note) | open, as expected | Not a code change. It clears with the merge of `main`; the shard times are to be read on the first CI run after the merge. |
| L1-07 (note) | open | The PR body edit is pending; see "What remains". |

The CI Unit tests failure of run 43791016532 (the scroller "Overflowing at the end" story, light and dark) was folded as
O3-01. The red case appends chips after the first scroll write and fails on `held: false` against the old story code
(phase 2 round 4 reproduced it). `scrolled()` now holds the share of the range through a `ResizeObserver`, with no
timer. Locally the whole unit suite passes, but only a CI run can confirm the CI failure is gone (see "What remains").

## Regressions in the fold

None found.

- **Source.** The fold changes three source files only: list-detail-measure.ts, ocelle-list-detail.ts and
  overflow-region.ts, as above, and the story file storybook/stories/scroller.stories.ts. A resize of a rendered
  list-detail still runs no pass (guard 1 of list-detail-pass.test.ts, `resized: 0`), so the once-per-frame cost of
  R-13 is unchanged. The only public surface change is the `remeasure()` description, regenerated in
  `custom-elements.json` and the 8 manifest plant copies; `gate:manifest` reports no finding.
- **Tests.** No test was deleted, skipped or loosened in the fold. The only removed assertion lines are the seven in
  list-detail-pass.test.ts that read `passCount()`; each was replaced by the same expected count read from the grid
  (phase 2 round 4 checked them one by one). The README fragment for the Lifecycle statement was replaced by a longer,
  stricter one. `gate:test-lint` exits 0.
- **Mutation.** `gate:mutation -- --base be82474` exits 0: 46 mutants on the changed lines of 3 files, none survived;
  14 compile errors; 3 records. I read the three. The one at list-detail-measure.ts:31 (initial `#pending`) and the one
  at overflow-region.ts:348 (the early return in `hostUpdated`) hold as equivalences on their stated reasons. The one at
  overflow-region.ts:374 is L1-02's record, now naming its killing browser test, which I confirmed above.
- **Baselines.** The fold regenerated four scroller baselines ("Overflowing in the middle" and "Overflowing at the
  end", light and dark). The phase 2 fix note says the old end baseline caught the defect ("Due toda" cut short under
  the end fade). `gate:visual` matches all 88 captures under Docker, with no nondeterministic story. These four files
  are not on `main`, so relative to `main` they still count among the 46 added baselines.
- **Gate boundaries.** The fold touches no gate code, no `gates/gates.json` and no workflow.
- **Sign-off.** `gate:signoff -- --range 3828d2f..HEAD` exits 0 over all 85 commits.

## Test quality

Red evidence for the fold: `red-commits` of phase 2 has `fix-3 fc3a136`, and phase 4 has `fix-4 243bd28` and
`fix-5 6f66c61`. Each changes test files only, and its red log shows the new tests failing on assertions. Each
`tdd-check.json` reports `pass`. The L1-02 case passes against the unfixed code by design, since the defect was a
missing test. Its proof is the plant, which I reran (above).

## Checks run

On HEAD `7f07329`, one at a time, `OCELLE_VISUAL_ENGINE=docker`:

| Check | Result |
|---|---|
| `gate:typecheck`, `gate:lint` (309 files), `gate:style-lint` (20), `gate:test-lint` (211), `gate:prefix` (267), `gate:pins` (5 manifests), `gate:contrast`, `gate:brand-rules`, `gate:manifest` (6 elements), `gate:config-copies`, `gate:csp` (18 files) | exit 0 each, no finding |
| `gate:signoff -- --range 3828d2f..HEAD` | exit 0: 85 commits, no finding |
| `gate:unit-tests` | exit 0: 3800 tests passed in 164 files |
| `gate:mutation -- --base be82474` | exit 0 (see Regressions) |
| `gate:storybook-build` | exit 0: built 44 stories |
| `gate:visual` | exit 0: 88 captures match their baselines (docker only) |
| `gate:axe` | exit 0: 88 story-theme runs, 0 serious or critical; 10 notes, all excepted |
| `gate:plants -- --shard 1`, `2`, `3` (every plant outside visual and axe, the manifest plants included) and `--shard 16` (`visual/fail-token-changed`) | exit 0 each: 78, 78, 77 and 3 plants judged, every plant as expected (shards 4 to 15 and 17 to 28, the other visual and axe plants, not run; the fold changes no gate and no plant other than the manifest copies) |
| L1-02 mutant plant: `elements-browser` `test/browser/scrollbar.test.ts` with `observe(box)` | 1 failed, 4 passed, as expected; file restored |

The repository's tracked files are unchanged except for this file.

## What remains

For the PR body of #46 (constitution V, round 1 L1-07, phase 2 round 4 R4-04):

1. Say why the 46 baselines are added: the stories of the four new elements (`ocelle-scroller`,
   `ocelle-workflow-board`, `ocelle-workflow-lane`, `ocelle-list-detail`), light and dark.
2. Say why the 6 token baselines change (`tokens--shell`, `tokens--space`, `tokens--type`, light and dark): they show
   the six new tokens.
3. Say that four of the added scroller baselines ("Overflowing in the middle" and "Overflowing at the end", light and
   dark) were regenerated at the landing fold (O3-01), because the first ones had captured the scroll position before
   the strip finished growing.
4. Mention the behaviour the landing fold added: a list-detail first rendered or changed while not rendered measures
   itself once shown (O5-01, R6-01), and the overflow region lets go of a replaced box (O3-03).

Outside the PR body, before landing:

- A CI run of the branch must show job Unit tests passing for the scroller story in both themes (T072). No run has
  happened since `be82474`; the merge conflict likely blocks the `pull_request` run.
- The merge of `origin/main` (`23ba5c5`, 33 conflicting files) is next. `main` adds other elements' stories and
  baselines, so the exact pins this branch raised (story-themes, elements and stories in the `axe`, `visual`,
  `manifest`, `storybook-build` and `plant-repo` gate tests) will need the merged totals, and the gates are to be
  run again on the merge. L1-06's shard times are read on that run.
