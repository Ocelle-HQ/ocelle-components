# Phase 3 mutation shard timing (T050, SC-005)

Measured on 2026-11-02 at commit 885d9bb (phase 3 green plus the T049 catch-up), working tree clean.

Environment: this cloud sandbox, 4 vCPU (Intel Xeon @ 2.10GHz), Node 26.13.0, pnpm 12.16.1, StrykerJS 10.1.1 with its
default concurrency, `OCELLE_CHROMIUM_PATH` set to the preinstalled headless Chromium (research.md R-03). Every run is
cold: `incremental` is off, so no earlier mutation result is used. This is not the runner of SC-001 (GitHub Actions
`ubuntu-latest`); that measurement is the operator's (quickstart step 12).

Commands, with `B=$(cat specs/001-repository-foundation/reviews/phase-1/base.sha)` (706b5a1):

```bash
pnpm run gate:mutation -- --base $B --plan
pnpm run gate:mutation -- --base $B --files <the shard's files>   # once per shard, one after the other, timed
```

Plan output:

```json
[{"files":"gates/bin/config-copies.ts,gates/bin/mutation.ts,gates/bin/setup-offline.ts,gates/bin/test-lint.ts","lines":372},{"files":"gates/bin/test.ts,gates/eslint/no-snapshot-only.ts,gates/lib/cli.ts,gates/lib/eslint-report.ts,gates/lib/findings.ts","lines":434},{"files":"gates/lib/mutation/ranges.ts,gates/lib/mutation/records.ts,gates/lib/mutation/report.ts,gates/lib/mutation/shards.ts,gates/lib/spawn.ts,gates/lib/vitest-report.ts,packages/elements/src/index.ts,packages/styles/src/index.ts,packages/tokens/src/index.ts","lines":431}]
```

| Shard | Files | Changed lines | Mutants on changed lines | Result | Equivalent records | Duration |
|---|---|---|---|---|---|---|
| 1 | gates/bin/config-copies.ts, mutation.ts, setup-offline.ts, test-lint.ts | 372 | 326 | exit 0, none survived | 27 | 108 s (1 min 48 s) |
| 2 | gates/bin/test.ts, gates/eslint/no-snapshot-only.ts, gates/lib/cli.ts, eslint-report.ts, findings.ts | 434 | 320 | exit 0, none survived | 23 | 106 s (1 min 46 s) |
| 3 | gates/lib/mutation/ranges.ts, records.ts, report.ts, shards.ts, gates/lib/spawn.ts, vitest-report.ts, packages/{elements,styles,tokens}/src/index.ts | 431 | 440 | exit 0, none survived | 11 | 139 s (2 min 19 s) |

No shard came near the 10-minute limit of FR-013; the slowest took 2 min 19 s. Nothing to report to the operator.

## Round 9 fix (T097): shards split within files

Measured on 2026-11-03 on the round 9 fix tree: red commit f67d2cb plus the fix. The code is the same as in the
fix commit `fix(001-repository-foundation): phase 3 review round 9`. Same sandbox as above: 4 vCPU, Node
26.13.0, pnpm 12.16.1, StrykerJS 10.1.1, `concurrency` 8, cold runs (`incremental` off). Base: bdb9b70, the pull
request base and the plan CI runs. The shards ran one after the other, never two at once, since they share
`reports/mutation/`.

```bash
pnpm run gate:mutation -- --base bdb9b70 --plan
pnpm run gate:mutation -- --base bdb9b70 --files "<the shard's files value>"   # once per shard, timed
```

Plan output (19 shards; no entry over 120 changed lines of one file, no shard over 10 entries or 250 changed
lines; the largest shard has 4 entries and 248 lines):

