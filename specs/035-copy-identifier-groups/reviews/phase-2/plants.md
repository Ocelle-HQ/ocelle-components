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
