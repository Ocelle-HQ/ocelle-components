# Plants of phase 1

- base: ac12998241af8a86f9a88c043654457e41b14b53
- command: `OCELLE_VISUAL_ENGINE=auto pnpm run gate:plants -- --affected ac12998241af8a86f9a88c043654457e41b14b53` (at e7976dd)
- exit: 1

One problem in 324 plants: `visual/fail-pointer-target-below-fold` could not pull its container image (the registry
request was cancelled by the peer, a network failure). Every other plant, the seven `sandbox-paths` plants and the
registry plants among them, was as expected. A first run with the default engine choice `both` ran no visual plant,
since this host has docker and no podman (exit 2, 46 visual plants not run), so the run above sets
`OCELLE_VISUAL_ENGINE=auto` (specs/006-storybook-workbench/quickstart.md, locally, docker only). A rerun of that one
plant from a scratch worktree did not get as far as its capture (`visual: could not run: Node.js v26.13.0`, a setup
difference of the worktree), so it is not a verdict on the plant. CI's Plants check judges every plant.

Operator decision (review round 1, R1-01 and R1-02; `triage/decisions/023-review-round-1.md`): the recorded
`exit: 1` above stands and is not rerun here. CI's Plants check covers the one plant that failed on the network
image pull, `visual/fail-pointer-target-below-fold` (exit 2; 323 of 324 plants as expected).

