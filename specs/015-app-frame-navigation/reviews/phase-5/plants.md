# Plants of phase 5

- base: f2d1465abcc2983905a8b765879da7b038c07572
- hosted verdict: pnpm run gate:plants -- --verdict storybook/.visual/plant-shards
- exit: 0 (hosted aggregate)

```text
$ node gates/bin/plants.ts -- --affected f2d1465abcc2983905a8b765879da7b038c07572 --list
note: affected: every plant, by packages/elements/package.json (not mapped)
plants: affected since f2d1465abcc2983905a8b765879da7b038c07572: 317 of 317 plants selected, none judged (--list)
```

The hosted aggregate at `a3f027b` passed all plants, covering the affected selection.

[Hosted Plants verdict](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/44983617451/job/137093080703)
