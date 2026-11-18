---
phase: 4
round: 2
verdict: changes_requested
base: 2caad68db62feed502eb3963b65548f47d73ea6c
head: 7aeca52
tdd_check: pass
---

# Phase 4 review, round 2

US3: `ocelle-list-detail`, after the round-1 fixes. The change under review is `git diff 2caad68..7aeca52`. There is no
uncommitted change. Since round 1 there are four commits: the operator's decision `9c090b5` (P3), the red commit
`172e572` (tests only), the fix `8ce2a4c`, and the tdd-check `7aeca52` (evidence files only).

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R2-01 | blocking | `packages/elements/src/ocelle-list-detail.ts:68-74`, `:205-216`, `:333`; `specs/009-workflow-layouts/reviews/phase-4/spike.md:73-88` | R1-03 is only partly resolved. Some changes of the host's inline padding alone still keep the tier stale, and two of them are recorded nowhere. The edge box inherits the *computed* `padding-inline`. For a percentage that value is the percentage, and the edge box resolves it against the host's content box, not against the host's containing block (the code comment at `:206` says so). So when the host's containing block resizes, a content-box host with a definite or clamped inline size changes its used padding and its border box. Neither the probe's content box nor the edge box's content box changes, so nothing is notified. Measured in process (Chromium, a scratch test in a copy of the repository): `collapse-below="640px"`, `box-sizing: content-box; max-inline-size: 600px; padding-inline: 2%` in a container that goes from 1500 px to 800 px. The border box goes from 660 px to 632 px, and the tier stays `two`. With `inline-size: 600px` and a container going from 1000 px to 500 px, the border box goes from 640 px to 620 px, and the tier stays `two`, also after `remeasure()`. A capped content column with percentage gutters is a common host pattern. The same holds at `172e572`, so the fix did not cause it, but it is the case P3 asked to fix ("a host padding-only or border-only change … re-measure the tier, as FR-025 and contracts/elements.md promise"). round-1-fixes.md says "a percentage padding is still read as the host resolves it". That is true of the sum, not of the notification. The second case is spike.md's own cost 2: a host whose content box is narrower than its own inline padding and borders. Measured: content 30 px, `collapse-below="120px"`, `padding-inline` from 40 px to 50 px. The border box goes from 110 px to 130 px, and the tier stays `one`. Both cases break FR-025 ("follows the element's own measured inline size (its border box) … and re-measures on every resize"), contracts/elements.md:113 and README.md:445. Cost 2 appears only in spike.md, a review evidence file no host reads. The percentage case appears nowhere. `remeasure()` gives no remedy, because it re-runs the intrinsic pass and not the tier choice. | Red first, in both harnesses: the capped content-box host with percentage `padding-inline` in a resizing container, both ways across the threshold, and the content-narrower-than-edges case. Then make these changes re-choose the tier. Or put the remaining cases to the operator and, if accepted, record them with the host's remedy in FR-025, contracts/elements.md § Container-tier convention (Measurement or Unseen changes) and README.md § Container tiers. |
| R2-02 | blocking | `packages/elements/src/ocelle-list-detail.ts:68-74`, `:278`; `specs/009-workflow-layouts/reviews/phase-4/spike.md:84-85` | The fix brings a new departure from the intrinsic-size rule. The edge box is an in-flow block with the host's inline padding and borders, so its intrinsic contribution, the host's inline padding plus borders (P), is a floor of both the host's min-content and its max-content content size. The host's own padding and borders then come on top. Measured in a `inline-size: min-content` wrapper with `padding-inline: 150px`: an empty list-detail is 600 px at HEAD and 300 px at `172e572` (before the fix), and one letter per pane gives 600 px at HEAD and 308 px before the fix. FR-025 and contracts/elements.md:124 ("min-content the narrowest's"), and README.md:460 ("its min-content size is that of its narrowest"), state no such floor. spike.md records it as "far below the grid's figures in every case of the scenarios". That is true of the scenarios, but neither the contract nor the README makes it a condition, and the README is where #8 and #12 read the convention. The floor binds whenever the one-column min-content is under P, and the max-content floor binds whenever the three-column max-content is under P (for a large padding, or a narrow list and inspector token override). | Red first: a shrink-to-fit case with inline padding larger than the content's one-column min-content (for example the empty list-detail with 150 px padding in a `min-content` wrapper: 300 px), in both harnesses. Then take the edge box's contribution out of the element's intrinsic sizes. Or put the cost to the operator and, if accepted, state it in FR-025, contracts/elements.md § Intrinsic sizes and the README's convention. |
| R2-03 | note | `packages/elements/test/scenarios/list-detail.ts:22-23`, `:810-849`; `specs/009-workflow-layouts/reviews/phase-4/plants.md` | The new plants L18 and L19 are recorded only in round-1-fixes.md. plants.md, which the scenario file names as the plant record (T061), is unchanged, and the three `listDetailFixes` scenarios do not name their plants beside them as the other scenarios do. | When the R2 fixes touch the records, add L18 and L19 (and any new plant) to plants.md, and name the plant in each `listDetailFixes` scenario. |
| R2-04 | note | `specs/009-workflow-layouts/contracts/overflow-region.md:121` | Phase 2's R2-02 is still open, carried as instructed. | None this phase. |

