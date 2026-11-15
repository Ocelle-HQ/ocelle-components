# Phase 4 review round 2: fixes

Fixes for `reviews/phase-4/round-2.md` (changes requested), with the operator's decision P4
(`reviews/phase-4/operator-decisions.md`, "Fix R2-02, document R2-01"). Red commit `7c640bb` (tests only), recorded by
`.specify/extensions/story/scripts/red.sh 4 fix-2` as `fix-2` in `red-commits` (`"recorded": true`, exit 1). Its log
`red-fix-2.log` shows exactly the seven new tests failing, each on the defect and on nothing else (3754 tests, 7
failed). A first run of `red.sh` was made while the Docker daemon was down, and it also failed the five visual
integration tests that need Docker (exit 2). The daemon was started and `red.sh` run again. The log kept is that
second run's.

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| R2-01 | fixed: remedy and limitations recorded (operator decision P4) | scenario "US3 review R2-01: a percentage inline padding that changes with the host's container is not seen, and remeasure() re-chooses the tier" (`listDetailFixes`, both harnesses: a 600 px content-box host with 2% inline padding and `collapse-below="640px"`, its container from 1000 px to 500 px and back. Red: `layout: "two"` after `remeasure()` at 620 px, and so never stale at 640 px); `list-detail-pass.test.ts` "review R2-01: remeasure() re-chooses the tier … in the first animation frame after the call, in one pass with a light-DOM change made in the same task" (in process. Red: `inFrame: "two"`); scenario "US3 review R2-01: a host whose content box is narrower than its own inline padding and borders" (both harnesses. Red: `padded: one: list` at 130 px) | `ocelle-list-detail.ts`: `ListDetailMeasure` takes an `after` step that runs after each scheduled pass, in the same animation-frame callback. `#remeasured` reads the probe's content box from its computed `inline-size` and adds the host's computed inline padding and borders (`#resized`, which the `ResizeObserver` shares), so `remeasure()`, coalesced with the other triggers, re-chooses the tier in the frame of its pass. `remeasure()`'s JSDoc and the manifest say so. The limitations, with the remedy, are in spec.md FR-025, in contracts/elements.md (the `remeasure()` row, § Container-tier convention "Measurement" and "Unseen changes"), in the README (the `remeasure()` item and § Container tiers, asserted by `readme.test.ts`), and in data-model.md `measured` and the re-measure triggers, research.md R-13 and spike.md § Changed after the spike (round 2) |
| R2-02 | fixed | scenario "US3 review R2-02: the host's inline padding and borders are no floor of its intrinsic sizes" (both harnesses: in a min-content wrapper with 150 px inline padding, empty 300 px and one letter per pane 300 px plus the letter; in a max-content wrapper, empty with 200 px padding and 1 px borders, 289 + 402 = 691 px. Red: `empty: 600`, `letters: 592`, `max: 804`) | `ocelle-list-detail.ts`: the edge box is `position: absolute` with `inline-size: 0`, and the observer watches its border box (`{ box: "border-box" }`), which is the host's inline padding and borders. Out of flow, it adds nothing to the host's intrinsic sizes. The first render also schedules a pass (`firstUpdated`): an empty list-detail never had a slot change, so its sizer kept the `<svg>` default of 300 px, which the empty max-content case showed (702 px with the edge box fixed alone). Contract § Intrinsic sizes, FR-025 and the README now say that the padding and borders are added to the intrinsic sizes and are no floor of them |
| R2-03 | fixed (note) | none: records | plants.md § Plants of the review fixes (rounds 1 and 2): L18 and L19 run again on the round 2 code, and L20 to L27 added. Each `listDetailFixes` scenario and each review guard names its plant beside it |
| R2-04 | no change (note) | none | Phase 2's R2-02, carried as instructed |

## Design of the fixes

**R2-02.** The edge box stays a direct child of the shadow root, so it inherits the host's `padding-inline`,
`border-inline-width` and `border-inline-style`. It is now absolutely positioned and 0 px wide in its content box, and
its border box is observed. That border box is exactly the host's resolved inline padding plus borders, so:

- it changes when they change alone (R1-03 still passes, both ways, in both harnesses);
- it adds nothing to the host's min-content or max-content size, being out of flow;
- it is never clamped, so a host whose content box is narrower than its own padding and borders sees such a change
  too (spike.md cost 2 no longer holds for px, em and border changes).

Its block size is 0 and never changes, so US3-12 "a mutation inside a ResizeObserver callback" still reports no message
in both harnesses. A zero-height box adds no scrollable overflow. The narrow-host scenario checks this in a positioned
scroll container, which is the edge box's containing block (L24 shows that a 1 px tall edge box would add overflow).

**R2-01.** P4 records two cases as known limitations, with `remeasure()` as the remedy. The percentage case stays a
limitation: the edge box resolves a percentage padding against its own containing block, not against the host's, so
when the host's container resizes and the host's content box keeps its size, no observer reports it. `remeasure()`
now fixes it: after each scheduled pass (a slot change, a light-DOM change, `remeasure()`, the first render), in the
same animation-frame callback, the element measures its border box afresh and chooses the tier again if the size
changed. It still writes no figure inside a `ResizeObserver` delivery, and it runs at most once per frame, as the
contract says.

