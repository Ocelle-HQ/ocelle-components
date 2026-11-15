---
phase: 4
round: 3
verdict: changes_requested
base: 2caad68db62feed502eb3963b65548f47d73ea6c
head: e4bbe18
tdd_check: pass
---

# Phase 4 review, round 3

US3: `ocelle-list-detail`, after the round-2 fixes. The change under review is `git diff 2caad68..e4bbe18`. There is no
uncommitted change. Since round 2 there are four commits: the operator's decision `d60ed96` (P4), the red commit
`7c640bb` (tests only), the fix `0faddb9`, and the tdd-check `e4bbe18` (evidence files only).

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R3-01 | blocking | `gates/plants/manifest/{fail-undescribed-attribute,fail-undescribed-css-part,fail-undescribed-css-property,fail-undescribed-event,fail-undescribed-property,fail-undescribed-slot,pass-reordered}/tree/packages/elements/custom-elements.json` (the `remeasure` entry, about `:275-281`); `packages/elements/custom-elements.json:279` | `gate:plants` fails: 7 problems in 306 plants, exit 1. The fix changed `remeasure()`'s JSDoc ("In that frame it also re-chooses the tier …") and regenerated the committed manifest, but did not update the seven manifest plant trees, which each hold a full copy of `custom-elements.json` with the old description. In each of those plants the gate now finds `packages/elements/custom-elements.json stale` on top of, or in place of, the planted finding. The six `fail-undescribed-*` plants are "not-caught: findings differ", and `pass-reordered` is "not-accepted: expected exit 0 with no finding, got exit 1". None of the nine plant copies contains "re-chooses the tier". round-2-fixes.md does not list `gate:plants` among the gates it ran. A failing check is blocking. | Bring the `remeasure` description in each manifest plant tree in line with the committed manifest: in the reversed key order for `pass-reordered`, and keep each plant's planted difference. Then run `OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants` to exit 0, or at least the manifest plants, if the runner can select them. No red test is needed, because this is a record of the gate's fixtures and not element behaviour. |
| R3-02 | note | `packages/elements/src/ocelle-list-detail.ts:208-213`, `:242-244`; `packages/elements/src/list-detail-measure.ts:59-63`, `:68` | `remeasure()` on an element that was never connected throws in the scheduled frame. Measured in process: `document.createElement("ocelle-list-detail").remeasure()` returns, and the next frame reports `Uncaught TypeError: Cannot read properties of undefined (reading 'querySelector')`, because `renderRoot` is still undefined and the `grid` getter calls `this.renderRoot.querySelector`. `measure()` means to do nothing before the first render (its JSDoc: "or null before the first render"), and it does for a connected element before its first render, but not for one never connected. The same getter has been there since the first green commit `45a828e`, so round 2's fix did not cause it. The new `after` step would throw the same way, but `measure()` throws first. I do not count it as blocking under the contract's `remeasure()` row (contracts/elements.md:93). The row promises a pass "for the next animation frame" and says nothing of an element that has no shadow root. No FR covers a call before connection. The error comes asynchronously, from the frame and not from the call, and it changes no layout. A removed element, and one hidden with `hidden`, are fine: I measured both, the tier held while hidden or detached, and the element came back to the right tier when shown or re-inserted. | Before landing, or as a follow-up: make the getter read `this.shadowRoot?.querySelector(...) ?? null` (or return early when `renderRoot` is unset), with a red test that calls `remeasure()` on a never-connected element and checks that the window reports no error. |
| R3-03 | note | `packages/elements/src/ocelle-list-detail.ts:291-295`, `:366-371`; `packages/elements/test/in-process.ts:113-121` | Lit's dev-only "change-in-update" warning. `firstUpdated` calls `#observeShadow` → `#observeSlots`, which calls `requestUpdate()` synchronously, so every element schedules a second update right after its first render. Lit's development build warns about this once per class. In process, the first list-detail scenario of a run absorbs the warning, so a scenario that asserts `messages: []` passes in the full file and fails when run alone. Measured: `-t "US3-12, 1196 px row"` and `-t "R2-01"` each fail on that one `console.warn`, at HEAD and also at `7aeca52`. It comes from round 1's fix `8ce2a4c`, not from this round. The built fixture harness uses Lit's production build and does not show it, and the gates run whole files, so no check fails. Still, those in-process assertions depend on test order, and the element does one extra update per first render. | Optional, test-first: call `requestUpdate()` in `#observeSlots` only when `#hasInspector` changed, so the first render brings no second update and no warning. The in-process scenarios then pass when run alone. Silencing the warning in the harness would hide the extra update instead. |
| R3-04 | note | `specs/009-workflow-layouts/contracts/elements.md:93`, `:133-140`; `specs/009-workflow-layouts/spec.md:773-783`; `packages/elements/README.md:471-478`; `specs/009-workflow-layouts/data-model.md:45` | The documents of the limitations are accurate on what matters, but slightly off in two places. (a) They call the narrow host one of "two known limitations" and then say it is seen except for a percentage padding. The contract's `remeasure()` row lists it as a limitation without that qualification. That is true, but it reads awkwardly (see "Departure from P4" below). (b) "No observer reports it" for the percentage case is stronger than the code. The edge box resolves the percentage against its own containing block: the nearest positioned ancestor, or else the initial containing block. When the host's container is that box, or when it follows the viewport, the change is seen. Measured: the 2% case with the container `position: relative` goes to one column at 500 px without `remeasure()`. The documents err on the safe side, and the remedy is right in every case. | Optional wording, for example "may not be reported" and "stays stale unless…", and in the contract's `remeasure()` row "a host whose content box is narrower … (a percentage padding there)". |
| R3-05 | note | `specs/009-workflow-layouts/contracts/overflow-region.md:121` | Phase 2's R2-02 is still open, carried as instructed. | None this phase. |

