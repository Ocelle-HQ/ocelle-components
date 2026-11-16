# Phase 1 review round 1: fixes

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| R1-01 | fixed | none: the finding is a missing test, not wrong behaviour. The real `changed` already lists untracked, not-ignored files, so a new test passes at once and no red commit can fail for the right reason (fix procedure step 3: a weak test is strengthened in the fix commit). The new test was checked against three hand mutations of `gates/bin/plants.ts`'s `changed`, each reverted: dropping the `ls-files` run, dropping its `-z`, and dropping `--exclude-standard`. Each made it fail. The automatic check also runs it against the code from before the phase, where `--affected` does not exist. | gates/test/integration/plants.test.ts "--affected HEAD judges the plants that hold an untracked file that is not ignored, and not the plant that holds an ignored one": two plants each get an untracked file, so the NUL split matters; a third gets a file that the committed `.gitignore` ignores. It asserts that only the two are judged, with their `note: affected:` lines. gates/bin/plants.ts: the equivalent records on the `runs` and `paths` lines of `changed` now also name this test. |
| R1-02 | fixed (note, docs only, so no red) | none: docs only | gates/README.md *Known limit*: names a gate entry that another entry imports (`gates/bin/prefix.ts`, imported by `brand-rules`). |
| R1-03 | no change (note, no change required) | none | none |
| R1-04 | no change (note, no change required) | none | none |
