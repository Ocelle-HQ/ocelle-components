# Phase 4 mutation shard timing (T083, as T050; SC-005)

Measured on 2026-11-03 at commit 8d839cc (phase 4 green, before T083), working tree clean, shards run one after the
other.

Environment: this cloud sandbox, 4 vCPU (Intel Xeon @ 2.80GHz), Node 26.13.0, pnpm 12.16.1, StrykerJS 10.1.1 with
its default concurrency, `OCELLE_CHROMIUM_PATH` set to the preinstalled headless Chromium (research.md R-03).
Every run is cold: `incremental` is off. This is not the runner of SC-001 (GitHub Actions); that measurement is the
operator's (quickstart step 12).

Commands, with `B=$(cat specs/001-repository-foundation/reviews/phase-1/base.sha)` (706b5a1):

```bash
pnpm run gate:mutation -- --base $B --plan
pnpm run gate:mutation -- --base $B --files <the shard's files>   # once per shard, timed
```

Plan output:

```json
[{"files":"gates/bin/config-copies.ts,gates/bin/csp.ts,gates/bin/lint.ts","lines":347},{"files":"gates/bin/mutation.ts,gates/bin/pins.ts","lines":496},{"files":"gates/bin/plants.ts","lines":464},{"files":"gates/bin/prefix.ts,gates/bin/setup-offline.ts,gates/bin/signoff.ts,gates/bin/style-lint.ts,gates/bin/test-lint.ts","lines":395},{"files":"gates/bin/test.ts,gates/bin/typecheck.ts,gates/eslint/no-snapshot-only.ts,gates/eslint/unchecked-expect.ts,gates/lib/cli.ts","lines":461},{"files":"gates/lib/eslint-report.ts,gates/lib/findings.ts,gates/lib/mutation/ranges.ts,gates/lib/mutation/records.ts,gates/lib/mutation/report.ts,gates/lib/mutation/shards.ts","lines":408},{"files":"gates/lib/plant-repo.ts,gates/lib/registry.ts,gates/lib/spawn.ts,gates/lib/stylelint-report.ts","lines":476},{"files":"gates/lib/tsc-report.ts,gates/lib/vitest-report.ts,gates/stylelint/token-only.ts,packages/elements/src/index.ts,packages/styles/src/index.ts,packages/tokens/src/index.ts","lines":313}]
```

| Shard | Files | Changed lines | Mutants on changed lines | Result | Equivalent records | Duration |
|---|---|---|---|---|---|---|
| 1 | gates/bin/config-copies.ts, csp.ts, lint.ts | 347 | 384 | exit 1, 20 findings (csp.ts) | 15 | 261 s (4 min 21 s) |
| 2 | gates/bin/mutation.ts, pins.ts | 496 | 814 | exit 1, 94 findings (pins.ts) | 16 | 592 s (9 min 52 s) |
| 3 | gates/bin/plants.ts | 464 | 553 | exit 1, 33 findings | 43 | 433 s (7 min 13 s) |
| 4 | gates/bin/prefix.ts, setup-offline.ts, signoff.ts, style-lint.ts, test-lint.ts | 395 | 390 | exit 1, 14 findings (prefix 4, signoff 6, style-lint 4) | 32 | 128 s (2 min 8 s) |
| 5 | gates/bin/test.ts, typecheck.ts, gates/eslint/no-snapshot-only.ts, unchecked-expect.ts, gates/lib/cli.ts | 461 | 358 | exit 0, none survived | 27 | 143 s (2 min 23 s) |
| 6 | gates/lib/eslint-report.ts, findings.ts, mutation/ranges.ts, records.ts, report.ts, shards.ts | 408 | 410 | exit 0, none survived | 2 | 186 s (3 min 6 s) |
| 7 | gates/lib/plant-repo.ts, registry.ts, spawn.ts, stylelint-report.ts | 476 | 615 | exit 1, 51 findings (plant-repo 29, registry 15, stylelint-report 7) | 57 | 192 s (3 min 12 s) |
| 8 | gates/lib/tsc-report.ts, vitest-report.ts, gates/stylelint/token-only.ts, packages/{elements,styles,tokens}/src/index.ts | 313 | 393 | exit 1, 46 findings (tsc-report 11, token-only 35) | 1 | 178 s (2 min 58 s) |

Every finding line is in `mutation-shards.log` in this directory (one section per shard, with the records).

## For the operator

- **Timing**: no shard exceeded the 10-minute limit of FR-013, but shard 2 (`gates/bin/mutation.ts` and
  `gates/bin/pins.ts`, 496 changed lines, 814 mutants) took 592 s, 8 s under it, on 4 vCPU. A CI runner with fewer
  or slower cores could exceed `timeout-minutes: 10` on that shard. The shard bound is 500 lines (FR-013); pins.ts
  has many mutants per line (regular expressions, YAML parsing). This is reported as T050 asks for shards over 10
  minutes, since it is within 2 % of the limit.
- **Survivors**: 258 findings (Survived or NoCoverage on changed lines) in phase 4 source: csp.ts 20, pins.ts 94,
  plants.ts 33, prefix.ts 4, signoff.ts 6, style-lint.ts 4, plant-repo.ts 29, registry.ts 15, stylelint-report.ts 7,
  tsc-report.ts 11, token-only.ts 35. Phase 2 and 3 source (shards 5 and 6) has none. Of plants.ts's 33, 8 were
  NoCoverage on the plant runner's process boundary lines whose records did not reach them (multi-line statements);
  commit 7fbecda restructures the runner so each boundary line carries its record, and a re-run of that file alone
  (`mutation-plants-after-7fbecda.log`, 7 min 13 s) reports 25 findings, all in the decision part. Constitution
  VIII makes each remaining survivor a blocking review finding until a killing test (or a reasoned equivalent
  record) resolves it; they are left to the phase 4 review.


