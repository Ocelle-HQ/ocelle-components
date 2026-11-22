# Phase 4 candidate checks

## Test-first evidence

- Phase 4 starts at `3e263aa`. The inert input scaffold `9d68ed7` declares the drawer and close labels. The tests-only commit `b4b9e58` ran 20 relevant browser cases in the pinned environment. Eighteen failed at the expected open-drawer assertions. The empty-navigation and standalone autofocus/restoration cases passed.
- The final tests overlaid on the same scaffold reported 23 expected failures and two passes. This includes the missing drawer registration and a bare native rail anchor measuring 1.97:1 against chrome. The targeted replay records the assertions under the approved validation route.
- The final selected shell and standalone drawer suites passed 103/103. The tests verify localized landmarks, native pointer and keyboard requests, sequential initial focus, cancellation, nested close-event isolation, wrapping, and focus settlement across thresholds. The delayed exit test pauses the real Web Animation, observes a second border-box resize, and verifies the original destination after release.
- Five isolated source fault probes failed the intended assertions for default overlay focus, early projection removal, forgetting the prior destination, ignoring accepted close-request progress, and accepting a nested close as the shell's own event. The rail contrast regression now passes in the wide frame and live drawer.

## Assets and gates

- Pinned Docker captured 32 shell and token story-theme cases twice, added 12 baselines for the six narrow stories, and reproduced all committed pixels after the rail contrast fix. The targeted axe audit found zero serious or critical findings and no notes across the same 32 cases.
- The color-ink plant probe found six additional light differences and six matching dark captures. The manifest mirrors preserve their original plant verdicts, and all 13 targeted manifest and Storybook plants produced the expected results.
- Code lint, test lint, style lint, TypeScript, and the 35-element manifest gate passed. The standalone element build passed, and the built-output CSP gate reported no findings across 62 files.
- Full hosted checks and independent review remain pending.
