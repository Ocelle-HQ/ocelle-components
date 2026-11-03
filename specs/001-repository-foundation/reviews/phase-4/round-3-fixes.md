# Phase 4 review round 3 (operator addendum): fixes

Review: `round-3.md` (changes_requested, operator addendum, 1 blocking finding). Task: tasks.md T093 (planner commit
`4929b0a` amended spec FR-013/SC-005, research.md R-08 and plan.md; this round changes the code, its test and
`gates/README.md`).

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| O3-01 | fixed: T093 steps 2 to 4. The shard bound is 250 changed lines: `maxLines` in `gates/lib/mutation/shards.ts` and its header comment; 10 files per shard and the 10-minute job limit (`timeout-minutes: 10`, ci.yml) are unchanged. `gates/README.md` had no wording of the bound; it now states it (at most 10 files and 250 changed lines, a larger file alone, each `mutation-shard` job under a 10-minute limit). Check: the CI plan against `bdb9b70` now has 18 shards (was 9); every shard run with `--files` exits 0 with no survivor (the changed `maxLines` line in shard 11 included); the longest local shard is 272 s (`gates/lib/plant-judge.ts` alone). `mutation-shards.md` has the CI run 4/6/7 durations of round 3, the new shard list and timings, and the corrected margin sentence (R2-01): the "more than half" claim is withdrawn; local sandbox times do not predict GitHub runner times, and the next CI run's 18 shard jobs are the evidence. For the operator: locally, the slowest single-file shards are not faster than the 500-line shards of round 1 (fixed per-shard cost, and the checker checks one file's mutants one at a time), so whether 250 lines brings every CI job safely under 10 minutes is shown only by CI. | `3c86680` (`red fix-3`, `red-fix-3.log`): in `gates/test/mutation-shards.test.ts` the 500-line case is changed to 250 ("fills shards of up to 250 changed lines, exactly 250 included"), and three cases are added: two files of exactly 250 lines in one shard, two files of 251 lines in two shards, a file of 251 lines alone; the "more than" case says 250. Red run: exit 1, 3 of 1111 tests failed, all `AssertionError`s against the 500-line code (the 250-included, 251-split and 251-alone cases); no load error. The 250-together and 700-alone cases pass at red, as they should under both bounds. | gates/lib/mutation/shards.ts, gates/test/mutation-shards.test.ts, gates/README.md, reviews/phase-4/mutation-shards.md, reviews/phase-4/round-3-mutation-pr-base.log |

Checks, with `PATH=/opt/node26/bin:$PATH` and `OCELLE_CHROMIUM_PATH` set (R-03), at the green change:

- `pnpm test`: exit 0, "1111 tests passed in 52 files".
- `gate:unit-tests`, `gate:config-copies`, `gate:test-lint`, `gate:typecheck`, `gate:lint`, `gate:style-lint`,
  `gate:csp`, `gate:prefix`, `gate:pins`: exit 0, no finding. `gate:signoff -- --range bdb9b70..HEAD`: exit 0,
  124 commits checked, no finding. `gate:plants`: exit 0, "136 plants of 11 gates and the registry judged, every
  plant as expected" (2 min 28 s).
- `gate:mutation -- --base bdb9b70 --plan`: 18 shards; each run with `--files`: exit 0, none survived
  (`round-3-mutation-pr-base.log`, timings in `mutation-shards.md`, section "Review round 3").
