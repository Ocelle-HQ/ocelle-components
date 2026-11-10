# Contract: mutation gate output (007)

Amends the `mutation` rows of `specs/001-repository-foundation/contracts/gate-cli.md` (the exit codes, `--plan`,
`--files` and every exit-2 cause are unchanged). Applies to the whole-diff run and to `--files` alike; `--plan` is
unchanged.

## Lines on stdout, in this order

1. Equivalent records, as today: `<path>:<line>: mutation: record: <mutator>: <reason>`.
2. Timeouts: `<path>:<start line>: mutation: timeout: <mutator>: replaced by <replacement>`.
3. CompileErrors: `<path>:<start line>: mutation: compile-error: <mutator>: replaced by <replacement>`.
4. Zero-mutant entries: `<entry>: mutation: zero-mutants: no mutant on the changed lines`, where `<entry>` is the path
   (whole-diff run) or the `--files` item as given (`path` or `path:start-end`).
5. Exit 1 only: the findings, as today: `<path>:<line>: mutation: <mutator>: <Survived|NoCoverage>: replaced by …`.
6. The summary line:
   - exit 0: `mutation: <n> mutant(s) on the changed lines of <f> file(s), none survived; <t> timeout(s), <c> compile
     error(s), <z> zero-mutant entr(y|ies); <r> equivalent record(s)`
   - exit 1: `mutation: <k> finding(s) in <f> changed file(s) (<n> mutant(s) on changed lines; <t> timeout(s), <c>
     compile error(s), <z> zero-mutant entr(y|ies))`

   Counts are given also when zero. Singular and plural as `plural()` makes them; "entry" / "entries".
7. Unchanged: `mutation: nothing to mutate: no package or gate source line changed since <base>` (exit 0), and every
   exit-2 cause on stderr (no report lines are printed then).

Within groups 2 and 3 the order is the changed files' order, then start line, then Stryker's mutant id; group 4 follows
the changed files' order. Nothing is truncated.

## Readers

- The plant judge reads `record`, `timeout`, `compile-error` and `zero-mutants` of gate `mutation` as report lines,
  never as findings (spec FR-005). A plant may assert them with `reports` (data-model.md § Plant).
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
