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

1. Given a mission or project layout with every region populated, when the frame crosses either configured threshold, then the visible regions, menu and drawer contents follow the layout table below and the project layout never reserves rail space.
2. Given focus on a destination, the menu trigger or the drawer close control, when the frame crosses each threshold in both directions, then the focus target follows the ordered rules below and displays a visible focus indicator.
3. Given the shell with both content padding end edges enabled, when the host opts out of block-end only, inline-end only, then both, the panel touches each elected edge. Unselected edges retain their spacing.
4. Given a fixed viewport, when the shell width crosses the default bounds and then crosses valid overrides, the tier changes at the resolved bounds. Invalid explicit overrides expose valid token overrides, and invalid tokens and inverted pairs expose the published defaults.

### Layout and tier behavior

The top bar and main content appear in every tier. For populated navigation, the following table specifies the other visible regions and what the menu reveals.

| Layout | Expanded | Collapsed | Narrow with drawer closed | Narrow drawer contents |
| --- | --- | --- | --- | --- |
| Mission | Rail and full context sidebar | Rail and context sidebar icon column | Menu trigger | Rail destinations, then context sidebar destinations |
| Project | Full project sidebar | Project sidebar icon column | Menu trigger | Project sidebar destinations |
| Personal | Full personal sidebar | Full personal sidebar | Menu trigger | Personal sidebar destinations |

