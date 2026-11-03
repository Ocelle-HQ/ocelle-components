# Phase 3 review round 7 (operator round, landing review): fixes

tasks.md T095 is done. Planner commit 358e202 is the authoritative text: O7-02 is the input guard the operator chose
when amending the decision ("Guard the input instead (Recommended)"). It replaces the round file's "fail on a file
absent from the report". Test commit d8cd958 holds only tests and fixtures. `red.sh 3 fix-7` reports
`"red": true, "recorded": true` (red-fix-7.log): 37 of 1162 tests fail, and every failure is an `AssertionError`
against the old code, not a load error. Some of the new cases passed at that commit because the behaviour already
existed. Following T095 step 2, they were not forced red:

- the two report cases in gates/test/mutation-report.test.ts (an absent file counts as zero mutants, and a listed
  file with every mutant killed passes);
- `+++ /dev/null` read as no file;
- the near-miss paths that hold `+`, `@`, `(`, a space, `#`, `:` or `é` alone, which Stryker still runs on.

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| O7-01 | fixed. `changedFiles` now reads a `+++` header in one of three forms. `b/<path>` is read with any tab and the text after it removed. A C-quoted `"b/<escaped>"` (optionally tab-suffixed) is decoded as git writes it: octal escapes are UTF-8 bytes, plus `\a` to `\r`, `\"` and `\\`. `/dev/null` means a deleted file. Any other header throws "git diff wrote a file header the gate cannot read: <header as JSON>". This covers no prefix, a mnemonic prefix, an unterminated quote, an unknown or short escape, an octal escape over 377, bytes that are not UTF-8, and text after the closing quote. `mutation()` turns the error into exit 2 before any mode branches, so a normal run, `--plan` and `--files` all exit 2 with the same cause and a hint about `diff.noprefix` and `diff.mnemonicPrefix`. `inScope` now uses the `s` flag, so a decoded path that holds a newline is still in scope instead of being dropped. | gates/test/mutation-ranges.test.ts, "changedFiles: the headers git writes (phase 3 round 7, O7-01)" and "mutation gate: diff headers and mutate inputs": recorded `git diff --unified=0` output from a scratch repository (git 2.43.0) in gates/test/fixtures/git-diff/quoted-paths.diff (tab-suffixed, quoted, quoted and tab-suffixed, and plain headers) and mnemonic-prefix.diff (`+++ w/...`). Red: the paths were dropped (`expected [] to deeply equal ...`), the bad headers did not throw, and the gate exited 0 instead of 2. | gates/lib/mutation/ranges.ts, gates/bin/mutation.ts |
| O7-02 | fixed, as amended by the operator (input guard). The new `unusableMutatePaths` in ranges.ts names every changed in-scope path that Stryker cannot take verbatim as a `mutate` input. Such a path contains a glob metacharacter `*?[]{}!`, a comma (which splits `--mutate`), a backslash (minimatch reads it as an escape, and Stryker turns it into `/`) or an extglob `+(` or `@(`. I checked the "otherwise not verbatim" part against Stryker 10.1.1's minimatch: of all printable ASCII characters, only the backslash fails to match itself as a literal pattern, and so do the extglob openers `+(`, `@(`, `?(` and `*(`. Before Stryker runs, in a normal run, `--plan` and `--files` alike, the gate exits 2 with one cause line that names each such path in diff order. That is exit 2 and not a finding, because the gate could not check that file (contracts/gate-cli.md). report.ts is unchanged in behaviour: a changed file absent from the report counts as zero mutants, so a type-only or comment-only change passes. Its header comment now says so. | gates/test/mutation-ranges.test.ts: one case each for `*`, `?`, `[`, `]`, `{`, `}`, `!`, `,`, `+(`, `@(` and a backslash (a quoted header), and one case naming two such paths in one line for each mode. Red: the gate exited 0 and ran Stryker. gates/test/mutation-report.test.ts "a changed file absent from the report" (2 cases) passed at once, because the behaviour already existed. | gates/lib/mutation/ranges.ts, gates/bin/mutation.ts, gates/lib/mutation/report.ts (comment) |

Checks, run with `PATH=/opt/node26/bin:$PATH` and `OCELLE_CHROMIUM_PATH` set, on the fix tree:

- `pnpm test`: exit 0, "1162 tests passed in 54 files".
- `pnpm -r build`, then every gate exits 0:
  - config-copies: the two copies are identical.
  - test-lint: "56 files checked, no finding".
  - typecheck: no type error.
  - lint: "99 files checked, no finding".
  - style-lint: "1 file checked, no finding".
  - csp: "3 files checked, no finding".
  - prefix: "19 files checked, no finding".
  - pins: "4 manifests checked, no finding".
  - signoff `--range bdb9b70..HEAD`: "143 commits checked, no finding".
- `pnpm run gate:plants`: exit 0, "136 plants of 11 gates and the registry judged, every plant as expected".
- `pnpm run gate:mutation -- --base 4ac76fd7fb68ba7c8f15b4bc4177e64b518d56c8 --files gates/lib/mutation/ranges.ts,gates/lib/mutation/report.ts,gates/bin/mutation.ts`:
  exit 0, "404 mutants on the changed lines of 3 files, none survived; 10 equivalent records"
  (mutation-fix-7-phase-base.log). No record was added; the 10 are the existing ones.
- The same run with `--base bdb9b70`, the PR base: exit 0, with the same result (mutation-fix-7-pr-base.log).
