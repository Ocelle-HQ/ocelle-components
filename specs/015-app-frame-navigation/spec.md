# Feature Specification: App frame and navigation

**Feature Branch** `024-app-frame-navigation`

**Created** 2026-11-20

**Status** Draft

**Input** [Issue #12](https://github.com/Ocelle-HQ/ocelle-components/issues/12) and [approved triage 024](../../triage/024-app-frame-navigation.md).

## User Scenarios & Testing

### User Story 1 — Keep the application frame usable as space changes (P1)

A Kitty Desktop or Kitty Dashboard user can reach their workspace navigation and content in a window or embedded frame of any supported width.

**Why this priority.** The shell defines where navigation and content appear across the application.

**Independent test.** Place the shell in an independently resizable host with labeled rail, sidebar and content fixtures. Resize the host with a fixed viewport while navigating by keyboard.

1. Given a wide mission layout, the rail, context sidebar and content appear together. In project layout, only the sidebar and content appear, with no reserved rail space.
2. Given two configured thresholds, the shell shows an expanded sidebar at or above the upper threshold and an icon column between the thresholds. The mission rail stays available in this collapsed tier. Below the lower threshold, content takes the available width and the top bar menu provides access to the navigation.
3. Given focus in navigation or content, crossing each threshold in either direction preserves focus if its control stays available. When a control becomes hidden, focus moves to the menu trigger or, if that trigger also disappears, the corresponding visible navigation control or the main content.
4. Given ordinary content and a panel that needs to sit flush, the host can opt out of block-end and inline-end padding independently. The start edges retain their spacing and the panel touches each elected end edge.

### User Story 2 — Reach personal navigation without team context (P1)

A user choosing or creating a workspace can reach personal destinations from the same application frame, including at narrow widths.

**Why this priority.** New users need navigation before a team sidebar exists.

**Independent test.** Mount the top bar and a no-team shell with personal navigation and an action. Open and dismiss the menu using the keyboard at 320 px, then resize while the drawer is open.

1. At wide widths the frame presents one personal sidebar with no team rail. The top bar displays the brand mark, product name and supplied actions.
2. At narrow widths the top bar exposes an accessibly named menu control. Activating it by pointer, Enter or Space opens the drawer with the same personal destinations and places focus inside it.
3. Tab and Shift+Tab stay within the open drawer. Closing via Escape or its close control returns focus to the trigger. If the width grows while the drawer is open, the modal closes and focus moves to the same now-visible destination when possible, or to the first available destination or main content.
4. A standalone top bar exposes the host's actions and menu intent, and lets the host indicate menu expansion. An absent action or menu leaves no empty tab stop.

### User Story 3 — Identify and follow navigation destinations (P2)

A user can identify their current destination and navigate from a compact sidebar, Desktop V2 destination pill or breadcrumb trail.

**Why this priority.** The shell must remain understandable when labels or the wider context are out of view.

**Independent test.** Exercise each primitive outside the shell using a labeled set of destinations, including current and long-label states.

1. An expanded nav item shows its icon and label. In compact mode it shows the icon and retains the same accessible name. The focusable link exposes the configured current state.
2. The compact label bubble appears on hover and keyboard focus, can itself be hovered, stays visible while hover or focus persists, and can be dismissed with Escape. It introduces neither a tab stop nor a duplicate accessible description. Dismissing the bubble inside the open drawer leaves the drawer open on that Escape.
3. The Desktop V2 nav pill presents a compact labeled destination with a distinguishable current state and supports ordinary link activation by keyboard and pointer. Current state is conveyed to assistive technology and remains distinguishable without color alone.
4. The breadcrumb trail presents ordered ancestors and identifies the current page. The first crumb aligns with the page title at the logical inline start. Long trails wrap without clipping destinations or creating horizontal page overflow.

### User Story 4 — Skip directly to main content (P2)

A keyboard user can bypass repeated application chrome and continue navigating from the start of the content.

**Why this priority.** The application shell repeats navigation on every screen and may enclose content in a shadow root.

**Independent test.** Tab into the shell and activate a skip link, first with a same-root selector and then with a direct reference to content in another root.

1. The skip link becomes visible on keyboard focus and presents consumer-supplied localizable text. Activation puts focus on the target, and the next Tab continues in the content's natural focus order.
2. The direct reference takes precedence when both target forms are given. A missing, malformed, disconnected, hidden or non-focusable target leaves focus on the skip link. The user can continue with Tab.

### Edge Cases

- Thresholds use the shell's border-box inline size. Equality selects the wider tier at each boundary. A non-default valid setting takes precedence over its default. Invalid values fall back to their defaults. If the resolved lower threshold exceeds the upper threshold, both revert to defaults. Equal thresholds skip the collapsed tier.
- For a tier change that leaves the active destination available, preserve focus on that destination through any visual relocation. When a narrower tier closes access to the active destination, keep a visible focus indicator on the menu trigger.
- Empty optional navigation regions have no empty landmark or tab stop. If there is no navigation to open, the shell does not expose a drawer trigger.
- Skip-link selectors search the link's containing document or shadow root and use its first match. Consumers supply a direct reference when the target lives in another root.

## Requirements

### Functional Requirements

- **FR-001.** `ocelle-app-shell` MUST provide mission, project and personal layouts with the rail, sidebar and content regions described in Stories 1 and 2. Each layout MUST expose one main content destination and only the navigation for its active tier.
- **FR-002.** The shell MUST select expanded, collapsed and narrow tiers from consumer-configurable lower and upper thresholds measured against its own border-box inline size. It MUST follow the exclusive-bound and supported length conventions of mission 009. Defaults MUST come from the Ocelle layout contract so a consumer can change the thresholds without replacing the frame.
- **FR-003.** The shell MUST allow the host to opt the content region out of block-end and inline-end padding independently without requiring compensating margins. It MUST honor logical edges in both text directions.
- **FR-004.** The shell MUST provide narrow navigation through `ocelle-drawer`, including the personal context path. Opening, dismissing and crossing a tier boundary MUST follow the focus behavior in Stories 1 and 2.
- **FR-005.** `ocelle-top-bar` MUST provide the Ocelle brand mark, a supplied product name, an area for supplied actions and an optionally visible menu control. The menu control MUST have an accessible name, accurately report expansion and communicate activation to a host when used standalone.
- **FR-006.** `ocelle-nav-item` MUST offer a vertical destination link with icon, label, current state and compact presentation. The underlying link MUST retain its name and current state in both presentations. Compact mode MUST expose the dismissible label bubble in Story 3.
- **FR-007.** `ocelle-nav-pill` MUST offer a compact labeled Desktop V2 destination with default, focused and current states. Its current state MUST reach the link and remain perceivable in both themes and forced colors.
- **FR-008.** `ocelle-breadcrumbs` MUST expose a named navigation landmark, an ordered trail and the current page. Ancestor links MUST remain operable during reflow. The first crumb MUST align with the title when both share an inline start.
- **FR-009.** `ocelle-skip-link` MUST be visible on keyboard focus and accept a direct element reference or selector with the precedence, scope and fallback in Story 4. It MUST move focus directly on successful activation.
- **FR-010.** All six elements MUST meet the repository's WCAG 2.2 AA, token-only, strict CSP and offline contracts. The top bar, rail and personal rail use dark chrome in both themes. The elements MUST support forced colors and reduced motion while retaining visible focus and usable contrast.
- **FR-011.** Every delivered variant and state MUST have light and dark stories with committed visual baselines, behavioral tests for each keyboard path and event payload, no serious or critical axe findings, and a complete public manifest entry. Tests MUST exercise the actual controls and accessibility tree and satisfy the constitution's test-first and mutation gates.

## Success Criteria

### Measurable Outcomes

- **SC-001.** All three shell layouts reach the expected region arrangement in every supported tier. For each threshold, a fixture tested immediately below, at and above the boundary selects the expected tier while its viewport stays fixed.
- **SC-002.** Keyboard checks cover both directions across both thresholds, including a resize with the drawer open. Each transition leaves focus on a visible control or the main content.
- **SC-003.** At 320 px, representative mission, project and personal compositions fit without horizontal page scrolling. Users can operate the menu, drawer and navigation and reach the main content by keyboard.
- **SC-004.** Each destination primitive correctly announces its label and current state. Both supported skip-link target forms place focus at the expected target and the next Tab enters its content sequence.
- **SC-005.** All six elements pass the inherited story, visual baseline, accessibility, public-manifest and strict-CSP checklist.

## Assumptions

- Kitty Desktop and Kitty Dashboard are the first consumers. The Ocelle console can compose the same primitives later. Hosts supply routes, product text, actions and screen content.
- The Desktop V2 primitive list establishes the nav-pill need. The draft treats it as a destination link whose current state follows the host route, with the constitution's standard rounding for controls.
- The landed layout, overlay, icon, token and button packages supply the foundation. Use the [workflow layout threshold convention](../009-workflow-layouts/spec.md) and the inherited [per-element checklist](https://github.com/Ocelle-HQ/ocelle-components/issues/7).
- The consumer evidence describes [personal navigation](https://github.com/spec-kitty/spec-kitty-design/issues/450), [Desktop V2 primitives](https://github.com/spec-kitty/spec-kitty-design/issues/470), [top bar](https://github.com/spec-kitty/spec-kitty-design/issues/494), [shell layouts](https://github.com/spec-kitty/spec-kitty-design/issues/499), [nav item](https://github.com/spec-kitty/spec-kitty-design/issues/500), [skip link](https://github.com/spec-kitty/spec-kitty-design/issues/502), [flush edges](https://github.com/spec-kitty/spec-kitty-design/issues/512) and [breadcrumb alignment](https://github.com/spec-kitty/spec-kitty-design/issues/518).
