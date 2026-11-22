# Tasks: App frame and navigation

See the [spec](spec.md), [plan](plan.md), [contracts](contracts/elements.md), [state model](data-model.md), and [validation guide](quickstart.md). Each behavioral phase records a real failing test commit before implementation, then passes the story old-code and mutation checks. Use the configured source browser projects for mutation evidence. A scaffold may establish imports and inert API shape so red tests fail on missing behavior.

## Phase 1: Setup

- [X] T001 Verify the pinned Node, pnpm and Chromium setup using `package.json` and `CONTRIBUTING.md`. Record the runnable baseline commands in `specs/015-app-frame-navigation/reviews/phase-1/`.

## Phase 2: Foundational primitives

Top bar and compact destination items are shared by the shell stories. Their standalone browser fixtures require no shell.

- [x] T002 [P] Write red browser tests in `packages/elements/test/top-bar.test.ts` for brand, product name, supplied actions, omitted regions, native pointer/Enter/Space menu activation, exact request payload and external expanded state, keyboard focus, and both computed target axes at 320 px with long translated text.
- [x] T003 [P] Write red browser tests in `packages/elements/test/nav-item.test.ts` for href activation, absent href, expanded and compact labels, decorative icon, native link/current semantics, visible focus, and a visual-only label bubble that opens on hover and keyboard focus, permits hover travel, and dismisses on Escape. Verify a long translated compact label stays legible with visible focus and no horizontal page overflow, including under forced colors and reduced motion.
- [x] T004 [P] Implement the top-bar contract and dark chrome with token-only styles in `packages/elements/src/ocelle-top-bar.ts`.
- [x] T005 [P] Implement the vertical destination and compact bubble in `packages/elements/src/ocelle-nav-item.ts`, using the existing tooltip behavior with accessible description disabled. Implement the agreed compact context precedence and preserve host-owned settings.
- [x] T006 Register both elements in `packages/elements/src/index.ts`, `packages/elements/src/browser.ts`, and `packages/elements/package.json`. Update `packages/elements/custom-elements.json` and cover individual imports in `packages/elements/test/entry-top-bar.test.ts` and `packages/elements/test/entry-nav-item.test.ts`.
- [x] T007 [P] Add variant and state stories in `storybook/stories/top-bar.stories.ts` and `storybook/stories/nav-item.stories.ts`, with pinned light/dark snapshots in `storybook/baselines/`.

## Phase 3: User Story 1 — Keep the application frame usable as space changes (P1)

**Independent test.** Resize a standalone shell in a fixed viewport and observe layout, thresholds, logical padding, navigation and focus.

- [x] T008 [US1] Write red source tests in `packages/elements/test/app-shell-layout.test.ts` for all layout/tier combinations, fixed-viewport border-box measurement at both boundaries, 45rem and 68.75rem defaults, supported units, explicit > computed token > default precedence, invalid and non-finite values, equal and inverted pairs, style remeasurement, no size feedback, exact transition payload/count and independent logical padding in LTR and RTL.
- [x] T009 [US1] Write red source tests in `packages/elements/test/app-shell-navigation.test.ts` for stable nested nav item identity and host compact restoration, sidebar head/footer visibility, retained focus, focus recovery when controls disappear, and distinct localized landmarks with landed components or bare content, including empty and omitted regions.
- [x] T010 [US1] Publish and test the two layout thresholds in `packages/tokens/src/source.ts` and `packages/tokens/test/`, then implement shell sizing, tier state, stable main/contentTarget, padding inputs and top-bar composition in `packages/elements/src/ocelle-app-shell.ts`. Reuse `packages/elements/src/tiers.ts` without altering list-detail defaults.
- [x] T011 [US1] Implement navigation projection and compact presentation in `packages/elements/src/ocelle-app-shell.ts`, `packages/elements/src/ocelle-context-sidebar.ts`, and `packages/elements/src/ocelle-nav-item.ts`. Keep one composed set of nodes, use neutral wrappers around existing landmarks, propagate compact mode through ordinary grouped descendants, restore host compact settings after removal, and preserve standalone sidebar behavior.
- [x] T012 [US1] Register the shell in `packages/elements/src/index.ts`, `packages/elements/src/browser.ts`, `packages/elements/package.json` and `packages/elements/custom-elements.json`. Add standalone registration coverage in `packages/elements/test/entry-app-shell.test.ts`.
- [x] T013 [US1] Add expanded, collapsed, omitted-region and flush-content fixtures in `storybook/stories/app-shell.stories.ts` with light/dark baselines in `storybook/baselines/`.

