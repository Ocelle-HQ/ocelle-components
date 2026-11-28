# Operator decision: phase 2 red evidence (030)

Asked by the run, answered by the operator (multiple choice), 2026-11-28.

**Situation.** `red.sh 2 phase` rejects red commit `8f5fea78` (`evidence.status: invalid`, first problem
`unchanged assertion in gates/test/plants.test.ts:92`). It is the same shared-data cause as phase 1, tracked as #111.
530 selected tests fail:
- 407 fail on lines the red commit changed. These are the new behaviour.
- 123 fail on unchanged lines through shared data:
  - `evidence-reuse-shadow.test.ts` (65) and `integration/evidence-reuse-observe.test.ts` (1): `requiredJobs`/`jobNames`;
  - `plants.test.ts` (44), `plants-job.test.ts` (4) and `registry.test.ts` (6): the registry fixture's
    `release-readiness` entry;
  - `integration/plants.test.ts` (3): the real registry.

**Options asked:** accept and record it / redesign the shared data in this mission / pause for #111.

**Decision: accept, record it.** The red evidence of `8f5fea78` is accepted as it is. The 407 changed-line failures
are the red proof, and the 123 shared-data failures are listed in `replaced-tests.md`. The green commit and the plant
run follow. Because `red.sh` records no red commit, phase 2 stays unfolded, as phase 1 does
(phase-1/operator-fold-decision.md).
