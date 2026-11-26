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
