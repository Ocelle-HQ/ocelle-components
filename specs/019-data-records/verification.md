# Data records landing verification

**LAND.** Mission 019 completes the remaining data-table, event-timeline and evidence-chain work for #13 under the approved triage record. The setup phase has an approved non-behavioral exemption. All four implementation phases have approved reviews and recorded passing replays before landing. [Triage](../../triage/019-data-display-follow-on.md) · [Run summary](../../knowledge/speckit-flows/runs/019-data-records.md)

## Integration candidate

The signed preview `05c090a5019e69cb398d6b04c3f3229d9efd58dc` merges the original PR head `d5bba9c2` with `main` at `ff85ae56`. The 34 merge conflicts included the shared test drivers, generated manifests and exact fixture inventories. The merge retains all 652 baseline images from `main` and all 96 mission-only images. They match the 374-story build inventory. Commit `57d1decf` normalized local sandbox prefixes in six historical evidence files. The redaction verifier confirmed prefix-only changes, and the product, tests and workflow configuration match the preview.

## Local verification

- Typecheck, lint, package build and strict CSP passed. The manifest gate checked all 46 elements. Prefix, configuration copies and sign-off passed, with sign-off checking 85 commits on the integration preview.
- Selected checks passed 1,055 browser and package regression tests, 1,279 manifest, documentation and gate-fixture integration tests, and 204 Storybook integration tests. Eight manifest plants and the empty Storybook index plant matched their expected exits and findings.
- Scoped axe ran 142 story and theme combinations. All 132 approved exceptions matched the recorded selectors and reasons, with no serious or critical findings.
- Docker ran out of space in its local storage before the pinned screenshot image launched. The affected browser setup cases passed on a serial retry after the image was removed. The pinned screenshot comparison still needs hosted CI.

## Hosted checks and handoff

GitHub had no workflow run on the pre-integration draft head. The integrated candidate needs all 18 current required checks, including the full Unit tests, strict Mutation testing, all Plants, Visual regression, Accessibility, Content security, Storybook build and manifest. The local mutation plan produced 43 shards and made no mutation verdict. The operator handles the PR readiness decision and merge.

## Landing corrections

The independent review reproduced two product defects under strict CSP. The approved fixes preserve explicit overflow naming and hide caption fallback text when its source is hidden. Timeline events now reconcile their current slotted time on reconnection, including restoration of the time attribute fallback. [Initial landing review](reviews/landing/round-1.md) · [Follow-up](reviews/landing/round-2.md)

Each correction recorded four named assertion failures at its signed test-only revision. The current focused runner verified each new fix against its exact pre-fix base and green implementation. These scoped receipts complement the recorded historical phase verdicts. The independent review also passed the 222 tests in the four affected Chromium files on the combined candidate. Typecheck, lint, test lint, package build, strict CSP, manifest and sign-off passed locally on the corrected source. [Caption evidence](reviews/phase-1/round-4.md) · [Timeline evidence](reviews/phase-2/round-4.md)

Local Plants selection included all 318 cases because the integrated diff changes shared gate code. Hosted CI supplies the full Plants and mutation verdicts and the pinned visual comparison. The original mission commits and archived red references remain reachable through the signed integration merge.

### Initial hosted failure

The first hosted run failed two mixed mutation shards before Stryker could judge mutants. The exact local dry run identified a stale `plantShards` test count. The new checker-failure fixture adds one non-visual Plant, for 48 visual, 25 axe and 245 other plants. Commit `0c24ddb7` corrects the exact count and preserves the existing shard size, membership and ordering assertions. All 88 plant-runner tests and the full Stryker initial suite of 4,444 tests passed after the correction. The new hosted revision still needs the complete mutation verdict. [First hosted run](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45255353156) · [First failed shard](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45255353156/job/137975943494) · [Second failed shard](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45255353156/job/137975943613)
