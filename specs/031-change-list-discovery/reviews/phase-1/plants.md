# Plants of phase 1

- base: 56a16e2ac98bc0a864eb485e2a3040bdea33cbf1
- command: `taskset -c 0 pnpm --silent run gate:plants -- --affected 56a16e2ac98bc0a864eb485e2a3040bdea33cbf1 --skip-container`
- exit: 0

The integrated base selects 11 of 326 Plants. All six selected non-container Plants matched their expected results. The required hosted aggregate supplies the five selected Visual Plants in the pinned engines. Op 023 accounts for the eight additional Plants in the registry. The earlier matched pilot judged all 318 Plants in its own registry. [Matched pilot CI](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45704388510) · [Integrated candidate CI](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45725193873)

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
note: plant time: contrast/repository-values: 0.6 s
note: plant time: brand-rules/repository-values: 0.9 s
note: plant time: manifest/pass-repository: 2.4 s
note: plant time: storybook-build/fail-empty-index: 2.6 s
note: plant time: storybook-build/pass-repository: 3.8 s
note: plant time: axe/pass-repository: 574.8 s
plants: skipped (no container): gates/plants/visual/fail-missing-baseline
plants: skipped (no container): gates/plants/visual/fail-one-pixel
plants: skipped (no container): gates/plants/visual/fail-same-pixels-other-bytes
plants: skipped (no container): gates/plants/visual/fail-token-changed
plants: skipped (no container): gates/plants/visual/pass-repository
plants: affected since 56a16e2ac98bc0a864eb485e2a3040bdea33cbf1: 6 of 326 plants judged, every plant as expected; not the Plants check; partial run: 5 visual plants not run
```
