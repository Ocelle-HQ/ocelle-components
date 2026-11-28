# Plants of phase 1

- base: 44fd04282f99f0395a4580b3a101ac527fdd3f9c
- command: pnpm run gate:plants -- --affected 44fd0428
- exit: 2

Run on the green commit `9a9b05d2`. Every plant is selected (`.gitignore` is not mapped). This
environment has no container engine, so the 46 visual plants were not run and the job exits 2 for that cause
alone. Every other selected plant (298, each with its plant time below, the 18 `pack-contents` plants among them,
and the unit-tests, axe and element mutation plants, since the pinned Chromium is installed here) was judged as
expected: the output holds no problem line. This is accepted for the phase record by the operator's decision on
phase 0, `reviews/phase-0/operator-plants-decision.md` ("CI decides plants"); CI's required Plants check judges
every plant.

T020: the three `packages/*/CHANGELOG.md` files are unchanged in this phase (US2 writes the dated `1.0.0`
entries, T031). The pack-contents gate requires only each changelog's presence: `CHANGELOG.md` is in the
`require` (and `allow`) lists of every package in `gates/release/pack-manifest.json`, and in no `identical`
list, and no rule of `gates/lib/pack-contents.ts` reads its content.

```text
$ node gates/bin/plants.ts -- --affected 44fd0428
note: affected: every plant, by .gitignore (not mapped)
note: plant time: signoff/fail-no-trailer: 0.2 s
note: plant time: signoff/error-empty-range: 0.3 s
note: plant time: signoff/fail-trailer-mismatch: 0.4 s
note: plant time: signoff/pass-agent-self-signoff: 0.5 s
note: plant time: signoff/pass-unsigned-merge: 0.6 s
note: plant time: brand-rules/a-monospace: 1.0 s
note: plant time: unit-tests/error-no-test-file: 1.3 s
note: plant time: brand-rules/b-ochre-pair-not-excluded: 1.6 s
note: plant time: brand-rules/b-link-equals-accent: 1.9 s
note: plant time: brand-rules/c-extra-radius: 2.2 s
note: plant time: brand-rules/c-wrong-value: 2.6 s
note: plant time: brand-rules/d-rule-as-boundary: 2.8 s
note: plant time: brand-rules/e-light-chrome: 3.1 s
note: plant time: brand-rules/repository-values: 3.4 s
note: plant time: brand-rules/source-invalid: 3.8 s
note: plant time: contrast/empty-list: 4.0 s
note: plant time: contrast/excluded-without-reason: 4.4 s
note: plant time: contrast/exempt-disabled-ink: 4.7 s
note: plant time: contrast/exempt-not-disabled-ink: 5.1 s
note: plant time: contrast/figure-mismatch: 5.3 s
note: plant time: contrast/missing-required-pair: 5.9 s
note: plant time: contrast/non-text-below-threshold: 6.1 s
note: plant time: contrast/not-opaque: 6.7 s
note: plant time: contrast/repository-values: 7.0 s
note: plant time: contrast/required-pair-excluded: 7.7 s
note: plant time: contrast/text-below-threshold: 8.0 s
note: plant time: contrast/unknown-token: 8.6 s
note: plant time: contrast/unparsable-list: 8.9 s
note: plant time: manifest/break-missing: 9.8 s
note: plant time: sandbox-paths/error-no-tracked-file: 9.9 s
note: plant time: manifest/pass-repository: 10.4 s
note: plant time: sandbox-paths/fail-gitattributes-diff: 10.5 s
note: plant time: sandbox-paths/pass-binary-file: 10.6 s
note: plant time: sandbox-paths/pass-near-misses: 10.8 s
note: plant time: prefix/pass-outside-packages: 10.9 s
note: plant time: typecheck/fail-gate-source: 16.0 s
note: plant time: style-lint/fail-styles-outside-src: 18.8 s
note: plant time: unit-tests/fail-gates-test: 20.5 s
note: plant time: unit-tests/pass-gates-only: 22.0 s
note: plant time: lint/fail-gate-source: 22.0 s
note: plant time: prefix/fail-storybook-monospace: 22.5 s
note: plant time: prefix/fail-storybook-html-multiline-monospace: 23.0 s
note: plant time: pins/error-invalid-json: 23.1 s
note: plant time: pins/fail-allow-builds-entry: 23.3 s
note: plant time: pins/fail-allow-builds-missing: 23.5 s
note: plant time: test-lint/fail-gate-test: 23.6 s
note: plant time: pins/fail-allow-builds-other-version: 23.7 s
note: plant time: pins/fail-allow-builds-unpinned-approval: 23.8 s
note: plant time: pins/fail-allow-builds-unpinned-fsevents: 23.8 s
note: plant time: pins/fail-dangerously-allow-all-builds: 23.9 s
note: plant time: pins/fail-lockfile-outdated: 24.0 s
note: plant time: pins/fail-node-linker-hoisted: 24.1 s
note: plant time: pins/fail-node-version-missing: 24.1 s
note: plant time: pins/fail-node-version-not-exact: 24.2 s
note: plant time: pins/fail-package-manager-missing: 24.3 s
note: plant time: pins/fail-package-manager-not-exact: 24.4 s
note: plant time: pins/fail-public-hoist-pattern: 24.5 s
note: plant time: pins/fail-release-age-exclude: 24.6 s
note: plant time: pins/fail-release-age-missing: 24.6 s
note: plant time: pins/fail-release-age-strict-false: 24.7 s
note: plant time: pins/fail-release-age-short: 24.8 s
note: plant time: pins/fail-release-age-strict-missing: 24.9 s
note: plant time: pins/fail-shamefully-hoist: 25.0 s
note: plant time: pins/fail-workspace-caret: 25.0 s
note: plant time: pins/fail-workspace-star: 25.1 s
note: plant time: pins/fail-workspace-tilde: 25.2 s
note: plant time: pins/pass-approved-build: 25.3 s
note: plant time: pins/fail-workspace-version-differs: 25.3 s
note: plant time: pins/pass-matching: 25.4 s
note: plant time: manifest/break-not-json: 26.3 s
note: plant time: manifest/fail-lost-attribute: 26.8 s
note: plant time: manifest/pass-reordered: 27.9 s
note: plant time: typecheck/error-missing-reference: 31.6 s
note: plant time: typecheck/fail-implicit-any: 32.9 s
note: plant time: typecheck/pass-strict-file: 37.0 s
note: plant time: typecheck/fail-test-code: 38.2 s
note: plant time: typecheck/pass-fixture-excluded: 42.4 s
note: plant time: lint/error-unparsable: 49.9 s
note: plant time: lint/fail-floating-promise: 54.2 s
note: plant time: lint/pass-fixture-excluded: 61.2 s
note: plant time: style-lint/error-unparsable: 64.0 s
note: plant time: style-lint/element-property-clash: 66.1 s
note: plant time: lint/pass-voided-promise: 66.2 s
note: plant time: style-lint/fail-aspect-ratio-other: 68.2 s
note: plant time: style-lint/fail-aspect-calc: 68.3 s
note: plant time: style-lint/fail-calc-operand: 70.3 s
note: plant time: style-lint/fail-element-property-misspelt: 70.4 s
note: plant time: style-lint/fail-element-template: 72.4 s
note: plant time: style-lint/fail-element-stylesheet: 72.6 s
note: plant time: style-lint/fail-fit-content-length: 74.5 s
note: plant time: style-lint/fail-font-family: 74.6 s
note: plant time: style-lint/fail-gradient-angle: 76.7 s
note: plant time: style-lint/fail-font-weight: 76.8 s
note: plant time: style-lint/fail-gradient-hex: 78.8 s
note: plant time: style-lint/fail-gradient-length: 78.9 s
note: plant time: style-lint/fail-hex-colour: 80.8 s
note: plant time: style-lint/fail-iteration-count-fraction: 80.9 s
note: plant time: style-lint/fail-lh-calc-factor: 83.0 s
note: plant time: style-lint/fail-lh-calc-twice: 83.0 s
note: plant time: style-lint/fail-lh-multiple: 84.8 s
note: plant time: style-lint/fail-lh-multiple-calc: 84.9 s
note: plant time: style-lint/fail-lh-paren-factor: 86.8 s
note: plant time: style-lint/fail-minmax-auto: 86.9 s
note: plant time: style-lint/fail-named-colour: 88.8 s
note: plant time: style-lint/fail-ms-time: 88.8 s
note: plant time: style-lint/fail-radial-gradient: 90.7 s
note: plant time: style-lint/fail-rem-length: 90.8 s
note: plant time: style-lint/fail-rgb-colour: 92.6 s
note: plant time: style-lint/fail-scale-calc: 92.7 s
note: plant time: style-lint/fail-scale-factor: 94.6 s
note: plant time: style-lint/fail-scale-length: 94.6 s
note: plant time: style-lint/fail-styles-font-without-line-height: 96.5 s
note: plant time: style-lint/fail-styles-calc-line-height: 96.6 s
note: plant time: style-lint/fail-styles-literal-line-height: 98.4 s
note: plant time: style-lint/fail-styles-normal-line-height: 98.4 s
note: plant time: style-lint/fail-styles-percent-line-height: 100.3 s
note: plant time: style-lint/fail-styles-other-token-line-height: 100.4 s
note: plant time: style-lint/fail-styles-stylesheet: 102.4 s
note: plant time: style-lint/fail-translate-length: 102.4 s
note: plant time: style-lint/fail-unitless-number: 104.2 s
note: plant time: style-lint/fail-unknown-token: 104.3 s
note: plant time: style-lint/pass-anchor-name: 106.2 s
note: plant time: style-lint/fail-var-fallback: 106.2 s
note: plant time: style-lint/pass-aspect-square: 108.1 s
note: plant time: style-lint/pass-calc-tokens: 108.2 s
note: plant time: style-lint/pass-element-property: 110.1 s
note: plant time: style-lint/pass-empty-string: 110.2 s
note: plant time: style-lint/pass-grid-fit-content: 112.0 s
note: plant time: style-lint/pass-fr: 112.0 s
note: plant time: style-lint/pass-iteration-count: 113.9 s
note: plant time: style-lint/pass-known-token: 114.0 s
note: plant time: style-lint/pass-linear-gradient-tokens: 116.1 s
note: plant time: style-lint/pass-line-height: 116.1 s
note: plant time: style-lint/pass-one-line: 118.1 s
note: plant time: style-lint/pass-one-line-calc: 118.2 s
note: plant time: style-lint/pass-percentage: 120.2 s
note: plant time: style-lint/pass-scale-mirror: 120.2 s
note: plant time: style-lint/pass-story: 122.2 s
note: plant time: style-lint/pass-styles-line-height-token: 122.3 s
note: plant time: style-lint/pass-test-code: 124.2 s
note: plant time: style-lint/pass-system-colour: 124.3 s
note: plant time: style-lint/pass-token-definitions: 126.2 s
note: plant time: style-lint/pass-translate-percentage: 126.3 s
note: plant time: style-lint/pass-var-token: 128.2 s
note: plant time: style-lint/pass-var-keyword-fallback: 128.3 s
note: plant time: unit-tests/error-throws-while-loading: 129.8 s
note: plant time: style-lint/pass-zero: 130.2 s
note: plant time: unit-tests/fail-styles-test: 131.6 s
note: plant time: unit-tests/fail-elements-chromium: 132.4 s
note: plant time: unit-tests/fail-tokens-colocated: 133.1 s
note: plant time: unit-tests/fail-tokens-test: 133.8 s
note: plant time: unit-tests/pass-tokens-only: 135.2 s
note: plant time: unit-tests/pass-elements-only: 135.5 s
note: plant time: unit-tests/pass-styles-only: 136.9 s
note: plant time: test-lint/error-unparsable: 137.0 s
note: plant time: test-lint/fail-colocated-element-test: 138.5 s
note: plant time: test-lint/fail-assertion-outside-test: 138.7 s
note: plant time: test-lint/fail-conditional-assertion: 140.2 s
note: plant time: test-lint/fail-focused: 140.5 s
note: plant time: test-lint/fail-not-awaited: 142.2 s
note: plant time: test-lint/fail-skipped: 142.4 s
note: plant time: csp/error-unparsable: 143.1 s
note: plant time: test-lint/pass-real-assertion: 144.0 s
note: plant time: test-lint/fail-no-assertion: 144.6 s
note: plant time: csp/fail-eval: 145.0 s
note: plant time: csp/fail-event-handler: 145.6 s
note: plant time: csp/fail-new-function: 145.9 s
note: plant time: csp/fail-indirect-eval: 146.6 s
note: plant time: csp/fail-inline-script: 146.8 s
note: plant time: csp/fail-function-call: 147.4 s
note: plant time: csp/fail-set-timeout-string: 147.7 s
note: plant time: csp/fail-style-attribute-after-newline: 148.3 s
note: plant time: csp/fail-set-interval-string: 148.6 s
note: plant time: csp/fail-style-attribute: 149.1 s
note: plant time: test-lint/fail-snapshot-only: 150.1 s
note: plant time: csp/fail-svg-slash-onload: 150.1 s
note: plant time: csp/fail-style-element: 151.2 s
note: plant time: csp/pass-external-script: 151.3 s
note: plant time: csp/pass-look-alike-names: 152.4 s
note: plant time: csp/pass-function-timer: 152.5 s
note: plant time: prefix/error-invalid-utf8: 153.3 s
note: plant time: csp/pass-storybook-out-of-scope: 153.6 s
note: plant time: prefix/fail-custom-property-test-code: 154.2 s
note: plant time: prefix/fail-event-name-built-output: 154.4 s
note: plant time: prefix/fail-element-name-upper-case: 155.0 s
note: plant time: prefix/fail-element-name: 155.3 s
note: plant time: prefix/fail-generic-monospace: 155.9 s
note: plant time: prefix/fail-named-monospace: 156.2 s
note: plant time: prefix/pass-name-boundaries: 157.1 s
note: plant time: csp/pass-inline-script-in-source: 157.1 s
note: plant time: config-copies/error-copy-missing: 158.0 s
note: plant time: brand-rules/f-delay-marker-misplaced: 158.1 s
note: plant time: brand-rules/f-motion-spin-missing: 159.0 s
note: plant time: brand-rules/g-forced-colours-override: 159.1 s
note: plant time: brand-rules/f-motion-not-zero: 160.2 s
note: plant time: brand-rules/generator-throws: 160.2 s
note: plant time: brand-rules/f-motion-not-ms: 161.1 s
note: plant time: brand-rules/g-system-colour-mapping: 161.2 s
note: plant time: contrast/source-throws: 162.0 s
note: plant time: brand-rules/source-throws: 162.1 s
note: plant time: manifest/fail-stale-property: 163.9 s
note: plant time: manifest/fail-undescribed-css-part: 163.9 s
note: plant time: manifest/fail-undescribed-slot: 165.6 s
note: plant time: manifest/fail-undescribed-css-property: 165.7 s
note: plant time: manifest/fail-undescribed-event: 167.3 s
note: plant time: manifest/fail-undescribed-attribute: 167.4 s
note: plant time: pins/fail-caret-range: 167.5 s
note: plant time: pins/fail-tilde-range: 167.7 s
note: plant time: sandbox-paths/fail-store-and-repo-root: 167.8 s
note: plant time: sandbox-paths/fail-allowed-name-elsewhere: 168.0 s
note: plant time: sandbox-paths/fail-file-url-in-json: 168.1 s
note: plant time: manifest/fail-undescribed-property: 169.0 s
note: plant time: unit-tests/pass-fixture-not-run: 170.0 s
note: plant time: test-lint/pass-fixture-excluded: 170.9 s
note: plant time: mutation/error-unresolvable-base: 172.0 s
note: plant time: config-copies/fail-one-setting-differs: 173.0 s
note: plant time: config-copies/pass-equal-copies: 173.9 s
note: plant time: config-copies/fail-test-pathspec-narrowed: 174.9 s
note: plant time: pack-contents/fail-ofl-missing: 176.0 s
note: plant time: mutation/fail-gate-source-survivor: 195.7 s
note: plant time: mutation/error-dry-run-fails: 198.6 s
note: plant time: mutation/fail-element-source-no-coverage: 232.3 s
note: plant time: mutation/error-checker-failure: 233.9 s
note: plant time: mutation/fail-disable-all: 256.6 s
note: plant time: mutation/fail-element-source-survivor: 262.8 s
note: plant time: mutation/fail-record-without-reason: 279.4 s
note: plant time: mutation/fail-unchecked-line: 288.9 s
note: plant time: mutation/pass-fully-checked: 304.2 s
note: plant time: mutation/pass-compile-error: 313.2 s
note: plant time: mutation/pass-test-only-change: 315.3 s
note: plant time: mutation/pass-element-source: 330.1 s
note: plant time: mutation/pass-reasoned-record: 337.3 s
note: plant time: mutation/fail-no-test-runs: 356.3 s
note: plant time: sandbox-paths/pass-allowed-files: 356.4 s
note: plant time: pack-contents/fail-license-missing: 357.0 s
note: plant time: mutation/pass-zero-mutant: 359.4 s
note: plant time: pack-contents/fail-export-missing: 360.1 s
note: plant time: pack-contents/fail-notice-differs: 360.8 s
note: plant time: pack-contents/fail-ofl-differs: 361.4 s
note: plant time: pack-contents/fail-extra-file: 361.9 s
note: plant time: pack-contents/fail-peer-exact: 362.7 s
note: plant time: pack-contents/fail-sandbox-path: 363.2 s
note: plant time: pack-contents/fail-private: 363.9 s
note: plant time: pack-contents/fail-repository-directory: 364.7 s
note: plant time: pack-contents/pass-minimal: 365.7 s
note: plant time: pack-contents/fail-version-skew: 366.4 s
note: plant time: pack-contents/fail-npmrc: 367.0 s
note: plant time: pack-contents/fail-test-file: 367.9 s
note: plant time: pack-contents/pass-star-export: 368.8 s
note: plant time: pack-contents/fail-workspace-peer: 369.6 s
note: plant time: pack-contents/break-tarball-unreadable: 371.2 s
note: plant time: pack-contents/break-manifest-invalid: 372.8 s
note: plant time: mutation/error-zero-mutant-failing-test: 374.5 s
note: plant time: mutation/fail-mixed-survivors: 410.1 s
note: plant time: storybook-build/error-config-unreadable: 1.1 s
note: plant time: storybook-build/error-missing-dependencies: 0.4 s
note: plant time: storybook-build/error-no-build-script: 0.4 s
note: plant time: storybook-build/fail-empty-index: 2.2 s
note: plant time: storybook-build/fail-not-csf: 1.7 s
note: plant time: storybook-build/fail-syntax-error: 1.8 s
note: plant time: storybook-build/fail-unresolved-import: 2.1 s
note: plant time: storybook-build/pass-repository: 3.2 s
note: plant time: storybook-build/pass-type-error-only: 2.8 s
note: plant time: visual/error-host: 3.3 s
note: plant time: visual/error-no-engine: 0.8 s
note: plant time: axe/error-bad-exceptions: 1.3 s
note: plant time: axe/error-build-fails: 2.6 s
note: plant time: axe/error-exception-plan-not-a-plan: 1.3 s
note: plant time: axe/fail-closed-shadow-root: 498.7 s
note: plant time: axe/fail-empty: 498.7 s
note: plant time: axe/fail-excepted-second-node: 478.2 s
note: plant time: axe/fail-hover-near-fold: 502.4 s
note: plant time: axe/fail-hover-reveals-unlabelled: 508.8 s
note: plant time: axe/fail-incomplete: 485.5 s
note: plant time: axe/fail-no-box: 478.8 s
note: plant time: axe/fail-open-shadow-unlabelled: 486.9 s
note: plant time: axe/fail-outside-root: 489.4 s
note: plant time: axe/fail-pointer-target-below-fold: 494.0 s
note: plant time: axe/fail-render-throws: 473.3 s
note: plant time: axe/fail-stale-exception: 475.1 s
note: plant time: axe/fail-throws-on-load: 470.6 s
note: plant time: axe/fail-two-low-contrast: 470.2 s
note: plant time: axe/fail-unlabelled-button: 468.8 s
note: plant time: axe/fail-unrecorded-exception: 478.3 s
note: plant time: axe/pass-excepted: 464.3 s
note: plant time: axe/pass-excepted-incomplete: 480.8 s
note: plant time: axe/pass-excepted-shadow: 483.8 s
note: plant time: axe/pass-minor-only: 499.6 s
note: plant time: axe/pass-repository: 503.8 s
note: plant time: axe/pass-second-render: 490.9 s
note: plant time: plants/fail-affected-in-plant-check: 0.0 s
note: plant time: plants/fail-gate-without-entry: 0.0 s
note: plant time: plants/fail-gate-without-job: 0.0 s
note: plant time: plants/fail-shard-in-plant-check: 0.0 s
note: plant time: plants/fail-skip-container-in-ci: 0.0 s
note: plant time: plants/pass-matching: 0.0 s
note: plant time: plants/fail-skip-container-in-shard: 0.0 s
note: plant time: plants/pass-split-plant-jobs: 0.0 s
plants: not run (no container engine): gates/plants/visual/error-build-fails
plants: not run (no container engine): gates/plants/visual/error-index-pin
plants: not run (no container engine): gates/plants/visual/error-tag-pin
plants: not run (no container engine): gates/plants/visual/fail-beacon
plants: not run (no container engine): gates/plants/visual/fail-below-fold
plants: not run (no container engine): gates/plants/visual/fail-cache-api
plants: not run (no container engine): gates/plants/visual/fail-clipboard-write
plants: not run (no container engine): gates/plants/visual/fail-closed-shadow-root
plants: not run (no container engine): gates/plants/visual/fail-cookie
plants: not run (no container engine): gates/plants/visual/fail-exec-copy
plants: not run (no container engine): gates/plants/visual/fail-font-file-missing
plants: not run (no container engine): gates/plants/visual/fail-font-not-loaded
plants: not run (no container engine): gates/plants/visual/fail-hover-style-changed
plants: not run (no container engine): gates/plants/visual/fail-indexeddb
plants: not run (no container engine): gates/plants/visual/fail-input-system-font
plants: not run (no container engine): gates/plants/visual/fail-local-storage
plants: not run (no container engine): gates/plants/visual/fail-missing-baseline
plants: not run (no container engine): gates/plants/visual/fail-network
plants: not run (no container engine): gates/plants/visual/fail-one-pixel
plants: not run (no container engine): gates/plants/visual/fail-other-font
plants: not run (no container engine): gates/plants/visual/fail-overflow-changed
plants: not run (no container engine): gates/plants/visual/fail-pointer-target-below-fold
plants: not run (no container engine): gates/plants/visual/fail-pointer-target-missing
plants: not run (no container engine): gates/plants/visual/fail-popover-changed
plants: not run (no container engine): gates/plants/visual/fail-press-style-changed
plants: not run (no container engine): gates/plants/visual/fail-random
plants: not run (no container engine): gates/plants/visual/fail-render-throws
plants: not run (no container engine): gates/plants/visual/fail-same-origin-fetch
plants: not run (no container engine): gates/plants/visual/fail-same-pixels-other-bytes
plants: not run (no container engine): gates/plants/visual/fail-session-storage
plants: not run (no container engine): gates/plants/visual/fail-storage-left-by-worker
plants: not run (no container engine): gates/plants/visual/fail-storage-property
plants: not run (no container engine): gates/plants/visual/fail-stray-baseline
plants: not run (no container engine): gates/plants/visual/fail-throws-on-load
plants: not run (no container engine): gates/plants/visual/fail-token-changed
plants: not run (no container engine): gates/plants/visual/fail-websocket
plants: not run (no container engine): gates/plants/visual/fail-xhr
plants: not run (no container engine): gates/plants/visual/pass-animation-and-caret
plants: not run (no container engine): gates/plants/visual/pass-below-fold
plants: not run (no container engine): gates/plants/visual/pass-focus-below-fold
plants: not run (no container engine): gates/plants/visual/pass-hover-and-press
plants: not run (no container engine): gates/plants/visual/pass-input-font
plants: not run (no container engine): gates/plants/visual/pass-overflow-and-popover
plants: not run (no container engine): gates/plants/visual/pass-repository
plants: not run (no container engine): gates/plants/visual/pass-second-render
plants: not run (no container engine): gates/plants/visual/pass-unused-face
plants: could not run: no container engine for 46 visual plants; start docker or podman, or run a partial job with --skip-container
[ELIFECYCLE] Command failed with exit code 2.
```
