# Plants of phase 3

- base: f74dec851e763bb8c19533ac4118bec79457d6d0
- command: `OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --affected $(cat specs/018-status-elements/reviews/phase-3/base.sha) --list`
- exit: 0

```text
$ node gates/bin/plants.ts -- --affected f74dec851e763bb8c19533ac4118bec79457d6d0 --list
note: affected: every plant, by packages/elements/package.json (not mapped)
plants: affected since f74dec851e763bb8c19533ac4118bec79457d6d0: 317 of 317 plants selected, none judged (--list)
```

No plant was judged locally: by the operator decision of 2026-11-20 in `reviews/operator-plants.md` (plant runs for
the rest of 018), the 317 plants selected (every plant, because `packages/elements/package.json`, changed by T032, is
not mapped by `affectedPlants`) are recorded here with `--list` only, and judging is left to CI's Plants check on the
pull request. The plants this phase changes (the eight manifest plant trees' copies of `custom-elements.json`,
`storybook-build/fail-empty-index` and `visual/fail-token-changed`) are among them.
