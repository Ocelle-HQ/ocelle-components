# Feature Specification: Split-pane settings dialog recipe

**Feature Branch**: `workflow/issue-88`

**Created**: 2026-11-28

**Status**: Draft

**Input**: Issue #88 and triage record 041.

## User Scenarios & Testing

### User Story 1 - Read and navigate settings in a stable dialog (Priority: P1)

A user opens settings, selects a category such as Appearance, and follows a section link to a detail panel. They can read longer content while keeping the dialog heading and Close action in view.

**Why this priority**: This demonstrates the core recipe and addresses the layout jump that makes settings harder to use.

**Independent Test**: Open the example, select a category and then a long section, and scroll the content while observing the dialog frame.

**Acceptance Scenarios**

1. **Given** the settings dialog is open, **When** a user selects a category label, **Then** the landing panel identifies the category and shows its section destinations.
2. **Given** a category landing panel, **When** a user follows a section destination, **Then** the detail panel shows its heading, sections and actions in a clear hierarchy and the current destination is identifiable.
3. **Given** short content, **When** the user opens longer content at the same viewport and text size, **Then** the dialog bounds and header position stay fixed and the content pane scrolls independently of the header and Close action.

### User Story 2 - Navigate and dismiss by keyboard across layouts (Priority: P2)

A keyboard user can choose a category or independently reveal its child destinations, navigate to a section, and dismiss the dialog. A user with a narrow viewport or enlarged text can reach the same destinations and actions.

**Why this priority**: The example needs to show a reusable interaction pattern that works across input and display preferences.

**Independent Test**: Open the recipe with a keyboard, use the disclosure and section destinations, then dismiss via Escape and again via Close. Repeat on the stacked layout and with enlarged text.

**Acceptance Scenarios**

1. **Given** a category with collapsed destinations, **When** a user activates its separately named disclosure control, **Then** the child navigation slides into view, the expanded state is announced, and the displayed panel stays in place.
2. **Given** reduced motion, **When** a user toggles the disclosure, **Then** the same state changes occur with no sliding animation.
3. **Given** the dialog is open, **When** a keyboard user changes category or section, **Then** focus moves to the new panel’s main heading. The next Tab reaches the first section destination on a category landing panel or the first panel action on a section detail panel. Tab and Shift+Tab keep focus within the modal. Escape or Close returns focus to the opener.
4. **Given** a narrow viewport, **When** the user opens the dialog, **Then** navigation and content stack in reading order, with no horizontal overflow and with Close reachable.

### Edge Cases

- Collapsing a category containing the current destination keeps that panel selected. If a focused child disappears, focus returns to the relevant disclosure control.
- Repeated navigation between long and short content keeps the destination heading available when the new panel opens.
- Enlarged text and long fictional labels wrap while keeping destinations and actions reachable.

## Requirements

### Functional Requirements

- **FR-001**: The executable Storybook recipe MUST compose the existing dialog, disclosure, navigation and scroller with the standard sheet, backdrop, buttons and spacing.
- **FR-002**: The dialog MUST keep its outer bounds and header position stable across short and long panels at fixed viewport and text size, with independent content scrolling and a reachable Close action.
- **FR-003**: Each category label MUST open a landing panel with clear, operable section destinations.
- **FR-004**: Each category MUST offer a separate, named disclosure control without a visible chevron, expose its expanded state programmatically, and honor reduced motion when changing visibility.
- **FR-005**: Landing and detail panels MUST have clear heading, section and action hierarchy, indicate the selected destination, and move focus to the destination panel’s main heading on category or section activation. The next Tab MUST reach the first section destination on a landing panel or the first panel action on a detail panel.
- **FR-006**: The modal MUST contain keyboard focus while open, dismiss via Escape or Close and restore focus to the opener.
- **FR-007**: The recipe MUST stack navigation and content at narrow widths with no horizontal overflow and keep controls reachable at 200% text.
- **FR-008**: Category labels and panel content MUST be host-supplied. The example MUST use fictional content and existing tokens, accessibility and strict-CSP conventions.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Switching between the short landing panel and long detail leaves dialog and header geometry unchanged at the same viewport, and Close remains reachable after the content pane scrolls.
- **SC-002**: Keyboard and pointer activation can independently navigate and toggle the child destinations. The browser keyboard test verifies current and expanded states. It checks the focused heading immediately after category activation and the first section destination after one Tab, then checks the focused heading immediately after section activation and the first panel action after one Tab. It also verifies focus containment and return after both dismissals.
- **SC-003**: The same controls remain identifiable and operable in light, dark and forced-colors modes. Disclosure remains operable with reduced motion.
- **SC-004**: At 320 CSS pixels and at 200% text where applicable, navigation, panel contents and Close are reachable without horizontal scrolling.

## Assumptions

- The recipe demonstrates integration for hosts such as the workflow editor and uses settings such as Appearance and Shortcuts.
- Host applications supply settings data, copy and actions. The story demonstrates the composition without persisting settings.
- Existing component contracts are the boundary of this recipe.
