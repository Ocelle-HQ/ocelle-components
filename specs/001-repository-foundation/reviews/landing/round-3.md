---
round: 3
verdict: approved
base: bdb9b704dceac4ac13e5c46c0e63f67c16d211fc
head: eb2f5dd2d192aee9ab6a83fb4a0f742fc483b024
---

# Landing review, round 3 (PR #18, mission 001-repository-foundation)

Verify-only round under the stop rule (operator decision 2026-11-03, `.claude/skills/ocelle-land/SKILL.md` step 2.6).
It does not search afresh. It checks only that the blocking finding of round 2 (L2-01) is resolved and that the folds
since round 2 (`git diff 25f5643..eb2f5dd`, 42 files) regressed nothing round 2 found working. The fix under check is
phase 3 round 12: red 94d6ef0, green c949938, approved in phase 3 round 13 (eb2f5dd). The code changes in the range
are gates/lib/mutation/report.ts, gates/lib/mutation/shards.ts and gates/bin/mutation.ts. The rest is tests,
fixtures, evidence and docs.

## Findings

No new finding. Nothing blocks.

## Earlier findings (round 2)

| ID | Status now | Evidence |
|----|------------|----------|
| L2-01 | **resolved** | Reproduced with the real gate (`node gates/bin/mutation.ts --root <scratch> --base <first commit>`, run from another working directory) on scratch repositories built like `mutationRepo("mutation-uncovered")`. The base is that fixture's base. The head adds the fixture's untested `y.ts` under a skipped folder: (1) `packages/tokens/src/.next/y.ts`: **exit 2**, stderr `mutation: could not run: Stryker did not read these mutate entries (it skips every file under a folder named node_modules, .git, .next, .nuxt, .svelte-kit or .stryker-tmp, in any case): packages/tokens/src/.next/y.ts:1-2; move the files out of such a folder`. Round 2 saw exit 0 with "0 mutants" here. (2) `packages/tokens/src/lib/.Svelte-Kit/y.ts`, a second skipped name, mixed case and nested: **exit 2**, the same cause naming `packages/tokens/src/lib/.Svelte-Kit/y.ts:1-2`. (3) `--files packages/tokens/src/.next/y.ts` on repository (1): exit 2, the same cause. (4) Control, `packages/tokens/src/n/y.ts`: exit 1, `StringLiteral: NoCoverage`, the same as round 2. The check reads Stryker's `Glob pattern "<entry>" did not result in any files.` warning (report.ts:67-83), which is round 2's option (b). "Read and absent from the report = zero mutants" stays. `--plan` on repository (1) still exits 0 with one shard. The plan does not run Stryker, so the shard run is where the exit 2 happens, as contracts/gate-cli.md states ("normal run and `--files` alike"). |
| L2-02 | open note | verification.md was last changed in c3daf70 and is still stale: §2 cites run 41619235381 and 18 shards; §4 SC-005 rests on the old shard layout; §5 is missing. The green run on the current head is 41694458359 (see Checks). |
| L2-03 | open note | The operator chose to scrub machine paths after the history fold. The folds since round 2 add more of them: the regenerated phase-3 `check-*.log` files, including the new check-red-fix-12.log, carry the root pnpm store path. tdd-check.sh regenerates these logs. Scrub them by rerunning it as planned, not by editing the logs. |

## Regressions

None found.

- **L1 statuses (round 2 table):** unchanged. ranges.ts (L1-01), plant-judge.ts (L1-04, L1-05), csp.ts (L1-03),
  ci.yml, gates.json and registry.ts (L1-06) are not in `git diff 25f5643..HEAD`. L1-02 is now fully resolved,
  because its rest was L2-01. L1-07 and L1-09 stay notes. L1-08 is decided, and its open items stay open: a test for
  fold-history.sh and verification.md §5.
