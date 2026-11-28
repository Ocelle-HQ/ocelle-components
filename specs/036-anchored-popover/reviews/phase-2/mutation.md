# Ordinary Mutation for Phase 2

- Base `a6ef9048f9ca30f69a32dd9b55e7d4085f154104`
- Tested source and test candidate `3ff4e940ae544b0010d0b091602685c858b03823`
- Plan `pnpm run gate:mutation -- --base <phase-base> --plan`
- Each of the five standard shards ran `pnpm run gate:mutation -- --base <phase-base> --files <planned-ranges>` with the full baseline test selection.
- Aggregate exit 0. The two changed source files produced 156 reported mutants with zero survivors and no timeouts. There were 57 compile-error mutants, one declared equivalent, and one zero-mutant range.

[Plan and exact selected ranges](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/46162541866/job/141032858353) · [Ordinary aggregate](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/46162541866/job/141042549252) · [Native CSSOM equivalence proof](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/46162164109/job/141031659342)

```text
Mutation shard (packages/elements/src/ocelle-anchored-popover.ts:122-308, 30)
mutation: 38 mutants on the changed lines of 1 file, none survived; 0 timeouts, 24 compile errors, 0 zero-mutant entries; 1 equivalent record

Mutation shard (packages/elements/src/anchored-popover-placement.ts:1-30, 30)
mutation: 15 mutants on the changed lines of 1 file, none survived; 0 timeouts, 9 compile errors, 0 zero-mutant entries; 0 equivalent records

Mutation shard (packages/elements/src/ocelle-anchored-popover.ts:309-338, 30)
mutation: 43 mutants on the changed lines of 1 file, none survived; 0 timeouts, 1 compile error, 0 zero-mutant entries; 0 equivalent records

Mutation shard (packages/elements/src/ocelle-anchored-popover.ts:339-339, 1)
mutation: 0 mutants on the changed lines of 1 file, none survived; 0 timeouts, 0 compile errors, 1 zero-mutant entry; 0 equivalent records

Mutation shard (packages/elements/src/anchored-popover-placement.ts:31-50,packages/elements/src/o...
mutation: 60 mutants on the changed lines of 2 files, none survived; 0 timeouts, 23 compile errors, 0 zero-mutant entries; 0 equivalent records
```
