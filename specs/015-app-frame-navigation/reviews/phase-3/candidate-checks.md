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

## Compact stylesheet and nested focus follow-up

- The tests in `33a4697` passed on the previous candidate and detected four isolated faults. The test assertions failed if a sending shell cleared a received section's compact styles, a same-tier update reordered an authored stylesheet, the shell overrode personal item presentation, or focus recovery crossed the shell boundary and treated its inner destinations as outer sidebar chrome.
- Compact-section bookkeeping now replaces its tracked set after each update and changes marker presence without rewriting the attribute value. The shell frame owns the sidebar width state, and main padding classes use Lit's class map. The shell layout and navigation suites passed 44/44. Scoped lint, TypeScript and the diff check passed.

- A pinned Docker visual comparison of the 20 shell and token story-theme cases captured twice found no differences. The focused compact-section diagnostic on `b3efd12` reached 97.44%, with 38 killed mutants, one survivor, and 20 rejected at compilation. It reported zero uncovered mutants or timeouts. The survivor removes WeakMap cleanup.

## Threshold and reconnect follow-up

- The tests in `219f40a` cover overflow when a finite parsed coefficient is multiplied by its font size, per-bound inherited token fallback, root-scaled defaults, and tier settlement after reconnect. Six isolated source faults failed their intended Chromium assertions, including removing reconnect measurement or scheduling remeasurement on a detached shell.
- Published fallback values now convert directly from the computed root font size. Final shell navigation and layout tests passed 46/46. Scoped lint, TypeScript and the diff check passed.

## Observer and disconnect evidence

- The final shell browser suites passed 48/48. Four isolated faults failed separate Chromium assertions. They left the resize observer running, left the subtree observer running, skipped Lit controller disconnection, or emitted a pending tier transition after disconnect. The native observer assertions use the repository's layout-settlement helper. Scoped lint, TypeScript and the diff check passed.

- The 60-mutant threshold and lifecycle range on `952ddfd` reported 90.24%, with 35 killed, two mutant timeouts, four survivors and 19 rejected at compilation. Three survivors correspond to the observer and Lit controller cleanup assertions above. The remaining survivor flipped a redundant compact argument during cleanup of empty inputs. The update derives the compact state at the point of use and removes the argument. The shell suites passed 48/48 with the change.

- The updated 59-mutant threshold and lifecycle range on `71c7ef7` passed at 100%, with 39 killed, one mutant timeout, no survivors or uncovered mutants, and 19 rejected at compilation.

## Explicit default-slot section styling

- Tests-only commit `7f37f6b` reproduced the wide layout failure for a section with `slot=""`. It had 0px inline padding where an implicit default section had 16px. The sidebar now applies the same wide and compact styles to both forms. The test also verifies 4px compact inline padding and absence of an extra leading divider while leaving the named footer alone.
- The shell layout, navigation, and standalone context-sidebar suites passed 74/74. Scoped lint, style lint, TypeScript and the diff check passed. The pinned visual comparison captured 42 shell, sidebar, and token story-theme cases twice and found no differences.

## Native scroll stop focus

- The 174-mutant render, presence, and destination range on `f948d1d` reached 99.14%. It killed 115 mutants, with one survivor, 58 rejected at compilation, and zero uncovered mutants or timeouts.
- A new browser scenario verifies that shell focus recovery honors Chromium's native keyboard-scroll stop even when it has no authored tabindex. Its assertion fails when the opaque-host eligibility check is applied to all walker stops, covering the sole survivor of that range.

## Shared presentation and settlement follow-up

- The ownership and settlement range on `9984bfd` reached 97.25% with 106 killed, three survivors, 51 rejected at compilation, and no uncovered mutants or timeouts. Two survivors removed WeakMap cleanup. The third allowed settlement after a reactive update on a disconnected shell.
- The shared sidebar and nav-item range on `2fcb81f` reached 91.30% with 63 killed, six survivors, six rejected at compilation, and no uncovered mutants or timeouts. Its survivors covered redundant render scheduling and class construction.
- Tests in `3a26f51` passed on unchanged source. Three isolated fault probes failed the added assertions for disconnected reactive updates, unnecessary same-tier sidebar renders, and missing compact centering. Owner tokens now allow moved sections and items to outlive the shell without retaining it, and nav items apply their compact and chrome state together in one update.
- The four shell, sidebar, and nav-item suites passed 82/82. Code lint, style lint, test lint, the manifest gate, TypeScript, and the diff check passed. Pinned Docker captured 56 shell, sidebar, nav-item, and token story-theme cases twice with no differences.
- The updated shared presentation range on `73c0f35` reached 96.61%, with 57 killed, two surviving default-color mutants, 12 rejected at compilation, and no uncovered mutants or timeouts. A browser test now checks standalone foreground before and after a compact-only update. Both exact default-to-chrome fault probes failed that assertion.

## Current mutation range audit

Ranges below refer to shell source at `73c0f35`. The diagnostics use selected repository browser tests. Canonical hosted validation covers the release workflow.

| Source and scope | Local evidence |
| --- | --- |
| App shell lines 18–24, 65–222, 410–end, constants, setup and registration | 91.89% before removing three private slot-presence initializers overwritten by the first `willUpdate`. The updated entry, export, layout, and navigation suites passed 52/52. |
| App shell lines 25–39, 250–318, 399–409, presence, render, and destination selection | 99.14% on unchanged production ranges at `f948d1d`. The exact probe for the one survivor failed the native-scroll test in `9984bfd`. |
| App shell lines 40–56 and 337–398, plus the compact stylesheet helper | 100% on `73c0f35`, with 105 killed and 51 rejected at compilation, zero survivors, zero uncovered, and zero timeouts. |
| App shell lines 58–64, 223–249, 319–336, thresholds and lifecycle | 100% on the same production ranges at `71c7ef7`. |
| Changed sidebar and nav-item presentation ranges | 100% sidebar and 96.61% combined on `73c0f35`. The follow-up two-line nav check with the new foreground test passed at 100%, with four killed and four rejected at compilation. |

## Canonical workflow status

The workflow's canonical `red.sh 3 phase` replay recorded tests-only `a0612f39fe3579984879f800c4f8b13fab148089` with test exit 1. Its full log reports 62 failures out of 9,698 tests, including 19 direct app-shell layout, navigation and standalone-entry failures. It also contains token and manifest assertions and unrelated font, integration timeout and form timing failures. The full affected-plant selection is 317 plants because the package export change is unmapped. The completed focused mutation diagnostics are above. Canonical head and final-tests-on-base checks and independent review are pending. The targeted evidence above does not replace those checks.
