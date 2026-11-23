# Plants of phase 3

- base: 2de6259a97843ff28c772f1aa55379884db232a8
- selection: pnpm run gate:plants -- --affected 2de6259a97843ff28c772f1aa55379884db232a8 --list
- hosted verdict: pnpm run gate:plants -- --verdict storybook/.visual/plant-shards
- exit: 0 (hosted aggregate)

The affected selector selected all 317 plants because the package export file is unmapped. The hosted aggregate at `cdf1e2d` passed, covering the entire selection. The subsequent change adds an equal-threshold test and workflow records. Its production source is unchanged.

[Hosted Plants verdict](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/44962527887/job/137028422217)
