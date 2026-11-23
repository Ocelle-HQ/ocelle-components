# Phase 1 plant run

The plant rows of phase 1 (T001c; `contracts/testing.md` § Plants, rows "oracle reading" and "capture bounds"), run
on the green commit `8217e41` in this container (Chromium 153.0.8010.12):

```text
pnpm exec vitest run --project elements --project elements-browser packages/elements/test/plants.test.ts packages/elements/test/browser/plants.test.ts --reporter=verbose
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > oracle reading: takes a link's own name turns a link's own name skipped and its Stati… red 11ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > oracle reading: visits an img's descendants turns an img's name taken and its descendants… red 17ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > oracle reading: ignores the keeping rule turns a state set and cleared in one task is … red 16ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > capture bounds: an element that mutates its own attribu… turns a capture over the container (in proces… red 5816ms
 ✓ |elements-browser| packages/elements/test/browser/plants.test.ts > plants (elements-browser project) > capture bounds: an element that mutates its own attribu… turns a capture over the container (fixture p… red 7425ms
 Test Files  2 passed (2)
      Tests  5 passed (5)
```

Each row asserts that its planted body rejects with the row's message and that the same body without the plant
passes, so a row passes only when its plant bites:

| Family | Plant | Body | Message | Result |
|---|---|---|---|---|
| oracle reading | a `regionText` that takes a link's own name | case "a link's own name skipped and its StaticText children taken" | `expected 'Open Report link the report' to be 'Open the report'` | bites |
| oracle reading | a `regionText` that visits an `img`'s descendants | case "an img's name taken and its descendants not visited" | `expected 'Disk full Star inner now' to be 'Disk full Star now'` | bites |
| oracle reading | `announcements` that ignores the keeping rule | case "a state set and cleared in one task is kept by neither rule" | `to deeply equal` | bites |
| capture bounds | `ocelle-test-loop` (test/fixtures/live-loop.ts), in process | a capture over the container | `capture exceeded …` | bites |
| capture bounds | `ocelle-test-loop` (test/browser/fixtures/capture-loop.html, capture-loop.js), fixture page | a capture over the container | `capture exceeded …` | bites |

Against the red commit's stubs every row fails (`reviews/phase-1/red-phase.log`, `check-final-tests-on-stubs.log`):
the unplanted cases fail on the stub reading and the stub capture resolves instead of rejecting.
