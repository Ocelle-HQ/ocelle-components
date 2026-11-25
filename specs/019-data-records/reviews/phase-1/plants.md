# Plants of phase 1

- base: 8d104af23ce177ec4acbbfaba59bf433f9520d6d
- command: `OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --affected 8d104af23ce177ec4acbbfaba59bf433f9520d6d --list` for the selection (every plant, by `gates/lib/mutation/report.ts`, shared gate source), then `OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard <n>` for every shard n = 1 to 29, as CI's plants-shard job runs them, then `OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --verdict storybook/.visual/plant-shards`, as CI's plants job does. `--affected` selects every plant and one run takes longer than the session's two-hour limit on a background command, so the shards ran in background batches inside it: 1 to 7, 8 to 11, 12 to 15, 16 to 19, 20 to 23, 24 to 26 and 27 to 29, all on a09b878's source (phase 1 review round 1). This replaces the record of the phase's own runs.
- exit: 0 (the verdict); the selection 0; every shard 0

```text
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --affected 8d104af23ce177ec4acbbfaba59bf433f9520d6d --list
$ node gates/bin/plants.ts -- --affected 8d104af23ce177ec4acbbfaba59bf433f9520d6d --list
note: affected: every plant, by gates/lib/mutation/report.ts (shared gate source)
plants: affected since 8d104af23ce177ec4acbbfaba59bf433f9520d6d: 315 of 315 plants selected, none judged (--list)
exit: 0
=== shard 1
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 1
$ node gates/bin/plants.ts -- --shard 1
note: plant time: signoff/error-empty-range: 0.1 s
note: plant time: signoff/pass-unsigned-merge: 0.2 s
note: plant time: brand-rules/a-monospace: 0.5 s
note: plant time: brand-rules/c-wrong-value: 0.5 s
note: plant time: contrast/non-text-below-threshold: 0.9 s
note: plant time: brand-rules/source-invalid: 0.9 s
note: plant time: contrast/exempt-disabled-ink: 1.2 s
note: plant time: prefix/fail-storybook-html-multiline-monospace: 1.2 s
note: plant time: pins/fail-allow-builds-other-version: 1.4 s
note: plant time: pins/fail-dangerously-allow-all-builds: 1.4 s
note: plant time: pins/fail-release-age-exclude: 1.6 s
note: plant time: pins/fail-node-version-not-exact: 1.6 s
note: plant time: pins/pass-matching: 1.8 s
note: plant time: pins/fail-workspace-star: 1.8 s
note: plant time: pins/fail-release-age-strict-missing: 1.9 s
note: plant time: manifest/break-not-json: 2.4 s
note: plant time: typecheck/error-missing-reference: 5.9 s
note: plant time: typecheck/pass-fixture-excluded: 6.8 s
note: plant time: style-lint/fail-aspect-calc: 7.7 s
note: plant time: style-lint/fail-element-stylesheet: 8.3 s
note: plant time: style-lint/fail-font-weight: 9.2 s
note: plant time: style-lint/fail-lh-multiple: 9.7 s
note: plant time: style-lint/fail-ms-time: 10.6 s
note: plant time: style-lint/fail-rgb-colour: 11.1 s
note: plant time: style-lint/fail-styles-calc-line-height: 12.0 s
note: plant time: style-lint/fail-styles-other-token-line-height: 12.5 s
note: plant time: style-lint/fail-translate-length: 13.5 s
note: plant time: style-lint/pass-anchor-name: 13.9 s
note: plant time: style-lint/pass-empty-string: 15.1 s
note: plant time: style-lint/pass-known-token: 15.2 s
note: plant time: style-lint/pass-one-line-calc: 16.6 s
note: plant time: style-lint/pass-styles-line-height-token: 16.7 s
note: plant time: style-lint/pass-translate-percentage: 18.0 s
note: plant time: unit-tests/fail-elements-chromium: 19.4 s
note: plant time: unit-tests/fail-tokens-test: 19.5 s
note: plant time: test-lint/error-unparsable: 20.7 s
note: plant time: unit-tests/pass-styles-only: 20.7 s
note: plant time: test-lint/fail-focused: 22.1 s
note: plant time: test-lint/fail-skipped: 22.1 s
note: plant time: style-lint/fail-hex-colour: 23.8 s
note: plant time: csp/error-unparsable: 24.7 s
note: plant time: csp/fail-set-timeout-string: 25.5 s
note: plant time: csp/fail-svg-slash-onload: 26.3 s
note: plant time: csp/pass-look-alike-names: 27.2 s
note: plant time: prefix/fail-element-name-upper-case: 27.8 s
note: plant time: csp/fail-indirect-eval: 28.7 s
note: plant time: brand-rules/g-forced-colours-override: 29.2 s
note: plant time: lint/fail-gate-source: 29.5 s
note: plant time: manifest/fail-undescribed-css-part: 30.2 s
note: plant time: manifest/fail-undescribed-slot: 30.4 s
note: plant time: contrast/source-throws: 30.6 s
note: plant time: config-copies/fail-test-pathspec-narrowed: 30.8 s
note: plant time: mutation/fail-no-test-runs: 55.7 s
note: plant time: mutation/pass-element-source: 56.6 s
note: plant time: mutation/error-dry-run-fails: 76.2 s
note: plant time: mutation/fail-element-source-no-coverage: 82.6 s
note: plant time: mutation/pass-zero-mutant: 92.1 s
note: plant time: storybook-build/fail-empty-index: 1.9 s
note: plant time: storybook-build/pass-repository: 2.0 s
note: plant time: plants/fail-shard-in-plant-check: 0.0 s
note: plant time: plants/pass-split-plant-jobs: 0.0 s
plants: shard 1 of 29: 61 plants judged, every plant as expected
exit: 0
=== shard 2
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 2
$ node gates/bin/plants.ts -- --shard 2
note: plant time: signoff/fail-no-trailer: 0.1 s
note: plant time: brand-rules/d-rule-as-boundary: 0.4 s
note: plant time: contrast/exempt-not-disabled-ink: 0.5 s
note: plant time: contrast/not-opaque: 0.8 s
note: plant time: contrast/text-below-threshold: 0.9 s
note: plant time: brand-rules/b-link-equals-accent: 1.2 s
note: plant time: unit-tests/fail-gates-test: 2.3 s
note: plant time: test-lint/fail-gate-test: 2.5 s
note: plant time: prefix/fail-storybook-monospace: 2.9 s
note: plant time: style-lint/fail-styles-outside-src: 4.9 s
note: plant time: pins/error-invalid-json: 5.0 s
note: plant time: pins/fail-allow-builds-unpinned-approval: 5.2 s
note: plant time: pins/fail-lockfile-outdated: 5.4 s
note: plant time: pins/fail-release-age-missing: 5.6 s
note: plant time: pins/fail-package-manager-missing: 5.9 s
note: plant time: pins/fail-shamefully-hoist: 6.1 s
note: plant time: typecheck/fail-gate-source: 6.2 s
note: plant time: manifest/fail-lost-attribute: 7.1 s
note: plant time: manifest/pass-reordered: 7.2 s
note: plant time: unit-tests/pass-elements-only: 9.9 s
note: plant time: unit-tests/pass-tokens-only: 11.3 s
note: plant time: test-lint/fail-assertion-outside-test: 13.2 s
note: plant time: test-lint/fail-snapshot-only: 14.8 s
note: plant time: lint/pass-fixture-excluded: 15.1 s
note: plant time: prefix/error-invalid-utf8: 15.8 s
note: plant time: prefix/fail-event-name-built-output: 16.5 s
note: plant time: csp/fail-eval: 17.5 s
note: plant time: typecheck/pass-strict-file: 18.5 s
note: plant time: csp/fail-style-attribute: 18.5 s
note: plant time: csp/fail-inline-script: 19.3 s
note: plant time: csp/pass-external-script: 19.4 s
note: plant time: csp/pass-storybook-out-of-scope: 20.1 s
note: plant time: style-lint/fail-element-template: 20.9 s
note: plant time: style-lint/fail-aspect-ratio-other: 21.7 s
note: plant time: style-lint/fail-lh-multiple-calc: 22.5 s
note: plant time: style-lint/fail-gradient-angle: 23.3 s
note: plant time: style-lint/fail-named-colour: 24.1 s
note: plant time: style-lint/fail-scale-calc: 25.0 s
note: plant time: style-lint/fail-iteration-count-fraction: 25.7 s
note: plant time: style-lint/fail-styles-font-without-line-height: 26.8 s
note: plant time: style-lint/pass-aspect-square: 27.3 s
note: plant time: style-lint/pass-fr: 28.6 s
note: plant time: style-lint/fail-unitless-number: 28.9 s
note: plant time: style-lint/pass-line-height: 30.4 s
note: plant time: style-lint/pass-percentage: 30.5 s
note: plant time: style-lint/pass-system-colour: 32.0 s
note: plant time: style-lint/pass-var-keyword-fallback: 32.1 s
note: plant time: pins/fail-workspace-tilde: 32.2 s
note: plant time: brand-rules/g-system-colour-mapping: 32.7 s
note: plant time: brand-rules/source-throws: 32.8 s
note: plant time: manifest/fail-undescribed-css-property: 33.7 s
note: plant time: mutation/error-unresolvable-base: 33.9 s
note: plant time: config-copies/pass-equal-copies: 34.2 s
note: plant time: mutation/fail-record-without-reason: 55.7 s
note: plant time: mutation/pass-fully-checked: 58.1 s
note: plant time: mutation/fail-element-source-survivor: 74.2 s
note: plant time: storybook-build/error-config-unreadable: 1.3 s
note: plant time: storybook-build/fail-not-csf: 1.7 s
note: plant time: storybook-build/pass-type-error-only: 2.4 s
note: plant time: plants/fail-skip-container-in-ci: 0.0 s
note: plant time: plants/fail-affected-in-plant-check: 0.0 s
plants: shard 2 of 29: 61 plants judged, every plant as expected
exit: 0
=== shard 3
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 3
$ node gates/bin/plants.ts -- --shard 3
note: plant time: contrast/repository-values: 0.7 s
note: plant time: contrast/unknown-token: 1.3 s
note: plant time: unit-tests/error-no-test-file: 1.5 s
note: plant time: brand-rules/b-ochre-pair-not-excluded: 2.0 s
note: plant time: brand-rules/e-light-chrome: 2.1 s
note: plant time: contrast/figure-mismatch: 2.6 s
note: plant time: manifest/pass-repository: 3.2 s
note: plant time: contrast/empty-list: 3.3 s
note: plant time: signoff/fail-trailer-mismatch: 3.3 s
note: plant time: pins/fail-allow-builds-entry: 3.5 s
note: plant time: pins/fail-allow-builds-unpinned-fsevents: 3.5 s
note: plant time: pins/fail-node-linker-hoisted: 3.7 s
note: plant time: pins/fail-release-age-short: 3.7 s
note: plant time: pins/fail-package-manager-not-exact: 3.9 s
note: plant time: pins/fail-workspace-version-differs: 3.9 s
note: plant time: typecheck/fail-implicit-any: 8.3 s
note: plant time: lint/error-unparsable: 12.5 s
note: plant time: style-lint/fail-calc-operand: 14.4 s
note: plant time: style-lint/element-property-clash: 16.4 s
note: plant time: lint/pass-voided-promise: 16.9 s
note: plant time: style-lint/fail-gradient-hex: 18.3 s
note: plant time: style-lint/fail-fit-content-length: 18.7 s
note: plant time: style-lint/fail-lh-calc-factor: 20.3 s
note: plant time: style-lint/fail-lh-paren-factor: 20.5 s
note: plant time: style-lint/fail-radial-gradient: 22.3 s
note: plant time: style-lint/fail-scale-factor: 22.3 s
note: plant time: style-lint/fail-styles-literal-line-height: 24.1 s
note: plant time: style-lint/fail-styles-percent-line-height: 24.1 s
note: plant time: style-lint/fail-unknown-token: 25.8 s
note: plant time: style-lint/pass-calc-tokens: 25.8 s
note: plant time: style-lint/pass-grid-fit-content: 27.5 s
note: plant time: style-lint/pass-linear-gradient-tokens: 27.5 s
note: plant time: style-lint/pass-scale-mirror: 29.2 s
note: plant time: style-lint/pass-test-code: 29.2 s
note: plant time: test-lint/fail-no-assertion: 30.8 s
note: plant time: style-lint/pass-var-token: 31.0 s
note: plant time: csp/fail-event-handler: 31.9 s
note: plant time: unit-tests/fail-styles-test: 32.3 s
note: plant time: csp/fail-new-function: 32.8 s
note: plant time: csp/pass-function-timer: 33.1 s
note: plant time: prefix/fail-custom-property-test-code: 33.7 s
note: plant time: csp/fail-style-attribute-after-newline: 33.7 s
note: plant time: prefix/fail-generic-monospace: 34.2 s
note: plant time: prefix/pass-name-boundaries: 34.3 s
note: plant time: config-copies/error-copy-missing: 34.8 s
note: plant time: brand-rules/generator-throws: 35.3 s
note: plant time: test-lint/fail-colocated-element-test: 35.7 s
note: plant time: manifest/fail-stale-property: 36.4 s
note: plant time: pins/fail-tilde-range: 36.6 s
note: plant time: manifest/fail-undescribed-event: 36.8 s
note: plant time: test-lint/pass-fixture-excluded: 38.1 s
note: plant time: unit-tests/pass-fixture-not-run: 38.4 s
note: plant time: mutation/pass-reasoned-record: 59.8 s
note: plant time: mutation/fail-gate-source-survivor: 62.1 s
note: plant time: mutation/error-zero-mutant-failing-test: 83.9 s
note: plant time: mutation/fail-unchecked-line: 84.3 s
note: plant time: storybook-build/error-missing-dependencies: 0.4 s
note: plant time: storybook-build/fail-syntax-error: 1.6 s
note: plant time: plants/fail-gate-without-entry: 0.0 s
note: plant time: plants/fail-skip-container-in-shard: 0.0 s
plants: shard 3 of 29: 60 plants judged, every plant as expected
exit: 0
=== shard 4
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 4
$ node gates/bin/plants.ts -- --shard 4
note: plant time: signoff/pass-agent-self-signoff: 0.1 s
note: plant time: contrast/required-pair-excluded: 0.5 s
note: plant time: contrast/unparsable-list: 0.7 s
note: plant time: brand-rules/c-extra-radius: 1.1 s
note: plant time: contrast/missing-required-pair: 1.3 s
note: plant time: brand-rules/repository-values: 1.9 s
note: plant time: manifest/break-missing: 2.0 s
note: plant time: contrast/excluded-without-reason: 2.5 s
note: plant time: prefix/pass-outside-packages: 2.5 s
note: plant time: pins/fail-allow-builds-missing: 2.7 s
note: plant time: pins/fail-node-version-missing: 2.9 s
note: plant time: pins/fail-release-age-strict-false: 3.1 s
note: plant time: pins/pass-approved-build: 3.2 s
note: plant time: pins/fail-public-hoist-pattern: 3.4 s
note: plant time: pins/fail-workspace-caret: 3.6 s
note: plant time: unit-tests/pass-gates-only: 4.0 s
note: plant time: unit-tests/fail-tokens-colocated: 5.5 s
note: plant time: unit-tests/error-throws-while-loading: 7.1 s
note: plant time: test-lint/fail-conditional-assertion: 8.8 s
note: plant time: test-lint/fail-not-awaited: 10.8 s
note: plant time: lint/fail-floating-promise: 11.5 s
note: plant time: test-lint/pass-real-assertion: 12.2 s
note: plant time: csp/fail-function-call: 12.4 s
note: plant time: csp/fail-set-interval-string: 13.1 s
note: plant time: csp/fail-style-element: 13.3 s
note: plant time: csp/pass-inline-script-in-source: 13.9 s
note: plant time: prefix/fail-element-name: 13.9 s
note: plant time: prefix/fail-named-monospace: 14.4 s
note: plant time: style-lint/error-unparsable: 15.5 s
note: plant time: style-lint/fail-element-property-misspelt: 16.0 s
note: plant time: style-lint/fail-font-family: 17.0 s
note: plant time: style-lint/fail-gradient-length: 17.5 s
note: plant time: style-lint/fail-lh-calc-twice: 18.7 s
note: plant time: style-lint/fail-minmax-auto: 19.2 s
note: plant time: style-lint/fail-rem-length: 20.5 s
note: plant time: style-lint/fail-scale-length: 20.8 s
note: plant time: style-lint/fail-styles-normal-line-height: 22.1 s
note: plant time: style-lint/fail-styles-stylesheet: 22.5 s
note: plant time: style-lint/fail-var-fallback: 23.8 s
note: plant time: style-lint/pass-iteration-count: 24.2 s
note: plant time: style-lint/pass-element-property: 25.5 s
note: plant time: style-lint/pass-story: 26.0 s
note: plant time: style-lint/pass-one-line: 27.1 s
note: plant time: style-lint/pass-token-definitions: 27.7 s
note: plant time: brand-rules/f-motion-not-zero: 28.3 s
note: plant time: style-lint/pass-zero: 28.7 s
note: plant time: manifest/fail-undescribed-attribute: 29.4 s
note: plant time: pins/fail-caret-range: 29.7 s
note: plant time: manifest/fail-undescribed-property: 29.7 s
note: plant time: config-copies/fail-one-setting-differs: 30.2 s
note: plant time: typecheck/fail-test-code: 33.7 s
note: plant time: mutation/fail-disable-all: 58.9 s
note: plant time: mutation/error-checker-failure: 64.0 s
note: plant time: mutation/pass-test-only-change: 65.5 s
note: plant time: mutation/pass-compile-error: 83.5 s
note: plant time: mutation/fail-mixed-survivors: 107.3 s
note: plant time: storybook-build/error-no-build-script: 0.3 s
note: plant time: storybook-build/fail-unresolved-import: 1.8 s
note: plant time: plants/fail-gate-without-job: 0.0 s
note: plant time: plants/pass-matching: 0.0 s
plants: shard 4 of 29: 60 plants judged, every plant as expected
exit: 0
=== shard 5
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 5
$ node gates/bin/plants.ts -- --shard 5
note: plant time: visual/error-build-fails: 2.6 s
note: plant time: visual/error-host: 2.7 s
note: plant time: visual/error-index-pin: 1.0 s
plants: shard 5 of 29: 3 plants judged, every plant as expected
exit: 0
=== shard 6
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 6
$ node gates/bin/plants.ts -- --shard 6
note: plant time: visual/error-no-engine: 0.7 s
note: plant time: visual/error-tag-pin: 0.6 s
note: plant time: visual/fail-beacon: 407.1 s
plants: shard 6 of 29: 3 plants judged, every plant as expected
exit: 0
=== shard 7
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 7
$ node gates/bin/plants.ts -- --shard 7
note: plant time: visual/fail-below-fold: 397.6 s
note: plant time: visual/fail-cache-api: 395.5 s
note: plant time: visual/fail-clipboard-write: 399.5 s
plants: shard 7 of 29: 3 plants judged, every plant as expected
exit: 0
=== shard 8
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 8
$ node gates/bin/plants.ts -- --shard 8
note: plant time: visual/fail-closed-shadow-root: 395.7 s
note: plant time: visual/fail-cookie: 404.1 s
note: plant time: visual/fail-exec-copy: 408.0 s
plants: shard 8 of 29: 3 plants judged, every plant as expected
exit: 0
=== shard 9
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 9
$ node gates/bin/plants.ts -- --shard 9
note: plant time: visual/fail-font-file-missing: 410.9 s
note: plant time: visual/fail-font-not-loaded: 421.3 s
note: plant time: visual/fail-hover-style-changed: 413.1 s
plants: shard 9 of 29: 3 plants judged, every plant as expected
exit: 0
=== shard 10
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 10
$ node gates/bin/plants.ts -- --shard 10
note: plant time: visual/fail-indexeddb: 424.3 s
note: plant time: visual/fail-input-system-font: 420.5 s
note: plant time: visual/fail-local-storage: 438.0 s
plants: shard 10 of 29: 3 plants judged, every plant as expected
exit: 0
=== shard 11
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 11
$ node gates/bin/plants.ts -- --shard 11
note: plant time: visual/fail-missing-baseline: 445.0 s
note: plant time: visual/fail-network: 440.9 s
note: plant time: visual/fail-one-pixel: 442.2 s
plants: shard 11 of 29: 3 plants judged, every plant as expected
exit: 0
=== shard 12
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 12
$ node gates/bin/plants.ts -- --shard 12
note: plant time: visual/fail-other-font: 421.7 s
note: plant time: visual/fail-overflow-changed: 411.8 s
note: plant time: visual/fail-pointer-target-below-fold: 420.3 s
plants: shard 12 of 29: 3 plants judged, every plant as expected
exit: 0
=== shard 13
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 13
$ node gates/bin/plants.ts -- --shard 13
note: plant time: visual/fail-pointer-target-missing: 424.4 s
note: plant time: visual/fail-popover-changed: 427.3 s
note: plant time: visual/fail-press-style-changed: 438.0 s
plants: shard 13 of 29: 3 plants judged, every plant as expected
exit: 0
=== shard 14
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 14
$ node gates/bin/plants.ts -- --shard 14
note: plant time: visual/fail-random: 422.4 s
note: plant time: visual/fail-render-throws: 427.0 s
note: plant time: visual/fail-same-origin-fetch: 424.9 s
plants: shard 14 of 29: 3 plants judged, every plant as expected
exit: 0
=== shard 15
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 15
$ node gates/bin/plants.ts -- --shard 15
note: plant time: visual/fail-same-pixels-other-bytes: 436.7 s
note: plant time: visual/fail-session-storage: 445.7 s
note: plant time: visual/fail-storage-left-by-worker: 456.4 s
plants: shard 15 of 29: 3 plants judged, every plant as expected
exit: 0
=== shard 16
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 16
$ node gates/bin/plants.ts -- --shard 16
note: plant time: visual/fail-storage-property: 447.9 s
note: plant time: visual/fail-stray-baseline: 428.8 s
note: plant time: visual/fail-throws-on-load: 437.2 s
plants: shard 16 of 29: 3 plants judged, every plant as expected
exit: 0
=== shard 17
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 17
$ node gates/bin/plants.ts -- --shard 17
note: plant time: visual/fail-token-changed: 550.8 s
note: plant time: visual/fail-websocket: 420.8 s
note: plant time: visual/fail-xhr: 439.1 s
plants: shard 17 of 29: 3 plants judged, every plant as expected
exit: 0
=== shard 18
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 18
$ node gates/bin/plants.ts -- --shard 18
note: plant time: visual/pass-animation-and-caret: 449.9 s
note: plant time: visual/pass-below-fold: 451.2 s
note: plant time: visual/pass-focus-below-fold: 441.2 s
plants: shard 18 of 29: 3 plants judged, every plant as expected
exit: 0
=== shard 19
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 19
$ node gates/bin/plants.ts -- --shard 19
note: plant time: visual/pass-hover-and-press: 440.1 s
note: plant time: visual/pass-input-font: 439.6 s
note: plant time: visual/pass-overflow-and-popover: 442.6 s
plants: shard 19 of 29: 3 plants judged, every plant as expected
exit: 0
=== shard 20
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 20
$ node gates/bin/plants.ts -- --shard 20
note: plant time: visual/pass-repository: 450.1 s
note: plant time: visual/pass-second-render: 448.2 s
note: plant time: visual/pass-unused-face: 451.8 s
plants: shard 20 of 29: 3 plants judged, every plant as expected
exit: 0
=== shard 21
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 21
$ node gates/bin/plants.ts -- --shard 21
note: plant time: axe/error-bad-exceptions: 0.7 s
note: plant time: axe/error-build-fails: 2.2 s
note: plant time: axe/error-exception-plan-not-a-plan: 0.8 s
plants: shard 21 of 29: 3 plants judged, every plant as expected
exit: 0
=== shard 22
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 22
$ node gates/bin/plants.ts -- --shard 22
note: plant time: axe/fail-closed-shadow-root: 231.8 s
note: plant time: axe/fail-empty: 234.4 s
note: plant time: axe/fail-excepted-second-node: 226.4 s
plants: shard 22 of 29: 3 plants judged, every plant as expected
exit: 0
=== shard 23
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 23
$ node gates/bin/plants.ts -- --shard 23
note: plant time: axe/fail-hover-near-fold: 234.0 s
note: plant time: axe/fail-hover-reveals-unlabelled: 235.9 s
note: plant time: axe/fail-incomplete: 233.0 s
plants: shard 23 of 29: 3 plants judged, every plant as expected
exit: 0
=== shard 24
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 24
$ node gates/bin/plants.ts -- --shard 24
note: plant time: axe/fail-no-box: 230.5 s
note: plant time: axe/fail-open-shadow-unlabelled: 230.2 s
note: plant time: axe/fail-outside-root: 233.0 s
plants: shard 24 of 29: 3 plants judged, every plant as expected
exit: 0
=== shard 25
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 25
$ node gates/bin/plants.ts -- --shard 25
note: plant time: axe/fail-pointer-target-below-fold: 228.8 s
note: plant time: axe/fail-render-throws: 229.0 s
note: plant time: axe/fail-stale-exception: 227.8 s
plants: shard 25 of 29: 3 plants judged, every plant as expected
exit: 0
=== shard 26
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 26
$ node gates/bin/plants.ts -- --shard 26
note: plant time: axe/fail-throws-on-load: 225.2 s
note: plant time: axe/fail-two-low-contrast: 222.4 s
note: plant time: axe/fail-unlabelled-button: 224.1 s
plants: shard 26 of 29: 3 plants judged, every plant as expected
exit: 0
=== shard 27
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 27
$ node gates/bin/plants.ts -- --shard 27
note: plant time: axe/fail-unrecorded-exception: 224.3 s
note: plant time: axe/pass-excepted: 228.7 s
note: plant time: axe/pass-excepted-incomplete: 232.4 s
plants: shard 27 of 29: 3 plants judged, every plant as expected
exit: 0
=== shard 28
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 28
$ node gates/bin/plants.ts -- --shard 28
note: plant time: axe/pass-excepted-shadow: 236.9 s
note: plant time: axe/pass-minor-only: 232.3 s
note: plant time: axe/pass-repository: 228.0 s
plants: shard 28 of 29: 3 plants judged, every plant as expected
exit: 0
=== shard 29
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 29
$ node gates/bin/plants.ts -- --shard 29
note: plant time: axe/pass-second-render: 220.9 s
plants: shard 29 of 29: 1 plant judged, every plant as expected
exit: 0
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --verdict storybook/.visual/plant-shards
$ node gates/bin/plants.ts -- --verdict storybook/.visual/plant-shards
plants: 315 plants of 17 gates and the registry judged, every plant as expected
exit: 0
```