```text
$ node gates/bin/plants.ts -- --affected ac12998241af8a86f9a88c043654457e41b14b53
note: affected: every plant, by gates/bin/plants.ts (shared gate source)
note: plant time: signoff/error-empty-range: 0.2 s
note: plant time: signoff/fail-no-trailer: 0.3 s
note: plant time: signoff/fail-trailer-mismatch: 0.4 s
note: plant time: signoff/pass-agent-self-signoff: 0.5 s
note: plant time: signoff/pass-unsigned-merge: 0.5 s
note: plant time: contrast/empty-list: 0.8 s
note: plant time: unit-tests/error-no-test-file: 1.1 s
note: plant time: contrast/excluded-without-reason: 1.2 s
note: plant time: contrast/exempt-not-disabled-ink: 1.5 s
note: plant time: contrast/exempt-disabled-ink: 1.5 s
note: plant time: contrast/figure-mismatch: 1.8 s
note: plant time: contrast/missing-required-pair: 1.9 s
note: plant time: contrast/non-text-below-threshold: 2.2 s
note: plant time: contrast/not-opaque: 2.2 s
note: plant time: contrast/repository-values: 2.5 s
note: plant time: contrast/required-pair-excluded: 2.5 s
note: plant time: contrast/text-below-threshold: 2.9 s
note: plant time: contrast/unknown-token: 2.9 s
note: plant time: contrast/unparsable-list: 3.2 s
note: plant time: brand-rules/a-monospace: 3.3 s
note: plant time: brand-rules/b-link-equals-accent: 3.7 s
note: plant time: brand-rules/b-ochre-pair-not-excluded: 3.7 s
note: plant time: brand-rules/c-extra-radius: 4.0 s
note: plant time: brand-rules/c-wrong-value: 4.0 s
note: plant time: brand-rules/d-rule-as-boundary: 4.4 s
note: plant time: brand-rules/e-light-chrome: 4.4 s
note: plant time: brand-rules/source-invalid: 4.8 s
note: plant time: brand-rules/repository-values: 4.8 s
note: plant time: manifest/break-missing: 5.4 s
note: plant time: sandbox-paths/error-no-tracked-file: 5.5 s
note: plant time: manifest/pass-repository: 5.7 s
note: plant time: sandbox-paths/pass-binary-file: 5.8 s
note: plant time: sandbox-paths/pass-near-misses: 5.9 s
note: plant time: prefix/pass-outside-packages: 5.9 s
note: plant time: typecheck/fail-gate-source: 9.7 s
note: plant time: unit-tests/fail-gates-test: 11.2 s
note: plant time: unit-tests/pass-gates-only: 12.8 s
note: plant time: lint/fail-gate-source: 14.0 s
note: plant time: test-lint/fail-gate-test: 14.1 s
note: plant time: prefix/fail-storybook-html-multiline-monospace: 14.4 s
note: plant time: prefix/fail-storybook-monospace: 14.5 s
note: plant time: pins/error-invalid-json: 14.6 s
note: plant time: pins/fail-allow-builds-entry: 14.6 s
note: plant time: pins/fail-allow-builds-other-version: 14.8 s
note: plant time: pins/fail-allow-builds-missing: 14.8 s
note: plant time: pins/fail-allow-builds-unpinned-fsevents: 14.9 s
note: plant time: pins/fail-allow-builds-unpinned-approval: 14.9 s
note: plant time: pins/fail-lockfile-outdated: 15.1 s
note: plant time: pins/fail-dangerously-allow-all-builds: 15.1 s
note: plant time: pins/fail-node-version-missing: 15.2 s
note: plant time: pins/fail-node-linker-hoisted: 15.2 s
note: plant time: pins/fail-node-version-not-exact: 15.4 s
note: plant time: pins/fail-package-manager-missing: 15.4 s
note: plant time: pins/fail-package-manager-not-exact: 15.5 s
note: plant time: pins/fail-release-age-exclude: 15.5 s
note: plant time: pins/fail-release-age-missing: 15.7 s
note: plant time: pins/fail-public-hoist-pattern: 15.7 s
note: plant time: pins/fail-release-age-short: 15.8 s
note: plant time: pins/fail-release-age-strict-missing: 15.9 s
note: plant time: pins/fail-release-age-strict-false: 16.0 s
note: plant time: pins/fail-shamefully-hoist: 16.0 s
note: plant time: pins/fail-workspace-star: 16.1 s
note: plant time: pins/fail-workspace-caret: 16.2 s
note: plant time: pins/fail-workspace-tilde: 16.3 s
note: plant time: pins/fail-workspace-version-differs: 16.3 s
note: plant time: pins/pass-approved-build: 16.4 s
note: plant time: pins/pass-matching: 16.5 s
note: plant time: manifest/break-not-json: 17.1 s
note: plant time: manifest/fail-lost-attribute: 17.3 s
note: plant time: manifest/pass-reordered: 18.2 s
note: plant time: style-lint/fail-styles-outside-src: 18.9 s
note: plant time: typecheck/error-missing-reference: 22.0 s
note: plant time: typecheck/fail-implicit-any: 22.9 s
note: plant time: typecheck/fail-test-code: 26.0 s
note: plant time: typecheck/pass-fixture-excluded: 27.0 s
note: plant time: typecheck/pass-strict-file: 29.9 s
note: plant time: lint/fail-floating-promise: 34.9 s
note: plant time: lint/error-unparsable: 38.2 s
note: plant time: lint/pass-fixture-excluded: 43.4 s
note: plant time: unit-tests/error-throws-while-loading: 45.3 s
note: plant time: lint/pass-voided-promise: 46.4 s
note: plant time: unit-tests/fail-styles-test: 47.8 s
note: plant time: unit-tests/fail-elements-chromium: 48.0 s
note: plant time: unit-tests/fail-tokens-test: 49.2 s
note: plant time: unit-tests/fail-tokens-colocated: 49.4 s
note: plant time: unit-tests/pass-styles-only: 50.8 s
note: plant time: unit-tests/pass-elements-only: 51.6 s
note: plant time: unit-tests/pass-tokens-only: 52.3 s
note: plant time: test-lint/error-unparsable: 52.7 s
note: plant time: test-lint/fail-assertion-outside-test: 53.8 s
note: plant time: test-lint/fail-colocated-element-test: 54.2 s
note: plant time: test-lint/fail-conditional-assertion: 55.4 s
note: plant time: test-lint/fail-focused: 55.6 s
note: plant time: test-lint/fail-no-assertion: 57.0 s
note: plant time: test-lint/fail-not-awaited: 57.0 s
note: plant time: test-lint/fail-skipped: 58.5 s
note: plant time: test-lint/fail-snapshot-only: 58.5 s
note: plant time: csp/error-unparsable: 59.4 s
note: plant time: test-lint/pass-real-assertion: 59.9 s
note: plant time: csp/fail-eval: 60.5 s
note: plant time: csp/fail-event-handler: 60.8 s
note: plant time: csp/fail-function-call: 61.4 s
note: plant time: csp/fail-indirect-eval: 61.7 s
note: plant time: csp/fail-inline-script: 62.4 s
note: plant time: csp/fail-new-function: 62.6 s
note: plant time: csp/fail-set-interval-string: 63.2 s
note: plant time: csp/fail-set-timeout-string: 63.5 s
note: plant time: csp/fail-style-attribute: 64.2 s
note: plant time: csp/fail-style-attribute-after-newline: 64.4 s
note: plant time: csp/fail-svg-slash-onload: 65.1 s
note: plant time: csp/fail-style-element: 65.2 s
note: plant time: csp/pass-external-script: 65.9 s
note: plant time: csp/pass-function-timer: 66.1 s
note: plant time: csp/pass-inline-script-in-source: 66.6 s
note: plant time: csp/pass-look-alike-names: 67.0 s
note: plant time: csp/pass-storybook-out-of-scope: 67.5 s
note: plant time: prefix/error-invalid-utf8: 67.5 s
note: plant time: prefix/fail-custom-property-test-code: 68.0 s
note: plant time: prefix/fail-element-name: 68.1 s
note: plant time: prefix/fail-element-name-upper-case: 68.5 s
note: plant time: prefix/fail-event-name-built-output: 68.6 s
note: plant time: prefix/fail-generic-monospace: 69.1 s
note: plant time: prefix/fail-named-monospace: 69.1 s
note: plant time: config-copies/error-copy-missing: 69.6 s
note: plant time: prefix/pass-name-boundaries: 69.6 s
note: plant time: contrast/source-throws: 70.1 s
note: plant time: brand-rules/f-motion-not-ms: 70.2 s
note: plant time: brand-rules/f-motion-not-zero: 70.7 s
note: plant time: brand-rules/g-forced-colours-override: 70.8 s
note: plant time: brand-rules/f-delay-marker-misplaced: 71.3 s
note: plant time: brand-rules/f-motion-spin-missing: 71.4 s
note: plant time: brand-rules/g-system-colour-mapping: 71.8 s
note: plant time: brand-rules/generator-throws: 72.0 s
note: plant time: brand-rules/source-throws: 72.4 s
note: plant time: manifest/fail-stale-property: 73.4 s
note: plant time: manifest/fail-undescribed-attribute: 73.6 s
note: plant time: manifest/fail-undescribed-css-part: 74.8 s
note: plant time: manifest/fail-undescribed-css-property: 75.0 s
note: plant time: manifest/fail-undescribed-event: 76.1 s
note: plant time: manifest/fail-undescribed-slot: 76.2 s
note: plant time: manifest/fail-undescribed-property: 77.2 s
note: plant time: style-lint/element-property-clash: 77.8 s
note: plant time: style-lint/error-unparsable: 78.9 s
note: plant time: style-lint/fail-aspect-calc: 79.5 s
note: plant time: style-lint/fail-aspect-ratio-other: 80.6 s
note: plant time: style-lint/fail-calc-operand: 81.3 s
note: plant time: style-lint/fail-element-property-misspelt: 82.2 s
note: plant time: style-lint/fail-element-stylesheet: 82.8 s
note: plant time: style-lint/fail-element-template: 84.0 s
note: plant time: style-lint/fail-fit-content-length: 84.4 s
note: plant time: style-lint/fail-font-family: 85.8 s
note: plant time: style-lint/fail-font-weight: 86.2 s
note: plant time: style-lint/fail-gradient-angle: 87.7 s
note: plant time: style-lint/fail-gradient-hex: 87.9 s
note: plant time: style-lint/fail-gradient-length: 89.4 s
note: plant time: style-lint/fail-hex-colour: 89.5 s
note: plant time: style-lint/fail-iteration-count-fraction: 91.0 s
note: plant time: style-lint/fail-lh-calc-factor: 91.1 s
note: plant time: style-lint/fail-lh-calc-twice: 92.6 s
note: plant time: style-lint/fail-lh-multiple: 92.7 s
note: plant time: style-lint/fail-lh-paren-factor: 94.3 s
note: plant time: style-lint/fail-lh-multiple-calc: 94.3 s
note: plant time: style-lint/fail-minmax-auto: 95.9 s
note: plant time: style-lint/fail-ms-time: 96.0 s
note: plant time: style-lint/fail-named-colour: 97.7 s
note: plant time: style-lint/fail-radial-gradient: 97.7 s
note: plant time: style-lint/fail-rem-length: 99.4 s
note: plant time: style-lint/fail-rgb-colour: 99.4 s
note: plant time: style-lint/fail-scale-factor: 101.2 s
note: plant time: style-lint/fail-scale-calc: 101.2 s
note: plant time: style-lint/fail-scale-length: 103.1 s
note: plant time: style-lint/fail-styles-calc-line-height: 103.1 s
note: plant time: style-lint/fail-styles-literal-line-height: 104.8 s
note: plant time: style-lint/fail-styles-font-without-line-height: 104.8 s
note: plant time: style-lint/fail-styles-normal-line-height: 106.5 s
note: plant time: style-lint/fail-styles-other-token-line-height: 106.5 s
note: plant time: style-lint/fail-styles-stylesheet: 108.2 s
note: plant time: style-lint/fail-styles-percent-line-height: 108.3 s
note: plant time: style-lint/fail-translate-length: 109.9 s
note: plant time: style-lint/fail-unitless-number: 110.0 s
note: plant time: style-lint/fail-unknown-token: 111.6 s
note: plant time: style-lint/fail-var-fallback: 111.7 s
note: plant time: style-lint/pass-anchor-name: 113.2 s
note: plant time: style-lint/pass-aspect-square: 113.3 s
note: plant time: style-lint/pass-calc-tokens: 114.9 s
note: plant time: style-lint/pass-element-property: 115.1 s
note: plant time: style-lint/pass-empty-string: 116.7 s
note: plant time: style-lint/pass-fr: 116.9 s
note: plant time: style-lint/pass-grid-fit-content: 118.5 s
note: plant time: style-lint/pass-iteration-count: 118.7 s
note: plant time: style-lint/pass-known-token: 120.3 s
note: plant time: style-lint/pass-line-height: 120.4 s
note: plant time: style-lint/pass-linear-gradient-tokens: 122.0 s
note: plant time: style-lint/pass-one-line: 122.1 s
note: plant time: style-lint/pass-one-line-calc: 123.7 s
note: plant time: style-lint/pass-percentage: 123.8 s
note: plant time: style-lint/pass-story: 125.6 s
note: plant time: style-lint/pass-scale-mirror: 125.6 s
note: plant time: style-lint/pass-styles-line-height-token: 127.3 s
note: plant time: style-lint/pass-system-colour: 127.4 s
note: plant time: style-lint/pass-token-definitions: 129.0 s
note: plant time: style-lint/pass-test-code: 129.0 s
note: plant time: style-lint/pass-var-keyword-fallback: 130.6 s
note: plant time: style-lint/pass-translate-percentage: 130.7 s
note: plant time: style-lint/pass-zero: 132.3 s
note: plant time: style-lint/pass-var-token: 132.3 s
note: plant time: pins/fail-caret-range: 132.5 s
note: plant time: pins/fail-tilde-range: 132.5 s
note: plant time: sandbox-paths/fail-store-and-repo-root: 132.6 s
note: plant time: sandbox-paths/fail-allowed-name-elsewhere: 132.6 s
note: plant time: sandbox-paths/fail-file-url-in-json: 132.7 s
note: plant time: unit-tests/pass-fixture-not-run: 134.0 s
note: plant time: test-lint/pass-fixture-excluded: 134.1 s
note: plant time: mutation/error-unresolvable-base: 135.0 s
note: plant time: config-copies/fail-test-pathspec-narrowed: 135.6 s
note: plant time: config-copies/pass-equal-copies: 136.2 s
note: plant time: config-copies/fail-one-setting-differs: 136.8 s
note: plant time: mutation/fail-gate-source-survivor: 155.5 s
note: plant time: mutation/error-dry-run-fails: 155.8 s
note: plant time: mutation/error-zero-mutant-failing-test: 174.7 s
note: plant time: mutation/fail-disable-all: 174.9 s
note: plant time: mutation/fail-element-source-no-coverage: 198.8 s
note: plant time: mutation/fail-element-source-survivor: 199.4 s
note: plant time: mutation/fail-unchecked-line: 221.4 s
note: plant time: mutation/fail-no-test-runs: 221.4 s
note: plant time: mutation/fail-record-without-reason: 240.6 s
note: plant time: mutation/pass-compile-error: 242.9 s
note: plant time: mutation/pass-element-source: 264.3 s
note: plant time: mutation/pass-fully-checked: 265.1 s
note: plant time: mutation/pass-test-only-change: 265.9 s
note: plant time: mutation/pass-reasoned-record: 282.5 s
note: plant time: sandbox-paths/pass-allowed-files: 282.6 s
note: plant time: mutation/pass-zero-mutant: 283.9 s
note: plant time: mutation/fail-mixed-survivors: 313.5 s
note: plant time: storybook-build/error-config-unreadable: 1.0 s
note: plant time: storybook-build/error-missing-dependencies: 0.3 s
note: plant time: storybook-build/error-no-build-script: 0.3 s
note: plant time: storybook-build/fail-empty-index: 1.8 s
note: plant time: storybook-build/fail-not-csf: 1.3 s
note: plant time: storybook-build/fail-syntax-error: 1.4 s
note: plant time: storybook-build/fail-unresolved-import: 1.7 s
note: plant time: storybook-build/pass-repository: 2.1 s
note: plant time: storybook-build/pass-type-error-only: 2.2 s
note: plant time: visual/error-build-fails: 2.5 s
note: plant time: visual/error-host: 2.6 s
note: plant time: visual/error-index-pin: 1.1 s
note: plant time: visual/error-no-engine: 0.5 s
note: plant time: visual/error-tag-pin: 0.6 s
note: plant time: visual/fail-beacon: 482.5 s
note: plant time: visual/fail-below-fold: 502.1 s
note: plant time: visual/fail-cache-api: 482.8 s
note: plant time: visual/fail-clipboard-write: 486.2 s
note: plant time: visual/fail-closed-shadow-root: 490.1 s
note: plant time: visual/fail-cookie: 499.9 s
note: plant time: visual/fail-exec-copy: 490.7 s
note: plant time: visual/fail-font-file-missing: 509.5 s
note: plant time: visual/fail-font-not-loaded: 519.3 s
note: plant time: visual/fail-hover-style-changed: 504.0 s
note: plant time: visual/fail-indexeddb: 494.1 s
note: plant time: visual/fail-input-system-font: 507.3 s
note: plant time: visual/fail-local-storage: 537.4 s
note: plant time: visual/fail-missing-baseline: 506.5 s
note: plant time: visual/fail-network: 510.0 s
note: plant time: visual/fail-one-pixel: 505.1 s
note: plant time: visual/fail-other-font: 539.8 s
note: plant time: visual/fail-overflow-changed: 521.4 s
note: plant time: visual/fail-pointer-target-below-fold: 0.9 s
note: plant time: visual/fail-pointer-target-missing: 496.6 s
note: plant time: visual/fail-popover-changed: 506.2 s
note: plant time: visual/fail-press-style-changed: 518.5 s
note: plant time: visual/fail-random: 516.7 s
note: plant time: visual/fail-render-throws: 519.2 s
note: plant time: visual/fail-same-origin-fetch: 518.9 s
note: plant time: visual/fail-same-pixels-other-bytes: 484.0 s
note: plant time: visual/fail-session-storage: 487.6 s
note: plant time: visual/fail-storage-left-by-worker: 507.3 s
note: plant time: visual/fail-storage-property: 495.3 s
note: plant time: visual/fail-stray-baseline: 479.0 s
note: plant time: visual/fail-throws-on-load: 489.9 s
note: plant time: visual/fail-token-changed: 660.4 s
note: plant time: visual/fail-websocket: 512.8 s
note: plant time: visual/fail-xhr: 520.2 s
note: plant time: visual/pass-animation-and-caret: 523.4 s
note: plant time: visual/pass-below-fold: 555.2 s
note: plant time: visual/pass-focus-below-fold: 536.3 s
note: plant time: visual/pass-hover-and-press: 549.2 s
note: plant time: visual/pass-input-font: 544.8 s
note: plant time: visual/pass-overflow-and-popover: 519.6 s
note: plant time: visual/pass-repository: 515.8 s
note: plant time: visual/pass-second-render: 511.5 s
note: plant time: visual/pass-unused-face: 539.8 s
note: plant time: axe/error-bad-exceptions: 0.7 s
note: plant time: axe/error-build-fails: 2.2 s
note: plant time: axe/error-exception-plan-not-a-plan: 0.8 s
note: plant time: axe/fail-closed-shadow-root: 294.2 s
note: plant time: axe/fail-empty: 283.3 s
note: plant time: axe/fail-excepted-second-node: 277.8 s
note: plant time: axe/fail-hover-near-fold: 268.2 s
note: plant time: axe/fail-hover-reveals-unlabelled: 268.9 s
note: plant time: axe/fail-incomplete: 268.9 s
note: plant time: axe/fail-no-box: 271.4 s
note: plant time: axe/fail-open-shadow-unlabelled: 262.9 s
note: plant time: axe/fail-outside-root: 267.8 s
note: plant time: axe/fail-pointer-target-below-fold: 272.1 s
note: plant time: axe/fail-render-throws: 278.3 s
note: plant time: axe/fail-stale-exception: 285.4 s
note: plant time: axe/fail-throws-on-load: 291.6 s
note: plant time: axe/fail-two-low-contrast: 297.4 s
note: plant time: axe/fail-unlabelled-button: 314.4 s
note: plant time: axe/fail-unrecorded-exception: 301.0 s
note: plant time: axe/pass-excepted: 311.2 s
note: plant time: axe/pass-excepted-incomplete: 308.5 s
note: plant time: axe/pass-excepted-shadow: 310.7 s
note: plant time: axe/pass-minor-only: 314.0 s
note: plant time: axe/pass-repository: 296.9 s
note: plant time: axe/pass-second-render: 311.6 s
note: plant time: plants/fail-affected-in-plant-check: 0.0 s
note: plant time: plants/fail-gate-without-entry: 0.0 s
note: plant time: plants/fail-gate-without-job: 0.0 s
note: plant time: plants/fail-shard-in-plant-check: 0.0 s
note: plant time: plants/fail-skip-container-in-ci: 0.0 s
note: plant time: plants/fail-skip-container-in-shard: 0.0 s
note: plant time: plants/pass-matching: 0.0 s
note: plant time: plants/pass-split-plant-jobs: 0.0 s
gates/plants/visual/fail-pointer-target-below-fold: plants: not-caught: expected exit 1 with the plant's 2 findings, got exit 2 (visual: could not run: the image cannot be obtained: ERROR: failed to do request: Head "https://mcr.microsoft.com/v2/playwright/manifests/sha256:ee15712262f017b8157421b212b12099146645f44b1bc5c0514cbbe6a229b1d0": stream error: stream ID 1; CANCEL; received from peer)
plants: 1 problem in 324 plants (affected since ac12998241af8a86f9a88c043654457e41b14b53; not the Plants check)
[ELIFECYCLE] Command failed with exit code 1.
```

