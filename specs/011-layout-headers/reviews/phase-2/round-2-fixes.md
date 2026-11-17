# Phase 2, review round 2: fixes

Resolved under operator decision 4 (`reviews/operator-decisions-implementation.md`), which supersedes decisions 2 and
3: a container engine is available (docker 29.9.2, `dockerd` started as root; podman is absent).

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| R2-01 | fixed: the baselines the phase owes were made in #10's pinned container as #10 designed, `pnpm run visual:update -- --engine docker`: "baselines: wrote 28 files (24 added, 4 changed, 0 removed), 1222656 bytes in total". Added: the twelve new story-themes' 24 PNGs (`elements-ocelle-section-header--{compact,empty-heading,eyebrow-variant,filled,heading-only,long-heading}` and `elements-ocelle-card--{compact,inset,inset-compact,nested,no-header,regular}`, light and dark). Changed: `tokens--colour` and `tokens--type`, light and dark, which list the four eyebrow tokens. No other baseline changed, so phase 1 owes none and there is no unexpected PNG to report. The visual plant `fail-token-changed` gains the eleven new light story-themes that show `color-ink` (all but `elements-ocelle-section-header--empty-heading`), as the pinned container measured them; no other visual plant needed a change. T023 is ticked. | The existing red of `visual.test.ts:239` at HEAD `9b8eab6`: `expected 42 to be 66` (42 baselines for 66 story-themes). One test also counts the repository's baselines, `gates/test/integration/plant-repo.test.ts:225` ("copies storybook/baselines when the repository holds it", `toHaveLength(42)`); it went red with the new baselines, so its count was changed test-first: `fix-2` 540f43f (42 to 66, tests only), recorded by `red.sh 2 fix-2` (`red-fix-2.log`: 4 of 3304 failed with the engine running, `plant-repo.test.ts:218` "expected [ …(42) ] to have a length of 66 but got 42", `visual.test.ts:115` and `:126` on the 28 missing-baseline findings, `:239` on `expected 42 to be 66`; 251 and 271 pass once an engine is there). The assertion is as strong as before. | storybook/baselines/ (28 files); gates/plants/visual/fail-token-changed/plant.json; gates/test/integration/plant-repo.test.ts (fix-2); tasks.md T023 |
| R2-02 | note, not for the implementer (orchestrator sign-off of 1b9cc98 and 671196d). The fix-round commit is signed off. | none | — |
| R2-03 | note, not for the implementer: research.md R-04 is a planner change and is not touched here. | none | — |
| R2-04 | superseded by the R2-01 fix: T023's baselines are in and T023 is ticked. | none | — |

No cross-engine comparison was possible: podman is absent here, so `gate:visual` ran under docker alone ("docker only:
no cross-engine comparison"). CI, which runs the gate under both docker and podman, confirms these baselines at
landing.

## Checks at the fix

OCELLE_CHROMIUM_PATH set to Chromium 1243; docker 29.9.2 as the engine.

| Check | Result |
|---|---|
| `pnpm run visual:update -- --engine docker` | exit 0: wrote 28 files (24 added, 4 changed, 0 removed) |
| `pnpm run gate:visual -- --engine docker` | exit 0: "visual: 66 captures match their baselines (docker only: no cross-engine comparison)" |
| `node gates/bin/plants.ts` (no `--skip-container`, `OCELLE_VISUAL_ENGINE=docker`), before the plant change | exit 1: "1 problem in 301 plants", only `visual/fail-token-changed` (the eleven unexpected `differs` lines above); every other plant, the 48 visual plants included, as expected |
| `node gates/bin/plants.ts --shard 16` (`visual/fail-token-changed`, `fail-websocket`, `fail-xhr`) after the plant change | exit 0: "3 plants judged, every plant as expected" |
| `node gates/bin/plants.ts` (no `--skip-container`, `OCELLE_VISUAL_ENGINE=docker`) at the fix | exit 0: "301 plants of 17 gates and the registry judged, every plant as expected" (the 48 visual plants included) |
| `pnpm test` (dockerd running) | exit 0: "3304 tests passed in 149 files", the five container-engine tests of `visual.test.ts` (115, 126, 239, 251, 271) among them |
| `gate:typecheck`, `gate:lint` (283 files), `gate:test-lint` (189 files), `gate:prefix` (245 files), `gate:pins`, `gate:config-copies` | pass |

The plants job probes `OCELLE_VISUAL_ENGINE`, default `both`; with podman absent, a run without
`OCELLE_VISUAL_ENGINE=docker` reports "no container engine for 46 visual plants", so the runs above set it.
