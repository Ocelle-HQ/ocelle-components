---
scope: landing
phase: landing
round: 2
verdict: approved
base: 8164293787f95590f33cf793a20c35f8b8e3b1e5
head: c7def4d2905f3182446fe73085487c376b15055b
tdd_check: operator-authorized-targeted-and-hosted
---

# Landing review, round 2 (PR #65, app frame and navigation, #12)

I checked the two blocking findings from [round 1](round-1.md) against the integrated tree at `c7def4d`, which merges source fix `93fe5e8` with main `8164293`. The review approves both fixes. Landing still requires green hosted CI on the final PR head.

## Findings

| ID | Status | Verification |
| --- | --- | --- |
| L1-01 | Resolved | Region classification follows open shadow roots and assigned slot content. It keeps the supplied landmark and does not add a wrapper landmark. Empty rendered content removes the region and narrow trigger. The shell observes discovered roots for rendered content and slot changes. Regression tests verify both shell layouts, breadcrumb projection through a wrapper, a supplied custom shadow landmark, and a narrow drawer that opens, focuses its link, closes when the last item is removed, restores main focus, and reopens with one localized landmark after items return. |
| L1-02 | Resolved | The top bar's native button uses the shared accessible-name helper and falls back to “Open navigation” for whitespace-only input. The Chromium accessibility-tree assertion exercises the actual button. The shell uses that same top-bar control. |

## Test evidence

- The tests-only commit `7be274a` recorded seven failures covering both findings before the source fix went in. The failures verify the duplicate landmarks, rendered emptiness, accessible name and narrow trigger outcomes.
- The targeted replay against the source fix passed all 114 tests across 12 files, including adjacent shell, drawer, navigation, touch and built CSP paths. The added assertions remain in the normal browser project and use Chromium accessibility data and real interaction.
- The integrated PR diff passed the whitespace check. The full hosted result remains a separate landing gate.
