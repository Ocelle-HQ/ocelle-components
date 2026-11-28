---
phase: 1
round: 1
verdict: approved
base: e340eefa9128bc1e5ede06cc06fb46a252d7a702
head: 143a4477f0f91fe8cdf1a6fec198c5d087dd60c1
tdd_check: pass
---

# Phase 1 review, round 1

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | note | `specs/035-copy-identifier-groups/reviews/pilot-034.md:80` | The standard recovery proves that the corrected scope completed under the 40-minute initial-run cap. Its 31m 41s is the entire gate step. The standard result supplies no isolated initial-run time, and the initial failure's cause remains unconfirmed. | Use the 31m 41s as a gate-step measurement in the pilot retrospective. |

## Test quality

The fresh exact-head phase replay passed at `143a4477f0f91fe8cdf1a6fec198c5d087dd60c1`. The original tests-only red records 42 Chromium source assertions, eight strict-CSP behavior assertions after build and load, and one exact generated-declaration assertion. The separately recorded mutation configuration assertion reproduces the 30-minute mismatch before the 40-minute change. Final tests reproduced all 52 recorded failures on their respective bases and passed on the review head. The runnable scope includes source Chromium, built strict-CSP, generated manifest and the mutation configuration check. [Replay](tdd-check.json) · [Test scope](test-scope.txt)

The retained browser cases check the plain field as well as trusted Copy and two-way Reveal. They read the ordered Chromium accessibility subtree, verify keyboard focus and the next external Tab stop when the disclosure disappears, and distinguish native selected-text copy from the exact raw named Copy request. The gap assertion refactor preserves its original predicate, and the later recovery adds narrow-width glyph geometry and checks cleanup on the same retained focus target. The package fixture verifies literal inert identifier text and zero component clipboard calls under strict CSP. [Source scenarios](../../../../packages/elements/test/scenarios/copy-field.ts) · [Built CSP tests](../../../../packages/elements/test/browser/copy-field.test.ts)

The source uses isolated left-to-right identifier groups with a shadow-local disclosure association. It keeps one accessible full value, a native button, token-sized controls and host-owned clipboard and live-region effects. The new options and generated declarations carry the MINOR addition. All eight Phase 1 tasks have their implementation and evidence. [Tasks](../../tasks.md)

## Checks run

- Verified PR #104 run `45834538582`, attempt 1, on exact tooling and product head `77cb025da872be76e49190b51a9ed24a9e61be1b`. GitHub confirms tested merge `bd09017155b06f3cdac3d4166ae71877f69c051d` with base `b655b83b1d17694039f7b5c968e483384145a90a` and that head as parents. All 19 required jobs passed. The attempt lists 112 exact, uniquely named completed jobs with one intentionally skipped optional comparison. The review head adds only signed Plants, task and pilot evidence over the hosted head. [Exact required CI](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45834538582)
- Independently regenerated the phase-base standard mutation plan and verified all six hosted ranges and the required aggregate passed. The plan selects 159 changed lines. The six shard counts total 101 mutants with zero survivors or uncovered mutants, 23 compile errors and one timeout. Two selected entries report zero mutants. The six jobs used 12,137 runner seconds, with a 40m 15s maximum. The `379-387` shard includes the original `379-384` probe and passed with 24 mutants and zero survivors. The tracked configuration preserves `related: false`, existing Vitest projects, per-test coverage, concurrency, thresholds, and the hosted 75-minute ceiling. [Mutation aggregate](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45834538582/job/139983708907) · [Scoped standard result](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45834538582/job/139960133789)
- Independently matched the phase-base Plants listing to its signed receipt. It selected all 326 cases because `stryker.elements.config.json` is unmapped. The exact hosted plan, all 77 shards and the required Plants aggregate passed and judged all 326. The local Docker pull encountered a disk limit, and the local evidence covers the selector. [Plants receipt](plants.md) · [Hosted Plants](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45834538582/job/139971400646)
- Verified manifest preflight evidence before and after regeneration. The eight stale overlays reported 32 unexpected findings before the fixture update. Afterward the seven intended findings remained, the reordered overlay was clean, and zero findings or snapshots were missing. I independently compared the canonical and eight fixture manifests to the phase base and verified the only changes were the two documented Boolean members and their attributes. [Manifest preflight](../pilot-034.md#component-preflight)
- Verified six passing Unit test shards and the exact required aggregate over 12,515 tests in 372 files. Visual matched 796 captures under Docker and Podman, and Accessibility passed the same 796 story-themes. The exact required CSP, package manifest, Storybook build, typecheck, lint and safeguards also passed. The live #89 Visual evidence-only observation remains scheduled after both product phases. [Unit tests](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45834538582/job/139975935484) · [Visual](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45834538582/job/139959812466) · [Required CI](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45834538582)

## Earlier findings

First Phase 1 review round. The first hosted candidate's README and mutation failures are recorded with the exact successful recovery. [Pilot evidence](../pilot-034.md#corrected-phase-1-control)
