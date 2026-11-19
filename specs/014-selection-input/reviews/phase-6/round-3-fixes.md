# Phase 6, review round 3 (operator round) fixes

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| O3-01 | fixed, per the operator's "Space the test link" and T115. US5-7's mount gives the link `margin-inline: 0.75em`, with a comment that says why (the glyphs beside the link sit clear of the ring band, so the ring samples do not depend on text antialiasing; landing L1-01). The assertion, `expected`, `ringPixels`, `over` and the 3.5 px sample are unchanged. The body's plant comment now names only the plants that bite; the ring's colour-only swap is recorded as equivalent in Chromium (`plants.md`, T115 step 4). With the spacing US5-7 passes with grayscale text, with subpixel text (the committed fontconfig) and in the Playwright 1.64.1 Docker image, in both harnesses, and the planted wrong rings still fail it under both launches (`notes.md` "Landing fold (T115)", `plants.md`). The CI run with the mutation shards (L1-02) follows the orchestrator's push. | `ca18374` (`packages/elements/test/browser/link-subpixel.test.ts` and `test/browser/subpixel/fonts.conf`), recorded as `fix-3 ca18374`: under subpixel text US5-7 fails on its `ring` entry (left side `false`) and the precondition passes (`red-fix-3.log`: 1 of 8009 tests failed) | `packages/elements/test/scenarios/link.ts` (`96dd714`); `reviews/phase-6/notes.md`, `plants.md`, `red-commits`, `red-fix-3.log` |

No element source, baseline, pixel or visual test other than US5-7's body, `vitest.config.ts` or `serve.ts` changed.
The mutation gate was not rerun locally: no source file changed. CI's mutation shards are the check of L1-02.

## Review round 4 response

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| R4-01 | fixed by operator decision 5 (`operator-decisions.md`, `3e50a6b`): the round-scoped plant run (`--affected ca18374^`) is accepted for fix-3; the full run against `base.sha` after the second merge of main covers phase 6. Cited beside the plant record | none (records) | `reviews/phase-6/plants.md` |
| R4-02 | acknowledged (note): the base and scaffold legs exit 2 because main's test changes are in the final test set since the merge; for the owner of `tdd-check.sh` | none | none |
| R4-03 | acknowledged (note): the mission 008 "Rapid toggle during the entry, motion on" row is timing-sensitive; tracking it for mission 008 is for the landing records, not this phase | none | none |
| R4-04 | acknowledged (note): the subpixel precondition needs Linux fontconfig and a browser that draws LCD text, by design | none | none |
| R4-05 | done: CI run 44539529359 on `8fd8c47` is green (129 jobs, the 80 Mutation shards and the aggregate included), recorded in `notes.md`; T115 ticked | none | `reviews/phase-6/notes.md`, `tasks.md` |
