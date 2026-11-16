# Phase 4: quickstart run on the whole mission (T055)

Run at `d2b6a93` (branch `claude/013-data-display`, the mission's three phases folded), one heavy job at a time, with
`OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` and `OCELLE_VISUAL_ENGINE=docker`
(docker, daemon as root; no podman in this container). Exempt: runs existing tests and gates, changes no source,
test or baseline (`tdd-exempt.md`). Every command exited 0.

| Step | Command | Summary line |
|---|---|---|
| 1 | `pnpm --filter @ocelle/elements run build`, `… run manifest`, `git diff --exit-code packages/elements/custom-elements.json` | build and manifest exit 0; the manifest is unchanged against the commit |
| 2 | `pnpm exec vitest run --project elements` | `Test Files 19 passed (19)`, `Tests 241 passed (241)` |
| 3 | `pnpm exec vitest run --project elements-browser` | `Test Files 8 passed (8)`, `Tests 217 passed (217)` |
| 4 | `pnpm exec vitest run --project styles --project styles-browser` | `Test Files 10 passed (10)`, `Tests 166 passed (166)` |
| 4 | `pnpm exec vitest run --project elements-node --project elements-build` | `Test Files 7 passed (7)`, `Tests 294 passed (294)` |
| 5 | `pnpm -r run build` (before `gate:csp`) | exit 0 |
| 5 | `pnpm run gate:contrast` | `contrast: 160 pairs checked in light, 168 in dark (149 required per theme)` |
| 5 | `pnpm run gate:style-lint` | `style-lint: 16 files checked, no finding` |
| 5 | `pnpm run gate:prefix` | `prefix: 256 files checked, no finding` |
| 5 | `pnpm run gate:csp` | `csp: 21 files checked, no finding` |
| 5 | `pnpm run gate:manifest` | `manifest: 6 elements checked, no finding` |
| 5 | `pnpm run gate:test-lint` | `test-lint: 202 files checked, no finding` |
| 5 | `pnpm run gate:mutation -- --base b5c335c` (the phase base) | `mutation: nothing to mutate: no package or gate source line changed since b5c335c` |
| 5 | `pnpm run gate:mutation -- --base 3828d2f` (the mission base, `main`) | `mutation: 628 mutants on the changed lines of 6 files, none survived; 2 timeouts, 161 compile errors, 1 zero-mutant entry; 26 equivalent records` |
| 5 | `pnpm run gate:plants -- --shard <k>`, k = 1 to 28, then `-- --verdict storybook/.visual/plant-shards` | each shard `every plant as expected`; verdict `plants: 308 plants of 17 gates and the registry judged, every plant as expected` |
| 6 | `pnpm run gate:storybook-build` (builds the Storybook) | `storybook-build: built 61 stories` |
| 6 | `pnpm exec vitest run --project storybook-integration` | `Test Files 2 passed (2)`, `Tests 230 passed (230)` |
| 7 | `pnpm run gate:visual` | `visual: 122 captures match their baselines (docker only: no cross-engine comparison)`; no `missing-baseline` or `stray-baseline` line |
| 7 | `pnpm run gate:axe` | `axe: 122 story-theme runs, 0 serious or critical; 10 notes (0 incomplete, 10 excepted)` |

Also run as the phase's fast checks: `gate:typecheck` (`typecheck: no type error in the files of tsconfig.json`) and
`gate:lint` (`lint: 296 files checked, no finding`).

**Notes.**

- **The plants.** The unsharded `gate:plants` ran first without `OCELLE_VISUAL_ENGINE` and exited 2 (`no container
  engine for 46 visual plants`). Rerun with the engine set, it was stopped by the 2 h job limit after 288 of 308
  plants, none of them failing. It was then run as CI runs it: the 28 shards of `--plan` one after another and the
  verdict on their reports. Before that, four stale shard reports of an earlier run were moved out of the ignored
  `storybook/.visual/plant-shards/`.
- **The axe notes.** All 10 excepted notes are `base-styles--prose-document`'s (mission 003's table scroll box, the
  existing entries of `storybook/a11y-exceptions.json`). No note is on a facts, empty-state or progress story, and
  the exceptions file has no entry for them.
- **The mission's stories.** `storybook/baselines/` holds 40 facts, empty-state and progress stories, each with a
  light and a dark baseline. Each of them is among the 122 captures that match and the 122 axe runs.
- **The mutation run** also ran on the mission base, since the phase base has no source change. Its timeouts and
  compile errors are report lines that pass (#23).
