# Phase 5 mutation shard timing (T071, O6-01: entries of 60 changed lines)

Measured on 2026-11-05 at commit 3d9d674 (the round-6 fix, `maxEntryLines = 60`), working tree clean, one run at a
time, nothing else running. Environment: this cloud sandbox, 4 vCPU, Node 22.23.4, pnpm 12.16.1, Stryker with its
default concurrency, Chromium from `PLAYWRIGHT_BROWSERS_PATH`. Every run is cold. This is not the GitHub runner of
the CI limit; on it the old 120-line shard `packages/tokens/src/generate.ts:121-240` (264 mutants) took over 600 s
(cancelled at 10:21 on run 41930740532), and 670 s locally.

Commands, with `B=eaf16896ec10affdca24296fc9531fcffc46a8be` (the branch base):

```bash
pnpm run gate:mutation -- --base $B --plan
pnpm run gate:mutation -- --base $B --files <the shard's files>   # once per shard, timed with date +%s
```

Plan (stderr: `mutation: plan: 24 shards, 23 cuts within files`); no `path:start-end` entry holds more than 60
changed lines, and a whole entry is a file of at most 60:

```json
[{"files":"gates/bin/brand-rules.ts:1-60","lines":60},{"files":"gates/bin/brand-rules.ts:61-120","lines":60},{"files":"gates/bin/brand-rules.ts:121-180","lines":60},{"files":"gates/bin/brand-rules.ts:181-240","lines":60},{"files":"gates/bin/brand-rules.ts:241-266,gates/bin/contrast.ts:1-60","lines":86},{"files":"gates/bin/contrast.ts:61-117,gates/bin/csp.ts,gates/bin/mutation.ts,gates/bin/plants.ts,gates/bin/prefix.ts,gates/lib/mutation/ranges.ts,gates/lib/mutation/shards.ts,gates/lib/plant-judge.ts,gates/lib/plant-repo.ts:2-188","lines":199},{"files":"gates/lib/plant-repo.ts:189-248","lines":60},{"files":"gates/lib/plant-repo.ts:249-338","lines":60},{"files":"gates/lib/plant-repo.ts:339-390,gates/lib/plant-runner.ts:3-86","lines":109},{"files":"gates/lib/plant-runner.ts:87-134,gates/lib/registry.ts,gates/lib/token-source.ts:1-60","lines":80},{"files":"gates/lib/token-source.ts:61-120","lines":60},{"files":"gates/lib/token-source.ts:121-180","lines":60},{"files":"gates/lib/token-source.ts:181-224,gates/lib/wcag.ts,gates/stylelint/token-lists.ts:1-60","lines":130},{"files":"gates/stylelint/token-lists.ts:61-106,gates/stylelint/token-only.ts,packages/tokens/scripts/build.ts:1-60","lines":164},{"files":"packages/tokens/scripts/build.ts:61-62,packages/tokens/src/generate.ts:1-60","lines":62},{"files":"packages/tokens/src/generate.ts:61-120","lines":60},{"files":"packages/tokens/src/generate.ts:121-180","lines":60},{"files":"packages/tokens/src/generate.ts:181-240","lines":60},{"files":"packages/tokens/src/generate.ts:241-300,packages/tokens/src/index.ts,packages/tokens/src/overrides.ts,packages/tokens/src/source.ts:1-60","lines":146},{"files":"packages/tokens/src/source.ts:61-120","lines":60},{"files":"packages/tokens/src/source.ts:121-180","lines":60},{"files":"packages/tokens/src/source.ts:181-216,storybook/.storybook/main.ts,storybook/.storybook/manager.ts,storybook/.storybook/preview.ts,storybook/scripts/externalise.ts:1-60","lines":153},{"files":"storybook/scripts/externalise.ts:61-120","lines":60},{"files":"storybook/scripts/externalise.ts:121-141,storybook/scripts/swatches.ts,storybook/stories/render.ts","lines":88}]
```

The shards holding `packages/tokens/src/generate.ts` entries (shard numbers count from 1 in the plan):

| Shard | Files | Changed lines | Mutants on changed lines | Result | Equivalent records | Duration |
|---|---|---|---|---|---|---|
| 15 | packages/tokens/scripts/build.ts:61-62, packages/tokens/src/generate.ts:1-60 | 62 | 11 | exit 0, none survived | 1 | 78 s (1 min 18 s) |
| 16 | packages/tokens/src/generate.ts:61-120 | 60 | 87 | exit 0, none survived | 0 | 215 s (3 min 35 s) |
| 17 | packages/tokens/src/generate.ts:121-180 | 60 | 157 | exit 0, none survived | 1 | 207 s (3 min 27 s) |
| 18 | packages/tokens/src/generate.ts:181-240 | 60 | 104 | exit 0, none survived | 1 | 155 s (2 min 35 s) |
| 19 | packages/tokens/src/generate.ts:241-300, packages/tokens/src/index.ts, overrides.ts, source.ts:1-60 | 146 | 79 | exit 0, none survived | 0 | 231 s (3 min 51 s) |

The heaviest by mutants is shard 17 (157 mutants, 207 s); the longest is shard 19 (231 s). Every shard is under 600
s locally, the longest at 39 % of the limit. Shards 17 and 18 split the old 121-240 shard: 157 + 104 = 261 mutants
against its 264, in 362 s together against its 670 s; the 3 fewer are most likely mutants spanning the new cut at
180/181, mutated in no shard (O10-02, an accepted limit, gates/README.md), not checked one by one here. The equivalent
records: shard 15 prints the one on packages/tokens/scripts/build.ts:61, shards 17 and 18 the one on
packages/tokens/src/generate.ts:180. Shards 1 to 14 and 20 to 24 were not timed here; they hold no generate.ts line.
