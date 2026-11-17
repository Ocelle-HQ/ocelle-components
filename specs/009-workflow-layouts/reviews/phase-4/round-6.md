---
phase: 4
round: 6
verdict: changes_requested
base: 2caad68db62feed502eb3963b65548f47d73ea6c
head: 6376fcee9363cb3c50435c6ae0a16b187f700e71
tdd_check: pass
---

# Phase 4 review, round 6

Scope: the fix of operator round 5 (O5-01, T078 to T082), fix range `f3a895f..6376fce` (red `243bd28`, green
`aaaa19b`, tdd-check `6376fce`). No full new search outside that range.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R6-01 | blocking | packages/elements/src/list-detail-measure.ts:68-70 (`resume()`), packages/elements/src/ocelle-list-detail.ts:222-223; packages/elements/test/list-detail-pass.test.ts:276 (`again: 0`) | Becoming rendered requests a pass only when a skipped pass left `#pending` set. The design asks for a pass on every change from no box to a box: T080 ("when it sees the element become rendered, requests a pass for the next animation frame"), data-model.md § list-detail "Not rendered" ("set `pending`, request a frame if none is"), research.md R-13 "Not rendered" ("when the probe's `ResizeObserver` sees the element become rendered (no box before, a box now), it requests a fresh pass"), and spec FR-025 (spec.md:801-803: "When the element becomes rendered ... its intrinsic sizes are measured afresh in the next animation frame ... the host need not call `remeasure()`"). The fix note records the narrower reading as its own reading of the data model. No operator decision backs it. The narrowing leaves one case stale: an unseen change made while the element is hidden. Take an element measured while visible, then hidden (a dialog closed), then an attribute-only change (a class swap that widens a pane) or an image or font load while hidden, then shown with no `remeasure()`. Nothing set `#pending`, because the `MutationObserver` has no `attributes` and never fires for that change, so no pass runs. The element keeps its old figures until the next seen trigger. Yet README.md:498-507 lists becoming rendered as a trigger ("first rendered or changed while it had no box ... measures its intrinsic sizes afresh"), and says the unseen changes "wait for the next of these". The contract (contracts/elements.md:131-140) says the same: becoming rendered is a trigger, and unseen changes wait for the next trigger. Guard 1 pins the narrowed behaviour (`again: 0` for a hide and show with nothing pending). The orchestrator's example (measured visible, hidden, container width changed, shown) is not stale: the intrinsic sizes do not depend on the container, and the probe's delivery on show (0 px to the new content box) re-chooses the tier. | Red test first, as a `fix-5` red commit: an element shown at 1073 px, its wrapper hidden, an attribute-only change in a pane while hidden that changes a figure (for example a class swap to a wider block), then shown with no `remeasure()`; after settle it must have the figures of its new content. Then make a no-box observation leave the pass pending, as data-model.md says ("set `pending`"), for example by having the observer's not-rendered branch mark the measure pending. Becoming rendered then always requests a pass, which is coalesced and runs once per frame (R-13). Change guard 1's `again` to 1 and give the reason. Guard 2 still holds, because `disconnectedCallback` disconnects the observer synchronously (ocelle-list-detail.ts:269) before any delivery. The alternative is an operator decision that narrows FR-025, data-model.md, research.md R-13, T080, the contract and the README to "only when a pass is pending", and that states unseen changes made while hidden still need `remeasure()`. |
| R6-02 | note | packages/elements/test/scenarios/list-detail.ts:714-744 | T078 asks every case, including the hidden one, to assert "the same column count on each of ten frames". The hidden case waits ten frames and then reads once. It does not record each frame. The spec's US3-12 text for this case (spec.md:566-568) does not ask for per-frame readings, and the four first-render cases do record them. | Optional: record `tierReading("x")` and `tierReading("y")` over the ten hidden frames. |
| R6-03 | note | packages/elements/test/list-detail-pass.test.ts:284-307 | Guard 2 pins "no pass at reinsertion until `remeasure()`". That matches the documented R3-02 rule (README.md:314-315: after changing a removed element, call `remeasure()` once it is inserted again), and it is the observable that kills the disconnection mutants. It covers only the path with nothing pending. An element removed while hidden with a skipped pass pending does run that pass at reinsertion, which is harmless and not contradicted. If reinsertion ever becomes a trigger, this guard has to change with the contract. | None. |

## Test quality

- **Red evidence.** `red-fix-4.log` and `check-red-fix-4.log` show 13 failures on `243bd28`, and only the new tests
  fail: the four "not rendered at first" cases and "hidden then remeasured" in both harnesses, and the three README
  fragments. Each fails on an assertion about the defect. The in-process run shows `s` at `width: 0` against 1073
  (`list-detail.test.ts:19`). The browser harness shows the same deep-equal mismatches. None fails on a setup error.
- **Non-vacuous.** Each first-render case compares `s` with the fixed `threeAt1073`, and also checks that its twin
  `t` on the same page has that state, so a broken twin cannot hide a broken `s`. Each case also asserts the per-frame
  tier set and an empty `messages()`.
  - The hidden case is discriminating on all three of its parts:
    - while hidden, `x`'s figures stay 1073/480, where the old code wrote `0px`;
    - while hidden, the two-column `y` keeps `two` and unchanged figures, where `NaN` turns it to `three`;
    - shown again, the minimum is 560 px, which only a pass after showing can produce.