- **Completeness:** gates.json, registry.ts, .github/workflows/ci.yml and contracts/ci-checks.md are unchanged since
  round 2. gates/README.md gains one paragraph on mutation exit 2. It does not touch the check list or the gate
  table. contracts/gate-cli.md's mutation row agrees with report.ts and with the cause text. `gate:plants` passes
  its registry check (below). The new fixture `gates/test/fixtures/mutation-unread/` lies under the existing
  `gates/test/fixtures/` exclusions (R-10).
- **Squash onto main:** `git ls-remote origin main` = `bdb9b70`. `git merge-tree --write-tree bdb9b70 HEAD` exits 0
  with tree `0ebceef`, which equals `HEAD^{tree}`.
- **tasks.md:** 99 tasks `[X]`, none `[ ]` (the new T099 included).
- **O12-02 (shards.ts entry split):** behaviour unchanged per phase 3 round 13. `--plan --base bdb9b70` gives the
  same 21 shards and 14 cuts as round 2.

## Checks run

PATH=/opt/node26/bin and OCELLE_CHROMIUM_PATH set as instructed, at eb2f5dd:

| Check | Result |
|---|---|
| `pnpm test` | exit 0: 1249 tests passed in 55 files |
| `pnpm run gate:typecheck` | exit 0 |
| `pnpm run gate:lint` | exit 0: 100 files |
| `pnpm run gate:style-lint` | exit 0: 1 file |
| `pnpm run gate:unit-tests` | exit 0: 1249 tests in 55 files |
| `pnpm run gate:test-lint` | exit 0: 57 files |
| `pnpm run gate:config-copies` | exit 0: identical |
| `pnpm run gate:pins` | exit 0: 4 manifests |
| `pnpm run gate:prefix` | exit 0: 19 files |
| `pnpm run gate:signoff -- --range bdb9b70..HEAD` | exit 0: 168 commits |
| `pnpm -r build && pnpm run gate:csp` | exit 0: 3 files |
| `pnpm run gate:plants` | exit 0: "136 plants of 11 gates and the registry judged, every plant as expected" (2m25s) |
| `gate:mutation -- --base bdb9b70 --plan` | exit 0: stderr "21 shards, 14 cuts within files" |
| `git merge-tree --write-tree bdb9b70 HEAD` | exit 0, tree `0ebceef` = `HEAD^{tree}` |
| CI on the latest pushed head `eb2f5dd`, run 41694458359 | completed, success: 34 of 34 jobs, 21 mutation shards |
| L2-01 reproduction | see the table above: `.next` and `.Svelte-Kit` exit 2 naming the entry; control exit 1 |

Full mutation was not run, as the brief asked. CI covers it on 41694458359.

## Carried notes

- **R11-01** (phase 3): SC-005 margin is thin, and shards are bounded by lines, not mutants. The operator still has
  the lever of a bound on mutants per shard.
- **R13-01** (phase 3): the one-off CI failure of the old `shards.ts:1-120` shard (run 41677290625) is still
  unexplained. The regex is gone. If a failure like that comes back, upload the Stryker JSON report as an artefact.
- **R13-02** (phase 3): the slowest shard is shard 21
  (`gates/lib/vitest-report.ts:121-123,gates/lib/workspace-yaml.ts,...`). It took 528 s on run 41694458359, 72 s
  under the 10-minute job limit. On earlier runs it took 519 s and 503 s.
- **L2-02**, **L2-03**: open, see above.

## Follow-ups (not reviewed)

- The R13-02 margin keeps shrinking (503 s, 519 s, 528 s on the last three runs of shard 21). It is still under
  the limit.

## Verdict

**approved**. L2-01 is resolved: the real gate exits 2 naming the entry for changed, untested files under `.next`
and `.Svelte-Kit`, where round 2 saw exit 0. No regression: every check and gate exits 0 locally, CI is green on the
pushed head, the merge onto `main` is clean, the registry baselines agree and every task is ticked. Before merging,
the operator still settles L1-07 (the ruleset), brings verification.md up to date (L2-02) and scrubs machine paths
after the fold (L2-03).
