---
phase: 3
round: 13
verdict: approved
base: 4ac76fd7fb68ba7c8f15b4bc4177e64b518d56c8
head: 546099bf9f2d92a001bb90e1ad67ecdd114e40db
tdd_check: pass
---

# Phase 3 review, round 13

Scope: the operator round 12 (O12-01, O12-02) and its fix. That is red commit 94d6ef0, green commit c949938,
round-12-fixes.md and T099, judged against spec.md FR-011, research.md R-08 (step 3, step 4 and "Unread `mutate`
entries"), contracts/gate-cli.md (mutation row) and plan.md "Re-check after phase 3 round 12". The planner text is
commit 1158952. After c949938, HEAD holds only 098bbf8 (tdd-check evidence) and 546099b. 546099b changes
`.claude/skills/ocelle-land/SKILL.md` and `knowledge/speckit-flows/log.md`, is docs only and lies outside phase 3,
so it does not affect this verdict. tdd-check.json (head c949938) is `pass`, with fix-12 red at 94d6ef0
(exit 1) and `problems: []`.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R13-01 | note | GitHub run 41677290625 (head 25f5643), job 126061556001; old gates/lib/mutation/shards.ts:110 | The shard `gates/lib/mutation/shards.ts:1-120` failed on CI only once. It reported two survivors at the old line 110, `/^(.*\.ts):(.*)/s` and `/(.*\.ts):(.*)$/s`. Runs 41671185705, 41672562167, 41675069807 and 41682132335 used the same gate code. On each of them the job log reads "102 mutants on the changed lines of 1 file, none survived" (job 126078580761 on 41682132335, read for this review). Locally the shard failed every time. The CI logs print only the gate's summary, so they do not show why. The failing job also ran unusually long: 529 s, against 175 to 236 s for this shard on the runs for c949938 and 098bbf8. Both mutants are equivalent (round 12 evidence). The regex is now gone, so the question no longer affects this shard, but the difference is still unexplained. | None required. If it comes back on another shard, upload the Stryker JSON report as a CI artefact so the two runs can be compared. |
| R13-02 | note | .github/workflows/ci.yml:89 (`timeout-minutes: 10`); the CI shard `gates/lib/vitest-report.ts:121-123,gates/lib/workspace-yaml.ts,...` | The slowest CI shard is shard 21, whose entries this fix did not change: 519 s on run 41690538079 (c949938) and 503 s on run 41691966197 (098bbf8). That is 81 to 97 s below the 10-minute job limit. On earlier runs it took 481 s (41682132335) and 492 s (41677290625). The fix timed only its four changed shards, locally (108 to 217 s), so this margin is not in mutation-shards.md. | None for this phase. Watch the margin. Another 120-line cut in that shard, or a slower runner, would reach the limit. |

No blocking finding.

## Test quality

**Red evidence (fix-12).** red-fix-12.log (`red.sh 3 fix-12` on 94d6ef0) shows "6 of 1249 tests failed". Each of the
six failures is an `AssertionError` that asserts the new exit 2 or `ok: false` and meets the old exit 0 or
`ok: true`. None is a load error:

- the integration case at gates/test/integration/mutation.test.ts:92;
- mutation-report.test.ts:205, :210 and :218;
- mutation-shards.test.ts:678 and :687.

94d6ef0 holds only tests, fixtures and the test double (11 files under gates/test). `git diff 94d6ef0..HEAD --
gates/test` is empty, so no test changed after red.

Three cases passed at once and were reported in the fix note, not forced red. Each was fair to leave unforced:

- **The `logLevel` pin** (mutation-report.test.ts "sets no logLevel, or one of trace, debug, info and warn").
  stryker.config.json sets no `logLevel`, so the test guards a precondition of R-08 that already held. It fails if
  someone later sets `error`, `fatal` or `off`.
- **"leaves the verdict as before on Stryker's other glob warnings and on an output without the warning".** The old
  classifyMutants never read `output` for this, so the test cannot fail against it. It is the guard against a check
  that matches too much. I confirmed that it can fail: a looser `Glob pattern "(.*)" did not` would match the
  recorded `did not exclude any files.` line and the `did not match any test files.` line, and the `toEqual(before)`
  assertion would then fail. The `before` baseline is pinned too (`ok: true, mutants: 10`), so the comparison is not
  between two identical failures.
- **"passes a --files run of read files only, beside the unread files of the diff".** This is the control case for
  a check that looks at the diff's unread files instead of the entries Stryker was given. The old code passes it by
  construction.

**Fixtures.** I checked that the three recorded outputs are real Stryker 10.1.1 output:

- Their warning lines are exactly the templates in
  `@stryker-mutator/core@10.1.1/dist/src/fs/project-reader.js`: line 101 `did not result in any files.`, line 92
  `did not exclude any files.` and line 68 `did not match any test files.`. They carry the ANSI `WARN ProjectReader`
  prefix, and a single-entry run adds the `No files found for mutation` warning.
- unread-patterns.output.txt, with `Found 1 of 9 file(s)` and `.Svelte-Kit` unread, is consistent with the
  case-insensitive `ALWAYS_IGNORE` list (project-reader.js:10-18, plus `tempDirName` at :36).
- The only path in them is `file://<repo>/reports/mutation/mutation.json`. A grep for `/home/`, `/root/`, `/tmp/`,
  `/Users/` and e-mail addresses over gates/test/fixtures/stryker/ and gates/test/fixtures/mutation-unread/ finds
  nothing.
- The `did not match any test files.` line in the test is built from the line 68 template, as the fix note says.
  The gate never sets `testFiles`, so it has no real run to record.

**Unread entries.** In gates/lib/mutation/report.ts:76-83, classifyMutants reads every
`Glob pattern "<entry>" did not result in any files.` line before it looks at the report. It returns could not run
naming every entry, in Stryker's order.

- Both modes reach this one call, at gates/bin/mutation.ts:156-160. The whole-diff and `--files` runs differ only in
  `selected`. `output` is stdout plus stderr.
- Tests cover the whole-diff run, which names both `.NUXT` and `.next` entries
  (mutation-shards.test.ts:678-685), and a `--files` run with a `path:start-end` entry (:687-694). Each asserts
  exit 2, the exact stderr cause and an empty stdout. The integration case covers the same with real Stryker
  (integration/mutation.test.ts:92-112).
- The other warnings do not trigger the check: the regex needs the literal `did not result in any files.`, and the
  case above covers it.
- R-08 says Stryker prints the warning whenever `mutate` is not its default. That holds: the warning is printed when
  `logAboutUselessPatterns` is true (project-reader.js:83), which needs `mutatePatterns` to differ from
  `defaultOptions.mutate`, and the gate always passes explicit entries.
- "Read and absent from the report = zero mutants" is unchanged: the existing round 7 cases pass.
- FR-011, the contracts row and the plan re-check all agree with the code and with the cause text.

**Entry split (O12-02).** gates/lib/mutation/shards.ts:113-129 now splits at `entry.lastIndexOf(".ts:")` and treats
`=== -1` as a whole entry. The path is the text up to and including `.ts`, and the range is the rest. I compared the
old `/^(.*\.ts):(.*)$/s` with the new split:

- on all 43 entries the tests use (every `selectFiles` and `--files` argument in mutation-shards.test.ts, including
  `a:b.ts:2-2`, `a.ts:b.ts` and the nine malformed ranges);
- on edge cases (`.ts:9-8`, `.ts:`, newlines, a doubled `.ts:`, the empty entry);
- on 200,000 random strings over `a . t s : 1 - 2 \n /`.

In every case the two give the same `[path, range]` or the same no-match. `git diff 25f5643..HEAD -- gates/test`
removes only two comment lines and one import line. The import line is reflowed and gains `skippingStryker`, and no
test body changed.

**Regex survey.** I re-ran the survey: the TypeScript parser plus weapon-regex 2.0.6 at `mutationLevels: [1]`.

- It finds 61 regex literals in gates/bin, gates/lib, gates/eslint and gates/stylelint. 42 of them have an anchor
  mutant. Every one of the 42 appears in the fix note's table.
- In gates/test it finds 55 literals, 49 with an anchor. These counts match the fix note.
- weapon-regex removes an anchor inside an alternation as a whole alternative: `(?:\n|$)` becomes `(?:\n)`.

I ran the original and the actual mutant on the table's input for 16 anchors:

- config-copies.ts:21 `^` and `$`
- pins.ts:102 `$`
- signoff.ts:36 `^` and :47 `^`
- eslint-report.ts:52 `^`
- shards.ts:114 `^` and `$`
- registry.ts:85 `^` and `$`
- plant-repo.ts:64 `^` and `$`
- workspace-yaml.ts:68 `^`
- records.ts:23 `^`
- tsc-report.ts:65 `$`
- ranges.ts:47 `^` and `$`

The two differ in every case, so the table is right. With the old line 110 gone, no anchor in gate source is
equivalent.

**Vacuous or weakened.** No new test has a conditional assertion, `skip`, `only`, a snapshot or a swallowed error.
The in-process cases also assert `mutated`, the entries passed to the double, but only beside the gate's exit code
and output. `skippingStryker` (gates/test/mutation-fakes.ts:173-182) logs the recorded warning line, so the gate
parses real text.

**Mutation (run by me).** `pnpm run gate:mutation -- --base 4ac76fd7fb68ba7c8f15b4bc4177e64b518d56c8 --files
gates/lib/mutation/report.ts,gates/lib/mutation/shards.ts,gates/bin/mutation.ts` exits 0: "499 mutants on the
changed lines of 3 files, none survived; 10 equivalent records", in 5 min 24 s. I read each record:

- The 9 records in gates/bin/mutation.ts (lines 173 to 196) are process-boundary records in `realTools`. Each names
  its covering gates-integration case.
- gates/lib/mutation/report.ts:59 is the BlockStatement record of an empty catch. Its reason holds: the
  `typeof files === "object"` check below rejects the undefined value.

All 10 records predate this fix, and the fix adds no `Stryker disable` line.

## Checks run

These ran at HEAD with `PATH=/opt/node26/bin:$PATH` and `OCELLE_CHROMIUM_PATH` set:

- `pnpm test`: exit 0, "unit-tests: 1249 tests passed in 55 files".
- `pnpm -r build` (exit 0), then every gate exits 0:
  - config-copies: identical.
  - test-lint: 57 files, no finding.
  - typecheck: no type error.
  - lint: 100 files, no finding.
  - style-lint: 1 file, no finding.
  - csp: 3 files, no finding.
  - prefix: 19 files, no finding.
  - pins: 4 manifests, no finding.
  - unit-tests: 1249 passed.
  - signoff `--range bdb9b70..HEAD`: 166 commits, no finding.
- `pnpm run gate:plants`: exit 0, "136 plants of 11 gates and the registry judged, every plant as expected".
- `pnpm run gate:mutation -- --base bdb9b70 --plan`: exit 0, "21 shards, 14 cuts within files". The JSON is
  identical to the round 12 plan in mutation-shards.md.
- Mutation on the changed files against the phase base: see above, exit 0.
- CI:
  - Run 41690538079 (head c949938): success, every job green. The slowest shards took 519 s (shard 21), 479 s
    (plant-judge.ts:121-216 + plant-repo.ts:1-120) and 478 s (plants.ts:121-233 + prefix.ts). Shard 13
    (shards.ts:1-120) took 175 s.
  - Run 41691966197 (head 098bbf8): success. The slowest shards took 503 s (shard 21), 385 s and 381 s. Shard 13
    took 236 s.
  - Run 41693572778 (head 546099b) was still in progress when this review was written.

## Earlier findings

- **O12-01: resolved.** An unread `mutate` entry is exit 2 naming every entry, in both modes, from Stryker's
  output and before the report (report.ts:76-83). Red tests at 94d6ef0 failed for the right reason and now pass,
  and the real-Stryker integration case on a `.next` file passes. FR-011, contracts/gate-cli.md, R-08 and the
  README paragraph match the code.
- **O12-02: resolved.** `rangeSuffix` is replaced by a `lastIndexOf(".ts:")` split. It behaves the same as the old
  regex on every tested entry, and the entry tests are unchanged. It has no Regex mutant left, and no mutant of the
  split survives. The anchor survey is complete and right (see above). The `split === -1` choice avoids a survivor
  that would need a contrived `.ts:`-first entry; its mutants are killed. O12-02 changes no behaviour, so it has no
  red test, which T099 step 2 allows.
