# Plants of phase 5

- base: 401f8db1aa7f89eb7b21455d73a4a793cfa4e601
- command: `OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --affected $(cat specs/018-status-elements/reviews/phase-5/base.sha)`
- exit: 0

```text
$ node gates/bin/plants.ts -- --affected 4e8728e483683935a884cb24b9299926f1adc0bb
note: affected: style-lint/element-property-clash, by packages/tokens/src/source.ts
note: affected: style-lint/error-unparsable, by packages/tokens/src/source.ts
note: affected: style-lint/fail-aspect-calc, by packages/tokens/src/source.ts
note: affected: style-lint/fail-aspect-ratio-other, by packages/tokens/src/source.ts
note: affected: style-lint/fail-calc-operand, by packages/tokens/src/source.ts
note: affected: style-lint/fail-element-property-misspelt, by packages/tokens/src/source.ts
note: affected: style-lint/fail-element-stylesheet, by packages/tokens/src/source.ts
note: affected: style-lint/fail-element-template, by packages/tokens/src/source.ts
note: affected: style-lint/fail-fit-content-length, by packages/tokens/src/source.ts
note: affected: style-lint/fail-font-family, by packages/tokens/src/source.ts
note: affected: style-lint/fail-font-weight, by packages/tokens/src/source.ts
note: affected: style-lint/fail-gradient-angle, by packages/tokens/src/source.ts
note: affected: style-lint/fail-gradient-hex, by packages/tokens/src/source.ts
note: affected: style-lint/fail-gradient-length, by packages/tokens/src/source.ts
note: affected: style-lint/fail-hex-colour, by packages/tokens/src/source.ts
note: affected: style-lint/fail-iteration-count-fraction, by packages/tokens/src/source.ts
note: affected: style-lint/fail-lh-calc-factor, by packages/tokens/src/source.ts
note: affected: style-lint/fail-lh-calc-twice, by packages/tokens/src/source.ts
note: affected: style-lint/fail-lh-multiple, by packages/tokens/src/source.ts
note: affected: style-lint/fail-lh-multiple-calc, by packages/tokens/src/source.ts
note: affected: style-lint/fail-lh-paren-factor, by packages/tokens/src/source.ts
note: affected: style-lint/fail-minmax-auto, by packages/tokens/src/source.ts
note: affected: style-lint/fail-ms-time, by packages/tokens/src/source.ts
note: affected: style-lint/fail-named-colour, by packages/tokens/src/source.ts
note: affected: style-lint/fail-radial-gradient, by packages/tokens/src/source.ts
note: affected: style-lint/fail-rem-length, by packages/tokens/src/source.ts
note: affected: style-lint/fail-rgb-colour, by packages/tokens/src/source.ts
note: affected: style-lint/fail-scale-calc, by packages/tokens/src/source.ts
note: affected: style-lint/fail-scale-factor, by packages/tokens/src/source.ts
note: affected: style-lint/fail-scale-length, by packages/tokens/src/source.ts
note: affected: style-lint/fail-styles-calc-line-height, by packages/tokens/src/source.ts
note: affected: style-lint/fail-styles-font-without-line-height, by packages/tokens/src/source.ts
note: affected: style-lint/fail-styles-literal-line-height, by packages/tokens/src/source.ts
note: affected: style-lint/fail-styles-normal-line-height, by packages/tokens/src/source.ts
note: affected: style-lint/fail-styles-other-token-line-height, by packages/tokens/src/source.ts
note: affected: style-lint/fail-styles-outside-src, by packages/tokens/src/source.ts
note: affected: style-lint/fail-styles-percent-line-height, by packages/tokens/src/source.ts
note: affected: style-lint/fail-styles-stylesheet, by packages/tokens/src/source.ts
note: affected: style-lint/fail-translate-length, by packages/tokens/src/source.ts
note: affected: style-lint/fail-unitless-number, by packages/tokens/src/source.ts
note: affected: style-lint/fail-unknown-token, by packages/tokens/src/source.ts
note: affected: style-lint/fail-var-fallback, by packages/tokens/src/source.ts
note: affected: style-lint/pass-anchor-name, by packages/tokens/src/source.ts
note: affected: style-lint/pass-aspect-square, by packages/tokens/src/source.ts
note: affected: style-lint/pass-calc-tokens, by packages/tokens/src/source.ts
note: affected: style-lint/pass-element-property, by packages/tokens/src/source.ts
note: affected: style-lint/pass-empty-string, by packages/tokens/src/source.ts
note: affected: style-lint/pass-fr, by packages/tokens/src/source.ts
note: affected: style-lint/pass-grid-fit-content, by packages/tokens/src/source.ts
note: affected: style-lint/pass-iteration-count, by packages/tokens/src/source.ts
note: affected: style-lint/pass-known-token, by packages/tokens/src/source.ts
note: affected: style-lint/pass-line-height, by packages/tokens/src/source.ts
note: affected: style-lint/pass-linear-gradient-tokens, by packages/tokens/src/source.ts
note: affected: style-lint/pass-one-line, by packages/tokens/src/source.ts
note: affected: style-lint/pass-one-line-calc, by packages/tokens/src/source.ts
note: affected: style-lint/pass-percentage, by packages/tokens/src/source.ts
note: affected: style-lint/pass-scale-mirror, by packages/tokens/src/source.ts
note: affected: style-lint/pass-story, by packages/tokens/src/source.ts
note: affected: style-lint/pass-styles-line-height-token, by packages/tokens/src/source.ts
note: affected: style-lint/pass-system-colour, by packages/tokens/src/source.ts
note: affected: style-lint/pass-test-code, by packages/tokens/src/source.ts
note: affected: style-lint/pass-token-definitions, by packages/tokens/src/source.ts
note: affected: style-lint/pass-translate-percentage, by packages/tokens/src/source.ts
note: affected: style-lint/pass-var-keyword-fallback, by packages/tokens/src/source.ts
note: affected: style-lint/pass-var-token, by packages/tokens/src/source.ts
note: affected: style-lint/pass-zero, by packages/tokens/src/source.ts
note: affected: contrast/empty-list, by packages/tokens/src/source.ts
note: affected: contrast/excluded-without-reason, by packages/tokens/src/source.ts
note: affected: contrast/exempt-disabled-ink, by packages/tokens/src/source.ts
note: affected: contrast/exempt-not-disabled-ink, by packages/tokens/src/source.ts
note: affected: contrast/figure-mismatch, by packages/tokens/src/source.ts
note: affected: contrast/missing-required-pair, by packages/tokens/src/source.ts
note: affected: contrast/non-text-below-threshold, by packages/tokens/src/source.ts
note: affected: contrast/not-opaque, by packages/tokens/src/source.ts
note: affected: contrast/repository-values, by packages/elements/custom-elements.json
note: affected: contrast/required-pair-excluded, by packages/tokens/src/source.ts
note: affected: contrast/source-throws, by packages/tokens/src/source.ts
note: affected: contrast/text-below-threshold, by packages/tokens/src/source.ts
note: affected: contrast/unknown-token, by packages/tokens/src/source.ts
note: affected: contrast/unparsable-list, by packages/tokens/src/source.ts
note: affected: brand-rules/a-monospace, by packages/tokens/src/source.ts
note: affected: brand-rules/b-link-equals-accent, by packages/tokens/src/source.ts
note: affected: brand-rules/b-ochre-pair-not-excluded, by packages/tokens/src/source.ts
note: affected: brand-rules/c-extra-radius, by packages/tokens/src/source.ts
note: affected: brand-rules/c-wrong-value, by packages/tokens/src/source.ts
note: affected: brand-rules/d-rule-as-boundary, by packages/tokens/src/source.ts
note: affected: brand-rules/e-light-chrome, by packages/tokens/src/source.ts
note: affected: brand-rules/f-delay-marker-misplaced, by packages/tokens/src/source.ts
note: affected: brand-rules/f-motion-not-ms, by packages/tokens/src/source.ts
note: affected: brand-rules/f-motion-not-zero, by packages/tokens/src/source.ts
note: affected: brand-rules/f-motion-spin-missing, by packages/tokens/src/source.ts
note: affected: brand-rules/g-forced-colours-override, by packages/tokens/src/source.ts
note: affected: brand-rules/g-system-colour-mapping, by packages/tokens/src/source.ts
note: affected: brand-rules/generator-throws, by packages/tokens/src/source.ts
note: affected: brand-rules/repository-values, by packages/elements/custom-elements.json
note: affected: brand-rules/source-invalid, by packages/tokens/src/source.ts
note: affected: brand-rules/source-throws, by packages/tokens/src/source.ts
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
note: plant time: style-lint/element-property-clash: 1.6 s
note: plant time: style-lint/error-unparsable: 1.7 s
note: plant time: style-lint/fail-calc-operand: 3.0 s
note: plant time: style-lint/fail-aspect-ratio-other: 3.1 s
note: plant time: style-lint/fail-aspect-calc: 4.4 s
note: plant time: style-lint/fail-element-property-misspelt: 4.5 s
note: plant time: style-lint/fail-fit-content-length: 5.8 s
note: plant time: style-lint/fail-element-stylesheet: 5.9 s
note: plant time: style-lint/fail-font-family: 7.1 s
note: plant time: style-lint/fail-font-weight: 7.4 s
note: plant time: style-lint/fail-gradient-hex: 8.7 s
note: plant time: style-lint/fail-gradient-angle: 8.8 s
note: plant time: style-lint/fail-gradient-length: 10.0 s
note: plant time: style-lint/fail-hex-colour: 10.3 s
note: plant time: style-lint/fail-iteration-count-fraction: 11.3 s
note: plant time: style-lint/fail-lh-calc-factor: 11.8 s
note: plant time: style-lint/fail-lh-calc-twice: 12.7 s
note: plant time: style-lint/fail-lh-multiple: 13.0 s
note: plant time: style-lint/fail-lh-multiple-calc: 14.2 s
note: plant time: style-lint/fail-lh-paren-factor: 14.4 s
note: plant time: style-lint/fail-minmax-auto: 15.5 s
note: plant time: style-lint/fail-ms-time: 15.8 s
note: plant time: style-lint/fail-named-colour: 16.8 s
note: plant time: style-lint/fail-radial-gradient: 17.1 s
note: plant time: style-lint/fail-rem-length: 18.1 s
note: plant time: style-lint/fail-rgb-colour: 18.5 s
note: plant time: style-lint/fail-scale-calc: 19.4 s
note: plant time: style-lint/fail-scale-factor: 19.8 s
note: plant time: style-lint/fail-scale-length: 20.7 s
note: plant time: style-lint/fail-styles-calc-line-height: 21.2 s
note: plant time: style-lint/fail-styles-font-without-line-height: 22.2 s
note: plant time: style-lint/fail-styles-literal-line-height: 22.5 s
note: plant time: style-lint/fail-styles-normal-line-height: 23.7 s
note: plant time: style-lint/fail-styles-other-token-line-height: 24.0 s
note: plant time: style-lint/fail-styles-outside-src: 25.1 s
note: plant time: style-lint/fail-styles-percent-line-height: 25.3 s
note: plant time: style-lint/fail-styles-stylesheet: 26.5 s
note: plant time: style-lint/fail-translate-length: 26.7 s
note: plant time: style-lint/fail-unitless-number: 28.1 s
note: plant time: style-lint/fail-unknown-token: 28.2 s
note: plant time: style-lint/fail-var-fallback: 29.6 s
note: plant time: style-lint/pass-anchor-name: 29.7 s
note: plant time: style-lint/pass-aspect-square: 31.0 s
note: plant time: style-lint/pass-element-property: 31.1 s
note: plant time: style-lint/pass-empty-string: 32.4 s
note: plant time: style-lint/pass-fr: 32.7 s
note: plant time: style-lint/pass-grid-fit-content: 33.7 s
note: plant time: style-lint/pass-iteration-count: 34.3 s
note: plant time: style-lint/pass-known-token: 35.1 s
note: plant time: style-lint/pass-line-height: 35.8 s
note: plant time: style-lint/pass-linear-gradient-tokens: 36.5 s
note: plant time: style-lint/pass-one-line: 37.4 s
note: plant time: style-lint/pass-one-line-calc: 38.0 s
note: plant time: style-lint/pass-percentage: 39.0 s
note: plant time: style-lint/pass-scale-mirror: 39.4 s
note: plant time: style-lint/pass-story: 40.6 s
note: plant time: style-lint/pass-styles-line-height-token: 40.8 s
note: plant time: style-lint/pass-calc-tokens: 42.2 s
note: plant time: style-lint/fail-element-template: 42.3 s
note: plant time: style-lint/pass-system-colour: 43.7 s
note: plant time: style-lint/pass-test-code: 44.0 s
note: plant time: style-lint/pass-translate-percentage: 45.5 s
note: plant time: style-lint/pass-token-definitions: 45.5 s
note: plant time: style-lint/pass-var-keyword-fallback: 47.1 s
note: plant time: style-lint/pass-var-token: 47.1 s
note: plant time: contrast/empty-list: 47.4 s
note: plant time: contrast/exempt-disabled-ink: 47.7 s
note: plant time: contrast/excluded-without-reason: 48.1 s
note: plant time: contrast/exempt-not-disabled-ink: 48.4 s
note: plant time: style-lint/pass-zero: 48.6 s
note: plant time: contrast/figure-mismatch: 48.7 s
note: plant time: contrast/missing-required-pair: 49.1 s
note: plant time: contrast/non-text-below-threshold: 49.1 s
note: plant time: contrast/not-opaque: 49.5 s
note: plant time: contrast/repository-values: 49.6 s
note: plant time: contrast/required-pair-excluded: 50.0 s
note: plant time: contrast/source-throws: 50.0 s
note: plant time: contrast/text-below-threshold: 50.4 s
note: plant time: contrast/unknown-token: 50.5 s
note: plant time: contrast/unparsable-list: 50.9 s
note: plant time: brand-rules/a-monospace: 50.9 s
note: plant time: brand-rules/b-ochre-pair-not-excluded: 51.3 s
note: plant time: brand-rules/c-extra-radius: 51.3 s
note: plant time: brand-rules/c-wrong-value: 51.8 s
note: plant time: brand-rules/d-rule-as-boundary: 51.9 s
note: plant time: brand-rules/e-light-chrome: 52.3 s
note: plant time: brand-rules/b-link-equals-accent: 52.4 s
note: plant time: brand-rules/f-delay-marker-misplaced: 52.7 s
note: plant time: brand-rules/f-motion-not-ms: 52.9 s
note: plant time: brand-rules/f-motion-not-zero: 53.2 s
note: plant time: brand-rules/f-motion-spin-missing: 53.4 s
note: plant time: brand-rules/g-forced-colours-override: 53.7 s
note: plant time: brand-rules/g-system-colour-mapping: 53.9 s
note: plant time: brand-rules/generator-throws: 54.3 s
note: plant time: brand-rules/source-invalid: 54.5 s
note: plant time: brand-rules/source-throws: 54.9 s
note: plant time: manifest/break-missing: 55.6 s
note: plant time: manifest/fail-lost-attribute: 56.5 s
note: plant time: manifest/fail-stale-property: 56.9 s
note: plant time: manifest/fail-undescribed-attribute: 57.8 s
note: plant time: manifest/fail-undescribed-css-part: 58.0 s
note: plant time: manifest/fail-undescribed-css-property: 58.9 s
note: plant time: manifest/fail-undescribed-event: 59.1 s
note: plant time: brand-rules/repository-values: 59.7 s
note: plant time: manifest/fail-undescribed-property: 60.1 s
note: plant time: manifest/fail-undescribed-slot: 60.8 s
note: plant time: manifest/pass-repository: 61.1 s
note: plant time: manifest/break-not-json: 61.5 s
note: plant time: manifest/pass-reordered: 62.1 s
note: plant time: storybook-build/pass-repository: 2.8 s
note: plant time: visual/fail-missing-baseline: 571.2 s
note: plant time: visual/fail-one-pixel: 545.9 s
note: plant time: visual/fail-same-pixels-other-bytes: 530.6 s
note: plant time: visual/fail-token-changed: 678.7 s
note: plant time: visual/pass-repository: 553.4 s
note: plant time: axe/pass-repository: 346.9 s
plants: affected since 4e8728e483683935a884cb24b9299926f1adc0bb: 116 of 317 plants judged, every plant as expected; not the Plants check
```

Review round 1, R1-02 and the operator's decision (operator-decisions.md): the 116 affected plants of 317 are judged
here, every one as expected; this replaces the earlier `--list` record. Run in review fix 1, after `docker info`
(server 29.9.2), with the working tree holding the whole fix (the R1-01 source fix and both new shared bodies) before
its commit; `--affected` reads `git diff <base>` and the untracked files. The plants this phase changes (the eight
manifest plant trees' copies of `custom-elements.json` and the `why` of `visual/fail-token-changed`) are among the
116.
