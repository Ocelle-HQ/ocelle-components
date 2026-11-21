# Plants of phase 4

- base: 19448a1fc74c5201350ddb86e92e338f8a533303
- command: `OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --affected $(cat specs/018-status-elements/reviews/phase-4/base.sha) --list`
- exit: 0

```text
$ node gates/bin/plants.ts -- --affected 19448a1fc74c5201350ddb86e92e338f8a533303 --list
note: affected: every plant, by packages/elements/package.json (not mapped)
plants: affected since 19448a1fc74c5201350ddb86e92e338f8a533303: 317 of 317 plants selected, none judged (--list)
```

No plant was judged locally: by the operator decision of 2026-11-20 in `reviews/operator-plants.md` (plant runs for
the rest of 018), the 317 plants selected (every plant, because `packages/elements/package.json`, changed by T042, is
not mapped by `affectedPlants`) are recorded here with `--list` only, and judging is left to CI's Plants check on the
pull request. The plants this phase changes (the eight manifest plant trees' copies of `custom-elements.json`,
`storybook-build/fail-empty-index` and the `why` of `visual/fail-token-changed`) are among them. Run with the working
tree holding the whole green change, before its commit (`--affected` reads `git diff <base>` and the untracked files).
