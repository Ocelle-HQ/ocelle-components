# Phase 3 plant run (review round 3 fix, T041d)

Run on 2026-11-17 in this container (Chromium 153 build 1243 through `OCELLE_CHROMIUM_PATH`, `OCELLE_VISUAL_ENGINE=docker`
with dockerd running), on the fix's working tree, which is the fix commit's tree. The base is `cc139254`, the parent of
the red commit `d260a95f` (T041d). The run before this one, at `b76d4ee` (T040), is in this file's history.

## The affected run, stopped at the tool's limit

`pnpm run gate:plants -- --affected cc139254c8c694d6868bb64f18575d134648eb8f` selected every plant:
"note: affected: every plant, by packages/elements/custom-elements-manifest.config.mjs (not mapped)". The config is a
path the selection does not map, so the whole set runs. The run was stopped at the 2-hour limit of the agent's
background jobs, after 262 plant timings. There was no exit line and no plant summary, so it is not the gate's evidence.
Its log has no line other than the command line, the `affected` note and plant timings. The visual plants took 215 to
252 s each.

## The same set, as CI runs it: 28 shards and the verdict

"Every plant" is also what the gate's sharded mode judges. So the same set was run the way CI's `plants-shard` and
`plants` jobs run it. The only difference is the engine: `docker` here, `both` in CI.

- `pnpm run gate:plants -- --plan` gave `[1, …, 28]`.
- `pnpm run gate:plants -- --shard <n>` ran for each n from 1 to 28, one at a time. Older reports were moved out of
  `storybook/.visual/plant-shards/` first, so the directory held only this run's 28 reports.
- Each shard exited 0 with "plants: shard n of 28: … judged, every plant as expected". Together they took 13831 s
  (3:50:31). The longest shard took 783 s (shard 16).
- `pnpm run gate:plants -- --verdict storybook/.visual/plant-shards` then gave **exit 0**: "plants: 309 plants of 17
  gates and the registry judged, every plant as expected".

## The manifest plants

This fix regenerated these plants' copies of `custom-elements.json` (round-3-fixes.md). Each one is as expected:
`break-missing`, `break-not-json`, `pass-reordered`, `pass-repository`, and the eight `fail-*`. The fail plants are
`fail-lost-attribute`, `fail-stale-property` and the six `fail-undescribed-*`.
