# Phase 1, review round 1: fixes

Operator decisions: `triage/decisions/023-review-round-1.md`. Red commit `fix-1`: `6943053` (`red-fix-1.log`).

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| R1-01 | fixed: by operator decision, CI's Plants check covers the one plant that failed locally on a network image pull (`visual/fail-pointer-target-below-fold`, exit 2; 323 of 324 as expected). No local rerun: `plants.md` keeps its recorded `exit: 1` and now carries the decision as a note. No red test (evidence, not behaviour). | none | `ops/023-public-repo-hygiene/reviews/phase-1/plants.md` |
| R1-02 | fixed: T024 ticked, with a reference to the same decision. No red test (a task record). | none | `ops/023-public-repo-hygiene/tasks.md` (T024) |
| R1-03 | fixed (note, fixed by operator decision): `--verify` now has a test for `not a regular file`, a symlink whose target got the redaction, beside a correct redaction. The code was already right, so this test passed at the red commit (a test-gap finding). It is not vacuous: with the `not a regular file` line removed from the script, the case fails (exit 0 and the summary `3 files changed` instead of exit 1 and the finding). | `gates/test/integration/redact-sandbox-paths.test.ts` "finds a symlink whose target got the redaction, as not a regular file, beside a correct redaction" | `gates/test/integration/redact-sandbox-paths.test.ts` |
| R1-04 | fixed (note, fixed by operator decision): a failing `git ls-files` is exit 2 with `git ls-files failed (exit <n>): <git's first error line>`, the same form as a failing `git grep`, not `no tracked file`. Red at `6943053`: the corrupt-index case got `no tracked file`. | `gates/test/integration/sandbox-paths.test.ts` "exits 2 with git's first error line when git ls-files fails on a corrupt index, not with no tracked file" | `gates/bin/sandbox-paths.ts` |
| R1-05 | no change (note, none required). | none | none |
