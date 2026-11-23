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
Plants, mutation and required checks remain pending. T009 remains open until those outcomes and the
focused replay are recorded for the exact candidate.