```json
[{"files":"gates/bin/config-copies.ts,gates/bin/csp.ts:1-120","lines":204},{"files":"gates/bin/csp.ts:121-240,gates/bin/csp.ts:241-248,gates/bin/lint.ts","lines":152},{"files":"gates/bin/mutation.ts:1-120,gates/bin/mutation.ts:121-190","lines":190},{"files":"gates/bin/pins.ts:1-120,gates/bin/pins.ts:121-157","lines":157},{"files":"gates/bin/plants.ts:1-120,gates/bin/plants.ts:121-233","lines":233},{"files":"gates/bin/prefix.ts,gates/bin/setup-offline.ts","lines":222},{"files":"gates/bin/signoff.ts,gates/bin/style-lint.ts,gates/bin/test-lint.ts","lines":179},{"files":"gates/bin/test.ts:1-120,gates/bin/test.ts:121-136,gates/bin/typecheck.ts,gates/eslint/no-snapshot-only.ts","lines":241},{"files":"gates/eslint/unchecked-expect.ts:1-120,gates/eslint/unchecked-expect.ts:121-140,gates/lib/cli.ts,gates/lib/entries.ts","lines":248},{"files":"gates/lib/eslint-report.ts,gates/lib/findings.ts,gates/lib/mutation/coverage.ts","lines":158},{"files":"gates/lib/mutation/ranges.ts:1-120,gates/lib/mutation/ranges.ts:121-131,gates/lib/mutation/records.ts","lines":191},{"files":"gates/lib/mutation/report.ts,gates/lib/mutation/shards.ts:1-120,gates/lib/mutation/shards.ts:121-148","lines":239},{"files":"gates/lib/pins-rules.ts:1-120,gates/lib/pins-rules.ts:121-137","lines":137},{"files":"gates/lib/plant-judge.ts:1-120,gates/lib/plant-judge.ts:121-216","lines":216},{"files":"gates/lib/plant-repo.ts:1-120,gates/lib/plant-repo.ts:121-237","lines":237},{"files":"gates/lib/plant-runner.ts,gates/lib/registry.ts:1-120,gates/lib/registry.ts:121-121,gates/lib/spawn.ts","lines":243},{"files":"gates/lib/stylelint-report.ts,gates/lib/tsc-report.ts","lines":185},{"files":"gates/lib/vitest-report.ts:1-120,gates/lib/vitest-report.ts:121-123,gates/lib/workspace-yaml.ts","lines":212},{"files":"gates/stylelint/token-only.ts,packages/elements/src/index.ts,packages/styles/src/index.ts,packages/tokens/src/index.ts","lines":107}]
```

| Shard | Entries | Count | Changed lines | Mutants on changed lines | Result | Equivalent records | Duration |
|---|---|---|---|---|---|---|---|
| 1 | gates/bin/config-copies.ts, gates/bin/csp.ts:1-120 | 2 | 204 | 189 | exit 0, none survived | 2 | 118 s (1 min 58 s) |
| 2 | gates/bin/csp.ts:121-240, gates/bin/csp.ts:241-248, gates/bin/lint.ts | 3 | 152 | 182 | exit 0, none survived | 13 | 141 s (2 min 21 s) |
| 3 | gates/bin/mutation.ts:1-120, gates/bin/mutation.ts:121-190 | 2 | 190 | 171 | exit 0, none survived | 9 | 140 s (2 min 20 s) |
| 4 | gates/bin/pins.ts:1-120, gates/bin/pins.ts:121-157 | 2 | 157 | 163 | exit 0, none survived | 7 | 152 s (2 min 32 s) |
| 5 | gates/bin/plants.ts:1-120, gates/bin/plants.ts:121-233 | 2 | 233 | 185 | exit 0, none survived | 24 | 148 s (2 min 28 s) |
| 6 | gates/bin/prefix.ts, gates/bin/setup-offline.ts | 2 | 222 | 209 | exit 0, none survived | 13 | 152 s (2 min 32 s) |
| 7 | gates/bin/signoff.ts, gates/bin/style-lint.ts, gates/bin/test-lint.ts | 3 | 179 | 177 | exit 0, none survived | 18 | 138 s (2 min 18 s) |
| 8 | gates/bin/test.ts:1-120, gates/bin/test.ts:121-136, gates/bin/typecheck.ts, gates/eslint/no-snapshot-only.ts | 4 | 241 | 180 | exit 0, none survived | 23 | 109 s (1 min 49 s) |
| 9 | gates/eslint/unchecked-expect.ts:1-120, gates/eslint/unchecked-expect.ts:121-140, gates/lib/cli.ts, gates/lib/entries.ts | 4 | 248 | 188 | exit 0, none survived | 4 | 142 s (2 min 22 s) |
| 10 | gates/lib/eslint-report.ts, gates/lib/findings.ts, gates/lib/mutation/coverage.ts | 3 | 158 | 118 | exit 0, none survived | 1 | 113 s (1 min 53 s) |
| 11 | gates/lib/mutation/ranges.ts:1-120, gates/lib/mutation/ranges.ts:121-131, gates/lib/mutation/records.ts | 3 | 191 | 213 | exit 0, none survived | 0 | 227 s (3 min 47 s) |
| 12 | gates/lib/mutation/report.ts, gates/lib/mutation/shards.ts:1-120, gates/lib/mutation/shards.ts:121-148 | 3 | 239 | 292 | exit 0, none survived | 1 | 194 s (3 min 14 s) |
| 13 | gates/lib/pins-rules.ts:1-120, gates/lib/pins-rules.ts:121-137 | 2 | 137 | 267 | exit 0, none survived | 1 | 216 s (3 min 36 s) |
| 14 | gates/lib/plant-judge.ts:1-120, gates/lib/plant-judge.ts:121-216 | 2 | 216 | 353 | exit 0, none survived | 0 | 301 s (5 min 1 s) |
| 15 | gates/lib/plant-repo.ts:1-120, gates/lib/plant-repo.ts:121-237 | 2 | 237 | 311 | exit 0, none survived | 40 | 220 s (3 min 40 s) |
| 16 | gates/lib/plant-runner.ts, gates/lib/registry.ts:1-120, gates/lib/registry.ts:121-121, gates/lib/spawn.ts | 4 | 243 | 238 | exit 0, none survived | 8 | 241 s (4 min 1 s) |
| 17 | gates/lib/stylelint-report.ts, gates/lib/tsc-report.ts | 2 | 185 | 192 | exit 0, none survived | 1 | 127 s (2 min 7 s) |
| 18 | gates/lib/vitest-report.ts:1-120, gates/lib/vitest-report.ts:121-123, gates/lib/workspace-yaml.ts | 3 | 212 | 244 | exit 0, none survived | 1 | 161 s (2 min 41 s) |
| 19 | gates/stylelint/token-only.ts, packages/elements/src/index.ts, packages/styles/src/index.ts, packages/tokens/src/index.ts | 4 | 107 | 176 | exit 0, none survived | 0 | 201 s (3 min 21 s) |

