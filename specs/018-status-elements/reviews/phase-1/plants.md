# Plants of phase 1

- base: 4f44aa1d74626db76a4baab534d1bd168dc2aae0
- command: `OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --affected $(cat specs/018-status-elements/reviews/phase-1/base.sha) --list`
- exit: 0

```text
$ node gates/bin/plants.ts -- --affected 4f44aa1d74626db76a4baab534d1bd168dc2aae0 --list
note: affected: every plant, by vitest.config.ts (not mapped)
plants: affected since 4f44aa1d74626db76a4baab534d1bd168dc2aae0: 317 of 317 plants selected, none judged (--list)
```

No plant was judged locally: by the operator decision of 2026-11-20 ("T010, the phase's plant run" in
`reviews/phase-1/operator-decisions.md`), the 317 plants selected (every plant, because `vitest.config.ts` is not
mapped by `affectedPlants`) are recorded here with `--list` only, and judging is left to CI's Plants check on the pull
request. A recorded exception to the "exit 0" rule, for phase 1 only.