**Deviation from P4.** The second case P4 names, a host whose content box is narrower than its own inline padding and
borders, is no longer a limitation, because the R2-02 design sees a px, em or border change there. The documents
record it with the limitation, as P4 asks, but they state the truth: it is seen, and only a percentage padding in it
stays stale. A red scenario proves this (it failed before the fix with `one: list` at 130 px).

The fresh measurement reads the probe's content box itself, not the last size the observer reported. Inserted from a
task, the element runs its first pass in the next frame, before its observer first reports, so the last reported size
would choose one column and then three again within that frame (L26 and its guard).

## Guards added after green

Both are proven by a plant that survived without them:

- `list-detail-pass.test.ts` "guard: a list-detail inserted from a task in Frame R keeps three columns through its
  first pass" (plant L26: without the guard no test failed).
- Scenario "US3 guard: a slot change after the first render measures again" (`listDetailFixes`, both harnesses; plant
  L27). The first mutation run of the fix reported `ocelle-list-detail.ts:356`, the slot change's `schedule()` call
  replaced by `;`, as surviving. Since the first render schedules the first pass, the slot change at the first render
  no longer told it apart. The second run killed it.

## Plants

Recorded in full in plants.md § Plants of the review fixes (rounds 1 and 2). Each plant was an exact text replacement,
run in process on `list-detail.test.ts`, `list-detail-pass.test.ts` and `list-detail-upgrade.test.ts`. After each run
the file was restored and compared byte for byte with a saved copy.

| # | Plant | Fails |
|---|---|---|
| L18 | the host's own border box observed in place of the edge box | US3-12 a mutation inside a ResizeObserver callback; US3-16; US3 review R2-01 percentage; the pass test review R2-01 (4 of 61) |
| L19 | the edge box not observed | US3 review R1-03; US3 review R2-01 narrow host (2 of 61) |
| L20 | the edge box in flow | US3 review R2-02 (1 of 61) |
| L21 | the focused pane read from `document.activeElement` | US3 review R1-02 (1 of 61) |
| L22 | no fresh measurement after a scheduled pass | US3 review R2-01 percentage; the pass test review R2-01 (2 of 61) |
| L23 | the edge box observed in its content box | US3 review R1-03; US3 review R2-01 narrow host (2 of 61) |
| L24 | the edge box 1 px tall | US3 review R2-01 narrow host (1 of 61) |
| L25 | no pass at the first render | US3 review R2-02 (1 of 61) |
| L26 | the fresh measurement without the probe's content box | the pass test guard of a list-detail inserted from a task (1 of 61) |
| L27 | no pass at a slot change | US3 guard: a slot change after the first render (1 of 62) |

L18 no longer fails the US3-12 1196 px row, dialog and content-change cases it failed in round 1. The fresh
measurement after each pass corrects the host's border box in the frame of the pass, so those cases no longer tell
this plant apart. The loop case still does, and so do US3-16 and the percentage case.

## Gates (on the fixed working tree)

- `gate:typecheck`: no type error. `gate:lint`: 306 files, no finding. `gate:test-lint`: 208 files, no finding.
- `gate:style-lint`: 20 files, no finding. `gate:csp`: 18 files, no finding. `gate:prefix`: 264 files, no finding.
- `gate:manifest`: 6 elements, no finding (custom-elements.json regenerated for `remeasure()`'s description).
- `gate:mutation -- --base 2caad68`: first run, 1 survivor (`ocelle-list-detail.ts:356`, see Guards). After the guard:
  286 mutants on the changed lines of 4 files, none survived; 2 timeouts (`connectedCallback`, as before), 96 compile
  errors, 1 zero-mutant entry; 8 equivalent records, unchanged in reason; exit 0.
- `OCELLE_VISUAL_ENGINE=docker gate:visual`: 88 captures match their baselines. `OCELLE_VISUAL_ENGINE=docker gate:axe`:
  88 story-theme runs, 0 serious or critical, 10 excepted notes (003's prose story, as before).
- README: `packages/elements/test/node/readme.test.ts` (in `pnpm test`) now also asserts the new sentences: the
  `remeasure()` item, "no floor of either", and the known limitations with their remedy. All pass.
- `pnpm test`: 3761 tests passed in 161 files (the 3754 of the red run, plus the two guards, three cases in all, and
  the four README sentences).
- `gate:signoff -- --range 2caad68..HEAD`: run on the fix commit (below).

## Tests changed after red

One. The red scenario "US3 review R2-01: a host whose content box is narrower than its own inline padding and
borders" now has a positioned scroll container (`.kc { position: relative; … }`), and its name says "a positioned 100
px scroll container". The check `scrolls: 240` is unchanged. Without `position: relative`, the edge box's containing
block was the initial containing block, so its overflow could never reach the scroll container, and plant L24 passed.
With it, the check can fail, and L24 fails it. This makes the test stricter, not looser. The red run had already failed
the same scenario on `padded` (`one: list`), the defect. Comments that name plants were also edited (R1-03's L18 and
L23 outcomes). No other red test changed. In the fix commit, `readme.test.ts` gained the README sentences above, and
the two guards were added. Both strengthen the tests, and neither changes a red test.
