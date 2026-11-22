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

## Transition follow-up

- After the rail correction, the exact visual recheck had zero changes and the repeated 32-case axe audit was clean.
- Two browser cases preserve the same custom nav link and its full presentation through a genuine drawer exit, and preserve deliberate focus set by a close completion listener. Isolated faults compacting the drawer during exit or replacing the listener's focus failed those assertions. Test lint passed.

## Drawer lifecycle mutation follow-up

- The initial local diagnostic instrumented 289 mutations. It reported 121 killed, 54 survivors, two uncovered, and 112 rejected at compilation, for 68.36% in its selected scope. The shared overlay focus hook reached 100%. The test selection omitted the Phase 3 layout and navigation suites; the surviving scope included inherited rendering and event branches.
- The browser tests in `ce5f136` verify label fallbacks, the origin of menu requests, repeated requests during real exit, no unsolicited focus, the preserved pre-exit destination, and tier event order. Seven isolated source faults failed those assertions. The repeat-resize test moves focus to the close control during the paused exit and observes `resize`, `close`, then the settled tier event.
- Close request synchronization now uses the drawer's actual `open` value, and completed focus recovery leaves any already focused visible control alone. The selected shell and overlay suites passed 108/108. Separate diagnostics of the current handler and settlement ranges are running with both the Phase 3 and Phase 4 shell suites.

- The 100-mutant handler range on `346bd76` reached 96.77%, with 60 killed, two survivors, 38 rejected at compilation, and zero uncovered or timeouts. The new wide-state regression passed and rejected an exact fault that accepted a former menu trigger and stranded projected navigation. Completion now schedules one focus decision after projection, where the current active element is checked. The five shell suites passed 80/80 after this change.

- The current handler follow-up on `9040a6b` passed at 100% for its 25 mutants, with 23 killed and two rejected at compilation. The previous 166-mutant settlement range had reached 93.33%, with 98 killed, seven survivors, and 61 rejected at compilation.
- The tests in `2f87c1e` found that a menu click while content retained focus let dismissal restore content instead of the trigger. The shell now focuses the trigger before opening. Further assertions cover a trigger replaced during exit, an intentional blur before a same-tier update, and surviving focus in a newer modal. Four isolated faults failed the corresponding assertions. Recovery uses the actual focused element visibility at settlement.
- The five shell suites passed 84/84. Test lint, TypeScript and the diff check passed.
