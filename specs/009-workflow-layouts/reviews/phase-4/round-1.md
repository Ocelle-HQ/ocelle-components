---
phase: 4
round: 1
verdict: changes_requested
base: 2caad68db62feed502eb3963b65548f47d73ea6c
head: 5f03661
tdd_check: pass
---

# Phase 4 review, round 1

US3: `ocelle-list-detail`. The change under review is `git diff 2caad68..5f03661`. There is no uncommitted change.
The commits are: spike record `9385731`, scaffold `a1b9675`, scaffold record `569b3a3`, red `74dff00`, green
`45a828e`, guards `306a2e3`, plants and gates `d6f0550`, and the tdd-check `5f03661`.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | blocking | `packages/elements/src/ocelle-list-detail.ts:205-206`, `:226-230`, `:254-257` | At upgrade, focus in the inspector is moved away even though the first real layout shows the inspector. `#hasInspector` is still false at the first `willUpdate`. `connectedCallback` calls `#observeSlots()` before the shadow root holds any slot, so it reads no slot and sets false. The first tier and `shown` are therefore chosen without the inspector, and the focus rule sees the inspector as hidden. `firstUpdated` then finds the inspector and renders it, but by then focus has already moved. I measured this on the built `dist/browser/ocelle-elements.js` (Chromium 1248, tokens from source, scratch script outside the repository). Server-rendered markup in a 1196 px box has a focusable button in each pane, and focus is on the inspector's button. After upgrade the active element is `u >> div.pane.list`, while the tier is `three`. With `narrow detail-open`, where the inspector is stacked and shown, the active element is `u >> div.pane.detail`. This contradicts FR-028 ("focus is moved only when it is inside a pane that layout hides, and otherwise upgrading moves no focus"), the Edge Case "`detail-open` before the element upgrades", and R-14 § Upgrade. No test covers it: every upgrade case focuses the list, the detail or an outside button, and the inspector in `list-detail-upgrade.test.ts:17` has no focusable content. The equivalent-mutant record at `:205` gives the reason "connectedCallback reads the inspector slot before the first render". The mutant is equivalent, but that reason is not what happens, and it hides this path. | Red first: add upgrade cases with focus inside the inspector, in Frame R (three columns) and in one column with `detail-open`, in process and on the fixture page. Both must expect focus not to move. Then let the first layout know whether an inspector is present, for example from the host's light-DOM children with `slot="inspector"`, which is the same rule `#focusedPane` already uses. Correct the reason of the `:205` record, or remove the record if the mutant is no longer equivalent. |
| R1-02 | blocking | `packages/elements/src/ocelle-list-detail.ts:286-295` | Focus detection reads `document.activeElement`, which is retargeted to the outermost shadow host. When the list-detail is inside another component's shadow root, a pane switch never sees focus inside it. The pane is then hidden under the focused node and focus falls to `<body>`. Measured on the built output with the same script: a list-detail with `narrow` sits in a `<div>`'s open shadow root, and focus is on the list's button (before the switch, `document.activeElement` is the `div`, and the shadow root's active element is the list button). Setting `detailOpen = true` leaves `document.activeElement` as `<body>`, and the list pane is `display: none`. In the document tree, the same steps move focus to `u >> div.pane.detail`. This breaks FR-028 and SC-005 ("focus never stays in a hidden pane"), and R-14 § When the element moves focus, which says "`document.activeElement`, through the composed tree". A shell component that renders its screen in a shadow root is a normal host for this element (FR-034, #12). | Red first: a scenario or in-process case with the list-detail inside a test host's shadow root. Focus in the list, set `detail-open`; focus must move to the detail pane, and also back again. Then read the active element from the element's own root (`this.getRootNode()`), or walk the composed active-element chain until it reaches the host or one of its light-DOM children. |
| R1-03 | blocking | `packages/elements/src/ocelle-list-detail.ts:193-203`; `specs/009-workflow-layouts/data-model.md:45` | Departure 1. The probe and edges method gives the border box only when the content box changes too. A change of the host's inline padding or borders that keeps the content box (a content-box element with a definite `inline-size`, or a shrink-to-fit host) notifies no observer, so `measured` and the tier go stale. `remeasure()` does not help, because it re-runs the intrinsic-size pass, not the tier choice. Measured on the built output: `ocelle-list-detail` with `inline-size: 630px` and `collapse-below="640px"` shows `one`. Setting `padding-inline: 10px` makes the border box 650 px, which should give `two`, and the tier stays `one` after two frames and after `remeasure()`. FR-025 says the layout "follows the element's own measured inline size (its border box) … and re-measures on every resize", and contracts/elements.md:113 says the same. data-model.md:45 describes the probe without stating this gap. The spike's reason (the loop message when the host's border box is observed) is sound, but the trade-off is not recorded anywhere a host would read it. | Either (a) make a padding-only or border-only change re-choose the tier, with a red test in both harnesses (the case above, both ways across the threshold), or (b) put the limitation to the operator, and if accepted, record it in FR-025 or data-model.md § list-detail, in contracts/elements.md § Container-tier convention, and in the README's convention, with the host's remedy. |
| R1-04 | note | `specs/009-workflow-layouts/research.md:606-608` (also `:580`, R-11's grid table at `:496-500`) | Departure 2. R-13's § Recorded cost still says that where CSS carries the change ("a shown pane in three columns, whose content counts in the grid's own intrinsic size"), it "shows without a pass". With `.pane { contain: inline-size }` (`ocelle-list-detail.ts:71-75`) that sentence is now false. The change waits for the next trigger, as every unseen change does. FR-025 does not conflict: its unseen list (`spec.md:769-773`) promises no CSS-carried case, and contracts/elements.md § Unseen changes says the same. So the contract and the README are not stale. Only R-13 is stale, in this sentence. The containment is also what makes R-13's own plant hold (the same-height case staying at 1073 px under the round-1 pane observer, L12). R-13 also still names "the host's `ResizeObserver`" (`:580`, now the probe's), and R-11 gives `minmax(0, 1fr)` where the code has `1fr` (the reason is in spike.md item 1). data-model.md was updated with a pointer to spike.md, but research.md was not. | When the R1-03 fix touches the records, correct R-13's Recorded-cost sentence and its "host's `ResizeObserver`" wording, and point R-11 and R-13 to `reviews/phase-4/spike.md`, as data-model.md does. |
| R1-05 | note | `specs/009-workflow-layouts/reviews/phase-4/red-phase.log` | As in phase 3's R1-05, pre-existing manifest-gate tests (`gates/test/manifest.test.ts:85`, `:89`, `:94`, `:106`, `:123`, and `gates/test/integration/manifest.test.ts:13` among them) failed at red because the scaffold `a1b9675` did not regenerate `custom-elements.json`, not because behaviour was missing. The red commit did not change them, except for the count in `:85` and `:89` (5 to 6 elements, a red change that is right for this phase), and all pass at HEAD. Phase 3's R1-05 advice ("have the scaffold regenerate the manifest") was not followed. `final_tests_on_scaffold_exit` is 1, so tdd-check holds. | None for this phase. In later phases, have the scaffold regenerate the manifest. |
| R1-06 | note | `packages/elements/test/in-process.ts:142-148`, `packages/elements/test/browser/driver.ts:103-112` | Departure 4. `driver.call(id, name)` was a stub that rejected "not implemented" at red. That is why US3-12's two unseen-change cases and US3-16 failed at red on a helper, not on the missing `remeasure()`. The red commit also held `driver.test.ts` and `test/driver.test.ts` for `call()`, which failed at red and pass now, so the helper was written test-first. `check-final-tests-on-scaffold.log` shows the three scenarios failing on the scaffold for the right reason ("#s has no method remeasure"). The helper throws when the method is missing, so it cannot hide a failure. Not weakened. | None. |
| R1-07 | note | `specs/009-workflow-layouts/contracts/overflow-region.md:121` | Phase 2's R2-02 (`hostDisconnected` "removes its listeners") is still open, carried as instructed. This phase does not touch it. | None this phase. |

### The departures the implementer reports

1. **Probe `ResizeObserver` plus inline padding and borders.** The spike's reason holds (spike.md item 2, and the
   L15/US3-12 `ResizeObserver` case passes). It is a valid way to get the border-box inline size while the content
   box changes, and the guard at `scenarios/list-detail.ts` ("876px gives two, 877px one", with 20 px padding and
   2 px borders) pins the sum. It misses changes of padding or border alone: R1-03.
2. **`contain: inline-size` on the panes.** It does not conflict with FR-025, and the contract and README are not
   stale. R-13's Recorded-cost sentence is stale: R1-04.
3. **The sizer is an empty `aria-hidden` `<svg>`.** Justified by spike.md item 1: a replaced element whose maximum is a
   percentage contributes zero to min-content. Without it, the 636 px and table-cell cases fail (L10 bites on the
   sizer path). US3-14's tree assertion and the axe gate show the sizer adds no node to the tree. Accepted.
4. **`driver.call(id, name)`.** Accepted: R1-06.
5. **`test-shadow-block` and `test-appender`.** They are test-only, ship in no package, and are bundled by
   `global-setup.ts:103-113` into `ocelle-test-list-detail.js`, which imports nothing. They follow phase 1's
   `test-shadow-button` precedent (`test/fixtures/shadow-controls.ts:23`). Their sheet is a constructed sheet, which
   the CSP fixture allows. Constitution I's `ocelle-` rule is about the library's elements. Accepted.
6. **Upgrade tests use subclasses under test tags.** A tag can be defined only once per registry, and the subclass
   adds no member, so each case runs the element's own first render. The first case and the fixture page
   (`browser/list-detail.test.ts`, `list-detail-upgrade.html`) use the real tag. Accepted. The cases are incomplete
   (R1-01).
7. **`public remeasure()`.** The manifest has `remeasure` as a public, described method, `(): void`, and
   `node/manifest.test.ts` pins it. Accepted.
8. **The focused pane from the slotted child's `slot` attribute.** It is correct for the document tree, and it is the
   right rule before the first render assigns slots. The way the active element is read around it is wrong: R1-02.
   The same rule is the fix for R1-01.
9. **The README's container-tier text** (`README.md` § Element conventions, "Container tiers"). It holds every item
   of FR-034 in the contract's wording, and `node/readme.test.ts` asserts one fragment per item. Accepted. It will
   need the R1-03 limitation if option (b) is taken.
10. **data-model.md wording.** The `maskFigures` row now reads as phase 2 R2-01 suggested, and matches the code
    (`overflow-region.ts:126` `border: 0`, `:387`). The `countText` row reads as phase 3 R1-03 suggested, and matches
    `lane-count.ts`. The `measured` and `intrinsic` rows record departures 1 to 3, citing spike.md. Accepted. See
    R1-03 for the gap that `measured` omits.

## Test quality

**Red evidence.** `74dff00` changes only test files. `red-phase.log` shows each new or changed test failing for
missing behaviour:

- `tiers.ts` throws "not implemented";
- the shadow parts are absent ("no .pane.list in the shadow root");
- assertions fail on the missing layout, tree and focus;
- the README, CHANGELOG, manifest and exports are missing;
- the story tests find no element.

The exceptions are the pre-existing manifest-gate tests of R1-05 and the `call()` stub of R1-06.
`check-final-tests-on-scaffold.log` shows the final tests failing on the scaffold for the behaviour. The scaffold
`a1b9675` adds signatures only: functions that throw, `passCount` returning 0, and an unregistered class with a
throwing `remeasure()`. It adds no test file.

**Tests changed after red, none weakened** (`git diff 74dff00..HEAD -- packages/elements/test storybook/test gates/test`):

- **US3-11** (`scenarios/list-detail.ts:514-519`). The `.id { font-family: monospace; }` rule and the `class="id"` on the
  `<code>` are removed. Monospace is forbidden by constitution II and `gate:prefix`. The assertions and expected value
  (`panes: twoW, wraps, tableInside, tableScrolls, scrolls: false`) are unchanged. base.css styles `code` in the sans
  family with tabular figures, so the identifier still wraps inside the detail, which the test asserts. Not weakened.
- **`listDetailGuards`** (`scenarios/list-detail.ts:728-801`), the four guards in `list-detail-pass.test.ts:70-132`,
  the Frame R upgrade guard (`list-detail-upgrade.test.ts:69-77`), and `55.25rem` in `tiers.test.ts:19`. These are
  additions only. They run in both harnesses where they are scenarios, and no red body changed. The `mounted()`
  helper gained an optional frame, defaulting to the red behaviour.
- **`in-process.ts` / `browser/driver.ts`.** `call()` was implemented (R1-06).
- **`306a2e3`'s source simplifications** (plants.md § Guards, "Simplified instead"). Each removes an unreachable
  branch or merges an observation. All bodies pass, and every plant bites on `306a2e3` as on `45a828e`.

**Assertions.** Every test compares observed values with `toEqual`. There is no `skip` or `only`, no conditional
expectation, and no snapshot. The `if (text instanceof Text)` and similar guards in `list-detail-pass.test.ts` only
choose the action. The assertion is unconditional and includes the guard's value (`text: true`, `removed: false`),
so a missed path fails. `gate:test-lint`: 208 files, no finding.

**Coverage of the story.** US3 scenarios 1 to 16, the forced-colours pairs, the 20 px root, the sheets and the empty
list slot each have a body in both harnesses. The keyboard and pointer paths of US3-6 and US3-7 (switch by attribute,
by `narrow` and by resize) are covered. Missing: focus in the inspector at upgrade (R1-01), and a list-detail inside
a shadow root (R1-02).

**Plants.** I read plants.md (L1 to L17). Each plant names the scenario it guards, and each failed on both `45a828e`
and `306a2e3`. I did not rerun the seventeen.

**Mutation.** `pnpm run gate:mutation -- --base 2caad68`: 280 mutants on the changed lines of 4 files, none survived;
2 timeouts (`ocelle-list-detail.ts:226-227`, `connectedCallback`), 100 compile errors (all in `tiers.ts`, typed string
unions), 1 zero-mutant entry (`src/index.ts`), exit 0. I read the 8 equivalent records:

- `list-detail-measure.ts:69`, `:74`: writing the figure in force again. Equivalent.
- `ocelle-list-detail.ts:199`: the same size chooses the same tier. Equivalent.
- `:205`: equivalent in effect, because `connectedCallback` always sets false. The stated reason is inaccurate, and
  the path it covers holds R1-01.
- `:233`: Lit's `disconnectedCallback` only tells controllers and async directives, and the element has neither.
  Equivalent.
- `:235`: a detached probe reports nothing, and it is observed again on connection (the reconnection guard). Equivalent.
- `:277`: `.pane.undefined` matches nothing. Equivalent.
- `tiers.ts:32`: the empty default for an absent value. Equivalent.

## Checks run

All on HEAD `5f03661`, working tree clean.

- `gate:typecheck`: no type error.
- `gate:lint`: 306 files, no finding.
- `gate:style-lint`: 20 files, no finding.
- `gate:test-lint`: 208 files, no finding.
- `gate:prefix`: 264 files, no finding.
- `gate:csp`: 18 files, no finding.
- `gate:manifest`: 6 elements, no finding.
- `gate:brand-rules`: 7 rules.
- `gate:contrast`: 160 pairs in light, 168 in dark.
- `gate:pins`: 5 manifests, no finding.
- `gate:config-copies`: identical.
- `gate:signoff -- --range 2caad68..HEAD`: 8 commits, no finding.
- `pnpm test` (`gate:unit-tests`): 3739 tests passed in 161 files.
- `gate:mutation -- --base 2caad68`: exit 0, as above.
- `gate:storybook-build`: 44 stories.
- `OCELLE_VISUAL_ENGINE=docker gate:visual`: 88 captures match their baselines.
- `gate:axe`: 88 story-theme runs, 0 serious or critical, 10 excepted notes, all from 003's prose story.
- `gate:plants`: the full job (without `OCELLE_VISUAL_ENGINE`) judged the 260 plants that are not visual (the registry, every gate but `visual`, `axe` included) with no problem line, then exited 2 because it had no container engine for the 46 visual plants. I then ran shards 4 to 19 of `--plan` (the visual shards, 46 plants) one at a time with `OCELLE_VISUAL_ENGINE=docker --shard <n>`, and each reported "3 plants judged, every plant as expected". That makes every one of the 306 plants as expected, but in two runs, not as one `gate:plants` verdict.
- Behaviour probes for R1-01 to R1-03: a Playwright script in the session scratchpad, against the built
  `dist/browser/ocelle-elements.js`, with tokens generated from source. No repository file was changed.

Out of scope as instructed: CI confirmation of the baselines (B2), and the docker origin of the baselines.

## Earlier findings

This is the first round of phase 4. The carried notes are resolved as follows:

- Phase 2's R2-01 and phase 3's R1-03 are resolved by the data-model.md wording (departure 10).
- Phase 2's R2-02 is still open (R1-07).
