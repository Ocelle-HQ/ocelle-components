# Plants of phase 1

- base: 8d104af23ce177ec4acbbfaba59bf433f9520d6d
- command: OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --affected 8d104af23ce177ec4acbbfaba59bf433f9520d6d
- exit: 0

```text
$ node gates/bin/plants.ts -- --affected 8d104af23ce177ec4acbbfaba59bf433f9520d6d
note: affected: every plant, by packages/elements/package.json (not mapped)
note: plant time: signoff/error-empty-range: 0.3 s
note: plant time: signoff/fail-no-trailer: 0.6 s
note: plant time: signoff/fail-trailer-mismatch: 0.8 s
note: plant time: signoff/pass-agent-self-signoff: 1.1 s
note: plant time: signoff/pass-unsigned-merge: 1.2 s
note: plant time: contrast/empty-list: 1.7 s
note: plant time: contrast/excluded-without-reason: 1.9 s
note: plant time: contrast/exempt-disabled-ink: 3.9 s
note: plant time: contrast/exempt-not-disabled-ink: 5.2 s
note: plant time: contrast/figure-mismatch: 5.6 s
note: plant time: unit-tests/error-no-test-file: 5.9 s
note: plant time: contrast/missing-required-pair: 6.0 s
note: plant time: contrast/non-text-below-threshold: 6.2 s
note: plant time: contrast/not-opaque: 6.3 s
note: plant time: contrast/required-pair-excluded: 6.5 s
note: plant time: contrast/repository-values: 6.5 s
note: plant time: contrast/text-below-threshold: 6.8 s
note: plant time: contrast/unknown-token: 6.8 s
note: plant time: contrast/unparsable-list: 7.0 s
note: plant time: brand-rules/a-monospace: 7.1 s
note: plant time: brand-rules/b-link-equals-accent: 7.3 s
note: plant time: brand-rules/b-ochre-pair-not-excluded: 7.3 s
note: plant time: brand-rules/c-extra-radius: 7.6 s
note: plant time: brand-rules/c-wrong-value: 7.6 s
note: plant time: brand-rules/d-rule-as-boundary: 7.9 s
note: plant time: brand-rules/e-light-chrome: 7.9 s
note: plant time: brand-rules/source-invalid: 8.2 s
note: plant time: brand-rules/repository-values: 8.2 s
note: plant time: manifest/break-missing: 8.9 s
note: plant time: manifest/pass-repository: 9.1 s
note: plant time: prefix/pass-outside-packages: 9.3 s
note: plant time: typecheck/fail-gate-source: 15.2 s
note: plant time: style-lint/fail-styles-outside-src: 16.8 s
note: plant time: unit-tests/fail-gates-test: 18.1 s
note: plant time: lint/fail-gate-source: 18.9 s
note: plant time: unit-tests/pass-gates-only: 19.2 s
note: plant time: prefix/fail-storybook-html-multiline-monospace: 19.5 s
note: plant time: prefix/fail-storybook-monospace: 19.8 s
note: plant time: pins/error-invalid-json: 19.9 s
note: plant time: test-lint/fail-gate-test: 19.9 s
note: plant time: pins/fail-allow-builds-entry: 20.0 s
note: plant time: pins/fail-allow-builds-missing: 20.1 s
note: plant time: pins/fail-allow-builds-other-version: 20.2 s
note: plant time: pins/fail-allow-builds-unpinned-approval: 20.2 s
note: plant time: pins/fail-allow-builds-unpinned-fsevents: 20.3 s
note: plant time: pins/fail-dangerously-allow-all-builds: 20.3 s
note: plant time: pins/fail-lockfile-outdated: 20.5 s
note: plant time: pins/fail-node-linker-hoisted: 20.5 s
note: plant time: pins/fail-node-version-missing: 20.6 s
note: plant time: pins/fail-node-version-not-exact: 20.6 s
note: plant time: pins/fail-package-manager-missing: 20.8 s
note: plant time: pins/fail-package-manager-not-exact: 20.8 s
note: plant time: pins/fail-public-hoist-pattern: 20.9 s
note: plant time: pins/fail-release-age-exclude: 20.9 s
note: plant time: pins/fail-release-age-short: 21.1 s
note: plant time: pins/fail-release-age-missing: 21.1 s
note: plant time: pins/fail-release-age-strict-missing: 21.2 s
note: plant time: pins/fail-release-age-strict-false: 21.2 s
note: plant time: pins/fail-workspace-caret: 21.4 s
note: plant time: pins/fail-shamefully-hoist: 21.4 s
note: plant time: pins/fail-workspace-star: 21.5 s
note: plant time: pins/fail-workspace-tilde: 21.5 s
note: plant time: pins/fail-workspace-version-differs: 21.6 s
note: plant time: pins/pass-approved-build: 21.6 s
note: plant time: pins/pass-matching: 21.8 s
note: plant time: manifest/break-not-json: 22.2 s
note: plant time: manifest/fail-lost-attribute: 22.5 s
note: plant time: manifest/pass-reordered: 23.0 s
note: plant time: typecheck/error-missing-reference: 25.6 s
note: plant time: typecheck/fail-implicit-any: 26.4 s
note: plant time: typecheck/fail-test-code: 29.3 s
note: plant time: typecheck/pass-fixture-excluded: 29.9 s
note: plant time: typecheck/pass-strict-file: 32.8 s
note: plant time: lint/error-unparsable: 37.0 s
note: plant time: lint/fail-floating-promise: 40.0 s
note: plant time: lint/pass-fixture-excluded: 44.0 s
note: plant time: style-lint/element-property-clash: 45.7 s
note: plant time: lint/pass-voided-promise: 46.9 s
note: plant time: style-lint/error-unparsable: 47.1 s
note: plant time: style-lint/fail-aspect-calc: 48.3 s
note: plant time: style-lint/fail-aspect-ratio-other: 48.3 s
note: plant time: style-lint/fail-calc-operand: 49.7 s
note: plant time: style-lint/fail-element-property-misspelt: 49.7 s
note: plant time: style-lint/fail-element-stylesheet: 51.0 s
note: plant time: style-lint/fail-element-template: 51.0 s
note: plant time: style-lint/fail-font-weight: 52.2 s
note: plant time: style-lint/fail-fit-content-length: 52.2 s
note: plant time: style-lint/fail-font-family: 53.5 s
note: plant time: style-lint/fail-gradient-angle: 53.5 s
note: plant time: style-lint/fail-gradient-length: 54.9 s
note: plant time: style-lint/fail-gradient-hex: 54.9 s
note: plant time: style-lint/fail-hex-colour: 56.2 s
note: plant time: style-lint/fail-iteration-count-fraction: 56.3 s
note: plant time: style-lint/fail-lh-calc-twice: 57.6 s
note: plant time: style-lint/fail-lh-calc-factor: 57.6 s
note: plant time: style-lint/fail-lh-multiple: 58.9 s
note: plant time: style-lint/fail-lh-multiple-calc: 58.9 s
note: plant time: style-lint/fail-minmax-auto: 60.2 s
note: plant time: style-lint/fail-lh-paren-factor: 60.2 s
note: plant time: style-lint/fail-ms-time: 61.5 s
note: plant time: style-lint/fail-named-colour: 61.5 s
note: plant time: style-lint/fail-rem-length: 62.8 s
note: plant time: style-lint/fail-radial-gradient: 62.9 s
note: plant time: style-lint/fail-rgb-colour: 64.3 s
note: plant time: style-lint/fail-scale-calc: 64.3 s
note: plant time: style-lint/fail-scale-length: 65.7 s
note: plant time: style-lint/fail-scale-factor: 65.7 s
note: plant time: style-lint/fail-styles-calc-line-height: 67.0 s
note: plant time: style-lint/fail-styles-font-without-line-height: 67.1 s
note: plant time: style-lint/fail-styles-literal-line-height: 68.5 s
note: plant time: style-lint/fail-styles-normal-line-height: 68.5 s
note: plant time: style-lint/fail-styles-percent-line-height: 69.9 s
note: plant time: style-lint/fail-styles-other-token-line-height: 69.9 s
note: plant time: style-lint/fail-styles-stylesheet: 71.2 s
note: plant time: style-lint/fail-translate-length: 71.2 s
note: plant time: style-lint/fail-unitless-number: 72.6 s
note: plant time: style-lint/fail-unknown-token: 72.6 s
note: plant time: style-lint/pass-anchor-name: 74.0 s
note: plant time: style-lint/fail-var-fallback: 74.0 s
note: plant time: style-lint/pass-calc-tokens: 75.4 s
note: plant time: style-lint/pass-aspect-square: 75.5 s
note: plant time: style-lint/pass-element-property: 76.9 s
note: plant time: style-lint/pass-empty-string: 76.9 s
note: plant time: style-lint/pass-grid-fit-content: 78.3 s
note: plant time: style-lint/pass-fr: 78.4 s
note: plant time: style-lint/pass-known-token: 79.7 s
note: plant time: style-lint/pass-iteration-count: 79.8 s
note: plant time: style-lint/pass-linear-gradient-tokens: 81.1 s
note: plant time: style-lint/pass-line-height: 81.1 s
note: plant time: style-lint/pass-one-line: 82.5 s
note: plant time: style-lint/pass-one-line-calc: 82.5 s
note: plant time: style-lint/pass-percentage: 83.9 s
note: plant time: style-lint/pass-scale-mirror: 83.9 s
note: plant time: style-lint/pass-styles-line-height-token: 85.3 s
note: plant time: style-lint/pass-story: 85.3 s
note: plant time: style-lint/pass-test-code: 86.7 s
note: plant time: style-lint/pass-system-colour: 86.7 s
note: plant time: style-lint/pass-translate-percentage: 88.1 s
note: plant time: style-lint/pass-token-definitions: 88.2 s
note: plant time: style-lint/pass-var-token: 89.7 s
note: plant time: style-lint/pass-var-keyword-fallback: 89.7 s
note: plant time: style-lint/pass-zero: 91.0 s
note: plant time: unit-tests/error-throws-while-loading: 95.8 s
note: plant time: unit-tests/fail-styles-test: 97.9 s
note: plant time: unit-tests/fail-tokens-colocated: 100.2 s
note: plant time: unit-tests/fail-elements-chromium: 101.3 s
note: plant time: unit-tests/fail-tokens-test: 101.6 s
note: plant time: unit-tests/pass-styles-only: 102.8 s
note: plant time: unit-tests/pass-elements-only: 103.4 s
note: plant time: unit-tests/pass-tokens-only: 104.2 s
note: plant time: test-lint/error-unparsable: 104.5 s
note: plant time: test-lint/fail-assertion-outside-test: 105.4 s
note: plant time: test-lint/fail-colocated-element-test: 105.6 s
note: plant time: test-lint/fail-conditional-assertion: 106.8 s
note: plant time: test-lint/fail-focused: 106.8 s
note: plant time: test-lint/fail-no-assertion: 108.0 s
note: plant time: test-lint/fail-not-awaited: 108.1 s
note: plant time: test-lint/fail-snapshot-only: 109.2 s
note: plant time: test-lint/fail-skipped: 109.2 s
note: plant time: csp/error-unparsable: 110.0 s
note: plant time: test-lint/pass-real-assertion: 110.5 s
note: plant time: csp/fail-eval: 110.8 s
note: plant time: csp/fail-event-handler: 111.2 s
note: plant time: csp/fail-function-call: 111.6 s
note: plant time: csp/fail-indirect-eval: 111.9 s
note: plant time: csp/fail-inline-script: 112.3 s
note: plant time: csp/fail-new-function: 112.6 s
note: plant time: csp/fail-set-interval-string: 113.0 s
note: plant time: csp/fail-set-timeout-string: 113.3 s
note: plant time: csp/fail-style-attribute: 113.7 s
note: plant time: csp/fail-style-attribute-after-newline: 114.0 s
note: plant time: csp/fail-style-element: 114.4 s
note: plant time: csp/fail-svg-slash-onload: 114.7 s
note: plant time: csp/pass-external-script: 115.2 s
note: plant time: csp/pass-function-timer: 115.4 s
note: plant time: csp/pass-inline-script-in-source: 115.9 s
note: plant time: csp/pass-look-alike-names: 116.1 s
note: plant time: prefix/error-invalid-utf8: 116.5 s
note: plant time: csp/pass-storybook-out-of-scope: 116.6 s
note: plant time: prefix/fail-custom-property-test-code: 116.9 s
note: plant time: prefix/fail-element-name: 116.9 s
note: plant time: prefix/fail-event-name-built-output: 117.3 s
note: plant time: prefix/fail-element-name-upper-case: 117.3 s
note: plant time: prefix/fail-generic-monospace: 117.7 s
note: plant time: prefix/fail-named-monospace: 117.7 s
note: plant time: config-copies/error-copy-missing: 118.0 s
note: plant time: prefix/pass-name-boundaries: 118.0 s
note: plant time: brand-rules/f-motion-not-zero: 118.4 s
note: plant time: brand-rules/g-forced-colours-override: 118.5 s
note: plant time: brand-rules/generator-throws: 118.9 s
note: plant time: brand-rules/g-system-colour-mapping: 118.9 s
note: plant time: contrast/source-throws: 119.3 s
note: plant time: brand-rules/source-throws: 119.3 s
note: plant time: manifest/fail-stale-property: 120.2 s
note: plant time: manifest/fail-undescribed-css-property: 120.2 s
note: plant time: manifest/fail-undescribed-event: 121.0 s
note: plant time: manifest/fail-undescribed-property: 121.2 s
note: plant time: manifest/fail-undescribed-css-part: 121.8 s
note: plant time: manifest/fail-undescribed-attribute: 122.1 s
note: plant time: pins/fail-caret-range: 122.3 s
note: plant time: pins/fail-tilde-range: 122.4 s
note: plant time: manifest/fail-undescribed-slot: 122.6 s
note: plant time: test-lint/pass-fixture-excluded: 123.7 s
note: plant time: unit-tests/pass-fixture-not-run: 123.9 s
note: plant time: mutation/error-unresolvable-base: 124.6 s
note: plant time: config-copies/fail-one-setting-differs: 124.9 s
note: plant time: config-copies/fail-test-pathspec-narrowed: 125.4 s
note: plant time: config-copies/pass-equal-copies: 125.7 s
note: plant time: mutation/error-dry-run-fails: 144.6 s
note: plant time: mutation/fail-gate-source-survivor: 145.1 s
note: plant time: mutation/error-zero-mutant-failing-test: 162.4 s
note: plant time: mutation/fail-element-source-survivor: 166.8 s
note: plant time: mutation/fail-disable-all: 180.5 s
note: plant time: mutation/fail-element-source-no-coverage: 189.0 s
note: plant time: mutation/fail-no-test-runs: 201.7 s
note: plant time: mutation/fail-record-without-reason: 206.4 s
note: plant time: mutation/fail-unchecked-line: 223.6 s
note: plant time: mutation/pass-element-source: 229.3 s
note: plant time: mutation/pass-fully-checked: 245.6 s
note: plant time: mutation/pass-test-only-change: 246.5 s
note: plant time: mutation/pass-reasoned-record: 247.7 s
note: plant time: mutation/pass-zero-mutant: 266.6 s
note: plant time: mutation/pass-compile-error: 268.2 s
note: plant time: mutation/fail-mixed-survivors: 297.8 s
note: plant time: storybook-build/error-config-unreadable: 1.7 s
note: plant time: storybook-build/error-missing-dependencies: 0.3 s
note: plant time: storybook-build/error-no-build-script: 0.3 s
note: plant time: storybook-build/fail-empty-index: 2.0 s
note: plant time: storybook-build/fail-not-csf: 1.4 s
note: plant time: storybook-build/fail-syntax-error: 1.3 s
note: plant time: storybook-build/fail-unresolved-import: 1.7 s
note: plant time: storybook-build/pass-repository: 1.9 s
note: plant time: storybook-build/pass-type-error-only: 2.0 s
note: plant time: visual/error-build-fails: 3.9 s
note: plant time: visual/error-host: 2.4 s
note: plant time: visual/error-index-pin: 0.8 s
note: plant time: visual/error-no-engine: 0.3 s
note: plant time: visual/error-tag-pin: 0.3 s
note: plant time: visual/fail-beacon: 364.3 s
note: plant time: visual/fail-below-fold: 352.0 s
note: plant time: visual/fail-cache-api: 358.1 s
note: plant time: visual/fail-clipboard-write: 360.7 s
note: plant time: visual/fail-closed-shadow-root: 368.8 s
note: plant time: visual/fail-cookie: 360.2 s
note: plant time: visual/fail-exec-copy: 360.6 s
note: plant time: visual/fail-font-file-missing: 361.6 s
note: plant time: visual/fail-font-not-loaded: 359.0 s
note: plant time: visual/fail-hover-style-changed: 363.9 s
note: plant time: visual/fail-indexeddb: 360.2 s
note: plant time: visual/fail-input-system-font: 355.7 s
note: plant time: visual/fail-local-storage: 355.8 s
note: plant time: visual/fail-missing-baseline: 361.9 s
note: plant time: visual/fail-network: 356.9 s
note: plant time: visual/fail-one-pixel: 356.3 s
note: plant time: visual/fail-other-font: 360.4 s
note: plant time: visual/fail-overflow-changed: 370.5 s
note: plant time: visual/fail-pointer-target-below-fold: 374.2 s
note: plant time: visual/fail-pointer-target-missing: 360.3 s
note: plant time: visual/fail-popover-changed: 359.1 s
note: plant time: visual/fail-press-style-changed: 358.2 s
note: plant time: visual/fail-random: 358.5 s
note: plant time: visual/fail-render-throws: 358.3 s
note: plant time: visual/fail-same-origin-fetch: 371.5 s
note: plant time: visual/fail-same-pixels-other-bytes: 374.7 s
note: plant time: visual/fail-session-storage: 354.5 s
note: plant time: visual/fail-storage-left-by-worker: 360.0 s
note: plant time: visual/fail-storage-property: 360.9 s
note: plant time: visual/fail-stray-baseline: 358.8 s
note: plant time: visual/fail-throws-on-load: 361.2 s
note: plant time: visual/fail-token-changed: 462.5 s
note: plant time: visual/fail-websocket: 359.0 s
note: plant time: visual/fail-xhr: 359.0 s
note: plant time: visual/pass-animation-and-caret: 361.6 s
note: plant time: visual/pass-below-fold: 361.6 s
note: plant time: visual/pass-focus-below-fold: 372.0 s
note: plant time: visual/pass-hover-and-press: 372.8 s
note: plant time: visual/pass-input-font: 366.3 s
note: plant time: visual/pass-overflow-and-popover: 358.1 s
note: plant time: visual/pass-repository: 355.4 s
note: plant time: visual/pass-second-render: 361.2 s
note: plant time: visual/pass-unused-face: 358.6 s
note: plant time: axe/error-bad-exceptions: 0.6 s
note: plant time: axe/error-build-fails: 1.9 s
note: plant time: axe/error-exception-plan-not-a-plan: 0.7 s
note: plant time: axe/fail-closed-shadow-root: 189.4 s
note: plant time: axe/fail-empty: 190.9 s
note: plant time: axe/fail-excepted-second-node: 189.7 s
note: plant time: axe/fail-hover-near-fold: 193.9 s
note: plant time: axe/fail-hover-reveals-unlabelled: 198.8 s
note: plant time: axe/fail-incomplete: 195.2 s
note: plant time: axe/fail-no-box: 194.5 s
note: plant time: axe/fail-open-shadow-unlabelled: 195.2 s
note: plant time: axe/fail-outside-root: 195.6 s
note: plant time: axe/fail-pointer-target-below-fold: 194.9 s
note: plant time: axe/fail-render-throws: 195.2 s
note: plant time: axe/fail-stale-exception: 193.3 s
note: plant time: axe/fail-throws-on-load: 194.8 s
note: plant time: axe/fail-two-low-contrast: 197.4 s
note: plant time: axe/fail-unlabelled-button: 192.6 s
note: plant time: axe/fail-unrecorded-exception: 189.6 s
note: plant time: axe/pass-excepted: 190.0 s
note: plant time: axe/pass-excepted-incomplete: 191.5 s
note: plant time: axe/pass-excepted-shadow: 189.6 s
note: plant time: axe/pass-minor-only: 193.0 s
note: plant time: axe/pass-repository: 194.1 s
note: plant time: axe/pass-second-render: 190.4 s
note: plant time: plants/fail-gate-without-entry: 0.0 s
note: plant time: plants/fail-gate-without-job: 0.0 s
note: plant time: plants/fail-affected-in-plant-check: 0.0 s
note: plant time: plants/fail-shard-in-plant-check: 0.0 s
note: plant time: plants/fail-skip-container-in-ci: 0.0 s
note: plant time: plants/fail-skip-container-in-shard: 0.0 s
note: plant time: plants/pass-split-plant-jobs: 0.0 s
note: plant time: plants/pass-matching: 0.0 s
plants: affected since 8d104af23ce177ec4acbbfaba59bf433f9520d6d: 314 of 314 plants judged, every plant as expected; not the Plants check
```