All 19 shards exit 0 with no survivor. Together they take 3241 s (54 min 1 s). The longest is shard 14, the two
entries of `gates/lib/plant-judge.ts` (216 lines, 353 mutants), at 301 s (5 min 1 s). No shard came near the
10-minute limit here, so there is nothing to report under the limit.

For the operator: shard 14 holds the same 353 mutants as the shard that took 9:49 on GitHub run 41635769914. The
plan fills entries greedily, and T097 lets entries of one file share a shard. So the split creates entries of at
most 120 lines, but the shard of plant-judge.ts is unchanged (round-9-fixes.md, "Observations"). On GitHub's
runner it can be expected to take about as long as before. This sandbox ran it in 5:01.

Cut boundaries, measured on csp.ts, whose entries land in different shards (1 and 2):
`--files gates/bin/csp.ts` mutates 281 mutants. `csp.ts:1-120` (113) and `csp.ts:121-240,csp.ts:241-248` (166)
together mutate 279. The two that neither shard mutates span the cut at line 120/121:
`BlockStatement 113:68-123:2` (CompileError when run whole) and `BlockStatement 119:98-121:4` (Killed when run
whole).

## Round 10 fix (T098): one file's entries in separate shards

Measured on 2026-11-03 on the round 10 fix tree: red commit 9f712c8 plus the fix. The code is the same as in the
fix commit `fix(001-repository-foundation): phase 3 review round 10`. Same sandbox as above: 4 vCPU, Node 26.13.0,
pnpm 12.16.1, StrykerJS 10.1.1, `concurrency` 8, cold runs (`incremental` off). Base: bdb9b70, the pull request
base and the plan CI runs. The shards ran one after the other, never two at once, and no other mutation run or
tdd-check run was going at the same time.

```bash
pnpm run gate:mutation -- --base bdb9b70 --plan
pnpm run gate:mutation -- --base bdb9b70 --files "<the shard's files value>"   # once per shard, timed
```

Plan output on stdout (21 shards; no entry over 120 changed lines of one file, no shard over 10 entries or 250
changed lines, and no shard holding two entries of one file; the largest shard by lines is shard 9, 4 entries
and 241 lines, and by entries shard 21, 6 entries and 199 lines):

