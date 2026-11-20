# Plants of phase 2

- base: 0ff98cee3741ed8aafda2af2009ee962d9739d14
- command: `OCELLE_VISUAL_ENGINE=docker OCELLE_CHROMIUM_PATH=<chromium 1243> pnpm run gate:plants -- --affected 0ff98cee3741ed8aafda2af2009ee962d9739d14`
- exit: 0

Fix round fix-7 (operator round 12, O12-01), run at the test commit `f109b379` on 2026-11-20, under 1 s wall-clock.
The base is that commit's parent (`0ff98ce`), as fix-4 and fix-6 took the red commit's parent; fix-7 has no red
commit (the red evidence is the hand-applied mutant, R-08). Not `base.sha` (`6c9400c`): since `6c9400c` the branch has
changed `gates/bin/plants.ts`, so `--affected 6c9400c` selects every plant, an unsharded run of over two hours. Against
`0ff98ce` the changed files are `packages/elements/test/announcer.test.ts` and evidence logs, and no plant is selected.
The fix-6 run is this file's previous version in history. CI's Plants check still judges every plant.

```text
$ node gates/bin/plants.ts -- --affected 0ff98cee3741ed8aafda2af2009ee962d9739d14
plants: affected since 0ff98cee3741ed8aafda2af2009ee962d9739d14: no plant selected, 0 of 317 plants judged; not the Plants check
```
