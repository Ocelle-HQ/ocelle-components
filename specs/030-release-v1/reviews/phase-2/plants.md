# Plants of phase 2

- base: 7bf0d39216d4ab83147c90352bec028555a6e1d6
- command: pnpm run gate:plants -- --affected 7bf0d392
- exit: 2

Run on the green commit `d86d16f8`, detached. Every plant is selected (`gates/bin/evidence-reuse-shadow.ts` is shared
gate source). This environment has no container engine, so the 46 visual plants were not run and the job exits 2 for
that cause alone. Every other selected plant (329, each with its plant time below, the 31 `release-readiness` plants
among them, and the unit-tests, axe and element mutation plants, since the pinned Chromium is installed here) was
judged as expected: the output holds no problem line. This is accepted for the phase record by the operator's decision
on phase 0, `reviews/phase-0/operator-plants-decision.md` ("CI decides plants"); CI's required Plants check judges
every plant.

```text
$ node gates/bin/plants.ts -- --affected 7bf0d392
note: affected: every plant, by gates/bin/evidence-reuse-shadow.ts (shared gate source)
note: plant time: signoff/error-empty-range: 0.2 s
note: plant time: signoff/fail-no-trailer: 0.4 s
note: plant time: signoff/fail-trailer-mismatch: 0.8 s
note: plant time: signoff/pass-unsigned-merge: 1.1 s
note: plant time: signoff/pass-agent-self-signoff: 1.3 s
note: plant time: brand-rules/a-monospace: 2.8 s
note: plant time: brand-rules/b-link-equals-accent: 4.6 s
note: plant time: unit-tests/error-no-test-file: 5.5 s
note: plant time: brand-rules/b-ochre-pair-not-excluded: 5.6 s
note: plant time: brand-rules/c-extra-radius: 6.3 s
note: plant time: brand-rules/c-wrong-value: 6.4 s
note: plant time: brand-rules/d-rule-as-boundary: 7.2 s
note: plant time: brand-rules/e-light-chrome: 7.2 s
note: plant time: brand-rules/repository-values: 8.1 s
note: plant time: brand-rules/source-invalid: 8.1 s
note: plant time: contrast/empty-list: 8.8 s
note: plant time: contrast/excluded-without-reason: 8.9 s
note: plant time: contrast/exempt-disabled-ink: 9.7 s
note: plant time: contrast/figure-mismatch: 9.8 s
note: plant time: contrast/exempt-not-disabled-ink: 10.7 s
note: plant time: contrast/missing-required-pair: 10.8 s
note: plant time: contrast/repository-values: 12.0 s
note: plant time: contrast/not-opaque: 12.1 s
note: plant time: contrast/non-text-below-threshold: 13.2 s
note: plant time: contrast/required-pair-excluded: 13.2 s
note: plant time: contrast/unknown-token: 14.4 s
note: plant time: contrast/text-below-threshold: 14.4 s
note: plant time: contrast/unparsable-list: 15.9 s
note: plant time: manifest/break-missing: 16.2 s
note: plant time: sandbox-paths/error-no-tracked-file: 16.3 s
note: plant time: manifest/pass-repository: 17.7 s
note: plant time: release-readiness/break-shallow: 18.1 s
note: plant time: release-readiness/fail-secret-anthropic: 20.1 s
note: plant time: release-readiness/fail-secret-aws: 20.3 s
note: plant time: release-readiness/fail-secret-deleted-later: 22.7 s
note: plant time: release-readiness/fail-secret-env-assignment: 22.9 s
note: plant time: release-readiness/fail-secret-google: 25.8 s
note: plant time: release-readiness/fail-secret-github: 25.9 s
note: plant time: release-readiness/fail-secret-npmrc: 29.0 s
note: plant time: release-readiness/fail-secret-npm: 29.1 s
note: plant time: release-readiness/fail-secret-private-key: 31.8 s
note: plant time: release-readiness/fail-secret-openai: 31.9 s
note: plant time: release-readiness/fail-secret-slack: 34.9 s
note: plant time: release-readiness/fail-tag-mismatch: 35.0 s
note: plant time: release-readiness/pass-repository: 37.7 s
note: plant time: release-readiness/pass-env-variable: 37.8 s
note: plant time: prefix/pass-outside-packages: 39.1 s
note: plant time: sandbox-paths/fail-gitattributes-diff: 39.3 s
note: plant time: sandbox-paths/pass-binary-file: 39.4 s
note: plant time: sandbox-paths/pass-near-misses: 39.5 s
note: plant time: release-readiness/pass-npmrc-variable: 40.5 s
note: plant time: release-readiness/pass-lockfile-integrity: 42.7 s
note: plant time: release-readiness/pass-rule-prose: 43.3 s
note: plant time: unit-tests/fail-gates-test: 46.4 s
note: plant time: typecheck/fail-gate-source: 49.1 s
note: plant time: unit-tests/pass-gates-only: 49.3 s
note: plant time: test-lint/fail-gate-test: 52.2 s
note: plant time: prefix/fail-storybook-html-multiline-monospace: 53.8 s
note: plant time: prefix/fail-storybook-monospace: 55.4 s
note: plant time: style-lint/fail-styles-outside-src: 59.8 s
note: plant time: pins/error-invalid-json: 59.9 s
note: plant time: pins/fail-allow-builds-entry: 60.7 s
note: plant time: pins/fail-allow-builds-missing: 61.0 s
note: plant time: pins/fail-allow-builds-other-version: 61.2 s
note: plant time: pins/fail-allow-builds-unpinned-approval: 61.5 s
note: plant time: pins/fail-allow-builds-unpinned-fsevents: 61.7 s
note: plant time: pins/fail-dangerously-allow-all-builds: 61.9 s
note: plant time: pins/fail-lockfile-outdated: 62.2 s
note: plant time: pins/fail-node-linker-hoisted: 62.4 s
note: plant time: pins/fail-node-version-missing: 62.7 s
note: plant time: pins/fail-node-version-not-exact: 62.8 s
note: plant time: pins/fail-package-manager-missing: 63.0 s
note: plant time: lint/fail-gate-source: 63.1 s
note: plant time: pins/fail-package-manager-not-exact: 63.3 s
note: plant time: pins/fail-public-hoist-pattern: 63.3 s
note: plant time: pins/fail-release-age-exclude: 63.5 s
note: plant time: pins/fail-release-age-missing: 63.5 s
note: plant time: pins/fail-release-age-strict-false: 63.6 s
note: plant time: pins/fail-release-age-short: 63.6 s
note: plant time: pins/fail-release-age-strict-missing: 63.8 s
note: plant time: pins/fail-shamefully-hoist: 63.8 s
note: plant time: pins/fail-workspace-caret: 64.0 s
note: plant time: pins/fail-workspace-star: 64.0 s
note: plant time: pins/fail-workspace-version-differs: 64.2 s
note: plant time: pins/fail-workspace-tilde: 64.2 s
note: plant time: pins/pass-approved-build: 64.4 s
note: plant time: pins/pass-matching: 64.4 s
note: plant time: manifest/break-not-json: 65.3 s
note: plant time: manifest/fail-lost-attribute: 65.9 s
note: plant time: release-readiness/break-gap-rows-invalid: 67.1 s
note: plant time: manifest/pass-reordered: 67.2 s
note: plant time: release-readiness/fail-allowlist-no-reason: 68.9 s
note: plant time: release-readiness/fail-allowlist-stale: 69.1 s
note: plant time: release-readiness/fail-row-unmet: 70.7 s
note: plant time: release-readiness/pass-allowlisted: 70.7 s
note: plant time: release-readiness/fail-version-skew: 72.9 s
note: plant time: typecheck/error-missing-reference: 76.3 s
note: plant time: typecheck/fail-test-code: 79.0 s
note: plant time: typecheck/fail-implicit-any: 82.7 s
note: plant time: typecheck/pass-fixture-excluded: 85.3 s
note: plant time: unit-tests/error-throws-while-loading: 87.7 s
note: plant time: typecheck/pass-strict-file: 88.9 s
note: plant time: unit-tests/fail-styles-test: 95.1 s
note: plant time: unit-tests/fail-tokens-colocated: 97.5 s
note: plant time: unit-tests/fail-elements-chromium: 98.6 s
note: plant time: unit-tests/fail-tokens-test: 99.4 s
note: plant time: unit-tests/pass-elements-only: 101.6 s
note: plant time: unit-tests/pass-styles-only: 103.5 s
note: plant time: unit-tests/pass-tokens-only: 105.1 s
note: plant time: lint/error-unparsable: 112.7 s
note: plant time: lint/fail-floating-promise: 118.6 s
note: plant time: lint/pass-fixture-excluded: 125.1 s
note: plant time: test-lint/error-unparsable: 127.1 s
note: plant time: test-lint/fail-assertion-outside-test: 129.0 s
note: plant time: lint/pass-voided-promise: 130.7 s
note: plant time: test-lint/fail-colocated-element-test: 130.9 s
note: plant time: test-lint/fail-conditional-assertion: 132.7 s
note: plant time: test-lint/fail-focused: 132.7 s
note: plant time: test-lint/fail-not-awaited: 134.9 s
note: plant time: test-lint/fail-no-assertion: 135.1 s
note: plant time: test-lint/fail-snapshot-only: 137.1 s
note: plant time: test-lint/fail-skipped: 137.2 s
note: plant time: csp/error-unparsable: 138.6 s
note: plant time: test-lint/pass-real-assertion: 139.3 s
note: plant time: csp/fail-eval: 140.3 s
note: plant time: csp/fail-event-handler: 140.7 s
note: plant time: csp/fail-function-call: 141.9 s
note: plant time: csp/fail-indirect-eval: 142.2 s
note: plant time: csp/fail-new-function: 143.4 s
note: plant time: csp/fail-inline-script: 143.6 s
note: plant time: csp/fail-set-interval-string: 144.9 s
note: plant time: csp/fail-set-timeout-string: 145.2 s
note: plant time: csp/fail-style-attribute: 146.5 s
note: plant time: csp/fail-style-attribute-after-newline: 146.7 s
note: plant time: csp/fail-style-element: 148.1 s
note: plant time: csp/fail-svg-slash-onload: 148.4 s
note: plant time: csp/pass-external-script: 149.9 s
note: plant time: csp/pass-function-timer: 150.1 s
note: plant time: csp/pass-inline-script-in-source: 151.6 s
note: plant time: csp/pass-look-alike-names: 151.6 s
note: plant time: config-copies/error-copy-missing: 152.8 s
note: plant time: csp/pass-storybook-out-of-scope: 153.2 s
note: plant time: prefix/error-invalid-utf8: 154.1 s
note: plant time: prefix/fail-custom-property-test-code: 154.5 s
note: plant time: prefix/fail-element-name: 155.4 s
note: plant time: prefix/fail-element-name-upper-case: 155.7 s
note: plant time: prefix/fail-event-name-built-output: 156.6 s
note: plant time: prefix/fail-generic-monospace: 157.1 s
note: plant time: prefix/fail-named-monospace: 158.0 s
note: plant time: prefix/pass-name-boundaries: 158.4 s
note: plant time: style-lint/element-property-clash: 160.7 s
note: plant time: style-lint/fail-aspect-calc: 161.2 s
note: plant time: style-lint/fail-aspect-ratio-other: 163.3 s
note: plant time: style-lint/error-unparsable: 163.5 s
note: plant time: style-lint/fail-element-stylesheet: 165.9 s
note: plant time: style-lint/fail-calc-operand: 166.1 s
note: plant time: style-lint/fail-element-property-misspelt: 168.5 s
note: plant time: style-lint/fail-element-template: 168.6 s
note: plant time: style-lint/fail-fit-content-length: 170.9 s
note: plant time: style-lint/fail-font-family: 171.1 s
note: plant time: style-lint/fail-gradient-angle: 173.4 s
note: plant time: style-lint/fail-font-weight: 173.6 s
note: plant time: style-lint/fail-gradient-hex: 175.7 s
note: plant time: style-lint/fail-gradient-length: 175.8 s
note: plant time: style-lint/fail-iteration-count-fraction: 177.9 s
note: plant time: style-lint/fail-hex-colour: 178.0 s
note: plant time: style-lint/fail-lh-calc-factor: 180.2 s
note: plant time: style-lint/fail-lh-calc-twice: 180.4 s
note: plant time: style-lint/fail-lh-multiple: 182.6 s
note: plant time: style-lint/fail-lh-multiple-calc: 182.7 s
note: plant time: style-lint/fail-lh-paren-factor: 184.9 s
note: plant time: style-lint/fail-minmax-auto: 185.0 s
note: plant time: style-lint/fail-named-colour: 187.1 s
note: plant time: style-lint/fail-radial-gradient: 187.2 s
note: plant time: style-lint/fail-rgb-colour: 189.5 s
note: plant time: style-lint/fail-rem-length: 189.6 s
note: plant time: style-lint/fail-scale-calc: 192.1 s
note: plant time: style-lint/fail-scale-factor: 192.1 s
note: plant time: style-lint/fail-scale-length: 194.1 s
note: plant time: style-lint/fail-styles-calc-line-height: 194.3 s
note: plant time: style-lint/fail-styles-font-without-line-height: 196.4 s
note: plant time: style-lint/fail-styles-literal-line-height: 196.5 s
note: plant time: style-lint/fail-styles-other-token-line-height: 198.9 s
note: plant time: style-lint/fail-styles-normal-line-height: 199.0 s
note: plant time: style-lint/fail-ms-time: 201.3 s
note: plant time: style-lint/fail-styles-percent-line-height: 201.4 s
note: plant time: style-lint/fail-styles-stylesheet: 203.7 s
note: plant time: style-lint/fail-translate-length: 203.8 s
note: plant time: style-lint/fail-unknown-token: 206.2 s
note: plant time: style-lint/fail-unitless-number: 206.3 s
note: plant time: style-lint/pass-aspect-square: 208.6 s
note: plant time: style-lint/fail-var-fallback: 208.7 s
note: plant time: style-lint/pass-anchor-name: 211.3 s
note: plant time: style-lint/pass-calc-tokens: 211.3 s
note: plant time: style-lint/pass-element-property: 213.7 s
note: plant time: style-lint/pass-empty-string: 213.7 s
note: plant time: style-lint/pass-grid-fit-content: 215.9 s
note: plant time: style-lint/pass-fr: 216.2 s
note: plant time: style-lint/pass-iteration-count: 218.5 s
note: plant time: style-lint/pass-line-height: 218.6 s
note: plant time: style-lint/pass-linear-gradient-tokens: 220.9 s
note: plant time: style-lint/pass-known-token: 220.9 s
note: plant time: style-lint/pass-one-line: 223.2 s
note: plant time: style-lint/pass-one-line-calc: 223.3 s
note: plant time: style-lint/pass-percentage: 225.5 s
note: plant time: style-lint/pass-scale-mirror: 225.6 s
note: plant time: style-lint/pass-story: 227.7 s
note: plant time: style-lint/pass-styles-line-height-token: 227.9 s
note: plant time: style-lint/pass-test-code: 230.0 s
note: plant time: style-lint/pass-token-definitions: 230.2 s
note: plant time: style-lint/pass-system-colour: 232.3 s
note: plant time: style-lint/pass-translate-percentage: 232.4 s
note: plant time: style-lint/pass-var-keyword-fallback: 234.8 s
note: plant time: style-lint/pass-var-token: 234.9 s
note: plant time: brand-rules/f-delay-marker-misplaced: 235.5 s
note: plant time: brand-rules/f-motion-not-ms: 236.1 s
note: plant time: brand-rules/f-motion-not-zero: 236.8 s
note: plant time: style-lint/pass-zero: 237.0 s
note: plant time: brand-rules/f-motion-spin-missing: 237.6 s
note: plant time: brand-rules/g-forced-colours-override: 237.6 s
note: plant time: brand-rules/source-throws: 238.3 s
note: plant time: brand-rules/generator-throws: 238.4 s
note: plant time: contrast/source-throws: 239.1 s
note: plant time: brand-rules/g-system-colour-mapping: 239.2 s
note: plant time: manifest/fail-undescribed-attribute: 240.8 s
note: plant time: manifest/fail-stale-property: 241.0 s
note: plant time: manifest/fail-undescribed-event: 242.4 s
note: plant time: manifest/fail-undescribed-slot: 242.5 s
note: plant time: manifest/fail-undescribed-css-part: 244.1 s
note: plant time: manifest/fail-undescribed-css-property: 244.2 s
note: plant time: release-readiness/fail-rows-reworded: 246.1 s
note: plant time: manifest/fail-undescribed-property: 246.1 s
note: plant time: pins/fail-tilde-range: 246.3 s
note: plant time: pins/fail-caret-range: 246.3 s
note: plant time: sandbox-paths/fail-store-and-repo-root: 246.4 s
note: plant time: sandbox-paths/fail-allowed-name-elsewhere: 246.5 s
note: plant time: sandbox-paths/fail-file-url-in-json: 246.6 s
note: plant time: unit-tests/pass-fixture-not-run: 248.4 s
note: plant time: test-lint/pass-fixture-excluded: 248.7 s
note: plant time: mutation/error-unresolvable-base: 250.0 s
note: plant time: config-copies/fail-one-setting-differs: 250.8 s
note: plant time: config-copies/fail-test-pathspec-narrowed: 251.6 s
note: plant time: config-copies/pass-equal-copies: 252.7 s
note: plant time: pack-contents/fail-ofl-missing: 254.6 s
note: plant time: mutation/fail-gate-source-survivor: 278.6 s
note: plant time: mutation/error-checker-failure: 297.2 s
note: plant time: mutation/error-dry-run-fails: 310.1 s
note: plant time: mutation/error-zero-mutant-failing-test: 324.2 s
note: plant time: mutation/fail-disable-all: 338.0 s
note: plant time: mutation/fail-element-source-survivor: 357.5 s
note: plant time: mutation/fail-element-source-no-coverage: 371.9 s
note: plant time: mutation/fail-no-test-runs: 388.6 s
note: plant time: mutation/fail-record-without-reason: 398.0 s
note: plant time: mutation/fail-unchecked-line: 418.4 s
note: plant time: mutation/pass-compile-error: 427.9 s
note: plant time: mutation/pass-fully-checked: 447.6 s
note: plant time: mutation/pass-element-source: 459.3 s
note: plant time: mutation/pass-test-only-change: 460.9 s
note: plant time: mutation/pass-reasoned-record: 473.5 s
note: plant time: pack-contents/fail-export-missing: 474.2 s
note: plant time: sandbox-paths/pass-allowed-files: 474.4 s
note: plant time: pack-contents/fail-license-missing: 475.2 s
note: plant time: pack-contents/fail-extra-file: 476.2 s
note: plant time: pack-contents/fail-notice-differs: 477.0 s
note: plant time: pack-contents/fail-npmrc: 477.9 s
note: plant time: pack-contents/fail-ofl-differs: 479.0 s
note: plant time: pack-contents/fail-peer-exact: 480.0 s
note: plant time: pack-contents/fail-private: 481.1 s
note: plant time: pack-contents/fail-repository-directory: 481.9 s
note: plant time: pack-contents/fail-sandbox-path: 482.4 s
note: plant time: pack-contents/fail-version-skew: 483.2 s
note: plant time: mutation/pass-zero-mutant: 483.3 s
note: plant time: pack-contents/fail-workspace-peer: 484.4 s
note: plant time: pack-contents/pass-star-export: 484.5 s
note: plant time: pack-contents/fail-test-file: 485.3 s
note: plant time: pack-contents/pass-minimal: 485.4 s
note: plant time: pack-contents/break-tarball-unreadable: 486.1 s
note: plant time: release-readiness/fail-changelog-undated: 486.9 s
note: plant time: release-readiness/fail-row-spec-only: 487.6 s
note: plant time: release-readiness/fail-changelog-missing-token-group: 488.4 s
note: plant time: release-readiness/fail-unreleased-not-empty: 489.3 s
note: plant time: release-readiness/fail-changelog-missing-element: 489.8 s
note: plant time: pack-contents/break-manifest-invalid: 490.5 s
note: plant time: release-readiness/pass-token-prefix: 490.8 s
note: plant time: mutation/fail-mixed-survivors: 531.6 s
note: plant time: storybook-build/error-config-unreadable: 2.7 s
note: plant time: storybook-build/error-missing-dependencies: 0.8 s
note: plant time: storybook-build/error-no-build-script: 0.7 s
note: plant time: storybook-build/fail-empty-index: 3.1 s
note: plant time: storybook-build/fail-not-csf: 1.9 s
note: plant time: storybook-build/fail-syntax-error: 2.0 s
note: plant time: storybook-build/fail-unresolved-import: 2.5 s
note: plant time: storybook-build/pass-repository: 2.9 s
note: plant time: storybook-build/pass-type-error-only: 3.1 s
note: plant time: visual/error-host: 3.6 s
note: plant time: visual/error-no-engine: 0.8 s
note: plant time: axe/error-bad-exceptions: 1.4 s
note: plant time: axe/error-build-fails: 3.0 s
note: plant time: axe/error-exception-plan-not-a-plan: 1.4 s
note: plant time: axe/fail-closed-shadow-root: 556.0 s
note: plant time: axe/fail-empty: 579.1 s
note: plant time: axe/fail-excepted-second-node: 564.6 s
note: plant time: axe/fail-hover-near-fold: 559.7 s
note: plant time: axe/fail-hover-reveals-unlabelled: 569.5 s
note: plant time: axe/fail-incomplete: 561.5 s
note: plant time: axe/fail-no-box: 556.9 s
note: plant time: axe/fail-open-shadow-unlabelled: 554.1 s
note: plant time: axe/fail-outside-root: 552.0 s
note: plant time: axe/fail-pointer-target-below-fold: 551.4 s
note: plant time: axe/fail-render-throws: 556.1 s
note: plant time: axe/fail-stale-exception: 557.1 s
note: plant time: axe/fail-throws-on-load: 572.7 s
note: plant time: axe/fail-two-low-contrast: 570.9 s
note: plant time: axe/fail-unlabelled-button: 575.1 s
note: plant time: axe/fail-unrecorded-exception: 575.6 s
note: plant time: axe/pass-excepted: 560.7 s
note: plant time: axe/pass-excepted-incomplete: 562.1 s
note: plant time: axe/pass-excepted-shadow: 557.8 s
note: plant time: axe/pass-minor-only: 561.0 s
note: plant time: axe/pass-repository: 550.1 s
note: plant time: axe/pass-second-render: 561.8 s
note: plant time: plants/fail-shard-in-plant-check: 0.0 s
note: plant time: plants/fail-gate-without-job: 0.0 s
note: plant time: plants/fail-affected-in-plant-check: 0.0 s
note: plant time: plants/fail-gate-without-entry: 0.0 s
note: plant time: plants/fail-skip-container-in-ci: 0.0 s
note: plant time: plants/fail-skip-container-in-shard: 0.0 s
note: plant time: plants/pass-split-plant-jobs: 0.0 s
note: plant time: plants/pass-matching: 0.0 s
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