```json
[{"files":"gates/bin/config-copies.ts,gates/bin/csp.ts:1-120","lines":204},{"files":"gates/bin/csp.ts:121-240","lines":120},{"files":"gates/bin/csp.ts:241-248,gates/bin/lint.ts,gates/bin/mutation.ts:1-120","lines":152},{"files":"gates/bin/mutation.ts:121-195,gates/bin/pins.ts:1-120","lines":195},{"files":"gates/bin/pins.ts:121-157,gates/bin/plants.ts:1-120","lines":157},{"files":"gates/bin/plants.ts:121-233,gates/bin/prefix.ts","lines":230},{"files":"gates/bin/setup-offline.ts,gates/bin/signoff.ts","lines":221},{"files":"gates/bin/style-lint.ts,gates/bin/test-lint.ts,gates/bin/test.ts:1-120","lines":183},{"files":"gates/bin/test.ts:121-136,gates/bin/typecheck.ts,gates/eslint/no-snapshot-only.ts,gates/eslint/unchecked-expect.ts:1-120","lines":241},{"files":"gates/eslint/unchecked-expect.ts:121-140,gates/lib/cli.ts,gates/lib/entries.ts,gates/lib/eslint-report.ts","lines":211},{"files":"gates/lib/findings.ts,gates/lib/mutation/coverage.ts,gates/lib/mutation/ranges.ts:1-120","lines":195},{"files":"gates/lib/mutation/ranges.ts:121-131,gates/lib/mutation/records.ts,gates/lib/mutation/report.ts","lines":162},{"files":"gates/lib/mutation/shards.ts:1-120","lines":120},{"files":"gates/lib/mutation/shards.ts:121-166,gates/lib/pins-rules.ts:1-120","lines":166},{"files":"gates/lib/pins-rules.ts:121-137,gates/lib/plant-judge.ts:1-120","lines":137},{"files":"gates/lib/plant-judge.ts:121-216,gates/lib/plant-repo.ts:1-120","lines":216},{"files":"gates/lib/plant-repo.ts:121-237,gates/lib/plant-runner.ts","lines":203},{"files":"gates/lib/registry.ts:1-120","lines":120},{"files":"gates/lib/registry.ts:121-121,gates/lib/spawn.ts,gates/lib/stylelint-report.ts,gates/lib/tsc-report.ts","lines":222},{"files":"gates/lib/vitest-report.ts:1-120","lines":120},{"files":"gates/lib/vitest-report.ts:121-123,gates/lib/workspace-yaml.ts,gates/stylelint/token-only.ts,packages/elements/src/index.ts,packages/styles/src/index.ts,packages/tokens/src/index.ts","lines":199}]
```

On stderr:

```text
mutation: plan: 21 shards, 14 cuts within files (a mutant spanning a cut is mutated in no shard, see gates/README.md)
```

The 14 cuts: csp.ts 2, mutation.ts 1, pins.ts 1, plants.ts 1, test.ts 1, unchecked-expect.ts 1, ranges.ts 1,
shards.ts 1, pins-rules.ts 1, plant-judge.ts 1, plant-repo.ts 1, registry.ts 1, vitest-report.ts 1.

