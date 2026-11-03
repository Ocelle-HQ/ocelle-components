---
phase: 3
round: 8
verdict: changes_requested
base: 4ac76fd7fb68ba7c8f15b4bc4177e64b518d56c8
head: fffb7e7f21aa870cdb945f19da8dad82fb1e039a
tdd_check: pass
---

# Phase 3 review, round 8

Scope: the T095 fix for operator round 7 (O7-01, and O7-02 as the operator amended it to an input guard, planner
commit 358e202). Red d8cd958, fix b40a768, fix note round-7-fixes.md. Phase 4 commits 8bc2efc and 268c4d8 sit on top
and are reviewed separately. HEAD fffb7e7 only adds evidence files: `git diff 268c4d8 fffb7e7 -- gates packages` is
empty, so the tdd-check recorded at 268c4d8 applies to this head. CI for fffb7e7 was still running when this review
was written. The verdict rests on local evidence only.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R8-01 | blocking | gates/lib/mutation/ranges.ts:124 (`unusable`), with ranges.ts:37 (`source` now has the `s` flag) and gates/test/mutation-ranges.test.ts:287 | The input guard misses line terminators, so a path that cannot be passed verbatim still gets through and the gate passes silently. T095 step 3 says that any path that "otherwise cannot be passed verbatim" is exit 2. The fix deliberately brings paths with a newline into scope (`s` flag, test at :287), but `unusable` = `/[*?[\]{}!,\\]\|[+@]\(/` does not catch `\n`, `\r`, U+2028 or U+2029. Stryker 10.1.1 splits each `mutate` entry with `MUTATION_RANGE_REGEX = /(.*?):((\d+)…)$/` (core/dist/src/fs/mutate-pattern-constants.js). That regex has no `s` flag and no `^` anchor, so for `gates/lib/a\nb.ts:1-1` it returns the pattern `b.ts`, which is the text after the last line terminator. Reproduced: (1) `ProjectReader.prototype.filterMutatePattern([resolve(p)], p + ":1-1")` matches 0 files for `gates/lib/a\nb.ts`, `a\rb.ts` and `a b.ts`, and 1 file for `gates/lib/ok.ts`. (2) In a scratch repository (git 2.43.0), a staged file `packages/tokens/src/a<LF>b.ts` gives `+++ "b/packages/tokens/src/a\nb.ts"`. `changedFiles` returns that path in scope, and `unusableMutatePaths` returns `[]`. Stryker would then mutate nothing in that file, the file would be absent from the report, and report.ts would count it as zero mutants and pass. This is the silent pass that O7-01 and O7-02 were meant to close. A brute force over every pair of ASCII characters 1 to 127 (plus `é`), at three positions in a path, found no other unguarded path that Stryker cannot take: the glob set, the comma, the backslash and the extglob openers are complete otherwise. `?(`, `*(` and `!(` are caught by the single characters `?`, `*` and `!`. | Red test first: a quoted header for a path holding `\n`, one holding `\r`, and one holding U+2028 (`\342\200\250`) and U+2029 (`\342\200\251`). Each must make the gate exit 2 before Stryker runs, with the cause naming the path, in a normal run, in `--plan` and in `--files`. Then add `\n`, `\r`, ` ` and ` ` to `unusable` and to the cause text `unusableKinds` (gates/bin/mutation.ts:54), and add the line terminators to the mutation row of contracts/gate-cli.md if it lists the kinds. |
| R8-02 | note | gates/README.md:29 (mutation row) | The row's "breaking" list names plants (unresolvable `--base`, failed dry run). It does not mention the two new exit 2 causes, an unreadable `+++` header and a path Stryker cannot take. T095 asks for a README update only "if it states the exit 2 causes", and this row lists breaking plants rather than causes, so no change is required. contracts/gate-cli.md:49 states both causes. | None required. Optionally mention the two causes. |

## Test quality

- **Red evidence.** red-fix-7.log (red.sh 3 fix-7 at d8cd958) shows 37 of 1162 tests failing. Every failure is an
  `AssertionError` at the new cases in gates/test/mutation-ranges.test.ts (lines 234 to 383), and none is a load or
  setup error. The commit holds tests and fixtures only (`git show --stat d8cd958`).
- **Fixtures.** I reproduced them with git 2.43.0 in a scratch repository. A path with a space gives
  `+++ b/<path>` followed by a tab. Non-ASCII gives `+++ "b/…\303\251.ts"`. Non-ASCII plus a space gives the quoted
  form followed by a tab. With `diff.mnemonicPrefix=true` against the work tree, git writes `+++ w/…` or `+++ "w/…"`.
  Both quoted-paths.diff and mnemonic-prefix.diff match this output byte for byte, including the trailing tabs.
- **No weakening.** `git diff d8cd958..HEAD` touches neither gates/test/mutation-ranges.test.ts nor
  gates/test/mutation-report.test.ts nor the fixtures. The later test changes are phase 4 files (plant-judge,
  plants, plants-job and plant.json files).
