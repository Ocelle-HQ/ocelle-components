# Mission 020 landing verification

## Integrated branch

Signed-off merge 381f48af brings the PR onto main 951a398b. All 14 conflicts were resolved. The merge passed 1,244 targeted tests, typecheck, lint, manifest verification for 40 elements, the 322-story Storybook build, and sign-off. The integrated inventory contains 644 committed visual baselines. [Merge CI](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45057509403)

## Landing follow-ups

- The disclosure-last dialog test failed with the pre-Op 022 focus walk and passed in both Chromium harnesses with the integrated walk. The obsolete limitation was removed from README and its documentation assertion.
- Test-only commit 4dff9105 reproduced separately throwing detached focus and click calls. The guarded native-summary lookup passed the detached and rendered tests.
- The earlier RTL fixture failure was reproduced by delaying the vendored font. Loading the face before mounting passed the original geometry and strict-CSP assertions. The one opening scroll write remains in effect.
- Test-only commit 2fd51b29 reproduced stale text after reconnect in both browser harnesses. The fix refreshed detached text and preserved observer teardown. Named assertions caught 13 hand-applied code-block mutations.
- The integrated source at 97136088 passed 206 targeted tests and sign-off. The historical phase TDD JSON records the original folded phase. The follow-up evidence is in [phase 1 round 4](reviews/phase-1/round-4-fixes.md), [phase 1 round 5](reviews/phase-1/round-5-fixes.md), and [phase 2 round 2](reviews/phase-2/round-2-fixes.md).

## Required hosted verdict

The older run 45039436202 failed Unit tests on the RTL fixture and Mutation testing on four code-block shards. Use the follow-up head's required checks for the final verdict, including Unit tests, Mutation testing, full Plants, visual regression, and Accessibility. The draft stays open for final CI and the operator's merge decision. [Earlier failing run](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45039436202) · [PR checks](https://github.com/Ocelle-HQ/ocelle-components/pull/77/checks)

The first follow-up run passed the other code-block mutation shards and isolated one remaining mutation in the focus handover guard. A new browser test keeps focus on the wrap part through a label update and catches the extra tabindex write caused by the mutant. With the regression in place, the targeted Stryker run killed all seven runnable line-200 mutants and reported four compiler rejections, zero survivors, and zero timeouts. All 98 code-block tests passed. [First follow-up run](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45059422687)