| Shard | Entries | Count | Changed lines | Mutants on changed lines | Result | Equivalent records | Duration |
|---|---|---|---|---|---|---|---|
| 1 | gates/bin/config-copies.ts, gates/bin/csp.ts:1-120 | 2 | 204 | 189 | exit 0, none survived | 2 | 122 s (2 min 2 s) |
| 2 | gates/bin/csp.ts:121-240 | 1 | 120 | 160 | exit 0, none survived | 6 | 137 s (2 min 17 s) |
| 3 | gates/bin/csp.ts:241-248, gates/bin/lint.ts, gates/bin/mutation.ts:1-120 | 3 | 152 | 115 | exit 0, none survived | 8 | 104 s (1 min 44 s) |
| 4 | gates/bin/mutation.ts:121-195, gates/bin/pins.ts:1-120 | 2 | 195 | 190 | exit 0, none survived | 9 | 121 s (2 min 1 s) |
| 5 | gates/bin/pins.ts:121-157, gates/bin/plants.ts:1-120 | 2 | 157 | 125 | exit 0, none survived | 8 | 100 s (1 min 40 s) |
| 6 | gates/bin/plants.ts:121-233, gates/bin/prefix.ts | 2 | 230 | 241 | exit 0, none survived | 28 | 149 s (2 min 29 s) |
| 7 | gates/bin/setup-offline.ts, gates/bin/signoff.ts | 2 | 221 | 210 | exit 0, none survived | 11 | 133 s (2 min 13 s) |
| 8 | gates/bin/style-lint.ts, gates/bin/test-lint.ts, gates/bin/test.ts:1-120 | 3 | 183 | 105 | exit 0, none survived | 28 | 77 s (1 min 17 s) |
| 9 | gates/bin/test.ts:121-136, gates/bin/typecheck.ts, gates/eslint/no-snapshot-only.ts, gates/eslint/unchecked-expect.ts:1-120 | 4 | 241 | 222 | exit 0, none survived | 10 | 133 s (2 min 13 s) |
| 10 | gates/eslint/unchecked-expect.ts:121-140, gates/lib/cli.ts, gates/lib/entries.ts, gates/lib/eslint-report.ts | 4 | 211 | 152 | exit 0, none survived | 5 | 102 s (1 min 42 s) |
| 11 | gates/lib/findings.ts, gates/lib/mutation/coverage.ts, gates/lib/mutation/ranges.ts:1-120 | 3 | 195 | 189 | exit 0, none survived | 0 | 190 s (3 min 10 s) |
| 12 | gates/lib/mutation/ranges.ts:121-131, gates/lib/mutation/records.ts, gates/lib/mutation/report.ts | 3 | 162 | 159 | exit 0, none survived | 1 | 150 s (2 min 30 s) |
| 13 | gates/lib/mutation/shards.ts:1-120 | 1 | 120 | 102 | exit 0, none survived | 0 | 130 s (2 min 10 s) |
| 14 | gates/lib/mutation/shards.ts:121-166, gates/lib/pins-rules.ts:1-120 | 2 | 166 | 357 | exit 0, none survived | 1 | 235 s (3 min 55 s) |
| 15 | gates/lib/pins-rules.ts:121-137, gates/lib/plant-judge.ts:1-120 | 2 | 137 | 197 | exit 0, none survived | 0 | 172 s (2 min 52 s) |
| 16 | gates/lib/plant-judge.ts:121-216, gates/lib/plant-repo.ts:1-120 | 2 | 216 | 381 | exit 0, none survived | 0 | 256 s (4 min 16 s) |
| 17 | gates/lib/plant-repo.ts:121-237, gates/lib/plant-runner.ts | 2 | 203 | 163 | exit 0, none survived | 40 | 78 s (1 min 18 s) |
| 18 | gates/lib/registry.ts:1-120 | 1 | 120 | 167 | exit 0, none survived | 0 | 222 s (3 min 42 s) |
| 19 | gates/lib/registry.ts:121-121, gates/lib/spawn.ts, gates/lib/stylelint-report.ts, gates/lib/tsc-report.ts | 4 | 222 | 210 | exit 0, none survived | 9 | 143 s (2 min 23 s) |
| 20 | gates/lib/vitest-report.ts:1-120 | 1 | 120 | 110 | exit 0, none survived | 1 | 126 s (2 min 6 s) |
| 21 | gates/lib/vitest-report.ts:121-123, gates/lib/workspace-yaml.ts, gates/stylelint/token-only.ts, packages/elements/src/index.ts, packages/styles/src/index.ts, packages/tokens/src/index.ts | 6 | 199 | 308 | exit 0, none survived | 0 | 224 s (3 min 44 s) |

All 21 shards exit 0 with no survivor. Together they take 3104 s (51 min 44 s). The longest is shard 16,
`gates/lib/plant-judge.ts:121-216` and `gates/lib/plant-repo.ts:1-120` (216 lines, 381 mutants), at 256 s
(4 min 16 s). No shard came near the 10-minute limit here, so there is nothing to report under the limit.

For the operator: `gates/lib/plant-judge.ts` is now in two shards, `:1-120` in shard 15 (with the last 17 lines of
pins-rules.ts, 197 mutants, 172 s) and `:121-216` in shard 16. The round 9 shard of plant-judge.ts alone had 353
mutants and took 301 s here. But shard 16 holds more mutants (381) than that shard did, because the second entry of
plant-judge.ts now shares its shard with the first entry of plant-repo.ts. Shard 14 (357 mutants) and shard 21
(308) are also over 300. The fill bounds entries, lines and lines of one file, not mutants. In this sandbox,
shard 16 took 256 s against the 301 s of the round 9 plant-judge.ts shard, which matches the research note that
time follows the mutants per file, not the total. Whether that holds on GitHub's runner is measured only by the CI
run of the pull request.
