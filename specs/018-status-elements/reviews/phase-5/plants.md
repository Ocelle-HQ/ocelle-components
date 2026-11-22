# Plants of phase 5

- base: 4e8728e483683935a884cb24b9299926f1adc0bb
- command: `OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --affected $(cat specs/018-status-elements/reviews/phase-5/base.sha) --list`
- exit: 0

```text
$ node gates/bin/plants.ts -- --affected 4e8728e483683935a884cb24b9299926f1adc0bb --list
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
plants: affected since 4e8728e483683935a884cb24b9299926f1adc0bb: 116 of 317 plants selected, none judged (--list)
```

The selection is narrower than every plant this time (116 of 317: this phase changes no path `affectedPlants`
does not map). No plant was judged locally: by the orchestrator's rule for this phase (`reviews/operator-ci-first.md`:
locally only `gate:plants -- --affected <base> --list`) the selection is recorded here and CI's Plants check judges
every plant on the pull request. `reviews/operator-plants.md` says a phase whose selection is narrower runs it as the
tasks say; that run was not made here (a departure recorded in `notes.md`). The plants this phase changes (the eight
manifest plant trees' copies of `custom-elements.json` and the `why` of `visual/fail-token-changed`) are among the
116. Run with the working tree holding the whole green change, before its commit (`--affected` reads
`git diff <base>` and the untracked files).
