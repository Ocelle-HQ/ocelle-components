# Plants of phase 0

- base: 8ee3351efb9f6e14023d5900ac7f4a26931c48f8
- command: pnpm run gate:plants -- --affected 8ee3351efb9f6e14023d5900ac7f4a26931c48f8
- exit: 2

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
note: plant time: contrast/repository-values: 0.5 s
note: plant time: brand-rules/repository-values: 1.0 s
note: plant time: manifest/pass-repository: 1.1 s
note: plant time: storybook-build/pass-repository: 2.7 s
note: plant time: axe/pass-repository: 204.0 s
plants: not run (no container engine): gates/plants/visual/fail-missing-baseline
plants: not run (no container engine): gates/plants/visual/fail-one-pixel
plants: not run (no container engine): gates/plants/visual/fail-same-pixels-other-bytes
plants: not run (no container engine): gates/plants/visual/fail-token-changed
plants: not run (no container engine): gates/plants/visual/pass-repository
plants: could not run: no container engine for 5 visual plants; start docker or podman, or run a partial job with --skip-container
[ELIFECYCLE] Command failed with exit code 2.
```
