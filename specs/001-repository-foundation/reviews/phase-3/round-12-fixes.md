# Phase 3 review round 12 (operator round, O12-01 and O12-02): fixes

tasks.md T099 is done. Planner commit 1158952 is the authoritative text: spec FR-011, research.md R-08 (step 3, step
4 and "Unread `mutate` entries"), contracts/gate-cli.md (mutation row) and plan.md "Re-check after phase 3 round 12".
Red commit 94d6ef0 holds only tests and fixtures. `red.sh 3 fix-12` reports `"tests_only": true, "red": true,
"recorded": true` (red-fix-12.log): 6 of 1249 tests fail, each with an `AssertionError` against the old code. None
is a load error. O12-02 changes no behaviour, so it has no red test (T099 step 2). Its existing entry tests are
unchanged and pass.

## The recorded Stryker output

The fixtures come from real Stryker 10.1.1 runs. They ran on a scratch repository built like
`mutationRepo("mutation-unread")`, with the gate's own Stryker command and environment (`stryker run --mutate
<entries>` with `strykerEnv`). In the output, the checkout path is replaced by `<repo>`. Stryker writes the warning
to stdout, at `WARN`, with ANSI colours, and with the entry exactly as passed, range included:

```text
\x1b[33m17:18:18 (1258) WARN ProjectReader\x1b[39m Glob pattern "packages/tokens/src/.next/y.ts:1-2" did not result in any files.
```

- `gates/test/fixtures/stryker/unread-pattern.output.txt` comes from `--mutate packages/tokens/src/.next/y.ts:1-2`.
  When no entry is read at all, Stryker adds a second warning, `Warning: No files found for mutation with the given
  glob expressions. ...`. It then runs the dry run, writes a report with no files and exits 0.
- `unread-patterns.output.txt` comes from `.next/y.ts:1-2`, `x.ts:2-2` (read) and `.Svelte-Kit/z.ts:1-1`. It has one
  warning per unread entry, in the order given. The mixed-case `.Svelte-Kit` confirms that Stryker ignores case. The
  read file is mutated as usual.
- `unexcluded-pattern.output.txt` comes from `x.ts:2-2` and `!packages/tokens/src/.next/y.ts`. Its warning is
  `Glob pattern "!packages/tokens/src/.next/y.ts" did not exclude any files.`
- I did not record a run for the `did not match any test files.` warning. It needs a `testFiles` option the gate
  never sets. The test builds that line from the template in `project-reader.js`.

Before the fix, the real gate on the scratch repository printed `mutation: 0 mutants on the changed lines of 1
file, none survived; 0 equivalent records` and exited 0. That is landing L2-01 reproduced.

## Findings

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| O12-01 | fixed. `classifyMutants` reads every `Glob pattern "<entry>" did not result in any files.` line of Stryker's output (stdout and stderr together) before it looks at the report. If there is any, it returns could not run with the cause `mutation: could not run: Stryker did not read these mutate entries (it skips every file under a folder named node_modules, .git, .next, .nuxt, .svelte-kit or .stryker-tmp, in any case): <entries>; move the files out of such a folder`. The entries are named as logged, in Stryker's order, and comma-separated. The check runs in the whole-diff and `--files` runs alike, since both go through `classifyMutants`. "Read by Stryker and absent from the report = zero mutants" is kept. The regex `/Glob pattern "(.*)" did not result in any files\./g` has no anchor, so its only level-1 mutant is the quantifier removal, which is killed. The header comments of report.ts and mutation.ts are updated, and gates/README.md has a new paragraph after the plant paragraph (see the choices below). | gates/test/mutation-report.test.ts, "classifyMutants: a mutate entry Stryker did not read": one entry (recorded output, empty report); one entry beside the recorded report.json's survivors; two unread entries and a read one; other warnings and an output without the warning keep the verdict. "stryker.config.json: the unread-entry warning prints": no `logLevel`, or `trace`/`debug`/`info`/`warn`. gates/test/mutation-shards.test.ts, "mutation gate: a mutate entry Stryker did not read": a whole-diff run with `.NUXT/z.ts` and `.next/y.ts` (exit 2, both entries named, stdout empty); `--files gates/lib/a.ts,packages/tokens/src/.next/y.ts:121-130` (exit 2, the range entry named); `--files gates/lib/a.ts` alone passes. The double `skippingStryker` (gates/test/mutation-fakes.ts) skips the six folders in any case and logs the recorded warning line with the entry swapped in. gates/test/integration/mutation.test.ts, "exits 2 naming a changed file under a .next folder": real Stryker on fixture gates/test/fixtures/mutation-unread/, which gives exit 2, one stderr line naming `packages/tokens/src/.next/y.ts:1-2` and an empty stdout. Red: 5 of these failed against the old code (exit 0 or `ok: true`), plus the integration case. | gates/lib/mutation/report.ts, gates/bin/mutation.ts (header), gates/README.md |
| O12-02 | fixed. `rangeSuffix` (`/^(.*\.ts):(.*)$/s`, the old line 110) is gone. `readEntry` now splits the entry at `entry.lastIndexOf(".ts:")`. The path is the text up to and including `.ts`, and the range is the rest, read by the unchanged `lineRange`. An entry with no `.ts:` (`split === -1`) is a whole entry, as before. The first green run had one survivor at the new line 124, `split < 0` mutated to `split <= 0`. It differs only for an entry that starts with `.ts:` (for example `.ts:9-8`, malformed against missing). Rather than add a contrived test, I wrote the comparison as `split === -1`. Its mutants (`!==`, `+1`, both conditionals) are killed by the existing entry tests. No existing test changed. | none (no behaviour change, T099 step 2). The existing "selectFiles: path:start-end entries (phase 3 round 9, O9-01)" cases, unchanged, kill every mutant of the split. | gates/lib/mutation/shards.ts |

Cases that passed at once, not forced red (T099 step 2): the `logLevel` pin (stryker.config.json sets none), "leaves
the verdict as before on Stryker's other glob warnings and on an output without the warning", and "passes a --files
run of read files only, beside the unread files of the diff".

## Regex anchor survey (O12-02)

The survey parsed every TypeScript file of gates/bin, gates/lib, gates/eslint and gates/stylelint with the
TypeScript parser and collected each regex literal and each `RegExp(...)` call. It then ran weapon-regex 2.0.6 at
level 1, the level Stryker's Regex mutator uses (`mutationLevels: [1]`), and listed every anchor-removal mutant.
For each one I looked for an input on which the mutant differs. The gate source holds 61 regex literals. 42 have
an anchor, and 19 have none, among them the new unread-warning regex. The source also has two `RegExp` calls
built from template literals, which Stryker does not mutate and which have no anchor: prefix.ts:49 (lookarounds
only) and vitest-report.ts:38 (ANSI escapes). The old shards.ts:110 was the only regex where a greedy `.*` under
the `s` flag sat at an anchored end. It is now removed.

No remaining anchor in the gate source is equivalent. Each removal has an input that tells it apart:

| Where | Regex | Anchor removed | An input on which the mutant differs |
|---|---|---|---|
| gates/bin/config-copies.ts:21 | `/^"(.*)"$/` | `^`; `$` | `a"b"`; `"a"b` (the mutant strips quotes the original keeps) |
| gates/bin/csp.ts:41 | `/^packages\/[^/]+\/dist\/.+\.(?:js\|css\|html)$/` | `^`; `$` | `x/packages/a/dist/b.js`; `packages/a/dist/b.js.map` |
| gates/bin/pins.ts:102 | `/(.*)\/\*$/` | `$` | `a/*b` (the mutant reads parent `a`) |
| gates/bin/prefix.ts:22 | `/\.(?:ts\|mts\|…\|json)$/` | `$` | `a.tsx` |
| gates/bin/prefix.ts:53 | `/^packages\/[^/]+\/./` | `^` | `x/packages/a/b` |
| gates/bin/signoff.ts:36 | `/^\n/` | `^` | the first record (no leading newline) with message `s\nSigned-off-by: A <a>`; the mutant deletes its first newline and loses the trailer |
| gates/bin/signoff.ts:47 | `/^signed-off-by:(.*)/gim` | `^` | `see signed-off-by: A <a>` within a line |
| gates/lib/eslint-report.ts:52, gates/lib/stylelint-report.ts:56, gates/lib/tsc-report.ts:60 | `/^\w*Error\b/` | `^` | a line `a b Error` before `SyntaxError: x` (`\w*` may be empty, so the mutant matches mid-line) |
| gates/lib/mutation/ranges.ts:37 | `/^(?:packages\/[^/]+\|gates\/(?:bin\|…))\/.+(?<!…)\.ts$/s` | `^`; `$` | `x/gates/lib/a.ts`; `gates/lib/a.ts.js` (`.+` sits between fixed parts, not at an anchor) |
| gates/lib/mutation/ranges.ts:38 | `/\/test\/\|^packages\/[^/]+\/dist\//` | `^` | `gates/lib/packages/a/dist/b.ts` |
| gates/lib/mutation/ranges.ts:39 | `/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/` | `^` | an added line `+@@ -1 +2 @@` |
| gates/lib/mutation/ranges.ts:47 | `/^"b\/(…)*"(?:\t\|$)/u` | `^`; `$` | `x"b/a"`; `"b/a"` with nothing after it |
| gates/lib/mutation/records.ts:23 | `/^\s*\/\/\s?Stryker disable next-line …/` | `^` | `f(); // Stryker disable next-line all: r` (`\s*` may be empty) |
| gates/lib/mutation/shards.ts:94 | `/(.*):\d+-\d+$/` | `$` | a whole entry holding `:1-2` before `.ts` (killed by "reads a whole entry whose path holds :start- before .ts as its own file", round 10) |
| gates/lib/mutation/shards.ts:114 | `/^(\d+)-(\d+)$/` | `^`; `$` | `x1-2`; `1-2x` |
| gates/lib/pins-rules.ts:17 | `/^\d+\.\d+\.\d+(?:-…)?(?:\+…)?$/` | `^`; `$` | `^1.2.3`; `1.2.3 \|\| 2` |
| gates/lib/pins-rules.ts:38 | `/^workspace:(.*)/` | `^` | `npm:workspace:1` |
| gates/lib/pins-rules.ts:61 | `/^pnpm@\d+\.\d+\.\d+(?:\+[\w.-]+)?$/` | `^`; `$` | `xpnpm@1.2.3`; `pnpm@1.2.3 x` |
| gates/lib/pins-rules.ts:66 | `/^v?\d+\.\d+\.\d+$/` | `^`; `$` | `>=1.2.3`; `1.2.3.4` |
| gates/lib/plant-repo.ts:50 | `/^(?:tsconfig.*\.json\|…)$/` | `^`; `$` | `my-tsconfig.json`; `vite.config.ts.bak` |
| gates/lib/plant-repo.ts:64 | `/^%%(?:\n\|$)/m` | `^`; `$` | `a%%\n`; a file ending in `\n%%` with no final newline |
| gates/lib/plant-repo.ts:77 | `/^([\w-]+): (.*)/` | `^` | ` author: x` (leading space) |
| gates/lib/plant-repo.ts:81 | `/^[^<>]+ <[^<>\s]+>$/` | `^`; `$` | `<a> b <c>`; `A <a> x` |
| gates/lib/plant-repo.ts:85 | `/^\d+$/` | `^`; `$` | `x1`; `1x` |
| gates/lib/registry.ts:85 | `/^\s*(?:#.*)?$/` | `^`; `$` | any line, such as `a:` (every part is optional, so either mutant matches every line) |
| gates/lib/registry.ts:88 | `/^jobs:\s*$/` | `^`; `$` | `xjobs:`; `jobs: x` |
| gates/lib/registry.ts:93 | `/^ *(['"]?)([\w-]+)\1:/` | `^` | `  a b:` (the mutant reads key `b`) |
| gates/lib/stylelint-report.ts:85 | `/ \([^()]*\)$/` | `$` | `a (b) c` |
| gates/lib/tsc-report.ts:27 | `/^(?:(.+)\((\d+),\d+\): )?error (TS\d+): (.*)/` | `^` | `x error TS1: m` |
| gates/lib/tsc-report.ts:36 | `/^\s/` | `^` | an unindented line with a space |
| gates/lib/tsc-report.ts:65 | `/TS[56]\d{3}$/` | `$` | `TS50000`, a case in gates/test/tsc-report.test.ts:102 |
| gates/lib/vitest-report.ts:78 | `/^[A-Za-z]*Error:/` | `^` | `Unhandled Error: x` |
| gates/lib/workspace-yaml.ts:26 | `/^(["'])(.*)\1$/` | `^`; `$` | `a"b"`; `"a"b` |
| gates/lib/workspace-yaml.ts:29 | `/^-?\d+(?:\.\d+)?$/` | `^`; `$` | `a1`; `1a` |
| gates/lib/workspace-yaml.ts:30 | `/^[&*!\|>[\]{},]/` | `^` | `a*` |
| gates/lib/workspace-yaml.ts:36 | `/^([^:]+):(.*)/` | `^` | `:a: b`, a case in gates/test/workspace-yaml.test.ts:111 |
| gates/lib/workspace-yaml.ts:49, :51 | `/^\[(.*)\]$/`, `/^\{(.*)\}$/` | `^`; `$` | `a[b]`, `a{b}`; `[a]b`, `{a}b` |
| gates/lib/workspace-yaml.ts:68 | `/(?:^\|\s)#.*/` | `^` (the alternative) | `#comment` at the start of a line |
| gates/lib/workspace-yaml.ts:78 | `/^- (.*)/` | `^` | `a- b` |

For the record, the same survey of gates/test (55 literals, 49 with an anchor) found one anchor whose removal is
equivalent. It is `^` in `/^(.*):(\d+)-(\d+)$/s` at gates/test/mutation-fakes.ts:121, the fake Stryker's entry
parser, where a greedy `.*` under `s` follows the `^`. Test code is not mutated, so it stays. Its `$` is not
equivalent.

## Checks

These ran with `PATH=/opt/node26/bin:$PATH` and `OCELLE_CHROMIUM_PATH` set, on the final fix tree:

- `pnpm test`: exit 0, "unit-tests: 1249 tests passed in 55 files".
- `pnpm -r build`, then every gate exits 0:
  - config-copies: identical.
  - test-lint: 57 files, no finding.
  - typecheck: no type error.
  - lint: 100 files, no finding.
  - style-lint: 1 file, no finding.
  - csp: 3 files, no finding.
  - prefix: 19 files, no finding.
  - pins: 4 manifests, no finding.
  - signoff `--range bdb9b70..HEAD`: 164 commits, no finding (before the fix commit).
- `pnpm run gate:plants`: exit 0, "136 plants of 11 gates and the registry judged, every plant as expected".
- `pnpm run gate:mutation -- --base bdb9b70 --plan`: exit 0, 21 shards, 14 cuts, the same stderr line as in round
  10. Against round 10, shard 4's and shard 14's entries changed (mutation-shards.md, "Round 12 fix (T099)").
- `pnpm run gate:mutation -- --base 4ac76fd7fb68ba7c8f15b4bc4177e64b518d56c8 --files
  gates/lib/mutation/report.ts,gates/lib/mutation/shards.ts,gates/bin/mutation.ts`: exit 0, "499 mutants on the
  changed lines of 3 files, none survived; 10 equivalent records" (mutation-fix-12-phase-base.log).
  - The first run had the one survivor at shards.ts:124 described under O12-02 (`split <= 0`). The run shown is
    after the change to `split === -1`.
  - No Regex mutant is left on the entry split. The old line 110 had four Regex mutants and is gone. The lineRange
    regex (line 114) has six Regex mutants, all killed.
  - On report.ts, the unread regex's quantifier-removal mutant and every mutant of the new check (lines 68 to 81)
    are killed or invalid (`CompileError`).
  - The 10 records are the 9 existing process-boundary records of gates/bin/mutation.ts and the existing
    BlockStatement record of report.ts:59. Each names its reason, and the process-boundary ones name their
    covering gates-integration case. This fix adds no record.
- The same run with `--base bdb9b70`, the PR base: exit 0, the same result (mutation-fix-12-pr-base.log).
- `pnpm run gate:mutation -- --base bdb9b70 --files gates/lib/mutation/shards.ts:1-120` alone (the shard that failed
  on GitHub run 41677290625): exit 0, "95 mutants on the changed lines of 1 file, none survived; 0 equivalent
  records", in 108 s (mutation-fix-12-shard-13.log).
- Timed, one at a time: shard 4 in 118 s (192 mutants), shard 12 in 123 s (172), shard 13 in 108 s (95) and shard
  14 in 217 s (367). All exit 0 with no survivor (mutation-shards.md). No shard is near the 10-minute limit.

## Choices made in this round, for round 13

- **Where the check sits.** The unread check runs first in `classifyMutants`, before the no-report check. A run
  with an unread entry and no report is named by its unread entries. Both outcomes are exit 2.
- **The cause text.** The test fixes the cause: "Stryker did not read these mutate entries (it skips every file
  under a folder named node_modules, .git, .next, .nuxt, .svelte-kit or .stryker-tmp, in any case): <entries>; move
  the files out of such a folder". The entries are not JSON-quoted, unlike the paths of the earlier input guard.
  That guard has already rejected any path with a comma or a line terminator, so a plain `, ` join stays one line.
- **README.** gates/README.md has no "exit 2" list for the mutation gate, only the plant column, which lists the
  breaking plants. I added a paragraph after the plant paragraph instead of a "breaking:" item, since no plant
  exists for this cause. T099 asks for none.
- **Extra fixtures.** Besides the one fixture T099 names, I recorded two more real runs: `unread-patterns`, with
  two entries and a read one, and `unexcluded-pattern`, the "did not exclude" warning. The two-entry and
  other-warning cases therefore also rest on real output.
- **`split === -1`, not `split < 0`.** See O12-02. This avoids a mutant that only a contrived `.ts:`-first entry
  would kill.
- **Which shards were re-timed.** Shards 4 and 14 changed entries. Shard 12 has the same entries but report.ts
  changed. Shard 13 has the same entry but holds the rewritten code and is the shard that failed on CI. All four
  ran, timed, one at a time (mutation-shards.md, "Round 12 fix (T099)").

## Not covered

- No breaking plant exercises the new exit 2. The integration case covers it with real Stryker.
- Why the earlier CI runs reported shards.ts:1-120 with no survivor is still unexplained (round 12 evidence). With
  the regex gone, the question no longer affects this shard.
