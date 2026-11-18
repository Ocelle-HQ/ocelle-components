---
phase: 4
round: 7
verdict: approved
base: 2caad68db62feed502eb3963b65548f47d73ea6c
head: 224c75543955331cf93a9595960e1ee184d86c41
tdd_check: pass
---

# Phase 4 review, round 7

Scope: a check round on the fix of round 6 (R6-01) in the fix range `25f9655..224c755`: red `6f66c61`, green
`d61c3c3`, tdd-check `224c755`. I did not do a new full search outside that range.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|

No findings. R6-01 is resolved (see "Earlier findings").

## Test quality

- **Red evidence.** `red-commits` has `fix-5 6f66c61`, and `tdd-check.json` reports `pass` with `"problems": []`,
  head `d61c3c3`. `red-fix-5.log` and `check-red-fix-5.log` show 3 of 3800 tests failing on `6f66c61`, and these are
  exactly the changed tests:
  - the new case "US3-12, hidden, changed unseen, then shown (R6-01)" in the in-process harness
    (`test/list-detail.test.ts:19`);
  - the same case in the browser harness (`test/browser/list-detail.test.ts:37`);
  - guard O5-01 (`test/list-detail-pass.test.ts:254`).

  Each fails on a deep-equal assertion, not on a setup error. The red commit changes only test files.
- **The new scenario is not vacuous** (`test/scenarios/list-detail.ts:745-765`).
  - It measures `x` at 1073 px in three columns, hides its wrapper, and waits four frames.
  - While hidden, it sets the class `w35` on `x-list`. That is an attribute change on an observed element itself.
    The `MutationObserver` uses `childList`, `characterData` and `subtree` with no `attributes`
    (list-detail-measure.ts:52), so the element cannot see the change.
  - It shows the wrapper again with no `remeasure()`, waits for settle, and expects the minimum of the new content:
    `560px`, where the old code keeps `480px`.
  - The `shown` part is checked against the fixed `threeAt1073`, so a broken first measurement cannot make the case
    pass.
  - The case sits in `listDetailScenarios`, which both harnesses iterate (`list-detail.test.ts:19`,
    `browser/list-detail.test.ts:37`). Both runs failed red and both pass now.
- **Guard 1 (`again: 0` changed to `1`) is honest** (`list-detail-pass.test.ts:251-281`).
  - The old guard hid and showed in the same task, so the `ResizeObserver` never saw a no-box state. It pinned the
    narrower trigger that R6-01 rejects.
  - The red commit adds two frames between the hide and the show, so the observer does see the element with no box.
    It then expects exactly one pass. The exact count is kept, so this is not a loosening to "at least one".
  - The change came in the red commit (`git diff 6f66c61..HEAD -- packages/elements/test` is empty), and the comment
    gives the reason.
  - `resized: 0` still pins the rule that a resize of a rendered element is no trigger, and `shown: 1` still pins
    exactly one pass after the hide, change and show.
  - The old hide and show in one task, which the observer never sees, has no rendering opportunity in between. Nothing
    is lost by no longer testing it.
- **Weakening.** Since the red commit, no test was weakened, skipped or deleted.
- **Plant L32 bites.** I applied it by hand, removing `this.#measure.suspend();` from the observer's not-rendered
  branch (ocelle-list-detail.ts:223), and ran `pnpm test`. 3 of 3800 tests failed: the R6-01 case in both harnesses
  and guard O5-01. Then I restored the file (clean tree). plants.md:96 counts 2 of 72 in process. The browser
  harness's copy of the case is the third failure.
- **Once per frame (R-13).**
  - `suspend()` only sets a boolean (list-detail-measure.ts:70-72), so repeated no-box deliveries (probe and edge box)
    pile up nothing.
  - `resume()` goes through `schedule()`, which coalesces on `#frame` (list-detail-measure.ts:56-63, 78-80), so the
    pass never runs inside the delivery.
  - Guard 1's `shown: 1` and `again: 1` pin "exactly one" across a hide and a show.
- **Guard 2 (reinsertion) holds** (`list-detail-pass.test.ts:289-311`, `inserted: 0`, `remeasured: 1`, passing).
  - `disconnectedCallback` disconnects the `ResizeObserver` synchronously (ocelle-list-detail.ts:272), so a removed
    element gets no no-box observation and `suspend()` is not called.
  - The observation at reinsertion sees the element rendered with nothing pending.
  - R6-03's remark still applies: an element removed while hidden keeps its pending pass and runs it at reinsertion.
    That is harmless and not contradicted by the contract.
- **Mutation.** I ran `pnpm run gate:mutation -- --base 2caad68` (exit 0): 336 mutants on the changed lines of
  5 files, none survived. It also reported 2 timeouts, 109 compile errors, 1 zero-mutant entry (`src/index.ts`) and
  11 equivalent records.
  - No record was added.
  - The record at list-detail-measure.ts:31 (initial `#pending`) still holds after the fix. The first pass runs in
    an animation frame before the probe's first `ResizeObserver` delivery, and `suspend()` only fires on a no-box
    delivery.
  - The new lines' mutants that are not killed are compile errors (ocelle-list-detail.ts:222,
    list-detail-measure.ts:79). They are reports, not findings.

## Checks run

On HEAD `224c755`, one at a time, with a clean tree:

- `pnpm test`: 3800 tests passed in 164 files.
- `gate:typecheck`: no type error.
- `gate:lint`: 309 files, no finding.
- `gate:test-lint`: 211 files, no finding.
- `gate:manifest`: 6 elements, no finding.
- `gate:mutation -- --base 2caad68`: none survived (see above).
- Plant L32 by hand: bites (see above).

The fix changes no style, story or public API: the JSDoc of `remeasure()` and the manifest are unchanged. So I did not
re-run `gate:visual`, `gate:axe` or the full `gate:plants`. The fix note reports all three passing on the fix tree.

## Earlier findings

- **R6-01** (blocking): resolved, by the "fix the code" route. No document was narrowed.
  - The observer's not-rendered branch calls `this.#measure.suspend()` (ocelle-list-detail.ts:222-225), which marks
    the pass pending (list-detail-measure.ts:70-72).
  - So becoming rendered (no box before, a box now) always reaches `resume()` with a pass pending, and requests one
    coalesced pass for the next frame. That matches T080, data-model.md § list-detail "Not rendered" ("set
    `pending`"), research.md R-13, FR-025, contracts/elements.md and README.md:498-507.
  - The red test came first (`fix-5`, `6f66c61`, recorded). The new scenario runs in both harnesses, guard 1 now
    expects `again: 1` with its reason, and plant L32 bites.
- **R6-02** (note): acknowledged in round-6-fixes.md (optional, no change). Accepted.
- **R6-03** (note): acknowledged in round-6-fixes.md (no change required), and guard 2 still matches the R3-02 rule.
  Accepted.