## Phase 4: User Story 2 — Reach personal navigation without team context (P1)

**Independent test.** Open, traverse, dismiss and resize a personal frame at 320 px with real slotted destinations. Repeat the integrated focus checks for mission and project.

- [ ] T014 [US2] Write red source tests in `packages/elements/test/app-shell-drawer.test.ts` for navigation availability and order in all three layouts, localized landmarks, pointer/Enter/Space entry, first sequential destination before any Tab with flat-order divergence and competing autofocus in separate cases, forward and reverse wrapping, and focus return on Escape, close and backdrop.
- [ ] T015 [US2] Write red source tests in `packages/elements/test/app-shell-focus.test.ts` for both directions across each bound, focus from a destination/trigger/close control, within-narrow retention, fixed-width layout swaps wide and inside a live modal, removed destinations and ordered fallbacks, and same-tier ResizeObserver delivery during a genuine delayed drawer exit before close. Assert deep focus after closing and prove event order without sleeps.
- [ ] T016 [US2] Write red reflow, focus and menu-hit-bound tests at 320 px in `packages/elements/test/app-shell-reflow.test.ts` with long translated labels, actions, visible focus and reachable main. Cover empty navigation and all layouts, forced colors and reduced motion.
- [ ] T017 [US2] Implement the projected `ocelle-drawer` and single-action menu flow in `packages/elements/src/ocelle-app-shell.ts`. Coordinate the existing drawer's cancelable and completion events and establish sequential destination entry. Cover standalone overlay autofocus and restoration in `packages/elements/test/drawer.test.ts` before any shared behavior change in `packages/elements/src/overlay.ts`.
- [ ] T018 [US2] Settle focus after effective tier/layout changes and matching drawer close in `packages/elements/src/ocelle-app-shell.ts`. Preserve pending work on same-tier size reports, recompute it on superseding transitions, and cancel it on disconnect or deliberate surviving focus. Update the shell and any additive shared API in `packages/elements/custom-elements.json`.
- [ ] T019 [US2] Add narrow personal, mission and project drawer fixtures, closed and open, in `storybook/stories/app-shell.stories.ts` and record pinned light/dark baselines in `storybook/baselines/`.

## Phase 5: User Story 3 — Identify and follow navigation destinations (P2)

**Independent test.** Mount the pill group, breadcrumbs and compact nav item with real destinations; check native navigation, current semantics, wrapping and overlay Escape ownership.

- [ ] T020 [P] [US3] Write red tests in `packages/elements/test/nav-pill.test.ts` for a named ordered group, empty group, current-page semantics, pointer and keyboard native navigation, long labels and focus during wrapping, and a separate host CTA in top-bar actions.
- [ ] T021 [P] [US3] Write red tests in `packages/elements/test/breadcrumbs.test.ts` for landmark naming, order, current page and decorative separators, logical alignment with the title and focusable wrapping without page overflow.
- [ ] T022 [US3] Verify compact-bubble ownership in `packages/elements/test/nav-item.test.ts` and touch behavior in `packages/elements/test/nav-item.touch.test.ts`. Cover hover-only Escape with focus elsewhere in a drawer, a second Escape dismissing the drawer, and a newer modal receiving Escape first. Put any missing behavior under red coverage before fixing it in `packages/elements/src/ocelle-nav-item.ts` or existing tooltip/overlay logic.
- [ ] T023 [P] [US3] Implement the data-driven inline nav links in `packages/elements/src/ocelle-nav-pill.ts`, with one current link and wrapping. Keep the drawer in the shell and CTA in top-bar actions.
- [ ] T024 [P] [US3] Implement the ordered trail, localized landmark and current text in `packages/elements/src/ocelle-breadcrumbs.ts`, with logical inline-start alignment and wrapping.
- [ ] T025 [US3] Register both elements in `packages/elements/src/index.ts`, `packages/elements/src/browser.ts`, `packages/elements/package.json`, and `packages/elements/custom-elements.json`. Add individual entry coverage in `packages/elements/test/entry-nav-pill.test.ts` and `packages/elements/test/entry-breadcrumbs.test.ts`.
- [ ] T026 [US3] Add pinned light/dark stories and baselines in `storybook/stories/nav-pill.stories.ts`, `storybook/stories/breadcrumbs.stories.ts` and `storybook/baselines/`. Cover default, current, keyboard focus, empty and long-content states.