### Departure from P4

P4 asked the fix round to record two cases as known limitations, and the narrow host was one of them: "a host whose
content box is narrower than its own inline padding and borders". The R2-02 design makes most of that case seen: the
edge box is 0 px wide in its content box and out of flow, so its border box is never clamped. The red scenario "a host
whose content box is narrower than its own inline padding and borders" failed before the fix with `padded: one: list`
at 130 px (red-fix-2.log) and passes now in both harnesses. L19 and L23 each make it fail. The documents keep the case
under the heading P4 asked for, and state what is now true: a px or em padding change or a border change is seen, and
only a percentage padding stays stale, which is the first limitation again. That meets P4's intent, a convention that
tells #8 and #12 what is not seen and what to do about it. Recording as a limitation something the element now
handles would make the convention less accurate. The wording point is R3-04 (a). The orchestrator may want to tell the
operator about the departure, but it needs no new decision.

### The new design weighed

- **Edge box** (`ocelle-list-detail.ts:70-78`, observed at `:362` with `{ box: "border-box" }`). The box is
  `position: absolute; inline-size: 0; block-size: 0`, and it inherits the host's inline padding, border widths and
  border styles. Its border box is therefore the host's resolved inline padding and borders for px and em values, and
  a change of them alone notifies. A percentage padding resolves against the edge box's own containing block (R3-04 b).
  Out of flow, the box adds nothing to the intrinsic sizes. The R2-02 scenario measures 300 px empty and 300 px plus
  one letter in a min-content wrapper, and 691 px in a max-content wrapper, in both harnesses. L20 (in flow) brings the
  floor back. I checked that it adds no overflow, also where it reaches past the host: with no positioned ancestor,
  a 30 px host with `padding-inline: 20px 900px` in a 100 px wrapper gives a document `scrollWidth` of 950 px, the
  host's own right edge. The positioned scroll container of the narrow-host scenario gives 240 px, and L24 (1 px tall)
  makes that fail. Its zero-height borders paint nothing: `gate:visual` matches all 88 baselines.
- **The `firstUpdated` pass** (`:291-295`). It gives an element with nothing slotted its first pass. Before this, its
  sizer kept the `<svg>` default of 300 px. The empty max-content case was 702 px before the pass was added, and L25
  shows it. The pass is coalesced with the first-render slot changes (`schedule()` asks for at most one frame). Since
  it hid the slot change's own `schedule()` from the tests, the guard "a slot change after the first render measures
  again" was added (L27, and the mutant that survived the first mutation run).
