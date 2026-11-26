# Plants of phase 6

- base: b5119f3ed400bb20bbc796932129973fac85e2c2
- hosted verdict: pnpm run gate:plants -- --verdict storybook/.visual/plant-shards
- exit: 0 (hosted aggregate)

```text
$ node gates/bin/plants.ts -- --affected b5119f3ed400bb20bbc796932129973fac85e2c2 --list
note: affected: every plant, by packages/elements/package.json (not mapped)
plants: affected since b5119f3ed400bb20bbc796932129973fac85e2c2: 317 of 317 plants selected, none judged (--list)
```

The hosted aggregate at `793f19b` passed all plants, covering the affected selection.

[Hosted Plants verdict](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/44990366919/job/137113808610)
