---
phase: 2
round: 2
verdict: changes_requested
base: 48cdc9584ab93373eff1544378e118f20eded10e
head: 130d21b
tdd_check: pass
---

# Phase 2 review, round 2

Scope: the round-1 fix, `git diff 156491e..130d21b`: red fix-1 045bd1f (tests only), green ea75e49
(`ocelle-button.ts`, the two icon-only baselines, README, the R1-03 comment, the fix note and red log), tdd-check
outputs 130d21b. The whole phase (`48cdc95..130d21b`) was re-checked by the gates below. The work tree was clean
throughout. Read: round-1.md, round-1-fixes.md, red-fix-1.log, check-red-fix-1.log, tdd-check.json, the spec's FR-031
scenario (spec.md:454-458), plan R-09, tasks.md Phase 2 (all ticked; the unticked tasks start at T030, phase 3).

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R2-01 | blocking | packages/elements/src/ocelle-button.ts:291 (`observe(this, { characterData: true, subtree: true })`), :298-302 | The "no label" detection misses a label written into, or removed from, a slotted element. Writing text into a slotted `<span>` (`span.textContent = "Close"`, `span.append("Close")`, a framework rendering `<span>${label}</span>` whose value goes from `nothing` to text, React creating the text node later) is a `childList` mutation inside the span: the default slot's assignment is unchanged, so no `slotchange` fires, and the observer watches `characterData` only. Probed in Chromium 1248 with the built bundle (dist/browser/ocelle-elements.js, which contains the fix): `<ocelle-button label="Close"><ocelle-icon slot="icon"></ocelle-icon><span id="l"></span></ocelle-button>`, then `l.textContent = "Close"`: the row stays `bare` and the icon's `margin-inline-end` stays `0px`, so the icon touches the visible label "Close"; the reverse (`<span>Save</span>` emptied by `textContent = ""`) keeps the 8 px gap on an icon-only button. This is a regression introduced by the fix (before it, a labelled button always had its gap), it contradicts the README line added in ea75e49 (README.md:171-173: "With no label in the default slot ... the icon takes no gap") and the fix note's own definition, which is FR-031's, whose acceptance scenario is exactly this case ("after text is written into that span its region takes space and the gap returns, and after the text is removed again it takes none", spec.md:456-458). The in-process tests cover a text node's data (button.test.ts:80) and static spans (:99), not text inserted into or removed from a slotted element. | Test first (red fix-2): in `test/button.test.ts`, an icon-only button with an empty slotted `<span>`; write text into it by inserting a text node (and once by `textContent`), assert the 8 px gap; remove it again, assert `0px` and the centred icon; also a text node inserted into a nested element of the span. Then observe `childList` as well (`{ characterData: true, childList: true, subtree: true }`), or an equivalent mechanism, and run the mutation gate on the changed line. |
| R2-02 | note | packages/elements/src/ocelle-button.ts:291; packages/elements/test/button.test.ts:109 | A label forwarded through another shadow root's `<slot>` is read once, but a later text change in the forwarding host's light DOM is not seen: the text node lies outside the button's subtree and its data change fires no `slotchange`. Probed: `<div id="o"> </div>` with a shadow root `<ocelle-button label="Close"><ocelle-icon slot="icon"></ocelle-icon><slot></slot></ocelle-button>`, then `o.firstChild.data = "Close"`: the row stays `bare`, `0px`. The fix note presents forwarding as supported; only the static case is. Rare today (no consumer forwards a button label), so not blocking. | Either observe the flattened assignment's nodes (re-registering on `slotchange`), or state in the README that a forwarded label is read when the forwarded slot's assignment changes, not when its text changes. |
| R2-03 | note | specs/012-button-action-row/reviews/phase-2/round-1-fixes.md (R1-02 row) | R1-02 deferred. Acceptable: round 1 classed it a note and asked for the record "at the next planning touch", and the default line height is a sound, token-only choice that the visual baselines capture. The assertion beside US1-6 was cheap and could have come with this fix; carry both into the next planning touch as the fix note says. | None now; R1-02's change stays open for the next planning touch. |

## Test quality

