# Plants of phase 7

- base: 4fc2ed5b90303d239a97d0beb430c7f295f3c825
- command: `OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --affected $(cat specs/018-status-elements/reviews/phase-2/base.sha) --list`
- exit: 0

```text
$ node gates/bin/plants.ts -- --affected 4fc2ed5b90303d239a97d0beb430c7f295f3c825 --list
note: affected: every plant, by packages/elements/package.json (not mapped)
plants: affected since 4fc2ed5b90303d239a97d0beb430c7f295f3c825: 317 of 317 plants selected, none judged (--list)
```

The base is phase 2's (`reviews/phase-2/base.sha`), as T065 and plan.md § 7 say, so the selection covers the whole
feature's diff and not the documentation-only diff of phase 7. No plant was judged locally: by the operator decision of
2026-11-20 in `reviews/operator-plants.md` (plant runs for the rest of 018), the 317 plants selected (every plant,
because `packages/elements/package.json`, changed by phase 2's T021, is not mapped by `affectedPlants`) are recorded
here with `--list` only, and judging is left to CI's Plants check on the pull request.
