---
phase: 1
round: 1
verdict: approved
base: a05573ca198e6c88555ea027f02618dff0a15645
head: 3db688df967baca26cea6fd164964ae3944a97f3
tdd_check: pass
---

# Phase 1 review, round 1

Reviewed the implemented textarea against the spec, plan, public contract and constitution. All six tasks are complete. The review head adds the task tick and review records to pilot candidate `b35ebf49a6a34266113229f0e68c013dcc5f46f8`. The production code, tests, stories, baselines and `test-scope.txt` are identical to the candidate.

## Findings

No blocking findings. The full CI results in this review apply to the pilot stack. The landing candidate still requires its own checks after integration with `main`.

## Test quality

- Scaffold `99d950d5` registers an inert element and provides the package entry and manifest without adding tests or form behavior. Red commit `1b7a75a4` adds test files and test scope. The fresh replay found 18 assertion failures for the absent behavior and two for native focus in fix red `691011f4`. The final tests found the same 18 failures against the original base and scaffold and the two focus failures against the fix parent. The pilot head passed. A second replay reused all six checks in 3.177 seconds. [Replay report](tdd-check.json)
- The browser tests exercise actual submission before render, native LF and wire CRLF, validity, dirty defaults, reset and restoration, read-only and disabled participation, multiline editing and paste in a dialog, input and commit events, and host error recovery. The computed accessibility tests check the editing control's name, description and error. The live-region and forced-colour checks assert the polite announcement, retained focus and distinguishable states. The fix and subsequent coverage changes keep the red assertions or make them more specific.
- The two `ci-only` files update exact Storybook theme and baseline counts for the four new states. Their existing expectations about findings, exceptions, byte equality and test outcomes remain in place. The focused replay still runs the textarea behavior, strict-CSP fixture, package entry and manifest checks.

## Checks run

- The local replay ran on the exact hosted merge `b35ebf49`, with Op head `735a4567` and PR head `3b7bad52` as its parents. The full Unit tests aggregate passed 10,287 tests in 298 files across six shards. The plan and both result artifacts name `b35ebf49`. Shard 0 passed all 11 results for `gates-integration` / `gates/test/integration/visual.test.ts`. Shard 1 passed all four for `gates-integration` / `gates/test/integration/axe.test.ts`. [Unit tests](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45063522257/job/137344131156) · [Plan](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45063522257/artifacts/14770552236) · [Shard 0](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45063522257/artifacts/14771313304) · [Shard 1](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45063522257/artifacts/14770423253)
- The Visual regression and Accessibility jobs both passed on that candidate. The Storybook build, content security and all other required checks passed in the same run. The old full-suite comparison was skipped because this PR is the pilot. [Visual regression](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45063522257/job/137334491728) · [Accessibility](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45063522257/job/137334491680) · [Pilot CI](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45063522257)
- I reran the affected-plants selector on phase base `a05573ca` and matched its `note: affected:` line to the record. It selected all 317 plants. The hosted full verdict judged those 317 and exited 0 on the same candidate. [Phase plant record](plants.md) · [Hosted Plants](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45063522257/job/137339233277)
- Changed-source mutation passed in all six relevant hosted shards with no survivors or timeouts. The hosted mutation base and phase base have identical `packages/elements/src` trees. The mixed shard covers textarea lines 1–30 and reports zero mutants on the type-only `form-control.ts` change and the entry export. Its equivalent records concern process boundaries in the inherited verification tooling. None apply to the textarea. [Mutation testing](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45063522257/job/137350675177) · [Mixed shard](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45063522257/job/137334639686)
- Independent local typecheck, code lint, style lint, test lint and generated manifest checks passed on the pilot code. The manifest check covered 33 elements.

## Earlier findings

This is the first recorded phase round. The prior native-focus finding was reproduced in the original fix red and covered by the fresh replay of both Chromium projects.