## T088: the checker-failure plant on the green gate (850102d)

- base: 8d104af23ce177ec4acbbfaba59bf433f9520d6d
- command: `OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --affected 8d104af23ce177ec4acbbfaba59bf433f9520d6d` was started first; it selected every plant (`packages/elements/package.json`, not mapped) and was stopped by the session's two-hour limit on a background command at 256 of 315 plant times, in the visual plants, before any verdict was printed. The plants were then run by shard, as CI's plants-shard job does: shards 1 to 4 are every plant of every gate but visual and axe (the mutation plants among them); the gate change touches no visual or axe input. Each shard as below.
- exit: 0, 0, 0, 1 (shard 4: the new plant `mutation/error-checker-failure` not reported broken, as T088 expects of the green gate; `mutation/pass-compile-error` and every other plant as expected)

```text
=== shard 1
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 1
$ node gates/bin/plants.ts -- --shard 1
note: plant time: brand-rules/a-monospace: 0.4 s
note: plant time: contrast/non-text-below-threshold: 0.4 s
note: plant time: brand-rules/c-wrong-value: 0.8 s
note: plant time: brand-rules/source-invalid: 0.8 s
note: plant time: signoff/error-empty-range: 0.9 s
note: plant time: signoff/pass-unsigned-merge: 0.9 s
note: plant time: contrast/exempt-disabled-ink: 1.3 s
note: plant time: prefix/fail-storybook-html-multiline-monospace: 1.7 s
note: plant time: pins/fail-allow-builds-other-version: 1.9 s
note: plant time: pins/fail-dangerously-allow-all-builds: 2.1 s
note: plant time: pins/fail-node-version-not-exact: 2.4 s
note: plant time: pins/fail-release-age-exclude: 2.6 s
note: plant time: pins/fail-release-age-strict-missing: 2.8 s
note: plant time: pins/fail-workspace-star: 3.0 s
note: plant time: pins/pass-matching: 3.2 s
note: plant time: manifest/break-not-json: 4.0 s
note: plant time: typecheck/error-missing-reference: 9.1 s
note: plant time: lint/fail-gate-source: 10.1 s
note: plant time: style-lint/fail-aspect-calc: 12.0 s
note: plant time: typecheck/pass-fixture-excluded: 13.4 s
note: plant time: style-lint/fail-element-stylesheet: 13.8 s
note: plant time: style-lint/fail-hex-colour: 15.0 s
note: plant time: style-lint/fail-font-weight: 15.4 s
note: plant time: style-lint/fail-lh-multiple: 16.7 s
note: plant time: style-lint/fail-ms-time: 17.0 s
note: plant time: style-lint/fail-rgb-colour: 18.5 s
note: plant time: style-lint/fail-styles-calc-line-height: 18.6 s
note: plant time: style-lint/fail-styles-other-token-line-height: 20.1 s
note: plant time: style-lint/fail-translate-length: 20.2 s
note: plant time: style-lint/pass-empty-string: 21.7 s
note: plant time: style-lint/pass-anchor-name: 21.7 s
note: plant time: style-lint/pass-known-token: 23.4 s
note: plant time: style-lint/pass-one-line-calc: 23.4 s
note: plant time: style-lint/pass-styles-line-height-token: 24.9 s
note: plant time: style-lint/pass-translate-percentage: 25.0 s
note: plant time: test-lint/error-unparsable: 26.4 s
note: plant time: test-lint/fail-focused: 26.4 s
note: plant time: test-lint/fail-skipped: 27.8 s
note: plant time: unit-tests/fail-tokens-test: 29.4 s
note: plant time: unit-tests/fail-elements-chromium: 29.5 s
note: plant time: prefix/fail-element-name-upper-case: 29.9 s
note: plant time: csp/error-unparsable: 30.7 s
note: plant time: unit-tests/pass-styles-only: 31.0 s
note: plant time: csp/fail-indirect-eval: 31.5 s
note: plant time: csp/fail-set-timeout-string: 31.7 s
note: plant time: csp/fail-svg-slash-onload: 32.3 s
note: plant time: csp/pass-look-alike-names: 32.4 s
note: plant time: contrast/source-throws: 32.6 s
note: plant time: brand-rules/g-forced-colours-override: 32.9 s
note: plant time: manifest/fail-undescribed-slot: 33.6 s
note: plant time: manifest/fail-undescribed-css-part: 33.9 s
note: plant time: config-copies/fail-test-pathspec-narrowed: 34.1 s
note: plant time: mutation/error-dry-run-fails: 58.8 s
note: plant time: mutation/fail-no-test-runs: 61.0 s
note: plant time: mutation/fail-element-source-no-coverage: 88.7 s
note: plant time: mutation/pass-element-source: 90.7 s
note: plant time: mutation/pass-zero-mutant: 105.1 s
note: plant time: storybook-build/fail-empty-index: 2.1 s
note: plant time: storybook-build/pass-repository: 2.4 s
note: plant time: plants/fail-shard-in-plant-check: 0.0 s
note: plant time: plants/pass-split-plant-jobs: 0.0 s
plants: shard 1 of 29: 61 plants judged, every plant as expected
exit: 0
=== shard 2
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 2
$ node gates/bin/plants.ts -- --shard 2
note: plant time: signoff/fail-no-trailer: 0.2 s
note: plant time: contrast/exempt-not-disabled-ink: 0.6 s
note: plant time: contrast/text-below-threshold: 0.7 s
note: plant time: brand-rules/b-link-equals-accent: 1.2 s
note: plant time: brand-rules/d-rule-as-boundary: 1.2 s
note: plant time: contrast/not-opaque: 1.7 s
note: plant time: unit-tests/fail-gates-test: 3.5 s
note: plant time: typecheck/fail-gate-source: 5.4 s
note: plant time: style-lint/fail-styles-outside-src: 5.6 s
note: plant time: pins/fail-allow-builds-unpinned-approval: 5.8 s
note: plant time: pins/error-invalid-json: 6.0 s
note: plant time: prefix/fail-storybook-monospace: 6.5 s
note: plant time: pins/fail-package-manager-missing: 6.6 s
note: plant time: pins/fail-release-age-missing: 6.8 s
note: plant time: test-lint/fail-gate-test: 7.0 s
note: plant time: pins/fail-shamefully-hoist: 7.1 s
note: plant time: pins/fail-lockfile-outdated: 7.2 s
note: plant time: manifest/fail-lost-attribute: 8.2 s
note: plant time: manifest/pass-reordered: 8.3 s
note: plant time: unit-tests/pass-elements-only: 11.9 s
note: plant time: typecheck/pass-strict-file: 17.6 s
note: plant time: lint/pass-fixture-excluded: 17.8 s
note: plant time: unit-tests/pass-tokens-only: 19.3 s
note: plant time: style-lint/fail-aspect-ratio-other: 19.7 s
note: plant time: style-lint/fail-element-template: 21.4 s
note: plant time: style-lint/fail-gradient-angle: 21.7 s
note: plant time: style-lint/fail-iteration-count-fraction: 23.1 s
note: plant time: style-lint/fail-lh-multiple-calc: 23.5 s
note: plant time: style-lint/fail-styles-font-without-line-height: 25.0 s
note: plant time: style-lint/fail-scale-calc: 25.5 s
note: plant time: style-lint/fail-named-colour: 26.9 s
note: plant time: pins/fail-workspace-tilde: 27.2 s
note: plant time: style-lint/fail-unitless-number: 27.2 s
note: plant time: style-lint/pass-var-keyword-fallback: 29.0 s
note: plant time: style-lint/pass-line-height: 29.1 s
note: plant time: style-lint/pass-percentage: 31.0 s
note: plant time: style-lint/pass-aspect-square: 31.0 s
note: plant time: test-lint/fail-assertion-outside-test: 32.6 s
note: plant time: style-lint/pass-system-colour: 32.8 s
note: plant time: test-lint/fail-snapshot-only: 34.1 s
note: plant time: style-lint/pass-fr: 34.5 s
note: plant time: csp/fail-inline-script: 34.9 s
note: plant time: csp/fail-style-attribute: 35.4 s
note: plant time: csp/pass-external-script: 35.8 s
note: plant time: prefix/error-invalid-utf8: 36.3 s
note: plant time: csp/pass-storybook-out-of-scope: 36.4 s
note: plant time: prefix/fail-event-name-built-output: 36.9 s
note: plant time: brand-rules/source-throws: 37.4 s
note: plant time: csp/fail-eval: 37.4 s
note: plant time: brand-rules/g-system-colour-mapping: 37.9 s
note: plant time: manifest/fail-undescribed-css-property: 38.5 s
note: plant time: config-copies/pass-equal-copies: 38.9 s
note: plant time: mutation/error-unresolvable-base: 39.0 s
note: plant time: mutation/pass-fully-checked: 66.7 s
note: plant time: mutation/fail-element-source-survivor: 67.8 s
note: plant time: mutation/fail-record-without-reason: 82.4 s
note: plant time: storybook-build/error-config-unreadable: 1.0 s
note: plant time: storybook-build/fail-not-csf: 1.5 s
note: plant time: storybook-build/pass-type-error-only: 2.2 s
note: plant time: plants/fail-affected-in-plant-check: 0.0 s
note: plant time: plants/fail-skip-container-in-ci: 0.0 s
plants: shard 2 of 29: 61 plants judged, every plant as expected
exit: 0
=== shard 3
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 3
$ node gates/bin/plants.ts -- --shard 3
note: plant time: contrast/repository-values: 0.4 s
note: plant time: contrast/unknown-token: 0.9 s
note: plant time: brand-rules/b-ochre-pair-not-excluded: 1.2 s
note: plant time: signoff/fail-trailer-mismatch: 1.4 s
note: plant time: unit-tests/error-no-test-file: 1.4 s
note: plant time: brand-rules/e-light-chrome: 1.8 s
note: plant time: contrast/figure-mismatch: 2.2 s
note: plant time: manifest/pass-repository: 2.3 s
note: plant time: pins/fail-allow-builds-entry: 2.5 s
note: plant time: contrast/empty-list: 2.6 s
note: plant time: pins/fail-allow-builds-unpinned-fsevents: 2.7 s
note: plant time: pins/fail-node-linker-hoisted: 2.7 s
note: plant time: pins/fail-package-manager-not-exact: 2.9 s
note: plant time: pins/fail-release-age-short: 2.9 s
note: plant time: pins/fail-workspace-version-differs: 3.1 s
note: plant time: typecheck/fail-implicit-any: 7.2 s
note: plant time: lint/pass-voided-promise: 12.2 s
note: plant time: unit-tests/fail-styles-test: 14.0 s
note: plant time: test-lint/fail-colocated-element-test: 15.7 s
note: plant time: lint/error-unparsable: 16.2 s
note: plant time: test-lint/fail-no-assertion: 17.2 s
note: plant time: style-lint/element-property-clash: 17.7 s
note: plant time: style-lint/fail-calc-operand: 18.7 s
note: plant time: style-lint/fail-fit-content-length: 19.2 s
note: plant time: style-lint/fail-gradient-hex: 20.5 s
note: plant time: style-lint/fail-lh-calc-factor: 20.9 s
note: plant time: style-lint/fail-radial-gradient: 22.2 s
note: plant time: style-lint/fail-lh-paren-factor: 22.6 s
note: plant time: style-lint/fail-scale-factor: 24.2 s
note: plant time: style-lint/fail-styles-literal-line-height: 24.3 s
note: plant time: style-lint/fail-styles-percent-line-height: 26.1 s
note: plant time: style-lint/fail-unknown-token: 26.2 s
note: plant time: style-lint/pass-grid-fit-content: 27.9 s
note: plant time: style-lint/pass-calc-tokens: 28.0 s
note: plant time: style-lint/pass-linear-gradient-tokens: 29.7 s
note: plant time: style-lint/pass-scale-mirror: 29.8 s
note: plant time: style-lint/pass-test-code: 31.4 s
note: plant time: style-lint/pass-var-token: 31.5 s
note: plant time: csp/fail-event-handler: 32.3 s
note: plant time: csp/fail-new-function: 32.3 s
note: plant time: csp/fail-style-attribute-after-newline: 33.2 s
note: plant time: csp/pass-function-timer: 33.2 s
note: plant time: prefix/pass-name-boundaries: 33.7 s
note: plant time: prefix/fail-custom-property-test-code: 33.7 s
note: plant time: config-copies/error-copy-missing: 34.1 s
note: plant time: prefix/fail-generic-monospace: 34.1 s
note: plant time: manifest/fail-stale-property: 35.1 s
note: plant time: manifest/fail-undescribed-event: 35.4 s
note: plant time: pins/fail-tilde-range: 35.6 s
note: plant time: brand-rules/generator-throws: 35.7 s
note: plant time: unit-tests/pass-fixture-not-run: 37.2 s
note: plant time: test-lint/pass-fixture-excluded: 37.3 s
note: plant time: mutation/error-zero-mutant-failing-test: 61.6 s
note: plant time: mutation/fail-gate-source-survivor: 64.2 s
note: plant time: mutation/fail-unchecked-line: 87.9 s
note: plant time: mutation/pass-reasoned-record: 87.9 s
note: plant time: storybook-build/error-missing-dependencies: 0.4 s
note: plant time: storybook-build/fail-syntax-error: 1.5 s
note: plant time: plants/fail-gate-without-entry: 0.0 s
note: plant time: plants/fail-skip-container-in-shard: 0.0 s
plants: shard 3 of 29: 60 plants judged, every plant as expected
exit: 0
=== shard 4
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 4
$ node gates/bin/plants.ts -- --shard 4
note: plant time: signoff/pass-agent-self-signoff: 0.2 s
note: plant time: contrast/unparsable-list: 0.3 s
note: plant time: brand-rules/c-extra-radius: 0.6 s
note: plant time: contrast/excluded-without-reason: 0.7 s
note: plant time: brand-rules/repository-values: 1.0 s
note: plant time: manifest/break-missing: 1.2 s
note: plant time: contrast/required-pair-excluded: 1.3 s
note: plant time: contrast/missing-required-pair: 1.6 s
note: plant time: prefix/pass-outside-packages: 1.6 s
note: plant time: pins/fail-allow-builds-missing: 1.8 s
note: plant time: pins/fail-public-hoist-pattern: 2.1 s
note: plant time: pins/fail-node-version-missing: 2.3 s
note: plant time: pins/fail-release-age-strict-false: 2.5 s
note: plant time: pins/fail-workspace-caret: 2.8 s
note: plant time: pins/pass-approved-build: 2.9 s
note: plant time: unit-tests/pass-gates-only: 3.1 s
note: plant time: unit-tests/error-throws-while-loading: 4.7 s
note: plant time: unit-tests/fail-tokens-colocated: 6.4 s
note: plant time: typecheck/fail-test-code: 7.2 s
note: plant time: test-lint/fail-not-awaited: 8.0 s
note: plant time: test-lint/fail-conditional-assertion: 8.6 s
note: plant time: csp/fail-function-call: 9.3 s
note: plant time: test-lint/pass-real-assertion: 9.5 s
note: plant time: csp/fail-set-interval-string: 10.2 s
note: plant time: csp/pass-inline-script-in-source: 10.3 s
note: plant time: prefix/fail-element-name: 10.7 s
note: plant time: csp/fail-style-element: 11.0 s
note: plant time: prefix/fail-named-monospace: 11.0 s
note: plant time: style-lint/fail-element-property-misspelt: 12.7 s
note: plant time: style-lint/error-unparsable: 12.8 s
note: plant time: style-lint/fail-font-family: 14.4 s
note: plant time: style-lint/fail-lh-calc-twice: 14.6 s
note: plant time: style-lint/fail-rem-length: 16.1 s
note: plant time: style-lint/fail-styles-stylesheet: 16.2 s
note: plant time: style-lint/fail-styles-normal-line-height: 18.1 s
note: plant time: style-lint/fail-minmax-auto: 18.2 s
note: plant time: style-lint/pass-element-property: 19.9 s
note: plant time: style-lint/fail-scale-length: 20.1 s
note: plant time: style-lint/fail-var-fallback: 21.6 s
note: plant time: style-lint/pass-one-line: 21.8 s
note: plant time: style-lint/pass-iteration-count: 23.5 s
note: plant time: style-lint/pass-story: 23.7 s
note: plant time: style-lint/fail-gradient-length: 25.6 s
note: plant time: style-lint/pass-zero: 25.6 s
note: plant time: brand-rules/f-motion-not-zero: 26.1 s
note: plant time: manifest/fail-undescribed-attribute: 27.1 s
note: plant time: style-lint/pass-token-definitions: 27.8 s
note: plant time: manifest/fail-undescribed-property: 28.6 s
note: plant time: pins/fail-caret-range: 28.7 s
note: plant time: config-copies/fail-one-setting-differs: 29.4 s
note: plant time: lint/fail-floating-promise: 39.3 s
note: plant time: mutation/fail-disable-all: 68.3 s
note: plant time: mutation/error-checker-failure: 68.7 s
note: plant time: mutation/pass-test-only-change: 69.6 s
note: plant time: mutation/pass-compile-error: 96.7 s
note: plant time: mutation/fail-mixed-survivors: 118.1 s
note: plant time: storybook-build/error-no-build-script: 0.4 s
note: plant time: storybook-build/fail-unresolved-import: 2.0 s
note: plant time: plants/pass-matching: 0.0 s
note: plant time: plants/fail-gate-without-job: 0.0 s
gates/plants/mutation/error-checker-failure: plants: not-reported-broken: expected exit 2 (could not run), got exit 0
plants: 1 problem in 60 plants
[ELIFECYCLE] Command failed with exit code 1.
exit: 1
```

