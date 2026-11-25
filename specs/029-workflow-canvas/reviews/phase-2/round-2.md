---
phase: 2
round: 2
verdict: approved
base: a56fc8309667984bcc63c6f0e341c140728bbd65
head: b535664997d7ca0ce30fa99e3f131f5033195f57
tdd_check: pass
---

# Phase 2 review, round 2

T013–T018 are checked. The review head adds evidence to exact hosted candidate `73390c2f73621a20674ce099c2c1808af075c58d`. The source, tests, stories, baselines, gates and local test scope match the hosted candidate. [Tasks](../../tasks.md) · [Scope](test-scope.txt) · [Fix evidence](round-1-fixes.md)

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| | | | None | |

## Test quality

- Four signed test-only red commits recorded 17 Phase 2 baseline assertions, one stale submit assertion, two move handle overlap assertions and one stroke-only assertion. The passing replay on the exact hosted candidate reproduces each assertion on its corresponding base and passes all nine local consumers. The built test keeps its scroll cancellation and adds the pointer overlap check. The stroke controls retain the horizontal and vertical witnesses, keep a native hit-test near miss, and add top and corner coverage. The tests observe real browser geometry, focus, accessibility and composed requests. [Canonical replay](tdd-check.json) · [Move overlap red](red-fix-1.log) · [Stroke red](red-fix-11.log) · [Built regression](../../../../packages/elements/test/browser/workflow-canvas.test.ts#L337) · [In-process regressions](../../../../packages/elements/test/workflow-canvas.test.ts#L539)
- The two CI-only files preserve their existing assertions and update the exact inventory counts for the light and dark Arranging captures. Browser interaction, actual touch and both round 1 red witnesses remain in local replay. [Visual integration](../../../../gates/test/integration/visual.test.ts#L119) · [Axe integration](../../../../gates/test/integration/axe.test.ts#L80) · [Scope](test-scope.txt)
- The mutation planner independently produced 14 shards against the phase base and all 55 ordered entries against the pull request base. All 55 hosted strict shards passed on attempt 2. The local strict report for 216 mutants covers the changed eligibility method and crossed refresh and Reveal methods. Its changed method reports 35 killed, 20 compile errors, zero survivors, zero uncovered and zero timeouts. The crossed methods account for the three recorded hit-limit timeouts and one inherited equivalence. [Local mutation evidence](round-1-fixes.md) · [Exact hosted shards](check-review-round-2-hosted.log) · [Mutation aggregate](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45460349741/job/138874298498)

## Checks run

- Fresh local checks passed all 259 focused tests in six files including both native touch cases, typecheck, code lint, test lint, style lint, manifest, CSP, prefix and sign-off. The affected Plants selector produced all 21 recorded rows. A fresh production browser build served both independent Chromium probes under strict CSP. [Local checks](check-review-round-2.log) · [Chromium probes](check-review-round-2-browser.log) · [Affected Plants](plants.md)
- Run 45460349741 passed all 18 required checks on attempt 2. The tested synthetic merge `ea737e8ab70ffe833c21a583f0848bbd48689186` has base `7c081d129fa4892cea08f6f1b7c83d82ed685de0` and candidate `73390c2f73621a20674ce099c2c1808af075c58d` as parents. Its tree `14d18c4e807775ecf110d8890d55d7fd6bdf754c` matches the candidate. The targeted retry judged 46 mutants with zero survivors or timeouts and 10 compile errors. Attempt 1 had stopped in the shard's baseline with no mutation report. A subsequent local Stryker baseline diagnostic passed all 3,417 tests. [Passing attempt](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45460349741/attempts/2) · [Retried shard](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45460349741/job/138860463220) · [Hosted receipts](check-review-round-2-hosted.log)
- The retained Unit check passed 11,135 tests across 332 files and six shards. The plan and passing shard artifacts all name the tested merge. The deferred `gates-integration` files passed all 11 visual cases in shard 0 and all four axe cases in shard 1. Both native touch cases passed in shard 4. These files and shards reported zero errors. [Unit](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45460349741/job/138708123939) · [Plan](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45460349741/artifacts/14951319188) · [Visual integration](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45460349741/artifacts/14955961216) · [Axe integration](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45460349741/artifacts/14954980546) · [Native touch](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45460349741/artifacts/14953190924)
- Dedicated Visual matched all 676 captures in Docker and Podman. Accessibility ran all 676 story-theme checks with zero serious, critical or incomplete results and 58 existing exceptions. The hosted Plants judge reported all 317 outcomes as expected. [Visual](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45460349741/job/138680917737) · [Accessibility](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45460349741/job/138680918055) · [Plants](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45460349741/job/138691460520)

## Earlier findings

R1-01 is resolved. An independent Chromium reproduction put Publish's ready move handle over the earlier Review button while the Publish card cleared Review's focus inset. Review became inert and left AX and native Tab. A trusted drag at the shared pixel sent exactly one Publish position request. Named Reveal then restored the same native Review action without a request or host scroll. Trusted Enter sent the sole Review selection. A second probe with translated fractional scaling measured positive gaps along both axes and confirmed native hit testing reached only the painted stroke corner. Review left AX and focus recovered to Publish with no request. The measured near miss kept Review eligible. Both strict-CSP probes had zero diagnostics. [Eligibility measurement](../../../../packages/elements/src/ocelle-workflow-canvas.ts#L749) · [Independent Chromium evidence](check-review-round-2-browser.log)