- **The fresh measurement** (`#remeasured`, `:324-327`, run by the `after` step at `list-detail-measure.ts:59-63`). It
  takes `parseFloat(getComputedStyle(probe).inlineSize)`, the probe's used content width and so the host's content
  box, plus the host's computed inline padding and borders (`#resized`, `:308-317`, shared with the observer). It runs
  in the frame callback, after the pass, so it writes no figure inside a `ResizeObserver` delivery. `requestUpdate()`
  re-chooses the tier in the microtask before that frame's resize observation and paint. The pass-test case
  (`list-detail-pass.test.ts:138`) shows `one` at the end of the first frame after `remeasure()`, in one pass with a
  light-DOM change made in the same task. Reading the probe rather than the last reported size is needed for an
  element inserted from a task, whose first pass comes before its first observation. The guard at
  `list-detail-pass.test.ts:161` shows that, and L26 makes it fail. A hidden host gives `NaN` here, the computed
  `auto`, but the tier is not shown then, and the observer's report when the host is shown corrects it before paint.
  I measured this (see R3-02).

## Test quality

**Red evidence.** `7c640bb` changes only test files: `list-detail-pass.test.ts` and `scenarios/list-detail.ts`
(`git show --stat`). `red-fix-2.log` shows exactly seven failures of 3754, all `AssertionError`s on observed values:

- R2-02 in both harnesses (`empty: 600, letters: 592`);
- the R2-01 percentage scenario in both harnesses;
- the narrow-host scenario in both harnesses (`padded` stays `one: list`);
- the pass test (`inFrame: "two"`).

These are the defects themselves, not setup errors. `red-commits` has `fix-2 7c640bb`. tdd-check.json has
`fix-2` with exit 1, `head_exit` 0, `status: pass` and no problems. It records head `0faddb9`, and `e4bbe18` adds only
evidence files.

**Tests changed after red.** I read `git diff 7c640bb..HEAD -- packages/elements/test storybook/test gates/test`:

- Two guards were added (L26, L27).
- `readme.test.ts` gained the new README sentences and the longer `remeasure()` item.
- Plant comments changed.
- One red test changed: the narrow-host scenario's scroll container became `position: relative`, and its name says
  "a positioned 100 px scroll container". Its expectations are byte-identical.

I checked that the change is stricter. In the copy, with `position: relative` taken out again, plant L24 (a 1 px tall
edge box) passes all 62 tests. With it, L24 fails the scenario. Without the positioned container, the edge box's
containing block is the initial containing block and its overflow cannot reach the container the test reads. The
red failure was on `padded`, and the position change does not affect that. No expectation was loosened, and no test
was skipped or deleted.

**Assertions.** Every new test makes unconditional `toEqual` assertions on observed values: tiers, border-box widths,
scroll width, pass counts and messages. There is no skip, no only and no snapshot, and `gate:test-lint` reports no
finding. The R2-01 percentage scenario shows that the tier is stale and is then corrected, both ways. The pass test
asserts the frame and the pass count.

**Coverage.** Each case of R2-01 and R2-02 has a scenario in both harnesses. `remeasure()` as the remedy is covered in
both directions and in the pass test. The only path with no test is R3-02.

**Plants, re-run by me** in a copy of the repository at HEAD. Each plant is my own exact text replacement. I ran
`list-detail.test.ts`, `list-detail-pass.test.ts` and `list-detail-upgrade.test.ts` in process (62 tests), then
restored the file and compared it byte for byte:

| # | Plant | Fails |
|---|---|---|
| L18 | `this.#resize.observe(this, { box: "border-box" })` in place of the edge box | pass test R2-01; R2-01 percentage; US3-12 a mutation inside a ResizeObserver callback; US3-16 (4 of 62) |
| L19 | edge box not observed | R1-03; R2-01 narrow host (2) |
| L20 | `position: absolute` removed from `.edges` | R2-02 (1) |
| L21 | `document.activeElement` | R1-02 (1) |
| L22 | `this.#after()` removed | pass test R2-01; R2-01 percentage (2) |
| L23 | edge box observed in its content box | R1-03; R2-01 narrow host (2) |
| L24 | `.edges` `block-size: 1px` | R2-01 narrow host (1) |
| L25 | no `schedule()` in `firstUpdated` | R2-02 (1) |
| L26 | the probe read removed from `#remeasured` | pass-test guard, inserted from a task (1) |
| L27 | no `schedule()` in `#slotChanged` | guard, slot change after the first render (1) |

