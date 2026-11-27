# Plants of phase 0

- base: 7af6180b2ac3027f565c296db3c03facfea86aaa
- command: pnpm run gate:plants -- --affected 7af6180b2ac3027f565c296db3c03facfea86aaa
- exit: 2

This environment has no running container engine and no Playwright browser of the pinned version. The 46 visual
plants were not run; the 12 unit-tests plants report "Chromium not found", the 22 axe plants "no browser", and the 4
element mutation plants "Stryker wrote no report" (its initial test run, which runs the element tests in Chromium,
failed). Every other selected plant was judged as expected. CI's Plants check judges every plant.

```text
$ node gates/bin/plants.ts -- --affected 7af6180b2ac3027f565c296db3c03facfea86aaa
note: affected: every plant, by .github/workflows/evidence-reuse-shadow.yml (not mapped)
note: plant time: contrast/empty-list: 0.7 s
note: plant time: unit-tests/error-no-test-file: 1.0 s
note: plant time: contrast/excluded-without-reason: 1.3 s
note: plant time: contrast/exempt-disabled-ink: 1.7 s
note: plant time: contrast/exempt-not-disabled-ink: 2.0 s
note: plant time: contrast/figure-mismatch: 2.4 s
note: plant time: contrast/missing-required-pair: 2.7 s
note: plant time: contrast/non-text-below-threshold: 3.1 s
note: plant time: contrast/not-opaque: 3.3 s
note: plant time: contrast/repository-values: 3.7 s
note: plant time: contrast/required-pair-excluded: 3.9 s
note: plant time: contrast/unknown-token: 4.3 s
note: plant time: contrast/text-below-threshold: 4.6 s
note: plant time: signoff/error-empty-range: 4.8 s
note: plant time: contrast/unparsable-list: 5.0 s
note: plant time: signoff/fail-no-trailer: 5.0 s
note: plant time: signoff/fail-trailer-mismatch: 5.1 s
note: plant time: signoff/pass-agent-self-signoff: 5.1 s
note: plant time: signoff/pass-unsigned-merge: 5.3 s
note: plant time: brand-rules/a-monospace: 5.8 s
note: plant time: brand-rules/b-link-equals-accent: 5.9 s
note: plant time: brand-rules/b-ochre-pair-not-excluded: 6.6 s
note: plant time: brand-rules/c-extra-radius: 6.7 s
note: plant time: brand-rules/d-rule-as-boundary: 7.5 s
note: plant time: brand-rules/c-wrong-value: 7.5 s
note: plant time: brand-rules/e-light-chrome: 8.7 s
note: plant time: brand-rules/repository-values: 8.7 s
note: plant time: brand-rules/source-invalid: 9.7 s
note: plant time: manifest/break-missing: 10.1 s
note: plant time: sandbox-paths/error-no-tracked-file: 10.3 s
note: plant time: prefix/pass-outside-packages: 11.7 s
note: plant time: manifest/pass-repository: 11.8 s
note: plant time: sandbox-paths/fail-gitattributes-diff: 11.8 s
note: plant time: sandbox-paths/pass-binary-file: 11.9 s
note: plant time: sandbox-paths/pass-near-misses: 12.0 s
note: plant time: typecheck/fail-gate-source: 18.6 s
note: plant time: unit-tests/fail-gates-test: 20.9 s
note: plant time: unit-tests/pass-gates-only: 23.0 s
note: plant time: style-lint/fail-styles-outside-src: 25.7 s
note: plant time: lint/fail-gate-source: 26.9 s
note: plant time: prefix/fail-storybook-html-multiline-monospace: 27.7 s
note: plant time: test-lint/fail-gate-test: 27.7 s
note: plant time: pins/error-invalid-json: 27.9 s
note: plant time: pins/fail-allow-builds-entry: 28.1 s
note: plant time: prefix/fail-storybook-monospace: 28.3 s
note: plant time: pins/fail-allow-builds-missing: 28.3 s
note: plant time: pins/fail-allow-builds-unpinned-approval: 28.5 s
note: plant time: pins/fail-allow-builds-other-version: 28.5 s
note: plant time: pins/fail-allow-builds-unpinned-fsevents: 28.7 s
note: plant time: pins/fail-dangerously-allow-all-builds: 28.7 s
note: plant time: pins/fail-lockfile-outdated: 28.9 s
note: plant time: pins/fail-node-linker-hoisted: 28.9 s
note: plant time: pins/fail-node-version-missing: 29.1 s
note: plant time: pins/fail-node-version-not-exact: 29.1 s
note: plant time: pins/fail-package-manager-missing: 29.3 s
note: plant time: pins/fail-package-manager-not-exact: 29.3 s
note: plant time: pins/fail-release-age-exclude: 29.5 s
note: plant time: pins/fail-public-hoist-pattern: 29.5 s
note: plant time: pins/fail-release-age-missing: 29.7 s
note: plant time: pins/fail-release-age-short: 29.7 s
note: plant time: pins/fail-release-age-strict-false: 29.9 s
note: plant time: pins/fail-release-age-strict-missing: 30.0 s
note: plant time: pins/fail-shamefully-hoist: 30.1 s
note: plant time: pins/fail-workspace-caret: 30.2 s
note: plant time: pins/fail-workspace-star: 30.3 s
note: plant time: pins/fail-workspace-tilde: 30.4 s
note: plant time: pins/fail-workspace-version-differs: 30.5 s
note: plant time: pins/pass-approved-build: 30.6 s
note: plant time: pins/pass-matching: 30.7 s
note: plant time: manifest/break-not-json: 31.6 s
note: plant time: manifest/fail-lost-attribute: 32.3 s
note: plant time: manifest/pass-reordered: 33.5 s
note: plant time: typecheck/error-missing-reference: 38.6 s
note: plant time: typecheck/fail-implicit-any: 40.2 s
note: plant time: typecheck/fail-test-code: 45.4 s
note: plant time: typecheck/pass-fixture-excluded: 46.9 s
note: plant time: typecheck/pass-strict-file: 52.1 s
note: plant time: lint/error-unparsable: 62.9 s
note: plant time: lint/fail-floating-promise: 68.6 s
note: plant time: lint/pass-fixture-excluded: 79.4 s
note: plant time: unit-tests/error-throws-while-loading: 81.0 s
note: plant time: unit-tests/fail-elements-chromium: 82.6 s
note: plant time: lint/pass-voided-promise: 84.1 s
note: plant time: unit-tests/fail-styles-test: 84.4 s
note: plant time: unit-tests/fail-tokens-colocated: 85.7 s
note: plant time: unit-tests/fail-tokens-test: 85.9 s
note: plant time: unit-tests/pass-elements-only: 87.2 s
note: plant time: unit-tests/pass-styles-only: 87.4 s
note: plant time: unit-tests/pass-tokens-only: 88.6 s
note: plant time: style-lint/element-property-clash: 90.0 s
note: plant time: style-lint/error-unparsable: 91.6 s
note: plant time: style-lint/fail-aspect-calc: 92.7 s
note: plant time: style-lint/fail-calc-operand: 94.7 s
note: plant time: style-lint/fail-aspect-ratio-other: 95.6 s
note: plant time: style-lint/fail-element-property-misspelt: 97.7 s
note: plant time: style-lint/fail-element-stylesheet: 98.5 s
note: plant time: style-lint/fail-element-template: 100.5 s
note: plant time: style-lint/fail-fit-content-length: 101.4 s
note: plant time: style-lint/fail-font-family: 103.4 s
note: plant time: style-lint/fail-font-weight: 104.5 s
note: plant time: style-lint/fail-gradient-angle: 106.3 s
note: plant time: style-lint/fail-gradient-hex: 107.4 s
note: plant time: style-lint/fail-gradient-length: 109.0 s
note: plant time: style-lint/fail-iteration-count-fraction: 110.1 s
note: plant time: style-lint/fail-hex-colour: 111.7 s
note: plant time: style-lint/fail-lh-calc-factor: 112.7 s
note: plant time: style-lint/fail-lh-calc-twice: 114.8 s
note: plant time: style-lint/fail-lh-multiple: 115.3 s
note: plant time: style-lint/fail-lh-multiple-calc: 117.6 s
note: plant time: style-lint/fail-lh-paren-factor: 117.9 s
note: plant time: style-lint/fail-minmax-auto: 120.5 s
note: plant time: style-lint/fail-ms-time: 120.6 s
note: plant time: style-lint/fail-named-colour: 123.2 s
note: plant time: style-lint/fail-radial-gradient: 123.4 s
note: plant time: style-lint/fail-rem-length: 126.0 s
note: plant time: style-lint/fail-rgb-colour: 126.2 s
note: plant time: style-lint/fail-scale-calc: 129.0 s
note: plant time: style-lint/fail-scale-factor: 129.2 s
note: plant time: style-lint/fail-scale-length: 132.0 s
note: plant time: style-lint/fail-styles-calc-line-height: 132.0 s
note: plant time: style-lint/fail-styles-literal-line-height: 134.7 s
note: plant time: style-lint/fail-styles-font-without-line-height: 134.7 s
note: plant time: style-lint/fail-styles-normal-line-height: 137.6 s
note: plant time: style-lint/fail-styles-other-token-line-height: 137.6 s
note: plant time: style-lint/fail-styles-percent-line-height: 140.6 s
note: plant time: style-lint/fail-styles-stylesheet: 140.6 s
note: plant time: style-lint/fail-unitless-number: 143.5 s
note: plant time: style-lint/fail-translate-length: 143.6 s
note: plant time: style-lint/fail-unknown-token: 146.6 s
note: plant time: style-lint/fail-var-fallback: 146.6 s
note: plant time: style-lint/pass-aspect-square: 149.5 s
note: plant time: style-lint/pass-anchor-name: 149.5 s
note: plant time: style-lint/pass-calc-tokens: 152.4 s
note: plant time: style-lint/pass-element-property: 152.5 s
note: plant time: style-lint/pass-empty-string: 155.1 s
note: plant time: style-lint/pass-fr: 155.2 s
note: plant time: style-lint/pass-grid-fit-content: 158.1 s
note: plant time: style-lint/pass-iteration-count: 158.2 s
note: plant time: style-lint/pass-known-token: 161.0 s
note: plant time: style-lint/pass-line-height: 161.0 s
note: plant time: style-lint/pass-linear-gradient-tokens: 163.7 s
note: plant time: style-lint/pass-one-line: 163.8 s
note: plant time: style-lint/pass-one-line-calc: 166.6 s
note: plant time: style-lint/pass-percentage: 166.6 s
note: plant time: style-lint/pass-scale-mirror: 169.3 s
note: plant time: style-lint/pass-story: 169.4 s
note: plant time: style-lint/pass-styles-line-height-token: 172.0 s
note: plant time: style-lint/pass-system-colour: 172.1 s
note: plant time: style-lint/pass-token-definitions: 174.7 s
note: plant time: style-lint/pass-test-code: 174.8 s
note: plant time: style-lint/pass-translate-percentage: 177.7 s
note: plant time: style-lint/pass-var-keyword-fallback: 177.7 s
note: plant time: style-lint/pass-zero: 180.5 s
note: plant time: style-lint/pass-var-token: 180.5 s
note: plant time: test-lint/error-unparsable: 182.9 s
note: plant time: test-lint/fail-assertion-outside-test: 183.0 s
note: plant time: test-lint/fail-colocated-element-test: 185.2 s
note: plant time: test-lint/fail-conditional-assertion: 185.3 s
note: plant time: test-lint/fail-focused: 187.5 s
note: plant time: test-lint/fail-no-assertion: 187.6 s
note: plant time: test-lint/fail-not-awaited: 189.8 s
note: plant time: test-lint/fail-skipped: 190.0 s
note: plant time: test-lint/fail-snapshot-only: 192.2 s
note: plant time: test-lint/pass-real-assertion: 192.4 s
note: plant time: csp/error-unparsable: 193.5 s
note: plant time: csp/fail-eval: 193.8 s
note: plant time: csp/fail-event-handler: 195.0 s
note: plant time: csp/fail-function-call: 195.2 s
note: plant time: csp/fail-indirect-eval: 196.4 s
note: plant time: csp/fail-inline-script: 196.6 s
note: plant time: csp/fail-new-function: 197.8 s
note: plant time: csp/fail-set-interval-string: 198.1 s
note: plant time: csp/fail-set-timeout-string: 199.2 s
note: plant time: csp/fail-style-attribute: 199.6 s
note: plant time: csp/fail-style-attribute-after-newline: 200.3 s
note: plant time: csp/fail-style-element: 201.0 s
note: plant time: csp/fail-svg-slash-onload: 201.5 s
note: plant time: csp/pass-external-script: 202.2 s
note: plant time: csp/pass-function-timer: 202.9 s
note: plant time: csp/pass-inline-script-in-source: 203.4 s
note: plant time: csp/pass-look-alike-names: 204.2 s
note: plant time: csp/pass-storybook-out-of-scope: 204.8 s
note: plant time: prefix/error-invalid-utf8: 205.1 s
note: plant time: prefix/fail-custom-property-test-code: 205.6 s
note: plant time: prefix/fail-element-name: 206.0 s
note: plant time: prefix/fail-element-name-upper-case: 206.6 s
note: plant time: prefix/fail-event-name-built-output: 207.1 s
note: plant time: prefix/fail-generic-monospace: 207.6 s
note: plant time: prefix/fail-named-monospace: 208.1 s
note: plant time: prefix/pass-name-boundaries: 208.6 s
note: plant time: config-copies/error-copy-missing: 209.1 s
note: plant time: contrast/source-throws: 209.6 s
note: plant time: brand-rules/f-motion-not-ms: 210.1 s
note: plant time: brand-rules/f-motion-spin-missing: 210.7 s
note: plant time: brand-rules/f-motion-not-zero: 211.2 s
note: plant time: brand-rules/f-delay-marker-misplaced: 211.7 s
note: plant time: brand-rules/g-forced-colours-override: 212.2 s
note: plant time: brand-rules/g-system-colour-mapping: 212.8 s
note: plant time: brand-rules/generator-throws: 213.2 s
note: plant time: brand-rules/source-throws: 213.8 s
note: plant time: manifest/fail-stale-property: 215.1 s
note: plant time: manifest/fail-undescribed-attribute: 215.7 s
note: plant time: manifest/fail-undescribed-css-part: 217.0 s
note: plant time: manifest/fail-undescribed-css-property: 217.5 s
note: plant time: manifest/fail-undescribed-event: 218.8 s
note: plant time: manifest/fail-undescribed-property: 219.6 s
note: plant time: pins/fail-caret-range: 219.8 s
note: plant time: pins/fail-tilde-range: 220.0 s
note: plant time: sandbox-paths/fail-store-and-repo-root: 220.2 s
note: plant time: sandbox-paths/fail-allowed-name-elsewhere: 220.3 s
note: plant time: manifest/fail-undescribed-slot: 220.5 s
note: plant time: sandbox-paths/fail-file-url-in-json: 220.5 s
note: plant time: unit-tests/pass-fixture-not-run: 221.7 s
note: plant time: test-lint/pass-fixture-excluded: 222.6 s
note: plant time: mutation/error-unresolvable-base: 223.8 s
note: plant time: config-copies/pass-equal-copies: 224.7 s
note: plant time: config-copies/fail-one-setting-differs: 225.4 s
note: plant time: config-copies/fail-test-pathspec-narrowed: 226.5 s
note: plant time: mutation/fail-gate-source-survivor: 257.6 s
note: plant time: mutation/error-checker-failure: 275.6 s
note: plant time: mutation/error-dry-run-fails: 291.1 s
note: plant time: mutation/error-zero-mutant-failing-test: 303.8 s
note: plant time: mutation/fail-disable-all: 319.5 s
note: plant time: mutation/fail-element-source-no-coverage: 331.7 s
note: plant time: mutation/fail-element-source-survivor: 346.4 s
note: plant time: mutation/fail-no-test-runs: 362.9 s
note: plant time: mutation/fail-record-without-reason: 372.8 s
note: plant time: mutation/pass-compile-error: 393.2 s
note: plant time: mutation/fail-unchecked-line: 402.9 s
note: plant time: mutation/pass-element-source: 421.3 s
note: plant time: mutation/pass-fully-checked: 435.2 s
note: plant time: mutation/pass-test-only-change: 436.9 s
note: plant time: mutation/pass-reasoned-record: 448.6 s
note: plant time: sandbox-paths/pass-allowed-files: 448.8 s
note: plant time: mutation/pass-zero-mutant: 464.7 s
note: plant time: mutation/fail-mixed-survivors: 494.6 s
note: plant time: storybook-build/error-config-unreadable: 2.5 s
note: plant time: storybook-build/error-missing-dependencies: 0.7 s
note: plant time: storybook-build/error-no-build-script: 0.8 s
note: plant time: storybook-build/fail-empty-index: 2.7 s
note: plant time: storybook-build/fail-not-csf: 2.3 s
note: plant time: storybook-build/fail-syntax-error: 2.2 s
note: plant time: storybook-build/fail-unresolved-import: 2.6 s
note: plant time: storybook-build/pass-repository: 3.3 s
note: plant time: storybook-build/pass-type-error-only: 3.4 s
note: plant time: visual/error-host: 4.1 s
note: plant time: visual/error-no-engine: 0.9 s
note: plant time: axe/error-bad-exceptions: 1.4 s
note: plant time: axe/error-build-fails: 3.2 s
note: plant time: axe/error-exception-plan-not-a-plan: 1.4 s
note: plant time: axe/fail-closed-shadow-root: 4.3 s
note: plant time: axe/fail-empty: 4.2 s
note: plant time: axe/fail-excepted-second-node: 4.0 s
note: plant time: axe/fail-hover-near-fold: 4.3 s
note: plant time: axe/fail-hover-reveals-unlabelled: 4.0 s
note: plant time: axe/fail-incomplete: 3.8 s
note: plant time: axe/fail-no-box: 3.8 s
note: plant time: axe/fail-open-shadow-unlabelled: 4.0 s
note: plant time: axe/fail-outside-root: 4.1 s
note: plant time: axe/fail-pointer-target-below-fold: 4.1 s
note: plant time: axe/fail-render-throws: 4.0 s
note: plant time: axe/fail-stale-exception: 3.9 s
note: plant time: axe/fail-throws-on-load: 4.2 s
note: plant time: axe/fail-two-low-contrast: 4.0 s
note: plant time: axe/fail-unlabelled-button: 3.6 s
note: plant time: axe/fail-unrecorded-exception: 4.1 s
note: plant time: axe/pass-excepted: 3.9 s
note: plant time: axe/pass-excepted-incomplete: 3.9 s
note: plant time: axe/pass-excepted-shadow: 4.0 s
note: plant time: axe/pass-minor-only: 3.8 s
note: plant time: axe/pass-repository: 3.8 s
note: plant time: axe/pass-second-render: 3.4 s
note: plant time: plants/fail-affected-in-plant-check: 0.0 s
note: plant time: plants/fail-gate-without-entry: 0.0 s
note: plant time: plants/fail-gate-without-job: 0.0 s
note: plant time: plants/fail-shard-in-plant-check: 0.0 s
note: plant time: plants/fail-skip-container-in-ci: 0.0 s
note: plant time: plants/fail-skip-container-in-shard: 0.0 s
note: plant time: plants/pass-matching: 0.0 s
note: plant time: plants/pass-split-plant-jobs: 0.0 s
gates/plants/unit-tests/error-no-test-file: plants: not-reported-broken: expected exit 2 (could not run) with the cause "unit-tests: could not run: no test file found", got exit 2 (unit-tests: could not run: Chromium not found at /opt/pw-browsers/chromium-1248/chrome-linux64/chrome; run pnpm run setup:online)
gates/plants/unit-tests/error-throws-while-loading: plants: not-reported-broken: expected exit 2 (could not run) with the cause "unit-tests: could not run: packages/tokens/test/x.test.ts failed to load: planted: this file fails while loading", got exit 2 (unit-tests: could not run: Chromium not found at /opt/pw-browsers/chromium-1248/chrome-linux64/chrome; run pnpm run setup:online)
gates/plants/unit-tests/fail-elements-chromium: plants: not-caught: expected exit 1 with the plant's 1 finding, got exit 2 (unit-tests: could not run: Chromium not found at /opt/pw-browsers/chromium-1248/chrome-linux64/chrome; run pnpm run setup:online)
gates/plants/unit-tests/fail-gates-test: plants: not-caught: expected exit 1 with the plant's 2 findings, got exit 2 (unit-tests: could not run: Chromium not found at /opt/pw-browsers/chromium-1248/chrome-linux64/chrome; run pnpm run setup:online)
gates/plants/unit-tests/fail-styles-test: plants: not-caught: expected exit 1 with the plant's 1 finding, got exit 2 (unit-tests: could not run: Chromium not found at /opt/pw-browsers/chromium-1248/chrome-linux64/chrome; run pnpm run setup:online)
gates/plants/unit-tests/fail-tokens-colocated: plants: not-caught: expected exit 1 with the plant's 1 finding, got exit 2 (unit-tests: could not run: Chromium not found at /opt/pw-browsers/chromium-1248/chrome-linux64/chrome; run pnpm run setup:online)
gates/plants/unit-tests/fail-tokens-test: plants: not-caught: expected exit 1 with the plant's 1 finding, got exit 2 (unit-tests: could not run: Chromium not found at /opt/pw-browsers/chromium-1248/chrome-linux64/chrome; run pnpm run setup:online)
gates/plants/unit-tests/pass-elements-only: plants: not-accepted: expected exit 0 with no finding, got exit 2 (unit-tests: could not run: Chromium not found at /opt/pw-browsers/chromium-1248/chrome-linux64/chrome; run pnpm run setup:online)
gates/plants/unit-tests/pass-fixture-not-run: plants: not-accepted: expected exit 0 with no finding, got exit 2 (unit-tests: could not run: Chromium not found at /opt/pw-browsers/chromium-1248/chrome-linux64/chrome; run pnpm run setup:online)
gates/plants/unit-tests/pass-gates-only: plants: not-accepted: expected exit 0 with no finding, got exit 2 (unit-tests: could not run: Chromium not found at /opt/pw-browsers/chromium-1248/chrome-linux64/chrome; run pnpm run setup:online)
gates/plants/unit-tests/pass-styles-only: plants: not-accepted: expected exit 0 with no finding, got exit 2 (unit-tests: could not run: Chromium not found at /opt/pw-browsers/chromium-1248/chrome-linux64/chrome; run pnpm run setup:online)
gates/plants/unit-tests/pass-tokens-only: plants: not-accepted: expected exit 0 with no finding, got exit 2 (unit-tests: could not run: Chromium not found at /opt/pw-browsers/chromium-1248/chrome-linux64/chrome; run pnpm run setup:online)
gates/plants/mutation/fail-element-source-no-coverage: plants: not-caught: expected exit 1 with the plant's 1 finding, got exit 2 (mutation: could not run: Stryker wrote no report (Unexpected error occurred while running Stryker Error: Something went wrong in the initial test run); run pnpm test and check stryker.config.json)
gates/plants/mutation/fail-element-source-survivor: plants: not-caught: expected exit 1 with the plant's 1 finding, got exit 2 (mutation: could not run: Stryker wrote no report (Unexpected error occurred while running Stryker Error: Something went wrong in the initial test run); run pnpm test and check stryker.config.json)
gates/plants/mutation/fail-mixed-survivors: plants: not-caught: expected exit 1 with the plant's 2 findings, got exit 2 (mutation: could not run: Stryker wrote no report (Unexpected error occurred while running Stryker Error: Something went wrong in the initial test run); run pnpm test and check stryker.config.json)
gates/plants/mutation/pass-element-source: plants: not-accepted: expected exit 0 with no finding, got exit 2 (mutation: could not run: Stryker wrote no report (Unexpected error occurred while running Stryker Error: Something went wrong in the initial test run); run pnpm test and check stryker.config.json)
gates/plants/axe/fail-closed-shadow-root: plants: not-caught: expected exit 1 with the plant's 2 findings, got exit 2 (axe: could not run: no browser: browserType.launch: Executable doesn't exist at /opt/pw-browsers/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell)
gates/plants/axe/fail-empty: plants: not-caught: expected exit 1 with the plant's 2 findings, got exit 2 (axe: could not run: no browser: browserType.launch: Executable doesn't exist at /opt/pw-browsers/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell)
gates/plants/axe/fail-excepted-second-node: plants: not-caught: expected exit 1 with the plant's 2 findings, got exit 2 (axe: could not run: no browser: browserType.launch: Executable doesn't exist at /opt/pw-browsers/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell)
gates/plants/axe/fail-hover-near-fold: plants: not-caught: expected exit 1 with the plant's 2 findings, got exit 2 (axe: could not run: no browser: browserType.launch: Executable doesn't exist at /opt/pw-browsers/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell)
gates/plants/axe/fail-hover-reveals-unlabelled: plants: not-caught: expected exit 1 with the plant's 2 findings, got exit 2 (axe: could not run: no browser: browserType.launch: Executable doesn't exist at /opt/pw-browsers/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell)
gates/plants/axe/fail-incomplete: plants: not-caught: expected exit 1 with the plant's 2 findings, got exit 2 (axe: could not run: no browser: browserType.launch: Executable doesn't exist at /opt/pw-browsers/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell)
gates/plants/axe/fail-no-box: plants: not-caught: expected exit 1 with the plant's 2 findings, got exit 2 (axe: could not run: no browser: browserType.launch: Executable doesn't exist at /opt/pw-browsers/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell)
gates/plants/axe/fail-open-shadow-unlabelled: plants: not-caught: expected exit 1 with the plant's 2 findings, got exit 2 (axe: could not run: no browser: browserType.launch: Executable doesn't exist at /opt/pw-browsers/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell)
gates/plants/axe/fail-outside-root: plants: not-caught: expected exit 1 with the plant's 4 findings, got exit 2 (axe: could not run: no browser: browserType.launch: Executable doesn't exist at /opt/pw-browsers/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell)
gates/plants/axe/fail-pointer-target-below-fold: plants: not-caught: expected exit 1 with the plant's 2 findings, got exit 2 (axe: could not run: no browser: browserType.launch: Executable doesn't exist at /opt/pw-browsers/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell)
gates/plants/axe/fail-render-throws: plants: not-caught: expected exit 1 with the plant's 2 findings, got exit 2 (axe: could not run: no browser: browserType.launch: Executable doesn't exist at /opt/pw-browsers/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell)
gates/plants/axe/fail-stale-exception: plants: not-caught: expected exit 1 with the plant's 1 finding, got exit 2 (axe: could not run: no browser: browserType.launch: Executable doesn't exist at /opt/pw-browsers/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell)
gates/plants/axe/fail-throws-on-load: plants: not-caught: expected exit 1 with the plant's 2 findings, got exit 2 (axe: could not run: no browser: browserType.launch: Executable doesn't exist at /opt/pw-browsers/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell)
gates/plants/axe/fail-two-low-contrast: plants: not-caught: expected exit 1 with the plant's 4 findings, got exit 2 (axe: could not run: no browser: browserType.launch: Executable doesn't exist at /opt/pw-browsers/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell)
gates/plants/axe/fail-unlabelled-button: plants: not-caught: expected exit 1 with the plant's 2 findings, got exit 2 (axe: could not run: no browser: browserType.launch: Executable doesn't exist at /opt/pw-browsers/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell)
gates/plants/axe/fail-unrecorded-exception: plants: not-caught: expected exit 1 with the plant's 3 findings, got exit 2 (axe: could not run: no browser: browserType.launch: Executable doesn't exist at /opt/pw-browsers/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell)
gates/plants/axe/pass-excepted: plants: not-accepted: expected exit 0 with no finding, got exit 2 (axe: could not run: no browser: browserType.launch: Executable doesn't exist at /opt/pw-browsers/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell)
gates/plants/axe/pass-excepted-incomplete: plants: not-accepted: expected exit 0 with no finding, got exit 2 (axe: could not run: no browser: browserType.launch: Executable doesn't exist at /opt/pw-browsers/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell)
gates/plants/axe/pass-excepted-shadow: plants: not-accepted: expected exit 0 with no finding, got exit 2 (axe: could not run: no browser: browserType.launch: Executable doesn't exist at /opt/pw-browsers/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell)
gates/plants/axe/pass-minor-only: plants: not-accepted: expected exit 0 with no finding, got exit 2 (axe: could not run: no browser: browserType.launch: Executable doesn't exist at /opt/pw-browsers/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell)
gates/plants/axe/pass-repository: plants: not-accepted: expected exit 0 with no finding, got exit 2 (axe: could not run: no browser: browserType.launch: Executable doesn't exist at /opt/pw-browsers/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell)
gates/plants/axe/pass-second-render: plants: not-accepted: expected exit 0 with no finding, got exit 2 (axe: could not run: no browser: browserType.launch: Executable doesn't exist at /opt/pw-browsers/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell)
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
