---
phase: 3
round: 1
verdict: approved
base: 6f92f5fb2e636bdb4949a80d2c1339ce48a2ffec
head: fd97db1
tdd_check: pass
---

# Phase 3 review, round 1

US2: `ocelle-workflow-board` and `ocelle-workflow-lane`. The change under review is `git diff 6f92f5f..fd97db1`.
There is no uncommitted change. The commits are: scaffold `80a0b66`, red `ecaf46f`, green `2b4bca9`, guards
`12ebc36`, the stop-and-ask and decision P2 (`677823c`, `7999b1d`), the stricter US2-15 walk `b9dbccf`, the B13 rerun
`e3832a5`, and the tdd-check `fd97db1`.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | note | `packages/elements/src/ocelle-workflow-board.ts:51` | Departure 3. The board's `::slotted(*)` also sets `box-sizing: border-box`, which T039 (`tasks.md`) and `contracts/elements.md:58` § Layout do not list. It agrees with FR-013 (`spec.md:687`): a non-lane child with padding or a border keeps the same share as a lane, within 1 px. It uses no design value, and a host's own rule on the child still wins, because the outer context wins for normal declarations. But no test covers it. With the declaration removed, all 31 board and lane bodies still pass (I ran this in a scratch worktree). The lane sets `box-sizing` on its own `:host`, and the "US2 non-lane children" divs (`test/scenarios/board.ts:586`) have no padding. | Optional, in a later phase: give one `div` in "US2 non-lane children" padding and a border, with "`box-sizing` removed from `::slotted(*)`" as its plant, and add the declaration to contracts/elements.md § Layout. Or drop the declaration. |
| R1-02 | note | `packages/elements/src/ocelle-workflow-lane.ts:101-115` | Departure 5. The forced-colours block uses variant selectors. FR-017 (`spec.md:720-723`) needs this, because only the default lane draws the `CanvasText` border. The two media blocks exclude each other, so no forced-colours rule has to outrank a variant rule, which is the reason README § Styles (`README.md:362-363`) gives. The border selector is tested: drawing the border on every lane fails US2-11. The rest of the block has no test: the flat header's size, weight, figures, tracking and uppercase, and the default lane's padding and radius, all copied into forced colours. Removing the flat header rule there leaves 31 of 31 passing. The copies keep forced colours a colour-only change, which is reasonable. | Optional: add the flat title's `text-transform` and `font-size` under forced colours to US2-11, so the copied rules have a guard. |
| R1-03 | note | `specs/009-workflow-layouts/data-model.md:35` | Departure 2. The `countText` row ("`count-label` trimmed and non-blank, else `String(count)` when `count` is set") can be read as giving a count text from `count-label` alone. The code uses `count-label` only while a count is shown (`src/lane-count.ts:28`). That is what FR-019 says (`spec.md:731`, "followed when a count is shown by ", " and then `count-label`"), and also `contracts/elements.md:82`, research.md R-09 and the README. `test/lane-count.test.ts` pins both cases: "a title and a count-label without a count" gives "Ready", and a count-label alone gives no name. The code is right; only the data model's wording is loose. | Optional, when data-model.md is next touched: "when `count` is set: `count-label` trimmed and non-blank, else `String(count)`; otherwise none". |
| R1-04 | note | `specs/009-workflow-layouts/plan.md:194-201` | Departure 1. `src/lane-count.ts` (`parseCount`, `validCount`, `laneName`) is not in the plan's source tree. T031's own test file, `lane-count.test.ts` ("in-process, pure"), implies it, and the plan already lists pure internal modules next to their elements (`tiers.ts`, `list-detail-measure.ts`). It is internal: `exports.test.ts` pins the root's exports, `src/index.ts:3` says so, and the generated manifest lists only the five element modules. It matches R-09. | None. Add it to the plan's tree if plan.md is edited. |
| R1-05 | note | `specs/009-workflow-layouts/reviews/phase-3/red-phase.log` | Three tests that existed before this phase, `gates/test/manifest.test.ts:94`, `:106` and `:123`, failed at red, and not because behaviour was missing. The scaffold added element modules but did not regenerate `custom-elements.json`, so the gate reported extra stale findings. None of the three was changed in the red commit, and all pass at HEAD. Every test that is new or changed in red fails for the missing behaviour. `final_tests_on_scaffold_exit` is 1, so tdd-check is still valid. | None. In later phases, have the scaffold regenerate the manifest, so that tests from before the phase stay green at red. |
| R1-06 | note | `gates/plants/` | Departure 6, the edits to the gate plants. (a) `visual/fail-token-changed/plant.json` lists ten new light story-themes. All the new board and lane stories are there except `workflow-board--no-lanes`, the empty board, which shows no ink. `gate:plants` judges this plant as expected. (b) In the seven manifest fail plants, the added lines are byte-identical to those added to `packages/elements/custom-elements.json`, so each plant's seeded defect is untouched. `pass-reordered` takes the new entries in generated key order, so its reordering now covers only the three older elements. It still passes, as a pass plant should. (c) `storybook-build/fail-empty-index` replaces the two new story files with empty ones, which keeps the built index empty. All three are the upkeep the new elements need, and they weaken no plant. | None. |