## T089: the gate change (working tree on 850102d with T089's change, committed with this record)

- base: 8d104af23ce177ec4acbbfaba59bf433f9520d6d
- command: `OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard <n>` for n = 1 to 4, as for T088
- exit: 0, 0, 0, 0 (`mutation/error-checker-failure` now reported broken with its cause, `mutation/pass-compile-error` passing)

```text
=== shard 1
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 1
$ node gates/bin/plants.ts -- --shard 1
note: plant time: contrast/non-text-below-threshold: 0.4 s
note: plant time: brand-rules/a-monospace: 0.5 s
note: plant time: signoff/pass-unsigned-merge: 0.6 s
note: plant time: brand-rules/c-wrong-value: 0.9 s
note: plant time: contrast/exempt-disabled-ink: 0.9 s
note: plant time: signoff/error-empty-range: 1.1 s
note: plant time: brand-rules/source-invalid: 1.3 s
note: plant time: pins/fail-allow-builds-other-version: 1.5 s
note: plant time: pins/fail-dangerously-allow-all-builds: 1.7 s
note: plant time: pins/fail-node-version-not-exact: 1.9 s
note: plant time: pins/fail-release-age-exclude: 2.0 s
note: plant time: pins/fail-release-age-strict-missing: 2.3 s
note: plant time: pins/fail-workspace-star: 2.5 s
note: plant time: prefix/fail-storybook-html-multiline-monospace: 3.2 s
note: plant time: pins/pass-matching: 3.4 s
note: plant time: manifest/break-not-json: 4.3 s
note: plant time: typecheck/error-missing-reference: 9.6 s
note: plant time: lint/fail-gate-source: 11.1 s
note: plant time: unit-tests/fail-tokens-test: 13.1 s
note: plant time: typecheck/pass-fixture-excluded: 14.7 s
note: plant time: unit-tests/pass-styles-only: 15.2 s
note: plant time: test-lint/error-unparsable: 16.3 s
note: plant time: test-lint/fail-focused: 18.1 s
note: plant time: unit-tests/fail-elements-chromium: 18.7 s
note: plant time: csp/error-unparsable: 19.4 s
note: plant time: csp/fail-indirect-eval: 20.5 s
note: plant time: test-lint/fail-skipped: 20.7 s
note: plant time: csp/fail-set-timeout-string: 21.7 s
note: plant time: csp/fail-svg-slash-onload: 21.9 s
note: plant time: csp/pass-look-alike-names: 22.8 s
note: plant time: style-lint/fail-aspect-calc: 23.8 s
note: plant time: style-lint/fail-font-weight: 24.6 s
note: plant time: style-lint/fail-element-stylesheet: 25.5 s
note: plant time: style-lint/fail-hex-colour: 26.2 s
note: plant time: style-lint/fail-lh-multiple: 27.3 s
note: plant time: style-lint/fail-ms-time: 27.7 s
note: plant time: style-lint/fail-rgb-colour: 29.1 s
note: plant time: style-lint/fail-styles-other-token-line-height: 29.5 s
note: plant time: style-lint/fail-styles-calc-line-height: 31.0 s
note: plant time: style-lint/pass-anchor-name: 31.3 s
note: plant time: style-lint/fail-translate-length: 32.9 s
note: plant time: style-lint/pass-one-line-calc: 33.1 s
note: plant time: style-lint/pass-known-token: 34.7 s
note: plant time: style-lint/pass-styles-line-height-token: 34.9 s
note: plant time: prefix/fail-element-name-upper-case: 35.5 s
note: plant time: style-lint/pass-translate-percentage: 36.7 s
note: plant time: contrast/source-throws: 37.2 s
note: plant time: style-lint/pass-empty-string: 37.4 s
note: plant time: brand-rules/g-forced-colours-override: 37.9 s
note: plant time: manifest/fail-undescribed-css-part: 38.7 s
note: plant time: manifest/fail-undescribed-slot: 39.1 s
note: plant time: config-copies/fail-test-pathspec-narrowed: 39.3 s
note: plant time: mutation/error-dry-run-fails: 62.9 s
note: plant time: mutation/fail-no-test-runs: 65.6 s
note: plant time: mutation/pass-zero-mutant: 89.9 s
note: plant time: mutation/pass-element-source: 91.4 s
note: plant time: mutation/fail-element-source-no-coverage: 111.2 s
note: plant time: storybook-build/fail-empty-index: 2.1 s
note: plant time: storybook-build/pass-repository: 2.4 s
note: plant time: plants/pass-split-plant-jobs: 0.0 s
note: plant time: plants/fail-shard-in-plant-check: 0.0 s
plants: shard 1 of 29: 61 plants judged, every plant as expected
exit: 0
=== shard 2
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 2
$ node gates/bin/plants.ts -- --shard 2
note: plant time: contrast/text-below-threshold: 0.6 s
note: plant time: contrast/not-opaque: 0.6 s
note: plant time: brand-rules/b-link-equals-accent: 1.2 s
note: plant time: brand-rules/d-rule-as-boundary: 1.2 s
note: plant time: signoff/fail-no-trailer: 1.4 s
note: plant time: contrast/exempt-not-disabled-ink: 1.7 s
note: plant time: unit-tests/fail-gates-test: 3.6 s
note: plant time: typecheck/fail-gate-source: 5.4 s
note: plant time: test-lint/fail-gate-test: 5.4 s
note: plant time: prefix/fail-storybook-monospace: 5.9 s
note: plant time: pins/error-invalid-json: 6.0 s
note: plant time: pins/fail-allow-builds-unpinned-approval: 6.2 s
note: plant time: pins/fail-lockfile-outdated: 6.4 s
note: plant time: pins/fail-package-manager-missing: 6.6 s
note: plant time: pins/fail-release-age-missing: 6.8 s
note: plant time: pins/fail-shamefully-hoist: 7.1 s
note: plant time: style-lint/fail-styles-outside-src: 7.1 s
note: plant time: manifest/fail-lost-attribute: 8.2 s
note: plant time: manifest/pass-reordered: 9.5 s
note: plant time: typecheck/pass-strict-file: 11.2 s
note: plant time: unit-tests/pass-tokens-only: 13.0 s
note: plant time: test-lint/fail-assertion-outside-test: 14.8 s
note: plant time: lint/pass-fixture-excluded: 18.2 s
note: plant time: unit-tests/pass-elements-only: 18.4 s
note: plant time: csp/fail-inline-script: 19.4 s
note: plant time: test-lint/fail-snapshot-only: 19.8 s
note: plant time: csp/fail-eval: 20.5 s
note: plant time: csp/fail-style-attribute: 20.8 s
note: plant time: csp/pass-external-script: 21.4 s
note: plant time: csp/pass-storybook-out-of-scope: 21.8 s
note: plant time: prefix/fail-event-name-built-output: 22.0 s
note: plant time: prefix/error-invalid-utf8: 22.3 s
note: plant time: style-lint/fail-aspect-ratio-other: 23.9 s
note: plant time: style-lint/fail-element-template: 24.3 s
note: plant time: style-lint/fail-gradient-angle: 25.8 s
note: plant time: style-lint/fail-iteration-count-fraction: 26.0 s
note: plant time: style-lint/fail-lh-multiple-calc: 27.6 s
note: plant time: style-lint/fail-named-colour: 27.8 s
note: plant time: style-lint/fail-scale-calc: 29.4 s
note: plant time: style-lint/fail-unitless-number: 29.4 s
note: plant time: style-lint/pass-percentage: 31.1 s
note: plant time: style-lint/fail-styles-font-without-line-height: 31.2 s
note: plant time: style-lint/pass-fr: 32.8 s
note: plant time: style-lint/pass-aspect-square: 32.9 s
note: plant time: style-lint/pass-line-height: 34.6 s
note: plant time: style-lint/pass-var-keyword-fallback: 34.8 s
note: plant time: pins/fail-workspace-tilde: 35.0 s
note: plant time: brand-rules/g-system-colour-mapping: 35.6 s
note: plant time: brand-rules/source-throws: 36.1 s
note: plant time: style-lint/pass-system-colour: 36.7 s
note: plant time: manifest/fail-undescribed-css-property: 37.4 s
note: plant time: config-copies/pass-equal-copies: 37.9 s
note: plant time: mutation/error-unresolvable-base: 37.9 s
note: plant time: mutation/fail-record-without-reason: 62.0 s
note: plant time: mutation/fail-element-source-survivor: 67.0 s
note: plant time: mutation/pass-fully-checked: 82.0 s
note: plant time: storybook-build/error-config-unreadable: 1.1 s
note: plant time: storybook-build/fail-not-csf: 1.5 s
note: plant time: storybook-build/pass-type-error-only: 2.3 s
note: plant time: plants/fail-affected-in-plant-check: 0.0 s
note: plant time: plants/fail-skip-container-in-ci: 0.0 s
plants: shard 2 of 29: 61 plants judged, every plant as expected
exit: 0
=== shard 3
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 3
$ node gates/bin/plants.ts -- --shard 3
note: plant time: contrast/repository-values: 0.5 s
note: plant time: contrast/unknown-token: 0.8 s
note: plant time: brand-rules/b-ochre-pair-not-excluded: 1.2 s
note: plant time: unit-tests/error-no-test-file: 1.4 s
note: plant time: brand-rules/e-light-chrome: 1.7 s
note: plant time: signoff/fail-trailer-mismatch: 1.8 s
note: plant time: contrast/figure-mismatch: 1.9 s
note: plant time: contrast/empty-list: 2.3 s
note: plant time: pins/fail-allow-builds-entry: 2.5 s
note: plant time: pins/fail-allow-builds-unpinned-fsevents: 2.8 s
note: plant time: manifest/pass-repository: 3.0 s
note: plant time: pins/fail-node-linker-hoisted: 3.0 s
note: plant time: pins/fail-package-manager-not-exact: 3.1 s
note: plant time: pins/fail-release-age-short: 3.2 s
note: plant time: pins/fail-workspace-version-differs: 3.3 s
note: plant time: style-lint/element-property-clash: 5.3 s
note: plant time: style-lint/fail-gradient-hex: 7.4 s
note: plant time: typecheck/fail-implicit-any: 7.4 s
note: plant time: style-lint/fail-lh-calc-factor: 9.3 s
note: plant time: style-lint/fail-fit-content-length: 9.4 s
note: plant time: style-lint/fail-calc-operand: 11.2 s
note: plant time: style-lint/fail-radial-gradient: 11.2 s
note: plant time: style-lint/fail-scale-factor: 13.0 s
note: plant time: style-lint/fail-lh-paren-factor: 13.1 s
note: plant time: style-lint/fail-styles-literal-line-height: 14.8 s
note: plant time: style-lint/fail-styles-percent-line-height: 14.9 s
note: plant time: style-lint/fail-unknown-token: 16.7 s
note: plant time: style-lint/pass-calc-tokens: 16.8 s
note: plant time: style-lint/pass-grid-fit-content: 18.7 s
note: plant time: style-lint/pass-linear-gradient-tokens: 18.8 s
note: plant time: style-lint/pass-scale-mirror: 20.6 s
note: plant time: style-lint/pass-test-code: 20.7 s
note: plant time: test-lint/fail-no-assertion: 22.3 s
note: plant time: style-lint/pass-var-token: 22.5 s
note: plant time: unit-tests/fail-styles-test: 23.9 s
note: plant time: lint/error-unparsable: 33.0 s
note: plant time: lint/pass-voided-promise: 34.8 s
note: plant time: test-lint/fail-colocated-element-test: 34.9 s
note: plant time: csp/fail-event-handler: 35.8 s
note: plant time: csp/fail-new-function: 35.9 s
note: plant time: csp/fail-style-attribute-after-newline: 37.0 s
note: plant time: csp/pass-function-timer: 37.1 s
note: plant time: prefix/fail-custom-property-test-code: 37.5 s
note: plant time: prefix/pass-name-boundaries: 37.6 s
note: plant time: config-copies/error-copy-missing: 37.9 s
note: plant time: prefix/fail-generic-monospace: 38.2 s
note: plant time: brand-rules/generator-throws: 38.4 s
note: plant time: manifest/fail-stale-property: 39.3 s
note: plant time: pins/fail-tilde-range: 39.5 s
note: plant time: manifest/fail-undescribed-event: 39.7 s
note: plant time: test-lint/pass-fixture-excluded: 41.2 s
note: plant time: unit-tests/pass-fixture-not-run: 41.3 s
note: plant time: mutation/error-zero-mutant-failing-test: 65.3 s
note: plant time: mutation/fail-gate-source-survivor: 68.5 s
note: plant time: mutation/fail-unchecked-line: 95.3 s
note: plant time: mutation/pass-reasoned-record: 95.7 s
note: plant time: storybook-build/error-missing-dependencies: 0.4 s
note: plant time: storybook-build/fail-syntax-error: 1.8 s
note: plant time: plants/fail-gate-without-entry: 0.0 s
note: plant time: plants/fail-skip-container-in-shard: 0.0 s
plants: shard 3 of 29: 60 plants judged, every plant as expected
exit: 0
=== shard 4
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 4
$ node gates/bin/plants.ts -- --shard 4
note: plant time: contrast/required-pair-excluded: 0.7 s
note: plant time: contrast/missing-required-pair: 0.7 s
note: plant time: contrast/unparsable-list: 1.3 s
note: plant time: brand-rules/c-extra-radius: 1.3 s
note: plant time: brand-rules/repository-values: 1.9 s
note: plant time: signoff/pass-agent-self-signoff: 2.1 s
note: plant time: manifest/break-missing: 2.3 s
note: plant time: contrast/excluded-without-reason: 2.7 s
note: plant time: prefix/pass-outside-packages: 3.0 s
note: plant time: pins/fail-node-version-missing: 3.2 s
note: plant time: pins/fail-allow-builds-missing: 3.4 s
note: plant time: pins/fail-public-hoist-pattern: 3.6 s
note: plant time: pins/fail-release-age-strict-false: 3.8 s
note: plant time: pins/fail-workspace-caret: 4.0 s
note: plant time: unit-tests/pass-gates-only: 4.4 s
note: plant time: unit-tests/error-throws-while-loading: 6.4 s
note: plant time: typecheck/fail-test-code: 8.7 s
note: plant time: unit-tests/fail-tokens-colocated: 10.8 s
note: plant time: style-lint/error-unparsable: 13.1 s
note: plant time: style-lint/fail-element-property-misspelt: 15.7 s
note: plant time: lint/fail-floating-promise: 16.0 s
note: plant time: style-lint/fail-font-family: 17.8 s
note: plant time: style-lint/fail-lh-calc-twice: 18.0 s
note: plant time: style-lint/fail-minmax-auto: 19.9 s
note: plant time: style-lint/fail-rem-length: 20.0 s
note: plant time: style-lint/fail-scale-length: 22.1 s
note: plant time: style-lint/fail-styles-normal-line-height: 22.3 s
note: plant time: style-lint/fail-gradient-length: 24.3 s
note: plant time: style-lint/fail-styles-stylesheet: 24.5 s
note: plant time: style-lint/fail-var-fallback: 26.3 s
note: plant time: style-lint/pass-element-property: 26.4 s
note: plant time: style-lint/pass-iteration-count: 28.1 s
note: plant time: style-lint/pass-one-line: 28.3 s
note: plant time: style-lint/pass-zero: 30.0 s
note: plant time: style-lint/pass-story: 30.1 s
note: plant time: style-lint/pass-token-definitions: 31.8 s
note: plant time: test-lint/fail-conditional-assertion: 31.9 s
note: plant time: test-lint/fail-not-awaited: 33.5 s
note: plant time: test-lint/pass-real-assertion: 33.6 s
note: plant time: csp/fail-function-call: 34.5 s
note: plant time: csp/fail-style-element: 34.6 s
note: plant time: csp/fail-set-interval-string: 35.4 s
note: plant time: csp/pass-inline-script-in-source: 35.5 s
note: plant time: pins/pass-approved-build: 35.6 s
note: plant time: prefix/fail-element-name: 36.0 s
note: plant time: prefix/fail-named-monospace: 36.1 s
note: plant time: brand-rules/f-motion-not-zero: 36.6 s
note: plant time: manifest/fail-undescribed-property: 37.2 s
note: plant time: pins/fail-caret-range: 37.5 s
note: plant time: manifest/fail-undescribed-attribute: 37.6 s
note: plant time: config-copies/fail-one-setting-differs: 38.0 s
note: plant time: mutation/fail-disable-all: 62.4 s
note: plant time: mutation/error-checker-failure: 74.0 s
note: plant time: mutation/pass-test-only-change: 75.6 s
note: plant time: mutation/pass-compile-error: 92.8 s
note: plant time: mutation/fail-mixed-survivors: 118.1 s
note: plant time: storybook-build/error-no-build-script: 0.4 s
note: plant time: storybook-build/fail-unresolved-import: 1.9 s
note: plant time: plants/fail-gate-without-job: 0.0 s
note: plant time: plants/pass-matching: 0.0 s
plants: shard 4 of 29: 60 plants judged, every plant as expected
exit: 0
```