- **Deviation 2 (35rem block, twin `y`).** Accepted, as stricter than the task text. A text change in the 18rem list
  track would leave both figures as they were, so the "figures of its new content" check would pass with no pass at
  all. The 35rem block (560 px minimum) makes that check able to fail. `y` sits inside the same hidden wrapper
  (`x-w`), in Frame W at two columns, because a `NaN` measured size shows only on an element whose correct tier is
  not three. L30 confirms it: only `y` reveals that plant in the hidden case.
- **Plants L28 to L31.** I checked each against the code and the assertions:
  - L28 (no `resume()`): the first-render cases stay unmeasured, and the hidden case keeps 480 px.
  - L29 (no `getClientRects()` guard): 0 px is written while hidden.
  - L30 (no guard in `#remeasured`): `y` gets `NaN` and shows `three`.
  - L31 (the observer takes a 0 px probe): `x` and `y` show `one` while hidden.

  Each assertion named in plants.md:69-72 fails under its plant, so all four bite.
- **Weakening.** `git diff 243bd28..HEAD -- packages/elements/test` changes only `list-detail-pass.test.ts`, and
  only by adding two tests. Nothing was removed or loosened.
- **Guards after green.** Both are honest about what they test, and the mutants they kill are named. Guard 1's
  `again: 0` pins the narrowed trigger that R6-01 rejects. Guard 2: see R6-03.
- **`getClientRects()` check.** It is correct for the three named cases. A closed `<dialog>`, a `display: none`
  ancestor and a `hidden` host each leave the shadow grid and the probe with no boxes, while a rendered box of
  0 px still has one rect. `#rendered()` (ocelle-list-detail.ts:344-347) treats a missing probe as rendered, and its
  comment limits it to calls made after the first render. `resume()` goes through `schedule()`, so the pass is
  coalesced and never runs inside the delivery. `measure()` clears `#pending` only on a pass that ran. The
  synchronous pass before a host-set tier change, run while hidden, leaves the pass pending, and showing the element
  then resumes it.
- **Mutation.** `pnpm run gate:mutation -- --base 2caad68`: 332 mutants on the changed lines of 5 files, none
  survived; 2 timeouts, 109 compile errors, 1 zero-mutant entry (`src/index.ts`), 11 equivalent records. I read the
  new record (list-detail-measure.ts:30, initial `#pending`). It holds: the first pass runs in the animation frame,
  before the first `ResizeObserver` delivery of that frame, so it clears or sets `#pending` before `resume()` can
  read it. A pass requested while one is already requested is coalesced.

## Documentation

- The README (README.md:315-318, 498-504), the `remeasure()` JSDoc (ocelle-list-detail.ts:247-249) and the
  manifest description agree with FR-034 and contracts/elements.md § "Not rendered". Two rules hold in all of
  them: a pass or `remeasure()` while not rendered writes nothing and keeps the tier, and becoming rendered needs no
  `remeasure()`. They also agree with US3-12's given and then for the closed dialog, the inline-block wrapper and the
  hidden flex item.
- The one inconsistency is between those texts and the code: R6-01, the unseen changes made while hidden.
- The CHANGELOG lists no triggers, so leaving it unchanged meets T081.

## Phase 2's approved behaviour

The fix range touches only `ocelle-list-detail` files, the manifest and its 8 plant copies, and phase 4's review
files. No phase 2 source or test changed. T076's effect-based pass count (phase 2 fix 3) is kept: no test-only hook
was added to `list-detail-measure.ts`. T048's one-pass test and the phase 2 suites pass in `pnpm test`.

## Checks run

Each check was run one at a time on HEAD `6376fce` with a clean working tree:

- `pnpm test`: 3798 tests passed in 164 files.
- `gate:typecheck`: no type error. `gate:lint`: 309 files, no finding. `gate:test-lint`: 211 files, no finding.
  `gate:style-lint`: 20 files, no finding. `gate:csp`: 18 files, no finding. `gate:prefix`: 267 files, no finding.
  `gate:manifest`: 6 elements, no finding. `gate:pins`: 5 manifests, no finding.
- `gate:mutation -- --base 2caad68`: none survived (see above).
- `OCELLE_VISUAL_ENGINE=docker gate:visual`: 88 captures match their baselines. `gate:axe`: 88 story-theme runs,
  0 serious or critical.
- `OCELLE_VISUAL_ENGINE=docker gate:plants`: 306 plants of 17 gates and the registry judged, every plant as expected.

## Earlier findings

- **O5-01** (round 5, blocking): mostly resolved. A list-detail first rendered in a closed dialog, a `display: none`
  inline-block wrapper, a hidden flex item or as a `hidden` host now reaches its twin's 1073 px and three columns.
  While hidden, a pass or `remeasure()` writes neither 0 px nor `NaN`. The red test came first (`fix-4`, `243bd28`,
  `"recorded": true`), and `tdd-check.json` reports `pass` with no problem. The required "run a fresh pass when the
  element becomes rendered" is only partly met: R6-01.
