# Phase 2 implementation evidence

- Base `b45c9692b8989360d1091a2f5c25a9e4f4f3d578`
- Test-only red `afbcc0880829219c03aa7daeebd620af59e1de16`

`red.sh 2 phase` recorded 14 named assertion failures in 14.656 seconds wall. Both `elements (chromium)`
and `elements-browser` ran the named focus, combined-state and ARIA cases. The first attempted red was
rejected when an earlier contrast fixture's adopted sheets moved a Phase 1 pointer click onto the button's
title span. The new suite now restores the sheets and theme and follows the unchanged Phase 1 cases.
The recorded red includes only the failures of the new assertions.

Both focused suites passed all 35 tests against the implementation, including the existing Phase 1 cases.
The built suite checked the native target's width and height, wrapping, text and boundary contrast, and
focus in light, dark and forced colors. Both suites checked live context, same-ID reference refresh,
reconnection to another shadow root and zero requests outside intentional activation.

## In-process mutation probes

Each source replacement ran on its own in a disposable checkout. Removing the replacement restored
green. These probes exercised the named assertions and leave the complete mutation verdict to CI.

| Source replacement | Assertion that failed |
| --- | --- |
| Skip the update when a forwarded host attribute changes | Refreshing same-ID references preserves the built-in description and replaces host context. |
| Remove the update on connection | Reconnecting resolves the context from the host's new shadow root. |
| Replace the property-only `selectionTabIndex` options with `{}` | Markup leaves the host's tab-order property at its numeric default. |
| Disable reflection for `waiting` | Setting the property restores the waiting attribute. |
| Disable reflection for `invalid` | Clearing the property removes the invalid attribute. |

The four isolated host attribute cases each await an addition, a change and a removal before reading
the actual button's accessible name, description and current-step value. A grouped update can hide a
missing observer by scheduling a render through another attribute. Four separate scratch runs replaced
exactly one entry in `hostContext` with an empty string. In each run the matching named test failed
at the addition's assertion and the other three passed. The original source passed all four cases.

## Visual examples and fixtures

Waiting, invalid, narrow and combined focused have new light and dark baselines. Two pinned Docker
captures matched for all 16 workflow-node story-themes. The eight Phase 1 images matched the existing
baselines. Axe audited all 16 with zero serious, critical or incomplete findings.

The eight manifest overlays carry the updated node declaration and preserve their intentional findings
and key order. The unchanged empty-index overlay still leaves the built index empty. Storybook's test
inventories cover 334 stories and 668 baseline images. The visual token plant retains its prior 283
expected findings and adds the four measured light-theme differences from the new stories. Both captures
of the new dark story-themes matched their baselines under the token plant.

The serialized local inventory rerun passed all 1,181 tests in seven files. The first attempt ran
alongside temporary checkout creation and failed copying baseline files with `ENOSPC`. No assertions
or expected results changed for the retry.

The phase-base selector reported 21 of 317 plants selected and judged none with `--list`. Local fixture
probes covered the updated manifest overlays and the existing empty-index overlay. The complete hosted
run judged all 317 plants. [Plants command and output](plants.md)

## Focused replay for T009

The exact candidate passed all 39 workflow-node tests across the source Chromium and built strict-CSP suites.
On the recorded red and pre-phase base, `tdd-check.sh 2` found the same 14 named failures. The phase
extends the existing component and has no scaffold stage.

| Revision | First replay | Unchanged repeat |
| --- | --- | --- |
| First draft `1e2c367e72f6e01d803c82c044ddf9806de02236` | 30.678 s | 1.179 s |
| Exact candidate `32df0b5d292f5bf73908236cd54cde428c93356b` | 31.818 s | 0.707 s |
| Independently replayed hosted merge `1278b0e967ac1b7e35af8836313d18a99f09da24` | 42.167 s | 1.285 s |

The candidate's first run reused red evidence and ran the base and head stages. The first independent
merge replay ran all three stages. Each unchanged repeat reused all three stages with identical file
and project identities. The final red, base and green scopes contained 2, 2 and 4 files respectively.

| Project | File | Stages |
| --- | --- | --- |
| elements (chromium) | `packages/elements/test/workflow-node.test.ts` | Red, base, head |
| elements-browser | `packages/elements/test/browser/workflow-node.test.ts` | Red, base, head |
| gates-integration | `gates/test/integration/plant-repo.test.ts` | Head |
| gates-integration | `gates/test/integration/storybook-build.test.ts` | Head |

The two deferred integration files stayed in the required hosted Unit tests inventory. The matching
synthetic-merge evidence includes the discovered plan, all 11 visual integration cases and all four
axe integration cases. [Unit plan](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45206635291/artifacts/14834735661) · [Visual integration evidence](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45206635291/artifacts/14836934947) · [Axe integration evidence](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45206635291/artifacts/14835138543)

## Full hosted verification for T009

Run 45206635291 passed all 18 required checks. Its wall time was **59m 00s** from 15:33:54 to
16:32:54 UTC, with the last required check finishing at 16:32:53 UTC. GitHub checked merge
`1278b0e967ac1b7e35af8836313d18a99f09da24`, whose parents are main
`ff85ae5676ba52f5312719d5253fd938eac4aa94` and candidate `32df0b5d292f5bf73908236cd54cde428c93356b`.
The merge and candidate share tree `ae48f31d17d454ab44a3edce4ead5cec74c6a3f3`.
[Hosted CI run](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45206635291)

The first Phase 2 run, 45205673544, reported a surviving `StringLiteral` at line 5 of
`ocelle-workflow-node.ts` in its mixed mutation shard. The independent review and four individual
source replacements above had already identified and reproduced the gap, and the test-only follow-up
was pushed before that hosted result arrived. [First mixed mutation shard](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45205673544/job/137800954304)

- Unit tests passed 10,870 tests across 326 files and six shards, 45m 18s after run creation. [Unit tests](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45206635291/job/137833775198)
- Changed-source mutation passed all eight shards. The reports counted 86 mutants across their ranges,
  with zero survivors, zero timeouts and 10 compile-error outcomes. The mixed shard carried the two
  Phase 1 `ObjectLiteral` equivalent records for `label` and `kind`.
  [Mutation testing](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45206635291/job/137843016304) · [Mixed mutation shard](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45206635291/job/137804320358)
- Visual regression, Accessibility and Content security passed.
  [Visual regression](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45206635291/job/137804024418) · [Accessibility](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45206635291/job/137804025761) · [Content security](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45206635291/job/137804025238)
- The Plants aggregate judged all 317 plants from the 17 gates and the registry. [Plants verdict](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45206635291/job/137816759813)
