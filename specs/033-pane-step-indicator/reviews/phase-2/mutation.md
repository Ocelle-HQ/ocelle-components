# Phase 2 changed-source mutation

The hosted capture candidate reported 61 uncovered mutants in the shared Storybook host. Both original browser fixtures passed their behavioral checks, but the standard mutation configuration excludes their projects. [Capture candidate](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45743218289)

The Phase 2 fix recorded a routing assertion before adding the in-process `storybook-browser` project. Its four Chromium tests exercise all six pane states, native actions, progress, and focus. Eager fixture loading records the pane data initializers as static coverage. The earlier lazy setup only covered those initializers during the first case.

The standard command `node gates/bin/mutation.ts --base 7b16ae326e11aa837b4d0f8540881e69c8d622c3 --files storybook/stories/pane-action-footer.ts` passed at `bf584eee`. It found 140 mutants on changed lines, zero survivors, zero uncovered mutants, zero timeouts, and 70 compile errors. The one equivalent record is the diagnostic text for a missing selector in the owned static template. The unused initial action text was removed.

The three focused browser suites passed 15 tests after the fix. A local Chromium comparison of the builds before and after the source cleanup matched all eight capture pairs byte-for-byte.
