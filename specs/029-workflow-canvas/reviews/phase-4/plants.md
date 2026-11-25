# Plants of phase 4

- base: 9a3aba8bb67b6364b95cb15596fd80f7726c88b8
- Selector `node gates/bin/plants.ts -- --affected 9a3aba8bb67b6364b95cb15596fd80f7726c88b8 --list`
- Selector exit 0

The list selects 21 of 318 Plants for the exact combined Phase 4 changes. The required hosted Plants aggregate judged all 318, each with its expected result, on signed candidate `fa90b9c7a32d05243a8e11f5159f05e75c37dc56` and tested merge `52c134c619caa6e5fcbf63984d16229c7cca325b`. [Hosted Plants](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45644601169/job/139326851229)

## Operator round 2

The selector again chose the same 21 of 318 cases. The local run `pnpm run gate:plants -- --affected 9a3aba8bb67b6364b95cb15596fd80f7726c88b8 --skip-container` exited 0 on the Step reveal fix at validation snapshot `bf7aff3f`. All 16 selected non-container Plants matched their expectations, including repository Axe (800.0 s). The follow-up tests exercise the focus boundary and the fallback resolves the initiating control's actual named navigator. The five selected Visual Plants use the pinned hosted engines. [Fix and browser evidence](round-2-fixes.md)

```text
$ node gates/bin/plants.ts -- --affected 9a3aba8bb67b6364b95cb15596fd80f7726c88b8 --list
note: affected: contrast/repository-values, by packages/elements/custom-elements.json
note: affected: brand-rules/repository-values, by packages/elements/custom-elements.json
note: affected: manifest/break-missing, by packages/elements/custom-elements.json
note: affected: manifest/break-not-json, by packages/elements/custom-elements.json
note: affected: manifest/fail-lost-attribute, by gates/plants/manifest/fail-lost-attribute/tree/packages/elements/custom-elements.json
note: affected: manifest/fail-stale-property, by packages/elements/custom-elements.json
note: affected: manifest/fail-undescribed-attribute, by gates/plants/manifest/fail-undescribed-attribute/tree/packages/elements/custom-elements.json
note: affected: manifest/fail-undescribed-css-part, by gates/plants/manifest/fail-undescribed-css-part/tree/packages/elements/custom-elements.json
note: affected: manifest/fail-undescribed-css-property, by gates/plants/manifest/fail-undescribed-css-property/tree/packages/elements/custom-elements.json
note: affected: manifest/fail-undescribed-event, by gates/plants/manifest/fail-undescribed-event/tree/packages/elements/custom-elements.json
note: affected: manifest/fail-undescribed-property, by gates/plants/manifest/fail-undescribed-property/tree/packages/elements/custom-elements.json
note: affected: manifest/fail-undescribed-slot, by gates/plants/manifest/fail-undescribed-slot/tree/packages/elements/custom-elements.json
note: affected: manifest/pass-reordered, by gates/plants/manifest/pass-reordered/tree/packages/elements/custom-elements.json
note: affected: manifest/pass-repository, by packages/elements/custom-elements.json
note: affected: storybook-build/pass-repository, by packages/elements/custom-elements.json
note: affected: visual/fail-missing-baseline, by packages/elements/custom-elements.json
note: affected: visual/fail-one-pixel, by packages/elements/custom-elements.json
note: affected: visual/fail-same-pixels-other-bytes, by packages/elements/custom-elements.json
note: affected: visual/fail-token-changed, by gates/plants/visual/fail-token-changed/plant.json
note: affected: visual/pass-repository, by packages/elements/custom-elements.json
note: affected: axe/pass-repository, by packages/elements/custom-elements.json
plants: affected since 9a3aba8bb67b6364b95cb15596fd80f7726c88b8: 21 of 318 plants selected, none judged (--list)
```