## Review round 1 (fixes, 2026-11-03)

Measured at the last fix commit (`e4d14f9`), working tree clean, shards one after the other, same sandbox (4 vCPU),
now with `concurrency: 8` and `vitest.related: false` in stryker.config.json (round-1-fixes.md, R1-02 and R1-10).

What a shard's time depends on (R1-02): Stryker's TypeScript checker, not the test runs. On `gates/bin/pins.ts` lines
38-110 (206 mutants) one run took 197 s with the checker and 15 s without it. The checker checks the mutants of one
file one at a time and groups mutants of files that do not import each other, so a shard of one large file was the
slowest case (`gates/bin/pins.ts` alone: 642 mutants, 10 min 10 s). With pins.ts split into three modules and twice as
many checker processes as cores, the same code takes about 2 minutes. The shard bound (FR-013, research.md R-08) is
unchanged.

Against the phase base (`base.sha`, 4df12b0), `pnpm run gate:mutation -- --base <sha> --plan`, then each shard with
`--files` (log: `round-1-mutation-phase-base.log`):

| Shard | Files | Mutants on changed lines | Result | Equivalent records | Duration |
|---|---|---|---|---|---|
| 1 | gates/bin/csp.ts, gates/bin/lint.ts, gates/bin/mutation.ts, gates/bin/pins.ts | 465 | exit 0, none survived | 22 | 216 s (3 min 36 s) |
| 2 | gates/bin/plants.ts, gates/bin/prefix.ts, gates/bin/signoff.ts | 452 | exit 0, none survived | 32 | 162 s (2 min 42 s) |
| 3 | gates/bin/style-lint.ts, gates/bin/test.ts, gates/bin/typecheck.ts, gates/lib/entries.ts, gates/lib/mutation/coverage.ts, gates/lib/pins-rules.ts, gates/lib/plant-judge.ts | 656 | exit 0, none survived | 17 | 244 s (4 min 4 s) |
| 4 | gates/lib/plant-repo.ts, gates/lib/plant-runner.ts, gates/lib/registry.ts | 531 | exit 0, none survived | 40 | 219 s (3 min 39 s) |
| 5 | gates/lib/stylelint-report.ts, gates/lib/tsc-report.ts, gates/lib/workspace-yaml.ts, gates/stylelint/token-only.ts | 497 | exit 0, none survived | 1 | 217 s (3 min 37 s) |

Against the pull request's base (`bdb9b70`, the base of the CI sign-off range of run 41565348139; its plan is the CI
plan of this pull request, 9 shards; log: `round-1-mutation-pr-base.log`):

| Shard | Files | Mutants on changed lines | Result | Equivalent records | Duration |
|---|---|---|---|---|---|
| 1 | gates/bin/config-copies.ts, gates/bin/csp.ts, gates/bin/lint.ts | 375 | exit 0, none survived | 16 | 204 s (3 min 24 s) |
| 2 | gates/bin/mutation.ts, gates/bin/pins.ts | 318 | exit 0, none survived | 16 | 124 s (2 min 4 s) |
| 3 | gates/bin/plants.ts, gates/bin/prefix.ts, gates/bin/setup-offline.ts | 394 | exit 0, none survived | 37 | 147 s (2 min 27 s) |
| 4 | gates/bin/signoff.ts, gates/bin/style-lint.ts, gates/bin/test-lint.ts, gates/bin/test.ts, gates/bin/typecheck.ts, gates/eslint/no-snapshot-only.ts | 357 | exit 0, none survived | 41 | 132 s (2 min 12 s) |
| 5 | gates/eslint/unchecked-expect.ts, gates/lib/cli.ts, gates/lib/entries.ts, gates/lib/eslint-report.ts, gates/lib/findings.ts, gates/lib/mutation/coverage.ts, gates/lib/mutation/ranges.ts | 402 | exit 0, none survived | 5 | 159 s (2 min 39 s) |
| 6 | gates/lib/mutation/records.ts, gates/lib/mutation/report.ts, gates/lib/mutation/shards.ts, gates/lib/pins-rules.ts | 477 | exit 0, none survived | 2 | 225 s (3 min 45 s) |
| 7 | gates/lib/plant-judge.ts, gates/lib/plant-repo.ts | 634 | exit 0, none survived | 40 | 246 s (4 min 6 s) |
| 8 | gates/lib/plant-runner.ts, gates/lib/registry.ts, gates/lib/spawn.ts, gates/lib/stylelint-report.ts, gates/lib/tsc-report.ts | 431 | exit 0, none survived | 10 | 212 s (3 min 32 s) |
| 9 | gates/lib/vitest-report.ts, gates/lib/workspace-yaml.ts, gates/stylelint/token-only.ts, packages/elements/src/index.ts, packages/styles/src/index.ts, packages/tokens/src/index.ts | 420 | exit 0, none survived | 1 | 181 s (3 min 1 s) |

Every shard exits 0 with no survivor. The longest local shard takes 246 s (4 min 6 s), against 592 s for the
cancelled CI shard's files before the fixes. The CI runner (ubuntu-24.04) is the measurement of SC-001/SC-005; the
cancelled shard ran there about as long as here (9 min 48 s against 9 min 52 s), so these timings leave a margin of
more than half the 10-minute limit.
