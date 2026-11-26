# Plants of phase 1

- base: c7ba57d98f410d956c5c072302c8b34ae221dc5b
- command: pnpm run gate:plants -- --affected c7ba57d98f410d956c5c072302c8b34ae221dc5b
- exit: 143 (stopped by the implementer after 252 of the 317 plants, by the operator's CI-first decision of 2026-11-20:
  the selection was the full set, a multi-hour local run; CI's Plants check judges every plant)
- selection, rechecked at review round 1's fix (`pnpm run gate:plants -- --affected c7ba57d98f410d956c5c072302c8b34ae221dc5b --list`):
  `note: affected: every plant, by packages/elements/package.json (not mapped)` and `317 of 317 plants selected`
  (the earlier "337" was wrong; review round 1, R1-03). The fix changes only two gate tests, so the full run is
  still CI's (R1-04).

```text
$ node gates/bin/plants.ts -- --affected c7ba57d98f410d956c5c072302c8b34ae221dc5b
note: affected: every plant, by packages/elements/package.json (not mapped)
note: plant time: signoff/error-empty-range: 0.2 s
note: plant time: signoff/fail-no-trailer: 0.3 s
note: plant time: signoff/fail-trailer-mismatch: 0.5 s
note: plant time: signoff/pass-agent-self-signoff: 0.6 s
note: plant time: signoff/pass-unsigned-merge: 0.7 s
note: plant time: contrast/empty-list: 1.0 s
note: plant time: contrast/excluded-without-reason: 1.4 s
note: plant time: unit-tests/error-no-test-file: 1.5 s
note: plant time: contrast/exempt-disabled-ink: 1.9 s
note: plant time: contrast/exempt-not-disabled-ink: 1.9 s
note: plant time: contrast/figure-mismatch: 2.4 s
note: plant time: contrast/missing-required-pair: 2.4 s
note: plant time: contrast/not-opaque: 2.9 s
note: plant time: contrast/non-text-below-threshold: 3.0 s
note: plant time: contrast/required-pair-excluded: 3.4 s
note: plant time: contrast/repository-values: 3.4 s
note: plant time: contrast/text-below-threshold: 3.9 s
note: plant time: contrast/unknown-token: 3.9 s
note: plant time: contrast/unparsable-list: 4.4 s
note: plant time: brand-rules/a-monospace: 4.4 s
note: plant time: brand-rules/b-link-equals-accent: 4.9 s
note: plant time: brand-rules/b-ochre-pair-not-excluded: 4.9 s
note: plant time: brand-rules/c-wrong-value: 5.4 s
note: plant time: brand-rules/c-extra-radius: 5.4 s
note: plant time: brand-rules/d-rule-as-boundary: 5.8 s
note: plant time: brand-rules/e-light-chrome: 5.9 s
note: plant time: brand-rules/source-invalid: 6.3 s
note: plant time: brand-rules/repository-values: 6.3 s
note: plant time: manifest/break-missing: 7.1 s
note: plant time: manifest/pass-repository: 7.3 s
note: plant time: prefix/pass-outside-packages: 7.6 s
note: plant time: typecheck/fail-gate-source: 11.9 s
note: plant time: unit-tests/fail-gates-test: 13.6 s
note: plant time: unit-tests/pass-gates-only: 15.3 s
note: plant time: style-lint/fail-styles-outside-src: 17.1 s
note: plant time: lint/fail-gate-source: 17.1 s
note: plant time: prefix/fail-storybook-html-multiline-monospace: 17.6 s
note: plant time: prefix/fail-storybook-monospace: 18.0 s
note: plant time: pins/error-invalid-json: 18.2 s
note: plant time: pins/fail-allow-builds-entry: 18.3 s
note: plant time: test-lint/fail-gate-test: 18.6 s
note: plant time: pins/fail-allow-builds-missing: 18.6 s
note: plant time: pins/fail-allow-builds-other-version: 18.8 s
note: plant time: pins/fail-allow-builds-unpinned-approval: 18.8 s
note: plant time: pins/fail-dangerously-allow-all-builds: 19.0 s
note: plant time: pins/fail-allow-builds-unpinned-fsevents: 19.0 s
note: plant time: pins/fail-lockfile-outdated: 19.2 s
note: plant time: pins/fail-node-linker-hoisted: 19.2 s
note: plant time: pins/fail-node-version-missing: 19.3 s
note: plant time: pins/fail-node-version-not-exact: 19.4 s
note: plant time: pins/fail-package-manager-not-exact: 19.5 s
note: plant time: pins/fail-package-manager-missing: 19.6 s
note: plant time: pins/fail-release-age-exclude: 19.7 s
note: plant time: pins/fail-public-hoist-pattern: 19.7 s
note: plant time: pins/fail-release-age-missing: 19.9 s
note: plant time: pins/fail-release-age-short: 19.9 s
note: plant time: pins/fail-release-age-strict-false: 20.1 s
note: plant time: pins/fail-release-age-strict-missing: 20.1 s
note: plant time: pins/fail-shamefully-hoist: 20.3 s
note: plant time: pins/fail-workspace-caret: 20.3 s
note: plant time: pins/fail-workspace-tilde: 20.5 s
note: plant time: pins/fail-workspace-star: 20.5 s
note: plant time: pins/fail-workspace-version-differs: 20.7 s
note: plant time: pins/pass-approved-build: 20.7 s
note: plant time: pins/pass-matching: 20.9 s
note: plant time: manifest/break-not-json: 21.6 s
note: plant time: manifest/fail-lost-attribute: 22.0 s
note: plant time: manifest/pass-reordered: 22.8 s
note: plant time: typecheck/error-missing-reference: 26.3 s
note: plant time: typecheck/fail-implicit-any: 27.5 s
note: plant time: typecheck/pass-fixture-excluded: 30.8 s
note: plant time: typecheck/pass-strict-file: 35.9 s
note: plant time: lint/error-unparsable: 36.7 s
note: plant time: typecheck/fail-test-code: 41.1 s
note: plant time: lint/fail-floating-promise: 45.2 s
note: plant time: lint/pass-fixture-excluded: 50.8 s
note: plant time: unit-tests/fail-elements-chromium: 54.0 s
note: plant time: lint/pass-voided-promise: 54.4 s
note: plant time: unit-tests/error-throws-while-loading: 55.6 s
note: plant time: unit-tests/fail-tokens-colocated: 56.0 s
note: plant time: unit-tests/fail-tokens-test: 57.3 s
note: plant time: unit-tests/fail-styles-test: 57.6 s
note: plant time: unit-tests/pass-styles-only: 59.2 s
note: plant time: unit-tests/pass-elements-only: 60.0 s
note: plant time: csp/error-unparsable: 61.0 s
note: plant time: unit-tests/pass-tokens-only: 61.1 s
note: plant time: csp/fail-eval: 62.1 s
note: plant time: csp/fail-event-handler: 62.1 s
note: plant time: csp/fail-indirect-eval: 63.2 s
note: plant time: csp/fail-function-call: 63.2 s
note: plant time: csp/fail-inline-script: 64.1 s
note: plant time: csp/fail-new-function: 64.2 s
note: plant time: csp/fail-set-interval-string: 65.1 s
note: plant time: csp/fail-style-attribute: 65.2 s
note: plant time: csp/fail-style-attribute-after-newline: 65.9 s
note: plant time: csp/fail-style-element: 66.1 s
note: plant time: csp/fail-svg-slash-onload: 67.0 s
note: plant time: csp/pass-external-script: 67.1 s
note: plant time: csp/pass-function-timer: 67.9 s
note: plant time: csp/fail-set-timeout-string: 68.1 s
note: plant time: csp/pass-inline-script-in-source: 68.8 s
note: plant time: csp/pass-look-alike-names: 69.1 s
note: plant time: csp/pass-storybook-out-of-scope: 69.7 s
note: plant time: style-lint/element-property-clash: 70.7 s
note: plant time: style-lint/error-unparsable: 71.3 s
note: plant time: style-lint/fail-aspect-ratio-other: 72.5 s
note: plant time: style-lint/fail-calc-operand: 72.8 s
note: plant time: style-lint/fail-element-property-misspelt: 74.4 s
note: plant time: style-lint/fail-element-stylesheet: 74.5 s
note: plant time: style-lint/fail-element-template: 76.0 s
note: plant time: style-lint/fail-aspect-calc: 76.3 s
note: plant time: style-lint/fail-font-family: 77.9 s
note: plant time: style-lint/fail-fit-content-length: 78.2 s
note: plant time: style-lint/fail-font-weight: 79.7 s
note: plant time: style-lint/fail-gradient-angle: 80.0 s
note: plant time: style-lint/fail-gradient-hex: 81.7 s
note: plant time: style-lint/fail-gradient-length: 81.9 s
note: plant time: style-lint/fail-hex-colour: 84.0 s
note: plant time: style-lint/fail-iteration-count-fraction: 84.0 s
note: plant time: style-lint/fail-lh-calc-twice: 85.9 s
note: plant time: style-lint/fail-lh-calc-factor: 86.0 s
note: plant time: style-lint/fail-lh-multiple: 88.1 s
note: plant time: style-lint/fail-lh-multiple-calc: 88.2 s
note: plant time: style-lint/fail-minmax-auto: 90.1 s
note: plant time: style-lint/fail-lh-paren-factor: 90.2 s
note: plant time: style-lint/fail-ms-time: 92.2 s
note: plant time: style-lint/fail-named-colour: 92.3 s
note: plant time: style-lint/fail-rem-length: 94.1 s
note: plant time: style-lint/fail-radial-gradient: 94.3 s
note: plant time: style-lint/fail-rgb-colour: 96.0 s
note: plant time: style-lint/fail-scale-factor: 96.2 s
note: plant time: style-lint/fail-scale-length: 98.0 s
note: plant time: style-lint/fail-scale-calc: 98.0 s
note: plant time: style-lint/fail-styles-calc-line-height: 99.9 s
note: plant time: style-lint/fail-styles-font-without-line-height: 99.9 s
note: plant time: style-lint/fail-styles-normal-line-height: 101.8 s
note: plant time: style-lint/fail-styles-literal-line-height: 101.9 s
note: plant time: style-lint/fail-styles-other-token-line-height: 103.6 s
note: plant time: style-lint/fail-styles-percent-line-height: 103.7 s
note: plant time: style-lint/fail-styles-stylesheet: 105.3 s
note: plant time: style-lint/fail-translate-length: 105.5 s
note: plant time: style-lint/fail-unitless-number: 107.2 s
note: plant time: style-lint/fail-unknown-token: 107.5 s
note: plant time: style-lint/fail-var-fallback: 109.1 s
note: plant time: style-lint/pass-anchor-name: 109.2 s
note: plant time: style-lint/pass-aspect-square: 110.9 s
note: plant time: style-lint/pass-calc-tokens: 111.1 s
note: plant time: style-lint/pass-element-property: 113.0 s
note: plant time: style-lint/pass-empty-string: 113.0 s
note: plant time: style-lint/pass-fr: 114.8 s
note: plant time: style-lint/pass-grid-fit-content: 114.9 s
note: plant time: style-lint/pass-iteration-count: 116.8 s
note: plant time: style-lint/pass-known-token: 116.8 s
note: plant time: style-lint/pass-line-height: 118.6 s
note: plant time: style-lint/pass-one-line: 118.6 s
note: plant time: style-lint/pass-linear-gradient-tokens: 120.5 s
note: plant time: style-lint/pass-one-line-calc: 120.6 s
note: plant time: style-lint/pass-percentage: 122.4 s
note: plant time: style-lint/pass-scale-mirror: 122.5 s
note: plant time: style-lint/pass-styles-line-height-token: 124.6 s
note: plant time: style-lint/pass-story: 124.6 s
note: plant time: style-lint/pass-system-colour: 126.5 s
note: plant time: style-lint/pass-test-code: 126.5 s
note: plant time: style-lint/pass-token-definitions: 128.4 s
note: plant time: style-lint/pass-translate-percentage: 128.5 s
note: plant time: style-lint/pass-zero: 130.4 s
note: plant time: style-lint/pass-var-token: 130.4 s
note: plant time: test-lint/fail-assertion-outside-test: 132.1 s
note: plant time: test-lint/error-unparsable: 132.2 s
note: plant time: test-lint/fail-colocated-element-test: 133.9 s
note: plant time: style-lint/pass-var-keyword-fallback: 133.9 s
note: plant time: test-lint/fail-focused: 135.4 s
note: plant time: test-lint/fail-conditional-assertion: 135.5 s
note: plant time: test-lint/fail-no-assertion: 137.1 s
note: plant time: test-lint/fail-not-awaited: 137.3 s
note: plant time: test-lint/fail-skipped: 138.6 s
note: plant time: test-lint/fail-snapshot-only: 139.0 s
note: plant time: prefix/error-invalid-utf8: 139.8 s
note: plant time: test-lint/pass-real-assertion: 140.3 s
note: plant time: prefix/fail-custom-property-test-code: 140.5 s
note: plant time: prefix/fail-element-name: 141.0 s
note: plant time: prefix/fail-element-name-upper-case: 141.2 s
note: plant time: prefix/fail-event-name-built-output: 141.8 s
note: plant time: prefix/fail-generic-monospace: 141.9 s
note: plant time: prefix/fail-named-monospace: 142.5 s
note: plant time: prefix/pass-name-boundaries: 142.7 s
note: plant time: config-copies/error-copy-missing: 143.2 s
note: plant time: contrast/source-throws: 143.4 s
note: plant time: brand-rules/f-motion-not-zero: 144.0 s
note: plant time: brand-rules/f-delay-marker-misplaced: 144.2 s
note: plant time: brand-rules/g-forced-colours-override: 144.7 s
note: plant time: brand-rules/f-motion-not-ms: 144.9 s
note: plant time: brand-rules/f-motion-spin-missing: 145.5 s
note: plant time: brand-rules/g-system-colour-mapping: 145.8 s
note: plant time: brand-rules/source-throws: 146.3 s
note: plant time: brand-rules/generator-throws: 146.6 s
note: plant time: manifest/fail-stale-property: 147.6 s
note: plant time: manifest/fail-undescribed-css-part: 147.8 s
note: plant time: manifest/fail-undescribed-css-property: 149.1 s
note: plant time: manifest/fail-undescribed-attribute: 149.1 s
note: plant time: manifest/fail-undescribed-property: 150.5 s
note: plant time: manifest/fail-undescribed-event: 150.5 s
note: plant time: pins/fail-caret-range: 150.7 s
note: plant time: pins/fail-tilde-range: 151.0 s
note: plant time: manifest/fail-undescribed-slot: 151.8 s
note: plant time: unit-tests/pass-fixture-not-run: 152.5 s
note: plant time: test-lint/pass-fixture-excluded: 153.4 s
note: plant time: mutation/error-unresolvable-base: 153.9 s
note: plant time: config-copies/fail-one-setting-differs: 154.5 s
note: plant time: config-copies/fail-test-pathspec-narrowed: 155.2 s
note: plant time: config-copies/pass-equal-copies: 155.8 s
note: plant time: mutation/fail-disable-all: 176.6 s
note: plant time: mutation/fail-gate-source-survivor: 176.9 s
note: plant time: mutation/error-dry-run-fails: 197.3 s
note: plant time: mutation/fail-element-source-no-coverage: 201.2 s
note: plant time: mutation/fail-record-without-reason: 221.7 s
note: plant time: mutation/fail-element-source-survivor: 222.5 s
note: plant time: mutation/fail-unchecked-line: 245.3 s
note: plant time: mutation/pass-compile-error: 245.6 s
note: plant time: mutation/pass-fully-checked: 268.8 s
note: plant time: mutation/pass-element-source: 270.2 s
note: plant time: mutation/pass-test-only-change: 270.9 s
note: plant time: mutation/pass-reasoned-record: 289.7 s
note: plant time: mutation/error-zero-mutant-failing-test: 291.6 s
note: plant time: mutation/pass-zero-mutant: 310.1 s
note: plant time: mutation/fail-no-test-runs: 314.7 s
note: plant time: mutation/fail-mixed-survivors: 344.5 s
note: plant time: storybook-build/error-config-unreadable: 1.1 s
note: plant time: storybook-build/error-missing-dependencies: 0.3 s
note: plant time: storybook-build/error-no-build-script: 0.3 s
note: plant time: storybook-build/fail-empty-index: 2.0 s
note: plant time: storybook-build/fail-not-csf: 1.4 s
note: plant time: storybook-build/fail-syntax-error: 1.5 s
note: plant time: storybook-build/fail-unresolved-import: 1.8 s
note: plant time: storybook-build/pass-repository: 2.2 s
note: plant time: storybook-build/pass-type-error-only: 2.6 s
note: plant time: visual/error-host: 2.8 s
note: plant time: visual/error-no-engine: 0.5 s
note: plant time: axe/error-bad-exceptions: 0.8 s
note: plant time: axe/error-build-fails: 1.9 s
note: plant time: axe/error-exception-plan-not-a-plan: 0.9 s
note: plant time: axe/fail-closed-shadow-root: 265.5 s
note: plant time: axe/fail-empty: 261.4 s
note: plant time: axe/fail-excepted-second-node: 257.0 s
note: plant time: axe/fail-hover-near-fold: 261.1 s
note: plant time: axe/fail-hover-reveals-unlabelled: 259.5 s
note: plant time: axe/fail-incomplete: 261.7 s
note: plant time: axe/fail-no-box: 255.0 s
note: plant time: axe/fail-open-shadow-unlabelled: 257.4 s
note: plant time: axe/fail-outside-root: 254.1 s
note: plant time: axe/fail-pointer-target-below-fold: 251.3 s
note: plant time: axe/fail-render-throws: 258.5 s
[ELIFECYCLE] Command failed with signal SIGTERM.
```

No finding line was printed before the stop (every line above is a `note:`); the gate's verdict on these plants is CI's. The selection is the full set because op
016's mapping does not class `packages/elements/package.json` (research.md § Repository-wide notes).

## Element plants (tasks.md T013 step 1; contracts/checks.md § Plants)

Each disclosure plant run once on 2026-11-20 against the final green source (after the mutation-driven restructure):
the source (`src/ocelle-disclosure.ts`, or `src/ocelle-icon.ts` for the mirror rule) edited as named, the guarding
bodies run in process (`packages/elements/test/disclosure.test.ts`, `-t <guard>`), then the file restored and the
restore checked. Scratch runner in the session scratchpad; no plant is committed. An earlier run on the first green
source gave the same results.

| Plant | Guard run | Result |
|---|---|---|
| chevron box rule removed | FR-005 chevron box | bites: fails (the chevron's `margin-inline-end` is 0 px, not 8 px; its size comes from `ocelle-icon`'s own host rule, so the 20 × 20 half holds) |
| `list-style: none` removed | FR-003 marker | bites: fails (`list-style-type` not `none`) |
| hover background removed | US1-21, light and dark | bites: both fail |
| `:host { display: block }` removed | FR-003 host block box | bites: fails (`display: inline`) |
| `delegatesFocus: true` restored on the root | US1-22 | bites: fails |
| `aria-hidden="true"` removed from the icon wrapper | US1-17 (bare svg) | bites: fails (an `image` node under the summary; the name stays the text, from `.label`) |
| forced-colours `summary.control` pair removed | US1-15 | bites: fails |
| `ocelle-icon`'s RTL mirror rule removed | US1-11 | bites: fails |
| `transition: background-color 200ms` on the summary | US1-14, both motion settings | bites: both fail (a running `background-color` transition and the summary's 0.2 s duration) |
| a 200 ms `transition` on the chevron | US1-14, both motion settings | bites: both fail (the chevron's transition duration; no chevron property changes on a toggle, so no transition runs) |
