# Phase 2 phase-end gates and mutation shards (T025)

## Phase-end gates at `1ed4d04` (2026-11-14, this container, 4 CPUs, Chromium 153 build 1243)

| Gate | Result |
|---|---|
| `gate:unit-tests` | exit 0, "3456 tests passed in 152 files" in each of two runs (9:01 and 9:05 wall-clock; the probe of stop-1.md's follow-up among them) |
| `gate:typecheck` | exit 0, "no type error in the files of tsconfig.json" |
| `gate:lint` | exit 0, "300 files checked, no finding" |
| `gate:style-lint` | exit 0, "14 files checked, no finding" |
| `gate:test-lint` | exit 0, "208 files checked, no finding" |
| `gate:csp` | exit 0, "12 files checked, no finding" |
| `gate:prefix` | exit 0, "245 files checked, no finding" |
| `gate:contrast` | exit 0, "165 pairs checked in light, 173 in dark (154 required per theme)" |
| `gate:manifest` | exit 0, "3 elements checked, no finding"; `pnpm --filter @ocelle/elements run manifest` regenerates `custom-elements.json` with no diff |
| `gate:plants` (`OCELLE_VISUAL_ENGINE=docker`) | exit 0, "plants: 301 plants of 17 gates and the registry judged, every plant as expected", 64:44 wall-clock; the manifest plants each as expected (`break-missing`, `break-not-json`, `pass-reordered`, `pass-repository` and the eight `fail-*`) |
| `gate:mutation` | **exit 1** in 21 of 24 shards (run 1, below) |

## `gate:mutation`, run 1 (at `1ed4d04`)

`pnpm run gate:mutation -- --base 6c9400c --plan`: "24 shards, 23 cuts within files". Each shard run alone as
`pnpm run gate:mutation -- --base 6c9400c --files <entries>`, one after the other, timed as T002 timed its shard
(wall-clock from the command's start to its exit, in this container). Shards 1 to 9 hold a `packages/elements/src/live.ts`
entry.

| Shard | Entries | Wall-clock | Result |
|---|---|---|---|
| 1 | `gates/bin/contrast.ts,packages/elements/scripts/manifest.ts,packages/elements/src/define.ts,packages/elements/src/index.ts,packages/elements/src/live.ts:1-30` | 415.3 s (6:55.3) | exit 1 |
| 2 | `packages/elements/src/live.ts:31-60` | 216.7 s (3:36.7) | exit 0 |
| 3 | `packages/elements/src/live.ts:61-90` | 331.6 s (5:31.6) | exit 1 |
| 4 | `packages/elements/src/live.ts:91-120` | 347.8 s (5:47.8) | exit 1 |
| 5 | `packages/elements/src/live.ts:121-150` | 397.7 s (6:37.7) | exit 1 |
| 6 | `packages/elements/src/live.ts:151-180` | 365.0 s (6:05.0) | exit 1 |
| 7 | `packages/elements/src/live.ts:181-210` | 321.0 s (5:21.0) | exit 1 |
| 8 | `packages/elements/src/live.ts:211-240` | 333.4 s (5:33.4) | exit 1 |
| 9 | `packages/elements/src/live.ts:241-255,packages/elements/src/ocelle-notice.ts:1-30` | 374.6 s (6:14.6) | exit 1 |
| 10 | `packages/elements/src/ocelle-notice.ts:31-60` | 315.7 s (5:15.7) | exit 1 |
| 11 | `packages/elements/src/ocelle-notice.ts:61-90` | 416.5 s (6:56.5) | exit 1 |
| 12 | `packages/elements/src/ocelle-notice.ts:91-120` | 182.1 s (3:02.1) | exit 0 |
| 13 | `packages/elements/src/ocelle-notice.ts:121-150` | 181.4 s (3:01.4) | exit 0 |
| 14 | `packages/elements/src/ocelle-notice.ts:151-180` | 205.1 s (3:25.1) | exit 0 |
| 15 | `packages/elements/src/ocelle-notice.ts:181-210` | 327.1 s (5:27.1) | exit 1 |
| 16 | `packages/elements/src/ocelle-notice.ts:211-240` | 309.7 s (5:09.7) | exit 1 |
| 17 | `packages/elements/src/ocelle-notice.ts:241-270` | 284.5 s (4:44.5) | exit 0 |
| 18 | `packages/elements/src/ocelle-notice.ts:271-300` | 336.9 s (5:36.9) | exit 1 |
| 19 | `packages/elements/src/ocelle-notice.ts:301-330` | 333.9 s (5:33.9) | exit 1 |
| 20 | `packages/elements/src/ocelle-notice.ts:331-360` | 446.5 s (7:26.5) | exit 1 |
| 21 | `packages/elements/src/ocelle-notice.ts:361-390` | 333.9 s (5:33.9) | exit 1 |
| 22 | `packages/elements/src/ocelle-notice.ts:391-420` | 376.4 s (6:16.4) | exit 1 |
| 23 | `packages/elements/src/ocelle-notice.ts:421-450` | 270.1 s (4:30.1) | exit 1 |
| 24 | `packages/elements/src/ocelle-notice.ts:451-480,packages/tokens/src/source.ts` | 411.3 s (6:51.3) | exit 1 |

The largest `src/live.ts` shard is shard 1, 415.3 s (6:55.3), under the 420 s stop; no `src/live.ts` shard is over 7:00.
Shard 20 (`ocelle-notice.ts:331-360`, no `src/live.ts` entry) took 446.5 s (7:26.5): over 7:00 but not a stop under
tasks.md (the stop names shards that hold a `src/live.ts` entry), and under the CI job's 10-minute limit.

Run 1's mutants on the changed lines: 632, of them 165 compile errors, 3 timeouts, **108 survived and 20 without
coverage** (score 72.6 % of the 467 valid mutants; the gate needs 100 %). The survivors are in `define.ts` (1),
`live.ts` (29) and `ocelle-notice.ts` (98, the no-coverage ones among them). Most are guards that the end-of-wait
re-check or the region's `aria-live="off"` backs up, so the scenarios' counts do not see them, and rules no in-process
test reaches (the property setters, the text of an `img`, a comment or a hidden child, `alert()` while waiting).
