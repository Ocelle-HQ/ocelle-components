# Phase 3 candidate checks

The candidate adds the responsive shell, its threshold tokens and package entry, and the wide/collapsed navigation behavior. Narrow layout presents the trigger for populated navigation. Drawer activation and lifecycle are Phase 4 tasks.

## Targeted evidence

- The initial tests-only red commit is `a0612f3`, preceded by inert scaffold `3b90436`. The initial focused run produced 24 expected failures and eight unaffected token-test passes. The final assertions overlaid onto the scaffold produced 28 failures on the intended missing behaviors and eight unaffected token-test passes.
- The responsive shell, navigation and focus, standalone and root entry, context sidebar, nav item and token table suites passed 68/68. A separate diagnostic caught a real compact target narrowed to 11 px by native list indentation. The final suite verifies the 40 px target remains inside the collapsed column.
- Package inventory, token generation, manifest and Storybook integration checks passed 1,272/1,272. The standalone manifest-gate suite passed 15/15. The package build and built-output CSP scan passed.
- The repository's pinned Docker capture and update logic captured both themes twice for nine shell stories and the shell-token story. It added 18 PNGs and refreshed two token PNGs. The matching focused axe audit passed all 20 story-theme cases.
- All 13 targeted manifest and Storybook fixture plants behaved as expected using the repository's runner and judge. Two pinned passes of the color-ink visual plant on the new shell stories confirmed the nine new light-theme findings and matching dark captures.

## Review follow-up

- The two regressions in tests-only commit `9b23eca` failed against the original candidate in Chromium. A generic wrapper around hidden and whitespace-only descendants exposed a Workspace landmark. During a receiver-first transfer between shells, the sender then cleared compact presentation on the moved destination.
- The follow-up scopes presentation cleanup to its current shell owner and traverses generic wrappers when checking for content. Both regressions passed, as did all 55 cases in the app shell navigation, app shell layout, nav item and context sidebar suites. TypeScript and `git diff --check` passed.

## Mutation follow-up

- The initial focused diagnostic on `acd5ef4` reported a 59.82% score across the shell and compact-section sources. It killed 201 mutants, with 114 survivors and 21 uncovered mutants. The TypeScript checker rejected 142 additional mutants at compilation.
- Tests now check that two collapsed shells in the same shadow root share one stylesheet, that removing one restores its detached section and keeps the other compact, and that releasing the last shell preserves authored stylesheets. They also cover content-box thresholds, collapsed column sizes, localized shell defaults, and live changes to nested roles, slot names and text.
- The shell uses one compact predicate for behavior and sizing. It observes the light DOM inputs it reads, and it renders the forwarded actions slot when it has content. The four related source suites passed 59/59. The revised focused diagnostic compiled and passed the 29-test coverage run. Four separate browser fault probes demonstrated that the stylesheet test detects premature release, retention of the compact sheet, removal of unrelated sheets, and skipped disconnect cleanup.
- On `8cb3f4d`, the revised focused diagnostic reached 78.77% overall and 83.33% for compact-section handling. It reported 254 killed mutants, two mutant timeouts, 66 survivors, three uncovered mutants, and 136 rejected at compilation. The diagnostic still falls below the repository's 100% threshold.

## Canonical workflow status

The workflow's `red.sh 3 phase` replay has not recorded a result yet. The full affected-plant selection is 317 plants because the package export change is unmapped. The local focused mutation diagnostics have completed, with results above. Canonical head and final-tests-on-base checks and independent review are pending. The targeted evidence above does not replace those checks.
