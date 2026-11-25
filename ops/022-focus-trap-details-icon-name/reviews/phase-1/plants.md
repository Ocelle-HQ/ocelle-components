# Plants of phase 1

Round 2 (`fix-2`) rerun. The base is the merge base with `origin/main` (1b8b0b2b91fc969bb7499b64b509b06a09dbf24d), not `base.sha` (dd69835), because main is merged into the branch: from `base.sha` every change of main would count as affected. `--skip-container`: no podman here, so the five visual plants (they default to docker and podman) are not run and no podman cross-check was possible; CI's required checks decide them (operator decision 9).

- base: 1b8b0b2b91fc969bb7499b64b509b06a09dbf24d
- command: pnpm run gate:plants -- --affected 1b8b0b2b91fc969bb7499b64b509b06a09dbf24d --skip-container
- exit: 0

```text
$ node gates/bin/plants.ts -- --affected 1b8b0b2b91fc969bb7499b64b509b06a09dbf24d --skip-container
note: affected: contrast/repository-values, by packages/elements/src/focusable.ts
note: affected: brand-rules/repository-values, by packages/elements/src/focusable.ts
note: affected: manifest/break-missing, by packages/elements/src/focusable.ts
note: affected: manifest/break-not-json, by packages/elements/src/focusable.ts
note: affected: manifest/fail-lost-attribute, by packages/elements/src/focusable.ts
note: affected: manifest/fail-stale-property, by packages/elements/src/focusable.ts
note: affected: manifest/fail-undescribed-attribute, by packages/elements/src/focusable.ts
note: affected: manifest/fail-undescribed-css-part, by packages/elements/src/focusable.ts
note: affected: manifest/fail-undescribed-css-property, by packages/elements/src/focusable.ts
note: affected: manifest/fail-undescribed-event, by packages/elements/src/focusable.ts
note: affected: manifest/fail-undescribed-property, by packages/elements/src/focusable.ts
note: affected: manifest/fail-undescribed-slot, by packages/elements/src/focusable.ts
note: affected: manifest/pass-reordered, by packages/elements/src/focusable.ts
note: affected: manifest/pass-repository, by packages/elements/src/focusable.ts
note: affected: storybook-build/pass-repository, by packages/elements/src/focusable.ts
note: affected: visual/fail-missing-baseline, by packages/elements/src/focusable.ts
note: affected: visual/fail-one-pixel, by packages/elements/src/focusable.ts
note: affected: visual/fail-same-pixels-other-bytes, by packages/elements/src/focusable.ts
note: affected: visual/fail-token-changed, by packages/elements/src/focusable.ts
note: affected: visual/pass-repository, by packages/elements/src/focusable.ts
note: affected: axe/pass-repository, by packages/elements/src/focusable.ts
note: plant time: contrast/repository-values: 0.6 s
note: plant time: brand-rules/repository-values: 0.7 s
note: plant time: manifest/break-missing: 1.4 s
note: plant time: manifest/pass-repository: 1.7 s
note: plant time: manifest/break-not-json: 2.4 s
note: plant time: manifest/fail-lost-attribute: 2.6 s
note: plant time: manifest/pass-reordered: 3.4 s
note: plant time: manifest/fail-stale-property: 3.6 s
note: plant time: manifest/fail-undescribed-attribute: 4.4 s
note: plant time: manifest/fail-undescribed-css-part: 4.5 s
note: plant time: manifest/fail-undescribed-css-property: 5.6 s
note: plant time: manifest/fail-undescribed-event: 5.7 s
note: plant time: manifest/fail-undescribed-property: 6.7 s
note: plant time: manifest/fail-undescribed-slot: 6.7 s
note: plant time: storybook-build/pass-repository: 2.6 s
note: plant time: axe/pass-repository: 303.8 s
plants: skipped (no container): gates/plants/visual/fail-missing-baseline
plants: skipped (no container): gates/plants/visual/fail-one-pixel
plants: skipped (no container): gates/plants/visual/fail-same-pixels-other-bytes
plants: skipped (no container): gates/plants/visual/fail-token-changed
plants: skipped (no container): gates/plants/visual/pass-repository
plants: affected since 1b8b0b2b91fc969bb7499b64b509b06a09dbf24d: 16 of 317 plants judged, every plant as expected; not the Plants check; partial run: 5 visual plants not run
```
