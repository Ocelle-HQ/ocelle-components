# Phase 5 (Polish & cross-cutting): exempt from the red step

Constitution VIII, *Exemption*: a unit with no behaviour may skip the red step if its review states why no test could
fail for it. No red commit is recorded for this phase (`red-commits` is absent; why, in `notes.md` § T057, red step).

- **T056** (the three CHANGELOGs name every surface addition): docs only. It checks CHANGELOG text and changes
  none, since nothing was missing (`notes.md` § T056). The CHANGELOG fragments that can be tested already are, by the
  tests of T019, T032, T044 and T045: the elements README and CHANGELOG checks of
  `packages/elements/test/node/readme.test.ts` and the tokens README and CHANGELOG checks of
  `packages/tokens/test/readme.test.ts`. Any further test would assert prose that no code reads, so no test could
  fail for it beyond those.
- **T057 R1-01** (`packages/elements/src/bubble.ts`:1-6 and :10, `915cfdd`): the change is comment text only.
  Stryker makes no mutant of a comment, so no test can fail. The planned mutation shard for `bubble.ts` confirms
  this (`notes.md` § Mutation).
- **T057 R1-02 and R1-03** (`packages/elements/test/scenarios/tooltip.ts`, `f45e42b`): the rows were made stricter
  against code that already meets them, so they could not fail before a fix. Both rows passed at `f45e42b` in
  `red.sh 5 phase`'s full run; that run's one failure was an unchanged row (`notes.md` § T057, red step). The break
  checks in `notes.md` § T057, break checks, are the test-first evidence. Each was a temporary source or test change,
  never committed, run against the old row (at the phase base `9a44e8e`) and the new row in both harnesses.
