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
