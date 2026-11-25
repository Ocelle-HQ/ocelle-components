# Plants of phase 1

- base: 43b1a5d3167a1cdf7ff3bd3073a8b2a59065cf63
- command: `taskset -c 0 pnpm --silent run gate:plants -- --affected 43b1a5d3167a1cdf7ff3bd3073a8b2a59065cf63 --skip-container`
- exit: 0

The selector chooses 11 of 318 Plants. All six selected non-container Plants matched their expected results in the local affected run. The five selected Visual Plants use the pinned container engines on the exact hosted candidate. The required aggregate covered all 318 Plants in 77 shards at head `f254073111fe178d01b4d3b3eec26be5787615e9` and tested merge `784fedde2409a09b089da8ddff12dea1c830eddf`. [Hosted Plants](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45704388510/job/139534213775)

```text
note: affected: contrast/repository-values, by storybook/.storybook/stories-layout.css
note: affected: brand-rules/repository-values, by storybook/.storybook/stories-layout.css
note: affected: manifest/pass-repository, by storybook/.storybook/stories-layout.css
note: affected: storybook-build/fail-empty-index, by gates/plants/storybook-build/fail-empty-index/tree/storybook/stories/change-list-plan.stories.ts
note: affected: storybook-build/pass-repository, by storybook/.storybook/stories-layout.css
note: affected: visual/fail-missing-baseline, by storybook/.storybook/stories-layout.css
note: affected: visual/fail-one-pixel, by storybook/.storybook/stories-layout.css
note: affected: visual/fail-same-pixels-other-bytes, by storybook/.storybook/stories-layout.css
note: affected: visual/fail-token-changed, by gates/plants/visual/fail-token-changed/plant.json
note: affected: visual/pass-repository, by storybook/.storybook/stories-layout.css
note: affected: axe/pass-repository, by storybook/.storybook/stories-layout.css
note: plant time: contrast/repository-values: 0.4 s
note: plant time: brand-rules/repository-values: 0.6 s
note: plant time: manifest/pass-repository: 2.0 s
note: plant time: storybook-build/fail-empty-index: 2.3 s
note: plant time: storybook-build/pass-repository: 2.9 s
note: plant time: axe/pass-repository: 569.8 s
plants: skipped (no container): gates/plants/visual/fail-missing-baseline
plants: skipped (no container): gates/plants/visual/fail-one-pixel
plants: skipped (no container): gates/plants/visual/fail-same-pixels-other-bytes
plants: skipped (no container): gates/plants/visual/fail-token-changed
plants: skipped (no container): gates/plants/visual/pass-repository
plants: affected since 43b1a5d3167a1cdf7ff3bd3073a8b2a59065cf63: 6 of 318 plants judged, every plant as expected; not the Plants check; partial run: 5 visual plants not run
```