## Operator round 4 (fix-4): the `sandbox-paths` plants

- command: `pnpm run gate:plants -- --affected 97868fd774f9280e0516bb021e302c510b9b58fd` (at 31607200)
- exit: 0

Operator constraint for this round (CI first): run the plants locally only for `sandbox-paths`; CI's Plants check
judges the rest. `--affected` against the round's base selects every plant here, because `gates/lib/sandbox-paths.ts`
is shared gate source. So the selection base is a scratch commit object, `97868fd`, made with `git commit-tree` from
HEAD's tree without `gates/plants/sandbox-paths/` (parent `31607200`; on no branch, never pushed). Its diff to the work
tree is exactly the eight `sandbox-paths` plants, and the gate code they run is HEAD's. All eight were as expected,
`fail-gitattributes-diff` (new in this round) among them. The record above, of the phase's full run at `e7976dd`,
stands under the operator decision of round 1.

```text
$ node gates/bin/plants.ts -- --affected 97868fd774f9280e0516bb021e302c510b9b58fd
note: affected: sandbox-paths/error-no-tracked-file, by gates/plants/sandbox-paths/error-no-tracked-file/plant.json
note: affected: sandbox-paths/fail-allowed-name-elsewhere, by gates/plants/sandbox-paths/fail-allowed-name-elsewhere/plant.json
note: affected: sandbox-paths/fail-file-url-in-json, by gates/plants/sandbox-paths/fail-file-url-in-json/plant.json
note: affected: sandbox-paths/fail-gitattributes-diff, by gates/plants/sandbox-paths/fail-gitattributes-diff/plant.json
note: affected: sandbox-paths/fail-store-and-repo-root, by gates/plants/sandbox-paths/fail-store-and-repo-root/plant.json
note: affected: sandbox-paths/pass-allowed-files, by gates/plants/sandbox-paths/pass-allowed-files/plant.json
note: affected: sandbox-paths/pass-binary-file, by gates/plants/sandbox-paths/pass-binary-file/plant.json
note: affected: sandbox-paths/pass-near-misses, by gates/plants/sandbox-paths/pass-near-misses/plant.json
note: plant time: sandbox-paths/error-no-tracked-file: 0.2 s
note: plant time: sandbox-paths/fail-gitattributes-diff: 0.2 s
note: plant time: sandbox-paths/pass-binary-file: 0.3 s
note: plant time: sandbox-paths/pass-near-misses: 0.3 s
note: plant time: sandbox-paths/fail-store-and-repo-root: 0.4 s
note: plant time: sandbox-paths/fail-allowed-name-elsewhere: 0.4 s
note: plant time: sandbox-paths/fail-file-url-in-json: 0.5 s
note: plant time: sandbox-paths/pass-allowed-files: 0.6 s
plants: affected since 97868fd774f9280e0516bb021e302c510b9b58fd: 8 of 326 plants judged, every plant as expected; not the Plants check
```
