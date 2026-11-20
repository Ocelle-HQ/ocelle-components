# Plants of phase 2

- base: b48309ce699109f445e650f624e8abb196982a73
- command: OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --affected b48309ce699109f445e650f624e8abb196982a73 --list
- exit: 0

```text
$ node gates/bin/plants.ts -- --affected b48309ce699109f445e650f624e8abb196982a73 --list
note: affected: every plant, by packages/elements/package.json (not mapped)
plants: affected since b48309ce699109f445e650f624e8abb196982a73: 317 of 317 plants selected, none judged (--list)
```

Not judged: stop-and-ask. Op 016's `--affected` mode selects the full set for this phase, because
`packages/elements/package.json` (T021's `./ocelle-status-indicator.js` export) is not mapped by `affectedPlants`
(`packages/elements/README.md` and `packages/elements/CHANGELOG.md`, changed by T021, are not mapped either; only
`packages/elements/src/` and `packages/elements/custom-elements.json` are). The operator's rule for this run is to
stop and ask rather than run the full set locally, so no plant was judged and T023 stays open. This record is
`--list` only, not a plant run; the phase is not done until the operator decides (the question is in the
implementer's report).
