# Phase 5, review round 1: fixes

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| R1-01 | fixed: a missing test (the code was right). The new body clears and sets the same `status` text in one task, with no microtask checkpoint between them, once by a `value` change and once by the host's own `status = ""`. A MutationObserver with `characterDataOldValue` records the region going from the text to empty and back. A repeated set in a later task mutates nothing (US4-5). The body passes on the source in both harnesses, so it needs no fix red commit (skill step 3). Under the plant *the region in the Lit template*, run against the whole in-process file, it is the one body that fails (1 failed, 29 passed of 30). `plants.md` records this and rewrites the withdrawn "not a defect" section, and `notes.md` follows. `contracts/elements.md` is unchanged. | none (test-only; the plant run is the proof that it can fail) | `packages/elements/test/scenarios/copy-field.ts` (body "FR-041, FR-042: a clear and a set of the same status in one task …"); `reviews/phase-5/plants.md`; `reviews/phase-5/notes.md` |
| R1-02 | note, no change | | |
| R1-03 | note, no change: the WebKit question stays open in R-07 | | |
| R1-04 | note, no change | | |
