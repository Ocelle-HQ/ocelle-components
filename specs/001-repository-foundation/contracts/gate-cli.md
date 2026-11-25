# Contract: gate commands

Every gate runs as `pnpm run gate:<id>` from the repository root and follows one contract.

| Exit | Meaning | Output |
|---|---|---|
| 0 | the gate checked its files and found nothing | a one-line summary (files checked); amendment 2026-11-11, mission 007: the mutation gate also prints record and report lines at exit 0, see its row |
| 1 | the gate found defects | one finding per line in the format of data-model.md § Finding (`<location>: <gate-id>: <rule>: <message>`, where `location` is `path:line`, `path` or a commit hash; amendment 2026-11-10, mission 007: the mutation gate's report lines, rules `timeout`, `compile-error` and `zero-mutants`, which are not findings, may also carry `path:start-end`, a `--files` range entry), then a summary |
| 2 | the gate could not run (missing tool, browser, base commit or range, unreadable or unparsable input, invalid configuration, any uncaught error) | one line naming the cause and the command that fixes it |

Every gate entry catches any exception at the top and exits 2, so Node's own exit 1 for an uncaught error never
reads as "found defects".

Plant mode: for every gate but pins, the plant job builds a temporary repository from the plant (contracts/plants.md:
`repo-tree`, `commit-repo`, `mutation-repo`; since op 023 also `tracked-tree`, which copies no configuration) with the
repository's configuration copied in unchanged and runs the
gate in normal mode with `--root <tmp>` (plus `--range` or `--base`), so the gate's own file collection is exercised
(operator decisions, plan squad rounds 1 to 3). Every gate but the plant job takes `--root <dir>`: it sets the
repository root and the working directory of the tool and changes nothing else (research.md R-09); for
`unit-tests` (`gates/bin/test.ts`) it is also the test seam of research.md R-03. Only pins has a separate plant mode,
`pnpm run gate:pins -- --plant <dir>`, which checks the plant's mini-workspace with the same rules and exit codes.
A gate MUST NOT read `gates/plants/` or `gates/test/fixtures/` outside plant mode.
Exception (op 023, #60, `ops/023-public-repo-hygiene/` FR-002, 2026-11-20): `sandbox-paths` scans every tracked file of
its root in normal mode, `gates/plants/` and `gates/test/fixtures/` included, because no tracked file but its four
allowed files may hold a sandbox path. Its plants use the form `tracked-tree` (contracts/plants.md): a git checkout of
the plant's `tree/` alone, with no configuration copied in.

| id | Check (CI) | Command (normal) | Checks |
|---|---|---|---|
| `typecheck` | Typecheck | `gates/bin/typecheck.ts` (runs `tsc -p tsconfig.json --noEmit --pretty false`) | repository TypeScript |
| `lint` | Code lint | `gates/bin/lint.ts` (runs `eslint --config eslint.config.ts --format json .`) | repository TypeScript |
| `style-lint` | Style lint | `gates/bin/style-lint.ts` (runs `stylelint --formatter json` per `stylelint.config.ts`) | FR-024 styles |
| `unit-tests` | Unit tests | `pnpm test` (`gates/bin/test.ts`) | every test file |
| `test-lint` | Test lint | `gates/bin/test-lint.ts` (runs `eslint --config eslint.test.config.ts --format json`) | all test code |
| `mutation` | Mutation testing | `gates/bin/mutation.ts --base <sha>` (`--plan` prints the CI shards as JSON, each `{"files": "<entry>,...", "lines": <n>}`; `--files <entry>[,<entry>...]` limits a run to one shard and mutates only the changed lines inside its entries. An entry is `path`, or `path:start-end` (Stryker's own `mutate` range syntax) for a line range of a file with more than 60 changed lines, which the plan splits into entries of at most 60 changed lines (60, down from 120: operator decision, 2026-11-05, phase 5 round 6 of mission 002, human:jeroennouwsdev, the shard `packages/tokens/src/generate.ts:121-240` at 264 mutants / 670 s); a shard holds at most 10 entries and 250 changed lines, and a range never crosses a shard (operator decision, phase 3 round 9, human:jeroennouwsdev, 2026-11-03: plant-judge.ts alone took 9:49 of 10 minutes); two entries of one file never share a shard, and `--plan` also writes one line to stderr, `mutation: plan: <s> shards, <c> cuts within files (a mutant spanning a cut is mutated in no shard, see gates/README.md)`, the JSON on stdout staying one array (operator decisions, phase 3 round 10, human:jeroennouwsdev, 2026-11-03: "Chunks never share (Recommended)" and "Accept, record it (Recommended)"); research.md R-08. Amendment 2026-11-11, mission 007 (`specs/007-mutation-gate-strictness/` FR-014): the entry bound is now 30 changed lines, for every file: a file with more than 30 changed lines is split into entries `path:start-end` of at most 30 changed lines; the other bounds stand (operator decision, human:jeroennouwsdev, 2026-11-11, "30-line entries, all files": three 60-line entries of `packages/tokens/src/source.ts` took 188 s to 283 s on the sandbox against a bound of 176 s)) | changed package source and gate source lines |
| `csp` | Content security | `gates/bin/csp.ts` (after `pnpm -r build`) | built output |
| `prefix` | Prefix | `gates/bin/prefix.ts` | packages: source, test code, built output |
| `config-copies` | Story config copies | `gates/bin/config-copies.ts` | the two copies of FR-006 |
| `pins` | Install and pins | `gates/bin/pins.ts` | manifests, lockfile, version pins, `pnpm-workspace.yaml` settings |
| `signoff` | Sign-off | `gates/bin/signoff.ts --range <base>..<head>` | commits in the pull request |
| `sandbox-paths` | Sandbox paths | `gates/bin/sandbox-paths.ts` (runs `git grep -E -I -z -n` over the tracked files; since op 023) | every tracked file but the four allowed files of `gates/lib/sandbox-paths.ts` |
| `plants` | Plants | `gates/bin/plants.ts` | `gates/plants/` only, and the registry check |

## Findings versus breakage (tool-backed and Stryker-backed gates)

Tool exit codes do not separate findings from breakage, so each wrapper in `gates/lib` decides from the tool's
structured output. The tool's exit code is used only where it is unambiguous.

| Gate | Tool output read | Exit 1 (findings) | Exit 2 (could not run) |
|---|---|---|---|
| `typecheck` | tsc diagnostics (`--pretty false`), each with its `TS<code>` | diagnostics with codes outside TS5xxx and TS6xxx | any TS5xxx/TS6xxx diagnostic (configuration and options: missing project, unknown option, a base that does not resolve), or tsc not starting |
| `lint`, `test-lint` | ESLint `--format json` | messages that are not fatal | ESLint exit 2 or no JSON (configuration errors), or a fatal message (a file that does not parse) |
| `style-lint` | Stylelint `--formatter json` | warnings other than `CssSyntaxError` | Stylelint exit 1, 64 or 78, no JSON, or a `CssSyntaxError` warning |
| `unit-tests` | Vitest `--reporter json` (plus the Chromium check of `gates/bin/test.ts`) | failed tests (one finding each, rule = the test's full name) | no report, the browser missing, no test file found in the run, a test file that fails to load, or errors outside tests (unhandled errors, failed collection) |
| `mutation` | Stryker's JSON report (research.md R-08) | `Survived` or `NoCoverage` on a changed line; a disable comment other than a reasoned next-line record (`CompileError` mutants are invalid and pass, FR-011) | no report, a failed dry run, an unresolvable `--base`; a `+++` header of `git diff --unified=0` that is neither `b/<path>` (plain, tab-suffixed, or C-quoted with octal escapes, which the wrapper decodes) nor `/dev/null` (the cause names the header; normal run, `--files` and `--plan` alike); a changed in-scope path that Stryker cannot take as a `mutate` input (it contains a glob metacharacter `*?[]{}!`, a comma, or a line terminator `\n`, `\r`, U+2028 or U+2029, or otherwise cannot be passed verbatim), checked before Stryker runs (the cause names each such path; normal run, `--files` and `--plan` alike; phase 3 round 8, R8-01); a `--files` entry whose path is not a changed in-scope file, whose range holds no changed line, or whose range is malformed (the cause names the entry); a `mutate` entry Stryker did not read, which its log reports as `Glob pattern "<entry>" did not result in any files.` (Stryker 10.1.1 skips every file under a folder named `node_modules`, `.git`, `.next`, `.nuxt`, `.svelte-kit` or `.stryker-tmp`, any case, any depth), checked from Stryker's output before the report is classified (the cause names each such entry as Stryker logged it; normal run and `--files` alike; operator decision, phase 3 round 12, O12-01, human:jeroennouwsdev, 2026-11-03: "Fail on unread files (Recommended)"); a changed file Stryker read but its report does not list is not exit 2 but counts as zero mutants, so a type-only or comment-only change passes (operator decisions, PR #18 landing review, human:jeroennouwsdev, 2026-11-03, the second: "Guard the input instead (Recommended)"). Amendment 2026-11-10, mission 007 (`specs/007-mutation-gate-strictness/contracts/mutation-output.md`): a `--files` list that names one file more than once (two entries of one file, or one entry repeated) is exit 2 before Stryker runs, checked after the malformed range and before the other `--files` causes: `mutation: could not run: --files names one file more than once (two entries of one file never share a shard): <entry>, <entry>; run --plan for the shards` (operator decision, plan squad round 1, PLAN-CORRECTNESS-1-005 (a), human:jeroennouwsdev, 2026-11-10). Report lines, not findings, on stdout after the record lines and before the findings, at exit 0 and 1 alike (none at exit 2): `<path>:<start line>: mutation: timeout: <mutator>: replaced by <replacement>` per Timeout mutant and `<path>:<start line>: mutation: compile-error: <mutator>: replaced by <replacement>` per CompileError mutant on a changed line, then `<entry>: mutation: zero-mutants: no mutant on the changed lines` per entry with no mutant on its changed lines, `<entry>` the path or the `--files` entry as given (`path:start-end` for a range entry); both summaries count timeouts, compile errors and zero-mutant entries, also when zero (operator decisions, human:jeroennouwsdev, 2026-11-10: report and pass for all three). Amendment 2026-11-19, mission 019 (`specs/019-data-records/reviews/phase-1/operator-mutation-decisions.md`, gate gap rule (c); T087 to T089): a **checker failure** is exit 2: when every mutant on a changed file's changed lines (in a `--files` run, on the entry's ranges) is a CompileError and one diagnostic of that file (same path, line and TS code, read from each mutant's `statusReason` in the form `<path>(<line>,<col>): error TS<code>: <message>` of Stryker 10.1.1's TypeScript checker) appears in every one of them on a line none of them spans, Stryker's type checker rejects the unmutated file and the gate could not mutation-test it: `mutation: could not run: Stryker's type checker rejects <path> itself, not its mutants: <path>(<line>,<col>): error TS<code>; fix that type error (an explicit type often does) and rerun`, whatever the other files' findings. Every other CompileError stays invalid and passes with its report line (007's verdicts; the `pass-compile-error` plant's diagnostic is on its mutant's own line) |

The script gates (`csp`, `prefix`, `config-copies`, `pins`, `signoff`, `plants`) produce findings themselves and
follow the same split: an input they cannot read or parse is exit 2.
