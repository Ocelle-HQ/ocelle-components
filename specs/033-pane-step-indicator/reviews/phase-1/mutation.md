# Phase 1 mutation evidence

Candidate `44ea2b3eb37425e62422f1403fcc9bf850a1884a` contains element source blob
`1c48d9aab214fcd070bbdd7a23c5111b1f339307`.

The local changed-source gate for `packages/elements/src/ocelle-step-indicator.ts` exited 2.
Stryker reported a failure in its initial full browser test run and wrote no mutation report.
A separate uninstrumented baseline ran for 12 minutes without reporting a result or assertion failure
before it was stopped. The failing test from the initial run remains unidentified.

A focused diagnostic used the repository's Stryker mutators, TypeScript checker and coverage setup.
A scratch Vitest configuration selected only `packages/elements/test/step-indicator.test.ts` in
the Stryker sandbox. The nine baseline tests passed. Across 29 whole-file mutants, tests killed 25,
TypeScript rejected three, and an empty custom element name caused one runtime error.
There were no survivors, uncovered mutants or timeouts. The diagnostic exited 0 in 117 seconds.

The required hosted mutation result for the corrected candidate remains pending. [Hosted run](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45739224718)

The original hosted candidate `267b95b40768dcf3cf0b1c197678cfa7a25e5a5d` passed all six official mutation shards at tested merge `1f984a86227308ddce66e785743b23c543bc6730`.
The correction changes the manifest Plant overlays, their Node gate test, and feature records. The element source, in-process browser tests, and mutation configuration match the official mutation inputs byte for byte. [Official changed-source mutation](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45737601757/job/139648747996)

The corrected published head `44ea2b3eb37425e62422f1403fcc9bf850a1884a` and tested merge `cae8a497dbdd6bf940916c8a1f201fa7cde86bdb` passed 12,204 tests in 366 files across the six hosted shards. [Corrected Unit tests](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45739224718/job/139649148297)

The corrected Phase 1 run later failed two mutation shards during initial test execution. Both shards exited 2 before writing reports. The original passing run used the same mutation inputs. The final landing candidate must pass its required Mutation testing check. [First runner failure](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45739224718/job/139640027587) · [Second runner failure](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45739224718/job/139640027680)