## Phase 6: User Story 4 — Skip directly to main content (P2)

**Independent test.** Tab to the skip control and activate it against a same-root selector and a cross-root element reference. Assert deep focus and next Tab.

- [ ] T027 [US4] Write red source tests in `packages/elements/test/skip-link.test.ts` for keyboard-only reveal, localized label, activation, both target forms, immediate and subsequent focus, reference precedence, first same-root selector match, malformed selector and disconnected, hidden or non-focusable targets.
- [ ] T028 [US4] Write a red built-shell test in `packages/elements/test/browser/app-shell.test.ts` and external resources in `packages/elements/test/browser/fixtures/`. Use the enforced-CSP fixture to resize an independently sized frame, open and dismiss the drawer, and transfer skip focus. Use the landed shell and drawer from earlier phases as setup. Prove red fails on missing skip focus with the rest of the fixture operational, then rerun it after the skip-link implementation. Assert outcomes and zero CSP violations, outside or failed requests, and console errors.
- [ ] T029 [US4] Implement native focus transfer and the visible-on-focus control using Ocelle tokens in `packages/elements/src/ocelle-skip-link.ts`. Verify initial tab order and cross-root main focus using the shell `skip-link` slot and `contentTarget` in `packages/elements/test/skip-link.test.ts`.
- [ ] T030 [US4] Register the element in `packages/elements/src/index.ts`, `packages/elements/src/browser.ts`, `packages/elements/package.json` and `packages/elements/custom-elements.json`. Cover the standalone entry in `packages/elements/test/entry-skip-link.test.ts` and add stories and pinned baselines in `storybook/stories/skip-link.stories.ts` and `storybook/baselines/`.

## Phase 7: Polish and cross-cutting verification

- [ ] T031 Rerun the Phase 6 built-shell probe and account for every gate in the Quality Gates section of `.specify/memory/constitution.md` and its command in `package.json` across the complete branch. Record a branch-wide result or the controlling pull-request check for each gate. Record evidence in `specs/015-app-frame-navigation/reviews/phase-7/` and use the pinned workflow for any remaining light/dark baselines in `storybook/baselines/`.
- [ ] T032 Update `packages/elements/README.md`, `packages/elements/CHANGELOG.md`, `packages/tokens/README.md`, and `packages/tokens/CHANGELOG.md` with new public surfaces and integration examples for named regions, threshold overrides, narrow drawer, and cross-root skip targeting.

## Dependencies and parallel work

- Setup → foundation → US1 → US2. The standalone US3 group and breadcrumb red tests can run in parallel after foundation, and their implementations can proceed independently. The integrated bubble checks use the landed drawer plus the foundational nav item. Complete shell integration before final US3 verification.
- US1 threshold/padding and navigation checks can be authored separately before shell implementation. For US2, the drawer entry, focus transition and reflow fixtures can be authored independently, with the drawer lifecycle in place before focus settlement is completed.
- The US4 standalone focus tests are independent of the shell. The cross-root shell composition uses US1's main hook. Polish follows all four stories. Shared registration, manifest and baseline updates should be integrated serially.

## Implementation strategy

The MVP is the two P1 stories, including the foundational top bar and compact navigation item. The P2 stories add the Desktop V2 inline group, breadcrumbs and repeated-navigation bypass. Finish each phase's red/green and independent review before starting the next.