- **tdd-check.json**: `pass`, no problems, head ea75e49 (130d21b adds only the check's own outputs, so it is current).
  Red commits: phase fa5ef5c exit 1, fix-1 045bd1f exit 1; final tests on the scaffold exit 1, on the base exit 2,
  at head exit 0.
- **Red fix-1 (045bd1f).** Tests only (`test/button.test.ts` +66, `test/scenarios/button.ts` +32). check-red-fix-1.log:
  11 of 3359 failed, exactly the 11 new tests (4 scenarios x in process and strict-CSP fixture, and the 3 in-process
  tests), each on an `AssertionError` of its deep equality: the missing behaviour, not a setup error. The implementer's
  own red-fix-1.log had a 12th failure, the docker visual integration test; the tdd-check rerun does not, so it was a
  flake as the fix note says.
- **After red.** `git diff 045bd1f..ea75e49 -- packages/elements/test`: only the R1-03 doc comment of
  `flushHoverUnchanged` (button.ts:136-140). No test weakened, skipped or deleted.
- **Assertions.** The new scenario asserts the icon's centre against the inner control within 0.5 px for no content,
  whitespace and content in an unknown slot, the 8 px gap after moving the span into the default slot, the centred
  icon after moving it out, the flush start edge, and axe; ltr and rtl, default and compact. Hand-written expectations,
  no conditional assertion. R1-01's required test is met; R2-01 is a case it does not reach.
- **Mutation.** `pnpm run gate:mutation -- --base 48cdc95` (my run, whole phase): 157 mutants on the changed lines of
  5 files, none survived; 2 timeouts (ocelle-button.ts:291, the observer options replaced by `{}` and `characterData`
  by `false`: both make `observe()` throw in the constructor, so the element never upgrades; reported, not blocking),
  51 compile errors, 2 zero-mutant entries (`icon-slot.ts`, `index.ts`), 1 equivalent record (ocelle-button.ts:51,
  `label: { type: String }` to `{}`, accepted in round 1). The CSS rule `.icon-row.bare ...` is not mutated (CSS in a
  `css` template) but the scenarios' 0 px and 8 px assertions cover it.
- **Mutation choices.** The implementer removed `disconnectedCallback` and an "unchanged" early return rather than
  test them. Both removals are sound: an observer does not keep its target alive (the element-observer pair is a
  cycle the collector frees), observing a detached element only costs a callback on a text change in it, and an
  unconditional `requestUpdate()` is a cheap re-render. No behaviour was lost by them.

## Checks run

All on HEAD 130d21b, one at a time:

- `gate:typecheck`, `gate:lint` (279 files), `gate:style-lint` (14), `gate:test-lint` (187), `gate:prefix`,
  `gate:pins`, `gate:config-copies`, `gate:manifest` (3 elements), `gate:contrast` (193 light, 201 dark, 182 required),
  `gate:brand-rules` (7 rules), `gate:csp` (12 files), `gate:signoff -- --range 48cdc95..HEAD` (16 commits),
  `gate:storybook-build` (38 stories): all pass.
- `pnpm test`: 3359 tests passed in 148 files.
- `OCELLE_VISUAL_ENGINE=docker pnpm run gate:visual`: 76 captures match (docker only).
- `gate:axe`: 76 story-theme runs, 0 serious or critical; 10 excepted notes.
- `gate:mutation -- --base 48cdc95`: see above.
- `gate:plants` with `OCELLE_VISUAL_ENGINE=docker`, the shards touched by this fix (the other gates' plants and the
  visual plants built on the repository's stories and baselines): shards 1, 2, 3 (76 plants each), 5, 7, 22, 24, 34, 40 (`fail-token-changed`, 123 s) and 49 (`pass-repository`): every plant as expected. The axe shards (52 to 76) were not rerun: `gate:axe` passes on the same stories and the fix adds no story.
- **Baselines.** Only the two icon-only baselines changed (`git log -- storybook/baselines/`: ea75e49 touches only
  those). Viewed both and the round-1 light capture: the close glyph is now centred in the default and the compact
  button, each 8 px narrower; dark likewise. The gate matched them under docker, so they are the pinned container's
  output.
- **Probes** (R2-01, R2-02): a Playwright script in my scratchpad loading `dist/browser/ocelle-elements.js` into a
  blank page in Chromium 1248 with `--ocelle-space-2: 8px`; no repository file changed.

## Earlier findings

- **R1-01 (blocking): partly resolved.** The static icon-only case is fixed: the icon is centred in both sizes and
  directions, US1-8's icon-and-label gap and US1-12's flush start hold (scenarios pass in process and on the
  strict-CSP fixture), the shared `icon-slot.ts` is unchanged, and the two baselines were regenerated by
  `visual:update` in the pinned container. The fix came with a red test (`red-commits`: fix-1 045bd1f, exit 1). But the
  dynamic detection it adds is incomplete and regresses a labelled button whose text is inserted into a slotted
  element (R2-01).
- R1-02 (note): deferred, acceptable (R2-03). R1-03 (note): resolved, the comment names dark `neutral-bg`
  (test/scenarios/button.ts:136-140). R1-04, R1-05: nothing required.
