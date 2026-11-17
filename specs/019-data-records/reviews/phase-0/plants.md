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
note: plant time: contrast/repository-values: 0.4 s
note: plant time: brand-rules/repository-values: 0.4 s
note: plant time: manifest/pass-repository: 1.2 s
note: plant time: storybook-build/pass-repository: 2.9 s
note: plant time: axe/pass-repository: 200.0 s
plants: not run (no container engine): gates/plants/visual/fail-missing-baseline
plants: not run (no container engine): gates/plants/visual/fail-one-pixel
plants: not run (no container engine): gates/plants/visual/fail-same-pixels-other-bytes
plants: not run (no container engine): gates/plants/visual/fail-token-changed
plants: not run (no container engine): gates/plants/visual/pass-repository
plants: could not run: no container engine for 5 visual plants; start docker or podman, or run a partial job with --skip-container
[ELIFECYCLE] Command failed with exit code 2.
```

Run again after the operator allowed dockerd (docker server 29.9.2) and after `pnpm run setup:online`. The five
visual plants are still not run: the plant job probes engines with `OCELLE_VISUAL_ENGINE` unset, which means `both`,
and `both` needs docker and podman. This container has docker but no podman (and no skopeo). The phase is not done:
the exit is 2.
