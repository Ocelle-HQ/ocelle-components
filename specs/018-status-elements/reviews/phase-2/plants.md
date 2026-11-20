# Plants of phase 2

- base: b48309ce699109f445e650f624e8abb196982a73
- command: `OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --affected $(cat specs/018-status-elements/reviews/phase-2/base.sha) --list`
- exit: 0

```text
$ node gates/bin/plants.ts -- --affected b48309ce699109f445e650f624e8abb196982a73 --list
note: affected: every plant, by packages/elements/package.json (not mapped)
plants: affected since b48309ce699109f445e650f624e8abb196982a73: 317 of 317 plants selected, none judged (--list)
```

No plant was judged locally: by the operator decision of 2026-11-20 in `reviews/operator-plants.md` (plant runs for
the rest of 018), the 317 plants selected (every plant, because `packages/elements/package.json`, changed by T021, is
not mapped by `affectedPlants`) are recorded here with `--list` only, and judging is left to CI's Plants check on the
pull request.
