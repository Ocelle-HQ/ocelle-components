# Phase 3: A' with shard 1 split (plan decision 30; T046o to T046x)

The operator answered T046l on 2026-11-12 (human:jeroennouwsdev). The answers were "A' size 3" and "Split its plants".

## T046o and T046p: size 3, approved

Red `52913f9` (T046o). The test of the repository's `shardSize` expects 3, and it failed on the missing behaviour:
`AssertionError: expected 4 to be 3`. This was the only failure in 2987 tests (`red.sh 3 phase`, 324 s).

Green (T046p):
- `shardSize` is now 3, and its comment names plan decision 30.
- gates/README.md now says "groups of at most 3", approved.

The shard world in `gates/test/plants.test.ts` still holds 9 visual plants, so the plan still has 4 shards. Each
expected value is now written for size 3, and none is loosened:
- shard 2 is error-basic, fail-basic and pass-basic;
- shard 3 is pass-v01 to pass-v03;
- shard 4 is pass-v04 to pass-v06.

Three tests changed shards to follow their plants:
- the `--shard` not-expected test judges shard 3, where pass-v01 now is ("1 problem in 3 plants");
- the not-run test uses pass-v02 and pass-v03, both in shard 3;
- the verdict problem-lines test puts pass-v01's problem in report 3.

The integration verdict test (5 visual plant directories) still gives 3 shards, now 1 + 3 + 2. Only its comment
changed.

### Checks (T046p), one at a time

| Check | Result | Time |
|---|---|---|
| `pnpm test` | 2987 tests passed in 133 files | 304 s |
| `gate:typecheck` | no type error | 7 s |
| `gate:lint` | 255 files, no finding | 20 s |
| `gate:test-lint` | 168 files, no finding | 4 s |

The plant run used `OCELLE_VISUAL_ENGINE=auto` (docker) at `size` 3. The shards took 2803 s in all:

| Step | Plants | Time |
|---|---|---|
| `--plan` | | under 1 s: `[1,2,…,17]`, which is shard 1 plus the 48 `visual` plants in 16 shards of 3 |
| shard 1 | 232 | 280 s |
| shard 2 (error-build-fails, error-host, error-index-pin) | 3 | 7 s |
| shard 3 (error-no-engine, error-tag-pin, fail-beacon) | 3 | 61 s |
| shards 4 to 17 | 3 each | 168 to 185 s each |
| `--verdict` | 280 | 1 s: `plants: 280 plants of 16 gates and the registry judged, every plant as expected` |

Every shard printed `plants: shard <k> of 17: <m> plants judged, every plant as expected`.

## T046w and T046x: shard 1's plants split, `otherShardSize` 80

Red `88aa460` (T046w). It failed 8 of 2993 tests (`red.sh 3 phase`, 295 s), each on the missing behaviour:
- T046c's two partition cases and the 10-or-more case got the other plants in input order, not sorted;
- the otherSize 4 and otherSize 5 cases got one shard for every other plant;
- the reversed-or-shuffled case got one shard, not the 3 it deals;
- the at-most-one case found visual plants among the first ⌈10 / otherSize⌉ shards;
- `otherShardSize` was `undefined`, not 80.

There was no syntax, import or setup error.

Green (T046x):
- `plantShards(plants, size, otherSize)`: `otherSize` is required. The other plants are sorted and dealt in turn over
  max(1, ⌈n / `otherSize`⌉) shards.
- `otherShardSize` is 80, and its comment names plan decision 30.
- `gates/bin/plants.ts` passes `otherShardSize` to the one `plantShards` call, which serves `--plan`, `--shard` and
  `--verdict`.
- gates/README.md § the split plant job now describes the dealing.
- `.github/workflows/ci.yml` and its plant copies are unchanged.

The tests of `gates/test/plants.test.ts` pass unchanged (47 other plants, fewer than 81, so one shard).

### Checks (T046x), one at a time

| Check | Result | Time |
|---|---|---|
| `pnpm test` | 2993 tests passed in 133 files | 299 s |
| `gate:typecheck` | no type error | 7 s |
| `gate:lint` | 255 files, no finding | 19 s |
| `gate:test-lint` | 168 files, no finding | 4 s |

The plant run used `OCELLE_VISUAL_ENGINE=auto` (docker). The shards took 2832 s in all:

| Step | Plants | Time |
|---|---|---|
| `--plan` | | under 1 s: `[1,2,…,19]`, which is 3 shards of other plants plus the 48 `visual` plants in 16 shards of 3 |
| shard 1 | 78 | 92 s |
| shard 2 | 77 | 85 s |
| shard 3 | 77 | 103 s |
| shard 4 (error-build-fails, error-host, error-index-pin) | 3 | 7 s |
| shard 5 (error-no-engine, error-tag-pin, fail-beacon) | 3 | 58 s |
| shards 6 to 19 | 3 each | 168 to 193 s each |
| `--verdict` | 280 | under 1 s: `plants: 280 plants of 16 gates and the registry judged, every plant as expected` |

`gate:mutation -- --base f6474bd`: exit 0 in 1702 s. Chromium 1248 was aliased to the installed 1243, and
`OCELLE_CHROMIUM_PATH` was unset. It printed: `mutation: 4339 mutants on the changed lines of 37 files, none survived;
35 timeouts, 1226 compile errors, 3 zero-mutant entries; 488 equivalent records`.
