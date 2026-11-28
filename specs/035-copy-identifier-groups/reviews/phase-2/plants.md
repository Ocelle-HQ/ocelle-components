# Plants of phase 2

- base: d8793108e6786c58d2d04ca140ee60c1c41b3849
- command: pnpm run gate:plants -- --affected d8793108e6786c58d2d04ca140ee60c1c41b3849 --list
- exit: 0

The local exit records the affected selection. The required CI Plants check runs the full registry for the candidate.

```text
$ node gates/bin/plants.ts -- --affected d8793108e6786c58d2d04ca140ee60c1c41b3849 --list
note: affected: contrast/repository-values, by storybook/baselines/elements-ocelle-copy-field--compact-digest.dark.png
note: affected: brand-rules/repository-values, by storybook/baselines/elements-ocelle-copy-field--compact-digest.dark.png
note: affected: manifest/pass-repository, by storybook/baselines/elements-ocelle-copy-field--compact-digest.dark.png
note: affected: storybook-build/pass-repository, by storybook/baselines/elements-ocelle-copy-field--compact-digest.dark.png
note: affected: visual/fail-missing-baseline, by storybook/baselines/elements-ocelle-copy-field--compact-digest.dark.png
note: affected: visual/fail-one-pixel, by storybook/baselines/elements-ocelle-copy-field--compact-digest.dark.png
note: affected: visual/fail-same-pixels-other-bytes, by storybook/baselines/elements-ocelle-copy-field--compact-digest.dark.png
note: affected: visual/fail-token-changed, by gates/plants/visual/fail-token-changed/plant.json
note: affected: visual/pass-repository, by storybook/baselines/elements-ocelle-copy-field--compact-digest.dark.png
note: affected: axe/pass-repository, by storybook/baselines/elements-ocelle-copy-field--compact-digest.dark.png
plants: affected since d8793108e6786c58d2d04ca140ee60c1c41b3849: 10 of 326 plants selected, none judged (--list)
```

## Hosted verification

The full Plants check judged all 326 Plants across 18 gates and accepted every result. PR #104 run `45847625160`,
attempt `1`, tested head `4ac4aaa639586a4167724d0a1f36954876f3a621` on base
`b655b83b1d17694039f7b5c968e483384145a90a` with merge `1ba4139521b20b961047e80b19f0997a23b9494b`. [Hosted Plants](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45847625160/job/140016299086)