Each result matches plants.md. **L18's change since round 1**: in round 1 L18 failed six tests, including the US3-12
1196 px row, the dialog and the content-change cases. Now it fails four. The fresh measurement after each pass
corrects the host's border box in the frame of the pass, so those cases no longer tell the plant apart. The case L18
guards in the design, the loop message of "a mutation inside a ResizeObserver callback", still fails, and so do US3-16
and the percentage cases. The plant is still killed for the right reason, and plants.md explains the change.

**Mutation.** I ran `pnpm run gate:mutation -- --base 2caad68` in the copy at HEAD. It found 286 mutants on the changed
lines of 4 files, and none survived. It also reported 2 timeouts (`connectedCallback`, as in rounds 1 and 2),
96 compile errors (`tiers.ts`), 1 zero-mutant entry (`src/index.ts`) and 8 equivalent records, and it exited 0. The
record whose code the fix moved, `:313` "an update with the size in force chooses the same tier", still holds now that
the `after` step calls `#resized` too. An extra `requestUpdate` with the same size chooses the same tier and the same
shown panes, so `#focusTo` stays unset. The other records are unchanged and still hold.

## Checks run

All checks ran on HEAD `e4bbe18`, in a byte-identical copy of the repository in the session scratchpad, except
`gate:plants`, which ran in the repository itself. `git status` of the repository was clean before and after.

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
- `gate:signoff -- --range 2caad68..HEAD`: 19 commits, no finding.
- `pnpm test`: 3761 tests passed in 161 files.
- `gate:mutation -- --base 2caad68`: exit 0, as above.
- `gate:storybook-build`: 44 stories.
- `OCELLE_VISUAL_ENGINE=docker gate:visual`: 88 captures match their baselines.
- `OCELLE_VISUAL_ENGINE=docker gate:axe`: 88 story-theme runs, 0 serious or critical, 10 excepted notes (003's prose
  story).
- `OCELLE_VISUAL_ENGINE=docker gate:plants` (the full job, in the repository itself, as one run of about 80 minutes): **exit 1, 7 problems in 306 plants**, all seven in `manifest` (R3-01). Every other plant of the 17 gates and the registry was judged as expected.
- Behaviour probes: a scratch vitest file in the copy (`elements` project), deleted afterwards. It covered a
  never-connected `remeasure()` (R3-02), a hidden and a re-inserted element, the percentage case in a positioned
  container (R3-04 b), and the edge box's overflow with no positioned ancestor. I also ran single scenarios alone, at
  HEAD and with `7aeca52`'s source (R3-03).

Out of scope as instructed: CI confirmation of the baselines at landing (B2), and the docker origin of the baselines.

## Earlier findings

- **R2-01: resolved by operator decision P4.** The percentage case is recorded as a known limitation, with
  `remeasure()` as the remedy, in:
  - FR-025 (`spec.md:773-783`);
  - the contract's `remeasure()` row and § Container-tier convention, "Measurement" and "Unseen changes"
    (`contracts/elements.md:93`, `:113-115`, `:131-140`);
  - the README's `remeasure()` item and § Container tiers (`README.md:311-313`, `:471-478`), asserted by
    `readme.test.ts`;
  - data-model.md `measured` and the re-measure triggers, research.md R-13, and spike.md.

  `remeasure()` now re-chooses the tier from a fresh measurement in the frame of its pass. This was red first: the
  scenario in both harnesses and the pass test. L22 makes both fail. The narrow-host case is now seen except for a
  percentage padding, and the documents say so (Departure from P4 above). The wording points are R3-04.
- **R2-02: resolved.** The edge box is out of flow, so the host's inline padding and borders are added to its
  intrinsic sizes and are no floor of them. The documents now state this: contract § Intrinsic sizes `:126`, FR-025,
  and the README's convention, asserted. The red scenario failed with `empty: 600, letters: 592` (red-fix-2.log) and
  passes in both harnesses. L20 and L25 make it fail.
- **R2-03 (note): resolved.** plants.md § Plants of the review fixes records L18 to L27. Each `listDetailFixes`
  scenario and each review guard names its plant beside it (`scenarios/list-detail.ts:816`, `:831-834`, `:859`, `:875`,
  `:906-908`, `:934-936`; `list-detail-pass.test.ts:134-137`, `:157-160`).
- **R2-04 (note):** carried as R3-05.
