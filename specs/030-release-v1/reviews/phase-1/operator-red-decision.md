# Operator decision: phase 1 red evidence (030)

Asked by the run, answered by the operator (multiple choice), 2026-11-27.

**Situation.** `red.sh` rejects red commit `1a24aa0b` (`evidence.status: invalid`). `classifyStoryEvidence`
(`gates/lib/test-evidence.ts`, #103) needs every failing test to fail on an assertion line the red commit changed.
Tasks T006, T008 and T009 change shared test data (the registry fixture `gates/test/fixtures/registry/`, `requiredJobs`
in `gates/test/evidence-reuse-shadow.test.ts`, the count of real plants, the real registry and `ci.yml`), so about 120
existing tests fail on assertion lines that did not change. The first one reported is
`unchanged assertion in gates/test/plants.test.ts:92`. They fail because pack-contents is not registered yet. The
other 151 failing assertions are on changed lines and the classifier accepts them.

**Options asked:** accept and record it / report a classifier change to the orchestrator and wait / redesign T008 and T009.

**Decision: accept, record it.** The red evidence of `1a24aa0b` is accepted as it is. The ~120 shared-data failures
are on record in `red-phase.log` (not committed) and in `replaced-tests.md`. The 151 changed-line failures count as
the red proof. The green commit follows, then the plant run. Reviewers judge phase 1's red evidence against this
decision, not against `red.sh`'s `invalid` status alone.
