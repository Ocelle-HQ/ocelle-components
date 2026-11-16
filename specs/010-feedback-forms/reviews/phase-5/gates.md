# Phase 5 phase-end gates

Run in this container (Chromium 153 build 1243 through `OCELLE_CHROMIUM_PATH`; docker 29.9.2 with the pinned image
`mcr.microsoft.com/playwright@sha256:ee15712262f017b8157421b212b12099146645f44b1bc5c0514cbbe6a229b1d0` present;
`OCELLE_VISUAL_ENGINE=docker`), one job at a time, on 2026-11-16, at `8a88bcd` (the green commit; the records after it
change only `specs/`).

| Gate | Result |
|---|---|
| `gate:storybook-build` | exit 0, "storybook-build: built 51 stories" |
| `gate:visual -- --engine docker` | exit 0, "visual: 102 captures match their baselines (docker only: no cross-engine comparison)" |
| `gate:axe` | exit 0, "axe: 102 story-theme runs, 0 serious or critical; 10 notes (0 incomplete, 10 excepted)"; the ten notes are the Prose document's excepted `color-contrast-incomplete` nodes, as before; none on a phase 5 story |
| `gate:unit-tests` | exit 0, "unit-tests: 4005 tests passed in 161 files" (the 91 new story tests and the 7 changed gate tests included) |
| `gate:typecheck` | exit 0, "no type error in the files of tsconfig.json" |
| `gate:lint` | exit 0, "323 files checked, no finding" |
| `gate:style-lint` | exit 0, "18 files checked, no finding" |
| `gate:test-lint` | exit 0, "227 files checked, no finding" |
| `gate:csp` | exit 0, "23 files checked, no finding" (no package source changed in phase 5; the packages' build is the one of phase 4's source) |
| `gate:prefix` | exit 0, "292 files checked, no finding" (the stories' wrapper elements are `ocelle-story-focus-input` and `ocelle-story-focus-select`) |
| `gate:contrast` | exit 0, "165 pairs checked in light, 173 in dark (154 required per theme)" |
| `gate:manifest` | exit 0, "manifest: 5 elements checked, no finding" |
| `gate:config-copies` | exit 0, the two `story-config.yml` copies identical |
| `gate:pins` | exit 0, "5 manifests checked, no finding" |
| `gate:brand-rules` | exit 0, "7 rules checked" |
| `gate:signoff -- --range 77dfda1..HEAD` | exit 0, "signoff: 8 commits checked, no finding" (at `8a88bcd`) |
| `gate:mutation -- --base 77dfda1` (whole diff) | exit 0, "mutation: nothing to mutate: no package or gate source line changed since 77dfda1": the phase's diff holds story files, test files, baselines and records only; story files are outside the mutation scope (`gates/lib/mutation/ranges.ts`, `**/*.stories.ts` excluded) |
| `gate:plants` (`OCELLE_VISUAL_ENGINE=docker`) | **exit 1, "plants: 2 problems in 301 plants"**: `storybook-build/fail-empty-index` and `visual/fail-token-changed` not caught. See `plants.md` and `stop-2.md` |

### After the operator's decision on stop 2 (at `84bfbfe`)

| Gate | Result |
|---|---|
| `gate:plants` (`OCELLE_VISUAL_ENGINE=docker`; shards 1 and 16 rerun, then the verdict over all 28) | exit 0, "plants: 301 plants of 17 gates and the registry judged, every plant as expected" (`plants.md`) |
| `gate:unit-tests` | exit 0, "unit-tests: 4005 tests passed in 161 files" |
| `gate:signoff -- --range 77dfda1..HEAD` | exit 0, "signoff: 11 commits checked, no finding" (at `84bfbfe`) |

## Timing

The single `gate:plants` run (all plants in one process) was stopped by its 7000 s time limit (started 09:33:46 UTC,
stopped 11:30:26 UTC) with no verdict: each visual plant now captures the repository's 102 story-themes (42 before), so
a visual plant takes 136 to 192 s instead of the 60-odd s of phase 4. The plants were then run as CI runs them, shard by
shard (`--shard 1` to `--shard 28`, one after the other) and judged with `--verdict storybook/.visual/plant-shards`;
the visual shards took 396 to 456 s each, the axe shards 256 to 274 s, about 2 h 15 min in all (`plants.log`).
