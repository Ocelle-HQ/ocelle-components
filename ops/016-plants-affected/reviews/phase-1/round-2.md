---
phase: 1
round: 2
verdict: approved
base: 80ea82594a0d29800fc692a87041dbadabdd20a2
head: 752f01f24becde73bd7d245ca11ad5ea53cd5b3f
tdd_check: pass
---

# Phase 1 review, round 2

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R2-01 | note | gates/README.md:83-84 | The R1-02 fix makes the known-limit sentence longer, and one line of it now runs well past the paragraph's wrap width. This is cosmetic. | None. |

## Test quality

- **Red evidence.** It is unchanged since round 1. The red commit `268b1e4` changes only the four test files, and every new test fails there because the behaviour is missing (see round 1). `check-red-phase.log` was re-run, and only its timing lines differ.
- **Final tests on base.** In `check-final-tests-on-base.log` the round-1 fix test fails against the code from before the phase (line 44, `--affected HEAD judges the plants that hold an untracked file that is not ignored, ...`). It fails on the assertion, because `--affected` does not exist on base. `tdd-check.json` is `pass` with no problems, and its head is `752f01f`.
- **The fix test without a red commit.** R1-01 said a test was missing for behaviour the code already had. The finding was not about wrong behaviour. Fix step 3 says a weak test is strengthened in the fix commit, so the missing `fix-1` red entry is correct. The automatic check runs the new test against base and it fails there. I read the test (gates/test/integration/plants.test.ts:213-258):
  - it commits a root that has a `.gitignore`;
  - it adds two untracked files that are not ignored, in two different plants, so the NUL split matters;
  - it adds one ignored file in a third plant;
  - it asserts the whole outcome with `toEqual`: exit code, stdout, the two `note: affected:` lines and the two plant times;
  - the ignored plant is not judged.
  The test has no conditional, no skip and no swallowed error. So the records on `gates/bin/plants.ts:662` and `:668`, which now also name this test, are true for the `ls-files` half.
- **Weakening.** `git diff 268b1e4..HEAD -- gates/test` only adds tests. The single changed line is the robustness count noted in R1-03. Nothing was skipped, deleted or loosened.
- **Mutation.** `pnpm run gate:mutation -- --base 80ea825` exited 0. There were 377 mutants on the changed lines of 3 files, and none survived. I read the 9 equivalent records:
  - the 8 process-boundary records on `gates/bin/plants.ts:653-668` name the integration tests that cover those lines;
  - `gates/lib/registry.ts:187` (the `?? []` default) is a sound equivalent.
  The run also reported 0 timeouts, 118 compile errors (type-invalid mutants, which I read) and 0 zero-mutant entries.

## Checks run

- `pnpm test`: 3151 tests passed in 138 files (`check-head.log`, exit 0).
- These gates all exited 0 with no finding:
  - `gate:typecheck`;
  - `gate:lint` (263 files);
  - `gate:test-lint` (173 files);
  - `gate:config-copies`;
  - `gate:style-lint`;
  - `gate:prefix`.
- **Plants.** `plants.md` exists. Its base, `80ea82594a0d29800fc692a87041dbadabdd20a2`, equals `base.sha`, and the recorded exit is 0: all 302 of 302 plants were judged and every plant was as expected. I re-ran `pnpm run gate:plants -- --affected 80ea825... --list`, which exited 0. It printed `note: affected: every plant, by gates/bin/plants.ts (shared gate source)` and `302 of 302 plants selected, none judged (--list)`. That is the same selection as the record. I did not judge the plants again.
- **Tasks.** T001 to T018 are ticked (18 of 18), and their work is present, as round 1 found. The fix commit touches only these files:
  - `gates/README.md`;
  - `gates/bin/plants.ts` (record comments only);
  - `gates/test/integration/plants.test.ts`;
  - `plants.md`;
  - `round-1-fixes.md`.
- **Unchanged (OR-007).** `git diff 80ea825..HEAD` does not touch any of these:
  - `.github/workflows/ci.yml`;
  - `gates/test/ci-workflow.test.ts`;
  - `gates/lib/plant-repo.ts`;
  - `.claude/skills/ocelle-land/`.
  The only plant files added are the three in `gates/plants/plants/fail-affected-in-plant-check/`, and no existing plant directory changed.
- **Constitution and plan.** Nothing changed since round 1 except the fix. Principle VIII is now met for the untracked-file edge case.

## Earlier findings

- **R1-01 (blocking): resolved.** The integration test "--affected HEAD judges the plants that hold an untracked file that is not ignored, and not the plant that holds an ignored one" covers the `ls-files --others --exclude-standard -z` half of `changed`. It covers both the not-ignored and the ignored case, and the NUL split. The Stryker records on `gates/bin/plants.ts:662` and `:668` name it. The test fails against base (`check-final-tests-on-base.log:44`) and passes at HEAD. No red commit is needed, because the finding was a missing test and not a behaviour defect (fix step 3).
- R1-02 (note): addressed. `gates/README.md` *Known limit* now names `gates/bin/prefix.ts` and `brand-rules`.
- R1-03 and R1-04 (notes): no change was required, and none was made.
