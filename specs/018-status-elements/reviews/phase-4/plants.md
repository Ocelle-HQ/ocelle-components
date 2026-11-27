# Plants of phase 4

- base: b1de26af18d6bd3ead3f13149eff67459f039187
- command: `OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --affected $(cat specs/018-status-elements/reviews/phase-4/base.sha) --list`
- exit: 0
- run: at the T044a fix (operator rounds 2 and 3, fix-1), after `ccd9c5a5`

```text
$ node gates/bin/plants.ts -- --affected b1de26af18d6bd3ead3f13149eff67459f039187 --list
note: affected: every plant, by .github/workflows/mutation-shadow.yml (not mapped)
plants: affected since b1de26af18d6bd3ead3f13149eff67459f039187: 326 of 326 plants selected, none judged (--list)
```

No plant was judged locally: by the operator decision of 2026-11-20 in `reviews/operator-plants.md` (plant runs for
the rest of 018), the plants selected (every plant: 317 at T044, because `packages/elements/package.json`, changed by T042,
is not mapped by `affectedPlants`; 326 at T044a, by an unmapped workflow file changed since the base) are recorded here with `--list` only, and judging is left to CI's Plants check on the
pull request. The plants this phase changes (the eight manifest plant trees' copies of `custom-elements.json`,
`storybook-build/fail-empty-index` and the `why` of `visual/fail-token-changed`) are among them. Run with the working
tree holding the whole green change, before its commit (`--affected` reads `git diff <base>` and the untracked files).

## T044a: the icon-only baseline plants, per harness (operator round 3, O3-01)

Each plant hand-applied to `src/ocelle-pill-tag.ts` at `ccd9c5a5`, the four "Baseline, <variant>, <density>" bodies run
in process (`pnpm exec vitest run --project elements packages/elements/test/pill-tag.test.ts -t Baseline`) and on the
strict-CSP fixture (`pnpm exec vitest run --project elements-browser packages/elements/test/browser/pill-tag.test.ts -t
Baseline`), the source restored after each. None survives either harness.

| Plant | In process: result and killing assertion | Fixture: result and killing assertion |
|---|---|---|
| `bare` never set (the row always `icon-row`) | killed, 4 of 4: `only-p` and `only-r` `row` is `icon-row`, not `icon-row bare`; `wrapperTop` false | killed, 4 of 4: `only-p` and `only-r` `row` is `icon-row`; `top` −4 against −7.09 (compact −7.39); `size` height 39.09 (compact 35.39) |
| `bare` set on every row | killed, 4 of 4: `onBaseline` false for `in-p-plain`, `in-r-plain`, `in-p-icon`, `in-r-icon`; `wrap` `firstLineOnBaseline` false | killed, 4 of 4: the same `onBaseline` and `firstLineOnBaseline`; the one-line `height` false |
| the dropped override (`.icon-row { align-items: baseline } .icon-slot { align-self: flex-start }` after `iconSlotStyles`) | killed, 4 of 4: `only-p` and `only-r` `wrapperTop` false | killed, 4 of 4: `only-p` and `only-r` `top` −4 against −7.09 (compact −7.39); `size` height |
