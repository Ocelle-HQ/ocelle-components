# Plants of phase 2

- base: a0e40aed1477c30bc4d3889c4be55d77dca12697
- command: `OCELLE_VISUAL_ENGINE=docker OCELLE_CHROMIUM_PATH=<chromium 1243> pnpm run gate:plants -- --affected a0e40aed1477c30bc4d3889c4be55d77dca12697`
- exit: 0

Fix round fix-6 (operator round 8, O8-02), run at the fix commit `7c26ed19` on 2026-11-19, under 1 s wall-clock.
The base is the red commit's parent (`a0e40ae`, the revert of `636207eb`), as fix-4 did, not `base.sha`
(`6c9400c`): since `6c9400c` the branch has changed `gates/bin/plants.ts`, so `--affected 6c9400c` selects every
plant, an unsharded run of over two hours. Against `a0e40ae` the changed files are `.github/workflows/ci.yml`,
`gates/test/ci-workflow.test.ts` and two documents, and the selection is the 8 plants below. The fix-4 run is this
file's previous version in history (`21a33beb`). CI's Plants check still judges every plant.

```text
$ node gates/bin/plants.ts -- --affected a0e40aed1477c30bc4d3889c4be55d77dca12697
note: affected: plants/fail-affected-in-plant-check, by .github/workflows/ci.yml
note: affected: plants/fail-gate-without-entry, by .github/workflows/ci.yml
note: affected: plants/fail-gate-without-job, by .github/workflows/ci.yml
note: affected: plants/fail-shard-in-plant-check, by .github/workflows/ci.yml
note: affected: plants/fail-skip-container-in-ci, by .github/workflows/ci.yml
note: affected: plants/fail-skip-container-in-shard, by .github/workflows/ci.yml
note: affected: plants/pass-matching, by .github/workflows/ci.yml
note: affected: plants/pass-split-plant-jobs, by .github/workflows/ci.yml
note: plant time: plants/fail-affected-in-plant-check: 0.0 s
note: plant time: plants/fail-gate-without-entry: 0.0 s
note: plant time: plants/fail-gate-without-job: 0.0 s
note: plant time: plants/fail-skip-container-in-ci: 0.0 s
note: plant time: plants/fail-shard-in-plant-check: 0.0 s
note: plant time: plants/fail-skip-container-in-shard: 0.0 s
note: plant time: plants/pass-matching: 0.0 s
note: plant time: plants/pass-split-plant-jobs: 0.0 s
plants: affected since a0e40aed1477c30bc4d3889c4be55d77dca12697: 8 of 314 plants judged, every plant as expected; not the Plants check
```
