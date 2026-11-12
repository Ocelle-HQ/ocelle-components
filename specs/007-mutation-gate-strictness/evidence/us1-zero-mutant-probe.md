# User Story 1: zero-mutant probe (T004, research R-03)

Taken on 2026-11-10 at the phase 2 base `aafeb28`, before any User Story 1 code, with the **unchanged** gate, Stryker
10.1.1, Node 22.23.4, `OCELLE_CHROMIUM_PATH` and `PLAYWRIGHT_BROWSERS_PATH` set as tasks.md's *Environment* says.

## The trees

Built in the scratchpad, modelled on `gates/plants/mutation/pass-compile-error/`, and later committed as the
`pass-zero-mutant` plant (T012):

- `base/packages/tokens/src/x.ts`: the comment line and `export const name = "base";`.
- `head/packages/tokens/src/x.ts`: the same two lines plus `export type Label = "planted";` (a type-only change, no
  runtime code).
- `base/` and `head/packages/tokens/test/x.test.ts`: the same test, `name` is `"base"` (the test file does not change).

The repository was built with `buildMutationRepo` of `gates/lib/plant-repo.ts`, the builder the plant runner uses for
the mutation gate (`plantForm: mutation-repo`): the configuration set, `base/` committed, then `head/` committed. The
diff is one added line, `packages/tokens/src/x.ts:3`.

## The gate run

The plant command of `gates/gates.json`, `node gates/bin/mutation.ts --root <repo> --base <base commit>`:

```text
exit 0 (12 s)
stdout: mutation: 0 mutants on the changed lines of 1 file, none survived; 0 equivalent records
stderr: (empty)
```

`reports/mutation/mutation.json` was written (5 072 bytes); its `files` is `{}` (no file listed).

## Stryker's own output

The same Stryker call the gate makes (`stryker.js run --mutate packages/tokens/src/x.ts:3-3`, with the coverage
preload of `gates/lib/mutation/coverage.ts` in `NODE_OPTIONS`), run once more in the same repository to read its log,
which the gate does not print:

```text
INFO ProjectReader Found 1 of 26 file(s) to be mutated.
INFO Instrumenter Instrumented 1 source file(s) with 0 mutant(s)
INFO ConcurrencyTokenProvider Creating 4 checker process(es) and 4 test runner process(es).
INFO DryRunExecutor Initial test run succeeded. Ran 1 tests in 0 seconds (...)
INFO JsonReporter Your report can be found at: file:///.../reports/mutation/mutation.json
INFO MutationTestExecutor Done in 9 seconds.
```

Stryker exited 0, wrote the report with `files: {}`, and logged no ERROR line.

## Outcome

Stryker 10.1.1 **writes a report** for a zero-mutant run, as research R-03 read from its source. So the stop-and-ask
point does not apply, and the R-03 fallback cases of T009 and T013 (a no-report run with `Instrumented … with 0
mutant(s)`) are **dropped from this phase**: no fallback is built, and a run without a report stays exit 2 with
today's cause.