### The R1-03 design weighed

The edge box solves the case round 1 measured. A content-box host with a definite `inline-size` that only changes its
px padding or its border widths now re-chooses the tier, both ways across the threshold. The new scenario shows it in
both harnesses, and the loop message stays away (US3-12 "a mutation inside a ResizeObserver callback" passes, and L18
fails it). The sum is unchanged ("876px gives two, 877px one" passes). `em` padding is seen too, because the inherited
computed value is in px. The two costs spike.md records are real, and both conflict with what FR-025 and the
contract's container-tier convention promise, without a word in either or in the README. One is R2-02, the floor
(introduced by the fix). The other is in R2-01, the narrow host (also present before the fix, now recorded but only in
spike.md). A third gap, percentage padding, is recorded nowhere (R2-01). The edge box's zero-height inline borders
paint nothing. US3-14's tree and the axe gate show the `aria-hidden` block adds nothing to the accessibility tree.

## Test quality

**Red evidence.** `172e572` changes only test files (`git show --stat`). `red-fix-1.log` shows exactly eight failures
of 3747, all `AssertionError`s on the observed values: the R1-01 upgrade cases (in process in Frame N and R, and on
the fixture page in Frame N and R), R1-02 in both harnesses, and R1-03 in both harnesses. The red values in
round-1-fixes.md match the defects round 1 measured (`in >> div.pane.detail`, `opened: "body"`, `one: list` at 650 px).
`red-commits` has `fix-1 172e572`, and tdd-check.json has `fix-1` with exit 1, `head_exit` 0 and `status: pass`.

**Changed existing tests, none weakened.** The red commit changed three existing tests:

- The browser upgrade cases gained a `frame` field and an `inspector` display in each expected value. That is
  stricter.
- The fixture `list-detail-upgrade.html` and the in-process `markup()` gained a button in the inspector. The existing
  cases focus the list, the detail or `#before`, so their expectations are unchanged and still meaningful.
- The two harness loops spread `listDetailFixes` in addition to the existing lists.

`git diff 172e572..HEAD -- packages/elements/test storybook/test gates/test` is empty, so no test changed after red.

**Assertions.** The new tests use unconditional `toEqual` on observed values, with no skip, no only and no snapshot.
`gate:test-lint` reports no finding. The R1-03 scenario asserts the host's border box as well as the tier, so a wrong
test page cannot pass it.

**Coverage.** Round 1's missing paths are now covered: focus in the inspector at upgrade, and a list-detail inside a
shadow root, both ways. The paths of R2-01 and R2-02 are not covered.

**Plants, re-run by me** in a copy of the repository at HEAD, on `list-detail.test.ts` and `list-detail-upgrade.test.ts`
(in process). Each plant is my own text replacement, and the file was restored and compared byte for byte:

| # | Plant | Fails |
|---|---|---|
| L19 | `.edges` not observed (`querySelectorAll(".probe")`) | US3 review R1-03 (1 of 51) |
| L18 | the host observed with `box: "border-box"` beside the probe, in place of the edge box | US3-12 1196 px row, dialog, both content-change cases, a mutation inside a ResizeObserver callback; US3-16 (6 of 51) |
| L3 | focus moved to the first shown pane on every `detail-open` or shown-pane change | US3-6 focus not moved; US3-16; the upgrade case with focus in the list (3 of 51) |
| L4 | `tabindex="-1"` on every wrapper, never removed | US3-6 at rest; US3-6 by keyboard, light and dark; US3-6 focus not moved; US3-7; the guard with focus on a pane (6 of 51) |
| L6 | `#hasInspector` always true | US3-8; the empty list-detail guard (2 of 51) |
| L7 | the `inspector` slot rendered only when an inspector is present, presence read at each update | US3-8; US3-16 (2 of 51) |

