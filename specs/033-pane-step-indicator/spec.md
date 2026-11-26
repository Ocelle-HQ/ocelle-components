# Feature Specification: Step indicator and pane action footer

**Feature Branch**: `033-pane-step-indicator`
**Created**: 2026-11-26
**Status**: Draft
**Input**: [Issue #87](https://github.com/Ocelle-HQ/ocelle-components/issues/87)

## User Scenarios & Testing

### User Story 1 - Read workflow progress (Priority: P1)

A person can see the order of a workflow, which step is current, and what they have completed. A keyboard user can move directly to the available actions.

**Independent Test**: Mount an indicator with Review, Choose, and Confirm. Set Choose current and Review completed, then update the host state while the page is open.

1. **Given** the three steps, **when** Choose is current, **then** the indicator shows a check for Review and position numbers for Choose and Confirm. Choose has the ochre treatment and a visible non-colour cue.
2. **Given** a screen reader reading the list, **when** it reaches Review and Choose, **then** Review has a completion text equivalent and Choose is exposed as the current step.
3. **Given** sequential keyboard navigation or a pointer gesture on a marker, **when** the user reaches the footer, **then** focus moves to the available actions and the step indicator makes no navigation or state changes.

### User Story 2 - Act from a pane footer (Priority: P1)

A person can understand the current step and operate the actions when the panes are side by side, at phone widths, or with enlarged text.

**Independent Test**: Open the fictional pane footer examples in Storybook and exercise their actual buttons at desktop, 1200 px, 320 px and at 200% text.

1. **Given** desktop panes at normal text size, **when** the footer is shown, **then** it is 72 px tall and aligns with the adjacent pane footer. The indicator is at the start and one token-spaced action group is at the end.
2. **Given** a primary-only, secondary-plus-primary or Back-plus-primary example, **when** the keyboard user tabs through actions, **then** each visible action has its proper name and the primary is last in reading and focus order.
3. **Given** a 1200 px wide viewport at normal text size, **when** the standard two actions are shown, **then** they fit on one line, the current step label remains visible, and other markers can use compact labels with their full accessible names.
4. **Given** a 320 px wide viewport or text enlarged to 200%, **when** more room is needed, **then** the footer grows in normal flow, controls wrap visibly with their focus indicators, and the example needs no horizontal scrolling.

### Edge Cases

- A host may supply no current step or update which steps are complete. The indicator displays the supplied state and exposes at most one current step.
- A completed step before the current step does not change the numbering of later steps.
- A long current label and longer action names may wrap when space is tight. In compact presentation the accessible step labels remain complete.
- Forced colours preserve the visual distinction between completion, current, and upcoming states through shape and text.

## Requirements

- **FR-001**: Render a reusable, ordered, non-interactive indicator with host-provided labels and state. Hosts own navigation, actions and action labels.
- **FR-002**: Display each upcoming and current step's ordinal position. Show a check and accessible completion equivalent for completed steps.
- **FR-003**: Mark the current step programmatically and distinguish the current marker with the existing ochre palette and a visible non-colour cue in light, dark and forced colours.
- **FR-004**: Preserve full accessible labels and leave markers out of the tab sequence. State updates reflect host input.
- **FR-005**: Document the 72 px desktop footer with the adjacent footer aligned, indicator at the start, and one token-spaced action group at the end. Use existing controls and show all three requested action combinations with primary last.
- **FR-006**: At 1200 px keep the current label visible, compact the other labels and fit the standard two actions on one line. At 320 px and with 200% text, keep the footer in normal flow and avoid horizontal scrolling, clipping or obscured focus.
- **FR-007**: Verify the indicator and real recipe with focused browser evidence for state, keyboard, responsive widths, enlarged text, colour modes and strict CSP. Provide Storybook examples using fictional workflow data and pinned light and dark baselines.
- **FR-008**: Document and publish the reusable indicator through the library's normal public entry points. Document the footer as a composition of the indicator and existing action and pane primitives.

### Key Entities

- **Step**: A host-supplied label, position in the supplied order and progress state.
- **Pane action group**: The host's primary action and, where present, a secondary or Back action.

## Success Criteria

- **SC-001**: The three-step fixture exposes one named current step and a completion equivalent while adding zero tab stops for markers.
- **SC-002**: All three action combinations place primary last in DOM and keyboard order. The standard two-button group fits on one line at 1200 px with the current label visible.
- **SC-003**: At 320 px and 200% text the fixture records no horizontal overflow. The action sequence remains focusable and fully visible.
- **SC-004**: Storybook and browser verification cover light, dark and forced colours with the repository's accessibility and strict CSP checks.

## Assumptions

- The 72 px target applies to a desktop example at normal text size. The examples grow when their content requires it.
- The host supplies step labels in display order. The library has no dependency on #7 or on the full Studio composition in #76.
