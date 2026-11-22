# Mutation and process evidence for Op 025

Rollout run [45046420891](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45046420891) had 21 failing mutation
shards. Its findings fell into four groups.

| Source | No coverage | Survived |
|---|---:|---:|
| `gates/bin/story-evidence.ts` | 496 | 0 |
| `gates/bin/test-shards.ts` | 55 | 0 |
| `gates/lib/vitest-run.ts` | 18 | 0 |
| `gates/lib/test-evidence.ts` | 39 | 147 |

Those counts describe the first rollout revision. Later tests cover the artifact schema, revision and inventory
checks, empty and interrupted phase evidence, changed assertion locations, shared helper assertions and cache headers.
They should be measured in fresh mutation runs. The threshold and mutation scope are unchanged.

## Process boundary coverage

The external calls marked as process boundaries are exercised using disposable repositories and the real subprocesses
in `gates/test/integration/test-workflow-evidence.test.ts`.

- The shard integration runs actual Vitest discovery and two real shards, verifies a missing artifact fails, then
  compares a complete artifact set with the stock full Vitest report generated at the same commit. The
  `unit-tests/fail-gates-test` plant also adds and removes an artifact while exercising the actual required verdict.
- The story integration uses actual Git worktrees, setup, Vitest execution and local cache files. It proves a direct
  assertion and a shared scenario on old code, green after the fix, reusable evidence on replay, and that a corrupted
  cache record makes the head rerun.
- Vitest runtime loading and disposal are part of both subprocess tests. Assertion matching, cache acceptance and
  artifact policy remain subject to mutation checks.

## Representative aggregate shard

A strict local Stryker run of `gates/lib/test-evidence.ts:172-200` on `54366017` checked 73 mutants. It reported
21 compile errors and one survivor. The survivor changed the guard against a nominally passed test that carried
errors. The added regression case passes on the implementation and fails when that exact guard is replaced by
`false`. A fresh strict run is needed to confirm the full changed-line scope.
