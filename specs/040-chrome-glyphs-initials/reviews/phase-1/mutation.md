# Phase 1 mutation verification

The full local gate instrumented 49 mutants in `packages/elements/src/icons.ts`. Its initial test run failed in the existing `ocelle-form-input` FR-027 A, B, A test before any mutant could be judged. Two attempts ended with exit 2 and no Stryker report. The second attempt retained the Stryker diagnostic below.

```sh
pnpm run gate:mutation -- --base aee31975f93b764512109c4ea8ba2dbfb2976f1b
```

```text
03:28:10 (42602) INFO ProjectReader Found 1 of 7375 file(s) to be mutated.
03:28:10 (42602) INFO Instrumenter Instrumented 1 source file(s) with 49 mutant(s)
03:28:10 (42602) INFO ConcurrencyTokenProvider Creating 4 checker process(es) and 4 test runner process(es).
03:29:13 (42602) INFO DryRunExecutor Starting initial test run (vitest test runner with "perTest" coverage analysis). This may take a while.
03:54:54 (42602) ERROR DryRunExecutor One or more tests failed in the initial test run:
	ocelle-form-input, in process (US2) > FR-027 merge, A, B, A: an error that go…
		promise rejected "AssertionError: FR-027 merge, A, B, A: ga… { …(4) }" instead of resolving
03:54:54 (42602) ERROR Stryker There were failed tests in the initial test run.
mutation: could not run: Stryker wrote no report (There were failed tests in the initial test run.); run pnpm test and check stryker.config.json
```

The required standard Mutation job and both of its shards passed on the exact candidate `0fd302f6392cb71953a4e4e92c7b80e602e12b36`, tested merge `fdb917eccb7cb6816785f90535431c9324cf28ca`. The gate plan at the phase base selected `packages/elements/src/icons.ts:24-134` (30 changed lines) and `packages/elements/src/icons.ts:135-148` (14 changed lines). [Hosted CI run 46100810218](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/46100810218)

| Hosted shard | Reported mutants | Compile errors | Survived | Timed out |
| --- | ---: | ---: | ---: | ---: |
| [icons.ts lines 24–134](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/46100810218/job/140842680959) | 30 | 17 | 0 | 0 |
| [icons.ts lines 135–148](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/46100810218/job/140842680991) | 18 | 13 | 0 | 0 |

Neither shard reported zero-mutant entries or equivalent exclusions. The hosted shards account for 48 mutants. The unsharded local related-elements diagnostic instrumented 49: a mutation spanning the one intra-file shard cut is omitted by the sharded plan. The source locations and verbatim hosted dispositions are in `hosted-mutation.json`.

The unsharded local related-elements diagnostic exited 0. Its 2,197 baseline tests completed in 23m18s. The run reported 49 mutants, none survived, one timed out, 31 failed to compile, and there were no zero-mutant entries or equivalent records. The full local command, affected ranges, all mutant identities and dispositions are recorded below and in `related-mutation.json`.

```sh
pnpm run gate:mutation -- --base aee31975f93b764512109c4ea8ba2dbfb2976f1b --files packages/elements/src/icons.ts --shadow-grouped --shadow-related-elements
```

```text
packages/elements/src/icons.ts:134: mutation: timeout: BooleanLiteral: replaced by true
mutation: 49 mutants on the changed lines of 1 file, none survived; 1 timeout, 31 compile errors, 0 zero-mutant entries; 0 equivalent records
```
