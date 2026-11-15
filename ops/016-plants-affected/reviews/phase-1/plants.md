# Plants of phase 1

- base: 80ea82594a0d29800fc692a87041dbadabdd20a2
- command: pnpm run gate:plants -- --affected 80ea82594a0d29800fc692a87041dbadabdd20a2 --list
- exit: 0

```text
$ node gates/bin/plants.ts -- --affected 80ea82594a0d29800fc692a87041dbadabdd20a2 --list
note: affected: every plant, by gates/bin/plants.ts (shared gate source)
plants: affected since 80ea82594a0d29800fc692a87041dbadabdd20a2: 302 of 302 plants selected, none judged (--list)
```

This phase changes shared gate source, so the selection is the full set (the first such path in sorted order is
`gates/bin/plants.ts`; `gates/lib/plant-runner.ts` and `gates/lib/registry.ts` would select it too). The full set
was judged as tasks.md T017 asks: `--plan` (28 shards), then `--shard k` for k = 1 to 28 one at a time, then the
verdict. Shards 1 to 3 and 20 to 28 ran with the default engine; shards 4 to 19 (the visual plants) first exited 2
for want of podman (`both` engines; the container has docker only) and were run again with
`OCELLE_VISUAL_ENGINE=docker`, each exiting 0. `plants/fail-affected-in-plant-check` is in shard 2's report, judged
as expected (caught).

## Verdict

- command: pnpm --silent run gate:plants -- --verdict storybook/.visual/plant-shards
- exit: 0

```text
plants: 302 plants of 17 gates and the registry judged, every plant as expected
```