Departure 4, `unicode-bidi: isolate` on the title and count (`ocelle-workflow-lane.ts:56`), is not a finding. Under
`rtl` it makes the count follow a Latin title inline, which US2-10 requires. It is tested: removing it fails US2-10.
The green commit message records it.

## Test quality

**Red evidence.** `ecaf46f` changes only test files: 22 files, all within `test_pathspec`. `red-phase.log`
(185 of 3520 failed) shows each new or changed test failing for missing behaviour:

- the lane-count functions throw "not implemented";
- the elements are undefined;
- the README, CHANGELOG, manifest entries and exports are missing;
- the gate counts are 54 rather than 76.

The exceptions are the three pre-existing manifest-gate tests of R1-05. The scaffold `80a0b66` holds signatures only:
three functions that throw, and two empty classes that are not registered. It adds no test file.

**Tests changed after red, none weakened.** I read `git diff ecaf46f..HEAD -- packages/elements/test storybook gates/test`:

- **US2-2** (`scenarios/board.ts:297`). Board `b` is now mounted in Frame N. At red it had no frame argument, so it sat
  in Frame W in a 720 px viewport, which contradicts the scenario's name and US2-2. The expected value is unchanged.
  This is a correction toward the spec. The reason is in `2b4bca9`'s message.
- **SPEC-2-06** (`scenarios/board.ts:478-495`). The two fixed 400 px blocks are now descendants inside a wrapper, not
  slotted children. As slotted children, FR-013's "each slotted child … is at most the lane's content width" would
  cap them. Only "a descendant with a fixed inline size" is the content that cannot shrink that SPEC-2-06 means. The
  expected value (`pastLane`, `intoNext`, the frame record, `region()`) is unchanged. The reason is in a code comment
  and in `2b4bca9`.
- **`b9dbccf`** (US2-15, Frame N). The walk gains `l3c0` by Tab and `l1c2` by Shift+Tab, both with the same
  `cardStep` check. Frame W is unchanged. This only adds assertions, under operator decision P2.
- **`boardGuards` and `laneGuards`** (`scenarios/board.ts:634`, `scenarios/lane.ts:271`). These are new scenarios in
  both harnesses. They change no red body.
- **`12ebc36`'s source change.** The render is split into one statement per part (`ocelle-workflow-lane.ts:277-287`).
  It renders the same DOM, and all bodies still pass.

**Assertions.** Every body returns one observation, and each harness compares it with `toEqual` against an expected
value written by hand. I found no conditional assertion, `skip`, `only`, snapshot or mock. The "does not" outcomes are
each paired with their positive twin in the same body.

**Coverage.**

- **Acceptance scenarios.** US2-1 to US2-15 each have a body: US2-4 and US2-7 in light and dark, and US2-15 in W and N.
- **Edge cases.** Each Edge Case of T032 has one: many lanes, one lane, no lanes, non-lane children, lane count
  updates and content changes while scrolled.
- **Other bodies.** SPEC-2-06, the 20 px root, the sheets, and the "US2 slot change" body for R1-03.
- **Keyboard.** The keyboard paths are covered in `ltr` (US2-2) and `rtl` (US2-10): arrows in 40 px steps both ways,
  prevented also at the extent, and the modified arrows left alone.
- **Other files.** The entry points, exports, manifest, README, CHANGELOG and the 11 stories × 2 themes each have tests.

**Plants.** `plants.md` records B1 to B17. I reran two of them myself in a scratch worktree, restoring the file each
time (`git diff --exit-code` clean):

- **B13** (the focus-in `scrollTo` and the suppression removed): US2-15 in Frame N fails, 1 failed and 20 passed (21).
- **B17** (the `slotchange` listener removed): "US2 slot change" fails, and the scroller file still passes.

**Mutation.** `pnpm run gate:mutation -- --base 6f92f5f`, exit 0:

- 105 mutants on the changed lines of 5 files, none survived, 0 timeouts;
- 20 compile errors, all TypeScript narrowing or type literals, such as `validCount`'s `typeof` guard and the
  `role: "region"` literal. Tests also cover them: `lane-count.test.ts` checks `"3"`, `null`, `undefined` and `true`,
  and the region role is asserted;
- 2 zero-mutant entries: `index.ts`, and `overflow-region.ts`, whose changed lines are comments only;
- 5 equivalent records. I read each one and accept its reason:
  - `label: { type: String }` changed to `{}`, on the board and on the lane: Lit's defaults are the same.
  - The lane's title part changed to always render: an empty, `aria-hidden` span shows nothing.
  - The separator: a space at the start or end of the header line collapses.
  - `value?.trim() ?? ""`: any substitute text that is not digits is rejected, just as `""` is.

## Checks run

All at `fd97db1`, on the repository, with docker as the visual engine:

| Check | Result |
|---|---|
| `pnpm test` | 3526 tests passed in 155 files |
| `gate:typecheck` | no type error |
| `gate:lint` | 294 files, no finding |
| `gate:test-lint` | 199 files, no finding |
| `gate:style-lint` | 17 files, no finding |
| `gate:csp` | 15 files, no finding |
| `gate:prefix` | 243 files, no finding |
| `gate:manifest` | 5 elements, no finding |
| `gate:mutation -- --base 6f92f5f` | 105 mutants, none survived (above) |
| `gate:plants` | 306 plants of 17 gates and the registry judged, every plant as expected (run to completion) |
| `gate:storybook-build` | built 38 stories |
| `gate:visual` | 76 captures match their baselines (docker only) |
| `gate:axe` | 76 story-theme runs, 0 serious or critical; 10 notes, all excepted |
| `gate:contrast`, `gate:brand-rules`, `gate:pins`, `gate:config-copies` | pass |
| `gate:signoff -- --range 6f92f5f..HEAD` | 11 commits, no finding |

**Tasks.** T031 to T044 are ticked, and the work for each is present.

- **T040.** `browser.ts` imports the root, so the browser build defines both elements.
- **T042.** CI confirmation of the baselines is carried to landing under B2, as the caller stated.
- **Outside the phase.** Nothing outside the phase changed without a reason. The gate count tests (54 → 76, 3 → 5,
  27 → 38) and the plant trees are upkeep for the new elements and stories.

**Constitution.**

- **I.** Both elements are `ocelle-` elements and emit no events. The manifest declares every member: T035 pins this,
  and `gate:manifest` passes.
- **II.** The styles use tokens only (`gate:style-lint`). No monospace: US2-7 pins the sans family.
- **III.**
  - No ID crosses the shadow root, because the shadow root has no IDs and the name is an `aria-label`.
  - The visible header is `aria-hidden` (US2-5).
  - The keyboard model is the module's, tested in `ltr` and `rtl`.
  - The forced-colours border is tested (US2-11).
  - The token ring stays whole at the board's edges (US2-15).
  - axe reports nothing serious or critical.
- **IV.** No `style` attribute and no `<style>` element (US2 sheets). Strict CSP is proved on the fixture (US2-13,
  `gate:csp`).
- **V.** 5 + 6 stories in light and dark, with 22 baselines made in the pinned container.
- **VII.** Additions only. The CHANGELOG names both elements and their entry points.

**Plan.** The plan is followed:

- The board is on `OverflowRegion` with `role: "region"`.
- The board's `::slotted(*)` carries the containment and the minimum, and the lane carries neither (R-08).
- The board places no block ring room of its own; the module places it.
- The ground is `color-sheet` (R-10).
- The count grammar and the name are R-09's.
- `lane-count.ts` (R1-04) is the one addition to the plan's tree.

## Earlier findings

There is no earlier round of this phase. These are the carry-overs from phase 2:

- **Phase 2 R1-03** (recheck the `slotchange` equivalent record once the board reuses the module): **resolved.** Both
  `Stryker disable` records are gone from `src/overflow-region.ts:363-366` and `:489-491`, and the comments now say
  why the listener matters for the board. "US2 slot change" (`scenarios/board.ts:510`) guards it, and plant B17 makes
  it fail, which I confirmed by rerunning it. The mutation gate's zero-mutant entry for `overflow-region.ts` is
  expected: only comment lines changed there in this phase, and B17 is the evidence that the listener is load-bearing.
- **Phase 2 R2-02** (`contracts/overflow-region.md:121`, the `hostDisconnected` wording): still unsettled, and still a
  note. Nothing observable depends on it.
- **Phase 2 R2-01** (`data-model.md:19`, "less block borders"): the line is still unedited, and still a note. The
  value it describes is still right.
