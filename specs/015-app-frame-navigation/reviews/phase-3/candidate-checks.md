# Phase 3 candidate checks

The candidate adds the responsive shell, its threshold tokens and package entry, and the wide/collapsed navigation behavior. Narrow layout presents the trigger for populated navigation. Drawer activation and lifecycle are Phase 4 tasks.

## Targeted evidence

- The initial tests-only red commit is `a0612f3`, preceded by inert scaffold `3b90436`. The initial focused run produced 24 expected failures and eight unaffected token-test passes. The final assertions overlaid onto the scaffold produced 28 failures on the intended missing behaviors and eight unaffected token-test passes.
- The responsive shell, navigation and focus, standalone and root entry, context sidebar, nav item and token table suites passed 68/68. A separate diagnostic caught a real compact target narrowed to 11 px by native list indentation. The final suite verifies the 40 px target remains inside the collapsed column.
- Package inventory, token generation, manifest and Storybook integration checks passed 1,272/1,272. The standalone manifest-gate suite passed 15/15. The package build and built-output CSP scan passed.
- The repository's pinned Docker capture and update logic captured both themes twice for nine shell stories and the shell-token story. It added 18 PNGs and refreshed two token PNGs. The matching focused axe audit passed all 20 story-theme cases.
- All 13 targeted manifest and Storybook fixture plants behaved as expected using the repository's runner and judge. Two pinned passes of the color-ink visual plant on the new shell stories confirmed the nine new light-theme findings and matching dark captures.

## Canonical workflow status

The workflow's `red.sh 3 phase` replay has not recorded a result yet. The full affected-plant selection is 317 plants because the package export change is unmapped. The local focused mutation diagnostic is in progress. Canonical head and final-tests-on-base checks and independent review are pending. The targeted evidence above does not replace those checks.
