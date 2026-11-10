# Contract: mutation gate output (007)

Amends the `mutation` rows of `specs/001-repository-foundation/contracts/gate-cli.md`. The exit codes, `--plan` and
every existing exit-2 cause are unchanged; `--files` gains one exit-2 cause (below). Applies to the whole-diff run and
to `--files` alike; `--plan` is unchanged. The report lines are not findings; their location may be `path:start-end` (a
`--files` range entry), which the dated 007 amendment of gate-cli.md's location rule and of 001 data-model.md § Finding
allows for these lines (research.md R-08).

## Lines on stdout, in this order

1. Equivalent records, as today: `<path>:<line>: mutation: record: <mutator>: <reason>`.
2. Timeouts: `<path>:<start line>: mutation: timeout: <mutator>: replaced by <replacement>`.
3. CompileErrors: `<path>:<start line>: mutation: compile-error: <mutator>: replaced by <replacement>`.

   The rule is the status spec FR-001 and FR-002 name: `timeout` is the status `Timeout`, `compile-error` the status
   `CompileError`. No separate status word is printed.
4. Zero-mutant entries: `<entry>: mutation: zero-mutants: no mutant on the changed lines`, where `<entry>` is the path
   (whole-diff run) or the `--files` item as given (`path` or `path:start-end`).
5. Exit 1 only: the findings, as today: `<path>:<line>: mutation: <mutator>: <Survived|NoCoverage>: replaced by …`.
6. The summary line:
   - exit 0: `mutation: <n> mutant(s) on the changed lines of <f> file(s), none survived; <t> timeout(s), <c> compile
     error(s), <z> zero-mutant entr(y|ies); <r> equivalent record(s)`
   - exit 1: `mutation: <k> finding(s) in <f> changed file(s) (<n> mutant(s) on changed lines; <t> timeout(s), <c>
     compile error(s), <z> zero-mutant entr(y|ies))`

   Counts are given also when zero. The exact nouns, singular for a count of 1 and plural otherwise: `mutant` /
   `mutants`, `file` / `files`, `changed file` / `changed files`, `finding` / `findings`, `timeout` / `timeouts`,
   `compile error` / `compile errors`, `zero-mutant entry` / `zero-mutant entries`, `equivalent record` /
   `equivalent records`. `plural()` gains an optional irregular plural for `entry` / `entries` (research.md R-04).
7. Unchanged: `mutation: nothing to mutate: no package or gate source line changed since <base>` (exit 0), and every
   exit-2 cause on stderr (no report lines are printed then).

Within groups 2 and 3 the order is the changed files' order, then start line, then start column, then Stryker's mutant
id compared as a number (a non-numeric id sorts after every numeric one, by string); group 4 follows the changed files'
order. Nothing is truncated.

## New exit-2 cause (`--files`)

Operator decision, human:jeroennouwsdev, 2026-11-10, plan squad round 1, PLAN-CORRECTNESS-1-005 (a): a `--files` list
in which one file has more than one entry (two entries of one file, such as `a.ts:1-60,a.ts:61-120` or `a.ts,a.ts:1-60`,
or one entry repeated) ends the run as could-not-run, before Stryker runs, naming every entry of each such file as
given, in list order:

```text
mutation: could not run: --files names one file more than once (two entries of one file never share a shard): <entry>, <entry>; run --plan for the shards
```

It is checked after the malformed-range cause and before the not-a-changed-file and no-changed-line causes. 001
gate-cli.md's mutation row gains it in the dated 007 amendment (research.md R-08).

## Readers

- The plant judge reads `record`, `timeout`, `compile-error` and `zero-mutants` of gate `mutation` as report lines,
  never as findings (spec FR-005). A plant may assert them with `reports` (data-model.md § Plant).
- The story review command, `.specify/extensions/story/commands/speckit.story.review.md:41-45` and its copy
  `tooling/speckit/extensions/story/commands/speckit.story.review.md`: the phase reviewer runs
  `pnpm run gate:mutation -- --base <sha>`, reads its lines and treats a surviving mutant as blocking. Both copies gain
  one sentence: `timeout`, `compile-error` and `zero-mutants` lines are reports to read, not blocking findings
  (spec FR-005).
- No other reader of gate output exists in the repository (`.github/workflows/ci.yml` uses only exit codes and the
  `--plan` JSON).

## Examples

```text
packages/tokens/src/x.ts:3: mutation: compile-error: ArrayDeclaration: replaced by []
mutation: 2 mutants on the changed lines of 1 file, none survived; 0 timeouts, 1 compile error, 0 zero-mutant entries; 0 equivalent records
```

```text
packages/tokens/src/source.ts:61-120: mutation: zero-mutants: no mutant on the changed lines
mutation: 0 mutants on the changed lines of 1 file, none survived; 0 timeouts, 0 compile errors, 1 zero-mutant entry; 0 equivalent records
```
