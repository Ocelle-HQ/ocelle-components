---
phase: 2
round: 6
verdict: approved
base: 247991d7f2fdd7163d768f771279d17014d9c0b3
head: bd9ea533c1fdf9b170c3e1ab3f2c439f1cf2be2d
tdd_check: pass
---

# Phase 2 review, round 6

Check round for the operator round 5 (O5-01). Scope: the fix range 33e0832..HEAD, that is the red commit 54af461
(`fix-4`), the green commit 763c0b9, the task commit 6d3d0c2 and the TDD record bd9ea53. No new full search outside
this scope was done.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R6-01 | note | storybook/test/integration/elements-stories.test.ts:338-346 (T083) | T083 makes the late layout change happen in the same browser task as the read. This exercises the two-frame wait but not the `document.fonts.ready` wait: with `fonts.ready` removed from `scrollFigures`, T083 would still pass. That is acceptable. The CI failure was a read made before the story's `ResizeObserver` delivery, and the frames are what fix that. `fonts.ready` is the extra guard that the operator asked for, and `openHovered` uses it in the same way. | None. |
| R6-02 | note | specs/009-workflow-layouts/tasks.md:470-474 (T084) | Part of T084's acceptance is a CI run of the branch whose job Unit tests passes for both stories in both themes. That run needs a push, and neither the implementer nor this review may push. Locally the file passed 412 of 412 three times in this review and six times for the implementer. | The landing pass confirms Unit tests in CI after the push. |

No blocking finding.

## Test quality

- **Red evidence.** `red-commits` records `fix-4 54af461` (test files only). Both `red-fix-4.log` and `tdd-check.sh`'s
  `check-red-fix-4.log` show exactly 4 of 7018 failing. These are the four T083 cases (middle and end, light and dark),
  and each fails with `expected { first: false, grewBy200: true, …(1) } to deeply equal { first: true, … }`. Each fails
  on `first` alone: `grewBy200` and `outside` hold, so the failure is not a setup error and the injected change is not
  a no-op.
- **Does the reproduction model the CI race honestly?** Yes. `changeLayoutAtNextRead`
  (elements-stories.test.ts:325-334) replaces `page.evaluate` once. The single string evaluate it sends runs
  `changeLayoutLate` (:300-312: T067's three sentence chips appended to the story's scroller) and then the helper's
  own read function, unchanged and in the same task. The read of `scrollWidth` forces a synchronous layout, so the
  read sees the new range. No rendering step runs inside a task, so the story's `ResizeObserver`
  (storybook/stories/scroller.stories.ts:42-47) cannot have rewritten `scrollLeft` yet. That is the mechanism of
  CI run 44087406429: a layout change, there a late font, lands after `open()` returned and before the observer's
  next delivery, and the read sees a new range with the old position. T083 does not delay a font. It uses the same
  injection T067 uses, so the red happens every time instead of 1 run in N. The read code under test is the real
  `scrollFigures`, passed through by `String(read)`, so the green helper is what T083 exercises. The fix note also
  reports a CDP freeze attempt that did not behave deterministically and was dropped. That is the right call.
- **Do two frames suffice?** Yes, for this story. After the change, `await fonts.ready` resolves in a microtask,
  because no font is pending. Frame-wait 1 resolves in the rAF step of the next frame N. Frame-wait 2 is requested from
  that callback, so it runs in frame N+1. Frame N runs its style, layout and `ResizeObserver` delivery after its rAF
  callbacks, and the story's observer writes `scrollLeft` synchronously in that callback, with no timer and no
  further rAF (scroller.stories.ts:42-47). So the write happens before the read in frame N+1. One frame would not be
  enough, because the read would run in frame N's rAF step, before that frame's observer delivery. Two frames are the
  minimum. `fonts.ready` covers a font load still pending when the read starts.
- **No weakening.** `git diff 54af461..HEAD -- storybook/test` changes only the bodies and doc comments of
  `scrollFigures` (:256-268) and `observeScrollers` (:207-232). Each now waits for `fonts.ready` and two frames and
  then reads exactly what it read before. No `expect`, no tolerance (`<= 1` for the share, `<= 1` for the
  fits/start/end/middle bands), no `>= 200` growth threshold and no expected figure or story list changed. T067's
  explicit two-frame wait before the grown read (:296) stays. There is no `skip`/`only`, no conditional assertion
  and no swallowed error.
- **Story untouched.** `git diff 33e0832..HEAD -- storybook/stories packages` is empty. scroller.stories.ts is as it was
  at landing.
- **Other position reads in the file.** Only the scroller story scripts a scroll position: `grep scrollLeft|ResizeObserver
  storybook/stories` matches only scroller.stories.ts. Its position is read only through `scrollFigures` (T067 first
  and grown reads, T083) and `observeScrollers` (T020, and T067's `styled` read), and both now wait. `observeWorkflow`
  (:412-443) also reads a board's `scrollLeft`, but no board story writes a position. Its `start`/`fits` is the
  element's own state at 0, not a scripted write that a read can overtake. So it is not this race and stays out of
  scope. The tooltip reads (`openHovered`, :620-638) already wait for `fonts.ready` and two frames.
- **Mutation and plants not run.** I accept this. The fix range changes no file under `packages/` or
  `storybook/stories/`. Only the integration test file and phase records changed, so `gate:mutation` has no new or
  changed source to mutate, and the plants' selection (`--affected` on source) is not altered. `plants.md` is
  unchanged in the fix range (last changed in 39520e5, the round 3 fixes). The test's own power to fail is shown by the fix-4
  red instead.

## Checks run

All runs on HEAD bd9ea53 with `OCELLE_VISUAL_ENGINE=docker`, one at a time:

| Check | Result |
|---|---|
| `vitest run --project storybook-integration storybook/test/integration/elements-stories.test.ts`, 3 times (Storybook rebuilt each time) | 412 of 412 passed each time |
| `gate:test-lint` | exit 0, 304 files, no finding |
| `gate:lint` | exit 0, 419 files, no finding |
| `gate:typecheck` | exit 0, no type error |
| `gate:unit-tests` | exit 0, 7018 tests passed in 218 files |
| `tdd-check.json` (head 763c0b9; bd9ea53 adds only records) | `pass`, no problems; red fix-4 exit 1, head exit 0 (7018 passed) |

Visual, axe, CSP and manifest were not rerun. No story, element, style or baseline changed in the fix range.

## Earlier findings

- **O5-01 (blocking, round 5): resolved.** The race was shown first in commit 54af461. It is proven by `red.sh 2 fix-4`
  and confirmed by `tdd-check.sh`, with four cases failing on `first` for the right reason. The green commit 763c0b9
  makes T067's reads through `scrollFigures` and T020's position check `observeScrollers` wait for
  `document.fonts.ready` and two animation frames, exactly as required. It loosens no assertion or tolerance, and the
  story is unchanged. T083, T067 and T020 pass in both themes locally. T083 and T084 are ticked and their work is
  present. The CI part of T084's acceptance waits for the push (R6-02).
