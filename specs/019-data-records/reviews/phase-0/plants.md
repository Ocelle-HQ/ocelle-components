# Plants of phase 0

- base: 8ee3351efb9f6e14023d5900ac7f4a26931c48f8
- command: OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --affected 8ee3351efb9f6e14023d5900ac7f4a26931c48f8
- exit: 0

```text
$ node gates/bin/plants.ts -- --affected 8ee3351efb9f6e14023d5900ac7f4a26931c48f8
note: affected: contrast/repository-values, by specs/019-data-records/plan.md
note: affected: brand-rules/repository-values, by specs/019-data-records/plan.md
note: affected: manifest/pass-repository, by specs/019-data-records/plan.md
note: affected: storybook-build/pass-repository, by specs/019-data-records/plan.md
note: affected: visual/fail-missing-baseline, by specs/019-data-records/plan.md
note: affected: visual/fail-one-pixel, by specs/019-data-records/plan.md
note: affected: visual/fail-same-pixels-other-bytes, by specs/019-data-records/plan.md
note: affected: visual/fail-token-changed, by specs/019-data-records/plan.md
note: affected: visual/pass-repository, by specs/019-data-records/plan.md
note: affected: axe/pass-repository, by specs/019-data-records/plan.md
note: plant time: contrast/repository-values: 0.4 s
note: plant time: brand-rules/repository-values: 0.4 s
note: plant time: manifest/pass-repository: 1.3 s
note: plant time: storybook-build/pass-repository: 2.6 s
note: plant time: visual/fail-missing-baseline: 409.0 s
note: plant time: visual/fail-one-pixel: 367.6 s
note: plant time: visual/fail-same-pixels-other-bytes: 359.4 s
note: plant time: visual/fail-token-changed: 453.6 s
note: plant time: visual/pass-repository: 339.3 s
note: plant time: axe/pass-repository: 195.3 s
plants: affected since 8ee3351efb9f6e14023d5900ac7f4a26931c48f8: 10 of 314 plants judged, every plant as expected; not the Plants check
```

Run again under the operator's standing rule for this run: visual work runs only in the pinned container of #10
under docker, and no podman cross-check is possible here (this container has docker, server 29.9.2, and no podman).
`OCELLE_VISUAL_ENGINE=docker` was therefore set, as in op 016's phase-1 plants.md; the five visual plants ran under
docker only. CI's Plants check runs both engines (docker and podman), so the podman side is judged there, not here.