- **Assertions.** Every new case asserts the full `{code, out, err, mutated}` or the full return value with
  `toEqual`, or uses `toThrow` with the exact message. There are no conditionals, skips or snapshots. The C-escape
  case covers each of `\" \\ \a \b \t \n \v \f \r` and the octal escapes. The 12 unreadable-header cases cover no
  prefix, a mnemonic prefix, broken quoting, bad escapes, bytes over 377, bytes that are not UTF-8, trailing text
  and an empty name.
- **Cases that passed at once.** Three groups passed at the red commit and were left unforced, as T095 step 2
  allows: the report's absent-file cases (mutation-report.test.ts:174 to 186), `+++ /dev/null`, and the near-miss
  characters (`+ @ ( space # : é`). I checked them. Each asserts behaviour that already existed at d8cd958. Before
  the fix, `+++ /dev/null` gave the path `ev/null`, which is out of scope. A report without the file counted as
  zero mutants. Single characters already went to Stryker. The fix note says so honestly. My minimatch and range
  regex brute force confirms the near-miss characters do pass verbatim.
- **Guard placement.** gates/bin/mutation.ts:94 to 104 runs the guard after the parse and before the `--plan`
  branch and `selectFiles`, so a normal run, `--plan` and `--files` share it. The tests assert all three modes for
  the unreadable header (:344) and for the multi-path cause line (:383). Under `--files`, the guard checks every
  changed path, including paths outside the selected shard. That is stricter and consistent: every shard of a
  change fails the same way.
- **Over-strict guard (accepted).** `*?[]{}!` alone do match themselves as minimatch patterns. As globs, though,
  they would also match sibling files, and T095 names them explicitly, so the strictness is intended. The backslash
  does match after Stryker's `normalizeFileName`, but it would then be reported under a path with `/`. Guarding it
  is correct.
- **Mutation.** I ran `pnpm run gate:mutation -- --base 4ac76fd7fb68ba7c8f15b4bc4177e64b518d56c8 --files
  gates/lib/mutation/ranges.ts,gates/lib/mutation/report.ts,gates/bin/mutation.ts`. It exited 0: "404 mutants on
  the changed lines of 3 files, none survived; 10 equivalent records". These are the same 10 records as in
  earlier rounds: nine process-boundary records in gates/bin/mutation.ts:151 to 174, each naming its covering
  integration case, and report.ts:55, the empty catch. No record was added by this fix. The result matches
  mutation-fix-7-phase-base.log. Another agent's mutation run was running at the same time in the same checkout.
  The mutant count of 404 on these three files shows that my run read its own report.

## Checks run

Local only (`PATH=/opt/node26/bin:$PATH`,
`OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell`),
on fffb7e7. CI for fffb7e7 was still running and was not used.

- `pnpm test`: "unit-tests: 1179 tests passed in 54 files". The count includes phase 4's later tests.
- `pnpm -r build`: exit 0.
- Each gate exits 0:
  - config-copies: identical.
  - test-lint: 56 files, no finding.
  - typecheck: no type error.
  - lint: 99 files, no finding.
  - style-lint: 1 file, no finding.
  - csp: 3 files, no finding.
  - prefix: 19 files, no finding.
  - pins: 4 manifests, no finding.
  - signoff `--range bdb9b70..HEAD`: 147 commits, no finding.
- `pnpm run gate:plants`: exit 0, "136 plants of 11 gates and the registry judged, every plant as expected".
- `pnpm run gate:mutation` (above): exit 0, no survivor.
- tdd-check.json: `pass` at 268c4d8, with red commits phase, fix-1, fix-3 and fix-7 all exit 1, and no problems.
  It was not re-run because the gate and package code at HEAD equals 268c4d8.
- Reproductions for R8-01: Stryker 10.1.1's `ProjectReader.filterMutatePattern` and `MUTATION_RANGE_REGEX`
  called directly, a minimatch brute force through Stryker's `FileMatcher` logic, and a scratch git 2.43.0
  repository run through `changedFiles` and `unusableMutatePaths`.

## Earlier findings

- **O7-01: resolved.** `headerPath` (gates/lib/mutation/ranges.ts:66 to 77) reads `b/<path>` with the tab and
  everything after it removed. It decodes a C-quoted `"b/…"`: octal escapes as UTF-8 bytes, `\a` to `\r` as
  bytes 7 to 13 (the mapping is correct), and `\"` and `\\`. It reads `/dev/null` as no file. Anything else
  throws a message naming the header as JSON, including bytes that are not UTF-8 (the URIError is caught).
  gates/bin/mutation.ts:94 to 99 turns the throw into exit 2 with a `diff.noprefix` / `diff.mnemonicPrefix` hint,
  before any mode branches. The red test came first (fix-7 in red-commits).
- **O7-02 (as amended): partly resolved.** The guard exists, runs before Stryker in all three modes and covers the
  glob, comma, backslash and extglob set completely. report.ts keeps counting an absent file as zero mutants,
  with a comment explaining why (report.ts:4 to 6). It still lets through paths containing a line terminator,
  which Stryker cannot take verbatim (R8-01). Because absent files pass, those paths go unchecked silently.
