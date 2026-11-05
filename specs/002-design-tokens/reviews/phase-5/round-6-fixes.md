# Phase 5 review round 6: fixes

Review: `round-6.md` (operator round, changes_requested, 1 blocking finding). Task T071. The planner amended the
contracts in 4aa2637 (001 research.md R-08, 001 contracts/gate-cli.md, gates/README.md, the 002 texts).

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| O6-01 | fixed | `fix-6` fc27170 (`red-fix-6.log`: 22 of 1798 tests failed, every one an `AssertionError` in `gates/test/mutation-shards.test.ts`, no load error) | `gates/lib/mutation/shards.ts`: `maxEntryLines = 60` and its comments; `gates/bin/mutation.ts`: the header comment names 60. Tests: `gates/test/mutation-shards.test.ts` moved to 60-line entries (exactly 60 lines one entry, its path; 61 lines `:1-60` and `:61-61` in two shards; a cut inside a range where the count reaches 60; the multi-range and `plant-judge.ts` cases recomputed into four entries; the 250-line and 10-entry fill cases with entries of at most 60 lines; the mixed-files invariant now also counts `ceil(lines / 60)` entries per file; the gate's `--plan` cases). No other test or fixture pinned 120. |

## Checks

On Node 22.23.4, after the green change, no test changed:

- `pnpm test`: 1798 tests passed in 88 files. `gate:typecheck`, `gate:lint`, `gate:test-lint`: no finding.
- `pnpm run gate:mutation -- --base eaf16896ec10affdca24296fc9531fcffc46a8be --plan`: 24 shards, 23 cuts within
  files; every `path:start-end` entry holds at most 60 changed lines and every whole entry is a file of at most 60
  (the plan is in `mutation-shards.md`).
