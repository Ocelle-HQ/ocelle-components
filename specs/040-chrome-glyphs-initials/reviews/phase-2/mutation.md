# Phase 2 mutation verification

The local related-elements diagnostic ran against corrected source commit `4a4fe0d8df740d0747819af99c0a4a12ada6272b` and phase base `303f034669a010d5f73a596d1d4906767dc53d90`. The later inventory-only commit `66da4da78d73cc2d94e6748f188ad4e59fe04a0b` preserves that source and those tests. The initial unsharded run passed all 337 baseline tests in 184.021 seconds. Of 65 mutants, 57 were killed and eight failed to compile. None survived or timed out. The gate reported zero equivalent records and zero entries without mutants. The exact ranges and individual dispositions are in `related-mutation.json`.

```sh
pnpm run gate:mutation -- --base 303f034669a010d5f73a596d1d4906767dc53d90 --files packages/elements/src/ocelle-button.ts --shadow-grouped --shadow-related-elements
```

```text
mutation: 65 mutants on the changed lines of 1 file, none survived; 0 timeouts, 8 compile errors, 0 zero-mutant entries; 0 equivalent records
```

The required standard hosted Mutation aggregate succeeded on candidate `66da4da78d73cc2d94e6748f188ad4e59fe04a0b`, tested merge `2f08c51b6c7aefb205c301685f248c21fa3923cd`. The four shards covering button changes reported 51, zero, 32 and zero mutants respectively. The first shard included icon changes as well as button changes and recorded 21 compile errors. The two zero-mutant entries identified button CSS ranges 255–377 and 224–253. None of the four shards reported survivors, timeouts or equivalent exclusions. The job IDs and logged findings are in `hosted-mutation.json`. [Hosted Mutation aggregate](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/46112847765/job/140891344373)