## T025: after the final source of phase 1 (a474f8f)

- base: 8d104af23ce177ec4acbbfaba59bf433f9520d6d
- command: `OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard <n>` for every shard n = 1 to 29, as CI's plants-shard job runs them, then `OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --verdict storybook/.visual/plant-shards`, as CI's plants job does. The shards ran in background batches that each fit inside the session's two-hour limit on a background command (`--affected` selects every plant, and a single run takes longer). Shards 1 to 7, then 8 to 13 (that batch was stopped inside shard 14, which is not counted), then 14 to 16, 17 to 20, 21 to 25 and 26 to 29, all on a474f8f's source (HEAD f85d2a1 changes only records).
- exit: 0 (the verdict); every shard 0

Verdict:

```text
$ node gates/bin/plants.ts -- --verdict storybook/.visual/plant-shards
plants: 315 plants of 17 gates and the registry judged, every plant as expected
exit: 0
```

Shards 1 to 13:

```text
=== shard 1
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 1
$ node gates/bin/plants.ts -- --shard 1
note: plant time: signoff/error-empty-range: 0.2 s
note: plant time: signoff/pass-unsigned-merge: 0.2 s
note: plant time: contrast/non-text-below-threshold: 0.6 s
note: plant time: brand-rules/a-monospace: 0.7 s
note: plant time: brand-rules/c-wrong-value: 1.0 s
note: plant time: brand-rules/source-invalid: 1.1 s
note: plant time: contrast/exempt-disabled-ink: 1.4 s
note: plant time: prefix/fail-storybook-html-multiline-monospace: 1.7 s
note: plant time: pins/fail-allow-builds-other-version: 1.9 s
note: plant time: pins/fail-dangerously-allow-all-builds: 2.1 s
note: plant time: pins/fail-release-age-exclude: 2.3 s
note: plant time: pins/fail-node-version-not-exact: 2.6 s
note: plant time: pins/fail-release-age-strict-missing: 2.8 s
note: plant time: manifest/break-not-json: 3.7 s
note: plant time: typecheck/error-missing-reference: 8.5 s
note: plant time: lint/fail-gate-source: 9.7 s
note: plant time: style-lint/fail-aspect-calc: 11.4 s
note: plant time: typecheck/pass-fixture-excluded: 12.4 s
note: plant time: style-lint/fail-font-weight: 13.2 s
note: plant time: style-lint/fail-element-stylesheet: 13.9 s
note: plant time: style-lint/fail-hex-colour: 14.7 s
note: plant time: style-lint/fail-lh-multiple: 15.5 s
note: plant time: style-lint/fail-ms-time: 16.2 s
note: plant time: style-lint/fail-rgb-colour: 17.1 s
note: plant time: style-lint/fail-styles-other-token-line-height: 17.7 s
note: plant time: style-lint/pass-anchor-name: 18.6 s
note: plant time: style-lint/fail-styles-calc-line-height: 19.2 s
note: plant time: style-lint/fail-translate-length: 20.2 s
note: plant time: style-lint/pass-empty-string: 20.8 s
note: plant time: style-lint/pass-known-token: 22.0 s
note: plant time: style-lint/pass-one-line-calc: 22.6 s
note: plant time: style-lint/pass-styles-line-height-token: 23.7 s
note: plant time: style-lint/pass-translate-percentage: 24.3 s
note: plant time: pins/pass-matching: 24.5 s
note: plant time: unit-tests/fail-tokens-test: 25.2 s
note: plant time: unit-tests/pass-styles-only: 25.9 s
note: plant time: test-lint/error-unparsable: 27.5 s
note: plant time: unit-tests/fail-elements-chromium: 28.3 s
note: plant time: test-lint/fail-skipped: 28.9 s
note: plant time: csp/error-unparsable: 29.0 s
note: plant time: csp/fail-indirect-eval: 29.8 s
note: plant time: test-lint/fail-focused: 30.1 s
note: plant time: csp/fail-set-timeout-string: 30.8 s
note: plant time: csp/fail-svg-slash-onload: 30.9 s
note: plant time: prefix/fail-element-name-upper-case: 31.3 s
note: plant time: pins/fail-workspace-star: 31.5 s
note: plant time: csp/pass-look-alike-names: 31.6 s
note: plant time: contrast/source-throws: 31.9 s
note: plant time: brand-rules/g-forced-colours-override: 32.0 s
note: plant time: manifest/fail-undescribed-slot: 32.9 s
note: plant time: manifest/fail-undescribed-css-part: 33.0 s
note: plant time: config-copies/fail-test-pathspec-narrowed: 33.3 s
note: plant time: mutation/error-dry-run-fails: 55.4 s
note: plant time: mutation/pass-element-source: 60.2 s
note: plant time: mutation/pass-zero-mutant: 77.8 s
note: plant time: mutation/fail-no-test-runs: 85.2 s
note: plant time: mutation/fail-element-source-no-coverage: 98.3 s
note: plant time: storybook-build/fail-empty-index: 2.0 s
note: plant time: storybook-build/pass-repository: 2.3 s
note: plant time: plants/fail-shard-in-plant-check: 0.0 s
note: plant time: plants/pass-split-plant-jobs: 0.0 s
plants: shard 1 of 29: 61 plants judged, every plant as expected
exit: 0
=== shard 2
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 2
$ node gates/bin/plants.ts -- --shard 2
note: plant time: signoff/fail-no-trailer: 0.1 s
note: plant time: contrast/exempt-not-disabled-ink: 0.4 s
note: plant time: contrast/not-opaque: 0.5 s
note: plant time: contrast/text-below-threshold: 0.8 s
note: plant time: brand-rules/d-rule-as-boundary: 0.9 s
note: plant time: brand-rules/b-link-equals-accent: 1.2 s
note: plant time: unit-tests/fail-gates-test: 2.9 s
note: plant time: test-lint/fail-gate-test: 4.5 s
note: plant time: prefix/fail-storybook-monospace: 5.1 s
note: plant time: pins/error-invalid-json: 5.3 s
note: plant time: typecheck/fail-gate-source: 5.5 s
note: plant time: pins/fail-allow-builds-unpinned-approval: 5.5 s
note: plant time: pins/fail-lockfile-outdated: 5.6 s
note: plant time: pins/fail-package-manager-missing: 5.7 s
note: plant time: pins/fail-shamefully-hoist: 5.8 s
note: plant time: pins/fail-workspace-tilde: 5.8 s
note: plant time: pins/fail-release-age-missing: 6.0 s
note: plant time: manifest/fail-lost-attribute: 6.7 s
note: plant time: manifest/pass-reordered: 6.9 s
note: plant time: style-lint/fail-styles-outside-src: 8.6 s
note: plant time: typecheck/pass-strict-file: 11.1 s
note: plant time: unit-tests/pass-elements-only: 14.4 s
note: plant time: test-lint/fail-assertion-outside-test: 16.1 s
note: plant time: lint/pass-fixture-excluded: 17.1 s
note: plant time: unit-tests/pass-tokens-only: 17.6 s
note: plant time: csp/fail-inline-script: 18.4 s
note: plant time: test-lint/fail-snapshot-only: 18.6 s
note: plant time: csp/fail-eval: 19.3 s
note: plant time: csp/pass-external-script: 19.5 s
note: plant time: csp/fail-style-attribute: 20.2 s
note: plant time: csp/pass-storybook-out-of-scope: 20.3 s
note: plant time: prefix/fail-event-name-built-output: 20.5 s
note: plant time: prefix/error-invalid-utf8: 20.7 s
note: plant time: brand-rules/g-system-colour-mapping: 20.9 s
note: plant time: brand-rules/source-throws: 21.1 s
note: plant time: manifest/fail-undescribed-css-property: 21.9 s
note: plant time: style-lint/fail-aspect-ratio-other: 22.6 s
note: plant time: style-lint/fail-element-template: 23.5 s
note: plant time: style-lint/fail-iteration-count-fraction: 24.2 s
note: plant time: style-lint/fail-scale-calc: 25.1 s
note: plant time: style-lint/fail-gradient-angle: 26.1 s
note: plant time: style-lint/fail-lh-multiple-calc: 27.1 s
note: plant time: style-lint/fail-unitless-number: 28.3 s
note: plant time: style-lint/pass-aspect-square: 29.1 s
note: plant time: style-lint/pass-fr: 30.2 s
note: plant time: style-lint/pass-percentage: 30.8 s
note: plant time: style-lint/pass-system-colour: 32.1 s
note: plant time: style-lint/pass-line-height: 32.4 s
note: plant time: style-lint/pass-var-keyword-fallback: 33.7 s
note: plant time: style-lint/fail-named-colour: 34.1 s
note: plant time: mutation/error-unresolvable-base: 35.1 s
note: plant time: style-lint/fail-styles-font-without-line-height: 35.4 s
note: plant time: config-copies/pass-equal-copies: 35.6 s
note: plant time: mutation/fail-record-without-reason: 58.3 s
note: plant time: mutation/pass-fully-checked: 61.4 s
note: plant time: mutation/fail-element-source-survivor: 79.1 s
note: plant time: storybook-build/error-config-unreadable: 1.2 s
note: plant time: storybook-build/fail-not-csf: 1.8 s
note: plant time: storybook-build/pass-type-error-only: 2.3 s
note: plant time: plants/fail-affected-in-plant-check: 0.0 s
note: plant time: plants/fail-skip-container-in-ci: 0.0 s
plants: shard 2 of 29: 61 plants judged, every plant as expected
exit: 0
=== shard 3
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 3
$ node gates/bin/plants.ts -- --shard 3
note: plant time: contrast/repository-values: 0.6 s
note: plant time: contrast/unknown-token: 1.1 s
note: plant time: unit-tests/error-no-test-file: 1.5 s
note: plant time: contrast/figure-mismatch: 1.6 s
note: plant time: brand-rules/b-ochre-pair-not-excluded: 2.1 s
note: plant time: manifest/pass-repository: 2.6 s
note: plant time: signoff/fail-trailer-mismatch: 2.7 s
note: plant time: brand-rules/e-light-chrome: 2.8 s
note: plant time: pins/fail-allow-builds-entry: 3.0 s
note: plant time: pins/fail-allow-builds-unpinned-fsevents: 3.2 s
note: plant time: contrast/empty-list: 3.3 s
note: plant time: pins/fail-node-linker-hoisted: 3.4 s
note: plant time: pins/fail-package-manager-not-exact: 3.5 s
note: plant time: pins/fail-release-age-short: 3.7 s
note: plant time: pins/fail-workspace-version-differs: 3.7 s
note: plant time: style-lint/element-property-clash: 5.7 s
note: plant time: typecheck/fail-implicit-any: 7.9 s
note: plant time: lint/pass-voided-promise: 15.3 s
note: plant time: style-lint/fail-calc-operand: 17.4 s
note: plant time: lint/error-unparsable: 17.9 s
note: plant time: style-lint/fail-fit-content-length: 19.4 s
note: plant time: style-lint/fail-gradient-hex: 19.7 s
note: plant time: style-lint/fail-lh-paren-factor: 21.2 s
note: plant time: style-lint/fail-lh-calc-factor: 21.4 s
note: plant time: style-lint/fail-radial-gradient: 23.0 s
note: plant time: style-lint/fail-styles-literal-line-height: 23.1 s
note: plant time: style-lint/fail-styles-percent-line-height: 24.7 s
note: plant time: style-lint/fail-scale-factor: 24.9 s
note: plant time: style-lint/fail-unknown-token: 26.7 s
note: plant time: style-lint/pass-calc-tokens: 26.8 s
note: plant time: style-lint/pass-grid-fit-content: 28.6 s
note: plant time: style-lint/pass-linear-gradient-tokens: 28.7 s
note: plant time: style-lint/pass-test-code: 30.3 s
note: plant time: style-lint/pass-scale-mirror: 30.4 s
note: plant time: test-lint/fail-colocated-element-test: 31.8 s
note: plant time: style-lint/pass-var-token: 32.0 s
note: plant time: test-lint/fail-no-assertion: 33.2 s
note: plant time: unit-tests/fail-styles-test: 33.5 s
note: plant time: csp/fail-event-handler: 34.1 s
note: plant time: csp/fail-new-function: 34.4 s
note: plant time: prefix/fail-custom-property-test-code: 34.9 s
note: plant time: csp/fail-style-attribute-after-newline: 34.9 s
note: plant time: prefix/pass-name-boundaries: 35.4 s
note: plant time: csp/pass-function-timer: 35.8 s
note: plant time: config-copies/error-copy-missing: 35.8 s
note: plant time: prefix/fail-generic-monospace: 36.3 s
note: plant time: manifest/fail-stale-property: 36.9 s
note: plant time: manifest/fail-undescribed-event: 37.3 s
note: plant time: brand-rules/generator-throws: 37.4 s
note: plant time: pins/fail-tilde-range: 37.5 s
note: plant time: test-lint/pass-fixture-excluded: 38.8 s
note: plant time: unit-tests/pass-fixture-not-run: 39.0 s
note: plant time: mutation/error-zero-mutant-failing-test: 60.6 s
note: plant time: mutation/fail-gate-source-survivor: 63.1 s
note: plant time: mutation/pass-reasoned-record: 85.5 s
note: plant time: mutation/fail-unchecked-line: 85.5 s
note: plant time: storybook-build/error-missing-dependencies: 0.4 s
note: plant time: storybook-build/fail-syntax-error: 1.6 s
note: plant time: plants/fail-gate-without-entry: 0.0 s
note: plant time: plants/fail-skip-container-in-shard: 0.0 s
plants: shard 3 of 29: 60 plants judged, every plant as expected
exit: 0
=== shard 4
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 4
$ node gates/bin/plants.ts -- --shard 4
note: plant time: contrast/required-pair-excluded: 0.5 s
note: plant time: contrast/missing-required-pair: 0.6 s
note: plant time: contrast/unparsable-list: 1.0 s
note: plant time: brand-rules/c-extra-radius: 1.1 s
note: plant time: brand-rules/repository-values: 1.6 s
note: plant time: manifest/break-missing: 1.9 s
note: plant time: signoff/pass-agent-self-signoff: 2.1 s
note: plant time: contrast/excluded-without-reason: 2.1 s
note: plant time: prefix/pass-outside-packages: 2.6 s
note: plant time: pins/fail-node-version-missing: 2.8 s
note: plant time: pins/fail-public-hoist-pattern: 3.0 s
note: plant time: pins/fail-workspace-caret: 3.1 s
note: plant time: pins/fail-release-age-strict-false: 3.3 s
note: plant time: pins/pass-approved-build: 3.5 s
note: plant time: unit-tests/pass-gates-only: 3.7 s
note: plant time: pins/fail-allow-builds-missing: 3.7 s
note: plant time: typecheck/fail-test-code: 7.8 s
note: plant time: unit-tests/fail-tokens-colocated: 9.5 s
note: plant time: unit-tests/error-throws-while-loading: 11.4 s
note: plant time: lint/fail-floating-promise: 12.2 s
note: plant time: test-lint/fail-conditional-assertion: 12.9 s
note: plant time: test-lint/fail-not-awaited: 13.8 s
note: plant time: test-lint/pass-real-assertion: 14.6 s
note: plant time: style-lint/fail-element-property-misspelt: 15.6 s
note: plant time: style-lint/fail-font-family: 16.4 s
note: plant time: style-lint/error-unparsable: 17.3 s
note: plant time: style-lint/fail-lh-calc-twice: 18.1 s
note: plant time: style-lint/fail-minmax-auto: 19.0 s
note: plant time: style-lint/fail-gradient-length: 19.7 s
note: plant time: style-lint/fail-rem-length: 20.7 s
note: plant time: style-lint/fail-scale-length: 21.5 s
note: plant time: style-lint/fail-styles-normal-line-height: 22.4 s
note: plant time: style-lint/fail-var-fallback: 23.2 s
note: plant time: style-lint/fail-styles-stylesheet: 24.0 s
note: plant time: style-lint/pass-element-property: 25.0 s
note: plant time: style-lint/pass-one-line: 25.7 s
note: plant time: style-lint/pass-iteration-count: 26.7 s
note: plant time: style-lint/pass-story: 27.5 s
note: plant time: style-lint/pass-token-definitions: 28.5 s
note: plant time: style-lint/pass-zero: 29.1 s
note: plant time: csp/fail-function-call: 29.5 s
note: plant time: csp/fail-style-element: 29.9 s
note: plant time: prefix/fail-named-monospace: 30.2 s
note: plant time: csp/pass-inline-script-in-source: 30.3 s
note: plant time: prefix/fail-element-name: 30.8 s
note: plant time: csp/fail-set-interval-string: 31.1 s
note: plant time: brand-rules/f-motion-not-zero: 31.6 s
note: plant time: manifest/fail-undescribed-attribute: 31.8 s
note: plant time: pins/fail-caret-range: 32.0 s
note: plant time: config-copies/fail-one-setting-differs: 32.4 s
note: plant time: manifest/fail-undescribed-property: 32.5 s
note: plant time: mutation/pass-compile-error: 59.2 s
note: plant time: mutation/pass-test-only-change: 61.6 s
note: plant time: mutation/error-checker-failure: 65.9 s
note: plant time: mutation/fail-disable-all: 84.9 s
note: plant time: mutation/fail-mixed-survivors: 108.9 s
note: plant time: storybook-build/error-no-build-script: 0.4 s
note: plant time: storybook-build/fail-unresolved-import: 2.0 s
note: plant time: plants/fail-gate-without-job: 0.0 s
note: plant time: plants/pass-matching: 0.0 s
plants: shard 4 of 29: 60 plants judged, every plant as expected
exit: 0
=== shard 5
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 5
$ node gates/bin/plants.ts -- --shard 5
note: plant time: visual/error-build-fails: 2.9 s
note: plant time: visual/error-host: 3.0 s
note: plant time: visual/error-index-pin: 1.2 s
plants: shard 5 of 29: 3 plants judged, every plant as expected
exit: 0
=== shard 6
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 6
$ node gates/bin/plants.ts -- --shard 6
note: plant time: visual/error-no-engine: 0.4 s
note: plant time: visual/error-tag-pin: 0.4 s
note: plant time: visual/fail-beacon: 402.1 s
plants: shard 6 of 29: 3 plants judged, every plant as expected
exit: 0
=== shard 7
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 7
$ node gates/bin/plants.ts -- --shard 7
note: plant time: visual/fail-below-fold: 402.3 s
note: plant time: visual/fail-cache-api: 399.3 s
note: plant time: visual/fail-clipboard-write: 395.2 s
plants: shard 7 of 29: 3 plants judged, every plant as expected
exit: 0
=== shard 8
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 8
$ node gates/bin/plants.ts -- --shard 8
note: plant time: visual/fail-closed-shadow-root: 389.0 s
note: plant time: visual/fail-cookie: 394.2 s
note: plant time: visual/fail-exec-copy: 381.3 s
plants: shard 8 of 29: 3 plants judged, every plant as expected
exit: 0
=== shard 9
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 9
$ node gates/bin/plants.ts -- --shard 9
note: plant time: visual/fail-font-file-missing: 387.7 s
note: plant time: visual/fail-font-not-loaded: 395.5 s
note: plant time: visual/fail-hover-style-changed: 388.5 s
plants: shard 9 of 29: 3 plants judged, every plant as expected
exit: 0
=== shard 10
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 10
$ node gates/bin/plants.ts -- --shard 10
note: plant time: visual/fail-indexeddb: 376.7 s
note: plant time: visual/fail-input-system-font: 383.4 s
note: plant time: visual/fail-local-storage: 388.5 s
plants: shard 10 of 29: 3 plants judged, every plant as expected
exit: 0
=== shard 11
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 11
$ node gates/bin/plants.ts -- --shard 11
note: plant time: visual/fail-missing-baseline: 398.8 s
note: plant time: visual/fail-network: 396.2 s
note: plant time: visual/fail-one-pixel: 392.3 s
plants: shard 11 of 29: 3 plants judged, every plant as expected
exit: 0
=== shard 12
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 12
$ node gates/bin/plants.ts -- --shard 12
note: plant time: visual/fail-other-font: 386.4 s
note: plant time: visual/fail-overflow-changed: 388.3 s
note: plant time: visual/fail-pointer-target-below-fold: 391.2 s
plants: shard 12 of 29: 3 plants judged, every plant as expected
exit: 0
=== shard 13
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 13
$ node gates/bin/plants.ts -- --shard 13
note: plant time: visual/fail-pointer-target-missing: 393.3 s
note: plant time: visual/fail-popover-changed: 392.5 s
note: plant time: visual/fail-press-style-changed: 403.6 s
plants: shard 13 of 29: 3 plants judged, every plant as expected
exit: 0
```