Each plant fails the scenario it guards, as round-1-fixes.md reports.

**Mutation.** `pnpm run gate:mutation -- --base 2caad68` ran in the copy at HEAD. It reports 274 mutants on the
changed lines of 4 files and none survived. There were 2 timeouts (`ocelle-list-detail.ts:241-242`,
`connectedCallback`, as in round 1), 95 compile errors (`tiers.ts`) and 1 zero-mutant entry (`src/index.ts`). It found 8
equivalent records, and the exit code was 0. I read the records whose lines the fix touched:

- `ocelle-list-detail.ts:220` (round 1's `:205`): `#hasInspector = false` mutated to `true`. The new reason, "connectedCallback sets it from the host's light-DOM children before the first update", is right. `connectedCallback` → `#observeShadow` → `#observeSlots` (`:337-343`) always assigns `[...this.children].some((child) => child.slot === "inspector")`. Lit runs no `willUpdate` before connection, so the initial value is never read. The mutant is equivalent, and the reason now names the path that R1-01 fixed.
- `:213`: the same size chooses the same tier. This still holds with `#content` kept between deliveries.
- `:251`: "a detached probe reports no size". This holds for both blocks.

The other five records are unchanged from round 1 and still hold.

## Checks run

All on HEAD `7aeca52`, run in a byte-identical copy of the repository in the session scratchpad. `git status` was clean
before and after.

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
- `gate:signoff -- --range 2caad68..HEAD`: 13 commits, no finding.
- `pnpm test`: 3747 tests passed in 161 files.
- `gate:mutation -- --base 2caad68`: exit 0, as above.
- `gate:storybook-build`: 44 stories.
- `OCELLE_VISUAL_ENGINE=docker gate:visual`: 88 captures match their baselines.
- `OCELLE_VISUAL_ENGINE=docker gate:axe`: 88 story-theme runs, 0 serious or critical, 10 excepted notes (003's prose story).
- `OCELLE_VISUAL_ENGINE=docker gate:plants` (the full job, in the repository itself; the gate builds its own temporary repositories): 306 plants of 17 gates and the registry judged, every plant as expected, exit 0, as one run.
- Behaviour probes for R2-01 and R2-02: a scratch vitest file in the copy, run in the `elements` project, on HEAD's source and on `172e572`'s `ocelle-list-detail.ts`. The copy was restored afterwards, and no repository file was changed.

Out of scope as instructed: CI confirmation of the baselines at landing (B2), and the docker origin of the baselines.

## Earlier findings

- **R1-01: resolved.** `#hasInspector` is read from the host's element children with `slot="inspector"`
  (`ocelle-list-detail.ts:341`), which the first `willUpdate` sees. The red upgrade cases, with focus in the
  inspector in Frame N with `detail-open` and in Frame R, in process and on the fixture page, failed at `172e572` and
  pass now. The `:205` record (now `:220`) is kept with a correct reason (see Mutation). L6 and L7 still bite.
- **R1-02: resolved.** `#focusedPane` reads `(this.getRootNode()).activeElement` (`:306`). The red scenario, a
  list-detail in `test-shadow-frame`'s open shadow root with focus moving to the detail and back to the list, failed
  with `body` at `172e572` and passes in both harnesses. For a disconnected element, `getRootNode()` has no
  `activeElement`, and `contains(undefined)` is false, so nothing is moved. data-model.md § Focus rule and R-14 are
  updated.
- **R1-03: partly resolved (R2-01), with a new cost (R2-02).** The measured case and its border-width twin pass both
  ways in both harnesses, and L19 shows the edge box carries them. Percentage padding, and a host narrower than its
  own edges, are still unseen. The design also adds an intrinsic floor that the contract does not allow.
- **R1-04 (note): resolved.** research.md R-11's table has `1fr`, with the reason and spike.md item 1. R-13 says
  "the element's `ResizeObserver`" on the probe and the edge box, and its Recorded-cost sentence now says the figures
  stay stale in every tier because the panes are contained. data-model.md has the same wording.
- **R1-05, R1-06 (notes):** no change needed. **R1-07:** carried as R2-04.
