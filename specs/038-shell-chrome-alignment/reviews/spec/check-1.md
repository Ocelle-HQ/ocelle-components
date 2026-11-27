---
check: 1
verdict: issues
---

# Spec check 1

| ID | Severity | Where | Finding | Fix |
|----|----------|-------|---------|-----|
| SPEC-1-01 | blocking | spec.md US2 scenario 1, FR-003, SC-002 | The default vertical divider already sits above the bottom group and has a gap from the primary group. The opted-in acceptance scenario can pass without proving which side of the divider absorbs the spare height. | In a vertical rail with both groups and measurable spare height, require the opted-in divider to stay one normal item gap above the bottom group. The spare space belongs before the divider. The primary and bottom groups retain their positions. Verify that a host-driven orientation change preserves focus and uses the existing horizontal placement. |
| SPEC-1-02 | blocking | spec.md US3 scenario 3, FR-006, SC-003 | The narrow scenario can pass with a shrunken menu target, even though the existing 320 px frame contract includes a minimum menu hit area on both axes. The proposed fixture also gives no bound for arbitrary host action content. | Use a representative existing action fixture with a long product name and a short badge at 320 px. Verify no horizontal page overflow, no clipped focus indicators, the existing minimum menu hit area on both axes, and the complete accessible product name. Keep host ownership of supplied actions and badge content. |
| SPEC-1-03 | note | spec.md FR-007 and SC-004 | The specification calls for Storybook evidence without making the approved pinned visual evidence explicit in its measurable outcomes. | Name representative light and dark Storybook baselines produced with the repository's pinned visual setup. Keep the separate forced-colours and strict-CSP checks explicit. |

## Checks

All three stories have an independent test and observable acceptance scenarios. The
mission remains within the approved shell scope and preserves the existing
app-owned boundaries.

The current rail already places its divider after the primary group and above the
bottom group. It retains focus and document order when the host changes orientation.
The existing frame contract requires reflow and an operable minimum-size menu target
at 320 px with a long product name and supplied actions. [Rail contract](../../../../specs/011-layout-headers/contracts/elements-package.md) · [Frame specification](../../../../specs/015-app-frame-navigation/spec.md) · [Top bar contract](../../../../specs/015-app-frame-navigation/contracts/elements.md)