The expanded and collapsed tiers have no menu trigger or modal drawer. The personal sidebar stays full until it switches directly into the drawer at the lower threshold, as described in [consumer issue #450](https://github.com/spec-kitty/spec-kitty-design/issues/450). At narrow widths all supplied destinations for the active layout are reachable inside the open drawer. Each destination appears once in the tab order, with its accessible label. Opening the drawer puts focus on its first destination in sequential keyboard order, ahead of drawer chrome and even when another candidate requests autofocus.

In mission and project layouts, vertical nav items in sidebar content use the collapsed presentation even inside grouped sections. In the expanded and drawer presentations those same items show their labels again, with their link identity and current state preserved. Sidebar headings, separators and footer chrome do not enter the icon column, and anything hidden there is unavailable to keyboard and assistive technology. Sidebar chrome returns in the full presentations. Shell-managed sidebar presentation takes priority over an item's standalone compact setting for as long as the item is part of that sidebar's content. The rail, personal sidebar and standalone items retain their own presentation.

Each populated rail or sidebar has one localized navigation name, with distinct names when the destinations differ. A supplied navigation landmark owns its role and name. The shell gives bare navigation content a single named landmark and uses neutral containers around supplied landmarks. These rules apply both beside the content and inside the drawer.

#### Focus on tier changes

1. Between expanded and collapsed, retain focus on the same control, including the corresponding destination when its visual presentation changes.
2. On entering narrow, navigation focus moves to the menu trigger. If there is no trigger, focus moves to main content. Focus already on a still-visible control or in content stays where it is.
3. On leaving narrow, close any open drawer. If a drawer destination was focused, move focus to that destination in the visible navigation. If that destination is unavailable, or if focus was on the menu trigger or a drawer-only control, choose the first focusable destination in the resulting navigation's tab order, or main content if there is none. Other focus outside the drawer stays on the same control while it remains visible.
4. A resize that stays within the narrow tier leaves the drawer open and preserves focus. A dismissal inside the narrow tier returns focus to the trigger, or main content if the trigger is unavailable.


### User Story 2 — Reach personal navigation without team context (P1)

A user choosing or creating a workspace can reach personal destinations from the same application frame, including at narrow widths.

**Why this priority.** New users need navigation before a team sidebar exists.

**Independent test.** Mount the top bar and a no-team shell with personal navigation and an action. Open and dismiss the menu using the keyboard at 320 px, then resize while the drawer is open.

1. Given a personal layout, when the frame enters the expanded or collapsed tier, the top bar shows the brand mark, product name and supplied actions above one full personal sidebar and the main content.
2. Given a narrow personal frame with destinations, when the user activates its accessibly named menu by pointer, Enter or Space, the drawer opens with the same personal destinations and places focus on the first one in tab order.
3. Given an open drawer, when the user presses Tab or Shift+Tab, focus stays inside and wraps at either end. When the user presses Escape or uses the close control, focus follows the dismissal rule above. Resizing within narrow keeps the drawer open. Resizing into a wider tier closes it and applies the tier-change rules above.
4. Given a standalone top bar with a closed menu and supplied actions, when the user activates the menu, the host receives one menu intent. When the host indicates the menu has opened, the control exposes the expanded state. Omitting the menu or actions leaves no empty tab stop.
5. Given a long translated product name at 320 px, when the user tabs across the top bar, the product name remains available to assistive technology and the supplied actions and menu remain operable with visible focus. The menu's hit area meets the Ocelle minimum target size on both axes.


### User Story 3 — Identify and follow navigation destinations (P2)

A user can identify their current destination and navigate from a compact sidebar, Desktop V2 destination pill or breadcrumb trail.

**Why this priority.** The shell must remain understandable when labels or the wider context are out of view.

**Independent test.** Exercise each primitive outside the shell using a labeled set of destinations, including current and long-label states.

1. An expanded nav item shows its icon and label. In compact mode it shows the icon and retains the same accessible name. The focusable link exposes the configured current state.
2. The compact label bubble appears on hover and keyboard focus, can itself be hovered, stays visible while hover or focus persists, and can be dismissed with Escape. It introduces neither a tab stop nor a duplicate accessible description. Escape dismisses a hover-only bubble even with focus on another control. In the active drawer, the first Escape dismisses its bubble and the next may dismiss the drawer. A newer modal receives Escape ahead of a bubble outside it.
3. The Desktop V2 nav pill presents a named inline group of native destination links in host-supplied order. Users can Tab to each link and activate it as a normal link. At most one link identifies the current page, which is conveyed to assistive technology and distinguishable without color alone. The group wraps at constrained widths. The app shell owns narrow modal navigation, and consumers supply separate calls to action through top-bar actions.
4. The breadcrumb trail presents ordered ancestors and identifies the current page. The first crumb aligns with the page title at the logical inline start. Long trails wrap without clipping destinations or creating horizontal page overflow.
5. Given a narrow frame and long translated destination labels, when the compact label bubble opens or a link in the nav pill receives focus, the label remains readable, any visible focus indicator remains visible and the page does not scroll horizontally.

### User Story 4 — Skip directly to main content (P2)

A keyboard user can bypass repeated application chrome and continue navigating from the start of the content.

**Why this priority.** The application shell repeats navigation on every screen and may enclose content in a shadow root.

**Independent test.** Tab into the shell and activate a skip link, first with a same-root selector and then with a direct reference to content in another root.

1. The skip link becomes visible on keyboard focus and presents consumer-supplied localizable text. Activation puts focus on the target, and the next Tab continues in the content's natural focus order.
2. The direct reference takes precedence when both target forms are given. A missing, malformed, disconnected, hidden or non-focusable target leaves focus on the skip link. The user can continue with Tab.

### Edge Cases

- Thresholds use the shell's border-box inline size. Equality selects the wider tier at each boundary. For each bound independently, resolve a valid explicit consumer setting first, a valid consumer override of the corresponding threshold token second, and the published default last. An absent or invalid value allows the next source. If the resolved lower bound exceeds the upper bound after conversion to lengths, use the published defaults for both bounds. Equal bounds skip the collapsed tier.
- Empty optional navigation regions have no empty landmark or tab stop. If there is no navigation to open, the shell does not expose a drawer trigger.
- Skip-link selectors search the link's containing document or shadow root and use its first match. Consumers supply a direct reference when the target lives in another root.

## Requirements

### Functional Requirements

- **FR-001.** `ocelle-app-shell` MUST provide mission, project and personal layouts with the rail, sidebar and content regions described in Stories 1 and 2. Each layout MUST expose one main content destination and only the navigation for its active tier.
- **FR-002.** The shell MUST select expanded, collapsed and narrow tiers from consumer-configurable lower and upper thresholds measured against its own border-box inline size. It MUST follow the exclusive-bound and supported length conventions of [mission 009, FR-025](../009-workflow-layouts/spec.md#functional-requirements), with the precedence described in Edge Cases. The shell MUST publish configurable defaults of 45rem for entry into narrow and 68.75rem for entry into collapsed from expanded, equivalent to 720 px and 1100 px at a 16 px root font size. These are starting values drawn from the Desktop widths in consumer issue #499.
- **FR-003.** The shell MUST allow the host to opt the content region out of block-end and inline-end padding independently without requiring compensating margins. It MUST honor logical edges in both text directions.
- **FR-004.** The shell MUST provide narrow navigation through `ocelle-drawer`, including the personal context path. Opening, dismissing and crossing a tier boundary MUST follow the focus behavior in Stories 1 and 2.
- **FR-005.** `ocelle-top-bar` MUST provide the Ocelle brand mark, a supplied product name, an area for supplied actions and an optionally visible menu control. The menu control MUST have an accessible name, accurately report expansion and communicate activation to a host when used standalone. Its hit area MUST meet the Ocelle minimum target size on both axes, including at 320 px with a long product name and supplied actions.
- **FR-006.** `ocelle-nav-item` MUST offer a vertical destination link with icon, label, current state and compact presentation. The underlying link MUST retain its name and current state in both presentations. Compact mode MUST expose the dismissible label bubble in Story 3.
- **FR-007.** `ocelle-nav-pill` MUST offer a named inline Desktop V2 navigation group of ordered destination links with default, focused and current states. The current page MUST be identified on its link and remain perceivable in both themes and forced colors. An empty group MUST expose no landmark. Narrow modal navigation belongs to the app shell and calls to action belong to the host's top-bar actions.
- **FR-008.** `ocelle-breadcrumbs` MUST expose a named navigation landmark, an ordered trail and the current page. Ancestor links MUST remain operable during reflow. The first crumb MUST align with the title when both share an inline start.
- **FR-009.** `ocelle-skip-link` MUST be visible on keyboard focus and accept a direct element reference or selector with the precedence, scope and fallback in Story 4. It MUST move focus directly on successful activation.
- **FR-010.** All six elements MUST meet the repository's WCAG 2.2 AA, token-only, strict CSP and offline contracts. The top bar, rail and personal rail use dark chrome in both themes. The elements MUST support forced colors and reduced motion while retaining visible focus and usable contrast.
- **FR-011.** Every delivered variant and state MUST have light and dark stories with committed visual baselines, behavioral tests for each keyboard path and event payload, no serious or critical axe findings, and a complete public manifest entry. Tests MUST exercise the actual controls and accessibility tree and satisfy the constitution's test-first and mutation gates.

## Success Criteria

### Measurable Outcomes

- **SC-001.** All three shell layouts reach the expected region arrangement in every supported tier. For each threshold, a fixture tested immediately below, at and above the boundary selects the expected tier while its viewport stays fixed.
- **SC-002.** Keyboard checks cover both directions across both thresholds, including a resize with the drawer open. Checks assert the ordered focus target with focus initially on a destination, the menu trigger or the drawer close control, including when the destination is unavailable and when the resulting navigation is empty. A separate within-narrow resize asserts that the drawer remains open and retains focus.
- **SC-003.** At 320 px, representative mission, project and personal compositions fit without horizontal page scrolling. Users can operate the menu, drawer and navigation and reach the main content by keyboard.
- **SC-004.** Each destination primitive correctly announces its label and current state. Every supplied navigation destination remains reachable in the narrow drawer for its layout. Both supported skip-link target forms place focus at the expected target and the next Tab enters its content sequence.
- **SC-005.** All six elements pass the inherited story, visual baseline, accessibility, public-manifest and strict-CSP checklist.

## Assumptions

- Kitty Desktop and Kitty Dashboard are the first consumers. The Ocelle console can compose the same primitives later. Hosts supply routes, product text, actions and screen content.
- Desktop V2 uses a named inline group of destinations with a current-page link. The accepted input shows the group beside a separate call to action, and plan review confirmed that the shell owns narrow modal behavior. [Desktop V2 accepted input](https://github.com/spec-kitty/spec-kitty-design/blob/173774af635cf34aeb13ea03a3bdaa12c651557d/packages/styles/src/nav-pill/sk-nav-pill.html)
- The landed layout, overlay, icon, token and button packages supply the foundation. Use the [workflow layout threshold convention](../009-workflow-layouts/spec.md) and the inherited [per-element checklist](https://github.com/Ocelle-HQ/ocelle-components/issues/7).
- The consumer evidence describes [personal navigation](https://github.com/spec-kitty/spec-kitty-design/issues/450), [Desktop V2 primitives](https://github.com/spec-kitty/spec-kitty-design/issues/470), [top bar](https://github.com/spec-kitty/spec-kitty-design/issues/494), [shell layouts](https://github.com/spec-kitty/spec-kitty-design/issues/499), [nav item](https://github.com/spec-kitty/spec-kitty-design/issues/500), [skip link](https://github.com/spec-kitty/spec-kitty-design/issues/502), [flush edges](https://github.com/spec-kitty/spec-kitty-design/issues/512) and [breadcrumb alignment](https://github.com/spec-kitty/spec-kitty-design/issues/518).