Shards 14 to 29:

```text
=== shard 14
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 14
$ node gates/bin/plants.ts -- --shard 14
note: plant time: visual/fail-random: 386.3 s
note: plant time: visual/fail-render-throws: 381.1 s
note: plant time: visual/fail-same-origin-fetch: 374.0 s
plants: shard 14 of 29: 3 plants judged, every plant as expected
exit: 0
=== shard 15
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 15
$ node gates/bin/plants.ts -- --shard 15
note: plant time: visual/fail-same-pixels-other-bytes: 370.8 s
note: plant time: visual/fail-session-storage: 375.3 s
note: plant time: visual/fail-storage-left-by-worker: 373.7 s
plants: shard 15 of 29: 3 plants judged, every plant as expected
exit: 0
=== shard 16
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 16
$ node gates/bin/plants.ts -- --shard 16
note: plant time: visual/fail-storage-property: 383.6 s
note: plant time: visual/fail-stray-baseline: 389.4 s
note: plant time: visual/fail-throws-on-load: 387.3 s
plants: shard 16 of 29: 3 plants judged, every plant as expected
exit: 0
=== shard 17
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 17
$ node gates/bin/plants.ts -- --shard 17
note: plant time: visual/fail-token-changed: 486.7 s
note: plant time: visual/fail-websocket: 377.7 s
note: plant time: visual/fail-xhr: 384.1 s
plants: shard 17 of 29: 3 plants judged, every plant as expected
exit: 0
=== shard 18
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 18
$ node gates/bin/plants.ts -- --shard 18
note: plant time: visual/pass-animation-and-caret: 376.3 s
note: plant time: visual/pass-below-fold: 376.4 s
note: plant time: visual/pass-focus-below-fold: 389.2 s
plants: shard 18 of 29: 3 plants judged, every plant as expected
exit: 0
=== shard 19
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 19
$ node gates/bin/plants.ts -- --shard 19
note: plant time: visual/pass-hover-and-press: 383.0 s
note: plant time: visual/pass-input-font: 390.9 s
note: plant time: visual/pass-overflow-and-popover: 379.6 s
plants: shard 19 of 29: 3 plants judged, every plant as expected
exit: 0
=== shard 20
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 20
$ node gates/bin/plants.ts -- --shard 20
note: plant time: visual/pass-repository: 381.0 s
note: plant time: visual/pass-second-render: 378.6 s
note: plant time: visual/pass-unused-face: 384.0 s
plants: shard 20 of 29: 3 plants judged, every plant as expected
exit: 0
=== shard 21
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 21
$ node gates/bin/plants.ts -- --shard 21
note: plant time: axe/error-bad-exceptions: 0.7 s
note: plant time: axe/error-build-fails: 2.0 s
note: plant time: axe/error-exception-plan-not-a-plan: 0.7 s
plants: shard 21 of 29: 3 plants judged, every plant as expected
exit: 0
=== shard 22
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 22
$ node gates/bin/plants.ts -- --shard 22
note: plant time: axe/fail-closed-shadow-root: 198.8 s
note: plant time: axe/fail-empty: 204.9 s
note: plant time: axe/fail-excepted-second-node: 198.2 s
plants: shard 22 of 29: 3 plants judged, every plant as expected
exit: 0
=== shard 23
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 23
$ node gates/bin/plants.ts -- --shard 23
note: plant time: axe/fail-hover-near-fold: 198.2 s
note: plant time: axe/fail-hover-reveals-unlabelled: 204.8 s
note: plant time: axe/fail-incomplete: 200.8 s
plants: shard 23 of 29: 3 plants judged, every plant as expected
exit: 0
=== shard 24
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 24
$ node gates/bin/plants.ts -- --shard 24
note: plant time: axe/fail-no-box: 203.0 s
note: plant time: axe/fail-open-shadow-unlabelled: 200.4 s
note: plant time: axe/fail-outside-root: 201.9 s
plants: shard 24 of 29: 3 plants judged, every plant as expected
exit: 0
=== shard 25
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 25
$ node gates/bin/plants.ts -- --shard 25
note: plant time: axe/fail-pointer-target-below-fold: 200.7 s
note: plant time: axe/fail-render-throws: 199.5 s
note: plant time: axe/fail-stale-exception: 206.6 s
plants: shard 25 of 29: 3 plants judged, every plant as expected
exit: 0
=== shard 26
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 26
$ node gates/bin/plants.ts -- --shard 26
note: plant time: axe/fail-throws-on-load: 193.7 s
note: plant time: axe/fail-two-low-contrast: 192.4 s
note: plant time: axe/fail-unlabelled-button: 194.0 s
plants: shard 26 of 29: 3 plants judged, every plant as expected
exit: 0
=== shard 27
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 27
$ node gates/bin/plants.ts -- --shard 27
note: plant time: axe/fail-unrecorded-exception: 198.5 s
note: plant time: axe/pass-excepted: 199.6 s
note: plant time: axe/pass-excepted-incomplete: 201.7 s
plants: shard 27 of 29: 3 plants judged, every plant as expected
exit: 0
=== shard 28
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 28
$ node gates/bin/plants.ts -- --shard 28
note: plant time: axe/pass-excepted-shadow: 202.1 s
note: plant time: axe/pass-minor-only: 203.9 s
note: plant time: axe/pass-repository: 200.0 s
plants: shard 28 of 29: 3 plants judged, every plant as expected
exit: 0
=== shard 29
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 29
$ node gates/bin/plants.ts -- --shard 29
note: plant time: axe/pass-second-render: 206.6 s
plants: shard 29 of 29: 1 plant judged, every plant as expected
exit: 0
```
