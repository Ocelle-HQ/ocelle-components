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

## Second mutation follow-up

- Tests-only commit `7f4fec8` failed one focused Chromium assertion on the previous candidate. The label stayed visible in collapsed mode when its containing section explicitly selected the default slot with `slot=""`. The remaining 31 cases passed.
- The shell treats an empty slot name as the default slot and uses a per-update identity to abandon superseded or disconnected focus work. The final layout and navigation suites passed 32/32. The related four-suite run passed 64/64. Scoped lint, TypeScript and the diff check passed.
- Nine isolated browser fault probes failed their intended assertions. The probes covered deliberate focus, stale tier announcements, duplicate naming around a supplied landmark, hidden and non-finite measurement, border-box reporting for a padding-only resize, directly assigned items, footer presentation, and adopted stylesheet identity.

- The second two-file diagnostic on `29704a8` reached 85.40% overall and 85.71% for compact-section handling. It reported 273 killed, two mutant timeouts, 46 survivors, one uncovered mutant and 137 rejected at compilation. The score falls below the repository's 100% threshold.

## Presentation ownership follow-up

- New tests verify that a removed sidebar regains its authored chrome and item presentation, and that a detached rail link returns to the ordinary link color. They also verify recovery from CSS visibility changes while retaining focus containment.
- In five isolated Chromium fault probes on `29704a8`, the new assertions failed when the shell left sidebar or rail presentation behind, ignored visibility, or captured focus outside navigation.
- The shell now uses one ownership set and release path for both sidebar hosts and nav items. Navigation tests passed 23/23, and scoped lint, TypeScript and the diff check passed.

## Pending focus follow-up

- A range-limited Stryker run on `ea87591` reached 94.44% for the ownership and focus blocks. It killed 68 mutants, with four survivors and 33 rejected at compilation. It reported no uncovered mutants or mutant timeouts. The broader related browser suites passed 68/68 on that commit.
- Two isolated Chromium probes failed the intended assertions when focus recovery skipped a managed child's pending update or ignored a newly focused control that had already become hidden. The shell uses the same visibility condition for the current active control regardless of its identity. The final layout and navigation suites passed 37/37.

## Opaque destination focus

- The tests-only commit `e710a67` reproduced one failure and three passes on `e67f646`. A rendered custom destination with `tabindex="0"` was bypassed during focus recovery. The fixed fallback includes an explicitly tabbable visible host and skips opaque placeholders without a sequential stop, with a negative tabindex, or hidden.
- The layout and navigation suites passed 41/41 after the change.

## Canonical workflow status

The workflow's canonical `red.sh 3 phase` replay recorded tests-only `a0612f39fe3579984879f800c4f8b13fab148089` with test exit 1. Its full log reports 62 failures out of 9,698 tests, including 19 direct app-shell layout, navigation and standalone-entry failures. It also contains token and manifest assertions and unrelated font, integration timeout and form timing failures. The full affected-plant selection is 317 plants because the package export change is unmapped. The completed focused mutation diagnostics are above. Canonical head and final-tests-on-base checks and independent review are pending. The targeted evidence above does not replace those checks.
